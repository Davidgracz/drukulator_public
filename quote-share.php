<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

const D24_SHARED_QUOTES_DB_VERSION = '1.0';
const D24_SHARED_QUOTES_RETENTION_DAYS = 7;
const D24_SHARED_QUOTES_MAX_ITEMS = 30;
const D24_SHARED_QUOTES_MAX_TOTAL = 5000.0;

function d24_quote_response(bool $success, array $data = array(), int $status = 200): void
{
    http_response_code($status);
    echo wp_json_encode(
        array_merge(array('success' => $success), $data),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function d24_quote_find_wp_load(string $startDirectory): ?string
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

$wpLoad = d24_quote_find_wp_load(__DIR__);
if ($wpLoad === null) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Nie znaleziono środowiska WordPress.'), JSON_UNESCAPED_UNICODE);
    exit;
}
require_once $wpLoad;

function d24_quote_table_name(): string
{
    global $wpdb;
    return $wpdb->prefix . 'drukulator_saved_quotes';
}

function d24_quote_install(): bool
{
    if ((string) get_option('d24_shared_quotes_db_version', '') === D24_SHARED_QUOTES_DB_VERSION) {
        return true;
    }

    global $wpdb;
    $table = d24_quote_table_name();
    $charsetCollate = $wpdb->get_charset_collate();
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    $sql = "CREATE TABLE {$table} (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        token varchar(20) NOT NULL,
        quote_json longtext NOT NULL,
        total decimal(12,2) NOT NULL DEFAULT 0,
        created_at datetime NOT NULL,
        expires_at datetime NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY token (token),
        KEY expires_at (expires_at)
    ) {$charsetCollate};";

    dbDelta($sql);
    $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
    if ($exists !== $table) {
        return false;
    }

    update_option('d24_shared_quotes_db_version', D24_SHARED_QUOTES_DB_VERSION, false);
    return true;
}

function d24_quote_same_origin(): bool
{
    $siteHost = strtolower((string) parse_url(home_url('/'), PHP_URL_HOST));
    foreach (array('HTTP_ORIGIN', 'HTTP_REFERER') as $header) {
        $sourceUrl = (string) ($_SERVER[$header] ?? '');
        if ($sourceUrl === '') {
            continue;
        }
        $sourceHost = strtolower((string) parse_url($sourceUrl, PHP_URL_HOST));
        if ($sourceHost !== '' && $siteHost !== '' && $sourceHost !== $siteHost) {
            return false;
        }
    }
    return true;
}

function d24_quote_rate_limit(): bool
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    if ($ip === '') {
        return true;
    }

    $key = 'd24_quote_share_' . substr(hash_hmac('sha256', $ip, wp_salt('nonce')), 0, 24);
    $count = (int) get_transient($key);
    if ($count >= 30) {
        return false;
    }
    set_transient($key, $count + 1, HOUR_IN_SECONDS);
    return true;
}

function d24_quote_clean_text($value, int $maxLength): string
{
    $text = sanitize_text_field((string) $value);
    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $maxLength, 'UTF-8');
    }
    return substr($text, 0, $maxLength);
}

function d24_quote_clean_meta($value, int $depth = 0)
{
    if ($depth > 3) {
        return null;
    }
    if (is_bool($value) || is_int($value) || is_float($value)) {
        return $value;
    }
    if (is_numeric($value)) {
        return (float) $value;
    }
    if (is_string($value)) {
        return d24_quote_clean_text($value, 240);
    }
    if (!is_array($value)) {
        return null;
    }

    $clean = array();
    $count = 0;
    foreach ($value as $key => $item) {
        if ($count >= 40) {
            break;
        }
        $safeKey = is_int($key) ? $key : sanitize_key((string) $key);
        $safeValue = d24_quote_clean_meta($item, $depth + 1);
        if ($safeValue === null) {
            continue;
        }
        $clean[$safeKey] = $safeValue;
        $count++;
    }
    return $clean;
}

function d24_quote_clean_item($item): ?array
{
    if (!is_array($item)) {
        return null;
    }

    $price = isset($item['price']) && is_numeric($item['price']) ? round((float) $item['price'], 2) : -1;
    if ($price < 0 || $price > D24_SHARED_QUOTES_MAX_TOTAL) {
        return null;
    }

    $details = array();
    if (isset($item['details']) && is_array($item['details'])) {
        foreach (array_slice($item['details'], 0, 20) as $row) {
            if (!is_array($row) || count($row) < 2) {
                continue;
            }
            $details[] = array(
                d24_quote_clean_text($row[0], 80),
                d24_quote_clean_text($row[1], 240),
            );
        }
    }

    $clean = array(
        'title' => d24_quote_clean_text($item['title'] ?? 'Pozycja', 140),
        'description' => d24_quote_clean_text($item['description'] ?? '', 700),
        'price' => $price,
        'details' => $details,
    );

    if (isset($item['meta']) && is_array($item['meta'])) {
        $clean['meta'] = d24_quote_clean_meta($item['meta']);
    }
    return $clean;
}

function d24_quote_generate_token(): string
{
    $alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    $token = '';
    for ($i = 0; $i < 12; $i++) {
        $token .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $token;
}

function d24_quote_cleanup(): void
{
    global $wpdb;
    $wpdb->query(
        $wpdb->prepare(
            'DELETE FROM ' . d24_quote_table_name() . ' WHERE expires_at < %s',
            current_time('mysql')
        )
    );
}

if (!d24_quote_install()) {
    d24_quote_response(false, array('message' => 'Nie udało się przygotować magazynu zapisanych wycen.'), 500);
}

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'GET') {
    $token = strtoupper(sanitize_text_field((string) ($_GET['q'] ?? '')));
    if (!preg_match('/^[A-Z0-9]{8,20}$/', $token)) {
        d24_quote_response(false, array('message' => 'Nieprawidłowy identyfikator wyceny.'), 400);
    }

    global $wpdb;
    $table = d24_quote_table_name();
    $row = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT quote_json, total, expires_at FROM {$table} WHERE token = %s AND expires_at >= %s LIMIT 1",
            $token,
            current_time('mysql')
        ),
        ARRAY_A
    );

    if (!is_array($row)) {
        d24_quote_response(false, array('message' => 'Ta wycena nie istnieje albo link już wygasł.'), 404);
    }

    $cart = json_decode((string) $row['quote_json'], true);
    if (!is_array($cart)) {
        d24_quote_response(false, array('message' => 'Nie udało się odczytać zapisanej wyceny.'), 500);
    }

    d24_quote_response(true, array(
        'cart' => $cart,
        'total' => (float) $row['total'],
        'expiresAt' => (string) $row['expires_at'],
    ));
}

if ($method !== 'POST') {
    d24_quote_response(false, array('message' => 'Nieobsługiwana metoda.'), 405);
}

if (!d24_quote_same_origin()) {
    d24_quote_response(false, array('message' => 'Niedozwolone źródło żądania.'), 403);
}
if (!d24_quote_rate_limit()) {
    d24_quote_response(false, array('message' => 'Utworzono zbyt wiele linków. Spróbuj ponownie później.'), 429);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 131072) {
    d24_quote_response(false, array('message' => 'Wycena jest zbyt duża.'), 413);
}
$payload = json_decode($raw, true);
if (!is_array($payload) || !isset($payload['cart']) || !is_array($payload['cart'])) {
    d24_quote_response(false, array('message' => 'Nieprawidłowe dane wyceny.'), 400);
}

$items = array();
$total = 0.0;
foreach (array_slice($payload['cart'], 0, D24_SHARED_QUOTES_MAX_ITEMS) as $item) {
    $clean = d24_quote_clean_item($item);
    if ($clean === null) {
        continue;
    }
    $items[] = $clean;
    $total += (float) $clean['price'];
}
$total = round($total, 2);

if (count($items) === 0) {
    d24_quote_response(false, array('message' => 'Wycena jest pusta.'), 400);
}
if ($total > D24_SHARED_QUOTES_MAX_TOTAL) {
    d24_quote_response(false, array('message' => 'Wartość wyceny przekracza limit kalkulatora.'), 422);
}

$now = new DateTimeImmutable('now', wp_timezone());
$expires = $now->modify('+' . D24_SHARED_QUOTES_RETENTION_DAYS . ' days');
$table = d24_quote_table_name();
$inserted = false;
$token = '';

global $wpdb;
for ($attempt = 0; $attempt < 5; $attempt++) {
    $token = d24_quote_generate_token();
    $inserted = $wpdb->insert(
        $table,
        array(
            'token' => $token,
            'quote_json' => wp_json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'total' => $total,
            'created_at' => $now->format('Y-m-d H:i:s'),
            'expires_at' => $expires->format('Y-m-d H:i:s'),
        ),
        array('%s', '%s', '%f', '%s', '%s')
    ) !== false;
    if ($inserted) {
        break;
    }
}

if (!$inserted) {
    d24_quote_response(false, array('message' => 'Nie udało się zapisać wyceny. Spróbuj ponownie.'), 500);
}

if (random_int(1, 20) === 1) {
    d24_quote_cleanup();
}

$url = add_query_arg('q', rawurlencode($token), home_url('/drukulator/'));
d24_quote_response(true, array(
    'token' => $token,
    'url' => $url,
    'total' => $total,
    'expiresAt' => $expires->format(DateTimeInterface::ATOM),
    'expiresLabel' => wp_date('d.m.Y', $expires->getTimestamp()),
));
