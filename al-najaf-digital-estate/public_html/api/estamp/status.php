<?php
/**
 * ============================================================
 * GET /api/estamp/status
 * ============================================================
 * Check the status of an E-Stamp application.
 * 
 * Query parameters:
 *   - reference_number  (string, optional) - application reference
 *   - application_id    (int, optional) - application ID
 * 
 * Requires authentication. Users can only view their own applications.
 * 
 * Response:
 *   200: { success, data: { application, status_history, documents } }
 *   404: { success: false, message } - application not found
 * ============================================================
 */

declare(strict_types=1);

// Require authentication
$user = Auth::requireAuth();

// Rate limiting
Auth::rateLimit('estamp_status');

// Only allow GET
if ($GLOBALS['route']['method'] !== 'GET') {
    Response::error('Method not allowed. Use GET.', 405);
}

// Get lookup parameters
$referenceNumber = trim($_GET['reference_number'] ?? '');
$applicationId = (int) ($_GET['application_id'] ?? 0);

if (empty($referenceNumber) && $applicationId === 0) {
    Response::validationError('Application identifier required', [
        'identifier' => 'Provide reference_number or application_id',
    ]);
}

// Build lookup condition
$lookupCondition = '';
$lookupParams = [];

if ($applicationId > 0) {
    $lookupCondition = 'ea.id = ?';
    $lookupParams[] = $applicationId;
} else {
    $lookupCondition = 'ea.reference_number = ?';
    $lookupParams[] = $referenceNumber;
}

// Fetch application (ensure user can only see their own)
$application = Database::fetchOne(
    "SELECT ea.id, ea.reference_number, ea.applicant_name, ea.applicant_cnic,
            ea.applicant_email, ea.applicant_phone, ea.applicant_address,
            ea.document_type, ea.property_address, ea.property_value,
            ea.stamp_duty_amount, ea.description, ea.status,
            ea.submitted_at, ea.processed_at, ea.approved_at, ea.completed_at,
            ea.rejection_reason, ea.created_at, ea.updated_at
     FROM estamp_applications ea
     WHERE {$lookupCondition} AND ea.user_id = ?",
    array_merge($lookupParams, [(int) $user['id']])
);

if ($application === null) {
    Response::notFound('Application not found. Please check your reference number.');
}

// Fetch status history
$statusHistory = Database::fetchAll(
    "SELECT id, status, notes, created_at
     FROM estamp_status_history
     WHERE application_id = ?
     ORDER BY created_at ASC",
    [(int) $application['id']]
);

// Fetch documents
$documents = Database::fetchAll(
    "SELECT id, document_type, original_filename, file_size,
            uploaded_at, verified_at
     FROM estamp_documents
     WHERE application_id = ?
     ORDER BY uploaded_at ASC",
    [(int) $application['id']]
);

Response::success([
    'application'     => $application,
    'status_history'  => $statusHistory,
    'documents'       => $documents,
], 'Application status retrieved successfully');
