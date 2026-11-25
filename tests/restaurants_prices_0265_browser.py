"""0.26.5 (zaktualizowany w 0.26.20v: menu bez „A3” w nazwie, dodany format A4): Restauracje, hotele — ceny na kafelkach formatu także dla podkładek na tackę, menu A3 (offset) i menu A3 laminowanego
(wcześniej przy jednej opcji formatu kafelek nie miał ceny); ceny zmieniają się z nakładem i zgadzają z cennikiem; inne produkty bez zmian."""
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
def choose(page,type_):
    setv(page,'#hospitalityType',type_); page.wait_for_timeout(400)
def fmt(page): return tiles(page,'hospitalityFormat')
PR=prices['restauracje_hotele']
def table(name):
    node=PR[name]
    while isinstance(node,dict) and not all(k.isdigit() for k in node): node=next(iter(node.values()))
    return node
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width); go(page)
        # 1) Podkładki na tackę — jeden format 40 × 30 cm, cena na kafelku zmienia się z nakładem
        choose(page,'Podkładki na tackę')
        for q,v in (('500',380),('1000',520),('2500',880)):
            setv(page,'#hospitalityQty',q); t=fmt(page)
            assert len(t)==1 and t[0][0].startswith('40 × 30 cm') and t[0][1]==money(v),(q,t)
            assert total(page)==money(v),(q,total(page))
        # 2) Menu offset (A3 i A4) — cena formatu zależy od wariantu (jedno-/dwustronnie) i nakładu
        choose(page,'Menu offset preprint 90 g')
        assert page.locator('#hospitalityType').evaluate("e=>[...e.options].map(o=>o.value)")==['Podkładki na tackę','Menu offset preprint 90 g','Menu laminowane','Prezenter trójkątny – stojak','Notesy kelnerskie','Bloczki samokopiujące'],'lista produktów'
        for var,fm,vals in (('Jednostronnie','A3',{'500':480,'1000':580,'2500':860}),('Dwustronnie','A3',{'500':630,'1000':780,'2500':1090}),
                            ('Jednostronnie','A4',{'500':290,'1000':350,'2500':510}),('Dwustronnie','A4',{'500':360,'1000':420,'2500':620})):
            setv(page,'#hospitalityVariant',var); setv(page,'#hospitalityFormat',fm)
            for q,v in vals.items():
                setv(page,'#hospitalityQty',q)
                t=dict((n.split(' ')[0],pr) for n,pr,_ in fmt(page))
                assert len(fmt(page))==2 and t[fm]==money(v),(var,fm,q,t)
                assert total(page)==money(v),(var,fm,q,total(page))
        # kafelki wariantu zachowują własne ceny
        vt=tiles(page,'hospitalityVariant'); assert all(pr for _,pr,_ in vt) and len(vt)==2,vt
        # 3) Menu laminowane — tylko dwustronnie, A3 i A4, nakład 10/20/30
        choose(page,'Menu laminowane')
        assert page.locator('#hospitalityVariant').evaluate("e=>[...e.options].map(o=>o.value)")==['Dwustronnie'],'tylko dwustronnie'
        for fm,vals in (('A3',(('10',170),('20',320),('30',450))),('A4',(('10',90),('20',160),('30',240)))):
            setv(page,'#hospitalityFormat',fm)
            for q,v in vals:
                setv(page,'#hospitalityQty',q)
                t=dict((n.split(' ')[0],pr) for n,pr,_ in fmt(page))
                assert len(fmt(page))==2 and t[fm]==money(v),(fm,q,t)
                assert total(page)==money(v),(fm,q,total(page))
        # 4) produkty z kilkoma formatami nadal mają ceny (bez zmian)
        choose(page,'Prezenter trójkątny – stojak'); t=fmt(page); assert len(t)==2 and all(pr for _,pr,_ in t),t
        choose(page,'Notesy kelnerskie'); t=fmt(page); assert len(t)==3 and all(pr for _,pr,_ in t),t
        # kafelki nakładu bez cen
        assert all(pr is None for _,pr,_ in tiles(page,'hospitalityQty'))
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
        assert not errors,errors
        print('PASS restaurants tiles width',width,flush=True); page.close()
    # 5) pozostałe strony bez zmian: koperty (3 formaty) i papier firmowy (2 formaty) nadal mają ceny na kafelkach
    page,errors=boot(browser,1300); page.locator('nav#navigation button[data-page="Koperty, teczki i papier firmowy"]').evaluate('b=>b.click()'); page.wait_for_timeout(400)
    setv(page,'#companyMaterialsType','Koperty z nadrukiem'); setv(page,'#companyMaterialsQty','500')
    t=tiles(page,'companyMaterialsFormat'); assert [n for n,_,_ in t]==['DL','C5','C6'] and all(pr for _,pr,_ in t),t
    setv(page,'#companyMaterialsType','Papier firmowy'); setv(page,'#companyMaterialsQty','500')
    assert [(n,pr) for n,pr,_ in tiles(page,'companyMaterialsFormat')]==[('A4','280,00 zł'),('A5','190,00 zł')]
    assert not errors,errors; page.close()
    # 6) angielski
    page,errors=boot(browser,1300,lang='en'); go(page); choose(page,'Podkładki na tackę'); setv(page,'#hospitalityQty','500')
    t=fmt(page); assert t[0][1]=='PLN 380.00' or '380' in t[0][1],t
    assert not errors,errors; page.close()
    browser.close()
print('OK restaurants_prices_0265_browser')
