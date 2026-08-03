<?php
/**
 * ============================================================
 * GET /api/admin/dashboard
 * ============================================================
 * Get dashboard statistics for the admin panel.
 * 
 * Requires admin authentication.
 * 
 * Response:
 *   200: { success, data: { stats, recent_activity, charts } }
 * ============================================================
 */

declare(strict_types=1);

// Require admin authentication
$admin = Auth::requireAdmin();

// Rate limiting
Auth::rateLimit('admin_dashboard');

// Only allow GET
if ($GLOBALS['route']['method'] !== 'GET') {
    Response::error('Method not allowed. Use GET.', 405);
}

// ============================================================
// Aggregate statistics
// ============================================================

// User statistics
$userStats = Database::fetchOne(
    "SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_users,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_users,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS new_users_30d,
        SUM(CASE WHEN role = 'agent' THEN 1 ELSE 0 END) AS total_agents,
        SUM(CASE WHEN role = 'lawyer' THEN 1 ELSE 0 END) AS total_lawyer_accounts
     FROM users
     WHERE status != 'deleted'"
);

// Property statistics
$propertyStats = Database::fetchOne(
    "SELECT
        COUNT(*) AS total_properties,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_properties,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_properties,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_properties,
        SUM(CASE WHEN listing_type = 'sale' THEN 1 ELSE 0 END) AS for_sale,
        SUM(CASE WHEN listing_type = 'rent' THEN 1 ELSE 0 END) AS for_rent,
        SUM(view_count) AS total_views
     FROM properties"
);

// E-Stamp statistics
$estampStats = Database::fetchOne(
    "SELECT
        COUNT(*) AS total_applications,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS submitted,
        SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) AS under_review,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(property_value) AS total_property_value
     FROM estamp_applications"
);

// Service statistics
$serviceStats = Database::fetchOne(
    "SELECT
        COUNT(*) AS total_services,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_services
     FROM services"
);

$serviceRequestStats = Database::fetchOne(
    "SELECT
        COUNT(*) AS total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM service_requests"
);

// Lawyer statistics
$lawyerStats = Database::fetchOne(
    "SELECT
        COUNT(*) AS total_lawyers,
        SUM(CASE WHEN is_verified = 1 AND status = 'active' THEN 1 ELSE 0 END) AS verified_lawyers,
        SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) AS available_lawyers
     FROM lawyers"
);

$lawyerBookingStats = Database::fetchOne(
    "SELECT
        COUNT(*) AS total_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM lawyer_bookings"
);

// Revenue estimate (from completed estamp + services + lawyer bookings)
$revenueEstimate = Database::fetchOne(
    "SELECT
        COALESCE(SUM(estamp_revenue), 0) AS estamp_revenue,
        COALESCE(SUM(service_revenue), 0) AS service_revenue,
        COALESCE(SUM(lawyer_revenue), 0) AS lawyer_revenue
     FROM (
        SELECT
            (SELECT COALESCE(SUM(stamp_duty_amount), 0) FROM estamp_applications WHERE status = 'completed') AS estamp_revenue,
            (SELECT COALESCE(SUM(price_at_booking), 0) FROM service_requests WHERE status = 'completed') AS service_revenue,
            (SELECT COALESCE(SUM(fee), 0) FROM lawyer_bookings WHERE status = 'completed') AS lawyer_revenue
     ) AS revenue"
);

// ============================================================
// Recent activity
// ============================================================

$recentProperties = Database::fetchAll(
    "SELECT p.id, p.title, p.status, p.created_at, u.name AS agent_name
     FROM properties p
     LEFT JOIN users u ON p.user_id = u.id
     ORDER BY p.created_at DESC
     LIMIT 5"
);

$recentEstamp = Database::fetchAll(
    "SELECT ea.id, ea.reference_number, ea.applicant_name, ea.status, ea.created_at
     FROM estamp_applications ea
     ORDER BY ea.created_at DESC
     LIMIT 5"
);

$recentUsers = Database::fetchAll(
    "SELECT id, name, email, role, status, created_at
     FROM users
     WHERE status != 'deleted'
     ORDER BY created_at DESC
     LIMIT 5"
);

// ============================================================
// Chart data - last 7 days activity
// ============================================================

$chartData = Database::fetchAll(
    "SELECT
        DATE(d.date) AS date,
        COALESCE(u.user_count, 0) AS new_users,
        COALESCE(p.property_count, 0) AS new_properties,
        COALESCE(e.estamp_count, 0) AS new_estamp,
        COALESCE(s.service_count, 0) AS new_services
     FROM (
        SELECT CURDATE() - INTERVAL n DAY AS date
        FROM (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
              UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) AS days
     ) AS d
     LEFT JOIN (
        SELECT DATE(created_at) AS date, COUNT(*) AS user_count
        FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
     ) AS u ON d.date = u.date
     LEFT JOIN (
        SELECT DATE(created_at) AS date, COUNT(*) AS property_count
        FROM properties WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
     ) AS p ON d.date = p.date
     LEFT JOIN (
        SELECT DATE(created_at) AS date, COUNT(*) AS estamp_count
        FROM estamp_applications WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
     ) AS e ON d.date = e.date
     LEFT JOIN (
        SELECT DATE(created_at) AS date, COUNT(*) AS service_count
        FROM service_requests WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
     ) AS s ON d.date = s.date
     ORDER BY d.date ASC"
);

// Log dashboard access
Auth::logAdminAction((int) $admin['id'], 'Viewed dashboard', 'dashboard');

Response::success([
    'stats' => [
        'users'       => $userStats,
        'properties'  => $propertyStats,
        'estamp'      => $estampStats,
        'services'    => array_merge($serviceStats, $serviceRequestStats),
        'lawyers'     => array_merge($lawyerStats, $lawyerBookingStats),
        'revenue'     => $revenueEstimate,
    ],
    'recent_activity' => [
        'properties' => $recentProperties,
        'estamp'     => $recentEstamp,
        'users'      => $recentUsers,
    ],
    'charts' => [
        'last_7_days' => $chartData,
    ],
], 'Dashboard data retrieved successfully');
