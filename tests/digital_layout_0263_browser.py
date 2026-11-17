"""0.26.3 / 0.26.7: Druk cyfrowy 24h — bindowanie (nad foliowaniem, tylko papier 80 g) i foliowanie (tylko papier od 250 g) w rozwijanych sekcjach (domyślnie zwiniętych),
foliowanie jako jedno pole Brak / Z folią soft skin / Z folią błysk / Z folią mat, rozmiar oprawy dobierany automatycznie do liczby kartek (kafelek podświetlony, bez możliwości zmiany),
stałe pozycje kafelków po każdej zmianie wyboru, ceny na kafelkach, brak „skoku” tekstu po zaznaczeniu (0.26.2), podpowiedź „większy nakład” dla kompletów."""
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
        # --- 0.26.7: bindowanie jest nad foliowaniem
        ids=page.eval_on_selector_all('.d24-extra','e=>e.map(x=>x.id)'); assert ids==['digBindBox','digFoilBox'],ids
        assert page.eval_on_selector('#digBindBox','e=>e.getBoundingClientRect().y')<page.eval_on_selector('#digFoilBox','e=>e.getBoundingClientRect().y')
        # --- sekcje są zwinięte: klient musi je rozwinąć; kafelki są niewidoczne, nagłówki widoczne
        assert not is_open('digFoilBox') and not is_open('digBindBox')
        assert not page.locator('#digFoilField').is_visible() and not page.locator('#digBindTypeField').is_visible() and not page.locator('#digBindVariantField').is_visible()
        assert page.locator('#digFoilBox > summary').is_visible() and page.locator('#digBindBox > summary').is_visible()
        # kreda 250 g: foliowanie dostępne, bindowanie tylko dla papieru 80 g (nagłówek obok nazwy sekcji)
        assert page.locator('#digFoilState').text_content().strip()=='Brak' and page.locator('#digBindState').text_content().strip()=='Tylko dla papieru 80 g'
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
        assert [(n,v) for n,v,_,_ in pr]==[('Brak','115,00 zł'),('Z folią soft skin','155,00 zł'),('Z folią błysk','145,00 zł'),('Z folią mat','145,00 zł')],pr   # 100 druk + 15 papier; folia 20 arkuszy × 2 / 1,5 / 1,5
        assert [a for *_,a in pr]==['true','false','false','false'] and all(v=='visible' for _,_,v,_ in pr)
        # bindowanie przy papierze 250 g: oba pola przygaszone, bez kwot i zaznaczenia, z komunikatem; nic nie da się kliknąć
        assert page.locator('#digBindTypeField.d24-field-inactive').count()==1 and page.locator('#digBindVariantField.d24-field-inactive').count()==1
        assert page.evaluate('document.getElementById("digBindTypeField").inert') and page.evaluate('document.getElementById("digBindVariantField").inert')
        assert 'tylko dla papieru 80 g' in page.locator('#digBindTypeField .d24-inactive-note').inner_text() and page.locator('#digBindTypeField .d24-inactive-note').is_visible()
        pr=prices_on(page,'digBindTypeField'); assert all(v=='hidden' for _,_,v,_ in pr),pr
        # --- układ: na komputerze cztery kafelki foliowania w jednym rzędzie, rodzaj oprawy | rozmiar obok siebie; na telefonie dwa rzędy po dwa
        foil_boxes=boxes(page,'#digFoilField .d24-smart-choice'); rows=sorted(set(round(b[1]) for b in foil_boxes))
        if width>600:
            assert len(rows)==1,foil_boxes
            assert label_y(page,'digBindTypeField')==label_y(page,'digBindVariantField')
        else:
            assert len(rows)==2 and [round(b[1]) for b in foil_boxes].count(rows[0])==2,foil_boxes
        # --- kafelki NIE przesuwają się po żadnej zmianie wyboru (przy rozwiniętych sekcjach); pozycje liczone względem nagłówka własnej sekcji
        def top(box): return page.eval_on_selector(f'#{box} > summary','e=>Math.round(e.getBoundingClientRect().y*10)/10')
        def rel(sel,box): return [[b[0],round(b[1]-top(box),1),b[2],b[3]] for b in boxes(page,sel)]
        foil_sel='#digFoilField .d24-smart-choice'
        start=rel(foil_sel,'digFoilBox'); start_label=round(label_y(page,'digFoilField')-top('digFoilBox'),1)
        def same_foil(tag):
            assert rel(foil_sel,'digFoilBox')==start,(tag,start,rel(foil_sel,'digFoilBox'))
            assert round(label_y(page,'digFoilField')-top('digFoilBox'),1)==start_label,tag
        for typ in ('Satyna','Błysk','Mat','Brak','Satyna'):
            setv(page,'#digFoil',typ); settle(page); same_foil('foil '+typ)
        # --- foliowanie dostępne tylko dla papieru od 250 g
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
                assert page.locator('#digFoilField .d24-inactive-note').is_visible() and 'tylko dla papieru od 250 g' in page.locator('#digFoilField .d24-inactive-note').inner_text()
                same_foil('inactive '+paper)
            else:
                same_foil('active '+paper)
        # kafelki nieaktywnego pola nie reagują na kliknięcie ani klawiaturę
        setv(page,'#digPaper','Papier kredowy 130 g'); settle(page)
        page.locator('#digFoilField .d24-smart-choice').nth(1).click(force=True); page.wait_for_timeout(200)
        assert page.locator('#digFoil').input_value()=='Brak'
        # --- ceny na kafelkach foliowania (kreda 250 g, 40 stron dwustronnie = 20 arkuszy)
        setv(page,'#digPaper','Papier kredowy 250 g'); setv(page,'#digFoil','Satyna'); settle(page)
        got=price(page); assert got=='155,00 zł',got      # 100 + 15 + 40
        # --- bindowanie (0.26.7): tylko papier 80 g; kafelki rodzaju oprawy mają kwoty (rozmiar dobrany do 20 kartek)
        setv(page,'#digPaper','Standardowy 80 g'); settle(page)
        assert page.locator('#digFoil').input_value()=='Brak'
        assert page.locator('#digBindTypeField.d24-field-inactive').count()==0 and not page.evaluate('document.getElementById("digBindTypeField").inert')
        assert page.locator('#digBindVariantField.d24-field-inactive').count()==1       # przy „Brak” rozmiary są przygaszone
        pr=prices_on(page,'digBindTypeField')
        assert [(n,v) for n,v,_,_ in pr]==[('Brak','100,00 zł'),('Oprawa miękka zaciskowa','112,50 zł'),('Bindowanie – spirala plastikowa','110,00 zł'),('Bindowanie – spirala metalowa','111,00 zł')],pr
        bind_sel='#digBindTypeField .d24-smart-choice'; bind_var='#digBindVariantField .d24-smart-choice'
        bstart=rel(bind_sel,'digBindBox')
        for typ in ('Bindowanie – spirala plastikowa','Oprawa miękka zaciskowa','Bindowanie – spirala metalowa','Brak','Bindowanie – spirala plastikowa'):
            setv(page,'#digBindType',typ); settle(page)
            assert rel(bind_sel,'digBindBox')==bstart,(typ,bstart,rel(bind_sel,'digBindBox'))
        # rozmiar jest dobrany sam i zablokowany: 20 kartek → spirala plastikowa do 14 mm
        pr=prices_on(page,'digBindVariantField'); names=[n for n,*_ in pr]
        assert names==['do 14 mm','do 19 mm','do 25 mm','do 32 mm','do 38 mm','do 51 mm'],names
        assert [a for *_,a in pr]==['true','false','false','false','false','false'],pr
        assert [v for _,v,_,_ in pr]==['110,00 zł',None,None,None,None,None],pr         # kwota tylko na dobranym rozmiarze
        assert page.evaluate('document.getElementById("digBindVariantField").inert') and page.locator('#digBindVariantField.d24-field-locked').count()==1
        assert page.locator('#digBindVariant').input_value()=='14 mm'
        # próba wyboru innego rozmiaru (mniejszego / większego) nic nie zmienia
        page.locator('#digBindVariantField .d24-smart-choice').nth(3).click(force=True); page.wait_for_timeout(200)
        assert page.locator('#digBindVariant').input_value()=='14 mm'
        assert price(page)=='110,00 zł'
        # --- zwinięte sekcje pokazują wybór i cenę
        page.locator('#digBindBox > summary').click(); settle(page)
        assert not is_open('digBindBox') and page.locator('#digBindState').is_visible()
        assert page.locator('#digBindState').text_content().strip()=='Bindowanie – spirala plastikowa, do 14 mm · +10,00 zł',page.locator('#digBindState').text_content()
        assert page.locator('#digFoilState').text_content().strip()=='Tylko dla papieru od 250 g'
        setv(page,'#digSets','3'); settle(page)
        assert page.locator('#digBindState').text_content().strip()=='Bindowanie – spirala plastikowa, do 14 mm · +30,00 zł',page.locator('#digBindState').text_content()
        setv(page,'#digSets','1')
        page.locator('#digBindBox > summary').click(); settle(page)
        # --- zmiana papieru na nie-80 g zeruje bindowanie (jak foliowanie na cieńszym papierze)
        setv(page,'#digPaper','Papier kredowy 130 g'); settle(page)
        assert page.locator('#digBindType').input_value()=='Brak' and page.locator('#digBindTypeField.d24-field-inactive').count()==1
        assert 'tylko dla papieru 80 g' in page.locator('#digBindTypeField .d24-inactive-note').inner_text()
        # --- tekst kafelka nie „skacze” po zaznaczeniu (odstęp od góry kafelka i zawijanie nazwy takie same wybrany/niewybrany)
        setv(page,'#digPaper','Standardowy 80 g'); settle(page)
        def metrics(field,idx):
            return page.evaluate("""([f,i])=>{const b=document.querySelectorAll('#'+f+' .d24-smart-choice')[i];const s=b.querySelector('strong');const rb=b.getBoundingClientRect(),rs=s.getBoundingClientRect();return [Math.round((rs.y-rb.y)*10)/10,Math.round(rs.height*10)/10,Math.round(rs.width*10)/10,b.getAttribute('aria-pressed')];}""",[field,idx])
        setv(page,'#digBindType','Bindowanie – spirala plastikowa'); settle(page)
        sel=metrics('digBindTypeField',2); setv(page,'#digBindType','Oprawa miękka zaciskowa'); settle(page); unsel=metrics('digBindTypeField',2)
        assert sel[3]=='true' and unsel[3]=='false'
        assert sel[:3]==unsel[:3],(sel,unsel)   # to samo położenie, wysokość i szerokość tekstu
        setv(page,'#digBindType','Brak'); settle(page)
        setv(page,'#digPaper','Papier kredowy 250 g'); settle(page)
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
