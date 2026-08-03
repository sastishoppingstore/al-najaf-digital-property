<?php
/**
 * ============================================================
 * Al Najaf Digital Estate - Front Controller
 * ============================================================
 * 
 * Routes all API requests to the appropriate endpoint files.
 * 
 * URL pattern: /api/{resource}/{action}
 * Examples:
 *   /api/auth/register   -> auth/register.php
 *   /api/property/list   -> property/list.php
 *   /api/admin/dashboard -> admin/dashboard.php
 * 
 * ============================================================
 */

declare(strict_types=1);

// Load configuration
require_once __DIR__ . '/config.php';

// Load utilities
require_once __DIR__ . '/utils/db.php';
require_once __DIR__ . '/utils/response.php';
require_once __DIR__ . '/utils/jwt.php';
require_once __DIR__ . '/utils/auth.php';
require_once __DIR__ . '/utils/email.php';

// Handle preflight OPTIONS
Response::handleOptions();

// ============================================================
// Routing
// ============================================================

// Get the request URI and method
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Remove the base API path prefix if present
// The API is typically at /api/ so we strip that
$basePath = '/api';
if (str_starts_with($uri, $basePath)) {
    $uri = substr($uri, strlen($basePath));
}

// Remove trailing slash (except for root)
$uri = rtrim($uri, '/');
if (empty($uri)) {
    $uri = '/';
}

// Parse the URI into segments
$segments = explode('/', trim($uri, '/'));
$segments = array_values(array_filter($segments, fn($s) => $s !== ''));

// Route map: resource => allowed actions
$routes = [
    'auth'       => ['register', 'login', 'verify-otp', 'forgot-password', 'reset-password', 'profile', 'refresh', 'logout'],
    'property'   => ['list', 'detail', 'create', 'categories', 'inquiry', 'save'],
    'associates' => ['services', 'book', 'status'],
    'estamp'     => ['apply', 'status', 'upload'],
    'lawyer'     => ['list', 'detail', 'book'],
    'admin'      => ['dashboard', 'properties', 'estamp', 'services', 'lawyers', 'users'],
];

// Root endpoint - API info
if (count($segments) === 0 || (count($segments) === 1 && $segments[0] === '')) {
    Response::json([
        'success' => true,
        'message' => 'Al Najaf Digital Estate API',
        'version' => '1.0.0',
        'endpoints' => [
            'auth'       => '/api/auth/{register|login|verify-otp|forgot-password|reset-password|profile}',
            'property'   => '/api/property/{list|detail|create|categories|inquiry|save}',
            'associates' => '/api/associates/{services|book|status}',
            'estamp'     => '/api/estamp/{apply|status|upload}',
            'lawyer'     => '/api/lawyer/{list|detail|book}',
            'admin'      => '/api/admin/{dashboard|properties|estamp|services|lawyers|users}',
        ],
    ]);
}

// Validate route structure
if (count($segments) < 2) {
    Response::notFound('Invalid API endpoint. Format: /api/{resource}/{action}');
}

$resource = $segments[0];
$action   = $segments[1];

// Check if resource is valid
if (!isset($routes[$resource])) {
    Response::notFound("Unknown resource: {$resource}");
}

// Check if action is valid for this resource
if (!in_array($action, $routes[$resource], true)) {
    Response::notFound("Unknown action '{$action}' for resource '{$resource}'");
}

// Build the file path
$endpointFile = __DIR__ . "/{$resource}/{$action}.php";

// Check if the endpoint file exists
if (!file_exists($endpointFile)) {
    Response::notFound("Endpoint file not found: {$resource}/{$action}");
}

// Store route info for use in endpoint files
$GLOBALS['route'] = [
    'resource'    => $resource,
    'action'      => $action,
    'segments'    => $segments,
    'method'      => $method,
    'params'      => array_slice($segments, 2), // Additional path segments as params
];

// Load the endpoint file
try {
    require $endpointFile;
} catch (Throwable $e) {
    if (APP_DEBUG) {
        Response::serverError('Endpoint error: ' . $e->getMessage());
    }
    Response::serverError('An error occurred while processing your request');
}
