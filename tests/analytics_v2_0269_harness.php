<?php
// 0.26.9: test rozszerzonej analityki (okres poprzedni, godziny, urządzenia, język, wartość wg kategorii, lejek wg segmentów) na atrapie WordPressa (SQLite). Uruchamiany z tests/analytics_v2_0269.py.
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
$cols = fn() => array_column($wpdb->pdo->query('PRAGMA table_info(wp_drukulator_analytics_sessions)')->fetchAll(PDO::FETCH_ASSOC), 'name');

if ($mode === 'upgrade') {
    // Instalacja sprzed 0.26.9 (baza 2.1): tabela sesji bez device i lang, istniejące dane zostają.
    $wpdb->pdo->exec("CREATE TABLE wp_drukulator_analytics_sessions (session_hash char(64) NOT NULL, started_at datetime NOT NULL, last_seen datetime NOT NULL, source varchar(16) NOT NULL DEFAULT 'direct', price_seen tinyint(1) NOT NULL DEFAULT 0, quote_seen tinyint(1) NOT NULL DEFAULT 0, cart_seen tinyint(1) NOT NULL DEFAULT 0, checkout_seen tinyint(1) NOT NULL DEFAULT 0, order_seen tinyint(1) NOT NULL DEFAULT 0, PRIMARY KEY (session_hash))");
    $wpdb->pdo->exec("CREATE TABLE wp_drukulator_analytics_counts (day date NOT NULL, metric varchar(32) NOT NULL, dimension varchar(120) NOT NULL DEFAULT '', total bigint(20) NOT NULL DEFAULT 0, PRIMARY KEY (day,metric,dimension))");
    $wpdb->pdo->exec("CREATE TABLE wp_drukulator_analytics_sales (order_hash char(64) NOT NULL, day date NOT NULL, PRIMARY KEY (order_hash))");
    $wpdb->pdo->exec("INSERT INTO wp_drukulator_analytics_sessions (session_hash,started_at,last_seen,source,cart_seen) VALUES ('" . d24_h('e') . "','" . gmdate('Y-m-d H:i:s', time() - 3 * 86400) . "','" . gmdate('Y-m-d H:i:s', time() - 3 * 86400) . "','search',1)");
    update_option('d24_analytics_db_version', '2.1');
    d24_analytics_add('sessions'); d24_analytics_add('stage_quote');
    ok(d24_analytics_install(), 'install po aktualizacji');
    eq(get_option('d24_analytics_db_version'), '2.2', 'wersja bazy podniesiona do 2.2');
    ok(in_array('device', $cols(), true) && in_array('lang', $cols(), true), 'kolumny device i lang dodane do istniejącej tabeli');
    d24_analytics_browser_event('page_view', array('page' => 'Plakaty 24h', 'source' => 'direct', 'device' => 'mobile', 'lang' => 'en'), d24_h('f'));
    $d = d24_analytics_dashboard(30);
    eq($d['totals']['stage_quote'], 1, 'stare dane zostały');
    eq($d['segments']['device']['unknown']['sessions'], 1, 'stara sesja bez urządzenia → „unknown”');
    eq($d['segments']['device']['mobile']['sessions'], 1, 'nowa sesja z urządzeniem');
    eq($d['abandoned'], 1, 'porzucony koszyk starej sesji nadal liczony');
    echo "OK upgrade\n"; exit(0);
}

ok(d24_analytics_install(), 'install');
eq(get_option('d24_analytics_db_version'), '2.2', 'wersja bazy 2.2');
$A = d24_h('a'); $B = d24_h('b'); $C = d24_h('c'); $D = d24_h('d');
// Sesja A: komputer, polski, wyszukiwarka — cały lejek do zapytania
d24_analytics_browser_event('page_view', array('page' => 'Plakaty 24h', 'source' => 'search', 'device' => 'desktop', 'lang' => 'pl'), $A);
d24_analytics_browser_event('price_seen', array('page' => 'Plakaty 24h', 'source' => 'search', 'device' => 'desktop', 'lang' => 'pl'), $A);
d24_analytics_browser_event('quote_view', array('page' => 'Plakaty 24h'), $A);
d24_analytics_browser_event('add_to_cart', array('product' => 'Plakaty 24h', 'value' => 80), $A);
d24_analytics_browser_event('checkout_view', array(), $A);
d24_analytics_verified_order('ORD-1', 100, array(array('title' => 'Plakaty 24h', 'price' => 80), array('title' => 'Wizytówki 24h', 'price' => 20), array('title' => 'Wizytówki 24h', 'price' => 6000), array('title' => 'Wizytówki 24h', 'price' => 'abc')), $A);
// Sesja B: telefon, angielski, bezpośrednio — koszyk bez zapytania
d24_analytics_browser_event('page_view', array('page' => 'Wizytówki 24h', 'source' => 'direct', 'device' => 'mobile', 'lang' => 'en'), $B);
d24_analytics_browser_event('add_to_cart', array('product' => 'Wizytówki 24h', 'value' => 30), $B);
// Sesja C: telefon, polski — tylko wejście; zdarzenie z niedozwolonym urządzeniem i językiem w sesji D
d24_analytics_browser_event('page_view', array('page' => 'Start', 'source' => 'social', 'device' => 'mobile', 'lang' => 'pl'), $C);
d24_analytics_browser_event('page_view', array('page' => 'Start', 'source' => 'direct', 'device' => '<script>', 'lang' => 'brainrot'), $D);

$d = d24_analytics_dashboard(7);
ok($d['ready'], 'dashboard gotowy');
eq($d['totals']['sessions'], 4, 'sesje');
eq($d['devices'], array('mobile' => 2, 'desktop' => 1), 'urządzenia (niedozwolona wartość nie jest zapisywana)');
eq($d['langs'], array('pl' => 2, 'en' => 1, 'other' => 1), 'języki (obca wartość → other)');
$hour = (int) wp_date('H'); $weekday = (int) wp_date('N') - 1;
eq($d['hours'][$hour], 4, 'godzina wejścia (czas strony)'); eq(array_sum($d['hours']), 4, 'suma godzin = sesje');
eq($d['weekday_hours'][$weekday][$hour], 4, 'macierz dzień tygodnia × godzina'); eq(array_sum(array_map('array_sum', $d['weekday_hours'])), 4, 'macierz w sumie');
eq(count($d['hours']), 24, '24 godziny'); eq(count($d['weekday_hours']), 7, '7 dni tygodnia');
$ov = $d['ordered_value_cents']; ksort($ov);
eq($ov, array('Plakaty' => 8000, 'Wizytówki' => 2000 + 500000), 'wartość zapytań wg kategorii (pozycja > 5000 zł ścięta do limitu, nieliczbowa pominięta)');
eq($d['ordered_products']['Wizytówki'], 3, 'pozycje w zapytaniu liczone jak dotąd');
eq($d['segments']['device']['desktop'], array('sessions' => 1, 'price' => 1, 'quote' => 1, 'cart' => 1, 'checkout' => 1, 'orders' => 1), 'lejek sesji: komputer');
eq($d['segments']['device']['mobile']['sessions'], 2, 'lejek sesji: telefon'); eq($d['segments']['device']['mobile']['cart'], 1, 'telefon z koszykiem');
eq($d['segments']['device']['unknown']['sessions'], 1, 'sesja z niedozwolonym urządzeniem → „unknown”');
eq($d['segments']['source']['search']['orders'], 1, 'lejek sesji: wyszukiwarka → zapytanie');
eq($d['segments']['lang']['en']['cart'], 1, 'lejek sesji: angielski');
eq($d['segment_window_days'], 7, 'okno lejka segmentów = okres');
eq(d24_analytics_dashboard(90)['segment_window_days'], 45, 'sesje trzymane 45 dni → okno 45 dla okresu 90 dni');
// okresy
foreach (array(1, 7, 14, 30, 90) as $p) { $x = d24_analytics_dashboard($p); eq($x['period_days'], $p, "okres $p dni dozwolony"); eq(count($x['series']), $p, "seria $p dni"); eq(count($x['previous']['series']), $p, "seria poprzedniego okresu $p dni"); }
eq(d24_analytics_dashboard(5)['period_days'], 7, 'nieznany okres → 7 dni'); eq(d24_analytics_dashboard(365)['period_days'], 7, '365 dni nie jest dozwolone');

// okres poprzedni: dane z wczoraj (dla 1 dnia) i sprzed tygodnia (dla 7 dni)
$yesterday = wp_date('Y-m-d', time() - 86400); $weekAgo = wp_date('Y-m-d', time() - 7 * 86400); $old = wp_date('Y-m-d', time() - 30 * 86400);
foreach (array(array($yesterday, 'sessions', '', 5), array($yesterday, 'hour', '10', 5), array($yesterday, 'orders_verified', '', 2), array($weekAgo, 'sessions', '', 11), array($weekAgo, 'stage_cart', '', 3), array($old, 'sessions', '', 99)) as $r) {
    $wpdb->query($wpdb->prepare('INSERT INTO ' . d24_analytics_counts_table() . ' (day,metric,dimension,total) VALUES (%s,%s,%s,%d) ON DUPLICATE KEY UPDATE total=total+VALUES(total)', $r[0], $r[1], $r[2], $r[3]));
}
$d1 = d24_analytics_dashboard(1);
eq($d1['totals']['sessions'], 4, 'dziś: sesje'); eq($d1['previous']['totals']['sessions'], 5, 'wczoraj: sesje'); eq($d1['previous']['totals']['orders_verified'], 2, 'wczoraj: zapytania');
eq($d1['previous']['hours'][10], 5, 'wczoraj: godzina 10'); eq($d1['previous']['start'], $yesterday, 'początek poprzedniego okresu'); eq($d1['previous']['end'], $yesterday, 'koniec poprzedniego okresu');
eq($d1['previous']['series'][0]['sessions'], 5, 'seria poprzedniego okresu');
$d7 = d24_analytics_dashboard(7);
eq($d7['totals']['sessions'], 4 + 5, 'ostatnie 7 dni = dziś + wczoraj'); eq($d7['previous']['totals']['sessions'], 11, 'poprzednie 7 dni: sesje'); eq($d7['previous']['totals']['stage_cart'], 3, 'poprzednie 7 dni: koszyki');
ok(!in_array(99, array_column($d7['previous']['series'], 'sessions'), true), 'dane sprzed 30 dni nie wpadają do poprzedniego tygodnia');
eq($d7['previous']['hours'][10], 0, 'godziny poprzedniego okresu osobno od bieżącego');
$d30 = d24_analytics_dashboard(30); eq($d30['previous']['totals']['sessions'], 99, 'poprzednie 30 dni obejmują wpis sprzed 30 dni');
eq($d30['totals']['sessions'], 4 + 5 + 11, 'bieżące 30 dni: dziś + wczoraj + tydzień temu');

// hasła wyszukiwania ze starego licznika v1 (hasła z e-mailem/numerem odfiltrowane, kolejność malejąca)
update_option('drukulator_analytics_v1', array('started_at' => '2026-01-02T10:00:00+00:00',
    'search_terms' => array('ulotki a5' => 7, 'wizytówki' => 12, 'jan@example.com' => 30, '+48 600 700 800' => 9),
    'search_terms_no_results' => array('pocztówki' => 4, 'kubki' => 6, 'abc@x.pl' => 50)));
$s = d24_analytics_dashboard(7)['search'];
eq($s['since'], '2026-01-02', 'od kiedy zbierane hasła'); eq($s['terms'], array('wizytówki' => 12, 'ulotki a5' => 7), 'hasła: bez e-maili i numerów, malejąco');
eq($s['misses'], array('kubki' => 6, 'pocztówki' => 4), 'hasła bez wyników');
echo "OK fresh\n";
