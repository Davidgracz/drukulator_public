<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/order-status-lib.php';

const D24_PRODUCTION_DB_VERSION = '1.0';

function d24_production_events_table(): string
{
    global $wpdb;
    return $wpdb->prefix . 'drukulator_production_events';
}

function d24_production_priorities(): array
{
    return array('low' => 'Niski', 'normal' => 'Normalny', 'high' => 'Wysoki', 'urgent' => 'Pilne');
}

function d24_production_install(): bool
{
    if ((string) get_option('d24_production_db_version', '') === D24_PRODUCTION_DB_VERSION) {
        return true;
    }
    if (!drukulator_orders_install()) {
        return false;
    }
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $table = d24_production_events_table();
    $sql = "CREATE TABLE {$table} (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        order_id varchar(64) NOT NULL,
        actor_id bigint(20) unsigned NOT NULL DEFAULT 0,
        actor_name varchar(190) NOT NULL DEFAULT '',
        event_type varchar(40) NOT NULL,
        details longtext NOT NULL,
        created_at datetime NOT NULL,
        PRIMARY KEY  (id),
        KEY order_id (order_id),
        KEY created_at (created_at)
    ) " . $wpdb->get_charset_collate() . ';';
    dbDelta($sql);
    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) {
        return false;
    }
    update_option('d24_production_db_version', D24_PRODUCTION_DB_VERSION, false);
    return true;
}

function d24_production_event(string $order_id, string $event_type, array $actor, array $details = array()): bool
{
    if (!d24_production_install() || $order_id === '' || strlen($order_id) > 64) {
        return false;
    }
    global $wpdb;
    $safe = array();
    foreach (array('before', 'after', 'priority', 'due_date', 'status') as $key) {
        if (isset($details[$key]) && (is_string($details[$key]) || is_numeric($details[$key]))) {
            $safe[$key] = substr(sanitize_text_field((string) $details[$key]), 0, 190);
        }
    }
    $res = $wpdb->insert(d24_production_events_table(), array(
        'order_id' => $order_id,
        'actor_id' => max(0, (int) ($actor['id'] ?? 0)),
        'actor_name' => substr(sanitize_text_field((string) ($actor['display_name'] ?? 'System')), 0, 190),
        'event_type' => substr(sanitize_key($event_type), 0, 40),
        'details' => wp_json_encode($safe, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'created_at' => current_time('mysql'),
    ), array('%s', '%d', '%s', '%s', '%s', '%s'));
    // Cleanup is best-effort, in line with the 24-month orders retention policy.
    if ($res !== false && mt_rand(1, 100) === 1) {
        $cutoff = (new DateTimeImmutable('now', wp_timezone()))->modify('-24 months')->format('Y-m-d H:i:s');
        $wpdb->query($wpdb->prepare('DELETE FROM ' . d24_production_events_table() . ' WHERE created_at < %s', $cutoff));
    }
    return $res !== false;
}

function d24_production_events(string $order_id, int $limit = 50): array
{
    if (!d24_production_install()) return array();
    global $wpdb;
    $limit = max(1, min(100, $limit));
    $table = d24_production_events_table();
    $rows = $wpdb->get_results($wpdb->prepare("SELECT id, actor_name, event_type, details, created_at FROM {$table} WHERE order_id = %s ORDER BY id DESC LIMIT %d", $order_id, $limit), ARRAY_A);
    foreach ($rows as &$row) {
        $row['details'] = json_decode((string) ($row['details'] ?? ''), true) ?: array();
        $row['id'] = (int) $row['id'];
    }
    unset($row);
    return $rows ?: array();
}

function d24_production_validate_due($value): ?string
{
    $value = trim((string) $value);
    if ($value === '') return '';
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) return null;
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $value, wp_timezone());
    return $d && $d->format('Y-m-d') === $value && (int) $d->format('Y') >= 2000 && (int) $d->format('Y') <= 2100 ? $value : null;
}

function d24_production_update(string $order_id, string $priority, string $due, array $actor): array
{
    $priorities = d24_production_priorities();
    $due_date = d24_production_validate_due($due);
    if (!isset($priorities[$priority]) || $due_date === null) {
        return array(false, 'Nieprawidłowy priorytet lub termin.');
    }
    $order = drukulator_orders_get($order_id);
    if (!$order) return array(false, 'Nie znaleziono zlecenia.');
    $old_priority = (string) ($order['priority'] ?? 'normal');
    $old_due = (string) ($order['due_date'] ?? '');
    if ($old_priority === $priority && $old_due === $due_date) return array(true, 'Brak zmian.');
    global $wpdb;
    $updated = $wpdb->update(drukulator_orders_table_name(), array(
        'priority' => $priority,
        'due_date' => $due_date !== '' ? $due_date : null,
        'updated_at' => current_time('mysql'),
    ), array('order_id' => $order_id), array('%s', '%s', '%s'), array('%s'));
    if ($updated === false) return array(false, 'Błąd zapisu terminu i priorytetu.');
    if ($old_priority !== $priority) {
        d24_production_event($order_id, 'priority_changed', $actor, array('before' => $old_priority, 'after' => $priority));
    }
    if ($old_due !== $due_date) {
        d24_production_event($order_id, 'deadline_changed', $actor, array('before' => $old_due ?: 'brak', 'after' => $due_date ?: 'brak'));
    }
    return array(true, 'Zapisano priorytet i termin.');
}

function d24_production_work(string $order_id, string $action, array $actor): array
{
    if ($action !== 'start' && $action !== 'pause') return array(false, 'Nieobsługiwana akcja.');
    $order = drukulator_orders_get($order_id);
    if (!$order) return array(false, 'Nie znaleziono zlecenia.');
    if ($action === 'start' && in_array((string) $order['status'], array('ready', 'cancelled'), true)) {
        return array(false, 'Nie można uruchomić stopera dla zakończonego zlecenia.');
    }
    global $wpdb;
    $table = drukulator_orders_table_name();
    $now = current_time('mysql');
    if ($action === 'start') {
        if (!empty($order['work_started_at'])) return array(false, 'Stoper już działa.');
        $updated = $wpdb->query($wpdb->prepare("UPDATE {$table} SET work_started_at = %s, updated_at = %s WHERE order_id = %s AND work_started_at IS NULL AND status NOT IN ('ready', 'cancelled')", $now, $now, $order_id));
        if ($updated !== 1) return array(false, 'Nie udało się uruchomić stopera. Odśwież panel.');
        d24_production_event($order_id, 'work_started', $actor);
        return array(true, 'Uruchomiono pomiar czasu pracy.');
    }
    $started = (string) ($order['work_started_at'] ?? '');
    if ($started === '') return array(false, 'Stoper nie jest uruchomiony.');
    // Use WordPress's local timezone, including DST, to measure elapsed time.
    $tz = wp_timezone();
    $from = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $started, $tz);
    $to = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $now, $tz);
    $seconds = $from && $to ? max(0, min(86400 * 30, $to->getTimestamp() - $from->getTimestamp())) : 0;
    $updated = $wpdb->query($wpdb->prepare("UPDATE {$table} SET work_seconds = work_seconds + %d, work_started_at = NULL, updated_at = %s WHERE order_id = %s AND work_started_at = %s", $seconds, $now, $order_id, $started));
    if ($updated !== 1) return array(false, 'Stoper zmienił się w innej sesji. Odśwież panel.');
    d24_production_event($order_id, 'work_paused', $actor, array('after' => (string) $seconds));
    return array(true, 'Zapisano czas pracy: ' . (int) ceil($seconds / 60) . ' min (zaokrąglone).');
}

function d24_production_status_changed(string $order_id, string $old, string $new, array $actor): void
{
    if ($old === $new) return;
    global $wpdb;
    $table = drukulator_orders_table_name();
    $now = current_time('mysql');
    if (in_array($old, array('ready', 'cancelled'), true) && !in_array($new, array('ready', 'cancelled'), true)) {
        $wpdb->update($table, array('production_finished_at' => null), array('order_id' => $order_id), array('%s'), array('%s'));
    }
    if ($new === 'production') {
        $wpdb->query($wpdb->prepare("UPDATE {$table} SET production_started_at = COALESCE(production_started_at, %s), production_finished_at = NULL WHERE order_id = %s", $now, $order_id));
    }
    if ($new === 'ready' || $new === 'cancelled') {
        // Finish an active work session first; no duplicate accumulation on repeated calls.
        $order = drukulator_orders_get($order_id);
        if ($order && !empty($order['work_started_at'])) d24_production_work($order_id, 'pause', $actor);
        if ($new === 'ready') {
            $wpdb->update($table, array('production_finished_at' => $now), array('order_id' => $order_id), array('%s'), array('%s'));
        }
    }
    d24_production_event($order_id, 'status_changed', $actor, array('before' => $old, 'after' => $new));
}

function d24_production_summary(): array
{
    global $wpdb;
    $table = drukulator_orders_table_name();
    $today = current_time('Y-m-d');
    $sql = "SELECT
        COUNT(*) AS total,
        SUM(status NOT IN ('ready', 'cancelled')) AS open_orders,
        SUM(status = 'production') AS in_production,
        SUM(status NOT IN ('ready', 'cancelled') AND due_date IS NOT NULL AND due_date < %s) AS overdue,
        SUM(status NOT IN ('ready', 'cancelled') AND due_date = %s) AS due_today,
        SUM(status NOT IN ('ready', 'cancelled') AND priority = 'urgent') AS urgent,
        SUM(status NOT IN ('ready', 'cancelled') AND assigned_staff_id IS NULL) AS unassigned,
        SUM(work_started_at IS NOT NULL) AS clocks_running,
        SUM(work_seconds) AS work_seconds
        FROM {$table}";
    $data = $wpdb->get_row($wpdb->prepare($sql, $today, $today), ARRAY_A);
    return array_map('intval', is_array($data) ? $data : array());
}
