"""0.26.10: Druk cyfrowy 24h — gdy klient nie wpisał liczby stron (pole puste albo wartość ustawiona automatycznie), zmiana zadruku ustawia 1 (jednostronny) / 2 (dwustronny);
liczba wpisana przez klienta (także z wyszukiwarki) zostaje; kafelki zadruku pokazują cenę dla tej liczby stron."""
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
def tile_click(page,idx): page.locator('#digSide').evaluate('(e,i)=>e.closest(".field").querySelectorAll(".d24-smart-choice")[i].click()',idx); settle(page)
def tile_price(page,idx):
    return page.evaluate("""i=>{const e=[...document.getElementById('digSide').closest('.field').querySelectorAll('.d24-smart-choice')][i];const p=e.querySelector('.d24-config-price');return p?p.textContent.replace(/[\\u00a0\\u202f]/g,' ').trim():''}""",idx)
def type_qty(page,text):
    page.locator('#digQty').click(); page.keyboard.press('Control+A'); page.keyboard.type(text); page.keyboard.press('Tab'); page.wait_for_timeout(200)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width); go(page)
        # --- start: dwustronny, 2 strony (wartość automatyczna); kafelki zmieniają liczbę stron tam i z powrotem
        assert page.locator('#digSide').input_value()=='Dwustronny' and qty_info(page)==['2','2'],qty_info(page)
        tile_click(page,0); assert page.locator('#digSide').input_value()=='Jednostronny' and qty_info(page)==['1','1'],qty_info(page)
        assert hint(page)=='Druk jednostronny: minimum 1 strona.',hint(page)
        tile_click(page,1); assert page.locator('#digSide').input_value()=='Dwustronny' and qty_info(page)==['2','2'],qty_info(page)
        tile_click(page,0); tile_click(page,1); tile_click(page,0); assert qty_info(page)[0]=='1',qty_info(page)
        # sam <select> (zdarzenia input + change) działa tak samo
        setv(page,'#digSide','Dwustronny'); settle(page); assert qty_info(page)[0]=='2'
        setv(page,'#digSide','Jednostronny'); settle(page); assert qty_info(page)[0]=='1'
        # wycena liczy się dla ustawionej liczby stron (1 strona jednostronnie ≠ 2 strony)
        one=price(page); setv(page,'#digSide','Dwustronny'); settle(page); two=price(page)
        assert one and two and qty_info(page)[0]=='2',(one,two)
        # --- puste pole: zmiana zadruku ustawia minimum
        setv(page,'#digSide','Jednostronny'); settle(page)
        page.locator('#digQty').evaluate('e=>{e.value="";e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));}'); page.wait_for_timeout(120)
        assert qty_info(page)[0]=='',qty_info(page)
        setv(page,'#digSide','Dwustronny'); settle(page); assert qty_info(page)[0]=='2',qty_info(page)
        page.locator('#digQty').evaluate('e=>{e.value="";e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));}'); page.wait_for_timeout(120)
        setv(page,'#digSide','Jednostronny'); settle(page); assert qty_info(page)[0]=='1',qty_info(page)
        # --- liczba wpisana przez klienta zostaje (też wtedy, gdy jest równa wartości domyślnej)
        setv(page,'#digSide','Dwustronny'); settle(page)
        setv(page,'#digQty','7'); settle(page)
        setv(page,'#digSide','Jednostronny'); settle(page); assert qty_info(page)[0]=='7',qty_info(page)
        setv(page,'#digSide','Dwustronny'); settle(page); assert qty_info(page)[0]=='7',qty_info(page)
        setv(page,'#digQty','2'); setv(page,'#digSide','Jednostronny'); settle(page); assert qty_info(page)[0]=='2',qty_info(page)
        setv(page,'#digSide','Dwustronny'); settle(page); assert qty_info(page)[0]=='2'
        # klient wpisał 1 przy jednostronnym → dwustronny podnosi do 2 (minimum), powrót nie przywraca „automatu”
        setv(page,'#digSide','Jednostronny'); setv(page,'#digQty','1'); settle(page); assert qty_info(page)[0]=='1'
        setv(page,'#digSide','Dwustronny'); settle(page); assert qty_info(page)[0]=='2'
        setv(page,'#digSide','Jednostronny'); settle(page); assert qty_info(page)[0]=='2',qty_info(page)
        assert not errors,errors
        print('PASS digital auto pages width',width,flush=True); page.close()
    # --- kafelki pokazują cenę dla liczby stron, jaka zostanie ustawiona po kliknięciu
    page,errors=boot(browser,1300); go(page)
    t_single=tile_price(page,0); t_double=tile_price(page,1)
    assert t_single and t_double,(t_single,t_double)
    tile_click(page,0); assert qty_info(page)[0]=='1'
    assert price(page)==t_single,(price(page),t_single)
    tile_click(page,1); assert qty_info(page)[0]=='2'
    assert price(page)==t_double,(price(page),t_double)
    assert t_single!=t_double
    # po wpisaniu 7 stron kafelki pokazują cenę dla 7 stron, a kliknięcie nie zmienia liczby
    setv(page,'#digQty','7'); settle(page)
    t7=tile_price(page,0); tile_click(page,0); assert qty_info(page)[0]=='7' and price(page)==t7,(qty_info(page),price(page),t7)
    assert not errors,errors; page.close()
    # --- prawdziwe wpisywanie z klawiatury: wpisana liczba zostaje po zmianie zadruku
    page,errors=boot(browser,1300); go(page)
    type_qty(page,'12'); assert qty_info(page)[0]=='12'
    tile_click(page,0); assert qty_info(page)[0]=='12',qty_info(page)
    tile_click(page,1); assert qty_info(page)[0]=='12',qty_info(page)
    # wyczyszczenie pola z klawiatury, potem wybór zadruku
    page.locator('#digQty').click(); page.keyboard.press('Control+A'); page.keyboard.press('Delete'); page.keyboard.press('Tab'); page.wait_for_timeout(150)
    assert qty_info(page)[0]==''
    tile_click(page,0); assert qty_info(page)[0]=='1',qty_info(page)
    assert not errors,errors; page.close()
    # --- liczba z wyszukiwarki to liczba klienta: późniejsza zmiana zadruku jej nie zmienia
    page,errors=boot(browser,1300)
    page.fill('#homeProductSearch','2 strony A4 kolor jednostronnie'); page.keyboard.press('Enter'); page.wait_for_timeout(1200)
    assert page.locator('#digSide').count()==1 and page.locator('#digSide').input_value()=='Jednostronny' and qty_info(page)[0]=='2',(page.locator('#digSide').input_value(),qty_info(page))
    tile_click(page,1); assert qty_info(page)[0]=='2'
    tile_click(page,0); assert qty_info(page)[0]=='2',qty_info(page)
    assert not errors,errors; page.close()
    page,errors=boot(browser,1300)
    page.fill('#homeProductSearch','1 strona A4 kolor jednostronnie'); page.keyboard.press('Enter'); page.wait_for_timeout(1200)
    assert page.locator('#digSide').input_value()=='Jednostronny' and qty_info(page)[0]=='1',(page.locator('#digSide').input_value(),qty_info(page))
    assert not errors,errors; page.close()
    # --- po zmianie usługi i powrocie formularz zaczyna od nowa (dwustronny, 2 strony, wartość automatyczna)
    page,errors=boot(browser,1300); go(page)
    setv(page,'#digQty','9'); settle(page)
    setv(page,'#digService','Ksero i druk'); settle(page); setv(page,'#digService','Druk cyfrowy 24h'); settle(page)
    assert page.locator('#digSide').input_value()=='Dwustronny' and qty_info(page)[0]=='2',qty_info(page)
    tile_click(page,0); assert qty_info(page)[0]=='1'
    assert not errors,errors; page.close()
    # --- angielski
    page,errors=boot(browser,1300,lang='en'); go(page)
    tile_click(page,0); assert qty_info(page)[0]=='1' and hint(page)=='Single-sided printing: minimum 1 page.',(qty_info(page),hint(page))
    tile_click(page,1); assert qty_info(page)[0]=='2' and hint(page)=='Double-sided printing: minimum 2 pages.'
    assert not errors,errors; page.close()
    browser.close()
print('OK digital_autopages_02610_browser')
