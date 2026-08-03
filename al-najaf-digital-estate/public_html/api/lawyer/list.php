<?php
/**
 * ============================================================
 * GET /api/lawyer/list
 * ============================================================
 * List all verified lawyers.
 * 
 * Query parameters:
 *   - page        (int, default 1)
 *   - per_page    (int, default 20)
 *   - city        (string, optional) - filter by city
 *   - specialty   (string, optional) - filter by specialty
 *   - search      (string, optional) - search in name, bio, and specialties
 *   - sort        (string, optional) - 'name'|'experience'|'rating'
 * 
 * Response:
 *   200: { success, data: [...], meta: { total, page, per_page, total_pages } }
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting
Auth::rateLimit('lawyer_list');

// Only allow GET
if ($GLOBALS['route']['method'] !== 'GET') {
    Response::error('Method not allowed. Use GET.', 405);
}

$pagination = Response::getPagination();

// Build query with filters
$where = ["l.status = 'active' AND l.is_verified = 1"];
$params = [];

// City filter
$city = trim($_GET['city'] ?? '');
if (!empty($city)) {
    $where[] = "l.city LIKE ?";
    $params[] = '%' . $city . '%';
}

// Specialty filter
$specialty = trim($_GET['specialty'] ?? '');
if (!empty($specialty)) {
    $where[] = "l.specialties LIKE ?";
    $params[] = '%' . $specialty . '%';
}

// Search
$search = trim($_GET['search'] ?? '');
if (!empty($search)) {
    $where[] = "(l.name LIKE ? OR l.bio LIKE ? OR l.specialties LIKE ?)";
    $searchParam = '%' . $search . '%';
    $params[] = $searchParam;
    $params[] = $searchParam;
    $params[] = $searchParam;
}

$whereClause = implode(' AND ', $where);

// Sort
$sort = $_GET['sort'] ?? 'name';
$orderBy = match ($sort) {
    'experience' => 'l.years_experience DESC',
    'rating'     => 'l.rating DESC',
    default      => 'l.name ASC',
};

// Count total
$total = (int) Database::fetchScalar(
    "SELECT COUNT(*) FROM lawyers l WHERE {$whereClause}",
    $params
);

// Fetch lawyers
$lawyers = Database::fetchAll(
    "SELECT l.id, l.uuid, l.name, l.email, l.phone, l.bio, l.specialties,
            l.bar_council_id, l.years_experience, l.education, l.city,
            l.state, l.avatar_url, l.rating, l.consultation_fee,
            l.currency, l.is_verified, l.is_available,
            (SELECT COUNT(*) FROM lawyer_bookings lb
             WHERE lb.lawyer_id = l.id AND lb.status = 'completed') AS completed_consultations,
            (SELECT COUNT(*) FROM lawyer_bookings lb
             WHERE lb.lawyer_id = l.id AND lb.status = 'confirmed') AS upcoming_consultations
     FROM lawyers l
     WHERE {$whereClause}
     ORDER BY {$orderBy}
     LIMIT {$pagination['per_page']} OFFSET {$pagination['offset']}",
    $params
);

// Don't expose email addresses in the list
foreach ($lawyers as &$lawyer) {
    unset($lawyer['email']);
}

Response::paginated($lawyers, $total, $pagination['page'], $pagination['per_page']);
