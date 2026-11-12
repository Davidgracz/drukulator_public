<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

const DRUKULATOR_CONTACT_EMAIL = 'biuro@druk24.szczecin.pl';
const DRUKULATOR_MAX_ORDER_TOTAL = 5000.0;
const DRUKULATOR_MAX_ATTACHMENTS = 5;
const DRUKULATOR_MAX_ATTACHMENTS_TOTAL_BYTES = 52428800;
require_once __DIR__ . '/upload-staging-lib.php';

function drukulator_limit_message(string $message): string
{
    return $message . ' W sprawie zlecenia wykraczającego poza kalkulator skontaktuj się z ' . DRUKULATOR_CONTACT_EMAIL . '.';
}

function drukulator_email_domain_exists(string $email): bool
{
    $at_position = strrpos($email, '@');
    if ($at_position === false) {
        return false;
    }

    $domain = strtolower(substr($email, $at_position + 1));
    if ($domain === '' || strpos($domain, '.') === false) {
        return false;
    }

    if (function_exists('idn_to_ascii')) {
        $idna_flags = defined('IDNA_DEFAULT') ? IDNA_DEFAULT : 0;
        $idna_variant = defined('INTL_IDNA_VARIANT_UTS46') ? INTL_IDNA_VARIANT_UTS46 : 0;
        $ascii_domain = idn_to_ascii($domain, $idna_flags, $idna_variant);
        if (is_string($ascii_domain) && $ascii_domain !== '') {
            $domain = $ascii_domain;
        }
    }

    if (function_exists('checkdnsrr')) {
        if (checkdnsrr($domain, 'MX') || checkdnsrr($domain, 'A') || checkdnsrr($domain, 'AAAA')) {
            return true;
        }
    }

    if (function_exists('dns_get_record')) {
        $records = @dns_get_record($domain, DNS_MX | DNS_A | DNS_AAAA);
        if (is_array($records) && count($records) > 0) {
            return true;
        }
    }

    if (function_exists('gethostbyname')) {
        $resolved = @gethostbyname($domain);
        if (is_string($resolved) && $resolved !== '' && $resolved !== $domain) {
            return true;
        }
    }

    return false;
}

function drukulator_number(array $data, string $key): float
{
    return isset($data[$key]) && is_numeric($data[$key]) ? (float) $data[$key] : 0.0;
}

function drukulator_validate_item_limits(array $item, string $title): void
{
    $meta = isset($item['meta']) && is_array($item['meta']) ? $item['meta'] : array();
    $product_type = sanitize_key((string) ($meta['productType'] ?? ''));

    if ($product_type === '') {
        $normalized_title = function_exists('mb_strtolower') ? mb_strtolower($title, 'UTF-8') : strtolower($title);
        $requires_metadata = strpos($normalized_title, 'plakat') !== false
            || strpos($normalized_title, 'baner') !== false
            || strpos($normalized_title, 'folia') !== false
            || strpos($normalized_title, 'naklejk') !== false
            || strpos($normalized_title, 'etykiet') !== false
            || strpos($normalized_title, 'pcv') !== false
            || strpos($normalized_title, 'piank') !== false
            || strpos($normalized_title, 'płótn') !== false
            || strpos($normalized_title, 'plotn') !== false;

        if ($requires_metadata) {
            drukulator_response(false, 'Jedna z pozycji pochodzi ze starszej wersji kalkulatora. Usuń ją z koszyka i oblicz ponownie.', 422);
        }
        return;
    }

    $quantity = drukulator_number($meta, 'quantity');

    if ($product_type === 'poster') {
        $print_type = sanitize_text_field((string) ($meta['printType'] ?? ''));
        if ($print_type === 'Wielkoformatowy 24h' && $quantity > 30) {
            drukulator_response(false, drukulator_limit_message('Maksymalny nakład plakatów wielkoformatowych to 30 sztuk.'), 422);
        }

        if (!empty($meta['customSize'])) {
            $width = drukulator_number($meta, 'widthCm');
            $height = drukulator_number($meta, 'heightCm');
            if ($width <= 0 || $height <= 0) {
                drukulator_response(false, 'Szerokość i wysokość plakatu muszą być większe od zera.', 422);
            }

            $formats_by_print = array(
                'Cyfrowy 24h' => array(array(21, 29.7), array(29.7, 42)),
                'Offsetowy' => array(array(29.7, 42), array(42, 59), array(59, 84), array(50, 70), array(70, 100)),
                'Wielkoformatowy 24h' => array(array(42, 59), array(59, 84), array(84, 120), array(50, 70), array(70, 100), array(100, 140)),
            );
            $available_formats = $formats_by_print[$print_type] ?? array();
            $fits = false;
            foreach ($available_formats as $dimensions) {
                $format_width = (float) $dimensions[0];
                $format_height = (float) $dimensions[1];
                if (($width <= $format_width && $height <= $format_height) || ($width <= $format_height && $height <= $format_width)) {
                    $fits = true;
                    break;
                }
            }
            if (!$fits) {
                drukulator_response(false, drukulator_limit_message('Podany wymiar plakatu nie mieści się w żadnym formacie dostępnym dla wybranego rodzaju druku.'), 422);
            }
        }
        return;
    }

    if ($product_type === 'banner') {
        $width = drukulator_number($meta, 'widthCm');
        $height = drukulator_number($meta, 'heightCm');
        $material = sanitize_text_field((string) ($meta['material'] ?? ''));
        $is_film = preg_match('/^Folia\b/ui', $material) === 1;
        $shorter = min($width, $height);
        $longer = max($width, $height);
        $max_shorter = stripos($material, 'laminat') !== false ? 135.0 : 160.0;
        if ($shorter <= 0 || $shorter > $max_shorter || (!$is_film && $shorter < 30) || $longer > 1000) {
            drukulator_response(false, drukulator_limit_message('Nieprawidłowe wymiary materiału: krótszy bok maks. ' . $max_shorter . ' cm, dłuższy do 1000 cm.'), 422);
        }
        return;
    }

    if ($product_type === 'sticker') {
        $width = drukulator_number($meta, 'widthMm');
        $height = drukulator_number($meta, 'heightMm');
        if ($width < 30 || $height < 30 || $width > 500 || $height > 500) {
            drukulator_response(false, drukulator_limit_message('Wymiar naklejki musi mieścić się w zakresie od 30 × 30 mm do 500 × 500 mm.'), 422);
        }
        return;
    }

    if ($product_type === 'pvc' || $product_type === 'foam') {
        $width = drukulator_number($meta, 'widthCm');
        $height = drukulator_number($meta, 'heightCm');
        $shorter = min($width, $height);
        $longer = max($width, $height);

        if ($product_type === 'foam') {
            if ($shorter <= 0 || $shorter > 100 || $longer > 140) {
                drukulator_response(false, drukulator_limit_message('Maksymalny wymiar pianki to 100 × 140 cm, również po obróceniu.'), 422);
            }
            if ($quantity < 1 || floor($quantity) !== $quantity) {
                drukulator_response(false, drukulator_limit_message('Pianki można zamawiać wyłącznie w pełnych sztukach.'), 422);
            }
            return;
        }

        if ($shorter <= 0 || $shorter > 160 || $longer > 300) {
            drukulator_response(false, drukulator_limit_message('Maksymalny wymiar PCV to 160 × 300 cm, również po obróceniu.'), 422);
        }
        return;
    }

    if ($product_type === 'canvas' && $quantity > 10) {
        drukulator_response(false, drukulator_limit_message('Maksymalna liczba jednakowych obrazów to 10 sztuk.'), 422);
    }
}

function drukulator_uploaded_files(): array
{
    if (!isset($_FILES['files']) || !is_array($_FILES['files'])) {
        return array();
    }

    $source = $_FILES['files'];
    $names = is_array($source['name'] ?? null) ? $source['name'] : array($source['name'] ?? '');
    $types = is_array($source['type'] ?? null) ? $source['type'] : array($source['type'] ?? '');
    $tmp_names = is_array($source['tmp_name'] ?? null) ? $source['tmp_name'] : array($source['tmp_name'] ?? '');
    $errors = is_array($source['error'] ?? null) ? $source['error'] : array($source['error'] ?? UPLOAD_ERR_NO_FILE);
    $sizes = is_array($source['size'] ?? null) ? $source['size'] : array($source['size'] ?? 0);

    $files = array();
    foreach ($names as $index => $name) {
        $files[] = array(
            'name' => (string) $name,
            'type' => (string) ($types[$index] ?? ''),
            'tmp_name' => (string) ($tmp_names[$index] ?? ''),
            'error' => (int) ($errors[$index] ?? UPLOAD_ERR_NO_FILE),
            'size' => (int) ($sizes[$index] ?? 0),
        );
    }
    return $files;
}

function drukulator_remove_attachment_directory(string $directory): void
{
    if ($directory === '' || !is_dir($directory)) {
        return;
    }
    $files = glob($directory . DIRECTORY_SEPARATOR . '*');
    if (is_array($files)) {
        foreach ($files as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
    }
    @rmdir($directory);
}

function drukulator_collect_attachments(string $order_id, string $upload_token = ''): array
{
    if ($upload_token !== '') {
        if (!empty($_FILES['files']['name'])) {
            drukulator_response(false, 'Nie można jednocześnie wysyłać plików dwoma sposobami.', 422);
        }
        try {
            $staged = drukulator_stage_finalize($upload_token);
        } catch (Throwable $error) {
            d24_monitor_log('upload_validation_failed', 'error', 'Nie udało się zatwierdzić przesłanych plików', $order_id, array('method' => 'staged'));
            drukulator_response(false, $error->getMessage(), 422);
        }
        if (count($staged['paths']) > DRUKULATOR_MAX_ATTACHMENTS) {
            drukulator_response(false, 'Można dołączyć maksymalnie 5 plików.', 422);
        }
        $total_bytes = 0;
        $blocked = array('php', 'x-httpd', 'x-sh', 'x-executable', 'x-msdownload', 'x-dosexec');
        $finfo = class_exists('finfo') ? new finfo(FILEINFO_MIME_TYPE) : null;
        foreach ($staged['paths'] as $path) {
            $total_bytes += filesize($path);
            if ($total_bytes > DRUKULATOR_MAX_ATTACHMENTS_TOTAL_BYTES) {
                drukulator_response(false, 'Załączniki przekraczają 50 MB.', 422);
            }
            $mime = $finfo ? strtolower((string) $finfo->file($path)) : '';
            foreach ($blocked as $fragment) {
                if ($mime !== '' && strpos($mime, $fragment) !== false) {
                    drukulator_response(false, 'Załącznik został odrzucony ze względów bezpieczeństwa.', 422);
                }
            }
        }
        return $staged;
    }
    $uploads = array_values(array_filter(
        drukulator_uploaded_files(),
        static fn(array $file): bool => $file['error'] !== UPLOAD_ERR_NO_FILE && $file['name'] !== ''
    ));

    if (count($uploads) > DRUKULATOR_MAX_ATTACHMENTS) {
        drukulator_response(false, 'Można dołączyć maksymalnie 5 plików.', 422);
    }

    $allowed_extensions = array('pdf', 'jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff', 'svg', 'ai', 'eps', 'psd', 'cdr', 'zip');
    $blocked_mime_fragments = array('php', 'x-httpd', 'x-sh', 'x-executable', 'x-msdownload', 'x-dosexec');
    $validated = array();
    $total_size = 0;

    foreach ($uploads as $file) {
        $safe_name = sanitize_file_name($file['name']);
        if ($file['error'] !== UPLOAD_ERR_OK) {
            drukulator_response(false, 'Nie udało się przesłać pliku: ' . ($safe_name !== '' ? $safe_name : 'bez nazwy') . '.', 422);
        }
        if (!is_uploaded_file($file['tmp_name'])) {
            drukulator_response(false, 'Nieprawidłowy plik załącznika.', 422);
        }
        if ($file['size'] <= 0) {
            drukulator_response(false, 'Nie można odczytać rozmiaru pliku: ' . ($safe_name !== '' ? $safe_name : 'bez nazwy') . '.', 422);
        }

        $extension = strtolower((string) pathinfo($safe_name, PATHINFO_EXTENSION));
        if ($safe_name === '' || !in_array($extension, $allowed_extensions, true)) {
            drukulator_response(false, 'Niedozwolony typ pliku: ' . ($safe_name !== '' ? $safe_name : 'bez nazwy') . '.', 422);
        }

        $detected_mime = '';
        if (class_exists('finfo')) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $detected_mime = strtolower((string) $finfo->file($file['tmp_name']));
        }
        foreach ($blocked_mime_fragments as $fragment) {
            if ($detected_mime !== '' && strpos($detected_mime, $fragment) !== false) {
                drukulator_response(false, 'Plik został odrzucony ze względów bezpieczeństwa: ' . $safe_name . '.', 422);
            }
        }

        $total_size += $file['size'];
        if ($total_size > DRUKULATOR_MAX_ATTACHMENTS_TOTAL_BYTES) {
            drukulator_response(false, 'Łączny rozmiar załączników może wynosić maksymalnie 50 MB.', 422);
        }

        $validated[] = array(
            'name' => $safe_name,
            'extension' => $extension,
            'tmp_name' => $file['tmp_name'],
        );
    }

    if (!$validated) {
        return array('paths' => array(), 'names' => array(), 'directory' => '');
    }

    $directory = trailingslashit(get_temp_dir()) . 'drukulator-' . sanitize_file_name($order_id) . '-' . wp_generate_password(8, false, false);
    if (!wp_mkdir_p($directory) || !is_writable($directory)) {
        drukulator_response(false, 'Serwer nie może przygotować załączników. Spróbuj ponownie bez plików lub napisz na ' . DRUKULATOR_CONTACT_EMAIL . '.', 500);
    }

    $paths = array();
    $names = array();
    foreach ($validated as $index => $file) {
        $unique_name = $file['name'];
        $counter = 2;
        while (in_array($unique_name, $names, true)) {
            $base_name = pathinfo($file['name'], PATHINFO_FILENAME);
            $unique_name = $base_name . '-' . $counter . '.' . $file['extension'];
            $counter++;
        }
        $target = $directory . DIRECTORY_SEPARATOR . $unique_name;
        if (!move_uploaded_file($file['tmp_name'], $target)) {
            drukulator_remove_attachment_directory($directory);
            drukulator_response(false, 'Nie udało się przygotować załącznika: ' . $unique_name . '.', 500);
        }
        $paths[] = $target;
        $names[] = $unique_name;
    }

    register_shutdown_function(static function () use ($directory): void {
        drukulator_remove_attachment_directory($directory);
    });

    return array('paths' => $paths, 'names' => $names, 'directory' => $directory);
}

function drukulator_response(bool $success, string $message, int $status = 200, array $extra = array()): void
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

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    drukulator_response(false, 'Dozwolona jest wyłącznie metoda POST.', 405);
}

$wp_load = dirname(__DIR__) . '/wp-load.php';
if (!is_file($wp_load)) {
    drukulator_response(false, 'Nie znaleziono środowiska WordPress.', 500);
}

require_once $wp_load;
require_once __DIR__ . '/order-status-lib.php';
require_once __DIR__ . '/monitoring-lib.php';
require_once __DIR__ . '/mail-audit-lib.php';
require_once __DIR__ . '/analytics-v2-lib.php';
require_once __DIR__ . '/promo-lib.php';
$order_started_at = microtime(true);

$site_host = strtolower((string) wp_parse_url(home_url('/'), PHP_URL_HOST));
$origin = isset($_SERVER['HTTP_ORIGIN']) ? strtolower((string) wp_parse_url((string) $_SERVER['HTTP_ORIGIN'], PHP_URL_HOST)) : '';
$referer = isset($_SERVER['HTTP_REFERER']) ? strtolower((string) wp_parse_url((string) $_SERVER['HTTP_REFERER'], PHP_URL_HOST)) : '';

if (($origin !== '' && $origin !== $site_host) || ($referer !== '' && $referer !== $site_host)) {
    drukulator_response(false, 'Żądanie pochodzi z niedozwolonej strony.', 403);
}

$content_length = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
if ($content_length > 54525952) {
    drukulator_response(false, 'Przesłane dane są zbyt duże. Łączny limit formularza wynosi 52 MB.', 413);
}

if (isset($_POST['payload'])) {
    $data = json_decode((string) wp_unslash($_POST['payload']), true);
} else {
    $raw_body = file_get_contents('php://input');
    $data = json_decode((string) $raw_body, true);
}
if (!is_array($data)) {
    drukulator_response(false, 'Nieprawidłowy format danych.', 400);
}

// Pole-pułapka dla prostych botów. Zwracamy sukces bez wysyłania wiadomości.
if (!empty($data['website'])) {
    drukulator_response(true, 'Wiadomość została przyjęta.', 200, array('orderId' => 'D24-OK'));
}

$privacy_accepted = !empty($data['privacyAccepted']);
if (!$privacy_accepted) {
    drukulator_response(false, 'Wymagane jest potwierdzenie polityki prywatności.', 422);
}

$customer = isset($data['customer']) && is_array($data['customer']) ? $data['customer'] : array();
$name = sanitize_text_field((string) ($customer['name'] ?? ''));
$email = sanitize_email((string) ($customer['email'] ?? ''));
$phone = sanitize_text_field((string) ($customer['phone'] ?? ''));
$pickup = sanitize_text_field((string) ($customer['pickup'] ?? 'Do ustalenia'));
$notes = sanitize_textarea_field((string) ($customer['notes'] ?? ''));
// Technology is configured per product; checkout does not require a second choice.
$production_note = 'Termin realizacji i technologia do potwierdzenia przez drukarnię.';
$delivery_address = sanitize_text_field((string) ($customer['deliveryAddress'] ?? ''));
if (strlen($delivery_address) > 220) {
    drukulator_response(false, 'Adres dostawy jest zbyt długi.', 422);
}

if ($name === '' || strlen($name) > 150) {
    drukulator_response(false, 'Podaj poprawne imię, nazwisko albo nazwę firmy.', 422);
}
if (!is_email($email)) {
    drukulator_response(false, 'Podaj poprawny adres e-mail.', 422);
}
if (strlen($phone) > 50) {
    drukulator_response(false, 'Numer telefonu jest zbyt długi.', 422);
}
if (strlen($notes) > 3000) {
    drukulator_response(false, 'Pole uwag jest zbyt długie.', 422);
}

$allowed_pickup = array('Odbiór osobisty', 'Dostawa na terenie Szczecina', 'Wysyłka kurierska (do ustalenia)');
if (!in_array($pickup, $allowed_pickup, true)) {
    drukulator_response(false, 'Nieprawidłowy sposób dostawy.', 422);
}
if ($pickup === 'Dostawa na terenie Szczecina' && strlen(trim($delivery_address)) < 5) {
    drukulator_response(false, 'Podaj adres dostawy w Szczecinie.', 422);
}
if ($pickup !== 'Dostawa na terenie Szczecina') {
    $delivery_address = '';
}

$cart = isset($data['cart']) && is_array($data['cart']) ? $data['cart'] : array();
if (count($cart) < 1 || count($cart) > 30) {
    drukulator_response(false, 'Koszyk jest pusty albo zawiera zbyt wiele pozycji.', 422);
}

$ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field((string) $_SERVER['REMOTE_ADDR']) : 'unknown';
$ip_hash = md5($ip . wp_salt('nonce'));
$cooldown_key = 'drukulator_order_cooldown_' . $ip_hash;
$hour_key = 'drukulator_order_hour_' . $ip_hash;

if (get_transient($cooldown_key)) {
    drukulator_response(false, 'Odczekaj chwilę przed ponownym wysłaniem formularza.', 429);
}

$hour_count = (int) get_transient($hour_key);
if ($hour_count >= 10) {
    drukulator_response(false, 'Przekroczono limit wiadomości. Spróbuj ponownie później.', 429);
}

$order_id = 'D24-' . wp_date('Ymd-His') . '-' . strtoupper(wp_generate_password(4, false, false));
$total = 0.0;
$order_lines = array();
$customer_order_html = array();
$stored_items = array();

foreach ($cart as $index => $item) {
    if (!is_array($item)) {
        continue;
    }

    $title = sanitize_text_field((string) ($item['title'] ?? 'Produkt'));
    $description = sanitize_textarea_field((string) ($item['description'] ?? ''));
    $price = isset($item['price']) && is_numeric($item['price']) ? (float) $item['price'] : 0.0;

    drukulator_validate_item_limits($item, $title);

    if ($price < 0 || $price > 10000000) {
        drukulator_response(false, 'Jedna z pozycji ma nieprawidłową cenę.', 422);
    }

    $total += $price;
    $order_lines[] = sprintf('%d. %s', $index + 1, $title !== '' ? $title : 'Produkt');
    if ($description !== '') {
        $order_lines[] = '   ' . str_replace("\n", "\n   ", $description);
    }

    $details = isset($item['details']) && is_array($item['details']) ? array_slice($item['details'], 0, 30) : array();
    foreach ($details as $detail) {
        if (!is_array($detail) || count($detail) < 2) {
            continue;
        }
        $label = sanitize_text_field((string) $detail[0]);
        $value = sanitize_text_field((string) $detail[1]);
        if ($label !== '' || $value !== '') {
            $order_lines[] = sprintf('   %s: %s', $label, $value);
        }
    }

    $needs_manual_price = $price === 0.0 && isset($item['meta']['requiresManualPrice']) && $item['meta']['requiresManualPrice'] === true && ($item['meta']['productType'] ?? '') === 'apparelInquiry';
    $formatted_price = $needs_manual_price ? 'do ustalenia' : number_format($price, 2, ',', ' ') . ' zł';
    $order_lines[] = '   Cena: ' . $formatted_price;
    $order_lines[] = '';

    $stored_details = array();
    foreach ($details as $detail) {
        if (!is_array($detail) || count($detail) < 2) {
            continue;
        }
        $stored_details[] = array(
            sanitize_text_field((string) $detail[0]),
            sanitize_text_field((string) $detail[1]),
        );
    }
    $stored_items[] = array(
        'title' => $title !== '' ? $title : 'Produkt',
        'description' => $description,
        'price' => $price,
        'details' => $stored_details,
    );

    $item_html = '<div style="margin:0 0 18px;padding:16px;border:1px solid #d7dee8;border-radius:10px;background:#f8fafc;">';
    $item_html .= '<div style="font-size:17px;font-weight:700;color:#111827;margin-bottom:8px;">' . esc_html(($index + 1) . '. ' . ($title !== '' ? $title : 'Produkt')) . '</div>';
    if ($description !== '') {
        $item_html .= '<div style="color:#475569;line-height:1.55;margin-bottom:10px;">' . nl2br(esc_html($description)) . '</div>';
    }
    if ($details) {
        $item_html .= '<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 10px;">';
        foreach ($details as $detail) {
            if (!is_array($detail) || count($detail) < 2) {
                continue;
            }
            $label = sanitize_text_field((string) $detail[0]);
            $value = sanitize_text_field((string) $detail[1]);
            if ($label === '' && $value === '') {
                continue;
            }
            $item_html .= '<tr>';
            $item_html .= '<td style="padding:4px 12px 4px 0;color:#64748b;vertical-align:top;">' . esc_html($label) . '</td>';
            $item_html .= '<td style="padding:4px 0;color:#111827;font-weight:600;text-align:right;vertical-align:top;">' . esc_html($value) . '</td>';
            $item_html .= '</tr>';
        }
        $item_html .= '</table>';
    }
    $item_html .= '<div style="padding-top:10px;border-top:1px solid #d7dee8;font-size:16px;font-weight:800;color:#111827;">Cena brutto: ' . esc_html($formatted_price) . '</div>';
    $item_html .= '</div>';
    $customer_order_html[] = $item_html;
}

if (!$order_lines) {
    drukulator_response(false, 'Nie udało się odczytać pozycji z koszyka.', 422);
}

$products_total = round($total, 2);

// 0.26.0: kod promocyjny — sprawdzany tu od nowa (data, limity, minimum), niezależnie od tego, co pokazała przeglądarka.
// Zniżka dotyczy wartości produktów; próg darmowej dostawy liczymy po zniżce, a limit kalkulatora przed zniżką.
$promo_code = '';
$promo_id = 0;
$promo_discount = 0.0;
$promo_label = '';
$promo_reserved = false;
if (isset($data['promoCode']) && is_string($data['promoCode']) && trim($data['promoCode']) !== '') {
    $promo_check = d24_promo_evaluate($data['promoCode'], $products_total);
    if (!$promo_check['ok']) {
        drukulator_response(false, (string) $promo_check['message'], 422, array('promoInvalid' => true));
    }
    $promo_code = (string) $promo_check['promo']['code'];
    $promo_id = (int) $promo_check['promo']['id'];
    $promo_discount = (float) $promo_check['discount'];
    $promo_label = $promo_check['promo']['discount_type'] === 'percent'
        ? rtrim(rtrim(number_format((float) $promo_check['promo']['discount_value'], 2, ',', ''), '0'), ',') . '%'
        : number_format((float) $promo_check['promo']['discount_value'], 2, ',', ' ') . ' zł';
}
$products_after_discount = round($products_total - $promo_discount, 2);
$delivery_fee = $pickup === 'Dostawa na terenie Szczecina' && $products_after_discount < 300.0 ? 20.0 : 0.0;
$limit_total = round($products_total + $delivery_fee, 2);
$total = round($products_after_discount + $delivery_fee, 2);
$delivery_note = $pickup === 'Dostawa na terenie Szczecina'
    ? ($delivery_fee > 0 ? 'Dostawa na terenie Szczecina — 20,00 zł' : 'Dostawa na terenie Szczecina — GRATIS od 300 zł produktów')
    : ($pickup === 'Wysyłka kurierska (do ustalenia)' ? 'Wysyłka kurierska — koszt do ustalenia, NIE jest zawarty w sumie' : 'Odbiór osobisty — 0,00 zł');
if ($limit_total > DRUKULATOR_MAX_ORDER_TOTAL) {
    drukulator_response(
        false,
        drukulator_limit_message('Maksymalna wartość zamówienia przez kalkulator to 5 000,00 zł brutto.'),
        422
    );
}

$upload_token = isset($data['uploadToken']) && is_string($data['uploadToken']) ? $data['uploadToken'] : '';
$attachment_data = drukulator_collect_attachments($order_id, $upload_token);
$attachments = $attachment_data['paths'];
$attachment_names = $attachment_data['names'];
$attachment_directory = $attachment_data['directory'];
// Pliki przesłane w fragmentach są dołączane bezpośrednio do e-maila.
// Pozostają w katalogu tymczasowym tylko na czas wysłania wiadomości.
if ($upload_token !== '') {
    register_shutdown_function(static function () use ($attachment_directory): void {
        drukulator_stage_remove($attachment_directory);
    });
}

if ($promo_id > 0) {
    // Jedno użycie rezerwujemy atomowo tuż przed zapisem zamówienia; przy błędzie poczty jest zwracane.
    if (!d24_promo_reserve($promo_id, $promo_discount)) {
        drukulator_response(false, 'Kod promocyjny przestał obowiązywać lub osiągnął limit użyć. Usuń go z koszyka albo wpisz inny.', 422, array('promoInvalid' => true));
    }
    $promo_reserved = true;
}

$status_token = wp_generate_password(40, false, false);
$status_saved = drukulator_orders_store(array(
    'promo_code' => $promo_code,
    'discount' => $promo_discount,
    'order_id' => $order_id,
    'total' => $total,
    'items' => $stored_items,
    'customer_name' => $name,
    'customer_email' => $email,
    'customer_phone' => $phone,
    'pickup' => $pickup,
    'notes' => trim($production_note . "\n" . $delivery_note . ($delivery_address !== '' ? "\nAdres: " . $delivery_address . ', Szczecin' : '') . ($notes !== '' ? "\n" . $notes : '')),
), $status_token);

$message_lines = array(
    'Nowe zamówienie z Drukulatora',
    'Numer zgłoszenia: ' . $order_id,
    'Data: ' . wp_date('d.m.Y H:i:s'),
    '',
    'Zamawiane produkty:',
    '',
);
$message_lines = array_merge($message_lines, $order_lines);
$message_lines[] = 'PRODUKTY BRUTTO: ' . number_format($products_total, 2, ',', ' ') . ' zł';
if ($promo_code !== '') {
    $message_lines[] = 'KOD PROMOCYJNY: ' . $promo_code . ' (' . $promo_label . ') — ZNIŻKA: -' . number_format($promo_discount, 2, ',', ' ') . ' zł';
    $message_lines[] = 'PRODUKTY PO ZNIŻCE: ' . number_format($products_after_discount, 2, ',', ' ') . ' zł';
}
$message_lines[] = $delivery_note;
$message_lines[] = 'RAZEM Z DOSTAWĄ: ' . number_format($total, 2, ',', ' ') . ' zł' . ($pickup === 'Wysyłka kurierska (do ustalenia)' ? ' (bez kosztu kuriera)' : '');
$message_lines[] = '';
$message_lines[] = 'Dane zamawiającego:';
$message_lines[] = 'Imię i nazwisko / firma: ' . $name;
$message_lines[] = 'E-mail: ' . $email;
$message_lines[] = 'Telefon: ' . ($phone !== '' ? $phone : '—');
$message_lines[] = 'Sposób odbioru: ' . $pickup;
if ($delivery_address !== '') $message_lines[] = 'Adres dostawy: ' . $delivery_address . ', Szczecin';
$message_lines[] = $production_note;

if ($notes !== '') {
    $message_lines[] = '';
    $message_lines[] = 'Uwagi:';
    $message_lines[] = $notes;
}

if ($attachment_names) {
    $message_lines[] = '';
    $message_lines[] = 'Załączone pliki:';
    foreach ($attachment_names as $file_name) {
        $message_lines[] = '- ' . $file_name;
    }
}
$message_lines[] = '';
$message_lines[] = 'Zamówienie oczekuje na potwierdzenie Druk24, wraz z ustaleniem faktycznego terminu realizacji. Nie rozpoczynaj produkcji przed akceptacją.';

$recipient = DRUKULATOR_CONTACT_EMAIL;
$subject = '[Drukulator] Nowe zamówienie ' . $order_id . ' – ' . $name;
$headers = array(
    'Content-Type: text/plain; charset=UTF-8',
    'From: Drukulator Druk24 <' . DRUKULATOR_CONTACT_EMAIL . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
);

try {
    $sent = d24_mail_send('office_order', $order_id, $recipient, $subject, implode("\n", $message_lines), $headers, $attachments);
} catch (Throwable $error) {
    error_log('[Drukulator mail] ' . $error->getMessage());
    $sent = false;
}
if (!$sent) {
    if ($status_saved) {
        drukulator_orders_delete($order_id);
    }
    if ($promo_reserved) {
        d24_promo_release($promo_id, $promo_discount);
    }
    d24_monitor_log('order_mail_failed', 'error', 'Serwer pocztowy nie przyjął wiadomości do drukarni', $order_id, array(
        'files' => count($attachment_names), 'total' => $total, 'channel' => 'office',
        'bytes' => array_sum(array_map('filesize', array_filter($attachments, 'is_file')))
    ), (int) round((microtime(true) - $order_started_at) * 1000));
    if ($upload_token !== '') {
        drukulator_stage_remove($attachment_directory);
    } else {
        drukulator_remove_attachment_directory($attachment_directory);
    }
    drukulator_response(false, 'Serwer pocztowy nie przyjął wiadomości. Spróbuj ponownie lub napisz na ' . DRUKULATOR_CONTACT_EMAIL . '.', 500);
}

d24_monitor_log('order_mail_accepted', 'info', 'Serwer przyjął e-mail z zapytaniem do drukarni', $order_id, array(
    'files' => count($attachment_names),
    'file_names' => $attachment_names,
    'bytes' => array_sum(array_map('filesize', array_filter($attachments, 'is_file'))),
    'total' => $total, 'channel' => 'office',
), (int) round((microtime(true) - $order_started_at) * 1000));
// Server-confirmed enquiry, independent of browser telemetry or page unloading.
d24_analytics_verified_order($order_id, (float) $total, $cart, $data['analyticsSession'] ?? null);
if ($promo_code !== '') {
    d24_monitor_log('promo_used', 'info', 'Zamówienie z kodem promocyjnym', $order_id, array('note' => $promo_code, 'total' => $promo_discount));
}
if (!$status_saved) {
    d24_monitor_log('order_record_failed', 'warning', 'E-mail przyjęty, ale nie zapisano zlecenia w bazie', $order_id);
}

$customer_subject = 'Potwierdzenie otrzymania zamówienia ' . $order_id . ' – Druk24';
$customer_message = '<!doctype html><html lang="pl"><head><meta charset="UTF-8"></head>';
$customer_message .= '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">';
$customer_message .= '<div style="max-width:720px;margin:0 auto;padding:28px 16px;">';
$customer_message .= '<div style="background:#ffffff;border:1px solid #d7dee8;border-radius:14px;padding:28px;">';
$customer_message .= '<h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;color:#111827;">Dziękujemy za zainteresowanie ofertą Druk24</h1>';
$customer_message .= '<p style="margin:0 0 12px;line-height:1.65;">Dzień dobry' . ($name !== '' ? ' ' . esc_html($name) : '') . ',</p>';
$customer_message .= '<p style="margin:0 0 12px;line-height:1.65;">Otrzymaliśmy Twoje zamówienie do potwierdzenia. Numer zgłoszenia: <strong>' . esc_html($order_id) . '</strong>.</p>';
$customer_message .= '<p style="margin:0 0 22px;line-height:1.65;">Przed realizacją jakichkolwiek usług potwierdzimy dostępność, płatność i czas realizacji.</p>';
$customer_message .= '<div style="margin:24px 0;padding:18px 20px;border:2px solid #088fca;border-radius:12px;background:#eff7fd;text-align:center;">';
$customer_message .= '<div style="font-size:22px;line-height:1.35;font-weight:800;color:#0f172a;">ZAMÓWIENIE OCZEKUJE NA POTWIERDZENIE DRUKARNI</div>';
$customer_message .= '<div style="margin-top:8px;font-size:15px;line-height:1.5;color:#334155;">Drukarnia skontaktuje się w sprawie ostatecznej ceny i terminu. To jeszcze nie jest zakup ani potwierdzenie rozpoczęcia produkcji.</div>';
$customer_message .= '</div>';
$customer_message .= '<p style="margin:0 0 12px;line-height:1.65;"><strong>Dostawa:</strong> ' . esc_html($delivery_note) . '.</p>';
if ($delivery_address !== '') $customer_message .= '<p style="margin:0 0 12px;line-height:1.65;"><strong>Adres:</strong> ' . esc_html($delivery_address) . ', Szczecin</p>';
$customer_message .= '<h2 style="margin:26px 0 14px;font-size:21px;color:#111827;">Podsumowanie zamówienia</h2>';
$customer_message .= implode('', $customer_order_html);
if ($promo_code !== '') {
    $customer_message .= '<div style="margin:18px 0 0;padding:14px 18px;border:1px dashed #088fca;border-radius:10px;background:#eff7fd;color:#0f172a;font-size:15px;line-height:1.6;">'
        . 'Kod promocyjny <strong>' . esc_html($promo_code) . '</strong> (' . esc_html($promo_label) . '): <strong>−' . esc_html(number_format($promo_discount, 2, ',', ' ') . ' zł') . '</strong><br>'
        . 'Produkty po zniżce: <strong>' . esc_html(number_format($products_after_discount, 2, ',', ' ') . ' zł') . '</strong></div>';
}
$customer_message .= '<div style="margin:20px 0 0;padding:16px 18px;border-radius:10px;background:#0f172a;color:#ffffff;font-size:20px;font-weight:800;text-align:right;">RAZEM Z DOSTAWĄ: ' . esc_html(number_format($total, 2, ',', ' ') . ' zł') . ($pickup === 'Wysyłka kurierska (do ustalenia)' ? ' (bez kosztu kuriera)' : '') . '</div>';
if ($attachment_names) {
    $customer_message .= '<div style="margin-top:22px;padding:16px;border:1px solid #d7dee8;border-radius:10px;"><strong>Dołączone pliki</strong><ul style="margin:8px 0 0;padding-left:20px;color:#475569;">';
    foreach ($attachment_names as $file_name) {
        $customer_message .= '<li>' . esc_html($file_name) . '</li>';
    }
    $customer_message .= '</ul></div>';
}
$customer_message .= '<div style="margin-top:26px;padding-top:20px;border-top:1px solid #d7dee8;color:#475569;line-height:1.65;">';
$customer_message .= '<strong>Zespół Druk24</strong><br>' . esc_html(DRUKULATOR_CONTACT_EMAIL);
$customer_message .= '</div></div></div></body></html>';
$customer_headers = array(
    'Content-Type: text/html; charset=UTF-8',
    'From: Druk24 <' . DRUKULATOR_CONTACT_EMAIL . '>',
    'Reply-To: Druk24 <' . DRUKULATOR_CONTACT_EMAIL . '>',
);
try {
    $confirmation_sent = d24_mail_send('customer_confirmation', $order_id, $email, $customer_subject, $customer_message, $customer_headers);
} catch (Throwable $error) {
    error_log('[Drukulator confirmation] ' . $error->getMessage());
    $confirmation_sent = false;
}

d24_monitor_log(
    $confirmation_sent ? 'confirmation_mail_accepted' : 'confirmation_mail_failed',
    $confirmation_sent ? 'info' : 'error',
    $confirmation_sent ? 'Serwer przyjął potwierdzenie dla klienta' : 'Serwer nie przyjął potwierdzenia dla klienta',
    $order_id, array('channel' => 'customer')
);

set_transient($cooldown_key, 1, 45);
set_transient($hour_key, $hour_count + 1, 3600);

if ($upload_token !== '') {
    drukulator_stage_remove($attachment_directory);
} else {
    drukulator_remove_attachment_directory($attachment_directory);
}

drukulator_response(
    true,
    $confirmation_sent
        ? 'Zapytanie przyjęte, WordPress przyjął potwierdzenie dla klienta do wysłania.'
        : 'Zapytanie przyjęte, ale WordPress nie przyjął potwierdzenia dla klienta do wysłania.',
    200,
    array(
        'orderId' => $order_id,
        'confirmationSent' => $confirmation_sent,
        'attachmentCount' => count($attachment_names),
        'promoCode' => $promo_code,
        'promoDiscount' => $promo_discount,
        'total' => $total,
    )
);
