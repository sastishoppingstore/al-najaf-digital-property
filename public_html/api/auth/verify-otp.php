<?php
/**
 * ============================================================
 * POST /api/auth/verify-otp
 * ============================================================
 * Verify email OTP and activate user account.
 * 
 * Request body:
 *   - email  (string, required)
 *   - otp    (string, required, 6 digits)
 * 
 * Response:
 *   200: { success, message, data: { verified, access_token, refresh_token } }
 *   400: { success: false, message } - invalid/expired OTP
 *   422: { success: false, message, errors }
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting
Auth::rateLimit('auth_verify_otp', RATE_LIMIT_AUTH_MAX);

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

// Get request body
$body = Response::getRequestBody();

// Validate required fields
$errors = Response::validateRequired(['email', 'otp']);

if (!empty($errors)) {
    Response::validationError('Validation failed', $errors);
}

$email = strtolower(trim($body['email']));
$otp = trim($body['otp']);

// Validate OTP format
if (!preg_match('/^\d{' . OTP_LENGTH . '}$/', $otp)) {
    Response::validationError('Validation failed', [
        'otp' => 'OTP must be ' . OTP_LENGTH . ' digits',
    ]);
}

// Fetch the latest non-expired OTP for this email
$otpRecord = Database::fetchOne(
    "SELECT id, user_id, otp_hash, expires_at, attempts, verified, created_at
     FROM email_otps
     WHERE email = ? AND verified = 0
     ORDER BY created_at DESC
     LIMIT 1",
    [$email]
);

if ($otpRecord === null) {
    Response::error('No pending OTP found for this email. Please request a new one.', 400);
}

// Check if OTP has expired
$expiresAt = strtotime($otpRecord['expires_at']);
if (time() > $expiresAt) {
    Response::error('OTP has expired. Please request a new one.', 400);
}

// Check max attempts
if ((int) $otpRecord['attempts'] >= OTP_MAX_ATTEMPTS) {
    Response::error('Maximum OTP attempts exceeded. Please request a new one.', 400);
}

// Increment attempt counter
Database::execute(
    "UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?",
    [(int) $otpRecord['id']]
);

// Verify OTP
if (!password_verify($otp, $otpRecord['otp_hash'])) {
    $remaining = OTP_MAX_ATTEMPTS - (int) $otpRecord['attempts'] - 1;
    Response::error(
        'Invalid OTP. ' . $remaining . ' attempt(s) remaining.',
        400
    );
}

// Mark OTP as verified
Database::execute(
    "UPDATE email_otps SET verified = 1 WHERE id = ?",
    [(int) $otpRecord['id']]
);

// Activate user account
Database::execute(
    "UPDATE users SET status = 'active', email_verified_at = NOW(), updated_at = NOW() WHERE id = ?",
    [(int) $otpRecord['user_id']]
);

// Fetch the user data for token generation
$user = Database::fetchOne(
    "SELECT id, uuid, name, email, phone, role, status, avatar_url, created_at
     FROM users WHERE id = ?",
    [(int) $otpRecord['user_id']]
);

if ($user === null) {
    Response::serverError('User record not found after verification.');
}

// Generate token pair
$tokens = Auth::generateTokenPair($user);

// Send welcome email
Email::sendWelcome($user['email'], $user['name']);

Response::json([
    'success' => true,
    'message' => 'Email verified successfully. Your account is now active.',
    'data'    => [
        'verified'      => true,
        'user'          => $user,
        'access_token'  => $tokens['access_token'],
        'refresh_token' => $tokens['refresh_token'],
        'expires_in'    => $tokens['expires_in'],
        'token_type'    => $tokens['token_type'],
    ],
]);
