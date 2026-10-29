import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@dzencode/contracts';
import { getWsPath } from '../../utils/url';

let socket: Socket | null = null;

export function getSocketClient(): Socket {
  if (!socket && typeof window !== 'undefined') {
    const configuredWsUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
    const isLocalPage =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isConfiguredLocalhost =
      configuredWsUrl?.includes('localhost') || configuredWsUrl?.includes('127.0.0.1');

    // Use same-origin relative connection on hosted domains even if localhost was set in local env
    const socketUrl =
      configuredWsUrl && (isLocalPage || !isConfiguredLocalhost)
        ? configuredWsUrl
        : window.location.origin;
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
