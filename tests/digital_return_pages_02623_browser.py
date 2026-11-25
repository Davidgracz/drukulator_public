"""0.26.23: Druk cyfrowy 24h — domyślnie jednostronny (najtańszy, 1 strona) i poprawka błędu: po wpisaniu 3 / 5 / 17 stron i powrocie do 1 albo 2
kliknięcie „Jednostronny” / „Dwustronny” znów zmienia liczbę stron i cenę (wpisane ręcznie 1 lub 2 strony to wartość startowa, nie „wybór klienta”).
Strony 3 i więcej oraz liczba z wyszukiwarki nadal zostają bez zmian. Wpisywanie z prawdziwej klawiatury."""
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
    num=lambda t: float(t.replace(' zł','').replace(',','.'))
    for width in (1300,390):
        page,errors=boot(browser,width); go(page)
        # --- start: jednostronny jest pierwszy i wybrany, 1 strona; kafelki: 1 str. vs 2 str.
        assert opts(page,'#digSide')==['Jednostronny','Dwustronny'] and page.locator('#digSide').input_value()=='Jednostronny'
        assert [sel for _,sel in tiles(page,'digSide')]==[True,False] and qty_info(page)==['1','1'],(tiles(page,'digSide'),qty_info(page))
        assert tile_price(page,0)=='1,00 zł' and tile_price(page,1)=='2,00 zł',(tile_price(page,0),tile_price(page,1))
        # --- 17 stron: zadruk nie zmienia liczby stron (zostaje 17), kafelki pokazują 17 stron
        type_qty(page,'17'); assert qty_info(page)[0]=='17'
        tile_click(page,1); assert qty_info(page)[0]=='17'
        tile_click(page,0); assert qty_info(page)[0]=='17' and tile_price(page,0)==tile_price(page,1)=='17,00 zł'
        # --- 5, potem powrót do 1 (jednostronny): kliknięcie dwustronnego podnosi do 2 i zmienia cenę, powrót ustawia 1 i znów zmienia cenę
        type_qty(page,'5'); tile_click(page,1); assert qty_info(page)[0]=='5'; tile_click(page,0)
        type_qty(page,'1'); assert qty_info(page)[0]=='1'
        p1=price(page); tile_click(page,1); assert qty_info(page)[0]=='2',qty_info(page)
        p2=price(page); assert num(p2)>num(p1),(p1,p2)
        tile_click(page,0); assert qty_info(page)[0]=='1',qty_info(page)
        assert price(page)==p1
        # --- powrót do 2 przy dwustronnym: jednostronny ustawia 1 (cena się zmienia), dwustronny znów 2
        type_qty(page,'3'); tile_click(page,1); assert qty_info(page)[0]=='3'      # 3 strony zostają
        type_qty(page,'2'); assert qty_info(page)[0]=='2' and page.locator('#digSide').input_value()=='Dwustronny'
        q2=price(page); tile_click(page,0); assert qty_info(page)[0]=='1',qty_info(page)
        assert num(price(page))<num(q2)
        tile_click(page,1); assert qty_info(page)[0]=='2' and price(page)==q2
        # --- dwustronny + wpisane 1 → kalkulator podnosi do 2; powrót do jednostronnego znów daje 1 (kiedyś zostawało 2 i cena się nie zmieniała)
        type_qty(page,'1'); assert qty_info(page)[0]=='2',qty_info(page)
        tile_click(page,0); assert qty_info(page)[0]=='1',qty_info(page)
        tile_click(page,1); assert qty_info(page)[0]=='2',qty_info(page)
        # --- 2 strony wpisane przy jednostronnym: wybrany kafelek pokazuje cenę 2 stron (a nie 1), a przełączenie nie zmienia ceny
        tile_click(page,0); type_qty(page,'2'); assert page.locator('#digSide').input_value()=='Jednostronny' and qty_info(page)[0]=='2'
        assert tile_price(page,0)=='2,00 zł' and tile_price(page,1)=='2,00 zł',(tile_price(page,0),tile_price(page,1))
        assert price(page)=='2,00 zł'
        tile_click(page,1); assert qty_info(page)[0]=='2' and price(page)=='2,00 zł'
        # --- „12” wpisane z klawiatury: pierwsza cyfra „1” nie może zablokować wartości — zostaje 12
        type_qty(page,'12'); tile_click(page,0); assert qty_info(page)[0]=='12'; tile_click(page,1); assert qty_info(page)[0]=='12'
        assert not errors,errors
        print('PASS digital return to 1-2 pages width',width,flush=True); page.close()
    # --- liczba z wyszukiwarki nadal jest chroniona (2 strony jednostronnie z wyszukiwarki zostają 2)
    page,errors=boot(browser,1300)
    page.fill('#homeProductSearch','2 strony A4 kolor jednostronnie'); page.keyboard.press('Enter'); page.wait_for_timeout(1200)
    assert page.locator('#digSide').input_value()=='Jednostronny' and qty_info(page)[0]=='2'
    tile_click(page,1); tile_click(page,0); assert qty_info(page)[0]=='2',qty_info(page)
    assert not errors,errors; page.close()
    browser.close()
print('OK digital_return_pages_02623_browser')
