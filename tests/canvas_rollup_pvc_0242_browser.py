"""0.24.2: PCV/pianki bez duplikatu ceny, roll-upy bez podpowiedzi i miniaturek, obrazy na płótnie
(pełny cennik formatów, podgląd własnego wymiaru w cm, krok 10 cm w „Dopasuj do zdjęcia")."""
import json,re,struct,zlib,tempfile,os
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
def png(w,h):
    raw=b''.join(b'\x00'+bytes([200,100,50])*w for _ in range(h))
    def chunk(t,d):
        c=struct.pack('>I',len(d))+t+d; return c+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
photo=os.path.join(tempfile.mkdtemp(),'foto.png'); open(photo,'wb').write(png(300,200))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1440,390):
        page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded',timeout=20000)
        page.evaluate('''()=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});}''')
        page.evaluate('''([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}''',[prices,terms,cases])
        for style in styles: page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
        for script in scripts: page.add_script_tag(content=(root/script).read_text())
        page.wait_for_selector('#homeProductSearch',timeout=15000)
        def open_page(name):
            page.locator(f'button.nav-button[data-page="{name}"]').first.evaluate('(n)=>n.click()')
            page.wait_for_timeout(500)
        # --- PCV i pianki: brak osobnego bloku „Cena brutto za wybrany wariant”
        open_page('PCV i pianki'); page.wait_for_selector('#pvcProduct')
        assert page.locator('#pvcPricePreview').count()==0
        assert 'za wybrany wariant' not in page.locator('#content').inner_text()
        for prod in page.locator('#pvcProduct option').all_inner_texts():
            page.locator('#pvcProduct').select_option(label=prod); page.wait_for_timeout(300)
            assert 'za wybrany wariant' not in page.locator('#content').inner_text(),prod
        # --- Roll-upy i X-bannery
        open_page('Roll-upy i X-banery'); page.wait_for_selector('#rollProduct')
        for prod in page.locator('#rollProduct option').all_inner_texts():
            page.locator('#rollProduct').select_option(label=prod); page.wait_for_timeout(500)
            assert page.locator('.field:has(#rollSize) .d24-choice-visual').count()==0,prod
            assert 'Wybierz gotowy rozmiar produktu' not in page.locator('.field:has(#rollSize)').inner_text(),prod
        # --- Obrazy na płótnie
        open_page('Obrazy na płótnie'); page.wait_for_selector('#canvasMode'); page.wait_for_timeout(500)
        assert page.locator('.field:has(#canvasFormat) .d24-choice-visual').count()==0
        assert page.locator('.field:has(#canvasFormat) button[data-d24-show-more]').count()==0
        assert page.locator('.field:has(#canvasFormat) button[data-option-index]:visible').count()==7
        page.locator('#canvasPriceList > summary').click(); page.wait_for_timeout(200)
        assert page.locator('#canvasPriceListBody tbody tr').count()==len(prices['obrazy_na_plotnie']['formaty'])
        assert '75,00 zł' in page.locator('#canvasPriceListBody').inner_text()
        page.locator('#canvasPriceListBody [data-canvas-format="40x80"]').click(); page.wait_for_timeout(300)
        assert page.locator('#canvasFormat').input_value()=='40x80'
        assert '135,00' in page.locator('#calculateCanvas').inner_text()
        # własny wymiar: 70 x 104 -> podgląd 70 x 110 cm
        page.locator('.d24-smart-options button:has-text("Wpisz własny wymiar")').click(); page.wait_for_timeout(300)
        page.locator('#canvasWidth').fill('70'); page.locator('#canvasHeight').fill('104'); page.wait_for_timeout(400)
        page.locator('.d24-preview-fold > summary').click(); page.wait_for_timeout(300)
        dims=page.locator('#d24PreviewDims').inner_text()
        assert '70 × 110 cm' in dims and ' mm' not in dims and '70 × 104 cm' in dims,dims
        assert '210,00' in page.locator('#calculateCanvas').inner_text()
        page.locator('#canvasWidth').fill('70'); page.locator('#canvasHeight').fill('110'); page.wait_for_timeout(400)
        assert '70 × 110 cm' in page.locator('#d24PreviewDims').inner_text()
        assert 'najbliższy większy format' not in page.locator('#d24PreviewDims').inner_text()
        # dopasuj do zdjęcia: kursor, krok 10 cm, zaokrąglanie w górę
        page.locator('.d24-smart-options button:has-text("Dopasuj do zdjęcia")').click(); page.wait_for_timeout(300)
        assert page.evaluate("getComputedStyle(document.getElementById('canvasFile')).cursor")=='pointer'
        page.locator('#canvasFile').set_input_files(photo); page.wait_for_timeout(600)
        page.locator('.d24-smart-options button:has-text("Podaj jeden bok")').click(); page.wait_for_timeout(300)
        k=page.locator('#canvasKnownValue')
        assert (k.get_attribute('min'),k.get_attribute('max'),k.get_attribute('step'))==('30','150','10')
        k.focus(); page.keyboard.press('ArrowUp'); assert k.input_value()=='70'
        page.keyboard.press('ArrowDown'); page.keyboard.press('ArrowDown'); assert k.input_value()=='50'
        for typed,expected in [('64','70'),('71','80'),('70','70'),('5','30'),('999','150')]:
            k.fill(typed); k.blur(); assert k.input_value()==expected,(typed,k.input_value())
        k.fill('64'); page.locator('#calculateCanvas').click(); page.wait_for_timeout(300)
        page.locator('.cart-card').first.wait_for(timeout=3000)
        assert '70,0 × 46,7 cm' in page.locator('.cart-card').first.inner_text(),page.locator('.cart-card').first.inner_text()
        dims=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')
        assert dims['scroll']<=dims['inner']+1,(width,dims)
        assert not errors,errors
        print('PASS 0.24.2 canvas/rollup/pvc',width,flush=True)
        page.close()
    browser.close()
