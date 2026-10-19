import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@dzencode/contracts';
import { getWsPath } from '../../utils/url';

let socket: Socket | null = null;

export function getSocketClient(): Socket {
  if (!socket && typeof window !== 'undefined') {
    // If NEXT_PUBLIC_WS_URL is set, use it; otherwise connect to same origin
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
    const wsPath = getWsPath();

    socket = io(socketUrl, {
      path: wsPath,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket!;
}

export { WS_EVENTS };
