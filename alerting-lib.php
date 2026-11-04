<?php
/** Druk24 0.22.7 – operational incidents and rate-limited administrator notifications. */
declare(strict_types=1);
if (!defined('ABSPATH')) { exit; }

require_once __DIR__ . '/mail-audit-lib.php';

const D24_ALERT_DB_VERSION = '1.0';
const D24_ALERT_EMAIL = 'biuro@druk24.szczecin.pl';
const D24_ALERT_COOLDOWN_SECONDS = 1200; // 20 minutes between attempts (also on failure).

function d24_alert_table(): string {
    global $wpdb;
    return $wpdb->prefix . 'drukulator_alerts';
}

function d24_alert_install(): bool {
    if (get_option('d24_alert_db_version') === D24_ALERT_DB_VERSION) return true;
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $table = d24_alert_table();
    $charset = $wpdb->get_charset_collate();
    dbDelta("CREATE TABLE {$table} (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        fingerprint char(40) NOT NULL,
        category varchar(48) NOT NULL,
        severity varchar(12) NOT NULL,
        title varchar(180) NOT NULL,
        details varchar(240) NOT NULL DEFAULT '',
        order_id varchar(64) NOT NULL DEFAULT '',
        status varchar(12) NOT NULL DEFAULT 'open',
        occurrences int(10) unsigned NOT NULL DEFAULT 1,
        first_seen datetime NOT NULL,
        last_seen datetime NOT NULL,
        acknowledged_at datetime NULL,
        resolved_at datetime NULL,
        email_sent_at datetime NULL,
        last_mail_attempt_at datetime NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY fingerprint (fingerprint),
        KEY status_seen (status,last_seen),
        KEY last_seen (last_seen)
    ) {$charset};");
    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) return false;
    update_option('d24_alert_db_version', D24_ALERT_DB_VERSION, false);
    return true;
}

/** Only defined technical event types are allowed to create an incident. */
function d24_alert_event_descriptions(): array {
    return array(
        'order_mail_failed' => array('critical', 'Nieudana wysyłka zapytania do drukarni'),
        'confirmation_mail_failed' => array('warning', 'Brak potwierdzenia e-mail dla klienta'),
        'ready_mail_failed' => array('warning', 'Nie wysłano powiadomienia o gotowości'),
        'order_record_failed' => array('critical', 'Nie zapisano zlecenia w bazie'),
        'upload_validation_failed' => array('warning', 'Niepowodzenie przygotowania załączników'),
        'upload_error_burst' => array('warning', 'Wiele błędów przesyłania plików'),
        'service_upload_unavailable' => array('critical', 'Katalog uploadów jest niedostępny'),
        'service_monitor_unavailable' => array('critical', 'Baza monitoringu nie odpowiada'),
    );
}

function d24_alert_on_event(string $event, string $level, string $order_id = ''): void {
    if ($level !== 'warning' && $level !== 'error') return;
    $events = d24_alert_event_descriptions();
    if (!isset($events[$event])) return;
    $info = $events[$event];
    // Never include raw exception messages, customer details, filenames or tokens in alert e-mails.
    d24_alert_raise($event, $info[0], $info[1], $order_id);
}

function d24_alert_raise(string $category, string $severity, string $title, string $order_id = ''): bool {
    try {
        if (!d24_alert_install()) return false;
        global $wpdb;
        $table = d24_alert_table();
        $category = sanitize_key(substr($category, 0, 48));
        $order_id = substr(sanitize_text_field($order_id), 0, 64);
        $fingerprint = sha1($category . '|' . $order_id);
        $now = current_time('mysql', true);
        $severity = $severity === 'critical' ? 'critical' : 'warning';
        $title = substr(sanitize_text_field($title), 0, 180);
        // Atomic upsert prevents duplicate cards on concurrent uploads and repeated events.
        $sql = "INSERT INTO {$table} (fingerprint,category,severity,title,details,order_id,status,occurrences,first_seen,last_seen) "
            . "VALUES (%s,%s,%s,%s,'',%s,'open',1,%s,%s) "
            . "ON DUPLICATE KEY UPDATE occurrences=occurrences+1,last_seen=VALUES(last_seen), "
            . "email_sent_at=IF(status='resolved',NULL,email_sent_at), "
            . "last_mail_attempt_at=IF(status='resolved',NULL,last_mail_attempt_at), "
            . "resolved_at=IF(status='resolved',NULL,resolved_at), "
            . "acknowledged_at=IF(status='resolved',NULL,acknowledged_at), "
            . "status=IF(status='resolved','open',status)";
        $result = $wpdb->query($wpdb->prepare($sql, $fingerprint, $category, $severity, $title, $order_id, $now, $now));
        if ($result === false) return false;
        d24_alert_dispatch_pending();
        return true;
    } catch (Throwable $ignored) {
        // Never turn a customer's failed checkout into a fatal error.
        return false;
    }
}

function d24_alert_email_enabled(): bool {
    return get_option('d24_alert_email_enabled', 'yes') === 'yes';
}

/** Sends at most one incident mail per 20-minute window, without attachments or customer PII. */
function d24_alert_dispatch_pending(): void {
    if (!d24_alert_email_enabled() || !empty($GLOBALS['d24_alert_dispatch_active'])) return;
    if (get_transient('d24_alert_email_cooldown')) return;
    // Set before mail() so wp_mail_failed hooks / reentrant code cannot cause loops.
    set_transient('d24_alert_email_cooldown', 1, D24_ALERT_COOLDOWN_SECONDS);
    $GLOBALS['d24_alert_dispatch_active'] = true;
    try {
        if (!d24_alert_install()) return;
        global $wpdb;
        $table = d24_alert_table();
        $incident = $wpdb->get_row("SELECT id,category,severity,title,order_id,occurrences,first_seen FROM {$table} WHERE status='open' AND email_sent_at IS NULL ORDER BY first_seen ASC LIMIT 1", ARRAY_A);
        if (!$incident) {
            delete_transient('d24_alert_email_cooldown');
            return;
        }
        $id = (int) $incident['id'];
        $open_count = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE status='open'");
        $subject = '[Druk24 ALERT] ' . ($incident['severity'] === 'critical' ? 'AWARIA' : 'OSTRZEŻENIE') . ' – ' . $incident['title'];
        $message = "Automatyczny alert Drukulatora 0.22.7v\n\n"
            . $incident['title'] . "\n"
            . 'Typ: ' . $incident['category'] . "\n"
            . 'Zgłoszenie: ' . ($incident['order_id'] !== '' ? $incident['order_id'] : 'nie dotyczy') . "\n"
            . 'Pierwsze wykrycie (UTC): ' . $incident['first_seen'] . "\n"
            . 'Liczba wystąpień: ' . (int) $incident['occurrences'] . "\n"
            . 'Aktywne, niepotwierdzone alerty: ' . $open_count . "\n\n"
            . 'Panel: ' . home_url('/drukulator/staff-panel.php') . "\n\n"
            . "UWAGA: potwierdzenie przez wp_mail() oznacza tylko przyjęcie do wysłania, nie doręczenie.\n"
            . 'Jeżeli sam serwer pocztowy nie działa, ten alert e-mail może nie dotrzeć.';
        $headers = array('Content-Type: text/plain; charset=UTF-8', 'From: Druk24 <' . D24_ALERT_EMAIL . '>');
        $sent = false;
        try { $sent = d24_mail_send('admin_alert', (string) $incident['order_id'], D24_ALERT_EMAIL, $subject, $message, $headers); }
        catch (Throwable $ignored) { $sent = false; }
        $now = current_time('mysql', true);
        $changes = array('last_mail_attempt_at' => $now);
        if ($sent) $changes['email_sent_at'] = $now;
        $wpdb->update($table, $changes, array('id' => $id));
        update_option('d24_alert_last_email', array('attempt_at' => $now, 'accepted' => $sent, 'alert_id' => $id), false);
    } finally {
        $GLOBALS['d24_alert_dispatch_active'] = false;
    }
}

function d24_alert_actions(int $id, string $action): bool {
    if ($id <= 0 || !in_array($action, array('ack','resolve','reopen'), true) || !d24_alert_install()) return false;
    global $wpdb;
    $table = d24_alert_table();
    $row = $wpdb->get_row($wpdb->prepare("SELECT id,status FROM {$table} WHERE id=%d", $id), ARRAY_A);
    if (!$row) return false;
    $status = $action === 'ack' ? 'ack' : ($action === 'resolve' ? 'resolved' : 'open');
    if ($action === 'reopen' && $row['status'] !== 'resolved') return false;
    $now = current_time('mysql', true);
    $changes = array('status' => $status);
    if ($action === 'ack') $changes['acknowledged_at'] = $now;
    if ($action === 'resolve') $changes['resolved_at'] = $now;
    if ($action === 'reopen') { $changes['resolved_at'] = null; $changes['acknowledged_at'] = null; }
    return $wpdb->update($table, $changes, array('id' => $id)) !== false;
}

function d24_alert_resolve_service(string $category): void {
    if (!d24_alert_install()) return;
    global $wpdb;
    $fingerprint = sha1($category . '|');
    $wpdb->query($wpdb->prepare("UPDATE " . d24_alert_table() . " SET status='resolved',resolved_at=%s WHERE fingerprint=%s AND status<>'resolved'", current_time('mysql', true), $fingerprint));
}

/** Lightweight checks; performed opportunistically during WordPress traffic, not a real external uptime check. */
function d24_alert_tick(): void {
    global $wpdb;
    if (get_transient('d24_alert_health_check_lock')) { d24_alert_dispatch_pending(); return; }
    set_transient('d24_alert_health_check_lock', 1, 300);
    try {
        if (!d24_alert_install()) return;
        if (!get_transient('d24_alert_retention_lock')) {
            set_transient('d24_alert_retention_lock', 1, DAY_IN_SECONDS);
            $wpdb->query($wpdb->prepare("DELETE FROM " . d24_alert_table() . " WHERE status='resolved' AND last_seen < %s", gmdate('Y-m-d H:i:s', time() - 90 * DAY_IN_SECONDS)));
        }
        $monitor_ready = function_exists('d24_monitor_install') && d24_monitor_install();
        if ($monitor_ready && function_exists('d24_monitor_table')) {
            $monitor_table = d24_monitor_table();
            $monitor_ready = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $monitor_table)) === $monitor_table;
        }
        d24_alert_service_state('service_monitor_unavailable', $monitor_ready);
        $stage_ready = false;
        if (function_exists('drukulator_stage_root')) {
            try { $stage_ready = is_writable(drukulator_stage_root()); } catch (Throwable $ignored) { }
        }
        d24_alert_service_state('service_upload_unavailable', $stage_ready);
        if (function_exists('d24_monitor_upload_errors')) {
            $recent = array_filter(d24_monitor_upload_errors(), static fn($r) => strtotime((string) $r['created_at'] . ' UTC') >= time() - 900);
            $count = count($recent);
            if ($count >= 3) {
                // One notification per burst, not per chunk; refreshed every 30 minutes at most.
                if (!get_transient('d24_alert_upload_burst_lock')) {
                    set_transient('d24_alert_upload_burst_lock', 1, 1800);
                    d24_monitor_log('upload_error_burst', 'error', 'Wykryto co najmniej 3 błędy uploadu w 15 minut', '', array('count' => $count));
                }
            } else {
                d24_alert_resolve_service('upload_error_burst');
            }
        }
        update_option('d24_alert_last_check', gmdate('Y-m-d H:i:s'), false);
    } catch (Throwable $ignored) { /* Monitoring is non-blocking. */ }
    d24_alert_dispatch_pending();
}

function d24_alert_service_state(string $category, bool $healthy): void {
    $last = get_option('d24_alert_service_' . $category, 'unknown');
    if ($healthy) {
        if ($last === 'down') {
            d24_alert_resolve_service($category);
            d24_monitor_log('service_recovered', 'info', 'Przywrócono działanie usługi', '', array('method' => $category));
        }
        update_option('d24_alert_service_' . $category, 'ok', false);
    } else {
        if ($last !== 'down') {
            if ($category === 'service_monitor_unavailable') { d24_alert_on_event($category, 'error'); }
            else { d24_monitor_log($category, 'error', 'Wykryto niedostępność usługi'); }
        }
        update_option('d24_alert_service_' . $category, 'down', false);
    }
}

function d24_alert_dashboard(): array {
    global $wpdb;
    $installed = d24_alert_install();
    $table = d24_alert_table();
    $rows = $installed ? $wpdb->get_results("SELECT id,category,severity,title,order_id,status,occurrences,first_seen,last_seen,acknowledged_at,resolved_at,email_sent_at,last_mail_attempt_at FROM {$table} ORDER BY (status='open') DESC,(status='ack') DESC,last_seen DESC LIMIT 80", ARRAY_A) : array();
    if (!is_array($rows)) $rows = array();
    foreach ($rows as &$row) { $row['id'] = (int) $row['id']; $row['occurrences'] = (int) $row['occurrences']; }
    unset($row);
    $open = $installed ? (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE status='open'") : 0;
    $ack = $installed ? (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE status='ack'") : 0;
    $last = get_option('d24_alert_last_email', array());
    return array(
        'available' => $installed,
        'open' => $open,
        'acknowledged' => $ack,
        'alerts' => $rows,
        'email_enabled' => d24_alert_email_enabled(),
        'recipient' => D24_ALERT_EMAIL,
        'last_email' => is_array($last) ? $last : array(),
        'last_check' => (string) get_option('d24_alert_last_check', ''),
        'email_cooldown_seconds' => D24_ALERT_COOLDOWN_SECONDS,
        'note' => 'Alerty przy ruchu na stronie; przerwy w działaniu całego hostingu wymagają zewnętrznego monitora URL /drukulator/health.php.'
    );
}
