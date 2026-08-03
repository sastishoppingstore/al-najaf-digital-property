<?php
/**
 * ============================================================
 * POST /api/auth/login
 * ============================================================
 * Authenticate a user and return JWT tokens.
 * 
 * Request body:
 *   - email     (string, required)
 *   - password  (string, required)
 * 
 * Response:
 *   200: { success, message, data: { user, access_token, refresh_token, expires_in } }
 *   401: { success: false, message } - invalid credentials
 *   403: { success: false, message } - account not verified or suspended
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting for auth endpoints
Auth::rateLimit('auth_login', RATE_LIMIT_AUTH_MAX);

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

// Get request body
$body = Response::getRequestBody();

// Validate required fields
$errors = Response::validateRequired(['email', 'password']);

if (!empty($errors)) {
    Response::validationError('Validation failed', $errors);
}

$email = strtolower(trim($body['email']));
$password = $body['password'];

// Fetch user by email
$user = Database::fetchOne(
    "SELECT id, uuid, name, email, phone, password_hash, role, status, email_verified_at,
            avatar_url, created_at
     FROM users
     WHERE email = ?",
    [$email]
);

if ($user === null) {
    Response::error('Invalid email or password.', 401);
}

// Verify password
if (!Auth::verifyPassword($password, $user['password_hash'])) {
    Response::error('Invalid email or password.', 401);
}

// Check account status
if ($user['status'] === 'pending') {
    Response::error('Your account is not verified. Please verify your email first.', 403);
}

if ($user['status'] === 'suspended') {
    Response::error('Your account has been suspended. Please contact support.', 403);
}

if ($user['status'] === 'deleted') {
    Response::error('This account has been deleted.', 403);
}

if ($user['status'] !== 'active') {
    Response::error('Your account is not active. Please contact support.', 403);
}

// Generate token pair
$tokens = Auth::generateTokenPair($user);

// Remove sensitive data
unset($user['password_hash']);

// Log the login
try {
    Database::execute(
        "INSERT INTO admin_logs (user_id, action, entity, entity_id, ip_address, user_agent, created_at)
         VALUES (?, 'User logged in', 'users', ?, ?, ?, NOW())",
        [
            (int) $user['id'],
            (int) $user['id'],
            Auth::getClientIp(),
            $_SERVER['HTTP_USER_AGENT'] ?? '',
        ]
    );
} catch (Throwable $e) {
    // Non-critical
}

Response::json([
    'success' => true,
    'message' => 'Login successful.',
    'data'    => [
        'user'          => $user,
        'access_token'  => $tokens['access_token'],
        'refresh_token' => $tokens['refresh_token'],
        'expires_in'    => $tokens['expires_in'],
        'token_type'    => $tokens['token_type'],
    ],
]);
