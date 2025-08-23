import * as cookie from 'cookie';
// server/WebSocketServer.ts
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { IUser } from '~/modules/account/user/model/user.model';
import { CreateMessage } from '~/modules/chat/dtos/message.dtos';
import { IGroupChat } from '~/modules/chat/model/group.chat.model';
import { GroupService } from '~/modules/chat/services/group.service';
import { MessageService } from '~/modules/chat/services/message.services';
import { logger } from '~/utils/logger';

import ConfignEnv from './env';

interface OnlineUsers {
  socketId: string;
  userId: string;
  groupsChat: string[];
  curRoom: string;
}
interface IGroupChatSocket extends Omit<IGroupChat, 'members'> {
  members: Pick<IUser, '_id' | 'name' | 'avatar'>[];
}
interface IUsersInRoom {
  user: IUser;
  groupId: string;
  order: number;
}

const onlineUsers = new Map<string, OnlineUsers>();
const callingUsers = new Map<string, string>();

class WebSocketServer {
  private static instance: WebSocketServer | null = null;
  private io: Server | null = null;

  private constructor(server: HttpServer) {
    if (WebSocketServer.instance) {
      throw new Error('WebSocketServer đã được khởi tạo trước đó');
    }

    WebSocketServer.instance = this;

    this.io = new Server(server, {
      cors: {
        origin:
          process.env.NODE_ENV === 'production' ? ConfignEnv.FRONTEND_URL : 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Authorization', 'Content-Type'],
      },
      transports: ['websocket'],
    });
    this.io.use((socket, next) => {
      const cookieHeader = socket.handshake.headers.cookie;

      let refreshToken = null;

      if (cookieHeader) {
        const cookies = cookie.parse(cookieHeader);
        refreshToken = cookies.refreshToken;
      }

      if (refreshToken) {
        try {
          const decoded = jwt.verify(refreshToken, ConfignEnv.JWT_SECRET) as { id: string };
          socket.handshake.auth.userId = decoded.id || '';

          next();
        } catch (error: any) {
          logger.error('Invalid token:', error.message);
          socket.handshake.auth.userId = '';
          next();
        }
      } else {
        socket.handshake.auth.userId = socket.handshake.auth.userId || '';
        next();
      }
    });
    this.io.on('connection', async (socket: Socket) => {
      const userId = socket.handshake.auth.userId || '';
      logger.info(`Client connected: ${socket.id} with userId ${userId}`);
      if (userId) {
        const groups = await GroupService.getGroups({ userId });
        const groupsChat = groups.result.map((group) => String(group._id));
        if (groupsChat.length) {
          groupsChat.forEach((group) => {
            socket.join(group);
          });
        }
        onlineUsers.set(userId, { socketId: socket.id, userId, groupsChat, curRoom: '' });
      }

      // Chat
      socket.on('join-room-chat', (roomId: string) => {
        socket.join(roomId);
      });
      socket.on('leave-room-chat', (roomId: string | null) => {
        if (!roomId) return;
        socket.leave(roomId);
      });
      socket.on('createMessage', async (obj: { data: CreateMessage; curUserId: string }) => {
        const { data, curUserId } = obj;
        const newMessage = await MessageService.CreateMessage(data, curUserId);
        this.sendToRoom(data.groupId, 'newMessage', newMessage);
      });
      socket.on(
        'delete-message',
        async (data: {
          messageId: string;
          curUserId: string;
          groupId: string;
          lastMessage: string | null;
          isFristMessage: boolean;
        }) => {
          const message = await MessageService.DeleteMessage(data.messageId, data.curUserId);
          if (message?._id) {
            this.sendToRoom(data.groupId, 'delete-message', {
              code: 204,
              message,
            });
            if (data.lastMessage) {
              await GroupService.updateGroup(
                data.groupId,
                { lastMessage: data.lastMessage },
                data.curUserId,
              );
            }
            if (data.isFristMessage) {
              await GroupService.updateGroup(data.groupId, { lastMessage: null }, data.curUserId);
            }
          }
        },
      );
      socket.on('init-call', (data: { sender: IUser; group: IGroupChatSocket }) => {
        const { sender, group } = data;
        if (
          !group.isGroup &&
          group.members.some((member) => callingUsers.get(String(member._id)))
        ) {
          return;
        }
        const membersOnline = group.members.filter((member) => onlineUsers.get(String(member._id)));

        membersOnline.forEach((member) => {
          callingUsers.set(String(member._id), String(group._id));
          const socketId = onlineUsers.get(String(member._id))?.socketId;
          if (socketId) {
            this.io?.to(socketId).emit('init-call', { sender, group, membersOnline });
          }
        });
      });
      socket.on('user-deny', (data: { userId: string; isGroup: boolean; initCaller: string }) => {
        const { userId: uId, isGroup, initCaller } = data;
        if (isGroup === false) {
          callingUsers.delete(uId);
          callingUsers.delete(initCaller);
        } else {
          callingUsers.delete(uId);
        }
        const initCallerSocketId = onlineUsers.get(String(initCaller))?.socketId;
        if (initCallerSocketId) {
          this.io?.to(initCallerSocketId).emit('user-deny', uId);
        }
      });
      socket.on(
        'user-leave-call',
        (data: {
          groupId: string;
          isGroup: boolean;
          list: IUsersInRoom[];
          initUser: string;
          userLeave: string;
        }) => {
          const { groupId, isGroup, list, initUser, userLeave } = data;
          if (isGroup === false) {
            callingUsers.delete(userLeave);
            callingUsers.delete(initUser);
          } else {
            callingUsers.delete(userLeave);
          }
          list.forEach((u) => {
            const socketId = onlineUsers.get(String(u.user._id))?.socketId;
            if (socketId) {
              this.io?.to(socketId).emit('user-join-call', list);
            }
          });
        },
      );
      socket.on('delete-calling', (uId: string) => {
        callingUsers.delete(uId);
      });
      socket.on('user-join-call', (data: { groupId: string; list: IUsersInRoom[] }) => {
        const { groupId, list } = data;
        this.sendToRoom(groupId, 'user-join-call', list);
      });
      socket.on('end-call', (groupId: string) => {
        this.sendToRoom(groupId, 'end-call', undefined);
      });
      socket.on('signal', (data: { sender: string; receiver: string; signal: any }) => {
        const socketReceiver = onlineUsers.get(String(data.receiver))?.socketId;
        if (socketReceiver) {
          this.io?.to(socketReceiver).emit('signal', data);
        }
      });
      socket.on('user-change-mic', (data: { groupId: string; uId: string; allowMic: boolean }) => {
        this.sendToRoom(data.groupId, 'user-change-mic', data);
      });
      socket.on(
        'user-change-cam',
        (data: { groupId: string; uId: string; allowCamera: boolean }) => {
          this.sendToRoom(data.groupId, 'user-change-cam', data);
        },
      );
      socket.on('error-leave', (data: { groupId: string; uId: string }) => {
        this.sendToRoom(data.groupId, 'error-leave', data);
      });
      // socket.on('calling', ({ user, group }) => {
      //   const freeUsers: string[] = group.members
      //     .filter((member: { _id: string }) => !userCalling.includes(member._id as string))
      //     .map((item: { _id: string }) => item._id);
      //   console.log('freeUsers', freeUsers);
      //   freeUsers.forEach((id) => {
      //     const socketId = onlineUsers.find((u) => u.userId === id)?.socketId;
      //     if (socketId) {
      //       this.io?.to(socketId).emit('calling', { user, group });
      //     }
      //   });
      // });
      // socket.on('join-room', (data: UserInRoom) => {
      //   userCalling.push(data.userId);
      //   const newOnl = onlineUsers.map((u) =>
      //     u.userId === data.userId ? { ...u, curRoom: data.group._id } : u,
      //   );
      //   onlineUsers = newOnl;
      //   const existedUser = userRoom.find((u) => u.roomId === data.group._id);
      //   if (existedUser) {
      //     const newData = { ...data, order: existedUser.users.length + 1 };
      //     const newUsers = existedUser.users.push(newData);
      //     userRoom.map((user) => (user.roomId === data.group._id ? newUsers : user));
      //     const result = userRoom.find((item) => item.roomId === data.group._id)?.users;
      //     if (result?.length) {
      //       this.sendToRoom(data.group._id, 'user-in-room', { result, group: data.group._id });
      //     }
      //     return;
      //   }
      //   const newUserRoom: UserRoom = {
      //     roomId: data.group._id,
      //     users: [{ ...data, order: 1 }],
      //   };
      //   userRoom.push(newUserRoom);
      //   const result = userRoom.find((item) => item.roomId === data.group._id)?.users;
      //   if (result?.length) {
      //     this.sendToRoom(data.group._id, 'user-in-room', { result, group: data.group._id });
      //   }
      // });
      // socket.on(
      //   'mediaStatusUpdate',
      //   (data: { uId: string; hasCamera: boolean; hasMic: boolean; groupId: string }) => {
      //     const { groupId, uId, hasCamera, hasMic } = data;
      //     this.sendToRoom(groupId, 'mediaStatusUpdate', { uId, hasCamera, hasMic });
      //   },
      // );
      // socket.on(
      //   'offer',
      //   (data: {
      //     groupId: string;
      //     signal: any;
      //     sender: string;
      //     receiver: string;
      //     other: boolean;
      //   }) => {
      //     const { receiver, signal, sender, other } = data;

      //     const socketReceiver = onlineUsers.find((u) => u.userId === receiver);
      //     if (socketReceiver && !userCalling.includes(socketReceiver.userId)) {
      //       socket.to(socketReceiver.socketId).emit('offer', { sender, signal, other });
      //     }
      //   },
      // );
      // socket.on(
      //   'answer',
      //   (data: { groupId: string; sender: string; signal: any; receiver: string }) => {
      //     const { sender, signal, receiver } = data;
      //     const socketReceiver = onlineUsers.find((u) => u.userId === receiver);
      //     if (socketReceiver) {
      //       socket.to(socketReceiver.socketId).emit('answer', { sender, signal });
      //     }
      //   },
      // );
      // socket.on('user-leave', (data: { groupId: string; uId: string }) => {
      //   userCalling.splice(userCalling.indexOf(data.uId), 1);
      //   const newUserRoom = userRoom.map((item) =>
      //     item.roomId === data.groupId
      //       ? { ...item, users: item.users.filter((u) => u.userId !== data.uId) }
      //       : item,
      //   );
      //   userRoom = newUserRoom;

      //   const userInRoom = userRoom.find((i) => i.roomId === data.groupId)?.users;
      //   this.sendToRoom(data.groupId, 'user-in-room', { result: userInRoom, group: data.groupId });
      //   this.sendToRoom(data.groupId, 'user-leave', data);
      // });
      // socket.on('disconnect', () => {
      //   logger.info(`Client disconnected: ${socket.id}`);
      //   const userDisconnected = onlineUsers.find((u) => u.socketId === socket.id);
      //   if (userDisconnected) {
      //     onlineUsers.splice(onlineUsers.indexOf(userDisconnected), 1);
      //     userCalling.splice(userCalling.indexOf(userDisconnected.userId), 1);
      //     const userLeave = userRoom.find((u) => u.roomId === userDisconnected.curRoom);
      //     if (userLeave) {
      //       const userInRoom = userLeave.users.filter((u) => u.userId !== userDisconnected.userId);
      //       userRoom = userRoom.map((u) =>
      //         u.roomId === userDisconnected.curRoom ? { ...u, users: userInRoom } : u,
      //       );
      //       this.sendToRoom(userLeave.roomId, 'user-in-room', {
      //         result: userInRoom,
      //         group: userLeave.roomId,
      //       });
      //       this.sendToRoom(userLeave.roomId, 'user-leave', {
      //         groupId: userLeave.roomId,
      //         uId: userDisconnected.userId,
      //       });
      //     }
      //   }
      // });
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        for (const [uId, userInfo] of onlineUsers) {
          if (userInfo.socketId === socket.id) {
            onlineUsers.delete(uId);
            const isCalling = callingUsers.get(uId);
            if (isCalling) {
              callingUsers.delete(String(uId));
            }
            break;
          }
        }
      });
    });
  }

  public static getInstance(server?: HttpServer): WebSocketServer {
    if (!WebSocketServer.instance && server) {
      WebSocketServer.instance = new WebSocketServer(server);
    }
    if (!WebSocketServer.instance) {
      throw new Error('WebSocket is not initialized');
    }
    return WebSocketServer.instance;
  }

  public sendToRoom(room: string, event: string, data: any): void {
    this.io?.to(room).emit(event, data);
  }
}

export default WebSocketServer;
