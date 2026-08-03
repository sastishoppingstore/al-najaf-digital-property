<?php
/**
 * ============================================================
 * Authentication & Authorization Utility
 * ============================================================
 * Handles JWT verification, user authentication, role checking,
 * and application-level rate limiting.
 * ============================================================
 */

declare(strict_types=1);

final class Auth
{
    /** @var array<string,mixed>|null */
    private static ?array $currentUser = null;

    /**
     * Require authentication. Sends 401 if not authenticated.
     *
     * @return array<string,mixed> The authenticated user data
     */
    public static function requireAuth(): array
    {
        $user = self::currentUser();
        if ($user === null) {
            Response::unauthorized('Authentication required. Provide a valid Bearer token.');
        }
        return $user;
    }

    /**
     * Require a specific role. Sends 403 if role doesn't match.
     *
     * @param string|string[] $roles Required role(s)
     * @return array<string,mixed> The authenticated user data
     */
    public static function requireRole(string|array $roles): array
    {
        $user = self::requireAuth();

        $rolesArray = is_array($roles) ? $roles : [$roles];
        $userRole = $user['role'] ?? '';

        if (!in_array($userRole, $rolesArray, true)) {
            Response::forbidden('Insufficient permissions. Required role: ' . implode(' or ', $rolesArray));
        }

        return $user;
    }

    /**
     * Require admin role.
     *
     * @return array<string,mixed> The authenticated admin user data
     */
    public static function requireAdmin(): array
    {
        return self::requireRole(['admin', 'super_admin']);
    }

    /**
     * Get the current authenticated user, or null.
     *
     * @return array<string,mixed>|null
     */
    public static function currentUser(): ?array
    {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }

        $token = JWT::extractBearerToken();
        if ($token === null) {
            return null;
        }

        $payload = JWT::decode($token);
        if ($payload === null) {
            return null;
        }

        if (($payload['type'] ?? '') !== 'access') {
            return null;
        }

        $userId = $payload['sub'] ?? null;
        if ($userId === null) {
            return null;
        }

        // Fetch user from database to ensure they still exist and are active
        $user = Database::fetchOne(
            "SELECT u.id, u.uuid, u.name, u.email, u.phone, u.role, u.status,
                    u.email_verified_at, u.avatar_url, u.created_at
             FROM users u
             WHERE u.id = ? AND u.status = 'active'",
            [$userId]
        );

        if ($user === null) {
            return null;
        }

        self::$currentUser = $user;
        return $user;
    }

    /**
     * Check if the current user is authenticated.
     */
    public static function check(): bool
    {
        return self::currentUser() !== null;
    }

    /**
     * Get the current user's ID.
     *
     * @return int|null
     */
    public static function id(): ?int
    {
        $user = self::currentUser();
        return $user !== null ? (int) $user['id'] : null;
    }

    /**
     * Verify a password against a hash.
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Hash a password using Bcrypt.
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
    }

    /**
     * Validate password strength.
     *
     * @return array<string,string> Array of validation errors
     */
    public static function validatePassword(string $password): array
    {
        $errors = [];

        if (strlen($password) < PASSWORD_MIN_LENGTH) {
            $errors['password'] = 'Password must be at least ' . PASSWORD_MIN_LENGTH . ' characters long';
        } elseif (!preg_match('/[A-Z]/', $password)) {
            $errors['password'] = 'Password must contain at least one uppercase letter';
        } elseif (!preg_match('/[a-z]/', $password)) {
            $errors['password'] = 'Password must contain at least one lowercase letter';
        } elseif (!preg_match('/[0-9]/', $password)) {
            $errors['password'] = 'Password must contain at least one number';
        }

        return $errors;
    }

    /**
     * Generate a token pair (access + refresh) for a user.
     *
     * @param array<string,mixed> $user
     * @return array{access_token:string, refresh_token:string, expires_in:int}
     */
    public static function generateTokenPair(array $user): array
    {
        $payload = [
            'sub'  => (int) $user['id'],
            'uuid' => $user['uuid'],
            'email' => $user['email'],
            'role' => $user['role'],
            'name' => $user['name'],
        ];

        return [
            'access_token'  => JWT::generateAccessToken($payload),
            'refresh_token' => JWT::generateRefreshToken($payload),
            'expires_in'    => JWT_ACCESS_TTL,
            'token_type'    => 'Bearer',
        ];
    }

    /**
     * Rate limiting check (application-level).
     * Uses a simple file-based token bucket per IP + endpoint.
     *
     * @param string $endpoint Endpoint identifier
     * @param int    $maxRequests Maximum requests in window
     * @param int    $windowSeconds Window size in seconds
     */
    public static function rateLimit(string $endpoint, int $maxRequests = RATE_LIMIT_MAX_REQUESTS, int $windowSeconds = RATE_LIMIT_WINDOW): void
    {
        if (!RATE_LIMIT_ENABLED) {
            return;
        }

        $ip = self::getClientIp();
        $cacheFile = sys_get_temp_dir() . '/rate_' . md5($ip . '_' . $endpoint) . '.json';

        $now = time();
        $data = ['count' => 0, 'reset_at' => $now + $windowSeconds];

        if (file_exists($cacheFile)) {
            $content = file_get_contents($cacheFile);
            if ($content !== false) {
                $decoded = json_decode($content, true);
                if (is_array($decoded) && isset($decoded['count'], $decoded['reset_at'])) {
                    $data = $decoded;
                }
            }
        }

        // Reset if window expired
        if ($now >= $data['reset_at']) {
            $data = ['count' => 0, 'reset_at' => $now + $windowSeconds];
        }

        $data['count']++;

        // Check limit
        if ($data['count'] > $maxRequests) {
            $retryAfter = $data['reset_at'] - $now;
            header('Retry-After: ' . $retryAfter);
            Response::rateLimited();
        }

        // Write back
        file_put_contents($cacheFile, json_encode($data), LOCK_EX);
    }

    /**
     * Get the client's IP address.
     */
    public static function getClientIp(): string
    {
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR',
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = trim(explode(',', $_SERVER[$header])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
                // Fallback: allow private IPs in development
                if (APP_DEBUG && filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    /**
     * Log admin action to admin_logs table.
     *
     * @param int    $userId  Admin user ID
     * @param string $action  Action description
     * @param string $entity  Affected entity
     * @param int|null $entityId Affected entity ID
     */
    public static function logAdminAction(int $userId, string $action, string $entity = '', ?int $entityId = null): void
    {
        try {
            Database::insert(
                "INSERT INTO admin_logs (user_id, action, entity, entity_id, ip_address, user_agent, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())",
                [
                    $userId,
                    $action,
                    $entity,
                    $entityId,
                    self::getClientIp(),
                    $_SERVER['HTTP_USER_AGENT'] ?? '',
                ]
            );
        } catch (Throwable $e) {
            // Silently fail - logging should not break the request
            if (APP_DEBUG) {
                error_log('Admin log failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Create a notification for a user.
     *
     * @param int    $userId  Target user ID
     * @param string $title   Notification title
     * @param string $message  Notification message
     * @param string $type    Notification type (info, success, warning, error)
     * @param string|null $link Optional link
     */
    public static function notify(int $userId, string $title, string $message, string $type = 'info', ?string $link = null): void
    {
        try {
            Database::insert(
                "INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
                 VALUES (?, ?, ?, ?, ?, 0, NOW())",
                [$userId, $title, $message, $type, $link]
            );
        } catch (Throwable $e) {
            if (APP_DEBUG) {
                error_log('Notification failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Validate file upload.
     *
     * @param array<string,mixed> $file $_FILES array element
     * @return array{valid:bool, error:string|null, ext:string|null}
     */
    public static function validateUpload(array $file): array
    {
        // Check for upload errors
        if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
            $errorMap = [
                UPLOAD_ERR_INI_SIZE   => 'File exceeds server maximum size',
                UPLOAD_ERR_FORM_SIZE  => 'File exceeds form maximum size',
                UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the upload',
            ];
            $msg = $errorMap[$file['error'] ?? UPLOAD_ERR_NO_FILE] ?? 'Unknown upload error';
            return ['valid' => false, 'error' => $msg, 'ext' => null];
        }

        // Check file size
        if ($file['size'] > UPLOAD_MAX_SIZE) {
            return ['valid' => false, 'error' => 'File exceeds maximum size of 5MB', 'ext' => null];
        }

        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!isset(UPLOAD_ALLOWED_TYPES[$mimeType])) {
            return ['valid' => false, 'error' => 'File type not allowed. Accepted: PDF, JPG, PNG', 'ext' => null];
        }

        $ext = UPLOAD_ALLOWED_TYPES[$mimeType];

        // Double-check extension
        $fileName = $file['name'] ?? '';
        $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        if (!in_array($fileExt, UPLOAD_ALLOWED_EXTENSIONS, true)) {
            return ['valid' => false, 'error' => 'File extension not allowed', 'ext' => null];
        }

        return ['valid' => true, 'error' => null, 'ext' => $ext];
    }

    /**
     * Generate a UUID v4.
     */
    public static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Generate a random OTP code.
     */
    public static function generateOtp(): string
    {
        return str_pad((string) random_int(0, (10 ** OTP_LENGTH) - 1), OTP_LENGTH, '0', STR_PAD_LEFT);
    }

    /**
     * Sanitize a string for output.
     */
    public static function sanitize(string $value): string
    {
        return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Validate an email address.
     */
    public static function validateEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate a phone number (basic validation).
     */
    public static function validatePhone(string $phone): bool
    {
        $cleaned = preg_replace('/[\s\-\(\)]/', '', $phone);
        return $cleaned !== null && preg_match('/^\+?\d{10,15}$/', $cleaned) === 1;
    }
}
