<?php
/**
 * ============================================================
 * POST /api/property/inquiry
 * ============================================================
 * Submit an inquiry for a property.
 * 
 * Request body:
 *   - property_id  (int, required)
 *   - name         (string, required)
 *   - email        (string, required, valid email)
 *   - phone        (string, required, valid phone)
 *   - message      (string, required, min 10 chars)
 * 
 * Response:
 *   201: { success, message, data: { inquiry_id } }
 *   422: { success: false, message, errors }
 *   404: { success: false, message } - property not found
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting
Auth::rateLimit('property_inquiry');

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

$body = Response::getRequestBody();

// Validate required fields
$errors = Response::validateRequired(['property_id', 'name', 'email', 'phone', 'message']);

// Validate email
if (!isset($errors['email']) && !Auth::validateEmail($body['email'] ?? '')) {
    $errors['email'] = 'Invalid email address';
}

// Validate phone
if (!isset($errors['phone']) && !Auth::validatePhone($body['phone'] ?? '')) {
    $errors['phone'] = 'Invalid phone number';
}

// Validate message length
if (!isset($errors['message']) && strlen(trim($body['message'] ?? '')) < 10) {
    $errors['message'] = 'Message must be at least 10 characters long';
}

// Validate property exists
$propertyId = (int) ($body['property_id'] ?? 0);
if (!isset($errors['property_id']) && $propertyId > 0) {
    $property = Database::fetchOne(
        "SELECT id, user_id, title FROM properties WHERE id = ? AND status = 'active'",
        [$propertyId]
    );
    if ($property === null) {
        $errors['property_id'] = 'Property not found or not available';
    }
} else {
    $errors['property_id'] = 'Valid property ID is required';
}

if (!empty($errors)) {
    Response::validationError('Validation failed', $errors);
}

// Get the authenticated user if available
$currentUser = Auth::currentUser();
$userId = $currentUser !== null ? (int) $currentUser['id'] : null;

// Insert inquiry
$inquiryId = Database::insert(
    "INSERT INTO property_inquiries
        (property_id, user_id, name, email, phone, message, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())",
    [
        $propertyId,
        $userId,
        Auth::sanitize($body['name']),
        strtolower(trim($body['email'])),
        trim($body['phone']),
        Auth::sanitize($body['message']),
    ]
);

// Notify the property owner/agent
if (isset($property['user_id']) && $property['user_id'] !== null) {
    Auth::notify(
        (int) $property['user_id'],
        'New Property Inquiry',
        "You have received a new inquiry for '{$property['title']}' from {$body['name']}.",
        'info',
        '/property/' . $propertyId
    );
}

Response::json([
    'success' => true,
    'message' => 'Your inquiry has been submitted. The agent will contact you soon.',
    'data'    => [
        'inquiry_id' => (int) $inquiryId,
    ],
], 201);
