<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

function d24_staff_api_response(bool $success, string $message, int $status = 200, array $extra = array()): void
{
    http_response_code($status);
    echo json_encode(array_merge(array('success' => $success, 'message' => $message), $extra), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$wpLoad = dirname(__DIR__) . '/wp-load.php';
if (!is_file($wpLoad)) {
    d24_staff_api_response(false, 'Nie znaleziono WordPressa.', 500);
}
require_once $wpLoad;
require_once __DIR__ . '/staff-auth-lib.php';
require_once __DIR__ . '/order-status-lib.php';
require_once __DIR__ . '/production-lib.php';
require_once __DIR__ . '/monitoring-lib.php';
require_once __DIR__ . '/mail-audit-lib.php';
require_once __DIR__ . '/analytics-v2-lib.php';
require_once __DIR__ . '/upload-staging-lib.php';
require_once __DIR__ . '/promo-lib.php';

d24_staff_install();
drukulator_orders_install();
d24_production_install();
$user = d24_staff_current_user();
if (!$user) {
    d24_staff_api_response(false, 'Sesja wygasła. Zaloguj się ponownie.', 401, array('login_url' => home_url('/drukulator/')));
}

function d24_staff_public_user(array $user): array
{
    return array(
        'id' => (int) ($user['id'] ?? 0),
        'username' => (string) ($user['username'] ?? ''),
        'display_name' => (string) ($user['display_name'] ?? ''),
        'permissions' => array_values((array) ($user['permissions'] ?? array())),
        'is_admin' => !empty($user['is_admin']),
    );
}

function d24_staff_public_orders(array $orders): array
{
    return array_map(static function (array $row): array {
        return array(
            'order_id' => (string) ($row['order_id'] ?? ''),
            'order_name' => (string) ($row['order_name'] ?? ''),
            'status' => (string) ($row['status'] ?? 'received'),
            'total' => (float) ($row['total'] ?? 0),
            'items' => (array) ($row['items'] ?? array()),
            'customer_name' => (string) ($row['customer_name'] ?? ''),
            'customer_email' => (string) ($row['customer_email'] ?? ''),
            'customer_phone' => (string) ($row['customer_phone'] ?? ''),
            'pickup' => (string) ($row['pickup'] ?? ''),
            'notes' => (string) ($row['notes'] ?? ''),
            'promo_code' => (string) ($row['promo_code'] ?? ''),
            'discount' => (float) ($row['discount'] ?? 0),
            'public_note' => (string) ($row['public_note'] ?? ''),
            'internal_note' => (string) ($row['internal_note'] ?? ''),
            'assigned_staff_id' => $row['assigned_staff_id'] ?? null,
            'assigned_name' => (string) ($row['assigned_name'] ?? ''),
            'priority' => (string) ($row['priority'] ?? 'normal'),
            'due_date' => (string) ($row['due_date'] ?? ''),
            'production_started_at' => (string) ($row['production_started_at'] ?? ''),
            'production_finished_at' => (string) ($row['production_finished_at'] ?? ''),
            'work_started_at' => (string) ($row['work_started_at'] ?? ''),
            'work_seconds' => (int) ($row['work_seconds'] ?? 0),
            'ready_notified_at' => (string) ($row['ready_notified_at'] ?? ''),
            'history' => (array) ($row['history'] ?? array()),
            'created_at' => (string) ($row['created_at'] ?? ''),
            'updated_at' => (string) ($row['updated_at'] ?? ''),
        );
    }, $orders);
}

$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = sanitize_key((string) ($_GET['action'] ?? 'bootstrap'));
if ($method === 'GET') {
    if ($action === 'production_events') {
        if (!d24_staff_can('orders_view')) d24_staff_api_response(false, 'Brak uprawnień.', 403);
        $orderId = sanitize_text_field((string) ($_GET['order_id'] ?? ''));
        if ($orderId === '' || !drukulator_orders_get($orderId)) d24_staff_api_response(false, 'Zlecenie nie istnieje.', 404);
        d24_staff_api_response(true, 'Historia produkcji.', 200, array('events' => d24_production_events($orderId)));
    }
    if ($action === 'analytics') {
        if (!d24_staff_can('analytics_view')) d24_staff_api_response(false, 'Nie masz uprawnień do statystyk.', 403);
        $days = (int) ($_GET['days'] ?? 7);
        d24_staff_api_response(true, 'Statystyki pobrane.', 200, array('analytics_v2' => d24_analytics_dashboard($days)));
    }
    if ($action !== 'bootstrap') {
        d24_staff_api_response(false, 'Nieobsługiwana operacja.', 400);
    }
    $payload = array(
        'user' => d24_staff_public_user($user),
        'permissions_catalog' => d24_staff_permissions_catalog(),
        'csrf' => d24_staff_csrf_token(),
        'statuses' => drukulator_order_statuses(),
        'production_priorities' => d24_production_priorities(),
    );
    if (d24_staff_can('orders_view')) {
        $payload['orders'] = d24_staff_public_orders(drukulator_orders_list(500));
    } else {
        $payload['orders'] = array();
    }
    if (d24_staff_can('orders_view')) {
        $payload['production_summary'] = d24_production_summary();
    }
    if (!empty($user['is_admin'])) {
        d24_alert_tick();
        $payload['staff'] = d24_staff_list_users();
        $payload['monitoring'] = d24_monitor_dashboard();
        $payload['alerting'] = d24_alert_dashboard();
        $payload['mail_audit'] = d24_mail_audit_dashboard();
    } elseif (d24_staff_can('orders_assign')) {
        $payload['staff'] = array_map(static function (array $staff): array {
            return array(
                'id' => (int) $staff['id'],
                'display_name' => (string) $staff['display_name'],
                'active' => !empty($staff['active']),
            );
        }, d24_staff_list_users());
    } else {
        $payload['staff'] = array();
    }
    if (d24_staff_can('promo_manage')) {
        $payload['promo_codes'] = d24_promo_list();
    }
    if (d24_staff_can('analytics_view')) {
        $stats = get_option('drukulator_analytics_v1', array());
        $payload['analytics'] = is_array($stats) ? $stats : array();
    }
    d24_staff_api_response(true, 'Panel wczytany.', 200, $payload);
}

if ($method !== 'POST') {
    d24_staff_api_response(false, 'Dozwolone są metody GET i POST.', 405);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    d24_staff_api_response(false, 'Nieprawidłowe dane.', 400);
}
$csrf = (string) ($data['csrf'] ?? '');
if (!d24_staff_verify_csrf($csrf)) {
    d24_staff_api_response(false, 'Sesja wygasła. Odśwież panel.', 403);
}
$action = sanitize_key((string) ($data['action'] ?? ''));

// Production work and scheduling are separate from changing customer-facing status.
if ($action === 'production_update' || $action === 'production_work') {
    if (!d24_staff_can('orders_production')) d24_staff_api_response(false, 'Brak uprawnień do zarządzania produkcją.', 403);
    $orderId = sanitize_text_field((string) ($data['order_id'] ?? ''));
    if (strlen($orderId) > 64 || $orderId === '') d24_staff_api_response(false, 'Nieprawidłowy numer zlecenia.', 400);
    if ($action === 'production_update') {
        [$ok, $message] = d24_production_update($orderId,
            sanitize_key((string) ($data['priority'] ?? 'normal')),
            (string) ($data['due_date'] ?? ''), $user);
    } else {
        [$ok, $message] = d24_production_work($orderId, (string) ($data['work_action'] ?? ''), $user);
    }
    if ($ok) d24_monitor_log('production_updated', 'info', 'Zaktualizowano przebieg produkcji', $orderId, array('action' => $action));
    d24_staff_api_response($ok, $message, $ok ? 200 : 409, $ok ? array(
        'orders' => d24_staff_public_orders(drukulator_orders_list(500)),
        'production_summary' => d24_production_summary(),
    ) : array());
}

// Alert-management actions require staff CSRF + authenticated administrator.
if (in_array($action, array('alert_ack', 'alert_resolve', 'alert_reopen'), true)) {
    if (empty($user['is_admin'])) d24_staff_api_response(false, 'Tylko administrator ma dostęp do alertów.', 403);
    $id = (int) ($data['id'] ?? 0);
    $verb = substr($action, 6);
    if (!d24_alert_actions($id, $verb)) d24_staff_api_response(false, 'Nie znaleziono alertu lub operacja jest niedozwolona.', 400);
    d24_staff_api_response(true, 'Zaktualizowano alert.', 200, array('alerting' => d24_alert_dashboard()));
}
if ($action === 'alert_email_settings') {
    if (empty($user['is_admin'])) d24_staff_api_response(false, 'Tylko administrator może zmieniać alerty.', 403);
    update_option('d24_alert_email_enabled', !empty($data['enabled']) ? 'yes' : 'no', false);
    d24_staff_api_response(true, 'Zapisano ustawienia alertów e-mail.', 200, array('alerting' => d24_alert_dashboard()));
}
if ($action === 'alert_test_email') {
    if (empty($user['is_admin'])) d24_staff_api_response(false, 'Tylko administrator może wysyłać test.', 403);
    if (get_transient('d24_alert_test_email_lock')) d24_staff_api_response(false, 'Test można wysłać raz na 5 minut.', 429);
    set_transient('d24_alert_test_email_lock', 1, 300);
    $success = false;
    try {
        $success = d24_mail_send('admin_test', '', D24_ALERT_EMAIL, '[Druk24] TEST powiadomień 0.22.9v',
            "To jest test administratora Drukulatora. E-mail został przyjęty przez mechanizm wysyłki; sprawdź, czy dotarł do skrzynki.\nPanel: " . home_url('/drukulator/staff-panel.php'),
            array('Content-Type: text/plain; charset=UTF-8', 'From: Druk24 <' . D24_ALERT_EMAIL . '>'));
    } catch (Throwable $ignored) { $success = false; }
    d24_staff_api_response($success, $success ? 'WordPress przyjął wiadomość testową. Sprawdź skrzynkę.' : 'Nie udało się przekazać wiadomości testowej do wysłania.', $success ? 200 : 502);
}

if ($action === 'mail_retry_ready') {
    if (empty($user['is_admin'])) d24_staff_api_response(false, 'Operacja wymaga uprawnień administratora.', 403);
    if (empty($data['confirm_retry'])) d24_staff_api_response(false, 'Potwierdź świadomie ponowną próbę e-mail.', 409);
    $orderId = sanitize_text_field((string) ($data['order_id'] ?? ''));
    $order = drukulator_orders_get($orderId);
    if (!$order) d24_staff_api_response(false, 'Nie znaleziono zlecenia.', 404);
    if ((string) ($order['status'] ?? '') !== 'ready') d24_staff_api_response(false, 'Można ponowić tylko powiadomienie dla zlecenia Gotowe.', 409);
    if (!empty($order['ready_notified_at'])) d24_staff_api_response(false, 'Powiadomienie zostało już przyjęte do wysłania.', 409);
    if (!d24_mail_ready_retry_lock($orderId)) {
        d24_staff_api_response(false, 'Ponowienie zablokowane: inna próba trwa, nie upłynęło 5 minut lub baza jest niedostępna.', 429);
    }
    // Re-read after acquiring lock to protect against two administrators changing status.
    $order = drukulator_orders_get($orderId);
    if (!$order || (string) ($order['status'] ?? '') !== 'ready' || !empty($order['ready_notified_at'])) {
        d24_staff_api_response(false, 'Stan zlecenia zmienił się. Odśwież panel.', 409);
    }
    $result = drukulator_orders_ready_email($order);
    $success = !empty($result['sent']);
    d24_monitor_log($success ? 'ready_mail_accepted' : 'ready_mail_failed', $success ? 'info' : 'error',
        $success ? 'Powtórne przekazanie e-maila o gotowości do WordPressa' : 'Nieudana próba ponowienia e-maila o gotowości', $orderId, array('method' => 'manual_retry'));
    d24_staff_api_response($success, (string) ($result['message'] ?? 'Nieznany wynik.'), $success ? 200 : 502,
        array('mail_audit' => d24_mail_audit_dashboard(), 'orders' => d24_staff_public_orders(drukulator_orders_list(500))));
}

// Kody rabatowe (0.26.0v): tworzenie, edycja, włączanie/wyłączanie i usuwanie wymaga uprawnienia „promo_manage”.
if (in_array($action, array('promo_save', 'promo_toggle', 'promo_delete'), true)) {
    if (!d24_staff_can('promo_manage')) d24_staff_api_response(false, 'Brak uprawnień do kodów rabatowych.', 403);
    $actor = (string) ($user['display_name'] ?? 'Pracownik');
    if ($action === 'promo_save') {
        [$ok, $message, $promoId] = d24_promo_save($data, $actor);
        if ($ok) d24_monitor_log('promo_saved', 'info', 'Zapisano kod rabatowy', '', array('note' => 'kod #' . $promoId, 'staff' => $actor));
        d24_staff_api_response($ok, $message, $ok ? 200 : 400, array('promo_codes' => d24_promo_list()));
    }
    $promoId = (int) ($data['id'] ?? 0);
    if ($promoId <= 0) d24_staff_api_response(false, 'Nieprawidłowy kod.', 400);
    if ($action === 'promo_toggle') {
        $active = !empty($data['active']);
        $ok = d24_promo_set_active($promoId, $active);
        if ($ok) d24_monitor_log('promo_toggled', 'info', $active ? 'Włączono kod rabatowy' : 'Wyłączono kod rabatowy', '', array('note' => 'kod #' . $promoId, 'staff' => $actor));
        d24_staff_api_response($ok, $ok ? ($active ? 'Kod został włączony.' : 'Kod został wyłączony.') : 'Nie znaleziono kodu.', $ok ? 200 : 404, array('promo_codes' => d24_promo_list()));
    }
    $ok = d24_promo_delete($promoId);
    if ($ok) d24_monitor_log('promo_deleted', 'info', 'Usunięto kod rabatowy', '', array('note' => 'kod #' . $promoId, 'staff' => $actor));
    d24_staff_api_response($ok, $ok ? 'Kod został usunięty.' : 'Nie znaleziono kodu.', $ok ? 200 : 404, array('promo_codes' => d24_promo_list()));
}

if ($action === 'order_status') {
    if (!d24_staff_can('orders_status')) d24_staff_api_response(false, 'Brak uprawnień do zmiany statusu.', 403);
    $orderId = sanitize_text_field((string) ($data['order_id'] ?? ''));
    $status = sanitize_key((string) ($data['status'] ?? ''));
    $publicNote = sanitize_textarea_field((string) ($data['public_note'] ?? ''));
    $actor = (string) ($user['display_name'] ?? 'Pracownik');
    $orderBefore = drukulator_orders_get($orderId);
    if (!$orderBefore) {
        d24_staff_api_response(false, 'Nie znaleziono zlecenia.', 404);
    }
    $needsReadyMail = $status === 'ready' && empty($orderBefore['ready_notified_at']);
    if ($needsReadyMail && empty($data['confirm_ready'])) {
        d24_staff_api_response(false, 'Potwierdź oznaczenie zlecenia jako gotowe i wysłanie wiadomości do klienta.', 409, array('confirmation_required' => true));
    }
    if (!drukulator_orders_update_status($orderId, $status, $publicNote, $actor)) {
        d24_staff_api_response(false, 'Nie udało się zaktualizować statusu.', 400);
    }
    $message = 'Status został zaktualizowany.';
    $readyEmailSent = null;
    if ($status === 'ready' && $needsReadyMail) {
        $updatedOrder = drukulator_orders_get($orderId);
        $mailResult = $updatedOrder ? drukulator_orders_ready_email($updatedOrder) : array('sent' => false, 'message' => 'Nie udało się przygotować wiadomości do klienta.');
        $readyEmailSent = !empty($mailResult['sent']);
        $message .= ' ' . (string) ($mailResult['message'] ?? '');
    } elseif ($status === 'ready' && !empty($orderBefore['ready_notified_at'])) {
        $readyEmailSent = true;
        $message .= ' Powiadomienie o gotowości było już wcześniej wysłane.';
    }
    d24_production_status_changed($orderId, (string) ($orderBefore['status'] ?? ''), $status, $user);
    d24_monitor_log('order_status_changed', 'info', 'Zmieniono status zlecenia', $orderId, array(
        'status' => $status, 'staff' => (string) ($user['display_name'] ?? '')
    ));
    if ($readyEmailSent !== null && $needsReadyMail) {
        d24_monitor_log($readyEmailSent ? 'ready_mail_accepted' : 'ready_mail_failed',
            $readyEmailSent ? 'info' : 'error',
            $readyEmailSent ? 'Serwer przyjął powiadomienie o gotowości' : 'Serwer nie przyjął powiadomienia o gotowości', $orderId, array('channel' => 'customer'));
    }
    d24_staff_api_response(true, $message, 200, array(
        'ready_email_sent' => $readyEmailSent,
        'orders' => d24_staff_public_orders(drukulator_orders_list(500)),
    ));
}

if ($action === 'order_name') {
    if (!d24_staff_can('orders_rename')) d24_staff_api_response(false, 'Brak uprawnień do zmiany nazwy.', 403);
    $orderId = sanitize_text_field((string) ($data['order_id'] ?? ''));
    $name = sanitize_text_field((string) ($data['order_name'] ?? ''));
    if (!drukulator_orders_update_management($orderId, array('order_name' => $name))) {
        d24_staff_api_response(false, 'Nie udało się zapisać nazwy.', 400);
    }
    d24_production_event($orderId, 'name_changed', $user);
    d24_staff_api_response(true, 'Nazwa zlecenia została zapisana.');
}

if ($action === 'order_note') {
    if (!d24_staff_can('orders_notes')) d24_staff_api_response(false, 'Brak uprawnień do notatek.', 403);
    $orderId = sanitize_text_field((string) ($data['order_id'] ?? ''));
    $note = sanitize_textarea_field((string) ($data['internal_note'] ?? ''));
    if (!drukulator_orders_update_management($orderId, array('internal_note' => $note))) {
        d24_staff_api_response(false, 'Nie udało się zapisać notatki.', 400);
    }
    d24_production_event($orderId, 'note_changed', $user);
    d24_staff_api_response(true, 'Notatka została zapisana.');
}

if ($action === 'order_assign') {
    if (!d24_staff_can('orders_assign')) d24_staff_api_response(false, 'Brak uprawnień do przypisywania zleceń.', 403);
    $orderId = sanitize_text_field((string) ($data['order_id'] ?? ''));
    $staffId = isset($data['staff_id']) && $data['staff_id'] !== '' ? (int) $data['staff_id'] : null;
    $assignedName = '';
    if ($staffId !== null) {
        foreach (d24_staff_list_users() as $staff) {
            if ((int) $staff['id'] === $staffId && !empty($staff['active'])) {
                $assignedName = (string) $staff['display_name'];
                break;
            }
        }
        if ($assignedName === '') d24_staff_api_response(false, 'Nie znaleziono aktywnego pracownika.', 400);
    }
    if (!drukulator_orders_update_management($orderId, array('assigned_staff_id' => $staffId, 'assigned_name' => $assignedName))) {
        d24_staff_api_response(false, 'Nie udało się przypisać pracownika.', 400);
    }
    d24_production_event($orderId, 'assignment_changed', $user, array('after' => $assignedName ?: 'nieprzypisane'));
    d24_monitor_log('order_assignment_changed', 'info', 'Zmieniono przypisanie zlecenia', $orderId, array('staff' => (string) ($user['display_name'] ?? '')));
    d24_staff_api_response(true, $staffId === null ? 'Usunięto przypisanie.' : 'Zlecenie zostało przypisane.');
}

if ($action === 'staff_create') {
    if (empty($user['is_admin'])) d24_staff_api_response(false, 'Tylko administrator może tworzyć konta.', 403);
    [$ok, $message] = d24_staff_create_user(
        (string) ($data['username'] ?? ''),
        (string) ($data['display_name'] ?? ''),
        (string) ($data['password'] ?? ''),
        (array) ($data['permissions'] ?? array())
    );
    d24_staff_api_response($ok, $message, $ok ? 200 : 400, array('staff' => d24_staff_list_users()));
}

if ($action === 'staff_update') {
    if (empty($user['is_admin'])) d24_staff_api_response(false, 'Tylko administrator może zmieniać konta.', 403);
    [$ok, $message] = d24_staff_update_user(
        (int) ($data['id'] ?? 0),
        (string) ($data['display_name'] ?? ''),
        (array) ($data['permissions'] ?? array()),
        !empty($data['active'])
    );
    d24_staff_api_response($ok, $message, $ok ? 200 : 400, array('staff' => d24_staff_list_users()));
}

if ($action === 'staff_password') {
    if (empty($user['is_admin'])) d24_staff_api_response(false, 'Tylko administrator może zmieniać hasła.', 403);
    [$ok, $message] = d24_staff_reset_password((int) ($data['id'] ?? 0), (string) ($data['password'] ?? ''));
    d24_staff_api_response($ok, $message, $ok ? 200 : 400);
}

if ($action === 'gate_phrase') {
    if (empty($user['is_admin'])) d24_staff_api_response(false, 'Tylko administrator może zmienić frazę.', 403);
    $phrase = (string) ($data['phrase'] ?? '');
    if (!d24_staff_set_gate_phrase($phrase)) {
        d24_staff_api_response(false, 'Fraza musi mieć od 8 do 120 znaków.', 400);
    }
    d24_staff_api_response(true, 'Ukryta fraza wejścia została zmieniona.');
}

d24_staff_api_response(false, 'Nieobsługiwana operacja.', 400);
