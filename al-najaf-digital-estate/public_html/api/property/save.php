<?php
/**
 * ============================================================
 * POST /api/property/save
 * ============================================================
 * Save or unsave a property (toggle bookmark).
 * 
 * Request body:
 *   - property_id  (int, required)
 * 
 * Response:
 *   200: { success, message, data: { saved: bool } }
 *   422: { success: false, message, errors }
 *   404: { success: false, message } - property not found
 * ============================================================
 */

declare(strict_types=1);

// Require authentication
$user = Auth::requireAuth();

// Rate limiting
Auth::rateLimit('property_save');

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

$body = Response::getRequestBody();

// Validate required fields
$errors = Response::validateRequired(['property_id']);

if (!empty($errors)) {
    Response::validationError('Validation failed', $errors);
}

$propertyId = (int) $body['property_id'];

// Check if property exists
$property = Database::fetchOne(
    "SELECT id FROM properties WHERE id = ? AND status = 'active'",
    [$propertyId]
);

if ($property === null) {
    Response::notFound('Property not found or not available');
}

// Check if already saved
$existing = Database::fetchOne(
    "SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ?",
    [
        (int) $user['id'],
        $propertyId,
    ]
);

if ($existing !== null) {
    // Unsave - remove the bookmark
    Database::execute(
        "DELETE FROM saved_properties WHERE id = ?",
        [(int) $existing['id']]
    );

    Response::success([
        'saved' => false,
    ], 'Property removed from saved list');
} else {
    // Save - add the bookmark
    Database::insert(
        "INSERT INTO saved_properties (user_id, property_id, created_at)
         VALUES (?, ?, NOW())",
        [
            (int) $user['id'],
            $propertyId,
        ]
    );

    Response::success([
        'saved' => true,
    ], 'Property saved successfully');
}
