"""0.26.12: Druk cyfrowy 24h — pole „Ilość sztuk” (dawniej „Ilość kompletów”) po lewej, „Liczba stron” po prawej; nowe przedziały cen czarno-białych (21–50 = 0,80 zł, 51–100 = 0,50 zł)."""
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
def rect(page,sel): return page.locator(sel).evaluate('e=>{const r=e.closest(".field").getBoundingClientRect();return [r.x,r.y,r.width,r.height]}')
def price_num(page):
    return float(price(page).replace(' zł','').replace(',','.'))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width); go(page)
        assert page.locator('label[for="digSets"]').inner_text().strip()=='Ilość sztuk' and page.locator('label[for="digQty"]').inner_text().strip()=='Liczba stron'
        form=page.locator('#digQty').evaluate('e=>e.closest(".form-grid").innerText')
        assert 'Ilość kompletów' not in form and 'komplet' not in page.locator('#digSetsHint').inner_text().lower(),form
        # układ: „Ilość sztuk” po lewej, „Liczba stron” po prawej (telefon: jedno pod drugim, najpierw sztuki)
        sx,sy,sw,sh=rect(page,'#digSets'); qx,qy,qw,qh=rect(page,'#digQty')
        if width>=900:
            assert abs(sy-qy)<8 and sx<qx and sx+sw<=qx+2,(sx,sy,qx,qy)
            px,py,pw,ph=rect(page,'#digPaper'); assert py+ph<=sy+2,(py,ph,sy)    # pod rzędem Zadruk / Rodzaj papieru
        else:
            assert sy<qy,(sy,qy)
        # kolejność w DOM i na liście pól
        order=page.eval_on_selector_all('#digSets, #digQty','els=>els.map(e=>e.id)'); assert order==['digSets','digQty'],order
        # podpowiedzi
        assert page.locator('#digSetsHint').inner_text().strip()=='Sztuka to jeden egzemplarz całego dokumentu.'
        setv(page,'#digSide','Dwustronny'); setv(page,'#digQty','40'); setv(page,'#digSets','2'); settle(page)
        assert page.locator('#digSheetsHint').inner_text().strip()=='Potrzebne arkusze A4: 40 (20 na sztukę)',page.locator('#digSheetsHint').inner_text()
        bind=[o for o in opts(page,'#digBindType') if o!='Brak'][0]
        page.locator('#digBindBox > summary').click(); setv(page,'#digPaper','Standardowy 80 g'); setv(page,'#digBindType',bind); settle(page)
        assert page.locator('#digSetsHint').inner_text().strip()=='Każda sztuka dostaje własną oprawę.'
        assert 'Kartek w jednej sztuce:' in page.locator('#digBindNote').inner_text(),page.locator('#digBindNote').inner_text()
        setv(page,'#digBindType','Brak'); settle(page)
        # wycena i szczegóły: „Ilość sztuk”
        setv(page,'#digSets','1'); setv(page,'#digSets','3'); setv(page,'#digSide','Jednostronny'); setv(page,'#digQty','10'); settle(page)
        price(page); q=quote_text(page)
        assert re.search(r'Ilość sztuk\s*3',q) and 'Ilość kompletów' not in q,q[:400]
        # sets=0: komunikat z nową nazwą
        setv(page,'#digSets','0'); page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(250); assert 'Ilość sztuk musi być większa od zera' in quote_text(page),quote_text(page)[:300]
        # --- ceny czarno-białe: przedziały 21–50 = 0,80 zł, 51–100 = 0,50 zł (papier 80 g, jednostronnie, 1 sztuka)
        setv(page,'#digColor','Czarno-biały'); setv(page,'#digPaper','Standardowy 80 g'); setv(page,'#digSide','Jednostronny'); setv(page,'#digSets','1'); settle(page)
        for pages,expected in ((20,20.0),(21,16.8),(30,24.0),(50,40.0),(51,25.5),(100,50.0),(101,30.3)):
            setv(page,'#digQty',str(pages)); settle(page)
            got=price_num(page); assert abs(got-expected)<0.006,(pages,got,expected)
        # kolorowy bez zmian: jeden przedział 21–100 po 2,50 zł
        setv(page,'#digColor','Kolorowy'); settle(page)
        for pages,expected in ((30,75.0),(51,127.5)):
            setv(page,'#digQty',str(pages)); settle(page)
            got=price_num(page); assert abs(got-expected)<0.006,(pages,got,expected)
        assert not errors,errors
        print('PASS digital fields + B/W tiers width',width,flush=True); page.close()
    # --- angielski
    page,errors=boot(browser,1300,lang='en'); go(page)
    txt=page.locator('#digQty').evaluate('e=>e.closest(".form-grid").innerText')
    assert 'Quantity' in txt and 'Number of pages' in txt and 'Number of sets' not in txt,txt
    assert page.locator('#digSetsHint').inner_text().strip()=='One piece is one copy of the whole document.',page.locator('#digSetsHint').inner_text()
    setv(page,'#digSide','Dwustronny'); setv(page,'#digQty','40'); setv(page,'#digSets','2'); settle(page)
    assert page.locator('#digSheetsHint').inner_text().strip()=='Sheets needed A4: 40 (20 per piece)' or 'per piece' in page.locator('#digSheetsHint').inner_text(),page.locator('#digSheetsHint').inner_text()
    assert not errors,errors; page.close()
    browser.close()
print('OK digital_fields_02612_browser')
