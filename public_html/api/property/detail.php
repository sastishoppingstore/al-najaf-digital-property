<?php
/**
 * ============================================================
 * GET /api/property/detail
 * ============================================================
 * Get detailed information about a specific property.
 * 
 * Query parameters:
 *   - id    (int, optional) - Property ID
 *   - uuid  (string, optional) - Property UUID
 *   - slug  (string, optional) - Property slug
 * 
 * At least one of id, uuid, or slug is required.
 * 
 * Response:
 *   200: { success, data: { property, images, agent, similar } }
 *   404: { success: false, message } - property not found
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting
Auth::rateLimit('property_detail');

// Only allow GET
if ($GLOBALS['route']['method'] !== 'GET') {
    Response::error('Method not allowed. Use GET.', 405);
}

// Determine lookup method
$propertyId = (int) ($_GET['id'] ?? 0);
$propertyUuid = trim($_GET['uuid'] ?? '');
$propertySlug = trim($_GET['slug'] ?? '');

if ($propertyId === 0 && empty($propertyUuid) && empty($propertySlug)) {
    Response::validationError('Property identifier required', [
        'identifier' => 'Provide id, uuid, or slug',
    ]);
}

// Build lookup condition
$lookupCondition = '';
$lookupParams = [];

if ($propertyId > 0) {
    $lookupCondition = 'p.id = ?';
    $lookupParams[] = $propertyId;
} elseif (!empty($propertyUuid)) {
    $lookupCondition = 'p.uuid = ?';
    $lookupParams[] = $propertyUuid;
} else {
    $lookupCondition = 'p.slug = ?';
    $lookupParams[] = $propertySlug;
}

// Fetch property
$property = Database::fetchOne(
    "SELECT p.id, p.uuid, p.title, p.slug, p.description, p.price, p.currency,
            p.listing_type, p.property_type, p.address, p.city, p.state, p.country,
            p.latitude, p.longitude, p.bedrooms, p.bathrooms, p.area_sqft,
            p.featured, p.status, p.view_count, p.created_at, p.updated_at,
            pc.id AS category_id, pc.name AS category_name, pc.slug AS category_slug,
            u.id AS agent_id, u.name AS agent_name, u.email AS agent_email,
            u.phone AS agent_phone, u.avatar_url AS agent_avatar
     FROM properties p
     LEFT JOIN property_categories pc ON p.category_id = pc.id
     LEFT JOIN users u ON p.user_id = u.id
     WHERE {$lookupCondition} AND p.status = 'active'",
    $lookupParams
);

if ($property === null) {
    Response::notFound('Property not found or not available');
}

// Increment view count (non-blocking)
try {
    Database::execute(
        "UPDATE properties SET view_count = view_count + 1 WHERE id = ?",
        [(int) $property['id']]
    );
} catch (Throwable $e) {
    // Non-critical
}

// Fetch property images
$images = Database::fetchAll(
    "SELECT id, image_url, caption, is_primary, sort_order, created_at
     FROM property_images
     WHERE property_id = ?
     ORDER BY is_primary DESC, sort_order ASC",
    [(int) $property['id']]
);

// Fetch similar properties (same category, exclude current)
$similar = Database::fetchAll(
    "SELECT p.id, p.uuid, p.title, p.slug, p.price, p.currency, p.city,
            p.bedrooms, p.bathrooms, p.area_sqft, p.listing_type,
            (SELECT pi.image_url FROM property_images pi
             WHERE pi.property_id = p.id AND pi.is_primary = 1
             LIMIT 1) AS primary_image
     FROM properties p
     WHERE p.category_id = ? AND p.id != ? AND p.status = 'active'
     ORDER BY p.created_at DESC
     LIMIT 4",
    [
        (int) ($property['category_id'] ?? 0),
        (int) $property['id'],
    ]
);

Response::success([
    'property' => $property,
    'images'  => $images,
    'similar' => $similar,
], 'Property retrieved successfully');
