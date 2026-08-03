<?php
/**
 * ============================================================
 * POST /api/estamp/upload
 * ============================================================
 * Upload supporting documents for an E-Stamp application.
 * Uses multipart/form-data.
 * 
 * Form fields:
 *   - application_id   (int, required)
 *   - document_type    (string, required: 'cnic_copy'|'property_papers'|'sale_deed'|'rent_agreement'|'other')
 *   - file             (file, required, PDF/JPG/PNG, max 5MB)
 * 
 * Response:
 *   201: { success, message, data: { document_id, filename, file_size } }
 *   422: { success: false, message, errors }
 *   404: { success: false, message } - application not found
 * ============================================================
 */

declare(strict_types=1);

// Require authentication
$user = Auth::requireAuth();

// Rate limiting
Auth::rateLimit('estamp_upload');

// Only allow POST
if ($GLOBALS['route']['method'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

// Validate required fields
$applicationId = (int) ($_POST['application_id'] ?? 0);
$documentType = trim($_POST['document_type'] ?? '');

if ($applicationId === 0) {
    Response::validationError('Validation failed', [
        'application_id' => 'Application ID is required',
    ]);
}

$validDocTypes = ['cnic_copy', 'property_papers', 'sale_deed', 'rent_agreement', 'other'];
if (!in_array($documentType, $validDocTypes, true)) {
    Response::validationError('Validation failed', [
        'document_type' => 'Invalid document type. Allowed: ' . implode(', ', $validDocTypes),
    ]);
}

// Check if file was uploaded
if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
    Response::validationError('Validation failed', [
        'file' => 'No file was uploaded',
    ]);
}

// Validate the upload
$uploadResult = Auth::validateUpload($_FILES['file']);
if (!$uploadResult['valid']) {
    Response::validationError('Validation failed', [
        'file' => $uploadResult['error'],
    ]);
}

// Verify application belongs to user
$application = Database::fetchOne(
    "SELECT id, reference_number, status FROM estamp_applications
     WHERE id = ? AND user_id = ?",
    [
        $applicationId,
        (int) $user['id'],
    ]
);

if ($application === null) {
    Response::notFound('Application not found or does not belong to you');
}

// Check if application allows uploads (not completed/rejected)
if (in_array($application['status'], ['completed', 'rejected'], true)) {
    Response::error('Cannot upload documents for a completed or rejected application', 400);
}

// Create upload directory if it doesn't exist
$uploadDir = UPLOAD_DIR . 'estamp/' . $applicationId . '/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate a unique filename
$fileExt = $uploadResult['ext'];
$uniqueName = Auth::generateUuid() . '.' . $fileExt;
$filePath = $uploadDir . $uniqueName;

// Move the uploaded file
if (!move_uploaded_file($_FILES['file']['tmp_name'], $filePath)) {
    Response::serverError('Failed to save uploaded file');
}

// Store the file URL (relative to uploads)
$fileUrl = 'estamp/' . $applicationId . '/' . $uniqueName;
$fileSize = (int) $_FILES['file']['size'];
$originalFilename = Auth::sanitize($_FILES['file']['name']);

// Insert document record
$documentId = Database::insert(
    "INSERT INTO estamp_documents
        (application_id, document_type, file_path, original_filename,
         file_size, mime_type, uploaded_by, uploaded_at, verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NULL)",
    [
        $applicationId,
        $documentType,
        $fileUrl,
        $originalFilename,
        $fileSize,
        $_FILES['file']['type'],
        (int) $user['id'],
    ]
);

Response::json([
    'success' => true,
    'message' => 'Document uploaded successfully.',
    'data'    => [
        'document_id'       => (int) $documentId,
        'filename'          => $originalFilename,
        'file_size'         => $fileSize,
        'document_type'     => $documentType,
    ],
], 201);
