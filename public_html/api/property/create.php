<?php
/**
 * ============================================================
 * POST /api/property/create
 * ============================================================
 * Create a new property listing. Requires authentication (user or agent role).
 * 
 * Request body:
 *   - title          (string, required, min 5 chars)
 *   - description    (string, required, min 20 chars)
 *   - price          (float, required, > 0)
 *   - currency       (string, optional, default 'PKR')
 *   - listing_type   (string, required: 'sale'|'rent')
 *   - property_type  (string, required: 'house'|'apartment'|'land'|'commercial')
 *   - category_id   (int, required)
 *   - address        (string, required)
 *   - city           (string, required)
 *   - state          (string, optional)
 *   - country        (string, optional, default 'Pakistan')
 *   - latitude       (float, optional)
 *   - longitude      (float, optional)
 *   - bedrooms       (int, optional)
 *   - bathrooms      (int, optional)
 *   - area_sqft      (float, optional)
 *   - images         (array, optional) - array of image URLs
 * 
 * Response:
 *   201: { success, message, data: { id, uuid, slug } }
 *   422: { success: false, message, errors }
 * ============================================================
 */

declare(strict_types=1);

// Require authentication (user or agent)
$user = Auth::requireRole(['user', 'agent']);

// Rate limiting
Auth::rateLimit('property_create');

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

$body = Response::getRequestBody();

// Validate required fields
$errors = Response::validateRequired([
    'title', 'description', 'price', 'listing_type', 'property_type', 'category_id', 'address', 'city'
]);

// Validate title length
if (!isset($errors['title']) && strlen(trim($body['title'] ?? '')) < 5) {
    $errors['title'] = 'Title must be at least 5 characters long';
}

// Validate description length
if (!isset($errors['description']) && strlen(trim($body['description'] ?? '')) < 20) {
    $errors['description'] = 'Description must be at least 20 characters long';
}

// Validate price
if (!isset($errors['price']) && (float) ($body['price'] ?? 0) <= 0) {
    $errors['price'] = 'Price must be greater than 0';
}

// Validate listing_type
$listingType = $body['listing_type'] ?? '';
if (!isset($errors['listing_type']) && !in_array($listingType, ['sale', 'rent'], true)) {
    $errors['listing_type'] = 'Listing type must be "sale" or "rent"';
}

// Validate property_type
$propertyType = $body['property_type'] ?? '';
if (!isset($errors['property_type']) && !in_array($propertyType, ['house', 'apartment', 'land', 'commercial'], true)) {
    $errors['property_type'] = 'Property type must be: house, apartment, land, or commercial';
}

// Validate category exists
$categoryId = (int) ($body['category_id'] ?? 0);
if (!isset($errors['category_id']) && $categoryId > 0) {
    $category = Database::fetchOne(
        "SELECT id FROM property_categories WHERE id = ? AND status = 'active'",
        [$categoryId]
    );
    if ($category === null) {
        $errors['category_id'] = 'Invalid or inactive category';
    }
}

if (!empty($errors)) {
    Response::validationError('Validation failed', $errors);
}

// Generate slug from title
$slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $body['title']), '-'));
$slug .= '-' . substr(Auth::generateUuid(), 0, 8);

// Generate UUID
$uuid = Auth::generateUuid();

// Begin transaction
Database::beginTransaction();

try {
    // Insert property
    $propertyId = Database::insert(
        "INSERT INTO properties
            (uuid, user_id, category_id, title, slug, description, price, currency,
             listing_type, property_type, address, city, state, country,
             latitude, longitude, bedrooms, bathrooms, area_sqft,
             featured, status, view_count, created_at, updated_at)
         VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', 0, NOW(), NOW())",
        [
            $uuid,
            (int) $user['id'],
            $categoryId,
            Auth::sanitize($body['title']),
            $slug,
            Auth::sanitize($body['description']),
            (float) $body['price'],
            $body['currency'] ?? 'PKR',
            $listingType,
            $propertyType,
            Auth::sanitize($body['address']),
            Auth::sanitize($body['city']),
            Auth::sanitize($body['state'] ?? ''),
            Auth::sanitize($body['country'] ?? 'Pakistan'),
            isset($body['latitude']) ? (float) $body['latitude'] : null,
            isset($body['longitude']) ? (float) $body['longitude'] : null,
            isset($body['bedrooms']) ? (int) $body['bedrooms'] : null,
            isset($body['bathrooms']) ? (int) $body['bathrooms'] : null,
            isset($body['area_sqft']) ? (float) $body['area_sqft'] : null,
        ]
    );

    // Insert images if provided
    if (!empty($body['images']) && is_array($body['images'])) {
        $imageOrder = 0;
        foreach ($body['images'] as $index => $imageUrl) {
            if (empty($imageUrl)) {
                continue;
            }
            $isPrimary = ($index === 0) ? 1 : 0;
            Database::insert(
                "INSERT INTO property_images
                    (property_id, image_url, caption, is_primary, sort_order, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())",
                [
                    (int) $propertyId,
                    trim($imageUrl),
                    $body['image_captions'][$index] ?? null,
                    $isPrimary,
                    $imageOrder++,
                ]
            );
        }
    }

    // Create verification request (properties need admin approval)
    Database::insert(
        "INSERT INTO verification_requests
            (user_id, property_id, request_type, status, submitted_at, created_at)
         VALUES (?, ?, 'property', 'pending', NOW(), NOW())",
        [
            (int) $user['id'],
            (int) $propertyId,
        ]
    );

    // Notify admins
    $admins = Database::fetchAll(
        "SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active'"
    );
    foreach ($admins as $admin) {
        Auth::notify(
            (int) $admin['id'],
            'New Property Submitted',
            "A new property '{$body['title']}' has been submitted and requires approval.",
            'info',
            '/admin/properties'
        );
    }

    Database::commit();
} catch (Throwable $e) {
    Database::rollback();
    if (APP_DEBUG) {
        Response::serverError('Failed to create property: ' . $e->getMessage());
    }
    Response::serverError('Failed to create property. Please try again.');
}

Response::json([
    'success' => true,
    'message' => 'Property created successfully. It will be visible after admin approval.',
    'data'    => [
        'id'   => (int) $propertyId,
        'uuid' => $uuid,
        'slug' => $slug,
    ],
], 201);
