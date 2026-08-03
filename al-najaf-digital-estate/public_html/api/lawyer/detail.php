<?php
/**
 * ============================================================
 * GET /api/lawyer/detail
 * ============================================================
 * Get detailed information about a specific lawyer.
 * 
 * Query parameters:
 *   - id    (int, required) - Lawyer ID
 *   - uuid  (string, optional) - Lawyer UUID
 * 
 * Response:
 *   200: { success, data: { lawyer, reviews, availability } }
 *   404: { success: false, message } - lawyer not found
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting
Auth::rateLimit('lawyer_detail');

// Only allow GET
if ($GLOBALS['route']['method'] !== 'GET') {
    Response::error('Method not allowed. Use GET.', 405);
}

// Get lookup parameters
$lawyerId = (int) ($_GET['id'] ?? 0);
$lawyerUuid = trim($_GET['uuid'] ?? '');

if ($lawyerId === 0 && empty($lawyerUuid)) {
    Response::validationError('Lawyer identifier required', [
        'identifier' => 'Provide id or uuid',
    ]);
}

// Build lookup condition
$lookupCondition = '';
$lookupParams = [];

if ($lawyerId > 0) {
    $lookupCondition = 'l.id = ?';
    $lookupParams[] = $lawyerId;
} else {
    $lookupCondition = 'l.uuid = ?';
    $lookupParams[] = $lawyerUuid;
}

// Fetch lawyer
$lawyer = Database::fetchOne(
    "SELECT l.id, l.uuid, l.name, l.email, l.phone, l.bio, l.specialties,
            l.bar_council_id, l.years_experience, l.education, l.city,
            l.state, l.avatar_url, l.rating, l.consultation_fee,
            l.currency, l.is_verified, l.is_available, l.created_at,
            (SELECT COUNT(*) FROM lawyer_bookings lb
             WHERE lb.lawyer_id = l.id AND lb.status = 'completed') AS completed_consultations,
            (SELECT COUNT(*) FROM lawyer_bookings lb
             WHERE lb.lawyer_id = l.id AND lb.status = 'confirmed') AS upcoming_consultations
     FROM lawyers l
     WHERE {$lookupCondition} AND l.status = 'active' AND l.is_verified = 1",
    $lookupParams
);

if ($lawyer === null) {
    Response::notFound('Lawyer not found or not available');
}

// Fetch recent bookings/reviews (completed consultations with feedback)
$reviews = Database::fetchAll(
    "SELECT lb.id, lb.rating, lb.feedback, lb.consultation_date,
            u.name AS client_name, u.avatar_url AS client_avatar
     FROM lawyer_bookings lb
     JOIN users u ON lb.user_id = u.id
     WHERE lb.lawyer_id = ? AND lb.status = 'completed' AND lb.feedback IS NOT NULL
     ORDER BY lb.consultation_date DESC
     LIMIT 5",
    [(int) $lawyer['id']]
);

// Fetch upcoming availability (confirmed bookings to know unavailable slots)
$upcomingBookings = Database::fetchAll(
    "SELECT consultation_date, consultation_time, duration_minutes
     FROM lawyer_bookings
     WHERE lawyer_id = ? AND status IN ('confirmed', 'pending')
       AND consultation_date >= CURDATE()
     ORDER BY consultation_date ASC, consultation_time ASC
     LIMIT 10",
    [(int) $lawyer['id']]
);

// Don't expose email in detail view (use contact through booking)
unset($lawyer['email']);

Response::success([
    'lawyer'          => $lawyer,
    'reviews'         => $reviews,
    'availability'    => $upcomingBookings,
], 'Lawyer details retrieved successfully');
