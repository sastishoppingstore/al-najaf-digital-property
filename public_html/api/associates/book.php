<?php
/**
 * ============================================================
 * POST /api/associates/book
 * ============================================================
 * Book an associate service.
 * 
 * Request body:
 *   - service_id        (int, required)
 *   - preferred_date    (string, required, Y-m-d format, must be future)
 *   - preferred_time    (string, required, H:i format)
 *   - name              (string, required)
 *   - email             (string, required, valid email)
 *   - phone             (string, required, valid phone)
 *   - address           (string, optional)
 *   - notes             (string, optional)
 * 
 * Response:
 *   201: { success, message, data: { booking_id, reference_number } }
 *   422: { success: false, message, errors }
 *   404: { success: false, message } - service not found
 * ============================================================
 */

declare(strict_types=1);

// Require authentication
$user = Auth::requireAuth();

// Rate limiting
Auth::rateLimit('associates_book');

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

$body = Response::getRequestBody();

// Validate required fields
$errors = Response::validateRequired([
    'service_id', 'preferred_date', 'preferred_time', 'name', 'email', 'phone'
]);

// Validate email
if (!isset($errors['email']) && !Auth::validateEmail($body['email'] ?? '')) {
    $errors['email'] = 'Invalid email address';
}

// Validate phone
if (!isset($errors['phone']) && !Auth::validatePhone($body['phone'] ?? '')) {
    $errors['phone'] = 'Invalid phone number';
}

// Validate date format and future date
$preferredDate = trim($body['preferred_date'] ?? '');
if (!isset($errors['preferred_date'])) {
    $dateObj = DateTime::createFromFormat('Y-m-d', $preferredDate);
    if ($dateObj === false || $dateObj->format('Y-m-d') !== $preferredDate) {
        $errors['preferred_date'] = 'Invalid date format. Use YYYY-MM-DD';
    } elseif ($dateObj < new DateTime('today')) {
        $errors['preferred_date'] = 'Preferred date must be in the future';
    }
}

// Validate time format
$preferredTime = trim($body['preferred_time'] ?? '');
if (!isset($errors['preferred_time']) && !preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $preferredTime)) {
    $errors['preferred_time'] = 'Invalid time format. Use HH:MM (24-hour)';
}

// Validate service exists
$serviceId = (int) ($body['service_id'] ?? 0);
if (!isset($errors['service_id']) && $serviceId > 0) {
    $service = Database::fetchOne(
        "SELECT id, name, price, currency FROM services WHERE id = ? AND status = 'active'",
        [$serviceId]
    );
    if ($service === null) {
        $errors['service_id'] = 'Service not found or not available';
    }
} else {
    $errors['service_id'] = 'Valid service ID is required';
}

if (!empty($errors)) {
    Response::validationError('Validation failed', $errors);
}

// Generate a reference number
$referenceNumber = 'SR-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

// Begin transaction
Database::beginTransaction();

try {
    // Insert service request
    $bookingId = Database::insert(
        "INSERT INTO service_requests
            (user_id, service_id, reference_number, customer_name, customer_email,
             customer_phone, customer_address, preferred_date, preferred_time,
             notes, price_at_booking, currency_at_booking, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())",
        [
            (int) $user['id'],
            $serviceId,
            $referenceNumber,
            Auth::sanitize($body['name']),
            strtolower(trim($body['email'])),
            trim($body['phone']),
            isset($body['address']) ? Auth::sanitize($body['address']) : null,
            $preferredDate,
            $preferredTime,
            isset($body['notes']) ? Auth::sanitize($body['notes']) : null,
            (float) $service['price'],
            $service['currency'],
        ]
    );

    // Add initial status history entry
    Database::insert(
        "INSERT INTO service_status_history
            (request_id, status, notes, changed_by, created_at)
         VALUES (?, 'pending', 'Service request submitted', ?, NOW())",
        [
            (int) $bookingId,
            (int) $user['id'],
        ]
    );

    // Notify admins
    $admins = Database::fetchAll(
        "SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active'"
    );
    foreach ($admins as $admin) {
        Auth::notify(
            (int) $admin['id'],
            'New Service Booking',
            "New booking for '{$service['name']}' (Ref: {$referenceNumber}) from {$body['name']}.",
            'info',
            '/admin/services'
        );
    }

    Database::commit();
} catch (Throwable $e) {
    Database::rollback();
    if (APP_DEBUG) {
        Response::serverError('Booking failed: ' . $e->getMessage());
    }
    Response::serverError('Failed to create booking. Please try again.');
}

Response::json([
    'success' => true,
    'message' => 'Service booked successfully. We will contact you to confirm the appointment.',
    'data'    => [
        'booking_id'       => (int) $bookingId,
        'reference_number' => $referenceNumber,
    ],
], 201);
