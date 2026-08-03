<?php
/**
 * ============================================================
 * Al Najaf Digital Estate - API Configuration
 * ============================================================
 * 
 * Template configuration file. Replace all YOUR_* placeholders
 * with your actual credentials before deploying to StackCP.
 * 
 * NEVER commit real credentials to version control.
 * ============================================================
 */

declare(strict_types=1);

// ============================================================
// ENVIRONMENT
// ============================================================
define('APP_ENV', 'production'); // 'development' or 'production'
define('APP_DEBUG', false);      // Set true for verbose errors
define('APP_NAME', 'Al Najaf Digital Estate');
define('APP_URL', 'https://YOUR_DOMAIN.com');
define('API_URL', APP_URL . '/api');

// ============================================================
// DATABASE (MySQL 8.0 via StackCP)
// ============================================================
define('DB_HOST', 'YOUR_DB_HOST');       // e.g., localhost or 127.0.0.1
define('DB_PORT', 3306);                 // default MySQL port
define('DB_NAME', 'YOUR_DB_NAME');        // database name
define('DB_USER', 'YOUR_DB_USER');        // database username
define('DB_PASS', 'YOUR_DB_PASSWORD');    // database password
define('DB_CHARSET', 'utf8mb4');

// PDO options
define('DB_OPTIONS', [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
]);

// ============================================================
// JWT AUTHENTICATION
// ============================================================
define('JWT_SECRET', 'YOUR_JWT_SECRET_KEY_CHANGE_THIS'); // Use a 64+ char random string
define('JWT_ISSUER', 'Al Najaf Digital Estate');
define('JWT_AUDIENCE', APP_URL);
define('JWT_ALGO', 'HS256');
define('JWT_ACCESS_TTL', 3600);        // 1 hour access token
define('JWT_REFRESH_TTL', 1209600);    // 14 days refresh token

// ============================================================
// SMTP EMAIL (for OTP and notifications)
// ============================================================
define('SMTP_HOST', 'YOUR_SMTP_HOST');       // e.g., smtp.gmail.com
define('SMTP_PORT', 587);                    // 587 for TLS, 465 for SSL
define('SMTP_USER', 'YOUR_SMTP_USER');        // e.g., noreply@alnajaf-estate.com
define('SMTP_PASS', 'YOUR_SMTP_PASSWORD');   // SMTP password or app password
define('SMTP_FROM_EMAIL', 'YOUR_FROM_EMAIL'); // e.g., noreply@alnajaf-estate.com
define('SMTP_FROM_NAME', 'Al Najaf Digital Estate');
define('SMTP_ENCRYPTION', 'tls');            // 'tls' or 'ssl' or ''

// ============================================================
// OTP SETTINGS
// ============================================================
define('OTP_LENGTH', 6);
define('OTP_TTL', 600); // 10 minutes expiry
define('OTP_MAX_ATTEMPTS', 5);

// ============================================================
// PASSWORD POLICY
// ============================================================
define('PASSWORD_MIN_LENGTH', 8);
define('BCRYPT_COST', 12); // Bcrypt cost factor

// ============================================================
// CORS WHITELIST
// ============================================================
define('CORS_ALLOWED_ORIGINS', [
    'https://alnajaf-estate.com',
    'https://www.alnajaf-estate.com',
    'https://app.alnajaf-estate.com',
    // Add your local development origins here:
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
]);

// ============================================================
// FILE UPLOAD SETTINGS
// ============================================================
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('UPLOAD_MAX_SIZE', 5 * 1024 * 1024); // 5 MB in bytes
define('UPLOAD_ALLOWED_TYPES', [
    'application/pdf'                    => 'pdf',
    'image/jpeg'                          => 'jpg',
    'image/png'                           => 'png',
    'image/jpg'                           => 'jpg',
]);
define('UPLOAD_ALLOWED_EXTENSIONS', ['pdf', 'jpg', 'jpeg', 'png']);
define('UPLOAD_BASE_URL', API_URL . '/uploads');

// ============================================================
// RATE LIMITING (application-level)
// ============================================================
define('RATE_LIMIT_ENABLED', true);
define('RATE_LIMIT_WINDOW', 60);    // 60 second window
define('RATE_LIMIT_MAX_REQUESTS', 60); // 60 requests per window per IP
define('RATE_LIMIT_AUTH_MAX', 10);  // 10 auth requests per window per IP

// ============================================================
// PAGINATION
// ============================================================
define('DEFAULT_PAGE', 1);
define('DEFAULT_PER_PAGE', 20);
define('MAX_PER_PAGE', 100);

// ============================================================
// ERROR REPORTING
// ============================================================
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    ini_set('error_log', __DIR__ . '/uploads/error.log');
}

// ============================================================
// TIMEZONE
// ============================================================
date_default_timezone_set('Asia/Karachi'); // Adjust for your region
