<?php
/**
 * ============================================================
 * POST /api/admin/estamp/upload-gov
 * ============================================================
 * Admin uploads E-Stamp data fetched from government site.
 * 
 * Request body (multipart/form-data):
 *   - reference_number (string, required)
 *   - gov_certificate   (file, required) - PDF/image from government site
 *   - notes             (string, optional)
 * 
 * Requires admin/super_admin authentication.
 * ============================================================
 */
declare(strict_types=1);

$user = Auth::requireAuth();
if (!in_array($user['role'], ['admin', 'super_admin'], true)) {
    Response::error('Unauthorized', 403);
}

if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

if (empty($_FILES['gov_certificate'])) {
    Response::validationError('Validation failed', ['gov_certificate' => 'Government certificate file is required']);
}

$referenceNumber = Auth::sanitize($_POST['reference_number'] ?? '');
$notes           = Auth::sanitize($_POST['notes'] ?? '');

if (!$referenceNumber) {
    Response::validationError('Validation failed', ['reference_number' => 'Reference number is required']);
}

$uploadDir = __DIR__ . '/../../uploads/estamp-gov/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$file     = $_FILES['gov_certificate'];
$fileName = uniqid('gov_') . '_' . basename($file['name']);
$filePath = $uploadDir . $fileName;

if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    Response::serverError('Failed to upload government certificate.');
}

$result = Database::fetchOne(
    "SELECT id FROM estamp_applications WHERE reference_number = ?",
    [$referenceNumber]
);

if (!$result) {
    Response::error('E-Stamp application not found.', 404);
}

Database::insert(
    "INSERT INTO estamp_documents
        (application_id, document_type, file_path, original_filename, file_size, mime_type, uploaded_by, uploaded_at)
     VALUES (?, 'gov_certificate', ?, ?, ?, ?, NOW(), NOW())",
    [
        (int) $result['id'],
        $filePath,
        $fileName,
        $file['size'],
        $file['type'],
        (int) $user['id'],
    ]
);

Database::insert(
    "INSERT INTO estamp_status_history
        (application_id, status, notes, changed_by, created_at)
     VALUES (?, 'gov_certificate_uploaded', ?, ?, NOW())",
    [
        (int) $result['id'],
        $notes ?: 'Government certificate uploaded by admin',
        (int) $user['id'],
    ]
);

Response::json([
    'success' => true,
    'message' => 'Government certificate uploaded successfully.',
    'data'    => ['application_id' => (int) $result['id'], 'file_path' => $filePath],
]);
