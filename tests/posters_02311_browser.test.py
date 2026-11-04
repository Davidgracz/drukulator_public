"""Local-only poster regression without WordPress, verifies buttons & tier calculations."""
from pathlib import Path
import json,re
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
 page.locator('nav#navigation button[data-page="Plakaty 24h"]').first.evaluate('(b)=>b.click()')
 page.wait_for_timeout(600)
 tech=page.locator('.d24-technology-select--posters [data-print-mode]')
 assert tech.count()==3,f'Technologies: {tech.all_text_contents()}'
 assert page.locator('#posterPrint option').all_text_contents()==['Cyfrowy 24h','Offsetowy','Wielkoformatowy 24h']
 qty=page.locator('#posterQty')
 print('Digital qty:',qty.input_value(),'buttons:',page.locator('#posterQtyWrap .d24-smart-choice').all_text_contents(),flush=True)
 assert page.locator('#posterQtyWrap .d24-smart-choice').count()==4
 assert qty.evaluate('(el)=>el.classList.contains("d24-native-covered")')
 assert not page.locator('#posterQty').is_visible() or qty.evaluate('(el)=>el.getBoundingClientRect().width') <= 1.5
 tech.filter(has=page.locator('strong').get_by_text('Druk wielkoformatowy')).click()
 page.wait_for_timeout(550)
 print('Large qty:',qty.input_value(),'live:',page.locator('#calculate').inner_text(),flush=True)
 assert page.locator('#posterPrint').input_value()=='Wielkoformatowy 24h'
 assert qty.input_value()=='1','Large format default must be 1.'
 assert page.locator('#posterQtyWrap .d24-smart-choice').count()==5
 assert page.locator('#posterQtyWrap .d24-smart-choice:visible').count()==5
 assert page.locator('#posterQtyWrap .d24-smart-choice[aria-pressed="true"]').inner_text().strip().startswith('1 szt.')
 assert '30' in page.locator('#calculate').inner_text(),page.locator('#calculate').inner_text()
 page.locator('#posterQtyWrap .d24-smart-choice[data-option-value="10"]').click()
 page.wait_for_timeout(300)
 assert qty.input_value()=='10'
 assert '200' in page.locator('#calculate').inner_text()
 # Extra quantities are set through the original, hidden select by automated quoting.
 page.locator('#posterQty').evaluate('(s)=>{s.value="17";s.dispatchEvent(new Event("change",{bubbles:true}));}')
 page.wait_for_timeout(300)
 assert qty.input_value()=='17'
 assert '340' in page.locator('#calculate').inner_text()  # 17*20
 tech.filter(has=page.locator('strong').get_by_text('Ekonomicznie')).click()
 page.wait_for_timeout(300)
 print('Offset qty:',qty.input_value(),'buttons:',page.locator('#posterQtyWrap .d24-smart-choice').all_text_contents(),flush=True)
 assert page.locator('#posterPrint').input_value()=='Offsetowy'
 assert qty.input_value() in ('100','250','500')
 assert page.locator('#posterQtyWrap .d24-smart-choice').count()>0
 tech.filter(has=page.locator('strong').get_by_text('Druk wielkoformatowy')).click()
 page.wait_for_timeout(300)
 assert qty.input_value()=='1',f'After switch to large: {qty.input_value()}'
 # Format updates should not change 1.
 page.locator('#posterFormat').evaluate('s=>{s.value="A1";s.dispatchEvent(new Event("change",{bubbles:true}));}')
 page.wait_for_timeout(300)
 assert qty.input_value()=='1'
 assert '55' in page.locator('#calculate').inner_text()
 # Mobile width, 3 technology buttons, no horizontal overflow.
 page.set_viewport_size({'width':375,'height':812})
 page.wait_for_timeout(300)
 width=page.evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})')
 print('Mobile:',width,flush=True)
 assert width['scroll']<=width['client']+1
 assert not errors,errors
 print('POSTERS 0.23.11 BROWSER OK',flush=True)
 browser.close()
