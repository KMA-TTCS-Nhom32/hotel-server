import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PaymentGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track clients in specific order rooms
  private orderRooms: Map<string, Set<Socket>> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Socket) {
    console.log('Server initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('Client connected ' + client.id);
    const authHeader = client.handshake.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader;
        const decoded = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET'),
        });
        client.data = decoded;
      } catch (error) {
        console.log(error);

        client.emit('error', {
          message: 'Unauthorized',
        });
        // send error message to client
        client.disconnect();
      }
    } else {
      client.emit('error', {
        message: 'Unauthorized',
      });
      client.disconnect();
    }
  }

  @SubscribeMessage('joinOrderRoom')
  handleJoinOrderRoom(@MessageBody() orderId: string, @ConnectedSocket() client: Socket) {
    const roomId = `order_${orderId}`;

    // Add client to room
    client.join(roomId);

    // Track client in our map
    if (!this.orderRooms.has(roomId)) {
      this.orderRooms.set(roomId, new Set());
    }
    this.orderRooms.get(roomId).add(client);

    console.log(`Client ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage('leaveOrderRoom')
  handleLeaveOrderRoom(@MessageBody() orderId: string, @ConnectedSocket() client: Socket) {
    const roomId = `order_${orderId}`;

    // Remove client from room
    client.leave(roomId);

    // Remove from our tracking
    if (this.orderRooms.has(roomId)) {
      this.orderRooms.get(roomId).delete(client);
      if (this.orderRooms.get(roomId).size === 0) {
        this.orderRooms.delete(roomId);
      }
    }

    console.log(`Client ${client.id} left room ${roomId}`);
  }

  // Method to broadcast payment updates to room
  emitPaymentUpdate(orderId: string, paymentData: any) {
    const roomId = `order_${orderId}`;
    this.server.to(roomId).emit('paymentUpdated', paymentData);
    console.log(`Payment update emitted to room ${roomId}`, paymentData);
  }

  // Clean up when client disconnects
  handleDisconnect(client: Socket) {
    // Remove client from all order rooms
    this.orderRooms.forEach((clients, roomId) => {
      if (clients.has(client)) {
        clients.delete(client);
        if (clients.size === 0) {
          this.orderRooms.delete(roomId);
        }
      }
    });

    console.log('Client disconnected ' + client.id);
  }
}
