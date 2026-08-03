<?php
/**
 * ============================================================
 * GET  /api/admin/properties    - List all properties (with filters)
 * PUT  /api/admin/properties    - Update property status
 * DELETE /api/admin/properties  - Delete a property
 * ============================================================
 * 
 * GET query parameters:
 *   - page, per_page, status, category_id, search, sort
 * 
 * PUT body:
 *   - id      (int, required)
 *   - status  (string, required: 'active'|'pending'|'rejected'|'expired')
 *   - featured (bool, optional)
 * 
 * DELETE body:
 *   - id  (int, required)
 * 
 * Requires admin authentication.
 * ============================================================
 */

declare(strict_types=1);

// Require admin authentication
$admin = Auth::requireAdmin();

// Rate limiting
Auth::rateLimit('admin_properties');

$method = $GLOBALS['route']['method'];

// ============================================================
// GET - List all properties
// ============================================================
if ($method === 'GET') {
    $pagination = Response::getPagination();

    $where = ["1=1"];
    $params = [];

    // Status filter
    $status = trim($_GET['status'] ?? '');
    if (!empty($status)) {
        $where[] = "p.status = ?";
        $params[] = $status;
    }

    // Category filter
    $categoryId = (int) ($_GET['category_id'] ?? 0);
    if ($categoryId > 0) {
        $where[] = "p.category_id = ?";
        $params[] = $categoryId;
    }

    // Search
    $search = trim($_GET['search'] ?? '');
    if (!empty($search)) {
        $where[] = "(p.title LIKE ? OR p.address LIKE ? OR u.name LIKE ?)";
        $searchParam = '%' . $search . '%';
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
    }

    $whereClause = implode(' AND ', $where);

    $total = (int) Database::fetchScalar(
        "SELECT COUNT(*) FROM properties p LEFT JOIN users u ON p.user_id = u.id WHERE {$whereClause}",
        $params
    );

    $properties = Database::fetchAll(
        "SELECT p.id, p.uuid, p.title, p.slug, p.price, p.currency, p.listing_type,
                p.property_type, p.city, p.status, p.featured, p.view_count,
                p.created_at, p.updated_at,
                pc.name AS category_name,
                u.name AS agent_name, u.email AS agent_email
         FROM properties p
         LEFT JOIN property_categories pc ON p.category_id = pc.id
         LEFT JOIN users u ON p.user_id = u.id
         WHERE {$whereClause}
         ORDER BY p.created_at DESC
         LIMIT {$pagination['per_page']} OFFSET {$pagination['offset']}",
        $params
    );

    Response::paginated($properties, $total, $pagination['page'], $pagination['per_page']);
}

// ============================================================
// PUT - Update property status/featured
// ============================================================
if ($method === 'PUT' || $method === 'PATCH') {
    $body = Response::getRequestBody();

    $errors = Response::validateRequired(['id', 'status']);
    if (!empty($errors)) {
        Response::validationError('Validation failed', $errors);
    }

    $propertyId = (int) $body['id'];
    $newStatus = trim($body['status']);

    $validStatuses = ['active', 'pending', 'rejected', 'expired'];
    if (!in_array($newStatus, $validStatuses, true)) {
        Response::validationError('Validation failed', [
            'status' => 'Invalid status. Allowed: ' . implode(', ', $validStatuses),
        ]);
    }

    // Check property exists
    $property = Database::fetchOne(
        "SELECT id, title, user_id FROM properties WHERE id = ?",
        [$propertyId]
    );

    if ($property === null) {
        Response::notFound('Property not found');
    }

    $updateFields = ["status = ?", "updated_at = NOW()"];
    $updateParams = [$newStatus];

    // Update featured flag if provided
    if (isset($body['featured'])) {
        $updateFields[] = "featured = ?";
        $updateParams[] = $body['featured'] ? 1 : 0;
    }

    $updateParams[] = $propertyId;

    Database::execute(
        "UPDATE properties SET " . implode(', ', $updateFields) . " WHERE id = ?",
        $updateParams
    );

    // Notify the property owner
    if ($property['user_id'] !== null) {
        $statusMessage = match ($newStatus) {
            'active'   => 'approved and is now live',
            'rejected' => 'rejected. Please review and resubmit',
            'expired'  => 'marked as expired',
            default   => 'updated to ' . $newStatus,
        };
        Auth::notify(
            (int) $property['user_id'],
            'Property Status Update',
            "Your property '{$property['title']}' has been {$statusMessage}.",
            $newStatus === 'active' ? 'success' : 'warning',
            '/property/' . $propertyId
        );
    }

    Auth::logAdminAction((int) $admin['id'], "Updated property status to {$newStatus}", 'properties', $propertyId);

    Response::success([
        'id'     => $propertyId,
        'status' => $newStatus,
    ], 'Property updated successfully');
}

// ============================================================
// DELETE - Delete a property
// ============================================================
if ($method === 'DELETE') {
    $body = Response::getRequestBody();

    $propertyId = (int) ($body['id'] ?? 0);
    if ($propertyId === 0) {
        Response::validationError('Validation failed', ['id' => 'Property ID is required']);
    }

    $property = Database::fetchOne(
        "SELECT id, title, user_id FROM properties WHERE id = ?",
        [$propertyId]
    );

    if ($property === null) {
        Response::notFound('Property not found');
    }

    // Soft delete by setting status to 'deleted'
    Database::execute(
        "UPDATE properties SET status = 'deleted', updated_at = NOW() WHERE id = ?",
        [$propertyId]
    );

    Auth::logAdminAction((int) $admin['id'], "Deleted property '{$property['title']}'", 'properties', $propertyId);

    Response::success([], 'Property deleted successfully');
}

Response::error('Method not allowed', 405);
