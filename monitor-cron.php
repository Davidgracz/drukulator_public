<?php
/** Optional scheduled check. Run ONLY from hosting CLI cron, never by HTTP. */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
$wp_load = dirname(__DIR__) . '/wp-load.php';
if (!is_file($wp_load)) {
    fwrite(STDERR, "Druk24: WordPress not found\n");
    exit(2);
}
require_once $wp_load;
require_once __DIR__ . '/upload-staging-lib.php';
require_once __DIR__ . '/monitoring-lib.php';
d24_alert_tick();
echo "Druk24: alerts check completed (availability of complete hosting requires external HTTP monitor).\n";
