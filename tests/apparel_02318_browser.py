"""End-to-end apparel pricing & cart on desktop and 375px."""
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
        def check(price):
            page.wait_for_function('expected=>document.querySelector("#calculate")?.textContent.includes(expected)',arg=price,timeout=5000)
            assert 'ustalenia' not in page.locator('#calculate').inner_text().lower()
        # Basic with print, discount is still enabled.
        choose('appCategory','Koszulki bawełniane');choose('appProduct','Basic 160 g')
        check('55,00')
        choose('appFront','Do 20x30 cm');check('60,00')
        choose('appBack','Do 35x40 cm');check('90,00')
        page.locator('#appQty').fill('10')
        check('810,00')
        page.locator('#calculate').click()
        page.wait_for_selector('.cart-card')
        assert '810,00' in page.locator('.cart-card-footer strong').last.inner_text()
        assert page.locator('#quoteDockTotal').inner_text()=='810,00 zł'
        # Standalone print: no quantity discount even at 50+ units.
        choose('appCategory','Sam nadruk');choose('appProduct','Nadruk na odzieży klienta')
        page.locator('#appQty').fill('50')
        check('750,00')
        page.locator('#calculate').click()
        page.wait_for_timeout(250)
        assert page.locator('.cart-card').count()==2
        assert page.locator('#quoteDockTotal').inner_text().replace(' ', '').replace('\u00a0','').replace('\u202f','')=='1560,00zł',repr(page.locator('#quoteDockTotal').inner_text())
        # Fixed price, bag 1 print 20x30 and price can be discounted as full product.
        choose('appCategory','Torby i worki');choose('appProduct','Carry')
        # Caps and bags print on the front only: no front/back choice at all.
        assert page.locator('#appPosition').is_hidden()
        assert page.locator('#appFrontField').is_hidden()
        page.locator('#appQty').fill('1');check('50,00')
        page.locator('#appQty').fill('10');check('450,00')
        assert 'Rabat przy tej ilości: 10%' in page.locator('#appQtyHint').inner_text()
        # Hats, vests and backpacks.
        for cat,model,expected,position_visible in [('Czapki','Czapka bejsbolówka','55,00',False),('Czapki','Czapka raperka','55,00',False),('Kamizelki odblaskowe','Brixton Flash','40,00',True),('Kamizelki odblaskowe','Malfini Rimeck','50,00',True),('Torby i worki','Worko-plecak Easygo','40,00',False)]:
            choose('appCategory',cat);choose('appProduct',model)
            page.locator('#appQty').fill('1');check(expected)
            assert page.locator('#appPosition').is_visible()==position_visible,(cat,model)
        assert not errors,errors
        dims=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')
        assert dims['scroll']<=dims['inner']+1,(width,dims)
        print('PASS apparel browser width',width,'cart 2 items',flush=True)
        page.close()
    browser.close()
