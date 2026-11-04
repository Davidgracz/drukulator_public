<?php

declare(strict_types=1);
$wpLoad = dirname(__DIR__) . '/wp-load.php';
if (!is_file($wpLoad)) {
    http_response_code(500);
    exit('Nie znaleziono WordPressa.');
}
require_once $wpLoad;
require_once __DIR__ . '/staff-auth-lib.php';
d24_staff_logout();
wp_safe_redirect(home_url('/drukulator/'));
exit;
