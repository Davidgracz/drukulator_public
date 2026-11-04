<?php

declare(strict_types=1);

// Public order tracking is temporarily disabled. Existing links show this information page.
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Referrer-Policy: no-referrer');
?>
<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Informacja o zapytaniu – Druk24</title>
  <style>
    :root{color-scheme:light dark}
    *{box-sizing:border-box}
    body{margin:0;background:#eef2f5;color:#111827;font:16px/1.6 Arial,Helvetica,sans-serif}
    main{min-height:100vh;display:grid;place-items:center;padding:22px}
    .card{width:min(100%,620px);padding:clamp(24px,5vw,42px);background:#fff;border:1px solid #dbe2e8;border-radius:18px;box-shadow:0 14px 38px rgba(15,23,42,.07)}
    .brand{font-size:28px;font-weight:900;letter-spacing:-1px;margin:0 0 30px}
    .brand span{color:#088f83}
    h1{margin:0 0 12px;font-size:clamp(24px,5vw,32px);line-height:1.25}
    p{margin:0 0 16px;color:#475569}
    a{color:#075985;font-weight:700}
    .actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}
    .button{display:inline-block;padding:12px 20px;color:#fff;background:#111827;border-radius:9px;text-decoration:none}
    .button.secondary{color:#111827;background:#e2e8f0}
  </style>
</head>
<body>
  <main>
    <section class="card" aria-labelledby="info-heading">
      <div class="brand">DRUK<span>24</span></div>
      <h1 id="info-heading">Podgląd postępu zlecenia jest wyłączony</h1>
      <p>Obecnie nie udostępniamy śledzenia etapów realizacji online.</p>
      <p>Informacje dotyczące zapytań, ich potwierdzenia i terminów przekazujemy bezpośrednio przez e-mail lub telefon. W wiadomości podaj numer swojego zgłoszenia.</p>
      <p>Kontakt: <a href="mailto:biuro@druk24.szczecin.pl">biuro@druk24.szczecin.pl</a></p>
      <div class="actions">
        <a class="button" href="/drukulator/">Wróć do wyceny online</a>
        <a class="button secondary" href="/dojazd-i-kontakt/">Dojazd i kontakt</a>
      </div>
    </section>
  </main>
</body>
</html>
