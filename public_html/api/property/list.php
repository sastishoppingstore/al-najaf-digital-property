<?php
/**
 * ============================================================
 * GET /api/property/list
 * ============================================================
 * List properties with filtering, pagination, and search.
 * 
 * Query parameters:
 *   - page          (int, default 1)
 *   - per_page      (int, default 20, max 100)
 *   - category_id   (int, optional) - filter by category
 *   - city          (string, optional) - filter by city
 *   - min_price     (float, optional) - minimum price
 *   - max_price     (float, optional) - maximum price
 *   - listing_type  (string, optional) - 'sale'|'rent'
 *   - property_type (string, optional) - 'house'|'apartment'|'land'|'commercial'
 *   - bedrooms      (int, optional) - minimum bedrooms
 *   - bathrooms     (int, optional) - minimum bathrooms
 *   - search        (string, optional) - search in title and description
 *   - sort          (string, optional) - 'newest'|'price_asc'|'price_desc'|'popular'
 *   - featured      (bool, optional) - only featured properties
 * 
 * Response:
 *   200: { success, data: [...], meta: { total, page, per_page, total_pages } }
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting
Auth::rateLimit('property_list');

// Only allow GET
if ($GLOBALS['route']['method'] !== 'GET') {
    Response::error('Method not allowed. Use GET.', 405);
}

// Get pagination
$pagination = Response::getPagination();

// Build query with filters
$where = ["p.status = 'active'"];
$params = [];

// Category filter
$categoryId = (int) ($_GET['category_id'] ?? 0);
if ($categoryId > 0) {
    $where[] = "p.category_id = ?";
    $params[] = $categoryId;
}

// City filter
$city = trim($_GET['city'] ?? '');
if (!empty($city)) {
    $where[] = "p.city LIKE ?";
    $params[] = '%' . $city . '%';
}

// Price range
$minPrice = (float) ($_GET['min_price'] ?? 0);
if ($minPrice > 0) {
    $where[] = "p.price >= ?";
    $params[] = $minPrice;
}

$maxPrice = (float) ($_GET['max_price'] ?? 0);
if ($maxPrice > 0) {
    $where[] = "p.price <= ?";
    $params[] = $maxPrice;
}

// Listing type
$listingType = $_GET['listing_type'] ?? '';
if (!empty($listingType) && in_array($listingType, ['sale', 'rent'], true)) {
    $where[] = "p.listing_type = ?";
    $params[] = $listingType;
}

// Property type
$propertyType = $_GET['property_type'] ?? '';
if (!empty($propertyType)) {
    $where[] = "p.property_type = ?";
    $params[] = $propertyType;
}

// Bedrooms
$bedrooms = (int) ($_GET['bedrooms'] ?? 0);
if ($bedrooms > 0) {
    $where[] = "p.bedrooms >= ?";
    $params[] = $bedrooms;
}

// Bathrooms
$bathrooms = (int) ($_GET['bathrooms'] ?? 0);
if ($bathrooms > 0) {
    $where[] = "p.bathrooms >= ?";
    $params[] = $bathrooms;
}

// Search
$search = trim($_GET['search'] ?? '');
if (!empty($search)) {
    $where[] = "(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ?)";
    $searchParam = '%' . $search . '%';
    $params[] = $searchParam;
    $params[] = $searchParam;
    $params[] = $searchParam;
}

// Featured
$featured = $_GET['featured'] ?? '';
if ($featured === 'true' || $featured === '1') {
    $where[] = "p.featured = 1";
}

$whereClause = implode(' AND ', $where);

// Sort
$sort = $_GET['sort'] ?? 'newest';
$orderBy = match ($sort) {
    'price_asc'  => 'p.price ASC',
    'price_desc' => 'p.price DESC',
    'popular'    => 'p.view_count DESC',
    default      => 'p.created_at DESC',
};

// Count total
$total = (int) Database::fetchScalar(
    "SELECT COUNT(*) FROM properties p WHERE {$whereClause}",
    $params
);

// Fetch properties
$properties = Database::fetchAll(
    "SELECT p.id, p.uuid, p.title, p.slug, p.description, p.price, p.currency,
            p.listing_type, p.property_type, p.address, p.city, p.state, p.country,
            p.latitude, p.longitude, p.bedrooms, p.bathrooms, p.area_sqft,
            p.featured, p.status, p.view_count, p.created_at,
            pc.name AS category_name, pc.slug AS category_slug,
            u.name AS agent_name, u.email AS agent_email, u.phone AS agent_phone,
            u.avatar_url AS agent_avatar,
            (SELECT pi.image_url FROM property_images pi
             WHERE pi.property_id = p.id AND pi.is_primary = 1
             LIMIT 1) AS primary_image,
            (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) AS image_count
     FROM properties p
     LEFT JOIN property_categories pc ON p.category_id = pc.id
     LEFT JOIN users u ON p.user_id = u.id
     WHERE {$whereClause}
     ORDER BY {$orderBy}
     LIMIT {$pagination['per_page']} OFFSET {$pagination['offset']}",
    $params
);

Response::paginated($properties, $total, $pagination['page'], $pagination['per_page']);
