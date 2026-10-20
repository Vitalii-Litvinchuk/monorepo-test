/**
 * URL and subpath helper configured directly via environment settings.
 * Fixed non-root subpaths configured via NEXT_PUBLIC_BASE_PATH and NEXT_PUBLIC_API_URL.
 */

export function getBasePath(): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '/test-web';
  return base.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '/test-api';
  return apiBase.replace(/\/+$/, '');
}

/**
 * Formats API endpoints to prepend configured API base path
 * e.g. '/api/orders' -> '/test-api/api/orders'
 */
export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const apiBase = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (apiBase && (cleanPath === apiBase || cleanPath.startsWith(`${apiBase}/`))) {
    return cleanPath;
  }

  return `${apiBase}${cleanPath}`;
}

/**
 * Formats static asset URLs to point to configured backend static server
 * e.g. 'uuid-123.png' -> '/test-api/static/uuid-123.png'
 */
export function getStaticUrl(photoOrPath?: string | null): string {
  if (!photoOrPath) return '';
  if (photoOrPath.startsWith('http://') || photoOrPath.startsWith('https://')) {
    return photoOrPath;
  }

  let clean = photoOrPath.trim();
  if (!clean.startsWith('/')) {
    clean = `/static/${clean}`;
  }

  const apiBase = getApiBaseUrl();
  if (apiBase && (clean === apiBase || clean.startsWith(`${apiBase}/`))) {
    return clean;
  }

  return `${apiBase}${clean}`;
}

/**
 * Formats WebSocket path for Socket.io from environment settings
 * e.g. '/test-api/socket.io'
 */
export function getWsPath(): string {
  if (process.env.NEXT_PUBLIC_WS_PATH && process.env.NEXT_PUBLIC_WS_PATH !== 'undefined') {
    return process.env.NEXT_PUBLIC_WS_PATH;
  }
  const apiBase = getApiBaseUrl();
  const urlPath = apiBase.startsWith('http')
    ? new URL(apiBase).pathname.replace(/\/+$/, '')
    : apiBase;
  return `${urlPath}/socket.io`;
}
