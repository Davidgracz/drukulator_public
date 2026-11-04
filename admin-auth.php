<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

function drukulator_admin_response(bool $success, string $message, int $status = 200, array $extra = array()): void
{
    http_response_code($status);
    echo json_encode(
        array_merge(
            array(
                'success' => $success,
                'message' => $message,
            ),
            $extra
        ),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function drukulator_find_wp_load(string $startDirectory): ?string
{
    $directory = $startDirectory;
    for ($level = 0; $level < 6; $level++) {
        $candidate = $directory . DIRECTORY_SEPARATOR . 'wp-load.php';
        if (is_file($candidate)) {
            return $candidate;
        }
        $parent = dirname($directory);
        if ($parent === $directory) {
            break;
        }
        $directory = $parent;
    }
    return null;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    drukulator_admin_response(false, 'Dozwolona jest wyłącznie metoda GET.', 405);
}

$wpLoad = drukulator_find_wp_load(__DIR__);
if ($wpLoad === null) {
    drukulator_admin_response(false, 'Nie znaleziono środowiska WordPress.', 500);
}

require_once $wpLoad;

$loginUrl = wp_login_url(home_url('/drukulator/'));

if (!is_user_logged_in() || !current_user_can('manage_options')) {
    drukulator_admin_response(
        false,
        'Zaloguj się do WordPressa jako administrator, a następnie wróć do edycji cen.',
        403,
        array('login_url' => $loginUrl)
    );
}

$currentUser = wp_get_current_user();

drukulator_admin_response(
    true,
    'Uprawnienia administratora zostały potwierdzone.',
    200,
    array(
        'nonce' => wp_create_nonce('drukulator_save_prices'),
        'user' => sanitize_text_field((string) $currentUser->display_name),
    )
);
