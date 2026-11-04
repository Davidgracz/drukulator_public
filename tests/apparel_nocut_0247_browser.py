"""0.24.7: podgląd odzieży bez przycisków kroju; krój nie trafia do zamówienia; opis i dostępne kroje jako tekst."""
import json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html=re.sub(r'<img[^>]*>','',html,flags=re.I)
styles=['assets/styles.css','assets/frontend-refresh.css','assets/druk24-brand-forms.css','assets/product-preview.css','assets/checkout-experience.css','assets/intelligent-search.css','assets/quote-assistant-235.css','assets/intelligent-configurator.css','assets/variant-comparison.css','assets/changes-02313.css','assets/malfini-preview.css','assets/compact-choices.css','assets/order-experience-239.css']
scripts=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/malfini-preview.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js','js/variant-comparison.js']
prices,terms,cases=[json.loads((root/f).read_text()) for f in ['data/prices.json','data/search-terms.json','data/case-items.json']]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1440,375):
        page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded',timeout=20000)
        page.evaluate('''()=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});}''')
        page.evaluate('''([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}''',[prices,terms,cases])
        for style in styles:page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
        for script in scripts:page.add_script_tag(content=(root/script).read_text())
        page.wait_for_selector('#homeProductSearch',timeout=15000)
        page.locator('[data-home-page="Koszulki i odzież"]').first.evaluate('(n)=>n.click()')
        page.wait_for_selector('#appCategory',timeout=5000)
        def choose(field,value):
            page.locator('#'+field).select_option(label=value)
            page.wait_for_timeout(500)
        choose('appCategory','Koszulki bawełniane');choose('appProduct','Basic 160 g')
        page.wait_for_selector('.d24-malfini-title',timeout=5000)
        for gone in ('[data-app-cut]','.d24-malfini-cuts','.d24-malfini-cut-options','.d24-malfini-cut-note','.d24-malfini-cut-fixed'):
            assert page.locator(gone).count()==0,gone
        assert page.locator('.d24-malfini-subtitle').inner_text().strip()=='Koszulka bawełniana · 160 g · unisex'
        assert page.locator('.d24-malfini-availability').inner_text().strip()=='Dostępne kroje: męski, damski i dziecięcy'
        page.locator('#appQty').fill('5')
        page.wait_for_timeout(400)
        page.locator('#calculate').click()
        page.wait_for_selector('.cart-card',timeout=5000)
        cart=page.locator('.cart-card').first.inner_text()
        print('CART basic:',cart.replace('\n',' | ')[:300],flush=True)
        assert 'krój' not in cart.lower() and 'Krój' not in cart,cart
        # Model z jedynym krojem: brak bloku „Krój”, w zamówieniu zostaje „unisex”.
        choose('appProduct','Heavy New 200 g')
        assert page.locator('.d24-malfini-cuts').count()==0
        assert page.locator('.d24-malfini-subtitle').inner_text().strip()=='Koszulka bawełniana oversize · 200 g · unisex'
        assert not errors,errors
        print('PASS apparel no cut buttons',width,flush=True)
        page.close()
    browser.close()
