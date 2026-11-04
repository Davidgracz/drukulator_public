<?php
/** Read-only endpoint for an independent HTTP uptime monitor. No secrets, tokens or detailed errors. */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(array('status' => 'method_not_allowed'));
    exit;
}
$healthy = false;
try {
    $wp_load = dirname(__DIR__) . '/wp-load.php';
    if (is_file($wp_load)) {
        require_once $wp_load;
        require_once __DIR__ . '/upload-staging-lib.php';
        global $wpdb;
        $db_ok = isset($wpdb) && (int) $wpdb->get_var('SELECT 1') === 1;
        $uploads_ok = is_writable(drukulator_stage_root());
        $healthy = $db_ok && $uploads_ok;
    }
} catch (Throwable $ignored) { $healthy = false; }
http_response_code($healthy ? 200 : 503);
echo json_encode(array('status' => $healthy ? 'ok' : 'degraded', 'version' => '0.22.9v', 'checked_at' => gmdate('c')), JSON_UNESCAPED_SLASHES);
