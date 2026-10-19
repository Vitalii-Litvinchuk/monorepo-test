import {
  CurrencyCode,
  PriceCurrencyRole,
  ProductCondition,
  ProductOperationalStatus,
  UserRole,
} from '../enums';

export interface User {
  id: string;
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: string;
}

export interface ProductPrice {
  id: string;
  productId: string;
  value: number;
  currencyCode: CurrencyCode;
  currencyRole: PriceCurrencyRole;
}

export interface Product {
  id: string;
  serialNumber: number;
  condition: ProductCondition;
  operationalStatus: ProductOperationalStatus;
  photo: string;
  title: string;
  type: string;
  specification: string;
  guarantee: {
    start: string;
    end: string;
  };
  prices: ProductPrice[];
  orderId: string;
  groupId: string | null;
  groupTitle?: string | null;
  assignedUserId: string | null;
  assignedUserName?: string | null;
  orderTitle?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  products?: Product[];
  productsCount: number;
  totalPrices: Array<{
    value: number;
    currencyCode: CurrencyCode;
    currencyRole: PriceCurrencyRole;
  }>;
}

export interface Group {
  id: string;
  title: string;
  description: string;
  productsCount?: number;
}
