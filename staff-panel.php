<?php

declare(strict_types=1);

$wpLoad = dirname(__DIR__) . '/wp-load.php';
if (!is_file($wpLoad)) {
    http_response_code(500);
    exit('Nie znaleziono środowiska WordPress.');
}
require_once $wpLoad;
require_once __DIR__ . '/staff-auth-lib.php';
require_once __DIR__ . '/order-status-lib.php';

d24_staff_install();
drukulator_orders_install();
$user = d24_staff_current_user();
if (!$user) {
    wp_safe_redirect(home_url('/drukulator/'));
    exit;
}
?><!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Panel Druk24 — Produkcja i monitoring</title>
  <style>
    :root{color-scheme:dark;--bg:#071011;--panel:#0b1718;--panel2:#0f1d1f;--ink:#f8fafc;--muted:#98aeb0;--line:#203536;--accent:#5493d0;--turq:#1ed5cb;--good:#36d399;--warn:#fbbf24;--danger:#f87171;--shadow:0 22px 70px rgba(0,0,0,.28)}*{box-sizing:border-box}body{margin:0;background:#071011;color:var(--ink);font-family:Inter,Arial,sans-serif}.app{min-height:100vh;display:grid;grid-template-columns:250px 1fr}.side{position:sticky;top:0;height:100vh;background:#050b0c;border-right:1px solid var(--line);padding:22px 16px;display:flex;flex-direction:column}.brand{font-weight:950;font-size:26px;letter-spacing:-.04em}.brand span{color:var(--turq)}.user{margin:18px 0;padding:13px;border:1px solid var(--line);border-radius:13px;background:#091314}.user small{display:block;color:var(--muted);margin-top:4px}.nav{display:grid;gap:7px}.nav button{border:1px solid transparent;background:transparent;color:#dce8e9;text-align:left;padding:11px 12px;border-radius:10px;font:inherit;font-weight:750;cursor:pointer}.nav button:hover,.nav button.active{background:#112426;border-color:#284345}.nav button[hidden]{display:none}.side-bottom{margin-top:auto;display:grid;gap:8px}.side-bottom a{color:var(--muted);font-size:13px;text-decoration:none;padding:8px}.main{min-width:0;padding:26px}.topbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:20px}.topbar h1{margin:0;font-size:28px}.live{display:flex;gap:8px;align-items:center;color:var(--muted);font-size:12px}.dot{width:9px;height:9px;border-radius:50%;background:var(--good);box-shadow:0 0 0 5px rgba(54,211,153,.1)}.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:var(--shadow)}.toolbar{display:grid;grid-template-columns:minmax(220px,1fr) 180px 180px;gap:10px;margin-bottom:14px}.toolbar input,.toolbar select,.field input,.field select,.field textarea{width:100%;background:#071011;color:var(--ink);border:1px solid #2b4648;border-radius:10px;padding:11px 12px;font:inherit;outline:none}.toolbar input:focus,.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--turq);box-shadow:0 0 0 3px rgba(30,213,203,.1)}.orders{display:grid;grid-template-columns:minmax(340px,.9fr) minmax(480px,1.4fr);gap:16px}.order-list{display:grid;gap:9px;max-height:calc(100vh - 155px);overflow:auto;padding-right:2px}.order-row{width:100%;text-align:left;border:1px solid var(--line);background:#091314;color:var(--ink);border-radius:12px;padding:13px;cursor:pointer}.order-row:hover,.order-row.active{border-color:#3f6669;background:#102123}.order-row__top,.row-between{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.order-row strong{display:block;font-size:14px}.order-row small{display:block;color:var(--muted);margin-top:5px}.money{font-weight:900;white-space:nowrap}.pill{display:inline-flex;padding:5px 8px;border-radius:999px;background:#133236;color:#8ff0e9;font-size:11px;font-weight:850}.detail-empty{display:grid;place-items:center;min-height:360px;color:var(--muted);text-align:center}.detail h2{margin:0 0 5px}.sub{color:var(--muted);font-size:13px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.metric{border:1px solid var(--line);background:#091314;border-radius:11px;padding:11px}.metric span{display:block;color:var(--muted);font-size:11px;margin-bottom:4px}.metric strong{font-size:14px}.section{border-top:1px solid var(--line);margin-top:16px;padding-top:16px}.section h3{margin:0 0 10px;font-size:15px}.field{margin:9px 0}.field label{display:block;font-size:12px;font-weight:800;margin-bottom:6px;color:#cfe0e1}.field textarea{min-height:92px;resize:vertical}.btn{border:0;border-radius:10px;background:linear-gradient(90deg,var(--accent),var(--turq));color:#041011;font-weight:900;padding:11px 14px;cursor:pointer}.btn.secondary{background:#182c2e;color:#e8f3f4;border:1px solid #315052}.btn.danger{background:#3a1717;color:#fecaca;border:1px solid #6b2a2a}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.items{display:grid;gap:8px}.item{border:1px solid var(--line);background:#091314;border-radius:10px;padding:11px}.item p{color:var(--muted);margin:5px 0 0;font-size:12px;line-height:1.45}.customer{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.customer div{background:#091314;border:1px solid var(--line);border-radius:10px;padding:10px}.customer span{display:block;color:var(--muted);font-size:11px;margin-bottom:3px}.tabs-panel{display:none}.tabs-panel.active{display:block}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.bigmetric strong{display:block;font-size:28px;margin-top:5px}.ranking{display:grid;gap:7px;margin-top:10px}.rank{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid var(--line);padding:8px 0}.staff-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.permission-list{display:grid;gap:8px}.permission-list label{display:flex;gap:9px;align-items:flex-start;padding:9px;border:1px solid var(--line);border-radius:9px;background:#091314}.permission-list input{margin-top:2px}.employee{border:1px solid var(--line);border-radius:12px;padding:13px;margin-bottom:10px;background:#091314}.employee.inactive{opacity:.58}.employee header{display:flex;justify-content:space-between;gap:10px}.employee small{color:var(--muted)}.toast{position:fixed;right:22px;bottom:22px;background:#e6fffb;color:#083b38;padding:12px 15px;border-radius:10px;font-weight:800;box-shadow:0 12px 40px rgba(0,0,0,.35);transform:translateY(90px);opacity:0;transition:.2s;z-index:50}.toast.show{transform:none;opacity:1}.notice{padding:11px 13px;border-radius:10px;background:#0f2928;border:1px solid #24504d;color:#bdf9f3;margin-bottom:12px}.muted{color:var(--muted)}.empty{color:var(--muted);padding:30px;text-align:center}@media(max-width:1050px){.app{grid-template-columns:1fr}.side{position:static;height:auto;display:block}.nav{grid-template-columns:repeat(3,1fr);margin-top:14px}.side-bottom{display:flex;margin-top:12px}.orders,.staff-grid{grid-template-columns:1fr}.order-list{max-height:420px}.metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.main{padding:14px}.toolbar,.grid2,.grid3,.customer,.metrics{grid-template-columns:1fr}.nav{grid-template-columns:1fr 1fr}.topbar{align-items:flex-start;flex-direction:column}.orders{display:block}.detail{margin-top:12px}.side{padding:14px}}

    /* Mail audit 0.22.7v */
    .mail-audit{margin:14px 0}.mail-audit p{margin:6px 0 12px}.mail-audit-tools{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:12px 0}.mail-audit-tools select,.mail-audit-tools input{background:#071011;color:#f8fafc;border:1px solid #315052;border-radius:9px;padding:9px 10px;font:inherit}.mail-audit-list{display:grid;gap:8px}.mail-audit-line{border:1px solid #284247;border-radius:10px;background:#091314;padding:12px;display:flex;gap:13px;align-items:flex-start;justify-content:space-between}.mail-audit-line strong{display:block;font-size:13px}.mail-audit-line small{color:#abc2c4;font-size:12px;display:block;margin-top:5px}.mail-audit-line .actions{margin:0}.mail-audit-metrics{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.mail-audit-metrics span{border:1px solid #264246;border-radius:8px;padding:7px 11px;font-size:12px}.mail-ok{color:var(--good)}.mail-bad{color:var(--danger)}@media(max-width:680px){.mail-audit-line{display:block}.mail-audit-line .actions{margin-top:12px}}
    /* Alert center 0.22.7v */
    .monitor-alert-card{margin-bottom:14px}.monitor-alert-top{align-items:flex-start;flex-wrap:wrap;gap:12px}.monitor-alert-top h3{margin:0 0 7px;font-size:17px}.monitor-alert-top .actions{margin:0}.monitor-alert-list{display:grid;gap:9px;margin-top:13px}.monitor-alert{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;background:#091314;border:1px solid #355052;border-radius:12px;padding:13px 15px}.monitor-alert.critical{border-left:4px solid #ef7777}.monitor-alert.warning{border-left:4px solid #fbbf24}.monitor-alert.ack{opacity:.7}.monitor-alert.resolved{opacity:.6}.monitor-alert h4{font-size:14px;margin:0 0 4px}.monitor-alert p{font-size:12px;color:#a8bfc0;margin:0}.monitor-alert .actions{margin:0;align-items:center}.monitor-alert button{font-size:12px;padding:8px 10px}.monitor-alert-empty{border:1px dashed #355052;color:#aac9c7;padding:14px;border-radius:10px;margin-top:12px}.monitor-alert-status{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#e6f1f2}.monitor-alert-card a{color:#99dfff}@media(max-width:680px){.monitor-alert{grid-template-columns:1fr}}
    /* Operational monitoring, isolated from existing order-management styles. */
    .monitor-intro{margin-bottom:14px;align-items:center}.monitor-intro h2,.monitor-events h3,.monitor-layout h3{margin:0 0 7px}.monitor-intro p,.monitor-events p{margin:0}.monitor-layout{display:grid;grid-template-columns:minmax(260px,0.8fr) minmax(360px,1.2fr);gap:14px;margin:14px 0}.monitor-layout .card{min-width:0}.monitor-layout h3{font-size:16px}.monitor-service{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);font-size:13px}.monitor-service:last-child{border:0}.monitor-service strong{font-size:12px}.monitor-ok{color:var(--good)}.monitor-error{color:var(--danger)}.monitor-unknown{color:var(--warn)}.monitor-warning{padding:13px 15px;margin-bottom:12px;background:#33200f;color:#ffdf99;border:1px solid #856126;border-radius:12px}.monitor-alert-badge{color:#190806;background:var(--danger);display:inline-block;border-radius:8px;min-width:18px;text-align:center;padding:1px 3px;font-size:11px}.monitor-alert-badge[hidden]{display:none}.monitor-chart{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;align-items:end;min-height:180px}.monitor-day{min-width:0;text-align:center}.monitor-bars{height:128px;display:flex;gap:4px;align-items:flex-end;justify-content:center;background:#081314;border-bottom:1px solid #254449;padding:0 5px 0}.monitor-bar{min-height:2px;width:29%;border-radius:4px 4px 0 0}.monitor-bar.good{background:#48c8b9}.monitor-bar.bad{background:#ef7777}.monitor-day-label{color:var(--muted);font-size:11px;margin-top:7px}.monitor-day-count{font-size:11px;white-space:nowrap;color:#d4e5e7}.monitor-key{display:flex;gap:15px;font-size:11px;color:var(--muted);margin-top:12px}.monitor-key i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px}.monitor-filters{display:grid;grid-template-columns:180px 180px minmax(200px,1fr);gap:10px;margin:14px 0}.monitor-filters input,.monitor-filters select{background:#071011;color:var(--ink);border:1px solid #2b4648;border-radius:9px;padding:10px;font:inherit;min-width:0}.monitor-event-list{max-height:600px;overflow:auto;display:grid;gap:7px}.monitor-event{background:#091314;border:1px solid var(--line);border-radius:10px;padding:12px 13px;display:grid;grid-template-columns:102px minmax(0,1fr) auto;gap:12px;align-items:flex-start}.monitor-event-side{font-size:11px;color:var(--muted)}.monitor-event-title{font-size:13px;font-weight:850}.monitor-event-sub{font-size:11px;color:var(--muted);margin-top:5px;overflow-wrap:anywhere}.monitor-event-sub .chip{padding:2px 5px;background:#162b2d;border-radius:5px;color:#d2e4e6}.monitor-event-level{font-size:11px;padding:4px 8px;border-radius:7px;background:#173031;color:#83e2d6}.monitor-event-level.error{background:#471b1b;color:#ffaaaa}.monitor-event-level.warning{background:#4d3916;color:#ffda95}.monitor-link{border:0;color:#a3e6ff;background:transparent;cursor:pointer;text-decoration:underline;padding:0;font-size:12px}.monitor-meta{font-size:11px;color:#b2c5c7;margin-top:6px;white-space:pre-wrap;overflow-wrap:anywhere}.monitor-metric-caption{font-size:11px;color:var(--muted);margin-top:6px}.monitor-time{color:var(--muted);font-size:11px}.monitor-note{margin-top:10px;color:var(--muted);font-size:12px}@media(max-width:1050px){.monitor-layout{grid-template-columns:1fr}}@media(max-width:760px){.monitor-filters{grid-template-columns:1fr}.monitor-event{grid-template-columns:1fr;gap:5px}.monitor-chart{gap:3px}.monitor-bars{padding:0 2px}.monitor-day-label{font-size:9px}}

    /* Analityka 0.26.9v — przeprojektowany widok: okres z porównaniem, zakładki (Przegląd / Lejek / Produkty / Ruch / Dni), wykres SVG, tabele, mapa godzin. */
    .an9-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
    .an9-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px 20px;flex-wrap:wrap;margin-bottom:14px}.an9-title h2{margin:0 0 6px;font-size:24px;letter-spacing:-.02em}.an9-sub{margin:0;color:var(--muted);font-size:13px;line-height:1.55;max-width:760px}.an9-sub b{color:#dbe9eb;font-weight:800}
    .an9-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}.an9-seg{display:inline-flex;background:#091314;border:1px solid #2b4648;border-radius:11px;padding:3px;gap:2px;max-width:100%;overflow-x:auto}.an9-seg button{border:0;background:transparent;color:#cfe0e1;font:inherit;font-weight:800;font-size:13px;padding:8px 12px;border-radius:8px;cursor:pointer;white-space:nowrap}.an9-seg button:hover{background:#12292b}.an9-seg button[aria-pressed=true]{background:linear-gradient(90deg,var(--accent),var(--turq));color:#041011}
    .an9-check{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:#cfe0e1;cursor:pointer;user-select:none}.an9-check input{accent-color:var(--turq);width:16px;height:16px}
    .an9-export{display:flex;gap:6px;flex-wrap:wrap}.an9-export .btn,.an9-controls .btn{padding:9px 12px;font-size:13px}
    .an9-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:0 0 16px;overflow-x:auto}.an9-tabs button{border:0;background:transparent;color:#b9cfd1;font:inherit;font-weight:800;font-size:14px;padding:11px 16px;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-1px;white-space:nowrap}.an9-tabs button:hover{color:#fff}.an9-tabs button[aria-selected=true]{color:#fff;border-bottom-color:var(--turq)}
    .an9-tabs button:focus-visible,.an9-seg button:focus-visible,.an9-chip:focus-visible,.an9-sort:focus-visible,.an9-chart:focus-visible{outline:2px solid var(--turq);outline-offset:2px}
    .an9-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.an9-kpi{background:#0b1718;border:1px solid #284448;border-radius:14px;padding:14px 14px 10px;min-width:0;display:flex;flex-direction:column;gap:4px}.an9-kpi__top{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#a8c6ca;font-size:12px;font-weight:700}.an9-kpi strong{display:block;font-size:27px;line-height:1.1;letter-spacing:-.02em;word-break:break-word}.an9-kpi__meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-height:20px}.an9-kpi__meta small{color:#86b0b4;font-size:11px}.an9-kpi svg{width:100%;height:28px;display:block;margin-top:4px;color:#5493d0}.an9-kpi.is-orders svg{color:#1ed5cb}.an9-kpi.is-warn svg{color:#fbbf24}
    .an9-help{display:inline-grid;place-items:center;width:17px;height:17px;border-radius:50%;border:1px solid #3a6064;color:#9fd3d6;font-size:10px;font-weight:900;cursor:help;position:relative;flex:none}.an9-help:hover:after,.an9-help:focus:after{content:attr(data-tip);position:absolute;z-index:20;right:-4px;top:22px;width:230px;background:#e6fffb;color:#083b38;padding:9px 11px;border-radius:9px;font-size:12px;font-weight:600;line-height:1.45;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:left}
    .an9-delta{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:850;white-space:nowrap;background:#16282a;color:#b3cdd0}.an9-delta.good{background:rgba(54,211,153,.14);color:#6ee7b7}.an9-delta.bad{background:rgba(248,113,113,.14);color:#fca5a5}.an9-delta.new{background:rgba(84,147,208,.18);color:#93c5fd}
    .an9-grid2{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:14px;margin-bottom:14px}.an9-grid2--even{grid-template-columns:repeat(2,minmax(0,1fr))}.an9-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:14px}
    .an9-card{min-width:0}.an9-card h3{margin:0 0 4px;font-size:16px}.an9-card__sub{margin:0 0 12px;color:#8fb2b5;font-size:12px;line-height:1.5}.an9-card--flush{padding:0;overflow:hidden}.an9-card--flush>h3,.an9-card--flush>.an9-card__sub{padding:16px 18px 0}.an9-card--flush>.an9-card__sub{padding-bottom:10px}
    .an9-chips{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}.an9-chip{border:1px solid #2f5256;background:#0a1a1c;color:#d5e6e8;border-radius:999px;font:inherit;font-size:12px;font-weight:800;padding:6px 11px;cursor:pointer}.an9-chip[aria-pressed=true]{background:#17383b;border-color:var(--turq);color:#fff}
    .an9-chart{position:relative;outline:none;border-radius:10px}.an9-chart svg{width:100%;height:auto;display:block;overflow:visible}.an9-chart text{fill:#8fb2b5;font-size:11px;font-family:inherit}.an9-grid-line{stroke:#1d3638;stroke-width:1}.an9-axis{stroke:#2a4a4d;stroke-width:1}.an9-line{fill:none;stroke:#5493d0;stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round}.an9-area{fill:url(#an9Grad);stroke:none}.an9-prev{fill:none;stroke:#9db7ba;stroke-width:1.8;stroke-dasharray:5 4;stroke-linejoin:round}.an9-bar{fill:#5493d0}.an9-bar.is-peak{fill:#1ed5cb}.an9-dot{fill:#5493d0;stroke:#0b1718;stroke-width:2}.an9-hover{stroke:#6aa6a9;stroke-width:1;stroke-dasharray:3 3}
    .an9-tip{position:absolute;z-index:5;pointer-events:none;background:#e6fffb;color:#083b38;border-radius:9px;padding:8px 10px;font-size:12px;line-height:1.45;box-shadow:0 12px 36px rgba(0,0,0,.45);white-space:nowrap;transform:translate(-50%,-100%);margin-top:-10px}.an9-tip b{display:block;font-size:12px}.an9-tip[hidden]{display:none}
    .an9-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#a3bdc0;margin-top:8px}.an9-legend i{display:inline-block;width:18px;height:0;border-top:3px solid #5493d0;margin-right:6px;vertical-align:middle}.an9-legend i.dash{border-top:2px dashed #9db7ba}
    .an9-insights{list-style:none;margin:0;padding:0;display:grid;gap:9px}.an9-insights li{display:grid;grid-template-columns:10px 1fr;gap:10px;font-size:13px;line-height:1.5;color:#e1eeef;padding:10px 11px;border-radius:11px;background:#091314;border:1px solid #1f3a3c}.an9-insights li:before{content:'';width:9px;height:9px;border-radius:50%;margin-top:6px;background:#5493d0}.an9-insights li.good:before{background:var(--good)}.an9-insights li.warn:before{background:var(--warn)}.an9-insights li.bad:before{background:var(--danger)}.an9-insights b{color:#fff}
    .an9-steps{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:11px}.an9-step{display:grid;grid-template-columns:minmax(120px,190px) minmax(0,1fr) minmax(110px,150px);gap:6px 14px;align-items:center}.an9-step__label{font-size:13px;font-weight:750;color:#e6f1f2;display:flex;flex-direction:column;gap:3px}.an9-step__label small{font-weight:500;color:#86b0b4;font-size:11px}.an9-step__bar{height:18px;background:#13282a;border-radius:999px;overflow:hidden}.an9-step__bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#5493d0,#1ed5cb);min-width:3px}.an9-step.is-final .an9-step__bar i{background:linear-gradient(90deg,#1ed5cb,#36d399)}.an9-step__num{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:2px}.an9-step__num strong{font-size:16px}.an9-step__num small{font-size:11px;color:#86b0b4}.an9-loss{display:inline-flex;gap:5px;align-items:center;font-size:11px;color:#fbbf24;font-weight:800}.an9-tag{align-self:flex-start;font-style:normal;font-size:10px;font-weight:850;color:#251a02;background:var(--warn);padding:2px 7px;border-radius:999px}.an9-stack{display:grid;gap:14px}
    .an9-note{font-size:12px;line-height:1.6;color:#9ebfc2;margin:12px 0 0}.an9-empty{color:#89afb1;font-size:13px;padding:18px 2px}.an9-warn{background:#2a2108;border:1px solid #5d4a10;color:#fde68a;border-radius:11px;padding:10px 12px;font-size:12px;line-height:1.55;margin:0 0 12px}
    .an9-table-wrap{overflow:auto;max-width:100%;max-height:640px}.an9-table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}.an9-table caption{text-align:left}.an9-table th,.an9-table td{padding:9px 12px;text-align:right;border-bottom:1px solid #1b3032;white-space:nowrap}.an9-table th:first-child,.an9-table td:first-child{text-align:left}.an9-table thead th{position:sticky;top:0;background:#0f1f21;z-index:2;color:#bcd3d5;font-size:12px;font-weight:800;border-bottom:1px solid #2a4a4d;white-space:normal;vertical-align:bottom;line-height:1.3}.an9-table tbody th{font-weight:700;color:#e6f1f2}.an9-table tbody tr:hover td,.an9-table tbody tr:hover th{background:#0f2022}.an9-table tfoot td,.an9-table tfoot th{font-weight:900;color:#fff;border-top:2px solid #2a4a4d;background:#0d1c1e;position:sticky;bottom:0}.an9-table .is-best{color:#7ef0ce;font-weight:850}.an9-table .dim{color:#6f9094}.an9-table td.an9-bar-cell{min-width:140px}.an9-bar-cell{position:relative}.an9-bar-cell i{position:absolute;left:0;top:6px;bottom:6px;background:rgba(30,213,203,.13);border-radius:0 6px 6px 0;max-width:100%}.an9-bar-cell span{position:relative}
    .an9-sort{border:0;background:transparent;color:inherit;font:inherit;font-weight:800;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:5px}.an9-sort:after{content:'↕';opacity:.35;font-size:11px}th[aria-sort=ascending] .an9-sort:after{content:'▲';opacity:1;color:var(--turq)}th[aria-sort=descending] .an9-sort:after{content:'▼';opacity:1;color:var(--turq)}
    .an9-tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:0 18px 12px}.an9-tools input{background:#071011;color:var(--ink);border:1px solid #2b4648;border-radius:10px;padding:9px 12px;font:inherit;font-size:13px;min-width:220px;outline:none}.an9-tools input:focus{border-color:var(--turq)}
    .an9-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px}.an9-tile{background:#0b1718;border:1px solid #284448;border-radius:14px;padding:14px}.an9-tile small{display:block;color:#a8c6ca;font-size:12px;font-weight:700}.an9-tile strong{display:block;font-size:19px;margin:6px 0 3px;overflow-wrap:anywhere}.an9-tile em{font-style:normal;font-size:12px;color:#86b0b4}
    .an9-list{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:2px}.an9-row{display:grid;grid-template-columns:minmax(90px,1.2fr) minmax(50px,1.5fr) 118px;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #182f31;font-size:13px}.an9-row:last-child{border-bottom:0}.an9-row__name{overflow-wrap:anywhere;color:#e6f1f2}.an9-row__bar{height:8px;border-radius:999px;background:#13282a;overflow:hidden}.an9-row__bar i{display:block;height:100%;background:#5493d0;border-radius:999px;min-width:2px}.an9-row__val{display:flex;flex-direction:column;align-items:flex-end;line-height:1.25;white-space:nowrap}.an9-row__val b{font-weight:850}.an9-row__val small{color:#86b0b4;font-weight:600;font-size:11px}
    .an9-heat-wrap{overflow-x:auto;padding-bottom:4px}.an9-heat{display:grid;grid-template-columns:34px repeat(24,minmax(0,1fr));gap:2px;min-width:420px;font-size:10px;color:#86b0b4}.an9-heat b{font-weight:600;text-align:right;padding-right:6px;align-self:center}.an9-heat i{display:block;height:22px;border-radius:4px;background:rgba(30,213,203,var(--v,0));border:1px solid #17302f}.an9-heat i.is-zero{background:#0d1c1e}.an9-heat span{text-align:center;font-size:9px;color:#6f9094}
    .an9-defs{margin-top:16px}.an9-defs summary{cursor:pointer;font-weight:800;color:#cfe0e1;font-size:14px}.an9-defs dl{display:grid;grid-template-columns:minmax(150px,230px) 1fr;gap:8px 16px;margin:12px 0 0;font-size:13px;line-height:1.55}.an9-defs dt{font-weight:800;color:#e6f1f2}.an9-defs dd{margin:0;color:#a6c0c3}
    @media(max-width:1220px){.an9-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.an9-grid2{grid-template-columns:1fr}.an9-grid3{grid-template-columns:1fr}}
    @media(max-width:760px){.an9-title h2{font-size:21px}.an9-controls{justify-content:flex-start}.an9-kpis{grid-template-columns:1fr 1fr}.an9-kpi strong{font-size:21px}.an9-grid2--even,.an9-tiles{grid-template-columns:1fr}.an9-step{grid-template-columns:1fr auto;grid-template-areas:"label num" "bar bar"}.an9-step__label{grid-area:label}.an9-step__num{grid-area:num}.an9-step__bar{grid-area:bar}.an9-defs dl{grid-template-columns:1fr}.an9-defs dt{margin-top:6px}.an9-row{grid-template-columns:minmax(80px,1fr) minmax(0,1fr) auto}.an9-table th,.an9-table td{padding:8px 9px}.an9-tools input{min-width:0;width:100%}}
    @media(max-width:420px){.an9-kpi{padding:12px 11px 8px}.an9-kpi strong{font-size:18px}.an9-kpi__meta small{font-size:10px}}
    /* Production management — 0.22.9v */
    .p29-header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px}.p29-header h2{font-size:24px;margin:0 0 8px}.p29-header p{max-width:750px;font-size:13px;line-height:1.5}
    .p29-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:14px}.p29-stat{border:1px solid var(--line);border-radius:14px;padding:13px;background:#101e20}.p29-stat small{display:block;color:#afc2c5;font-size:12px}.p29-stat strong{display:block;font-size:26px;margin-top:5px}.p29-stat.warn strong{color:#fbbf24}.p29-stat.danger strong{color:#fca5a5}
    .p29-toolbar{display:grid;grid-template-columns:minmax(190px,1fr) repeat(3,minmax(135px,.35fr));gap:10px;margin-bottom:15px}.p29-toolbar select,.p29-toolbar input,.p29-editor select,.p29-editor input{background:#071011;border:1px solid #335154;border-radius:9px;padding:10px;color:var(--ink);font:inherit;width:100%;min-width:0}
    .p29-board{display:grid;grid-template-columns:repeat(4,minmax(240px,1fr));gap:12px;align-items:start;overflow-x:auto}.p29-column{background:#0b1718;border:1px solid #263d3e;border-radius:14px;padding:12px;min-height:240px;min-width:0}.p29-column h3{margin:0 0 12px;font-size:14px;display:flex;align-items:center;justify-content:space-between;gap:10px}.p29-stack{display:grid;gap:10px;max-height:70vh;overflow:auto}.p29-card{display:block;text-align:left;width:100%;color:#e8f4f4;border:1px solid #294749;background:#101f21;border-radius:12px;padding:12px;cursor:pointer;font:inherit}.p29-card:hover,.p29-card:focus-visible{border-color:#1ed5cb;background:#173033}.p29-card strong{display:block;font-size:13px;overflow-wrap:anywhere}.p29-card small{display:block;margin-top:6px;color:#acc5c9;font-size:11px;line-height:1.5}.p29-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.p29-tag{border-radius:6px;padding:4px 6px;font-size:10px;font-weight:800;background:#19383b;color:#c1f8f1}.p29-tag.high{background:#42311e;color:#fde68a}.p29-tag.urgent,.p29-tag.overdue{background:#4b2222;color:#fda4af}.p29-tag.low{background:#203339;color:#a8bfd1}.p29-tag.today{background:#53451e;color:#fde68a}.p29-note{font-size:12px;color:#a8bfc1;margin-top:14px}
    .p29-history{display:grid;gap:8px;margin:12px 0}.p29-history-item{border:1px solid #294446;background:#0b191b;padding:10px;border-radius:10px}.p29-history-item small{display:block;color:var(--muted);margin-top:5px}.p29-editor .p29-work{padding:11px;border:1px solid #27464a;background:#0a191b;border-radius:10px;margin-top:8px}.p29-editor .p29-work strong{display:block;font-size:18px}
    @media(max-width:1300px){.p29-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.p29-board{grid-template-columns:repeat(2,minmax(260px,1fr))}}
    @media(max-width:750px){.p29-toolbar{grid-template-columns:1fr 1fr}.p29-board{grid-template-columns:1fr}.p29-metrics{grid-template-columns:1fr 1fr}}
    @media(max-width:440px){.p29-toolbar,.p29-metrics{grid-template-columns:1fr}}
    /* Kody rabatowe — 0.26.0v */
    .pr-grid{display:grid;grid-template-columns:390px 1fr;gap:16px;align-items:start}.pr-grid h2{margin:0 0 6px;font-size:20px}.pr-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pr-code-row{display:flex;gap:8px}.pr-code-row input{flex:1;min-width:0;text-transform:uppercase;font-family:ui-monospace,Menlo,Consolas,monospace;letter-spacing:.05em}.pr-code-row button{white-space:nowrap}.pr-presets{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.pr-presets button{border:1px solid #315052;background:#102123;color:#d7e9ea;border-radius:999px;padding:5px 10px;font:inherit;font-size:12px;font-weight:750;cursor:pointer}.pr-presets button:hover{border-color:var(--turq)}.pr-hint{color:var(--muted);font-size:12px;margin:5px 0 0;line-height:1.45}.pr-preview{margin:12px 0;padding:11px 12px;border:1px dashed #315052;border-radius:11px;background:#091314;font-size:13px;line-height:1.5}.pr-msg{margin:10px 0 0;padding:10px 12px;border-radius:10px;font-size:13px;font-weight:700;background:#3a1717;color:#fecaca;border:1px solid #6b2a2a}.pr-msg[hidden]{display:none}.pr-check{display:flex;align-items:center;gap:9px;margin:12px 0;font-weight:750}.pr-check input{width:18px;height:18px;accent-color:var(--turq)}
    .pr-card{border:1px solid var(--line);border-radius:13px;padding:14px;margin-bottom:10px;background:#091314}.pr-card.off{opacity:.72}.pr-card header{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}.pr-code{font:900 19px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.05em}.pr-discount{font-weight:900;font-size:18px;color:#8ff0e9}.pr-pill.good{background:#12392b;color:#6ee7b7}.pr-pill.warn{background:#3a2e0d;color:#fbbf24}.pr-pill.off{background:#2a2f31;color:#a8b3b5}.pr-meta{display:flex;flex-wrap:wrap;gap:4px 18px;margin:9px 0 0;color:var(--muted);font-size:13px}.pr-meta b{color:var(--ink)}.pr-card .actions .btn{padding:8px 11px;font-size:13px}
    @media(max-width:1000px){.pr-grid{grid-template-columns:1fr}}
    @media(max-width:520px){.pr-row2{grid-template-columns:1fr}}
  </style>
</head>
<body>
<div class="app">
  <aside class="side">
    <div class="brand">Druk<span>24</span></div>
    <div class="user"><strong><?php echo esc_html((string) $user['display_name']); ?></strong><small><?php echo !empty($user['is_admin']) ? 'Administrator' : 'Pracownik'; ?></small></div>
    <nav class="nav">
      <button data-tab="orders">Zlecenia</button>
      <button data-tab="production">Produkcja</button>
      <?php if (!empty($user['is_admin'])): ?><button data-tab="monitoring">Monitoring <span id="monitorNavAlert" class="monitor-alert-badge" hidden>!</span></button><?php endif; ?>
      <button data-tab="analytics">Analityka</button>
      <?php if (d24_staff_can('promo_manage')): ?><button data-tab="promo">Kody rabatowe</button><?php endif; ?>
      <?php if (!empty($user['is_admin'])): ?><button data-tab="staff">Pracownicy</button><button data-tab="settings">Ustawienia</button><?php endif; ?>
    </nav>
    <div class="side-bottom"><a href="/drukulator/">← Drukulator</a><a href="staff-logout.php">Wyloguj</a></div>
  </aside>
  <main class="main">
    <div class="topbar"><div><h1>Panel Druk24</h1><div class="muted">Obsługa zleceń i pracy zespołu</div></div><div class="live"><span class="dot"></span><span id="liveLabel">Aktualizacja na żywo co 10 s</span></div></div>

    <section id="tab-orders" class="tabs-panel">
      <div class="toolbar"><input id="orderSearch" type="search" placeholder="Szukaj po numerze, nazwie lub kliencie"><select id="statusFilter"><option value="">Wszystkie statusy</option></select><select id="assignmentFilter"><option value="">Wszystkie zlecenia</option><option value="mine">Przypisane do mnie</option><option value="unassigned">Nieprzypisane</option></select></div>
      <div class="orders"><div class="card"><div id="orderList" class="order-list"></div></div><div id="orderDetail" class="card detail"><div class="detail-empty">Wybierz zlecenie z listy.</div></div></div>
    </section>

    <?php if (!empty($user['is_admin'])): ?>
    <section id="tab-monitoring" class="tabs-panel">
      <div class="monitor-intro row-between"><div><h2>Monitoring techniczny</h2><p class="muted">Zdarzenia serwera i plików, ostatnie 7 dni. Dane od chwili uruchomienia tej wersji.</p></div><button id="monitorRefresh" class="btn secondary" type="button">⟳ Odśwież</button></div>
      <div id="monitorWarnings"></div>
      <div class="card monitor-alert-card" aria-label="Alerty administracyjne">
        <div class="row-between monitor-alert-top"><div><h3>Centrum alertów <span id="alertOpenCount" class="pill">0 aktywnych</span></h3><p class="muted">Nowe awarie i błędy, potwierdzanie i zamykanie incydentów. E-maile do drukarni nie zawierają plików klientów.</p></div>
          <div class="actions"><button id="alertToggleEmail" class="btn secondary" type="button">Alerty e-mail: włączone</button><button id="alertTestEmail" class="btn secondary" type="button">Wyślij test e-mail</button></div>
        </div>
        <div id="alertMailStatus" class="monitor-note"></div>
        <div id="alertList" class="monitor-alert-list" aria-live="polite"></div>
        <p class="monitor-note">Automatyczna kontrola usług uruchamia się przy ruchu na stronie. Przestój całego serwera wykryje tylko <a href="health.php" target="_blank" rel="noopener noreferrer">zewnętrzny monitor URL health.php</a> (HTTP 200/503).</p>
      </div>
      <div class="card mail-audit" aria-label="Historia prób wysyłki poczty">
        <div class="row-between"><div><h3 style="margin:0">Historia wysyłki e-mail</h3><p class="muted">Odrębny dziennik techniczny dla zamówień, potwierdzeń, powiadomień „gotowe” i alertów.</p></div><span id="mailAuditCount" class="pill">—</span></div>
        <div id="mailAuditMetrics" class="mail-audit-metrics"></div>
        <p id="mailAuditNote" class="sub">Dostarczenie wiadomości nie jest potwierdzone przez WordPress.</p>
        <div class="mail-audit-tools"><select id="mailAuditFilter" aria-label="Filtr historii poczty"><option value="">Wszystkie typy</option><option value="office_order">Zamówienia do drukarni</option><option value="customer_confirmation">Potwierdzenia klienta</option><option value="customer_ready">Powiadomienia gotowe</option><option value="admin_alert">Alerty</option><option value="admin_test">Testy</option></select><select id="mailAuditState" aria-label="Filtr statusu"><option value="">Wszystkie wyniki</option><option value="accepted">Przyjęte przez WordPress</option><option value="failed">Błędy</option></select><input id="mailAuditSearch" type="search" placeholder="Numer zgłoszenia" maxlength="64" aria-label="Szukaj numeru zlecenia"></div>
        <div id="mailAuditList" class="mail-audit-list"></div>
      </div>
      <div id="monitorMetrics" class="metrics"></div>
      <div class="monitor-layout">
        <div class="card"><h3>Stan usług</h3><div id="monitorServices"></div><p class="sub">E-mail: „przyjęty” oznacza odpowiedź serwera WordPress, nie dostarczenie wiadomości do skrzynki.</p></div>
        <div class="card"><h3>Ostatnie 7 dni</h3><div id="monitorChart" class="monitor-chart"></div></div>
      </div>
      <div class="card monitor-events"><div class="row-between"><div><h3>Dziennik zdarzeń</h3><p class="muted">Zamówienia, załączniki, poczta i błędy; bez zawartości plików.</p></div><span id="monitorCount" class="pill"></span></div>
        <div class="monitor-filters"><select id="monitorLevel" aria-label="Poziom zdarzeń"><option value="">Wszystkie poziomy</option><option value="error">Błędy</option><option value="warning">Ostrzeżenia</option><option value="info">Informacje</option></select><select id="monitorType" aria-label="Typ zdarzenia"><option value="">Wszystkie zdarzenia</option><option value="mail">Poczta</option><option value="upload">Pliki</option><option value="order">Zamówienia</option></select><input id="monitorSearch" type="search" placeholder="Numer zlecenia lub zdarzenie"></div>
        <div id="monitorEventList" class="monitor-event-list"></div>
      </div>
    </section>
    <?php endif; ?>
    <section id="tab-production" class="tabs-panel">
      <div class="p29-header"><div><h2>Centrum produkcji <span class="pill">0.22.9v</span></h2><p class="muted">Kolejka zleceń, terminy, priorytety i czas faktycznej pracy. Wybierz zlecenie, aby edytować je w zakładce Zlecenia.</p></div><button class="btn secondary" id="prodRefresh" type="button">⟳ Odśwież</button></div>
      <div class="p29-metrics" id="prodMetrics"></div>
      <div class="card p29-toolbar">
        <input id="prodSearch" type="search" placeholder="Szukaj numeru, nazwy, klienta lub pracownika" aria-label="Szukaj w produkcji">
        <select id="prodPriority" aria-label="Filtr priorytetu"><option value="">Wszystkie priorytety</option><option value="urgent">Pilne</option><option value="high">Wysoki</option><option value="normal">Normalny</option><option value="low">Niski</option></select>
        <select id="prodDue" aria-label="Filtr terminów"><option value="">Wszystkie terminy</option><option value="overdue">Po terminie</option><option value="today">Na dziś</option><option value="unset">Bez terminu</option></select>
        <select id="prodAssigned" aria-label="Filtr przypisania"><option value="">Wszyscy</option><option value="mine">Moje</option><option value="unassigned">Nieprzypisane</option></select>
      </div>
      <div class="p29-board" id="prodBoard"></div>
      <p class="p29-note" id="prodCoverage">Widok pokazuje do 500 najnowszych zleceń. Liczniki pochodzą z całej bazy.</p>
    </section>
    <section id="tab-analytics" class="tabs-panel"><div id="analyticsPanel"></div></section>

    <?php if (d24_staff_can('promo_manage')): ?>
    <section id="tab-promo" class="tabs-panel">
      <div class="pr-grid">
        <div class="card" id="promoFormCard">
          <h2 id="promoFormTitle">Nowy kod rabatowy</h2>
          <p class="muted" style="margin:0 0 8px">Klient wpisuje kod w koszyku. Zniżka obejmuje wartość produktów (nie dostawę), a serwer sprawdza kod jeszcze raz przy wysyłce zamówienia.</p>
          <input type="hidden" id="promoId" value="">
          <div class="field"><label for="promoCode">Kod</label><div class="pr-code-row"><input id="promoCode" maxlength="32" autocomplete="off" spellcheck="false" placeholder="np. WIOSNA10"><button class="btn secondary" type="button" id="promoGenerate">Wygeneruj</button></div><p class="pr-hint">3–32 znaków: litery bez polskich znaków, cyfry, „-” lub „_”. Wielkość liter nie ma znaczenia.</p></div>
          <div class="field"><label for="promoLabel">Nazwa wewnętrzna (opcjonalnie)</label><input id="promoLabel" maxlength="190" placeholder="np. Kampania wiosenna, ulotka z rabatem"></div>
          <div class="pr-row2">
            <div class="field"><label for="promoType">Rodzaj zniżki</label><select id="promoType"><option value="percent">Procent (%)</option><option value="amount">Kwota (zł)</option></select></div>
            <div class="field"><label for="promoValue" id="promoValueLabel">Wysokość zniżki (%)</label><input id="promoValue" inputmode="decimal" autocomplete="off" placeholder="np. 10"></div>
          </div>
          <div class="pr-row2">
            <div class="field"><label for="promoFrom">Ważny od</label><input id="promoFrom" type="date"></div>
            <div class="field"><label for="promoTo">Ważny do (włącznie)</label><input id="promoTo" type="date"></div>
          </div>
          <div class="pr-presets" aria-label="Szybkie ustawienie okresu ważności"><button type="button" data-promo-preset="today">Od dziś</button><button type="button" data-promo-preset="7">Dziś + 7 dni</button><button type="button" data-promo-preset="14">Dziś + 14 dni</button><button type="button" data-promo-preset="30">Dziś + 30 dni</button><button type="button" data-promo-preset="none">Bez ograniczenia czasu</button></div>
          <p class="pr-hint">Puste pole „od” = działa od razu, puste „do” = bez końca. Daty liczone są w czasie strony, „do” obejmuje cały ostatni dzień.</p>
          <div class="pr-row2">
            <div class="field"><label for="promoMin">Min. wartość produktów (zł)</label><input id="promoMin" inputmode="decimal" autocomplete="off" placeholder="puste = bez minimum"></div>
            <div class="field"><label for="promoMax">Limit użyć (zamówień)</label><input id="promoMax" inputmode="numeric" autocomplete="off" placeholder="puste = bez limitu"></div>
          </div>
          <label class="pr-check"><input type="checkbox" id="promoActive" checked> Kod aktywny</label>
          <div class="pr-preview" id="promoPreview" aria-live="polite"></div>
          <div class="actions" style="margin-top:0"><button class="btn" type="button" id="promoSave">Zapisz kod</button><button class="btn secondary" type="button" id="promoCancel" hidden>Anuluj edycję</button></div>
          <div class="pr-msg" id="promoMsg" role="alert" hidden></div>
        </div>
        <div class="card">
          <div class="row-between"><div><h2>Kody rabatowe</h2><div class="muted">Zniżki, okres ważności i zużycie. Użycie liczy się po przyjęciu zamówienia.</div></div><span id="promoCount" class="pill">—</span></div>
          <div id="promoList" style="margin-top:14px"></div>
        </div>
      </div>
    </section>
    <?php endif; ?>


    <?php if (!empty($user['is_admin'])): ?>
    <section id="tab-staff" class="tabs-panel"><div class="staff-grid"><div class="card"><h2>Nowe konto pracownika</h2><div class="field"><label>Imię / nazwa pracownika</label><input id="newDisplayName"></div><div class="field"><label>Login</label><input id="newUsername" autocomplete="off"></div><div class="field"><label>Hasło (min. 10 znaków)</label><input id="newPassword" type="password" autocomplete="new-password"></div><div class="field"><label>Uprawnienia</label><div id="newPermissions" class="permission-list"></div></div><button class="btn" id="createStaff">Utwórz konto</button></div><div class="card"><div class="row-between"><div><h2 style="margin:0">Pracownicy</h2><div class="muted">Konta działają tylko w panelu Druk24.</div></div></div><div id="staffList" style="margin-top:14px"></div></div></div></section>
    <section id="tab-settings" class="tabs-panel"><div class="card" style="max-width:720px"><h2>Ukryte wejście do panelu</h2><p class="muted">Fraza jest dodatkową bramką do ekranu logowania. Prawdziwym zabezpieczeniem nadal jest login i hasło pracownika.</p><div class="field"><label>Nowa fraza</label><input id="gatePhrase" type="password" autocomplete="new-password" placeholder="Minimum 8 znaków"></div><button class="btn" id="saveGatePhrase">Zmień frazę</button><div class="notice" style="margin-top:14px">Domyślna fraza po instalacji: <strong>za zielonymi drzwiami</strong>. Po zmianie zapisz ją sobie — panel nie pokazuje aktualnej frazy.</div></div></section>
    <?php endif; ?>
  </main>
</div>
<div id="toast" class="toast"></div>
<script>
(() => {
  "use strict";
  const initialUser = <?php echo wp_json_encode(array('display_name' => $user['display_name'], 'is_admin' => !empty($user['is_admin']))); ?>;
  let payload = null, csrf = "", selectedOrderId = "", currentTab = "orders", refreshTimer = null;
  let analyticsV2 = null, analyticsDays = 7, analyticsLoading = false, analyticsFetchedAt = 0;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const money = v => Number(v || 0).toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2});
  const date = v => { if(!v) return '—'; const d=new Date(String(v).replace(' ','T')); return isNaN(d)?String(v):d.toLocaleString('pl-PL',{dateStyle:'short',timeStyle:'short'}); };
  const can = p => payload?.user?.is_admin || (payload?.user?.permissions || []).includes(p);
  function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2200); }
  async function api(data){ const r=await fetch('staff-api.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,csrf})}); const j=await r.json(); if(!r.ok||!j.success) throw new Error(j.message||'Błąd serwera'); return j; }
  async function load(silent=false){ try{ const r=await fetch('staff-api.php?action=bootstrap',{credentials:'same-origin',cache:'no-store'}); const j=await r.json(); if(!r.ok||!j.success){ if(r.status===401) location.href='/drukulator/'; throw new Error(j.message||'Błąd'); } payload=j; csrf=j.csrf||csrf; renderAll(); if(currentTab==='analytics') fetchAnalytics(true); if(!silent) toast('Panel odświeżony'); $('#liveLabel').textContent='Aktualizacja na żywo co 10 s • '+new Date().toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}); }catch(e){ if(!silent) toast(e.message); } }
  function switchTab(name){ currentTab=name; $$('.tabs-panel').forEach(x=>x.classList.toggle('active',x.id==='tab-'+name)); $$('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===name)); if(name==='analytics' && can('analytics_view')) fetchAnalytics(false); }
  $$('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));

  function statusLabel(key){ return payload?.statuses?.[key] || key; }
  function filteredOrders(){ const q=$('#orderSearch').value.trim().toLowerCase(); const status=$('#statusFilter').value; const assign=$('#assignmentFilter').value; return (payload?.orders||[]).filter(o=>{ const hay=[o.order_id,o.order_name,o.customer_name,o.customer_email,o.assigned_name].join(' ').toLowerCase(); if(q&&!hay.includes(q))return false; if(status&&o.status!==status)return false; if(assign==='mine' && Number(o.assigned_staff_id)!==Number(payload.user.id))return false; if(assign==='unassigned' && o.assigned_staff_id)return false; return true; }); }
  function renderOrderList(){ const list=$('#orderList'); if(!can('orders_view')){list.innerHTML='<div class="empty">Nie masz uprawnień do podglądu zleceń.</div>';return;} const rows=filteredOrders(); list.innerHTML=rows.length?rows.map(o=>`<button class="order-row ${o.order_id===selectedOrderId?'active':''}" data-order="${esc(o.order_id)}"><div class="order-row__top"><div><strong>${esc(o.order_name||o.order_id)}</strong><small>${esc(o.customer_name||'Bez nazwy klienta')} • ${date(o.updated_at)}</small></div><span class="money">${money(o.total)} zł</span></div><div class="row-between" style="margin-top:9px"><span class="pill">${esc(statusLabel(o.status))}</span><small>${esc(o.assigned_name||'Nieprzypisane')}</small></div></button>`).join(''):'<div class="empty">Brak zleceń spełniających filtr.</div>'; $$('[data-order]').forEach(b=>b.addEventListener('click',()=>{selectedOrderId=b.dataset.order;renderOrderList();renderOrderDetail();})); }
  function prodDay(){const n=new Date();return [n.getFullYear(),String(n.getMonth()+1).padStart(2,'0'),String(n.getDate()).padStart(2,'0')].join('-');}
  const prodTime=s=>{const sec=Math.max(0,Number(s||0));return Math.floor(sec/3600)+' h '+String(Math.floor(sec%3600/60)).padStart(2,'0')+' min';};
  function productionEditor(o){
    const priorities=payload?.production_priorities||{low:'Niski',normal:'Normalny',high:'Wysoki',urgent:'Pilne'};
    const editing=can('orders_production');
    return `<div class="section p29-editor"><h3>Plan produkcji</h3><div class="grid3">
      <div class="field"><label>Priorytet</label>${editing?`<select id="prodMetaPriority">${Object.entries(priorities).map(([k,v])=>`<option value="${esc(k)}" ${k===(o.priority||'normal')?'selected':''}>${esc(v)}</option>`).join('')}</select>`:`<strong>${esc(priorities[o.priority]||'Normalny')}</strong>`}</div>
      <div class="field"><label>Termin realizacji</label>${editing?`<input id="prodMetaDue" type="date" value="${esc(o.due_date||'')}">`:`<strong>${esc(o.due_date||'Nieustalony')}</strong>`}</div>
      <div class="field"><label>Rozpoczęcie etapu produkcji</label><strong>${date(o.production_started_at)||'—'}</strong></div></div>
      ${editing?'<div class="actions"><button class="btn secondary" id="saveProductionMeta">Zapisz plan</button></div>':''}
      <div class="p29-work"><span class="muted">Zapisany czas aktywnej pracy (bez czasu oczekiwania)</span><strong>${prodTime(o.work_seconds)}</strong><div class="muted">${o.work_started_at?'Pomiar trwa od '+date(o.work_started_at)+' — bieżący okres zostanie dodany po wstrzymaniu.':'Stoper wstrzymany'}${o.production_finished_at?' · Zakończono etap: '+date(o.production_finished_at):''}</div>
      ${editing?`<div class="actions"><button class="btn secondary" id="prodTimerButton" data-work-action="${o.work_started_at?'pause':'start'}" ${!o.work_started_at&&['ready','cancelled'].includes(o.status)?'disabled':''}>${o.work_started_at?'⏸ Wstrzymaj i zapisz czas':'▶ Rozpocznij pracę'}</button></div>`:''}</div>
      <div class="actions"><button class="btn secondary" id="prodEventsButton" type="button">Historia zmian produkcji</button></div><div id="prodEvents" class="p29-history" aria-live="polite"></div>
    </div>`;
  }
  function renderProduction(){
    if(!can('orders_view')){ $('#prodBoard').innerHTML='<div class="empty">Brak uprawnień do podglądu produkcji.</div>';return; }
    const all=payload.orders||[],summary=payload.production_summary||{},now=prodDay();
    const metrics=[['Otwarte',summary.open_orders||0,''],['W produkcji',summary.in_production||0,''],['Po terminie',summary.overdue||0,'danger'],['Na dziś',summary.due_today||0,'warn'],['Pilne',summary.urgent||0,'warn'],['Bez pracownika',summary.unassigned||0,'']];
    $('#prodMetrics').innerHTML=metrics.map(([label,val,cls])=>`<div class="p29-stat ${cls}"><small>${label}</small><strong>${Number(val)}</strong></div>`).join('');
    const priority=$('#prodPriority').value,due=$('#prodDue').value,assigned=$('#prodAssigned').value,q=$('#prodSearch').value.trim().toLowerCase();
    const filtered=all.filter(o=>{
      if(o.status==='cancelled')return false;
      if(priority&&o.priority!==priority)return false;
      if(due==='overdue'&&!(o.due_date&&o.due_date<now&&o.status!=='ready'))return false;
      if(due==='today'&&o.due_date!==now)return false;
      if(due==='unset'&&o.due_date)return false;
      if(assigned==='mine'&&Number(o.assigned_staff_id)!==Number(payload.user.id))return false;
      if(assigned==='unassigned'&&o.assigned_staff_id)return false;
      if(q&&![o.order_id,o.order_name,o.customer_name,o.assigned_name].join(' ').toLowerCase().includes(q))return false;
      return true;
    });
    const priorityRank={urgent:0,high:1,normal:2,low:3};
    filtered.sort((a,b)=>Number(a.status==='ready')-Number(b.status==='ready')||(priorityRank[a.priority]??2)-(priorityRank[b.priority]??2)||((!a.due_date?1:0)-(!b.due_date?1:0))||String(a.due_date||'').localeCompare(String(b.due_date||''))||String(a.created_at).localeCompare(String(b.created_at)));
    const groups=[['Nowe',['received']],['Do przygotowania',['confirmed','awaiting_files']],['W produkcji',['production']],['Gotowe',['ready']]];
    $('#prodBoard').innerHTML=groups.map(([label,statuses])=>{const group=filtered.filter(o=>statuses.includes(o.status));return `<div class="p29-column"><h3>${esc(label)} <span class="pill">${group.length}</span></h3><div class="p29-stack">${group.length?group.map(o=>{
      const over=o.due_date&&o.due_date<now&&o.status!=='ready',today=o.due_date===now&&o.status!=='ready';
      const pr=payload.production_priorities?.[o.priority]||'Normalny';
      return `<button type="button" class="p29-card" data-prod-id="${esc(o.order_id)}"><strong>${esc(o.order_name||o.order_id)}</strong><small>${esc(o.order_id)} · ${esc(o.assigned_name||'Nieprzypisane')}</small><div class="p29-tags"><span class="p29-tag ${esc(o.priority||'normal')}">${esc(pr)}</span>${o.due_date?`<span class="p29-tag ${over?'overdue':today?'today':''}">${over?'PO TERMINIE · ':today?'DZIŚ · ':''}${esc(o.due_date)}</span>`:'<span class="p29-tag">Bez terminu</span>'}${o.work_started_at?'<span class="p29-tag">● Stoper działa</span>':''}</div></button>`;
    }).join(''):'<div class="muted" style="font-size:12px;padding:12px">Brak zleceń.</div>'}</div></div>`;}).join('');
    $$('[data-prod-id]').forEach(b=>b.onclick=()=>{selectedOrderId=b.dataset.prodId;switchTab('orders');renderOrderList();renderOrderDetail();});
    $('#prodCoverage').textContent=`Widok pokazuje ${all.length} ostatnio zmienionych zleceń (maks. 500), z czego ${filtered.length} spełnia filtry. Liczniki u góry pochodzą z całej bazy.`;
  }
  function renderOrderDetail(){ const box=$('#orderDetail'); const o=(payload?.orders||[]).find(x=>x.order_id===selectedOrderId); if(!o){box.innerHTML='<div class="detail-empty">Wybierz zlecenie z listy.</div>';return;} const staffOptions=(payload.staff||[]).filter(s=>s.active).map(s=>`<option value="${s.id}" ${Number(o.assigned_staff_id)===Number(s.id)?'selected':''}>${esc(s.display_name)}</option>`).join(''); box.innerHTML=`<div class="row-between"><div><div class="pill">${esc(statusLabel(o.status))}</div><h2>${esc(o.order_name||o.order_id)}</h2><div class="sub">${esc(o.order_id)} • utworzono ${date(o.created_at)}</div></div><strong style="font-size:22px">${money(o.total)} zł</strong></div><div class="grid3" style="margin-top:14px"><div class="metric"><span>Klient</span><strong>${esc(o.customer_name||'—')}</strong></div><div class="metric"><span>Kontakt</span><strong>${esc(o.customer_phone||o.customer_email||'—')}</strong></div><div class="metric"><span>Pracownik</span><strong>${esc(o.assigned_name||'Nieprzypisane')}</strong></div></div>${o.promo_code?`<div class="notice" style="margin-top:12px;margin-bottom:0">Kod rabatowy <strong>${esc(o.promo_code)}</strong> · zniżka −${money(o.discount)} zł (kwota zlecenia jest już po zniżce, dostawa liczona osobno)</div>`:''}${can('orders_rename')?`<div class="section"><h3>Nazwa robocza zlecenia</h3><div class="grid2"><div class="field" style="margin:0"><input id="orderName" maxlength="190" value="${esc(o.order_name)}" placeholder="np. Menu Restauracja Portowa"></div><button class="btn" id="saveOrderName">Zapisz nazwę</button></div></div>`:''}${can('orders_assign')?`<div class="section"><h3>Przypisanie</h3><div class="grid2"><select id="orderAssignee"><option value="">Nieprzypisane</option>${staffOptions}</select><button class="btn secondary" id="saveOrderAssignee">Zapisz przypisanie</button></div></div>`:''}${can('orders_status')?`<div class="section"><h3>Status wewnętrzny</h3><p class="muted">Publiczny podgląd postępu zlecenia jest wyłączony.</p><div class="grid2"><div class="field" style="margin:0"><select id="orderStatus">${Object.entries(payload.statuses||{}).map(([k,v])=>`<option value="${esc(k)}" ${o.status===k?'selected':''}>${esc(v)}</option>`).join('')}</select></div><div class="field" style="margin:0"><textarea id="publicNote" maxlength="500" placeholder="Notatka statusu (obecnie niewidoczna dla klienta)">${esc(o.public_note)}</textarea></div></div><button class="btn" id="saveOrderStatus">Aktualizuj status</button>${o.ready_notified_at?`<div class="notice" style="margin-top:10px;margin-bottom:0">✓ Powiadomienie przyjęte przez WordPress: ${date(o.ready_notified_at)}</div>`:''}</div>`:''}${can('orders_notes')?`<div class="section"><h3>Notatka wewnętrzna</h3><div class="field"><textarea id="internalNote" maxlength="4000" placeholder="Widoczna tylko dla pracowników">${esc(o.internal_note)}</textarea></div><button class="btn secondary" id="saveInternalNote">Zapisz notatkę</button></div>`:''}${productionEditor(o)}<div class="section"><h3>Produkty</h3><div class="items">${(o.items||[]).map((it,i)=>`<div class="item"><div class="row-between"><strong>${i+1}. ${esc(it.title||'Produkt')}</strong><b>${money(it.price)} zł</b></div>${it.description?`<p>${esc(it.description)}</p>`:''}</div>`).join('')}</div></div><div class="section"><h3>Dane klienta</h3><div class="customer"><div><span>E-mail</span><strong>${esc(o.customer_email||'—')}</strong></div><div><span>Telefon</span><strong>${esc(o.customer_phone||'—')}</strong></div><div><span>Odbiór</span><strong>${esc(o.pickup||'—')}</strong></div><div><span>Uwagi klienta</span><strong>${esc(o.notes||'—')}</strong></div></div></div><div class="section"><h3>Historia</h3><div class="items">${[...(o.history||[])].reverse().map(h=>`<div class="item"><div class="row-between"><strong>${esc(h.label||h.status)}</strong><small>${date(h.at)}</small></div>${h.note?`<p>${esc(h.note)}</p>`:''}${h.actor?`<p>Zmienił: ${esc(h.actor)}</p>`:''}</div>`).join('')}</div></div>`;
    $('#saveOrderName')?.addEventListener('click',async()=>{try{await api({action:'order_name',order_id:o.order_id,order_name:$('#orderName').value});toast('Zapisano nazwę');await load(true)}catch(e){toast(e.message)}});
    $('#saveOrderAssignee')?.addEventListener('click',async()=>{try{await api({action:'order_assign',order_id:o.order_id,staff_id:$('#orderAssignee').value});toast('Zapisano przypisanie');await load(true)}catch(e){toast(e.message)}});
    $('#saveOrderStatus')?.addEventListener('click',async()=>{try{const selectedStatus=$('#orderStatus').value;let confirmReady=false;if(selectedStatus==='ready'&&!o.ready_notified_at){const target=o.customer_email?` na adres ${o.customer_email}`:'';if(!confirm(`Potwierdzasz, że zlecenie jest GOTOWE?\n\nPo zapisaniu statusu zostanie podjęta próba wysłania e-maila${target}.`))return;confirmReady=true;}const j=await api({action:'order_status',order_id:o.order_id,status:selectedStatus,public_note:$('#publicNote').value,confirm_ready:confirmReady});if(j.orders)payload.orders=j.orders;toast(j.message||'Status zaktualizowany');renderAll()}catch(e){toast(e.message)}});
    $('#saveProductionMeta')?.addEventListener('click',async()=>{
      const b=$('#saveProductionMeta');b.disabled=true;
      try{const j=await api({action:'production_update',order_id:o.order_id,priority:$('#prodMetaPriority').value,due_date:$('#prodMetaDue').value});payload.orders=j.orders||payload.orders;payload.production_summary=j.production_summary||payload.production_summary;toast(j.message);renderAll();}
      catch(e){toast(e.message)}finally{b.disabled=false}
    });
    $('#prodTimerButton')?.addEventListener('click',async()=>{
      const b=$('#prodTimerButton');b.disabled=true;
      try{const j=await api({action:'production_work',order_id:o.order_id,work_action:b.dataset.workAction});payload.orders=j.orders||payload.orders;payload.production_summary=j.production_summary||payload.production_summary;toast(j.message);renderAll();}
      catch(e){toast(e.message)}finally{b.disabled=false}
    });
    $('#prodEventsButton')?.addEventListener('click',async()=>{
      const b=$('#prodEventsButton'),area=$('#prodEvents');b.disabled=true;area.textContent='Ładowanie historii…';
      try{const r=await fetch('staff-api.php?action=production_events&order_id='+encodeURIComponent(o.order_id),{credentials:'same-origin',cache:'no-store'});const j=await r.json();if(!r.ok||!j.success)throw Error(j.message||'Błąd');
        const labels={priority_changed:'Zmieniono priorytet',deadline_changed:'Zmieniono termin',status_changed:'Zmieniono status',assignment_changed:'Zmieniono pracownika',work_started:'Rozpoczęto pomiar pracy',work_paused:'Wstrzymano pomiar pracy',name_changed:'Zmieniono nazwę',note_changed:'Zmieniono notatkę'};
        area.innerHTML=(j.events||[]).length?j.events.map(e=>`<div class="p29-history-item"><strong>${esc(labels[e.event_type]||e.event_type)}</strong><small>${date(e.created_at)} · ${esc(e.actor_name||'System')}${e.details?.before||e.details?.after?' · '+esc([e.details.before,e.details.after].filter(Boolean).join(' → ')):''}</small></div>`).join(''):'<span class="muted">Brak historii. Zdarzenia sprzed 0.22.9v nie są odtwarzane wstecz.</span>';
      }catch(e){area.textContent=e.message}finally{b.disabled=false}
    });
    $('#saveInternalNote')?.addEventListener('click',async()=>{try{await api({action:'order_note',order_id:o.order_id,internal_note:$('#internalNote').value});toast('Zapisano notatkę');await load(true)}catch(e){toast(e.message)}});
  }
  /* ===== Analityka 0.26.9v =====
     Widok analityczny: okres z porównaniem do poprzedniego, zakładki Przegląd / Lejek / Produkty / Ruch / Dni.
     Dane zbiorcze z staff-api.php?action=analytics (bez IP, nazwisk i adresów e-mail). */
  const AN_VIEWS=[['overview','Przegląd'],['funnel','Lejek'],['products','Produkty'],['traffic','Ruch'],['days','Dni']];
  const AN_PERIODS=[[1,'Dziś'],[7,'7 dni'],[14,'14 dni'],[30,'30 dni'],[90,'90 dni']];
  const AN_SOURCE={direct:'Wejścia bezpośrednie',search:'Wyszukiwarki',social:'Social media',referral:'Inne strony',unknown:'Brak danych (starsze sesje)'};
  const AN_DEVICE={mobile:'Telefon',tablet:'Tablet',desktop:'Komputer',unknown:'Nieznane (starsze sesje)'};
  const AN_LANG={pl:'Polski',en:'Angielski',other:'Inne wersje językowe',unknown:'Nieznany (starsze sesje)'};
  const AN_ERROR={stale_item:'Pozycja ze starszej wersji kalkulatora',limit:'Przekroczony limit (wymiar, nakład, wartość)',validation:'Niepełny formularz (imię, e-mail, zgoda)',files:'Problem z plikami',network:'Błąd połączenia',server:'Inny błąd serwera'};
  const AN_WEEKDAYS=['Pon','Wt','Śr','Czw','Pt','Sob','Nd'];
  const AN_WEEKDAYS_LONG=['poniedziałek','wtorek','środa','czwartek','piątek','sobota','niedziela'];
  const AN_METRICS=[['sessions','Sesje',false],['prices','Cena po konfiguracji',false],['quotes','Wyceny',false],['carts','Koszyki',false],['orders','Przyjęte zapytania',false],['value_cents','Wartość zapytań',true]];
  const an={view:'overview',metric:'sessions',compare:true,error:'',key:'',loadingDays:0,hourSpec:null,prodSort:['value','desc'],daySort:['day','desc'],prodFilter:''};
  try{ const v=sessionStorage.getItem('d24_an_view'); if(AN_VIEWS.some(x=>x[0]===v)) an.view=v; const d=Number(localStorage.getItem('d24_an_days')); if(AN_PERIODS.some(x=>x[0]===d)) analyticsDays=d; if(localStorage.getItem('d24_an_compare')==='0') an.compare=false; }catch{}

  const anN=v=>Number(v||0).toLocaleString('pl-PL');
  const anP=(v,d=1)=>Number.isFinite(v)?(v*100).toLocaleString('pl-PL',{maximumFractionDigits:d})+'%':'—';
  const anZl=cents=>money(Number(cents||0)/100)+' zł';
  const anDay=day=>{const m=String(day).split('-');return m.length===3?m[2]+'.'+m[1]:String(day);};
  const anDayFull=day=>{const m=String(day).split('-');return m.length===3?m[2]+'.'+m[1]+'.'+m[0]:String(day);};
  const anWd=day=>AN_WEEKDAYS[(new Date(day+'T12:00:00').getDay()+6)%7];
  const anRatio=(a,b)=>Number(b)>0?Number(a)/Number(b):NaN;
  const anSum=list=>(list||[]).reduce((s,x)=>s+(Number(x)||0),0);
  const anEntries=(obj)=>Object.entries(obj||{}).map(([k,v])=>[k,Number(v)||0]).sort((a,b)=>b[1]-a[1]);
  const anPrevLabel=()=>analyticsDays===1?'wczoraj':'poprzednie '+analyticsDays+' dni';
  const anHasPrev=a=>an.compare&&a?.previous&&a.previous.totals&&Object.keys(a.previous.totals).length>0;

  // Zmiana względem poprzedniego okresu. inverse = spadek jest korzystny (porzucone koszyki, błędy); pp = różnica w punktach procentowych (współczynniki).
  function anDelta(a,cur,prev,{inverse=false,pp=false}={}){
    if(!anHasPrev(a)) return '';
    const title='Poprzedni okres ('+anPrevLabel()+'): '+(pp?anP(prev):anN(prev));
    if(pp){
      if(!Number.isFinite(cur)||!Number.isFinite(prev)) return '';
      const d=(cur-prev)*100;
      if(Math.abs(d)<0.05) return `<span class="an9-delta" title="${esc(title)}">bez zmian</span>`;
      return `<span class="an9-delta ${(d>0)!==inverse?'good':'bad'}" title="${esc(title)}">${d>0?'▲':'▼'} ${Math.abs(d).toLocaleString('pl-PL',{maximumFractionDigits:1})} p.p.</span>`;
    }
    if(!prev&&!cur) return `<span class="an9-delta" title="${esc(title)}">bez zmian</span>`;
    if(!prev) return `<span class="an9-delta new" title="${esc(title)}">nowe</span>`;
    const ch=(cur-prev)/prev;
    if(Math.abs(ch)<0.005) return `<span class="an9-delta" title="${esc(title)}">bez zmian</span>`;
    return `<span class="an9-delta ${(ch>0)!==inverse?'good':'bad'}" title="${esc(title)}">${ch>0?'▲':'▼'} ${Math.abs(ch*100).toLocaleString('pl-PL',{maximumFractionDigits:Math.abs(ch)>=1?0:1})}%</span>`;
  }
  function anSpark(values){
    const v=(values||[]).map(x=>Number(x)||0);
    if(v.length<2||Math.max(...v)<=0) return '';
    const max=Math.max(...v),step=100/(v.length-1);
    const pts=v.map((x,i)=>(i*step).toFixed(1)+','+(26-x/max*24).toFixed(1)).join(' ');
    return `<svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }
  const anKpi=({label,value,sub,delta,spark,cls,help})=>`<div class="an9-kpi ${cls||''}"><div class="an9-kpi__top"><span>${label}</span>${help?`<span class="an9-help" tabindex="0" role="img" aria-label="${esc(label+': '+help)}" data-tip="${esc(help)}">?</span>`:''}</div><strong>${value}</strong><div class="an9-kpi__meta">${delta||''}${sub?`<small>${sub}</small>`:''}</div>${spark||''}</div>`;

  // --- skala osi i wykres SVG (słupki dla godzin, linia z obszarem dla dni; opcjonalnie linia przerywana = poprzedni okres)
  function anTicks(max,isInt){
    if(!(max>0)) return {top:4,step:1,n:4};
    let step=max/4; const exp=Math.pow(10,Math.floor(Math.log10(step))); const f=step/exp;
    step=(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*exp;
    if(isInt&&step<1) step=1;
    const n=Math.max(1,Math.ceil(max/step-1e-9));
    return {top:n*step,step,n};
  }
  function anChart(o){
    const W=o.W||820,H=o.H||270,L=46,R=12,T=14,B=30,iw=W-L-R,ih=H-T-B,len=o.cur.length;
    const all=[...o.cur,...(o.prev||[])]; const {top,step,n}=anTicks(Math.max(0,...all),!o.money);
    const x=i=>o.bar?L+(i+.5)*iw/len:L+(len===1?iw/2:i*iw/(len-1));
    const y=v=>T+ih-(Math.max(0,v)/top)*ih;
    const yfmt=v=>o.money?Number(v).toLocaleString('pl-PL',{maximumFractionDigits:0}):Number(v).toLocaleString('pl-PL',{maximumFractionDigits:2});
    let g='';
    for(let i=0;i<=n;i++){const val=i*step,yy=y(val);g+=`<line class="${i===0?'an9-axis':'an9-grid-line'}" x1="${L}" x2="${W-R}" y1="${yy.toFixed(1)}" y2="${yy.toFixed(1)}"/><text x="${L-8}" y="${(yy+4).toFixed(1)}" text-anchor="end">${esc(yfmt(val))}</text>`;}
    const every=Math.max(1,Math.ceil(len/Math.max(2,Math.floor(iw/(o.bar?30:56)))));
    for(let i=0;i<len;i++) if(i%every===0||i===len-1) g+=`<text x="${x(i).toFixed(1)}" y="${H-8}" text-anchor="middle">${esc(o.xlabel(i))}</text>`;
    let marks='';
    const peak=o.cur.indexOf(Math.max(...o.cur));
    if(o.bar){
      const bw=Math.max(3,Math.min(26,iw/len*.62));
      marks=o.cur.map((v,i)=>`<rect class="an9-bar${i===peak&&v>0?' is-peak':''}" x="${(x(i)-bw/2).toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,T+ih-y(v)).toFixed(1)}" rx="2"/>`).join('');
    }else{
      const pts=o.cur.map((v,i)=>x(i).toFixed(1)+','+y(v).toFixed(1));
      marks=`<path class="an9-area" d="M${x(0).toFixed(1)},${(T+ih).toFixed(1)} L${pts.join(' L')} L${x(len-1).toFixed(1)},${(T+ih).toFixed(1)} Z"/><polyline class="an9-line" points="${pts.join(' ')}"/>`;
      if(len<=31) marks+=o.cur.map((v,i)=>`<circle class="an9-dot" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.4"/>`).join('');
    }
    const prev=o.prev&&o.prev.length===len?`<polyline class="an9-prev" points="${o.prev.map((v,i)=>x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ')}"/>`:'';
    o.yFn=y;
    const label=o.ariaLabel||'Wykres';
    return `<div class="an9-chart" tabindex="0" role="group" aria-label="${esc(label)}. Strzałkami w lewo i w prawo przechodzisz po punktach." data-chart>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}"><defs><linearGradient id="an9Grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5493d0" stop-opacity=".38"/><stop offset="1" stop-color="#5493d0" stop-opacity="0"/></linearGradient></defs>${g}${marks}${prev}<line class="an9-hover" data-hover x1="0" x2="0" y1="${T}" y2="${T+ih}" style="display:none"/></svg>
      <div class="an9-tip" data-tip-box hidden></div></div>`;
  }
  function anChartBind(root,o){
    const box=root.querySelector('[data-chart]'); if(!box) return;
    const svg=box.querySelector('svg'),hover=box.querySelector('[data-hover]'),tip=box.querySelector('[data-tip-box]');
    const W=o.W||820,L=46,R=12,iw=W-L-R,len=o.cur.length; let idx=-1;
    const xAt=i=>o.bar?L+(i+.5)*iw/len:L+(len===1?iw/2:i*iw/(len-1));
    function show(i){
      i=Math.max(0,Math.min(len-1,i)); idx=i;
      const rect=svg.getBoundingClientRect(),scale=rect.width/W,px=xAt(i)*scale;
      hover.setAttribute('x1',xAt(i)); hover.setAttribute('x2',xAt(i)); hover.style.display='';
      tip.innerHTML=o.tip(i); tip.hidden=false;
      const half=tip.offsetWidth/2,vals=[o.cur[i]].concat(o.prev?[o.prev[i]]:[]),py=(o.yFn?Math.min(...vals.map(v=>o.yFn(v))):20)*scale;
      tip.style.left=Math.max(half,Math.min(rect.width-half,px))+'px'; tip.style.top=py+'px';
      const above=py-tip.offsetHeight-12>=0; tip.style.transform=above?'':'translate(-50%,0)'; tip.style.marginTop=above?'':'14px';
    }
    function hide(){ idx=-1; hover.style.display='none'; tip.hidden=true; }
    svg.addEventListener('pointermove',e=>{const rect=svg.getBoundingClientRect(),vx=(e.clientX-rect.left)/rect.width*W;show(o.bar?Math.floor((vx-L)/iw*len):Math.round((vx-L)/iw*(len-1)));});
    svg.addEventListener('pointerleave',hide);
    box.addEventListener('blur',hide);
    box.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'){e.preventDefault();show(idx<0?0:idx+1);} else if(e.key==='ArrowLeft'){e.preventDefault();show(idx<0?len-1:idx-1);} else if(e.key==='Escape') hide(); });
  }

  // --- dane pochodne
  function anSteps(t){ t=t||{}; return [['Sesje',+t.sessions||0,'Unikalne sesje przeglądarki.'],['Cena po konfiguracji',+t.stage_price||0,'Sesje, w których klient zmienił parametry i zobaczył cenę (nie liczy ceny domyślnej po samym wejściu).'],['Wyceny',+t.stage_quote||0,'Sesje, w których wyświetlono wycenę.'],['Koszyki',+t.stage_cart||0,'Sesje, w których dodano pozycję do koszyka.'],['Formularz zamówienia',+t.stage_checkout||0,'Sesje, które otworzyły formularz wysłania zapytania.'],['Przyjęte zapytania',+t.orders_verified||0,'Zapytania przyjęte przez serwer (wysłany e-mail), nie płatności.']]; }
  function anProductRows(a){
    const keys=new Set([...Object.keys(a.pages||{}),...Object.keys(a.price_products||{}),...Object.keys(a.cart_products||{}),...Object.keys(a.ordered_products||{}),...Object.keys(a.ordered_value_cents||{})]);
    keys.delete('Strona główna');
    return [...keys].map(name=>{const views=+a.pages?.[name]||0,price=+a.price_products?.[name]||0,cart=+a.cart_products?.[name]||0,ordered=+a.ordered_products?.[name]||0,value=(+a.ordered_value_cents?.[name]||0)/100;
      return {name,views,price,cart,ordered,value,cartRate:anRatio(cart,price),orderRate:anRatio(ordered,cart)};});
  }
  function anSortRows(rows,[key,dir]){
    const m=dir==='asc'?1:-1;
    return rows.slice().sort((p,q)=>{const x=p[key],y=q[key];
      if(typeof x==='string'||typeof y==='string') return m*String(x).localeCompare(String(y),'pl');
      const xn=Number.isFinite(x),yn=Number.isFinite(y); if(!xn&&!yn) return String(p.name||p.day).localeCompare(String(q.name||q.day),'pl'); if(!xn) return 1; if(!yn) return -1;
      return m*(x-y)||String(p.name||'').localeCompare(String(q.name||''),'pl');});
  }
  function anInsights(a){
    const t=a.totals||{},out=[],series=a.series||[],sessions=+t.sessions||0;
    if(!sessions) return [{tone:'warn',text:'W wybranym okresie nie zarejestrowano żadnych sesji.'}];
    if(series.length>1){
      const best=series.reduce((m,x)=>x.sessions>m.sessions?x:m,series[0]);
      if(best.sessions>0) out.push({tone:'info',text:`Najwięcej ruchu: <b>${esc(anWd(best.day))} ${esc(anDay(best.day))}</b> — ${anN(best.sessions)} sesji.`});
      const bestOrder=series.reduce((m,x)=>x.orders>m.orders?x:m,series[0]);
      if(bestOrder.orders>0) out.push({tone:'good',text:`Najwięcej zapytań: <b>${esc(anWd(bestOrder.day))} ${esc(anDay(bestOrder.day))}</b> — ${anN(bestOrder.orders)} (${esc(anZl(bestOrder.value_cents))}).`});
    }
    const steps=anSteps(t); let worst=null;
    for(let i=1;i<steps.length;i++){const prev=steps[i-1][1],cur=steps[i][1],loss=Math.max(0,prev-cur); if(prev>=5&&loss>0&&(!worst||loss>worst.loss)) worst={from:steps[i-1][0],to:steps[i][0],loss,share:loss/prev};}
    if(worst) out.push({tone:'warn',text:`Największa strata w lejku: z etapu „${esc(worst.from)}” do „${esc(worst.to)}” — odpada <b>${anN(worst.loss)}</b> sesji (${esc(anP(worst.share,0))}).`});
    const abandoned=+a.abandoned||0,carts=+t.stage_cart||0;
    if(abandoned>0&&carts>0) out.push({tone:'warn',text:`<b>${anN(abandoned)}</b> sesji porzuciło koszyk (${esc(anP(abandoned/carts,0))} sesji z koszykiem) — warto sprawdzić, na jakim etapie klienci rezygnują.`});
    const topCart=anEntries(a.cart_products)[0]; if(topCart&&topCart[1]>0) out.push({tone:'info',text:`Najczęściej dodawane do koszyka: <b>${esc(topCart[0])}</b> (${anN(topCart[1])}).`});
    const topValue=anEntries(a.ordered_value_cents)[0]; const valueSum=anSum(Object.values(a.ordered_value_cents||{}));
    if(topValue&&valueSum>0) out.push({tone:'good',text:`Największa wartość zapytań: <b>${esc(topValue[0])}</b> — ${esc(anZl(topValue[1]))} (${esc(anP(topValue[1]/valueSum,0))} wartości).`});
    const errors=+t.order_error||0; if(errors>0){const top=anEntries(a.order_errors)[0]; out.push({tone:'bad',text:`Błędy wysyłki zamówienia: <b>${anN(errors)}</b>${top?` — najczęstszy: ${esc(AN_ERROR[top[0]]||top[0])}`:''}.`});}
    const search=+t.search||0,miss=+t.search_miss||0; if(search>=5&&miss/search>=0.2) out.push({tone:'warn',text:`${esc(anP(miss/search,0))} wyszukiwań w kalkulatorze nie dało wyników (${anN(miss)} z ${anN(search)}) — zajrzyj do zakładki Ruch, jakich haseł szukają klienci.`});
    const hours=a.hours||[],hs=anSum(hours); if(hs>=10){const h=hours.indexOf(Math.max(...hours)); out.push({tone:'info',text:`Najwięcej wejść o godz. <b>${String(h).padStart(2,'0')}:00–${String(h).padStart(2,'0')}:59</b>.`});}
    const rank={bad:0,warn:1,good:2,info:3};   // najpierw to, co wymaga reakcji
    return out.map((x,i)=>[x,i]).sort((p,q)=>rank[p[0].tone]-rank[q[0].tone]||p[1]-q[1]).map(x=>x[0]).slice(0,8);
  }

  // --- widoki
  function anOverview(a){
    const t=a.totals||{},p=a.previous?.totals||{},series=a.series||[];
    const sessions=+t.sessions||0,orders=+t.orders_verified||0,carts=+t.stage_cart||0,value=(+t.orders_value_cents||0)/100,errors=+t.order_error||0;
    const pSessions=+p.sessions||0,pOrders=+p.orders_verified||0,pCarts=+p.stage_cart||0,pValue=(+p.orders_value_cents||0)/100,pErrors=+p.order_error||0;
    const conv=anRatio(orders,sessions),pConv=anRatio(pOrders,pSessions),avg=anRatio(value,orders),pAvg=anRatio(pValue,pOrders);
    const abandoned=+a.abandoned||0;
    const kpis=[
      anKpi({label:'Sesje',value:anN(sessions),delta:anDelta(a,sessions,pSessions),sub:'unikalne sesje',spark:anSpark(series.map(x=>x.sessions)),help:'Liczba unikalnych sesji przeglądarki (jedna osoba może mieć kilka sesji). Bez adresów IP.'}),
      anKpi({label:'Sesje z koszykiem',value:anN(carts),delta:anDelta(a,carts,pCarts),sub:sessions?anP(carts/sessions,1)+' sesji':'',spark:anSpark(series.map(x=>x.carts)),help:'Sesje, w których dodano co najmniej jedną pozycję do koszyka.'}),
      anKpi({label:'Przyjęte zapytania',value:anN(orders),delta:anDelta(a,orders,pOrders),sub:'potwierdzone przez serwer',spark:anSpark(series.map(x=>x.orders)),cls:'is-orders',help:'Zapytania, które serwer przyjął i wysłał jako e-mail do drukarni. To nie są płatności ani zrealizowana sprzedaż.'}),
      anKpi({label:'Konwersja',value:anP(conv,2),delta:anDelta(a,conv,pConv,{pp:true}),sub:'zapytania ÷ sesje',help:'Przyjęte zapytania podzielone przez liczbę sesji w okresie. To nie jest analiza tej samej grupy klientów.'}),
      anKpi({label:'Wartość zapytań',value:anZl(value*100),delta:anDelta(a,value,pValue),sub:'nieopłacona, tylko wyceny',spark:anSpark(series.map(x=>x.value_cents)),cls:'is-orders',help:'Suma wartości przyjętych zapytań (brutto z kalkulatora). Zapytanie nie jest równoznaczne z zamówieniem zapłaconym.'}),
      anKpi({label:'Średnia wartość zapytania',value:Number.isFinite(avg)?money(avg)+' zł':'—',delta:anDelta(a,avg,pAvg),sub:orders?'z '+anN(orders)+' zapytań':'brak zapytań',help:'Wartość zapytań podzielona przez liczbę przyjętych zapytań.'}),
      anKpi({label:'Koszyki porzucone',value:anN(abandoned),sub:carts?anP(abandoned/carts,0)+' sesji z koszykiem':'—',cls:'is-warn',help:a.abandoned_definition||'Sesje z koszykiem, bez zapytania, nieaktywne co najmniej 24 godziny.'}),
      anKpi({label:'Błędy wysyłki',value:anN(errors),delta:anDelta(a,errors,pErrors,{inverse:true}),sub:orders+errors?anP(errors/(orders+errors),0)+' prób wysłania':'—',cls:'is-warn',help:'Próby wysłania zamówienia, które się nie powiodły (np. limit, brak zgody, błąd połączenia).'})
    ].join('');
    const hourly=Number(a.period_days)===1;
    const chartHtml=hourly?`<h3 id="an9ChartTitle">Sesje wg godziny — dziś</h3><p class="an9-card__sub">Godzina wejścia na stronę (czas strony). ${anHasPrev(a)?'Linia przerywana — wczoraj.':''}</p>`:`<h3 id="an9ChartTitle">Dzień po dniu</h3><p class="an9-card__sub">Wybierz wskaźnik. ${anHasPrev(a)?'Linia przerywana — poprzedni okres ('+esc(anPrevLabel())+').':''}</p><div class="an9-chips" role="group" aria-label="Wskaźnik na wykresie">${AN_METRICS.map(([key,label])=>`<button type="button" class="an9-chip" data-an-metric="${key}" aria-pressed="${an.metric===key}">${esc(label)}</button>`).join('')}</div>`;
    const insights=anInsights(a);
    return `<div class="an9-kpis">${kpis}</div>
      <section class="card an9-card" aria-labelledby="an9ChartTitle" style="margin-bottom:14px"><div id="an9ChartHost">${chartHtml}<div id="an9ChartBox"></div><div class="an9-legend" id="an9Legend"></div></div></section>
      <div class="an9-grid2 an9-grid2--even"><section class="card an9-card"><h3>Lejek w skrócie</h3><p class="an9-card__sub">Ilu sesjom udaje się przejść do kolejnego etapu.</p>${anFunnelList(a,true)}</section>
      <section class="card an9-card"><h3>Najważniejsze wnioski</h3><p class="an9-card__sub">Wyliczone automatycznie z danych tego okresu; najpierw to, co wymaga reakcji.</p><ul class="an9-insights">${insights.map(i=>`<li class="${esc(i.tone)}"><span>${i.text}</span></li>`).join('')}</ul></section></div>
      <div class="an9-grid2 an9-grid2--even"><section class="card an9-card"><h3>Najlepsze kategorie</h3><p class="an9-card__sub">Według wartości przyjętych zapytań, a gdy jej brak — według dodań do koszyka.</p>${anTopCategories(a)}</section>
      <section class="card an9-card"><h3>Źródła ruchu</h3><p class="an9-card__sub">Skąd klienci wchodzą na stronę (szczegóły w zakładce Ruch).</p>${anShareList(a.sources,AN_SOURCE,+a.totals?.sessions||0,a.segments?.source)}</section></div>`;
  }
  function anChartSpec(a){
    const series=a.series||[],prevSeries=a.previous?.series||[],comparing=anHasPrev(a);
    if(Number(a.period_days)===1){
      const cur=(a.hours||[]).map(Number),prev=comparing?(a.previous?.hours||[]).map(Number):null;
      return {bar:true,cur,prev,money:false,xlabel:i=>String(i).padStart(2,'0'),ariaLabel:'Sesje według godziny wejścia — dziś',
        tip:i=>`<b>${String(i).padStart(2,'0')}:00–${String(i).padStart(2,'0')}:59</b>Dziś: ${anN(cur[i])} sesji${prev?`<br>Wczoraj: ${anN(prev[i])} sesji`:''}`,legend:[['','Dziś'],comparing?['dash','Wczoraj']:null]};
    }
    const metric=AN_METRICS.find(m=>m[0]===an.metric)||AN_METRICS[0],key=metric[0],isMoney=metric[2];
    const conv=v=>isMoney?(Number(v)||0)/100:(Number(v)||0);
    const cur=series.map(x=>conv(x[key])),prev=comparing&&prevSeries.length===series.length?prevSeries.map(x=>conv(x[key])):null;
    const fmt=v=>isMoney?money(v)+' zł':anN(v);
    return {bar:false,cur,prev,money:isMoney,xlabel:i=>anDay(series[i].day),ariaLabel:metric[1]+' — dzień po dniu',
      tip:i=>`<b>${esc(anWd(series[i].day))} ${esc(anDayFull(series[i].day))}</b>${esc(metric[1])}: ${esc(fmt(cur[i]))}${prev?`<br>Poprzedni okres (${esc(anDay(prevSeries[i].day))}): ${esc(fmt(prev[i]))}`:''}`,legend:[['',metric[1]],prev?['dash','Poprzedni okres']:null]};
  }
  function anFunnelList(a,compact){
    const steps=anSteps(a.totals),prevSteps=anHasPrev(a)?anSteps(a.previous.totals):null,base=steps[0][1];
    if(!base) return '<div class="an9-empty">Brak sesji w wybranym okresie.</div>';
    let worst=-1,worstLoss=0;
    steps.forEach((s,i)=>{ if(i>0){const loss=Math.max(0,steps[i-1][1]-s[1]); if(steps[i-1][1]>=5&&loss>worstLoss){worstLoss=loss;worst=i;}} });
    return `<ol class="an9-steps">${steps.map(([name,n,help],i)=>{
      const prev=i>0?steps[i-1][1]:0,through=i>0&&prev>0?Math.min(1,n/prev):NaN,loss=i>0?Math.max(0,prev-n):0;
      const sub=i===0?(compact?'':esc(help)):`${Number.isFinite(through)?`przechodzi dalej: ${esc(anP(through,0))}`:'—'}${loss>0&&!compact?` · odpada ${anN(loss)}`:''}`;
      return `<li class="an9-step${i===steps.length-1?' is-final':''}${i===worst&&!compact?' is-worst':''}"><div class="an9-step__label"><span>${esc(name)}</span><small>${sub}</small>${i===worst&&!compact?'<em class="an9-tag">największa strata</em>':''}</div><div class="an9-step__bar" role="img" aria-label="${esc(name)}: ${anN(n)} (${esc(anP(base?n/base:NaN,1))} sesji)"><i style="width:${Math.max(0,Math.min(100,base?n/base*100:0)).toFixed(1)}%"></i></div><div class="an9-step__num"><strong>${anN(n)}</strong><small>${esc(anP(base?n/base:NaN,1))} sesji</small>${prevSteps?anDelta(a,n,prevSteps[i][1]):''}</div></li>`;}).join('')}</ol>`;
  }
  function anTopCategories(a){
    const rows=anProductRows(a),hasValue=rows.some(r=>r.value>0);
    const sorted=rows.slice().sort((p,q)=>hasValue?(q.value-p.value||q.cart-p.cart):(q.cart-p.cart||q.price-p.price)).filter(r=>hasValue?r.value>0:r.cart>0).slice(0,6);
    if(!sorted.length) return '<div class="an9-empty">Brak danych o kategoriach w wybranym okresie.</div>';
    const max=Math.max(...sorted.map(r=>hasValue?r.value:r.cart));
    return `<ul class="an9-list">${sorted.map(r=>{const v=hasValue?r.value:r.cart;return `<li class="an9-row"><span class="an9-row__name">${esc(r.name)}</span><span class="an9-row__bar"><i style="width:${(v/max*100).toFixed(1)}%"></i></span><span class="an9-row__val">${hasValue?esc(money(r.value))+' zł':anN(r.cart)}<small>${hasValue?anN(r.ordered)+' poz.':'w koszykach'}</small></span></li>`;}).join('')}</ul>`;
  }
  function anSegTable(title,seg,labels,note){
    const rows=Object.entries(seg||{}).sort((p,q)=>q[1].sessions-p[1].sessions);
    if(!rows.length) return `<section class="card an9-card an9-card--flush"><h3>${esc(title)}</h3><p class="an9-card__sub">Brak danych w wybranym okresie.</p></section>`;
    return `<section class="card an9-card an9-card--flush"><h3>${esc(title)}</h3><p class="an9-card__sub">${esc(note)}</p><div class="an9-table-wrap"><table class="an9-table"><caption class="an9-sr">${esc(title)}</caption><thead><tr><th scope="col">Segment</th><th scope="col">Sesje</th><th scope="col">Cena</th><th scope="col">Wycena</th><th scope="col">Koszyk</th><th scope="col">Formularz</th><th scope="col">Zapytanie</th><th scope="col">Konwersja</th></tr></thead><tbody>${rows.map(([key,v])=>`<tr><th scope="row">${esc(labels[key]||key)}</th><td>${anN(v.sessions)}</td><td>${anN(v.price)}</td><td>${anN(v.quote)}</td><td>${anN(v.cart)}</td><td>${anN(v.checkout)}</td><td>${anN(v.orders)}</td><td class="${v.orders>0?'is-best':'dim'}">${esc(anP(anRatio(v.orders,v.sessions),2))}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  function anFunnel(a){
    const t=a.totals||{},errors=+t.order_error||0,orders=+t.orders_verified||0,seg=a.segments||{},win=+a.segment_window_days||0,abandoned=+a.abandoned||0,carts=+t.stage_cart||0;
    const windowNote=`Dane sesji z ostatnich ${win} dni (sesje są przechowywane 45 dni).`;
    const errRows=anEntries(a.order_errors).map(([k,n])=>`<li class="an9-row"><span class="an9-row__name">${esc(AN_ERROR[k]||k)}</span><span class="an9-row__bar"><i style="width:${(n/Math.max(1,errors)*100).toFixed(1)}%"></i></span><span class="an9-row__val">${anN(n)}<small>${esc(anP(n/Math.max(1,errors),0))}</small></span></li>`).join('');
    return `<section class="card an9-card" style="margin-bottom:14px"><h3>Lejek sprzedaży</h3><p class="an9-card__sub">Każdy etap liczy sesję najwyżej raz. Procent „przechodzi dalej” pokazuje, jaka część sesji z poprzedniego etapu dotarła do tego. Etapy są liczone niezależnie, więc gdy późniejszy etap wyjdzie większy od wcześniejszego, pokazujemy 100%.</p>${anFunnelList(a,false)}<p class="an9-note">Krok „cena po konfiguracji” liczy się dopiero po zmianie parametrów przez klienta albo kliknięciu „Dodaj do koszyka · cena”; cena domyślna widoczna po samym wejściu na stronę się nie liczy. Przyjęte zapytania liczy serwer, nie przeglądarka.</p></section>
      <div class="an9-grid2 an9-grid2--even"><section class="card an9-card"><h3>Koszyki porzucone</h3><p class="an9-card__sub">${esc(a.abandoned_definition||'')}</p><div class="an9-kpis" style="grid-template-columns:1fr 1fr;margin:0">${anKpi({label:'Porzucone',value:anN(abandoned),cls:'is-warn',sub:'sesji'})}${anKpi({label:'Udział',value:carts?esc(anP(abandoned/carts,0)):'—',cls:'is-warn',sub:'sesji z koszykiem'})}</div><p class="an9-note">Sesje są przechowywane do 45 dni, więc dla okresu 90 dni miara obejmuje ostatnie 45 dni.</p></section>
      <section class="card an9-card"><h3>Błędy wysyłki zamówienia</h3><p class="an9-card__sub">${errors?`Nieudane próby: ${anN(errors)} (${esc(anP(errors/Math.max(1,orders+errors),0))} wszystkich prób wysłania).`:'W tym okresie nie zanotowano nieudanych prób wysłania.'}</p>${errRows?`<ul class="an9-list">${errRows}</ul>`:''}<p class="an9-note">„Pozycja ze starszej wersji kalkulatora” oznacza stary koszyk zapisany w przeglądarce klienta.</p></section></div>
      <div class="an9-stack">${anSegTable('Lejek wg urządzenia',seg.device,AN_DEVICE,windowNote+' Urządzenie zbieramy od wersji 0.26.9v.')}${anSegTable('Lejek wg źródła ruchu',seg.source,AN_SOURCE,windowNote)}${anSegTable('Lejek wg języka strony',seg.lang,AN_LANG,windowNote+' Język zbieramy od wersji 0.26.9v.')}<section class="card an9-card"><h3>Jak czytać lejek</h3><ul class="an9-insights" style="margin-top:10px"><li><span><b>Duża strata przed „Ceną po konfiguracji”</b> — klienci wchodzą, ale nie ruszają parametrów (zbyt skomplikowany formularz albo przypadkowe wejścia).</span></li><li><span><b>Strata między „Wycenami” a „Koszykami”</b> — cena jest widoczna, ale klient się waha (cena, brak informacji o terminie).</span></li><li><span><b>Strata między „Koszykiem” a „Formularzem” i „Zapytaniem”</b> — problem z finalizacją (wymagane dane, pliki, błędy wysyłki).</span></li></ul></section></div>`;
  }
  function anProductsTable(a){
    const all=anProductRows(a),q=an.prodFilter.trim().toLowerCase();
    const rows=anSortRows(all.filter(r=>!q||r.name.toLowerCase().includes(q)),an.prodSort);
    const maxValue=Math.max(1,...all.map(r=>r.value));
    const cols=[['name','Kategoria'],['views','Oglądane'],['price','Cena po konfiguracji'],['cart','Do koszyka'],['ordered','W zapytaniach (poz.)'],['value','Wartość zapytań'],['cartRate','Koszyk ÷ cena'],['orderRate','Zapytanie ÷ koszyk']];
    const [sk,sd]=an.prodSort;
    const head=cols.map(([k,l])=>`<th scope="col" aria-sort="${sk===k?(sd==='asc'?'ascending':'descending'):'none'}"><button type="button" class="an9-sort" data-an-sort-products="${k}">${esc(l)}</button></th>`).join('');
    const body=rows.length?rows.map(r=>`<tr><th scope="row">${esc(r.name)}</th><td>${anN(r.views)}</td><td>${anN(r.price)}</td><td>${anN(r.cart)}</td><td>${anN(r.ordered)}</td><td class="an9-bar-cell"><i style="width:${(r.value/maxValue*100).toFixed(1)}%"></i><span>${r.value>0?esc(money(r.value))+' zł':'<span class="dim">—</span>'}</span></td><td class="${Number.isFinite(r.cartRate)?'':'dim'}">${esc(anP(r.cartRate,0))}</td><td class="${Number.isFinite(r.orderRate)?'':'dim'}">${esc(anP(r.orderRate,0))}</td></tr>`).join(''):`<tr><td colspan="8" class="dim" style="text-align:center;padding:24px">Brak kategorii pasujących do filtra.</td></tr>`;
    const tot=all.reduce((s,r)=>({views:s.views+r.views,price:s.price+r.price,cart:s.cart+r.cart,ordered:s.ordered+r.ordered,value:s.value+r.value}),{views:0,price:0,cart:0,ordered:0,value:0});
    return `<table class="an9-table"><caption class="an9-sr">Kategorie produktów — oglądane, ceny, koszyki i zapytania</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody><tfoot><tr><th scope="row">Razem (wszystkie kategorie)</th><td>${anN(tot.views)}</td><td>${anN(tot.price)}</td><td>${anN(tot.cart)}</td><td>${anN(tot.ordered)}</td><td>${tot.value>0?esc(money(tot.value))+' zł':'—'}</td><td>${esc(anP(anRatio(tot.cart,tot.price),0))}</td><td>${esc(anP(anRatio(tot.ordered,tot.cart),0))}</td></tr></tfoot></table>`;
  }
  function anProducts(a){
    const all=anProductRows(a);
    const top=(key,fmt)=>{const r=all.slice().sort((p,q)=>q[key]-p[key])[0];return r&&r[key]>0?[r.name,fmt(r[key])]:['—','brak danych'];};
    const v=top('views',n=>anN(n)+' wyświetleń'),c=top('cart',n=>anN(n)+' dodań do koszyka'),m=top('value',n=>money(n)+' zł w zapytaniach');
    const valueSum=all.reduce((s,r)=>s+r.value,0),orders=+a.totals?.orders_verified||0;
    return `<div class="an9-tiles"><div class="an9-tile"><small>Najczęściej oglądana</small><strong>${esc(v[0])}</strong><em>${esc(v[1])}</em></div><div class="an9-tile"><small>Najczęściej w koszykach</small><strong>${esc(c[0])}</strong><em>${esc(c[1])}</em></div><div class="an9-tile"><small>Największa wartość zapytań</small><strong>${esc(m[0])}</strong><em>${esc(m[1])}</em></div></div>
      <section class="card an9-card an9-card--flush"><h3>Produkty i kategorie</h3><p class="an9-card__sub">Kliknij nagłówek kolumny, aby posortować. „Koszyk ÷ cena” i „Zapytanie ÷ koszyk” to orientacyjne współczynniki zamiany (liczone na zdarzeniach, nie na tych samych sesjach).</p>${orders>0&&valueSum===0?'<p class="an9-warn" style="margin:0 18px 12px">Wartość zapytań wg kategorii jest zapisywana od wersji 0.26.9v, więc dla starszych zapytań w kolumnie „Wartość zapytań” jest „—”.</p>':''}<div class="an9-tools"><label class="an9-sr" for="an9ProdFilter">Filtruj kategorie</label><input id="an9ProdFilter" type="search" placeholder="Filtruj kategorie…" value="${esc(an.prodFilter)}" autocomplete="off"></div><div class="an9-table-wrap" id="an9ProdWrap">${anProductsTable(a)}</div></section>`;
  }
  function anShareList(map,labels,total,segments){
    const entries=anEntries(map); if(!entries.length) return '<div class="an9-empty">Brak danych w wybranym okresie.</div>';
    const max=Math.max(...entries.map(e=>e[1]),1);
    return `<ul class="an9-list">${entries.map(([k,n])=>{const seg=segments?.[k],conv=seg?anRatio(seg.orders,seg.sessions):NaN;return `<li class="an9-row"><span class="an9-row__name">${esc(labels[k]||k)}</span><span class="an9-row__bar"><i style="width:${(n/max*100).toFixed(1)}%"></i></span><span class="an9-row__val"><b>${anN(n)}</b><small>${esc(anP(total?n/total:NaN,0))}${Number.isFinite(conv)&&seg.orders>0?' · konw. '+esc(anP(conv,1)):''}</small></span></li>`;}).join('')}</ul>`;
  }
  function anHeat(a){
    const m=a.weekday_hours||[],max=Math.max(0,...m.flat().map(Number)); if(!(max>0)) return '<div class="an9-empty">Brak danych o godzinach wejść. Zbieramy je od wersji 0.26.9v.</div>';
    let best=[0,0,0]; m.forEach((row,d)=>row.forEach((v,h)=>{if(v>best[2]) best=[d,h,v];}));
    const cells=m.map((row,d)=>`<b>${AN_WEEKDAYS[d]}</b>${row.map((v,h)=>`<i class="${v?'':'is-zero'}" style="--v:${v?(0.18+0.82*v/max).toFixed(2):0}" title="${esc(AN_WEEKDAYS[d]+' '+String(h).padStart(2,'0')+':00 — '+anN(v)+' sesji')}"></i>`).join('')}`).join('');
    const axis='<b></b>'+Array.from({length:24},(_,h)=>`<span>${h%3===0?String(h).padStart(2,'0'):''}</span>`).join('');
    return `<div class="an9-heat-wrap"><div class="an9-heat" role="img" aria-label="Mapa wejść: dzień tygodnia i godzina. Najwięcej: ${esc(AN_WEEKDAYS_LONG[best[0]])} ${String(best[1]).padStart(2,'0')}:00, ${best[2]} sesji.">${cells}${axis}</div></div><p class="an9-note">Najruchliwszy termin: <b>${esc(AN_WEEKDAYS_LONG[best[0]])}, ${String(best[1]).padStart(2,'0')}:00–${String(best[1]).padStart(2,'0')}:59</b> (${anN(best[2])} sesji). Im jaśniejsze pole, tym więcej wejść.</p>`;
  }
  function anTraffic(a){
    const t=a.totals||{},sessions=+t.sessions||0,seg=a.segments||{},search=a.search||{};
    const deviceKnown=anSum(Object.values(a.devices||{})),langKnown=anSum(Object.values(a.langs||{})),hourKnown=anSum(a.hours);
    const devices={...(a.devices||{})}; if(sessions>deviceKnown) devices.unknown=sessions-deviceKnown;
    const langs={...(a.langs||{})}; if(sessions>langKnown) langs.unknown=sessions-langKnown;
    const partial=sessions>0&&(deviceKnown<sessions||hourKnown<sessions);
    const hours=(a.hours||[]).map(Number);
    an.hourSpec={bar:true,cur:hours,prev:null,money:false,xlabel:i=>String(i).padStart(2,'0'),ariaLabel:'Sesje według godziny wejścia',tip:i=>`<b>${String(i).padStart(2,'0')}:00–${String(i).padStart(2,'0')}:59</b>${anN(hours[i])} sesji`};
    const hourChart='<div id="an9HourBox"></div>';
    const terms=anEntries(search.terms),misses=anEntries(search.misses);
    const termList=(list,empty)=>list.length?`<ul class="an9-list">${list.map(([name,n])=>`<li class="an9-row"><span class="an9-row__name">${esc(name)}</span><span class="an9-row__bar"><i style="width:${(n/Math.max(1,list[0][1])*100).toFixed(1)}%"></i></span><span class="an9-row__val">${anN(n)}</span></li>`).join('')}</ul>`:`<div class="an9-empty">${esc(empty)}</div>`;
    return `${partial?`<p class="an9-warn">Urządzenia, język i godziny wejść zbieramy od wersji 0.26.9v, więc dla starszych dni tych danych brakuje (urządzenie znane dla ${anN(deviceKnown)} z ${anN(sessions)} sesji, godzina dla ${anN(hourKnown)} z ${anN(sessions)}). Z czasem udział „nieznanych” spadnie.</p>`:''}
      <div class="an9-grid3"><section class="card an9-card"><h3>Źródła ruchu</h3><p class="an9-card__sub">Skąd klienci wchodzą na stronę.</p>${anShareList(a.sources,AN_SOURCE,sessions,seg.source)}</section>
      <section class="card an9-card"><h3>Urządzenia</h3><p class="an9-card__sub">Telefon, tablet czy komputer.</p>${anShareList(devices,AN_DEVICE,sessions,seg.device)}</section>
      <section class="card an9-card"><h3>Język strony</h3><p class="an9-card__sub">W jakiej wersji klient zaczął sesję.</p>${anShareList(langs,AN_LANG,sessions,seg.lang)}</section></div>
      <div class="an9-grid2 an9-grid2--even"><section class="card an9-card"><h3>Wejścia wg godziny</h3><p class="an9-card__sub">Godzina rozpoczęcia sesji (czas strony). Najjaśniejszy słupek — godzina szczytu.</p>${hourChart}</section>
      <section class="card an9-card"><h3>Mapa: dzień tygodnia × godzina</h3><p class="an9-card__sub">Kiedy klienci odwiedzają kalkulator.</p>${anHeat(a)}</section></div>
      <div class="an9-grid2 an9-grid2--even"><section class="card an9-card"><h3>Oglądane kategorie</h3><p class="an9-card__sub">Liczba wyświetleń kategorii (strona główna osobno).</p>${anShareList(a.pages,{},anSum(Object.values(a.pages||{})))}</section>
      <section class="card an9-card"><h3>Wyszukiwanie w kalkulatorze</h3><p class="an9-card__sub">W tym okresie: <b>${anN(t.search)}</b> wyszukiwań, w tym <b>${anN(t.search_miss)}</b> bez wyników${(+t.search>0)?` (${esc(anP((+t.search_miss||0)/(+t.search),0))})`:''}.</p><h3 style="font-size:14px;margin-top:14px">Najczęstsze hasła</h3>${termList(terms.slice(0,8),'Brak zapisanych haseł.')}<h3 style="font-size:14px;margin-top:14px">Hasła bez wyników</h3>${termList(misses.slice(0,8),'Brak haseł bez wyników.')}<p class="an9-note">Listy haseł pochodzą ze starszego licznika i sumują wyszukiwania ${search.since?'od '+esc(anDayFull(search.since)):'od początku zbierania'} (nie zależą od wybranego okresu). Hasła z adresami e-mail i numerami telefonu nie są zapisywane.</p></section></div>`;
  }
  function anDaysTable(a){
    const series=a.series||[];
    const rows=series.map(x=>({day:x.day,wd:anWd(x.day),sessions:+x.sessions||0,prices:+x.prices||0,quotes:+x.quotes||0,carts:+x.carts||0,checkouts:+x.checkouts||0,orders:+x.orders||0,conv:anRatio(x.orders,x.sessions),value:(+x.value_cents||0)/100,errors:+x.order_errors||0}));
    const sorted=anSortRows(rows,an.daySort);
    const best={};['sessions','carts','orders','value'].forEach(k=>{best[k]=Math.max(...rows.map(r=>r[k]));});
    const cols=[['day','Dzień'],['sessions','Sesje'],['prices','Cena'],['quotes','Wycena'],['carts','Koszyk'],['checkouts','Formularz'],['orders','Zapytania'],['conv','Konwersja'],['value','Wartość zapytań'],['errors','Błędy wysyłki']];
    const [sk,sd]=an.daySort;
    const head=cols.map(([k,l])=>`<th scope="col" aria-sort="${sk===k?(sd==='asc'?'ascending':'descending'):'none'}"><button type="button" class="an9-sort" data-an-sort-days="${k}">${esc(l)}</button></th>`).join('');
    const cell=(r,k,txt)=>`<td class="${best[k]>0&&r[k]===best[k]?'is-best':''}">${txt}</td>`;
    const body=sorted.map(r=>`<tr><th scope="row">${esc(r.wd)} ${esc(anDay(r.day))}<span class="dim"> ${esc(r.day.slice(0,4))}</span></th>${cell(r,'sessions',anN(r.sessions))}<td>${anN(r.prices)}</td><td>${anN(r.quotes)}</td>${cell(r,'carts',anN(r.carts))}<td>${anN(r.checkouts)}</td>${cell(r,'orders',anN(r.orders))}<td class="${Number.isFinite(r.conv)?'':'dim'}">${esc(anP(r.conv,2))}</td>${cell(r,'value',r.value>0?esc(money(r.value))+' zł':'—')}<td class="${r.errors?'':'dim'}">${anN(r.errors)}</td></tr>`).join('');
    const t=rows.reduce((s,r)=>({sessions:s.sessions+r.sessions,prices:s.prices+r.prices,quotes:s.quotes+r.quotes,carts:s.carts+r.carts,checkouts:s.checkouts+r.checkouts,orders:s.orders+r.orders,value:s.value+r.value,errors:s.errors+r.errors}),{sessions:0,prices:0,quotes:0,carts:0,checkouts:0,orders:0,value:0,errors:0});
    return `<table class="an9-table"><caption class="an9-sr">Dane dzień po dniu</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody><tfoot><tr><th scope="row">Razem</th><td>${anN(t.sessions)}</td><td>${anN(t.prices)}</td><td>${anN(t.quotes)}</td><td>${anN(t.carts)}</td><td>${anN(t.checkouts)}</td><td>${anN(t.orders)}</td><td>${esc(anP(anRatio(t.orders,t.sessions),2))}</td><td>${t.value>0?esc(money(t.value))+' zł':'—'}</td><td>${anN(t.errors)}</td></tr></tfoot></table>`;
  }
  function anDays(a){
    return `<section class="card an9-card an9-card--flush"><h3>Dzień po dniu</h3><p class="an9-card__sub">Pogrubione na zielono — najlepszy dzień w danej kolumnie. Kliknij nagłówek, aby posortować. Wiersz „Razem” sumuje cały okres.</p><div class="an9-table-wrap">${anDaysTable(a)}</div></section>`;
  }
  function anFoot(a){
    return `<details class="an9-defs card"><summary>Jak liczymy te dane</summary><dl>
      <dt>Sesja</dt><dd>Unikalna sesja przeglądarki (losowy token, na serwerze tylko jego skrót, przechowywany do 45 dni). Brak identyfikacji osób i urządzeń między wizytami.</dd>
      <dt>Etapy lejka</dt><dd>Każdy etap liczy sesję najwyżej raz: cena po konfiguracji, wycena, koszyk, formularz. Etapy są niezależne od siebie.</dd>
      <dt>Przyjęte zapytanie</dt><dd>Liczone po stronie serwera dopiero, gdy WordPress przyjął e-mail. Wysłanie e-maila nie jest potwierdzeniem jego doręczenia ani płatności.</dd>
      <dt>Wartość zapytań</dt><dd>Suma brutto z kalkulatora dla przyjętych zapytań (pojedyncza pozycja do 5 000 zł). Nie jest to sprzedaż zrealizowana.</dd>
      <dt>Koszyk porzucony</dt><dd>${esc(a.abandoned_definition||'')}</dd>
      <dt>Porównanie</dt><dd>Zmiana względem poprzedniego okresu o tej samej długości (${esc(anDayFull(a.previous?.start||''))} – ${esc(anDayFull(a.previous?.end||''))}). „nowe” = w poprzednim okresie było 0. Dla współczynników podajemy różnicę w punktach procentowych.</dd>
      <dt>Urządzenie, język, godzina</dt><dd>Ogólna klasa urządzenia (telefon / tablet / komputer), język strony i godzina wejścia — zbierane od wersji 0.26.9v, bez User-Agenta i adresów IP.</dd>
      <dt>Ograniczenia</dt><dd>Przeglądarka może blokować telemetrię, więc wartości są orientacyjne. Raport: ${esc(anDayFull(a.data_start))} – ${esc(anDayFull(a.data_end))}.</dd></dl></details>`;
  }
  function anHeader(a){
    const stamp=a?.generated_at?new Date(a.generated_at):null,time=stamp&&!isNaN(stamp)?stamp.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}):'';
    const range=a?.ready?(analyticsDays===1?`<b>dziś, ${esc(anDayFull(a.data_end))}</b>`:`<b>${esc(anDayFull(a.data_start))} – ${esc(anDayFull(a.data_end))}</b>`):'';
    const prev=a?.ready&&anHasPrev(a)?` · porównanie: ${esc(anPrevLabel())} (${esc(anDay(a.previous.start))}${a.previous.start!==a.previous.end?' – '+esc(anDay(a.previous.end)):''})`:'';
    return `<div class="an9-head"><div class="an9-title"><h2>Analityka Drukulatora</h2><p class="an9-sub">${range?`Okres: ${range}${prev}${time?` · zaktualizowano ${esc(time)}`:''}. `:''}Ruch, wyceny, koszyki i zapytania. Bez adresów IP, danych klientów i treści plików.</p></div>
      <div class="an9-controls"><div class="an9-seg" role="group" aria-label="Zakres raportu">${AN_PERIODS.map(([d,l])=>`<button type="button" data-an-days="${d}" aria-pressed="${analyticsDays===d}">${esc(l)}</button>`).join('')}</div>
      <label class="an9-check"><input type="checkbox" id="an9Compare" ${an.compare?'checked':''}> Porównaj z poprzednim okresem</label>
      <button type="button" class="btn secondary" id="a28Refresh">⟳ Odśwież</button>
      <div class="an9-export"><button type="button" class="btn secondary" id="a28Export" ${!a?.ready?'disabled':''}>↓ CSV (dni)</button><button type="button" class="btn secondary" id="a28ExportProducts" ${!a?.ready?'disabled':''}>↓ CSV (produkty)</button><button type="button" class="btn secondary" id="a28ExportDetails" ${!a?.ready?'disabled':''}>↓ CSV (szczegóły)</button></div></div></div>
      <div class="an9-tabs" role="tablist" aria-label="Widok analityki">${AN_VIEWS.map(([k,l])=>`<button type="button" role="tab" id="an9Tab-${k}" data-an-view="${k}" aria-selected="${an.view===k}" aria-controls="an9Panel">${esc(l)}</button>`).join('')}</div>`;
  }

  // --- pobieranie i eksport
  async function fetchAnalytics(silent=true){
    if(!can('analytics_view') || an.loadingDays===analyticsDays) return;
    if(silent && analyticsV2 && Date.now()-analyticsFetchedAt < 60000) return;
    const days=analyticsDays; an.loadingDays=days; analyticsLoading=true;
    try{
      const r=await fetch('staff-api.php?action=analytics&days='+days,{credentials:'same-origin',cache:'no-store'});
      const j=await r.json();
      if(!r.ok||!j.success)throw new Error(j.message||'Błąd odczytu statystyk');
      if(days!==analyticsDays) return;   // w trakcie pobierania zmieniono okres — ta odpowiedź jest nieaktualna
      const key=JSON.stringify({...j.analytics_v2,generated_at:0});
      analyticsFetchedAt=Date.now(); an.error='';
      if(silent && key===an.key && analyticsV2) return;   // dane bez zmian — nie przerysowujemy (zachowuje fokus, filtr i przewijanie)
      const typing=document.activeElement&&$('#analyticsPanel')?.contains(document.activeElement)&&document.activeElement.matches('input[type=search],input[type=text]');
      if(silent && typing && analyticsV2) return;   // nie przerysowujemy w trakcie wpisywania w filtrze — kolejne odświeżenie nadrobi zmiany
      an.key=key; analyticsV2=j.analytics_v2; renderAnalytics();
    }catch(e){ if(an.loadingDays===days){an.loadingDays=0;analyticsLoading=false;} if(days===analyticsDays){ an.error=e.message||'Błąd odczytu statystyk'; if(!silent){toast(an.error);} if(!analyticsV2) renderAnalytics(); } }
    finally{ if(an.loadingDays===days){an.loadingDays=0;analyticsLoading=false;} if(days!==analyticsDays&&can('analytics_view')) fetchAnalytics(false); }
  }
  const anCsvLine=cols=>cols.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';');
  function anDownload(rows,name){
    const url=URL.createObjectURL(new Blob(['﻿'+rows.map(anCsvLine).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=name;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  const anCents=v=>(Number(v||0)/100).toFixed(2).replace('.',',');
  function a28Csv(){
    if(!analyticsV2?.ready)return;
    const a=analyticsV2, header=['Dzień','Sesje','Wyceny','Koszyki','Zapytania potwierdzone','Wartość zapytań PLN','Cena po konfiguracji','Formularz','Pozycje w koszykach','Wartość pozycji w koszykach PLN','Błędy wysyłki'];
    anDownload([header,...(a.series||[]).map(x=>[x.day,x.sessions,x.quotes,x.carts,x.orders,anCents(x.value_cents),x.prices||0,x.checkouts||0,x.cart_items||0,anCents(x.cart_value_cents),x.order_errors||0])],'drukulator-analityka-'+a.period_days+'dni.csv');
  }
  function a28CsvProducts(){
    if(!analyticsV2?.ready)return;
    const a=analyticsV2;
    anDownload([['Kategoria','Oglądane','Cena po konfiguracji','Dodane do koszyka','Pozycje w zapytaniach','Wartość zapytań PLN','Koszyk / cena %','Zapytanie / koszyk %'],...anSortRows(anProductRows(a),['value','desc']).map(r=>[r.name,r.views,r.price,r.cart,r.ordered,money(r.value),Number.isFinite(r.cartRate)?(r.cartRate*100).toFixed(1).replace('.',','):'',Number.isFinite(r.orderRate)?(r.orderRate*100).toFixed(1).replace('.',','):''])],'drukulator-analityka-produkty-'+a.period_days+'dni.csv');
  }
  function a28CsvDetails(){
    if(!analyticsV2?.ready)return;
    const a=analyticsV2, rows=[['Sekcja','Pozycja','Wartość']];
    const add=(section,values,labels={})=>Object.entries(values||{}).forEach(([name,n])=>rows.push([section,labels[name]||name,n]));
    add('Kategoria — oglądane',a.pages); add('Kategoria — cena po konfiguracji',a.price_products); add('Kategoria — dodane do koszyka',a.cart_products);
    add('Kategoria — w przyjętych zapytaniach',a.ordered_products); add('Źródło ruchu — sesje',a.sources,AN_SOURCE); add('Błąd wysyłki — liczba',a.order_errors,AN_ERROR);
    Object.entries(a.ordered_value_cents||{}).forEach(([name,c])=>rows.push(['Kategoria — wartość zapytań PLN',name,anCents(c)]));
    add('Urządzenie — sesje',a.devices,AN_DEVICE); add('Język — sesje',a.langs,AN_LANG);
    (a.hours||[]).forEach((n,h)=>rows.push(['Godzina wejścia — sesje',String(h).padStart(2,'0')+':00',n]));
    const t=a.totals||{};
    rows.push(['Podsumowanie','Sesje',t.sessions||0],['Podsumowanie','Cena po konfiguracji (sesje)',t.stage_price||0],['Podsumowanie','Wyceny (sesje)',t.stage_quote||0],['Podsumowanie','Koszyki (sesje)',t.stage_cart||0],['Podsumowanie','Formularz (sesje)',t.stage_checkout||0],['Podsumowanie','Przyjęte zapytania',t.orders_verified||0],['Podsumowanie','Pozycje w koszykach (z poprawną kwotą)',t.cart_items||0],['Podsumowanie','Wartość pozycji w koszykach PLN',anCents(t.cart_value_cents)],['Podsumowanie','Błędy wysyłki',t.order_error||0]);
    const p=a.previous?.totals||{};
    if(Object.keys(p).length) rows.push(['Poprzedni okres','Sesje',p.sessions||0],['Poprzedni okres','Przyjęte zapytania',p.orders_verified||0],['Poprzedni okres','Wartość zapytań PLN',anCents(p.orders_value_cents)]);
    anDownload(rows,'drukulator-analityka-szczegoly-'+a.period_days+'dni.csv');
  }

  // --- render + zdarzenia
  // Wykres rysujemy w rzeczywistej szerokości kontenera (viewBox = piksele), dzięki czemu opisy osi mają stały, czytelny rozmiar także na telefonie.
  function anMountChart(host,spec){
    if(!host) return;
    const w=Math.max(280,Math.round(host.clientWidth||host.parentElement?.clientWidth||820));
    spec.W=w; spec.H=w<480?230:w<820?260:300;
    host.innerHTML=anChart(spec); anChartBind(host,spec);
  }
  function anRenderChart(){
    const a=analyticsV2,host=$('#an9ChartBox'); if(!a?.ready||!host) return;
    const spec=anChartSpec(a); anMountChart(host,spec);
    const legend=$('#an9Legend'); if(legend) legend.innerHTML=(spec.legend||[]).filter(Boolean).map(([cls,label])=>`<span><i class="${cls}"></i>${esc(label)}</span>`).join('');
  }
  function anMountAll(){
    if(!analyticsV2?.ready) return;
    if(an.view==='overview') anRenderChart();
    if(an.view==='traffic'&&an.hourSpec) anMountChart($('#an9HourBox'),an.hourSpec);
  }
  let anResizeTimer=0,anResizeWidth=0;
  window.addEventListener('resize',()=>{ clearTimeout(anResizeTimer); anResizeTimer=setTimeout(()=>{ const w=$('#analyticsPanel')?.clientWidth||0; if(currentTab==='analytics'&&w&&Math.abs(w-anResizeWidth)>8){anResizeWidth=w;anMountAll();} },150); });
  function renderAnalytics(){
    const box=$('#analyticsPanel');if(!box)return;
    if(!can('analytics_view')){box.innerHTML='<div class="card empty">Nie masz uprawnień do analityki.</div>';return;}
    const a=analyticsV2;
    let body;
    if(!a?.ready&&an.error&&!an.loadingDays) body=`<div class="card an9-card"><p class="an9-warn">Nie udało się wczytać statystyk: ${esc(an.error)}</p><button type="button" class="btn secondary" id="an9Retry">Spróbuj ponownie</button></div>`;
    else if(!a?.ready) body='<div class="card an9-card an9-empty" role="status">Ładowanie danych lub oczekiwanie na utworzenie tabel statystyk…</div>';
    else body={overview:anOverview,funnel:anFunnel,products:anProducts,traffic:anTraffic,days:anDays}[an.view](a);
    box.innerHTML=anHeader(a)+`<div id="an9Panel" role="tabpanel" aria-labelledby="an9Tab-${an.view}" tabindex="-1">${body}</div>`+(a?.ready?anFoot(a):'');
    anBind(box);
    anResizeWidth=box.clientWidth; anMountAll();
  }
  function anBind(box){
    box.querySelectorAll('[data-an-days]').forEach(b=>b.addEventListener('click',()=>{const d=Number(b.dataset.anDays); if(d===analyticsDays)return; analyticsDays=d; try{localStorage.setItem('d24_an_days',String(d));}catch{} analyticsV2=null; an.key=''; an.error=''; renderAnalytics(); fetchAnalytics(false);}));
    box.querySelectorAll('[data-an-view]').forEach(b=>b.addEventListener('click',()=>{an.view=b.dataset.anView; try{sessionStorage.setItem('d24_an_view',an.view);}catch{} renderAnalytics(); $('#analyticsPanel [role=tab][aria-selected=true]')?.focus();}));
    box.querySelectorAll('[data-an-view]').forEach(b=>b.addEventListener('keydown',e=>{ if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return; e.preventDefault(); const i=AN_VIEWS.findIndex(v=>v[0]===an.view),n=(i+(e.key==='ArrowRight'?1:AN_VIEWS.length-1))%AN_VIEWS.length; an.view=AN_VIEWS[n][0]; try{sessionStorage.setItem('d24_an_view',an.view);}catch{} renderAnalytics(); $('#analyticsPanel [role=tab][aria-selected=true]')?.focus(); }));
    box.querySelectorAll('[data-an-metric]').forEach(b=>b.addEventListener('click',()=>{an.metric=b.dataset.anMetric; box.querySelectorAll('[data-an-metric]').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); anRenderChart();}));
    $('#an9Compare')?.addEventListener('change',e=>{an.compare=e.target.checked; try{localStorage.setItem('d24_an_compare',an.compare?'1':'0');}catch{} renderAnalytics();});
    $('#a28Refresh')?.addEventListener('click',()=>{an.key=''; fetchAnalytics(false);});
    $('#an9Retry')?.addEventListener('click',()=>{an.error=''; renderAnalytics(); fetchAnalytics(false);});
    $('#a28Export')?.addEventListener('click',a28Csv);
    $('#a28ExportProducts')?.addEventListener('click',a28CsvProducts);
    $('#a28ExportDetails')?.addEventListener('click',a28CsvDetails);
    anBindSorts(box);
    $('#an9ProdFilter')?.addEventListener('input',e=>{an.prodFilter=e.target.value; const wrap=$('#an9ProdWrap'); wrap.innerHTML=anProductsTable(analyticsV2); anBindSorts(wrap);});
  }
  function anBindSorts(root){
    root.querySelectorAll('[data-an-sort-products]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.anSortProducts; an.prodSort=[k,an.prodSort[0]===k&&an.prodSort[1]==='desc'?'asc':(k==='name'&&an.prodSort[0]!==k?'asc':'desc')]; const wrap=$('#an9ProdWrap'); wrap.innerHTML=anProductsTable(analyticsV2); anBindSorts(wrap); wrap.querySelector(`[data-an-sort-products="${k}"]`)?.focus();}));
    root.querySelectorAll('[data-an-sort-days]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.anSortDays; an.daySort=[k,an.daySort[0]===k&&an.daySort[1]==='desc'?'asc':(k==='day'&&an.daySort[0]!==k?'asc':'desc')]; const wrap=b.closest('.an9-table-wrap'); wrap.innerHTML=anDaysTable(analyticsV2); anBindSorts(wrap); wrap.querySelector(`[data-an-sort-days="${k}"]`)?.focus();}));
  }

  function permissionChecks(target, selected=[]){ target.innerHTML=Object.entries(payload.permissions_catalog||{}).map(([key,label])=>`<label><input type="checkbox" value="${esc(key)}" ${selected.includes(key)?'checked':''}><span>${esc(label)}</span></label>`).join(''); }
  function selectedPerms(target){ return $$(`#${target} input:checked`).map(i=>i.value); }
  function renderStaff(){ if(!payload.user.is_admin)return; permissionChecks($('#newPermissions')); const list=$('#staffList'); list.innerHTML=(payload.staff||[]).length?(payload.staff||[]).map(s=>`<div class="employee ${s.active?'':'inactive'}" data-staff-id="${s.id}"><header><div><strong>${esc(s.display_name)}</strong><small>@${esc(s.username)}${s.last_login_at?' • ostatnio '+date(s.last_login_at):''}</small></div><span class="pill">${s.active?'Aktywne':'Wyłączone'}</span></header><div class="field"><label>Nazwa pracownika</label><input data-role="display" value="${esc(s.display_name)}"></div><div class="field"><label>Uprawnienia</label><div class="permission-list" data-role="permissions">${Object.entries(payload.permissions_catalog||{}).map(([key,label])=>`<label><input type="checkbox" value="${esc(key)}" ${(s.permissions||[]).includes(key)?'checked':''}><span>${esc(label)}</span></label>`).join('')}</div></div><div class="actions"><button class="btn secondary" data-action="save">Zapisz</button><button class="btn secondary" data-action="password">Nowe hasło</button><button class="btn ${s.active?'danger':'secondary'}" data-action="toggle">${s.active?'Wyłącz konto':'Włącz konto'}</button></div></div>`).join(''):'<div class="empty">Nie utworzono jeszcze kont pracowników.</div>';
    $$('.employee').forEach(el=>{const id=Number(el.dataset.staffId),s=(payload.staff||[]).find(x=>Number(x.id)===id); el.querySelector('[data-action=save]').onclick=async()=>{try{const perms=Array.from(el.querySelectorAll('[data-role=permissions] input:checked')).map(i=>i.value);const j=await api({action:'staff_update',id,display_name:el.querySelector('[data-role=display]').value,permissions:perms,active:s.active});payload.staff=j.staff;toast(j.message);renderStaff()}catch(e){toast(e.message)}};el.querySelector('[data-action=toggle]').onclick=async()=>{try{const j=await api({action:'staff_update',id,display_name:el.querySelector('[data-role=display]').value,permissions:s.permissions||[],active:!s.active});payload.staff=j.staff;toast(j.message);renderStaff()}catch(e){toast(e.message)}};el.querySelector('[data-action=password]').onclick=async()=>{const pw=prompt('Nowe hasło (minimum 10 znaków):');if(!pw)return;try{const j=await api({action:'staff_password',id,password:pw});toast(j.message)}catch(e){toast(e.message)}};});
  }
  $('#createStaff')?.addEventListener('click',async()=>{try{const j=await api({action:'staff_create',display_name:$('#newDisplayName').value,username:$('#newUsername').value,password:$('#newPassword').value,permissions:selectedPerms('newPermissions')});payload.staff=j.staff;$('#newDisplayName').value='';$('#newUsername').value='';$('#newPassword').value='';toast(j.message);renderStaff()}catch(e){toast(e.message)}});
  $('#saveGatePhrase')?.addEventListener('click',async()=>{try{const j=await api({action:'gate_phrase',phrase:$('#gatePhrase').value});$('#gatePhrase').value='';toast(j.message)}catch(e){toast(e.message)}});
  function renderFilters(){ const current=$('#statusFilter').value; $('#statusFilter').innerHTML='<option value="">Wszystkie statusy</option>'+Object.entries(payload.statuses||{}).map(([k,v])=>`<option value="${esc(k)}" ${current===k?'selected':''}>${esc(v)}</option>`).join(''); }

  const monitorWhen = value => { if (!value) return '—'; const d = new Date(String(value).replace(' ','T')+'Z'); return isNaN(d) ? '—' : d.toLocaleString('pl-PL', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}); };
  const fmtBytes = size => { let n=Number(size||0); if(!Number.isFinite(n)||n<0)return '—';const units=['B','KB','MB','GB'];let i=0;while(n>=1024&&i<3){n/=1024;i++}return `${n.toLocaleString('pl-PL',{maximumFractionDigits:1})} ${units[i]}`; };
  function renderAlerts(){
    if(!initialUser.is_admin)return;
    const a=payload?.alerting||{}, items=a.alerts||[], active=Number(a.open||0);
    $('#alertOpenCount').textContent=active+' aktywnych';
    const enabled=Boolean(a.email_enabled);
    $('#alertToggleEmail').textContent='Alerty e-mail: '+(enabled?'włączone':'wyłączone');
    $('#alertToggleEmail').dataset.enabled=enabled?'1':'0';
    const last=a.last_email||{};
    const mailLabel=last.attempt_at ? ('Ostatnia próba maila: '+monitorWhen(last.attempt_at)+' · '+(last.accepted?'WordPress przyjął do wysłania':'Błąd przekazania do wysyłki')) : 'Brak dotychczasowych automatycznych prób wysyłki e-maili.';
    $('#alertMailStatus').textContent=`Powiadomienia do: ${a.recipient||'—'} · ${mailLabel} · Limit: jeden e-mail co 20 minut.`;
    const statusLabel={open:'Nowy',ack:'Potwierdzony',resolved:'Rozwiązany'};
    $('#alertList').innerHTML=items.length?items.map(x=>{
      const state=statusLabel[x.status]||x.status;
      const actions=x.status==='open' ? `<button type="button" class="btn secondary" data-alert-action="ack" data-alert-id="${Number(x.id)}">Potwierdź</button><button type="button" class="btn secondary" data-alert-action="resolve" data-alert-id="${Number(x.id)}">Rozwiąż</button>` : x.status==='ack' ? `<button type="button" class="btn secondary" data-alert-action="resolve" data-alert-id="${Number(x.id)}">Rozwiąż</button>` : `<button type="button" class="btn secondary" data-alert-action="reopen" data-alert-id="${Number(x.id)}">Otwórz ponownie</button>`;
      return `<div class="monitor-alert ${esc(x.severity)} ${esc(x.status)}"><div><h4>${esc(x.title)}</h4><p><span class="monitor-alert-status">${esc(state)}</span> · ${esc(x.category)} ${x.order_id?'· '+esc(x.order_id):''}</p><p>Ostatnio: ${monitorWhen(x.last_seen)} · Wystąpienia: ${Number(x.occurrences)||0} · E-mail: ${x.email_sent_at?'przyjęty przez WP':x.last_mail_attempt_at?'próba nieudana':x.status==='resolved'?'nie wysyłano':'oczekuje'}</p></div><div class="actions">${actions}</div></div>`;
    }).join(''):'<div class="monitor-alert-empty">Brak incydentów. Nowe błędy pojawią się tutaj automatycznie.</div>';
    $$('[data-alert-action]').forEach(b=>b.addEventListener('click',async()=>{
      b.disabled=true;
      try{const r=await api({action:'alert_'+b.dataset.alertAction,id:Number(b.dataset.alertId)});payload.alerting=r.alerting;renderMonitoring();toast(r.message)}catch(e){toast(e.message)}finally{b.disabled=false}
    }));
  }
  $('#alertToggleEmail')?.addEventListener('click',async()=>{
    const b=$('#alertToggleEmail');b.disabled=true;
    try { const enabled=b.dataset.enabled!=='1';const r=await api({action:'alert_email_settings',enabled});payload.alerting=r.alerting;renderMonitoring();toast(r.message); }
    catch(e){toast(e.message)}finally{b.disabled=false}
  });
  $('#alertTestEmail')?.addEventListener('click',async()=>{
    const b=$('#alertTestEmail');b.disabled=true;
    try{const r=await api({action:'alert_test_email'});toast(r.message)}catch(e){toast(e.message)}finally{b.disabled=false}
  });
  function renderMailAudit(){
    if(!initialUser.is_admin) return;
    const audit=payload?.mail_audit||{},all=audit.rows||[];
    const titles={office_order:'Zapytanie do drukarni',customer_confirmation:'Potwierdzenie klienta',customer_ready:'Powiadomienie „gotowe”',admin_alert:'Alert techniczny',admin_test:'Test poczty'};
    $('#mailAuditMetrics').innerHTML=`<span class="mail-ok">Przyjęte przez WP (24 h): <strong>${Number(audit.accepted_24h||0)}</strong></span><span class="mail-bad">Nieudane (24 h): <strong>${Number(audit.failed_24h||0)}</strong></span><span>Historia: do 100 ostatnich prób</span>`;
    $('#mailAuditNote').textContent=audit.note||'Nie można pobrać danych audytu.';
    const filter=$('#mailAuditFilter').value,state=$('#mailAuditState').value,q=$('#mailAuditSearch').value.trim().toLowerCase();
    const items=all.filter(m=>(!filter||m.category===filter)&&(!state||m.result===state)&&(!q||String(m.order_id||'').toLowerCase().includes(q)));
    $('#mailAuditCount').textContent=items.length+' prób';
    $('#mailAuditList').innerHTML=items.length?items.map(m=>{
      const title=titles[m.category]||m.category;
      const ok=m.result==='accepted';
      const order=(payload.orders||[]).find(o=>o.order_id===m.order_id);
      const retryAllowed=!ok&&m.category==='customer_ready'&&order&&order.status==='ready'&&!order.ready_notified_at;
      const details=[m.order_id?'Zlecenie: '+m.order_id:'Bez zlecenia',m.attachment_count?Number(m.attachment_count)+' załączników ('+fmtBytes(m.attachment_bytes)+')':null,'Czas: '+Number(m.duration_ms||0)+' ms',!ok&&m.error_code?'Kod: '+m.error_code:null].filter(Boolean).join(' · ');
      return `<div class="mail-audit-line"><div><strong>${esc(title)} <span class="${ok?'mail-ok':'mail-bad'}">· ${ok?'Przyjęto przez WP':'Błąd'}</span></strong><small>${monitorWhen(m.created_at)} · ${esc(details)}</small></div><div class="actions">${retryAllowed?`<button class="btn secondary" type="button" data-retry-ready="${esc(m.order_id)}">Ponów „gotowe”</button>`:''}</div></div>`;
    }).join(''):'<div class="empty">Brak prób spełniających filtry. Wysyłki sprzed instalacji 0.22.7v nie będą tu widoczne.</div>';
    $$('[data-retry-ready]').forEach(b=>b.addEventListener('click',async()=>{
      const id=b.dataset.retryReady;
      if(!confirm(`Ponownie wysłać powiadomienie „gotowe” do klienta dla ${id}?\n\nUwaga: brak potwierdzenia wysyłki nie wyklucza, że poprzednia wiadomość dotarła. Nie wysyłamy ponownie zamówienia ani załączników.`))return;
      b.disabled=true;
      try{const j=await api({action:'mail_retry_ready',order_id:id,confirm_retry:true});if(j.orders)payload.orders=j.orders;if(j.mail_audit)payload.mail_audit=j.mail_audit;renderAll();toast(j.message)}catch(e){toast(e.message);await load(true)}finally{b.disabled=false}
    }));
  }
  ['mailAuditFilter','mailAuditState','mailAuditSearch'].forEach(id=>$('#'+id)?.addEventListener(id==='mailAuditSearch'?'input':'change',renderMailAudit));
  function renderMonitoring(){
    if(!initialUser.is_admin)return;
    const stats = payload?.monitoring;
    if(!stats) { renderAlerts(); $('#monitorWarnings').innerHTML='<div class="monitor-warning">Nie udało się pobrać danych monitoringu.</div>';return; }
    const m=stats.metrics||{},services=stats.services||{};
    const errors=Number(m.errors_24h||0);
    const active=Number(payload?.alerting?.open||0);
    $('#monitorNavAlert').hidden=active===0;
    if(active) $('#monitorNavAlert').textContent=active>99?'99+':String(active);
    renderAlerts();
    renderMailAudit();
    $('#monitorWarnings').innerHTML=(errors ? `<div class="monitor-warning">⚠ W ciągu 24 godzin wykryto ${errors} błędów. Sprawdź dziennik zdarzeń poniżej.</div>` : '')+
      (!stats.available ? '<div class="monitor-warning">Tabela monitoringu nie została utworzona. Sprawdź uprawnienia bazy danych WordPress.</div>' : '');
    const tiles = [
      ['Maile do drukarni','mails_accepted_24h','Przyjęte do wysłania · 24 h'],
      ['Błędy','errors_24h','Zarejestrowane · 24 h'],
      ['Załączniki','attachments_24h','Dołączone do przyjętych maili · 24 h'],
      ['Zdarzenia','events_7d','W bazie · ostatnie 7 dni'],
    ];
    $('#monitorMetrics').innerHTML=tiles.map(([label,key,description])=>`<div class="card bigmetric"><span class="muted">${label}</span><strong>${Number(m[key]||0).toLocaleString('pl-PL')}</strong><div class="monitor-metric-caption">${description}</div></div>`).join('');
    const serviceItems=[
      ['WordPress','wordpress','Odpowiada'],['Baza monitoringu','database','Zapis gotowy'],['Katalog uploadów','upload_temp','Można zapisywać']
    ];
    $('#monitorServices').innerHTML=serviceItems.map(([label,key,ok])=>`<div class="monitor-service"><span>${label}</span><strong class="${services[key]?'monitor-ok':'monitor-error'}">${services[key]?ok:'Wymaga uwagi'}</strong></div>`).join('')+
      '<div class="monitor-service"><span>Dostarczenie przez SMTP</span><strong class="monitor-unknown">Brak potwierdzenia</strong></div>';
    const days=stats.daily||[],maximum=Math.max(1,...days.map(d=>Math.max(Number(d.accepted||0),Number(d.errors||0))));
    $('#monitorChart').innerHTML=days.map(d=>{
      const good=Number(d.accepted||0),bad=Number(d.errors||0);
      return `<div class="monitor-day"><div class="monitor-bars"><div class="monitor-bar good" title="${good} przyjętych" style="height:${Math.max(2,good/maximum*115)}px"></div><div class="monitor-bar bad" title="${bad} błędów" style="height:${Math.max(2,bad/maximum*115)}px"></div></div><div class="monitor-day-label">${esc(d.date.slice(5))}</div><div class="monitor-day-count">${good} / ${bad}</div></div>`;
    }).join('');
    const level=$('#monitorLevel').value,type=$('#monitorType').value,q=$('#monitorSearch').value.trim().toLowerCase();
    const matches=(stats.events||[]).filter(e=>{
      if(level && e.level!==level)return false;
      const t=String(e.event_type||'');
      if(type==='mail' && !t.includes('mail') && !t.includes('confirmation'))return false;
      if(type==='upload' && !t.includes('upload') && !(e.metadata?.files>0))return false;
      if(type==='order' && !t.includes('order'))return false;
      if(q && ![t,e.order_id,e.message].join(' ').toLowerCase().includes(q))return false;
      return true;
    });
    $('#monitorCount').textContent=matches.length+' wpisów';
    const titles={order_mail_accepted:'Mail do drukarni',order_mail_failed:'Błąd maila do drukarni',confirmation_mail_accepted:'Potwierdzenie klienta',confirmation_mail_failed:'Błąd potwierdzenia klienta',ready_mail_accepted:'Powiadomienie: gotowe',ready_mail_failed:'Błąd powiadomienia o gotowości',order_status_changed:'Zmiana statusu',order_assignment_changed:'Zmiana przypisania',upload_started:'Rozpoczęcie uploadu',upload_finished:'Wysyłka plików (czas i prędkość)',upload_failed:'Nieudany upload',upload_validation_failed:'Problem z plikami',order_record_failed:'Błąd zapisu zlecenia'};
    const meta=(e)=>{const a=e.metadata||{};const v=[]; if(a.files!==undefined)v.push(`${Number(a.files)} plików`);if(a.bytes!==undefined)v.push(fmtBytes(a.bytes));if(a.total!==undefined)v.push(`${money(a.total)} zł`);if(a.channel)v.push(`Kanał: ${a.channel==='office'?'drukarnia':'klient'}`);if(a.staff)v.push(`Pracownik: ${a.staff}`);if(a.status)v.push(`Status: ${a.status}`);if(a.method)v.push(`Metoda: ${a.method}`);if(a.note&&e.event_type==='upload_finished')v.push(`Wysyłka: ${a.note}`);if(a.file_names?.length)v.push(`Nazwy plików: ${a.file_names.join(', ')}`);if(e.duration_ms)v.push(e.event_type==='upload_finished'?`Czas wysyłki plików: ${(e.duration_ms/1000).toFixed(1)} s`:`Czas żądania: ${e.duration_ms} ms`);return v.join(' • ');};
    $('#monitorEventList').innerHTML=matches.length?matches.map(e=>`<div class="monitor-event"><div class="monitor-event-side">${monitorWhen(e.created_at)}<div class="monitor-event-sub">UTC → lokalnie</div></div><div><div class="monitor-event-title">${esc(titles[e.event_type]||e.event_type||'Zdarzenie')}</div><div class="monitor-event-sub">${esc(e.message||'')}</div>${e.order_id?`<div class="monitor-event-sub"><button class="monitor-link" type="button" data-monitor-order="${esc(e.order_id)}">${esc(e.order_id)}</button></div>`:''}<div class="monitor-meta">${esc(meta(e))}</div></div><div class="monitor-event-level ${esc(e.level)}">${e.level==='error'?'Błąd':e.level==='warning'?'Uwaga':'OK'}</div></div>`).join(''):'<div class="empty">Brak zdarzeń spełniających wybrane filtry.</div>';
    $$('[data-monitor-order]').forEach(b=>b.addEventListener('click',()=>{selectedOrderId=b.dataset.monitorOrder;switchTab('orders');renderOrderList();renderOrderDetail();}));
  }
  ['monitorLevel','monitorType','monitorSearch'].forEach(id=>$('#'+id)?.addEventListener(id==='monitorSearch'?'input':'change',renderMonitoring));
  $('#monitorRefresh')?.addEventListener('click',()=>load(false));

  /* Kody rabatowe — 0.26.0v */
  const promoStatus={active:['Aktywny','good'],scheduled:['Zaplanowany','warn'],expired:['Wygasł','off'],exhausted:['Wyczerpany','off'],disabled:['Wyłączony','off']};
  const isoDate=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const isoPlusDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return isoDate(d);};
  const promoDiscountText=p=>p.discount_type==='percent'?Number(p.discount_value).toLocaleString('pl-PL',{maximumFractionDigits:2})+'%':money(p.discount_value)+' zł';
  const promoValidityText=p=>!p.valid_from&&!p.valid_to?'bez ograniczenia czasu':(p.valid_from&&p.valid_to?'od '+p.valid_from+' do '+p.valid_to:(p.valid_from?'od '+p.valid_from+' (bez końca)':'do '+p.valid_to));
  function promoMessage(text){ const el=$('#promoMsg'); if(!el)return; el.textContent=text||''; el.hidden=!text; }
  function promoPreview(){
    const el=$('#promoPreview'); if(!el)return;
    const type=$('#promoType').value, raw=String($('#promoValue').value||'').replace(',','.').trim(), v=Number(raw);
    const from=$('#promoFrom').value, to=$('#promoTo').value, min=String($('#promoMin').value||'').replace(',','.').trim(), max=String($('#promoMax').value||'').trim();
    $('#promoValueLabel').textContent=type==='percent'?'Wysokość zniżki (%)':'Wysokość zniżki (zł)';
    const what=raw!==''&&isFinite(v)&&v>0?(type==='percent'?Number(v).toLocaleString('pl-PL',{maximumFractionDigits:2})+'% zniżki':money(v)+' zł zniżki'):'zniżka — uzupełnij wysokość';
    const when=!from&&!to?'bez ograniczenia czasu':(from&&to?'od '+from+' do '+to+' włącznie':(from?'od '+from+', bez końca':'do '+to+' włącznie'));
    el.innerHTML='<strong>'+esc(what)+'</strong> na wartość produktów · ważny '+esc(when)+(min!==''&&Number(min)>0?' · od '+esc(money(Number(min)))+' zł':'')+(max!==''?' · maks. '+esc(max)+' użyć':' · bez limitu użyć');
  }
  function promoReset(){
    $('#promoId').value=''; $('#promoCode').value=''; $('#promoCode').disabled=false; $('#promoLabel').value=''; $('#promoType').value='percent'; $('#promoValue').value='';
    $('#promoFrom').value=''; $('#promoTo').value=''; $('#promoMin').value=''; $('#promoMax').value=''; $('#promoActive').checked=true;
    $('#promoFormTitle').textContent='Nowy kod rabatowy'; $('#promoSave').textContent='Zapisz kod'; $('#promoCancel').hidden=true; promoMessage(''); promoPreview();
  }
  function promoEdit(p){
    $('#promoId').value=String(p.id); $('#promoCode').value=p.code; $('#promoCode').disabled=true; $('#promoLabel').value=p.label||''; $('#promoType').value=p.discount_type;
    $('#promoValue').value=String(p.discount_value).replace('.',','); $('#promoFrom').value=p.valid_from||''; $('#promoTo').value=p.valid_to||'';
    $('#promoMin').value=p.min_total>0?String(p.min_total).replace('.',','):''; $('#promoMax').value=p.max_uses==null?'':String(p.max_uses); $('#promoActive').checked=!!p.active;
    $('#promoFormTitle').textContent='Edycja kodu '+p.code; $('#promoSave').textContent='Zapisz zmiany'; $('#promoCancel').hidden=false; promoMessage(''); promoPreview();
    $('#promoFormCard').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function renderPromo(){
    const list=$('#promoList'); if(!list||!can('promo_manage'))return;
    const rows=payload?.promo_codes||[];
    $('#promoCount').textContent=rows.length+(rows.length===1?' kod':' kodów');
    list.innerHTML=rows.length?rows.map(p=>{
      const st=promoStatus[p.status]||[p.status,'off'];
      const used=p.max_uses==null?`${p.used_count} użyć`:`${p.used_count} / ${p.max_uses} użyć`;
      return `<div class="pr-card ${p.status==='active'?'':'off'}" data-promo="${p.id}"><header><div><span class="pr-code">${esc(p.code)}</span> <span class="pill pr-pill ${st[1]}">${esc(st[0])}</span>${p.label?`<div class="sub">${esc(p.label)}</div>`:''}</div><div class="pr-discount">−${esc(promoDiscountText(p))}</div></header>
        <div class="pr-meta"><span>Ważny: <b>${esc(promoValidityText(p))}</b></span>${p.min_total>0?`<span>Min. produkty: <b>${money(p.min_total)} zł</b></span>`:''}<span>Użyto: <b>${esc(used)}</b></span><span>Suma zniżek: <b>${money(p.discount_sum)} zł</b></span></div>
        <div class="actions"><button class="btn secondary" type="button" data-promo-edit="${p.id}">Edytuj</button><button class="btn secondary" type="button" data-promo-toggle="${p.id}" data-active="${p.active?0:1}">${p.active?'Wyłącz':'Włącz'}</button><button class="btn secondary" type="button" data-promo-copy="${esc(p.code)}">Kopiuj kod</button><button class="btn danger" type="button" data-promo-delete="${p.id}">Usuń</button></div></div>`;
    }).join(''):'<div class="empty">Nie ma jeszcze żadnego kodu. Dodaj pierwszy w formularzu obok.</div>';
    const byId=id=>rows.find(r=>Number(r.id)===Number(id));
    $$('[data-promo-edit]').forEach(b=>b.onclick=()=>{const p=byId(b.dataset.promoEdit); if(p)promoEdit(p);});
    $$('[data-promo-toggle]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const j=await api({action:'promo_toggle',id:Number(b.dataset.promoToggle),active:b.dataset.active==='1'});payload.promo_codes=j.promo_codes||payload.promo_codes;toast(j.message);renderPromo();}catch(e){toast(e.message);b.disabled=false}});
    $$('[data-promo-delete]').forEach(b=>b.onclick=async()=>{const p=byId(b.dataset.promoDelete); if(!p)return; if(!confirm(`Usunąć kod ${p.code}?\n\nZamówienia, które już go użyły, zostaną bez zmian. Zamiast usuwać, możesz kod wyłączyć.`))return; b.disabled=true;try{const j=await api({action:'promo_delete',id:p.id});payload.promo_codes=j.promo_codes||payload.promo_codes;toast(j.message);if(Number($('#promoId').value)===Number(p.id))promoReset();renderPromo();}catch(e){toast(e.message);b.disabled=false}});
    $$('[data-promo-copy]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.promoCopy);toast('Skopiowano kod');}catch(e){toast('Nie udało się skopiować — zaznacz kod ręcznie');}});
  }
  function promoGenerateCode(){
    const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const bytes=new Uint8Array(6); (window.crypto||window.msCrypto).getRandomValues(bytes);
    return 'DRUK-'+Array.from(bytes).map(b=>alphabet[b%alphabet.length]).join('');
  }
  if($('#promoSave')){
    $('#promoGenerate').addEventListener('click',()=>{ if($('#promoCode').disabled)return; $('#promoCode').value=promoGenerateCode(); promoPreview(); });
    $('#promoCode').addEventListener('input',e=>{ const pos=e.target.selectionStart; e.target.value=e.target.value.toUpperCase().replace(/\s+/g,''); try{e.target.setSelectionRange(pos,pos)}catch(_){} });
    ['promoType','promoValue','promoFrom','promoTo','promoMin','promoMax'].forEach(id=>{ $('#'+id).addEventListener('input',promoPreview); $('#'+id).addEventListener('change',promoPreview); });
    $$('[data-promo-preset]').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.promoPreset; if(k==='none'){$('#promoFrom').value='';$('#promoTo').value='';} else if(k==='today'){$('#promoFrom').value=isoPlusDays(0);} else {$('#promoFrom').value=isoPlusDays(0);$('#promoTo').value=isoPlusDays(Number(k));} promoPreview(); }));
    $('#promoCancel').addEventListener('click',promoReset);
    $('#promoSave').addEventListener('click',async()=>{
      const b=$('#promoSave'); b.disabled=true; promoMessage('');
      try{
        const j=await api({action:'promo_save',id:Number($('#promoId').value||0),code:$('#promoCode').value,label:$('#promoLabel').value,discount_type:$('#promoType').value,discount_value:$('#promoValue').value,min_total:$('#promoMin').value,valid_from:$('#promoFrom').value,valid_to:$('#promoTo').value,max_uses:$('#promoMax').value,active:$('#promoActive').checked});
        payload.promo_codes=j.promo_codes||payload.promo_codes; toast(j.message); promoReset(); renderPromo();
      }catch(e){ promoMessage(e.message); }
      finally{ b.disabled=false; }
    });
    promoReset();
  }
  function renderAll(){ renderFilters(); renderOrderList(); renderOrderDetail(); renderProduction(); if(!$('#analyticsPanel').firstElementChild) renderAnalytics(); renderPromo(); if(payload.user.is_admin){renderStaff();renderMonitoring();} if(!can('analytics_view')) document.querySelector('[data-tab=analytics]')?.setAttribute('hidden',''); if(!can('orders_view')) document.querySelector('[data-tab=production]')?.setAttribute('hidden',''); if(!can('orders_view') && currentTab==='orders' && can('analytics_view'))switchTab('analytics'); }
  ['prodSearch','prodPriority','prodDue','prodAssigned'].forEach(id=>$('#'+id)?.addEventListener(id==='prodSearch'?'input':'change',renderProduction));
  $('#prodRefresh')?.addEventListener('click',()=>load(false));
  ['orderSearch','statusFilter','assignmentFilter'].forEach(id=>$('#'+id)?.addEventListener(id==='orderSearch'?'input':'change',renderOrderList));
  switchTab('orders'); load(true).then(()=>{ if(!can('orders_view')&&can('analytics_view'))switchTab('analytics'); refreshTimer=setInterval(()=>{ if(!document.hidden && (currentTab==='orders' || currentTab==='production' || currentTab==='analytics' || currentTab==='monitoring') && !document.querySelector('#orderDetail input:focus, #orderDetail textarea:focus, #orderDetail select:focus'))load(true); },10000); });
})();
</script>
</body>
</html>
