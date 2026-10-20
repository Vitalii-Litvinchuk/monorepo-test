import {
  AuthResponseDto,
  CreateGroupDto,
  UpdateGroupDto,
  CreateOrderDto,
  UpdateOrderDto,
  CreateProductDto,
  UpdateProductDto,
  Group,
  Order,
  ProblemDetails,
  Product,
  ProductFilterQuery,
  User,
} from '@dzencode/contracts';
import { getApiUrl } from '../../utils/url';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : typeof window !== 'undefined'
        ? getApiUrl(endpoint)
        : `${process.env.API_INTERNAL_URL || 'http://localhost:4000'}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/')) {
        try {
          const authRes = await this.demoLogin();
          headers['Authorization'] = `Bearer ${authRes.accessToken}`;
          const retryRes = await fetch(url, { ...options, headers });
          if (retryRes.ok) {
            return retryRes.json();
          }
        } catch {
          // Fall through to standard error parsing
        }
      }

      let errorData: ProblemDetails;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          type: 'about:blank',
          title: response.statusText,
          status: response.status,
          errors: { general: [response.statusText] },
        };
      }
      throw errorData;
    }

    return response.json();
  }

  // Auth
  async demoLogin(email?: string): Promise<AuthResponseDto> {
    const res = await this.request<AuthResponseDto>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', res.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    }
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/orders');
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`);
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    return this.request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async deleteOrder(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/api/orders/${id}`, {
      method: 'DELETE',
    });
  }

  async updateOrder(id: string, dto: UpdateOrderDto): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  // Products
  async getProducts(filter?: ProductFilterQuery): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filter?.type && filter.type !== 'all') params.append('type', filter.type);
    if (filter?.specification && filter.specification !== 'all')
      params.append('specification', filter.specification);
    if (filter?.condition) params.append('condition', filter.condition);
    if (filter?.operationalStatus) params.append('operationalStatus', filter.operationalStatus);
    if (filter?.orderId) params.append('orderId', filter.orderId);
    if (filter?.search) params.append('search', filter.search);

    const qs = params.toString();
    return this.request<Product[]>(`/api/products${qs ? `?${qs}` : ''}`);
  }

  async getProductTypes(): Promise<string[]> {
    return this.request<string[]>('/api/products/types');
  }

  async createProductType(type: string): Promise<string[]> {
    return this.request<string[]>('/api/products/types', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async getProductSpecifications(): Promise<string[]> {
    return this.request<string[]>('/api/products/specifications');
  }

  async createProductSpecification(specification: string): Promise<string[]> {
    return this.request<string[]>('/api/products/specifications', {
      method: 'POST',
      body: JSON.stringify({ specification }),
    });
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    return this.request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    return this.request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteProduct(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Groups & Users
  async getGroups(): Promise<Group[]> {
    return this.request<Group[]>('/api/groups');
  }

  async createGroup(dto: CreateGroupDto): Promise<Group> {
    return this.request<Group>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateGroup(id: string, dto: UpdateGroupDto): Promise<Group> {
    return this.request<Group>(`/api/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteGroup(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/api/groups/${id}`, {
      method: 'DELETE',
    });
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users');
  }

  // Upload image
  async uploadImage(file: File): Promise<{ filename: string; url: string }> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const uploadUrl = typeof window !== 'undefined'
      ? getApiUrl('/api/uploads/image')
      : `${process.env.API_INTERNAL_URL || 'http://localhost:4000'}/api/uploads/image`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) throw new Error('Failed to upload image');
    return res.json();
  }
}

export const apiClient = new ApiClient();
