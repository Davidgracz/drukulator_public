<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

function d24_gate_response(bool $success, string $message, int $status = 200, array $extra = array()): void
{
    http_response_code($status);
    echo json_encode(array_merge(array('success' => $success, 'message' => $message), $extra), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$wpLoad = dirname(__DIR__) . '/wp-load.php';
if (!is_file($wpLoad)) {
    d24_gate_response(false, 'Nie znaleziono WordPressa.', 500);
}
require_once $wpLoad;
require_once __DIR__ . '/staff-auth-lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    d24_gate_response(false, 'Dozwolona jest wyłącznie metoda POST.', 405);
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    d24_gate_response(false, 'Nieprawidłowe dane.', 400);
}

$phrase = (string) ($payload['phrase'] ?? '');
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateKey = 'd24_staff_gate_rate_' . hash_hmac('sha256', $ip, wp_salt('auth'));
$attempts = (int) get_transient($rateKey);
if ($attempts >= 100) {
    d24_gate_response(false, 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.', 429);
}

if (!d24_staff_verify_gate_phrase($phrase)) {
    set_transient($rateKey, $attempts + 1, 10 * MINUTE_IN_SECONDS);
    d24_gate_response(false, 'Fraza nie otwiera panelu.', 403);
}

delete_transient($rateKey);
d24_staff_open_gate();
d24_gate_response(true, 'Panel pracowniczy odblokowany.', 200, array('url' => home_url('/drukulator/staff-login.php')));
