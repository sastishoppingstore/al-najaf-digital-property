<?php
/**
 * ============================================================
 * GET  /api/admin/users    - List all users
 * PUT  /api/admin/users    - Update user (status, role)
 * ============================================================
 * 
 * GET query parameters:
 *   - page, per_page, status, role, search
 * 
 * PUT body:
 *   - id      (int, required)
 *   - status  (string, optional: 'active'|'suspended'|'pending')
 *   - role    (string, optional: 'user'|'agent'|'lawyer'|'admin')
 * 
 * Requires admin authentication.
 * ============================================================
 */

declare(strict_types=1);

// Require admin authentication
$admin = Auth::requireAdmin();

// Rate limiting
Auth::rateLimit('admin_users');

$method = $GLOBALS['route']['method'];

// ============================================================
// GET - List all users
// ============================================================
if ($method === 'GET') {
    $pagination = Response::getPagination();

    $where = ["u.status != 'deleted'"];
    $params = [];

    // Status filter
    $status = trim($_GET['status'] ?? '');
    if (!empty($status)) {
        $where[] = "u.status = ?";
        $params[] = $status;
    }

    // Role filter
    $role = trim($_GET['role'] ?? '');
    if (!empty($role)) {
        $where[] = "u.role = ?";
        $params[] = $role;
    }

    // Search
    $search = trim($_GET['search'] ?? '');
    if (!empty($search)) {
        $where[] = "(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
        $searchParam = '%' . $search . '%';
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
    }

    $whereClause = implode(' AND ', $where);

    $total = (int) Database::fetchScalar(
        "SELECT COUNT(*) FROM users u WHERE {$whereClause}",
        $params
    );

    $users = Database::fetchAll(
        "SELECT u.id, u.uuid, u.name, u.email, u.phone, u.role, u.status,
                u.email_verified_at, u.avatar_url, u.bio, u.created_at, u.updated_at,
                (SELECT COUNT(*) FROM properties p WHERE p.user_id = u.id) AS property_count,
                (SELECT COUNT(*) FROM estamp_applications ea WHERE ea.user_id = u.id) AS estamp_count,
                (SELECT COUNT(*) FROM service_requests sr WHERE sr.user_id = u.id) AS service_count,
                (SELECT COUNT(*) FROM lawyer_bookings lb WHERE lb.user_id = u.id) AS lawyer_bookings_count
         FROM users u
         WHERE {$whereClause}
         ORDER BY u.created_at DESC
         LIMIT {$pagination['per_page']} OFFSET {$pagination['offset']}",
        $params
    );

    Response::paginated($users, $total, $pagination['page'], $pagination['per_page']);
}

// ============================================================
// PUT - Update user status/role
// ============================================================
if ($method === 'PUT' || $method === 'PATCH') {
    $body = Response::getRequestBody();

    $errors = Response::validateRequired(['id']);
    if (!empty($errors)) {
        Response::validationError('Validation failed', $errors);
    }

    $userId = (int) $body['id'];

    // Prevent self-modification for admins
    if ($userId === (int) $admin['id']) {
        Response::error('You cannot modify your own account', 403);
    }

    // Check user exists
    $user = Database::fetchOne(
        "SELECT id, name, email, role, status FROM users WHERE id = ?",
        [$userId]
    );

    if ($user === null) {
        Response::notFound('User not found');
    }

    $updateFields = ["updated_at = NOW()"];
    $updateParams = [];

    // Update status
    if (isset($body['status'])) {
        $validStatuses = ['active', 'suspended', 'pending', 'deleted'];
        if (!in_array($body['status'], $validStatuses, true)) {
            Response::validationError('Validation failed', ['status' => 'Invalid status']);
        }
        $updateFields[] = "status = ?";
        $updateParams[] = $body['status'];
    }

    // Update role
    if (isset($body['role'])) {
        $validRoles = ['user', 'agent', 'lawyer', 'admin', 'super_admin'];
        if (!in_array($body['role'], $validRoles, true)) {
            Response::validationError('Validation failed', ['role' => 'Invalid role']);
        }
        // Only super_admin can create admins
        if (in_array($body['role'], ['admin', 'super_admin'], true) && !in_array($admin['role'], ['super_admin'], true)) {
            Response::forbidden('Only super admins can assign admin roles');
        }
        $updateFields[] = "role = ?";
        $updateParams[] = $body['role'];
    }

    if (count($updateFields) === 1) {
        Response::validationError('No fields to update');
    }

    $updateParams[] = $userId;

    Database::execute(
        "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?",
        $updateParams
    );

    // Notify user
    $action = '';
    if (isset($body['status'])) {
        $action = "status changed to {$body['status']}";
    }
    if (isset($body['role'])) {
        $action .= (empty($action) ? '' : ', ') . "role changed to {$body['role']}";
    }
    Auth::notify(
        $userId,
        'Account Update',
        "Your account has been updated: {$action}.",
        'info',
        '/profile'
    );

    Auth::logAdminAction((int) $admin['id'], "Updated user '{$user['name']}' ({$action})", 'users', $userId);

    Response::success([
        'id' => $userId,
    ], 'User updated successfully');
}

Response::error('Method not allowed', 405);
