"""0.26.2: Druk cyfrowy 24h — stały układ foliowania i opraw (kafelki nie przesuwają się po wyborze), ceny na kafelkach foliowania,
rodzaju folii, rodzaju oprawy i rozmiaru oprawy / spirali, brak pola „Liczba opraw” (oprawa na każdy komplet), tekst kafelka
nie „skacze” po zaznaczeniu."""
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

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width); go(page)
        setv(page,'#digColor','Kolorowy'); setv(page,'#digFormat','A4'); setv(page,'#digSide','Dwustronny'); setv(page,'#digPaper','Standardowy 80 g'); setv(page,'#digQty','40'); settle(page)
        # --- układ 2 × 2 jest od początku: pola zależne są na miejscu, tylko przygaszone
        assert page.locator('#digFoilTypeField.d24-field-inactive').count()==1 and page.locator('#digBindVariantField.d24-field-inactive').count()==1
        assert page.evaluate('document.getElementById("digFoilTypeField").inert')
        assert page.locator('#digBindCopies').count()==0 and 'Liczba opraw' not in page.locator('#digSets').evaluate('e=>e.closest(".form-grid").innerText')
        if width>600:   # na komputerze: foliowanie | rodzaj folii oraz oprawa | rozmiar w tych samych wierszach
            fy=[label_y(page,f) for f in ('digFoilSideField','digFoilTypeField')]; by=[label_y(page,f) for f in ('digBindTypeField','digBindVariantField')]
            assert fy[0]==fy[1] and by[0]==by[1] and by[0]>fy[0],(fy,by)
        # ceny na kafelkach: foliowanie (domyślnie satyna), rodzaj folii, rodzaj oprawy
        pr=prices_on(page,'digFoilSideField'); assert [(n,v) for n,v,_,_ in pr]==[('Brak','100,00 zł'),('Jednostronne','140,00 zł'),('Dwustronne','150,00 zł')],pr
        assert [a for *_,a in pr]==['true','false','false']
        pr=prices_on(page,'digBindTypeField')
        assert [(n,v) for n,v,_,_ in pr]==[('Brak','100,00 zł'),('Oprawa miękka zaciskowa','109,90 zł'),('Bindowanie – spirala plastikowa','106,50 zł'),('Bindowanie – spirala metalowa','107,00 zł')],pr
        # kafelki rodzaju folii przy „Brak”: kwoty są w układzie (tej samej wysokości), ale ukryte, nic nie jest zaznaczone
        pr=prices_on(page,'digFoilTypeField'); assert [n for n,*_ in pr]==['Satyna','Błysk'] and all(v=='hidden' for _,_,v,_ in pr),pr
        look=page.evaluate('''()=>[...document.querySelectorAll('#digFoilTypeField .d24-smart-choice')].map(b=>[getComputedStyle(b).boxShadow,getComputedStyle(b,'::before').content])''')
        assert all(sh=='none' and c=='none' for sh,c in look),look   # przygaszone pole nie pokazuje zaznaczenia (ani ✓)
        # --- pozycje kafelków nie zmieniają się po wyborze
        fixed=['#digFoilSideField .d24-smart-choice','#digFoilTypeField .d24-smart-choice','#digBindTypeField .d24-smart-choice']
        start={sel:boxes(page,sel) for sel in fixed}; start_labels={f:label_y(page,f) for f in ('digFoilSideField','digFoilTypeField','digBindTypeField','digBindVariantField')}
        variant_xy=page.eval_on_selector('#digBindVariantField > label','e=>{const r=e.getBoundingClientRect();return [r.x,r.y]}')
        def same(tag):
            for sel in fixed: assert boxes(page,sel)==start[sel],(tag,sel,start[sel],boxes(page,sel))
            assert {f:label_y(page,f) for f in start_labels}==start_labels,(tag,)
            assert page.eval_on_selector('#digBindVariantField > label','e=>{const r=e.getBoundingClientRect();return [r.x,r.y]}')==variant_xy,tag
        for side in ('Jednostronne','Dwustronne','Brak','Dwustronne'):
            setv(page,'#digFoilSide',side); settle(page); same('foil '+side)
        setv(page,'#digFoilSide','Dwustronne'); settle(page)
        assert page.locator('#digFoilTypeField.d24-field-inactive').count()==0 and not page.evaluate('document.getElementById("digFoilTypeField").inert')
        pr=prices_on(page,'digFoilTypeField'); assert [(n,v,vis_) for n,v,vis_,_ in pr]==[('Satyna','150,00 zł','visible'),('Błysk','140,00 zł','visible')],pr
        assert [a for *_,a in prices_on(page,'digFoilTypeField')]==['true','false']
        for typ in ('Błysk','Satyna'):
            setv(page,'#digFoilType',typ); settle(page); same('type '+typ)
        setv(page,'#digFoilSide','Jednostronne'); settle(page)
        assert [(n,v) for n,v,*_ in prices_on(page,'digFoilSideField')]==[('Brak','100,00 zł'),('Jednostronne','140,00 zł'),('Dwustronne','150,00 zł')]
        assert [(n,v) for n,v,*_ in prices_on(page,'digFoilTypeField')]==[('Satyna','140,00 zł'),('Błysk','130,00 zł')]
        for typ in ('Bindowanie – spirala plastikowa','Oprawa miękka zaciskowa','Bindowanie – spirala metalowa','Brak','Bindowanie – spirala plastikowa'):
            setv(page,'#digBindType',typ); settle(page); same('bind '+typ)
        # rozmiar oprawy / spirali: ceny na kafelkach (druk 100 + folia jednostronna satyna 40 + oprawa)
        assert page.locator('#digBindVariantField.d24-field-inactive').count()==0
        pr=prices_on(page,'digBindVariantField'); names=[n for n,*_ in pr]
        assert names==['12,5 mm','14 mm','16 mm','19 mm','25 mm','32 mm','38 mm','51 mm'],names
        want={'12,5 mm':140+6.5,'14 mm':140+7,'16 mm':140+7.5,'19 mm':140+8.5,'25 mm':140+10.2,'32 mm':140+14,'38 mm':140+16,'51 mm':140+19}
        got={n:v for n,v,*_ in pr}
        assert got=={k:f'{v:.2f}'.replace('.',',')+' zł' for k,v in want.items()},got
        assert [a for *_,a in pr][0]=='true'
        setv(page,'#digSets','2'); settle(page)    # 2 komplety: druk 80 stron 200, folia 40 arkuszy 80, oprawa 2 ×
        got={n:v for n,v,*_ in prices_on(page,'digBindVariantField')}
        assert got['14 mm']=='294,00 zł',got   # druk 80 stron 200 + folia 40 arkuszy × 2 = 80 + oprawa 2 × 7 = 14
        setv(page,'#digSets','1'); settle(page)
        # wybór rozmiaru nie rusza reszty układu i zmienia sumę
        setv(page,'#digBindVariant','25 mm'); settle(page); same('variant 25')
        got=price(page); assert got=='150,20 zł',got
        # --- tekst kafelka nie „skacze” po zaznaczeniu (odstęp od góry kafelka i zawijanie nazwy takie same wybrany/niewybrany)
        def metrics(field,idx):
            return page.evaluate("""([f,i])=>{const b=document.querySelectorAll('#'+f+' .d24-smart-choice')[i];const s=b.querySelector('strong');const rb=b.getBoundingClientRect(),rs=s.getBoundingClientRect();return [Math.round((rs.y-rb.y)*10)/10,Math.round(rs.height*10)/10,Math.round(rs.width*10)/10,b.getAttribute('aria-pressed')];}""",[field,idx])
        setv(page,'#digBindType','Bindowanie – spirala plastikowa'); settle(page)
        sel=metrics('digBindTypeField',2); setv(page,'#digBindType','Oprawa miękka zaciskowa'); settle(page); unsel=metrics('digBindTypeField',2)
        assert sel[3]=='true' and unsel[3]=='false'
        assert sel[:3]==unsel[:3],(sel,unsel)   # to samo położenie, wysokość i szerokość tekstu
        setv(page,'#digFoilSide','Brak'); settle(page); sel=metrics('digFoilSideField',0)
        setv(page,'#digFoilSide','Dwustronne'); settle(page); unsel=metrics('digFoilSideField',0)
        assert sel[3]=='true' and unsel[3]=='false' and sel[:3]==unsel[:3],(sel,unsel)
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
        assert not errors,errors
        page.close()
    # --- angielski: ceny i układ bez zmian
    page,errors=boot(browser,1300,lang='en'); go(page); settle(page)
    assert page.locator('#digSetsHint').inner_text().strip()=='A set is one copy of the whole document.'
    setv(page,'#digSets','2'); setv(page,'#digQty','40'); setv(page,'#digSide','Dwustronny'); settle(page)
    assert 'Required sheets' in page.locator('#digSheetsHint').inner_text() and 'per set' in page.locator('#digSheetsHint').inner_text(),page.locator('#digSheetsHint').inner_text()
    assert not errors,errors
    # --- „Sprawdź większy nakład”: polem nakładu jest ilość kompletów (kliknięcie wywołane przez dispatchEvent — wywołanie .click() na tym samym przycisku
    #     zagnieżdżone w obsłudze kliknięcia jest przez przeglądarkę ignorowane, więc test by tej podpowiedzi nie zobaczył)
    page,errors=boot(browser,1300); go(page); settle(page)
    setv(page,'#digColor','Czarno-biały'); setv(page,'#digSide','Jednostronny'); setv(page,'#digPaper','Standardowy 80 g'); setv(page,'#digQty','8'); setv(page,'#digSets','2')
    page.evaluate("document.getElementById('calculate').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))")
    page.wait_for_timeout(500)
    card=page.locator('.best-value-card')
    assert card.count()>=1,'brak podpowiedzi większego nakładu'
    txt=card.first.text_content().replace(' ',' ')
    assert 'kompl.' in txt and 'stron' not in txt.split('zamiast')[0],txt
    assert not errors,errors
    browser.close()
print('OK digital_layout_0262_browser')
