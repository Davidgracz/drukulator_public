"""0.26.1: Druk cyfrowy 24h — liczba stron zamiast kartek, brak papieru kolorowego i etykietowego, foliowanie,
bindowanie i oprawy (bez kanałowej), słowa kluczowe „cyfra/cyfrowy” w wyszukiwarce, tłumaczenie EN, układ na telefonie."""
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

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width)
        go(page)
        body=page.locator('main, #content, .content').first.inner_text()
        # --- pola: strony zamiast kartek
        assert page.locator('label[for="digQty"]').inner_text().strip()=='Liczba stron'
        assert 'kartek' not in page.locator('#digQty').evaluate('e=>e.closest(".form-grid").innerText')
        assert page.locator('#digQty').input_value()=='1'
        # --- papiery bez kolorowego i etykietowego (czarno-biały i kolor)
        for color in ('Czarno-biały','Kolorowy'):
            setv(page,'#digColor',color)
            papers=opts(page,'#digPaper')
            assert papers==['Standardowy 80 g','Papier kredowy 130 g','Papier kredowy 170 g','Papier kredowy 250 g','Papier kredowy 300 g','Papier kredowy 350 g'],papers
        # --- foliowanie i oprawy: stan początkowy
        assert opts(page,'#digFoilSide')==['Brak','Jednostronne','Dwustronne']
        assert inactive(page,'digFoilTypeField') and vis(page,'#digFoilTypeField')
        types=opts(page,'#digBindType')
        assert types==['Brak','Oprawa miękka zaciskowa','Bindowanie – spirala plastikowa','Bindowanie – spirala metalowa'],types
        assert not any('kanałowa' in t for t in types)
        assert inactive(page,'digBindVariantField') and vis(page,'#digBindVariantField') and page.locator('#digBindCopies').count()==0   # brak pola „Liczba opraw”
        assert page.locator('label[for="digSets"]').inner_text().strip()=='Ilość kompletów' and page.locator('#digSets').input_value()=='1'
        assert page.locator('label[for="digFoilSide"]').inner_text().strip()=='Foliowanie'
        assert page.locator('label[for="digBindType"]').inner_text().strip()=='Bindowanie i oprawy'
        # --- cena: 40 stron, dwustronnie, kolor, kreda 130 -> 20 arkuszy
        setv(page,'#digColor','Kolorowy'); setv(page,'#digFormat','A4'); setv(page,'#digSide','Dwustronny'); setv(page,'#digPaper','Papier kredowy 130 g'); setv(page,'#digQty','40')
        assert page.locator('#digSheetsHint').inner_text().strip()=='Potrzebne arkusze A4: 20',page.locator('#digSheetsHint').inner_text()
        got=price(page); assert got=='106,00 zł',got
        q=quote_text(page)
        assert 'Liczba stron' in q and 'Liczba arkuszy' in q and 'Foliowanie' not in q and 'Bindowanie' not in q
        assert re.search(r'Liczba arkuszy\s*20',q)
        setv(page,'#digSide','Jednostronny')
        assert page.locator('#digSheetsHint').inner_text().strip()=='Potrzebne arkusze A4: 40'
        assert price(page)=='112,00 zł'
        setv(page,'#digSide','Dwustronny'); setv(page,'#digQty','5'); assert 'arkusze A4: 3' in page.locator('#digSheetsHint').inner_text()
        setv(page,'#digFormat','A3'); assert 'arkusze A3: 3' in page.locator('#digSheetsHint').inner_text()
        setv(page,'#digFormat','A4'); setv(page,'#digQty','40')
        # --- foliowanie: wszystkie warianty
        expected={('Jednostronne','Satyna'):2,('Jednostronne','Błysk'):1.5,('Dwustronne','Satyna'):2.5,('Dwustronne','Błysk'):2}
        for (side,typ),per in expected.items():
            setv(page,'#digFoilSide',side)
            assert not inactive(page,'digFoilTypeField') and opts(page,'#digFoilType')==['Satyna','Błysk']
            setv(page,'#digFoilType',typ)
            want=106+per*20
            got=price(page)
            assert got==f'{want:.2f}'.replace('.',',')+' zł',(side,typ,got)
            q=quote_text(page); assert 'Foliowanie' in q and side in q and typ.lower() in q.lower()
        setv(page,'#digFoilSide','Brak'); assert inactive(page,'digFoilTypeField'); assert price(page)=='106,00 zł'
        # --- oprawy
        setv(page,'#digBindType','Bindowanie – spirala plastikowa')
        assert not inactive(page,'digBindVariantField')
        assert opts(page,'#digBindVariant')[0]=='12,5 mm'
        setv(page,'#digBindVariant','14 mm'); assert price(page)=='113,00 zł'
        # komplety: oprawa na każdy komplet, druk od wszystkich stron
        setv(page,'#digSets','2'); assert price(page)=='226,00 zł',price(page)   # 80 stron × 2,50 + 40 arkuszy × 0,30 + 2 × 7
        assert page.locator('#digSheetsHint').inner_text().strip()=='Potrzebne arkusze A4: 40 (20 na komplet)',page.locator('#digSheetsHint').inner_text()
        assert page.locator('#digSetsHint').inner_text().strip()=='Każdy komplet dostaje własną oprawę.'
        setv(page,'#digBindType','Oprawa miękka zaciskowa'); assert opts(page,'#digBindVariant')==['5 mm','10 mm','13 mm','16 mm']
        setv(page,'#digBindVariant','10 mm'); got=price(page); assert got=='235,80 zł',got   # 212 + 2 × 11,90
        setv(page,'#digBindType','Brak'); assert inactive(page,'digBindVariantField') and opts(page,'#digBindVariant')==[]
        assert page.locator('#digSetsHint').inner_text().strip()=='Komplet to jeden egzemplarz całego dokumentu.'
        got=price(page); assert got=='212,00 zł',got
        setv(page,'#digSets','0'); page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(200)
        assert 'Ilość kompletów musi być większa od zera' in quote_text(page),quote_text(page)
        setv(page,'#digSets','1')
        setv(page,'#digQty','0'); page.locator('#calculate').evaluate('b=>b.click()'); page.wait_for_timeout(200)
        assert 'Liczba stron musi być większa od zera' in quote_text(page),quote_text(page)
        setv(page,'#digQty','40')
        # --- wszystko razem (3 komplety) + koszyk
        setv(page,'#digSets','3'); setv(page,'#digFoilSide','Dwustronne'); setv(page,'#digFoilType','Satyna'); setv(page,'#digBindType','Bindowanie – spirala metalowa'); setv(page,'#digBindVariant','8 mm')
        got=price(page); assert got=='432,00 zł',got   # 120 stron × 2,00 + 60 arkuszy × 0,30 + 60 × 2,50 + 3 × 8
        q=quote_text(page)
        assert 'Bindowanie i oprawy' in q and '8 mm' in q and re.search(r'Foliowanie – cena\s*150,00 zł',q) and re.search(r'Oprawa – cena\s*24,00 zł',q),q
        assert re.search(r'Ilość kompletów\s*3',q) and re.search(r'Łącznie stron\s*120',q) and re.search(r'Liczba arkuszy\s*60',q),q
        page.locator('#calculate').click(); page.wait_for_timeout(400)   # zaufane kliknięcie = dodanie do koszyka
        cart=json.loads(page.evaluate('localStorage.getItem("drukulator_cart")'))
        assert len(cart)==1 and abs(cart[0]['price']-432)<0.001,cart
        d=cart[0]['description']; assert '40 str. × 3 kompl.' in d and 'foliowanie dwustronne satyna' in d and 'spirala metalowa 8 mm × 3' in d,d
        # --- inne usługi bez zmian
        go(page)
        setv(page,'#digService','Ksero i druk'); assert page.locator('label[for="digQty"], #digQty').count()>=1
        assert 'Liczba kopii' in page.locator('#digQty').evaluate('e=>e.closest(".form-grid").innerText')
        assert page.locator('#digFoilSide').count()==0 and page.locator('#digSets').count()==0
        setv(page,'#digService','Ksero książki'); setv(page,'#digColor',opts(page,'#digColor')[0]); assert price(page).endswith('zł')
        # --- przeskok z powrotem nie gubi pól
        setv(page,'#digService','Druk cyfrowy 24h'); assert page.locator('#digFoilSide').count()==1 and inactive(page,'digFoilTypeField') and page.locator('#digSets').input_value()=='1'
        # --- brak poziomego przewijania
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),(width,page.evaluate('document.documentElement.scrollWidth'))
        assert not errors,errors
        page.close()
    # --- wyszukiwarka: cyfra / cyfrowy itp.
    page,errors=boot(browser,1300)
    for query in ['cyfra','cyfrowy','cyfrowa','cyfrowe','cyfrowo','digital','wydruk cyfrowy','druk cyfrowy','cyfrowe druki','cyfrowy wydruk a4','cyfrowka']:
        page.locator('#homeProductSearch').fill(query); page.wait_for_timeout(250)
        first=page.locator('#homeSearchResults [data-home-search-page]').first.get_attribute('data-home-search-page')
        assert first==PAGE,(query,first)
    assert not errors,errors
    page.close()
    # --- migracja starego cennika (zapisanego w przeglądarce / na serwerze): papiery wycofane, foliowanie dopisane, własne ceny zostają
    import copy
    old=copy.deepcopy(prices); d=old['druk_cyfrowy_i_ksero']
    d['doplaty_do_papieru']={'Standardowy 80 g':0,'Papier kolorowy':0.3,'Papier etykietowy':2,**{k:v for k,v in d['doplaty_do_papieru'].items() if k!='Standardowy 80 g'}}
    del d['foliowanie']
    page,errors=boot(browser,1300,prices_override=old); go(page)
    assert 'Papier kolorowy' not in opts(page,'#digPaper') and 'Papier etykietowy' not in opts(page,'#digPaper')
    setv(page,'#digFoilSide','Dwustronne'); setv(page,'#digFoilType','Błysk'); setv(page,'#digQty','10'); setv(page,'#digSide','Jednostronny'); setv(page,'#digColor','Czarno-biały'); setv(page,'#digPaper','Standardowy 80 g')
    got=price(page); assert got=='30,00 zł',got   # 10 stron × 1 zł + 10 arkuszy × 2 zł
    assert not errors,errors
    page.close()
    custom=copy.deepcopy(prices); custom['druk_cyfrowy_i_ksero']['foliowanie']={'Jednostronne':{'Satyna':3.2},'Dwustronne':{}}
    page,errors=boot(browser,1300,prices_override=custom); go(page)
    setv(page,'#digFoilSide','Jednostronne'); assert opts(page,'#digFoilType')==['Satyna','Błysk']
    setv(page,'#digFoilType','Satyna'); setv(page,'#digQty','10'); setv(page,'#digSide','Jednostronny'); setv(page,'#digColor','Czarno-biały'); setv(page,'#digPaper','Standardowy 80 g')
    got=price(page); assert got=='42,00 zł',got   # 10 + 10 × 3,20 (własna cena zostaje)
    setv(page,'#digFoilSide','Dwustronne'); setv(page,'#digFoilType','Błysk'); got=price(page); assert got=='30,00 zł',got   # brakująca pozycja uzupełniona domyślną
    assert not errors,errors
    page.close()
    # --- angielski
    page,errors=boot(browser,1300,lang='en')
    go(page)
    txt=page.locator('#digQty').evaluate('e=>e.closest(".form-grid").innerText')
    for need in ('Number of pages','Number of sets','Lamination','Binding','Film type','Choose the binding type first.'):
        assert need in txt,(need,txt)
    assert 'Liczba stron' not in txt and 'Foliowanie' not in txt and 'Ilość kompletów' not in txt
    setv(page,'#digFoilSide','Jednostronne'); txt=page.locator('#digQty').evaluate('e=>e.closest(".form-grid").innerText')
    assert 'Film type' in txt and ('Satin' in page.locator('#digFoilType').evaluate('e=>e.innerText')),txt
    assert not errors,errors
    page.close()
    browser.close()
print('OK digital_pages_0261_browser')
