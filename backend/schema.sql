CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    umkm_id VARCHAR(36) NULL,
    created_at VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS umkms (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    address TEXT NULL,
    phone VARCHAR(64) NULL,
    logo TEXT NULL,
    owner_user_id VARCHAR(36) NULL,
    balance DECIMAL(14,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    umkm_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(128) NULL,
    price DECIMAL(14,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    image TEXT NULL,
    approval_status VARCHAR(32) NULL,
    approval_note TEXT NULL,
    approved_at VARCHAR(40) NULL,
    approved_by VARCHAR(36) NULL,
    created_at VARCHAR(40) NOT NULL,
    INDEX ix_products_umkm_id (umkm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    umkm_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NULL,
    nfc_card_id VARCHAR(255) NULL,
    balance DECIMAL(14,2) NOT NULL DEFAULT 0,
    created_at VARCHAR(40) NOT NULL,
    INDEX ix_customers_nfc_card_id (nfc_card_id),
    INDEX ix_customers_umkm_card (umkm_id, nfc_card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    client_txn_id VARCHAR(255) NOT NULL,
    umkm_id VARCHAR(36) NOT NULL,
    cashier_id VARCHAR(36) NULL,
    items JSON NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL,
    discount DECIMAL(14,2) NOT NULL DEFAULT 0,
    total DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    customer_id VARCHAR(36) NULL,
    nfc_card_id VARCHAR(255) NULL,
    device_id VARCHAR(255) NULL,
    signature VARCHAR(255) NULL,
    nonce VARCHAR(255) NULL,
    status VARCHAR(32) NOT NULL,
    offline BOOLEAN NOT NULL DEFAULT FALSE,
    sync_status VARCHAR(32) NULL,
    created_at VARCHAR(40) NOT NULL,
    synced_at VARCHAR(40) NULL,
    UNIQUE KEY uq_transactions_umkm_client_txn (umkm_id, client_txn_id),
    INDEX ix_transactions_umkm_created (umkm_id, created_at),
    INDEX ix_transactions_created (created_at),
    INDEX ix_transactions_nfc_total (umkm_id, nfc_card_id, total)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    umkm_id VARCHAR(36) NULL,
    action VARCHAR(128) NOT NULL,
    meta JSON NOT NULL,
    created_at VARCHAR(40) NOT NULL,
    INDEX ix_audit_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlement_config (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    umkm_pct DOUBLE NOT NULL,
    pemkab_pct DOUBLE NOT NULL,
    admin_pct DOUBLE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;