/**
 * URL and subpath helper for deployments with subpaths (e.g. https://path/test)
 */

export function getBasePath(): string {
  // 1. Build-time or runtime environment variable
  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    const envBase = process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/+$/, '');
    if (envBase) {
      return envBase.startsWith('/') ? envBase : `/${envBase}`;
    }
  }

  // 2. Browser runtime detection (e.g. pathname starts with /test)
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname === '/test' || pathname.startsWith('/test/')) {
      return '/test';
    }
  }

  return '';
}

/**
 * Formats API endpoints to always include base path when running under subpath
 * e.g. '/api/orders' -> '/test/api/orders' when base path is '/test'
 */
export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = getBasePath();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (base && (cleanPath === base || cleanPath.startsWith(`${base}/`))) {
    return cleanPath;
  }

  return `${base}${cleanPath}`;
}

/**
 * Formats static asset URLs (photos, avatars) to always include base path
 * e.g. '550e8400.png' or '/static/550e8400.png' -> '/test/static/550e8400.png'
 */
export function getStaticUrl(photoOrPath?: string | null): string {
  if (!photoOrPath) return '';
  if (photoOrPath.startsWith('http://') || photoOrPath.startsWith('https://')) {
    return photoOrPath;
  }

  const base = getBasePath();
  let clean = photoOrPath.trim();

  // If only a filename, prepend /static/
  if (!clean.startsWith('/')) {
    clean = `/static/${clean}`;
  }

  // If already prefixed with base, return as is
  if (base && (clean === base || clean.startsWith(`${base}/`))) {
    return clean;
  }

  return `${base}${clean}`;
}

/**
 * Formats WebSocket path for Socket.io (e.g. '/test/socket.io')
 */
export function getWsPath(): string {
  if (process.env.NEXT_PUBLIC_WS_PATH) {
    return process.env.NEXT_PUBLIC_WS_PATH;
  }
  const base = getBasePath();
  return `${base}/socket.io`;
}
