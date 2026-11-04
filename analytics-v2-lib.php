<?php
/** Druk24 0.22.8 - aggregate analytics; no IP addresses, names or email addresses. */
declare(strict_types=1);
if (!defined('ABSPATH')) { exit; }

const D24_ANALYTICS_DB_VERSION = '2.0';
const D24_ANALYTICS_SESSION_RETENTION_DAYS = 45;
const D24_ANALYTICS_TOTAL_RETENTION_DAYS = 180;

function d24_analytics_session_table(): string {
    global $wpdb;
    return $wpdb->prefix . 'drukulator_analytics_sessions';
}
function d24_analytics_counts_table(): string {
    global $wpdb;
    return $wpdb->prefix . 'drukulator_analytics_counts';
}
function d24_analytics_sales_table(): string {
    global $wpdb;
    return $wpdb->prefix . 'drukulator_analytics_sales';
}
function d24_analytics_install(): bool {
    if (get_option('d24_analytics_db_version') === D24_ANALYTICS_DB_VERSION) return true;
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();
    $sessions = d24_analytics_session_table();
    $counts = d24_analytics_counts_table();
    $sales = d24_analytics_sales_table();
    dbDelta("CREATE TABLE {$sessions} (
        session_hash char(64) NOT NULL,
        started_at datetime NOT NULL,
        last_seen datetime NOT NULL,
        source varchar(16) NOT NULL DEFAULT 'direct',
        quote_seen tinyint(1) NOT NULL DEFAULT 0,
        cart_seen tinyint(1) NOT NULL DEFAULT 0,
        checkout_seen tinyint(1) NOT NULL DEFAULT 0,
        order_seen tinyint(1) NOT NULL DEFAULT 0,
        PRIMARY KEY  (session_hash),
        KEY started_at (started_at),
        KEY last_seen (last_seen)
    ) {$charset};");
    dbDelta("CREATE TABLE {$counts} (
        day date NOT NULL,
        metric varchar(32) NOT NULL,
        dimension varchar(120) NOT NULL DEFAULT '',
        total bigint(20) unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY  (day,metric,dimension),
        KEY metric_day (metric,day)
    ) {$charset};");
    dbDelta("CREATE TABLE {$sales} (
        order_hash char(64) NOT NULL,
        day date NOT NULL,
        PRIMARY KEY  (order_hash),
        KEY day (day)
    ) {$charset};");
    $ok = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $sessions)) === $sessions
        && $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $counts)) === $counts
        && $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $sales)) === $sales;
    if ($ok) update_option('d24_analytics_db_version', D24_ANALYTICS_DB_VERSION, false);
    return $ok;
}
function d24_analytics_token_hash($token): string {
    if (!is_string($token) || !preg_match('/^[a-f0-9]{32}$/D', $token)) return '';
    return hash_hmac('sha256', $token, wp_salt('auth'));
}
function d24_analytics_clean_dimension($input, int $max = 100): string {
    $value = trim(sanitize_text_field((string) $input));
    if (strpos($value, '@') !== false || preg_match('/\+?\d[\d\s().-]{6,}\d/', $value)) return '';
    $value = preg_replace('/\s+/u', ' ', $value) ?: '';
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}
/** Bucket arbitrary product names into a fixed set; prevents storing customer-written text. */
function d24_analytics_product_bucket($input): string {
    $name = d24_analytics_clean_dimension($input, 120);
    $name = function_exists('mb_strtolower') ? mb_strtolower($name, 'UTF-8') : strtolower($name);
    $name = strtr($name, array('ą'=>'a','ć'=>'c','ę'=>'e','ł'=>'l','ń'=>'n','ó'=>'o','ś'=>'s','ź'=>'z','ż'=>'z'));
    $categories = array(
        'wizytow' => 'Wizytówki', 'ulotk' => 'Ulotki', 'plakat' => 'Plakaty',
        'cyfrow' => 'Druk cyfrowy', 'ksero' => 'Druk cyfrowy i ksero',
        'naklejk' => 'Naklejki i etykiety', 'etykiet' => 'Naklejki i etykiety',
        'magnes' => 'Magnesy', 'baner' => 'Banery', 'foli' => 'Folie',
        'roll-up' => 'Roll-upy i X-banery', 'x-banner' => 'Roll-upy i X-banery',
        'pcv' => 'Płyty PCV', 'piank' => 'Pianki', 'obrazy' => 'Obrazy', 'obraz' => 'Obrazy',
        'canvas' => 'Obrazy', 'kalendarz' => 'Kalendarze', 'biuwar' => 'Biuwary',
        'notes' => 'Notesy', 'bloczk' => 'Bloczki', 'teczk' => 'Teczki',
        'papier firmow' => 'Papier firmowy', 'kopert' => 'Koperty',
        'koszulk' => 'Odzież z nadrukiem', 'odziez' => 'Odzież z nadrukiem',
        'zaproszen' => 'Zaproszenia', 'slub' => 'Materiały ślubne',
        'pieczat' => 'Pieczątki', 'lamin' => 'Laminowanie',
        'szyld' => 'Tablice i szyldy', 'druk 3d' => 'Druk 3D',
    );
    foreach ($categories as $part => $label) {
        if (strpos($name, $part) !== false) return $label;
    }
    return 'Inne produkty';
}
function d24_analytics_source($source): string {
    $source = (string) $source;
    return in_array($source, array('direct','search','social','referral'), true) ? $source : 'direct';
}
function d24_analytics_add(string $metric, string $dimension = '', int $delta = 1): void {
    if ($delta <= 0 || $delta > 50000000) return;
    global $wpdb;
    $table = d24_analytics_counts_table();
    $wpdb->query($wpdb->prepare(
        "INSERT INTO {$table} (day,metric,dimension,total) VALUES (%s,%s,%s,%d) ON DUPLICATE KEY UPDATE total=total+VALUES(total)",
        wp_date('Y-m-d'), $metric, $dimension, $delta
    ));
}
/** Insert anonymous browser-session identity once; returns hash or '' if analytics unavailable. */
function d24_analytics_touch($token, $source = 'direct'): string {
    $hash = d24_analytics_token_hash($token);
    if ($hash === '' || !d24_analytics_install()) return '';
    global $wpdb;
    $table = d24_analytics_session_table();
    $now = current_time('mysql', true);
    $source = d24_analytics_source($source);
    $inserted = $wpdb->query($wpdb->prepare(
        "INSERT IGNORE INTO {$table} (session_hash,started_at,last_seen,source) VALUES (%s,%s,%s,%s)",
        $hash, $now, $now, $source
    ));
    if ($inserted === 1) {
        d24_analytics_add('sessions');
        d24_analytics_add('source', $source);
    } else {
        $wpdb->query($wpdb->prepare("UPDATE {$table} SET last_seen=%s WHERE session_hash=%s", $now, $hash));
    }
    return $hash;
}
/** First occurrence of funnel stage per visit. Atomic database update prevents double counting. */
function d24_analytics_stage(string $hash, string $stage): void {
    $fields = array('quote' => 'quote_seen', 'cart' => 'cart_seen', 'checkout' => 'checkout_seen', 'order' => 'order_seen');
    if ($hash === '' || !isset($fields[$stage])) return;
    global $wpdb;
    $table = d24_analytics_session_table();
    $field = $fields[$stage]; // Strict hardcoded column allowlist.
    $updated = $wpdb->query($wpdb->prepare(
        "UPDATE {$table} SET {$field}=1,last_seen=%s WHERE session_hash=%s AND {$field}=0",
        current_time('mysql', true), $hash
    ));
    if ($updated === 1) d24_analytics_add('stage_' . $stage);
}
function d24_analytics_browser_event(string $event, array $data, $session): void {
    try {
        $hash = d24_analytics_touch($session, $data['source'] ?? 'direct');
        if ($hash === '') return;
        if ($event === 'quote_view') d24_analytics_stage($hash, 'quote');
        if ($event === 'add_to_cart') {
            d24_analytics_stage($hash, 'cart');
            $product = d24_analytics_product_bucket($data['product'] ?? '');
            d24_analytics_add('product_cart', $product);
        }
        if ($event === 'checkout_view') d24_analytics_stage($hash, 'checkout');
        if ($event === 'page_view') {
            $page = d24_analytics_clean_dimension($data['page'] ?? '');
            if ($page !== '') d24_analytics_add('page', preg_match('/^(home|start|glowna|strona glowna)$/i', $page) ? 'Strona główna' : d24_analytics_product_bucket($page));
        }
        if ($event === 'search') {
            d24_analytics_add('search');
            if ((int) ($data['results'] ?? 0) === 0) d24_analytics_add('search_miss');
        }
        d24_analytics_prune();
    } catch (Throwable $ignored) { /* Analytics must never interrupt the calculator. */ }
}
/** Called only after server accepted the actual shop e-mail, never from unauthenticated tracking. */
function d24_analytics_verified_order(string $order_id, float $gross, array $cart, $session = null): void {
    try {
        if (!d24_analytics_install()) return;
        global $wpdb;
        $table = d24_analytics_sales_table();
        $hash = hash_hmac('sha256', $order_id, wp_salt('auth'));
        $inserted = $wpdb->query($wpdb->prepare(
            "INSERT IGNORE INTO {$table} (order_hash,day) VALUES (%s,%s)", $hash, wp_date('Y-m-d')
        ));
        if ($inserted !== 1) return; // Idempotent.
        d24_analytics_add('orders_verified');
        $cents = (int) round(max(0.0, min(5000.0, $gross)) * 100);
        if ($cents > 0) d24_analytics_add('orders_value_cents', '', $cents);
        foreach (array_slice($cart, 0, 30) as $item) {
            if (!is_array($item)) continue;
            $product = d24_analytics_product_bucket($item['title'] ?? '');
            d24_analytics_add('product_order', $product);
        }
        $sessionHash = d24_analytics_touch($session);
        if ($sessionHash !== '') d24_analytics_stage($sessionHash, 'order');
        d24_analytics_prune();
    } catch (Throwable $ignored) { /* Accepted order remains successful even if statistics fail. */ }
}
function d24_analytics_prune(): void {
    if (get_transient('d24_analytics_prune_lock')) return;
    set_transient('d24_analytics_prune_lock', 1, DAY_IN_SECONDS);
    global $wpdb;
    $sessionCutoff = gmdate('Y-m-d H:i:s', time() - D24_ANALYTICS_SESSION_RETENTION_DAYS * DAY_IN_SECONDS);
    $totalCutoff = wp_date('Y-m-d', time() - D24_ANALYTICS_TOTAL_RETENTION_DAYS * DAY_IN_SECONDS);
    $wpdb->query($wpdb->prepare('DELETE FROM ' . d24_analytics_session_table() . ' WHERE last_seen < %s', $sessionCutoff));
    $wpdb->query($wpdb->prepare('DELETE FROM ' . d24_analytics_counts_table() . ' WHERE day < %s', $totalCutoff));
    $wpdb->query($wpdb->prepare('DELETE FROM ' . d24_analytics_sales_table() . ' WHERE day < %s', $totalCutoff));
}
/** Aggregated dashboard for staff with analytics permission. */
function d24_analytics_dashboard(int $days = 7): array {
    $days = in_array($days, array(1,7,30), true) ? $days : 7;
    $base = array('period_days' => $days, 'ready' => false, 'totals' => array(), 'series' => array(),
        'sources' => array(), 'pages' => array(), 'cart_products' => array(), 'ordered_products' => array(),
        'abandoned' => 0, 'abandoned_definition' => 'Sesje z koszykiem, bez potwierdzonego zapytania, nieaktywne przez minimum 24 godziny.',
        'data_start' => wp_date('Y-m-d'), 'data_end' => wp_date('Y-m-d'),
        'note' => 'Dane dostępne od wdrożenia 0.22.8v; nie są płatnościami ani sprzedażą zrealizowaną.');
    if (!d24_analytics_install()) return $base;
    global $wpdb;
    $today = new DateTimeImmutable('today', wp_timezone());
    $start = $today->modify('-' . ($days - 1) . ' days')->format('Y-m-d');
    $end = $today->format('Y-m-d');
    $table = d24_analytics_counts_table();
    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT day,metric,dimension,total FROM {$table} WHERE day >= %s AND day <= %s", $start, $end
    ), ARRAY_A);
    $totals = array_fill_keys(array('sessions','stage_quote','stage_cart','stage_checkout','stage_order',
        'orders_verified','orders_value_cents','search','search_miss'), 0);
    $series = array();
    for ($i = $days - 1; $i >= 0; $i--) {
        $date = $today->modify('-' . $i . ' days')->format('Y-m-d');
        $series[$date] = array('day' => $date, 'sessions' => 0, 'quotes' => 0,
            'carts' => 0, 'orders' => 0, 'value_cents' => 0);
    }
    $grouped = array('source'=>array(), 'page'=>array(), 'product_cart'=>array(), 'product_order'=>array());
    foreach ((array) $rows as $r) {
        $metric = (string) $r['metric'];
        $dimension = (string) $r['dimension'];
        $value = max(0, (int) $r['total']);
        $day = (string) $r['day'];
        if (array_key_exists($metric, $totals)) $totals[$metric] += $value;
        if (isset($grouped[$metric])) $grouped[$metric][$dimension] = ($grouped[$metric][$dimension] ?? 0) + $value;
        if (isset($series[$day])) {
            $map = array('sessions'=>'sessions','stage_quote'=>'quotes','stage_cart'=>'carts',
                'orders_verified'=>'orders','orders_value_cents'=>'value_cents');
            if (isset($map[$metric])) $series[$day][$map[$metric]] += $value;
        }
    }
    foreach ($grouped as &$values) { arsort($values, SORT_NUMERIC); $values = array_slice($values, 0, 12, true); }
    unset($values);
    // Abandonment is calculated over sessions, not by subtracting unrelated counters.
    // Excludes sessions active in the last 24 hours, and sessions with a server-verified order.
    $sessionTable = d24_analytics_session_table();
    $utcZone = new DateTimeZone('UTC');
    $fromUtc = $today->modify('-' . ($days - 1) . ' days')->setTimezone($utcZone)->format('Y-m-d H:i:s');
    $toUtc = $today->modify('+1 day')->setTimezone($utcZone)->format('Y-m-d H:i:s');
    $abandoned = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$sessionTable} WHERE cart_seen=1 AND order_seen=0 AND started_at >= %s AND started_at < %s AND last_seen < %s",
        $fromUtc, $toUtc, gmdate('Y-m-d H:i:s', time() - DAY_IN_SECONDS)
    ));
    return array_merge($base, array('ready'=>true,'totals'=>$totals,'series'=>array_values($series),
        'sources'=>$grouped['source'], 'pages'=>$grouped['page'],
        'cart_products'=>$grouped['product_cart'], 'ordered_products'=>$grouped['product_order'],
        'abandoned'=>$abandoned, 'data_start'=>$start,'data_end'=>$end));
}
