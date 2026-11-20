<?php
// 0.26.12v: wysyłka zamówienia (send-order.php) na atrapie WordPressa — treść maila z potwierdzeniem dla klienta i maila do drukarni.
// Użycie: php order_mail_02612_harness.php <katalog-projektu> <scenariusz: plain|promo|disabled>
declare(strict_types=1);
$root = rtrim($argv[1] ?? dirname(__DIR__), '/');
$scenario = $argv[2] ?? 'plain';
$tmp = sys_get_temp_dir() . '/d24-ordermail-' . getmypid() . '-' . $scenario;
@mkdir($tmp . '/drukulator', 0777, true);

$order_src = file_get_contents($root . '/send-order.php');
if ($scenario === 'disabled') {
    $count = 0;
    $order_src = str_replace("const DRUKULATOR_NEXT_ORDER_PROMO_CODE = 'DRUK10';", "const DRUKULATOR_NEXT_ORDER_PROMO_CODE = '';", $order_src, $count);
    if ($count !== 1) { fwrite(STDERR, "brak stałej kodu w send-order.php\n"); exit(2); }
}
file_put_contents($tmp . '/drukulator/send-order.php', $order_src);
copy($root . '/upload-staging-lib.php', $tmp . '/drukulator/upload-staging-lib.php');

file_put_contents($tmp . '/wp-load.php', <<<'PHP'
<?php
function sanitize_text_field($s) { return trim(strip_tags((string) $s)); }
function sanitize_textarea_field($s) { return trim(strip_tags((string) $s)); }
function sanitize_email($s) { $s = trim((string) $s); return filter_var($s, FILTER_VALIDATE_EMAIL) ? $s : ''; }
function is_email($s) { return (bool) filter_var((string) $s, FILTER_VALIDATE_EMAIL); }
function sanitize_key($s) { return strtolower(preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) $s)); }
function sanitize_file_name($s) { return basename((string) $s); }
function wp_unslash($s) { return $s; }
function wp_parse_url($u, $c = -1) { return parse_url((string) $u, $c); }
function home_url($p = '/') { return 'https://druk24.test' . $p; }
function get_transient($k) { return false; }
function set_transient($k, $v, $t) { return true; }
function wp_date($f) { return date($f); }
function wp_generate_password($n = 12, $a = true, $b = true) { return substr(str_repeat('abcdefghijklmnopqrstuvwxyz0123456789', 3), 0, (int) $n); }
function wp_salt($s = '') { return 'salt'; }
function esc_html($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }
function trailingslashit($s) { return rtrim((string) $s, '/') . '/'; }
function get_temp_dir() { return sys_get_temp_dir() . '/'; }
function wp_mkdir_p($d) { return is_dir($d) || mkdir($d, 0777, true); }
PHP);
$mails = $tmp . '/mails.json';
file_put_contents($tmp . '/drukulator/order-status-lib.php', "<?php\nfunction drukulator_orders_store(array \$o, string \$t) { return true; }\nfunction drukulator_orders_delete(string \$id) { return true; }\n");
file_put_contents($tmp . '/drukulator/monitoring-lib.php', "<?php\nfunction d24_monitor_log(\$a = '', \$b = '', \$c = '', \$d = '', \$e = array(), \$f = 0) { return true; }\n");
file_put_contents($tmp . '/drukulator/analytics-v2-lib.php', "<?php\nfunction d24_analytics_verified_order(\$id, \$total, \$cart, \$session) { return true; }\n");
file_put_contents($tmp . '/drukulator/mail-audit-lib.php', "<?php\nfunction d24_mail_send(string \$cat, string \$order_id, \$to, string \$subject, string \$message, \$headers = array(), \$attachments = array()): bool {\n    \$all = is_file(" . var_export($mails, true) . ") ? json_decode(file_get_contents(" . var_export($mails, true) . "), true) : array();\n    \$all[] = array('category' => \$cat, 'to' => \$to, 'subject' => \$subject, 'message' => \$message);\n    file_put_contents(" . var_export($mails, true) . ", json_encode(\$all, JSON_UNESCAPED_UNICODE));\n    return true;\n}\n");
file_put_contents($tmp . '/drukulator/promo-lib.php', <<<'PHP'
<?php
function d24_promo_evaluate(string $code, float $total): array {
    return array('ok' => true, 'message' => '', 'discount' => round($total * 0.05, 2),
        'promo' => array('code' => strtoupper($code), 'id' => 7, 'discount_type' => 'percent', 'discount_value' => 5));
}
function d24_promo_reserve(int $id, float $discount): bool { return true; }
function d24_promo_release(int $id, float $discount): void {}
PHP);

$payload = array(
    'privacyAccepted' => true,
    'customer' => array('name' => 'Jan Test', 'email' => 'jan@example.com', 'phone' => '500100200', 'pickup' => 'Odbiór osobisty', 'notes' => ''),
    'cart' => array(
        array('title' => 'Plakaty 24h', 'description' => 'A2, 1 szt.', 'price' => 90, 'details' => array(array('Format', 'A2')),
              'meta' => array('productType' => 'poster', 'printType' => 'Cyfrowy 24h', 'quantity' => 1)),
        array('title' => 'Plansza pianka 5 mm', 'description' => 'stara pozycja z linku', 'price' => 50, 'details' => array()),   // bez typu produktu
    ),
    'analyticsSession' => null,
);
if ($scenario === 'promo') $payload['promoCode'] = 'abc5';
file_put_contents($tmp . '/payload.json', json_encode($payload, JSON_UNESCAPED_UNICODE));
file_put_contents($tmp . '/run.php', <<<'PHP'
<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_POST['payload'] = file_get_contents(__DIR__ . '/payload.json');
require __DIR__ . '/drukulator/send-order.php';
PHP);
$out = shell_exec('php ' . escapeshellarg($tmp . '/run.php') . ' 2>&1');
$response = json_decode((string) $out, true);
$all = is_file($mails) ? json_decode(file_get_contents($mails), true) : array();
echo json_encode(array('response' => $response, 'raw' => $response ? null : $out, 'mails' => $all), JSON_UNESCAPED_UNICODE);
