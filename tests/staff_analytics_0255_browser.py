"""0.25.5: panel personelu — krok „cena po konfiguracji”, karty błędów wysyłki, średnia pozycja w koszyku, dwa eksporty CSV
(dzienny: stare kolumny bez zmian + nowe na końcu; szczegółowy: kategorie, źródła, błędy). Panel uruchamiany z atrapą API."""
import json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
src=(root/'staff-panel.php').read_text()
html=src[src.index('?><!doctype html>')+2:]
def _php(m):
    code=m.group(0)
    if 'wp_json_encode' in code: return '{"display_name":"Test","is_admin":true}'
    if 'esc_html' in code: return 'Test'
    if 'Administrator' in code: return 'Administrator'
    return ''   # if/endif — panel renderowany jako administrator (pokazuje wszystkie sekcje)
html=re.sub(r"<\?php.*?\?>",_php,html,flags=re.S)
assert '<?php' not in html,re.findall(r'<\?php.{0,80}',html)[:3]
analytics={"ready":True,"period_days":30,"data_start":"2026-11-08","data_end":"2026-11-10","abandoned":4,"abandoned_definition":"x",
 "totals":{"sessions":60,"stage_price":30,"stage_quote":20,"stage_cart":18,"stage_checkout":9,"orders_verified":5,"orders_value_cents":123450,"search":3,"search_miss":1,"cart_items":20,"cart_value_cents":300000,"order_error":3},
 "series":[{"day":"2026-11-08","sessions":10,"prices":5,"quotes":3,"carts":3,"checkouts":1,"orders":1,"value_cents":7500,"cart_items":3,"cart_value_cents":9000,"order_errors":0},
           {"day":"2026-11-09","sessions":32,"prices":20,"quotes":8,"carts":8,"checkouts":5,"orders":0,"value_cents":0,"cart_items":12,"cart_value_cents":150050,"order_errors":2},
           {"day":"2026-11-10","sessions":1,"prices":0,"quotes":0,"carts":0,"checkouts":0,"orders":0,"value_cents":0,"cart_items":0,"cart_value_cents":0,"order_errors":0}],
 "sources":{"direct":40,"search":15,"social":5},"pages":{"Plakaty":30,"Płyty PCV":12},"price_products":{"Plakaty":20,"Płyty PCV":5},
 "cart_products":{"Plakaty":9,"Pianki":4},"ordered_products":{"Plakaty":3},"order_errors":{"stale_item":2,"network":1}}
boot={"success":True,"csrf":"t","user":{"is_admin":True,"permissions":[]},"orders":[],"staff":[],"statuses":{},"production_summary":{},"production_priorities":{}}
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
        errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content('<!doctype html><html><head></head><body></body></html>')
        page.evaluate('''([bootPayload,an])=>{window.__csv={};window.fetch=async(u)=>({ok:true,status:200,json:async()=>String(u).includes('action=analytics')?{success:true,analytics_v2:an}:bootPayload});
          const orig=URL.createObjectURL;URL.createObjectURL=blob=>{const url=orig.call(URL,blob);window.__lastBlob=blob;return url;};
          HTMLAnchorElement.prototype.click=function(){window.__lastDownload=this.download;};}''',[boot,analytics])
        page.set_content(html)
        page.evaluate('''([bootPayload,an])=>{window.fetch=async(u)=>({ok:true,status:200,json:async()=>String(u).includes('action=analytics')?{success:true,analytics_v2:an}:bootPayload});
          const orig=URL.createObjectURL;URL.createObjectURL=blob=>{window.__lastBlob=blob;return orig.call(URL,blob);};
          HTMLAnchorElement.prototype.click=function(){window.__lastDownload=this.download;};}''',[boot,analytics])
        page.wait_for_timeout(500)
        page.locator('button[data-tab="analytics"]').first.click(); page.wait_for_selector('#a28Export:not([disabled])',timeout=8000)
        text=page.locator('#analyticsPanel').inner_text()
        assert 'Cena po konfiguracji' in text and 'Błędy wysyłki' in text and 'Średnia pozycja w koszyku' in text,text[:800]
        assert '1 500,50' not in text and '150,00 zł' in text.replace(' ',' '),text   # 3000 zł / 20 pozycji = 150,00 zł
        funnel=page.locator('.a28-funnel-row span').all_inner_texts()
        assert funnel==['Sesje','Cena po konfiguracji*','Wyceny','Koszyki','Formularz','Wysłane zapytania'],funnel
        assert 'Pozycja ze starszej wersji kalkulatora' in text and 'Błąd połączenia' in text      # etykiety przyczyn
        assert 'Wyszukiwarki' in text and 'Wejścia bezpośrednie' in text
        # --- CSV dzienny: stare kolumny w tej samej kolejności, nowe na końcu
        page.locator('#a28Export').click(); page.wait_for_timeout(200)
        daily=page.evaluate('async()=>await window.__lastBlob.text()').lstrip('﻿').split('\r\n')
        assert page.evaluate('window.__lastDownload')=='drukulator-analityka-30dni.csv'
        head=daily[0].replace('"','').split(';')
        assert head[:6]==['Dzień','Sesje','Wyceny','Koszyki','Zapytania potwierdzone','Wartość zapytań PLN'],head
        assert head[6:]==['Cena po konfiguracji','Formularz','Pozycje w koszykach','Wartość pozycji w koszykach PLN','Błędy wysyłki'],head
        row=daily[2].replace('"','').split(';')
        assert row==['2026-11-09','32','8','8','0','0,00','20','5','12','1500,50','2'],row
        # --- CSV szczegółowy (format długi)
        page.locator('#a28ExportDetails').click(); page.wait_for_timeout(200)
        det=page.evaluate('async()=>await window.__lastBlob.text()').lstrip('﻿').split('\r\n')
        assert page.evaluate('window.__lastDownload')=='drukulator-analityka-szczegoly-30dni.csv'
        rows=[r.replace('"','').split(';') for r in det]
        assert rows[0]==['Sekcja','Pozycja','Wartość'],rows[0]
        assert ['Kategoria — cena po konfiguracji','Plakaty','20'] in rows and ['Źródło ruchu — sesje','Wyszukiwarki','15'] in rows
        assert ['Błąd wysyłki — liczba','Pozycja ze starszej wersji kalkulatora','2'] in rows
        assert ['Podsumowanie','Wartość pozycji w koszykach PLN','3000,00'] in rows and ['Podsumowanie','Błędy wysyłki','3'] in rows
        assert all(len(r)==3 for r in rows),[r for r in rows if len(r)!=3]
        assert not errors,errors
        dims=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')
        assert dims['scroll']<=dims['inner']+1,(width,dims)
        print('PASS staff analytics 0.25.5 width',width,flush=True)
        page.close()
    browser.close()
print('PASS staff_analytics_0255_browser')
