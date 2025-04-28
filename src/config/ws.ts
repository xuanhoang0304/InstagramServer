import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '@/utils/logger';

interface SocketData {
  [key: string]: any;
}
class WebSocketServer {
  private static instance: WebSocketServer | null = null;
  private io: Server | null = null;
  private constructor(server: HttpServer) {
    if (WebSocketServer.instance) {
      throw new Error('WebSocketServer đã được khởi tạo trước đó');
    }

    WebSocketServer.instance = this;
    server.listen(4000, () => {
      logger.info('Websocket opening port 4000');
    });
    this.io = new Server(server, {
      cors: {
        origin: 'http://localhost:3000',
      },
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
      socket.on('test', (data) => {
        console.log('data', data);
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
  public sendToRoom(room: string, event: string, data: SocketData): void {
    this.io?.to(room).emit(event, data);
  }
}
export default WebSocketServer;
