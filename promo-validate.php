<?php

declare(strict_types=1);

/**
 * Sprawdzenie kodu promocyjnego z koszyka (0.26.0v). Tylko podgląd zniżki — kod jest ponownie sprawdzany i „zużywany”
 * dopiero przy wysyłce zamówienia (send-order.php).
 * POST JSON: { "code": "LATO10", "productsTotal": 123.45 }
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

function d24_promo_validate_response(bool $success, string $message, int $status = 200, array $extra = array()): void
{
    http_response_code($status);
    echo json_encode(array_merge(array('success' => $success, 'message' => $message), $extra), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    d24_promo_validate_response(false, 'Dozwolona jest wyłącznie metoda POST.', 405);
}

$wp_load = dirname(__DIR__) . '/wp-load.php';
if (!is_file($wp_load)) {
    d24_promo_validate_response(false, 'Nie znaleziono środowiska WordPress.', 500);
}
require_once $wp_load;
require_once __DIR__ . '/promo-lib.php';

$site_host = strtolower((string) wp_parse_url(home_url('/'), PHP_URL_HOST));
$origin = isset($_SERVER['HTTP_ORIGIN']) ? strtolower((string) wp_parse_url((string) $_SERVER['HTTP_ORIGIN'], PHP_URL_HOST)) : '';
$referer = isset($_SERVER['HTTP_REFERER']) ? strtolower((string) wp_parse_url((string) $_SERVER['HTTP_REFERER'], PHP_URL_HOST)) : '';
if (($origin !== '' && $origin !== $site_host) || ($referer !== '' && $referer !== $site_host)) {
    d24_promo_validate_response(false, 'Żądanie pochodzi z niedozwolonej strony.', 403);
}

$data = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($data) || !isset($data['code']) || !is_string($data['code'])) {
    d24_promo_validate_response(false, 'Nieprawidłowy format danych.', 400);
}

$ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field((string) $_SERVER['REMOTE_ADDR']) : 'unknown';
$ip_hash = md5($ip . wp_salt('nonce'));
if (!d24_promo_rate_check($ip_hash)) {
    d24_promo_validate_response(false, 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.', 429);
}

$products_total = isset($data['productsTotal']) && is_numeric($data['productsTotal']) ? max(0.0, (float) $data['productsTotal']) : 0.0;
$result = d24_promo_evaluate($data['code'], $products_total);
if (!$result['ok']) {
    d24_promo_rate_penalty($ip_hash);
    d24_promo_validate_response(true, (string) $result['message'], 200, array('valid' => false, 'reason' => (string) $result['reason']));
}

$promo = $result['promo'];
d24_promo_validate_response(true, (string) $result['message'], 200, array(
    'valid' => true,
    'code' => $promo['code'],
    'label' => $promo['label'],
    'type' => $promo['discount_type'],
    'value' => $promo['discount_value'],
    'minTotal' => $promo['min_total'],
    'validTo' => $promo['valid_to'],
    'discount' => $result['discount'],
));
