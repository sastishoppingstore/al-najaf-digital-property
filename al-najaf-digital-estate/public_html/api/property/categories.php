<?php
/**
 * ============================================================
 * GET /api/property/categories
 * ============================================================
 * List all property categories.
 * 
 * Response:
 *   200: { success, data: [ { id, name, slug, description, property_count, icon } ] }
 * ============================================================
 */

declare(strict_types=1);

// Rate limiting
Auth::rateLimit('property_categories');

// Only allow GET
if ($GLOBALS['route']['method'] !== 'GET') {
    Response::error('Method not allowed. Use GET.', 405);
}

// Fetch all active categories with property count
$categories = Database::fetchAll(
    "SELECT c.id, c.name, c.slug, c.description, c.icon,
            (SELECT COUNT(*) FROM properties p
             WHERE p.category_id = c.id AND p.status = 'active') AS property_count
     FROM property_categories c
     WHERE c.status = 'active'
     ORDER BY c.sort_order ASC, c.name ASC"
);

Response::success($categories, 'Categories retrieved successfully');
