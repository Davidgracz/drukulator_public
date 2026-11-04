<?php
/** Druk24 0.22.7 – operational events and linked incident alerting. */
declare(strict_types=1);

if (!defined('ABSPATH')) { exit; }
require_once __DIR__ . '/alerting-lib.php';

const D24_MONITOR_DB_VERSION = '1.0';
const D24_MONITOR_RETENTION_DAYS = 60;

function d24_monitor_table(): string {
    global $wpdb;
    return $wpdb->prefix . 'drukulator_monitor_events';
}

function d24_monitor_install(): bool {
    if (get_option('d24_monitor_db_version') === D24_MONITOR_DB_VERSION) return true;
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $table = d24_monitor_table();
    $charset = $wpdb->get_charset_collate();
    dbDelta("CREATE TABLE {$table} (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        created_at datetime NOT NULL,
        level varchar(12) NOT NULL,
        event_type varchar(48) NOT NULL,
        order_id varchar(64) NOT NULL DEFAULT '',
        message varchar(240) NOT NULL DEFAULT '',
        metadata longtext NOT NULL,
        duration_ms int(10) unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY  (id),
        KEY created_at (created_at),
        KEY level_created (level,created_at),
        KEY order_id (order_id)
    ) {$charset};");
    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) return false;
    update_option('d24_monitor_db_version', D24_MONITOR_DB_VERSION, false);
    return true;
}

function d24_monitor_log(string $event, string $level, string $message, string $order_id = '', array $metadata = array(), int $duration_ms = 0): bool {
    try {
        $saved = d24_monitor_log_inner($event, $level, $message, $order_id, $metadata, $duration_ms);
        // If logging fails, do not block checkout. Alerting maintains its own table.
        d24_alert_on_event($event, $level, $order_id);
        return $saved;
    } catch (Throwable $ignored) {
        return false; // Logging errors must never break customer submissions.
    }
}

function d24_monitor_log_inner(string $event, string $level, string $message, string $order_id = '', array $metadata = array(), int $duration_ms = 0): bool {
    if (!d24_monitor_install()) return false; // Never block customer checkout if monitoring is down.
    global $wpdb;
    if (!in_array($level, array('info','warning','error'), true)) $level = 'info';
    // Explicit metadata only. Never log emails, IPs, upload tokens, full paths or file contents.
    $clean = array();
    foreach ($metadata as $key => $value) {
        if (!in_array($key, array('files','file_names','bytes','total','channel','status','staff','count','method','note'), true)) continue;
        if ($key === 'file_names' && is_array($value)) {
            $clean[$key] = array_map(static fn($name) => substr(sanitize_file_name((string) $name), 0, 160), array_slice($value, 0, 5));
        } elseif (in_array($key, array('files','bytes','total','count'), true)) {
            $clean[$key] = max(0, (float) $value);
        } elseif (is_scalar($value)) {
            $clean[$key] = substr(sanitize_text_field((string) $value), 0, 100);
        }
    }
    $inserted = $wpdb->insert(d24_monitor_table(), array(
        'created_at' => current_time('mysql', true),
        'level' => $level,
        'event_type' => sanitize_key(substr($event, 0, 48)),
        'order_id' => substr(sanitize_text_field($order_id), 0, 64),
        'message' => substr(sanitize_text_field($message), 0, 240),
        'metadata' => wp_json_encode($clean),
        'duration_ms' => max(0, min(1800000, $duration_ms)),
    ), array('%s','%s','%s','%s','%s','%s','%d'));
    // Cleanup once daily and only after an event was logged.
    if ($inserted && !get_transient('d24_monitor_last_cleanup')) {
        set_transient('d24_monitor_last_cleanup', 1, DAY_IN_SECONDS);
        $cutoff = gmdate('Y-m-d H:i:s', time() - D24_MONITOR_RETENTION_DAYS * DAY_IN_SECONDS);
        $wpdb->query($wpdb->prepare('DELETE FROM ' . d24_monitor_table() . ' WHERE created_at < %s', $cutoff));
    }
    return (bool) $inserted;
}

/** Read a small, locked, out-of-webroot upload-failure log without loading WordPress for every chunk. */
function d24_monitor_upload_errors(): array {
    if (!function_exists('drukulator_stage_root')) return array();
    try { $root = drukulator_stage_root(); } catch (Throwable $e) { return array(); }
    $path = $root . DIRECTORY_SEPARATOR . 'upload-monitor.jsonl';
    if (!is_file($path) || is_link($path)) return array();
    $contents = @file_get_contents($path);
    if (!is_string($contents)) return array();
    $events = array();
    foreach (array_slice(explode("\n", $contents), -151) as $line) {
        $row = json_decode($line, true);
        if (!is_array($row) || !isset($row['ts'], $row['mode'])) continue;
        $ts = (int) $row['ts'];
        if ($ts < time() - 7 * DAY_IN_SECONDS || $ts > time() + 300) continue;
        $events[] = array('id' => 'u' . $ts . '-' . count($events),
            'created_at' => gmdate('Y-m-d H:i:s', $ts), 'level' => 'error',
            'event_type' => 'upload_failed', 'order_id' => '',
            'message' => !empty($row['reason']) ? (string) $row['reason'] : ($row['mode'] === 'chunk' ? 'Błąd odbierania fragmentu pliku' : 'Błąd przesyłania plików'),
            'metadata' => array('method' => in_array($row['mode'], array('chunk','start','cancel'), true) ? $row['mode'] : 'other'),
            'duration_ms' => 0);
    }
    return $events;
}

function d24_monitor_dashboard(): array {
    global $wpdb;
    $installed = d24_monitor_install();
    $table = d24_monitor_table();
    $since = gmdate('Y-m-d H:i:s', time() - DAY_IN_SECONDS);
    $seven = gmdate('Y-m-d H:i:s', time() - 7 * DAY_IN_SECONDS);
    $rows = $installed ? $wpdb->get_results($wpdb->prepare("SELECT id,created_at,level,event_type,order_id,message,metadata,duration_ms FROM {$table} WHERE created_at >= %s ORDER BY id DESC LIMIT 150", $seven), ARRAY_A) : array();
    if (!is_array($rows)) $rows = array();
    foreach ($rows as &$row) {
        $row['metadata'] = json_decode((string) $row['metadata'], true) ?: array();
        $row['duration_ms'] = (int) $row['duration_ms'];
    }
    unset($row);
    $rows = array_merge($rows, d24_monitor_upload_errors());
    usort($rows, static fn($a,$b) => strcmp((string) $b['created_at'], (string) $a['created_at']));
    $recent = array_slice($rows, 0, 150);

    $all_count = $installed ? (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$table} WHERE created_at >= %s", $seven)) : 0;
    $failure_count = $installed ? (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$table} WHERE created_at >= %s AND level = 'error'", $since)) : 0;
    $sent_count = $installed ? (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$table} WHERE created_at >= %s AND event_type = 'order_mail_accepted'", $since)) : 0;
    // Read last 24h metadata without depending on JSON functions (compatible with older MariaDB).
    $attachment_count = 0;
    if ($installed) {
        $file_metadata = $wpdb->get_col($wpdb->prepare("SELECT metadata FROM {$table} WHERE created_at >= %s AND event_type = 'order_mail_accepted'", $since));
        foreach ((array) $file_metadata as $item) {
            $decoded = json_decode((string) $item, true);
            $attachment_count += (int) ($decoded['files'] ?? 0);
        }
    }
    $upload_failures = 0;
    foreach (d24_monitor_upload_errors() as $r) if ($r['created_at'] >= $since) $upload_failures++;
    $failure_count += $upload_failures;

    $daily = array();
    for ($i = 6; $i >= 0; $i--) {
        $day = gmdate('Y-m-d', time() - $i * DAY_IN_SECONDS);
        $daily[$day] = array('date'=>$day, 'accepted'=>0, 'errors'=>0);
    }
    // Query aggregated totals for all 7 days, not just the most recent 150 events.
    if ($installed) {
        $daily_rows = $wpdb->get_results($wpdb->prepare("SELECT DATE(created_at) AS day, event_type, level, COUNT(*) AS hits FROM {$table} WHERE created_at >= %s GROUP BY DATE(created_at),event_type,level", $seven), ARRAY_A);
        foreach ((array) $daily_rows as $d) {
            $day = (string) $d['day'];
            if (!isset($daily[$day])) continue;
            if ($d['event_type'] === 'order_mail_accepted') $daily[$day]['accepted'] += (int) $d['hits'];
            if ($d['level'] === 'error') $daily[$day]['errors'] += (int) $d['hits'];
        }
    }
    foreach (d24_monitor_upload_errors() as $row) {
        $day = substr($row['created_at'],0,10);
        if (isset($daily[$day])) $daily[$day]['errors']++;
    }
    $upload_ready = false;
    try { $upload_ready = is_writable(drukulator_stage_root()); } catch (Throwable $e) { /* diagnostic only */ }
    return array(
        'available' => $installed,
        'metrics' => array('mails_accepted_24h'=>$sent_count,'errors_24h'=>$failure_count,'attachments_24h'=>$attachment_count,'events_7d'=>$all_count),
        'services' => array('wordpress'=>true,'database'=>$installed,'upload_temp'=>$upload_ready,'smtp_delivery'=>'unverified'),
        'daily' => array_values($daily), 'events' => $recent,
        'generated_at' => gmdate('Y-m-d H:i:s') . ' UTC',
        'note'=>'Przyjęcie wiadomości przez wp_mail() nie oznacza dostarczenia do skrzynki. Monitor SMTP/dostarczenia wymaga integracji z dostawcą poczty.'
    );
}
