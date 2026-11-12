<?php

declare(strict_types=1);

/**
 * Kody promocyjne Drukulatora (0.26.0v).
 *
 * Kod ustawia pracownik w panelu (zakładka „Kody promocyjne”): zniżka w % albo w zł, okres ważności,
 * opcjonalnie minimalna wartość produktów i limit użyć. Klient wpisuje kod w koszyku; serwer sprawdza go
 * ponownie przy wysyłce zamówienia (send-order.php), więc zniżki nie da się wymusić w przeglądarce.
 * Zniżka dotyczy wartości produktów (nie dostawy). Daty są w czasie strony (strefa WordPressa).
 */

const D24_PROMO_DB_VERSION = '1.0';
const D24_PROMO_MAX_AMOUNT = 5000.0;
const D24_PROMO_CODE_MIN = 3;
const D24_PROMO_CODE_MAX = 32;
const D24_PROMO_GENERIC_ERROR = 'Kod promocyjny jest nieprawidłowy lub nieaktualny.';

function d24_promo_table(): string
{
    global $wpdb;
    return $wpdb->prefix . 'drukulator_promo_codes';
}

function d24_promo_install(): bool
{
    if ((string) get_option('d24_promo_db_version', '') === D24_PROMO_DB_VERSION) {
        return true;
    }

    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $table = d24_promo_table();
    $charset = $wpdb->get_charset_collate();

    dbDelta("CREATE TABLE {$table} (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        code varchar(32) NOT NULL,
        label varchar(190) NOT NULL DEFAULT '',
        discount_type varchar(10) NOT NULL DEFAULT 'percent',
        discount_value decimal(10,2) NOT NULL DEFAULT 0,
        min_total decimal(12,2) NOT NULL DEFAULT 0,
        valid_from datetime NULL DEFAULT NULL,
        valid_to datetime NULL DEFAULT NULL,
        max_uses int(10) unsigned NULL DEFAULT NULL,
        used_count int(10) unsigned NOT NULL DEFAULT 0,
        discount_sum decimal(12,2) NOT NULL DEFAULT 0,
        active tinyint(1) NOT NULL DEFAULT 1,
        created_by varchar(160) NOT NULL DEFAULT '',
        created_at datetime NOT NULL,
        updated_at datetime NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY code (code)
    ) {$charset};");

    $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
    if ($exists !== $table) {
        return false;
    }
    update_option('d24_promo_db_version', D24_PROMO_DB_VERSION, false);
    return true;
}

/** Kod: wielkie litery, cyfry, „-” i „_”, 3–32 znaków. Zwraca '' gdy kod jest pusty albo ma niedozwolone znaki. */
function d24_promo_normalize_code(string $code): string
{
    $code = preg_replace('/\s+/u', '', $code) ?? '';
    $code = function_exists('mb_strtoupper') ? mb_strtoupper($code, 'UTF-8') : strtoupper($code);
    if (!preg_match('/^[A-Z0-9_-]{' . D24_PROMO_CODE_MIN . ',' . D24_PROMO_CODE_MAX . '}$/', $code)) {
        return '';
    }
    return $code;
}

/** Zniżka w groszach (te same reguły co w koszyku, js/app.js → promoDiscount). */
function d24_promo_discount(string $type, float $value, float $products_total): float
{
    $total_cents = (int) round($products_total * 100);
    if ($total_cents <= 0 || $value <= 0) {
        return 0.0;
    }
    $discount_cents = $type === 'percent' ? (int) round($total_cents * $value / 100.0) : (int) round($value * 100);
    $discount_cents = max(0, min($total_cents, $discount_cents));
    return $discount_cents / 100;
}

/** Wiersz z bazy → postać do panelu / odpowiedzi; status liczony względem „teraz” (czas strony). */
function d24_promo_row(array $row, ?string $now = null): array
{
    $now = $now ?? (string) current_time('mysql');
    $from = (string) ($row['valid_from'] ?? '');
    $to = (string) ($row['valid_to'] ?? '');
    $max_uses = $row['max_uses'] === null || $row['max_uses'] === '' ? null : (int) $row['max_uses'];
    $used = (int) ($row['used_count'] ?? 0);
    $status = 'active';
    if (empty($row['active'])) {
        $status = 'disabled';
    } elseif ($from !== '' && $now < $from) {
        $status = 'scheduled';
    } elseif ($to !== '' && $now > $to) {
        $status = 'expired';
    } elseif ($max_uses !== null && $used >= $max_uses) {
        $status = 'exhausted';
    }
    return array(
        'id' => (int) $row['id'],
        'code' => (string) $row['code'],
        'label' => (string) ($row['label'] ?? ''),
        'discount_type' => (string) $row['discount_type'] === 'amount' ? 'amount' : 'percent',
        'discount_value' => (float) $row['discount_value'],
        'min_total' => (float) ($row['min_total'] ?? 0),
        'valid_from' => $from !== '' ? substr($from, 0, 10) : '',
        'valid_to' => $to !== '' ? substr($to, 0, 10) : '',
        'max_uses' => $max_uses,
        'used_count' => $used,
        'discount_sum' => (float) ($row['discount_sum'] ?? 0),
        'active' => !empty($row['active']),
        'status' => $status,
        'created_by' => (string) ($row['created_by'] ?? ''),
        'created_at' => (string) ($row['created_at'] ?? ''),
        'updated_at' => (string) ($row['updated_at'] ?? ''),
    );
}

function d24_promo_list(): array
{
    if (!d24_promo_install()) {
        return array();
    }
    global $wpdb;
    $table = d24_promo_table();
    $rows = $wpdb->get_results("SELECT * FROM {$table} ORDER BY id DESC LIMIT 500", ARRAY_A);
    $now = (string) current_time('mysql');
    return array_map(static function (array $row) use ($now): array {
        return d24_promo_row($row, $now);
    }, is_array($rows) ? $rows : array());
}

function d24_promo_find_by_code(string $code): ?array
{
    if ($code === '' || !d24_promo_install()) {
        return null;
    }
    global $wpdb;
    $table = d24_promo_table();
    $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE code = %s LIMIT 1", $code), ARRAY_A);
    return is_array($row) ? $row : null;
}

/**
 * Sprawdza kod dla danej wartości produktów.
 * Zwraca: ok, message, reason ('' | invalid | min_total), promo (wiersz w postaci d24_promo_row), discount.
 * Dla nieznanego, wyłączonego, nieaktywnego jeszcze, wygasłego i wyczerpanego kodu komunikat jest taki sam
 * (nie zdradzamy, które kody istnieją).
 */
function d24_promo_evaluate(string $input_code, float $products_total): array
{
    $fail = static function (string $reason, string $message): array {
        return array('ok' => false, 'reason' => $reason, 'message' => $message, 'promo' => null, 'discount' => 0.0);
    };
    $code = d24_promo_normalize_code($input_code);
    if ($code === '') {
        return $fail('invalid', D24_PROMO_GENERIC_ERROR);
    }
    $row = d24_promo_find_by_code($code);
    if (!$row) {
        return $fail('invalid', D24_PROMO_GENERIC_ERROR);
    }
    $promo = d24_promo_row($row);
    if ($promo['status'] !== 'active') {
        return $fail('invalid', D24_PROMO_GENERIC_ERROR);
    }
    if ($promo['min_total'] > 0 && round($products_total, 2) < $promo['min_total']) {
        return $fail('min_total', 'Ten kod obowiązuje przy wartości produktów od ' . number_format($promo['min_total'], 2, ',', ' ') . ' zł.');
    }
    $discount = d24_promo_discount($promo['discount_type'], $promo['discount_value'], $products_total);
    return array('ok' => true, 'reason' => '', 'message' => 'Kod promocyjny został zastosowany.', 'promo' => $promo, 'discount' => $discount);
}

/** Rezerwuje jedno użycie (atomowo, z kontrolą limitu). */
function d24_promo_reserve(int $id, float $discount): bool
{
    global $wpdb;
    $table = d24_promo_table();
    $now = (string) current_time('mysql');
    $changed = $wpdb->query($wpdb->prepare(
        "UPDATE {$table} SET used_count = used_count + 1, discount_sum = discount_sum + %f WHERE id = %d AND active = 1 AND (max_uses IS NULL OR used_count < max_uses) AND (valid_to IS NULL OR valid_to >= %s) AND (valid_from IS NULL OR valid_from <= %s)",
        $discount,
        $id,
        $now,
        $now
    ));
    return (int) $changed === 1;
}

/** Oddaje użycie, gdy zamówienie nie zostało przyjęte (np. błąd poczty). */
function d24_promo_release(int $id, float $discount): void
{
    global $wpdb;
    $table = d24_promo_table();
    $wpdb->query($wpdb->prepare(
        "UPDATE {$table} SET used_count = CASE WHEN used_count > 0 THEN used_count - 1 ELSE 0 END, discount_sum = CASE WHEN discount_sum >= %f THEN discount_sum - %f ELSE 0 END WHERE id = %d",
        $discount,
        $discount,
        $id
    ));
}

function d24_promo_valid_date(string $date): bool
{
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $m)) {
        return false;
    }
    return checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
}

/**
 * Tworzy albo aktualizuje kod. $input: id (puste = nowy), code (tylko przy tworzeniu), label, discount_type,
 * discount_value, min_total, valid_from, valid_to (RRRR-MM-DD albo puste), max_uses (puste = bez limitu), active.
 * Zwraca [ok, message, id].
 */
function d24_promo_save(array $input, string $actor): array
{
    if (!d24_promo_install()) {
        return array(false, 'Nie udało się przygotować tabeli kodów w bazie.', 0);
    }
    global $wpdb;
    $table = d24_promo_table();
    $id = (int) ($input['id'] ?? 0);

    $type = (string) ($input['discount_type'] ?? 'percent');
    if (!in_array($type, array('percent', 'amount'), true)) {
        return array(false, 'Wybierz rodzaj zniżki: procent albo kwota.', 0);
    }
    $value_raw = str_replace(',', '.', trim((string) ($input['discount_value'] ?? '')));
    if ($value_raw === '' || !is_numeric($value_raw)) {
        return array(false, 'Podaj wysokość zniżki.', 0);
    }
    $value = round((float) $value_raw, 2);
    if ($type === 'percent' && ($value < 0.01 || $value > 100.0)) {
        return array(false, 'Zniżka procentowa musi mieścić się w zakresie 0,01–100%.', 0);
    }
    if ($type === 'amount' && ($value < 0.01 || $value > D24_PROMO_MAX_AMOUNT)) {
        return array(false, 'Zniżka kwotowa musi mieścić się w zakresie 0,01–5 000 zł.', 0);
    }

    $min_raw = str_replace(',', '.', trim((string) ($input['min_total'] ?? '')));
    $min_total = $min_raw === '' ? 0.0 : (is_numeric($min_raw) ? round((float) $min_raw, 2) : -1.0);
    if ($min_total < 0 || $min_total > 100000) {
        return array(false, 'Minimalna wartość zamówienia musi być liczbą od 0 do 100 000 zł.', 0);
    }

    $from = trim((string) ($input['valid_from'] ?? ''));
    $to = trim((string) ($input['valid_to'] ?? ''));
    if (($from !== '' && !d24_promo_valid_date($from)) || ($to !== '' && !d24_promo_valid_date($to))) {
        return array(false, 'Daty ważności podaj w formacie RRRR-MM-DD.', 0);
    }
    if ($from !== '' && $to !== '' && $from > $to) {
        return array(false, 'Data „ważny do” nie może być wcześniejsza niż „ważny od”.', 0);
    }
    $valid_from = $from !== '' ? $from . ' 00:00:00' : null;
    $valid_to = $to !== '' ? $to . ' 23:59:59' : null;

    $max_raw = trim((string) ($input['max_uses'] ?? ''));
    $max_uses = null;
    if ($max_raw !== '') {
        if (!ctype_digit($max_raw) || (int) $max_raw < 1 || (int) $max_raw > 1000000) {
            return array(false, 'Limit użyć musi być liczbą całkowitą od 1 do 1 000 000 (albo puste = bez limitu).', 0);
        }
        $max_uses = (int) $max_raw;
    }

    $label = function_exists('sanitize_text_field') ? sanitize_text_field((string) ($input['label'] ?? '')) : trim((string) ($input['label'] ?? ''));
    $label = function_exists('mb_substr') ? mb_substr($label, 0, 190, 'UTF-8') : substr($label, 0, 190);
    $active = !empty($input['active']) ? 1 : 0;
    $now = (string) current_time('mysql');

    $data = array(
        'label' => $label,
        'discount_type' => $type,
        'discount_value' => $value,
        'min_total' => $min_total,
        'valid_from' => $valid_from,
        'valid_to' => $valid_to,
        'max_uses' => $max_uses,
        'active' => $active,
        'updated_at' => $now,
    );

    if ($id > 0) {
        $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE id = %d", $id));
        if (!$exists) {
            return array(false, 'Nie znaleziono kodu.', 0);
        }
        $set = array();
        foreach ($data as $column => $v) {
            $set[] = $column . ' = ' . ($v === null ? 'NULL' : (is_int($v) || is_float($v) ? (string) $v : $wpdb->prepare('%s', $v)));
        }
        $wpdb->query("UPDATE {$table} SET " . implode(', ', $set) . ' WHERE id = ' . (int) $id);
        return array(true, 'Zapisano zmiany kodu.', $id);
    }

    $code = d24_promo_normalize_code((string) ($input['code'] ?? ''));
    if ($code === '') {
        return array(false, 'Kod: 3–32 znaków — litery bez polskich znaków, cyfry, „-” lub „_”.', 0);
    }
    if (d24_promo_find_by_code($code)) {
        return array(false, 'Kod „' . $code . '” już istnieje. Wybierz inną nazwę albo edytuj istniejący kod.', 0);
    }
    $columns = array('code', 'created_by', 'created_at');
    $values = array($wpdb->prepare('%s', $code), $wpdb->prepare('%s', function_exists('mb_substr') ? mb_substr($actor, 0, 160, 'UTF-8') : substr($actor, 0, 160)), $wpdb->prepare('%s', $now));
    foreach ($data as $column => $v) {
        $columns[] = $column;
        $values[] = $v === null ? 'NULL' : (is_int($v) || is_float($v) ? (string) $v : $wpdb->prepare('%s', $v));
    }
    $inserted = $wpdb->query("INSERT INTO {$table} (" . implode(', ', $columns) . ') VALUES (' . implode(', ', $values) . ')');
    if ($inserted === false) {
        return array(false, 'Nie udało się zapisać kodu.', 0);
    }
    $new_id = (int) $wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE code = %s", $code));
    return array(true, 'Kod „' . $code . '” został utworzony.', $new_id);
}

function d24_promo_set_active(int $id, bool $active): bool
{
    if (!d24_promo_install()) {
        return false;
    }
    global $wpdb;
    $table = d24_promo_table();
    $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE id = %d", $id));
    if (!$exists) {
        return false;
    }
    $wpdb->query($wpdb->prepare("UPDATE {$table} SET active = %d, updated_at = %s WHERE id = %d", $active ? 1 : 0, (string) current_time('mysql'), $id));
    return true;
}

function d24_promo_delete(int $id): bool
{
    if (!d24_promo_install()) {
        return false;
    }
    global $wpdb;
    $table = d24_promo_table();
    $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE id = %d", $id));
    if (!$exists) {
        return false;
    }
    $wpdb->query($wpdb->prepare("DELETE FROM {$table} WHERE id = %d", $id));
    return true;
}

/**
 * Ogranicza zgadywanie kodów: do 30 punktów na 10 minut z jednego adresu IP. Każde sprawdzenie kosztuje 1 punkt,
 * a błędny kod dodatkowe 2 (d24_promo_rate_penalty). Zwraca false, gdy limit jest wyczerpany.
 */
function d24_promo_rate_check(string $ip_hash): bool
{
    $key = 'd24_promo_rate_' . substr($ip_hash, 0, 32);
    $count = (int) get_transient($key);
    if ($count >= 30) {
        return false;
    }
    set_transient($key, $count + 1, 600);
    return true;
}

function d24_promo_rate_penalty(string $ip_hash): void
{
    $key = 'd24_promo_rate_' . substr($ip_hash, 0, 32);
    set_transient($key, (int) get_transient($key) + 2, 600);
}
