<?php
/**
 * ============================================================
 * POST /api/auth/register
 * ============================================================
 * Register a new user account. Sends OTP email for verification.
 * 
 * Request body:
 *   - name      (string, required, min 2 chars)
 *   - email     (string, required, valid email)
 *   - phone     (string, required, valid phone)
 *   - password  (string, required, min 8 chars, uppercase+lowercase+number)
 *   - role      (string, optional: 'user'|'agent'|'lawyer', default 'user')
 * 
 * Response:
 *   201: { success, message, data: { uuid, email, otp_sent } }
 *   422: { success: false, message, errors }
 *   409: { success: false, message } - email already registered
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting for auth endpoints
Auth::rateLimit('auth_register', RATE_LIMIT_AUTH_MAX);

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

// Get request body
$body = Response::getRequestBody();

// Validate required fields
$errors = Response::validateRequired(['name', 'email', 'phone', 'password']);

// Validate email format
if (!isset($errors['email']) && !Auth::validateEmail($body['email'] ?? '')) {
    $errors['email'] = 'Invalid email address';
}

// Validate phone format
if (!isset($errors['phone']) && !Auth::validatePhone($body['phone'] ?? '')) {
    $errors['phone'] = 'Invalid phone number';
}

// Validate password strength
if (!isset($errors['password'])) {
    $passwordErrors = Auth::validatePassword($body['password'] ?? '');
    if (!empty($passwordErrors)) {
        $errors = array_merge($errors, $passwordErrors);
    }
}

// Validate name length
if (!isset($errors['name']) && strlen(trim($body['name'] ?? '')) < 2) {
    $errors['name'] = 'Name must be at least 2 characters long';
}

// Validate role
$allowedRoles = ['user', 'agent', 'lawyer'];
$role = $body['role'] ?? 'user';
if (!in_array($role, $allowedRoles, true)) {
    $errors['role'] = 'Invalid role. Allowed: user, agent, lawyer';
}

if (!empty($errors)) {
    Response::validationError('Validation failed', $errors);
}

// Check if email already exists
$existingUser = Database::fetchOne(
    "SELECT id FROM users WHERE email = ?",
    [$body['email']]
);

if ($existingUser !== null) {
    Response::error('An account with this email already exists. Please login instead.', 409);
}

// Check if phone already exists
$existingPhone = Database::fetchOne(
    "SELECT id FROM users WHERE phone = ?",
    [$body['phone']]
);

if ($existingPhone !== null) {
    Response::error('An account with this phone number already exists.', 409);
}

// Generate UUID
$uuid = Auth::generateUuid();

// Hash password
$passwordHash = Auth::hashPassword($body['password']);

// Begin transaction
Database::beginTransaction();

try {
    // Insert user
    $userId = Database::insert(
        "INSERT INTO users (uuid, name, email, phone, password_hash, role, status, email_verified_at, avatar_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NOW(), NOW())",
        [
            $uuid,
            Auth::sanitize($body['name']),
            strtolower(trim($body['email'])),
            trim($body['phone']),
            $passwordHash,
            $role,
        ]
    );

    // Generate OTP
    $otp = Auth::generateOtp();
    $otpHash = password_hash($otp, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);

    // Store OTP
    Database::insert(
        "INSERT INTO email_otps (user_id, email, otp_hash, expires_at, attempts, created_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), 0, NOW())",
        [
            (int) $userId,
            strtolower(trim($body['email'])),
            $otpHash,
            OTP_TTL,
        ]
    );

    Database::commit();
} catch (Throwable $e) {
    Database::rollback();
    if (APP_DEBUG) {
        Response::serverError('Registration failed: ' . $e->getMessage());
    }
    Response::serverError('Registration failed. Please try again.');
}

// Send OTP email
$otpSent = Email::sendOtp($body['email'], $otp, $body['name']);

// Log the registration
try {
    Database::insert(
        "INSERT INTO admin_logs (user_id, action, entity, entity_id, ip_address, user_agent, created_at)
         VALUES (?, 'User registered', 'users', ?, ?, ?, NOW())",
        [
            (int) $userId,
            (int) $userId,
            Auth::getClientIp(),
            $_SERVER['HTTP_USER_AGENT'] ?? '',
        ]
    );
} catch (Throwable $e) {
    // Non-critical
}

Response::json([
    'success' => true,
    'message' => 'Registration successful. Please verify your email with the OTP sent to your address.',
    'data'    => [
        'uuid'      => $uuid,
        'email'     => strtolower(trim($body['email'])),
        'otp_sent'  => $otpSent,
    ],
], 201);
