<?php

declare(strict_types=1);

header('Cache-Control: private, no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Referrer-Policy: no-referrer');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    http_response_code(405);
    exit;
}

require_once __DIR__ . '/upload-staging-lib.php';

try {
    $info = drukulator_stage_download_info((string) ($_GET['s'] ?? ''), (string) ($_GET['t'] ?? ''));
} catch (Throwable $error) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Plik nie istnieje lub link wygasł.';
    exit;
}

$stream = @fopen($info['path'], 'rb');
if ($stream === false) {
    http_response_code(404);
    exit;
}
$name = (string) $info['name'];
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="download"; filename*=UTF-8\'\'' . rawurlencode($name));
header('Content-Length: ' . (string) $info['size']);
header('Content-Security-Policy: sandbox');
while (!feof($stream) && !connection_aborted()) {
    echo fread($stream, 1048576);
    flush();
}
fclose($stream);
