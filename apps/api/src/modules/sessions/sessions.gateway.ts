import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WS_EVENTS } from '@dzencode/contracts';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SessionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private activeConnections = new Set<string>();

  handleConnection(client: Socket) {
    this.activeConnections.add(client.id);
    this.broadcastActiveSessions();
  }

  handleDisconnect(client: Socket) {
    this.activeConnections.delete(client.id);
    this.broadcastActiveSessions();
  }

  public getActiveCount(): number {
    return this.activeConnections.size;
  }

  public broadcastActiveSessions() {
    const payload = {
      activeCount: this.activeConnections.size,
      timestamp: new Date().toISOString(),
    };
    if (this.server) {
      this.server.emit(WS_EVENTS.SESSIONS_COUNT_UPDATED, payload);
    }
  }

  public broadcastEvent(event: string, data: any) {
    if (this.server) {
      this.server.emit(event, data);
    }
  }
}
