<?php
/**
 * ============================================================
 * JWT (JSON Web Token) Utility
 * ============================================================
 * HS256 JWT implementation for authentication.
 * No external libraries required.
 * ============================================================
 */

declare(strict_types=1);

final class JWT
{
    private const ALGORITHM = 'HS256';

    /**
     * Encode a payload into a JWT token.
     *
     * @param array<string,mixed> $payload    Token payload
     * @param int                 $ttlSeconds  Time-to-live in seconds
     * @return string JWT token string
     */
    public static function encode(array $payload, int $ttlSeconds = JWT_ACCESS_TTL): string
    {
        $header = [
            'alg' => self::ALGORITHM,
            'typ' => 'JWT',
        ];

        $now = time();
        $payload = array_merge($payload, [
            'iss' => JWT_ISSUER,
            'aud' => JWT_AUDIENCE,
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $ttlSeconds,
            'jti' => bin2hex(random_bytes(16)),
        ]);

        $headerEncoded  = self::base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES));
        $signature      = self::sign($headerEncoded . '.' . $payloadEncoded);

        return $headerEncoded . '.' . $payloadEncoded . '.' . $signature;
    }

    /**
     * Decode and verify a JWT token.
     *
     * @return array<string,mixed>|null Decoded payload or null if invalid
     */
    public static function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerEncoded, $payloadEncoded, $signature] = $parts;

        // Verify signature
        $expectedSignature = self::sign($headerEncoded . '.' . $payloadEncoded);
        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        // Decode header
        $header = json_decode(self::base64UrlDecode($headerEncoded), true);
        if (!is_array($header) || ($header['alg'] ?? '') !== self::ALGORITHM) {
            return null;
        }

        // Decode payload
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        if (!is_array($payload)) {
            return null;
        }

        // Verify claims
        $now = time();

        if (isset($payload['nbf']) && $now < $payload['nbf']) {
            return null;
        }

        if (isset($payload['exp']) && $now >= $payload['exp']) {
            return null;
        }

        if (isset($payload['iss']) && $payload['iss'] !== JWT_ISSUER) {
            return null;
        }

        if (isset($payload['aud']) && $payload['aud'] !== JWT_AUDIENCE) {
            return null;
        }

        return $payload;
    }

    /**
     * Extract the Bearer token from the Authorization header.
     *
     * @return string|null Token string or null
     */
    public static function extractBearerToken(): ?string
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if ($authHeader === null) {
            // Fallback: check $_SERVER
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
        }

        if ($authHeader === null) {
            return null;
        }

        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    /**
     * Generate a refresh token (longer-lived JWT).
     *
     * @param array<string,mixed> $payload
     */
    public static function generateRefreshToken(array $payload): string
    {
        $payload['type'] = 'refresh';
        return self::encode($payload, JWT_REFRESH_TTL);
    }

    /**
     * Generate an access token.
     *
     * @param array<string,mixed> $payload
     */
    public static function generateAccessToken(array $payload): string
    {
        $payload['type'] = 'access';
        return self::encode($payload, JWT_ACCESS_TTL);
    }

    /**
     * Sign data with HMAC-SHA256.
     */
    private static function sign(string $data): string
    {
        return self::base64UrlEncode(
            hash_hmac('sha256', $data, JWT_SECRET, true)
        );
    }

    /**
     * Base64 URL-safe encode.
     */
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL-safe decode.
     */
    private static function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder > 0) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
