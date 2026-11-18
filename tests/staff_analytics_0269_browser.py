"""0.26.9: panel pracowniczy — przeprojektowana Analityka (zakładki Przegląd / Lejek / Produkty / Ruch / Dni, KPI z porównaniem do poprzedniego okresu,
wykres SVG z podpowiedziami, lejek z przejściami, tabela produktów z sortowaniem i filtrem, mapa godzin, tabela dni, trzy eksporty CSV).
Panel uruchamiany z atrapą API (bez WordPressa); układ sprawdzany na szerokościach 1300 i 390 px."""
import json,re,copy
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
    return ''
html=re.sub(r"<\?php.*?\?>",_php,html,flags=re.S)
assert '<?php' not in html
def day(i): return f'2026-11-{i:02d}'
def series(first,vals):
    out=[]
    for k,(s,pr,q,c,ch,o,v) in enumerate(vals):
        out.append({"day":day(first+k),"sessions":s,"prices":pr,"quotes":q,"carts":c,"checkouts":ch,"orders":o,"value_cents":v,"cart_items":c,"cart_value_cents":c*10000,"order_errors":1 if k==1 else 0})
    return out
cur=series(12,[(10,5,3,3,1,1,7500),(32,20,8,8,5,0,0),(1,0,0,0,0,0,0),(8,4,3,2,1,1,30000),(5,3,2,2,1,1,40000),(3,1,1,1,0,0,0),(1,0,0,0,0,2,45950)])
# razem: sesje 60, zapytania 5, wartość 123450 gr
prev=series(5,[(6,3,2,2,1,1,5000),(8,4,3,2,1,1,10000),(5,2,1,1,0,0,0),(7,3,2,2,1,1,20000),(6,3,2,2,1,1,15000),(4,2,1,1,0,0,0),(4,1,1,1,0,0,0)])
hours=[0]*24; hours[9]=4; hours[10]=12; hours[14]=20; hours[20]=14; hours[22]=10          # 60 sesji
wh=[[0]*24 for _ in range(7)]
wh[1][14]=15; wh[1][10]=8; wh[3][20]=14; wh[4][9]=4; wh[5][22]=10; wh[0][10]=4; wh[2][14]=5     # 60
base={"ready":True,"period_days":7,"data_start":day(12),"data_end":day(18),"abandoned":4,"abandoned_definition":"Sesje z koszykiem, bez potwierdzonego zapytania, nieaktywne przez minimum 24 godziny.",
 "generated_at":"2026-11-18T15:02:00+01:00",
 "totals":{"sessions":60,"stage_price":30,"stage_quote":20,"stage_cart":18,"stage_checkout":9,"orders_verified":5,"orders_value_cents":123450,"search":10,"search_miss":4,"cart_items":20,"cart_value_cents":300000,"order_error":3},
 "series":cur,
 "previous":{"start":day(5),"end":day(11),"series":prev,"hours":[0]*24,"totals":{"sessions":40,"stage_price":20,"stage_quote":15,"stage_cart":12,"stage_checkout":6,"orders_verified":4,"orders_value_cents":100000,"search":8,"search_miss":1,"cart_items":12,"cart_value_cents":100000,"order_error":1}},
 "sources":{"direct":35,"search":15,"social":10},"pages":{"Plakaty":30,"Płyty PCV":12,"Strona główna":25,"Wizytówki":9},
 "price_products":{"Plakaty":20,"Płyty PCV":5,"Wizytówki":5},"cart_products":{"Plakaty":9,"Pianki":4,"Wizytówki":7},"ordered_products":{"Plakaty":3,"Wizytówki":2},
 "ordered_value_cents":{"Plakaty":90000,"Wizytówki":33450},
 "order_errors":{"stale_item":2,"network":1},"devices":{"mobile":30,"desktop":20,"tablet":5},"langs":{"pl":50,"en":8},
 "hours":hours,"weekday_hours":wh,"segment_window_days":7,
 "segments":{"source":{"direct":{"sessions":35,"price":15,"quote":10,"cart":9,"checkout":4,"orders":2},"search":{"sessions":15,"price":10,"quote":6,"cart":6,"checkout":3,"orders":3}},
             "device":{"mobile":{"sessions":30,"price":12,"quote":8,"cart":7,"checkout":2,"orders":1},"desktop":{"sessions":20,"price":15,"quote":10,"cart":9,"checkout":6,"orders":4},"unknown":{"sessions":5,"price":3,"quote":2,"cart":2,"checkout":1,"orders":0}},
             "lang":{"pl":{"sessions":50,"price":28,"quote":19,"cart":17,"checkout":9,"orders":5},"en":{"sessions":8,"price":2,"quote":1,"cart":1,"checkout":0,"orders":0}}},
 "search":{"since":"2026-01-02","terms":{"wizytówki":12,"ulotki a5":7},"misses":{"kubki":6,"pocztówki":4}}}
today=copy.deepcopy(base); today.update({"period_days":1,"data_start":day(18),"data_end":day(18),"series":[cur[-1]],"previous":{"start":day(17),"end":day(17),"series":[prev[-1]],"hours":[0,0,0,0,0,0,0,0,0,2,3,0,0,0,5]+[0]*9,"totals":{"sessions":10,"orders_verified":0,"orders_value_cents":0}}})
empty=copy.deepcopy(base); empty.update({"totals":{k:0 for k in base['totals']},"series":[{**x,"sessions":0,"prices":0,"quotes":0,"carts":0,"checkouts":0,"orders":0,"value_cents":0,"cart_items":0,"cart_value_cents":0,"order_errors":0} for x in cur],"abandoned":0,"hours":[0]*24,"weekday_hours":[[0]*24 for _ in range(7)],"price_products":{},"cart_products":{},"ordered_products":{},"ordered_value_cents":{},"pages":{},"sources":{},"devices":{},"langs":{},"order_errors":{},"segments":{"source":{},"device":{},"lang":{}},"previous":{**base["previous"],"totals":{}}})
boot={"success":True,"csrf":"t","user":{"is_admin":True,"permissions":[]},"orders":[],"staff":[],"statuses":{},"production_summary":{},"production_priorities":{}}
def clean(v): return v.replace(' ',' ').replace(' ',' ')
def boot_page(browser,width,datasets=None):
    page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
    errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content('<!doctype html><html><head></head><body></body></html>')
    init='''([bootPayload,ds])=>{window.__urls=[];if(!window.__ls){const m=new Map();window.__ls=true;const st={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:{...st},configurable:true});}window.fetch=async(u)=>{u=String(u);window.__urls.push(u);if(u.includes('action=analytics')){const d=(u.match(/days=(\\d+)/)||[])[1];const key=ds[d]?d:'7';if(ds.fail)return {ok:false,status:500,json:async()=>({success:false,message:'Błąd testowy'})};return {ok:true,status:200,json:async()=>({success:true,analytics_v2:ds[key]})};}return {ok:true,status:200,json:async()=>bootPayload};};
      const orig=URL.createObjectURL;URL.createObjectURL=blob=>{window.__lastBlob=blob;return orig.call(URL,blob);};
      HTMLAnchorElement.prototype.click=function(){window.__lastDownload=this.download;};}'''
    ds=datasets or {'7':base,'1':today,'14':base,'30':base,'90':base}
    page.evaluate(init,[boot,ds])
    page.set_content(html)
    page.evaluate(init,[boot,ds])
    page.wait_for_timeout(500)
    page.locator('button[data-tab="analytics"]').first.click(); page.wait_for_selector('#a28Export:not([disabled])',timeout=8000)
    return page,errors
def view(page,name): page.locator(f'[data-an-view="{name}"]').click(); page.wait_for_timeout(150)
def panel(page): return clean(page.locator('#analyticsPanel').inner_text())
def blob(page): return page.evaluate('async()=>await window.__lastBlob.text()').lstrip('﻿').split('\r\n')
def no_overflow(page,width):
    d=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})'); assert d['scroll']<=d['inner']+1,(width,d)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot_page(browser,width)
        # --- nagłówek, nawigacja, okres
        assert page.locator('button[data-tab="analytics"]').first.inner_text().strip()=='Analityka'
        head=panel(page); assert '12.11.2026 – 18.11.2026' in head and 'porównanie: poprzednie 7 dni' in head and 'zaktualizowano' in head,head[:400]
        assert page.locator('[data-an-days][aria-pressed="true"]').inner_text()=='7 dni'
        assert page.locator('[data-an-view]').all_inner_texts()==['Przegląd','Lejek','Produkty','Ruch','Dni']
        assert page.locator('[data-an-view][aria-selected="true"]').inner_text()=='Przegląd'
        # --- KPI + zmiany względem poprzedniego okresu
        kpi={clean(k.locator('.an9-kpi__top > span').first.inner_text()).strip():clean(k.inner_text()) for k in page.locator('.an9-kpi').all()}
        assert list(kpi)==['Sesje','Sesje z koszykiem','Przyjęte zapytania','Konwersja','Wartość zapytań','Średnia wartość zapytania','Koszyki porzucone','Błędy wysyłki'],list(kpi)
        assert '60' in kpi['Sesje'] and '▲ 50%' in kpi['Sesje'],kpi['Sesje']
        assert '5' in kpi['Przyjęte zapytania'] and '▲ 25%' in kpi['Przyjęte zapytania']
        assert '8,33%' in kpi['Konwersja'] and '▼ 1,7 p.p.' in kpi['Konwersja'],kpi['Konwersja']
        assert '1234,50 zł' in kpi['Wartość zapytań'] and '▲ 23,5%' in kpi['Wartość zapytań'],kpi['Wartość zapytań']
        assert '246,90 zł' in kpi['Średnia wartość zapytania'],kpi['Średnia wartość zapytania']
        assert '4' in kpi['Koszyki porzucone'] and '22%' in kpi['Koszyki porzucone']
        assert '▲ 200%' in kpi['Błędy wysyłki'],kpi['Błędy wysyłki']
        assert page.locator('.an9-kpi:has-text("Błędy wysyłki") .an9-delta.bad').count()==1      # wzrost błędów = zmiana niekorzystna
        assert page.locator('.an9-kpi:has-text("Sesje") .an9-delta.good').count()>=1
        assert page.locator('.an9-kpi svg polyline').count()>=4                                      # mini-wykresy
        # --- wykres dzień po dniu: wskaźniki, oś, podpowiedź, linia poprzedniego okresu
        assert page.locator('[data-an-metric]').count()==6 and page.locator('[data-an-metric][aria-pressed="true"]').inner_text()=='Sesje'
        assert page.locator('.an9-chart svg .an9-line').count()==1 and page.locator('.an9-chart svg .an9-prev').count()==1
        assert page.locator('.an9-chart svg circle.an9-dot').count()==7
        page.locator('.an9-chart svg').hover(position={'x':page.locator('.an9-chart svg').bounding_box()['width']*0.5,'y':60}); page.wait_for_timeout(150)
        tip=clean(page.locator('.an9-tip').inner_text()); assert page.locator('.an9-tip').is_visible() and 'Sesje:' in tip and 'Poprzedni okres' in tip,tip
        page.locator('[data-an-metric="value_cents"]').click(); page.wait_for_timeout(150)
        assert page.locator('.an9-chart svg text',has_text='600').count()>=1       # oś w złotych: max 459,50 zł → podziałka 0 / 200 / 400 / 600
        page.locator('.an9-chart').focus(); page.keyboard.press('ArrowRight'); page.wait_for_timeout(100)
        assert page.locator('.an9-tip').is_visible() and 'zł' in clean(page.locator('.an9-tip').inner_text())
        # --- wnioski
        ins=clean(page.locator('.an9-insights').first.inner_text())
        assert 'Najwięcej ruchu' in ins and 'Pt 13.11' in ins and 'Największa strata w lejku' in ins and 'sesji porzuciło koszyk' in ins and 'Błędy wysyłki zamówienia' in ins,ins
        assert '40% wyszukiwań' in ins,ins
        # --- przełącznik porównania
        page.locator('#an9Compare').uncheck(); page.wait_for_timeout(150)
        assert page.locator('.an9-delta').count()==0 and page.locator('.an9-chart .an9-prev').count()==0
        assert page.evaluate("localStorage.getItem('d24_an_compare')")=='0'
        page.locator('#an9Compare').check(); page.wait_for_timeout(150); assert page.locator('.an9-delta').count()>=5
        # --- lejek
        view(page,'funnel')
        steps=[clean(x.inner_text()).split('\n')[0].strip() for x in page.locator('.an9-step__label span').all()]
        assert steps==['Sesje','Cena po konfiguracji','Wyceny','Koszyki','Formularz zamówienia','Przyjęte zapytania'],steps
        ft=panel(page); assert 'przechodzi dalej: 50%' in ft and 'odpada 30' in ft,ft[:600]
        assert page.locator('.an9-step.is-worst').count()==1 and page.locator('.an9-step.is-worst .an9-step__label span').inner_text().strip()=='Cena po konfiguracji'   # plakietka „największa strata” jest rysowana w CSS
        assert 'Lejek wg urządzenia' in ft and 'Telefon' in ft and 'Komputer' in ft and 'Nieznane (starsze sesje)' in ft and 'Lejek wg źródła ruchu' in ft and 'Wyszukiwarki' in ft
        assert 'Lejek wg języka strony' in ft and 'Polski' in ft and 'Angielski' in ft
        assert 'Pozycja ze starszej wersji kalkulatora' in ft and 'Błąd połączenia' in ft
        assert page.locator('table.an9-table').count()==3
        # --- produkty: tabela, sortowanie, filtr, razem
        view(page,'products')
        names=lambda: [clean(x.inner_text()).strip() for x in page.locator('#an9ProdWrap tbody th').all()]
        assert names()==['Plakaty','Wizytówki','Pianki','Płyty PCV'],names()      # domyślnie malejąco wg wartości zapytań
        assert 'Strona główna' not in names()
        page.locator('[data-an-sort-products="cart"]').click(); page.wait_for_timeout(100); assert names()[:2]==['Plakaty','Wizytówki'] and page.locator('th[aria-sort="descending"]').count()==1
        page.locator('[data-an-sort-products="name"]').click(); page.wait_for_timeout(100); assert names()==['Pianki','Plakaty','Płyty PCV','Wizytówki'],names()
        page.locator('[data-an-sort-products="name"]').click(); page.wait_for_timeout(100); assert names()==['Wizytówki','Płyty PCV','Plakaty','Pianki'],names()
        page.locator('#an9ProdFilter').fill('pla'); page.wait_for_timeout(100); assert names()==['Plakaty'],names()
        page.locator('#an9ProdFilter').fill('zzz'); page.wait_for_timeout(100); assert 'Brak kategorii pasujących do filtra.' in panel(page)
        page.locator('#an9ProdFilter').fill(''); page.wait_for_timeout(100)
        row=[clean(x.inner_text()).strip() for x in page.locator('#an9ProdWrap tbody tr:has(th:text-is("Plakaty")) td').all()]
        assert row[:4]==['30','20','9','3'] and '900,00 zł' in row[4] and row[5]=='45%' and row[6]=='33%',row
        tot=clean(page.locator('#an9ProdWrap tfoot').inner_text()); assert '1234,50 zł' in tot and 'Razem' in tot,tot
        tiles=clean(page.locator('.an9-tiles').inner_text()); assert 'Plakaty' in tiles and '900,00 zł' in tiles
        # --- ruch: źródła, urządzenia, język, godziny, mapa, wyszukiwanie
        view(page,'traffic')
        tt=panel(page)
        assert 'Wejścia bezpośrednie' in tt and 'Telefon' in tt and 'Komputer' in tt and 'Tablet' in tt and 'Polski' in tt and 'Angielski' in tt
        assert 'Nieznane (starsze sesje)' in tt and 'urządzenie znane dla 55 z 60 sesji' in tt,tt[:500]
        assert page.locator('.an9-heat i').count()==168 and page.locator('.an9-heat i.is-zero').count()==168-7
        assert 'Najruchliwszy termin: wtorek, 14:00–14:59 (15 sesji)' in tt,tt[-900:]
        assert page.locator('.an9-chart .an9-bar').count()==24 and page.locator('.an9-chart .an9-bar.is-peak').count()==1
        assert 'wizytówki' in tt and 'kubki' in tt and 'od 02.01.2026' in tt and '4 bez wyników' in tt.replace('\n',' ') or 'w tym 4 bez wyników' in tt.replace('\n',' ')
        # --- dni
        view(page,'days')
        rows=page.locator('.an9-table tbody tr'); assert rows.count()==7
        assert clean(rows.first.locator('th').inner_text()).startswith('Śr 18.11'),clean(rows.first.locator('th').inner_text())      # domyślnie najnowszy dzień na górze
        assert 'Razem' in clean(page.locator('.an9-table tfoot').inner_text()) and '60' in clean(page.locator('.an9-table tfoot').inner_text())
        assert page.locator('.an9-table td.is-best').count()>=4
        page.locator('[data-an-sort-days="sessions"]').click(); page.wait_for_timeout(100)
        assert clean(page.locator('.an9-table tbody tr').first.locator('th').inner_text()).startswith('Pt 13.11')
        page.locator('[data-an-sort-days="day"]').click(); page.wait_for_timeout(100)
        assert clean(page.locator('.an9-table tbody tr').first.locator('th').inner_text()).startswith('Czw 12.11')
        # --- jak liczymy
        page.locator('.an9-defs summary').click(); assert 'Porównanie' in clean(page.locator('.an9-defs').inner_text())
        # --- eksporty CSV: dzienny (stare kolumny bez zmian), produkty, szczegóły
        page.locator('#a28Export').click(); page.wait_for_timeout(200)
        daily=blob(page); assert page.evaluate('window.__lastDownload')=='drukulator-analityka-7dni.csv'
        head=daily[0].replace('"','').split(';')
        assert head==['Dzień','Sesje','Wyceny','Koszyki','Zapytania potwierdzone','Wartość zapytań PLN','Cena po konfiguracji','Formularz','Pozycje w koszykach','Wartość pozycji w koszykach PLN','Błędy wysyłki'],head
        assert daily[2].replace('"','').split(';')==['2026-11-13','32','8','8','0','0,00','20','5','8','800,00','1'],daily[2]
        page.locator('#a28ExportProducts').click(); page.wait_for_timeout(200)
        prod=[r.replace('"','').split(';') for r in blob(page)]; assert page.evaluate('window.__lastDownload')=='drukulator-analityka-produkty-7dni.csv'
        assert prod[0]==['Kategoria','Oglądane','Cena po konfiguracji','Dodane do koszyka','Pozycje w zapytaniach','Wartość zapytań PLN','Koszyk / cena %','Zapytanie / koszyk %'],prod[0]
        assert prod[1]==['Plakaty','30','20','9','3','900,00','45,0','33,3'],prod[1]
        page.locator('#a28ExportDetails').click(); page.wait_for_timeout(200)
        det=[r.replace('"','').split(';') for r in blob(page)]; assert page.evaluate('window.__lastDownload')=='drukulator-analityka-szczegoly-7dni.csv'
        assert det[0]==['Sekcja','Pozycja','Wartość'] and all(len(r)==3 for r in det),[r for r in det if len(r)!=3]
        for needle in (['Kategoria — cena po konfiguracji','Plakaty','20'],['Źródło ruchu — sesje','Wyszukiwarki','15'],['Błąd wysyłki — liczba','Pozycja ze starszej wersji kalkulatora','2'],['Podsumowanie','Wartość pozycji w koszykach PLN','3000,00'],['Podsumowanie','Błędy wysyłki','3'],['Kategoria — wartość zapytań PLN','Plakaty','900,00'],['Urządzenie — sesje','Telefon','30'],['Język — sesje','Polski','50'],['Godzina wejścia — sesje','14:00','20'],['Poprzedni okres','Sesje','40']):
            assert needle in det,needle
        no_overflow(page,width)
        assert not errors,errors
        print('PASS staff analytics 0.26.9 width',width,flush=True); page.close()
    # --- okres „Dziś”: wykres godzinowy i porównanie z wczoraj; zmiana okresu pobiera dane z serwera z właściwym parametrem
    page,errors=boot_page(browser,1300)
    page.locator('[data-an-days="1"]').click(); page.wait_for_selector('.an9-chart .an9-bar',state='attached',timeout=5000)
    assert any('days=1' in u for u in page.evaluate('window.__urls')),page.evaluate('window.__urls')
    assert page.locator('.an9-chart .an9-bar').count()==24 and page.locator('[data-an-metric]').count()==0
    assert 'wczoraj' in panel(page) and 'dziś, 18.11.2026' in panel(page)
    assert page.evaluate("localStorage.getItem('d24_an_days')")=='1'
    page.locator('[data-an-days="30"]').click(); page.wait_for_timeout(400)
    assert any('days=30' in u for u in page.evaluate('window.__urls')) and page.locator('[data-an-days][aria-pressed="true"]').inner_text()=='30 dni'
    assert not errors,errors; page.close()
    # --- brak danych (zero sesji) i błąd serwera
    page,errors=boot_page(browser,1300,{'7':empty})
    assert 'nie zarejestrowano żadnych sesji' in panel(page) and 'Brak sesji w wybranym okresie' in panel(page)
    view(page,'products'); assert 'Brak kategorii pasujących do filtra.' in panel(page) or page.locator('#an9ProdWrap tbody tr').count()==1
    view(page,'traffic'); assert 'Brak danych o godzinach wejść' in panel(page)
    assert not errors,errors; page.close()
    page=browser.new_page(viewport={'width':1300,'height':900},locale='pl-PL'); errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content('<!doctype html><html><head></head><body></body></html>')
    initf='''([bootPayload])=>{window.fetch=async(u)=>{u=String(u);if(u.includes('action=analytics'))return {ok:false,status:500,json:async()=>({success:false,message:'Błąd testowy'})};return {ok:true,status:200,json:async()=>bootPayload};};}'''
    page.evaluate(initf,[boot]); page.set_content(html); page.evaluate(initf,[boot]); page.wait_for_timeout(500)
    page.locator('button[data-tab="analytics"]').first.click(); page.wait_for_selector('#an9Retry',timeout=5000)
    assert 'Błąd testowy' in panel(page); assert not errors,errors; page.close()
    # --- klawiatura: strzałki przełączają zakładki
    page,errors=boot_page(browser,1300)
    page.locator('[data-an-view="overview"]').focus(); page.keyboard.press('ArrowRight'); page.wait_for_timeout(150)
    assert page.locator('[data-an-view][aria-selected="true"]').inner_text()=='Lejek' and page.evaluate("document.activeElement.dataset.anView")=='funnel'
    assert not errors,errors; page.close()
    browser.close()
print('PASS staff_analytics_0269_browser')
