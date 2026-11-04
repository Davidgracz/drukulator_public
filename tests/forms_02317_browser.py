"""Regression for streamlined business cards, flyers, posters and large-format pricing."""
from pathlib import Path
import json
import re
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html=re.sub(r'<img[^>]*>','',html,flags=re.I)
prices,terms,case=[json.loads((root/f).read_text()) for f in ['data/prices.json','data/search-terms.json','data/case-items.json']]
styles=['assets/styles.css','assets/frontend-refresh.css','assets/druk24-brand-forms.css','assets/product-preview.css','assets/checkout-experience.css','assets/intelligent-search.css','assets/quote-assistant-235.css','assets/intelligent-configurator.css','assets/variant-comparison.css','assets/compact-choices.css','assets/order-experience-239.css']
scripts=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js','js/variant-comparison.js']
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900},locale='pl-PL')
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=20000)
    page.evaluate('''() => { const make=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});}''')
    page.evaluate('([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}',[prices,terms,case])
    for stylesheet in styles:
        page.evaluate('css=>{const s=document.createElement("style");s.textContent=css;document.head.append(s);}',(root/stylesheet).read_text())
    for script in scripts:
        page.add_script_tag(content=(root/script).read_text())
    page.wait_for_selector('#homeProductSearch',timeout=16000)

    def open_product(name):
        page.locator('nav#navigation button[data-page="%s"]'%name).first.evaluate('(b)=>b.click()')
        page.wait_for_timeout(280)

    def select(id, value):
        page.locator('#'+id).evaluate('''(node, value)=>{node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));}''',value)
        page.wait_for_timeout(220)

    def check_clean_fields(fields):
        for id in fields:
            field=page.locator('#'+id).locator('xpath=..')
            assert field.locator(':scope > .d24-control-guide').count()==0, (id,field.inner_text())

    open_product('Wizytówki 24h')
    for technology in ['Cyfrowy 24h','Offsetowy']:
        select('bcPrint',technology)
        assert page.locator('label[for="bcQuantity"]').inner_text()=='Ilość sztuk'
        check_clean_fields(['bcFormat','bcSides','bcQuantity'])

    open_product('Ulotki 24h')
    for technology in page.locator('#flyPrint option').evaluate_all('(nodes)=>nodes.map(n=>n.value)'):
        select('flyPrint',technology)
        for variant in page.locator('#flyVariant option').evaluate_all('(nodes)=>nodes.map(n=>n.value)'):
            select('flyVariant',variant)
            assert page.locator('label[for="flyQuantity"]').inner_text()=='Ilość sztuk'
            check_clean_fields(['flyFormat','flyQuantity'])

    open_product('Plakaty 24h')
    for technology in ['Cyfrowy 24h','Offsetowy','Wielkoformatowy 24h']:
        select('posterPrint',technology)
        assert page.locator('#posterQtyLabel').inner_text()=='Ilość sztuk'
        check_clean_fields(['posterFormat','posterQty'])

    assert page.locator('#posterQty').input_value()=='1'
    choices=page.locator('#posterQtyWrap .d24-smart-choice')
    assert choices.count()==5,[c.inner_text() for c in choices.all()]
    assert [c.get_attribute('data-option-value') for c in choices.all()]==['1','5','10','20','30']
    assert page.locator('#posterQtyWrap .d24-smart-more').count()==0
    assert '30' in page.locator('#calculate').inner_text(),page.locator('#calculate').inner_text()
    select('posterQty','10')
    assert '200' in page.locator('#calculate').inner_text(),page.locator('#calculate').inner_text()
    assert page.locator('#posterQtyWrap .d24-smart-choice[aria-pressed="true"]').count()==1
    # Nonpreset quantities remain valid and billed using the original price steps.
    page.locator('#posterOwnQtyToggle').click()
    page.locator('#posterOwnQty').fill('2')
    page.wait_for_timeout(420)
    assert page.locator('#posterQty').input_value()=='2'
    assert '50' in page.locator('#calculate').inner_text(),page.locator('#calculate').inner_text()
    page.locator('#posterOwnQty').fill('15')
    page.wait_for_timeout(420)
    assert page.locator('#posterQty').input_value()=='15'
    assert '300' in page.locator('#calculate').inner_text(),page.locator('#calculate').inner_text()
    page.locator('#posterQtyWrap .d24-smart-choice[data-option-value="1"]').click()
    page.wait_for_timeout(420)
    assert page.locator('#posterOwnQtyPanel').is_hidden()
    assert page.locator('#posterQty').input_value()=='1'

    # Lowest four-step tier changes exactly at 10, not 11, for every wide format.
    for size,price in [('A2',20),('A1',40),('A0',70),('B2',22),('B1',45),('B0',80)]:
        assert prices['plakaty']['Wielkoformatowy 24h'][size]['progi_ilosciowe'][-1]=={'min_szt':10,'cena_sztuki':price}
        select('posterFormat',size)
        assert page.locator('#posterQty').input_value()=='1'
        select('posterQty','9')
        previous=page.evaluate('''([pr,size])=>window.Calculators.calculatePosters(pr,'Wielkoformatowy 24h',size,9)''',[prices,size])
        at10=page.evaluate('''([pr,size])=>window.Calculators.calculatePosters(pr,'Wielkoformatowy 24h',size,10)''',[prices,size])
        assert at10['price']==10*price, (size,at10)
        assert previous['unitPrice']>at10['unitPrice'], (size,previous,at10)
        select('posterQty','1')
        assert page.locator('#posterQtyWrap .d24-smart-choice[aria-pressed="true"]').count()==1

    page.set_viewport_size({'width':375,'height':812})
    page.wait_for_timeout(250)
    width=page.evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})')
    assert width['scroll']<=width['client']+1,width
    assert not errors,errors
    print('PASS: 0.23.17 labels, no guides, 3 technologies, quantity buttons, custom amounts, 10+ discount, mobile')
    browser.close()
