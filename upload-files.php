<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

function drukulator_upload_reply(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    drukulator_upload_reply(405, array('success' => false, 'message' => 'Wymagana metoda POST.'));
}

require_once __DIR__ . '/upload-staging-lib.php';

// Fragmenty i anulowanie nie potrzebują ładować całego WordPressa.
// Weryfikujemy nagłówki pochodzenia względem hosta żądania.
$requested_host = strtolower((string) parse_url('http://' . (string) ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST));
$origin_host = isset($_SERVER['HTTP_ORIGIN']) ? strtolower((string) parse_url((string) $_SERVER['HTTP_ORIGIN'], PHP_URL_HOST)) : '';
$referer_host = isset($_SERVER['HTTP_REFERER']) ? strtolower((string) parse_url((string) $_SERVER['HTTP_REFERER'], PHP_URL_HOST)) : '';
if ($requested_host === '' || ($origin_host !== '' && $origin_host !== $requested_host) || ($referer_host !== '' && $referer_host !== $requested_host)) {
    drukulator_upload_reply(403, array('success' => false, 'message' => 'Żądanie pochodzi z innej strony.'));
}

// Tylko rozpoczęcie nowej sesji wymaga funkcji WordPressa.
if (empty($_POST['action'])) {
    $wp_load = dirname(__DIR__) . '/wp-load.php';
    if (!is_file($wp_load)) {
        drukulator_upload_reply(500, array('success' => false, 'message' => 'Brak środowiska WordPress.'));
    }
    require_once $wp_load;
    require_once __DIR__ . '/monitoring-lib.php';
    $site_host = strtolower((string) wp_parse_url(home_url('/'), PHP_URL_HOST));
    if ($site_host === '' || $site_host !== $requested_host) {
        drukulator_upload_reply(403, array('success' => false, 'message' => 'Niedozwolony adres witryny.'));
    }
}

/**
 * Zamienia wartość z php.ini (np. "50M", "512K", "1G") na bajty; 0 = brak limitu / nieznany.
 */
function drukulator_ini_bytes(string $name): int
{
    $value = trim((string) ini_get($name));
    if ($value === '' || (float) $value <= 0) {
        return 0;
    }
    $number = (float) $value;
    switch (strtolower(substr($value, -1))) {
        case 'g':
            $number *= 1024;
            // no break
        case 'm':
            $number *= 1024;
            // no break
        case 'k':
            $number *= 1024;
    }
    return (int) $number;
}

/**
 * Największy fragment, który serwer realnie przyjmie: nie większy niż limit biblioteki
 * ani niż upload_max_filesize / post_max_size (z zapasem na nagłówki multipart).
 */
function drukulator_upload_chunk_size(): int
{
    $limit = DRUKULATOR_STAGE_MAX_CHUNK;
    foreach (array('upload_max_filesize', 'post_max_size') as $name) {
        $bytes = drukulator_ini_bytes($name);
        if ($bytes > 0) {
            $limit = min($limit, $bytes - 65536);
        }
    }
    $limit = max(262144, $limit);
    return (int) (floor($limit / 65536) * 65536);
}

try {
    if (isset($_POST['action']) && $_POST['action'] === 'cancel') {
        $token = (string) ($_POST['token'] ?? '');
        $path = drukulator_stage_session_path($token);
        if (is_dir($path)) {
            $manifest = drukulator_stage_read($path);
            if (!empty($manifest['delivered'])) {
                drukulator_upload_reply(409, array('success' => false, 'message' => 'Pliki zostały już przekazane do drukarni.'));
            }
        }
        drukulator_stage_remove($path);
        drukulator_upload_reply(200, array('success' => true));
    }
    if (isset($_POST['action']) && $_POST['action'] === 'chunk') {
        $token = (string) ($_POST['token'] ?? '');
        $index = filter_var($_POST['index'] ?? null, FILTER_VALIDATE_INT);
        $offset = filter_var($_POST['offset'] ?? null, FILTER_VALIDATE_INT);
        if ($index === false || $offset === false || $index < 0 || $offset < 0 || !isset($_FILES['chunk'])) {
            drukulator_upload_reply(400, array('success' => false, 'message' => 'Brak danych fragmentu pliku.'));
        }
        $progress = drukulator_stage_append($token, $index, $offset, $_FILES['chunk']);
        drukulator_upload_reply(200, array_merge(array('success' => true), $progress));
    }

    $input = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($input) || ($input['action'] ?? '') !== 'start' || !isset($input['files']) || !is_array($input['files'])) {
        drukulator_upload_reply(400, array('success' => false, 'message' => 'Nieprawidłowe dane przesyłania plików.'));
    }
    $token = drukulator_stage_start($input['files'], (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $size_total = 0;
    foreach ($input['files'] as $item) $size_total += max(0, (int) ($item['size'] ?? 0));
    d24_monitor_log('upload_started', 'info', 'Rozpoczęto wysyłkę plików', '', array('files' => count($input['files']), 'bytes' => $size_total));
    drukulator_upload_reply(200, array(
        'success' => true,
        'token' => $token,
        'chunkSize' => drukulator_upload_chunk_size(),
        'maxInputTime' => max(0, (int) ini_get('max_input_time')),
    ));
} catch (Throwable $error) {
    $mode = isset($_POST['action']) ? (string) $_POST['action'] : 'start';
    drukulator_stage_monitor_failure($mode, $error->getMessage());
    error_log('[Drukulator uploads] ' . $error->getMessage());
    drukulator_upload_reply(422, array('success' => false, 'message' => $error->getMessage()));
}
