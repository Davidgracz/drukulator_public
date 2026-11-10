<?php
// 0.25.5: test analytics-v2-lib.php na atrapie WordPressa (SQLite zamiast MySQL). Uruchamiany z tests/analytics_v2_0255.py.
declare(strict_types=1);
$stub = sys_get_temp_dir() . '/d24_wp_stub_' . getmypid() . '/';
@mkdir($stub . 'wp-admin/includes', 0777, true);
file_put_contents($stub . 'wp-admin/includes/upgrade.php', "<?php\n");   // dbDelta() jest atrapą poniżej
define('ABSPATH', $stub);
const DAY_IN_SECONDS = 86400; const HOUR_IN_SECONDS = 3600; const ARRAY_A = 'ARRAY_A';
date_default_timezone_set('UTC');
$GLOBALS['d24_opts'] = array(); $GLOBALS['d24_transients'] = array();
function get_option($k, $d = false) { return $GLOBALS['d24_opts'][$k] ?? $d; }
function update_option($k, $v, $autoload = null) { $GLOBALS['d24_opts'][$k] = $v; return true; }
function get_transient($k) { return $GLOBALS['d24_transients'][$k] ?? false; }
function set_transient($k, $v, $ttl = 0) { $GLOBALS['d24_transients'][$k] = $v; return true; }
function wp_salt($s = 'auth') { return 'test-salt-' . $s; }
function wp_timezone() { return new DateTimeZone('Europe/Warsaw'); }
function wp_date($format, $ts = null) { return (new DateTimeImmutable('@' . ($ts ?? time())))->setTimezone(wp_timezone())->format($format); }
function current_time($type, $gmt = 0) { return gmdate('Y-m-d H:i:s'); }
function sanitize_text_field($s) { return trim(strip_tags((string) $s)); }
class FakeWpdb {
    public string $prefix = 'wp_'; public PDO $pdo;
    function __construct() { $this->pdo = new PDO('sqlite::memory:'); $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); }
    function get_charset_collate() { return ''; }
    function prepare($sql, ...$args) {
        $i = 0;
        return preg_replace_callback('/%[sd]/', function ($m) use (&$i, $args) {
            $v = $args[$i++];
            return $m[0] === '%d' ? (string) (int) $v : $this->pdo->quote((string) $v);
        }, $sql);
    }
    private function tr(string $sql): string {
        $sql = preg_replace('/^\s*INSERT\s+IGNORE\s+INTO/i', 'INSERT OR IGNORE INTO', $sql);
        return str_replace('ON DUPLICATE KEY UPDATE total=total+VALUES(total)', 'ON CONFLICT(day,metric,dimension) DO UPDATE SET total=total+excluded.total', $sql);
    }
    function query($sql) { return $this->pdo->exec($this->tr((string) $sql)); }
    function get_var($sql) {
        if (preg_match("/^SHOW TABLES LIKE '(.+)'$/", (string) $sql, $m)) {
            $r = $this->pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name=" . $this->pdo->quote($m[1]))->fetchColumn();
            return $r === false ? null : $r;
        }
        $r = $this->pdo->query($this->tr((string) $sql))->fetchColumn();
        return $r === false ? null : $r;
    }
    function get_results($sql, $mode = null) { return $this->pdo->query($this->tr((string) $sql))->fetchAll(PDO::FETCH_ASSOC); }
}
$wpdb = new FakeWpdb();
// dbDelta: tworzy tabelę albo dodaje brakujące kolumny (jak prawdziwy dbDelta dla istniejącej tabeli).
function dbDelta($sql) {
    global $wpdb;
    if (!preg_match('/CREATE TABLE (\S+) \((.*)\)\s*;?\s*$/s', $sql, $m)) throw new Exception('dbDelta: nie rozpoznano ' . $sql);
    $table = $m[1]; $columns = array(); $keys = array();
    foreach (preg_split('/,\s*\n/', trim($m[2])) as $line) {
        $line = trim($line);
        if ($line === '') continue;
        if (preg_match('/^PRIMARY KEY\s+\((.+)\)$/i', $line, $k)) { $keys[] = 'PRIMARY KEY (' . $k[1] . ')'; continue; }
        if (preg_match('/^KEY\s/i', $line)) continue;
        $line = preg_replace('/\s+unsigned\b/i', '', $line);   // SQLite nie zna „unsigned”
        preg_match('/^(\w+)\s+(.*)$/', $line, $c); $columns[$c[1]] = $line;
    }
    $exists = $wpdb->pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name=" . $wpdb->pdo->quote($table))->fetchColumn();
    if (!$exists) { $wpdb->pdo->exec("CREATE TABLE {$table} (" . implode(', ', array_merge(array_values($columns), $keys)) . ')'); return; }
    $have = array_column($wpdb->pdo->query("PRAGMA table_info({$table})")->fetchAll(PDO::FETCH_ASSOC), 'name');
    foreach ($columns as $name => $def) if (!in_array($name, $have, true)) $wpdb->pdo->exec("ALTER TABLE {$table} ADD COLUMN {$def}");
}
function d24_h(string $n): string { return str_repeat($n, 32); }   // 32 znaki hex
function ok(bool $c, string $msg): void { if (!$c) { fwrite(STDERR, "FAIL: $msg\n"); exit(1); } }
function eq($a, $b, string $msg): void { if ($a !== $b) { fwrite(STDERR, "FAIL: $msg\n  jest:   " . json_encode($a, JSON_UNESCAPED_UNICODE) . "\n  oczek.: " . json_encode($b, JSON_UNESCAPED_UNICODE) . "\n"); exit(1); } }

require_once $argv[1] . '/analytics-v2-lib.php';
$mode = $argv[2] ?? 'fresh';

if ($mode === 'upgrade') {
    // Instalacja sprzed 0.25.5: tabela sesji bez kolumny price_seen, wersja bazy 2.0, istniejące dane.
    $wpdb->pdo->exec("CREATE TABLE wp_drukulator_analytics_sessions (session_hash char(64) NOT NULL, started_at datetime NOT NULL, last_seen datetime NOT NULL, source varchar(16) NOT NULL DEFAULT 'direct', quote_seen tinyint(1) NOT NULL DEFAULT 0, cart_seen tinyint(1) NOT NULL DEFAULT 0, checkout_seen tinyint(1) NOT NULL DEFAULT 0, order_seen tinyint(1) NOT NULL DEFAULT 0, PRIMARY KEY (session_hash))");
    $wpdb->pdo->exec("CREATE TABLE wp_drukulator_analytics_counts (day date NOT NULL, metric varchar(32) NOT NULL, dimension varchar(120) NOT NULL DEFAULT '', total bigint(20) NOT NULL DEFAULT 0, PRIMARY KEY (day,metric,dimension))");
    $wpdb->pdo->exec("CREATE TABLE wp_drukulator_analytics_sales (order_hash char(64) NOT NULL, day date NOT NULL, PRIMARY KEY (order_hash))");
    update_option('d24_analytics_db_version', '2.0');
    d24_analytics_add('sessions'); d24_analytics_add('stage_quote');
    ok(d24_analytics_install(), 'install po aktualizacji');
    eq(get_option('d24_analytics_db_version'), D24_ANALYTICS_DB_VERSION, 'wersja bazy podniesiona');
    $cols = array_column($wpdb->pdo->query('PRAGMA table_info(wp_drukulator_analytics_sessions)')->fetchAll(PDO::FETCH_ASSOC), 'name');
    ok(in_array('price_seen', $cols, true), 'kolumna price_seen dodana do istniejącej tabeli');
    d24_analytics_browser_event('price_seen', array('page' => 'Plakaty 24h', 'source' => 'search'), d24_h('a'));
    $d = d24_analytics_dashboard(30);
    eq($d['totals']['stage_price'], 1, 'krok ceny po aktualizacji');
    eq($d['totals']['stage_quote'], 1, 'stare dane zostały');
    echo "OK upgrade\n"; exit(0);
}

ok(d24_analytics_install(), 'install');
eq(get_option('d24_analytics_db_version'), '2.1', 'wersja bazy 2.1');
$A = d24_h('a'); $B = d24_h('b'); $C = d24_h('c');
// Sesja A: konfiguracja → cena → wycena → koszyk → kasa → błąd wysyłki
d24_analytics_browser_event('page_view', array('page' => 'Plakaty 24h', 'source' => 'search'), $A);
d24_analytics_browser_event('price_seen', array('page' => 'Plakaty 24h', 'source' => 'search'), $A);
d24_analytics_browser_event('price_seen', array('page' => 'Plakaty 24h', 'source' => 'search'), $A);       // drugi raz: etap liczy sesję raz, produkt – zdarzenia
d24_analytics_browser_event('quote_view', array('page' => 'Plakaty 24h'), $A);
d24_analytics_browser_event('add_to_cart', array('product' => 'Plakaty 24h', 'value' => 65.5), $A);
d24_analytics_browser_event('checkout_view', array(), $A);
d24_analytics_browser_event('order_error', array('reason' => 'stale_item'), $A);
d24_analytics_browser_event('order_error', array('reason' => '<script>x</script>'), $A);                    // spoza listy → „server”
// Sesja B: koszyk z niepoprawnymi kwotami + jedna poprawna, bez kroku ceny
d24_analytics_browser_event('add_to_cart', array('product' => 'Wizytówki 24h', 'value' => 6000), $B);        // powyżej limitu 5000 – wartość pominięta
d24_analytics_browser_event('add_to_cart', array('product' => 'Wizytówki 24h', 'value' => 'abc'), $B);
d24_analytics_browser_event('add_to_cart', array('product' => 'Wizytówki 24h', 'value' => -5), $B);
d24_analytics_browser_event('add_to_cart', array('product' => 'Wizytówki 24h', 'value' => 120), $B);
// Sesja C: tylko cena w pianki
d24_analytics_browser_event('price_seen', array('page' => 'PCV i pianki', 'source' => 'direct'), $C);
// Zweryfikowane zapytanie z sesji A (jak z send-order.php)
d24_analytics_verified_order('ORD-1', 65.5, array(array('title' => 'Plakaty 24h')), $A);

$d = d24_analytics_dashboard(30);
ok($d['ready'], 'dashboard gotowy');
$t = $d['totals'];
eq($t['sessions'], 3, 'sesje'); eq($t['stage_price'], 2, 'sesje z ceną po konfiguracji (A i C)');
eq($t['stage_quote'], 1, 'wyceny'); eq($t['stage_cart'], 2, 'koszyki'); eq($t['stage_checkout'], 1, 'kasa');
eq($t['cart_items'], 2, 'tylko pozycje z poprawną wartością'); eq($t['cart_value_cents'], 18550, 'suma wartości pozycji 65,50 + 120,00');
eq($t['order_error'], 2, 'błędy wysyłki'); eq($t['orders_verified'], 1, 'zapytanie');
eq($d['order_errors'], array('server' => 1, 'stale_item' => 1), 'przyczyny błędów (obce → server)');
eq($d['price_products'], array('Plakaty' => 2, 'Płyty PCV' => 1), 'produkty po konfiguracji (strona „PCV i pianki” trafia do kategorii „Płyty PCV”, tak samo jak w „Oglądane kategorie”)');
eq($d['cart_products']['Wizytówki'], 4, 'dodania do koszyka (zdarzenia)');
$today = $d['series'][count($d['series']) - 1];
eq($today['prices'], 2, 'seria: cena'); eq($today['checkouts'], 1, 'seria: kasa'); eq($today['cart_items'], 2, 'seria: pozycje');
eq($today['cart_value_cents'], 18550, 'seria: wartość'); eq($today['order_errors'], 2, 'seria: błędy'); eq($today['orders'], 1, 'seria: zapytania');
eq($d['sources'], array('direct' => 2, 'search' => 1), 'źródła bez zmian');
// zakres 1 dzień i nieznane okresy
eq(d24_analytics_dashboard(1)['totals']['stage_price'], 2, 'dashboard 1 dzień');
echo "OK fresh\n";
