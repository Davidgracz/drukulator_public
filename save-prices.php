<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

const DRUKULATOR_MAX_PRICE_FILE_BYTES = 2000000;
const DRUKULATOR_MAX_PRICE_VALUE = 100000000.0;
const DRUKULATOR_BACKUP_LIMIT = 30;

function drukulator_save_response(bool $success, string $message, int $status = 200, array $extra = array()): void
{
    http_response_code($status);
    echo json_encode(
        array_merge(
            array(
                'success' => $success,
                'message' => $message,
            ),
            $extra
        ),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function drukulator_find_wp_load(string $startDirectory): ?string
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

function drukulator_request_host(string $value): string
{
    $host = wp_parse_url($value, PHP_URL_HOST);
    return is_string($host) ? strtolower($host) : '';
}

function drukulator_is_list_array(array $value): bool
{
    if ($value === array()) {
        return true;
    }
    return array_keys($value) === range(0, count($value) - 1);
}

function drukulator_validate_price_tree($incoming, $current, string $path = 'prices'): ?string
{
    if (is_array($current)) {
        if (!is_array($incoming)) {
            return 'Nieprawidłowy typ danych w: ' . $path . '.';
        }

        $currentIsList = drukulator_is_list_array($current);
        if ($currentIsList !== drukulator_is_list_array($incoming)) {
            return 'Struktura cennika została zmieniona w: ' . $path . '.';
        }

        $currentKeys = array_keys($current);
        $incomingKeys = array_keys($incoming);
        if (!$currentIsList) {
            sort($currentKeys);
            sort($incomingKeys);
        }
        if ($currentKeys !== $incomingKeys) {
            return 'Struktura cennika została zmieniona w: ' . $path . '.';
        }

        foreach ($current as $key => $currentValue) {
            $childPath = $path . '.' . (string) $key;
            $error = drukulator_validate_price_tree($incoming[$key], $currentValue, $childPath);
            if ($error !== null) {
                return $error;
            }
        }
        return null;
    }

    if (is_int($current) || is_float($current)) {
        if (!is_int($incoming) && !is_float($incoming)) {
            return 'Wartość w ' . $path . ' musi być liczbą.';
        }
        $number = (float) $incoming;
        if (!is_finite($number) || $number < 0 || $number > DRUKULATOR_MAX_PRICE_VALUE) {
            return 'Nieprawidłowa wartość liczbowa w: ' . $path . '.';
        }
        return null;
    }

    if (is_bool($current)) {
        if (!is_bool($incoming)) {
            return 'Wartość w ' . $path . ' musi być przełącznikiem tak/nie.';
        }
        $editableBooleanSuffix = '.doliczaj_ciecie_reczne';
        $isEditableBoolean = substr($path, -strlen($editableBooleanSuffix)) === $editableBooleanSuffix;
        if (!$isEditableBoolean && $incoming !== $current) {
            return 'Niedozwolona zmiana ustawienia w: ' . $path . '.';
        }
        return null;
    }

    if (gettype($incoming) !== gettype($current)) {
        return 'Nieprawidłowy typ danych w: ' . $path . '.';
    }

    if ($incoming !== $current) {
        return 'W edytorze można zmieniać wyłącznie ceny i dostępne ustawienia. Niedozwolona zmiana w: ' . $path . '.';
    }

    return null;
}

function drukulator_cleanup_backups(string $backupDirectory): void
{
    $files = glob($backupDirectory . DIRECTORY_SEPARATOR . 'prices-*.json');
    if (!is_array($files) || count($files) <= DRUKULATOR_BACKUP_LIMIT) {
        return;
    }

    usort($files, static function (string $a, string $b): int {
        return (int) filemtime($b) <=> (int) filemtime($a);
    });

    foreach (array_slice($files, DRUKULATOR_BACKUP_LIMIT) as $file) {
        if (is_file($file)) {
            @unlink($file);
        }
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    drukulator_save_response(false, 'Dozwolona jest wyłącznie metoda POST.', 405);
}

$wpLoad = drukulator_find_wp_load(__DIR__);
if ($wpLoad === null) {
    drukulator_save_response(false, 'Nie znaleziono środowiska WordPress.', 500);
}

require_once $wpLoad;

if (!is_user_logged_in() || !current_user_can('manage_options')) {
    drukulator_save_response(false, 'Brak uprawnień administratora WordPressa.', 403);
}

$siteHost = drukulator_request_host(home_url('/'));
$originHost = isset($_SERVER['HTTP_ORIGIN']) ? drukulator_request_host((string) $_SERVER['HTTP_ORIGIN']) : '';
$refererHost = isset($_SERVER['HTTP_REFERER']) ? drukulator_request_host((string) $_SERVER['HTTP_REFERER']) : '';

if (($originHost !== '' && $originHost !== $siteHost) || ($refererHost !== '' && $refererHost !== $siteHost)) {
    drukulator_save_response(false, 'Żądanie pochodzi z niedozwolonej strony.', 403);
}

$contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
if ($contentLength > DRUKULATOR_MAX_PRICE_FILE_BYTES) {
    drukulator_save_response(false, 'Przesłany cennik jest zbyt duży.', 413);
}

$rawBody = file_get_contents('php://input');
if (!is_string($rawBody) || $rawBody === '' || strlen($rawBody) > DRUKULATOR_MAX_PRICE_FILE_BYTES) {
    drukulator_save_response(false, 'Nie otrzymano prawidłowych danych.', 400);
}

$request = json_decode($rawBody, true);
if (!is_array($request)) {
    drukulator_save_response(false, 'Nieprawidłowy format danych JSON.', 400);
}

$nonce = isset($request['nonce']) ? (string) $request['nonce'] : '';
if ($nonce === '' || !wp_verify_nonce($nonce, 'drukulator_save_prices')) {
    drukulator_save_response(false, 'Sesja bezpieczeństwa wygasła. Odśwież stronę i spróbuj ponownie.', 403);
}

$prices = $request['prices'] ?? null;
if (!is_array($prices)) {
    drukulator_save_response(false, 'Nie otrzymano prawidłowego cennika.', 400);
}

$dataDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$pricesPath = $dataDirectory . DIRECTORY_SEPARATOR . 'prices.json';
$backupDirectory = $dataDirectory . DIRECTORY_SEPARATOR . 'backups';
$lockPath = $dataDirectory . DIRECTORY_SEPARATOR . '.prices.lock';

if (!is_dir($dataDirectory) || !is_file($pricesPath)) {
    drukulator_save_response(false, 'Nie znaleziono pliku data/prices.json.', 500);
}

if (!is_writable($dataDirectory) || !is_writable($pricesPath)) {
    drukulator_save_response(false, 'Serwer nie ma uprawnień do zapisu w data/prices.json. Ustaw zapis dla PHP w folderze data.', 500);
}

$currentRaw = file_get_contents($pricesPath);
$currentPrices = is_string($currentRaw) ? json_decode($currentRaw, true) : null;
if (!is_array($currentPrices)) {
    drukulator_save_response(false, 'Aktualny prices.json jest uszkodzony. Zapis został zatrzymany.', 500);
}

$validationError = drukulator_validate_price_tree($prices, $currentPrices);
if ($validationError !== null) {
    drukulator_save_response(false, $validationError, 422);
}

$encoded = json_encode(
    $prices,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION
);
if (!is_string($encoded)) {
    drukulator_save_response(false, 'Nie udało się przygotować nowego pliku prices.json.', 500);
}
$encoded .= PHP_EOL;

$lockHandle = fopen($lockPath, 'c');
if ($lockHandle === false || !flock($lockHandle, LOCK_EX)) {
    if (is_resource($lockHandle)) {
        fclose($lockHandle);
    }
    drukulator_save_response(false, 'Nie udało się zablokować pliku na czas zapisu. Spróbuj ponownie.', 500);
}

try {
    if (!is_dir($backupDirectory) && !mkdir($backupDirectory, 0755, true) && !is_dir($backupDirectory)) {
        throw new RuntimeException('Nie udało się utworzyć folderu kopii zapasowych.');
    }

    $backupHtaccess = $backupDirectory . DIRECTORY_SEPARATOR . '.htaccess';
    if (!is_file($backupHtaccess)) {
        @file_put_contents($backupHtaccess, "Require all denied\nDeny from all\n", LOCK_EX);
    }
    $backupIndex = $backupDirectory . DIRECTORY_SEPARATOR . 'index.html';
    if (!is_file($backupIndex)) {
        @file_put_contents($backupIndex, '', LOCK_EX);
    }

    $backupName = sprintf(
        'prices-%s-%s.json',
        gmdate('Y-m-d-H-i-s'),
        substr(bin2hex(random_bytes(4)), 0, 8)
    );
    $backupPath = $backupDirectory . DIRECTORY_SEPARATOR . $backupName;
    if (!copy($pricesPath, $backupPath)) {
        throw new RuntimeException('Nie udało się utworzyć kopii zapasowej cennika.');
    }

    $temporaryPath = tempnam($dataDirectory, '.prices-');
    if ($temporaryPath === false) {
        throw new RuntimeException('Nie udało się utworzyć pliku tymczasowego.');
    }

    $bytes = file_put_contents($temporaryPath, $encoded, LOCK_EX);
    if ($bytes === false || $bytes !== strlen($encoded)) {
        @unlink($temporaryPath);
        throw new RuntimeException('Nie udało się zapisać kompletnego pliku tymczasowego.');
    }

    @chmod($temporaryPath, 0644);
    if (!rename($temporaryPath, $pricesPath)) {
        @unlink($temporaryPath);
        throw new RuntimeException('Nie udało się podmienić pliku prices.json.');
    }

    clearstatcache(true, $pricesPath);
    drukulator_cleanup_backups($backupDirectory);
} catch (Throwable $error) {
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    drukulator_save_response(false, $error->getMessage(), 500);
}

flock($lockHandle, LOCK_UN);
fclose($lockHandle);

$currentUser = wp_get_current_user();
$updatedAt = wp_date('d.m.Y H:i:s');

drukulator_save_response(
    true,
    'Cennik został zapisany na serwerze. Kopia poprzedniej wersji znajduje się w data/backups.',
    200,
    array(
        'updated_at' => $updatedAt,
        'updated_by' => sanitize_text_field((string) $currentUser->display_name),
    )
);
