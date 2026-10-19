/**
 * Semantic replacement for "isNew: 1 | 0" in app.js
 * Asset physical condition
 */
export enum ProductCondition {
  NEW = 'NEW',                 // На UI: "новый"
  USED = 'USED',               // На UI: "Б / У"
  REFURBISHED = 'REFURBISHED', // На UI: "восстановленный"
}

/**
 * Semantic replacement for "isDefault: 0 | 1" in app.js price array
 * Accounting valuation tier / currency role
 */
export enum PriceCurrencyRole {
  PRIMARY_SETTLEMENT = 'PRIMARY_SETTLEMENT',   // Основна розрахункова валюта (UAH, більший шрифт знизу)
  VALUATION_REFERENCE = 'VALUATION_REFERENCE', // Валюта оцінки (USD, менший шрифт зверху)
}

/**
 * Visual indicator status (shown on all reference screenshots)
 */
export enum ProductOperationalStatus {
  AVAILABLE = 'AVAILABLE', // Зелена крапка (#cddc39) — "Свободен"
  IN_REPAIR = 'IN_REPAIR', // Темна крапка (#263238) — "В ремонте"
  ASSIGNED = 'ASSIGNED',   // Закріплений за групою / користувачем
}

/**
 * Supported currency codes (ISO 4217)
 */
export enum CurrencyCode {
  UAH = 'UAH',
  USD = 'USD',
  EUR = 'EUR',
}

/**
 * Role-Based Access Control for Google OAuth
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER', // Default role for new Google logins (full CRUD access)
  VIEWER = 'VIEWER',
}
