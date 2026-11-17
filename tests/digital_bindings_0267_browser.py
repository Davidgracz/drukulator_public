"""0.26.7: Druk cyfrowy 24h — bindowanie nad foliowaniem i tylko dla papieru 80 g (foliowanie tylko od 250 g), napisy „Tylko dla papieru …” w nagłówkach sekcji,
rozmiar oprawy dobierany automatycznie do liczby kartek w komplecie (podświetlony, bez możliwości zmiany), komunikat przy przekroczeniu pojemności,
nowy cennik i pojemności opraw, migracja starszych cenników, angielski."""
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


import copy
ZAC='Oprawa miękka zaciskowa'; PLA='Bindowanie – spirala plastikowa'; MET='Bindowanie – spirala metalowa'
def selected(page):
    return page.evaluate("""()=>[...document.querySelectorAll('#digBindVariantField .d24-smart-choice')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.querySelector('strong').textContent.trim())""")
def money(v): return f'{v:.2f}'.replace('.',',')+' zł'
def fill(page,side,qty,sets='1',paper='Standardowy 80 g'):
    setv(page,'#digColor','Czarno-biały'); setv(page,'#digPaper',paper); setv(page,'#digSide',side); setv(page,'#digQty',str(qty)); setv(page,'#digSets',str(sets)); settle(page)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width); go(page)
        # kolejność i nagłówki: papier 80 g (domyślny) = bindowanie dostępne, foliowanie nie
        assert page.eval_on_selector_all('.d24-extra','e=>e.map(x=>x.id)')==['digBindBox','digFoilBox']
        assert page.locator('#digBindState').text_content().strip()=='Brak' and page.locator('#digFoilState').text_content().strip()=='Tylko dla papieru od 250 g'
        for paper in ('Papier kredowy 130 g','Papier kredowy 170 g','Papier kredowy 250 g','Papier kredowy 300 g','Papier kredowy 350 g'):
            setv(page,'#digPaper',paper)
            assert page.locator('#digBindState').text_content().strip()=='Tylko dla papieru 80 g',paper
            assert page.evaluate('document.getElementById("digBindTypeField").inert') and page.evaluate('document.getElementById("digBindVariantField").inert'),paper
            ok=paper in ('Papier kredowy 250 g','Papier kredowy 300 g','Papier kredowy 350 g')
            assert (page.locator('#digFoilState').text_content().strip()!='Tylko dla papieru od 250 g')==ok,paper
        # --- dobór rozmiaru do kartek (rozwinięta sekcja)
        setv(page,'#digPaper','Standardowy 80 g'); page.locator('#digBindBox > summary').click(); settle(page)
        assert page.locator('#digBindTypeField').is_visible() and not page.evaluate('document.getElementById("digBindTypeField").inert')
        setv(page,'#digBindType',PLA); fill(page,'Jednostronny',86)
        assert selected(page)==['do 14 mm'],selected(page)
        assert page.locator('#digBindNote').inner_text().strip()=='Kartek w jednym komplecie: 86. Rozmiar oprawy dobieramy automatycznie.',page.locator('#digBindNote').inner_text()
        names=[n for n,*_ in prices_on(page,'digBindVariantField')]; assert names==['do 14 mm','do 19 mm','do 25 mm','do 32 mm','do 38 mm','do 51 mm'],names
        details=page.eval_on_selector_all('#digBindVariantField .d24-smart-choice small','e=>e.map(x=>x.textContent.trim())'); assert details==['do 90 kartek','do 150 kartek','do 200 kartek','do 260 kartek','do 320 kartek','do 430 kartek'],details
        # zablokowane: kliknięcie innego rozmiaru (nawet wymuszone) nic nie zmienia; pole jest „tylko do odczytu”
        assert page.evaluate('document.getElementById("digBindVariantField").inert') and page.locator('#digBindVariantField.d24-field-locked').count()==1
        for i in range(6):
            page.locator('#digBindVariantField .d24-smart-choice').nth(i).click(force=True); page.wait_for_timeout(120)
        assert page.locator('#digBindVariant').input_value()=='14 mm' and selected(page)==['do 14 mm']
        look=page.evaluate("()=>[...document.querySelectorAll('#digBindVariantField .d24-smart-choice')].map(b=>[b.getAttribute('aria-pressed'),Number(getComputedStyle(b).opacity)])")
        assert look[0][1]==1 and all(o<1 for a,o in look if a=='false'),look           # dobrany jasny, pozostałe przygaszone
        # zmiana liczby stron / zadruku / kompletów przesuwa podświetlenie
        for side,qty,want in (('Jednostronny',90,'do 14 mm'),('Jednostronny',91,'do 19 mm'),('Jednostronny',150,'do 19 mm'),('Jednostronny',151,'do 25 mm'),('Jednostronny',430,'do 51 mm'),('Dwustronny',860,'do 51 mm'),('Dwustronny',182,'do 19 mm'),('Dwustronny',2,'do 14 mm')):
            fill(page,side,qty); assert selected(page)==[want],(side,qty,selected(page))
        fill(page,'Jednostronny',91,sets=3); assert selected(page)==['do 19 mm']   # komplety nie sumują kartek
        with_bind=price(page); setv(page,'#digBindType','Brak'); settle(page); without=price(page); setv(page,'#digBindType',PLA); settle(page)
        num=lambda t: float(t.replace(' zł','').replace(',','.'))
        assert abs(num(with_bind)-num(without)-36)<0.005,(with_bind,without)    # 3 komplety × 12 zł (do 19 mm)
        # --- rodzaje oprawy: dobór dla każdego
        fill(page,'Jednostronny',86)
        for typ,want,unit in ((ZAC,'do 10 mm',14.5),(PLA,'do 14 mm',10),(MET,'do 12,7 mm',15)):
            setv(page,'#digBindType',typ); settle(page); assert selected(page)==[want],(typ,selected(page))
            tot=price(page); q=quote_text(page)
            assert 'Bindowanie i oprawy' in q and typ in q and 'kartek' in q and re.search(r'Oprawa – cena\s*'+money(unit).replace('.',r'\.'),q),(typ,q[:600])
        # --- za dużo kartek: brak podświetlenia, komunikat, błąd przy wycenie
        setv(page,'#digBindType',PLA); fill(page,'Jednostronny',500)
        assert selected(page)==[] and page.locator('#digBindNote.d24-bind-note--warn').count()==1
        assert 'jest więcej niż mieści ta oprawa (maks. 430)' in page.locator('#digBindNote').inner_text()
        assert [v for _,v,_,_ in prices_on(page,'digBindTypeField')][2] is None       # kafelek oprawy, która nie pomieści dokumentu, nie ma kwoty
        page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(250)
        assert 'maks. 430' in quote_text(page) and 'Bindowanie' in quote_text(page),quote_text(page)[:400]
        assert 'za dużo kartek' in page.locator('#digBindState').text_content() or page.locator('#digBindBox').evaluate('e=>e.open')
        # inny rodzaj oprawy pomieści 500? (nie) — zaciskowa max 145
        setv(page,'#digBindType',ZAC); settle(page); assert selected(page)==[] and 'maks. 145' in page.locator('#digBindNote').inner_text()
        # po zmniejszeniu liczby stron wraca podświetlenie i wycena
        fill(page,'Jednostronny',20); assert selected(page)==['do 5 mm'] and page.locator('#digBindNote.d24-bind-note--warn').count()==0
        with_bind=price(page); setv(page,'#digBindType','Brak'); settle(page); without=price(page); setv(page,'#digBindType',ZAC); settle(page)
        assert abs(num(with_bind)-num(without)-12.5)<0.005,(with_bind,without)    # 1 komplet, do 5 mm
        # --- zmiana papieru na inny niż 80 g zeruje bindowanie
        setv(page,'#digPaper','Papier kredowy 170 g'); settle(page)
        assert page.locator('#digBindType').input_value()=='Brak' and page.evaluate('document.getElementById("digBindTypeField").inert')
        assert page.locator('#digBindTypeField .d24-inactive-note').is_visible()
        # --- koszyk: opis pozycji z dobranym rozmiarem
        setv(page,'#digPaper','Standardowy 80 g'); setv(page,'#digBindType',PLA); fill(page,'Jednostronny',86,sets=2)
        page.locator('#calculate').click(); page.wait_for_timeout(400)
        cart=json.loads(page.evaluate('localStorage.getItem("drukulator_cart")')); assert len(cart)==1
        d=cart[0]['description']; assert 'spirala plastikowa 14 mm × 2' in d and '86 str. × 2 kompl.' in d,d
        assert not errors,errors
        print('PASS bindings width',width,flush=True); page.close()
    # --- migracja: cennik bez tabel opraw dostaje domyślne; własne tabele zostają
    old=copy.deepcopy(prices); d=old['druk_cyfrowy_i_ksero']; del d['oprawy_ceny']; del d['oprawy_pojemnosc_kartek']
    page,errors=boot(browser,1300,prices_override=old); go(page)
    assert opts(page,'#digBindType')==['Brak',ZAC,PLA,MET]
    fill(page,'Jednostronny',86); setv(page,'#digBindType',PLA); assert selected(page)==['do 14 mm']
    assert price(page)
    assert not errors,errors; page.close()
    custom=copy.deepcopy(prices); c=custom['druk_cyfrowy_i_ksero']; c['oprawy_ceny'][PLA]={'20 mm':9.0,'30 mm':14.0}; c['oprawy_pojemnosc_kartek'][PLA]={'20 mm':100,'30 mm':250}
    page,errors=boot(browser,1300,prices_override=custom); go(page)
    fill(page,'Jednostronny',120); setv(page,'#digBindType',PLA); settle(page)
    assert selected(page)==['do 30 mm'] and [n for n,*_ in prices_on(page,'digBindVariantField')]==['do 20 mm','do 30 mm']
    assert page.locator('#digBindState').text_content().strip().startswith('Bindowanie – spirala plastikowa, do 30 mm · +14,00 zł'),page.locator('#digBindState').text_content()
    assert not errors,errors; page.close()
    # --- „Oprawa prac” nie zmieniła się (stary cennik z pełną listą rozmiarów)
    page,errors=boot(browser,1300); go(page,'Oprawa prac'); settle(page)
    assert page.eval_on_selector_all('#bindType option','o=>o.map(x=>x.value)')[0]=='Oprawa kanałowa twarda A4'
    setv(page,'#bindType',PLA); assert page.eval_on_selector_all('#bindVariant option','o=>o.map(x=>x.value)')[:3]==['12,5 mm','14 mm','16 mm']
    assert not errors,errors; page.close()
    # --- angielski
    page,errors=boot(browser,1300,lang='en'); go(page)
    assert page.locator('#digFoilState').text_content().strip()=='Only for paper from 250 g'
    setv(page,'#digPaper','Papier kredowy 130 g'); assert page.locator('#digBindState').text_content().strip()=='Only for 80 gsm paper'
    setv(page,'#digPaper','Standardowy 80 g'); page.locator('#digBindBox > summary').click(); setv(page,'#digBindType',PLA); fill(page,'Jednostronny',86)
    names=[n for n,*_ in prices_on(page,'digBindVariantField')]; assert names[:2]==['up to 14 mm','up to 19 mm'],names
    assert page.eval_on_selector_all('#digBindVariantField .d24-smart-choice small','e=>e.map(x=>x.textContent.trim())')[0]=='up to 90 sheets'
    assert page.locator('#digBindNote').inner_text().strip()=='Sheets in one set: 86. The binding size is chosen automatically.'
    assert 'Binding is available only for 80 gsm paper.' in page.locator('#digBindTypeField').evaluate('e=>e.textContent')
    fill(page,'Jednostronny',500); page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(250)
    assert 'exceeds the capacity of the binding' in quote_text(page) and 'Plastic coil binding' in quote_text(page),quote_text(page)[:400]
    assert not errors,errors; page.close()
    browser.close()
print('OK digital_bindings_0267_browser')
