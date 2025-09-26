// server/WebSocketServer.ts
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import uniq from 'lodash/uniq';
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

export const onlineUsers = new Map<string, OnlineUsers>();
const callingUsers = new Map<string, string>();
const onlineUsersInGroup = new Map<string, string[] | []>();
const lastOnlineUsers = new Map<string, string>();
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
      const token = socket.handshake.auth.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, ConfignEnv.JWT_SECRET) as { id: string };
          socket.handshake.auth.userId = decoded.id;
        } catch (err) {
          socket.handshake.auth.userId = '';
        }
      }
      next();
    });
    this.io.on('connection', async (socket: Socket) => {
      const userId = socket.handshake.auth.userId || '';
      logger.info(`Client connected: ${socket.id} with userId ${userId}`);
      if (userId) {
        const groups = await GroupService.getGroups({ userId });
        const groupsChat = groups.result.map((group) => String(group._id));
        onlineUsers.set(userId, { socketId: socket.id, userId, groupsChat, curRoom: '' });
        if (groupsChat.length) {
          groupsChat.forEach(async (group) => {
            await socket.join(group);
            const oldMems = onlineUsersInGroup.get(group);
            if (oldMems) {
              onlineUsersInGroup.set(group, uniq([...oldMems, userId]));
              const list = onlineUsersInGroup.get(group);
              this.sendToRoom(group, 'user-online-in-group', { groupId: group, list });
              return;
            }
            onlineUsersInGroup.set(group, [userId]);
            this.sendToRoom(group, 'user-online-in-group', { groupId: group, list: [userId] });
          });
        }
      }

      // Chat
      socket.on('join-room-chat', (roomId: string) => {
        socket.join(roomId);
      });
      socket.on('user-online-in-group', (groupId: string) => {
        const list = onlineUsersInGroup.get(groupId);
        this.sendToRoom(groupId, 'user-online-in-group', { groupId, list });
      });
      socket.on('last-online-user', (data: { userId: string; groupId: string }) => {
        const lastOnline = lastOnlineUsers.get(data.userId);
        if (lastOnline) {
          this.sendToRoom(data.groupId, 'last-online-user', {
            userId: data.userId,
            lastTime: lastOnline,
          });
        }
      });
      socket.on('leave-room-chat', (roomId: string | null) => {
        if (!roomId) return;
        socket.leave(roomId);
      });
      socket.on('createMessage', async (obj: { data: CreateMessage; curUserId: string }) => {
        const { data, curUserId } = obj;
        const newMessage = await MessageService.createMessage(data, curUserId);
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
          const message = await MessageService.deleteMessage(data.messageId, data.curUserId);
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

      socket.on('disconnect', async () => {
        logger.info(`Client disconnected: ${socket.id}-Uid: ${socket.handshake.auth.userId}`);
        const now = new Date().toISOString();
        const uId = socket.handshake.auth.userId;
        lastOnlineUsers.set(String(uId), now);
        onlineUsers.delete(uId);
        callingUsers.delete(String(uId));
        const groups = await GroupService.getGroups({ userId });
        const groupsChat = groups.result.map((group) => String(group._id));
        groupsChat.forEach((groupChat) => {
          const oldList = onlineUsersInGroup.get(groupChat);
          if (oldList) {
            const list = oldList.filter((id) => id !== uId);
            onlineUsersInGroup.set(groupChat, list);
            this.sendToRoom(groupChat, 'user-online-in-group', { groupId: groupChat, list });
          }
        });
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
  public sendBroadcast(event: string, data: any): void {
    this.io?.emit(event, data);
  }
  public sendToSocket(socketId: string, event: string, data: any): void {
    this.io?.to(socketId).emit(event, data);
  }
}

export default WebSocketServer;
