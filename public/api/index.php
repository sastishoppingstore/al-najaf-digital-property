<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/mail-config.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

function jsonOut($data, $code = 200) { http_response_code($code); echo json_encode($data); exit; }

/**
 * Verifies a main-image URL actually resolves to a real image file.
 * Local /images/... paths are checked on disk (a missing file would be
 * served as the SPA fallback with HTTP 200 + text/html, which the browser
 * cannot decode). Remote URLs are checked via a lightweight content-type
 * probe. Returns true only when the image is genuinely loadable.
 */
function imageIsLoadable($url) {
  static $cache = [];
  $url = trim((string)$url);
  if ($url === '') return false;
  if (array_key_exists($url, $cache)) return $cache[$url];
  $ok = imageIsLoadableUncached($url);
  $cache[$url] = $ok;
  return $ok;
}

function imageIsLoadableUncached($url) {
  $url = trim((string)$url);
  if ($url === '') return false;
  if (preg_match('#^https?://#i', $url)) {
    $ctx = stream_context_create(['http' => ['method' => 'HEAD', 'timeout' => 8, 'follow_location' => 1, 'ignore_errors' => 1], 'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
    $hdrs = @get_headers($url, 0, $ctx);
    if (!is_array($hdrs)) return false;
    foreach ($hdrs as $h) {
      if (stripos($h, 'content-type:') === 0 && stripos($h, 'image/') !== false) return true;
    }
    return false;
  }
  // Local path (e.g. /images/p13-1.jpg)
  $docRoot = isset($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') : dirname(__DIR__, 2);
  $file = $docRoot . '/' . ltrim($url, '/');
  if (!is_file($file)) return false;
  $info = @getimagesize($file);
  return is_array($info) && isset($info[0]) && $info[0] > 0;
}

/**
 * Self-healing migration: ensures required tables/columns exist and
 * seeds the default super admin so admin login always works.
 * Safe to run on every request (checks before altering).
 */
function autoMigrate($db) {
  // 1. Make sure the users table exists (old minimal schema fallback)
  $db->exec("CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL DEFAULT '',
    cnic VARCHAR(50) NOT NULL DEFAULT '',
    city VARCHAR(100) NOT NULL DEFAULT '',
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  // 2. Add missing columns on the existing users table if absent
  $cols = $db->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
  if (!in_array('name', $cols)) {
    $db->exec("ALTER TABLE users ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '' AFTER id");
  }
  if (!in_array('email', $cols)) {
    $db->exec("ALTER TABLE users ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT '' AFTER name");
  }
  if (!in_array('phone', $cols)) {
    $db->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NOT NULL DEFAULT '' AFTER email");
  }
  if (!in_array('cnic', $cols)) {
    $db->exec("ALTER TABLE users ADD COLUMN cnic VARCHAR(50) NOT NULL DEFAULT '' AFTER phone");
  }
  if (!in_array('city', $cols)) {
    $db->exec("ALTER TABLE users ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT '' AFTER cnic");
  }
  if (!in_array('password', $cols)) {
    $db->exec("ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '' AFTER city");
  }
  if (!in_array('role', $cols)) {
    $db->exec("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user' AFTER password");
  }

  // 3. Ensure sessions table exists
  $db->exec("CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  // 3b. Ensure dc_rates table exists (DC Rate Check)
  $db->exec("CREATE TABLE IF NOT EXISTS dc_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    zila VARCHAR(100) NOT NULL,
    tehsil VARCHAR(100) NOT NULL,
    mouza_area VARCHAR(255) NOT NULL,
    property_type ENUM('Residential','Commercial','Agricultural') NOT NULL DEFAULT 'Residential',
    location_status ENUM('Urban','Rural') NOT NULL DEFAULT 'Urban',
    dc_rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'Marla',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) DEFAULT NULL,
    UNIQUE KEY unique_rate (zila, tehsil, mouza_area, property_type, location_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  // 3c. Ensure orders + order_items tables exist
  $db->exec("CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) DEFAULT NULL,
    order_ref VARCHAR(100) NOT NULL,
    order_type VARCHAR(100) NOT NULL,
    order_date VARCHAR(100) DEFAULT NULL,
    order_amount VARCHAR(100) DEFAULT '0',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_value VARCHAR(255) DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  // 3d. Ensure all content/content-mgmt tables exist
  $db->exec("CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(100) NOT NULL,
    UNIQUE KEY uniq_fav (user_id, property_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  // --- Detect & migrate legacy `properties` table (old schema w/ uuid column, INT id) ---
  try {
    $isLegacyProps = false;
    try {
      $probe = $db->query("SHOW COLUMNS FROM properties")->fetchAll(PDO::FETCH_ASSOC);
      $pf = array_column($probe, 'Field');
      if (in_array('uuid', $pf)) $isLegacyProps = true;
    } catch (Exception $e) { $isLegacyProps = false; }

    if ($isLegacyProps) {
      $db->exec("SET FOREIGN_KEY_CHECKS = 0");
      try {
        // Drop any FK constraints referencing `properties` (legacy child tables may have them)
        try {
          $fks = $db->query("SELECT TABLE_NAME, CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'properties'")->fetchAll(PDO::FETCH_ASSOC);
          foreach ($fks as $fk) {
            $db->exec("ALTER TABLE `{$fk['TABLE_NAME']}` DROP FOREIGN KEY `{$fk['CONSTRAINT_NAME']}`");
          }
        } catch (Exception $e) { /* no referencing fks */ }
        // Rename legacy table instead of dropping (FK-safe); old data stays as backup
        $db->exec("DROP TABLE IF EXISTS properties_legacy");
        $db->exec("RENAME TABLE properties TO properties_legacy");
        // Mark so images remap + row copy happen after schema heal below
        $GLOBALS['__legacy_props_migrated'] = true;
      } finally {
        $db->exec("SET FOREIGN_KEY_CHECKS = 1");
      }
    }
  } catch (Exception $e) { /* ignore migration errors */ }

  $db->exec("CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    price_type VARCHAR(20) DEFAULT 'fixed',
    purpose VARCHAR(20) DEFAULT 'sale',
    category_id VARCHAR(50) DEFAULT 'houses',
    sub_category_id VARCHAR(50) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    area VARCHAR(100) DEFAULT '',
    lat DECIMAL(10,6) DEFAULT 0,
    lng DECIMAL(10,6) DEFAULT 0,
    size VARCHAR(50) DEFAULT '',
    bedrooms INT DEFAULT 0,
    bathrooms INT DEFAULT 0,
    furnished TINYINT(1) DEFAULT 0,
    seller_name VARCHAR(255) DEFAULT '',
    seller_type VARCHAR(20) DEFAULT 'Owner',
    seller_phone VARCHAR(50) DEFAULT '',
    seller_whatsapp VARCHAR(50) DEFAULT '',
    seller_email VARCHAR(255) DEFAULT '',
    status VARCHAR(20) DEFAULT 'pending',
    featured TINYINT(1) DEFAULT 0,
    premium TINYINT(1) DEFAULT 0,
    verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  // Self-heal old properties schema (ensure modern columns exist)
  try {
    $propCols = $db->query("SHOW COLUMNS FROM properties")->fetchAll(PDO::FETCH_COLUMN);
    $needProp = [
      'price_type' => "ALTER TABLE properties ADD COLUMN price_type VARCHAR(20) DEFAULT 'fixed'",
      'purpose' => "ALTER TABLE properties ADD COLUMN purpose VARCHAR(20) DEFAULT 'sale'",
      'sub_category_id' => "ALTER TABLE properties ADD COLUMN sub_category_id VARCHAR(50) DEFAULT ''",
      'area' => "ALTER TABLE properties ADD COLUMN area VARCHAR(100) DEFAULT ''",
      'lat' => "ALTER TABLE properties ADD COLUMN lat DECIMAL(10,6) DEFAULT 0",
      'lng' => "ALTER TABLE properties ADD COLUMN lng DECIMAL(10,6) DEFAULT 0",
      'size' => "ALTER TABLE properties ADD COLUMN size VARCHAR(50) DEFAULT ''",
      'furnished' => "ALTER TABLE properties ADD COLUMN furnished TINYINT(1) DEFAULT 0",
      'seller_name' => "ALTER TABLE properties ADD COLUMN seller_name VARCHAR(255) DEFAULT ''",
      'seller_type' => "ALTER TABLE properties ADD COLUMN seller_type VARCHAR(20) DEFAULT 'Owner'",
      'seller_phone' => "ALTER TABLE properties ADD COLUMN seller_phone VARCHAR(50) DEFAULT ''",
      'seller_whatsapp' => "ALTER TABLE properties ADD COLUMN seller_whatsapp VARCHAR(50) DEFAULT ''",
      'seller_email' => "ALTER TABLE properties ADD COLUMN seller_email VARCHAR(255) DEFAULT ''",
      'status' => "ALTER TABLE properties ADD COLUMN status VARCHAR(20) DEFAULT 'pending'",
      'featured' => "ALTER TABLE properties ADD COLUMN featured TINYINT(1) DEFAULT 0",
      'premium' => "ALTER TABLE properties ADD COLUMN premium TINYINT(1) DEFAULT 0",
      'verified' => "ALTER TABLE properties ADD COLUMN verified TINYINT(1) DEFAULT 0",
    ];
    foreach ($needProp as $col => $sql) {
      if (!in_array($col, $propCols)) $db->exec($sql);
    }
    // Migrate legacy column names to app schema where possible
    if (in_array('listing_type', $propCols) && !in_array('purpose', $propCols)) {
      $db->exec("UPDATE properties SET purpose = listing_type WHERE listing_type IS NOT NULL AND listing_type != ''");
    }
    if (in_array('latitude', $propCols) && !in_array('lat', $propCols)) {
      $db->exec("UPDATE properties SET lat = latitude");
    }
    if (in_array('longitude', $propCols) && !in_array('lng', $propCols)) {
      $db->exec("UPDATE properties SET lng = longitude");
    }
  } catch (Exception $e) { /* ignore migration errors */ }

  // Align collations across property-id tables so JOINs never fail
  // (new tables use utf8mb4_unicode_ci; legacy ones may be general_ci)
  try {
    foreach (['property_images', 'property_overrides', 'inquiries', 'favorites', 'properties'] as $t) {
      $chk = $db->query("SELECT TABLE_COLLATION FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '$t' AND TABLE_COLLATION = 'utf8mb4_general_ci'")->fetchColumn();
      if ($chk) {
        $db->exec("ALTER TABLE `$t` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
      }
    }
  } catch (Exception $e) { /* ignore */ }

  $db->exec("CREATE TABLE IF NOT EXISTS property_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  // Self-heal old property_images schema (live DB may lack the `url` column)
  try {
    $piCols = $db->query("SHOW COLUMNS FROM property_images")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('url', $piCols)) {
      // Find the actual image column name to migrate existing data
      $renameTarget = null;
      foreach (['image_url', 'image_path', 'img_url', 'image', 'path', 'file'] as $c) {
        if (in_array($c, $piCols)) { $renameTarget = $c; break; }
      }
      if ($renameTarget) {
        $db->exec("ALTER TABLE property_images CHANGE `{$renameTarget}` url VARCHAR(500) NOT NULL");
      } else {
        $db->exec("ALTER TABLE property_images ADD COLUMN url VARCHAR(500) NOT NULL DEFAULT '' AFTER property_id");
      }
    }
    if (!in_array('property_id', $piCols)) {
      $db->exec("ALTER TABLE property_images ADD COLUMN property_id VARCHAR(36) NOT NULL DEFAULT '' FIRST");
    } else {
      // Ensure property_id can hold app UUIDs (legacy tables may have INT)
      try {
        $piDetail = $db->query("SHOW COLUMNS FROM property_images LIKE 'property_id'")->fetch(PDO::FETCH_ASSOC);
        if ($piDetail && stripos($piDetail['Type'], 'int') !== false) {
          $db->exec("ALTER TABLE property_images MODIFY property_id VARCHAR(36) NOT NULL DEFAULT ''");
        }
      } catch (Exception $e) { /* ignore */ }
    }
    if (!in_array('sort_order', $piCols)) {
      $db->exec("ALTER TABLE property_images ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER url");
    }
  } catch (Exception $e) { /* ignore migration errors */ }

  // Complete legacy properties migration: copy rows (never blocked by image issues)
  if (!empty($GLOBALS['__legacy_props_migrated'])) {
    try {
      $db->exec("INSERT INTO properties (id,title,description,price,price_type,purpose,category_id,sub_category_id,city,area,lat,lng,size,bedrooms,bathrooms,furnished,seller_name,seller_type,seller_phone,seller_whatsapp,status,featured,premium,verified,created_at)
        SELECT COALESCE(NULLIF(uuid,''), CAST(id AS CHAR)), title, description, COALESCE(price,0), COALESCE(price_type,'fixed'), COALESCE(listing_type,'sale'), COALESCE(category_id,'houses'), COALESCE(sub_category_id,''), COALESCE(city,''), COALESCE(address,''), COALESCE(latitude,0), COALESCE(longitude,0), COALESCE(area_sqft,''), COALESCE(bedrooms,0), COALESCE(bathrooms,0), COALESCE(furnished,0), COALESCE(seller_name,''), COALESCE(seller_type,'Owner'), COALESCE(seller_phone,''), COALESCE(seller_whatsapp,''), CASE WHEN status='active' THEN 'approved' ELSE COALESCE(status,'pending') END, COALESCE(featured,0), COALESCE(premium,0), COALESCE(verified,0), created_at
        FROM properties_legacy");
      // Remap legacy image rows to the new uuid-based property ids (only after rows copied)
      try {
        $db->exec("UPDATE property_images pi SET pi.property_id = (SELECT uuid FROM properties_legacy pl WHERE pl.id = pi.property_id LIMIT 1) WHERE pi.property_id IN (SELECT id FROM properties_legacy)");
      } catch (Exception $e) { /* ignore */ }
      unset($GLOBALS['__legacy_props_migrated']);
    } catch (Exception $e) { /* keep flag set so next request retries */ }
  }

  $db->exec("CREATE TABLE IF NOT EXISTS property_overrides (
    property_id VARCHAR(100) PRIMARY KEY,
    verified TINYINT(1) DEFAULT NULL,
    featured TINYINT(1) DEFAULT NULL,
    premium TINYINT(1) DEFAULT NULL,
    status VARCHAR(20) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS inquiries (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(100) NOT NULL,
    property_title VARCHAR(255) DEFAULT '',
    user_id VARCHAR(36) DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    message TEXT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS towns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT 'Building2',
    description TEXT,
    image VARCHAR(500) DEFAULT '',
    count INT DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS sub_categories (
    id VARCHAR(50) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    category_id VARCHAR(50) DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS navbar_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    link_to VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS footer_content (
    id INT PRIMARY KEY,
    tagline VARCHAR(500) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(100) DEFAULT '',
    address VARCHAR(500) DEFAULT ''
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS footer_columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS footer_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    column_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    link_to VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100) DEFAULT '',
    description TEXT,
    fee VARCHAR(100) DEFAULT '',
    duration VARCHAR(100) DEFAULT '',
    icon VARCHAR(50) DEFAULT 'Scale',
    image VARCHAR(500) DEFAULT '',
    category VARCHAR(50) DEFAULT 'legal',
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS lawyers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) DEFAULT '',
    specializations TEXT,
    experience INT DEFAULT 0,
    rating DECIMAL(3,1) DEFAULT 0,
    reviews INT DEFAULT 0,
    fee DECIMAL(15,2) DEFAULT 0,
    city VARCHAR(100) DEFAULT '',
    image VARCHAR(500) DEFAULT '',
    bar_council VARCHAR(255) DEFAULT '',
    education VARCHAR(255) DEFAULT '',
    bio TEXT,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS site_config (
    id INT PRIMARY KEY,
    brand VARCHAR(100) DEFAULT '',
    tagline VARCHAR(255) DEFAULT '',
    full_name VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    phone_display VARCHAR(50) DEFAULT '',
    whatsapp VARCHAR(50) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    address VARCHAR(500) DEFAULT '',
    admin_email VARCHAR(255) DEFAULT '',
    logo VARCHAR(500) DEFAULT '',
    hero_image VARCHAR(500) DEFAULT ''
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS page_texts (
    `key` VARCHAR(100) PRIMARY KEY,
    value_en TEXT,
    value_ur TEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS stamp_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    min_value DECIMAL(15,2) DEFAULT 0,
    max_value DECIMAL(15,2) DEFAULT 0,
    category VARCHAR(50) DEFAULT '',
    gov_rate DECIMAL(15,2) DEFAULT 0,
    source VARCHAR(255) DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS legal_docs (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT '',
    fee VARCHAR(100) DEFAULT '',
    duration VARCHAR(100) DEFAULT '',
    icon VARCHAR(50) DEFAULT 'FileText',
    image VARCHAR(500) DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $db->exec("CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  // Ensure dc_rates has city column
  $dcCols = $db->query("SHOW COLUMNS FROM dc_rates")->fetchAll(PDO::FETCH_COLUMN);
  if (!in_array('city', $dcCols)) {
    $db->exec("ALTER TABLE dc_rates ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT '' AFTER id");
  }

  // Self-heal missing sort_order columns (legacy live tables may lack them)
  try {
    foreach (['services', 'lawyers', 'categories', 'sub_categories', 'navbar_links', 'footer_columns', 'stamp_types', 'legal_docs', 'cities', 'towns'] as $t) {
      $exists = $db->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '$t'")->fetchColumn();
      if (!$exists) continue;
      $cols = $db->query("SHOW COLUMNS FROM `$t`")->fetchAll(PDO::FETCH_COLUMN);
      if (!in_array('sort_order', $cols)) {
        $db->exec("ALTER TABLE `$t` ADD COLUMN sort_order INT NOT NULL DEFAULT 0");
      }
    }
  } catch (Exception $e) { /* ignore */ }

  // 4. Ensure admin account exists with current credentials (self-heal)
  $hash = password_hash('Wafa@1122', PASSWORD_DEFAULT);
  $stmt = $db->prepare("SELECT id, email, password FROM users WHERE role IN ('super_admin','admin') ORDER BY FIELD(role,'super_admin','admin'), created_at ASC LIMIT 1");
  $stmt->execute();
  $admin = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($admin) {
    $emailOk = $admin['email'] === 'info@alnajafdigitalproperty.com';
    $passOk = password_verify('Wafa@1122', $admin['password']);
    if (!$emailOk || !$passOk) {
      $db->prepare("UPDATE users SET email = 'info@alnajafdigitalproperty.com', name = 'Super Admin', phone = '0321 3216423', city = 'Lahore', role = 'super_admin', password = ? WHERE id = ?")
        ->execute([$hash, $admin['id']]);
    }
  } else {
    $id = uuidv4();
    $ins = $db->prepare("INSERT INTO users (id, name, email, phone, cnic, city, password, role) VALUES (?,?,?,?,?,?,?,?)");
    $ins->execute([$id, 'Super Admin', 'info@alnajafdigitalproperty.com', '0321 3216423', '', 'Lahore', $hash, 'super_admin']);
  }

  // 5. Seed mock properties from seed-properties.json if none are present yet.
  //    (Idempotent: only inserts the z* mock catalog when it's missing, so the
  //    existing DB rows are never touched.)
  $mockPresent = (int)$db->query("SELECT COUNT(*) FROM properties WHERE id LIKE 'z%'")->fetchColumn();
  if ($mockPresent === 0) {
    $seedFile = __DIR__ . '/seed-properties.json';
    if (file_exists($seedFile)) {
      $seedRows = json_decode(file_get_contents($seedFile), true);
      if (is_array($seedRows) && $seedRows) {
        $ins = $db->prepare("INSERT IGNORE INTO properties (id,title,description,price,price_type,purpose,category_id,sub_category_id,city,area,lat,lng,size,bedrooms,bathrooms,furnished,seller_name,seller_type,seller_phone,seller_whatsapp,status,featured,premium,verified,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,COALESCE(?, NOW()))");
        $imgIns = $db->prepare("INSERT INTO property_images (property_id, url, sort_order) VALUES (?,?,?)");
        foreach ($seedRows as $r) {
          try {
            $ins->execute([
              $r['id'], $r['title'], $r['description'], $r['price'], $r['price_type'],
              $r['purpose'], $r['category_id'], $r['sub_category_id'], $r['city'], $r['area'],
              $r['lat'], $r['lng'], $r['size'], $r['bedrooms'], $r['bathrooms'],
              $r['furnished'], $r['seller_name'], $r['seller_type'], $r['seller_phone'],
              $r['seller_whatsapp'], $r['status'], $r['featured'], $r['premium'], $r['verified'],
              $r['created_at'] ?: null,
            ]);
          } catch (Exception $e) { continue; }
          $imgs = is_array($r['images']) ? $r['images'] : [];
          foreach ($imgs as $i => $url) {
            if (!is_string($url) || trim($url) === '') continue;
            try { $imgIns->execute([$r['id'], $url, $i]); } catch (Exception $e) { /* skip */ }
          }
        }
      }
    }
  }

  // 6. Seed default DC rates (Lahore areas, per Marla) if table is empty
  $count = (int)$db->query("SELECT COUNT(*) FROM dc_rates")->fetchColumn();
  if ($count === 0) {
    $rates = [
      ['Niaz Baig', 808000],
      ['Mansoora Multan Chungi', 1150000],
      ['Kanjra', 761875],
      ['Niaz Baig Thokar Raiwind Road', 1232375],
      ['Shahpur Khanpur', 735000],
      ['Multan Road Niaz Baig', 970375],
      ['Canal Road', 1287000],
      ['Canal View Society', 1554000],
      ['Gurpey Rah', 624500],
      ['Hanjrawal', 960500],
      ['Ittefaq Town', 780875],
      ['Hassan Town', 1157750],
      ['Judicial Colony', 1232375],
      ['Katar Bund Road', 770500],
      ['Lalazar Garden', 699500],
      ['Marghzar Colony', 877375],
      ['Mir Ali Garden', 2225375],
      ['Muridwal', 734750],
      ['Park View', 1170750],
      ['Shaday Wal', 653375],
      ['Sultan Pura', 616750],
    ];
    $ins = $db->prepare("INSERT IGNORE INTO dc_rates (zila, tehsil, mouza_area, property_type, location_status, dc_rate, unit) VALUES (?,?,?,?,?,?,?)");
    foreach ($rates as $r) {
      $ins->execute(['Lahore', 'Lahore City', $r[0], 'Residential', 'Urban', $r[1], 'Marla']);
    }
  }
}

function uuidv4() {
  $data = random_bytes(16);
  $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
  $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// Attach images to property rows WITHOUT joining across collations.
// property_images.property_id may be utf8mb4_general_ci while
// properties.id is utf8mb4_unicode_ci; a direct JOIN throws
// SQLSTATE 1267 "Illegal mix of collations". Fetching images in a
// separate query (compared within one column only) sidesteps that
// entirely and works on any collation combination.
function attachImages($db, $rows) {
  if (!$rows) return $rows;
  $ids = array_map(function ($r) { return $r['id']; }, $rows);
  $idMap = array_flip($ids);
  $placeholders = implode(',', array_fill(0, count($ids), '?'));
  $stmt = $db->prepare("SELECT property_id, url FROM property_images WHERE property_id IN ($placeholders) ORDER BY sort_order ASC, id ASC");
  $stmt->execute(array_values($ids));
  foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $img) {
    if (isset($idMap[$img['property_id']])) {
      $rows[$idMap[$img['property_id']]]['images'][] = $img['url'];
    }
  }
  foreach ($rows as &$r) {
    if (!isset($r['images'])) $r['images'] = [];
  }
  return $rows;
}

try {
  $db = getDB();
  if (!$db) jsonOut(['success' => false, 'error' => 'Database connection failed'], 500);

  // Auto-migrate schema + seed admin user (self-heal, safe to run every request)
  autoMigrate($db);

  switch ($action) {

    // ==================== USERS ====================
    case 'register':
      $id = uuidv4();
      $hash = password_hash($input['password'], PASSWORD_DEFAULT);
      $stmt = $db->prepare("INSERT INTO users (id, name, email, phone, cnic, city, password, role) VALUES (?,?,?,?,?,?,?,'user')");
      $stmt->execute([$id, $input['name'], $input['email'], $input['phone'] ?? '', $input['cnic'] ?? '', $input['city'] ?? '', $hash]);
      jsonOut(['success' => true, 'user' => ['id' => $id, 'name' => $input['name'], 'email' => $input['email'], 'role' => 'user']]);
      break;

    case 'login':
      $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
      $stmt->execute([$input['email']]);
      $user = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!$user || !password_verify($input['password'], $user['password']))
        jsonOut(['success' => false, 'error' => 'Invalid email or password'], 401);
      $sid = uuidv4();
      $expires = date('Y-m-d H:i:s', time() + 86400 * 7);
      $stmt = $db->prepare("INSERT INTO sessions (id, user_id, email, name, expires_at) VALUES (?,?,?,?,?)");
      $stmt->execute([$sid, $user['id'], $user['email'], $user['name'], $expires]);
      jsonOut(['success' => true, 'session' => ['userId' => $user['id'], 'email' => $user['email'], 'name' => $user['name'], 'token' => $sid]]);
      break;

    case 'get-session':
      $stmt = $db->prepare("SELECT s.*, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > NOW() LIMIT 1");
      $stmt->execute([$input['token']]);
      $s = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!$s) jsonOut(['success' => false, 'error' => 'No session'], 401);
      jsonOut(['success' => true, 'session' => ['userId' => $s['user_id'], 'email' => $s['email'], 'name' => $s['name'], 'role' => $s['role']]]);
      break;

    case 'logout':
      $stmt = $db->prepare("DELETE FROM sessions WHERE id = ?");
      $stmt->execute([$input['token']]);
      jsonOut(['success' => true]);
      break;

    case 'get-users':
      $stmt = $db->query("SELECT id, name, email, phone, cnic, city, role, created_at FROM users ORDER BY created_at DESC");
      jsonOut(['success' => true, 'users' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
      break;

    case 'get-user':
      $stmt = $db->prepare("SELECT id, name, email, phone, cnic, city, role, created_at FROM users WHERE id = ? LIMIT 1");
      $stmt->execute([$input['id']]);
      $u = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!$u) jsonOut(['success' => false, 'error' => 'Not found'], 404);
      jsonOut(['success' => true, 'user' => $u]);
      break;

    case 'update-user-role':
      $stmt = $db->prepare("UPDATE users SET role = ? WHERE id = ?");
      $stmt->execute([$input['role'], $input['id']]);
      jsonOut(['success' => true]);
      break;

    case 'delete-user':
      $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
      $stmt->execute([$input['id']]);
      jsonOut(['success' => true]);
      break;

    case 'update-profile':
      $stmt = $db->prepare("UPDATE users SET name=?, phone=?, cnic=?, city=? WHERE id=?");
      $stmt->execute([$input['name'], $input['phone'], $input['cnic'], $input['city'], $input['id']]);
      jsonOut(['success' => true]);
      break;

    // ==================== FAVORITES ====================
    case 'get-favorites':
      $stmt = $db->prepare("SELECT property_id FROM favorites WHERE user_id = ?");
      $stmt->execute([$input['userId']]);
      jsonOut(['success' => true, 'ids' => array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'property_id')]);
      break;

    case 'toggle-favorite':
      $stmt = $db->prepare("SELECT id FROM favorites WHERE user_id = ? AND property_id = ? LIMIT 1");
      $stmt->execute([$input['userId'], $input['propertyId']]);
      if ($stmt->fetch()) {
        $db->prepare("DELETE FROM favorites WHERE user_id = ? AND property_id = ?")->execute([$input['userId'], $input['propertyId']]);
      } else {
        $db->prepare("INSERT INTO favorites (user_id, property_id) VALUES (?,?)")->execute([$input['userId'], $input['propertyId']]);
      }
      $stmt = $db->prepare("SELECT property_id FROM favorites WHERE user_id = ?");
      $stmt->execute([$input['userId']]);
      jsonOut(['success' => true, 'ids' => array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'property_id')]);
      break;

    // ==================== PROPERTIES ====================
    case 'get-properties':
      $rows = $db->query("SELECT * FROM properties ORDER BY featured DESC, premium DESC, created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
      $rows = attachImages($db, $rows);
      // Strict filter: drop properties whose main image is not genuinely loadable
      // (missing local files are served as the SPA fallback with 200 + text/html,
      // which the browser cannot decode) so the UI never crashes on broken images.
      $rows = array_values(array_filter($rows, function ($r) {
        $imgs = is_array($r['images']) ? $r['images'] : [];
        $main = isset($imgs[0]) ? $imgs[0] : '';
        return imageIsLoadable($main);
      }));
      jsonOut(['success' => true, 'properties' => $rows]);
      break;

    case 'seed-mock-properties':
      $seedFile = __DIR__ . '/seed-properties.json';
      if (!file_exists($seedFile)) jsonOut(['success' => false, 'error' => 'seed-properties.json missing'], 404);
      $seedRows = json_decode(file_get_contents($seedFile), true);
      if (!is_array($seedRows) || !$seedRows) jsonOut(['success' => false, 'error' => 'empty seed file'], 400);
      $ins = $db->prepare("INSERT IGNORE INTO properties (id,title,description,price,price_type,purpose,category_id,sub_category_id,city,area,lat,lng,size,bedrooms,bathrooms,furnished,seller_name,seller_type,seller_phone,seller_whatsapp,status,featured,premium,verified)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
      $imgIns = $db->prepare("INSERT IGNORE INTO property_images (property_id, url, sort_order) VALUES (?,?,?)");
      $inserted = 0;
      foreach ($seedRows as $r) {
        try {
          $ins->execute([
            $r['id'], $r['title'], $r['description'], $r['price'], $r['price_type'],
            $r['purpose'], $r['category_id'], $r['sub_category_id'], $r['city'], $r['area'],
            $r['lat'], $r['lng'], $r['size'], $r['bedrooms'], $r['bathrooms'],
            $r['furnished'], $r['seller_name'], $r['seller_type'], $r['seller_phone'],
            $r['seller_whatsapp'], $r['status'], $r['featured'], $r['premium'], $r['verified'],
          ]);
          if ($ins->rowCount() > 0) $inserted++;
        } catch (Exception $e) { continue; }
        $imgs = is_array($r['images']) ? $r['images'] : [];
        foreach ($imgs as $i => $url) {
          if (!is_string($url) || trim($url) === '') continue;
          try { $imgIns->execute([$r['id'], $url, $i]); } catch (Exception $e) { /* skip */ }
        }
      }
      jsonOut(['success' => true, 'inserted' => $inserted]);
      break;

    case 'get-property':
      $stmt = $db->prepare("SELECT * FROM properties WHERE id = ? LIMIT 1");
      $stmt->execute([$input['id']]);
      $r = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!$r) jsonOut(['success' => false, 'error' => 'Not found'], 404);
      $r['images'] = [];
      $rows = attachImages($db, [$r]);
      jsonOut(['success' => true, 'property' => $rows[0]]);
      break;

    case 'add-property':
      $id = uuidv4();
      $cat = $input['categoryId'] ?? $input['category'] ?? 'houses';
      $subcat = $input['subCategoryId'] ?? $input['subCategory'] ?? '';
      $stmt = $db->prepare("INSERT INTO properties (id,title,description,price,price_type,purpose,category_id,sub_category_id,city,area,lat,lng,size,bedrooms,bathrooms,furnished,seller_name,seller_type,seller_phone,seller_whatsapp,status,featured,premium,verified)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
      $stmt->execute([
        $id, $input['title'], $input['description'], $input['price'], $input['priceType'],
        $input['purpose'], $cat, $subcat, $input['city'],
        $input['area'], $input['lat'] ?? 0, $input['lng'] ?? 0, $input['size'],
        $input['bedrooms'] ?? null, $input['bathrooms'] ?? null, $input['furnished'] ? 1 : 0,
        $input['sellerName'], $input['sellerType'], $input['sellerPhone'], $input['sellerWhatsapp'] ?? '',
        $input['status'] ?? 'pending', $input['featured'] ? 1 : 0, $input['premium'] ? 1 : 0, $input['verified'] ? 1 : 0
      ]);
      if (!empty($input['images']) && is_array($input['images'])) {
        $ins = $db->prepare("INSERT INTO property_images (property_id, url, sort_order) VALUES (?,?,?)");
        foreach ($input['images'] as $i => $img) $ins->execute([$id, $img, $i]);
      }
      jsonOut(['success' => true, 'propertyId' => $id]);
      break;

    case 'update-property':
      $cat = $input['categoryId'] ?? $input['category'] ?? 'houses';
      $subcat = $input['subCategoryId'] ?? $input['subCategory'] ?? '';
      $stmt = $db->prepare("UPDATE properties SET title=?,description=?,price=?,price_type=?,purpose=?,category_id=?,sub_category_id=?,city=?,area=?,lat=?,lng=?,size=?,bedrooms=?,bathrooms=?,furnished=?,seller_name=?,seller_type=?,seller_phone=?,seller_whatsapp=?,status=?,featured=?,premium=?,verified=? WHERE id=?");
      $stmt->execute([
        $input['title'], $input['description'], $input['price'], $input['priceType'],
        $input['purpose'], $cat, $subcat, $input['city'],
        $input['area'], $input['lat'] ?? 0, $input['lng'] ?? 0, $input['size'],
        $input['bedrooms'] ?? null, $input['bathrooms'] ?? null, $input['furnished'] ? 1 : 0,
        $input['sellerName'], $input['sellerType'], $input['sellerPhone'], $input['sellerWhatsapp'] ?? '',
        $input['status'] ?? 'pending', $input['featured'] ? 1 : 0, $input['premium'] ? 1 : 0, $input['verified'] ? 1 : 0,
        $input['id']
      ]);
      if (!empty($input['images']) && is_array($input['images'])) {
        $db->prepare("DELETE FROM property_images WHERE property_id = ?")->execute([$input['id']]);
        $ins = $db->prepare("INSERT INTO property_images (property_id, url, sort_order) VALUES (?,?,?)");
        foreach ($input['images'] as $i => $img) $ins->execute([$input['id'], $img, $i]);
      }
      jsonOut(['success' => true]);
      break;

    case 'delete-property':
      $db->prepare("DELETE FROM property_images WHERE property_id = ?")->execute([$input['id']]);
      $db->prepare("DELETE FROM property_overrides WHERE property_id = ?")->execute([$input['id']]);
      $db->prepare("DELETE FROM inquiries WHERE property_id = ?")->execute([$input['id']]);
      $db->prepare("DELETE FROM properties WHERE id = ?")->execute([$input['id']]);
      jsonOut(['success' => true]);
      break;

    case 'get-user-properties':
      $stmt = $db->prepare("SELECT * FROM properties WHERE seller_phone = ? OR seller_email = ? ORDER BY created_at DESC");
      $stmt->execute([$input['phone'], $input['email'] ?? '']);
      $rows = attachImages($db, $stmt->fetchAll(PDO::FETCH_ASSOC));
      jsonOut(['success' => true, 'properties' => $rows]);
      break;

    // ==================== PROPERTY OVERRIDES ====================
    case 'get-override':
      $stmt = $db->prepare("SELECT * FROM property_overrides WHERE property_id = ? LIMIT 1");
      $stmt->execute([$input['propertyId']]);
      $o = $stmt->fetch(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'override' => $o ?: null]);
      break;

    case 'save-override':
      $stmt = $db->prepare("INSERT INTO property_overrides (property_id, verified, featured, premium, status)
                VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE verified=VALUES(verified), featured=VALUES(featured), premium=VALUES(premium), status=VALUES(status)");
      $stmt->execute([
        $input['propertyId'],
        isset($input['verified']) ? ($input['verified'] ? 1 : 0) : null,
        isset($input['featured']) ? ($input['featured'] ? 1 : 0) : null,
        isset($input['premium']) ? ($input['premium'] ? 1 : 0) : null,
        $input['status'] ?? null
      ]);
      jsonOut(['success' => true]);
      break;

    case 'get-all-overrides':
      $rows = $db->query("SELECT * FROM property_overrides")->fetchAll(PDO::FETCH_ASSOC);
      $map = [];
      foreach ($rows as $r) $map[$r['property_id']] = $r;
      jsonOut(['success' => true, 'overrides' => $map]);
      break;

    // ==================== INQUIRIES ====================
    case 'get-inquiries':
      $stmt = $db->query("SELECT * FROM inquiries ORDER BY created_at DESC");
      jsonOut(['success' => true, 'inquiries' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
      break;

    case 'add-inquiry':
      $id = uuidv4();
      $stmt = $db->prepare("INSERT INTO inquiries (id, property_id, property_title, user_id, name, email, phone, message) VALUES (?,?,?,?,?,?,?,?)");
      $stmt->execute([$id, $input['propertyId'], $input['propertyTitle'], $input['userId'] ?? null, $input['name'], $input['email'] ?? '', $input['phone'] ?? '', $input['message'] ?? '']);
      jsonOut(['success' => true, 'inquiryId' => $id]);
      break;

    case 'mark-inquiry-read':
      $db->prepare("UPDATE inquiries SET is_read = 1 WHERE id = ?")->execute([$input['id']]);
      jsonOut(['success' => true]);
      break;

    case 'delete-inquiry':
      $db->prepare("DELETE FROM inquiries WHERE id = ?")->execute([$input['id']]);
      jsonOut(['success' => true]);
      break;

    // ==================== CONTENT MANAGEMENT ====================
    case 'get-cities':
      $rows = $db->query("SELECT name FROM cities ORDER BY sort_order ASC, name ASC")->fetchAll(PDO::FETCH_COLUMN);
      jsonOut(['success' => true, 'cities' => $rows]);
      break;

    case 'save-cities':
      $db->exec("TRUNCATE TABLE cities");
      $stmt = $db->prepare("INSERT INTO cities (name, sort_order) VALUES (?,?)");
      foreach ($input['cities'] as $i => $c) $stmt->execute([$c, $i]);
      jsonOut(['success' => true]);
      break;

    case 'get-towns':
      $rows = $db->query("SELECT name FROM towns ORDER BY sort_order ASC, name ASC")->fetchAll(PDO::FETCH_COLUMN);
      jsonOut(['success' => true, 'towns' => $rows]);
      break;

    case 'save-towns':
      $db->exec("TRUNCATE TABLE towns");
      $stmt = $db->prepare("INSERT INTO towns (name, sort_order) VALUES (?,?)");
      foreach ($input['towns'] as $i => $t) $stmt->execute([$t, $i]);
      jsonOut(['success' => true]);
      break;

    case 'get-categories':
      $rows = $db->query("SELECT * FROM categories ORDER BY sort_order ASC")->fetchAll(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'categories' => $rows]);
      break;

    case 'save-categories':
      $db->exec("DELETE FROM sub_categories WHERE category_id NOT IN ('dummy')");
      $db->exec("DELETE FROM categories WHERE id NOT IN ('dummy')");
      foreach ($input['categories'] as $i => $c) {
        $stmt = $db->prepare("INSERT INTO categories (id, name, icon, description, image, count, sort_order) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon), count=VALUES(count), sort_order=VALUES(sort_order)");
        $stmt->execute([$c['id'], $c['name'], $c['icon'] ?? 'Building2', $c['description'] ?? '', $c['image'] ?? '', $c['count'] ?? 0, $i]);
      }
      jsonOut(['success' => true]);
      break;

    case 'get-sub-categories':
      $rows = $db->query("SELECT * FROM sub_categories ORDER BY sort_order ASC")->fetchAll(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'subCategories' => $rows]);
      break;

    case 'save-sub-categories':
      $db->exec("TRUNCATE TABLE sub_categories");
      $stmt = $db->prepare("INSERT INTO sub_categories (id, label, category_id, sort_order) VALUES (?,?,?,?)");
      foreach ($input['subCategories'] as $i => $sc) $stmt->execute([$sc['id'], $sc['label'], $sc['categoryId'], $i]);
      jsonOut(['success' => true]);
      break;

    case 'get-navbar':
      $rows = $db->query("SELECT link_to, label FROM navbar_links ORDER BY sort_order ASC")->fetchAll(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'links' => $rows]);
      break;

    case 'save-navbar':
      $db->exec("TRUNCATE TABLE navbar_links");
      $stmt = $db->prepare("INSERT INTO navbar_links (link_to, label, sort_order) VALUES (?,?,?)");
      foreach ($input['links'] as $i => $l) {
        $stmt->execute([$l['to'], $l['label'], $i]);
      }
      jsonOut(['success' => true]);
      break;

    case 'get-footer':
      $footer = $db->query("SELECT * FROM footer_content WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
      $cols = $db->query("SELECT * FROM footer_columns ORDER BY sort_order ASC")->fetchAll(PDO::FETCH_ASSOC);
      foreach ($cols as &$col) {
        $stmt = $db->prepare("SELECT label, link_to FROM footer_links WHERE column_id = ? ORDER BY sort_order ASC");
        $stmt->execute([$col['id']]);
        $col['links'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
      }
      jsonOut(['success' => true, 'footer' => ['tagline' => $footer['tagline'] ?? '', 'email' => $footer['email'] ?? '', 'phone' => $footer['phone'] ?? '', 'address' => $footer['address'] ?? '', 'columns' => $cols]]);
      break;

    case 'save-footer':
      $db->prepare("INSERT INTO footer_content (id, tagline, email, phone, address) VALUES (1,?,?,?,?) ON DUPLICATE KEY UPDATE tagline=VALUES(tagline), email=VALUES(email), phone=VALUES(phone), address=VALUES(address)")
        ->execute([$input['tagline'], $input['email'], $input['phone'], $input['address']]);
      $db->exec("DELETE FROM footer_links");
      $db->exec("DELETE FROM footer_columns");
      if (!empty($input['columns'])) {
        $stmtCol = $db->prepare("INSERT INTO footer_columns (title, sort_order) VALUES (?,?)");
        $stmtLink = $db->prepare("INSERT INTO footer_links (column_id, label, link_to, sort_order) VALUES (?,?,?,?)");
        foreach ($input['columns'] as $ci => $col) {
          $stmtCol->execute([$col['title'], $ci]);
          $colId = $db->lastInsertId();
          if (!empty($col['links'])) {
            foreach ($col['links'] as $li => $link) {
              $stmtLink->execute([$colId, $link['label'], $link['to'] ?? $link['link_to'] ?? '#', $li]);
            }
          }
        }
      }
      jsonOut(['success' => true]);
      break;

    case 'get-services':
      $rows = $db->query("SELECT * FROM services ORDER BY sort_order ASC")->fetchAll(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'services' => $rows]);
      break;

    case 'save-services':
      $db->exec("DELETE FROM services WHERE id NOT IN ('dummy')");
      $stmt = $db->prepare("INSERT INTO services (id, name, short_name, description, fee, duration, icon, image, category, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), short_name=VALUES(short_name), description=VALUES(description), fee=VALUES(fee), duration=VALUES(duration), icon=VALUES(icon), image=VALUES(image), category=VALUES(category), sort_order=VALUES(sort_order)");
      foreach ($input['services'] as $i => $s) $stmt->execute([$s['id'], $s['name'], $s['shortName'] ?? '', $s['description'] ?? '', $s['fee'] ?? '', $s['duration'] ?? '', $s['icon'] ?? 'Scale', $s['image'] ?? '', $s['category'] ?? 'legal', $i]);
      jsonOut(['success' => true]);
      break;

    case 'get-lawyers':
      $rows = $db->query("SELECT * FROM lawyers ORDER BY sort_order ASC")->fetchAll(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'lawyers' => $rows]);
      break;

    case 'save-lawyers':
      $db->exec("DELETE FROM lawyers WHERE id NOT IN ('dummy')");
      $stmt = $db->prepare("INSERT INTO lawyers (id, name, designation, specializations, experience, rating, reviews, fee, city, image, bar_council, education, bio, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), designation=VALUES(designation), specializations=VALUES(specializations), experience=VALUES(experience), rating=VALUES(rating), reviews=VALUES(reviews), fee=VALUES(fee), city=VALUES(city), image=VALUES(image), bar_council=VALUES(bar_council), education=VALUES(education), bio=VALUES(bio), sort_order=VALUES(sort_order)");
      foreach ($input['lawyers'] as $i => $l) {
        $specs = is_array($l['specializations'] ?? null) ? json_encode($l['specializations']) : ($l['specializations'] ?? '[]');
        $stmt->execute([$l['id'], $l['name'], $l['designation'] ?? '', $specs, $l['experience'] ?? 0, $l['rating'] ?? 0, $l['reviews'] ?? 0, $l['fee'] ?? 0, $l['city'] ?? '', $l['image'] ?? '', $l['barCouncil'] ?? '', $l['education'] ?? '', $l['bio'] ?? '', $i]);
      }
      jsonOut(['success' => true]);
      break;

    case 'get-site-config':
      $c = $db->query("SELECT * FROM site_config WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'config' => $c ?: []]);
      break;

    case 'save-site-config':
      $db->prepare("INSERT INTO site_config (id, brand, tagline, full_name, phone, phone_display, whatsapp, email, address, admin_email) VALUES (1,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE brand=VALUES(brand), tagline=VALUES(tagline), full_name=VALUES(full_name), phone=VALUES(phone), phone_display=VALUES(phone_display), whatsapp=VALUES(whatsapp), email=VALUES(email), address=VALUES(address), admin_email=VALUES(admin_email)")
        ->execute([$input['brand'], $input['tagline'], $input['fullName'], $input['phone'], $input['phoneDisplay'], $input['whatsapp'], $input['email'], $input['address'], $input['adminEmail'] ?? '']);
      jsonOut(['success' => true]);
      break;

    case 'get-page-texts':
      $rows = $db->query("SELECT `key`, value_en, value_ur FROM page_texts")->fetchAll(PDO::FETCH_ASSOC);
      $map = [];
      foreach ($rows as $r) $map[$r['key']] = ['en' => $r['value_en'], 'ur' => $r['value_ur']];
      jsonOut(['success' => true, 'texts' => $map]);
      break;

    case 'save-page-text':
      $db->prepare("INSERT INTO page_texts (`key`, value_en, value_ur) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value_en=VALUES(value_en), value_ur=VALUES(value_ur)")
        ->execute([$input['key'], $input['en'] ?? '', $input['ur'] ?? '']);
      jsonOut(['success' => true]);
      break;

    case 'get-stamp-types':
      $rows = $db->query("SELECT * FROM stamp_types ORDER BY sort_order ASC")->fetchAll(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'stampTypes' => $rows]);
      break;

    case 'save-stamp-types':
      $db->exec("DELETE FROM stamp_types WHERE id NOT IN ('dummy')");
      $stmt = $db->prepare("INSERT INTO stamp_types (id, name, description, min_value, max_value, category, gov_rate, source, sort_order) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), min_value=VALUES(min_value), max_value=VALUES(max_value), category=VALUES(category), gov_rate=VALUES(gov_rate), source=VALUES(source), sort_order=VALUES(sort_order)");
      foreach ($input['stampTypes'] as $i => $s) $stmt->execute([$s['id'], $s['name'], $s['description'] ?? '', $s['minValue'] ?? 0, $s['maxValue'] ?? 0, $s['category'] ?? '', $s['govRate'] ?? 0, $s['source'] ?? '', $i]);
      jsonOut(['success' => true]);
      break;

    case 'get-legal-docs':
      $rows = $db->query("SELECT * FROM legal_docs ORDER BY sort_order ASC")->fetchAll(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'docs' => $rows]);
      break;

    case 'save-legal-docs':
      $db->exec("DELETE FROM legal_docs WHERE id NOT IN ('dummy')");
      $stmt = $db->prepare("INSERT INTO legal_docs (id, title, description, category, fee, duration, icon, image, sort_order) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), category=VALUES(category), fee=VALUES(fee), duration=VALUES(duration), icon=VALUES(icon), image=VALUES(image), sort_order=VALUES(sort_order)");
      foreach ($input['docs'] as $i => $d) $stmt->execute([$d['id'], $d['title'], $d['description'] ?? '', $d['category'] ?? '', $d['fee'] ?? '', $d['duration'] ?? '', $d['icon'] ?? 'FileText', $d['image'] ?? '', $i]);
      jsonOut(['success' => true]);
      break;

    // ==================== ORDERS ====================
    case 'get-orders':
      $rows = $db->query("SELECT * FROM orders ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'orders' => $rows]);
      break;

    case 'add-order':
      $id = uuidv4();
      $stmt = $db->prepare("INSERT INTO orders (id, user_id, order_ref, order_type, order_date, order_amount, status, name, email, phone, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
      $stmt->execute([$id, $input['userId'] ?? null, $input['orderRef'], $input['orderType'], $input['orderDate'], $input['orderAmount'] ?? 0, $input['status'] ?? 'pending', $input['name'], $input['email'], $input['phone'] ?? '', $input['notes'] ?? '']);
      if (!empty($input['items']) && is_array($input['items'])) {
        $ins = $db->prepare("INSERT INTO order_items (order_id, item_name, item_value, sort_order) VALUES (?,?,?,?)");
        foreach ($input['items'] as $i => $item) $ins->execute([$id, $item['name'], $item['value'] ?? '', $i]);
      }
      jsonOut(['success' => true, 'orderId' => $id]);
      break;

    case 'update-order-status':
      $db->prepare("UPDATE orders SET status = ? WHERE id = ?")->execute([$input['status'], $input['id']]);
      jsonOut(['success' => true]);
      break;

    // ==================== CONTACT ====================
    case 'submit-contact':
      $stmt = $db->prepare("INSERT INTO contact_messages (name, email, phone, message) VALUES (?,?,?,?)");
      $stmt->execute([$input['name'], $input['email'], $input['phone'] ?? '', $input['message']]);
      jsonOut(['success' => true]);
      break;

    case 'get-contacts':
      $rows = $db->query("SELECT * FROM contact_messages ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'messages' => $rows]);
      break;

    // ==================== DC RATES ====================
    case 'get-dc-rates':
      $rows = $db->query("SELECT * FROM dc_rates ORDER BY zila ASC, tehsil ASC, mouza_area ASC")->fetchAll(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'rates' => $rows]);
      break;

    case 'get-dc-rate':
      $stmt = $db->prepare("SELECT * FROM dc_rates WHERE id = ? LIMIT 1");
      $stmt->execute([$input['id']]);
      $r = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!$r) jsonOut(['success' => false, 'error' => 'Not found'], 404);
      jsonOut(['success' => true, 'rate' => $r]);
      break;

    case 'get-dc-rate-lookup':
      $stmt = $db->prepare("SELECT * FROM dc_rates WHERE zila = ? AND tehsil = ? AND mouza_area = ? AND property_type = ? AND location_status = ? LIMIT 1");
      $stmt->execute([$input['zila'], $input['tehsil'], $input['mouzaArea'], $input['propertyType'], $input['locationStatus']]);
      $r = $stmt->fetch(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'rate' => $r ?: null]);
      break;

    case 'get-dc-districts':
      $rows = $db->query("SELECT DISTINCT zila FROM dc_rates ORDER BY zila ASC")->fetchAll(PDO::FETCH_COLUMN);
      jsonOut(['success' => true, 'districts' => $rows]);
      break;

    case 'get-dc-tehsils':
      $stmt = $db->prepare("SELECT DISTINCT tehsil FROM dc_rates WHERE zila = ? ORDER BY tehsil ASC");
      $stmt->execute([$input['zila']]);
      jsonOut(['success' => true, 'tehsils' => $stmt->fetchAll(PDO::FETCH_COLUMN)]);
      break;

    case 'get-dc-mouzas':
      $stmt = $db->prepare("SELECT DISTINCT mouza_area FROM dc_rates WHERE zila = ? AND tehsil = ? ORDER BY mouza_area ASC");
      $stmt->execute([$input['zila'], $input['tehsil']]);
      jsonOut(['success' => true, 'mouzas' => $stmt->fetchAll(PDO::FETCH_COLUMN)]);
      break;

    case 'get-dc-mouza-rates':
      $stmt = $db->prepare("SELECT mouza_area, dc_rate, unit FROM dc_rates WHERE zila = ? AND tehsil = ? GROUP BY mouza_area, dc_rate, unit ORDER BY mouza_area ASC");
      $stmt->execute([$input['zila'], $input['tehsil']]);
      jsonOut(['success' => true, 'mouzas' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
      break;

    case 'add-dc-rate':
      $stmt = $db->prepare("INSERT INTO dc_rates (city, zila, tehsil, mouza_area, property_type, location_status, dc_rate, unit, updated_by) VALUES (?,?,?,?,?,?,?,'Marla',?)");
      $stmt->execute([$input['city'] ?? '', $input['zila'], $input['tehsil'], $input['mouzaArea'], $input['propertyType'], $input['locationStatus'], $input['dcRate'], $input['updatedBy'] ?? null]);
      jsonOut(['success' => true, 'id' => $db->lastInsertId()]);
      break;

    case 'update-dc-rate':
      $stmt = $db->prepare("UPDATE dc_rates SET city=?, zila=?, tehsil=?, mouza_area=?, property_type=?, location_status=?, dc_rate=?, unit='Marla', updated_by=? WHERE id=?");
      $stmt->execute([$input['city'] ?? '', $input['zila'], $input['tehsil'], $input['mouzaArea'], $input['propertyType'], $input['locationStatus'], $input['dcRate'], $input['updatedBy'] ?? null, $input['id']]);
      jsonOut(['success' => true]);
      break;

    case 'delete-dc-rate':
      $db->prepare("DELETE FROM dc_rates WHERE id = ?")->execute([$input['id']]);
      jsonOut(['success' => true]);
      break;

    case 'bulk-import-dc-rates':
      $rows = $input['rows'] ?? [];
      $stmt = $db->prepare("INSERT INTO dc_rates (city, zila, tehsil, mouza_area, property_type, location_status, dc_rate, unit, updated_by) VALUES (?,?,?,?,?,?,?,'Marla',?)");
      $count = 0;
      foreach ($rows as $r) {
        try {
          $stmt->execute([$r['city'] ?? '', $r['zila'], $r['tehsil'], $r['mouzaArea'] ?? $r['mouza_area'] ?? '', $r['propertyType'] ?? $r['property_type'] ?? 'Residential', $r['locationStatus'] ?? $r['location_status'] ?? 'Urban', $r['dcRate'] ?? $r['dc_rate'] ?? 0, $input['updatedBy'] ?? null]);
          $count++;
        } catch (Exception $e) { continue; }
      }
      jsonOut(['success' => true, 'imported' => $count]);
      break;

    // ==================== IMAGE UPLOAD ====================
    case 'upload-image':
      $data = $input['data'] ?? '';
      if (strpos($data, 'data:') === 0) {
        $parts = explode(',', $data, 2);
        $bin = base64_decode($parts[1] ?? '');
      } else {
        $bin = base64_decode($data);
      }
      if (!$bin) jsonOut(['success' => false, 'error' => 'No image data']);
      $dir = __DIR__ . '/../uploads';
      if (!file_exists($dir)) @mkdir($dir, 0755, true);
      if (!is_writable($dir)) jsonOut(['success' => false, 'error' => 'Uploads dir not writable']);
      $ext = strtolower(pathinfo($input['name'] ?? 'image.png', PATHINFO_EXTENSION));
      if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) $ext = 'png';
      $file = 'img_' . time() . '_' . mt_rand(1000, 9999) . '.' . $ext;
      file_put_contents($dir . '/' . $file, $bin);
      jsonOut(['success' => true, 'url' => '/uploads/' . $file]);
      break;

    // ==================== DASHBOARD STATS ====================
    case 'get-stats':
      $users = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
      $props = $db->query("SELECT COUNT(*) FROM properties")->fetchColumn();
      $inquiries = $db->query("SELECT COUNT(*) FROM inquiries")->fetchColumn();
      $orders = $db->query("SELECT COUNT(*) FROM orders")->fetchColumn();
      $pending = $db->query("SELECT COUNT(*) FROM properties WHERE status = 'pending'")->fetchColumn();
      $approved = $db->query("SELECT COUNT(*) FROM properties WHERE status = 'approved'")->fetchColumn();
      jsonOut(['success' => true, 'stats' => ['users' => (int)$users, 'properties' => (int)$props, 'inquiries' => (int)$inquiries, 'orders' => (int)$orders, 'pending' => (int)$pending, 'approved' => (int)$approved]]);
      break;

    // ==================== EMAIL ====================
    case 'send-email':
      require_once __DIR__ . '/send-mail.php';
      $result = sendEmail(
        $input['to'],
        $input['subject'] ?? 'No Subject',
        'custom',
        ['message' => $input['message'] ?? '', 'subject' => $input['subject'] ?? '']
      );
      jsonOut($result);
      break;

    case 'get-email-logs':
      $db = getDB();
      if (!$db) { jsonOut(['success' => false, 'error' => 'DB not available']); break; }
      $stmt = $db->query("CREATE TABLE IF NOT EXISTS email_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient VARCHAR(255), subject VARCHAR(255),
        template VARCHAR(100), status VARCHAR(50),
        error TEXT, sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )");
      $stmt->execute();
      $rows = $db->query("SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100")->fetchAll(PDO::FETCH_ASSOC);
      jsonOut(['success' => true, 'logs' => $rows]);
      break;

    default:
      jsonOut(['success' => false, 'error' => 'Unknown action: ' . $action], 400);
  }

} catch (Exception $e) {
  jsonOut(['success' => false, 'error' => $e->getMessage()], 500);
}
