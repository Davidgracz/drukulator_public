"""0.25.2: obrazy na płótnie — układ wyboru, siatka formatów (7 + 6 w rzędzie), własny wymiar co 10 cm,
proponowane formaty jako kafelki, wgrany plik widoczny w podglądzie produktu (bez drugiego wgrywania)."""
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

photo_land=os.path.join(tempfile.mkdtemp(),'foto_pozioma.png'); open(photo_land,'wb').write(png(300,200))
photo_sq=os.path.join(tempfile.mkdtemp(),'foto_kwadrat.png'); open(photo_sq,'wb').write(png(200,200))
listed=prices['obrazy_na_plotnie']['formaty']
def rows_of(boxes,tol=3):
    ys=[]
    for b in boxes:
        if not any(abs(b['y']-y)<=tol for y in ys): ys.append(b['y'])
    return [sum(1 for b in boxes if abs(b['y']-y)<=tol) for y in sorted(ys)]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1440,390):
        desktop=width>760
        page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded',timeout=20000)
        page.evaluate('''()=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});}''')
        page.evaluate('''([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}''',[prices,terms,cases])
        for style in styles: page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
        for script in scripts: page.add_script_tag(content=(root/script).read_text())
        page.wait_for_selector('#homeProductSearch',timeout=15000)
        page.locator('button.nav-button[data-page="Obrazy na płótnie"]').first.evaluate('(n)=>n.click()')
        page.wait_for_selector('#canvasMode'); page.wait_for_timeout(600)
        mode_btn=lambda name: page.locator(f'#canvasModeField button:has-text("{name}")')
        def check_layout(tag):
            boxes=[b.bounding_box() for b in page.locator('#canvasModeField button[data-option-index]').all()]
            assert len(boxes)==3,(tag,boxes)
            if desktop: assert rows_of(boxes)==[3],(tag,boxes)          # trzy przyciski w jednym rzędzie
            qty_label=page.locator('#canvasQtyField > label').bounding_box()
            qty_box=page.locator('#canvasQtyField .refresh-number').bounding_box()
            assert qty_label['y']>max(b['y']+b['height'] for b in boxes)-1,(tag,'ilość pod przyciskami')
            assert abs(qty_label['x']-boxes[0]['x'])<=2 and abs(qty_box['x']-boxes[0]['x'])<=2,(tag,qty_label,qty_box,boxes[0])
        # --- tryb 1: wybór formatu
        check_layout('format')
        tiles=page.locator('#canvasFormatField button[data-option-index]:visible').all()
        assert len(tiles)==7
        if desktop: assert rows_of([t.bounding_box() for t in tiles])==[7],'gotowe rozmiary: 7 w rzędzie'
        page.locator('#canvasPriceList > summary').click(); page.wait_for_timeout(300)
        expected_tiles=sum(1 if k.split('x')[0]==k.split('x')[1] else 2 for k in listed)
        all_tiles=page.locator('#canvasPriceListBody [data-canvas-format]')
        assert all_tiles.count()==expected_tiles
        assert page.locator('#canvasPriceListBody table').count()==0           # kafelki, nie tabela
        assert page.locator('#canvasPriceListBody [data-canvas-format="150x150"]').count()==0   # brak ceny w cenniku
        groups=page.locator('.d24-canvas-matrix__group')
        assert groups.count()==13
        if desktop:
            for idx in range(13):
                bs=[b.bounding_box() for b in groups.nth(idx).locator('[data-canvas-format]').all()]
                expect=[7,6] if idx<12 else [7,5]
                assert rows_of(bs)==expect,(idx,rows_of(bs))                       # dwa rzędy na jedną szerokość
        first=groups.nth(0).locator('[data-canvas-format]').all_inner_texts()
        assert first[0].startswith('30 × 30 cm') and first[1].startswith('30 × 40 cm'),first[:2]
        second=groups.nth(1).locator('[data-canvas-format]').all_inner_texts()
        assert second[0].startswith('40 × 30 cm') and second[1].startswith('40 × 40 cm'),second[:2]
        assert '75,00 zł' in second[0]                       # 40 × 30 = cena 30 × 40
        # wybór kafelka orientacji poziomej
        page.locator('#canvasPriceListBody [data-canvas-format="40x30"]').click(); page.wait_for_timeout(300)
        assert page.locator('#canvasFormat').input_value()=='40x30'
        assert page.locator('#canvasPriceList').evaluate('d=>d.open')==False
        assert '75,00' in page.locator('#calculateCanvas').inner_text()
        assert page.locator('#canvasFormatField button[aria-pressed="true"]').inner_text().startswith('40 × 30 cm')
        page.locator('#calculateCanvas').click(); page.wait_for_timeout(300)
        cart=page.locator('.cart-card').first; cart.wait_for(timeout=3000)
        assert '40 × 30 cm' in cart.inner_text() and '75,00' in cart.inner_text(),cart.inner_text()
        # ilość zmienia ceny na kafelkach (także w pełnym cenniku)
        page.locator('#canvasQty').fill('2'); page.wait_for_timeout(300)
        page.locator('#canvasPriceList > summary').click(); page.wait_for_timeout(200)
        assert '150,00 zł' in page.locator('#canvasPriceListBody [data-canvas-format="30x40"]').inner_text()
        assert '150,00 zł' in page.locator('#canvasFormatField button[data-option-value="30x40"]').inner_text()
        page.locator('#canvasQty').fill('1'); page.wait_for_timeout(200)
        # --- tryb 2: własny wymiar, plus/minus co 10 cm
        mode_btn('Wpisz własny wymiar').click(); page.wait_for_timeout(400)
        check_layout('custom')
        for fid in ('canvasWidth','canvasHeight'):
            assert page.locator('#'+fid).get_attribute('step')=='10'
        wrap=lambda fid: page.locator(f'.refresh-number:has(#{fid})')
        wrap('canvasWidth').locator('button[data-direction="1"]').click()
        assert page.locator('#canvasWidth').input_value()=='70'
        wrap('canvasWidth').locator('button[data-direction="-1"]').click(); wrap('canvasWidth').locator('button[data-direction="-1"]').click()
        assert page.locator('#canvasWidth').input_value()=='50'
        wrap('canvasHeight').locator('button[data-direction="1"]').click()
        assert page.locator('#canvasHeight').input_value()=='100'
        page.locator('#canvasWidth').fill('63.5'); wrap('canvasWidth').locator('button[data-direction="1"]').click()
        assert page.locator('#canvasWidth').input_value()=='70',page.locator('#canvasWidth').input_value()
        page.locator('#canvasWidth').fill('63.5'); wrap('canvasWidth').locator('button[data-direction="-1"]').click()
        assert page.locator('#canvasWidth').input_value()=='60'
        for _ in range(12): wrap('canvasHeight').locator('button[data-direction="1"]').click()
        assert page.locator('#canvasHeight').input_value()=='150'                   # górny limit
        page.locator('#canvasWidth').fill('63.5'); page.locator('#canvasHeight').fill('104'); page.wait_for_timeout(300)  # wpisanie dowolnej wartości nadal działa
        assert '210,00' in page.locator('#calculateCanvas').inner_text() or '205,00' in page.locator('#calculateCanvas').inner_text(),page.locator('#calculateCanvas').inner_text()
        # --- tryb 3: dopasuj do zdjęcia
        mode_btn('Dopasuj do zdjęcia').click(); page.wait_for_timeout(400)
        check_layout('fit')
        page.locator('#canvasFile').set_input_files(photo_sq); page.wait_for_timeout(900)
        sug=page.locator('#canvasSuggestionField button[data-option-index]:visible').all()
        assert len(sug)>=8,len(sug)                                  # zdjęcie kwadratowe: wszystkie kwadratowe formaty
        txt=[t.inner_text() for t in sug]
        assert txt[0].startswith('30 × 30 cm') and 'różnica proporcji' in txt[0] and 'zł' in txt[0],txt[0]
        if desktop:
            boxes=[t.bounding_box() for t in sug]
            rr=rows_of(boxes); assert rr[0]==7 and sum(rr)==len(sug),rr      # 7 w rzędzie jak gotowe rozmiary
        # plik jest od razu w podglądzie produktu, bez drugiego wgrywania
        fold=page.locator('details.d24-preview-fold')
        assert fold.evaluate('d=>d.open')==True
        assert page.locator('#d24PreviewFileRender img').count()==1
        assert page.locator('.d24-preview-sheet.has-file').count()==1
        assert page.locator('#d24PreviewFile').is_visible()==False
        assert 'foto_kwadrat.png' in page.locator('#d24PreviewFileInfo').inner_text()
        assert page.locator('#d24PreviewClear').is_visible()==False
        assert '30 × 30 cm' in page.locator('#d24PreviewDims').inner_text()
        # wybór innego proponowanego formatu zmienia rozmiar w podglądzie
        sug[3].click(); page.wait_for_timeout(400)
        chosen=page.locator('#canvasSuggestionField button[aria-pressed="true"] strong').inner_text()
        assert chosen in page.locator('#d24PreviewDims').inner_text(),(chosen,page.locator('#d24PreviewDims').inner_text())
        assert page.locator('#d24PreviewFileRender img').count()==1
        # „Podaj jeden bok” — rozmiar w podglądzie liczony z proporcji zdjęcia, plik zostaje
        page.locator('#canvasImageWorkspace button:has-text("Podaj jeden bok")').click(); page.wait_for_timeout(500)
        assert page.locator('#d24PreviewFileRender img').count()==1
        assert '60 × 60 cm' in page.locator('#d24PreviewDims').inner_text(),page.locator('#d24PreviewDims').inner_text()
        k=page.locator('#canvasKnownValue'); k.focus(); page.keyboard.press('ArrowUp'); page.wait_for_timeout(400)
        assert '70 × 70 cm' in page.locator('#d24PreviewDims').inner_text()
        # ilość zmienia ceny na kafelkach proponowanych formatów
        page.locator('#canvasImageWorkspace button:has-text("Proponowane formaty")').click(); page.wait_for_timeout(400)
        one=page.locator('#canvasSuggestionField button[data-option-index]').first.inner_text()
        page.locator('#canvasQty').fill('3'); page.wait_for_timeout(400)
        three=page.locator('#canvasSuggestionField button[data-option-index]').first.inner_text()
        price=lambda t: float(re.search(r'([\d ]+,\d\d) zł',t).group(1).replace(' ','').replace(',','.'))
        assert abs(price(three)-3*price(one))<0.01,(one,three)
        page.locator('#canvasQty').fill('1'); page.wait_for_timeout(300)
        # dodanie do koszyka: plik trafia do załączników zamówienia, format wg wybranego kafelka
        sug=page.locator('#canvasSuggestionField button[data-option-index]:visible').all(); sug[1].click(); page.wait_for_timeout(300)
        page.locator('#calculateCanvas').click(); page.wait_for_timeout(500)
        assert page.locator('.cart-card').count()>=2
        assert 'foto_kwadrat.png' in page.locator('#cartPanel').inner_text() or 'foto_kwadrat.png' in page.locator('.cart-card').last.inner_text()
        # zmiana trybu zdejmuje plik z podglądu (plik nie jest częścią wyceny w innych trybach)
        mode_btn('Wpisz własny wymiar').click(); page.wait_for_timeout(500)
        assert page.locator('#d24PreviewFileRender img').count()==0
        assert page.locator('.d24-preview-sheet.has-file').count()==0
        assert page.locator('#d24PreviewFile').is_visible()
        # zdjęcie poziome: dopasowane tylko do orientacji zdjęcia
        mode_btn('Dopasuj do zdjęcia').click(); page.wait_for_timeout(400)
        page.locator('#canvasFile').set_input_files(photo_land); page.wait_for_timeout(900)
        sizes=[t.locator('strong').inner_text() for t in page.locator('#canvasSuggestionField button[data-option-index]:visible').all()]
        assert sizes[0]=='60 × 40 cm' and all(int(s.split(' ')[0])>int(s.split(' ')[2]) for s in sizes),sizes
        # brak poziomego przewijania strony
        dims=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')
        assert dims['scroll']<=dims['inner']+1,(width,dims)
        assert not errors,errors
        print('PASS 0.25.2 canvas layout/tiles/preview',width,flush=True)
        page.close()
    browser.close()
