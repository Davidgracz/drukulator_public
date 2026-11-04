<?php

declare(strict_types=1);

$wpLoad = dirname(__DIR__) . '/wp-load.php';
if (!is_file($wpLoad)) {
    http_response_code(500);
    exit('Nie znaleziono środowiska WordPress.');
}
require_once $wpLoad;
require_once __DIR__ . '/staff-auth-lib.php';

d24_staff_install();
$current = d24_staff_current_user();
if ($current) {
    wp_safe_redirect(home_url('/drukulator/staff-panel.php'));
    exit;
}

if (!d24_staff_gate_is_open()) {
    http_response_code(404);
    exit('Nie znaleziono strony.');
}

$message = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $nonce = sanitize_text_field((string) ($_POST['_wpnonce'] ?? ''));
    if (!wp_verify_nonce($nonce, 'd24_staff_login')) {
        $message = 'Sesja formularza wygasła. Odśwież stronę i spróbuj ponownie.';
    } else {
        $username = sanitize_user((string) ($_POST['username'] ?? ''), true);
        $password = (string) ($_POST['password'] ?? '');
        $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $rateKey = 'd24_staff_login_rate_' . hash_hmac('sha256', $ip, wp_salt('auth'));
        $attempts = (int) get_transient($rateKey);
        if ($attempts >= 20) {
            $message = 'Zbyt wiele nieudanych prób. Spróbuj ponownie za 15 minut.';
        } else {
            $user = d24_staff_login($username, $password);
            if ($user) {
                delete_transient($rateKey);
                wp_safe_redirect(home_url('/drukulator/staff-panel.php'));
                exit;
            }
            set_transient($rateKey, $attempts + 1, 15 * MINUTE_IN_SECONDS);
            $message = 'Nieprawidłowy login lub hasło.';
        }
    }
}
?><!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Panel pracowniczy – Druk24</title>
  <style>
    :root{color-scheme:dark;--bg:#071011;--card:#0b1718;--ink:#f8fafc;--muted:#9fb3b5;--line:#203536;--accent:#54a7d0;--turq:#16d4ca;--danger:#f87171}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at top,#153436 0,#071011 50%,#030606 100%);font-family:Inter,Arial,sans-serif;color:var(--ink);padding:20px}.login{width:min(460px,100%);background:rgba(11,23,24,.96);border:1px solid var(--line);border-radius:22px;padding:30px;box-shadow:0 28px 80px rgba(0,0,0,.45)}.brand{font-size:30px;font-weight:900;letter-spacing:-.04em;margin-bottom:4px}.brand span{color:var(--turq)}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:11px;color:var(--muted);font-weight:800}h1{margin:10px 0 8px;font-size:28px}p{color:var(--muted);line-height:1.6}.field{margin:16px 0}.field label{display:block;font-size:13px;font-weight:800;margin-bottom:7px}.field input{width:100%;padding:13px 14px;border:1px solid #2b4648;border-radius:11px;background:#071011;color:#fff;font:inherit;outline:none}.field input:focus{border-color:var(--turq);box-shadow:0 0 0 3px rgba(22,212,202,.12)}button{width:100%;padding:13px 16px;border:0;border-radius:11px;background:linear-gradient(90deg,var(--accent),var(--turq));color:#041011;font-weight:900;font-size:15px;cursor:pointer;margin-top:4px}.error{margin:14px 0 0;padding:11px 13px;border:1px solid rgba(248,113,113,.35);background:rgba(127,29,29,.18);color:#fecaca;border-radius:10px}.links{display:flex;justify-content:space-between;gap:16px;margin-top:20px;font-size:12px}.links a{color:var(--muted);text-decoration:none}.note{margin-top:18px;padding-top:18px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
  </style>
</head>
<body>
  <main class="login">
    <div class="brand">Druk<span>24</span></div>
    <div class="eyebrow">Zaplecze drukarni</div>
    <h1>Panel pracowniczy</h1>
    <p>Zaloguj się kontem utworzonym przez administratora Druk24.</p>
    <form method="post" autocomplete="on">
      <?php wp_nonce_field('d24_staff_login'); ?>
      <div class="field"><label for="username">Login</label><input id="username" name="username" autocomplete="username" required autofocus></div>
      <div class="field"><label for="password">Hasło</label><input id="password" name="password" type="password" autocomplete="current-password" required></div>
      <button type="submit">Zaloguj się</button>
    </form>
    <?php if ($message !== ''): ?><div class="error"><?php echo esc_html($message); ?></div><?php endif; ?>
    <div class="links"><a href="/drukulator/">← Wróć do Drukulatora</a><a href="<?php echo esc_url(wp_login_url(home_url('/drukulator/staff-panel.php'))); ?>">Administrator WordPress</a></div>
    <div class="note">Konta pracowników nie dają dostępu do panelu WordPressa. Każde konto ma osobno przydzielane uprawnienia.</div>
  </main>
</body>
</html>
