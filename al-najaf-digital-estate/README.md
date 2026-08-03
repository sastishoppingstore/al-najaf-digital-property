# Al Najaf Digital Estate - REST API Backend

A complete PHP 8.2+ REST API backend for a real estate marketplace + legal services platform. Features property listings, E-Stamp applications, lawyer consultations, associate services, and a full admin panel.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [StackCP Deployment Guide](#stackcp-deployment-guide)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Security](#security)
- [Rate Limiting](#rate-limiting)
- [File Uploads](#file-uploads)
- [CORS Configuration](#cors-configuration)
- [Demo Credentials](#demo-credentials)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Al Najaf Digital Estate** is a comprehensive platform that combines:
1. **Real Estate Marketplace** - Browse, search, and list properties for sale or rent
2. **Legal Services** - Book legal consultations with verified lawyers
3. **E-Stamp Applications** - Apply for electronic stamp duty certificates
4. **Associate Services** - Book property-related services (title verification, registration, etc.)
5. **Admin Dashboard** - Full management panel for administrators

---

## Tech Stack

| Component         | Technology                          |
|-------------------|-------------------------------------|
| Language           | PHP 8.2+                           |
| Database           | MySQL 8.0                          |
| Database Access    | PDO with prepared statements only   |
| Authentication    | JWT (HS256) - custom implementation |
| Password Hashing  | Bcrypt (cost 12)                    |
| Email              | Raw SMTP (no external library)      |
| Web Server         | Apache (with mod_rewrite)           |
| Hosting            | StackCP                            |

---

## Features

### User Authentication
- Email/password registration with Bcrypt hashing
- Email OTP verification (6-digit code, 10-minute expiry)
- JWT-based authentication (access + refresh tokens)
- Password reset via email link
- Profile management (view/update)
- Role-based access control (user, agent, lawyer, admin, super_admin)

### Property Management
- List properties with filters (category, city, price, type, bedrooms, etc.)
- Property detail view with images and similar properties
- Create property listings (requires user/agent role)
- Property categories management
- Property inquiries
- Save/bookmark properties

### E-Stamp Applications
- Submit E-Stamp applications with document type selection
- Upload supporting documents (PDF, JPG, PNG)
- Track application status (submitted → under_review → approved → completed)
- Status history tracking

### Associate Services
- Browse available legal/property services
- Book services with preferred date/time
- Track booking status with history
- Service categories (Legal Documentation, Survey & Valuation, Tax & Finance, Dispute Resolution)

### Lawyer Consultations
- Browse verified lawyers with filters (city, specialty, search)
- View lawyer profiles with reviews and availability
- Book consultations (in-person, video, phone)
- Conflict detection (prevents double-booking)

### Admin Panel
- Dashboard with statistics and charts
- Property management (approve/reject/feature/delete)
- E-Stamp application processing
- Service request management
- Lawyer verification and management
- User management (status/role updates)

---

## Project Structure

```
project/
├── public_html/
│   └── api/
│       ├── .htaccess              # Apache rewrite + CORS + security headers
│       ├── config.php             # DB + SMTP + JWT + app configuration
│       ├── index.php              # Front controller with routing
│       ├── auth/
│       │   ├── register.php       # POST - User registration
│       │   ├── login.php          # POST - User login
│       │   ├── verify-otp.php     # POST - OTP verification
│       │   ├── forgot-password.php # POST - Request reset link
│       │   ├── reset-password.php # POST - Reset password
│       │   └── profile.php        # GET/PUT - View/update profile
│       ├── property/
│       │   ├── list.php           # GET - List properties with filters
│       │   ├── detail.php         # GET - Property details
│       │   ├── create.php         # POST - Create property listing
│       │   ├── categories.php     # GET - List categories
│       │   ├── inquiry.php        # POST - Submit property inquiry
│       │   └── save.php           # POST - Save/unsave property
│       ├── associates/
│       │   ├── services.php       # GET - List services
│       │   ├── book.php           # POST - Book a service
│       │   └── status.php        # GET - Check booking status
│       ├── estamp/
│       │   ├── apply.php          # POST - Submit E-Stamp application
│       │   ├── status.php         # GET - Check application status
│       │   └── upload.php         # POST - Upload supporting documents
│       ├── lawyer/
│       │   ├── list.php           # GET - List lawyers
│       │   ├── detail.php         # GET - Lawyer details
│       │   └── book.php           # POST - Book consultation
│       ├── admin/
│       │   ├── dashboard.php      # GET - Dashboard statistics
│       │   ├── properties.php     # GET/PUT/DELETE - Manage properties
│       │   ├── estamp.php         # GET/PUT - Manage E-Stamp applications
│       │   ├── services.php       # GET/PUT/POST - Manage services
│       │   ├── lawyers.php        # GET/PUT/POST - Manage lawyers
│       │   └── users.php          # GET/PUT - Manage users
│       ├── uploads/
│       │   └── .htaccess          # Deny direct access to uploads
│       └── utils/
│           ├── db.php             # Database singleton + helper methods
│           ├── response.php      # JSON response helpers + input parsing
│           ├── jwt.php            # JWT encode/decode (HS256)
│           ├── auth.php           # Auth middleware + rate limiting + validation
│           └── email.php          # SMTP email sending + templates
├── database/
│   └── schema.sql                # Complete MySQL schema + sample data
└── README.md                     # This file
```

---

## StackCP Deployment Guide

### Step 1: Access Your StackCP Account

1. Log in to your StackCP control panel at `https://your-stackcp-url.com`
2. Navigate to your hosting account

### Step 2: Create the MySQL Database

1. In StackCP, go to **Databases** → **MySQL Databases**
2. Click **Create New Database**
3. Fill in:
   - **Database Name**: `alnajaf_estate` (or your preferred name)
   - **Database User**: `alnajaf_user` (or your preferred username)
   - **Password**: Generate a strong password and save it
4. Click **Create**
5. Note down the following:
   - Database Host (usually `localhost`)
   - Database Name
   - Database Username
   - Database Password

### Step 3: Import the Database Schema

1. In StackCP, go to **Databases** → **phpMyAdmin**
2. Select your newly created database from the left sidebar
3. Click the **Import** tab
4. Click **Choose File** and select `database/schema.sql` from this project
5. Set Character set to `utf-8` (or `utf8mb4`)
6. Click **Go** to import
7. Verify that all 22 tables were created successfully

### Step 4: Upload Files to StackCP

#### Option A: Via File Manager
1. In StackCP, go to **Files** → **File Manager**
2. Navigate to your `public_html` directory
3. Create a folder named `api` inside `public_html`
4. Upload all files from the `public_html/api/` directory into this folder
5. Ensure the directory structure matches the structure above

#### Option B: Via FTP/SFTP
1. Connect to your StackCP account via FTP/SFTP using:
   - **Host**: Your domain or server IP
   - **Username**: Your StackCP FTP username
   - **Password**: Your StackCP FTP password
   - **Port**: 21 (FTP) or 22 (SFTP)
2. Navigate to `public_html/`
3. Upload the entire `api/` directory

### Step 5: Configure the Application

1. In the File Manager, navigate to `public_html/api/`
2. Right-click `config.php` and select **Edit**
3. Replace all `YOUR_*` placeholder values:

```php
// Database Configuration
define('DB_HOST', 'localhost');           // Usually localhost on StackCP
define('DB_PORT', 3306);
define('DB_NAME', 'alnajaf_estate');      // Your database name
define('DB_USER', 'alnajaf_user');        // Your database username
define('DB_PASS', 'your_secure_password'); // Your database password

// JWT Secret - generate a 64+ character random string
define('JWT_SECRET', 'your_64_char_random_secret_key_here_change_this');

// SMTP Configuration
define('SMTP_HOST', 'smtp.your-email-provider.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'noreply@yourdomain.com');
define('SMTP_PASS', 'your_smtp_password');
define('SMTP_FROM_EMAIL', 'noreply@yourdomain.com');

// App URL
define('APP_URL', 'https://yourdomain.com');
```

4. Save the file

### Step 6: Set Up the Uploads Directory

1. Navigate to `public_html/api/uploads/`
2. Ensure the directory has write permissions:
   - Right-click the `uploads` folder
   - Set permissions to **755** (or **775** if needed)
3. Create a subdirectory named `estamp` for E-Stamp document uploads
4. Set the same permissions on the `estamp` subdirectory

### Step 7: Enable Apache Modules

The following Apache modules must be enabled (usually enabled by default on StackCP):
- `mod_rewrite` - For URL rewriting
- `mod_headers` - For CORS and security headers
- `mod_deflate` - For compression
- `mod_expires` - For cache control

If any module is not available, contact StackCP support.

### Step 8: Verify the Installation

1. Open your browser and navigate to: `https://yourdomain.com/api/`
2. You should see a JSON response with API information and available endpoints
3. Test an endpoint: `https://yourdomain.com/api/property/list`
4. You should receive a JSON response with property data

### Step 9: Configure SSL/HTTPS

1. In StackCP, go to **SSL/TLS** → **SSL Certificates**
2. Enable Let's Encrypt SSL for your domain
3. Force HTTPS redirect (usually available in StackCP settings)

### Step 10: Set Up Error Logging

1. The application logs errors to `public_html/api/uploads/error.log`
2. Ensure this file is writable
3. For production, set `APP_DEBUG` to `false` in `config.php`

---

## Configuration

All configuration is in `public_html/api/config.php`. Key settings:

### Environment
```php
define('APP_ENV', 'production');  // 'production' or 'development'
define('APP_DEBUG', false);       // Set true for verbose errors
```

### Database
```php
define('DB_HOST', 'YOUR_DB_HOST');
define('DB_PORT', 3306);
define('DB_NAME', 'YOUR_DB_NAME');
define('DB_USER', 'YOUR_DB_USER');
define('DB_PASS', 'YOUR_DB_PASSWORD');
define('DB_CHARSET', 'utf8mb4');
```

### JWT
```php
define('JWT_SECRET', 'YOUR_JWT_SECRET_KEY_CHANGE_THIS'); // 64+ char random string
define('JWT_ACCESS_TTL', 3600);     // 1 hour
define('JWT_REFRESH_TTL', 1209600); // 14 days
```

### SMTP
```php
define('SMTP_HOST', 'YOUR_SMTP_HOST');
define('SMTP_PORT', 587);
define('SMTP_USER', 'YOUR_SMTP_USER');
define('SMTP_PASS', 'YOUR_SMTP_PASSWORD');
define('SMTP_FROM_EMAIL', 'YOUR_FROM_EMAIL');
define('SMTP_ENCRYPTION', 'tls'); // 'tls', 'ssl', or ''
```

### CORS Whitelist
```php
define('CORS_ALLOWED_ORIGINS', [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:3000',  // Development
]);
```

### File Uploads
```php
define('UPLOAD_MAX_SIZE', 5 * 1024 * 1024); // 5 MB
define('UPLOAD_ALLOWED_EXTENSIONS', ['pdf', 'jpg', 'jpeg', 'png']);
```

### Rate Limiting
```php
define('RATE_LIMIT_ENABLED', true);
define('RATE_LIMIT_WINDOW', 60);          // 60 second window
define('RATE_LIMIT_MAX_REQUESTS', 60);    // 60 requests per window
define('RATE_LIMIT_AUTH_MAX', 10);         // 10 auth requests per window
```

---

## Database Setup

### Importing the Schema

1. Access phpMyAdmin via StackCP
2. Select your database
3. Go to **Import** tab
4. Upload `database/schema.sql`
5. Click **Go**

### Tables Created (22 total)

| Table                      | Description                           |
|---------------------------|---------------------------------------|
| `users`                   | User accounts with roles             |
| `roles`                   | Role definitions                     |
| `permissions`             | Role-based permissions               |
| `password_resets`         | Password reset tokens                |
| `email_otps`              | Email verification OTP codes         |
| `property_categories`     | Property category types              |
| `properties`              | Property listings                    |
| `property_images`         | Images for properties                |
| `property_inquiries`      | Inquiries on properties              |
| `saved_properties`        | User's bookmarked properties         |
| `verification_requests`   | Property/agent verification requests |
| `estamp_applications`     | E-Stamp certificate applications     |
| `estamp_documents`        | Supporting documents for E-Stamp     |
| `estamp_status_history`   | Status change history for E-Stamp    |
| `services`                | Available associate services         |
| `service_requests`        | Service booking requests             |
| `service_status_history`  | Status change history for services   |
| `lawyers`                 | Lawyer profiles                      |
| `lawyer_bookings`          | Lawyer consultation bookings         |
| `notifications`           | User notifications                   |
| `messages`                | User-to-user messages                |
| `admin_logs`              | Admin action audit logs              |

### Sample Data Included

- **6 users** (4 regular users, 2 agents, 1 super admin)
- **20 properties** (across 5 categories)
- **8 services** (across 4 categories)
- **12 service requests** (with 3 bookings per service)
- **5 lawyers** (all verified)
- **8 lawyer bookings**
- **5 E-Stamp applications** (with documents and status history)
- **8 property inquiries**
- **11 saved properties**
- **10 verification requests**
- **14 notifications**
- **6 messages**
- **14 admin logs**

---

## API Endpoints

### Authentication

| Method | Endpoint                        | Description              | Auth Required |
|--------|---------------------------------|--------------------------|---------------|
| POST   | `/api/auth/register`            | Register new user        | No            |
| POST   | `/api/auth/login`               | Login user               | No            |
| POST   | `/api/auth/verify-otp`          | Verify email OTP         | No            |
| POST   | `/api/auth/forgot-password`     | Request password reset   | No            |
| POST   | `/api/auth/reset-password`      | Reset password           | No            |
| GET    | `/api/auth/profile`             | Get user profile         | Yes           |
| PUT    | `/api/auth/profile`             | Update user profile      | Yes           |

### Properties

| Method | Endpoint                        | Description              | Auth Required |
|--------|---------------------------------|--------------------------|---------------|
| GET    | `/api/property/list`            | List properties          | No            |
| GET    | `/api/property/detail`          | Property details         | No            |
| POST   | `/api/property/create`          | Create property          | user/agent    |
| GET    | `/api/property/categories`      | List categories          | No            |
| POST   | `/api/property/inquiry`         | Submit inquiry           | No            |
| POST   | `/api/property/save`            | Save/unsave property     | Yes           |

### Associate Services

| Method | Endpoint                        | Description              | Auth Required |
|--------|---------------------------------|--------------------------|---------------|
| GET    | `/api/associates/services`      | List services            | No            |
| POST   | `/api/associates/book`          | Book a service           | Yes           |
| GET    | `/api/associates/status`        | Check booking status     | Yes           |

### E-Stamp

| Method | Endpoint                        | Description              | Auth Required |
|--------|---------------------------------|--------------------------|---------------|
| POST   | `/api/estamp/apply`             | Submit application       | Yes           |
| GET    | `/api/estamp/status`            | Check application status | Yes           |
| POST   | `/api/estamp/upload`            | Upload documents         | Yes           |

### Lawyers

| Method | Endpoint                        | Description              | Auth Required |
|--------|---------------------------------|--------------------------|---------------|
| GET    | `/api/lawyer/list`              | List lawyers             | No            |
| GET    | `/api/lawyer/detail`            | Lawyer details           | No            |
| POST   | `/api/lawyer/book`              | Book consultation        | Yes           |

### Admin

| Method | Endpoint                        | Description              | Auth Required |
|--------|---------------------------------|--------------------------|---------------|
| GET    | `/api/admin/dashboard`          | Dashboard statistics     | admin         |
| GET    | `/api/admin/properties`         | List all properties      | admin         |
| PUT    | `/api/admin/properties`         | Update property status   | admin         |
| DELETE | `/api/admin/properties`         | Delete property          | admin         |
| GET    | `/api/admin/estamp`             | List E-Stamp apps        | admin         |
| PUT    | `/api/admin/estamp`             | Update E-Stamp status    | admin         |
| GET    | `/api/admin/services`           | List service requests    | admin         |
| PUT    | `/api/admin/services`           | Update request status    | admin         |
| POST   | `/api/admin/services`           | Create new service       | admin         |
| GET    | `/api/admin/lawyers`            | List all lawyers         | admin         |
| PUT    | `/api/admin/lawyers`            | Update lawyer            | admin         |
| POST   | `/api/admin/lawyers`            | Add new lawyer           | admin         |
| GET    | `/api/admin/users`              | List all users           | admin         |
| PUT    | `/api/admin/users`              | Update user              | admin         |

---

## Authentication

### JWT Token Structure

All authenticated requests require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Types

1. **Access Token** - Short-lived (1 hour), used for API requests
2. **Refresh Token** - Long-lived (14 days), used to obtain new access tokens

### Getting a Token

```bash
# Register
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"+923001234567","password":"Test@1234"}'

# Verify OTP
curl -X POST https://yourdomain.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","otp":"123456"}'

# Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Test@1234"}'
```

### Using the Token

```bash
curl -X GET https://yourdomain.com/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Security

### Password Security
- Passwords are hashed using **Bcrypt** with cost factor 12
- Password validation requires: minimum 8 characters, 1 uppercase, 1 lowercase, 1 number
- Password reset tokens are hashed and expire after 1 hour

### SQL Injection Prevention
- All database queries use **PDO prepared statements** exclusively
- No raw SQL string concatenation with user input
- Parameterized queries throughout

### XSS Prevention
- All user input is sanitized using `htmlspecialchars()` and `strip_tags()`
- Output is properly encoded

### CSRF Protection
- API uses JWT Bearer tokens (not cookies) - CSRF is inherently mitigated
- CORS whitelist restricts which origins can make requests

### Security Headers
The `.htaccess` file sets:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` for geolocation, microphone, camera

### File Upload Security
- MIME type validation using `finfo`
- Extension whitelist (PDF, JPG, PNG only)
- Maximum file size: 5MB
- Uploads directory denies direct access via `.htaccess`
- PHP execution disabled in uploads directory
- Files stored with UUID filenames (no user-supplied filenames)

---

## Rate Limiting

### Application-Level Rate Limiting

Rate limiting is implemented in `utils/auth.php` using a file-based token bucket:

| Endpoint Type     | Limit                          |
|-------------------|--------------------------------|
| General endpoints | 60 requests per 60 seconds     |
| Auth endpoints    | 10 requests per 60 seconds     |

### Apache-Level Rate Limiting (Recommended)

For production, add `mod_evasive` configuration to your Apache config:

```apache
DOSHashTableSize 3097
DOSPageCount 60
DOSSiteCount 500
DOSPageInterval 2
DOSSiteInterval 2
DOSBlockingPeriod 10
```

### Rate Limit Response

When rate limited, the API returns:
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "status": 429
}
```

With a `Retry-After` header indicating seconds to wait.

---

## File Uploads

### Supported File Types
- **PDF** (`application/pdf`)
- **JPEG** (`image/jpeg`)
- **PNG** (`image/png`)

### Maximum File Size
- 5 MB (5,242,880 bytes)

### Upload Endpoint
```
POST /api/estamp/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form fields:
- application_id: <int>
- document_type: cnic_copy|property_papers|sale_deed|rent_agreement|other
- file: <file>
```

### Upload Storage
Files are stored in `public_html/api/uploads/estamp/<application_id>/` with UUID-based filenames. Direct access is denied via `.htaccess`.

---

## CORS Configuration

### Whitelist Origins

Edit `config.php` to add your frontend domains:

```php
define('CORS_ALLOWED_ORIGINS', [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:3000',  // Development
    'http://localhost:5173',  // Vite dev server
]);
```

### CORS Headers

The API sets the following CORS headers for whitelisted origins:
- `Access-Control-Allow-Origin: <origin>`
- `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Client-Info`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Max-Age: 86400`

---

## Demo Credentials

After importing the sample data, use these credentials:

### Regular User
```
Email: ahmed.raza@example.com
Password: Test@1234
```

### Agent
```
Email: fatima.khan@example.com
Password: Test@1234
```

### Another User
```
Email: bilal.hussain@example.com
Password: Test@1234
```

### Admin
```
Email: admin@alnajaf-estate.com
Password: Test@1234
```

---

## API Response Format

All responses are JSON with the following structure:

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "status": 200
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... },
  "status": 400
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "total_pages": 5,
    "has_more": true
  }
}
```

---

## Troubleshooting

### 404 Not Found on All Endpoints

**Cause:** Apache mod_rewrite is not enabled or .htaccess is not being read.

**Solution:**
1. Ensure `mod_rewrite` is enabled on StackCP
2. Ensure `AllowOverride All` is set for your `public_html` directory
3. Check that `.htaccess` was uploaded correctly

### 500 Internal Server Error

**Cause:** Configuration or database connection issue.

**Solution:**
1. Set `APP_DEBUG` to `true` in `config.php` temporarily
2. Check the error response for details
3. Verify database credentials
4. Check `uploads/error.log` for PHP errors

### CORS Errors

**Cause:** Your frontend origin is not in the CORS whitelist.

**Solution:**
1. Add your frontend URL to `CORS_ALLOWED_ORIGINS` in `config.php`
2. Ensure the origin matches exactly (including protocol and port)

### JWT Authentication Fails

**Cause:** Invalid or expired token.

**Solution:**
1. Ensure the `Authorization` header is `Bearer <token>` (with space after Bearer)
2. Check if the token has expired (access tokens expire in 1 hour)
3. Verify `JWT_SECRET` is consistent (don't change it after issuing tokens)

### Email/OTP Not Sending

**Cause:** SMTP configuration is incorrect or not configured.

**Solution:**
1. Verify SMTP credentials in `config.php`
2. Check with your hosting provider for SMTP limits
3. In development, emails are logged to `error.log` instead of being sent

### File Upload Fails

**Cause:** File type, size, or permissions issue.

**Solution:**
1. Ensure the file is PDF, JPG, or PNG
2. Ensure the file is under 5MB
3. Check that `uploads/` directory has write permissions (755 or 775)
4. Check that `uploads/estamp/` directory exists and is writable

### Database Connection Fails

**Cause:** Incorrect database credentials or database doesn't exist.

**Solution:**
1. Verify `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` in `config.php`
2. Ensure the database was created in StackCP
3. Ensure the database user has privileges on the database
4. Check if the database server is running

---

## Development Notes

### Local Development

For local development, use XAMPP, WAMP, or MAMP:

1. Place the `api/` folder in your web server's document root
2. Create a local MySQL database
3. Import `database/schema.sql`
4. Update `config.php` with local database credentials
5. Set `APP_DEBUG` to `true`
6. Access the API at `http://localhost/api/`

### Generating a JWT Secret

Generate a secure random string for `JWT_SECRET`:

```bash
openssl rand -hex 64
```

Or in PHP:
```php
echo bin2hex(random_bytes(64));
```

### Regenerating Password Hashes

If you need to generate new password hashes for testing:

```php
echo password_hash('Test@1234', PASSWORD_BCRYPT, ['cost' => 12]);
```

---

## License

This project is proprietary software for Al Najaf Digital Estate.

---

## Support

For deployment support on StackCP, contact your hosting provider. For application support, contact the development team.
