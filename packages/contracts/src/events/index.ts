export const WS_EVENTS = {
  SESSIONS_COUNT_UPDATED: 'sessions:count-updated',
  ORDER_CREATED: 'order:created',
  ORDER_DELETED: 'order:deleted',
  PRODUCT_CREATED: 'product:created',
  PRODUCT_DELETED: 'product:deleted',
} as const;

export interface ActiveSessionsPayload {
  activeCount: number;
  timestamp: string;
}

export interface OrderEventPayload {
  orderId: string;
  timestamp: string;
}

export interface ProductEventPayload {
  productId: string;
  orderId?: string;
  timestamp: string;
}
