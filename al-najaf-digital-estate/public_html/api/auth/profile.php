<?php
/**
 * ============================================================
 * GET /api/auth/profile
 * PUT /api/auth/profile
 * ============================================================
 * Get or update the authenticated user's profile.
 * 
 * GET:
 *   Response: 200 { success, data: { user } }
 * 
 * PUT:
 *   Request body (all optional):
 *     - name       (string)
 *     - phone      (string)
 *     - avatar_url (string)
 *     - bio        (string)
 *   Response: 200 { success, message, data: { user } }
 * 
 * Requires authentication.
 * ============================================================
 */

declare(strict_types=1);

// Require authentication
$user = Auth::requireAuth();

$method = $GLOBALS['route']['method'];

// ============================================================
// GET - Fetch profile
// ============================================================
if ($method === 'GET') {
    // Fetch full user profile
    $profile = Database::fetchOne(
        "SELECT u.id, u.uuid, u.name, u.email, u.phone, u.role, u.status,
                u.email_verified_at, u.avatar_url, u.bio, u.created_at, u.updated_at,
                (SELECT COUNT(*) FROM properties p WHERE p.user_id = u.id AND p.status = 'active') AS property_count,
                (SELECT COUNT(*) FROM saved_properties sp WHERE sp.user_id = u.id) AS saved_count
         FROM users u
         WHERE u.id = ?",
        [(int) $user['id']]
    );

    if ($profile === null) {
        Response::notFound('User profile not found');
    }

    Response::success($profile, 'Profile retrieved successfully');
}

// ============================================================
// PUT - Update profile
// ============================================================
if ($method === 'PUT' || $method === 'PATCH') {
    $body = Response::getRequestBody();

    $updateFields = [];
    $updateParams = [];

    // Name
    if (isset($body['name']) && !empty(trim($body['name']))) {
        $name = trim($body['name']);
        if (strlen($name) < 2) {
            Response::validationError('Validation failed', ['name' => 'Name must be at least 2 characters']);
        }
        $updateFields[] = 'name = ?';
        $updateParams[] = Auth::sanitize($name);
    }

    // Phone
    if (isset($body['phone']) && !empty(trim($body['phone']))) {
        $phone = trim($body['phone']);
        if (!Auth::validatePhone($phone)) {
            Response::validationError('Validation failed', ['phone' => 'Invalid phone number']);
        }
        // Check phone uniqueness
        $existingPhone = Database::fetchOne(
            "SELECT id FROM users WHERE phone = ? AND id != ?",
            [$phone, (int) $user['id']]
        );
        if ($existingPhone !== null) {
            Response::validationError('Validation failed', ['phone' => 'This phone number is already in use']);
        }
        $updateFields[] = 'phone = ?';
        $updateParams[] = $phone;
    }

    // Avatar URL
    if (isset($body['avatar_url'])) {
        $updateFields[] = 'avatar_url = ?';
        $updateParams[] = trim($body['avatar_url']) ?: null;
    }

    // Bio
    if (isset($body['bio'])) {
        $updateFields[] = 'bio = ?';
        $updateParams[] = Auth::sanitize($body['bio']);
    }

    if (empty($updateFields)) {
        Response::validationError('No fields to update');
    }

    // Add updated_at
    $updateFields[] = 'updated_at = NOW()';

    // Add user ID
    $updateParams[] = (int) $user['id'];

    // Execute update
    Database::execute(
        "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?",
        $updateParams
    );

    // Fetch updated profile
    $updatedUser = Database::fetchOne(
        "SELECT id, uuid, name, email, phone, role, status, email_verified_at,
                avatar_url, bio, created_at, updated_at
         FROM users WHERE id = ?",
        [(int) $user['id']]
    );

    Response::success($updatedUser, 'Profile updated successfully');
}

// Method not allowed
Response::error('Method not allowed. Use GET or PUT.', 405);
