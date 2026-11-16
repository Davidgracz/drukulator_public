"""0.26.6: Druk cyfrowy 24h — dwustronny zadruk jest pierwszy i domyślnie wybrany (kafelki, kolejność, wycena, asystent), a foliowanie ma rodzaje
„Brak / Z folią soft skin / Z folią błysk / Z folią mat” (nazwy w formularzu, w nagłówku sekcji, w opisie zamówienia i po angielsku);
w cenniku nadal Satyna / Błysk / Mat, ceny bez zmian."""
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
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width); go(page)
        # --- zadruk: dwustronny pierwszy i domyślny
        assert opts(page,'#digSide')==['Dwustronny','Jednostronny'],opts(page,'#digSide')
        assert page.locator('#digSide').input_value()=='Dwustronny'
        t=tiles(page,'digSide'); assert [n for n,_ in t][0].endswith('Dwustronny') or 'Dwustronny' in t[0][0],t
        assert [sel for _,sel in t]==[True,False],t
        # wycena na domyślnych ustawieniach = dwustronny (1 strona = 1 arkusz); ręczna zmiana na jednostronny działa
        setv(page,'#digColor','Kolorowy'); setv(page,'#digPaper','Papier kredowy 250 g'); setv(page,'#digQty','10'); settle(page)
        two=price(page); assert 'Zadruk' in quote_text(page) and 'Dwustronny' in quote_text(page),quote_text(page)[:300]
        setv(page,'#digSide','Jednostronny'); settle(page); one=price(page); assert 'Jednostronny' in quote_text(page)
        assert float(two.replace(' zł','').replace(',','.'))<float(one.replace(' zł','').replace(',','.')),(two,one)   # 10 stron dwustronnie = 5 arkuszy papieru zamiast 10, taniej
        setv(page,'#digSide','Dwustronny'); settle(page); assert price(page)==two
        # po przełączeniu usługi i powrocie znów dwustronny jest domyślny
        setv(page,'#digService','Ksero i druk'); setv(page,'#digService','Druk cyfrowy 24h'); settle(page)
        assert page.locator('#digSide').input_value()=='Dwustronny' and opts(page,'#digSide')[0]=='Dwustronny'
        # Arkuszowanie 24h bez zmian (domyślnie jednostronny, jak dotąd)
        setv(page,'#digService','Arkuszowanie 24h'); settle(page); assert page.locator('#digSide').input_value()=='Jednostronny',opts(page,'#digSide')
        assert not errors,errors
        print('PASS digital default sides width',width,flush=True); page.close()
    # --- foliowanie: nazwy i kolejność
    for width in (1300,390):
        page,errors=boot(browser,width); go(page)
        assert opts(page,'#digFoil')==['Brak','Satyna','Błysk','Mat'],opts(page,'#digFoil')
        labels=page.eval_on_selector_all('#digFoil option','o=>o.map(x=>x.textContent.trim())')
        assert labels==['Brak','Z folią soft skin','Z folią błysk','Z folią mat'],labels
        setv(page,'#digColor','Kolorowy'); setv(page,'#digPaper','Papier kredowy 250 g'); setv(page,'#digQty','40'); setv(page,'#digSide','Dwustronny'); settle(page)
        page.locator('#digFoilBox > summary').click(); settle(page)
        assert [n for n,_ in tiles(page,'digFoilField')]==labels,tiles(page,'digFoilField')
        base=None
        sheets=20
        for key,label in (('Satyna','Z folią soft skin'),('Błysk','Z folią błysk'),('Mat','Z folią mat')):
            setv(page,'#digFoil',key); settle(page)
            sel=[n for n,s in tiles(page,'digFoilField') if s]; assert sel==[label],(key,sel)
            page.locator('#digFoilBox > summary').click(); settle(page)           # zwinięty nagłówek pokazuje nazwę i cenę
            state=page.locator('#digFoilState').text_content().strip().replace('\u00a0',' ').replace('\u202f',' ')
            assert state==f'{label} · +{money(FOIL[key]*sheets)}',(key,state)
            tot=price(page); q=quote_text(page)
            assert f'Foliowanie' in q and label in q,(key,q[:500])
            assert f', {label.lower()}' in quote_text(page).lower()   # opis pozycji: „…, z folią mat”
            page.locator('#digFoilBox > summary').click(); settle(page)
        # brak folii: bez wiersza foliowania
        setv(page,'#digFoil','Brak'); settle(page); price(page); assert 'Z folią' not in quote_text(page)
        # cieńszy papier zeruje foliowanie
        setv(page,'#digFoil','Mat'); setv(page,'#digPaper','Standardowy 80 g'); settle(page); assert page.locator('#digFoil').input_value()=='Brak'
        assert not errors,errors
        print('PASS digital foil labels width',width,flush=True); page.close()
    # --- ceny foliowania bez zmian: 20 arkuszy × stawka
    page,errors=boot(browser,1300); go(page)
    setv(page,'#digColor','Kolorowy'); setv(page,'#digPaper','Papier kredowy 250 g'); setv(page,'#digQty','40'); setv(page,'#digSide','Dwustronny'); setv(page,'#digFoil','Brak'); settle(page)
    no_foil=float(price(page).replace(' zł','').replace(',','.'))
    for key,rate in FOIL.items():
        setv(page,'#digFoil',key); settle(page); got=float(price(page).replace(' zł','').replace(',','.'))
        assert abs(got-no_foil-rate*20)<0.005,(key,got,no_foil)
    assert not errors,errors; page.close()
    # --- angielski
    page,errors=boot(browser,1300,lang='en'); go(page)
    assert page.eval_on_selector_all('#digFoil option','o=>o.map(x=>x.textContent.trim())')==['None','With soft-skin film','With gloss film','With matt film']
    assert opts(page,'#digSide')==['Dwustronny','Jednostronny']
    names=[n for n,_ in tiles(page,'digSide')]; assert 'Double-sided' in names[0] and 'Single-sided' in names[1],names
    setv(page,'#digPaper','Papier kredowy 250 g'); setv(page,'#digFoil','Błysk'); settle(page); price(page)
    assert 'With gloss film' in quote_text(page),quote_text(page)[:400]
    assert not errors,errors; page.close()
    # --- asystent: pytanie o zadruk wydruku ma dwustronny na pierwszym miejscu; wpisane „jednostronny” zostaje jednostronne
    page,errors=boot(browser,1300)
    page.fill('#homeProductSearch','wydruk 100 stron A4 kolor'); page.keyboard.press('Enter'); page.wait_for_timeout(1200)
    answers=page.eval_on_selector_all('[data-assistant-answer]','els=>els.map(e=>[e.textContent.trim(),e.dataset.assistantAnswer])')
    assert answers[:2]==[['Dwustronny','dwustronny'],['Jednostronny','jednostronny']],answers
    assert 'Wydruk dwustronny czy jednostronny?' in page.locator('body').inner_text()
    assert not errors,errors; page.close()
    page,errors=boot(browser,1300)
    page.fill('#homeProductSearch','wydruk 100 stron A4 kolor jednostronny'); page.keyboard.press('Enter'); page.wait_for_timeout(1200)
    assert page.locator('#digSide').input_value()=='Jednostronny'
    assert not errors,errors; page.close()
    page,errors=boot(browser,1300)
    page.fill('#homeProductSearch','100 stron A4 kolor dwustronny'); page.keyboard.press('Enter'); page.wait_for_timeout(1200)
    assert page.locator('#digSide').input_value()=='Dwustronny'
    assert not errors,errors; page.close()
    browser.close()
print('OK digital_defaults_0266_browser')
