"""0.24.4: strona główna (Start) wygląda jak w 0.23.27; pasek „Twoje zamówienie” widoczny tylko na Starcie, gdy koszyk pusty."""
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
        # --- Start: jak w 0.23.27
        txt=page.locator('#content').inner_text()
        for must in ['Uruchom asystenta zamówień','Nie wiem, czego potrzebuję','Popularne:','Wizytówki 24h','Ulotki 24h','Plakaty 24h',
                     'Bez obowiązku zapłaty','Weryfikacja przez drukarnię',
                     'Wybierz produkt, sprawdź cenę i dodaj go do koszyka']:
            assert must in txt,must
        assert 'Pomóż mi wybrać' not in txt
        if width>=1000:  # karta „To naprawdę proste” jest ukryta na telefonie (jak w 0.23.27)
            for must in ['Albo wpisz wszystko jednym zdaniem','Zobacz cenę','Wymaga potwierdzenia drukarni']: assert must in txt,must
        assert page.locator('.refresh-home-shortcuts button').count()==5
        assert page.locator('.home-trust-strip > div').count()==4
        assert page.locator('.quote-dock').first.is_visible()
        # kafelek 24h ma plakietkę
        assert page.locator('.home-product-tile .service-badge-24h').count()>=3
        # kreator nadal działa z obu przycisków
        page.locator('#openQuoteAssistant').click(); page.wait_for_timeout(400)
        assert page.locator('#quoteAssistant').is_visible()
        # strony produktów: pusty pasek „Twoje zamówienie” ukryty, nazwa bez 24h w menu dla wizytówek
        open_page('PCV i pianki'); page.wait_for_selector('#pvcProduct')
        assert not page.locator('.quote-dock').first.is_visible()
        assert not errors,errors
        print('PASS home restored 0.24.4 width',width,flush=True)
        page.close()
    browser.close()
