<?php
/** Drukulator 0.22.7v - privacy-minimal mail acceptance audit. */
declare(strict_types=1);
if (!defined('ABSPATH')) { exit; }

const D24_MAIL_AUDIT_DB_VERSION = '1.0';
const D24_MAIL_AUDIT_RETENTION_DAYS = 60;

function d24_mail_audit_table(): string {
    global $wpdb;
    return $wpdb->prefix . 'drukulator_mail_attempts';
}

function d24_mail_audit_install(): bool {
    if (get_option('d24_mail_audit_db_version') === D24_MAIL_AUDIT_DB_VERSION) return true;
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $table = d24_mail_audit_table();
    dbDelta("CREATE TABLE {$table} (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        created_at datetime NOT NULL,
        category varchar(30) NOT NULL,
        order_id varchar(64) NOT NULL DEFAULT '',
        result varchar(16) NOT NULL,
        error_code varchar(64) NOT NULL DEFAULT '',
        attachment_count int(10) unsigned NOT NULL DEFAULT 0,
        attachment_bytes bigint(20) unsigned NOT NULL DEFAULT 0,
        duration_ms int(10) unsigned NOT NULL DEFAULT 0,
        PRIMARY KEY  (id),
        KEY created_at (created_at),
        KEY category_created (category,created_at),
        KEY order_id (order_id)
    ) {$wpdb->get_charset_collate()};");
    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) return false;
    update_option('d24_mail_audit_db_version', D24_MAIL_AUDIT_DB_VERSION, false);
    return true;
}

/** Record only allowlisted technical fields. No recipients, subjects, messages, filenames, headers or SMTP secrets. */
function d24_mail_audit_record(string $category, string $order_id, bool $accepted, string $error_code, int $files, int $bytes, int $duration_ms): bool {
    try {
        if (!d24_mail_audit_install()) return false;
        global $wpdb;
        $categories = array('office_order', 'customer_confirmation', 'customer_ready', 'admin_alert', 'admin_test');
        $category = in_array($category, $categories, true) ? $category : 'admin_test';
        $error_code = preg_replace('/[^a-zA-Z0-9_.:-]/', '', substr($error_code, 0, 64));
        $ok = $wpdb->insert(d24_mail_audit_table(), array(
            'created_at' => current_time('mysql', true),
            'category' => $category,
            'order_id' => substr(sanitize_text_field($order_id), 0, 64),
            'result' => $accepted ? 'accepted' : 'failed',
            'error_code' => $accepted ? '' : $error_code,
            'attachment_count' => max(0, min(5, $files)),
            'attachment_bytes' => max(0, $bytes),
            'duration_ms' => max(0, min(1800000, $duration_ms)),
        ), array('%s','%s','%s','%s','%s','%d','%d','%d'));
        if ($ok && !get_transient('d24_mail_audit_cleanup_lock')) {
            set_transient('d24_mail_audit_cleanup_lock', 1, DAY_IN_SECONDS);
            $cutoff = gmdate('Y-m-d H:i:s', time() - D24_MAIL_AUDIT_RETENTION_DAYS * DAY_IN_SECONDS);
            $wpdb->query($wpdb->prepare('DELETE FROM ' . d24_mail_audit_table() . ' WHERE created_at < %s', $cutoff));
        }
        return (bool) $ok;
    } catch (Throwable $ignored) { return false; }
}

/**
 * Wrap wp_mail without altering its delivery behavior. Scope error hook to this one call.
 * wp_mail true = WordPress accepted the request; it is NOT proof of SMTP delivery.
 */
function d24_mail_send(string $category, string $order_id, $to, string $subject, string $message, $headers = array(), $attachments = array()): bool {
    $started = microtime(true);
    $error_code = '';
    $listener = static function ($error) use (&$error_code): void {
        if (is_object($error) && method_exists($error, 'get_error_code')) {
            $error_code = (string) $error->get_error_code(); // error code only, never error data/message
        }
    };
    $paths = is_array($attachments) ? $attachments : ($attachments !== '' ? array($attachments) : array());
    $bytes = 0;
    foreach ($paths as $path) {
        if (is_string($path) && is_file($path)) {
            $size = @filesize($path);
            if ($size !== false) $bytes += (int) $size;
        }
    }
    $sent = false;
    if (function_exists('add_action')) add_action('wp_mail_failed', $listener, 10, 1);
    try {
        $sent = (bool) wp_mail($to, $subject, $message, $headers, $attachments);
    } catch (Throwable $ignored) {
        $sent = false;
        if ($error_code === '') $error_code = 'php_exception';
    } finally {
        if (function_exists('remove_action')) remove_action('wp_mail_failed', $listener, 10);
    }
    if (!$sent && $error_code === '') $error_code = 'wp_mail_false';
    d24_mail_audit_record($category, $order_id, $sent, $error_code, count($paths), $bytes, (int) round((microtime(true) - $started) * 1000));
    return $sent;
}

function d24_mail_audit_dashboard(): array {
    try {
        if (!d24_mail_audit_install()) return array('available' => false, 'rows' => array(), 'accepted_24h' => 0, 'failed_24h' => 0, 'note' => 'Baza audytu poczty jest niedostępna.');
        global $wpdb;
        $table = d24_mail_audit_table();
        $rows = $wpdb->get_results("SELECT id,created_at,category,order_id,result,error_code,attachment_count,attachment_bytes,duration_ms FROM {$table} ORDER BY id DESC LIMIT 100", ARRAY_A);
        if (!is_array($rows)) $rows = array();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['attachment_count'] = (int) $row['attachment_count'];
            $row['attachment_bytes'] = (int) $row['attachment_bytes'];
            $row['duration_ms'] = (int) $row['duration_ms'];
        }
        unset($row);
        $since = gmdate('Y-m-d H:i:s', time() - DAY_IN_SECONDS);
        $counts = $wpdb->get_results($wpdb->prepare("SELECT result,COUNT(*) AS n FROM {$table} WHERE created_at >= %s GROUP BY result", $since), ARRAY_A);
        $c = array('accepted' => 0, 'failed' => 0);
        foreach ((array) $counts as $count) {
            if (isset($c[$count['result']])) $c[$count['result']] = (int) $count['n'];
        }
        return array('available' => true, 'rows' => $rows,
            'accepted_24h' => $c['accepted'], 'failed_24h' => $c['failed'],
            'note' => 'Historia obejmuje wyłącznie wysyłki wykonywane przez Drukulator od wersji 0.22.7v. „Przyjęto przez WordPress” NIE potwierdza dostarczenia przez SMTP; bez integracji z dostawcą nie znamy statusu doręczenia. Dane techniczne 60 dni.');
    } catch (Throwable $ignored) {
        return array('available' => false, 'rows' => array(), 'accepted_24h' => 0, 'failed_24h' => 0, 'note' => 'Błąd odczytu audytu poczty.');
    }
}

/** Atomic, SQL-backed 5-minute rate limit for explicit admin ready-mail retries. */
function d24_mail_ready_retry_lock(string $order_id): bool {
    try {
        global $wpdb;
        $name = 'd24_ready_retry_' . sha1($order_id);
        $now = time();
        // wp_options.option_name has a UNIQUE key; only one concurrent request can win.
        $sql = "INSERT INTO {$wpdb->options} (option_name,option_value,autoload) VALUES (%s,%s,'off') "
            . "ON DUPLICATE KEY UPDATE option_value = IF(CAST(option_value AS UNSIGNED) <= %d, VALUES(option_value), option_value)";
        $changed = $wpdb->query($wpdb->prepare($sql, $name, (string) $now, $now - 300));
        return $changed !== false && (int) $changed > 0;
    } catch (Throwable $ignored) { return false; }
}
