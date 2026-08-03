<?php
/**
 * ============================================================
 * GET /api/associates/services
 * ============================================================
 * List all available legal/associate services.
 * 
 * Query parameters:
 *   - page        (int, default 1)
 *   - per_page    (int, default 20)
 *   - category    (string, optional) - filter by category
 *   - search      (string, optional) - search in name and description
 *   - sort        (string, optional) - 'name'|'price_asc'|'price_desc'|'popular'
 * 
 * Response:
 *   200: { success, data: [...], meta: { total, page, per_page, total_pages } }
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting
Auth::rateLimit('associates_services');

// Only allow GET
if ($GLOBALS['route']['method'] !== 'GET') {
    Response::error('Method not allowed. Use GET.', 405);
}

$pagination = Response::getPagination();

// Build query with filters
$where = ["status = 'active'"];
$params = [];

// Category filter
$category = trim($_GET['category'] ?? '');
if (!empty($category)) {
    $where[] = "category = ?";
    $params[] = $category;
}

// Search
$search = trim($_GET['search'] ?? '');
if (!empty($search)) {
    $where[] = "(name LIKE ? OR description LIKE ?)";
    $searchParam = '%' . $search . '%';
    $params[] = $searchParam;
    $params[] = $searchParam;
}

$whereClause = implode(' AND ', $where);

// Sort
$sort = $_GET['sort'] ?? 'name';
$orderBy = match ($sort) {
    'price_asc'  => 'price ASC',
    'price_desc' => 'price DESC',
    'popular'    => 'booking_count DESC',
    default      => 'name ASC',
};

// Count total
$total = (int) Database::fetchScalar(
    "SELECT COUNT(*) FROM services WHERE {$whereClause}",
    $params
);

// Fetch services
$services = Database::fetchAll(
    "SELECT id, name, slug, description, category, price, currency, duration_hours,
            icon, status,
            (SELECT COUNT(*) FROM service_requests sr WHERE sr.service_id = services.id
             AND sr.status NOT IN ('cancelled')) AS booking_count,
            created_at
     FROM services
     WHERE {$whereClause}
     ORDER BY {$orderBy}
     LIMIT {$pagination['per_page']} OFFSET {$pagination['offset']}",
    $params
);

Response::paginated($services, $total, $pagination['page'], $pagination['per_page']);
