"""0.26.4: papier firmowy — ceny pokazane na kafelkach formatu (A4: 500 – 280, 1000 – 330, 2500 – 460 zł; nowy format A5: 190 / 230 / 280 zł),
wycena zgodna z cennikiem, migracja starego cennika (A4 350/545/715 → nowe ceny, dopisany A5; własne ceny zostają), angielski opis."""
import copy,json,re
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
PAGE='Koperty, teczki i papier firmowy'
KEY='preprint_90g_kolor_jednostronny'
WANT={'A4':{'500':280,'1000':330,'2500':460},'A5':{'500':190,'1000':230,'2500':280}}
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
def letterhead(page):
    go(page); setv(page,'#companyMaterialsType','Papier firmowy'); page.wait_for_timeout(500)
def fmt_prices(page): return dict((n,pr) for n,pr,_ in tiles(page,'companyMaterialsFormat'))

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    # --- cennik domyślny w pliku
    assert prices['papier_firmowy'][KEY]==WANT,prices['papier_firmowy'][KEY]
    for width in (1300,390):
        page,errors=boot(browser,width); letterhead(page)
        opts=page.eval_on_selector_all('#companyMaterialsFormat option','o=>o.map(x=>x.value)'); assert opts==['A4','A5'],opts
        # ceny stoją na kafelkach formatu (przy nakładzie 500 szt.)
        setv(page,'#companyMaterialsQty','500')
        tl=tiles(page,'companyMaterialsFormat'); assert [(n,pr) for n,pr,_ in tl]==[('A4','280,00 zł'),('A5','190,00 zł')],tl
        assert '210 × 297 mm' in tl[0][2] and '148 × 210 mm' in tl[1][2],tl
        # zmiana nakładu zmienia ceny na kafelkach, a wycena zgadza się z cennikiem
        for fmt in ('A4','A5'):
            for q in ('500','1000','2500'):
                setv(page,'#companyMaterialsFormat',fmt); setv(page,'#companyMaterialsQty',q)
                assert fmt_prices(page)=={f:money(WANT[f][q]) for f in ('A4','A5')},(fmt,q,fmt_prices(page))
                got=total(page); assert got==money(WANT[fmt][q]),(fmt,q,got)
        # kafelki nakładu nie mają cen (jak w innych produktach) — ceny są przy formacie
        assert all(pr is None for _,pr,_ in tiles(page,'companyMaterialsQty'))
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
        assert not errors,errors
        print('PASS letterhead tiles width',width,flush=True); page.close()
    # --- opis po angielsku
    page,errors=boot(browser,1300,lang='en'); letterhead(page)
    txt=page.locator('.content').inner_text()
    assert 'Letterhead paper in A4 or A5, 90 gsm preprint, single-sided colour printing.' in txt,txt[:600]
    assert not errors,errors; page.close()
    # --- migracja starego cennika: A4 350/545/715 (bez A5) → nowe ceny + A5
    old=copy.deepcopy(prices); old['papier_firmowy'][KEY]={'A4':{'500':350,'1000':545,'2500':715}}
    page,errors=boot(browser,1300,prices_override=old); letterhead(page); setv(page,'#companyMaterialsQty','1000')
    assert fmt_prices(page)=={'A4':'330,00 zł','A5':'230,00 zł'},fmt_prices(page)
    assert not errors,errors; page.close()
    # --- własne ceny A4 zostają, brakujące A5 jest dopisane
    custom=copy.deepcopy(prices); custom['papier_firmowy'][KEY]={'A4':{'500':400,'1000':600,'2500':800}}
    page,errors=boot(browser,1300,prices_override=custom); letterhead(page); setv(page,'#companyMaterialsQty','500')
    assert fmt_prices(page)=={'A4':'400,00 zł','A5':'190,00 zł'},fmt_prices(page)
    setv(page,'#companyMaterialsQty','2500'); assert fmt_prices(page)=={'A4':'800,00 zł','A5':'280,00 zł'},fmt_prices(page)
    assert not errors,errors; page.close()
    browser.close()
print('OK letterhead_0264_browser')
