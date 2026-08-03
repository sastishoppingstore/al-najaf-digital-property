<?php
/**
 * ============================================================
 * JSON Response Utility
 * ============================================================
 * Standardized JSON API responses.
 * ============================================================
 */

declare(strict_types=1);

final class Response
{
    /**
     * Send a JSON response and exit.
     *
     * @param array<string,mixed>|array<int,mixed> $data    Response data
     * @param int                                  $status  HTTP status code
     * @param array<string,string>                 $headers Additional headers
     */
    public static function json(array $data, int $status = 200, array $headers = []): void
    {
        http_response_code($status);

        // Set CORS headers
        self::setCorsHeaders();

        // Set content type
        header('Content-Type: application/json; charset=utf-8');

        // Set additional headers
        foreach ($headers as $key => $value) {
            header($key . ': ' . $value);
        }

        // Add status to response body
        if (!isset($data['status'])) {
            $data['status'] = $status;
        }

        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Send a success response.
     *
     * @param array<string,mixed>|array<int,mixed> $data
     */
    public static function success(array $data = [], string $message = 'Success', int $status = 200): void
    {
        self::json([
            'success'  => true,
            'message'  => $message,
            'data'     => $data,
            'status'   => $status,
        ], $status);
    }

    /**
     * Send an error response.
     *
     * @param array<string,mixed>|array<int,mixed> $errors
     */
    public static function error(string $message, int $status = 400, array $errors = []): void
    {
        self::json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
            'status'  => $status,
        ], $status);
    }

    /**
     * Send a 401 Unauthorized response.
     */
    public static function unauthorized(string $message = 'Unauthorized access'): void
    {
        self::error($message, 401);
    }

    /**
     * Send a 403 Forbidden response.
     */
    public static function forbidden(string $message = 'Access forbidden'): void
    {
        self::error($message, 403);
    }

    /**
     * Send a 404 Not Found response.
     */
    public static function notFound(string $message = 'Resource not found'): void
    {
        self::error($message, 404);
    }

    /**
     * Send a 422 Validation error response.
     *
     * @param array<string,string> $errors
     */
    public static function validationError(string $message = 'Validation failed', array $errors = []): void
    {
        self::error($message, 422, $errors);
    }

    /**
     * Send a 429 Too Many Requests response.
     */
    public static function rateLimited(string $message = 'Too many requests. Please try again later.'): void
    {
        self::error($message, 429);
    }

    /**
     * Send a 500 Internal Server Error response.
     */
    public static function serverError(string $message = 'Internal server error'): void
    {
        self::error($message, 500);
    }

    /**
     * Handle preflight OPTIONS request.
     */
    public static function handleOptions(): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            self::setCorsHeaders();
            http_response_code(204);
            exit;
        }
    }

    /**
     * Set CORS headers based on whitelist.
     */
    private static function setCorsHeaders(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (in_array($origin, CORS_ALLOWED_ORIGINS, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Client-Info');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Max-Age: 86400');
        }
    }

    /**
     * Get the request body as an associative array.
     *
     * @return array<string,mixed>
     */
    public static function getRequestBody(): array
    {
        $input = file_get_contents('php://input');
        if (empty($input)) {
            return [];
        }

        $data = json_decode($input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Try form-encoded data
            $data = [];
            parse_str($input, $data);
        }

        return is_array($data) ? $data : [];
    }

    /**
     * Get a value from the request body or query string.
     *
     * @param string     $key     Parameter key
     * @param mixed|null $default Default value
     * @return mixed
     */
    public static function input(string $key, mixed $default = null): mixed
    {
        $body = self::getRequestBody();
        if (array_key_exists($key, $body)) {
            return $body[$key];
        }
        if (isset($_GET[$key])) {
            return $_GET[$key];
        }
        if (isset($_POST[$key])) {
            return $_POST[$key];
        }
        return $default;
    }

    /**
     * Validate required fields in the request body.
     *
     * @param array<string> $fields
     * @return array<string,string> Array of field => error message
     */
    public static function validateRequired(array $fields): array
    {
        $body = self::getRequestBody();
        $errors = [];

        foreach ($fields as $field) {
            if (!isset($body[$field]) || $body[$field] === '' || $body[$field] === null) {
                $errors[$field] = ucfirst($field) . ' is required';
            }
        }

        return $errors;
    }

    /**
     * Get pagination parameters from query string.
     *
     * @return array{page:int, per_page:int, offset:int}
     */
    public static function getPagination(): array
    {
        $page = max(1, (int) ($_GET['page'] ?? DEFAULT_PAGE));
        $perPage = min(MAX_PER_PAGE, max(1, (int) ($_GET['per_page'] ?? DEFAULT_PER_PAGE)));
        $offset = ($page - 1) * $perPage;

        return [
            'page'     => $page,
            'per_page' => $perPage,
            'offset'   => $offset,
        ];
    }

    /**
     * Send a paginated response.
     *
     * @param array<int,mixed> $data
     */
    public static function paginated(array $data, int $total, int $page, int $perPage): void
    {
        $totalPages = $perPage > 0 ? (int) ceil($total / $perPage) : 0;

        self::json([
            'success' => true,
            'data'    => $data,
            'meta'    => [
                'total'       => $total,
                'page'        => $page,
                'per_page'    => $perPage,
                'total_pages' => $totalPages,
                'has_more'    => $page < $totalPages,
            ],
        ]);
    }
}
