<?php
/**
 * ============================================================
 * POST /api/auth/reset-password
 * ============================================================
 * Reset password using a valid reset token.
 * 
 * Request body:
 *   - token     (string, required)
 *   - email     (string, required)
 *   - password  (string, required, min 8 chars, uppercase+lowercase+number)
 * 
 * Response:
 *   200: { success, message }
 *   400: { success: false, message } - invalid/expired token
 *   422: { success: false, message, errors }
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting
Auth::rateLimit('auth_reset', RATE_LIMIT_AUTH_MAX);

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

// Get request body
$body = Response::getRequestBody();

// Validate required fields
$errors = Response::validateRequired(['token', 'email', 'password']);

// Validate email
if (!isset($errors['email']) && !Auth::validateEmail($body['email'])) {
    $errors['email'] = 'Invalid email address';
}

// Validate password strength
if (!isset($errors['password'])) {
    $passwordErrors = Auth::validatePassword($body['password'] ?? '');
    if (!empty($passwordErrors)) {
        $errors = array_merge($errors, $passwordErrors);
    }
}

if (!empty($errors)) {
    Response::validationError('Validation failed', $errors);
}

$email = strtolower(trim($body['email']));
$token = trim($body['token']);
$password = $body['password'];

// Fetch the latest non-used reset token for this email
$resetRecord = Database::fetchOne(
    "SELECT id, user_id, token_hash, expires_at, used, created_at
     FROM password_resets
     WHERE email = ? AND used = 0
     ORDER BY created_at DESC
     LIMIT 1",
    [$email]
);

if ($resetRecord === null) {
    Response::error('Invalid or expired reset token. Please request a new one.', 400);
}

// Check if token has expired
$expiresAt = strtotime($resetRecord['expires_at']);
if (time() > $expiresAt) {
    // Mark as used to prevent reuse
    Database::execute(
        "UPDATE password_resets SET used = 1 WHERE id = ?",
        [(int) $resetRecord['id']]
    );
    Response::error('Reset token has expired. Please request a new one.', 400);
}

// Verify token
if (!password_verify($token, $resetRecord['token_hash'])) {
    Response::error('Invalid reset token. Please request a new one.', 400);
}

// Hash the new password
$passwordHash = Auth::hashPassword($password);

// Update user password
Database::execute(
    "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
    [
        $passwordHash,
        (int) $resetRecord['user_id'],
    ]
);

// Mark the reset token as used
Database::execute(
    "UPDATE password_resets SET used = 1 WHERE id = ?",
    [(int) $resetRecord['id']]
);

// Log the password reset
try {
    Database::execute(
        "INSERT INTO admin_logs (user_id, action, entity, entity_id, ip_address, user_agent, created_at)
         VALUES (?, 'Password reset', 'users', ?, ?, ?, NOW())",
        [
            (int) $resetRecord['user_id'],
            (int) $resetRecord['user_id'],
            Auth::getClientIp(),
            $_SERVER['HTTP_USER_AGENT'] ?? '',
        ]
    );
} catch (Throwable $e) {
    // Non-critical
}

Response::json([
    'success' => true,
    'message' => 'Password has been reset successfully. You can now login with your new password.',
]);
