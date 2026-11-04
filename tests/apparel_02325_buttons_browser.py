"""Apparel model choices show the final gross price (both prints, quantity, discount); print choices show none."""
import json, re
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
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1440,375):
        page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
        errors=[]
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded',timeout=20000)
        page.evaluate('''()=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});}''')
        page.evaluate('''([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes('prices.json')?pr:String(u).includes('search-terms.json')?tr:String(u).includes('case-items.json')?ci:{success:true}})}''',[prices,terms,cases])
        for css in styles: page.evaluate('css=>{const n=document.createElement("style");n.textContent=css;document.head.append(n);}',(root/css).read_text())
        for script in scripts: page.add_script_tag(content=(root/script).read_text())
        page.wait_for_selector('#homeProductSearch',timeout=15000)
        page.locator('[data-home-page="Koszulki i odzież"]').first.evaluate('(n)=>n.click()')
        page.wait_for_selector('#appCategory',timeout=5000)
        # verify exact field order (stock shade may appear before all fields)
        order=page.locator('.card .form-grid > .field').evaluate_all("nodes=>nodes.map(n=>n.querySelector('input,select,textarea')?.id)")
        assert order.index('appFront') < order.index('appBack') < order.index('appQty'),order
        def model_text(name):
            option=page.locator("#appProduct option").filter(has_text=name).first
            idx=option.evaluate("(o)=>o.index")
            return page.locator(f"#appProduct + .d24-smart-options .d24-smart-choice[data-option-index=\"{idx}\"]").inner_text()
        def wait_model_price(text):
            page.wait_for_function("t => document.querySelector('#appProduct option')?.dataset.d24FinalPrice === t", arg=text)
            page.wait_for_timeout(120)
        # 0.23.27v: prices sit under the model name; print buttons have no prices.
        wait_model_price("55,00 zł")
        assert "55,00 zł" in model_text("Basic 160 g")
        assert "50,00 zł" in model_text("Classic New 145 g")
        assert page.locator("#appFrontField .d24-option-price, #appBackField .d24-option-price").count()==0
        # "Brak" is the last choice in both rows; front still defaults to 10x15.
        assert page.locator("#appFrontField .d24-smart-choice strong").all_inner_texts()[-1]=="Brak"
        assert page.locator("#appBackField .d24-smart-choice strong").all_inner_texts()[-1]=="Brak"
        assert page.locator("#appFront").input_value()=="Do 10x15 cm"
        assert page.locator("#appBack").input_value()=="Brak"
        page.locator("#appBackField .d24-smart-choice").filter(has=page.locator("strong",has_text="Do 35x40 cm")).first.click()
        wait_model_price("85,00 zł")
        assert "85,00 zł" in model_text("Basic 160 g")
        page.locator("#appQty").fill("10")
        wait_model_price("765,00 zł")
        assert "765,00 zł" in model_text("Basic 160 g")
        page.locator("#calculate").click()
        page.wait_for_selector(".cart-card")
        assert "765,00" in page.locator(".cart-card-footer strong").last.inner_text()
        # print-only must not discount
        page.locator("#appCategory").select_option(label="Sam nadruk")
        page.locator("#appQty").fill("50")
        wait_model_price("750,00 zł")
        assert "750,00 zł" in model_text("Nadruk na odzieży klienta")
        # fixed included-price categories hide both print-size choice groups
        page.locator('#appCategory').select_option(label='Kamizelki odblaskowe')
        assert page.locator('#appFrontField').is_hidden()
        assert page.locator('#appBackField').is_hidden()
        assert not errors,errors
        dims=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')
        assert dims['scroll'] <= dims['inner']+1, (width,dims)
        print('PASS apparel model prices',width,flush=True)
        page.close()
    browser.close()
