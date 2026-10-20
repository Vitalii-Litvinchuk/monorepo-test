import { getBasePath, getApiUrl, getStaticUrl, getWsPath, getApiBaseUrl } from './url';

describe('Relative Subpath & URL Helpers', () => {
  const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalWsPath = process.env.NEXT_PUBLIC_WS_PATH;

  afterEach(() => {
    if (originalBasePath !== undefined) {
      process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath;
    } else {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
    }

    if (originalApiUrl !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    } else {
      delete process.env.NEXT_PUBLIC_API_URL;
    }

    if (originalWsPath !== undefined) {
      process.env.NEXT_PUBLIC_WS_PATH = originalWsPath;
    } else {
      delete process.env.NEXT_PUBLIC_WS_PATH;
    }
  });

  describe('Local development (empty environment variables -> root relative paths)', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_WS_PATH;
    });

    it('should return empty string as base path', () => {
      expect(getBasePath()).toBe('');
    });

    it('should return empty string as API base URL', () => {
      expect(getApiBaseUrl()).toBe('');
    });

    it('should format API endpoints as relative /api/... paths', () => {
      expect(getApiUrl('/api/orders')).toBe('/api/orders');
      expect(getApiUrl('api/auth/google')).toBe('/api/auth/google');
    });

    it('should format static assets as relative /static/... paths', () => {
      expect(getStaticUrl('uuid-123.png')).toBe('/static/uuid-123.png');
      expect(getStaticUrl('/static/uuid-123.png')).toBe('/static/uuid-123.png');
    });

    it('should format WebSocket path as /socket.io', () => {
      expect(getWsPath()).toBe('/socket.io');
    });
  });

  describe('Nginx subpath deployment (/test-web & /test-api relative paths)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_BASE_PATH = '/test-web';
      process.env.NEXT_PUBLIC_API_URL = '/test-api';
      delete process.env.NEXT_PUBLIC_WS_PATH;
    });

    it('should return /test-web as configured base path', () => {
      expect(getBasePath()).toBe('/test-web');
    });

    it('should return /test-api as relative API base URL', () => {
      expect(getApiBaseUrl()).toBe('/test-api');
    });

    it('should format API endpoints as relative /test-api/api/... paths', () => {
      expect(getApiUrl('/api/orders')).toBe('/test-api/api/orders');
      expect(getApiUrl('api/auth/google')).toBe('/test-api/api/auth/google');
    });

    it('should format static assets as relative /test-api/static/... paths', () => {
      expect(getStaticUrl('uuid-123.png')).toBe('/test-api/static/uuid-123.png');
      expect(getStaticUrl('/static/uuid-123.png')).toBe('/test-api/static/uuid-123.png');
    });

    it('should format WebSocket path as relative /test-api/socket.io', () => {
      expect(getWsPath()).toBe('/test-api/socket.io');
    });
  });
});
