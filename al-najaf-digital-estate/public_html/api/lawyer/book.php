<?php
/**
 * ============================================================
 * POST /api/lawyer/book
 * ============================================================
 * Book a consultation with a lawyer.
 * 
 * Request body:
 *   - lawyer_id          (int, required)
 *   - consultation_date  (string, required, Y-m-d format, must be future)
 *   - consultation_time  (string, required, H:i format)
 *   - duration_minutes   (int, optional, default 60)
 *   - consultation_type  (string, required: 'in_person'|'video'|'phone')
 *   - name               (string, required)
 *   - email              (string, required, valid email)
 *   - phone              (string, required, valid phone)
 *   - case_description   (string, required, min 20 chars)
 *   - notes              (string, optional)
 * 
 * Response:
 *   201: { success, message, data: { booking_id, reference_number } }
 *   422: { success: false, message, errors }
 *   404: { success: false, message } - lawyer not found
 *   409: { success: false, message } - slot already booked
 * ============================================================
 */

declare(strict_types=1);

// Require authentication
$user = Auth::requireAuth();

// Rate limiting
Auth::rateLimit('lawyer_book');

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

$body = Response::getRequestBody();

// Validate required fields
$errors = Response::validateRequired([
    'lawyer_id', 'consultation_date', 'consultation_time', 'consultation_type',
    'name', 'email', 'phone', 'case_description'
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
$consultationDate = trim($body['consultation_date'] ?? '');
if (!isset($errors['consultation_date'])) {
    $dateObj = DateTime::createFromFormat('Y-m-d', $consultationDate);
    if ($dateObj === false || $dateObj->format('Y-m-d') !== $consultationDate) {
        $errors['consultation_date'] = 'Invalid date format. Use YYYY-MM-DD';
    } elseif ($dateObj < new DateTime('today')) {
        $errors['consultation_date'] = 'Consultation date must be in the future';
    }
}

// Validate time format
$consultationTime = trim($body['consultation_time'] ?? '');
if (!isset($errors['consultation_time']) && !preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $consultationTime)) {
    $errors['consultation_time'] = 'Invalid time format. Use HH:MM (24-hour)';
}

// Validate consultation type
$consultationType = $body['consultation_type'] ?? '';
$validTypes = ['in_person', 'video', 'phone'];
if (!isset($errors['consultation_type']) && !in_array($consultationType, $validTypes, true)) {
    $errors['consultation_type'] = 'Invalid consultation type. Allowed: ' . implode(', ', $validTypes);
}

// Validate case description length
if (!isset($errors['case_description']) && strlen(trim($body['case_description'] ?? '')) < 20) {
    $errors['case_description'] = 'Case description must be at least 20 characters long';
}

// Validate lawyer exists and is available
$lawyerId = (int) ($body['lawyer_id'] ?? 0);
if (!isset($errors['lawyer_id']) && $lawyerId > 0) {
    $lawyer = Database::fetchOne(
        "SELECT id, name, consultation_fee, currency, is_available
         FROM lawyers WHERE id = ? AND status = 'active' AND is_verified = 1",
        [$lawyerId]
    );
    if ($lawyer === null) {
        $errors['lawyer_id'] = 'Lawyer not found or not available';
    } elseif (!$lawyer['is_available']) {
        $errors['lawyer_id'] = 'This lawyer is currently not accepting bookings';
    }
} else {
    $errors['lawyer_id'] = 'Valid lawyer ID is required';
}

if (!empty($errors)) {
    Response::validationError('Validation failed', $errors);
}

$durationMinutes = (int) ($body['duration_minutes'] ?? 60);
if ($durationMinutes < 15 || $durationMinutes > 240) {
    $durationMinutes = 60;
}

// Check for conflicting bookings (same lawyer, same date, overlapping time)
$conflict = Database::fetchOne(
    "SELECT id FROM lawyer_bookings
     WHERE lawyer_id = ? AND consultation_date = ?
       AND status IN ('pending', 'confirmed')
       AND (
           (consultation_time <= ? AND DATE_ADD(consultation_time, INTERVAL duration_minutes MINUTE) > ?)
           OR
           (consultation_time < DATE_ADD(?, INTERVAL ? MINUTE) AND DATE_ADD(consultation_time, INTERVAL duration_minutes MINUTE) > ?)
       )
     LIMIT 1",
    [
        $lawyerId,
        $consultationDate,
        $consultationTime,
        $consultationTime,
        $consultationTime,
        $durationMinutes,
        $consultationTime,
    ]
);

if ($conflict !== null) {
    Response::error('This time slot is already booked. Please choose a different time.', 409);
}

// Generate a reference number
$referenceNumber = 'LB-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

// Begin transaction
Database::beginTransaction();

try {
    // Insert booking
    $bookingId = Database::insert(
        "INSERT INTO lawyer_bookings
            (user_id, lawyer_id, reference_number, consultation_date,
             consultation_time, duration_minutes, consultation_type,
             client_name, client_email, client_phone,
             case_description, notes, fee, currency, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())",
        [
            (int) $user['id'],
            $lawyerId,
            $referenceNumber,
            $consultationDate,
            $consultationTime,
            $durationMinutes,
            $consultationType,
            Auth::sanitize($body['name']),
            strtolower(trim($body['email'])),
            trim($body['phone']),
            Auth::sanitize($body['case_description']),
            isset($body['notes']) ? Auth::sanitize($body['notes']) : null,
            (float) $lawyer['consultation_fee'],
            $lawyer['currency'],
        ]
    );

    // Notify the lawyer (if they have a user account)
    $lawyerUser = Database::fetchOne(
        "SELECT user_id FROM lawyers WHERE id = ?",
        [$lawyerId]
    );

    if ($lawyerUser !== null && $lawyerUser['user_id'] !== null) {
        Auth::notify(
            (int) $lawyerUser['user_id'],
            'New Consultation Booking',
            "You have a new consultation booking from {$body['name']} on {$consultationDate} at {$consultationTime}.",
            'info',
            '/lawyer/bookings'
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
    'message' => 'Consultation booked successfully. The lawyer will confirm your appointment soon.',
    'data'    => [
        'booking_id'       => (int) $bookingId,
        'reference_number' => $referenceNumber,
        'lawyer_name'      => $lawyer['name'],
        'consultation_fee' => (float) $lawyer['consultation_fee'],
        'currency'         => $lawyer['currency'],
    ],
], 201);
