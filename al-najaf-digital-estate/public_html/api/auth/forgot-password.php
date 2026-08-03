<?php
/**
 * ============================================================
 * POST /api/auth/forgot-password
 * ============================================================
 * Request a password reset link via email.
 * 
 * Request body:
 *   - email  (string, required, valid email)
 * 
 * Response:
 *   200: { success, message, data: { reset_link_sent } }
 *   422: { success: false, message, errors }
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting
Auth::rateLimit('auth_forgot', RATE_LIMIT_AUTH_MAX);

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

// Get request body
$body = Response::getRequestBody();

// Validate required fields
$errors = Response::validateRequired(['email']);

if (!empty($errors)) {
    Response::validationError('Validation failed', $errors);
}

if (!Auth::validateEmail($body['email'])) {
    Response::validationError('Validation failed', [
        'email' => 'Invalid email address',
    ]);
}

$email = strtolower(trim($body['email']));

// Fetch user by email
$user = Database::fetchOne(
    "SELECT id, uuid, name, email, status FROM users WHERE email = ?",
    [$email]
);

// Always return success to prevent email enumeration
if ($user === null || $user['status'] !== 'active') {
    Response::json([
        'success' => true,
        'message' => 'If an account exists with this email, a reset link has been sent.',
        'data'    => ['reset_link_sent' => true],
    ]);
}

// Generate a secure reset token
$token = bin2hex(random_bytes(32));
$tokenHash = password_hash($token, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);

// Store the reset token (expires in 1 hour)
Database::insert(
    "INSERT INTO password_resets (user_id, email, token_hash, expires_at, used, created_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 0, NOW())",
    [
        (int) $user['id'],
        $email,
        $tokenHash,
    ]
);

// Send the reset email
Email::sendPasswordReset($email, $token, $user['name']);

Response::json([
    'success' => true,
    'message' => 'If an account exists with this email, a reset link has been sent.',
    'data'    => [
        'reset_link_sent' => true,
    ],
]);
