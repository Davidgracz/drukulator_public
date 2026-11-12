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

    /* Analytics v0.22.8 - lightweight aggregate dashboard. */
    .a28-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:18px}.a28-intro h2{font-size:22px;margin:0 0 6px}.a28-intro p{margin:0;color:var(--muted);font-size:13px;max-width:740px;line-height:1.5}.a28-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.a28-tools select{background:#091314;border:1px solid #33565a;color:#f8fafc;border-radius:10px;padding:10px;font:inherit}.a28-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:15px}.a28-metrics--3{grid-template-columns:repeat(3,minmax(0,1fr))}@media(max-width:760px){.a28-metrics--3{grid-template-columns:1fr}}.a28-metric{background:#0b1718;border:1px solid #284448;border-radius:14px;padding:16px;min-width:0}.a28-metric small{display:block;color:#a8c6ca;font-size:12px}.a28-metric strong{display:block;font-size:26px;margin:8px 0 5px;word-break:break-word}.a28-metric em{font-size:11px;font-style:normal;color:#83b1b5}.a28-columns{display:grid;grid-template-columns:1.2fr 1fr;gap:14px;margin:14px 0}.a28-funnel{display:grid;gap:13px;margin:18px 0 6px}.a28-funnel-row{display:grid;grid-template-columns:minmax(90px,150px) minmax(0,1fr) 70px;gap:10px;align-items:center}.a28-funnel-row span{font-size:12px;color:#dbe9eb}.a28-track{height:15px;background:#15292b;border-radius:20px;overflow:hidden}.a28-fill{height:100%;border-radius:20px;background:linear-gradient(90deg,#5493d0,#1ed5cb);min-width:0}.a28-funnel-row strong{font-size:12px;text-align:right}.a28-chart{display:grid;grid-template-columns:repeat(var(--a28-bars,7),minmax(0,1fr));height:175px;gap:6px;align-items:end;padding:12px 0 0}.a28-day{display:grid;gap:5px;justify-items:center;min-width:0}.a28-bars{display:flex;align-items:flex-end;gap:3px;height:115px}.a28-bar{min-width:5px;width:9px;border-radius:3px 3px 0 0;background:#5493d0}.a28-bar.order{background:#1ed5cb}.a28-day-label{font-size:10px;color:#a3bec1;white-space:nowrap}.a28-day-values{font-size:10px;color:#b9d8da}.a28-key{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:#a3bdc0;margin-top:8px}.a28-key span:before{content:' ';display:inline-block;width:10px;height:10px;margin-right:5px;border-radius:2px;background:#5493d0}.a28-key .a28-key-orders:before{background:#1ed5cb}.a28-list{display:grid;gap:10px;margin:12px 0 0}.a28-line{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #203536;padding:8px 0;font-size:13px}.a28-line span{overflow-wrap:anywhere}.a28-line b{white-space:nowrap}.a28-note{font-size:12px;line-height:1.6;color:#9ebfc2;margin:12px 0 0}.a28-empty{color:#89afb1;font-size:13px;padding:18px 2px}.a28-positive{color:#7ef0ce}.a28-alert{color:#fbbf24}.a28-rate{font-size:12px;color:#a6bec0}.a28-card h3{font-size:16px;margin:0 0 7px}.a28-card{min-width:0}@media(max-width:1220px){.a28-metrics{grid-template-columns:repeat(3,1fr)}}@media(max-width:760px){.a28-metrics{grid-template-columns:1fr 1fr}.a28-columns{grid-template-columns:1fr}.a28-funnel-row{grid-template-columns:90px 1fr 50px}.a28-metric strong{font-size:21px}.a28-chart{gap:2px}}
    /* Production management — 0.22.9v */
    .p29-header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px}.p29-header h2{font-size:24px;margin:0 0 8px}.p29-header p{max-width:750px;font-size:13px;line-height:1.5}
    .p29-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:14px}.p29-stat{border:1px solid var(--line);border-radius:14px;padding:13px;background:#101e20}.p29-stat small{display:block;color:#afc2c5;font-size:12px}.p29-stat strong{display:block;font-size:26px;margin-top:5px}.p29-stat.warn strong{color:#fbbf24}.p29-stat.danger strong{color:#fca5a5}
    .p29-toolbar{display:grid;grid-template-columns:minmax(190px,1fr) repeat(3,minmax(135px,.35fr));gap:10px;margin-bottom:15px}.p29-toolbar select,.p29-toolbar input,.p29-editor select,.p29-editor input{background:#071011;border:1px solid #335154;border-radius:9px;padding:10px;color:var(--ink);font:inherit;width:100%;min-width:0}
    .p29-board{display:grid;grid-template-columns:repeat(4,minmax(240px,1fr));gap:12px;align-items:start;overflow-x:auto}.p29-column{background:#0b1718;border:1px solid #263d3e;border-radius:14px;padding:12px;min-height:240px;min-width:0}.p29-column h3{margin:0 0 12px;font-size:14px;display:flex;align-items:center;justify-content:space-between;gap:10px}.p29-stack{display:grid;gap:10px;max-height:70vh;overflow:auto}.p29-card{display:block;text-align:left;width:100%;color:#e8f4f4;border:1px solid #294749;background:#101f21;border-radius:12px;padding:12px;cursor:pointer;font:inherit}.p29-card:hover,.p29-card:focus-visible{border-color:#1ed5cb;background:#173033}.p29-card strong{display:block;font-size:13px;overflow-wrap:anywhere}.p29-card small{display:block;margin-top:6px;color:#acc5c9;font-size:11px;line-height:1.5}.p29-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.p29-tag{border-radius:6px;padding:4px 6px;font-size:10px;font-weight:800;background:#19383b;color:#c1f8f1}.p29-tag.high{background:#42311e;color:#fde68a}.p29-tag.urgent,.p29-tag.overdue{background:#4b2222;color:#fda4af}.p29-tag.low{background:#203339;color:#a8bfd1}.p29-tag.today{background:#53451e;color:#fde68a}.p29-note{font-size:12px;color:#a8bfc1;margin-top:14px}
    .p29-history{display:grid;gap:8px;margin:12px 0}.p29-history-item{border:1px solid #294446;background:#0b191b;padding:10px;border-radius:10px}.p29-history-item small{display:block;color:var(--muted);margin-top:5px}.p29-editor .p29-work{padding:11px;border:1px solid #27464a;background:#0a191b;border-radius:10px;margin-top:8px}.p29-editor .p29-work strong{display:block;font-size:18px}
    @media(max-width:1300px){.p29-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.p29-board{grid-template-columns:repeat(2,minmax(260px,1fr))}}
    @media(max-width:750px){.p29-toolbar{grid-template-columns:1fr 1fr}.p29-board{grid-template-columns:1fr}.p29-metrics{grid-template-columns:1fr 1fr}}
    @media(max-width:440px){.p29-toolbar,.p29-metrics{grid-template-columns:1fr}}
    /* Kody promocyjne — 0.26.0v */
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
      <button data-tab="analytics">Analytics</button>
      <?php if (d24_staff_can('promo_manage')): ?><button data-tab="promo">Kody promocyjne</button><?php endif; ?>
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
          <h2 id="promoFormTitle">Nowy kod promocyjny</h2>
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
          <div class="row-between"><div><h2>Kody promocyjne</h2><div class="muted">Zniżki, okres ważności i zużycie. Użycie liczy się po przyjęciu zamówienia.</div></div><span id="promoCount" class="pill">—</span></div>
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
  function renderOrderDetail(){ const box=$('#orderDetail'); const o=(payload?.orders||[]).find(x=>x.order_id===selectedOrderId); if(!o){box.innerHTML='<div class="detail-empty">Wybierz zlecenie z listy.</div>';return;} const staffOptions=(payload.staff||[]).filter(s=>s.active).map(s=>`<option value="${s.id}" ${Number(o.assigned_staff_id)===Number(s.id)?'selected':''}>${esc(s.display_name)}</option>`).join(''); box.innerHTML=`<div class="row-between"><div><div class="pill">${esc(statusLabel(o.status))}</div><h2>${esc(o.order_name||o.order_id)}</h2><div class="sub">${esc(o.order_id)} • utworzono ${date(o.created_at)}</div></div><strong style="font-size:22px">${money(o.total)} zł</strong></div><div class="grid3" style="margin-top:14px"><div class="metric"><span>Klient</span><strong>${esc(o.customer_name||'—')}</strong></div><div class="metric"><span>Kontakt</span><strong>${esc(o.customer_phone||o.customer_email||'—')}</strong></div><div class="metric"><span>Pracownik</span><strong>${esc(o.assigned_name||'Nieprzypisane')}</strong></div></div>${o.promo_code?`<div class="notice" style="margin-top:12px;margin-bottom:0">Kod promocyjny <strong>${esc(o.promo_code)}</strong> · zniżka −${money(o.discount)} zł (kwota zlecenia jest już po zniżce, dostawa liczona osobno)</div>`:''}${can('orders_rename')?`<div class="section"><h3>Nazwa robocza zlecenia</h3><div class="grid2"><div class="field" style="margin:0"><input id="orderName" maxlength="190" value="${esc(o.order_name)}" placeholder="np. Menu Restauracja Portowa"></div><button class="btn" id="saveOrderName">Zapisz nazwę</button></div></div>`:''}${can('orders_assign')?`<div class="section"><h3>Przypisanie</h3><div class="grid2"><select id="orderAssignee"><option value="">Nieprzypisane</option>${staffOptions}</select><button class="btn secondary" id="saveOrderAssignee">Zapisz przypisanie</button></div></div>`:''}${can('orders_status')?`<div class="section"><h3>Status wewnętrzny</h3><p class="muted">Publiczny podgląd postępu zlecenia jest wyłączony.</p><div class="grid2"><div class="field" style="margin:0"><select id="orderStatus">${Object.entries(payload.statuses||{}).map(([k,v])=>`<option value="${esc(k)}" ${o.status===k?'selected':''}>${esc(v)}</option>`).join('')}</select></div><div class="field" style="margin:0"><textarea id="publicNote" maxlength="500" placeholder="Notatka statusu (obecnie niewidoczna dla klienta)">${esc(o.public_note)}</textarea></div></div><button class="btn" id="saveOrderStatus">Aktualizuj status</button>${o.ready_notified_at?`<div class="notice" style="margin-top:10px;margin-bottom:0">✓ Powiadomienie przyjęte przez WordPress: ${date(o.ready_notified_at)}</div>`:''}</div>`:''}${can('orders_notes')?`<div class="section"><h3>Notatka wewnętrzna</h3><div class="field"><textarea id="internalNote" maxlength="4000" placeholder="Widoczna tylko dla pracowników">${esc(o.internal_note)}</textarea></div><button class="btn secondary" id="saveInternalNote">Zapisz notatkę</button></div>`:''}${productionEditor(o)}<div class="section"><h3>Produkty</h3><div class="items">${(o.items||[]).map((it,i)=>`<div class="item"><div class="row-between"><strong>${i+1}. ${esc(it.title||'Produkt')}</strong><b>${money(it.price)} zł</b></div>${it.description?`<p>${esc(it.description)}</p>`:''}</div>`).join('')}</div></div><div class="section"><h3>Dane klienta</h3><div class="customer"><div><span>E-mail</span><strong>${esc(o.customer_email||'—')}</strong></div><div><span>Telefon</span><strong>${esc(o.customer_phone||'—')}</strong></div><div><span>Odbiór</span><strong>${esc(o.pickup||'—')}</strong></div><div><span>Uwagi klienta</span><strong>${esc(o.notes||'—')}</strong></div></div></div><div class="section"><h3>Historia</h3><div class="items">${[...(o.history||[])].reverse().map(h=>`<div class="item"><div class="row-between"><strong>${esc(h.label||h.status)}</strong><small>${date(h.at)}</small></div>${h.note?`<p>${esc(h.note)}</p>`:''}${h.actor?`<p>Zmienił: ${esc(h.actor)}</p>`:''}</div>`).join('')}</div></div>`;
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
  function a28RankedEntries(values){ return Object.entries(values||{}).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,8); }
  function a28Ranking(values, units=''){
    const entries=a28RankedEntries(values);
    return entries.length?`<div class="a28-list">${entries.map(([name,value])=>`<div class="a28-line"><span>${esc(name)}</span><b>${Number(value).toLocaleString('pl-PL')}${units}</b></div>`).join('')}</div>`:'<div class="a28-empty">Brak danych w wybranym okresie.</div>';
  }
  async function fetchAnalytics(silent=true){
    if(analyticsLoading || !can('analytics_view')) return;
    if(silent && analyticsV2 && Date.now()-analyticsFetchedAt < 60000) return;
    analyticsLoading=true;
    try{
      const r=await fetch('staff-api.php?action=analytics&days='+analyticsDays,{credentials:'same-origin',cache:'no-store'});
      const j=await r.json();
      if(!r.ok||!j.success)throw new Error(j.message||'Błąd odczytu statystyk');
      analyticsV2=j.analytics_v2;analyticsFetchedAt=Date.now();renderAnalytics();
    }catch(e){ if(!silent)toast(e.message); }
    finally{analyticsLoading=false;}
  }
  function a28Csv(){
    if(!analyticsV2?.ready)return;
    const a=analyticsV2, header=['Dzień','Sesje','Wyceny','Koszyki','Zapytania potwierdzone','Wartość zapytań PLN','Cena po konfiguracji','Formularz','Pozycje w koszykach','Wartość pozycji w koszykach PLN','Błędy wysyłki'];
    const text=[header,...(a.series||[]).map(x=>[x.day, x.sessions,x.quotes,x.carts,x.orders, (Number(x.value_cents||0)/100).toFixed(2).replace('.',','), x.prices||0, x.checkouts||0, x.cart_items||0, (Number(x.cart_value_cents||0)/100).toFixed(2).replace('.',','), x.order_errors||0])]
      .map(cols=>cols.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='drukulator-analityka-'+a.period_days+'dni.csv';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  const a28SourceLabels={direct:'Wejścia bezpośrednie',search:'Wyszukiwarki',social:'Social media',referral:'Inne strony'};
  const a28ErrorLabels={stale_item:'Pozycja ze starszej wersji kalkulatora',limit:'Przekroczony limit (wymiar, nakład, wartość)',validation:'Niepełny formularz (imię, e-mail, zgoda)',files:'Problem z plikami',network:'Błąd połączenia',server:'Inny błąd serwera'};
  function a28CsvDetails(){
    if(!analyticsV2?.ready)return;
    const a=analyticsV2, rows=[['Sekcja','Pozycja','Wartość']];
    const add=(section,values,labels={})=>Object.entries(values||{}).forEach(([name,n])=>rows.push([section,labels[name]||name,n]));
    add('Kategoria — oglądane',a.pages); add('Kategoria — cena po konfiguracji',a.price_products); add('Kategoria — dodane do koszyka',a.cart_products);
    add('Kategoria — w przyjętych zapytaniach',a.ordered_products); add('Źródło ruchu — sesje',a.sources,a28SourceLabels); add('Błąd wysyłki — liczba',a.order_errors,a28ErrorLabels);
    const t=a.totals||{};
    rows.push(['Podsumowanie','Sesje',t.sessions||0],['Podsumowanie','Cena po konfiguracji (sesje)',t.stage_price||0],['Podsumowanie','Wyceny (sesje)',t.stage_quote||0],['Podsumowanie','Koszyki (sesje)',t.stage_cart||0],['Podsumowanie','Formularz (sesje)',t.stage_checkout||0],['Podsumowanie','Przyjęte zapytania',t.orders_verified||0],['Podsumowanie','Pozycje w koszykach (z poprawną kwotą)',t.cart_items||0],['Podsumowanie','Wartość pozycji w koszykach PLN',(Number(t.cart_value_cents||0)/100).toFixed(2).replace('.',',')],['Podsumowanie','Błędy wysyłki',t.order_error||0]);
    const text=rows.map(cols=>cols.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='drukulator-analityka-szczegoly-'+a.period_days+'dni.csv';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  function renderAnalytics(){
    const box=$('#analyticsPanel');if(!box)return;
    if(!can('analytics_view')){box.innerHTML='<div class="card empty">Nie masz uprawnień do analityki.</div>';return;}
    const a=analyticsV2||{},t=a.totals||{},sessions=Number(t.sessions||0),quotes=Number(t.stage_quote||0),carts=Number(t.stage_cart||0),checkout=Number(t.stage_checkout||0),orders=Number(t.orders_verified||0);
    const value=Number(t.orders_value_cents||0)/100, abandonment=Number(a.abandoned||0),conversion=sessions?orders/sessions*100:0;
    const metric=(label,note,value,extra='')=>`<div class="a28-metric"><small>${label}</small><strong>${value}</strong><em>${extra||note}</em></div>`;
    const priceSeen=Number(t.stage_price||0),cartItems=Number(t.cart_items||0),cartValue=Number(t.cart_value_cents||0)/100,orderErrors=Number(t.order_error||0),funnel=[['Sesje',sessions],['Cena po konfiguracji*',priceSeen],['Wyceny',quotes],['Koszyki',carts],['Formularz',checkout],['Wysłane zapytania',orders]];
    const chart=(a.series||[]), max=Math.max(1,...chart.map(x=>Math.max(Number(x.sessions||0),Number(x.orders||0))));
    const dayChart=chart.map(x=>{let hs=Math.round(Number(x.sessions||0)/max*110),ho=Math.round(Number(x.orders||0)/max*110);return `<div class="a28-day" title="${esc(x.day)} · sesje ${Number(x.sessions)||0} · zapytania ${Number(x.orders)||0}"><div class="a28-bars"><div class="a28-bar" style="height:${hs}px"></div><div class="a28-bar order" style="height:${ho}px"></div></div><div class="a28-day-label">${esc(x.day.slice(5))}</div></div>`;}).join('');
    const sourceEntries=Object.fromEntries(Object.entries(a.sources||{}).map(([key,v])=>[a28SourceLabels[key]||key,v]));
    const errorEntries=Object.fromEntries(Object.entries(a.order_errors||{}).map(([key,v])=>[a28ErrorLabels[key]||key,v]));
    box.innerHTML=`<div class="a28-intro"><div><h2>Analityka Drukulatora <span class="pill">0.25.5v</span></h2><p>Ruch, wyceny, koszyki i zapytania. Zamówienia zliczane są dopiero po akceptacji e-maila przez WordPress. Bez IP, adresów klientów i treści plików.</p></div><div class="a28-tools"><select id="a28Period" aria-label="Zakres raportu"><option value="1" ${analyticsDays===1?'selected':''}>Dzisiaj</option><option value="7" ${analyticsDays===7?'selected':''}>7 dni</option><option value="30" ${analyticsDays===30?'selected':''}>30 dni</option></select><button type="button" class="btn secondary" id="a28Refresh">⟳ Odśwież</button><button type="button" class="btn secondary" id="a28Export" ${!a.ready?'disabled':''}>↓ CSV (dni)</button><button type="button" class="btn secondary" id="a28ExportDetails" ${!a.ready?'disabled':''}>↓ CSV (szczegóły)</button></div></div>
      ${!a.ready?'<div class="card a28-empty">Ładowanie danych lub oczekiwanie na utworzenie tabel statystyk…</div>':`
      <div class="a28-metrics">${metric('Sesje','',''+sessions,'Unikalne sesje przeglądarki')}${metric('Wyświetlone wyceny','',''+quotes,'Sesje z wyceną')}${metric('Dodania do koszyka','',''+carts,'Sesje z koszykiem')}${metric('Przyjęte zapytania','',''+orders,'Potwierdzone przez serwer')}${metric('Wartość zapytań','',''+money(value)+' zł','Nieopłacona sprzedaż, tylko wyceny')}</div>
      <div class="a28-metrics a28-metrics--3">${metric('Cena po konfiguracji','',''+priceSeen,'Sesje, w których klient zmienił parametry i zobaczył cenę*')}${metric('Średnia pozycja w koszyku','',cartItems?money(cartValue/cartItems)+' zł':'—','Z '+cartItems.toLocaleString('pl-PL')+' pozycji z poprawną kwotą')}${metric('Błędy wysyłki','',''+orderErrors,'Próby wysłania zamówienia, które się nie powiodły')}</div>
      <div class="a28-columns"><div class="card a28-card"><h3>Lejek wyceny</h3><div class="a28-rate">Współczynnik zapytań: <strong class="a28-positive">${conversion.toLocaleString('pl-PL',{maximumFractionDigits:1})}%</strong> względem sesji z okresu (nie jest to analiza tej samej kohorty)</div><div class="a28-funnel">${funnel.map(([name,n])=>`<div class="a28-funnel-row"><span>${esc(name)}</span><div class="a28-track"><div class="a28-fill" style="width:${Math.max(0,Math.min(100,sessions?n/sessions*100:0))}%"></div></div><strong>${n.toLocaleString('pl-PL')}</strong></div>`).join('')}</div><p class="a28-note">Każdy etap poza wysłanym zapytaniem liczy sesję najwyżej raz. Wysłane zapytania liczy serwer, a nie przeglądarka.</p><p class="a28-note">* Krok „cena po konfiguracji” liczony od wersji 0.25.5v (wcześniej brak danych). Liczy się dopiero zmiana parametrów przez klienta lub kliknięcie „Dodaj do koszyka · cena” — cena domyślna widoczna po samym wejściu na stronę nie. Przycisk „Dodaj do koszyka · cena” zapisuje jednocześnie wycenę i koszyk, więc te dwa kroki są teraz prawie równe.</p></div><div class="card a28-card"><h3>Koszyki porzucone</h3><div class="a28-metric" style="margin-top:14px"><small>Nieaktywne co najmniej 24 h</small><strong class="a28-alert">${abandonment}</strong><em>Szacunkowa liczba sesji</em></div><p class="a28-note">${esc(a.abandoned_definition||'')}</p><p class="a28-note">Sesje są przechowywane przez maksymalnie 45 dni, więc raport 30-dniowy jest pełnym horyzontem dla tej miary. Dane od momentu aktualizacji.</p></div></div>
      <div class="card a28-card"><h3>Sesje i zapytania dzień po dniu</h3><div class="a28-chart" style="--a28-bars:${Math.max(1,chart.length)}">${dayChart}</div><div class="a28-key"><span>Sesje</span><span class="a28-key-orders">Przyjęte zapytania</span></div></div>
      <div class="a28-columns"><div class="card a28-card"><h3>Produkty dodawane do koszyka</h3>${a28Ranking(a.cart_products)}</div><div class="card a28-card"><h3>Produkty w przyjętych zapytaniach</h3>${a28Ranking(a.ordered_products)}</div></div>
      <div class="a28-columns"><div class="card a28-card"><h3>Kategorie z ceną po konfiguracji*</h3>${a28Ranking(a.price_products)}</div><div class="card a28-card"><h3>Błędy wysyłki zamówienia</h3>${a28Ranking(errorEntries)}<p class="a28-note">Liczone od 0.25.5v. „Pozycja ze starszej wersji kalkulatora” oznacza stary koszyk zapisany w przeglądarce klienta.</p></div></div>
      <div class="a28-columns"><div class="card a28-card"><h3>Źródła ruchu</h3>${a28Ranking(sourceEntries)}</div><div class="card a28-card"><h3>Oglądane kategorie</h3>${a28Ranking(a.pages)}</div></div>
      <div class="card a28-card"><h3>Wyszukiwanie w kalkulatorze</h3><div class="a28-rate">Zapytania: <strong>${Number(t.search||0).toLocaleString('pl-PL')}</strong> · Bez wyników: <strong>${Number(t.search_miss||0).toLocaleString('pl-PL')}</strong></div><p class="a28-note">Dane zbiorcze bez zapisu wpisanych haseł w nowym module. Raport nie uwzględnia ruchu sprzed 0.22.8v.</p></div>
      <p class="a28-note">Raport: ${esc(a.data_start)} – ${esc(a.data_end)} · Brak identyfikacji użytkowników między urządzeniami. Przeglądarka może blokować telemetrię; wartości są orientacyjne. Wysyłka maila ≠ potwierdzenie jego doręczenia.</p>`}`;
    $('#a28Period').addEventListener('change',e=>{analyticsDays=Number(e.target.value)||7;analyticsV2=null;renderAnalytics();fetchAnalytics(false);});
    $('#a28Refresh').addEventListener('click',()=>fetchAnalytics(false));
    $('#a28Export')?.addEventListener('click',a28Csv);
    $('#a28ExportDetails')?.addEventListener('click',a28CsvDetails);
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
    const titles={order_mail_accepted:'Mail do drukarni',order_mail_failed:'Błąd maila do drukarni',confirmation_mail_accepted:'Potwierdzenie klienta',confirmation_mail_failed:'Błąd potwierdzenia klienta',ready_mail_accepted:'Powiadomienie: gotowe',ready_mail_failed:'Błąd powiadomienia o gotowości',order_status_changed:'Zmiana statusu',order_assignment_changed:'Zmiana przypisania',upload_started:'Rozpoczęcie uploadu',upload_failed:'Nieudany upload',upload_validation_failed:'Problem z plikami',order_record_failed:'Błąd zapisu zlecenia'};
    const meta=(e)=>{const a=e.metadata||{};const v=[]; if(a.files!==undefined)v.push(`${Number(a.files)} plików`);if(a.bytes!==undefined)v.push(fmtBytes(a.bytes));if(a.total!==undefined)v.push(`${money(a.total)} zł`);if(a.channel)v.push(`Kanał: ${a.channel==='office'?'drukarnia':'klient'}`);if(a.staff)v.push(`Pracownik: ${a.staff}`);if(a.status)v.push(`Status: ${a.status}`);if(a.method)v.push(`Metoda: ${a.method}`);if(a.file_names?.length)v.push(`Nazwy plików: ${a.file_names.join(', ')}`);if(e.duration_ms)v.push(`Czas żądania: ${e.duration_ms} ms`);return v.join(' • ');};
    $('#monitorEventList').innerHTML=matches.length?matches.map(e=>`<div class="monitor-event"><div class="monitor-event-side">${monitorWhen(e.created_at)}<div class="monitor-event-sub">UTC → lokalnie</div></div><div><div class="monitor-event-title">${esc(titles[e.event_type]||e.event_type||'Zdarzenie')}</div><div class="monitor-event-sub">${esc(e.message||'')}</div>${e.order_id?`<div class="monitor-event-sub"><button class="monitor-link" type="button" data-monitor-order="${esc(e.order_id)}">${esc(e.order_id)}</button></div>`:''}<div class="monitor-meta">${esc(meta(e))}</div></div><div class="monitor-event-level ${esc(e.level)}">${e.level==='error'?'Błąd':e.level==='warning'?'Uwaga':'OK'}</div></div>`).join(''):'<div class="empty">Brak zdarzeń spełniających wybrane filtry.</div>';
    $$('[data-monitor-order]').forEach(b=>b.addEventListener('click',()=>{selectedOrderId=b.dataset.monitorOrder;switchTab('orders');renderOrderList();renderOrderDetail();}));
  }
  ['monitorLevel','monitorType','monitorSearch'].forEach(id=>$('#'+id)?.addEventListener(id==='monitorSearch'?'input':'change',renderMonitoring));
  $('#monitorRefresh')?.addEventListener('click',()=>load(false));

  /* Kody promocyjne — 0.26.0v */
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
    $('#promoFormTitle').textContent='Nowy kod promocyjny'; $('#promoSave').textContent='Zapisz kod'; $('#promoCancel').hidden=true; promoMessage(''); promoPreview();
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
  function renderAll(){ renderFilters(); renderOrderList(); renderOrderDetail(); renderProduction(); renderAnalytics(); renderPromo(); if(payload.user.is_admin){renderStaff();renderMonitoring();} if(!can('analytics_view')) document.querySelector('[data-tab=analytics]')?.setAttribute('hidden',''); if(!can('orders_view')) document.querySelector('[data-tab=production]')?.setAttribute('hidden',''); if(!can('orders_view') && currentTab==='orders' && can('analytics_view'))switchTab('analytics'); }
  ['prodSearch','prodPriority','prodDue','prodAssigned'].forEach(id=>$('#'+id)?.addEventListener(id==='prodSearch'?'input':'change',renderProduction));
  $('#prodRefresh')?.addEventListener('click',()=>load(false));
  ['orderSearch','statusFilter','assignmentFilter'].forEach(id=>$('#'+id)?.addEventListener(id==='orderSearch'?'input':'change',renderOrderList));
  switchTab('orders'); load(true).then(()=>{ if(!can('orders_view')&&can('analytics_view'))switchTab('analytics'); refreshTimer=setInterval(()=>{ if(!document.hidden && (currentTab==='orders' || currentTab==='production' || currentTab==='analytics' || currentTab==='monitoring') && !document.querySelector('#orderDetail input:focus, #orderDetail textarea:focus, #orderDetail select:focus'))load(true); },10000); });
})();
</script>
</body>
</html>
