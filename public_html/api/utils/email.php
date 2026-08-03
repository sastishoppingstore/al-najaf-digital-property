<?php
/**
 * ============================================================
 * Email Utility
 * ============================================================
 * SMTP email sending for OTP and notifications.
 * Uses raw socket connection (no external library required).
 * ============================================================
 */

declare(strict_types=1);

final class Email
{
    /**
     * Send an email via SMTP.
     *
     * @param string $to       Recipient email
     * @param string $subject  Email subject
     * @param string $htmlBody HTML body
     * @param string $textBody Plain text body (optional)
     * @return bool True on success, false on failure
     */
    public static function send(string $to, string $subject, string $htmlBody, string $textBody = ''): bool
    {
        if (empty(SMTP_HOST) || SMTP_HOST === 'YOUR_SMTP_HOST') {
            // In development/testing, log the email instead of sending
            error_log(sprintf(
                "[EMAIL MOCK] To: %s | Subject: %s | Body: %s",
                $to,
                $subject,
                $textBody ?: strip_tags($htmlBody)
            ));
            return true;
        }

        try {
            $connection = self::connect();
            if ($connection === null) {
                return false;
            }

            // EHLO
            self::sendCommand($connection, "EHLO " . parse_url(APP_URL, PHP_URL_HOST) ?: 'localhost');

            // STARTTLS if configured
            if (SMTP_ENCRYPTION === 'tls') {
                self::sendCommand($connection, 'STARTTLS');
                // Enable crypto
                stream_socket_enable_crypto($connection, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                self::sendCommand($connection, "EHLO " . (parse_url(APP_URL, PHP_URL_HOST) ?: 'localhost'));
            }

            // AUTH LOGIN
            self::sendCommand($connection, 'AUTH LOGIN');
            self::sendCommand($connection, base64_encode(SMTP_USER));
            self::sendCommand($connection, base64_encode(SMTP_PASS));

            // MAIL FROM
            self::sendCommand($connection, 'MAIL FROM:<' . SMTP_FROM_EMAIL . '>');

            // RCPT TO
            self::sendCommand($connection, 'RCPT TO:<' . $to . '>');

            // DATA
            self::sendCommand($connection, 'DATA');

            // Build email headers and body
            $boundary = md5((string) time());
            $headers = self::buildHeaders($to, $subject, $boundary);
            $body = self::buildBody($htmlBody, $textBody, $boundary);

            // Send the email content
            fwrite($connection, $headers . "\r\n" . $body . "\r\n.\r\n");
            $response = self::readResponse($connection);

            // QUIT
            self::sendCommand($connection, 'QUIT');
            fclose($connection);

            return str_starts_with($response, '250');
        } catch (Throwable $e) {
            if (APP_DEBUG) {
                error_log('Email send failed: ' . $e->getMessage());
            }
            return false;
        }
    }

    /**
     * Connect to the SMTP server.
     *
     * @return resource|null
     */
    private static function connect()
    {
        $protocol = '';
        if (SMTP_ENCRYPTION === 'ssl') {
            $protocol = 'ssl://';
        }

        $host = $protocol . SMTP_HOST;
        $port = SMTP_PORT;

        $context = stream_context_create([
            'ssl' => [
                'verify_peer'       => false,
                'verify_peer_name'   => false,
                'allow_self_signed'  => true,
            ],
        ]);

        $connection = @stream_socket_client(
            $host . ':' . $port,
            $errno,
            $errstr,
            30,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if ($connection === false) {
            if (APP_DEBUG) {
                error_log("SMTP connection failed: $errstr ($errno)");
            }
            return null;
        }

        // Read greeting
        self::readResponse($connection);

        return $connection;
    }

    /**
     * Send a command to the SMTP server and read the response.
     *
     * @param resource $connection
     */
    private static function sendCommand($connection, string $command): string
    {
        fwrite($connection, $command . "\r\n");
        return self::readResponse($connection);
    }

    /**
     * Read the response from the SMTP server.
     *
     * @param resource $connection
     */
    private static function readResponse($connection): string
    {
        $response = '';
        while ($line = fgets($connection, 515)) {
            $response .= $line;
            // Multi-line responses end with a space after the code
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $response;
    }

    /**
     * Build email headers.
     */
    private static function buildHeaders(string $to, string $subject, string $boundary): string
    {
        $headers  = "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM_EMAIL . ">\r\n";
        $headers .= "To: <" . $to . ">\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/alternative; boundary=\"" . $boundary . "\"\r\n";
        $headers .= "Date: " . date(DATE_RFC2822) . "\r\n";
        $headers .= "Message-ID: <" . uniqid('', true) . "@" . (parse_url(APP_URL, PHP_URL_HOST) ?: 'localhost') . ">\r\n";
        return $headers;
    }

    /**
     * Build the email body with both text and HTML parts.
     */
    private static function buildBody(string $html, string $text, string $boundary): string
    {
        $body  = "--" . $boundary . "\r\n";
        $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= ($text ?: strip_tags($html)) . "\r\n\r\n";
        $body .= "--" . $boundary . "\r\n";
        $body .= "Content-Type: text/html; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= $html . "\r\n\r\n";
        $body .= "--" . $boundary . "--\r\n";
        return $body;
    }

    /**
     * Send an OTP verification email.
     */
    public static function sendOtp(string $to, string $otp, string $name = ''): bool
    {
        $subject = 'Your Verification Code - ' . APP_NAME;
        $html = self::otpTemplate($otp, $name);
        $text = "Hello {$name},\n\nYour verification code is: {$otp}\n\nThis code expires in " . (OTP_TTL / 60) . " minutes.\n\n" . APP_NAME;
        return self::send($to, $subject, $html, $text);
    }

    /**
     * Send a password reset email.
     */
    public static function sendPasswordReset(string $to, string $token, string $name = ''): bool
    {
        $resetUrl = APP_URL . '/reset-password?token=' . $token;
        $subject = 'Password Reset - ' . APP_NAME;
        $html = self::resetTemplate($resetUrl, $name);
        $text = "Hello {$name},\n\nReset your password at: {$resetUrl}\n\nThis link expires in 1 hour.\n\n" . APP_NAME;
        return self::send($to, $subject, $html, $text);
    }

    /**
     * Send a welcome email.
     */
    public static function sendWelcome(string $to, string $name = ''): bool
    {
        $subject = 'Welcome to ' . APP_NAME;
        $html = self::welcomeTemplate($name);
        $text = "Hello {$name},\n\nWelcome to " . APP_NAME . "! Your account has been created successfully.\n\n" . APP_NAME;
        return self::send($to, $subject, $html, $text);
    }

    /**
     * OTP email template.
     */
    private static function otpTemplate(string $otp, string $name): string
    {
        $greeting = !empty($name) ? "Hello {$name}," : 'Hello,';
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; }
        .header { background: #1a5632; color: #fff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .body { padding: 30px; }
        .otp-code { font-size: 36px; font-weight: bold; color: #1a5632; text-align: center;
                    letter-spacing: 8px; padding: 20px; background: #f0f7f1; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Al Najaf Digital Estate</h1>
        </div>
        <div class="body">
            <p>{$greeting}</p>
            <p>Use the following verification code to complete your registration:</p>
            <div class="otp-code">{$otp}</div>
            <p>This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; {date('Y')} Al Najaf Digital Estate. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Password reset email template.
     */
    private static function resetTemplate(string $resetUrl, string $name): string
    {
        $greeting = !empty($name) ? "Hello {$name}," : 'Hello,';
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; }
        .header { background: #1a5632; color: #fff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .body { padding: 30px; }
        .btn { display: inline-block; background: #1a5632; color: #fff; padding: 12px 30px;
               text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Al Najaf Digital Estate</h1>
        </div>
        <div class="body">
            <p>{$greeting}</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <p style="text-align: center;">
                <a href="{$resetUrl}" class="btn">Reset Password</a>
            </p>
            <p>Or copy this link: <br><a href="{$resetUrl}">{$resetUrl}</a></p>
            <p>This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; {date('Y')} Al Najaf Digital Estate. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Welcome email template.
     */
    private static function welcomeTemplate(string $name): string
    {
        $greeting = !empty($name) ? "Hello {$name}," : 'Hello,';
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; }
        .header { background: #1a5632; color: #fff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .body { padding: 30px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Al Najaf Digital Estate</h1>
        </div>
        <div class="body">
            <p>{$greeting}</p>
            <p>Your account has been created successfully. You can now:</p>
            <ul>
                <li>Browse and search properties</li>
                <li>Save your favorite properties</li>
                <li>Apply for E-Stamp certificates</li>
                <li>Book legal services and consultations</li>
                <li>Chat with lawyers and associates</li>
            </ul>
            <p>Visit our platform to get started!</p>
        </div>
        <div class="footer">
            <p>&copy; {date('Y')} Al Najaf Digital Estate. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
