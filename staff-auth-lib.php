<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

const D24_STAFF_DB_VERSION = '1.0';
const D24_STAFF_SESSION_HOURS = 12;
const D24_STAFF_GATE_TTL = 600;
const D24_STAFF_COOKIE = 'd24_staff_session';
const D24_STAFF_GATE_COOKIE = 'd24_staff_gate';
// Domyślny hash frazy bramki NIE jest publikowany w repozytorium. Na serwerze zostaje wartość z wdrożonego pliku;
// puste ('') = bramka zamknięta, dopóki fraza nie zostanie zapisana w opcji d24_staff_gate_hash.
const D24_STAFF_DEFAULT_GATE_HASH = '';

function d24_staff_permissions_catalog(): array
{
    return array(
        'orders_view' => 'Podgląd zleceń',
        'orders_status' => 'Zmiana statusu zleceń',
        'orders_rename' => 'Nadawanie nazw zleceniom',
        'orders_notes' => 'Notatki wewnętrzne',
        'orders_assign' => 'Przypisywanie pracowników',
        'orders_production' => 'Terminy, priorytety i czas pracy',
        'analytics_view' => 'Podgląd Analytics',
    );
}

function d24_staff_users_table(): string
{
    global $wpdb;
    return $wpdb->prefix . 'drukulator_staff_users';
}

function d24_staff_sessions_table(): string
{
    global $wpdb;
    return $wpdb->prefix . 'drukulator_staff_sessions';
}

function d24_staff_install(): bool
{
    $installed = (string) get_option('d24_staff_db_version', '');
    if ($installed === D24_STAFF_DB_VERSION) {
        return true;
    }

    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();
    $users = d24_staff_users_table();
    $sessions = d24_staff_sessions_table();

    dbDelta("CREATE TABLE {$users} (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        username varchar(80) NOT NULL,
        display_name varchar(160) NOT NULL,
        password_hash varchar(255) NOT NULL,
        permissions longtext NOT NULL,
        active tinyint(1) NOT NULL DEFAULT 1,
        created_at datetime NOT NULL,
        updated_at datetime NOT NULL,
        last_login_at datetime NULL,
        PRIMARY KEY (id),
        UNIQUE KEY username (username),
        KEY active (active)
    ) {$charset};");

    dbDelta("CREATE TABLE {$sessions} (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        staff_user_id bigint(20) unsigned NOT NULL,
        token_hash char(64) NOT NULL,
        created_at datetime NOT NULL,
        last_seen_at datetime NOT NULL,
        expires_at datetime NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY token_hash (token_hash),
        KEY staff_user_id (staff_user_id),
        KEY expires_at (expires_at)
    ) {$charset};");

    $users_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $users));
    $sessions_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $sessions));
    if ($users_exists !== $users || $sessions_exists !== $sessions) {
        return false;
    }

    update_option('d24_staff_db_version', D24_STAFF_DB_VERSION, false);
    return true;
}

function d24_staff_normalize_phrase(string $value): string
{
    $value = trim(function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value));
    $value = preg_replace('/\s+/u', ' ', $value) ?: $value;
    return $value;
}

function d24_staff_gate_hash(): string
{
    $saved = (string) get_option('d24_staff_gate_hash', '');
    return preg_match('/^[a-f0-9]{64}$/', $saved) ? $saved : D24_STAFF_DEFAULT_GATE_HASH;
}

function d24_staff_verify_gate_phrase(string $phrase): bool
{
    $candidate = hash('sha256', d24_staff_normalize_phrase($phrase));
    return hash_equals(d24_staff_gate_hash(), $candidate);
}

function d24_staff_set_gate_phrase(string $phrase): bool
{
    $normalized = d24_staff_normalize_phrase($phrase);
    $length = function_exists('mb_strlen') ? mb_strlen($normalized, 'UTF-8') : strlen($normalized);
    if ($length < 8 || $length > 120) {
        return false;
    }
    update_option('d24_staff_gate_hash', hash('sha256', $normalized), false);
    return true;
}

function d24_staff_cookie_options(int $expires, bool $http_only = true): array
{
    return array(
        'expires' => $expires,
        'path' => '/drukulator/',
        'domain' => '',
        'secure' => is_ssl(),
        'httponly' => $http_only,
        'samesite' => 'Strict',
    );
}

function d24_staff_open_gate(): void
{
    $token = bin2hex(random_bytes(24));
    set_transient('d24_staff_gate_' . hash('sha256', $token), 1, D24_STAFF_GATE_TTL);
    setcookie(D24_STAFF_GATE_COOKIE, $token, d24_staff_cookie_options(time() + D24_STAFF_GATE_TTL));
}

function d24_staff_gate_is_open(): bool
{
    $token = (string) ($_COOKIE[D24_STAFF_GATE_COOKIE] ?? '');
    if ($token === '') {
        return false;
    }
    return (bool) get_transient('d24_staff_gate_' . hash('sha256', $token));
}

function d24_staff_close_gate(): void
{
    $token = (string) ($_COOKIE[D24_STAFF_GATE_COOKIE] ?? '');
    if ($token !== '') {
        delete_transient('d24_staff_gate_' . hash('sha256', $token));
    }
    setcookie(D24_STAFF_GATE_COOKIE, '', d24_staff_cookie_options(time() - 3600));
}

function d24_staff_session_hash(string $token): string
{
    return hash_hmac('sha256', $token, wp_salt('auth'));
}

function d24_staff_cleanup_sessions(): void
{
    global $wpdb;
    $wpdb->query($wpdb->prepare('DELETE FROM ' . d24_staff_sessions_table() . ' WHERE expires_at < %s', current_time('mysql')));
}

function d24_staff_login(string $username, string $password): ?array
{
    if (!d24_staff_install()) {
        return null;
    }

    global $wpdb;
    $username = sanitize_user($username, true);
    $user = $wpdb->get_row(
        $wpdb->prepare('SELECT * FROM ' . d24_staff_users_table() . ' WHERE username = %s AND active = 1 LIMIT 1', $username),
        ARRAY_A
    );

    if (!is_array($user) || !wp_check_password($password, (string) $user['password_hash'])) {
        return null;
    }

    $token = bin2hex(random_bytes(32));
    $now = current_time('mysql');
    $expires_dt = new DateTimeImmutable('now', wp_timezone());
    $expires = $expires_dt->modify('+' . D24_STAFF_SESSION_HOURS . ' hours')->format('Y-m-d H:i:s');
    $wpdb->insert(
        d24_staff_sessions_table(),
        array(
            'staff_user_id' => (int) $user['id'],
            'token_hash' => d24_staff_session_hash($token),
            'created_at' => $now,
            'last_seen_at' => $now,
            'expires_at' => $expires,
        ),
        array('%d', '%s', '%s', '%s', '%s')
    );

    if (!$wpdb->insert_id) {
        return null;
    }

    $wpdb->update(
        d24_staff_users_table(),
        array('last_login_at' => $now),
        array('id' => (int) $user['id']),
        array('%s'),
        array('%d')
    );

    setcookie(D24_STAFF_COOKIE, $token, d24_staff_cookie_options(time() + D24_STAFF_SESSION_HOURS * HOUR_IN_SECONDS));
    d24_staff_close_gate();
    d24_staff_cleanup_sessions();
    return d24_staff_current_user(true);
}

function d24_staff_logout(): void
{
    $token = (string) ($_COOKIE[D24_STAFF_COOKIE] ?? '');
    if ($token !== '') {
        global $wpdb;
        $wpdb->delete(d24_staff_sessions_table(), array('token_hash' => d24_staff_session_hash($token)), array('%s'));
    }
    setcookie(D24_STAFF_COOKIE, '', d24_staff_cookie_options(time() - 3600));
}

function d24_staff_current_user(bool $fresh = false): ?array
{
    static $cached = null;
    static $loaded = false;
    if (!$fresh && $loaded) {
        return $cached;
    }
    $loaded = true;

    if (is_user_logged_in() && current_user_can('manage_options')) {
        $wp_user = wp_get_current_user();
        $cached = array(
            'id' => 0,
            'username' => (string) $wp_user->user_login,
            'display_name' => (string) $wp_user->display_name,
            'permissions' => array_keys(d24_staff_permissions_catalog()),
            'is_admin' => true,
            'source' => 'wordpress',
        );
        return $cached;
    }

    if (!d24_staff_install()) {
        $cached = null;
        return null;
    }

    $token = (string) ($_COOKIE[D24_STAFF_COOKIE] ?? '');
    if ($token === '') {
        $cached = null;
        return null;
    }

    global $wpdb;
    $sessions = d24_staff_sessions_table();
    $users = d24_staff_users_table();
    $row = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT s.id AS session_id, s.staff_user_id, s.expires_at, u.username, u.display_name, u.permissions, u.active
             FROM {$sessions} s
             INNER JOIN {$users} u ON u.id = s.staff_user_id
             WHERE s.token_hash = %s LIMIT 1",
            d24_staff_session_hash($token)
        ),
        ARRAY_A
    );

    if (!is_array($row) || !(int) $row['active']) {
        $cached = null;
        return null;
    }

    $now_ts = current_datetime()->getTimestamp();
    $expires_ts = strtotime((string) $row['expires_at'] . ' ' . wp_timezone_string());
    if ($expires_ts !== false && $expires_ts < $now_ts) {
        $wpdb->delete($sessions, array('id' => (int) $row['session_id']), array('%d'));
        $cached = null;
        return null;
    }

    $permissions = json_decode((string) $row['permissions'], true);
    if (!is_array($permissions)) {
        $permissions = array();
    }
    $permissions = array_values(array_intersect(array_keys(d24_staff_permissions_catalog()), array_map('sanitize_key', $permissions)));

    $wpdb->update($sessions, array('last_seen_at' => current_time('mysql')), array('id' => (int) $row['session_id']), array('%s'), array('%d'));
    $cached = array(
        'id' => (int) $row['staff_user_id'],
        'username' => (string) $row['username'],
        'display_name' => (string) $row['display_name'],
        'permissions' => $permissions,
        'is_admin' => false,
        'source' => 'staff',
    );
    return $cached;
}

function d24_staff_can(string $permission): bool
{
    $user = d24_staff_current_user();
    if (!$user) {
        return false;
    }
    return !empty($user['is_admin']) || in_array($permission, (array) $user['permissions'], true);
}

function d24_staff_csrf_token(): string
{
    $user = d24_staff_current_user();
    if (!$user) {
        return '';
    }
    if (!empty($user['is_admin'])) {
        return wp_create_nonce('d24_staff_api');
    }
    $token = (string) ($_COOKIE[D24_STAFF_COOKIE] ?? '');
    return hash_hmac('sha256', 'csrf|' . $token, wp_salt('nonce'));
}

function d24_staff_verify_csrf(string $csrf): bool
{
    $user = d24_staff_current_user();
    if (!$user || $csrf === '') {
        return false;
    }
    if (!empty($user['is_admin'])) {
        return (bool) wp_verify_nonce($csrf, 'd24_staff_api');
    }
    return hash_equals(d24_staff_csrf_token(), $csrf);
}

function d24_staff_list_users(): array
{
    if (!d24_staff_install()) {
        return array();
    }
    global $wpdb;
    $rows = $wpdb->get_results('SELECT id, username, display_name, permissions, active, created_at, updated_at, last_login_at FROM ' . d24_staff_users_table() . ' ORDER BY active DESC, display_name ASC', ARRAY_A);
    foreach ($rows as &$row) {
        $permissions = json_decode((string) $row['permissions'], true);
        $row['permissions'] = is_array($permissions) ? $permissions : array();
        $row['id'] = (int) $row['id'];
        $row['active'] = (bool) $row['active'];
    }
    unset($row);
    return $rows;
}

function d24_staff_normalize_permissions(array $permissions): array
{
    $allowed = array_keys(d24_staff_permissions_catalog());
    $permissions = array_values(array_intersect($allowed, array_map('sanitize_key', $permissions)));
    $order_edit = array_intersect($permissions, array('orders_status', 'orders_rename', 'orders_notes', 'orders_assign', 'orders_production'));
    if ($order_edit && !in_array('orders_view', $permissions, true)) {
        $permissions[] = 'orders_view';
    }
    return array_values(array_unique($permissions));
}

function d24_staff_create_user(string $username, string $display_name, string $password, array $permissions): array
{
    if (!d24_staff_install()) {
        return array(false, 'Nie udało się przygotować bazy pracowników.');
    }
    $username = sanitize_user($username, true);
    $display_name = sanitize_text_field($display_name);
    $password_length = function_exists('mb_strlen') ? mb_strlen($password, 'UTF-8') : strlen($password);
    if ($username === '' || strlen($username) < 3) {
        return array(false, 'Login musi mieć co najmniej 3 znaki.');
    }
    if ($display_name === '') {
        return array(false, 'Podaj nazwę pracownika.');
    }
    if ($password_length < 10) {
        return array(false, 'Hasło musi mieć co najmniej 10 znaków.');
    }
    $permissions = d24_staff_normalize_permissions($permissions);

    global $wpdb;
    $exists = $wpdb->get_var($wpdb->prepare('SELECT id FROM ' . d24_staff_users_table() . ' WHERE username = %s LIMIT 1', $username));
    if ($exists) {
        return array(false, 'Taki login już istnieje.');
    }
    $now = current_time('mysql');
    $ok = $wpdb->insert(
        d24_staff_users_table(),
        array(
            'username' => $username,
            'display_name' => $display_name,
            'password_hash' => wp_hash_password($password),
            'permissions' => wp_json_encode($permissions),
            'active' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ),
        array('%s', '%s', '%s', '%s', '%d', '%s', '%s')
    );
    return array($ok !== false, $ok !== false ? 'Konto pracownika zostało utworzone.' : 'Nie udało się utworzyć konta.');
}

function d24_staff_update_user(int $id, string $display_name, array $permissions, bool $active): array
{
    $display_name = sanitize_text_field($display_name);
    if ($id < 1 || $display_name === '') {
        return array(false, 'Nieprawidłowe dane pracownika.');
    }
    $permissions = d24_staff_normalize_permissions($permissions);
    global $wpdb;
    $ok = $wpdb->update(
        d24_staff_users_table(),
        array(
            'display_name' => $display_name,
            'permissions' => wp_json_encode($permissions),
            'active' => $active ? 1 : 0,
            'updated_at' => current_time('mysql'),
        ),
        array('id' => $id),
        array('%s', '%s', '%d', '%s'),
        array('%d')
    );
    if (!$active) {
        $wpdb->delete(d24_staff_sessions_table(), array('staff_user_id' => $id), array('%d'));
    }
    return array($ok !== false, $ok !== false ? 'Konto pracownika zostało zaktualizowane.' : 'Nie udało się zapisać zmian.');
}

function d24_staff_reset_password(int $id, string $password): array
{
    $length = function_exists('mb_strlen') ? mb_strlen($password, 'UTF-8') : strlen($password);
    if ($id < 1 || $length < 10) {
        return array(false, 'Nowe hasło musi mieć co najmniej 10 znaków.');
    }
    global $wpdb;
    $ok = $wpdb->update(
        d24_staff_users_table(),
        array('password_hash' => wp_hash_password($password), 'updated_at' => current_time('mysql')),
        array('id' => $id),
        array('%s', '%s'),
        array('%d')
    );
    if ($ok !== false) {
        $wpdb->delete(d24_staff_sessions_table(), array('staff_user_id' => $id), array('%d'));
    }
    return array($ok !== false, $ok !== false ? 'Hasło zostało zmienione. Pracownik musi zalogować się ponownie.' : 'Nie udało się zmienić hasła.');
}
