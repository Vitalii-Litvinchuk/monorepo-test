import {
  CurrencyCode,
  PriceCurrencyRole,
  ProductCondition,
  ProductOperationalStatus,
  UserRole,
} from '../enums';
import { User } from '../models';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors: Record<string, string[]>;
}

export interface CreateProductPriceDto {
  value: number;
  currencyCode: CurrencyCode;
  currencyRole: PriceCurrencyRole;
}

export interface CreateProductDto {
  serialNumber: number;
  condition: ProductCondition;
  operationalStatus?: ProductOperationalStatus;
  photo?: string;
  title: string;
  type: string;
  specification: string;
  guaranteeStart: string;
  guaranteeEnd: string;
  prices: CreateProductPriceDto[];
  orderId: string;
  groupId?: string | null;
  assignedUserId?: string | null;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface CreateOrderDto {
  title: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateOrderDto extends Partial<CreateOrderDto> {}

export interface CreateGroupDto {
  title: string;
  description?: string;
}

export interface UpdateGroupDto extends Partial<CreateGroupDto> {}

export interface ProductFilterQuery {
  type?: string;
  specification?: string;
  condition?: ProductCondition;
  operationalStatus?: ProductOperationalStatus;
  orderId?: string;
  search?: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: User;
}

export interface UserTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl: string;
}
