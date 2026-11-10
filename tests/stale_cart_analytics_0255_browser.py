"""0.25.5: (1) krok lejka „cena po konfiguracji” (price_seen) tylko po prawdziwej zmianie klienta, raz na kategorię w sesji;
(2) klasyfikacja błędów wysyłki zamówienia (order_error: stale_item / limit / validation / files / network / server);
(3) pozycje koszyka ze starszej wersji kalkulatora: ostrzeżenie, „Oblicz ponownie”, blokada wysyłki przed serwerem."""
import json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html=re.sub(r'<img[^>]*>','',html,flags=re.I)
styles=['assets/styles.css','assets/frontend-refresh.css','assets/druk24-brand-forms.css','assets/product-preview.css','assets/checkout-experience.css','assets/intelligent-search.css','assets/quote-assistant-235.css','assets/intelligent-configurator.css','assets/variant-comparison.css','assets/changes-02313.css','assets/malfini-preview.css','assets/compact-choices.css','assets/order-experience-239.css','assets/ux-clarity.css']
scripts=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/malfini-preview.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js','js/variant-comparison.js']
prices,terms,cases=[json.loads((root/f).read_text()) for f in ['data/prices.json','data/search-terms.json','data/case-items.json']]
legacy=[
  {"id":1,"title":"Plakaty 24h","description":"stary plakat A2, 3 szt.","price":90,"details":[]},
  {"id":2,"title":"Plansza pianka 5 mm","description":"A3, 2 szt.","price":90,"details":[["Format","A3"]]},
  {"id":3,"title":"Roll-up Standard","description":"x","price":150,"details":[]},
  {"id":4,"title":"Laminowanie","description":"A4","price":20,"details":[]},
  {"id":5,"title":"Obrazy na płótnie","description":"40 x 60","price":120,"details":[],"meta":{"productType":"canvas","quantity":1}},
]
def boot(browser,width,cart):
    page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=20000)
    page.evaluate('''(cart)=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});st.setItem('drukulator_cart',JSON.stringify(cart));
      window.__beacons=[];window.__orderCalls=0;window.__sendMode='server500';
      navigator.sendBeacon=(url,blob)=>{window.__beacons.push({url,blob});return true;};}''',cart)
    page.evaluate('''([pr,tr,ci])=>{window.fetch=async (u)=>{u=String(u);
      if(u.includes("send-order.php")){window.__orderCalls++;const mode=window.__sendMode;
        if(mode==='network') throw new TypeError('Failed to fetch');
        if(mode==='server500') return {ok:false,status:500,text:async()=>'<html>Internal Server Error</html>'};
        if(mode==='limit') return {ok:false,status:422,text:async()=>JSON.stringify({success:false,message:'Maksymalny nakład plakatów wielkoformatowych to 30 sztuk.'})};
        if(mode==='validation') return {ok:false,status:422,text:async()=>JSON.stringify({success:false,message:'Podaj poprawny adres e-mail.'})};
        if(mode==='stale') return {ok:false,status:422,text:async()=>JSON.stringify({success:false,message:'Jedna z pozycji pochodzi ze starszej wersji kalkulatora. Usuń ją z koszyka i oblicz ponownie.'})};
        return {ok:true,status:200,text:async()=>JSON.stringify({success:true,orderId:'T-1',confirmationSent:true})};}
      return {ok:true,status:200,json:async()=>u.includes("prices.json")?pr:u.includes("search-terms.json")?tr:u.includes("case-items.json")?ci:{success:true}};}}''',[prices,terms,cases])
    for style in styles: page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
    for script in scripts: page.add_script_tag(content=(root/script).read_text())
    page.wait_for_selector('#homeProductSearch',timeout=15000)
    return page,errors
def events(page,name=None):
    raw=page.evaluate('async()=>Promise.all(window.__beacons.map(async b=>await b.blob.text()))')
    out=[json.loads(x) for x in raw]
    return [e for e in out if name is None or e['event']==name]
def go(page,name):
    page.evaluate("(n)=>document.querySelector('button.nav-button[data-page=\"'+n+'\"]').click()",name); page.wait_for_timeout(500)
def cart(page): return json.loads(page.evaluate("localStorage.getItem('drukulator_cart')") or '[]')
def fill_order(page):
    page.locator('#orderName').fill('Jan Test'); page.locator('#orderEmail').fill('jan@example.com')
    if not page.locator('#orderPrivacy').is_checked(): page.locator('#orderPrivacy').check()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width,legacy)
        # --- 1) stary koszyk: ostrzeżenie i oznaczone karty tylko przy pozycjach, które serwer by odrzucił
        stale=page.locator('.cart-card.is-stale')
        assert stale.count()==2,stale.count()
        assert page.locator('.d24-stale-cart-alert').count()==1 and 'starszej wersji kalkulatora' in page.locator('.d24-stale-cart-alert').inner_text()
        titles=[stale.nth(i).locator('h4').inner_text() for i in range(2)]
        assert titles==['Plakaty 24h','Plansza pianka 5 mm'],titles
        assert page.locator('[data-recalc]').count()==2 and page.locator('[data-recalc]').first.inner_text().strip()=='Oblicz ponownie'
        assert page.locator('.cart-card:not(.is-stale)').count()==3        # roll-up (uzupełniony typ), laminowanie, płótno
        # --- 2) wysyłka z taką pozycją jest zatrzymana po stronie przeglądarki i zapisana jako stale_item
        fill_order(page)
        page.locator('#sendOrder').click(); page.wait_for_timeout(300)
        status=page.locator('#orderSendStatus').inner_text()
        assert 'Nie można wysłać zamówienia' in status and 'Oblicz ponownie' in status,status
        assert page.evaluate('window.__orderCalls')==0
        errs=events(page,'order_error'); assert [e['data']['reason'] for e in errs]==['stale_item'],errs
        # --- 3) „Oblicz ponownie”: pozycja znika z koszyka, otwiera się właściwa strona z opisem starej pozycji
        page.locator('[data-recalc]').first.click(); page.wait_for_timeout(600)
        assert [i['title'] for i in cart(page)]==['Plansza pianka 5 mm','Roll-up Standard','Laminowanie','Obrazy na płótnie'],[i['title'] for i in cart(page)]
        hint=page.locator('.d24-recalc-hint'); assert hint.count()==1
        assert 'Plakaty 24h' in hint.inner_text() and 'stary plakat A2, 3 szt.' in hint.inner_text()
        assert page.locator('#cartPanel .cart-card.is-stale').count()==1
        assert page.locator('.nav-button.active, .nav-button[aria-current="page"]').first.get_attribute('data-page')=='Plakaty 24h'
        page.locator('[data-recalc]').first.click(); page.wait_for_timeout(600)
        assert 'Plansza pianka 5 mm' in page.locator('.d24-recalc-hint').inner_text()
        assert page.locator('#pvcProduct').count()==1
        assert page.locator('.cart-card.is-stale').count()==0 and page.locator('.d24-stale-cart-alert').count()==0
        assert len(cart(page))==3
        # --- 4) czysty koszyk przechodzi do serwera; każdy rodzaj niepowodzenia dostaje swoją przyczynę
        before=len(events(page,'order_error'))
        expected=[]
        for mode,reason in (('server500','server'),('limit','limit'),('validation','validation'),('network','network'),('stale','stale_item')):
            page.evaluate('m=>{window.__sendMode=m}',mode)
            fill_order(page)
            page.locator('#sendOrder').click(); page.wait_for_timeout(500)
            expected.append(reason)
        assert page.evaluate('window.__orderCalls')==5
        got=[e['data']['reason'] for e in events(page,'order_error')][before:]
        assert got==expected,(got,expected)
        # --- 5) udane wysłanie nie zgłasza błędu
        page.evaluate("window.__sendMode='ok'"); fill_order(page)
        page.locator('#sendOrder').click(); page.wait_for_timeout(500)
        assert 'T-1' in page.locator('#orderSendStatus').inner_text()
        assert len(events(page,'order_error'))==before+5
        assert not errors,errors
        print('PASS stale cart + order errors 0.25.5 width',width,flush=True)
        page.close()
        # --- 6) cena po konfiguracji: domyślna cena i zmiany programowe jej nie liczą, prawdziwy klik klienta — raz na kategorię
        page,errors=boot(browser,width,[])
        go(page,'PCV i pianki')
        page.wait_for_selector('#pvcProduct'); page.wait_for_timeout(500)
        page.locator('#pvcProduct').select_option(label='Plansza pianka 5 mm'); page.wait_for_timeout(700)   # zmiana programowa (nie zaufana)
        assert events(page,'price_seen')==[],events(page,'price_seen')
        qty=page.locator('#foamQtyWrap .d24-smart-options button[data-option-index]')
        qty.nth(2).click(); page.wait_for_timeout(700)
        seen=events(page,'price_seen'); assert len(seen)==1 and seen[0]['data']['page']=='PCV i pianki',seen
        qty.nth(3).click(); page.wait_for_timeout(700)
        assert len(events(page,'price_seen'))==1                               # druga zmiana w tej samej kategorii nie dubluje
        go(page,'Laminowanie')
        assert len(events(page,'price_seen'))==1                               # samo wejście na stronę z ceną domyślną — nie
        page.locator('#calculate').click(); page.wait_for_timeout(600)         # klik „Dodaj do koszyka · cena”
        seen=events(page,'price_seen'); assert [e['data']['page'] for e in seen]==['PCV i pianki','Laminowanie'],seen
        assert len(events(page,'quote_view'))>=1 and len(events(page,'add_to_cart'))==1
        # po odświeżeniu strony (ta sama karta) kategoria nie jest liczona drugi raz — stan trzymany w sessionStorage
        keys=page.evaluate("JSON.parse(sessionStorage.getItem('drukulator_price_seen_0255')||'[]')")
        assert keys==['PCV i pianki','Laminowanie'],keys
        assert not errors,errors
        print('PASS price_seen 0.25.5 width',width,flush=True)
        page.close()
    browser.close()
print('PASS stale_cart_analytics_0255_browser')
