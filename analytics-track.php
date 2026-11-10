<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

function drukulator_analytics_response(bool $success, string $message, int $status = 200): void
{
    http_response_code($status);
    echo json_encode(
        array('success' => $success, 'message' => $message),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function drukulator_analytics_find_wp_load(string $startDirectory): ?string
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

function drukulator_analytics_default(): array
{
    return array(
        'version' => 1,
        'started_at' => gmdate('c'),
        'updated_at' => gmdate('c'),
        'totals' => array(
            'sessions' => 0,
            'page_views' => 0,
            'searches' => 0,
            'searches_no_results' => 0,
            'cart_adds' => 0,
            'orders' => 0,
            'order_value' => 0.0,
        ),
        'pages' => array(),
        'products' => array(),
        'search_terms' => array(),
        'search_terms_no_results' => array(),
        'daily' => array(),
    );
}

function drukulator_analytics_text($value, int $maxLength = 80): string
{
    $text = sanitize_text_field((string) $value);
    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $maxLength, 'UTF-8');
    }
    return substr($text, 0, $maxLength);
}

function drukulator_analytics_clean_search($value): string
{
    $text = drukulator_analytics_text($value, 60);
    $text = preg_replace('/\s+/u', ' ', trim($text)) ?? '';
    if ($text === '' || strpos($text, '@') !== false) {
        return '';
    }
    if (preg_match('/\+?\d[\d\s().-]{6,}\d/u', $text)) {
        return '';
    }
    return $text;
}

function drukulator_analytics_increment(array &$container, string $key, int $by = 1): void
{
    $container[$key] = (int) ($container[$key] ?? 0) + $by;
}

function drukulator_analytics_trim_counts(array $items, int $limit): array
{
    arsort($items, SORT_NUMERIC);
    return array_slice($items, 0, $limit, true);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    drukulator_analytics_response(false, 'Dozwolona jest wyłącznie metoda POST.', 405);
}

$wpLoad = drukulator_analytics_find_wp_load(__DIR__);
if ($wpLoad === null) {
    drukulator_analytics_response(false, 'Nie znaleziono środowiska WordPress.', 500);
}
require_once $wpLoad;

$siteHost = strtolower((string) parse_url(home_url('/'), PHP_URL_HOST));
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$referer = (string) ($_SERVER['HTTP_REFERER'] ?? '');
foreach (array($origin, $referer) as $sourceUrl) {
    if ($sourceUrl === '') {
        continue;
    }
    $sourceHost = strtolower((string) parse_url($sourceUrl, PHP_URL_HOST));
    if ($sourceHost !== '' && $siteHost !== '' && $sourceHost !== $siteHost) {
        drukulator_analytics_response(false, 'Niedozwolone źródło żądania.', 403);
    }
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 8192) {
    drukulator_analytics_response(false, 'Nieprawidłowe dane.', 400);
}
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    drukulator_analytics_response(false, 'Nieprawidłowy format danych.', 400);
}

$event = drukulator_analytics_text($payload['event'] ?? '', 40);
// 0.25.5: price_seen (cena po konfiguracji) i order_error (przyczyna nieudanej wysyłki) trafiają tylko do nowego modułu v2.
$allowedEvents = array('session_start', 'page_view', 'search', 'add_to_cart', 'quote_view', 'checkout_view', 'price_seen', 'order_error');
if (!in_array($event, $allowedEvents, true)) {
    drukulator_analytics_response(false, 'Nieobsługiwane zdarzenie.', 400);
}
$data = isset($payload['data']) && is_array($payload['data']) ? $payload['data'] : array();
$analyticsSession = (string) ($payload['session'] ?? '');

// Opportunistic checks on real storefront activity, max once per 5 minutes.
require_once __DIR__ . '/upload-staging-lib.php';
require_once __DIR__ . '/monitoring-lib.php';
d24_alert_tick();

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
if ($ip !== '') {
    $rateKey = 'drukulator_analytics_' . substr(hash_hmac('sha256', $ip, wp_salt('nonce')), 0, 24);
    $rateCount = (int) get_transient($rateKey);
    if ($rateCount >= 300) {
        drukulator_analytics_response(false, 'Limit zdarzeń został przekroczony.', 429);
    }
    set_transient($rateKey, $rateCount + 1, HOUR_IN_SECONDS);
}

require_once __DIR__ . '/analytics-v2-lib.php';
d24_analytics_browser_event($event, $data, $analyticsSession);
// Stage-only events do not belong in the older v1 counters.
if (in_array($event, array('quote_view', 'checkout_view', 'price_seen', 'order_error'), true)) {
    drukulator_analytics_response(true, 'OK');
}

$stats = get_option('drukulator_analytics_v1', array());
if (!is_array($stats) || !isset($stats['totals'])) {
    $stats = drukulator_analytics_default();
}
$defaults = drukulator_analytics_default();
$stats = array_replace_recursive($defaults, $stats);

$today = wp_date('Y-m-d');
if (!isset($stats['daily'][$today]) || !is_array($stats['daily'][$today])) {
    $stats['daily'][$today] = array(
        'sessions' => 0,
        'page_views' => 0,
        'searches' => 0,
        'searches_no_results' => 0,
        'cart_adds' => 0,
        'orders' => 0,
        'order_value' => 0.0,
    );
}
$daily =& $stats['daily'][$today];

switch ($event) {
    case 'session_start':
        drukulator_analytics_increment($stats['totals'], 'sessions');
        drukulator_analytics_increment($daily, 'sessions');
        break;

    case 'page_view':
        $page = drukulator_analytics_text($data['page'] ?? '', 80);
        if ($page === '') {
            drukulator_analytics_response(false, 'Brak nazwy strony.', 400);
        }
        drukulator_analytics_increment($stats['totals'], 'page_views');
        drukulator_analytics_increment($daily, 'page_views');
        drukulator_analytics_increment($stats['pages'], $page);
        $stats['pages'] = drukulator_analytics_trim_counts($stats['pages'], 80);
        break;

    case 'search':
        $query = drukulator_analytics_clean_search($data['query'] ?? '');
        $resultCount = max(0, min(100, (int) ($data['results'] ?? 0)));
        drukulator_analytics_increment($stats['totals'], 'searches');
        drukulator_analytics_increment($daily, 'searches');
        if ($resultCount === 0) {
            drukulator_analytics_increment($stats['totals'], 'searches_no_results');
            drukulator_analytics_increment($daily, 'searches_no_results');
            if ($query !== '') {
                drukulator_analytics_increment($stats['search_terms_no_results'], $query);
                $stats['search_terms_no_results'] = drukulator_analytics_trim_counts($stats['search_terms_no_results'], 100);
            }
        }
        if ($query !== '') {
            drukulator_analytics_increment($stats['search_terms'], $query);
            $stats['search_terms'] = drukulator_analytics_trim_counts($stats['search_terms'], 100);
        }
        break;

    case 'add_to_cart':
        $product = drukulator_analytics_text($data['product'] ?? '', 100);
        drukulator_analytics_increment($stats['totals'], 'cart_adds');
        drukulator_analytics_increment($daily, 'cart_adds');
        if ($product !== '') {
            drukulator_analytics_increment($stats['products'], $product);
            $stats['products'] = drukulator_analytics_trim_counts($stats['products'], 100);
        }
        break;

    case 'order_sent':
        $value = (float) ($data['value'] ?? 0);
        if (!is_finite($value) || $value < 0 || $value > 5000) {
            $value = 0.0;
        }
        drukulator_analytics_increment($stats['totals'], 'orders');
        $stats['totals']['order_value'] = round((float) ($stats['totals']['order_value'] ?? 0) + $value, 2);
        drukulator_analytics_increment($daily, 'orders');
        $daily['order_value'] = round((float) ($daily['order_value'] ?? 0) + $value, 2);
        break;
}

$cutoff = wp_date('Y-m-d', time() - (90 * DAY_IN_SECONDS));
foreach (array_keys($stats['daily']) as $date) {
    if ($date < $cutoff) {
        unset($stats['daily'][$date]);
    }
}
ksort($stats['daily']);
$stats['updated_at'] = gmdate('c');

update_option('drukulator_analytics_v1', $stats, false);
drukulator_analytics_response(true, 'OK');
