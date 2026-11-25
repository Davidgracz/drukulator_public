"""0.26.20v: nowy cennik — Folia podłogowa (do 3 m² 140 zł, powyżej 3 do 10 m² 130 zł, powyżej 10 m² 120 zł), Baner siatka mesh (ceny i progi jak baner powlekany),
menu bez „A3” w nazwie + format A4 (offset: jedno-/dwustronnie, laminowane: tylko dwustronnie). Test czyta ceny z data/prices.json i liczy oczekiwane wartości niezależnie."""
import json,re,math
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
B=prices['banery']
def money(v): return f'{v:.2f}'.replace('.',',')+' zł'
def boot(browser,width=1300,lang=None):
    page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=20000)
    page.evaluate('''()=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});navigator.sendBeacon=()=>true;}''')
    page.evaluate('''([pr,tr,ci])=>{window.fetch=async (u,opt)=>{u=String(u);return {ok:true,status:200,json:async()=>u.includes("prices.json")?pr:u.includes("search-terms.json")?tr:u.includes("case-items.json")?ci:{success:true}};}}''',[prices,terms,cases])
    for style in styles: page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
    for script in scripts: page.add_script_tag(content=(root/script).read_text())
    page.wait_for_selector('#homeProductSearch',timeout=15000)
    page.wait_for_timeout(250)
    if lang: page.evaluate('l=>window.DrukulatorI18n.setLanguage(l)',lang); page.wait_for_timeout(400)
    return page,errors
def go(page,name):
    page.locator(f'nav#navigation button[data-page="{name}"]').evaluate('(b)=>b.click()'); page.wait_for_timeout(400)
def setv(page,sel,v):
    page.locator(sel).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}',str(v))
    page.wait_for_timeout(200)
def calc(page,material,w,h,q):
    setv(page,'#bannerMaterial',material); setv(page,'#bannerWidth',w); setv(page,'#bannerHeight',h); setv(page,'#bannerQty',q)
    page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(250)
    err=page.locator('#quoteArea .alert, #quoteArea .error').count()
    txt=page.locator('#quoteArea').inner_text().replace(' ',' ').replace(' ',' ')
    big=page.locator('.price-big strong')
    return (big.first.text_content().replace(' ',' ').replace(' ',' ').replace(' ',' ').strip() if big.count() else None),txt
def expected(material,w,h,q):
    d=B[material]; area=w/100*h/100*q
    unit=d['cena_m2']
    for t in d.get('progi_cenowe',[]):
        if t['maks_m2'] is None or area<=t['maks_m2']: unit=t['cena_m2']; break
    return max(round(area*unit,2),d['minimum_zamowienia']),unit
# --- 0) dane
assert list(B)==['Baner powlekany 510g','Baner siatka mesh','Folia mat','Folia błysk','Folia + laminat','Folia OWH','Folia transparentna','Folia do podświetleń','Folia podłogowa','Folia z transferem'],list(B)
assert B['Folia podłogowa']['progi_cenowe']==[{'maks_m2':3,'cena_m2':140},{'maks_m2':10,'cena_m2':130},{'maks_m2':None,'cena_m2':120}]
assert B['Baner siatka mesh']==B['Baner powlekany 510g'],'mesh = ceny jak baner powlekany (progi, minimum, oczka)'
R=prices['restauracje_hotele']
assert list(R)==['Podkładki na tackę','Menu offset preprint 90 g','Menu laminowane','Prezenter trójkątny – stojak']
MO=R['Menu offset preprint 90 g']['warianty']; ML=R['Menu laminowane']['warianty']
assert MO['Jednostronnie']['formaty']['A4']=={'500':290,'1000':350,'2500':510} and MO['Dwustronnie']['formaty']['A4']=={'500':360,'1000':420,'2500':620}
assert list(ML)==['Dwustronnie'] and ML['Dwustronnie']['formaty']['A4']=={'10':90,'20':160,'30':240}
assert MO['Jednostronnie']['formaty']['A3']=={'500':480,'1000':580,'2500':860} and ML['Dwustronnie']['formaty']['A3']=={'10':170,'20':320,'30':450},'A3 bez zmian'
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width); go(page,'Folie i banery 24h')
        opts=page.locator('#bannerMaterial').evaluate('e=>[...e.options].map(o=>o.value)')
        assert opts==list(B),opts
        # --- 1) Folia podłogowa: progi 140 / 130 / 120, minimum 70
        cases_=[(100,100,1),(200,150,1),(200,150.1,1),(160,625,1),(160,625.1,1),(100,100,2),(100,100,4),(100,100,11),(10,10,1),(100,100,3),(100,100,10)]
        for w,h,q in cases_:
            got,txt=calc(page,'Folia podłogowa',w,h,q); exp,unit=expected('Folia podłogowa',w,h,q)
            assert got==money(exp),('podłogowa',w,h,q,got,money(exp),txt[:200])
        assert expected('Folia podłogowa',100,100,1)==(140,140) and expected('Folia podłogowa',200,150.1,1)[1]==130 and expected('Folia podłogowa',160,625.1,1)[1]==120 and expected('Folia podłogowa',10,10,1)[0]==70
        # tabela progów w szczegółach materiału
        tbl=page.locator('#tierTable').text_content().replace(' ',' ').replace(' ',' ')
        assert 'do 3 m²' in tbl and '140' in tbl and 'powyżej 3 do 10 m²' in tbl and '130' in tbl and 'powyżej 10 m²' in tbl and '120' in tbl,tbl
        # folia: krótszy bok poniżej 30 cm dozwolony (jak inne folie), bez oczek
        got,txt=calc(page,'Folia podłogowa',20,100,1); assert got==money(expected('Folia podłogowa',20,100,1)[0]),(got,txt[:160])
        assert page.locator('#bannerInfo').inner_text().count('Oczka w standardzie')==0
        # --- 2) Baner siatka mesh: te same ceny co baner powlekany, oczka w standardzie, min. krótszy bok 30 cm
        for w,h,q in [(100,100,1),(200,100,1),(300,100,1),(160,200,1),(150,200,1),(160,400,1),(100,100,5),(100,100,30),(10,100,1)]:
            if min(w,h)<30:
                setv(page,'#bannerMaterial','Baner siatka mesh'); setv(page,'#bannerWidth',w); setv(page,'#bannerHeight',h); setv(page,'#bannerQty',q)
                page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(250)
                assert page.locator('.price-big strong').count()==0 and 'Minimalny krótszy bok baneru to 30 cm' in page.locator('#content').inner_text(),'mesh min 30 cm'
                continue
            g1,_=calc(page,'Baner siatka mesh',w,h,q); g2,_=calc(page,'Baner powlekany 510g',w,h,q)
            assert g1==g2==money(expected('Baner siatka mesh',w,h,q)[0]),('mesh',w,h,q,g1,g2)
        setv(page,'#bannerMaterial','Baner siatka mesh')
        assert 'Oczka w standardzie' in page.locator('#bannerInfo').inner_text()
        tbl=page.locator('#tierTable').text_content().replace(' ',' ').replace(' ',' ')
        assert all(x in tbl for x in ('do 3 m²','80','powyżej 3 do 9 m²','70','powyżej 9 do 20 m²','60','powyżej 20 m²','50')),tbl
        # rabaty za ilość: 1 szt. 100×100 (80 zł/m²) vs 10 szt. (10 m² → 60 zł/m²)
        g,_=calc(page,'Baner siatka mesh',100,100,1); assert g==money(80)
        g,_=calc(page,'Baner siatka mesh',100,100,10); assert g==money(600)
        g,_=calc(page,'Baner siatka mesh',100,100,25); assert g==money(1250)
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
        assert not errors,errors
        print('PASS banery width',width,flush=True); page.close()
    # --- 3) Koszyk: nazwa materiału w opisie i w pozycji koszyka
    page,errors=boot(browser); go(page,'Folie i banery 24h')
    calc(page,'Baner siatka mesh',200,100,1)
    page.locator('#quoteArea button:has-text("koszyk")').first.evaluate('b=>b.click()'); page.wait_for_timeout(400)
    cart=page.evaluate('()=>JSON.parse(localStorage.getItem("drukulator_cart")||"[]")')
    assert cart and cart[-1]['title']=='Baner siatka mesh' and cart[-1]['meta']['material']=='Baner siatka mesh' and cart[-1]['price']==expected('Baner siatka mesh',200,100,1)[0],cart[-1] if cart else cart
    assert not errors,errors; page.close()
    # --- 4) Wyszukiwarka: „baner mesh”, „folia podłogowa” trafiają we właściwy materiał
    for query,mat,w,h,q in (('baner mesh 150x100 cm 2 szt','Baner siatka mesh',150,100,2),('baner siatka mesh 120x300 1 szt','Baner siatka mesh',120,300,1),('mesh 100x100 3 szt','Baner siatka mesh',100,100,3),
                            ('folia podłogowa 100x200 cm 2 szt','Folia podłogowa',100,200,2),('folia podlogowa 150x150 1 szt','Folia podłogowa',150,150,1),
                            ('baner 150x100 2 szt','Baner powlekany 510g',150,100,2),('folia mat 100x100 3 szt','Folia mat',100,100,3)):
        page,errors=boot(browser)
        page.fill('#homeProductSearch',query); page.keyboard.press('Enter'); page.wait_for_timeout(900)
        got=page.evaluate('()=>document.getElementById("bannerMaterial")?.value')
        assert got==mat,(query,got)
        assert page.locator('#bannerWidth').input_value()==str(w) and page.locator('#bannerHeight').input_value()==str(h),(query,page.locator('#bannerWidth').input_value(),page.locator('#bannerHeight').input_value())
        assert page.locator('#bannerQty').input_value()==str(q),(query,page.locator('#bannerQty').input_value())
        assert page.locator('.price-big strong').first.text_content().replace(' ',' ').replace(' ',' ').replace(' ',' ').strip()==money(expected(mat,w,h,q)[0]),query
        assert not errors,errors; page.close()
    # --- 5) Menu: offset A3/A4 i laminowane
    page,errors=boot(browser); go(page,'Restauracje, hotele')
    def hq(): return page.locator('.price-big strong').first.text_content().replace(' ',' ').replace(' ',' ').replace(' ',' ').strip()
    def hcalc(typ,var,fm,q):
        setv(page,'#hospitalityType',typ)
        setv(page,'#hospitalityVariant',var); setv(page,'#hospitalityFormat',fm); setv(page,'#hospitalityQty',q)
        page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(250); return hq()
    for var in ('Jednostronnie','Dwustronnie'):
        for fm in ('A3','A4'):
            for q,v in MO[var]['formaty'][fm].items(): assert hcalc('Menu offset preprint 90 g',var,fm,q)==money(v),(var,fm,q)
    for fm in ('A3','A4'):
        for q,v in ML['Dwustronnie']['formaty'][fm].items(): assert hcalc('Menu laminowane','Dwustronnie',fm,q)==money(v),(fm,q)
    setv(page,'#hospitalityType','Menu laminowane')
    assert page.locator('#hospitalityVariant').evaluate('e=>[...e.options].map(o=>o.text.trim())')==['Dwustronnie'] and page.locator('#hospitalityFormat').evaluate('e=>[...e.options].map(o=>o.value)')==['A3','A4']
    setv(page,'#hospitalityType','Menu offset preprint 90 g')
    assert page.locator('#hospitalityFormat').evaluate('e=>[...e.options].map(o=>o.value)')==['A3','A4']
    # opis wariantu i koszyk
    setv(page,'#hospitalityVariant','Dwustronnie'); setv(page,'#hospitalityFormat','A4'); setv(page,'#hospitalityQty','1000')
    assert 'Formaty A3 i A4' in page.locator('#hospitalityInfo').inner_text()
    page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(250)
    page.locator('#quoteArea button:has-text("koszyk")').first.evaluate('b=>b.click()'); page.wait_for_timeout(400)
    it=page.evaluate('()=>JSON.parse(localStorage.getItem("drukulator_cart")||"[]")')[-1]
    assert it['title']=='Menu offset preprint 90 g' and it['description']=='Dwustronnie, format A4, 1000 szt.' and it['price']==420,it
    assert not errors,errors; page.close()
    # wyszukiwarka: menu A4
    page,errors=boot(browser); page.fill('#homeProductSearch','menu a4 500 szt'); page.keyboard.press('Enter'); page.wait_for_timeout(900)
    assert page.evaluate('()=>document.getElementById("hospitalityType")?.value')=='Menu offset preprint 90 g',page.evaluate('()=>document.getElementById("hospitalityType")?.value')
    assert not errors,errors; page.close()
    # --- 6) angielski: nowe nazwy przetłumaczone
    page,errors=boot(browser,lang='en'); go(page,'Folie i banery 24h')
    txt=page.locator('#bannerMaterial').evaluate('e=>[...e.options].map(o=>o.text.trim())')
    assert 'Mesh banner' in txt and 'Floor film' in txt,txt
    go(page,'Restauracje, hotele')
    txt=page.locator('#hospitalityType').evaluate('e=>[...e.options].map(o=>o.text.trim())')
    assert 'Menu, 90 gsm offset preprint' in txt and 'Laminated menu' in txt,txt
    assert not errors,errors; page.close()
    browser.close()
print('OK prices_folie_menu_02620_browser')
