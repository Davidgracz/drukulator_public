"""0.26.5: tłumaczenie na angielski — brak polskich liter na stronach katalogu, poprawne wzorce (liczby, liczba mnoga, szt./egz.), angielski nie jest psuty
przez zamiany słów, tekst wpisany przez klienta w asystencie zostaje bez tłumaczenia."""
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
PAGE='Restauracje, hotele'
def money(v): return f'{v:.2f}'.replace('.',',')+' zł'
def boot(browser,width,prices_override=None,lang=None):
    page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=20000)
    page.evaluate('''()=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});navigator.sendBeacon=()=>true;}''')
    page.evaluate('''([pr,tr,ci])=>{window.fetch=async (u,opt)=>{u=String(u);return {ok:true,status:200,json:async()=>u.includes("prices.json")?pr:u.includes("search-terms.json")?tr:u.includes("case-items.json")?ci:{success:true}};}}''',[prices_override or prices,terms,cases])
    for style in styles: page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
    for script in scripts: page.add_script_tag(content=(root/script).read_text())
    page.wait_for_selector('#homeProductSearch',timeout=15000)
    page.wait_for_timeout(250)
    if lang: page.evaluate('l=>window.DrukulatorI18n.setLanguage(l)',lang); page.wait_for_timeout(400)
    return page,errors
def go(page):
    page.locator(f'nav#navigation button[data-page="{PAGE}"]').evaluate('(b)=>b.click()'); page.wait_for_timeout(400)
def setv(page,sel,v):
    page.locator(sel).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}',v)
    page.wait_for_timeout(250)
def tiles(page,field):
    return page.evaluate("""f=>[...document.getElementById(f).closest('.field').querySelectorAll('.d24-smart-choice')].filter(e=>!e.hidden).map(e=>{const p=e.querySelector('.d24-config-price');return [e.querySelector('strong').textContent.trim(),p?p.textContent.replace(/[\\u00a0\\u202f]/g,' ').trim():null,e.innerText.replace(/[\\u00a0\\u202f]/g,' ').replace(/\\s+/g,' ').trim()];})""",field)
def total(page):
    page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(300)
    return page.locator('.price-big strong').first.text_content().replace(' ',' ').replace(' ',' ').strip()
POL=re.compile('[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]')
ALLOWED=('Przełącz język na polski','Polski','PL')
def tr(page,text): return page.evaluate('t=>window.DrukulatorI18n.translate(t)',text)
CASES={
 'Koperty, teczki i papier firmowy':'Envelopes, folders and letterhead paper',
 'Kalendarze':'Calendars','Zobacz koszyk':'View cart','Twoje zamówienie':'Your order','Zamów online':'Order online','Przejdź do koszyka':'Go to cart',
 'RAZEM BRUTTO':'TOTAL INCL. VAT','NAJKORZYSTNIEJ':'BEST VALUE','Reklama i ekspozycja':'Advertising and display',
 'Podsumowanie Twojego zamówienia':'Summary of your order','PRODUKTY BRUTTO: 50.00 zł':'PRODUCTS (GROSS): 50.00 PLN',
 'RAZEM Z DOSTAWĄ: 50.00 zł':'TOTAL WITH DELIVERY: 50.00 PLN','Kod rabatowy':'Discount code',
 '1 produkt w zapytaniu':'1 product in your order','3 produkty w zapytaniu':'3 products in your order','5 produktów w zapytaniu':'5 products in your order',
'Łącznie 5':'Total 5','Materiały':'Materials','Ilość':'Quantity','Szerokość':'Width','Materiał':'Material',
 '2 pozycje':'2 items','1 pozycja':'1 item','Wybierz 500 szt.':'Choose 500 pcs','Wybierz 3 egz.':'Choose 3 copies','2 / 5 plików':'2 / 5 files',
 '1 szt.':'1 pc','1 pcs':'1 pc','50 szt.':'50 pcs','1 egz.':'1 copy','3 egz.':'3 copies',
 'Dodaj do koszyka · sprawdź parametry':'Add to cart · check the options',
 'Laminowanie dokumentów folią 80 mikronów':'Document lamination with 80-micron film',
 'Offset, Składane, format A4 do DL, 2500 szt.':'Offset, Folded, format A4 to DL, 2500 pcs',
 'Folia z transferem, 100 × 100 cm, 1 szt.':'Film with transfer tape, 100 × 100 cm, 1 pc',
 'Cena brutto: 1.00 zł':'Gross price: 1.00 PLN','Podaj imię i nazwisko albo nazwę firmy.':'Enter your full name or company name.',
 '90x50 mm, druk cyfrowy 24h, Standard, jednostronne, 50 szt.':'90x50 mm, digital printing 24h, Standard, single-sided, 50 pcs',
 'Papier firmowy A4 lub A5':None,
}
# angielski zostaje angielskim (dawny błąd: „do not” → „to not”, „Materiały” → „Materialy”)
KEEP=['Please do not close this window','You will not be charged until you confirm the order','Materiały','Materials','Add to cart','Delivery with the courier']
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page,errors=boot(browser,1300,lang='en')
    for pl,en in CASES.items():
        if en is None: continue
        got=tr(page,pl); assert got==en,(pl,got,en)
    for s in KEEP:
        got=tr(page,s)
        if s=='Materiały': assert got=='Materials',got
        else: assert got==s,(s,got)
    # polski bez zmian po przełączeniu z powrotem
    page.evaluate('()=>window.DrukulatorI18n.setLanguage("pl")'); page.wait_for_timeout(300)
    assert tr(page,'Zobacz koszyk')=='Zobacz koszyk'
    page.evaluate('()=>window.DrukulatorI18n.setLanguage("en")'); page.wait_for_timeout(300)
    # przejście po stronach katalogu i koszyku w EN: brak polskich liter w widocznym tekście
    pages=page.eval_on_selector_all('nav#navigation button[data-page]','b=>b.map(x=>x.dataset.page)')
    assert len(pages)>=8,pages
    bad=[]
    def scan(label):
        txt=page.evaluate("()=>document.body.innerText")
        for line in txt.split('\n'):
            if POL.search(line) and not any(a in line for a in ALLOWED): bad.append((label,line.strip()[:120]))
    scan('home')
    for name in pages:
        page.locator(f'nav#navigation button[data-page="{name}"]').evaluate('b=>b.click()'); page.wait_for_timeout(350)
        scan(name)
    assert not bad,bad[:12]
    assert not errors,errors
    page.close()
    # własny tekst klienta w asystencie nie jest tłumaczony (data-no-translate), a przyciski z odpowiedziami są
    page,errors=boot(browser,1300,lang='en')
    page.evaluate("""()=>{const b=document.createElement('div');b.setAttribute('data-no-translate','');b.textContent='chcę ulotki A6 dwustronne 500 sztuk';document.body.append(b);window.DrukulatorI18n.refresh();}""")
    page.wait_for_timeout(400)
    assert page.evaluate("()=>[...document.querySelectorAll('[data-no-translate]')].pop().textContent")=='chcę ulotki A6 dwustronne 500 sztuk'
    assert not errors,errors; page.close()
    browser.close()
print('OK english_0265_browser')
