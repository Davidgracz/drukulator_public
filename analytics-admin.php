<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

function drukulator_stats_response(bool $success, string $message, int $status = 200, array $extra = array()): void
{
    http_response_code($status);
    echo json_encode(
        array_merge(array('success' => $success, 'message' => $message), $extra),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function drukulator_stats_find_wp_load(string $startDirectory): ?string
{
    $directory = $startDirectory;
    for ($level = 0; $level < 6; $level++) {
        $candidate = $directory . DIRECTORY_SEPARATOR . 'wp-load.php';
        if (is_file($candidate)) {
            return $candidate;
        }
        $parent = dirname($directory);
        if ($parent === $directory) {
            break;
        }
        $directory = $parent;
    }
    return null;
}

$wpLoad = drukulator_stats_find_wp_load(__DIR__);
if ($wpLoad === null) {
    drukulator_stats_response(false, 'Nie znaleziono środowiska WordPress.', 500);
}
require_once $wpLoad;

$loginUrl = wp_login_url(home_url('/drukulator/'));
if (!is_user_logged_in() || !current_user_can('manage_options')) {
    drukulator_stats_response(
        false,
        'Zaloguj się do WordPressa jako administrator, aby zobaczyć statystyki.',
        403,
        array('login_url' => $loginUrl)
    );
}

$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw ?: '', true);
    if (!is_array($payload)) {
        drukulator_stats_response(false, 'Nieprawidłowe dane.', 400);
    }
    $nonce = sanitize_text_field((string) ($payload['nonce'] ?? ''));
    if (!wp_verify_nonce($nonce, 'drukulator_analytics_admin')) {
        drukulator_stats_response(false, 'Sesja wygasła. Odśwież panel.', 403);
    }
    $action = sanitize_key((string) ($payload['action'] ?? ''));
    if ($action !== 'reset') {
        drukulator_stats_response(false, 'Nieobsługiwana operacja.', 400);
    }
    delete_option('drukulator_analytics_v1');
    require_once __DIR__ . '/analytics-v2-lib.php';
    if (d24_analytics_install()) {
        global $wpdb;
        $wpdb->query('DELETE FROM ' . d24_analytics_session_table());
        $wpdb->query('DELETE FROM ' . d24_analytics_counts_table());
        $wpdb->query('DELETE FROM ' . d24_analytics_sales_table());
    }
    drukulator_stats_response(true, 'Statystyki zostały wyzerowane.');
}

if ($method !== 'GET') {
    drukulator_stats_response(false, 'Dozwolone są metody GET i POST.', 405);
}

$stats = get_option('drukulator_analytics_v1', array());
if (!is_array($stats)) {
    $stats = array();
}

$currentUser = wp_get_current_user();
drukulator_stats_response(
    true,
    'Statystyki wczytane.',
    200,
    array(
        'stats' => $stats,
        'nonce' => wp_create_nonce('drukulator_analytics_admin'),
        'user' => sanitize_text_field((string) $currentUser->display_name),
    )
);
