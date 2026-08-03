<?php
/**
 * ============================================================
 * GET  /api/admin/lawyers    - List all lawyers
 * PUT  /api/admin/lawyers    - Update lawyer (verify, availability, status)
 * POST /api/admin/lawyers    - Add a new lawyer
 * ============================================================
 * 
 * GET query parameters:
 *   - page, per_page, status, search
 * 
 * PUT body:
 *   - id             (int, required)
 *   - is_verified    (bool, optional)
 *   - is_available   (bool, optional)
 *   - status         (string, optional: 'active'|'inactive'|'suspended')
 *   - consultation_fee (float, optional)
 * 
 * POST body:
 *   - name, email, phone, bio, specialties, bar_council_id,
 *   - years_experience, education, city, state, consultation_fee, currency
 * 
 * Requires admin authentication.
 * ============================================================
 */

declare(strict_types=1);

// Require admin authentication
$admin = Auth::requireAdmin();

// Rate limiting
Auth::rateLimit('admin_lawyers');

$method = $GLOBALS['route']['method'];

// ============================================================
// GET - List all lawyers
// ============================================================
if ($method === 'GET') {
    $pagination = Response::getPagination();

    $where = ["1=1"];
    $params = [];

    // Status filter
    $status = trim($_GET['status'] ?? '');
    if (!empty($status)) {
        $where[] = "l.status = ?";
        $params[] = $status;
    }

    // Verified filter
    $verified = $_GET['verified'] ?? '';
    if ($verified === 'true' || $verified === '1') {
        $where[] = "l.is_verified = 1";
    } elseif ($verified === 'false' || $verified === '0') {
        $where[] = "l.is_verified = 0";
    }

    // Search
    $search = trim($_GET['search'] ?? '');
    if (!empty($search)) {
        $where[] = "(l.name LIKE ? OR l.email LIKE ? OR l.specialties LIKE ? OR l.city LIKE ?)";
        $searchParam = '%' . $search . '%';
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
    }

    $whereClause = implode(' AND ', $where);

    $total = (int) Database::fetchScalar(
        "SELECT COUNT(*) FROM lawyers l WHERE {$whereClause}",
        $params
    );

    $lawyers = Database::fetchAll(
        "SELECT l.id, l.uuid, l.name, l.email, l.phone, l.bio, l.specialties,
                l.bar_council_id, l.years_experience, l.education, l.city,
                l.state, l.avatar_url, l.rating, l.consultation_fee,
                l.currency, l.is_verified, l.is_available, l.status,
                l.created_at,
                (SELECT COUNT(*) FROM lawyer_bookings lb
                 WHERE lb.lawyer_id = l.id) AS total_bookings,
                (SELECT COUNT(*) FROM lawyer_bookings lb
                 WHERE lb.lawyer_id = l.id AND lb.status = 'pending') AS pending_bookings,
                (SELECT COUNT(*) FROM lawyer_bookings lb
                 WHERE lb.lawyer_id = l.id AND lb.status = 'completed') AS completed_bookings
         FROM lawyers l
         WHERE {$whereClause}
         ORDER BY l.created_at DESC
         LIMIT {$pagination['per_page']} OFFSET {$pagination['offset']}",
        $params
    );

    Response::paginated($lawyers, $total, $pagination['page'], $pagination['per_page']);
}

// ============================================================
// PUT - Update lawyer
// ============================================================
if ($method === 'PUT' || $method === 'PATCH') {
    $body = Response::getRequestBody();

    $errors = Response::validateRequired(['id']);
    if (!empty($errors)) {
        Response::validationError('Validation failed', $errors);
    }

    $lawyerId = (int) $body['id'];

    // Check lawyer exists
    $lawyer = Database::fetchOne(
        "SELECT id, name, email, user_id, is_verified, status FROM lawyers WHERE id = ?",
        [$lawyerId]
    );

    if ($lawyer === null) {
        Response::notFound('Lawyer not found');
    }

    $updateFields = [];
    $updateParams = [];

    // Update verification status
    if (isset($body['is_verified'])) {
        $updateFields[] = "is_verified = ?";
        $updateParams[] = $body['is_verified'] ? 1 : 0;
    }

    // Update availability
    if (isset($body['is_available'])) {
        $updateFields[] = "is_available = ?";
        $updateParams[] = $body['is_available'] ? 1 : 0;
    }

    // Update status
    if (isset($body['status'])) {
        $validStatuses = ['active', 'inactive', 'suspended'];
        if (!in_array($body['status'], $validStatuses, true)) {
            Response::validationError('Validation failed', ['status' => 'Invalid status']);
        }
        $updateFields[] = "status = ?";
        $updateParams[] = $body['status'];
    }

    // Update consultation fee
    if (isset($body['consultation_fee'])) {
        $updateFields[] = "consultation_fee = ?";
        $updateParams[] = (float) $body['consultation_fee'];
    }

    if (empty($updateFields)) {
        Response::validationError('No fields to update');
    }

    $updateParams[] = $lawyerId;

    Database::execute(
        "UPDATE lawyers SET " . implode(', ', $updateFields) . " WHERE id = ?",
        $updateParams
    );

    // Notify the lawyer's user account if they have one
    if ($lawyer['user_id'] !== null) {
        $action = '';
        if (isset($body['is_verified'])) {
            $action = $body['is_verified'] ? 'verified' : 'unverified';
        }
        if (isset($body['status'])) {
            $action = $body['status'];
        }
        if (!empty($action)) {
            Auth::notify(
                (int) $lawyer['user_id'],
                'Account Update',
                "Your lawyer account has been {$action}.",
                $action === 'active' || $action === 'verified' ? 'success' : 'warning',
                '/lawyer/profile'
            );
        }
    }

    Auth::logAdminAction((int) $admin['id'], "Updated lawyer '{$lawyer['name']}'", 'lawyers', $lawyerId);

    Response::success([
        'id' => $lawyerId,
    ], 'Lawyer updated successfully');
}

// ============================================================
// POST - Add a new lawyer
// ============================================================
if ($method === 'POST') {
    $body = Response::getRequestBody();

    $errors = Response::validateRequired(['name', 'email', 'phone', 'specialties', 'city']);
    if (!empty($errors)) {
        Response::validationError('Validation failed', $errors);
    }

    if (!Auth::validateEmail($body['email'])) {
        Response::validationError('Validation failed', ['email' => 'Invalid email address']);
    }

    // Check if lawyer email already exists
    $existing = Database::fetchOne(
        "SELECT id FROM lawyers WHERE email = ?",
        [strtolower(trim($body['email']))]
    );

    if ($existing !== null) {
        Response::error('A lawyer with this email already exists', 409);
    }

    $uuid = Auth::generateUuid();

    $lawyerId = Database::insert(
        "INSERT INTO lawyers
            (uuid, user_id, name, email, phone, bio, specialties,
             bar_council_id, years_experience, education, city, state,
             avatar_url, rating, consultation_fee, currency,
             is_verified, is_available, status, created_at, updated_at)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?, 0, 1, 'active', NOW(), NOW())",
        [
            $uuid,
            Auth::sanitize($body['name']),
            strtolower(trim($body['email'])),
            trim($body['phone']),
            isset($body['bio']) ? Auth::sanitize($body['bio']) : null,
            Auth::sanitize($body['specialties']),
            $body['bar_council_id'] ?? null,
            isset($body['years_experience']) ? (int) $body['years_experience'] : 0,
            $body['education'] ?? null,
            Auth::sanitize($body['city']),
            $body['state'] ?? null,
            (float) ($body['consultation_fee'] ?? 0),
            $body['currency'] ?? 'PKR',
        ]
    );

    Auth::logAdminAction((int) $admin['id'], "Added lawyer '{$body['name']}'", 'lawyers', (int) $lawyerId);

    Response::json([
        'success' => true,
        'message' => 'Lawyer added successfully. They will need to be verified before appearing in listings.',
        'data'    => [
            'id'   => (int) $lawyerId,
            'uuid' => $uuid,
        ],
    ], 201);
}

Response::error('Method not allowed', 405);
