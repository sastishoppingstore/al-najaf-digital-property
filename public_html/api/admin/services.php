<?php
/**
 * ============================================================
 * GET  /api/admin/services    - List all service requests
 * PUT  /api/admin/services    - Update service request status
 * POST /api/admin/services    - Create a new service
 * ============================================================
 * 
 * GET query parameters:
 *   - page, per_page, status, search
 * 
 * PUT body:
 *   - id      (int, required)
 *   - status  (string, required: 'confirmed'|'completed'|'cancelled')
 *   - notes   (string, optional)
 * 
 * POST body:
 *   - name, description, category, price, currency, duration_hours, icon
 * 
 * Requires admin authentication.
 * ============================================================
 */

declare(strict_types=1);

// Require admin authentication
$admin = Auth::requireAdmin();

// Rate limiting
Auth::rateLimit('admin_services');

$method = $GLOBALS['route']['method'];

// ============================================================
// GET - List all service requests
// ============================================================
if ($method === 'GET') {
    $pagination = Response::getPagination();

    $where = ["1=1"];
    $params = [];

    // Status filter
    $status = trim($_GET['status'] ?? '');
    if (!empty($status)) {
        $where[] = "sr.status = ?";
        $params[] = $status;
    }

    // Search
    $search = trim($_GET['search'] ?? '');
    if (!empty($search)) {
        $where[] = "(sr.reference_number LIKE ? OR sr.customer_name LIKE ? OR s.name LIKE ?)";
        $searchParam = '%' . $search . '%';
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
    }

    $whereClause = implode(' AND ', $where);

    $total = (int) Database::fetchScalar(
        "SELECT COUNT(*) FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE {$whereClause}",
        $params
    );

    $requests = Database::fetchAll(
        "SELECT sr.id, sr.reference_number, sr.customer_name, sr.customer_email,
                sr.customer_phone, sr.customer_address, sr.preferred_date,
                sr.preferred_time, sr.notes, sr.price_at_booking,
                sr.currency_at_booking, sr.status, sr.created_at, sr.updated_at,
                s.id AS service_id, s.name AS service_name, s.category AS service_category,
                s.icon AS service_icon,
                u.name AS user_name
         FROM service_requests sr
         JOIN services s ON sr.service_id = s.id
         LEFT JOIN users u ON sr.user_id = u.id
         WHERE {$whereClause}
         ORDER BY sr.created_at DESC
         LIMIT {$pagination['per_page']} OFFSET {$pagination['offset']}",
        $params
    );

    // Also fetch the list of available services
    $services = Database::fetchAll(
        "SELECT id, name, slug, description, category, price, currency,
                duration_hours, icon, status, created_at
         FROM services
         ORDER BY name ASC"
    );

    Response::success([
        'requests'  => $requests,
        'services'  => $services,
        'meta'      => [
            'total'       => $total,
            'page'        => $pagination['page'],
            'per_page'    => $pagination['per_page'],
            'total_pages' => (int) ceil($total / $pagination['per_page']),
        ],
    ], 'Service requests retrieved successfully');
}

// ============================================================
// PUT - Update service request status
// ============================================================
if ($method === 'PUT' || $method === 'PATCH') {
    $body = Response::getRequestBody();

    $errors = Response::validateRequired(['id', 'status']);
    if (!empty($errors)) {
        Response::validationError('Validation failed', $errors);
    }

    $requestId = (int) $body['id'];
    $newStatus = trim($body['status']);

    $validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!in_array($newStatus, $validStatuses, true)) {
        Response::validationError('Validation failed', [
            'status' => 'Invalid status. Allowed: ' . implode(', ', $validStatuses),
        ]);
    }

    // Check request exists
    $request = Database::fetchOne(
        "SELECT id, reference_number, user_id, status, customer_name, service_id
         FROM service_requests WHERE id = ?",
        [$requestId]
    );

    if ($request === null) {
        Response::notFound('Service request not found');
    }

    Database::beginTransaction();

    try {
        // Update request status
        Database::execute(
            "UPDATE service_requests SET status = ?, updated_at = NOW() WHERE id = ?",
            [
                $newStatus,
                $requestId,
            ]
        );

        // Add status history
        Database::insert(
            "INSERT INTO service_status_history
                (request_id, status, notes, changed_by, created_at)
             VALUES (?, ?, ?, ?, NOW())",
            [
                $requestId,
                $newStatus,
                isset($body['notes']) ? Auth::sanitize($body['notes']) : "Status changed to {$newStatus}",
                (int) $admin['id'],
            ]
        );

        // Notify user
        if ($request['user_id'] !== null) {
            $statusMessages = [
                'confirmed'    => 'has been confirmed',
                'in_progress' => 'is now in progress',
                'completed'   => 'has been completed',
                'cancelled'   => 'has been cancelled',
            ];
            $msg = $statusMessages[$newStatus] ?? "status updated to {$newStatus}";
            Auth::notify(
                (int) $request['user_id'],
                'Service Request Update',
                "Your service request (Ref: {$request['reference_number']}) {$msg}.",
                $newStatus === 'completed' ? 'success' : ($newStatus === 'cancelled' ? 'error' : 'info'),
                '/associates/status?reference_number=' . $request['reference_number']
            );
        }

        Database::commit();
    } catch (Throwable $e) {
        Database::rollback();
        if (APP_DEBUG) {
            Response::serverError('Update failed: ' . $e->getMessage());
        }
        Response::serverError('Failed to update service request');
    }

    Auth::logAdminAction((int) $admin['id'], "Updated service request to {$newStatus}", 'services', $requestId);

    Response::success([
        'id'     => $requestId,
        'status' => $newStatus,
    ], 'Service request updated successfully');
}

// ============================================================
// POST - Create a new service
// ============================================================
if ($method === 'POST') {
    $body = Response::getRequestBody();

    $errors = Response::validateRequired(['name', 'description', 'category', 'price']);
    if (!empty($errors)) {
        Response::validationError('Validation failed', $errors);
    }

    if ((float) ($body['price'] ?? 0) < 0) {
        Response::validationError('Validation failed', ['price' => 'Price must be 0 or greater']);
    }

    // Generate slug
    $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $body['name']), '-'));

    $serviceId = Database::insert(
        "INSERT INTO services
            (name, slug, description, category, price, currency,
             duration_hours, icon, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())",
        [
            Auth::sanitize($body['name']),
            $slug,
            Auth::sanitize($body['description']),
            Auth::sanitize($body['category']),
            (float) $body['price'],
            $body['currency'] ?? 'PKR',
            isset($body['duration_hours']) ? (int) $body['duration_hours'] : 1,
            $body['icon'] ?? null,
        ]
    );

    Auth::logAdminAction((int) $admin['id'], "Created service '{$body['name']}'", 'services', (int) $serviceId);

    Response::json([
        'success' => true,
        'message' => 'Service created successfully',
        'data'    => [
            'id'   => (int) $serviceId,
            'slug' => $slug,
        ],
    ], 201);
}

Response::error('Method not allowed', 405);
