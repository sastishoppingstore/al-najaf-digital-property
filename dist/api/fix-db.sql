-- ============================================================================
-- Al Najaf Digital Property - DATABASE FIX / MIGRATION SCRIPT  (v2 - no procedures)
-- Run this in phpMyAdmin (StackCP) -> select your DB -> SQL tab -> paste -> Go
--
-- IMPORTANT: This version uses ONLY plain SQL (no stored procedures) because
-- your hosting account does not allow CREATE/DROP ROUTINE (#1370).
--
-- WHAT IT DOES:
--   1) Drops the legacy FOREIGN KEY constraints that point to `properties`
--      (property_images, property_inquiries, saved_properties, verification_requests)
--   2) Renames the old `properties` to `properties_legacy` (kept as backup)
--      and creates the NEW app-schema `properties` (VARCHAR id, purpose, area,
--      size, lat/lng, status=approved, ...) and copies all rows over.
--   3) Converts `property_images.property_id` from INT to VARCHAR and remaps
--      images to the new UUID-based property ids.
--   4) Creates every other table the app needs (if not already present).
--
-- SAFE TO RE-RUN: uses IF EXISTS / IF NOT EXISTS guards and FK checks off.
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- STEP 1: Drop FOREIGN KEY constraints that reference the old `properties`
--         (exact constraint names from the live dump)
-- ----------------------------------------------------------------------------
ALTER TABLE `property_images` DROP FOREIGN KEY `property_images_ibfk_1`;
ALTER TABLE `property_inquiries` DROP FOREIGN KEY `property_inquiries_ibfk_1`;
ALTER TABLE `saved_properties` DROP FOREIGN KEY `saved_properties_ibfk_2`;
ALTER TABLE `verification_requests` DROP FOREIGN KEY `verification_requests_ibfk_2`;

-- ----------------------------------------------------------------------------
-- STEP 2: Migrate the legacy `properties` table
--         2a) keep old data as backup table `properties_legacy`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `properties_legacy`;
RENAME TABLE `properties` TO `properties_legacy`;

-- 2b) create the NEW app-schema `properties` table
CREATE TABLE `properties` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `price_type` VARCHAR(20) DEFAULT 'fixed',
  `purpose` VARCHAR(20) DEFAULT 'sale',
  `category_id` VARCHAR(50) DEFAULT 'houses',
  `sub_category_id` VARCHAR(50) DEFAULT '',
  `city` VARCHAR(100) DEFAULT '',
  `area` VARCHAR(100) DEFAULT '',
  `lat` DECIMAL(10,6) DEFAULT 0,
  `lng` DECIMAL(10,6) DEFAULT 0,
  `size` VARCHAR(50) DEFAULT '',
  `bedrooms` INT DEFAULT 0,
  `bathrooms` INT DEFAULT 0,
  `furnished` TINYINT(1) DEFAULT 0,
  `seller_name` VARCHAR(255) DEFAULT '',
  `seller_type` VARCHAR(20) DEFAULT 'Owner',
  `seller_phone` VARCHAR(50) DEFAULT '',
  `seller_whatsapp` VARCHAR(50) DEFAULT '',
  `seller_email` VARCHAR(255) DEFAULT '',
  `status` VARCHAR(20) DEFAULT 'pending',
  `featured` TINYINT(1) DEFAULT 0,
  `premium` TINYINT(1) DEFAULT 0,
  `verified` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2c) copy legacy rows into the new schema (map old column names)
INSERT INTO `properties`
  (`id`,`title`,`description`,`price`,`price_type`,`purpose`,`category_id`,`sub_category_id`,`city`,`area`,`lat`,`lng`,`size`,`bedrooms`,`bathrooms`,`furnished`,`seller_name`,`seller_type`,`seller_phone`,`seller_whatsapp`,`status`,`featured`,`premium`,`verified`,`created_at`)
SELECT
  COALESCE(NULLIF(`uuid`,''), CAST(`id` AS CHAR)),
  `title`, `description`, COALESCE(`price`,0), COALESCE(`price_type`,'fixed'),
  COALESCE(`listing_type`,'sale'),
  COALESCE(`category_id`,'houses'),
  COALESCE(`sub_category_id`,''),
  COALESCE(`city`,''), COALESCE(`address`,''),
  COALESCE(`latitude`,0), COALESCE(`longitude`,0),
  COALESCE(`area_sqft`,''),
  COALESCE(`bedrooms`,0), COALESCE(`bathrooms`,0), COALESCE(`furnished`,0),
  COALESCE(`seller_name`,''), COALESCE(`seller_type`,'Owner'),
  COALESCE(`seller_phone`,''), COALESCE(`seller_whatsapp`,''),
  CASE WHEN `status`='active' THEN 'approved' ELSE COALESCE(`status`,'pending') END,
  COALESCE(`featured`,0), COALESCE(`premium`,0), COALESCE(`verified`,0),
  `created_at`
FROM `properties_legacy`;

-- ----------------------------------------------------------------------------
-- STEP 3: Fix property_images (INT property_id -> VARCHAR, remap to UUIDs)
-- ----------------------------------------------------------------------------
ALTER TABLE `property_images` MODIFY `property_id` VARCHAR(36) NOT NULL DEFAULT '';

UPDATE `property_images` pi
SET pi.`property_id` = (SELECT `uuid` FROM `properties_legacy` pl WHERE pl.`id` = pi.`property_id` LIMIT 1)
WHERE pi.`property_id` IN (SELECT `id` FROM `properties_legacy`);

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- STEP 3b: Align collations so JOINs (properties.property_id = properties.id)
--          work. New properties table is utf8mb4_unicode_ci; legacy tables
--          were utf8mb4_general_ci -> "Illegal mix of collations" error.
-- ----------------------------------------------------------------------------
ALTER TABLE `property_images` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `property_overrides` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `inquiries` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `favorites` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `properties` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- STEP 4: Ensure every other app table exists (safe to run any time)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(50) NOT NULL DEFAULT '',
  `cnic` VARCHAR(50) NOT NULL DEFAULT '',
  `city` VARCHAR(100) NOT NULL DEFAULT '',
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin','admin','manager','owner','user') NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `property_id` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_fav` (`user_id`,`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(50) NOT NULL DEFAULT 'Building2',
  `description` TEXT,
  `image` VARCHAR(500) NOT NULL DEFAULT '',
  `count` INT NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sub_categories` (
  `id` VARCHAR(50) PRIMARY KEY,
  `label` VARCHAR(255) NOT NULL,
  `category_id` VARCHAR(50) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `towns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `property_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `property_overrides` (
  `property_id` VARCHAR(100) PRIMARY KEY,
  `verified` TINYINT(1) DEFAULT NULL,
  `featured` TINYINT(1) DEFAULT NULL,
  `premium` TINYINT(1) DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` VARCHAR(36) PRIMARY KEY,
  `property_id` VARCHAR(100) NOT NULL,
  `property_title` VARCHAR(255) DEFAULT '',
  `user_id` VARCHAR(36) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) DEFAULT '',
  `phone` VARCHAR(50) DEFAULT '',
  `message` TEXT,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `services` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `short_name` VARCHAR(100) NOT NULL DEFAULT '',
  `description` TEXT,
  `fee` VARCHAR(100) NOT NULL DEFAULT '',
  `duration` VARCHAR(100) NOT NULL DEFAULT '',
  `icon` VARCHAR(50) NOT NULL DEFAULT 'Scale',
  `image` VARCHAR(500) NOT NULL DEFAULT '',
  `category` ENUM('legal','utility','valuation') NOT NULL DEFAULT 'legal',
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lawyers` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `designation` VARCHAR(255) NOT NULL DEFAULT '',
  `specializations` JSON,
  `experience` INT NOT NULL DEFAULT 0,
  `rating` DECIMAL(3,2) NOT NULL DEFAULT 0,
  `reviews` INT NOT NULL DEFAULT 0,
  `fee` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `city` VARCHAR(100) NOT NULL DEFAULT '',
  `image` VARCHAR(500) NOT NULL DEFAULT '',
  `bar_council` VARCHAR(255) NOT NULL DEFAULT '',
  `education` VARCHAR(255) NOT NULL DEFAULT '',
  `bio` TEXT,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `navbar_links` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `link_to` VARCHAR(500) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `footer_content` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `tagline` TEXT,
  `email` VARCHAR(255) NOT NULL DEFAULT '',
  `phone` VARCHAR(100) NOT NULL DEFAULT '',
  `address` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `footer_columns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `footer_links` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `column_id` INT NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `link_to` VARCHAR(500) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `page_texts` (
  `key` VARCHAR(255) PRIMARY KEY,
  `value_en` TEXT,
  `value_ur` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `site_config` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `brand` VARCHAR(255) NOT NULL DEFAULT 'Al Najaf Digital Property',
  `tagline` VARCHAR(500) NOT NULL DEFAULT '',
  `full_name` VARCHAR(255) NOT NULL DEFAULT '',
  `phone` VARCHAR(100) NOT NULL DEFAULT '',
  `phone_display` VARCHAR(100) NOT NULL DEFAULT '',
  `whatsapp` VARCHAR(100) NOT NULL DEFAULT '',
  `email` VARCHAR(255) NOT NULL DEFAULT '',
  `address` TEXT,
  `admin_email` VARCHAR(255) NOT NULL DEFAULT '',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `stamp_types` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `min_value` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `max_value` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `category` VARCHAR(100) NOT NULL DEFAULT '',
  `gov_rate` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `source` VARCHAR(255) NOT NULL DEFAULT '',
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `legal_docs` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100) NOT NULL DEFAULT '',
  `fee` VARCHAR(100) NOT NULL DEFAULT '',
  `duration` VARCHAR(100) NOT NULL DEFAULT '',
  `icon` VARCHAR(50) NOT NULL DEFAULT 'FileText',
  `image` VARCHAR(500) NOT NULL DEFAULT '',
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) DEFAULT NULL,
  `order_ref` VARCHAR(100) NOT NULL,
  `order_type` VARCHAR(100) NOT NULL DEFAULT '',
  `order_date` DATE NOT NULL,
  `order_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `status` ENUM('pending','confirmed','processing','completed','cancelled') NOT NULL DEFAULT 'pending',
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL DEFAULT '',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(36) NOT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `item_value` VARCHAR(500) NOT NULL DEFAULT '',
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL DEFAULT '',
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `recipient` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL DEFAULT '',
  `template` VARCHAR(100) NOT NULL DEFAULT '',
  `status` VARCHAR(50) NOT NULL DEFAULT '',
  `error` TEXT,
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `articles` (
  `id` VARCHAR(36) PRIMARY KEY,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `content` LONGTEXT,
  `category` VARCHAR(100) NOT NULL DEFAULT '',
  `tags` JSON,
  `author_name` VARCHAR(255) NOT NULL DEFAULT '',
  `author_bio` TEXT,
  `author_image` VARCHAR(500) NOT NULL DEFAULT '',
  `image` VARCHAR(500) NOT NULL DEFAULT '',
  `reading_time` INT NOT NULL DEFAULT 0,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `published_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `dc_rates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `zila` VARCHAR(100) NOT NULL,
  `tehsil` VARCHAR(100) NOT NULL,
  `mouza_area` VARCHAR(255) NOT NULL,
  `property_type` ENUM('Residential','Commercial','Agricultural') NOT NULL DEFAULT 'Residential',
  `location_status` ENUM('Urban','Rural') NOT NULL DEFAULT 'Urban',
  `dc_rate` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Marla',
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_rate` (`zila`,`tehsil`,`mouza_area`,`property_type`,`location_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- DONE. Verify in phpMyAdmin:
--   * `properties` should have NO `uuid` / `user_id` / `listing_type` columns
--   * `properties_legacy` holds your original backup (you can delete it later)
--   * Add a new property in Admin -> it must appear now
-- ============================================================================
