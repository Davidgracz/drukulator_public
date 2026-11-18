"""0.26.8: Druk cyfrowy 24h — kolejność Jednostronny / Dwustronny (domyślnie Dwustronny) oraz minimalna liczba stron: dwustronnie 2, jednostronnie 1
(pole, podpowiedź, wymuszanie po change, kafelki, kalkulator jako ostatni strażnik, wyszukiwarka i angielski)."""
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
PAGE='Druk cyfrowy i ksero 24h'
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
def go(page,name=PAGE):
    page.locator(f'nav#navigation button[data-page="{name}"]').evaluate('(b)=>b.click()'); page.wait_for_timeout(350)
def opts(page,sel): return page.eval_on_selector_all(f'{sel} option','o=>o.map(x=>x.value)')
def price(page):
    page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(250)   # click() bez zaufania = tylko wycena
    return page.locator('.price-big strong').first.text_content().replace(' ',' ').replace(' ',' ').strip()
def quote_text(page): return page.locator('#quoteArea').text_content().replace(' ',' ').replace(' ',' ')
def vis(page,sel): return page.locator(sel).is_visible()
def inactive(page,field): return page.locator(f'#{field}.d24-field-inactive').count()==1   # 0.26.2: pole zależne zostaje na miejscu, jest tylko przygaszone
def setv(page,sel,v):
    page.locator(sel).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}',v)
    page.wait_for_timeout(120)


def boxes(page,sel):
    return page.eval_on_selector_all(sel,'els=>els.filter(e=>!e.hidden).map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.x*10)/10,Math.round(r.y*10)/10,Math.round(r.width*10)/10,Math.round(r.height*10)/10];})')
def prices_on(page,field):
    return page.eval_on_selector_all(f'#{field} .d24-smart-choice',"els=>els.filter(e=>!e.hidden).map(e=>{const p=e.querySelector('.d24-config-price');return [e.querySelector('strong').textContent.trim(),p?p.textContent.replace(/[\\u00a0\\u202f]/g,' ').trim():null,p?getComputedStyle(p).visibility:null,e.getAttribute('aria-pressed')];})")
def settle(page): page.wait_for_timeout(450)
def label_y(page,field): return page.eval_on_selector(f'#{field} > label','e=>Math.round(e.getBoundingClientRect().y*10)/10')


def tiles(page,field):
    return page.evaluate("""f=>[...document.getElementById(f).closest('.field').querySelectorAll('.d24-smart-choice')].filter(e=>!e.hidden).map(e=>[e.querySelector('strong').textContent.trim(),e.classList.contains('is-selected')||e.getAttribute('aria-pressed')==='true'||e.getAttribute('aria-checked')==='true'])""",field)
def money(v): return f'{v:.2f}'.replace('.',',')+' zł'
FOIL=prices['druk_cyfrowy_i_ksero']['foliowanie']
assert FOIL=={'Satyna':2,'Błysk':1.5,'Mat':1.5},FOIL

def qty_info(page): return page.evaluate("()=>{const q=document.getElementById('digQty');return [q.value,q.min];}")
def hint(page): return page.locator('#digMinHint').inner_text().strip()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width); go(page)
        # --- stan początkowy: dwustronnie (domyślnie), minimum 2 strony
        assert opts(page,'#digSide')==['Jednostronny','Dwustronny'] and page.locator('#digSide').input_value()=='Dwustronny'
        assert qty_info(page)==['2','2'],qty_info(page)
        assert hint(page)=='Druk dwustronny: minimum 2 strony.',hint(page)
        assert float(price(page).replace(' zł','').replace(',','.'))>0
        # --- jednostronnie: minimum 1, wpisanie 1 działa
        setv(page,'#digSide','Jednostronny'); settle(page)
        assert qty_info(page)[1]=='1' and hint(page)=='Druk jednostronny: minimum 1 strona.',(qty_info(page),hint(page))
        setv(page,'#digQty','1'); settle(page)
        assert qty_info(page)[0]=='1'
        one_single=price(page); assert one_single and 'Przy druku' not in quote_text(page),quote_text(page)[:200]
        # kafelek „Dwustronny” pokazuje cenę dla 2 stron (wybór podniesie 1 do 2), a nie brak ceny
        pr=page.evaluate("""()=>[...document.getElementById('digSide').closest('.field').querySelectorAll('.d24-smart-choice')].map(e=>{const p=e.querySelector('.d24-config-price');return [e.querySelector('strong').textContent.trim(),p?p.textContent.replace(/[\\u00a0\\u202f]/g,' ').trim():null];})""")
        print('tile prices',pr)
        assert len(pr)==2 and all(c for _,c in pr),pr
        # --- przełączenie na dwustronny podnosi 1 do 2, a większą liczbę zostawia
        setv(page,'#digSide','Dwustronny'); settle(page)
        assert qty_info(page)==['2','2'],qty_info(page)
        setv(page,'#digSide','Jednostronny'); setv(page,'#digQty','7'); setv(page,'#digSide','Dwustronny'); settle(page)
        assert qty_info(page)[0]=='7'
        # --- wpisywanie: w trakcie pisania (input) nie poprawiamy; „12” da się wpisać, a „1” jest podniesione po zatwierdzeniu (change)
        page.locator('#digQty').evaluate('e=>{e.value="1";e.dispatchEvent(new Event("input",{bubbles:true}));}'); page.wait_for_timeout(100)
        assert qty_info(page)[0]=='1'
        page.locator('#digQty').evaluate('e=>{e.value="12";e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));}'); page.wait_for_timeout(100)
        assert qty_info(page)[0]=='12'
        page.locator('#digQty').evaluate('e=>{e.value="1";e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));}'); page.wait_for_timeout(100)
        assert qty_info(page)[0]=='2',qty_info(page)
        setv(page,'#digQty','0'); assert qty_info(page)[0]=='2'
        setv(page,'#digQty','-5'); assert qty_info(page)[0]=='2'
        # --- kalkulator jest ostatecznym strażnikiem: 1 strona dwustronnie wpisana bez zdarzenia nie przejdzie
        page.locator('#digQty').evaluate('e=>{e.value="1";}'); page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(200)
        assert 'Przy druku dwustronnym minimalna liczba stron to 2.' in quote_text(page),quote_text(page)[:300]
        # --- komplety nie zmieniają minimum (minimum dotyczy jednego kompletu)
        setv(page,'#digQty','2'); setv(page,'#digSets','5'); settle(page); assert qty_info(page)[0]=='2'
        assert float(price(page).replace(' zł','').replace(',','.'))>0
        assert not errors,errors
        print('PASS digital min pages width',width,flush=True); page.close()
    # --- prawdziwa interakcja: wpisanie „1” i kliknięcie „Oblicz cenę” (blur → change → podniesienie do 2) daje cenę, nie błąd
    page,errors=boot(browser,1300); go(page)
    page.locator('#digQty').click(); page.keyboard.press('Control+A'); page.keyboard.type('1')
    assert qty_info(page)[0]=='1'
    page.locator('#calculate').click(); page.wait_for_timeout(400)
    assert qty_info(page)[0]=='2',qty_info(page)
    assert 'Przy druku' not in quote_text(page) and float(page.locator('.price-big strong').first.text_content().replace(' zł','').replace('\xa0','').replace('\u202f','').replace(',','.'))>0,quote_text(page)[:200]
    assert not errors,errors; page.close()
    # --- kafelek zadruku: kliknięcie „Dwustronny” przy 1 stronie podnosi do 2 i wycenia tak samo jak kafelek
    page,errors=boot(browser,1300); go(page)
    setv(page,'#digSide','Jednostronny'); setv(page,'#digQty','1'); settle(page)
    page.locator('#digSide').evaluate('e=>e.closest(".field").querySelectorAll(".d24-smart-choice")[1].click()'); settle(page)
    assert page.locator('#digSide').input_value()=='Dwustronny' and qty_info(page)[0]=='2'
    assert not errors,errors; page.close()
    # --- asystent/wyszukiwarka: 1 strona bez „dwustronny” = jednostronny; jawnie dwustronny 1 strony = 2 strony
    page,errors=boot(browser,1300)
    page.fill('#homeProductSearch','wydruk 1 strona A4 kolor'); page.keyboard.press('Enter'); page.wait_for_timeout(1200)
    body=page.locator('body').inner_text()
    assert 'Wydruk jednostronny czy dwustronny?' in body or page.locator('#digSide').count()==1,body[:300]
    assert not errors,errors; page.close()
    page,errors=boot(browser,1300)
    page.fill('#homeProductSearch','1 strona A4 kolor dwustronny'); page.keyboard.press('Enter'); page.wait_for_timeout(1200)
    assert page.locator('#digSide').input_value()=='Dwustronny' and qty_info(page)[0]=='2',(page.locator('#digSide').input_value(),qty_info(page))
    assert not errors,errors; page.close()
    # --- angielski
    page,errors=boot(browser,1300,lang='en'); go(page)
    assert hint(page)=='Double-sided printing: minimum 2 pages.',hint(page)
    setv(page,'#digSide','Jednostronny'); settle(page); assert hint(page)=='Single-sided printing: minimum 1 page.',hint(page)
    setv(page,'#digSide','Dwustronny'); settle(page)
    page.locator('#digQty').evaluate('e=>{e.value="1";}'); page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(200)
    assert 'For double-sided printing the minimum is 2 pages.' in quote_text(page),quote_text(page)[:300]
    assert 'Przy druku' not in page.locator('#quoteArea').inner_text()
    assert not errors,errors; page.close()
    browser.close()
print('OK digital_minpages_0268_browser')
