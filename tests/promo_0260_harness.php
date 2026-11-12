<?php
// 0.26.0: test promo-lib.php i zapisu zamówienia z kodem (order-status-lib.php) na atrapie WordPressa (SQLite zamiast MySQL).
// Uruchamiany z tests/promo_0260.py: php promo_0260_harness.php <katalog-kalkulatora>
declare(strict_types=1);
$stub = sys_get_temp_dir() . '/d24_wp_stub_promo_' . getmypid() . '/';
@mkdir($stub . 'wp-admin/includes', 0777, true);
file_put_contents($stub . 'wp-admin/includes/upgrade.php', "<?php\n");   // dbDelta() jest atrapą poniżej
define('ABSPATH', $stub);
const DAY_IN_SECONDS = 86400; const HOUR_IN_SECONDS = 3600; const ARRAY_A = 'ARRAY_A';
date_default_timezone_set('UTC');
$GLOBALS['d24_opts'] = array(); $GLOBALS['d24_transients'] = array(); $GLOBALS['d24_now'] = '2026-11-12 12:00:00';
function get_option($k, $d = false) { return $GLOBALS['d24_opts'][$k] ?? $d; }
function update_option($k, $v, $autoload = null) { $GLOBALS['d24_opts'][$k] = $v; return true; }
function get_transient($k) { return $GLOBALS['d24_transients'][$k] ?? false; }
function set_transient($k, $v, $ttl = 0) { $GLOBALS['d24_transients'][$k] = $v; return true; }
function wp_salt($s = 'auth') { return 'test-salt-' . $s; }
function wp_timezone() { return new DateTimeZone('Europe/Warsaw'); }
function current_time($type, $gmt = 0) { return $GLOBALS['d24_now']; }
function sanitize_text_field($s) { return trim(strip_tags((string) $s)); }
function sanitize_textarea_field($s) { return trim(strip_tags((string) $s)); }
function wp_json_encode($v, $flags = 0) { return json_encode($v, $flags); }

/** Atrapa $wpdb: prepare (%s %d %f), insert w semantyce WordPressa (formaty kolejno po kolumnach), query zwraca liczbę zmienionych wierszy. */
class FakeWpdb {
    public string $prefix = 'wp_'; public PDO $pdo;
    function __construct() { $this->pdo = new PDO('sqlite::memory:'); $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); }
    function get_charset_collate() { return ''; }
    function prepare($sql, ...$args) {
        $i = 0;
        return preg_replace_callback('/%[sdf]/', function ($m) use (&$i, $args) {
            if (!array_key_exists($i, $args)) throw new Exception('prepare: za mało argumentów w ' . $sql);
            $v = $args[$i++];
            if ($m[0] === '%d') return (string) (int) $v;
            if ($m[0] === '%f') return rtrim(rtrim(sprintf('%.8F', (float) $v), '0'), '.') ?: '0';
            return $this->pdo->quote((string) $v);
        }, $sql);
    }
    /** Jak wpdb::insert: format dla kolumny = kolejny element tablicy; po wyczerpaniu — pierwszy; NULL jako NULL (ale zużywa format). */
    function insert($table, $data, $formats = null) {
        $formats = (array) $formats; $orig = $formats; $cols = array(); $vals = array();
        foreach ($data as $field => $value) {
            $fmt = array_shift($formats);
            if (!$fmt) $fmt = reset($orig) ?: '%s';
            $cols[] = $field;
            if ($value === null) { $vals[] = 'NULL'; continue; }
            $vals[] = $this->prepare($fmt, $value);
        }
        return $this->pdo->exec("INSERT INTO {$table} (" . implode(', ', $cols) . ') VALUES (' . implode(', ', $vals) . ')');
    }
    function query($sql) { return $this->pdo->exec((string) $sql); }
    function get_var($sql) {
        if (preg_match("/^SHOW TABLES LIKE '(.+)'$/", (string) $sql, $m)) {
            $r = $this->pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name=" . $this->pdo->quote($m[1]))->fetchColumn();
            return $r === false ? null : $r;
        }
        $r = $this->pdo->query((string) $sql)->fetchColumn();
        return $r === false ? null : $r;
    }
    function get_row($sql, $mode = null) { $r = $this->pdo->query((string) $sql)->fetch(PDO::FETCH_ASSOC); return $r === false ? null : $r; }
    function get_results($sql, $mode = null) { return $this->pdo->query((string) $sql)->fetchAll(PDO::FETCH_ASSOC); }
}
$wpdb = new FakeWpdb();
// dbDelta: tworzy tabelę (z kluczami unikalnymi) albo dodaje brakujące kolumny jak dbDelta dla istniejącej tabeli.
function dbDelta($sql) {
    global $wpdb;
    if (!preg_match('/CREATE TABLE (\S+) \((.*)\)\s*;?\s*$/s', $sql, $m)) throw new Exception('dbDelta: nie rozpoznano ' . $sql);
    $table = $m[1]; $columns = array(); $keys = array(); $unique = array(); $auto = false;
    foreach (preg_split('/,\s*\n/', trim($m[2])) as $line) {
        $line = trim($line);
        if ($line === '') continue;
        if (preg_match('/^PRIMARY KEY\s+\((.+)\)$/i', $line, $k)) { $keys[] = 'PRIMARY KEY (' . $k[1] . ')'; continue; }
        if (preg_match('/^UNIQUE KEY\s+(\w+)\s+\((.+)\)$/i', $line, $k)) { $unique[] = array($k[1], $k[2]); continue; }
        if (preg_match('/^KEY\s/i', $line)) continue;
        $line = preg_replace('/\s+unsigned\b/i', '', $line);   // SQLite nie zna „unsigned”
        if (stripos($line, 'AUTO_INCREMENT') !== false) { preg_match('/^(\w+)\s/', $line, $c); $columns[$c[1]] = $c[1] . ' INTEGER PRIMARY KEY AUTOINCREMENT'; $auto = true; continue; }
        preg_match('/^(\w+)\s+(.*)$/', $line, $c); $columns[$c[1]] = $line;
    }
    if ($auto) $keys = array_values(array_filter($keys, fn($k) => stripos($k, 'PRIMARY KEY') !== 0));
    $exists = $wpdb->pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name=" . $wpdb->pdo->quote($table))->fetchColumn();
    if (!$exists) {
        $wpdb->pdo->exec("CREATE TABLE {$table} (" . implode(', ', array_merge(array_values($columns), $keys)) . ')');
    } else {
        $have = array_column($wpdb->pdo->query("PRAGMA table_info({$table})")->fetchAll(PDO::FETCH_ASSOC), 'name');
        foreach ($columns as $name => $def) if (!in_array($name, $have, true)) $wpdb->pdo->exec("ALTER TABLE {$table} ADD COLUMN {$def}");
    }
    foreach ($unique as [$name, $cols]) $wpdb->pdo->exec("CREATE UNIQUE INDEX IF NOT EXISTS ux_{$table}_{$name} ON {$table} ({$cols})");
}
function ok(bool $c, string $msg): void { if (!$c) { fwrite(STDERR, "FAIL: $msg\n"); exit(1); } }
function eq($a, $b, string $msg): void { if ($a !== $b) { fwrite(STDERR, "FAIL: $msg\n  jest:   " . json_encode($a, JSON_UNESCAPED_UNICODE) . "\n  oczek.: " . json_encode($b, JSON_UNESCAPED_UNICODE) . "\n"); exit(1); } }
function feq(float $a, float $b, string $msg): void { if (abs($a - $b) > 0.0001) { fwrite(STDERR, "FAIL: $msg  jest: $a oczek.: $b\n"); exit(1); } }
function now(string $t): void { $GLOBALS['d24_now'] = $t; }
function row(int $id): array { global $wpdb; return $wpdb->get_row('SELECT * FROM wp_drukulator_promo_codes WHERE id = ' . $id, ARRAY_A); }

$root = $argv[1];
require_once $root . '/promo-lib.php';

// ---- 1. instalacja ----
ok(d24_promo_install(), 'install');
eq(get_option('d24_promo_db_version'), D24_PROMO_DB_VERSION, 'wersja bazy kodów');
ok(d24_promo_install(), 'install drugi raz (bez zmian)');
eq(d24_promo_list(), array(), 'pusta lista');

// ---- 2. normalizacja kodu ----
eq(d24_promo_normalize_code(' wiosna10 '), 'WIOSNA10', 'trim + wielkie litery');
eq(d24_promo_normalize_code('a b c'), 'ABC', 'spacje usuwane');
eq(d24_promo_normalize_code('ab'), '', 'za krótki');
eq(d24_promo_normalize_code(str_repeat('A', 33)), '', 'za długi');
eq(d24_promo_normalize_code(str_repeat('A', 32)), str_repeat('A', 32), '32 znaki ok');
eq(d24_promo_normalize_code('zażółć'), '', 'polskie znaki niedozwolone');
eq(d24_promo_normalize_code("A'; DROP TABLE x;--"), '', 'znaki specjalne niedozwolone');
eq(d24_promo_normalize_code('lato-2026_a'), 'LATO-2026_A', 'myślnik i podkreślnik dozwolone');

// ---- 3. matematyka zniżki (te same przypadki sprawdza przeglądarka: promo_0260_browser.py) ----
foreach (json_decode(file_get_contents(__DIR__ . '/promo_0260_cases.json'), true) as $c) {
    feq(d24_promo_discount($c['type'], (float) $c['value'], (float) $c['total']), (float) $c['expected'], 'zniżka ' . json_encode($c));
}

// ---- 4. tworzenie i walidacja zapisu ----
[$okA, $msgA, $idA] = d24_promo_save(array('code' => 'wiosna10', 'label' => 'Kampania <b>wiosenna</b>', 'discount_type' => 'percent', 'discount_value' => '10', 'valid_from' => '2026-11-01', 'valid_to' => '2026-12-31', 'min_total' => '', 'max_uses' => '', 'active' => true), 'Anna');
ok($okA && $idA > 0, 'utworzenie kodu: ' . $msgA);
$rowA = d24_promo_row(row($idA));
eq($rowA['code'], 'WIOSNA10', 'kod zapisany wielkimi literami');
eq($rowA['label'], 'Kampania wiosenna', 'etykieta bez HTML');
eq($rowA['valid_from'], '2026-11-01', 'data od'); eq($rowA['valid_to'], '2026-12-31', 'data do');
eq($rowA['max_uses'], null, 'brak limitu użyć'); feq($rowA['min_total'], 0.0, 'brak minimum'); eq($rowA['created_by'], 'Anna', 'autor');
eq(row($idA)['valid_to'], '2026-12-31 23:59:59', 'koniec dnia w bazie'); eq(row($idA)['valid_from'], '2026-11-01 00:00:00', 'początek dnia w bazie');

$bad = array(
    'duplikat' => array(array('code' => 'WIOSNA10', 'discount_type' => 'percent', 'discount_value' => '5'), 'już istnieje'),
    'kod za krótki' => array(array('code' => 'ab', 'discount_type' => 'percent', 'discount_value' => '5'), '3–32'),
    'procent > 100' => array(array('code' => 'PROC101', 'discount_type' => 'percent', 'discount_value' => '100,5'), '0,01–100%'),
    'procent 0' => array(array('code' => 'PROC0', 'discount_type' => 'percent', 'discount_value' => '0'), '0,01–100%'),
    'kwota 0' => array(array('code' => 'KWOTA0', 'discount_type' => 'amount', 'discount_value' => '0'), '0,01–5 000'),
    'kwota za duża' => array(array('code' => 'KWOTA9', 'discount_type' => 'amount', 'discount_value' => '5000,01'), '0,01–5 000'),
    'brak wartości' => array(array('code' => 'BRAKW', 'discount_type' => 'percent', 'discount_value' => ''), 'wysokość'),
    'tekst zamiast liczby' => array(array('code' => 'TEKST1', 'discount_type' => 'percent', 'discount_value' => 'dużo'), 'wysokość'),
    'zły rodzaj' => array(array('code' => 'RODZAJ', 'discount_type' => 'free', 'discount_value' => '5'), 'rodzaj'),
    'zła data' => array(array('code' => 'DATA1', 'discount_type' => 'percent', 'discount_value' => '5', 'valid_to' => '2026-02-30'), 'RRRR-MM-DD'),
    'data od > do' => array(array('code' => 'DATA2', 'discount_type' => 'percent', 'discount_value' => '5', 'valid_from' => '2026-12-31', 'valid_to' => '2026-12-01'), 'wcześniejsza'),
    'limit użyć 0' => array(array('code' => 'LIM0', 'discount_type' => 'percent', 'discount_value' => '5', 'max_uses' => '0'), 'Limit użyć'),
    'limit użyć ułamek' => array(array('code' => 'LIM15', 'discount_type' => 'percent', 'discount_value' => '5', 'max_uses' => '1.5'), 'Limit użyć'),
    'minimum ujemne' => array(array('code' => 'MINUS', 'discount_type' => 'percent', 'discount_value' => '5', 'min_total' => '-1'), 'Minimalna'),
);
foreach ($bad as $name => [$input, $needle]) {
    [$okB, $msgB] = d24_promo_save($input, 'Anna');
    ok(!$okB && str_contains($msgB, $needle), "walidacja „{$name}”: {$msgB}");
}
eq(count(d24_promo_list()), 1, 'żaden błędny kod nie trafił do bazy');

// przecinek dziesiętny + kwota + minimum + limit
[$okB, , $idB] = d24_promo_save(array('code' => 'RABAT25', 'discount_type' => 'amount', 'discount_value' => '25,50', 'min_total' => '100,00', 'max_uses' => '2', 'active' => true), 'Anna');
ok($okB, 'kod kwotowy z przecinkiem');
$rowB = d24_promo_row(row($idB));
feq($rowB['discount_value'], 25.5, 'kwota 25,50'); feq($rowB['min_total'], 100.0, 'minimum 100'); eq($rowB['max_uses'], 2, 'limit użyć 2'); eq($rowB['valid_from'], '', 'bez daty od'); eq($rowB['valid_to'], '', 'bez daty do');

// ---- 5. weryfikacja: okres ważności (czas strony), granice dnia ----
$generic = D24_PROMO_GENERIC_ERROR;
now('2026-10-31 23:59:59'); $r = d24_promo_evaluate('WIOSNA10', 100.0);
ok(!$r['ok'] && $r['message'] === $generic, 'przed startem: ogólny komunikat');
now('2026-10-31 23:59:59'); eq(d24_promo_row(row($idA))['status'], 'scheduled', 'status: zaplanowany');
now('2026-11-01 00:00:00'); $r = d24_promo_evaluate('wiosna10', 250.0);
ok($r['ok'], 'start o północy, kod małymi literami'); feq($r['discount'], 25.0, '10% z 250'); eq($r['promo']['code'], 'WIOSNA10', 'zwrócony kod');
now('2026-12-31 23:59:59'); ok(d24_promo_evaluate('WIOSNA10', 100.0)['ok'], 'ostatnia sekunda dnia „do” jeszcze działa');
now('2027-01-01 00:00:00'); $r = d24_promo_evaluate('WIOSNA10', 100.0);
ok(!$r['ok'] && $r['message'] === $generic, 'po terminie: ogólny komunikat'); eq(d24_promo_row(row($idA))['status'], 'expired', 'status: wygasł');
now('2026-11-12 12:00:00');
// nieznany kod, pusty, niedozwolone znaki → ten sam komunikat (brak zdradzania, które kody istnieją)
foreach (array('NIEMA123', '', 'zażółć', "x'--") as $code) { $r = d24_promo_evaluate($code, 100.0); ok(!$r['ok'] && $r['message'] === $generic && $r['reason'] === 'invalid', 'nieznany kod: ' . $code); }

// ---- 6. minimum wartości, kwota ograniczona do wartości produktów ----
$r = d24_promo_evaluate('RABAT25', 99.99);
ok(!$r['ok'] && $r['reason'] === 'min_total' && str_contains($r['message'], '100,00 zł'), 'poniżej minimum: ' . $r['message']);
$r = d24_promo_evaluate('RABAT25', 100.0); ok($r['ok'], 'dokładnie minimum'); feq($r['discount'], 25.5, 'kwota 25,50');
d24_promo_save(array('id' => $idB, 'discount_type' => 'amount', 'discount_value' => '200', 'min_total' => '', 'max_uses' => '2', 'active' => true), 'Anna');
$r = d24_promo_evaluate('RABAT25', 80.0); ok($r['ok'], 'bez minimum po edycji'); feq($r['discount'], 80.0, 'zniżka nie większa niż produkty');
eq(row($idB)['code'], 'RABAT25', 'edycja nie zmienia kodu'); eq((int) row($idB)['used_count'], 0, 'licznik nietknięty');

// ---- 7. rezerwacja użyć i zwrot ----
ok(d24_promo_reserve($idB, 10.0), 'użycie 1'); ok(d24_promo_reserve($idB, 5.5), 'użycie 2');
ok(!d24_promo_reserve($idB, 1.0), 'użycie 3 odrzucone (limit 2)');
$rb = d24_promo_row(row($idB)); eq($rb['used_count'], 2, 'użyto 2'); feq($rb['discount_sum'], 15.5, 'suma zniżek'); eq($rb['status'], 'exhausted', 'status: wyczerpany');
$r = d24_promo_evaluate('RABAT25', 100.0); ok(!$r['ok'] && $r['message'] === $generic, 'wyczerpany kod: ogólny komunikat');
d24_promo_release($idB, 5.5);
$rb = d24_promo_row(row($idB)); eq($rb['used_count'], 1, 'po zwrocie użyto 1'); feq($rb['discount_sum'], 10.0, 'suma po zwrocie'); eq($rb['status'], 'active', 'status znów aktywny');
d24_promo_release($idB, 10.0); d24_promo_release($idB, 10.0);
$rb = d24_promo_row(row($idB)); eq($rb['used_count'], 0, 'licznik nie schodzi poniżej zera'); feq($rb['discount_sum'], 0.0, 'suma nie schodzi poniżej zera');
now('2027-02-01 10:00:00'); ok(!d24_promo_reserve($idA, 1.0), 'nie da się zarezerwować wygasłego kodu'); now('2026-11-12 12:00:00');

// ---- 8. włączanie / wyłączanie / usuwanie ----
ok(d24_promo_set_active($idA, false), 'wyłączenie'); eq(d24_promo_row(row($idA))['status'], 'disabled', 'status: wyłączony');
$r = d24_promo_evaluate('WIOSNA10', 100.0); ok(!$r['ok'] && $r['message'] === $generic, 'wyłączony: ogólny komunikat');
ok(!d24_promo_reserve($idA, 1.0), 'wyłączonego nie da się użyć');
ok(d24_promo_set_active($idA, true), 'włączenie'); ok(d24_promo_evaluate('WIOSNA10', 100.0)['ok'], 'znów działa');
ok(!d24_promo_set_active(9999, true), 'nieistniejący kod'); ok(!d24_promo_delete(9999), 'usuwanie nieistniejącego');
// zapis z active=false nie włącza kodu, zapis z active=true go włącza
d24_promo_save(array('id' => $idA, 'discount_type' => 'percent', 'discount_value' => '10', 'valid_from' => '2026-11-01', 'valid_to' => '2026-12-31', 'active' => false), 'Anna');
eq(d24_promo_row(row($idA))['active'], false, 'edycja z wyłączeniem');
d24_promo_save(array('id' => $idA, 'discount_type' => 'percent', 'discount_value' => '12,5', 'valid_from' => '', 'valid_to' => '2026-12-31', 'active' => true), 'Anna');
$ra = d24_promo_row(row($idA)); feq($ra['discount_value'], 12.5, 'edycja wartości'); eq($ra['valid_from'], '', 'wyczyszczona data od'); eq($ra['active'], true, 'włączony po edycji');
ok(d24_promo_delete($idB), 'usunięcie'); eq(count(d24_promo_list()), 1, 'po usunięciu został jeden kod'); eq(d24_promo_list()[0]['code'], 'WIOSNA10', 'lista');

// ---- 9. ograniczenie liczby prób ----
$ip = md5('1.2.3.4');
for ($i = 0; $i < 30; $i++) ok(d24_promo_rate_check($ip), "próba $i dozwolona");
ok(!d24_promo_rate_check($ip), 'próba 31 zablokowana');
$ip2 = md5('5.6.7.8'); d24_promo_rate_check($ip2); d24_promo_rate_penalty($ip2);
eq(get_transient('d24_promo_rate_' . substr($ip2, 0, 32)), 3, 'kara za błędny kod: +2 punkty');

// ---- 10. zamówienie z kodem: kolumny, formaty (internal_note nie może dostać „0”) ----
require_once $root . '/order-status-lib.php';
ok(drukulator_orders_install(), 'install zamówień');
eq(get_option('drukulator_orders_db_version'), '1.4', 'wersja bazy zamówień 1.4');
ok(drukulator_orders_store(array(
    'order_id' => 'D24-TEST-1', 'total' => 270.0, 'items' => array(array('title' => 'Ulotki', 'price' => 300.0)), 'customer_name' => 'Jan', 'customer_email' => 'jan@example.com',
    'customer_phone' => '500', 'pickup' => 'Odbiór osobisty', 'notes' => 'Uwaga', 'promo_code' => 'WIOSNA10', 'discount' => 30.0,
), 'token-1'), 'zapis zamówienia z kodem');
ok(drukulator_orders_store(array('order_id' => 'D24-TEST-2', 'total' => 50.0, 'items' => array(), 'customer_name' => 'Ola', 'customer_email' => 'ola@example.com', 'pickup' => 'Odbiór osobisty'), 'token-2'), 'zapis zamówienia bez kodu');
$o1 = drukulator_orders_get('D24-TEST-1'); $o2 = drukulator_orders_get('D24-TEST-2');
eq($o1['promo_code'], 'WIOSNA10', 'kod zapisany w zamówieniu'); feq((float) $o1['discount'], 30.0, 'zniżka zapisana w zamówieniu'); feq((float) $o1['total'], 270.0, 'kwota po zniżce');
eq($o2['promo_code'], '', 'zamówienie bez kodu: pusty kod'); feq((float) $o2['discount'], 0.0, 'zamówienie bez kodu: zniżka 0');
eq($o1['internal_note'], '', 'notatka wewnętrzna pusta (nie „0”)'); eq($o1['public_note'], '', 'notatka publiczna pusta'); eq($o1['order_name'], '', 'nazwa pusta');
eq($o1['assigned_staff_id'], null, 'brak przypisanego pracownika'); eq($o1['assigned_name'], '', 'brak nazwy przypisanego'); eq($o1['status'], 'received', 'status');
ok(str_starts_with((string) $o1['created_at'], '2026-11-12'), 'data utworzenia'); eq($o1['customer_name'], 'Jan', 'klient'); eq($o1['notes'], 'Uwaga', 'uwagi');
$list = drukulator_orders_list(10); eq(count($list), 2, 'lista zamówień'); $byId = array_column($list, null, 'order_id');
eq($byId['D24-TEST-1']['promo_code'], 'WIOSNA10', 'lista: kod'); feq($byId['D24-TEST-1']['discount'], 30.0, 'lista: zniżka'); eq($byId['D24-TEST-2']['promo_code'], '', 'lista: pusty kod');

// ---- 11. aktualizacja bazy zamówień z 1.3 (bez kolumn kodu, internal_note = „0”) ----
$GLOBALS['d24_opts'] = array(); $wpdb = new FakeWpdb();
$wpdb->pdo->exec("CREATE TABLE wp_drukulator_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id varchar(64) NOT NULL, access_hash char(64) NOT NULL, status varchar(32) NOT NULL DEFAULT 'received', total decimal(12,2) NOT NULL DEFAULT 0, items longtext NOT NULL, customer_name varchar(190) NOT NULL DEFAULT '', customer_email varchar(190) NOT NULL DEFAULT '', customer_phone varchar(80) NOT NULL DEFAULT '', pickup varchar(120) NOT NULL DEFAULT '', notes text NOT NULL, public_note text NOT NULL, order_name varchar(190) NOT NULL DEFAULT '', internal_note text NOT NULL, assigned_staff_id bigint(20) NULL, assigned_name varchar(190) NOT NULL DEFAULT '', priority varchar(16) NOT NULL DEFAULT 'normal', due_date date NULL DEFAULT NULL, production_started_at datetime NULL DEFAULT NULL, production_finished_at datetime NULL DEFAULT NULL, work_started_at datetime NULL DEFAULT NULL, work_seconds int(10) NOT NULL DEFAULT 0, ready_notified_at datetime NULL DEFAULT NULL, history longtext NOT NULL, created_at datetime NOT NULL, updated_at datetime NOT NULL)");
$wpdb->pdo->exec("INSERT INTO wp_drukulator_orders (order_id, access_hash, items, notes, public_note, internal_note, history, created_at, updated_at) VALUES ('OLD-1','h','[]','','','0','[]','2026-01-01 10:00:00','2026-01-01 10:00:00'), ('OLD-2','h','[]','','','Ważna notatka','[]','2026-01-02 10:00:00','2026-01-02 10:00:00')");
update_option('drukulator_orders_db_version', '1.3');
ok(drukulator_orders_install(), 'aktualizacja bazy zamówień 1.3 → 1.4');
$cols = array_column($wpdb->pdo->query('PRAGMA table_info(wp_drukulator_orders)')->fetchAll(PDO::FETCH_ASSOC), 'name');
ok(in_array('promo_code', $cols, true) && in_array('discount', $cols, true), 'dodane kolumny kodu');
eq(drukulator_orders_get('OLD-1')['internal_note'], '', 'stare „0” w notatce wyczyszczone'); eq(drukulator_orders_get('OLD-2')['internal_note'], 'Ważna notatka', 'prawdziwa notatka zostaje');
eq(drukulator_orders_get('OLD-1')['promo_code'], '', 'stare zamówienie: pusty kod');
echo "OK promo\n";
