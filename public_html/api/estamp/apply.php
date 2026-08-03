<?php
/**
 * ============================================================
 * POST /api/estamp/apply
 * ============================================================
 * Submit an E-Stamp application.
 * 
 * Request body:
 *   - applicant_name     (string, required)
 *   - applicant_cnic     (string, required, 13 digits for Pakistan CNIC)
 *   - applicant_email    (string, required, valid email)
 *   - applicant_phone    (string, required, valid phone)
 *   - applicant_address  (string, required)
 *   - document_type      (string, required: 'property_sale'|'property_rent'|'affidavit'|'power_of_attorney'|'agreement')
 *   - property_address   (string, required)
 *   - property_value     (float, required, > 0)
 *   - stamp_duty_amount  (float, optional, calculated by admin)
 *   - description        (string, optional)
 * 
 * Response:
 *   201: { success, message, data: { application_id, reference_number } }
 *   422: { success: false, message, errors }
 * ============================================================
 */

declare(strict_types=1);

// Require authentication
$user = Auth::requireAuth();

// Rate limiting
Auth::rateLimit('estamp_apply');

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

$body = Response::getRequestBody();

// Validate required fields
$errors = Response::validateRequired([
    'applicant_name', 'applicant_cnic', 'applicant_email', 'applicant_phone',
    'applicant_address', 'document_type', 'property_address', 'property_value'
]);

// Validate email
if (!isset($errors['applicant_email']) && !Auth::validateEmail($body['applicant_email'] ?? '')) {
    $errors['applicant_email'] = 'Invalid email address';
}

// Validate phone
if (!isset($errors['applicant_phone']) && !Auth::validatePhone($body['applicant_phone'] ?? '')) {
    $errors['applicant_phone'] = 'Invalid phone number';
}

// Validate CNIC (Pakistani format: 5 digits - 7 digits - 1 digit)
$applicantCnic = preg_replace('/[^0-9]/', '', $body['applicant_cnic'] ?? '');
if (!isset($errors['applicant_cnic'])) {
    if (strlen($applicantCnic) !== 13) {
        $errors['applicant_cnic'] = 'CNIC must be 13 digits';
    }
}

// Validate document type
$documentType = $body['document_type'] ?? '';
$validDocTypes = ['property_sale', 'property_rent', 'affidavit', 'power_of_attorney', 'agreement'];
if (!isset($errors['document_type']) && !in_array($documentType, $validDocTypes, true)) {
    $errors['document_type'] = 'Invalid document type. Allowed: ' . implode(', ', $validDocTypes);
}

// Validate property value
if (!isset($errors['property_value']) && (float) ($body['property_value'] ?? 0) <= 0) {
    $errors['property_value'] = 'Property value must be greater than 0';
}

if (!empty($errors)) {
    Response::validationError('Validation failed', $errors);
}

// Generate a reference number
$referenceNumber = 'ES-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

// Begin transaction
Database::beginTransaction();

try {
    // Insert E-Stamp application
    $applicationId = Database::insert(
        "INSERT INTO estamp_applications
            (user_id, reference_number, applicant_name, applicant_cnic,
             applicant_email, applicant_phone, applicant_address,
             document_type, property_address, property_value,
             stamp_duty_amount, description, status, submitted_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'submitted', NOW(), NOW(), NOW())",
        [
            (int) $user['id'],
            $referenceNumber,
            Auth::sanitize($body['applicant_name']),
            $applicantCnic,
            strtolower(trim($body['applicant_email'])),
            trim($body['applicant_phone']),
            Auth::sanitize($body['applicant_address']),
            $documentType,
            Auth::sanitize($body['property_address']),
            (float) $body['property_value'],
            isset($body['description']) ? Auth::sanitize($body['description']) : null,
        ]
    );

    // Add initial status history entry
    Database::insert(
        "INSERT INTO estamp_status_history
            (application_id, status, notes, changed_by, created_at)
         VALUES (?, 'submitted', 'Application submitted by user', ?, NOW())",
        [
            (int) $applicationId,
            (int) $user['id'],
        ]
    );

    // Notify admins
    $admins = Database::fetchAll(
        "SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active'"
    );
    foreach ($admins as $admin) {
        Auth::notify(
            (int) $admin['id'],
            'New E-Stamp Application',
            "New E-Stamp application submitted (Ref: {$referenceNumber}) by {$body['applicant_name']}.",
            'info',
            '/admin/estamp'
        );
    }

    Database::commit();
} catch (Throwable $e) {
    Database::rollback();
    if (APP_DEBUG) {
        Response::serverError('Application failed: ' . $e->getMessage());
    }
    Response::serverError('Failed to submit application. Please try again.');
}

Response::json([
    'success' => true,
    'message' => 'E-Stamp application submitted successfully. You will be notified once it is processed.',
    'data'    => [
        'application_id'   => (int) $applicationId,
        'reference_number' => $referenceNumber,
        'status'           => 'submitted',
    ],
], 201);
