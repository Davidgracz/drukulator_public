"""0.25.6: plakaty — bez rozmiaru w mm przy formatach (zostaje cm); pianki — kafelki formatów zachowują grafikę po zmianie ilości
i pokazują sumę dla wybranej ilości (bez „szt.”), jak w plakatach."""
"""0.25.5: (1) krok lejka „cena po konfiguracji” (price_seen) tylko po prawdziwej zmianie klienta, raz na kategorię w sesji;
(2) klasyfikacja błędów wysyłki zamówienia (order_error: stale_item / limit / validation / files / network / server);
(3) pozycje koszyka ze starszej wersji kalkulatora: ostrzeżenie, „Oblicz ponownie”, blokada wysyłki przed serwerem."""
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

def boot(browser,width):
    page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=20000)
    page.evaluate('''()=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});}''')
    page.evaluate('''([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}''',[prices,terms,cases])
    for style in styles: page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
    for script in scripts: page.add_script_tag(content=(root/script).read_text())
    page.wait_for_selector('#homeProductSearch',timeout=15000)
    return page,errors
def go(page,name):
    page.evaluate("(n)=>document.querySelector('button.nav-button[data-page=\"'+n+'\"]').click()",name); page.wait_for_timeout(500)
def setsel(page,sel,value):
    page.evaluate("([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));}",[sel,value]); page.wait_for_timeout(500)
NB='\u00a0'
formats=prices['pvc']['Plansza pianka 5 mm']['formaty']
def unit(name,q):
    t=[x for x in formats[name]['progi_ilosciowe'] if x['min_szt']<=q][-1]; return t['cena_sztuki']
def zl(v): return ('%.2f'%v).replace('.',',')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width)
        # --- plakaty: bez rozmiaru w mm pod nazwą formatu, zostaje wymiar w cm
        go(page,'Plakaty 24h')
        for kind in ('Wielkoformatowy 24h','Cyfrowy 24h','Offsetowy'):
            setsel(page,'#posterPrint',kind)
            text=page.locator('#posterFormat + .d24-smart-options').inner_text()
            assert ' mm' not in text and 'mm' not in text.split(),(kind,text)
            assert 'cm' in text,(kind,text)
        setsel(page,'#posterPrint','Cyfrowy 24h')
        a4=page.locator('#posterFormat + .d24-smart-options button[data-option-index]',has_text='A4').first
        assert '21 × 29,7 cm' in a4.inner_text(),a4.inner_text()
        # etykiety w koszyku/opisie bez zmian (nazwa formatu, nie opis cm)
        page.locator('#calculate').click(); page.wait_for_timeout(500)
        item=json.loads(page.evaluate("localStorage.getItem('drukulator_cart')"))[-1]
        assert item['description'].startswith('Cyfrowy 24h, format A4, '),item['description']
        # --- pianki: po każdej zmianie ilości kafelki zachowują grafikę i pokazują sumy, nie ceny za sztukę
        go(page,'PCV i pianki'); page.wait_for_selector('#pvcProduct')
        setsel(page,'#pvcProduct','Plansza pianka 5 mm')
        FMT='#foamFormat + .d24-smart-options'; QTY='#foamQtyWrap .d24-smart-options'
        for qty_label,q in (('3',3),('5',5),('10',10),('20',20),('1',1)):
            page.locator(QTY+' button',has_text=qty_label).first.click(); page.wait_for_timeout(500)
            assert page.locator('#pvcQty').input_value()==str(q)
            tiles=page.locator(FMT+' button[data-option-index]')
            assert tiles.count()==7
            text=page.locator(FMT).inner_text()
            assert 'szt' not in text,text                                  # bez „szt.” przy kafelkach formatów
            for name in formats:
                tile=page.locator(FMT+' button[data-option-index]',has_text=name.split(' (')[0]).first
                assert tile.locator('.d24-choice-visual--sheet').count()==1,(q,name)
                assert tile.locator('.d24-option-price').inner_text().replace(NB,' ')==zl(unit(name,q)*q)+' zł',(q,name)
        # własna ilość 7 szt. — też sumy i grafika
        page.locator('#foamOwnQtyToggle').click(); page.locator('#foamOwnQty').fill('7'); page.wait_for_timeout(600)
        for name in formats:
            tile=page.locator(FMT+' button[data-option-index]',has_text=name.split(' (')[0]).first
            assert tile.locator('.d24-choice-visual--sheet').count()==1,name
            assert tile.locator('.d24-option-price').inner_text().replace(NB,' ')==zl(unit(name,7)*7)+' zł',name
        # zmiana formatu i produktu nie gubi grafiki
        page.locator(FMT+' button',has_text='B1').first.click(); page.wait_for_timeout(400)
        setsel(page,'#pvcProduct','Folia z nadrukiem + PCV'); setsel(page,'#pvcProduct','Plansza pianka 5 mm')
        assert page.locator(FMT+' .d24-choice-visual--sheet').count()==6
        assert not errors,errors
        print('PASS foam/poster look 0.25.6 width',width,flush=True)
        page.close()
    browser.close()
print('PASS foam_poster_look_0256_browser')
