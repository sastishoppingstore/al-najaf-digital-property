<?php
/**
 * ============================================================
 * GET  /api/admin/estamp    - List all E-Stamp applications
 * PUT  /api/admin/estamp    - Update application status
 * ============================================================
 * 
 * GET query parameters:
 *   - page, per_page, status, search, sort
 * 
 * PUT body:
 *   - id                 (int, required)
 *   - status             (string, required: 'under_review'|'approved'|'rejected'|'completed')
 *   - stamp_duty_amount  (float, optional) - set the stamp duty
 *   - rejection_reason   (string, optional) - required if status is 'rejected'
 *   - notes              (string, optional)
 * 
 * Requires admin authentication.
 * ============================================================
 */

declare(strict_types=1);

// Require admin authentication
$admin = Auth::requireAdmin();

// Rate limiting
Auth::rateLimit('admin_estamp');

$method = $GLOBALS['route']['method'];

// ============================================================
// GET - List all E-Stamp applications
// ============================================================
if ($method === 'GET') {
    $pagination = Response::getPagination();

    $where = ["1=1"];
    $params = [];

    // Status filter
    $status = trim($_GET['status'] ?? '');
    if (!empty($status)) {
        $where[] = "ea.status = ?";
        $params[] = $status;
    }

    // Search
    $search = trim($_GET['search'] ?? '');
    if (!empty($search)) {
        $where[] = "(ea.reference_number LIKE ? OR ea.applicant_name LIKE ? OR ea.applicant_cnic LIKE ?)";
        $searchParam = '%' . $search . '%';
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
    }

    $whereClause = implode(' AND ', $where);

    $total = (int) Database::fetchScalar(
        "SELECT COUNT(*) FROM estamp_applications ea WHERE {$whereClause}",
        $params
    );

    $applications = Database::fetchAll(
        "SELECT ea.id, ea.reference_number, ea.applicant_name, ea.applicant_cnic,
                ea.applicant_email, ea.applicant_phone, ea.document_type,
                ea.property_address, ea.property_value, ea.stamp_duty_amount,
                ea.status, ea.submitted_at, ea.processed_at, ea.approved_at,
                ea.completed_at, ea.rejection_reason, ea.created_at,
                u.name AS user_name
         FROM estamp_applications ea
         LEFT JOIN users u ON ea.user_id = u.id
         WHERE {$whereClause}
         ORDER BY ea.created_at DESC
         LIMIT {$pagination['per_page']} OFFSET {$pagination['offset']}",
        $params
    );

    Response::paginated($applications, $total, $pagination['page'], $pagination['per_page']);
}

// ============================================================
// PUT - Update application status
// ============================================================
if ($method === 'PUT' || $method === 'PATCH') {
    $body = Response::getRequestBody();

    $errors = Response::validateRequired(['id', 'status']);
    if (!empty($errors)) {
        Response::validationError('Validation failed', $errors);
    }

    $applicationId = (int) $body['id'];
    $newStatus = trim($body['status']);

    $validStatuses = ['submitted', 'under_review', 'approved', 'rejected', 'completed'];
    if (!in_array($newStatus, $validStatuses, true)) {
        Response::validationError('Validation failed', [
            'status' => 'Invalid status. Allowed: ' . implode(', ', $validStatuses),
        ]);
    }

    // Check application exists
    $application = Database::fetchOne(
        "SELECT id, reference_number, user_id, status, applicant_name, applicant_email
         FROM estamp_applications WHERE id = ?",
        [$applicationId]
    );

    if ($application === null) {
        Response::notFound('Application not found');
    }

    // If rejecting, require a reason
    if ($newStatus === 'rejected' && empty(trim($body['rejection_reason'] ?? ''))) {
        Response::validationError('Validation failed', [
            'rejection_reason' => 'Rejection reason is required when rejecting',
        ]);
    }

    // Build update query
    $updateFields = ["status = ?", "updated_at = NOW()"];
    $updateParams = [$newStatus];

    // Set stamp duty amount if provided
    if (isset($body['stamp_duty_amount']) && (float) $body['stamp_duty_amount'] > 0) {
        $updateFields[] = "stamp_duty_amount = ?";
        $updateParams[] = (float) $body['stamp_duty_amount'];
    }

    // Set rejection reason if provided
    if (isset($body['rejection_reason'])) {
        $updateFields[] = "rejection_reason = ?";
        $updateParams[] = Auth::sanitize($body['rejection_reason']);
    }

    // Set timestamps based on status
    $now = 'NOW()';
    switch ($newStatus) {
        case 'under_review':
            $updateFields[] = "processed_at = {$now}";
            break;
        case 'approved':
            $updateFields[] = "approved_at = {$now}";
            break;
        case 'completed':
            $updateFields[] = "completed_at = {$now}";
            break;
    }

    $updateParams[] = $applicationId;

    Database::beginTransaction();

    try {
        // Update application
        Database::execute(
            "UPDATE estamp_applications SET " . implode(', ', $updateFields) . " WHERE id = ?",
            $updateParams
        );

        // Add status history entry
        Database::insert(
            "INSERT INTO estamp_status_history
                (application_id, status, notes, changed_by, created_at)
             VALUES (?, ?, ?, ?, NOW())",
            [
                $applicationId,
                $newStatus,
                isset($body['notes']) ? Auth::sanitize($body['notes']) : "Status changed to {$newStatus}",
                (int) $admin['id'],
            ]
        );

        // Notify the applicant
        if ($application['user_id'] !== null) {
            $statusMessages = [
                'under_review' => 'is now under review',
                'approved'     => 'has been approved',
                'rejected'     => 'has been rejected',
                'completed'    => 'has been completed',
            ];
            $msg = $statusMessages[$newStatus] ?? "status updated to {$newStatus}";
            Auth::notify(
                (int) $application['user_id'],
                'E-Stamp Application Update',
                "Your application (Ref: {$application['reference_number']}) {$msg}.",
                $newStatus === 'completed' ? 'success' : ($newStatus === 'rejected' ? 'error' : 'info'),
                '/estamp/status?reference_number=' . $application['reference_number']
            );
        }

        Database::commit();
    } catch (Throwable $e) {
        Database::rollback();
        if (APP_DEBUG) {
            Response::serverError('Update failed: ' . $e->getMessage());
        }
        Response::serverError('Failed to update application status');
    }

    Auth::logAdminAction((int) $admin['id'], "Updated estamp application to {$newStatus}", 'estamp', $applicationId);

    Response::success([
        'id'     => $applicationId,
        'status' => $newStatus,
    ], 'Application status updated successfully');
}

Response::error('Method not allowed', 405);
