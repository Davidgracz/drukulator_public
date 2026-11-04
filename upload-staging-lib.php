<?php

declare(strict_types=1);

const DRUKULATOR_STAGE_MAX_FILES = 5;
const DRUKULATOR_STAGE_MAX_BYTES = 52428800;
const DRUKULATOR_STAGE_MAX_CHUNK = 8388608;
const DRUKULATOR_DELIVERY_TTL = 172800;
const DRUKULATOR_STAGE_TTL = 7200;

function drukulator_stage_root(): string
{
    $temp = realpath(sys_get_temp_dir());
    if ($temp === false) {
        throw new RuntimeException('Serwer nie udostępnia katalogu tymczasowego.');
    }
    $root = $temp . DIRECTORY_SEPARATOR . 'drukulator-staged-uploads';
    if (is_link($root)) {
        throw new RuntimeException('Nie można bezpiecznie przygotować katalogu na pliki.');
    }
    if (!is_dir($root) && !@mkdir($root, 0700, true) && !is_dir($root)) {
        throw new RuntimeException('Serwer nie pozwala przygotować plików.');
    }
    @chmod($root, 0700);
    $resolved = realpath($root);
    $document_root = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''));
    if ($resolved === false || !is_writable($resolved) || ($document_root !== false && ($resolved === $document_root || str_starts_with($resolved, $document_root . DIRECTORY_SEPARATOR)))) {
        throw new RuntimeException('Katalog przesyłania plików nie jest bezpieczny lub dostępny.');
    }
    return $resolved;
}

/** Anonymous upload errors, stored only in the private staging directory. */
function drukulator_stage_monitor_failure(string $mode, string $reason = ''): void
{
    try {
        $root = drukulator_stage_root();
        $path = $root . DIRECTORY_SEPARATOR . 'upload-monitor.jsonl';
        if (is_link($path)) return;
        $handle = @fopen($path, 'c+');
        if (!$handle) return;
        if (!@flock($handle, LOCK_EX)) { fclose($handle); return; }
        @rewind($handle);
        $existing = (string) stream_get_contents($handle, 131072);
        $lines = array_slice(array_filter(explode("\n", $existing), 'strlen'), -149);
        $permitted = array(
            'Nie udało się odebrać fragmentu pliku.',
            'Nieprawidłowa kolejność fragmentów pliku.',
            'Plik jest większy od zadeklarowanego rozmiaru.',
            'Zapisano tylko część fragmentu pliku.',
            'Serwer nie może zapisać fragmentu pliku.',
            'Serwer nie może zapisać pliku.',
            'Sesja przesyłania nie istnieje.',
            'Sesja przesyłania wygasła. Dodaj pliki ponownie.',
            'Zbyt wiele rozpoczętych przesyłań. Spróbuj ponownie później.',
            'Łączny rozmiar załączników przekracza 50 MB.',
            'Nieobsługiwany lub pusty plik.',
            'Nie można zablokować sesji przesyłania.',
        );
        $safe_reason = in_array($reason, $permitted, true) ? $reason : '';
        $lines[] = json_encode(array('ts' => time(), 'mode' => in_array($mode, array('chunk','start','cancel'), true) ? $mode : 'other', 'reason' => $safe_reason), JSON_UNESCAPED_UNICODE);
        @rewind($handle);
        @ftruncate($handle, 0);
        @fwrite($handle, implode("\n", $lines) . "\n");
        @fflush($handle);
        @chmod($path, 0600);
        @flock($handle, LOCK_UN);
        @fclose($handle);
    } catch (Throwable $ignored) { /* Diagnostics must never break uploads. */ }
}

function drukulator_stage_session_path(string $token): string
{
    if (preg_match('/\A[a-f0-9]{48}\z/D', $token) !== 1) {
        throw new RuntimeException('Nieprawidłowy identyfikator przesyłania plików.');
    }
    return drukulator_stage_root() . DIRECTORY_SEPARATOR . $token;
}

function drukulator_stage_remove(string $directory): void
{
    if (!is_dir($directory) || is_link($directory)) {
        return;
    }
    foreach (new DirectoryIterator($directory) as $entry) {
        if ($entry->isDot()) {
            continue;
        }
        $path = $entry->getPathname();
        if ($entry->isFile() || $entry->isLink()) {
            @unlink($path);
        }
    }
    @rmdir($directory);
}

function drukulator_stage_cleanup(): void
{
    $root = drukulator_stage_root();
    foreach (new DirectoryIterator($root) as $entry) {
        if (!$entry->isDir() || $entry->isLink() || $entry->isDot() || !preg_match('/\A[a-f0-9]{48}\z/D', $entry->getFilename())) {
            continue;
        }
        $path = $entry->getPathname();
        $manifest = $path . DIRECTORY_SEPARATOR . 'manifest.json';
        $saved = json_decode((string) @file_get_contents($manifest), true);
        $fallback_expiry = (@filemtime($manifest) ?: @filemtime($path) ?: 0) + DRUKULATOR_STAGE_TTL;
        $expires = is_array($saved) ? (int) ($saved['expires'] ?? $fallback_expiry) : $fallback_expiry;
        if ($expires < time()) {
            $lock = @fopen($path . DIRECTORY_SEPARATOR . '.lock', 'c');
            if ($lock && @flock($lock, LOCK_EX | LOCK_NB)) {
                $saved_again = json_decode((string) @file_get_contents($manifest), true);
                $still_expires = is_array($saved_again) ? (int) ($saved_again['expires'] ?? $fallback_expiry) : $fallback_expiry;
                if ($still_expires < time()) {
                    drukulator_stage_remove($path);
                }
                @flock($lock, LOCK_UN);
            }
            if ($lock) {
                @fclose($lock);
            }
        }
    }
}

function drukulator_stage_read(string $directory): array
{
    $path = $directory . DIRECTORY_SEPARATOR . 'manifest.json';
    if (!is_file($path) || is_link($path)) {
        throw new RuntimeException('Sesja przesyłania wygasła. Dodaj pliki ponownie.');
    }
    $manifest = json_decode((string) @file_get_contents($path), true);
    if (!is_array($manifest) || !isset($manifest['files']) || !is_array($manifest['files'])) {
        throw new RuntimeException('Nie można odczytać sesji przesyłania.');
    }
    if (time() > (int) ($manifest['expires'] ?? 0)) {
        throw new RuntimeException('Sesja przesyłania wygasła. Dodaj pliki ponownie.');
    }
    return $manifest;
}

function drukulator_stage_write(string $directory, array $manifest): void
{
    $path = $directory . DIRECTORY_SEPARATOR . 'manifest.json';
    $tmp = $directory . DIRECTORY_SEPARATOR . '.manifest-tmp';
    if (@file_put_contents($tmp, json_encode($manifest, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) === false || !@rename($tmp, $path)) {
        throw new RuntimeException('Serwer nie może zapisać postępu przesyłania plików.');
    }
    @chmod($path, 0600);
}

function drukulator_stage_start(array $file_list, string $ip): string
{
    if (!$file_list || count($file_list) > DRUKULATOR_STAGE_MAX_FILES) {
        throw new RuntimeException('Można dodać maksymalnie 5 plików.');
    }
    // Ograniczamy liczbę porzuconych sesji z jednego adresu.
    drukulator_stage_cleanup();
    $root = drukulator_stage_root();
    $ip_hash = hash_hmac('sha256', $ip, wp_salt('nonce'));
    $active_count = 0;
    foreach (new DirectoryIterator($root) as $entry) {
        if (!$entry->isDir() || $entry->isLink() || $entry->isDot() || !preg_match('/\A[a-f0-9]{48}\z/D', $entry->getFilename())) {
            continue;
        }
        $saved = json_decode((string) @file_get_contents($entry->getPathname() . '/manifest.json'), true);
        if (is_array($saved) && ($saved['ipHash'] ?? '') === $ip_hash && (int) ($saved['expires'] ?? 0) > time()) {
            $active_count++;
        }
    }
    if ($active_count >= 5) {
        throw new RuntimeException('Zbyt wiele rozpoczętych przesyłań. Spróbuj ponownie później.');
    }
    $allowed = array('pdf', 'jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff', 'svg', 'ai', 'eps', 'psd', 'cdr', 'zip');
    $total = 0;
    $files = array();
    $used_names = array();
    foreach ($file_list as $entry) {
        if (!is_array($entry)) {
            throw new RuntimeException('Nieprawidłowe dane pliku.');
        }
        $name = sanitize_file_name((string) ($entry['name'] ?? ''));
        $size = filter_var($entry['size'] ?? null, FILTER_VALIDATE_INT);
        $ext = strtolower((string) pathinfo($name, PATHINFO_EXTENSION));
        if ($name === '' || strlen($name) > 200 || !in_array($ext, $allowed, true) || $size === false || $size <= 0) {
            throw new RuntimeException('Nieobsługiwany lub pusty plik.');
        }
        $total += $size;
        if ($total > DRUKULATOR_STAGE_MAX_BYTES) {
            throw new RuntimeException('Łączny rozmiar załączników przekracza 50 MB.');
        }
        $storage_name = $name;
        $counter = 2;
        while (in_array($storage_name, $used_names, true)) {
            $storage_name = pathinfo($name, PATHINFO_FILENAME) . '-' . $counter++ . '.' . $ext;
        }
        $used_names[] = $storage_name;
        $files[] = array('name' => $name, 'storageName' => $storage_name, 'size' => $size, 'received' => 0);
    }
    $token = bin2hex(random_bytes(24));
    $directory = $root . DIRECTORY_SEPARATOR . $token;
    if (!@mkdir($directory, 0700)) {
        throw new RuntimeException('Nie można utworzyć sesji przesyłania.');
    }
    drukulator_stage_write($directory, array('ipHash' => $ip_hash, 'expires' => time() + DRUKULATOR_STAGE_TTL, 'files' => $files));
    return $token;
}

function drukulator_stage_append(string $token, int $index, int $offset, array $chunk): array
{
    $directory = drukulator_stage_session_path($token);
    if (!is_dir($directory) || is_link($directory)) {
        throw new RuntimeException('Sesja przesyłania nie istnieje.');
    }
    $size = (int) ($chunk['size'] ?? 0);
    $tmp = (string) ($chunk['tmp_name'] ?? '');
    if ((int) ($chunk['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || $size <= 0 || $size > DRUKULATOR_STAGE_MAX_CHUNK || !is_uploaded_file($tmp)) {
        throw new RuntimeException('Nie udało się odebrać fragmentu pliku.');
    }
    $lock = @fopen($directory . '/.lock', 'c');
    if (!$lock || !@flock($lock, LOCK_EX)) {
        throw new RuntimeException('Nie można zablokować sesji przesyłania.');
    }
    try {
        $manifest = drukulator_stage_read($directory);
        if (!empty($manifest['delivered'])) {
            throw new RuntimeException('Pliki zostały już przekazane do zapytania.');
        }
        if (!isset($manifest['files'][$index])) {
            throw new RuntimeException('Nieprawidłowy numer pliku.');
        }
        $expected = (int) $manifest['files'][$index]['received'];
        if ($offset !== $expected) {
            // Ponowienie może nadejść, gdy poprzednia odpowiedź HTTP zginęła.
            // Akceptujemy je wyłącznie, jeżeli fragment na dysku ma identyczne bajty.
            $retry_path = $directory . DIRECTORY_SEPARATOR . $manifest['files'][$index]['storageName'];
            if ($offset >= 0 && $expected === $offset + $size && is_file($retry_path) && !is_link($retry_path)) {
                $current = @fopen($retry_path, 'rb');
                if ($current && fseek($current, $offset) === 0) {
                    $context = hash_init('sha256');
                    $read = hash_update_stream($context, $current, $size);
                    $stored_hash = $read === $size ? hash_final($context) : '';
                    $incoming_hash = hash_file('sha256', $tmp);
                    fclose($current);
                    if ($stored_hash !== '' && hash_equals($stored_hash, $incoming_hash)) {
                        return array('received' => $expected, 'fileSize' => (int) $manifest['files'][$index]['size']);
                    }
                } elseif ($current) {
                    fclose($current);
                }
            }
            throw new RuntimeException('Nieprawidłowa kolejność fragmentów pliku.');
        }
        if ($expected + $size > (int) $manifest['files'][$index]['size']) {
            throw new RuntimeException('Plik jest większy od zadeklarowanego rozmiaru.');
        }
        $path = $directory . DIRECTORY_SEPARATOR . $manifest['files'][$index]['storageName'];
        // A single-chunk file can be moved into place without copying its contents.
        if ($expected === 0 && $size === (int) $manifest['files'][$index]['size'] && !file_exists($path) && !is_link($path)) {
            if (!move_uploaded_file($tmp, $path)) {
                throw new RuntimeException('Serwer nie może zapisać pliku.');
            }
            @chmod($path, 0600);
            $manifest['files'][$index]['received'] = $size;
            drukulator_stage_write($directory, $manifest);
            return array('received' => $size, 'fileSize' => $size);
        }
        $dest = @fopen($path, 'c+b');
        $source = @fopen($tmp, 'rb');
        if (!$dest || !$source) {
            throw new RuntimeException('Serwer nie może zapisać fragmentu pliku.');
        }
        try {
            if (is_link($path)) {
                throw new RuntimeException('Niedozwolony plik tymczasowy.');
            }
            $existing = fstat($dest)['size'] ?? 0;
            if ($existing < $expected || !ftruncate($dest, $expected) || fseek($dest, $expected) !== 0) {
                throw new RuntimeException('Nieprawidłowy stan pliku tymczasowego.');
            }
            $written = stream_copy_to_stream($source, $dest);
            if ($written !== $size) {
                throw new RuntimeException('Zapisano tylko część fragmentu pliku.');
            }
            fflush($dest);
            @chmod($path, 0600);
        } finally {
            fclose($source);
            fclose($dest);
        }
        $manifest['files'][$index]['received'] += $size;
        drukulator_stage_write($directory, $manifest);
        return array('received' => (int) $manifest['files'][$index]['received'], 'fileSize' => (int) $manifest['files'][$index]['size']);
    } finally {
        @flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function drukulator_stage_finalize(string $token): array
{
    $directory = drukulator_stage_session_path($token);
    if (!is_dir($directory) || is_link($directory)) {
        throw new RuntimeException('Nie znaleziono przesłanych plików. Dodaj je ponownie.');
    }
    $lock = @fopen($directory . '/.lock', 'c');
    if (!$lock || !@flock($lock, LOCK_EX)) {
        throw new RuntimeException('Pliki są nadal przesyłane.');
    }
    try {
        $manifest = drukulator_stage_read($directory);
        if (!empty($manifest['delivered'])) {
            throw new RuntimeException('Te pliki zostały już przekazane do innego zapytania.');
        }
        $paths = array();
        $names = array();
        foreach ($manifest['files'] as $index => $entry) {
            $path = $directory . DIRECTORY_SEPARATOR . $entry['storageName'];
            if ((int) $entry['received'] !== (int) $entry['size'] || !is_file($path) || is_link($path) || filesize($path) !== (int) $entry['size']) {
                throw new RuntimeException('Nie wszystkie załączniki zostały przesłane. Spróbuj ponownie.');
            }
            $name = (string) $entry['storageName'];
            $paths[] = $path;
            $names[] = $name;
        }
        return array('paths' => $paths, 'names' => $names, 'directory' => $directory);
    } finally {
        @flock($lock, LOCK_UN);
        fclose($lock);
    }
}


/**
 * Makes fully received files available through independent, unguessable download links.
 * The files remain outside DOCUMENT_ROOT and do not pass through the mail system.
 */
function drukulator_stage_publish(string $token): array
{
    $directory = drukulator_stage_session_path($token);
    $lock = @fopen($directory . '/.lock', 'c');
    if (!$lock || !@flock($lock, LOCK_EX)) {
        throw new RuntimeException('Nie można udostępnić plików.');
    }
    try {
        $manifest = drukulator_stage_read($directory);
        if (!empty($manifest['delivered'])) {
            throw new RuntimeException('Pliki wykorzystano już w innym zapytaniu.');
        }
        $files = array();
        foreach ($manifest['files'] as $index => $entry) {
            $storage = (string) ($entry['storageName'] ?? '');
            $path = $directory . '/' . $storage;
            if ($storage === '' || basename($storage) !== $storage || is_link($path) || !is_file($path)
                || (int) $entry['received'] !== (int) $entry['size'] || filesize($path) !== (int) $entry['size']) {
                throw new RuntimeException('Przesyłanie plików nie zostało ukończone.');
            }
            $secret = bin2hex(random_bytes(32));
            $manifest['files'][$index]['downloadSecret'] = $secret;
            $files[] = array('name' => $storage, 'secret' => $secret);
        }
        $manifest['delivered'] = true;
        $manifest['expires'] = time() + DRUKULATOR_DELIVERY_TTL;
        drukulator_stage_write($directory, $manifest);
        return array('files' => $files, 'expires' => $manifest['expires']);
    } finally {
        @flock($lock, LOCK_UN);
        fclose($lock);
    }
}

/** Roll back a failed e-mail attempt; previously uploaded files may be submitted again. */
function drukulator_stage_unpublish(string $token): void
{
    $directory = drukulator_stage_session_path($token);
    $lock = @fopen($directory . '/.lock', 'c');
    if (!$lock || !@flock($lock, LOCK_EX)) {
        return;
    }
    try {
        $manifest = drukulator_stage_read($directory);
        unset($manifest['delivered']);
        $manifest['expires'] = time() + DRUKULATOR_STAGE_TTL;
        foreach ($manifest['files'] as &$entry) {
            unset($entry['downloadSecret']);
        }
        unset($entry);
        drukulator_stage_write($directory, $manifest);
    } finally {
        @flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function drukulator_stage_download_info(string $token, string $secret): array
{
    if (preg_match('/\A[a-f0-9]{64}\z/D', $secret) !== 1) {
        throw new RuntimeException('Nieprawidłowy link do pliku.');
    }
    $directory = drukulator_stage_session_path($token);
    $manifest = drukulator_stage_read($directory);
    if (empty($manifest['delivered'])) {
        throw new RuntimeException('Nieprawidłowy link do pliku.');
    }
    foreach ($manifest['files'] as $entry) {
        $saved_secret = (string) ($entry['downloadSecret'] ?? '');
        if ($saved_secret === '' || !hash_equals($saved_secret, $secret)) {
            continue;
        }
        $name = (string) ($entry['storageName'] ?? '');
        if ($name === '' || basename($name) !== $name) {
            break;
        }
        $path = $directory . '/' . $name;
        if (!is_file($path) || is_link($path) || filesize($path) !== (int) $entry['size']) {
            break;
        }
        return array('name' => $name, 'path' => $path, 'size' => (int) $entry['size']);
    }
    throw new RuntimeException('Nieprawidłowy lub wygasły link do pliku.');
}
