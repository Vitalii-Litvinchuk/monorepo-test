import { getBasePath, getApiUrl, getStaticUrl, getWsPath, getApiBaseUrl } from './url';

describe('Subpath & URL Helpers from Environment Settings', () => {
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

  describe('Explicit environment variables (/test-web & /test-api)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_BASE_PATH = '/test-web';
      process.env.NEXT_PUBLIC_API_URL = 'https://server.lab.mooo.com/test-api';
      process.env.NEXT_PUBLIC_WS_PATH = '/test-api/socket.io';
    });

    it('should return /test-web as configured base path', () => {
      expect(getBasePath()).toBe('/test-web');
    });

    it('should return configured API base URL', () => {
      expect(getApiBaseUrl()).toBe('https://server.lab.mooo.com/test-api');
    });

    it('should format API endpoints with configured API URL', () => {
      expect(getApiUrl('/api/orders')).toBe('https://server.lab.mooo.com/test-api/api/orders');
      expect(getApiUrl('api/auth/google')).toBe('https://server.lab.mooo.com/test-api/api/auth/google');
    });

    it('should format static assets with configured API URL', () => {
      expect(getStaticUrl('uuid-123.png')).toBe('https://server.lab.mooo.com/test-api/static/uuid-123.png');
      expect(getStaticUrl('/static/uuid-123.png')).toBe('https://server.lab.mooo.com/test-api/static/uuid-123.png');
    });

    it('should format WebSocket path from environment', () => {
      expect(getWsPath()).toBe('/test-api/socket.io');
    });
  });

  describe('Default non-root settings (/test-web & /test-api)', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_WS_PATH;
    });

    it('should default base path to /test-web', () => {
      expect(getBasePath()).toBe('/test-web');
    });

    it('should default API URL to /test-api', () => {
      expect(getApiBaseUrl()).toBe('/test-api');
    });

    it('should format API endpoints to /test-api/api/...', () => {
      expect(getApiUrl('/api/products')).toBe('/test-api/api/products');
    });

    it('should format static assets to /test-api/static/...', () => {
      expect(getStaticUrl('avatar.jpg')).toBe('/test-api/static/avatar.jpg');
    });

    it('should format WebSocket path to /test-api/socket.io', () => {
      expect(getWsPath()).toBe('/test-api/socket.io');
    });
  });

  describe('Custom environment override (e.g. staging or different subpath)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_BASE_PATH = '/custom-web';
      process.env.NEXT_PUBLIC_API_URL = '/custom-api';
      delete process.env.NEXT_PUBLIC_WS_PATH;
    });

    it('should use customized settings directly', () => {
      expect(getBasePath()).toBe('/custom-web');
      expect(getApiBaseUrl()).toBe('/custom-api');
      expect(getApiUrl('/api/orders')).toBe('/custom-api/api/orders');
      expect(getStaticUrl('photo.png')).toBe('/custom-api/static/photo.png');
      expect(getWsPath()).toBe('/custom-api/socket.io');
    });
  });
});
