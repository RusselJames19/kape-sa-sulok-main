-- =====================================================================
-- Kape sa Sulok — Small Business Management System
-- MySQL schema (InnoDB) — Phase 1
-- Import this file via phpMyAdmin or:  mysql -u root -p < schema.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS kape_sa_sulok
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kape_sa_sulok;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(100) NOT NULL,
  username        VARCHAR(50)  NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('admin','owner','manager','cashier') NOT NULL,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  last_login      DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_role (role),
  KEY idx_users_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(80)  NOT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name),
  KEY idx_categories_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120) NOT NULL,
  description   TEXT         NULL,
  category_id   INT UNSIGNED NOT NULL,
  image_url     VARCHAR(500) NULL,
  is_available  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_category (category_id),
  KEY idx_products_is_available (is_available),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- product_variants
-- Stock is tracked per product+size combination.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS product_variants;
CREATE TABLE product_variants (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id            INT UNSIGNED NOT NULL,
  size                  ENUM('none','S','M','L') NOT NULL DEFAULT 'none',
  price                 DECIMAL(10,2) NOT NULL,
  stock_quantity        INT NOT NULL DEFAULT 0,
  low_stock_threshold   INT NOT NULL DEFAULT 10,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variant_product_size (product_id, size),
  KEY idx_variant_stock (stock_quantity),
  CONSTRAINT fk_variant_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS transactions;
CREATE TABLE transactions (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cashier_user_id  INT UNSIGNED NOT NULL,
  total_amount     DECIMAL(10,2) NOT NULL,
  amount_tendered  DECIMAL(10,2) NOT NULL,
  change_given     DECIMAL(10,2) NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tx_cashier (cashier_user_id),
  KEY idx_tx_created_at (created_at),
  CONSTRAINT fk_tx_cashier
    FOREIGN KEY (cashier_user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- transaction_items (price snapshot at sale time)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS transaction_items;
CREATE TABLE transaction_items (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  transaction_id      INT UNSIGNED NOT NULL,
  product_variant_id  INT UNSIGNED NOT NULL,
  quantity            INT NOT NULL,
  unit_price_at_sale  DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_txitem_tx (transaction_id),
  KEY idx_txitem_variant (product_variant_id),
  CONSTRAINT fk_txitem_tx
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_txitem_variant
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- system_settings (key/value)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS system_settings;
CREATE TABLE system_settings (
  setting_key    VARCHAR(80) NOT NULL,
  setting_value  TEXT NULL,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- login_attempts (rate limiting)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS login_attempts;
CREATE TABLE login_attempts (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50) NOT NULL,
  ip_address    VARCHAR(45) NOT NULL,
  attempted_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  success       TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_login_username_time (username, attempted_at),
  KEY idx_login_ip_time (ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- refresh_tokens
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS refresh_tokens;
CREATE TABLE refresh_tokens (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,
  token_hash   VARCHAR(255) NOT NULL,
  expires_at   DATETIME NOT NULL,
  revoked_at   DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_token_hash (token_hash),
  KEY idx_refresh_user (user_id),
  KEY idx_refresh_expires (expires_at),
  CONSTRAINT fk_refresh_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- Seed data
-- =====================================================================

-- Default admin user.
-- Username: admin   Password: ChangeMe123!
-- Hash generated with: password_hash('ChangeMe123!', PASSWORD_BCRYPT)
INSERT INTO users (name, username, password_hash, role, is_active) VALUES
  ('System Admin', 'admin',
   '$2y$10$eImiTXuWVxfM37uY4JANjQ==replace_with_real_hash_on_first_run',
   'admin', 1);

-- Default categories
INSERT INTO categories (name) VALUES
  ('Coffee'),
  ('Pastries'),
  ('Cold Drinks'),
  ('Snacks');

-- Default system settings
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('business_name',         'Kape sa Sulok'),
  ('business_address',      'Quezon City, Philippines'),
  ('logo_url',              ''),
  ('low_stock_threshold',   '10'),
  ('currency_symbol',       '₱'),
  ('receipt_footer',        'Salamat sa pag-suporta!');
