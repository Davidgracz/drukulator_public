"""0.26.0: kody rabatowe w koszyku — zastosowanie kodu, sumy i próg darmowej dostawy po zniżce, zgodność wyliczeń z serwerem
(wspólna tabela promo_0260_cases.json), minimalna wartość, błędne kody, usuwanie, ponowne sprawdzenie zapamiętanego kodu,
payload i odpowiedź przy wysyłce zamówienia, odrzucenie kodu przez serwer, CSV, tłumaczenie EN. Serwer jest atrapą w przeglądarce."""
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
parity=json.loads((root/'tests/promo_0260_cases.json').read_text())
GENERIC='Kod rabatowy jest nieprawidłowy lub nieaktualny.'
DB={   # atrapa tabeli kodów po stronie serwera
  'LATO10':{'code':'LATO10','label':'Lato','type':'percent','value':10,'minTotal':0,'validTo':'2026-12-31'},
  'MIN100':{'code':'MIN100','label':'','type':'amount','value':25,'minTotal':100,'validTo':''},
  'PIATKA':{'code':'PIATKA','label':'','type':'amount','value':50,'minTotal':0,'validTo':''},
}
def item(price,title='Laminowanie',i=1): return {"id":i,"title":title,"description":"A4","price":price,"details":[]}
def boot(browser,width,cart,promo=None,db=None,lang=None):
    page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=20000)
    page.evaluate('''([cart,promo,db])=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});
      st.setItem('drukulator_cart',JSON.stringify(cart)); if(promo) st.setItem('drukulator_promo',JSON.stringify(promo));
      window.__beacons=[];window.__promoCalls=[];window.__orders=[];window.__sendMode='ok';window.__promoDb=db;window.__csv=null;
      navigator.sendBeacon=(url,blob)=>{window.__beacons.push({url,blob});return true;};
      const orig=URL.createObjectURL;URL.createObjectURL=blob=>{window.__csv=blob;return orig.call(URL,blob);};
      HTMLAnchorElement.prototype.click=function(){window.__download=this.download;};}''',[cart,promo,DB if db is None else db])
    page.evaluate('''([pr,tr,ci,generic])=>{
      const json=(status,obj)=>({ok:status>=200&&status<300,status,text:async()=>JSON.stringify(obj)});
      window.fetch=async (u,opt)=>{u=String(u);
      if(u.includes("promo-validate.php")){
        const body=JSON.parse(opt.body); window.__promoCalls.push(body);
        const code=String(body.code||'').replace(/\\s+/g,'').toUpperCase();
        if(code==='RATE') return json(429,{success:false,message:'Zbyt wiele prób. Spróbuj ponownie za kilka minut.'});
        const row=window.__promoDb[code];
        if(!row) return json(200,{success:true,valid:false,reason:'invalid',message:generic});
        if(row.minTotal>0 && body.productsTotal<row.minTotal) return json(200,{success:true,valid:false,reason:'min_total',message:'Ten kod obowiązuje przy wartości produktów od '+row.minTotal.toFixed(2).replace('.',',')+' zł.'});
        return json(200,{success:true,valid:true,message:'Kod rabatowy został zastosowany.',...row});}
      if(u.includes("send-order.php")){
        const payload=JSON.parse(opt.body); window.__orders.push(payload);
        if(window.__sendMode==='promoInvalid') return json(422,{success:false,message:generic,promoInvalid:true});
        const row=payload.promoCode?window.__promoDb[String(payload.promoCode).toUpperCase()]:null;
        const products=payload.cart.reduce((s,i)=>s+i.price,0);
        const discount=row?(row.type==='percent'?Math.round(products*100*row.value/100)/100:Math.min(products,row.value)):0;
        return json(200,{success:true,orderId:'T-1',confirmationSent:true,promoCode:row?row.code:'',promoDiscount:discount,total:products-discount});}
      return {ok:true,status:200,json:async()=>u.includes("prices.json")?pr:u.includes("search-terms.json")?tr:u.includes("case-items.json")?ci:{success:true}};}}''',[prices,terms,cases,GENERIC])
    for style in styles: page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
    for script in scripts: page.add_script_tag(content=(root/script).read_text())
    page.wait_for_selector('#homeProductSearch',timeout=15000)
    page.wait_for_selector('#cartFinalTotal',timeout=8000)
    page.wait_for_timeout(250)
    if lang: page.evaluate('l=>window.DrukulatorI18n.setLanguage(l)',lang); page.wait_for_timeout(400)
    return page,errors
def t(page,sel): return page.locator(sel).first.inner_text().replace(' ',' ').replace(' ',' ').strip()
def stored(page,key): return page.evaluate('k=>localStorage.getItem(k)',key)
def apply(page,code):
    page.locator('summary:has-text("Masz kod rabatowy?")').click() if not page.locator('#promoInput').is_visible() else None
    page.locator('#promoInput').fill(code); page.locator('#promoApply').click(); page.wait_for_timeout(350)
def fill_order(page):
    page.locator('#orderName').fill('Jan Test'); page.locator('#orderEmail').fill('jan@example.com')
    if not page.locator('#orderPrivacy').is_checked(): page.locator('#orderPrivacy').check()
def money(v): return (f'{v:.2f}' if abs(v)<10000 else f'{v:,.2f}'.replace(',', ' ')).replace('.', ',')   # pl-PL: 4990,00 ale 12 345,00

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        # --- 1) wpisanie kodu: zniżka, sumy, zapis, tekst wiadomości, pasek koszyka
        page,errors=boot(browser,width,[item(200)])
        assert t(page,'#cartFinalTotal')=='200,00 zł'
        assert page.locator('summary:has-text("Masz kod rabatowy?")').count()==1 and page.locator('#cartPromoBox .d24-promo__lines').count()==0
        # pusty kod
        page.locator('summary:has-text("Masz kod rabatowy?")').click(); page.locator('#promoApply').click(); page.wait_for_timeout(200)
        assert 'Wpisz kod rabatowy.' in t(page,'#promoStatus') and page.evaluate('window.__promoCalls.length')==0
        # błędny kod: ogólny komunikat, nic nie zmienia
        apply(page,'zly kod'); assert GENERIC in t(page,'#promoStatus'),t(page,'#promoStatus')
        assert stored(page,'drukulator_promo') is None and t(page,'#cartFinalTotal')=='200,00 zł'
        assert page.evaluate('window.__promoCalls.at(-1)')=={'code':'zly kod','productsTotal':200},page.evaluate('window.__promoCalls')
        # limit prób z serwera (HTTP 429) — komunikat serwera, bez wyjątku
        apply(page,'RATE'); assert 'Zbyt wiele prób' in t(page,'#promoStatus'),t(page,'#promoStatus')
        # dobry kod (małe litery, spacje)
        page.locator('#promoInput').fill('  lato10 '); page.locator('#promoApply').click(); page.wait_for_timeout(350)
        assert page.locator('#cartPromoBox .d24-promo__applied').count()==1 and 'LATO10' in t(page,'#cartPromoBox .d24-promo__applied')
        assert '−10% na produkty' in t(page,'#cartPromoBox .d24-promo__applied') and 'ważny do 31.12.2026' in t(page,'#cartPromoBox .d24-promo__applied'),t(page,'#cartPromoBox .d24-promo__applied')
        lines=page.locator('#cartPromoBox .d24-promo__lines > div').all_inner_texts()
        norm=[re.sub(r'\s+',' ',x.replace(' ',' ')).strip() for x in lines]
        assert norm==['Produkty brutto 200,00 zł','Kod rabatowy LATO10 −20,00 zł','Produkty po zniżce 180,00 zł'],norm
        assert t(page,'#cartFinalTotal')=='180,00 zł' and t(page,'#orderFinalTotal')=='180,00 zł',(t(page,'#cartFinalTotal'),t(page,'#orderFinalTotal'))
        assert t(page,'#quoteDockTotal')=='180,00 zł',t(page,'#quoteDockTotal')
        assert json.loads(stored(page,'drukulator_promo'))['code']=='LATO10'
        text=page.locator('#orderText').input_value()
        assert 'PRODUKTY BRUTTO: 200,00 zł' in text and 'KOD RABATOWY LATO10: −20,00 zł' in text and 'PRODUKTY PO ZNIŻCE: 180,00 zł' in text and 'RAZEM Z DOSTAWĄ: 180,00 zł' in text,text
        # wpisywanie w formularzu zamówienia nie przerysowuje bloku kodu
        page.locator('#orderName').fill('Jan'); page.locator('#orderName').fill('Jan Kowalski')
        assert page.locator('#cartPromoBox .d24-promo__applied').count()==1
        # CSV
        page.locator('#downloadCsv').click(); page.wait_for_timeout(200)
        csv=page.evaluate('async()=>await window.__csv.text()').lstrip('﻿').split('\r\n')
        rows=[r.replace('"','').split(';') for r in csv]
        assert ['','PRODUKTY','','200,00'] in rows and ['','KOD RABATOWY LATO10','','-20,00'] in rows and ['','RAZEM','','180,00'] in rows,rows
        # usunięcie kodu
        page.locator('#promoRemove').click(); page.wait_for_timeout(250)
        assert stored(page,'drukulator_promo') is None and t(page,'#cartFinalTotal')=='200,00 zł' and page.locator('#cartPromoBox .d24-promo__lines').count()==0
        assert page.locator('summary:has-text("Masz kod rabatowy?")').count()==1
        assert 'KOD RABATOWY' not in page.locator('#orderText').input_value()
        # kod z minimum: za mało produktów → komunikat serwera, kod nie zostaje zapamiętany
        apply(page,'MIN100'); assert t(page,'#cartPromoBox .d24-promo__applied')[:3]=='KOD' # 200 zł ≥ 100 zł → działa
        assert t(page,'#cartFinalTotal')=='175,00 zł',t(page,'#cartFinalTotal')
        page.locator('#promoRemove').click(); page.wait_for_timeout(200)
        dims=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')
        assert dims['scroll']<=dims['inner']+1,(width,dims)
        assert not errors,errors
        print('PASS promo cart flow width',width,flush=True); page.close()

        # --- 2) kod z minimalną wartością (zapamiętany) i koszyk poniżej minimum: ostrzeżenie, brak zniżki, brak kodu w wysyłce
        page,errors=boot(browser,width,[item(80)],promo=DB['MIN100'])
        assert 'Ten kod obowiązuje przy wartości produktów od 100,00 zł' in t(page,'#cartPromoBox'),t(page,'#cartPromoBox')
        assert page.locator('#cartPromoBox .d24-promo__lines').count()==0 and t(page,'#cartFinalTotal')=='80,00 zł'
        assert json.loads(stored(page,'drukulator_promo'))['code']=='MIN100'      # kod zostaje — po dodaniu produktów zacznie działać
        fill_order(page); page.locator('#sendOrder').click(); page.wait_for_timeout(500)
        assert 'promoCode' not in page.evaluate('window.__orders[0]'),page.evaluate('window.__orders[0]')
        assert not errors,errors; page.close()

        # --- 3) wysyłka zamówienia z kodem: payload, potwierdzenie z kwotą zniżki; bez kodu — brak pola
        page,errors=boot(browser,width,[item(200)],promo=DB['LATO10'])
        assert t(page,'#cartFinalTotal')=='180,00 zł'
        fill_order(page); page.locator('#sendOrder').click(); page.wait_for_timeout(600)
        order=page.evaluate('window.__orders[0]'); assert order['promoCode']=='LATO10',order
        assert 'Zastosowano kod rabatowy LATO10: −20,00 zł' in t(page,'#orderSendStatus'),t(page,'#orderSendStatus')
        page.close()
        page,errors=boot(browser,width,[item(200)])
        fill_order(page); page.locator('#sendOrder').click(); page.wait_for_timeout(500)
        assert 'promoCode' not in page.evaluate('window.__orders[0]') and 'Zastosowano kod' not in t(page,'#orderSendStatus')
        page.close()

        # --- 4) serwer odrzuca kod przy wysyłce (np. wygasł w międzyczasie): kod zdjęty, nowa kwota, informacja, błąd „validation”
        page,errors=boot(browser,width,[item(200)],promo=DB['LATO10'])
        page.evaluate("window.__sendMode='promoInvalid'"); fill_order(page); page.locator('#sendOrder').click(); page.wait_for_timeout(600)
        st=t(page,'#orderSendStatus'); assert GENERIC in st and 'Usunęliśmy kod z zamówienia' in st,st
        assert stored(page,'drukulator_promo') is None and t(page,'#cartFinalTotal')=='200,00 zł' and page.locator('#cartPromoBox .d24-promo__lines').count()==0
        raw=page.evaluate('async()=>Promise.all(window.__beacons.map(async b=>await b.blob.text()))'); ev=[json.loads(x) for x in raw]
        errs=[e['data']['reason'] for e in ev if e['event']=='order_error']; assert errs==['validation'],errs
        assert page.locator('#sendOrder').is_enabled()
        assert not errors,errors; page.close()

        # --- 5) ponowne sprawdzenie zapamiętanego kodu po wczytaniu strony: wygasły znika, zmieniony jest odświeżony
        page,errors=boot(browser,width,[item(200)],promo=DB['LATO10'],db={})
        page.wait_for_timeout(400)
        assert stored(page,'drukulator_promo') is None and t(page,'#cartFinalTotal')=='200,00 zł' and page.locator('#cartPromoBox .d24-promo__applied').count()==0
        assert 'nie jest już ważny' in t(page,'#toast'),t(page,'#toast')
        page.close()
        page,errors=boot(browser,width,[item(200)],promo=DB['LATO10'],db={'LATO10':{**DB['LATO10'],'value':20}})
        page.wait_for_timeout(400)
        assert t(page,'#cartFinalTotal')=='160,00 zł' and json.loads(stored(page,'drukulator_promo'))['value']==20,(t(page,'#cartFinalTotal'),stored(page,'drukulator_promo'))
        assert page.evaluate('window.__promoCalls.length')==1      # jedno sprawdzenie na wczytanie strony
        page.close()
        # uszkodzony zapis w pamięci przeglądarki nie psuje koszyka
        page,errors=boot(browser,width,[item(200)],promo={'code':'<script>','type':'percent','value':10})
        assert t(page,'#cartFinalTotal')=='200,00 zł' and page.locator('#cartPromoBox .d24-promo__applied').count()==0 and not errors,errors
        page.close()
        page,errors=boot(browser,width,[item(200)],promo={'code':'LATO10','type':'percent','value':-5})
        assert t(page,'#cartFinalTotal')=='200,00 zł' and not errors,errors
        page.close()

        # --- 6) tłumaczenie EN bloku kodu
        page,errors=boot(browser,width,[item(200)],promo=DB['LATO10'],lang='en')
        en=t(page,'#cartPromoBox')
        assert 'Products incl. VAT' in en and 'Products after discount' in en and 'Discount code LATO10' in en and 'on products' in en and 'valid until' in en,en
        page.close()
        page,errors=boot(browser,width,[item(200)],lang='en')
        assert 'Do you have a discount code?' in t(page,'#cartPromoBox')
        page.locator('#cartPromoBox summary').click()
        assert page.locator('#promoApply').inner_text().strip()=='Apply' and page.locator('#promoInput').get_attribute('placeholder')=='Enter code'
        page.close()

    # --- 7) próg darmowej dostawy liczony PO zniżce (10%): 320 zł → 288 zł → dostawa płatna; 340 zł → 306 zł → gratis
    page,errors=boot(browser,1300,[item(320)],promo=DB['LATO10'])
    page.locator('#orderPickup').select_option('Dostawa na terenie Szczecina'); page.wait_for_timeout(250)
    assert t(page,'#orderDeliveryCost')=='Dostawa w Szczecinie — 20,00 zł' and t(page,'#cartFinalTotal')=='308,00 zł',(t(page,'#orderDeliveryCost'),t(page,'#cartFinalTotal'))
    page.close()
    page,errors=boot(browser,1300,[item(340)],promo=DB['LATO10'])
    page.locator('#orderPickup').select_option('Dostawa na terenie Szczecina'); page.wait_for_timeout(250)
    assert t(page,'#orderDeliveryCost')=='Dostawa w Szczecinie — GRATIS' and t(page,'#cartFinalTotal')=='306,00 zł',(t(page,'#orderDeliveryCost'),t(page,'#cartFinalTotal'))
    assert 'po zniżce' in t(page,'#orderDeliveryExplanation'),t(page,'#orderDeliveryExplanation')
    fill_order(page); page.locator('#orderDeliveryAddress').fill('Testowa 1'); page.locator('#sendOrder').click(); page.wait_for_timeout(500)
    assert page.evaluate('window.__orders[0].promoCode')=='LATO10'
    page.close()
    # bez kodu: 320 zł → dostawa gratis (próg 300 zł jak dotąd)
    page,errors=boot(browser,1300,[item(320)])
    page.locator('#orderPickup').select_option('Dostawa na terenie Szczecina'); page.wait_for_timeout(250)
    assert t(page,'#orderDeliveryCost')=='Dostawa w Szczecinie — GRATIS' and t(page,'#cartFinalTotal')=='320,00 zł'
    page.close()

    # --- 8) zgodność wyliczeń z serwerem: tabela przypadków wspólna z testem PHP (promo_0260_harness.php)
    for c in parity:
        if c['total']<0.05: continue
        promo={'code':'PARITY','label':'','type':c['type'],'value':c['value'],'minTotal':0,'validTo':''}
        page,errors=boot(browser,1300,[item(c['total'])],promo=promo,db={'PARITY':promo})
        if c['expected']>0:
            got=t(page,'#cartPromoBox .d24-promo__lines .is-discount b')
            assert got==f"−{money(c['expected'])} zł",(c,got)
        else:
            assert page.locator('#cartPromoBox .d24-promo__lines').count()==0,c
        assert t(page,'#cartFinalTotal')==f"{money(round(c['total']-c['expected'],2))} zł",(c,t(page,'#cartFinalTotal'))
        assert not errors,errors
        page.close()
    print('PASS promo parity + delivery threshold',flush=True)

    # --- 9) 0.26.4: stałe okienko „Kod rabatowy” w formularzu zamówienia (nad sumą, bez rozwijania) obok rozwijanego bloku po prawej
    for width in (1300,390):
        page,errors=boot(browser,width,[item(200)])
        box='#orderPromoBox'
        assert page.locator(box).count()==1 and page.locator(box).is_visible()
        assert page.locator(box+' details').count()==0 and page.locator(box+' summary').count()==0     # na stałe, bez rozwijania
        assert page.locator('#orderPromoInput').is_visible() and page.locator('#orderPromoApply').is_visible()   # bez klikania
        assert t(page,box+' .d24-promo__label')=='Kod rabatowy',t(page,box+' .d24-promo__label')
        assert page.locator('#cartPromoBox details.d24-promo__toggle').count()==1 and page.locator('#cartPromoBox summary:has-text("Masz kod rabatowy?")').count()==1   # prawa strona jak dotąd
        assert not page.locator('#cartPromoBox #promoInput').is_visible()                                # rozwija się dopiero po kliknięciu
        # położenie: okienko leży nad linią „Razem — brutto”
        yb=page.eval_on_selector(box,'e=>e.getBoundingClientRect().bottom'); ys=page.eval_on_selector('.order-submit-summary','e=>e.getBoundingClientRect().top')
        assert yb<=ys+0.5 and ys-yb<40,(yb,ys)
        # etykieta bez „obecnie” i wyraźnie większa suma
        summary=t(page,'.order-submit-summary')
        assert 'obecnie' not in summary.lower() and t(page,'#orderFinalTotalLabel')=='Razem — brutto' and 'obecnie' not in page.locator('#cartPromoBox').evaluate('e=>e.closest(".cart-review-summary")?.innerText||""').lower(),summary
        fs=page.eval_on_selector('#orderFinalTotal','e=>parseFloat(getComputedStyle(e).fontSize)'); lab=page.eval_on_selector('#orderFinalTotalLabel','e=>parseFloat(getComputedStyle(e).fontSize)')
        assert fs>=24 and fs>=1.6*lab and fs>=1.5*16,(fs,lab)
        assert page.evaluate('(()=>{const s=document.getElementById("orderFinalTotal");return s.scrollWidth<=s.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1})()')
        # pusty i błędny kod
        page.locator('#orderPromoApply').click(); page.wait_for_timeout(200)
        assert 'Wpisz kod rabatowy.' in t(page,'#orderPromoStatus') and page.evaluate('window.__promoCalls.length')==0
        page.locator('#orderPromoInput').fill('zly kod'); page.locator('#orderPromoApply').click(); page.wait_for_timeout(350)
        assert GENERIC in t(page,'#orderPromoStatus') and t(page,'#cartFinalTotal')=='200,00 zł' and stored(page,'drukulator_promo') is None
        # wpisany, ale niezatwierdzony kod nie ginie przy pisaniu w polach formularza
        page.locator('#orderPromoInput').fill('lato'); page.locator('#orderName').fill('Jan'); page.locator('#orderEmail').fill('jan@example.com')
        assert page.locator('#orderPromoInput').input_value()=='lato'
        # klawisz Enter zatwierdza kod, oba bloki pokazują zastosowany kod i ta sama suma
        page.locator('#orderPromoInput').fill(' lato10 '); page.locator('#orderPromoInput').press('Enter'); page.wait_for_timeout(400)
        for sel in ('#orderPromoBox','#cartPromoBox'):
            assert page.locator(sel+' .d24-promo__applied').count()==1 and 'LATO10' in t(page,sel+' .d24-promo__applied'),sel
            norm=[re.sub(r'\s+',' ',x.replace(' ',' ')).strip() for x in page.locator(sel+' .d24-promo__lines > div').all_inner_texts()]
            assert norm==['Produkty brutto 200,00 zł','Kod rabatowy LATO10 −20,00 zł','Produkty po zniżce 180,00 zł'],(sel,norm)
        assert page.locator(box+' input').count()==0 and page.locator('#cartPromoBox summary').count()==0
        assert t(page,'#orderFinalTotal')=='180,00 zł' and t(page,'#cartFinalTotal')=='180,00 zł'
        assert t(page,'#orderFinalTotalLabel')=='Razem — brutto'
        yb=page.eval_on_selector(box,'e=>e.getBoundingClientRect().bottom'); ys=page.eval_on_selector('.order-submit-summary','e=>e.getBoundingClientRect().top'); assert yb<=ys+0.5,(yb,ys)
        # wysyłka zamówienia z kodem wpisanym w okienku
        page.locator('#orderPrivacy').check(); page.locator('#sendOrder').click(); page.wait_for_timeout(500)
        assert page.evaluate('window.__orders.at(-1).promoCode')=='LATO10'
        # usunięcie z okienka → oba bloki wracają do stanu wyjściowego
        page.locator('#orderPromoRemove').click(); page.wait_for_timeout(300)
        assert stored(page,'drukulator_promo') is None and t(page,'#orderFinalTotal')=='200,00 zł'
        assert page.locator('.d24-promo__applied').count()==0 and page.locator('#orderPromoInput').is_visible() and page.locator('#cartPromoBox summary').count()==1
        # kod zatwierdzony po prawej pojawia się w okienku i można go usunąć po prawej
        page.locator('#cartPromoBox summary').click(); page.locator('#promoInput').fill('PIATKA'); page.locator('#promoApply').click(); page.wait_for_timeout(350)
        assert page.locator('#orderPromoBox .d24-promo__applied').count()==1 and 'PIATKA' in t(page,'#orderPromoBox .d24-promo__applied') and t(page,'#orderFinalTotal')=='150,00 zł'
        page.locator('#promoRemove').click(); page.wait_for_timeout(300)
        assert page.locator('.d24-promo__applied').count()==0 and page.locator('#orderPromoInput').is_visible() and t(page,'#orderFinalTotal')=='200,00 zł'
        # zapamiętany kod z minimalną wartością: ostrzeżenie widać także w okienku
        page.close()
        page,errors=boot(browser,width,[item(80)],promo=DB['MIN100'])
        assert 'Ten kod obowiązuje przy wartości produktów od 100,00 zł' in t(page,'#orderPromoBox'),t(page,'#orderPromoBox')
        assert t(page,'#orderFinalTotal')=='80,00 zł' and not errors,errors
        # brak słowa „promocyjny” w widocznym interfejsie koszyka
        assert 'promocyj' not in page.locator('body').inner_text().lower()
        page.close()
        # EN
        page,errors=boot(browser,width,[item(200)],lang='en')
        assert t(page,'#orderPromoBox .d24-promo__label')=='Discount code',t(page,'#orderPromoBox .d24-promo__label')
        assert t(page,'#orderFinalTotalLabel')=='Total incl. VAT',t(page,'#orderFinalTotalLabel')
        assert page.locator('#orderPromoApply').inner_text().strip()=='Apply' and page.locator('#orderPromoInput').get_attribute('placeholder')=='Enter code'
        assert 'promo' not in page.locator('body').inner_text().lower().replace('promocj','')
        assert not errors,errors
        page.close()
    print('PASS promo inline box (0.26.4)',flush=True)
    browser.close()
print('PASS promo_0260_browser')
