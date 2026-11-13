"""0.26.3: Druk cyfrowy 24h — foliowanie i bindowanie w rozwijanych sekcjach (domyślnie zwiniętych), foliowanie jako jedno pole
Brak / Satyna / Błysk / Mat tylko dla kredy od 250 g, stałe pozycje kafelków po każdej zmianie wyboru, ceny na kafelkach,
brak „skoku” tekstu po zaznaczeniu (0.26.2), podpowiedź „większy nakład” dla kompletów."""
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
        setv(page,'#digColor','Kolorowy'); setv(page,'#digFormat','A4'); setv(page,'#digSide','Dwustronny'); setv(page,'#digPaper','Papier kredowy 250 g'); setv(page,'#digQty','40'); settle(page)
        is_open=lambda box: page.evaluate('id=>document.getElementById(id).open',box)
        # --- sekcje są zwinięte: klient musi je rozwinąć; kafelki są niewidoczne, nagłówki widoczne
        assert not is_open('digFoilBox') and not is_open('digBindBox')
        assert not page.locator('#digFoilField').is_visible() and not page.locator('#digBindTypeField').is_visible() and not page.locator('#digBindVariantField').is_visible()
        assert page.locator('#digFoilBox > summary').is_visible() and page.locator('#digBindBox > summary').is_visible()
        assert page.locator('#digFoilState').text_content().strip()=='Brak' and page.locator('#digBindState').text_content().strip()=='Brak'
        assert page.locator('#digFoilBox').evaluate('e=>e.getBoundingClientRect().width')>=page.locator('#digSets').evaluate('e=>e.closest(".form-grid").getBoundingClientRect().width')-2   # na całą szerokość formularza
        # kliknięcie rozwija i zwija; klawiatura (Enter) też
        page.locator('#digFoilBox > summary').click(); assert is_open('digFoilBox') and page.locator('#digFoilField').is_visible() and not is_open('digBindBox')
        page.locator('#digFoilBox > summary').click(); assert not is_open('digFoilBox')
        page.locator('#digBindBox > summary').focus(); page.keyboard.press('Enter'); assert is_open('digBindBox')
        page.keyboard.press('Enter'); assert not is_open('digBindBox')
        page.locator('#digFoilBox > summary').click(); page.locator('#digBindBox > summary').click(); settle(page)
        assert is_open('digFoilBox') and is_open('digBindBox')
        assert page.locator('#digFoilState').is_hidden() and page.locator('#digBindState').is_hidden()   # po rozwinięciu wybór widać na kafelkach
        assert page.locator('#digBindCopies').count()==0 and 'Liczba opraw' not in page.locator('#digSets').evaluate('e=>e.closest(".form-grid").innerText')
        # --- foliowanie: jedno pole, bez podziału na jedno- i dwustronne; ceny na kafelkach (cały koszyk po wyborze danej opcji)
        assert not page.locator('#digFoilField.d24-field-inactive').count()
        pr=prices_on(page,'digFoilField')
        assert [(n,v) for n,v,_,_ in pr]==[('Brak','115,00 zł'),('Satyna','155,00 zł'),('Błysk','145,00 zł'),('Mat','145,00 zł')],pr   # 100 druk + 15 papier; folia 20 arkuszy × 2 / 1,5 / 1,5
        assert [a for *_,a in pr]==['true','false','false','false'] and all(v=='visible' for _,_,v,_ in pr)
        pr=prices_on(page,'digBindTypeField')
        assert [(n,v) for n,v,_,_ in pr]==[('Brak','115,00 zł'),('Oprawa miękka zaciskowa','124,90 zł'),('Bindowanie – spirala plastikowa','121,50 zł'),('Bindowanie – spirala metalowa','122,00 zł')],pr
        # rozmiar oprawy: przy „Brak” pole stoi na miejscu, jest przygaszone, bez kwot
        assert page.locator('#digBindVariantField.d24-field-inactive').count()==1 and page.evaluate('document.getElementById("digBindVariantField").inert')
        # --- układ: na komputerze cztery kafelki foliowania w jednym rzędzie, rodzaj oprawy | rozmiar obok siebie; na telefonie dwa rzędy po dwa
        foil_boxes=boxes(page,'#digFoilField .d24-smart-choice'); rows=sorted(set(round(b[1]) for b in foil_boxes))
        if width>600:
            assert len(rows)==1,foil_boxes
            assert label_y(page,'digBindTypeField')==label_y(page,'digBindVariantField')
        else:
            assert len(rows)==2 and [round(b[1]) for b in foil_boxes].count(rows[0])==2,foil_boxes
        # --- kafelki NIE przesuwają się po żadnej zmianie wyboru (przy rozwiniętych sekcjach)
        # pozycje liczone względem nagłówka sekcji „Foliowanie” (wyżej na stronie wysokość kafelków papieru zależy od jego opisu)
        top=lambda: page.eval_on_selector('#digFoilBox > summary','e=>Math.round(e.getBoundingClientRect().y*10)/10')
        rel=lambda sel: [[b[0],round(b[1]-top(),1),b[2],b[3]] for b in boxes(page,sel)]
        fixed=['#digFoilField .d24-smart-choice','#digBindTypeField .d24-smart-choice']
        start={sel:rel(sel) for sel in fixed}; start_labels={f:round(label_y(page,f)-top(),1) for f in ('digFoilField','digBindTypeField','digBindVariantField')}
        variant_xy=page.eval_on_selector('#digBindVariantField > label','e=>{const r=e.getBoundingClientRect();return [r.x,r.y]}'); variant_xy=[variant_xy[0],round(variant_xy[1]-top(),1)]
        def same(tag):
            for sel in fixed: assert rel(sel)==start[sel],(tag,sel,start[sel],rel(sel))
            assert {f:round(label_y(page,f)-top(),1) for f in start_labels}==start_labels,(tag,)
            xy=page.eval_on_selector('#digBindVariantField > label','e=>{const r=e.getBoundingClientRect();return [r.x,r.y]}')
            assert [xy[0],round(xy[1]-top(),1)]==variant_xy,tag
        for typ in ('Satyna','Błysk','Mat','Brak','Satyna'):
            setv(page,'#digFoil',typ); settle(page); same('foil '+typ)
        for typ in ('Bindowanie – spirala plastikowa','Oprawa miękka zaciskowa','Bindowanie – spirala metalowa','Brak','Bindowanie – spirala plastikowa'):
            setv(page,'#digBindType',typ); settle(page); same('bind '+typ)
        # zmiana papieru na cieńszy (foliowanie niedostępne) i z powrotem też nie rusza kafelków
        setv(page,'#digPaper','Papier kredowy 130 g'); settle(page); same('paper 130')
        setv(page,'#digPaper','Papier kredowy 300 g'); settle(page); same('paper 300')
        # --- foliowanie dostępne tylko dla kredy od 250 g
        setv(page,'#digFoil','Mat'); settle(page)
        assert page.locator('#digFoil').input_value()=='Mat'
        for paper,ok in (('Standardowy 80 g',False),('Papier kredowy 130 g',False),('Papier kredowy 170 g',False),('Papier kredowy 250 g',True),('Papier kredowy 300 g',True),('Papier kredowy 350 g',True)):
            setv(page,'#digPaper',paper); settle(page)
            assert (page.locator('#digFoilField.d24-field-inactive').count()==0)==ok,(paper,ok)
            assert page.evaluate('document.getElementById("digFoilField").inert')==(not ok),paper
            if not ok:
                assert page.locator('#digFoil').input_value()=='Brak',paper   # zmiana na cieńszy papier zeruje foliowanie
                pr=prices_on(page,'digFoilField'); assert all(v=='hidden' for _,_,v,_ in pr) and [a for *_,a in pr]==['true','false','false','false'],pr   # przygaszone: bez kwot
                look=page.evaluate("()=>[...document.querySelectorAll('#digFoilField .d24-smart-choice')].map(b=>[getComputedStyle(b).boxShadow,getComputedStyle(b,'::before').content])")
                assert all(sh=='none' and c=='none' for sh,c in look),look          # i bez zaznaczenia / ✓
                assert page.locator('#digFoilField .d24-inactive-note').is_visible() and 'tylko dla papieru kredowego 250 g' in page.locator('#digFoilField .d24-inactive-note').inner_text()
                same('inactive '+paper)
            else:
                same('active '+paper)
        # kafelki nieaktywnego pola nie reagują na kliknięcie ani klawiaturę
        setv(page,'#digPaper','Papier kredowy 130 g'); settle(page)
        page.locator('#digFoilField .d24-smart-choice').nth(1).click(force=True); page.wait_for_timeout(200)
        assert page.locator('#digFoil').input_value()=='Brak'
        # --- ceny na kafelkach rozmiaru oprawy (kreda 250 g, folia Satyna 20 × 2 zł, druk 100 + papier 15)
        setv(page,'#digPaper','Papier kredowy 250 g'); setv(page,'#digFoil','Satyna'); setv(page,'#digBindType','Bindowanie – spirala plastikowa'); settle(page)
        assert page.locator('#digBindVariantField.d24-field-inactive').count()==0
        pr=prices_on(page,'digBindVariantField'); names=[n for n,*_ in pr]
        assert names==['12,5 mm','14 mm','16 mm','19 mm','25 mm','32 mm','38 mm','51 mm'],names
        want={'12,5 mm':155+6.5,'14 mm':155+7,'16 mm':155+7.5,'19 mm':155+8.5,'25 mm':155+10.2,'32 mm':155+14,'38 mm':155+16,'51 mm':155+19}
        got={n:v for n,v,*_ in pr}
        assert got=={k:f'{v:.2f}'.replace('.',',')+' zł' for k,v in want.items()},got
        assert [a for *_,a in pr][0]=='true'
        same('size tiles')
        setv(page,'#digSets','2'); settle(page)    # 2 komplety: druk 80 stron 200 + papier 40 arkuszy 30 + folia 40 arkuszy 80 + oprawa 2 × 7
        got={n:v for n,v,*_ in prices_on(page,'digBindVariantField')}
        assert got['14 mm']=='324,00 zł',got
        setv(page,'#digSets','1'); settle(page)
        setv(page,'#digBindVariant','25 mm'); settle(page); same('variant 25')
        got=price(page); assert got=='165,20 zł',got      # 100 + 15 + 40 + 10,20
        # --- zwinięte sekcje pokazują wybór i cenę (jak na kafelkach)
        page.locator('#digFoilBox > summary').click(); page.locator('#digBindBox > summary').click(); settle(page)
        assert not is_open('digFoilBox') and not is_open('digBindBox')
        assert page.locator('#digFoilState').text_content().strip()=='Satyna · +40,00 zł',page.locator('#digFoilState').text_content()
        assert page.locator('#digBindState').text_content().strip()=='Bindowanie – spirala plastikowa, 25 mm · +10,20 zł',page.locator('#digBindState').text_content()
        assert page.locator('#digFoilState').is_visible() and page.locator('#digBindState').is_visible()
        setv(page,'#digSets','3'); settle(page)
        assert page.locator('#digFoilState').text_content().strip()=='Satyna · +120,00 zł' and page.locator('#digBindState').text_content().strip().endswith('· +30,60 zł'),(page.locator('#digFoilState').text_content(),page.locator('#digBindState').text_content())
        setv(page,'#digSets','1')
        # --- tekst kafelka nie „skacze” po zaznaczeniu (odstęp od góry kafelka i zawijanie nazwy takie same wybrany/niewybrany)
        page.locator('#digFoilBox > summary').click(); page.locator('#digBindBox > summary').click(); settle(page)
        def metrics(field,idx):
            return page.evaluate("""([f,i])=>{const b=document.querySelectorAll('#'+f+' .d24-smart-choice')[i];const s=b.querySelector('strong');const rb=b.getBoundingClientRect(),rs=s.getBoundingClientRect();return [Math.round((rs.y-rb.y)*10)/10,Math.round(rs.height*10)/10,Math.round(rs.width*10)/10,b.getAttribute('aria-pressed')];}""",[field,idx])
        setv(page,'#digBindType','Bindowanie – spirala plastikowa'); settle(page)
        sel=metrics('digBindTypeField',2); setv(page,'#digBindType','Oprawa miękka zaciskowa'); settle(page); unsel=metrics('digBindTypeField',2)
        assert sel[3]=='true' and unsel[3]=='false'
        assert sel[:3]==unsel[:3],(sel,unsel)   # to samo położenie, wysokość i szerokość tekstu
        setv(page,'#digFoil','Brak'); settle(page); sel=metrics('digFoilField',0)
        setv(page,'#digFoil','Mat'); settle(page); unsel=metrics('digFoilField',0)
        assert sel[3]=='true' and unsel[3]=='false' and sel[:3]==unsel[:3],(sel,unsel)
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),(width,page.evaluate('document.documentElement.scrollWidth'))
        assert not errors,errors
        page.close()
    # --- „Sprawdź większy nakład”: polem nakładu jest ilość kompletów (kliknięcie wywołane przez dispatchEvent — wywołanie .click() na tym samym przycisku
    #     zagnieżdżone w obsłudze kliknięcia jest przez przeglądarkę ignorowane, więc test by tej podpowiedzi nie zobaczył)
    page,errors=boot(browser,1300); go(page); settle(page)
    setv(page,'#digColor','Czarno-biały'); setv(page,'#digSide','Jednostronny'); setv(page,'#digPaper','Standardowy 80 g'); setv(page,'#digQty','8'); setv(page,'#digSets','2')
    page.evaluate("document.getElementById('calculate').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))")
    page.wait_for_timeout(500)
    card=page.locator('.best-value-card')
    assert card.count()>=1,'brak podpowiedzi większego nakładu'
    txt=card.first.text_content().replace('\u00a0',' ')
    assert 'kompl.' in txt and 'stron' not in txt.split('zamiast')[0],txt
    assert not errors,errors
    page.close()
    # --- po zmianie usługi na inną i z powrotem sekcje są znów zwinięte, a formularz bez błędów
    page,errors=boot(browser,1300); go(page)
    page.locator('#digFoilBox > summary').click(); assert page.evaluate('document.getElementById("digFoilBox").open')
    setv(page,'#digService','Ksero i druk'); assert page.locator('.d24-extra').count()==0
    setv(page,'#digService','Druk cyfrowy 24h'); assert page.locator('.d24-extra').count()==2 and not page.evaluate('document.getElementById("digFoilBox").open')
    assert not errors,errors
    browser.close()
print('OK digital_layout_0263_browser')
