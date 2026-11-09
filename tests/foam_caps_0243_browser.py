"""0.24.3: czapka raperka = Malfini RAP 5P (301), pianki — kafelki formatów bez mm, z ceną za sztukę z cennika."""
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
        # --- Pianki: kafelki formatów bez rozmiarów w mm, z ceną za sztukę z cennika
        open_page('PCV i pianki'); page.wait_for_selector('#pvcProduct')
        page.locator('#pvcProduct').select_option(label='Plansza pianka 5 mm'); page.wait_for_timeout(600)
        formats=prices['pvc']['Plansza pianka 5 mm']['formaty']
        tiles=page.locator('#foamFormat + .d24-smart-options button[data-option-index]')
        assert tiles.count()==len(formats)+1==7   # 6 formatów + „Własny wymiar” (0.25.4)
        txt=page.locator('#foamFormat + .d24-smart-options').inner_text()
        assert ' mm' not in txt,txt
        assert page.locator('#foamFormat + .d24-smart-options .d24-smart-choice small').count()==0
        for name,item in formats.items():
            tile=page.locator('#foamFormat + .d24-smart-options button[data-option-index]',has_text=name.split(' (')[0]).first
            price=tile.locator('.d24-option-price').inner_text().replace('\u00a0',' ')
            expected=('%.2f'%item['progi_ilosciowe'][0]['cena_sztuki']).replace('.',',')+' zł/szt.'   # 0.25.4: ceny progowe, 1 szt. = pierwszy próg
            assert price==expected,(name,price,expected)
        # cena na kafelku jest niebieska (kolor akcentu), nie czarna
        color=page.locator('#foamFormat + .d24-smart-options .d24-option-price').first.evaluate('n=>getComputedStyle(n).color')
        assert color!='rgb(0, 0, 0)',color
        # wybór kafelka B1 zmienia format i cenę w przycisku
        page.locator('#foamFormat + .d24-smart-options button[data-option-index]',has_text='B1').first.click(); page.wait_for_timeout(300)
        assert page.locator('#foamFormat').input_value().startswith('B1')
        assert '120,00' in page.locator('#calculate').inner_text()
        # podgląd — w cm
        page.locator('.d24-preview-fold > summary').first.click(); page.wait_for_timeout(300)
        preview=page.locator('.d24-preview-fold').first.inner_text()
        assert '70 × 100 cm' in preview and not re.search(r'\d+ × \d+ mm',preview),preview
        # własny wymiar (0.25.4: ostatni kafelek formatów) — podgląd w cm
        page.locator('.d24-smart-options button:has-text("Własny wymiar")').click(); page.wait_for_timeout(300)
        page.locator('#pvcWidth').fill('45'); page.locator('#pvcHeight').fill('60'); page.wait_for_timeout(300)
        assert '45 × 60 cm' in page.locator('.d24-preview-fold').first.inner_text()
        # --- Czapka raperka = Malfini RAP 5P 301
        page.route('https://shop.malfini.com/**',lambda r: r.fulfill(status=200,content_type='image/png',body=png(4,4)))
        open_page('Start'); page.wait_for_selector('[data-home-page="Koszulki i odzież"]')
        page.locator('[data-home-page="Koszulki i odzież"]').first.evaluate('(n)=>n.click()'); page.wait_for_selector('#appCategory')
        page.locator('#appCategory').select_option(label='Czapki'); page.wait_for_timeout(400)
        page.locator('#appProduct').select_option(label='Czapka raperka'); page.wait_for_timeout(800)
        card=page.locator('#content')
        ctext=card.inner_text()
        assert 'Trucker' not in ctext and '311' not in ctext
        assert 'Rap 5P' in ctext and 'PODGLĄD · 301' in ctext,ctext[:1500]
        assert '100% bawełna' in ctext and '340 g/m²' in ctext
        swatches=page.locator('.d24-malfini-swatch')
        assert swatches.count()==7,swatches.count()
        assert page.locator('.d24-malfini-link').first.get_attribute('href').startswith('https://shop.malfini.com/pl/pl/product/rap-5p-301')
        names=[]
        for i in range(7):
            swatches.nth(i).click(); page.wait_for_timeout(250)
            names.append(page.locator('.d24-malfini-color-label').first.inner_text().strip())
        assert any('Siwoszary' in n for n in names) and any('purpurowa' in n for n in names),names
        src=page.locator('img.d24-malfini-photo').first.get_attribute('src') or ''
        assert '/image/product/301/301_40_' in src,src
        # bejsbolówka bez zmian (305)
        page.locator('#appProduct').select_option(label='Czapka bejsbolówka'); page.wait_for_timeout(600)
        assert 'PODGLĄD · 305' in page.locator('#content').inner_text()
        assert not errors,errors
        dims=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')
        assert dims['scroll']<=dims['inner']+1,(width,dims)
        print('PASS foam+caps 0.24.3 width',width,flush=True)
        page.close()
    browser.close()
