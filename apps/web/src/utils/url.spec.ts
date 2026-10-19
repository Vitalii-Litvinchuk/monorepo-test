import { getBasePath, getApiUrl, getStaticUrl, getWsPath } from './url';

describe('Subpath & URL Helpers (https://path/test)', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BASE_PATH;

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_PATH = originalEnv;
  });

  describe('When NEXT_PUBLIC_BASE_PATH is /test', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_BASE_PATH = '/test';
    });

    it('should return /test as base path', () => {
      expect(getBasePath()).toBe('/test');
    });

    it('should prefix API endpoints with /test', () => {
      expect(getApiUrl('/api/orders')).toBe('/test/api/orders');
      expect(getApiUrl('api/auth/google')).toBe('/test/api/auth/google');
    });

    it('should prefix static assets with /test/static/', () => {
      expect(getStaticUrl('uuid-123.png')).toBe('/test/static/uuid-123.png');
      expect(getStaticUrl('/static/uuid-123.png')).toBe('/test/static/uuid-123.png');
    });

    it('should not duplicate /test if already present', () => {
      expect(getApiUrl('/test/api/orders')).toBe('/test/api/orders');
      expect(getStaticUrl('/test/static/uuid-123.png')).toBe('/test/static/uuid-123.png');
    });

    it('should format WebSocket path as /test/socket.io', () => {
      expect(getWsPath()).toBe('/test/socket.io');
    });

    it('should pass through external full URLs unchanged', () => {
      expect(getStaticUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
      expect(getApiUrl('https://external-api.com/v1')).toBe('https://external-api.com/v1');
    });
  });

  describe('When NEXT_PUBLIC_BASE_PATH is empty (default root)', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
    });

    it('should return empty string as base path', () => {
      expect(getBasePath()).toBe('');
    });

    it('should return standard /api/ paths', () => {
      expect(getApiUrl('/api/orders')).toBe('/api/orders');
    });

    it('should return standard /static/ paths', () => {
      expect(getStaticUrl('uuid-123.png')).toBe('/static/uuid-123.png');
      expect(getStaticUrl('/static/uuid-123.png')).toBe('/static/uuid-123.png');
    });

    it('should return /socket.io for WebSocket path', () => {
      expect(getWsPath()).toBe('/socket.io');
    });
  });

  describe('Browser runtime detection (window.location.pathname)', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
    });

    it('should detect /test from window.location.pathname', () => {
      window.history.pushState({}, 'Test', '/test/orders');
      expect(getBasePath()).toBe('/test');
      expect(getApiUrl('/api/products')).toBe('/test/api/products');
      expect(getStaticUrl('image-uuid.png')).toBe('/test/static/image-uuid.png');
      expect(getWsPath()).toBe('/test/socket.io');
    });

    it('should detect /test exact pathname', () => {
      window.history.pushState({}, 'Test', '/test');
      expect(getBasePath()).toBe('/test');
    });

    it('should not detect subpath if on root', () => {
      window.history.pushState({}, 'Test', '/orders');
      expect(getBasePath()).toBe('');
      expect(getApiUrl('/api/products')).toBe('/api/products');
    });
  });
});
