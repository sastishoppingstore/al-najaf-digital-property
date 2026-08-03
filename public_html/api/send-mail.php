<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/mail-config.php';

function smtpCommand($socket, $command, $expectCode) {
  fwrite($socket, $command . "\r\n");
  $line = '';
  do {
    $l = fgets($socket, 515);
    if ($l === false) break;
    $line = $l;
  } while (strlen($l) >= 4 && $l[3] === '-');
  if (substr(trim($line), 0, 3) !== $expectCode) {
    return trim($line);
  }
  return true;
}

function smtpMail($to, $subject, $htmlBody, $textBody = '') {
  $boundary = "boundary_" . md5(uniqid(time()));
  $boundaryMixed = "boundary_mixed_" . md5(uniqid(time()));

  $headers = "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM . ">\r\n";
  $headers .= "Reply-To: " . SMTP_FROM . "\r\n";
  $headers .= "MIME-Version: 1.0\r\n";
  $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

  $message = "--{$boundary}\r\n";
  $message .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
  $message .= $textBody ?: strip_tags($htmlBody) . "\r\n\r\n";
  $message .= "--{$boundary}\r\n";
  $message .= "Content-Type: text/html; charset=UTF-8\r\n";
  $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
  $message .= chunk_split(base64_encode($htmlBody)) . "\r\n";
  $message .= "--{$boundary}--";

  $errno = 0; $errstr = '';

  $socket = fsockopen(
    SMTP_SECURE === 'ssl' ? 'ssl://' . SMTP_HOST : SMTP_HOST,
    SMTP_PORT, $errno, $errstr, 30
  );

  if (!$socket) {
    // Fallback to mail()
    mail($to, $subject, $message, $headers);
    return ['success' => true, 'method' => 'mail'];
  }

  $banner = fgets($socket, 515);
  if ($banner === false || substr($banner, 0, 3) !== '220') {
    fclose($socket);
    return ['success' => false, 'error' => 'SMTP connect failed: ' . trim($banner)];
  }

  $r = smtpCommand($socket, "EHLO " . gethostname(), '250');
  if ($r !== true) { fclose($socket); return ['success' => false, 'error' => 'SMTP EHLO failed: ' . $r]; }
  $r = smtpCommand($socket, 'AUTH LOGIN', '334');
  if ($r !== true) { fclose($socket); return ['success' => false, 'error' => 'SMTP auth start failed: ' . $r]; }
  $r = smtpCommand($socket, base64_encode(SMTP_USER), '334');
  if ($r !== true) { fclose($socket); return ['success' => false, 'error' => 'SMTP auth user failed: ' . $r]; }
  $r = smtpCommand($socket, base64_encode(SMTP_PASS), '235');
  if ($r !== true) { fclose($socket); return ['success' => false, 'error' => 'SMTP auth failed: ' . $r]; }

  smtpCommand($socket, "MAIL FROM:<" . SMTP_FROM . ">", '250');
  smtpCommand($socket, "RCPT TO:<{$to}>", '250');
  smtpCommand($socket, 'DATA', '354');
  fwrite($socket, "Subject: {$subject}\r\n{$headers}\r\n{$message}\r\n.\r\n");
  smtpCommand($socket, '', '250');
  smtpCommand($socket, 'QUIT', '221');
  fclose($socket);

  return ['success' => true, 'method' => 'smtp'];
}

function sendEmail($to, $subject, $template, $data = []) {
  $htmlBody = renderTemplate($template, $data);
  $result = smtpMail($to, $subject, $htmlBody);
  logEmail($to, $subject, $template, $result['success'] ? 'sent' : 'failed', $result['error'] ?? '');
  return $result;
}

function renderTemplate($template, $data) {
  $file = __DIR__ . '/templates/' . $template . '.php';
  if (!file_exists($file)) return '<h1>Template not found</h1>';
  ob_start();
  extract($data);
  include $file;
  return ob_get_clean();
}

function logEmail($to, $subject, $template, $status, $error = '') {
  $db = getDB();
  if (!$db) return;
  try {
    $stmt = $db->prepare("CREATE TABLE IF NOT EXISTS email_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recipient VARCHAR(255), subject VARCHAR(255),
      template VARCHAR(100), status VARCHAR(50),
      error TEXT, sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $stmt->execute();
    $stmt = $db->prepare("INSERT INTO email_logs (recipient, subject, template, status, error) VALUES (?,?,?,?,?)");
    $stmt->execute([$to, $subject, $template, $status, $error]);
  } catch (Exception $e) {}
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['action'])) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'Missing action']);
  exit;
}

$response = ['success' => false, 'error' => 'Unknown action'];

switch ($input['action']) {
  case 'send-otp':
    $response = sendEmail(
      $input['email'],
      'Your OTP Code - Al Najaf Digital Property',
      'otp',
      ['name' => $input['name'] ?? 'User', 'otp' => $input['otp'], 'site_url' => $_SERVER['HTTP_ORIGIN'] ?? 'https://alnajafdigitalproperty.com']
    );
    break;

  case 'order-confirmation':
    $response = sendEmail(
      $input['email'],
      'Order Confirmed - ' . ($input['orderRef'] ?? ''),
      'order-confirmation',
      [
        'name' => $input['name'] ?? 'User',
        'orderRef' => $input['orderRef'] ?? '',
        'orderType' => $input['orderType'] ?? '',
        'orderDate' => $input['orderDate'] ?? date('Y-m-d'),
        'orderAmount' => $input['orderAmount'] ?? '',
        'items' => $input['items'] ?? [],
        'site_url' => $_SERVER['HTTP_ORIGIN'] ?? 'https://alnajafdigitalproperty.com'
      ]
    );
    break;

  case 'status-change':
    $response = sendEmail(
      $input['email'],
      'Order Status Updated - ' . ($input['orderRef'] ?? ''),
      'status-change',
      [
        'name' => $input['name'] ?? 'User',
        'orderRef' => $input['orderRef'] ?? '',
        'orderType' => $input['orderType'] ?? '',
        'oldStatus' => $input['oldStatus'] ?? '',
        'newStatus' => $input['newStatus'] ?? '',
        'note' => $input['note'] ?? '',
        'site_url' => $_SERVER['HTTP_ORIGIN'] ?? 'https://alnajafdigitalproperty.com'
      ]
    );
    break;

  case 'inquiry-notification':
    $response = sendEmail(
      $input['email'],
      'New Inquiry Received - ' . ($input['propertyTitle'] ?? ''),
      'inquiry',
      [
        'name' => $input['name'] ?? 'User',
        'propertyTitle' => $input['propertyTitle'] ?? '',
        'buyerName' => $input['buyerName'] ?? '',
        'buyerPhone' => $input['buyerPhone'] ?? '',
        'buyerEmail' => $input['buyerEmail'] ?? '',
        'message' => $input['message'] ?? '',
        'site_url' => $_SERVER['HTTP_ORIGIN'] ?? 'https://alnajafdigitalproperty.com'
      ]
    );
    break;

  case 'contact-notification':
    $response = sendEmail(
      SMTP_FROM,
      'New Contact Form Submission',
      'contact',
      [
        'name' => $input['name'] ?? '',
        'email' => $input['email'] ?? '',
        'phone' => $input['phone'] ?? '',
        'message' => $input['message'] ?? '',
      ]
    );
    break;
}

echo json_encode($response);
