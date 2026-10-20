/**
 * Relative URL and subpath helpers configured via environment variables.
 * - Local dev (empty env): uses root relative paths (/api/..., /static/..., /socket.io)
 * - Nginx subpath (NEXT_PUBLIC_BASE_PATH=/test-web, NEXT_PUBLIC_API_URL=/test-api):
 *   uses relative subpaths (/test-api/api/..., /test-api/static/..., /test-api/socket.io)
 */

export function getBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH;
  if (!raw || raw === 'undefined') return '';
  const clean = raw.replace(/\/+$/, '').trim();
  if (!clean) return '';
  return clean.startsWith('/') ? clean : `/${clean}`;
}

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw || raw === 'undefined') return '';
  const clean = raw.replace(/\/+$/, '').trim();
  if (!clean) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  return clean.startsWith('/') ? clean : `/${clean}`;
}

/**
 * Formats API endpoint as a relative path (e.g. '/api/orders' or '/test-api/api/orders')
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
 * Formats static asset URL as a relative path (e.g. '/static/uuid.png' or '/test-api/static/uuid.png')
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
 * Formats WebSocket path as a relative path (e.g. '/socket.io' or '/test-api/socket.io')
 */
export function getWsPath(): string {
  if (process.env.NEXT_PUBLIC_WS_PATH && process.env.NEXT_PUBLIC_WS_PATH !== 'undefined') {
    return process.env.NEXT_PUBLIC_WS_PATH;
  }
  const apiBase = getApiBaseUrl();
  if (!apiBase) return '/socket.io';
  const urlPath = apiBase.startsWith('http')
    ? new URL(apiBase).pathname.replace(/\/+$/, '')
    : apiBase;
  return `${urlPath}/socket.io`;
}
