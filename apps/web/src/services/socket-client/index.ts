import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@dzencode/contracts';

let socket: Socket | null = null;

export function getSocketClient(): Socket {
  if (!socket && typeof window !== 'undefined') {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket!;
}

export { WS_EVENTS };
