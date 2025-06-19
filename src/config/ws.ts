import * as cookie from 'cookie';
// server/WebSocketServer.ts
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';

import { CreateMessage } from '@/modules/chat/dtos/message.dtos';
import { GroupService } from '@/modules/chat/services/group.service';
import { MessageService } from '@/modules/chat/services/message.services';
import { logger } from '@/utils/logger';

import ConfignEnv from './env';

interface OnlineUsers {
  socketId: string;
  userId: string;
  groupsChat: string[];
  curRoom: string;
}
interface UserInRoom {
  userId: string;
  group: any;
  socketId: string;
  order: number;
}
interface UserRoom {
  roomId: string;
  users: UserInRoom[];
}
let onlineUsers: OnlineUsers[] = [];
let userRoom: UserRoom[] = [];
const userCalling: string[] = [];
const PORT = process.env.NODE_ENV === 'production' ? process.env.PORT || 3000 : 4000;
class WebSocketServer {
  private static instance: WebSocketServer | null = null;
  private io: Server | null = null;

  private constructor(server: HttpServer) {
    if (WebSocketServer.instance) {
      throw new Error('WebSocketServer đã được khởi tạo trước đó');
    }

    WebSocketServer.instance = this;

    server.listen(PORT, () => {
      logger.info(`Websocket opening port ${PORT}`);
    });
    this.io = new Server(server, {
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
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
        onlineUsers.push({ socketId: socket.id, userId, groupsChat, curRoom: '' });
      }
      socket.on('joinGroup', (data: { groupId: string; userId: string }) => {
        socket.join(data.groupId);
      });
      socket.on('createMessage', async (obj: { data: CreateMessage; curUserId: string }) => {
        const { data, curUserId } = obj;
        const newMessage = await MessageService.CreateMessage(data, curUserId);
        this.sendToRoom(data.groupId, 'newMessage', newMessage);
      });
      socket.on('calling', ({ user, group }) => {
        const freeUsers: string[] = group.members
          .filter((member: { _id: string }) => !userCalling.includes(member._id as string))
          .map((item: { _id: string }) => item._id);
        freeUsers.forEach((id) => {
          const socketId = onlineUsers.find((u) => u.userId === id)?.socketId;
          if (socketId) {
            this.io?.to(socketId).emit('calling', { user, group });
          }
        });
      });
      socket.on('join-room', (data: UserInRoom) => {
        userCalling.push(data.userId);
        const newOnl = onlineUsers.map((u) =>
          u.userId === data.userId ? { ...u, curRoom: data.group._id } : u,
        );
        onlineUsers = newOnl;
        const existedUser = userRoom.find((u) => u.roomId === data.group._id);
        if (existedUser) {
          const newData = { ...data, order: existedUser.users.length + 1 };
          const newUsers = existedUser.users.push(newData);
          userRoom.map((user) => (user.roomId === data.group._id ? newUsers : user));
          const result = userRoom.find((item) => item.roomId === data.group._id)?.users;
          if (result?.length) {
            this.sendToRoom(data.group._id, 'user-in-room', { result, group: data.group._id });
          }
          return;
        }
        const newUserRoom: UserRoom = {
          roomId: data.group._id,
          users: [{ ...data, order: 1 }],
        };
        userRoom.push(newUserRoom);
        const result = userRoom.find((item) => item.roomId === data.group._id)?.users;
        if (result?.length) {
          this.sendToRoom(data.group._id, 'user-in-room', { result, group: data.group._id });
        }
      });

      socket.on(
        'mediaStatusUpdate',
        (data: { uId: string; hasCamera: boolean; hasMic: boolean; groupId: string }) => {
          const { groupId, uId, hasCamera, hasMic } = data;
          this.sendToRoom(groupId, 'mediaStatusUpdate', { uId, hasCamera, hasMic });
        },
      );
      socket.on(
        'offer',
        (data: {
          groupId: string;
          signal: any;
          sender: string;
          receiver: string;
          other: boolean;
        }) => {
          const { receiver, signal, sender, other } = data;

          const socketReceiver = onlineUsers.find((u) => u.userId === receiver);
          if (socketReceiver && !userCalling.includes(socketReceiver.userId)) {
            socket.to(socketReceiver.socketId).emit('offer', { sender, signal, other });
          }
        },
      );
      socket.on(
        'answer',
        (data: { groupId: string; sender: string; signal: any; receiver: string }) => {
          const { sender, signal, receiver } = data;
          const socketReceiver = onlineUsers.find((u) => u.userId === receiver);
          if (socketReceiver) {
            socket.to(socketReceiver.socketId).emit('answer', { sender, signal });
          }
        },
      );
      socket.on('user-leave', (data: { groupId: string; uId: string }) => {
        const { groupId, uId } = data;
        userCalling.splice(userCalling.indexOf(uId), 1);
        const uInR = userRoom.find((u) => u.roomId === groupId)?.users;
        if (uInR) {
          const newUsers = uInR.filter((u) => u.userId !== uId);
          const newUInR = userRoom.map((item) =>
            item.roomId === groupId ? { ...item, users: newUsers } : item,
          );
          userRoom = newUInR;
          newUsers.forEach((u) => {
            const socketId = onlineUsers.find((user) => user.userId === u.userId)?.socketId;
            if (socketId) {
              socket.to(socketId).emit('user-in-room', { result: newUsers, group: groupId });
            }
          });
        }
      });
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        const userDisconnected = onlineUsers.find((u) => u.socketId === socket.id);
        if (userDisconnected) {
          onlineUsers.splice(onlineUsers.indexOf(userDisconnected), 1);
          userCalling.splice(userCalling.indexOf(userDisconnected.userId), 1);
          const userLeave = userRoom.find((u) => u.roomId === userDisconnected.curRoom);
          if (userLeave) {
            const userInRoom = userLeave.users.filter((u) => u.userId !== userDisconnected.userId);
            userRoom = userRoom.map((u) =>
              u.roomId === userDisconnected.curRoom ? { ...u, users: userInRoom } : u,
            );
            this.sendToRoom(userLeave.roomId, 'user-in-room', {
              result: userInRoom,
              group: userLeave.roomId,
            });
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
