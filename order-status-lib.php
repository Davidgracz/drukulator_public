<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/mail-audit-lib.php';

const DRUKULATOR_ORDERS_DB_VERSION = '1.3';
const DRUKULATOR_ORDERS_RETENTION_MONTHS = 24;

function drukulator_orders_table_name(): string
{
    global $wpdb;
    return $wpdb->prefix . 'drukulator_orders';
}

function drukulator_order_statuses(): array
{
    return array(
        'received' => 'Zapytanie otrzymane',
        'confirmed' => 'Wycena potwierdzona',
        'awaiting_files' => 'Oczekiwanie na pliki / informacje',
        'production' => 'W produkcji',
        'ready' => 'Gotowe',
        'cancelled' => 'Anulowane',
    );
}

function drukulator_orders_install(): bool
{
    $installed = (string) get_option('drukulator_orders_db_version', '');
    if ($installed === DRUKULATOR_ORDERS_DB_VERSION) {
        return true;
    }

    global $wpdb;
    $table = drukulator_orders_table_name();
    $charset_collate = $wpdb->get_charset_collate();

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    $sql = "CREATE TABLE {$table} (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        order_id varchar(64) NOT NULL,
        access_hash char(64) NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'received',
        total decimal(12,2) NOT NULL DEFAULT 0,
        items longtext NOT NULL,
        customer_name varchar(190) NOT NULL DEFAULT '',
        customer_email varchar(190) NOT NULL DEFAULT '',
        customer_phone varchar(80) NOT NULL DEFAULT '',
        pickup varchar(120) NOT NULL DEFAULT '',
        notes text NOT NULL,
        public_note text NOT NULL,
        order_name varchar(190) NOT NULL DEFAULT '',
        internal_note text NOT NULL,
        assigned_staff_id bigint(20) unsigned NULL,
        assigned_name varchar(190) NOT NULL DEFAULT '',
        priority varchar(16) NOT NULL DEFAULT 'normal',
        due_date date NULL DEFAULT NULL,
        production_started_at datetime NULL DEFAULT NULL,
        production_finished_at datetime NULL DEFAULT NULL,
        work_started_at datetime NULL DEFAULT NULL,
        work_seconds int(10) unsigned NOT NULL DEFAULT 0,
        ready_notified_at datetime NULL DEFAULT NULL,
        history longtext NOT NULL,
        created_at datetime NOT NULL,
        updated_at datetime NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY order_id (order_id),
        KEY status (status),
        KEY created_at (created_at)
    ) {$charset_collate};";

    dbDelta($sql);

    $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
    if ($exists !== $table) {
        return false;
    }

    update_option('drukulator_orders_db_version', DRUKULATOR_ORDERS_DB_VERSION, false);
    return true;
}

function drukulator_orders_token_hash(string $token): string
{
    return hash_hmac('sha256', $token, wp_salt('auth'));
}

function drukulator_orders_cleanup(): void
{
    global $wpdb;
    $table = drukulator_orders_table_name();
    $threshold_date = new DateTimeImmutable('now', wp_timezone());
    $threshold = $threshold_date->modify('-' . DRUKULATOR_ORDERS_RETENTION_MONTHS . ' months')->format('Y-m-d H:i:s');
    $wpdb->query($wpdb->prepare("DELETE FROM {$table} WHERE created_at < %s", $threshold));
}

function drukulator_orders_store(array $order, string $access_token): bool
{
    if (!drukulator_orders_install()) {
        return false;
    }

    global $wpdb;
    $table = drukulator_orders_table_name();
    $now = current_time('mysql');
    $statuses = drukulator_order_statuses();
    $history = array(array(
        'status' => 'received',
        'label' => $statuses['received'],
        'at' => $now,
    ));

    $result = $wpdb->insert(
        $table,
        array(
            'order_id' => (string) ($order['order_id'] ?? ''),
            'access_hash' => drukulator_orders_token_hash($access_token),
            'status' => 'received',
            'total' => (float) ($order['total'] ?? 0),
            'items' => wp_json_encode($order['items'] ?? array(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'customer_name' => (string) ($order['customer_name'] ?? ''),
            'customer_email' => (string) ($order['customer_email'] ?? ''),
            'customer_phone' => (string) ($order['customer_phone'] ?? ''),
            'pickup' => (string) ($order['pickup'] ?? ''),
            'notes' => (string) ($order['notes'] ?? ''),
            'public_note' => '',
            'order_name' => '',
            'internal_note' => '',
            'assigned_staff_id' => null,
            'assigned_name' => '',
            'history' => wp_json_encode($history, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'created_at' => $now,
            'updated_at' => $now,
        ),
        array('%s', '%s', '%s', '%f', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s')
    );

    if ($result !== false && mt_rand(1, 20) === 1) {
        drukulator_orders_cleanup();
    }

    return $result !== false;
}

function drukulator_orders_delete(string $order_id): void
{
    global $wpdb;
    $wpdb->delete(drukulator_orders_table_name(), array('order_id' => $order_id), array('%s'));
}

function drukulator_orders_get(string $order_id): ?array
{
    if (!drukulator_orders_install()) {
        return null;
    }

    global $wpdb;
    $table = drukulator_orders_table_name();
    $row = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM {$table} WHERE order_id = %s LIMIT 1", $order_id),
        ARRAY_A
    );

    if (!is_array($row)) {
        return null;
    }

    $row['items'] = json_decode((string) $row['items'], true) ?: array();
    $row['history'] = json_decode((string) $row['history'], true) ?: array();
    return $row;
}

function drukulator_orders_verify(array $order, string $access_token): bool
{
    if ($access_token === '' || empty($order['access_hash'])) {
        return false;
    }
    return hash_equals((string) $order['access_hash'], drukulator_orders_token_hash($access_token));
}

function drukulator_orders_update_status(string $order_id, string $status, string $public_note = '', string $actor = ''): bool
{
    $statuses = drukulator_order_statuses();
    if (!isset($statuses[$status])) {
        return false;
    }

    $order = drukulator_orders_get($order_id);
    if (!$order) {
        return false;
    }

    $now = current_time('mysql');
    $history = is_array($order['history']) ? $order['history'] : array();
    $history[] = array(
        'status' => $status,
        'label' => $statuses[$status],
        'at' => $now,
        'note' => $public_note,
    );

    global $wpdb;
    $updated = $wpdb->update(
        drukulator_orders_table_name(),
        array(
            'status' => $status,
            'public_note' => $public_note,
            'history' => wp_json_encode($history, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'updated_at' => $now,
        ),
        array('order_id' => $order_id),
        array('%s', '%s', '%s', '%s'),
        array('%s')
    );

    return $updated !== false;
}

function drukulator_orders_ready_email(array $order): array
{
    $email = sanitize_email((string) ($order['customer_email'] ?? ''));
    if ($email === '' || !is_email($email)) {
        return array('sent' => false, 'message' => 'Brak prawidłowego adresu e-mail klienta.');
    }

    if (!empty($order['ready_notified_at'])) {
        return array(
            'sent' => true,
            'already_sent' => true,
            'message' => 'Powiadomienie o gotowości zostało już wcześniej wysłane.',
            'sent_at' => (string) $order['ready_notified_at'],
        );
    }

    $contact_email = defined('DRUKULATOR_CONTACT_EMAIL') ? (string) DRUKULATOR_CONTACT_EMAIL : 'biuro@druk24.szczecin.pl';
    $order_id = (string) ($order['order_id'] ?? '');
    $order_name = trim((string) ($order['order_name'] ?? ''));
    $display_name = $order_name !== '' ? $order_name : $order_id;
    $customer_name = trim((string) ($order['customer_name'] ?? ''));
    $public_note = trim((string) ($order['public_note'] ?? ''));
    $subject = 'Zlecenie gotowe – Druk24 – ' . $display_name;

    $message = '<!doctype html><html lang="pl"><head><meta charset="UTF-8"></head>';
    $message .= '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">';
    $message .= '<div style="max-width:700px;margin:0 auto;padding:28px 16px;">';
    $message .= '<div style="background:#ffffff;border:1px solid #d7dee8;border-radius:14px;padding:28px;">';
    $message .= '<div style="display:inline-block;margin-bottom:18px;padding:7px 11px;border-radius:999px;background:#dcfce7;color:#166534;font-size:13px;font-weight:800;">GOTOWE</div>';
    $message .= '<h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#111827;">Twoje zlecenie jest gotowe</h1>';
    $message .= '<p style="margin:0 0 12px;line-height:1.65;">Dzień dobry' . ($customer_name !== '' ? ' ' . esc_html($customer_name) : '') . ',</p>';
    $message .= '<p style="margin:0 0 12px;line-height:1.65;">Informujemy, że zlecenie <strong>' . esc_html($display_name) . '</strong> zostało oznaczone jako gotowe.</p>';
    $message .= '<div style="margin:20px 0;padding:16px 18px;border-radius:10px;background:#0f172a;color:#ffffff;">';
    $message .= '<div style="font-size:12px;opacity:.72;margin-bottom:5px;">NUMER ZLECENIA</div><div style="font-size:20px;font-weight:800;">' . esc_html($order_id) . '</div>';
    $message .= '</div>';
    if ($public_note !== '') {
        $message .= '<div style="margin:20px 0;padding:16px 18px;border-left:4px solid #0faaa5;background:#ecfeff;border-radius:8px;line-height:1.6;"><strong>Informacja od Druk24:</strong><br>' . nl2br(esc_html($public_note)) . '</div>';
    }
    $message .= '<p style="margin:18px 0 0;line-height:1.65;color:#475569;">W razie pytań dotyczących odbioru lub szczegółów zlecenia odpowiedz na tę wiadomość albo skontaktuj się z nami telefonicznie.</p>';
    $message .= '<div style="margin-top:26px;padding-top:20px;border-top:1px solid #d7dee8;color:#475569;line-height:1.65;"><strong>Zespół Druk24</strong><br>' . esc_html($contact_email) . '</div>';
    $message .= '</div></div></body></html>';

    $headers = array(
        'Content-Type: text/html; charset=UTF-8',
        'From: Druk24 <' . $contact_email . '>',
        'Reply-To: Druk24 <' . $contact_email . '>',
    );

    $sent = d24_mail_send('customer_ready', $order_id, $email, $subject, $message, $headers);
    if (!$sent) {
        return array('sent' => false, 'message' => 'Status zapisano, ale serwer pocztowy nie przyjął wiadomości do klienta.');
    }

    $now = current_time('mysql');
    global $wpdb;
    $wpdb->update(
        drukulator_orders_table_name(),
        array('ready_notified_at' => $now, 'updated_at' => $now),
        array('order_id' => $order_id),
        array('%s', '%s'),
        array('%s')
    );

    return array(
        'sent' => true,
        'already_sent' => false,
        'message' => 'WordPress przyjął wiadomość o gotowości do wysłania (doręczenie niepotwierdzone).',
        'sent_at' => $now,
    );
}

function drukulator_orders_list(int $limit = 250): array
{
    if (!drukulator_orders_install()) {
        return array();
    }
    $limit = max(1, min(500, $limit));
    global $wpdb;
    $table = drukulator_orders_table_name();
    $rows = $wpdb->get_results("SELECT * FROM {$table} ORDER BY updated_at DESC LIMIT {$limit}", ARRAY_A);
    foreach ($rows as &$row) {
        $row['items'] = json_decode((string) $row['items'], true) ?: array();
        $row['history'] = json_decode((string) $row['history'], true) ?: array();
        $row['id'] = (int) $row['id'];
        $row['total'] = (float) $row['total'];
        $row['work_seconds'] = (int) ($row['work_seconds'] ?? 0);
        $row['priority'] = (string) ($row['priority'] ?? 'normal');
        $row['assigned_staff_id'] = $row['assigned_staff_id'] !== null ? (int) $row['assigned_staff_id'] : null;
        unset($row['access_hash']);
    }
    unset($row);
    return $rows;
}

function drukulator_orders_update_management(string $order_id, array $changes): bool
{
    $order = drukulator_orders_get($order_id);
    if (!$order) {
        return false;
    }
    $data = array();
    $formats = array();
    if (array_key_exists('order_name', $changes)) {
        $data['order_name'] = sanitize_text_field((string) $changes['order_name']);
        $formats[] = '%s';
    }
    if (array_key_exists('internal_note', $changes)) {
        $note = sanitize_textarea_field((string) $changes['internal_note']);
        $data['internal_note'] = function_exists('mb_substr') ? mb_substr($note, 0, 4000, 'UTF-8') : substr($note, 0, 4000);
        $formats[] = '%s';
    }
    if (array_key_exists('assigned_staff_id', $changes)) {
        $assigned = $changes['assigned_staff_id'];
        $data['assigned_staff_id'] = $assigned === null || $assigned === '' ? null : max(0, (int) $assigned);
        $formats[] = '%d';
    }
    if (array_key_exists('assigned_name', $changes)) {
        $data['assigned_name'] = sanitize_text_field((string) $changes['assigned_name']);
        $formats[] = '%s';
    }
    if (!$data) {
        return true;
    }
    $data['updated_at'] = current_time('mysql');
    $formats[] = '%s';
    global $wpdb;
    return $wpdb->update(drukulator_orders_table_name(), $data, array('order_id' => $order_id), $formats, array('%s')) !== false;
}

function drukulator_orders_status_url(string $order_id, string $access_token): string
{
    return add_query_arg(
        array(
            'order' => $order_id,
            'key' => $access_token,
        ),
        home_url('/drukulator/status.php')
    );
}
