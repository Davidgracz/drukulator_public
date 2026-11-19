"""0.26.11: Naklejki, etykiety i magnesy — minimalny wymiar 20 × 20 mm (pola formularza, komunikaty, wycena, wyszukiwarka/asystent); maksimum 500 mm bez zmian."""
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
PAGE='Naklejki, etykiety i magnesy'
def err_text(page): return page.locator('#stickInfo, #quoteArea, .alert, .toast').all_inner_texts()
def calc(page):
    page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(300)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width); go(page,PAGE)
        assert page.locator('#stickProduct').input_value()=='Naklejki, etykiety',page.locator('#stickProduct').input_value()
        assert page.locator('#stickWidth').get_attribute('min')=='20' and page.locator('#stickHeight').get_attribute('min')=='20'
        assert page.locator('#stickWidth').get_attribute('max')=='500'
        info=page.locator('#stickInfo').inner_text()
        assert 'Minimalny wymiar: 20 × 20 mm' in info and '30 × 30' not in info,info[:200]
        # 20 × 20 mm: jest cena, bez komunikatu o limicie
        setv(page,'#stickWidth','20'); setv(page,'#stickHeight','20'); setv(page,'#stickQty','100'); calc(page)
        assert page.locator('.price-big strong').count()>=1,quote_text(page)[:200]
        assert float(page.locator('.price-big strong').first.text_content().replace(' zł','').replace('\xa0','').replace('\u202f','').replace(',','.'))>0
        assert 'Minimalny wymiar naklejki' not in page.locator('body').inner_text()
        # 19 mm: czytelny komunikat o nowym limicie
        setv(page,'#stickWidth','19'); calc(page)
        body=page.locator('body').inner_text()
        assert 'Minimalny wymiar naklejki to 20 × 20 mm.' in body,body[-400:]
        # 501 mm: komunikat o maksimum
        setv(page,'#stickWidth','501'); calc(page)
        assert 'Maksymalny wymiar naklejki to 500 × 500 mm.' in page.locator('body').inner_text()
        assert not errors,errors
        print('PASS sticker min 20 width',width,flush=True); page.close()
    # --- wyszukiwarka / asystent: 20x20 mm trafia do formularza z wymiarami 20 × 20; 19x19 nie
    page,errors=boot(browser,1300)
    page.fill('#homeProductSearch','naklejki 20x20 mm 100 szt'); page.keyboard.press('Enter'); page.wait_for_timeout(1500)
    assert page.locator('#stickWidth').count()==1 and page.locator('#stickWidth').input_value()=='20' and page.locator('#stickHeight').input_value()=='20',(page.locator('#stickWidth').count())
    assert not errors,errors; page.close()
    page,errors=boot(browser,1300)
    page.fill('#homeProductSearch','naklejki 15x15 mm 100 szt'); page.keyboard.press('Enter'); page.wait_for_timeout(1500)
    assert not (page.locator('#stickWidth').count()==1 and page.locator('#stickWidth').input_value()=='15')
    assert not errors,errors; page.close()
    # --- asystent pyta o wymiary i podaje nowy zakres
    page,errors=boot(browser,1300)
    page.fill('#homeProductSearch','naklejki 100 szt'); page.keyboard.press('Enter'); page.wait_for_timeout(1500)
    assert 'od 20 × 20 do 500 × 500 mm' in page.locator('body').inner_text() or page.locator('#stickWidth').count()==1,page.locator('body').inner_text()[:300]
    assert not errors,errors; page.close()
    browser.close()
print('OK sticker_min20_02611_browser')
