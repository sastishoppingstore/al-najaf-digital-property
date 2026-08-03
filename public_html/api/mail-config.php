<?php
// SMTP Configuration - Edit these values
define('SMTP_HOST', 'smtp.alnajafdigitalproperty.com');
define('SMTP_PORT', 465);
define('SMTP_USER', 'info@alnajafdigitalproperty.com');
define('SMTP_PASS', 'Wafa@1122');
define('SMTP_FROM', 'info@alnajafdigitalproperty.com');
define('SMTP_FROM_NAME', 'Al Najaf Digital Property');
define('SMTP_SECURE', 'ssl'); // ssl or tls

define('DB_HOST', 'sdb-71.hosting.stackcp.net');
define('DB_NAME', 'najafdb-3530353935a0');
define('DB_USER', 'najafdb-3530353935a0');
define('DB_PASS', 'Wafa@1122');

function getDB() {
  try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
    return $pdo;
  } catch (PDOException $e) {
    return null;
  }
}
