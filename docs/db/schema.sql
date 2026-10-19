-- =====================================================================
-- Inventory Orders & Products Database Schema
-- Compatible with MySQL Workbench (8.0+) and SQLite
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    google_id VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'MANAGER', -- ADMIN | MANAGER | VIEWER
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) DEFAULT 'Warehouse #1 (Kyiv Central)',
    latitude REAL DEFAULT 50.4501,
    longitude REAL DEFAULT 30.5234,
    created_by_id VARCHAR(36),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS groups (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    serial_number INTEGER NOT NULL,
    condition VARCHAR(32) NOT NULL DEFAULT 'NEW', -- NEW | USED | REFURBISHED (replaces isNew: 0 | 1)
    operational_status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE | IN_REPAIR | ASSIGNED
    photo VARCHAR(255) NOT NULL, -- UUID.ext filename e.g. "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d.jpg"
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- Monitors, Laptops, etc.
    specification TEXT NOT NULL,
    guarantee_start DATETIME NOT NULL,
    guarantee_end DATETIME NOT NULL,
    order_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(36),
    assigned_user_id VARCHAR(36),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_products_group FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE SET NULL,
    CONSTRAINT fk_products_user FOREIGN KEY (assigned_user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_prices (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    value REAL NOT NULL,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'UAH', -- UAH | USD | EUR
    currency_role VARCHAR(32) NOT NULL DEFAULT 'PRIMARY_SETTLEMENT', -- PRIMARY_SETTLEMENT | VALUATION_REFERENCE (replaces isDefault: 0 | 1)
    CONSTRAINT fk_product_prices_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_order ON products (order_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products (type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (operational_status);
CREATE INDEX IF NOT EXISTS idx_prices_product ON product_prices (product_id);
