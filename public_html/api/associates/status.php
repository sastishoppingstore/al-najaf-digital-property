<?php
/**
 * ============================================================
 * GET /api/associates/status
 * ============================================================
 * Check the status of a service booking.
 * 
 * Query parameters:
 *   - reference_number  (string, optional) - booking reference
 *   - booking_id        (int, optional) - booking ID
 * 
 * Requires authentication. Users can only view their own bookings.
 * 
 * Response:
 *   200: { success, data: { booking, status_history } }
 *   404: { success: false, message } - booking not found
 * ============================================================
 */

declare(strict_types=1);

// Require authentication
$user = Auth::requireAuth();

// Rate limiting
Auth::rateLimit('associates_status');

// Only allow GET
if ($GLOBALS['route']['method'] !== 'GET') {
    Response::error('Method not allowed. Use GET.', 405);
}

// Get lookup parameters
$referenceNumber = trim($_GET['reference_number'] ?? '');
$bookingId = (int) ($_GET['booking_id'] ?? 0);

if (empty($referenceNumber) && $bookingId === 0) {
    Response::validationError('Booking identifier required', [
        'identifier' => 'Provide reference_number or booking_id',
    ]);
}

// Build lookup condition
$lookupCondition = '';
$lookupParams = [];

if ($bookingId > 0) {
    $lookupCondition = 'sr.id = ?';
    $lookupParams[] = $bookingId;
} else {
    $lookupCondition = 'sr.reference_number = ?';
    $lookupParams[] = $referenceNumber;
}

// Fetch booking (ensure user can only see their own)
$booking = Database::fetchOne(
    "SELECT sr.id, sr.reference_number, sr.customer_name, sr.customer_email,
            sr.customer_phone, sr.customer_address, sr.preferred_date,
            sr.preferred_time, sr.notes, sr.price_at_booking,
            sr.currency_at_booking, sr.status, sr.created_at, sr.updated_at,
            s.name AS service_name, s.category AS service_category,
            s.icon AS service_icon, s.description AS service_description
     FROM service_requests sr
     JOIN services s ON sr.service_id = s.id
     WHERE {$lookupCondition} AND sr.user_id = ?",
    array_merge($lookupParams, [(int) $user['id']])
);

if ($booking === null) {
    Response::notFound('Booking not found. Please check your reference number.');
}

// Fetch status history
$statusHistory = Database::fetchAll(
    "SELECT id, status, notes, created_at
     FROM service_status_history
     WHERE request_id = ?
     ORDER BY created_at ASC",
    [(int) $booking['id']]
);

Response::success([
    'booking'        => $booking,
    'status_history' => $statusHistory,
], 'Booking status retrieved successfully');
