-- ============================================================
-- Al Najaf Digital Estate - Complete Database Schema
-- MySQL 8.0+
-- ============================================================
-- 
-- This schema creates all 22 tables for the real estate 
-- marketplace + legal services platform, including sample/demo data.
--
-- Run this in your StackCP MySQL database via phpMyAdmin or
-- the MySQL command line.
--
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- ============================================================
-- 1. ROLES TABLE
-- ============================================================
DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. USERS TABLE
-- ============================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    uuid              VARCHAR(36) NOT NULL UNIQUE,
    name              VARCHAR(255) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    phone             VARCHAR(20) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    role              ENUM('user','agent','lawyer','admin','super_admin') NOT NULL DEFAULT 'user',
    status            ENUM('active','pending','suspended','deleted') NOT NULL DEFAULT 'pending',
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    avatar_url        VARCHAR(500) DEFAULT NULL,
    bio               TEXT DEFAULT NULL,
    last_login_at     TIMESTAMP NULL DEFAULT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_phone (phone),
    INDEX idx_users_role (role),
    INDEX idx_users_status (status),
    INDEX idx_users_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. PERMISSIONS TABLE
-- ============================================================
DROP TABLE IF EXISTS permissions;
CREATE TABLE permissions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    role        ENUM('user','agent','lawyer','admin','super_admin') NOT NULL,
    permission  VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_permission (role, permission),
    INDEX idx_permissions_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. PASSWORD_RESETS TABLE
-- ============================================================
DROP TABLE IF EXISTS password_resets;
CREATE TABLE password_resets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    email       VARCHAR(255) NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used        TINYINT(1) DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_resets_email (email),
    INDEX idx_resets_token (token_hash(255)),
    INDEX idx_resets_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. EMAIL_OTPS TABLE
-- ============================================================
DROP TABLE IF EXISTS email_otps;
CREATE TABLE email_otps (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    email       VARCHAR(255) NOT NULL,
    otp_hash    VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    attempts    INT DEFAULT 0,
    verified    TINYINT(1) DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_otps_email (email),
    INDEX idx_otps_expires (expires_at),
    INDEX idx_otps_verified (verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. PROPERTY_CATEGORIES TABLE
-- ============================================================
DROP TABLE IF EXISTS property_categories;
CREATE TABLE property_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    icon        VARCHAR(100) DEFAULT NULL,
    sort_order  INT DEFAULT 0,
    status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. PROPERTIES TABLE
-- ============================================================
DROP TABLE IF EXISTS properties;
CREATE TABLE properties (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    uuid          VARCHAR(36) NOT NULL UNIQUE,
    user_id       INT NOT NULL,
    category_id   INT DEFAULT NULL,
    title         VARCHAR(255) NOT NULL,
    slug          VARCHAR(300) NOT NULL,
    description   TEXT NOT NULL,
    price         DECIMAL(15,2) NOT NULL,
    currency      VARCHAR(10) NOT NULL DEFAULT 'PKR',
    listing_type  ENUM('sale','rent') NOT NULL DEFAULT 'sale',
    property_type ENUM('house','apartment','land','commercial') NOT NULL DEFAULT 'house',
    address       VARCHAR(500) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    state         VARCHAR(100) DEFAULT NULL,
    country       VARCHAR(100) NOT NULL DEFAULT 'Pakistan',
    latitude      DECIMAL(10,8) DEFAULT NULL,
    longitude     DECIMAL(11,8) DEFAULT NULL,
    bedrooms      INT DEFAULT NULL,
    bathrooms     INT DEFAULT NULL,
    area_sqft     DECIMAL(12,2) DEFAULT NULL,
    featured      TINYINT(1) DEFAULT 0,
    status        ENUM('active','pending','rejected','expired','deleted') NOT NULL DEFAULT 'pending',
    view_count    INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES property_categories(id) ON DELETE SET NULL,
    INDEX idx_properties_user (user_id),
    INDEX idx_properties_category (category_id),
    INDEX idx_properties_city (city),
    INDEX idx_properties_type (property_type),
    INDEX idx_properties_listing (listing_type),
    INDEX idx_properties_status (status),
    INDEX idx_properties_price (price),
    INDEX idx_properties_featured (featured),
    INDEX idx_properties_created (created_at),
    INDEX idx_properties_slug (slug(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. PROPERTY_IMAGES TABLE
-- ============================================================
DROP TABLE IF EXISTS property_images;
CREATE TABLE property_images (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    image_url   VARCHAR(500) NOT NULL,
    caption     VARCHAR(255) DEFAULT NULL,
    is_primary  TINYINT(1) DEFAULT 0,
    sort_order  INT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    INDEX idx_images_property (property_id),
    INDEX idx_images_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. PROPERTY_INQUIRIES TABLE
-- ============================================================
DROP TABLE IF EXISTS property_inquiries;
CREATE TABLE property_inquiries (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    user_id     INT DEFAULT NULL,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(20) NOT NULL,
    message     TEXT NOT NULL,
    status      ENUM('pending','responded','closed') NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_inquiries_property (property_id),
    INDEX idx_inquiries_user (user_id),
    INDEX idx_inquiries_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. SAVED_PROPERTIES TABLE
-- ============================================================
DROP TABLE IF EXISTS saved_properties;
CREATE TABLE saved_properties (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    property_id INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_property (user_id, property_id),
    INDEX idx_saved_user (user_id),
    INDEX idx_saved_property (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. VERIFICATION_REQUESTS TABLE
-- ============================================================
DROP TABLE IF EXISTS verification_requests;
CREATE TABLE verification_requests (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    property_id   INT DEFAULT NULL,
    request_type  ENUM('property','agent','lawyer') NOT NULL,
    status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at   TIMESTAMP NULL DEFAULT NULL,
    reviewed_by   INT DEFAULT NULL,
    notes         TEXT DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_verification_user (user_id),
    INDEX idx_verification_property (property_id),
    INDEX idx_verification_status (status),
    INDEX idx_verification_type (request_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. ESTAMP_APPLICATIONS TABLE
-- ============================================================
DROP TABLE IF EXISTS estamp_applications;
CREATE TABLE estamp_applications (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    reference_number  VARCHAR(50) NOT NULL UNIQUE,
    applicant_name    VARCHAR(255) NOT NULL,
    applicant_cnic    VARCHAR(20) NOT NULL,
    applicant_email   VARCHAR(255) NOT NULL,
    applicant_phone   VARCHAR(20) NOT NULL,
    applicant_address VARCHAR(500) NOT NULL,
    document_type     ENUM('property_sale','property_rent','affidavit','power_of_attorney','agreement') NOT NULL,
    property_address  VARCHAR(500) NOT NULL,
    property_value    DECIMAL(15,2) NOT NULL,
    stamp_duty_amount DECIMAL(15,2) DEFAULT NULL,
    description       TEXT DEFAULT NULL,
    status            ENUM('submitted','under_review','approved','rejected','completed') NOT NULL DEFAULT 'submitted',
    submitted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at      TIMESTAMP NULL DEFAULT NULL,
    approved_at       TIMESTAMP NULL DEFAULT NULL,
    completed_at      TIMESTAMP NULL DEFAULT NULL,
    rejection_reason  TEXT DEFAULT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_estamp_user (user_id),
    INDEX idx_estamp_reference (reference_number),
    INDEX idx_estamp_status (status),
    INDEX idx_estamp_document_type (document_type),
    INDEX idx_estamp_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. ESTAMP_DOCUMENTS TABLE
-- ============================================================
DROP TABLE IF EXISTS estamp_documents;
CREATE TABLE estamp_documents (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    application_id    INT NOT NULL,
    document_type     ENUM('cnic_copy','property_papers','sale_deed','rent_agreement','other') NOT NULL,
    file_path         VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size         INT NOT NULL,
    mime_type         VARCHAR(100) NOT NULL,
    uploaded_by       INT NOT NULL,
    uploaded_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at       TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (application_id) REFERENCES estamp_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_estamp_docs_application (application_id),
    INDEX idx_estamp_docs_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. ESTAMP_STATUS_HISTORY TABLE
-- ============================================================
DROP TABLE IF EXISTS estamp_status_history;
CREATE TABLE estamp_status_history (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    application_id  INT NOT NULL,
    status          VARCHAR(50) NOT NULL,
    notes           TEXT DEFAULT NULL,
    changed_by      INT DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES estamp_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_estamp_history_application (application_id),
    INDEX idx_estamp_history_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. SERVICES TABLE
-- ============================================================
DROP TABLE IF EXISTS services;
CREATE TABLE services (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(300) NOT NULL,
    description     TEXT NOT NULL,
    category        VARCHAR(100) NOT NULL,
    price           DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency        VARCHAR(10) NOT NULL DEFAULT 'PKR',
    duration_hours  INT DEFAULT 1,
    icon            VARCHAR(100) DEFAULT NULL,
    status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_services_slug (slug(255)),
    INDEX idx_services_category (category),
    INDEX idx_services_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. SERVICE_REQUESTS TABLE
-- ============================================================
DROP TABLE IF EXISTS service_requests;
CREATE TABLE service_requests (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    service_id          INT NOT NULL,
    reference_number    VARCHAR(50) NOT NULL UNIQUE,
    customer_name       VARCHAR(255) NOT NULL,
    customer_email      VARCHAR(255) NOT NULL,
    customer_phone      VARCHAR(20) NOT NULL,
    customer_address    VARCHAR(500) DEFAULT NULL,
    preferred_date      DATE NOT NULL,
    preferred_time      TIME NOT NULL,
    notes               TEXT DEFAULT NULL,
    price_at_booking    DECIMAL(15,2) NOT NULL,
    currency_at_booking VARCHAR(10) NOT NULL DEFAULT 'PKR',
    status              ENUM('pending','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_service_req_user (user_id),
    INDEX idx_service_req_service (service_id),
    INDEX idx_service_req_reference (reference_number),
    INDEX idx_service_req_status (status),
    INDEX idx_service_req_date (preferred_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. SERVICE_STATUS_HISTORY TABLE
-- ============================================================
DROP TABLE IF EXISTS service_status_history;
CREATE TABLE service_status_history (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    request_id  INT NOT NULL,
    status      VARCHAR(50) NOT NULL,
    notes       TEXT DEFAULT NULL,
    changed_by  INT DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_service_history_request (request_id),
    INDEX idx_service_history_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. LAWYERS TABLE
-- ============================================================
DROP TABLE IF EXISTS lawyers;
CREATE TABLE lawyers (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    uuid              VARCHAR(36) NOT NULL UNIQUE,
    user_id           INT DEFAULT NULL,
    name              VARCHAR(255) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    phone             VARCHAR(20) NOT NULL,
    bio               TEXT DEFAULT NULL,
    specialties       TEXT NOT NULL,
    bar_council_id    VARCHAR(100) DEFAULT NULL,
    years_experience  INT DEFAULT 0,
    education         VARCHAR(500) DEFAULT NULL,
    city              VARCHAR(100) NOT NULL,
    state             VARCHAR(100) DEFAULT NULL,
    avatar_url        VARCHAR(500) DEFAULT NULL,
    rating            DECIMAL(3,2) DEFAULT 0,
    consultation_fee  DECIMAL(15,2) DEFAULT 0,
    currency          VARCHAR(10) NOT NULL DEFAULT 'PKR',
    is_verified       TINYINT(1) DEFAULT 0,
    is_available      TINYINT(1) DEFAULT 1,
    status            ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_lawyers_user (user_id),
    INDEX idx_lawyers_city (city),
    INDEX idx_lawyers_verified (is_verified),
    INDEX idx_lawyers_available (is_available),
    INDEX idx_lawyers_status (status),
    INDEX idx_lawyers_specialties (specialties(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. LAWYER_BOOKINGS TABLE
-- ============================================================
DROP TABLE IF EXISTS lawyer_bookings;
CREATE TABLE lawyer_bookings (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    lawyer_id           INT NOT NULL,
    reference_number    VARCHAR(50) NOT NULL UNIQUE,
    consultation_date   DATE NOT NULL,
    consultation_time   TIME NOT NULL,
    duration_minutes    INT DEFAULT 60,
    consultation_type   ENUM('in_person','video','phone') NOT NULL DEFAULT 'in_person',
    client_name         VARCHAR(255) NOT NULL,
    client_email        VARCHAR(255) NOT NULL,
    client_phone        VARCHAR(20) NOT NULL,
    case_description    TEXT NOT NULL,
    notes               TEXT DEFAULT NULL,
    fee                 DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency            VARCHAR(10) NOT NULL DEFAULT 'PKR',
    rating              INT DEFAULT NULL,
    feedback            TEXT DEFAULT NULL,
    status              ENUM('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE,
    INDEX idx_lawyer_bookings_user (user_id),
    INDEX idx_lawyer_bookings_lawyer (lawyer_id),
    INDEX idx_lawyer_bookings_reference (reference_number),
    INDEX idx_lawyer_bookings_status (status),
    INDEX idx_lawyer_bookings_date (consultation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. NOTIFICATIONS TABLE
-- ============================================================
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    type        ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
    link        VARCHAR(500) DEFAULT NULL,
    is_read     TINYINT(1) DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. MESSAGES TABLE
-- ============================================================
DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    sender_id    INT NOT NULL,
    receiver_id  INT NOT NULL,
    subject      VARCHAR(255) DEFAULT NULL,
    body         TEXT NOT NULL,
    is_read      TINYINT(1) DEFAULT 0,
    read_at      TIMESTAMP NULL DEFAULT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_receiver (receiver_id),
    INDEX idx_messages_read (is_read),
    INDEX idx_messages_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. ADMIN_LOGS TABLE
-- ============================================================
DROP TABLE IF EXISTS admin_logs;
CREATE TABLE admin_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT DEFAULT NULL,
    action      VARCHAR(255) NOT NULL,
    entity      VARCHAR(100) DEFAULT NULL,
    entity_id   INT DEFAULT NULL,
    ip_address  VARCHAR(45) DEFAULT NULL,
    user_agent  TEXT DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_logs_user (user_id),
    INDEX idx_logs_entity (entity),
    INDEX idx_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- ============================================================
-- SAMPLE / DEMO DATA
-- ============================================================
-- ============================================================

-- ============================================================
-- ROLES
-- ============================================================
INSERT INTO roles (name, description) VALUES
('user', 'Regular registered user'),
('agent', 'Real estate agent who can list properties'),
('lawyer', 'Lawyer who provides legal services'),
('admin', 'Administrator with management access'),
('super_admin', 'Super administrator with full access');

-- ============================================================
-- PERMISSIONS
-- ============================================================
INSERT INTO permissions (role, permission, description) VALUES
('user', 'property:view', 'View property listings'),
('user', 'property:inquire', 'Submit property inquiries'),
('user', 'property:save', 'Save/bookmark properties'),
('user', 'estamp:apply', 'Apply for E-Stamp certificates'),
('user', 'service:book', 'Book associate services'),
('user', 'lawyer:book', 'Book lawyer consultations'),
('user', 'message:send', 'Send messages to other users'),
('agent', 'property:create', 'Create property listings'),
('agent', 'property:edit_own', 'Edit own property listings'),
('agent', 'property:delete_own', 'Delete own property listings'),
('lawyer', 'booking:manage', 'Manage own lawyer bookings'),
('lawyer', 'profile:edit', 'Edit own lawyer profile'),
('admin', 'admin:dashboard', 'Access admin dashboard'),
('admin', 'admin:properties', 'Manage all properties'),
('admin', 'admin:estamp', 'Manage E-Stamp applications'),
('admin', 'admin:services', 'Manage services and requests'),
('admin', 'admin:lawyers', 'Manage lawyers'),
('admin', 'admin:users', 'Manage users'),
('super_admin', 'admin:full_access', 'Full administrative access'),
('super_admin', 'admin:assign_roles', 'Assign user roles');

-- ============================================================
-- USERS (5 users + 1 admin)
-- ============================================================
-- Password for all demo users: Test@1234
-- Bcrypt hash for "Test@1234" with cost 12:
INSERT INTO users (uuid, name, email, phone, password_hash, role, status, email_verified_at, avatar_url, bio, created_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ahmed Raza', 'ahmed.raza@example.com', '+923001234567', '$2y$12$5kwMpsFBR8aIbCC6vNdn0uUB9y84.bIdPOe8.mxXHGOUkpDVs/Jwu', 'user', 'active', NOW(), 'https://i.pravatar.cc/150?img=1', 'Real estate enthusiast looking for properties in Najaf.', '2024-01-15 10:30:00'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Fatima Khan', 'fatima.khan@example.com', '+923012345678', '$2y$12$5kwMpsFBR8aIbCC6vNdn0uUB9y84.bIdPOe8.mxXHGOUkpDVs/Jwu', 'agent', 'active', NOW(), 'https://i.pravatar.cc/150?img=2', 'Licensed real estate agent with 8 years of experience in residential and commercial properties.', '2024-01-20 14:15:00'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Bilal Hussain', 'bilal.hussain@example.com', '+923023456789', '$2y$12$5kwMpsFBR8aIbCC6vNdn0uUB9y84.bIdPOe8.mxXHGOUkpDVs/Jwu', 'user', 'active', NOW(), 'https://i.pravatar.cc/150?img=3', 'Business owner looking for commercial properties.', '2024-02-01 09:00:00'),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Zainab Ali', 'zainab.ali@example.com', '+923034567890', '$2y$12$5kwMpsFBR8aIbCC6vNdn0uUB9y84.bIdPOe8.mxXHGOUkpDVs/Jwu', 'user', 'active', NOW(), 'https://i.pravatar.cc/150?img=4', 'Home buyer searching for family-friendly neighborhoods.', '2024-02-10 11:45:00'),
('e5f6a7b8-c9d0-1234-efab-345678901234', 'Usman Sheikh', 'usman.sheikh@example.com', '+923045678901', '$2y$12$5kwMpsFBR8aIbCC6vNdn0uUB9y84.bIdPOe8.mxXHGOUkpDVs/Jwu', 'agent', 'active', NOW(), 'https://i.pravatar.cc/150?img=5', 'Real estate agent specializing in land and agricultural properties.', '2024-02-15 16:20:00'),
('f6a7b8c9-d0e1-2345-fabc-456789012345', 'Admin User', 'admin@alnajaf-estate.com', '+923056789012', '$2y$12$5kwMpsFBR8aIbCC6vNdn0uUB9y84.bIdPOe8.mxXHGOUkpDVs/Jwu', 'super_admin', 'active', NOW(), 'https://i.pravatar.cc/150?img=6', 'System administrator.', '2024-01-01 00:00:00');

-- ============================================================
-- PROPERTY CATEGORIES
-- ============================================================
INSERT INTO property_categories (name, slug, description, icon, sort_order, status) VALUES
('Residential Houses', 'residential-houses', 'Single-family houses, villas, and townhouses for sale or rent', 'home', 1, 'active'),
('Apartments & Flats', 'apartments-flats', 'Apartments, flats, and condos for sale or rent', 'building', 2, 'active'),
('Commercial Properties', 'commercial-properties', 'Shops, offices, and commercial buildings', 'briefcase', 3, 'active'),
('Land & Plots', 'land-plots', 'Residential plots, agricultural land, and commercial plots', 'map', 4, 'active'),
('Farmhouses', 'farmhouses', 'Farmhouses and agricultural estates', 'tree', 5, 'active');

-- ============================================================
-- PROPERTIES (20 properties)
-- ============================================================
INSERT INTO properties (uuid, user_id, category_id, title, slug, description, price, currency, listing_type, property_type, address, city, state, country, latitude, longitude, bedrooms, bathrooms, area_sqft, featured, status, view_count, created_at) VALUES
-- Properties by Fatima Khan (agent, user_id=2)
('p0010001-aaaa-bbbb-cccc-000000000001', 2, 1, 'Modern 5 Marla House in DHA Phase 5', 'modern-5-marla-house-dha-phase-5-aaaabbbb', 'Beautiful newly constructed 5 marla house in DHA Phase 5. Features include modern kitchen, imported fittings, marble flooring, and a rooftop terrace. Prime location near main boulevard.', 18500000, 'PKR', 'sale', 'house', 'House #123, Street 7, DHA Phase 5', 'Lahore', 'Punjab', 'Pakistan', 31.4805, 74.4036, 3, 3, 1200.00, 1, 'active', 342, '2024-03-01 10:00:00'),
('p0010002-aaaa-bbbb-cccc-000000000002', 2, 1, 'Luxury 10 Marla Villa in Bahria Town', 'luxury-10-marla-villa-bahria-town-aaaabbbb', 'Spacious 10 marla double story villa in Bahria Town Sector C. Features include 5 bedrooms, drawing room, TV lounge, servant quarter, and lush green garden.', 45000000, 'PKR', 'sale', 'house', 'Villa #45, Sector C, Bahria Town', 'Lahore', 'Punjab', 'Pakistan', 31.4650, 74.3220, 5, 5, 2400.00, 1, 'active', 567, '2024-03-05 11:30:00'),
('p0010003-aaaa-bbbb-cccc-000000000003', 2, 2, 'Furnished 3 Bed Apartment in Gulberg', 'furnished-3-bed-apartment-gulberg-aaaabbbb', 'Fully furnished 3 bedroom apartment in the heart of Gulberg. Walking distance to restaurants, shopping malls, and parks. Includes 2 parking spaces.', 25000000, 'PKR', 'sale', 'apartment', 'Apartment #301, Gulberg Greens', 'Lahore', 'Punjab', 'Pakistan', 31.5204, 74.3587, 3, 2, 1450.00, 0, 'active', 234, '2024-03-10 09:15:00'),
('p0010004-aaaa-bbbb-cccc-000000000004', 2, 3, 'Commercial Shop on Main Boulevard', 'commercial-shop-main-boulevard-aaaabbbb', 'Prime commercial shop on Main Boulevard Gulberg. High foot traffic area, ideal for retail business or restaurant. Corner unit with display windows.', 32000000, 'PKR', 'sale', 'commercial', 'Shop #12, Main Boulevard, Gulberg II', 'Lahore', 'Punjab', 'Pakistan', 31.5230, 74.3470, NULL, 2, 800.00, 1, 'active', 412, '2024-03-12 14:00:00'),
('p0010005-aaaa-bbbb-cccc-000000000005', 2, 2, '2 Bed Apartment for Rent in Johar Town', '2-bed-apartment-rent-johar-town-aaaabbbb', 'Nicely maintained 2 bedroom apartment available for rent in Johar Town Block H. Close to educational institutions and markets. Family preferred.', 45000, 'PKR', 'rent', 'apartment', 'Flat #205, Block H, Johar Town', 'Lahore', 'Punjab', 'Pakistan', 31.4690, 74.2660, 2, 2, 950.00, 0, 'active', 189, '2024-03-15 13:45:00'),
-- Properties by Usman Sheikh (agent, user_id=5)
('p0010006-aaaa-bbbb-cccc-000000000006', 5, 4, '5 Acre Agricultural Land in Kasur', '5-acre-agricultural-land-kasur-aaaabbbb', 'Fertile 5 acre agricultural land in Kasur district. Suitable for wheat, rice, and vegetable cultivation. Canal water access available. Clear title and all dues cleared.', 8500000, 'PKR', 'sale', 'land', 'Near Raiwind Road, Kasur', 'Kasur', 'Punjab', 'Pakistan', 31.1200, 74.4500, NULL, NULL, 217800.00, 0, 'active', 156, '2024-03-18 10:30:00'),
('p0010007-aaaa-bbbb-cccc-000000000007', 5, 4, '10 Kanal Residential Plot in DHA City', '10-kanal-residential-plot-dha-city-aaaabbbb', '10 kanal residential plot in DHA City Lahore. Level plot, ready for construction. All development charges paid. Ideal for building a farmhouse or large family home.', 35000000, 'PKR', 'sale', 'land', 'Plot #789, Sector A, DHA City', 'Lahore', 'Punjab', 'Pakistan', 31.3800, 74.2500, NULL, NULL, 43560.00, 1, 'active', 389, '2024-03-20 15:20:00'),
('p0010008-aaaa-bbbb-cccc-000000000008', 5, 5, 'Farmhouse with Swimming Pool in Bedian', 'farmhouse-swimming-pool-bedian-aaaabbbb', 'Stunning 4 kanal farmhouse with swimming pool, landscaped gardens, and 4 bedrooms. Perfect weekend retreat away from city noise. Fully furnished and ready to move in.', 75000000, 'PKR', 'sale', 'house', 'Bedian Road, Near DHA Phase 5', 'Lahore', 'Punjab', 'Pakistan', 31.4500, 74.3800, 4, 4, 8712.00, 1, 'active', 623, '2024-03-22 11:00:00'),
('p0010009-aaaa-bbbb-cccc-000000000009', 5, 4, '1 Kanal Commercial Plot in Bahria Town', '1-kanal-commercial-plot-bahria-town-aaaabbbb', '1 kanal commercial plot in Bahria Town Sector D. Excellent location for shopping mall or office building. Possession available immediately.', 28000000, 'PKR', 'sale', 'land', 'Plot #34, Sector D, Bahria Town', 'Lahore', 'Punjab', 'Pakistan', 31.4700, 74.3300, NULL, NULL, 4356.00, 0, 'active', 198, '2024-03-25 09:30:00'),
('p0010010-aaaa-bbbb-cccc-000000000010', 5, 1, '3 Marla House in Wapda Town', '3-marla-house-wapda-town-aaaabbbb', 'Cozy 3 marla single story house in Wapda Town. 2 bedrooms, attached baths, car porch, and small garden. Ideal for small family. Near to main market.', 9500000, 'PKR', 'sale', 'house', 'House #56, Block B, Wapda Town', 'Lahore', 'Punjab', 'Pakistan', 31.4400, 74.2800, 2, 2, 720.00, 0, 'active', 145, '2024-03-28 16:00:00'),
-- More properties by Fatima Khan
('p0010011-aaaa-bbbb-cccc-000000000011', 2, 2, 'Luxury Penthouse in Eden Tower', 'luxury-penthouse-eden-tower-aaaabbbb', 'Exclusive 4 bedroom penthouse on the top floor of Eden Tower. Panoramic city views, private terrace, and premium fittings. Includes 3 parking spaces and 24/7 security.', 65000000, 'PKR', 'sale', 'apartment', 'Penthouse, Eden Tower, MM Alam Road', 'Lahore', 'Punjab', 'Pakistan', 31.5100, 74.3500, 4, 4, 3200.00, 1, 'active', 789, '2024-04-01 12:00:00'),
('p0010012-aaaa-bbbb-cccc-000000000012', 2, 3, 'Office Space in Plaza Center', 'office-space-plaza-center-aaaabbbb', 'Modern office space of 1200 sqft in Plaza Center. Fully air-conditioned with conference room, reception area, and 6 workstations. Available for rent immediately.', 120000, 'PKR', 'rent', 'commercial', 'Office #401, Plaza Center, Ferozepur Road', 'Lahore', 'Punjab', 'Pakistan', 31.4900, 74.3500, NULL, 3, 1200.00, 0, 'active', 167, '2024-04-03 10:45:00'),
('p0010013-aaaa-bbbb-cccc-000000000013', 2, 1, 'Newly Built 8 Marla House in Park View', 'newly-built-8-marla-house-park-view-aaaabbbb', 'Brand new 8 marla house in Park View Villas. Modern architecture, high quality construction, 4 bedrooms with attached baths, imported kitchen, and double car garage.', 32000000, 'PKR', 'sale', 'house', 'House #78, Park View Villas', 'Lahore', 'Punjab', 'Pakistan', 31.4300, 74.2700, 4, 4, 1920.00, 1, 'active', 445, '2024-04-05 14:30:00'),
('p0010014-aaaa-bbbb-cccc-000000000014', 2, 2, 'Studio Apartment in Lake City', 'studio-apartment-lake-city-aaaabbbb', 'Compact and modern studio apartment in Lake City Residences. Ideal for singles or couples. Includes built-in kitchen, attached bath, and balcony with lake view.', 8500000, 'PKR', 'sale', 'apartment', 'Studio #105, Lake City Residences', 'Lahore', 'Punjab', 'Pakistan', 31.3700, 74.2200, 1, 1, 550.00, 0, 'active', 112, '2024-04-08 11:15:00'),
('p0010015-aaaa-bbbb-cccc-000000000015', 2, 3, 'Warehouse in Sundar Industrial Estate', 'warehouse-sundar-industrial-estate-aaaabbbb', 'Spacious 2 kanal warehouse in Sundar Industrial Estate. High ceiling, loading dock, and ample parking for trucks. Suitable for manufacturing or storage business.', 22000000, 'PKR', 'sale', 'commercial', 'Plot #45, Sundar Industrial Estate', 'Lahore', 'Punjab', 'Pakistan', 31.3500, 74.1800, NULL, 2, 8712.00, 0, 'active', 234, '2024-04-10 09:00:00'),
-- More properties by Usman Sheikh
('p0010016-aaaa-bbbb-cccc-000000000016', 5, 4, '3 Kanal Plot in State Life Housing', '3-kanal-plot-state-life-housing-aaaabbbb', '3 kanal residential plot in State Life Cooperative Housing Society. Level plot, clear title, and ready for construction. Near to Ring Road and metro station.', 18000000, 'PKR', 'sale', 'land', 'Plot #123, State Life Housing Society', 'Lahore', 'Punjab', 'Pakistan', 31.4500, 74.3000, NULL, NULL, 13068.00, 0, 'active', 178, '2024-04-12 13:30:00'),
('p0010017-aaaa-bbbb-cccc-000000000017', 5, 5, '5 Kanal Farmhouse Land in Bhatta Chowk', '5-kanal-farmhouse-land-bhatta-chowk-aaaabbbb', '5 kanal agricultural land perfect for farmhouse development in Bhatta Chowk area. Surrounded by greenery, peaceful environment, and easy access from main road.', 15000000, 'PKR', 'sale', 'land', 'Near Bhatta Chowk, Ferozepur Road', 'Lahore', 'Punjab', 'Pakistan', 31.4100, 74.4000, NULL, NULL, 21780.00, 0, 'active', 134, '2024-04-15 15:45:00'),
('p0010018-aaaa-bbbb-cccc-000000000018', 5, 1, '1 Kanal House in Model Town', '1-kanal-house-model-town-aaaabbbb', 'Heritage 1 kanal house in Model Town Block C. Original condition, high ceilings, and spacious rooms. Great potential for renovation or rebuild. Prime location.', 55000000, 'PKR', 'sale', 'house', 'House #23, Block C, Model Town', 'Lahore', 'Punjab', 'Pakistan', 31.5200, 74.3300, 5, 5, 4356.00, 1, 'active', 567, '2024-04-18 10:00:00'),
('p0010019-aaaa-bbbb-cccc-000000000019', 5, 2, '1 Bed Flat for Rent in Garden Town', '1-bed-flat-rent-garden-town-aaaabbbb', 'Well maintained 1 bedroom flat available for rent in Garden Town. Close to Main Market and public transport. Includes furnished kitchen and parking.', 28000, 'PKR', 'rent', 'apartment', 'Flat #102, Block C, Garden Town', 'Lahore', 'Punjab', 'Pakistan', 31.5000, 74.3400, 1, 1, 650.00, 0, 'active', 98, '2024-04-20 12:30:00'),
('p0010020-aaaa-bbbb-cccc-000000000020', 5, 3, 'Showroom on Ring Road', 'showroom-ring-road-aaaabbbb', 'Premium showroom space of 3000 sqft on Ring Road. High visibility location, ample parking, and modern glass facade. Perfect for car showroom or furniture display.', 180000, 'PKR', 'rent', 'commercial', 'Showroom #1, Ring Road, near DHA', 'Lahore', 'Punjab', 'Pakistan', 31.4600, 74.3500, NULL, 4, 3000.00, 1, 'active', 345, '2024-04-22 14:00:00');

-- ============================================================
-- PROPERTY IMAGES
-- ============================================================
INSERT INTO property_images (property_id, image_url, caption, is_primary, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', 'Front view of the house', 1, 0),
(1, 'https://images.unsplash.com/photo-1560448204-e02f11c3d729?w=800', 'Living room', 0, 1),
(1, 'https://images.unsplash.com/photo-1570129477492-45c0023f6c1b?w=800', 'Kitchen', 0, 2),
(2, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', 'Villa exterior', 1, 0),
(2, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 'Master bedroom', 0, 1),
(3, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'Apartment living area', 1, 0),
(3, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d9ed88?w=800', 'Bedroom view', 0, 1),
(4, 'https://images.unsplash.com/photo-1582407947304-8148e5d2a2a8?w=800', 'Shop front', 1, 0),
(5, 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800', 'Apartment interior', 1, 0),
(6, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 'Agricultural land view', 1, 0),
(7, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 'Residential plot', 1, 0),
(8, 'https://images.unsplash.com/photo-1564013799929-7f3d5d3d3d3d?w=800', 'Farmhouse exterior', 1, 0),
(8, 'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=800', 'Swimming pool', 0, 1),
(9, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 'Commercial plot', 1, 0),
(10, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', 'House front', 1, 0),
(11, 'https://images.unsplash.com/photo-1545324418-cc1a3a10ed96?w=800', 'Penthouse terrace', 1, 0),
(11, 'https://images.unsplash.com/photo-1560448204-e02f11c3d729?w=800', 'Penthouse living room', 0, 1),
(12, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', 'Office space', 1, 0),
(13, 'https://images.unsplash.com/photo-1564013799929-7f3d5d3d3d3d?w=800', 'House exterior', 1, 0),
(14, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'Studio apartment', 1, 0),
(15, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800', 'Warehouse interior', 1, 0),
(16, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 'Residential plot', 1, 0),
(17, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 'Farmhouse land', 1, 0),
(18, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', 'Heritage house', 1, 0),
(19, 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800', 'Flat interior', 1, 0),
(20, 'https://images.unsplash.com/photo-1582407947304-8148e5d2a2a8?w=800', 'Showroom front', 1, 0);

-- ============================================================
-- SERVICES
-- ============================================================
INSERT INTO services (name, slug, description, category, price, currency, duration_hours, icon, status) VALUES
('Property Title Verification', 'property-title-verification', 'Comprehensive verification of property title documents to ensure clear ownership and legal status. Includes checking encumbrances, liens, and chain of ownership.', 'Legal Documentation', 15000, 'PKR', 24, 'file-check', 'active'),
('Property Registration Assistance', 'property-registration-assistance', 'Complete assistance with property registration process including document preparation, stamp duty calculation, and submission to relevant authorities.', 'Legal Documentation', 25000, 'PKR', 48, 'file-signature', 'active'),
('Tenancy Agreement Drafting', 'tenancy-agreement-drafting', 'Professional drafting of tenancy agreements tailored to protect both landlord and tenant interests. Includes legal review and notarization guidance.', 'Legal Documentation', 8000, 'PKR', 24, 'file-contract', 'active'),
('Property Valuation Report', 'property-valuation-report', 'Certified property valuation report by experienced surveyors. Accepted by banks, courts, and government departments for official purposes.', 'Survey & Valuation', 12000, 'PKR', 48, 'calculator', 'active'),
('Property Tax Consultation', 'property-tax-consultation', 'Expert consultation on property tax matters including assessment review, tax planning, and filing assistance for residential and commercial properties.', 'Tax & Finance', 10000, 'PKR', 2, 'receipt', 'active'),
('Property Transfer Documentation', 'property-transfer-documentation', 'Full documentation service for property transfer including sale deed preparation, mutation filing, and coordination with revenue department.', 'Legal Documentation', 20000, 'PKR', 72, 'exchange-alt', 'active'),
('Property Dispute Resolution', 'property-dispute-resolution', 'Legal consultation and representation for property disputes including boundary issues, ownership conflicts, and encroachment matters.', 'Dispute Resolution', 30000, 'PKR', 2, 'gavel', 'active'),
('Power of Attorney Drafting', 'power-of-attorney-drafting', 'Drafting of general and special power of attorney documents for property management, sale authorization, and legal representation.', 'Legal Documentation', 6000, 'PKR', 24, 'stamp', 'active');

-- ============================================================
-- SERVICE REQUESTS (3 bookings per service = 24 total, showing sample)
-- ============================================================
INSERT INTO service_requests (user_id, service_id, reference_number, customer_name, customer_email, customer_phone, customer_address, preferred_date, preferred_time, notes, price_at_booking, currency_at_booking, status, created_at) VALUES
(1, 1, 'SR-20240301-A1B2C3', 'Ahmed Raza', 'ahmed.raza@example.com', '+923001234567', 'House #123, Street 7, DHA Phase 5, Lahore', '2024-04-15', '10:00', 'Need urgent title verification for property purchase', 15000, 'PKR', 'completed', '2024-03-01 10:30:00'),
(1, 2, 'SR-20240305-D4E5F6', 'Ahmed Raza', 'ahmed.raza@example.com', '+923001234567', 'House #123, Street 7, DHA Phase 5, Lahore', '2024-04-20', '14:00', 'Registration assistance for newly purchased property', 25000, 'PKR', 'completed', '2024-03-05 11:45:00'),
(3, 1, 'SR-20240310-G7H8I9', 'Bilal Hussain', 'bilal.hussain@example.com', '+923023456789', 'Shop #12, Main Boulevard, Gulberg II, Lahore', '2024-04-25', '09:00', 'Title verification for commercial property', 15000, 'PKR', 'confirmed', '2024-03-10 09:15:00'),
(3, 3, 'SR-20240312-J1K2L3', 'Bilal Hussain', 'bilal.hussain@example.com', '+923023456789', 'Shop #12, Main Boulevard, Gulberg II, Lahore', '2024-04-28', '11:00', 'Need tenancy agreement for new tenant', 8000, 'PKR', 'completed', '2024-03-12 14:30:00'),
(4, 4, 'SR-20240315-M4N5O6', 'Zainab Ali', 'zainab.ali@example.com', '+923034567890', 'Flat #205, Block H, Johar Town, Lahore', '2024-05-02', '13:00', 'Valuation needed for bank loan application', 12000, 'PKR', 'completed', '2024-03-15 13:45:00'),
(4, 5, 'SR-20240318-P7Q8R9', 'Zainab Ali', 'zainab.ali@example.com', '+923034567890', 'Flat #205, Block H, Johar Town, Lahore', '2024-05-05', '15:00', 'Property tax assessment seems too high, need consultation', 10000, 'PKR', 'pending', '2024-03-18 16:00:00'),
(1, 6, 'SR-20240320-S1T2U3', 'Ahmed Raza', 'ahmed.raza@example.com', '+923001234567', 'House #123, Street 7, DHA Phase 5, Lahore', '2024-05-10', '10:00', 'Transfer documentation for selling property', 20000, 'PKR', 'confirmed', '2024-03-20 10:15:00'),
(3, 7, 'SR-20240322-V4W5X6', 'Bilal Hussain', 'bilal.hussain@example.com', '+923023456789', 'Shop #12, Main Boulevard, Gulberg II, Lahore', '2024-05-12', '12:00', 'Boundary dispute with neighboring shop owner', 30000, 'PKR', 'pending', '2024-03-22 12:30:00'),
(4, 8, 'SR-20240325-Y7Z8A9', 'Zainab Ali', 'zainab.ali@example.com', '+923034567890', 'Flat #205, Block H, Johar Town, Lahore', '2024-05-15', '09:00', 'Need power of attorney for overseas property management', 6000, 'PKR', 'cancelled', '2024-03-25 09:30:00'),
(1, 3, 'SR-20240328-B1C2D3', 'Ahmed Raza', 'ahmed.raza@example.com', '+923001234567', 'House #123, Street 7, DHA Phase 5, Lahore', '2024-05-18', '14:00', 'Tenancy agreement for upper portion', 8000, 'PKR', 'completed', '2024-03-28 14:45:00'),
(3, 4, 'SR-20240330-E4F5G6', 'Bilal Hussain', 'bilal.hussain@example.com', '+923023456789', 'Shop #12, Main Boulevard, Gulberg II, Lahore', '2024-05-20', '11:00', 'Commercial property valuation for insurance', 12000, 'PKR', 'confirmed', '2024-03-30 11:15:00'),
(4, 1, 'SR-20240402-H7I8J9', 'Zainab Ali', 'zainab.ali@example.com', '+923034567890', 'Flat #205, Block H, Johar Town, Lahore', '2024-05-25', '10:00', 'Title verification before purchase', 15000, 'PKR', 'pending', '2024-04-02 10:30:00');

-- ============================================================
-- SERVICE STATUS HISTORY
-- ============================================================
INSERT INTO service_status_history (request_id, status, notes, changed_by, created_at) VALUES
(1, 'pending', 'Service request submitted', 1, '2024-03-01 10:30:00'),
(1, 'confirmed', 'Request confirmed by admin', 6, '2024-03-01 12:00:00'),
(1, 'completed', 'Title verification completed successfully', 6, '2024-04-15 16:00:00'),
(2, 'pending', 'Service request submitted', 1, '2024-03-05 11:45:00'),
(2, 'confirmed', 'Request confirmed by admin', 6, '2024-03-05 14:00:00'),
(2, 'completed', 'Registration completed', 6, '2024-04-20 17:00:00'),
(3, 'pending', 'Service request submitted', 3, '2024-03-10 09:15:00'),
(3, 'confirmed', 'Request confirmed by admin', 6, '2024-03-10 11:00:00'),
(4, 'pending', 'Service request submitted', 3, '2024-03-12 14:30:00'),
(4, 'confirmed', 'Request confirmed by admin', 6, '2024-03-12 16:00:00'),
(4, 'completed', 'Tenancy agreement drafted and delivered', 6, '2024-04-28 15:00:00'),
(5, 'pending', 'Service request submitted', 4, '2024-03-15 13:45:00'),
(5, 'confirmed', 'Request confirmed by admin', 6, '2024-03-15 15:00:00'),
(5, 'completed', 'Valuation report delivered', 6, '2024-05-02 17:00:00'),
(6, 'pending', 'Service request submitted', 4, '2024-03-18 16:00:00'),
(7, 'pending', 'Service request submitted', 1, '2024-03-20 10:15:00'),
(7, 'confirmed', 'Request confirmed by admin', 6, '2024-03-20 12:00:00'),
(8, 'pending', 'Service request submitted', 3, '2024-03-22 12:30:00'),
(9, 'pending', 'Service request submitted', 4, '2024-03-25 09:30:00'),
(9, 'cancelled', 'Cancelled by user', 4, '2024-03-26 10:00:00'),
(10, 'pending', 'Service request submitted', 1, '2024-03-28 14:45:00'),
(10, 'confirmed', 'Request confirmed by admin', 6, '2024-03-28 16:00:00'),
(10, 'completed', 'Tenancy agreement completed', 6, '2024-05-18 15:00:00'),
(11, 'pending', 'Service request submitted', 3, '2024-03-30 11:15:00'),
(11, 'confirmed', 'Request confirmed by admin', 6, '2024-03-30 13:00:00'),
(12, 'pending', 'Service request submitted', 4, '2024-04-02 10:30:00');

-- ============================================================
-- LAWYERS (5 lawyers)
-- ============================================================
INSERT INTO lawyers (uuid, user_id, name, email, phone, bio, specialties, bar_council_id, years_experience, education, city, state, avatar_url, rating, consultation_fee, currency, is_verified, is_available, status, created_at) VALUES
('l0010001-1111-2222-3333-000000000001', NULL, 'Advocate Muhammad Imran', 'imran.lawyer@example.com', '+923331234567', 'Senior advocate with 15 years of experience in property law, real estate disputes, and contract law. Member of Lahore Bar Association.', 'Property Law, Real Estate Disputes, Contract Law, Land Revenue Matters', 'PBC/LH/2009/1234', 15, 'LLB from University of Punjab, LLM from University of London', 'Lahore', 'Punjab', 'https://i.pravatar.cc/150?img=11', 4.80, 5000, 'PKR', 1, 1, 'active', '2024-01-10 09:00:00'),
('l0010002-1111-2222-3333-000000000002', NULL, 'Advocate Sana Mahmood', 'sana.lawyer@example.com', '+923332345678', 'Specialized in family law, property inheritance, and tenancy disputes. Dedicated to providing clear and practical legal advice.', 'Family Law, Property Inheritance, Tenancy Disputes, Civil Litigation', 'PBC/LH/2012/5678', 12, 'LLB from University of the Punjab, LLM in Family Law', 'Lahore', 'Punjab', 'https://i.pravatar.cc/150?img=12', 4.90, 4000, 'PKR', 1, 1, 'active', '2024-01-12 11:00:00'),
('l0010003-1111-2222-3333-000000000003', NULL, 'Advocate Tariq Mehmood', 'tariq.lawyer@example.com', '+923333456789', 'Expert in corporate law, commercial property transactions, and business contracts. Former legal advisor to multinational companies.', 'Corporate Law, Commercial Property, Business Contracts, Mergers & Acquisitions', 'PBC/LH/2007/9012', 18, 'LLB from University of Cambridge, LLM from Harvard Law School', 'Lahore', 'Punjab', 'https://i.pravatar.cc/150?img=13', 4.70, 8000, 'PKR', 1, 1, 'active', '2024-01-15 14:00:00'),
('l0010004-1111-2222-3333-000000000004', NULL, 'Advocate Ayesha Siddiqui', 'ayesha.lawyer@example.com', '+923334567890', 'Dedicated advocate focusing on property documentation, stamp duty matters, and E-Stamp applications. Quick and efficient service.', 'Property Documentation, Stamp Duty, E-Stamp Applications, Revenue Law', 'PBC/LH/2015/3456', 9, 'LLB from University of Karachi, Diploma in Property Law', 'Lahore', 'Punjab', 'https://i.pravatar.cc/150?img=14', 4.60, 3000, 'PKR', 1, 1, 'active', '2024-01-18 10:00:00'),
('l0010005-1111-2222-3333-000000000005', NULL, 'Advocate Kamran Akhtar', 'kamran.lawyer@example.com', '+923335678901', 'Experienced litigation lawyer specializing in property disputes, encroachment cases, and real estate fraud prevention.', 'Property Disputes, Encroachment Cases, Real Estate Fraud, Criminal Litigation', 'PBC/LH/2010/7890', 14, 'LLB from University of Punjab, LLM in Criminal Law', 'Lahore', 'Punjab', 'https://i.pravatar.cc/150?img=15', 4.50, 6000, 'PKR', 1, 0, 'active', '2024-01-20 13:00:00');

-- ============================================================
-- LAWYER BOOKINGS
-- ============================================================
INSERT INTO lawyer_bookings (user_id, lawyer_id, reference_number, consultation_date, consultation_time, duration_minutes, consultation_type, client_name, client_email, client_phone, case_description, notes, fee, currency, rating, feedback, status, created_at) VALUES
(1, 1, 'LB-20240305-A1B2C3', '2024-04-10', '10:00', 60, 'in_person', 'Ahmed Raza', 'ahmed.raza@example.com', '+923001234567', 'Need legal advice on property title dispute for a house I am purchasing in DHA Phase 5. The seller has unclear documentation and I want to ensure my investment is protected.', 'Bring all property documents', 5000, 'PKR', 5, 'Excellent legal advice, very thorough and professional', 'completed', '2024-03-05 10:30:00'),
(1, 3, 'LB-20240308-D4E5F6', '2024-04-15', '14:00', 90, 'video', 'Ahmed Raza', 'ahmed.raza@example.com', '+923001234567', 'Need assistance with commercial property purchase agreement. Need review of terms and conditions before signing the deal for a shop on Main Boulevard.', NULL, 8000, 'PKR', NULL, NULL, 'confirmed', '2024-03-08 14:15:00'),
(3, 2, 'LB-20240312-G7H8I9', '2024-04-20', '11:00', 60, 'in_person', 'Bilal Hussain', 'bilal.hussain@example.com', '+923023456789', 'Inheritance dispute over family property. Need legal guidance on how to handle property division among siblings after fathers passing.', 'Bring death certificate and property papers', 4000, 'PKR', 5, 'Very helpful and empathetic, guided me through the entire process', 'completed', '2024-03-12 11:30:00'),
(3, 4, 'LB-20240315-J1K2L3', '2024-04-25', '09:00', 60, 'phone', 'Bilal Hussain', 'bilal.hussain@example.com', '+923023456789', 'Need help with E-Stamp application for a property sale. Want to understand the process and required documentation before submitting the application.', NULL, 3000, 'PKR', 4, 'Good service, explained the process clearly', 'completed', '2024-03-15 09:45:00'),
(4, 1, 'LB-20240318-M4N5O6', '2024-04-28', '13:00', 60, 'in_person', 'Zainab Ali', 'zainab.ali@example.com', '+923034567890', 'Boundary dispute with neighbor regarding wall construction. Need legal advice on property rights and possible legal action.', NULL, 5000, 'PKR', NULL, NULL, 'pending', '2024-03-18 13:15:00'),
(4, 5, 'LB-20240322-P7Q8R9', '2024-05-02', '15:00', 120, 'in_person', 'Zainab Ali', 'zainab.ali@example.com', '+923034567890', 'Suspected real estate fraud in a property transaction. Need immediate legal consultation to understand options for recovery and legal action against the seller.', 'Urgent matter, bring all correspondence', 6000, 'PKR', NULL, NULL, 'confirmed', '2024-03-22 15:30:00'),
(1, 2, 'LB-20240325-S1T2U3', '2024-05-05', '10:00', 60, 'video', 'Ahmed Raza', 'ahmed.raza@example.com', '+923001234567', 'Tenancy agreement review for renting out upper portion of my house. Need to ensure the agreement protects my rights as a landlord.', NULL, 4000, 'PKR', 5, 'Very detailed review, caught several important clauses', 'completed', '2024-03-25 10:00:00'),
(3, 3, 'LB-20240328-V4W5X6', '2024-05-08', '14:00', 90, 'in_person', 'Bilal Hussain', 'bilal.hussain@example.com', '+923023456789', 'Need corporate legal advice for setting up a business in a commercial property. Need guidance on legal structure and property lease agreements.', NULL, 8000, 'PKR', NULL, NULL, 'pending', '2024-03-28 14:30:00');

-- ============================================================
-- ESTAMP APPLICATIONS (5 applications)
-- ============================================================
INSERT INTO estamp_applications (user_id, reference_number, applicant_name, applicant_cnic, applicant_email, applicant_phone, applicant_address, document_type, property_address, property_value, stamp_duty_amount, description, status, submitted_at, processed_at, approved_at, completed_at, rejection_reason, created_at) VALUES
(1, 'ES-20240301-A1B2C3', 'Ahmed Raza', '3520212345671', 'ahmed.raza@example.com', '+923001234567', 'House #123, Street 7, DHA Phase 5, Lahore', 'property_sale', 'House #123, Street 7, DHA Phase 5, Lahore', 18500000, 555000, 'E-Stamp application for property sale transaction. Property is a 5 marla house in DHA Phase 5.', 'completed', '2024-03-01 10:00:00', '2024-03-02 09:00:00', '2024-03-03 14:00:00', '2024-03-05 16:00:00', NULL, '2024-03-01 10:00:00'),
(3, 'ES-20240310-D4E5F6', 'Bilal Hussain', '3520298765432', 'bilal.hussain@example.com', '+923023456789', 'Shop #12, Main Boulevard, Gulberg II, Lahore', 'property_sale', 'Shop #12, Main Boulevard, Gulberg II, Lahore', 32000000, 960000, 'E-Stamp for commercial property sale. Shop located on Main Boulevard Gulberg.', 'completed', '2024-03-10 11:00:00', '2024-03-11 10:00:00', '2024-03-12 15:00:00', '2024-03-14 17:00:00', NULL, '2024-03-10 11:00:00'),
(4, 'ES-20240315-G7H8I9', 'Zainab Ali', '3520234567890', 'zainab.ali@example.com', '+923034567890', 'Flat #205, Block H, Johar Town, Lahore', 'property_rent', 'Flat #205, Block H, Johar Town, Lahore', 540000, 21600, 'E-Stamp for tenancy agreement. Annual rent Rs. 540,000 for 2 bedroom apartment in Johar Town.', 'approved', '2024-03-15 13:00:00', '2024-03-16 11:00:00', '2024-03-17 14:00:00', NULL, NULL, '2024-03-15 13:00:00'),
(1, 'ES-20240320-J1K2L3', 'Ahmed Raza', '3520212345671', 'ahmed.raza@example.com', '+923001234567', 'House #123, Street 7, DHA Phase 5, Lahore', 'affidavit', 'House #123, Street 7, DHA Phase 5, Lahore', 0, 1000, 'Affidavit for change of address verification. Required for utility connection transfer.', 'under_review', '2024-03-20 15:00:00', '2024-03-21 09:00:00', NULL, NULL, NULL, '2024-03-20 15:00:00'),
(3, 'ES-20240325-M4N5O6', 'Bilal Hussain', '3520298765432', 'bilal.hussain@example.com', '+923023456789', 'Plot #789, Sector A, DHA City, Lahore', 'power_of_attorney', 'Plot #789, Sector A, DHA City, Lahore', 35000000, 1050000, 'Power of attorney for property management. Authorizing my brother to manage property on my behalf while I am abroad.', 'submitted', '2024-03-25 12:00:00', NULL, NULL, NULL, NULL, '2024-03-25 12:00:00');

-- ============================================================
-- ESTAMP STATUS HISTORY
-- ============================================================
INSERT INTO estamp_status_history (application_id, status, notes, changed_by, created_at) VALUES
(1, 'submitted', 'Application submitted by user', 1, '2024-03-01 10:00:00'),
(1, 'under_review', 'Application is under review', 6, '2024-03-02 09:00:00'),
(1, 'approved', 'Application approved. Stamp duty: Rs. 555,000', 6, '2024-03-03 14:00:00'),
(1, 'completed', 'E-Stamp certificate issued', 6, '2024-03-05 16:00:00'),
(2, 'submitted', 'Application submitted by user', 3, '2024-03-10 11:00:00'),
(2, 'under_review', 'Application is under review', 6, '2024-03-11 10:00:00'),
(2, 'approved', 'Application approved. Stamp duty: Rs. 960,000', 6, '2024-03-12 15:00:00'),
(2, 'completed', 'E-Stamp certificate issued', 6, '2024-03-14 17:00:00'),
(3, 'submitted', 'Application submitted by user', 4, '2024-03-15 13:00:00'),
(3, 'under_review', 'Application is under review', 6, '2024-03-16 11:00:00'),
(3, 'approved', 'Application approved. Stamp duty: Rs. 21,600', 6, '2024-03-17 14:00:00'),
(4, 'submitted', 'Application submitted by user', 1, '2024-03-20 15:00:00'),
(4, 'under_review', 'Application is under review', 6, '2024-03-21 09:00:00'),
(5, 'submitted', 'Application submitted by user', 3, '2024-03-25 12:00:00');

-- ============================================================
-- ESTAMP DOCUMENTS
-- ============================================================
INSERT INTO estamp_documents (application_id, document_type, file_path, original_filename, file_size, mime_type, uploaded_by, uploaded_at, verified_at) VALUES
(1, 'cnic_copy', 'estamp/1/cnic_ahmed.pdf', 'CNIC_Ahmed_Raza.pdf', 245678, 'application/pdf', 1, '2024-03-01 10:05:00', '2024-03-02 09:30:00'),
(1, 'property_papers', 'estamp/1/property_papers.pdf', 'Property_Papers_DHA5.pdf', 1456789, 'application/pdf', 1, '2024-03-01 10:10:00', '2024-03-02 09:35:00'),
(1, 'sale_deed', 'estamp/1/sale_deed.pdf', 'Sale_Deed_Draft.pdf', 567890, 'application/pdf', 1, '2024-03-01 10:15:00', '2024-03-02 09:40:00'),
(2, 'cnic_copy', 'estamp/2/cnic_bilal.pdf', 'CNIC_Bilal_Hussain.pdf', 234567, 'application/pdf', 3, '2024-03-10 11:05:00', '2024-03-11 10:30:00'),
(2, 'property_papers', 'estamp/2/commercial_papers.pdf', 'Commercial_Property_Papers.pdf', 2345678, 'application/pdf', 3, '2024-03-10 11:10:00', '2024-03-11 10:35:00'),
(3, 'cnic_copy', 'estamp/3/cnic_zainab.pdf', 'CNIC_Zainab_Ali.pdf', 256789, 'application/pdf', 4, '2024-03-15 13:05:00', '2024-03-16 11:30:00'),
(3, 'rent_agreement', 'estamp/3/rent_agreement.pdf', 'Tenancy_Agreement_Draft.pdf', 345678, 'application/pdf', 4, '2024-03-15 13:10:00', '2024-03-16 11:35:00'),
(4, 'cnic_copy', 'estamp/4/cnic_ahmed2.pdf', 'CNIC_Ahmed_Raza.pdf', 245678, 'application/pdf', 1, '2024-03-20 15:05:00', NULL),
(5, 'cnic_copy', 'estamp/5/cnic_bilal2.pdf', 'CNIC_Bilal_Hussain.pdf', 234567, 'application/pdf', 3, '2024-03-25 12:05:00', NULL),
(5, 'property_papers', 'estamp/5/dha_city_papers.pdf', 'DHA_City_Plot_Papers.pdf', 1567890, 'application/pdf', 3, '2024-03-25 12:10:00', NULL);

-- ============================================================
-- PROPERTY INQUIRIES
-- ============================================================
INSERT INTO property_inquiries (property_id, user_id, name, email, phone, message, status, created_at) VALUES
(1, 3, 'Bilal Hussain', 'bilal.hussain@example.com', '+923023456789', 'I am interested in this property. Is the price negotiable? Can I schedule a visit this weekend?', 'responded', '2024-03-05 14:00:00'),
(1, 4, 'Zainab Ali', 'zainab.ali@example.com', '+923034567890', 'What are the annual maintenance charges? Are utilities included in the price?', 'pending', '2024-03-08 11:30:00'),
(2, 1, 'Ahmed Raza', 'ahmed.raza@example.com', '+923001234567', 'Is the villa available for viewing? I am very interested and would like to schedule a visit.', 'responded', '2024-03-10 10:00:00'),
(3, 4, 'Zainab Ali', 'zainab.ali@example.com', '+923034567890', 'Is the apartment still available? What are the monthly maintenance charges?', 'pending', '2024-03-12 15:30:00'),
(8, 1, 'Ahmed Raza', 'ahmed.raza@example.com', '+923001234567', 'I am interested in the farmhouse. Can you share more details about the amenities and surrounding area?', 'responded', '2024-03-15 12:00:00'),
(11, 3, 'Bilal Hussain', 'bilal.hussain@example.com', '+923023456789', 'What is the total area of the penthouse? Is there a maintenance fee?', 'pending', '2024-04-02 14:30:00'),
(13, 4, 'Zainab Ali', 'zainab.ali@example.com', '+923034567890', 'Is the house ready for possession? Any pending development charges?', 'responded', '2024-04-06 11:00:00'),
(18, 1, 'Ahmed Raza', 'ahmed.raza@example.com', '+923001234567', 'Interested in the heritage house. Is renovation allowed? What are the zoning restrictions?', 'pending', '2024-04-20 13:45:00');

-- ============================================================
-- SAVED PROPERTIES
-- ============================================================
INSERT INTO saved_properties (user_id, property_id, created_at) VALUES
(1, 2, '2024-03-06 10:00:00'),
(1, 8, '2024-03-16 12:00:00'),
(1, 11, '2024-04-02 14:00:00'),
(1, 18, '2024-04-19 10:00:00'),
(3, 1, '2024-03-06 15:00:00'),
(3, 4, '2024-03-13 10:30:00'),
(3, 13, '2024-04-07 12:00:00'),
(4, 3, '2024-03-13 16:00:00'),
(4, 5, '2024-03-16 10:00:00'),
(4, 14, '2024-04-09 11:00:00'),
(4, 19, '2024-04-21 13:00:00');

-- ============================================================
-- VERIFICATION REQUESTS
-- ============================================================
INSERT INTO verification_requests (user_id, property_id, request_type, status, submitted_at, reviewed_at, reviewed_by, notes, created_at) VALUES
(2, 1, 'property', 'approved', '2024-03-01 10:00:00', '2024-03-01 14:00:00', 6, 'Property verified and approved', '2024-03-01 10:00:00'),
(2, 2, 'property', 'approved', '2024-03-05 11:30:00', '2024-03-05 16:00:00', 6, 'Property verified and approved', '2024-03-05 11:30:00'),
(2, 3, 'property', 'approved', '2024-03-10 09:15:00', '2024-03-10 14:00:00', 6, 'Property verified and approved', '2024-03-10 09:15:00'),
(2, 4, 'property', 'approved', '2024-03-12 14:00:00', '2024-03-12 17:00:00', 6, 'Property verified and approved', '2024-03-12 14:00:00'),
(5, 6, 'property', 'approved', '2024-03-18 10:30:00', '2024-03-18 15:00:00', 6, 'Property verified and approved', '2024-03-18 10:30:00'),
(5, 7, 'property', 'approved', '2024-03-20 15:20:00', '2024-03-20 18:00:00', 6, 'Property verified and approved', '2024-03-20 15:20:00'),
(5, 8, 'property', 'approved', '2024-03-22 11:00:00', '2024-03-22 16:00:00', 6, 'Property verified and approved', '2024-03-22 11:00:00'),
(2, 11, 'property', 'approved', '2024-04-01 12:00:00', '2024-04-01 16:00:00', 6, 'Property verified and approved', '2024-04-01 12:00:00'),
(5, 18, 'property', 'approved', '2024-04-18 10:00:00', '2024-04-18 15:00:00', 6, 'Property verified and approved', '2024-04-18 10:00:00'),
(2, 20, 'property', 'pending', '2024-04-22 14:00:00', NULL, NULL, NULL, '2024-04-22 14:00:00');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at) VALUES
(1, 'Property Inquiry Response', 'Your inquiry for Modern 5 Marla House in DHA Phase 5 has been responded to.', 'info', '/property/1', 1, '2024-03-05 16:00:00'),
(1, 'E-Stamp Application Approved', 'Your E-Stamp application (Ref: ES-20240301-A1B2C3) has been approved.', 'success', '/estamp/status?reference_number=ES-20240301-A1B2C3', 1, '2024-03-03 14:00:00'),
(1, 'E-Stamp Certificate Ready', 'Your E-Stamp certificate is ready for download.', 'success', '/estamp/status?reference_number=ES-20240301-A1B2C3', 1, '2024-03-05 16:00:00'),
(1, 'Service Request Completed', 'Your property title verification service has been completed.', 'success', '/associates/status?reference_number=SR-20240301-A1B2C3', 1, '2024-04-15 16:00:00'),
(1, 'Lawyer Consultation Completed', 'Your consultation with Advocate Muhammad Imran has been completed.', 'info', '/lawyer/bookings', 1, '2024-04-10 11:00:00'),
(2, 'New Property Inquiry', 'You have received a new inquiry for Modern 5 Marla House in DHA Phase 5.', 'info', '/property/1', 1, '2024-03-05 14:00:00'),
(2, 'Property Approved', 'Your property listing "Modern 5 Marla House in DHA Phase 5" has been approved.', 'success', '/property/1', 1, '2024-03-01 14:00:00'),
(3, 'E-Stamp Application Approved', 'Your E-Stamp application (Ref: ES-20240310-D4E5F6) has been approved.', 'success', '/estamp/status?reference_number=ES-20240310-D4E5F6', 1, '2024-03-12 15:00:00'),
(3, 'Service Request Confirmed', 'Your title verification service has been confirmed.', 'info', '/associates/status?reference_number=SR-20240310-G7H8I9', 0, '2024-03-10 11:00:00'),
(4, 'E-Stamp Under Review', 'Your E-Stamp application (Ref: ES-20240315-G7H8I9) is now under review.', 'info', '/estamp/status?reference_number=ES-20240315-G7H8I9', 0, '2024-03-16 11:00:00'),
(4, 'Lawyer Booking Confirmed', 'Your consultation with Advocate Kamran Akhtar has been confirmed.', 'info', '/lawyer/bookings', 0, '2024-03-22 16:00:00'),
(6, 'New E-Stamp Application', 'New E-Stamp application submitted by Bilal Hussain (Ref: ES-20240325-M4N5O6).', 'info', '/admin/estamp', 0, '2024-03-25 12:00:00'),
(6, 'New Service Request', 'New service request for Property Title Verification from Zainab Ali.', 'info', '/admin/services', 0, '2024-04-02 10:30:00'),
(6, 'New Property Pending Approval', 'New property "Showroom on Ring Road" is pending approval.', 'warning', '/admin/properties', 0, '2024-04-22 14:00:00');

-- ============================================================
-- MESSAGES
-- ============================================================
INSERT INTO messages (sender_id, receiver_id, subject, body, is_read, read_at, created_at) VALUES
(3, 2, 'Property Inquiry - DHA Phase 5 House', 'Hi, I am interested in the 5 marla house in DHA Phase 5. Is it still available? Can we schedule a visit?', 1, '2024-03-05 15:00:00', '2024-03-05 14:00:00'),
(2, 3, 'Re: Property Inquiry - DHA Phase 5 House', 'Hello, yes the property is still available. You can visit this Saturday at 11 AM. Please bring your CNIC.', 1, '2024-03-05 16:00:00', '2024-03-05 15:00:00'),
(4, 2, 'Apartment in Gulberg', 'Hi Fatima, I saw the furnished apartment in Gulberg. Is the price negotiable?', 1, '2024-03-12 16:00:00', '2024-03-12 15:30:00'),
(2, 4, 'Re: Apartment in Gulberg', 'Hello Zainab, the price is slightly negotiable for serious buyers. Would you like to schedule a visit?', 0, NULL, '2024-03-12 16:30:00'),
(1, 5, 'Agricultural Land in Kasur', 'Hi Usman, I am interested in the 5 acre agricultural land. Can you share more details about water access?', 1, '2024-03-19 10:00:00', '2024-03-18 18:00:00'),
(5, 1, 'Re: Agricultural Land in Kasur', 'Hello Ahmed, yes the land has canal water access. It is also close to the main road. Let me know if you want to visit.', 0, NULL, '2024-03-19 09:00:00');

-- ============================================================
-- ADMIN LOGS
-- ============================================================
INSERT INTO admin_logs (user_id, action, entity, entity_id, ip_address, user_agent, created_at) VALUES
(6, 'User logged in', 'users', 6, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-03-01 08:00:00'),
(6, 'Approved property', 'properties', 1, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-03-01 14:00:00'),
(6, 'Approved property', 'properties', 2, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-03-05 16:00:00'),
(6, 'Approved E-Stamp application', 'estamp', 1, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-03-03 14:00:00'),
(6, 'Completed E-Stamp application', 'estamp', 1, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-03-05 16:00:00'),
(6, 'Approved E-Stamp application', 'estamp', 2, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-03-12 15:00:00'),
(6, 'Completed E-Stamp application', 'estamp', 2, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-03-14 17:00:00'),
(6, 'Viewed dashboard', 'dashboard', NULL, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-04-01 09:00:00'),
(6, 'Confirmed service request', 'services', 3, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-03-10 11:00:00'),
(6, 'Verified lawyer', 'lawyers', 1, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-01-10 10:00:00'),
(6, 'Verified lawyer', 'lawyers', 2, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-01-12 12:00:00'),
(6, 'Verified lawyer', 'lawyers', 3, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-01-15 15:00:00'),
(6, 'Verified lawyer', 'lawyers', 4, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-01-18 11:00:00'),
(6, 'Verified lawyer', 'lawyers', 5, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-01-20 14:00:00');

-- ============================================================
-- END OF SCHEMA AND SAMPLE DATA
-- ============================================================
-- 
-- Demo Login Credentials:
-- 
-- Regular User:
--   Email: ahmed.raza@example.com
--   Password: Test@1234
-- 
-- Agent:
--   Email: fatima.khan@example.com
--   Password: Test@1234
-- 
-- Admin:
--   Email: admin@alnajaf-estate.com
--   Password: Test@1234
-- 
-- ============================================================
