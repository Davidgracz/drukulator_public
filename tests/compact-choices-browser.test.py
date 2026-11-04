"""End-to-end smoke for compact configurators without a live WordPress backend."""
from pathlib import Path
import json,re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
html=(ROOT/'index.html').read_text(encoding='utf-8')
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html=re.sub(r'<img[^>]*>','',html,flags=re.I)
scripts=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js','js/variant-comparison.js']
fixtures=[json.loads((ROOT/f).read_text()) for f in ['data/prices.json','data/search-terms.json','data/case-items.json']]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1320,'height':860},locale='pl-PL')
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded',timeout=20000)
 page.evaluate('''() => { const make=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});}''')
 page.evaluate('([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}',fixtures)
 for stylesheet in ['assets/styles.css','assets/frontend-refresh.css','assets/druk24-brand-forms.css','assets/product-preview.css','assets/intelligent-configurator.css','assets/variant-comparison.css','assets/compact-choices.css']:
  page.evaluate('css => {let sheet=document.createElement("style");sheet.textContent=css;document.head.append(sheet)}',(ROOT/stylesheet).read_text())
 for script in scripts: page.add_script_tag(content=(ROOT/script).read_text())
 page.wait_for_selector('#homeProductSearch',timeout=20000)
 def go(name):
  page.locator(f'nav#navigation button[data-page="{name}"]').evaluate('(button)=>button.click()')
  page.locator('.d24-preview-fold').first.wait_for(timeout=7000)
  page.wait_for_timeout(250)
 def count_covered(): return page.locator('.content .form-grid select.d24-native-covered').count()
 def click_choice(sel,which):
  choice=page.locator(f'{sel} + .d24-smart-options button[data-option-index]').filter(has_text=which).first
  choice.click()
  page.wait_for_timeout(180)
 go('Wizytówki 24h')
 assert count_covered()>=5,('covered',count_covered())
 assert page.locator('#bcSides').evaluate('(s)=>getComputedStyle(s).position')=='absolute'
 assert page.locator('.d24-preview-fold').evaluate('(d)=>d.open') is False
 assert page.locator('.d24-vc-fold').evaluate('(d)=>d.open') is False
 click_choice('#bcSides', 'Dwustron')
 assert 'Dwustron' in page.locator('#bcSides').input_value()
 qty=page.locator('#bcQuantity')
 assert qty.is_hidden() is False # kept in DOM for pricing, visually clipped
 first_qty=qty.input_value()
 click_choice('#bcQuantity', '100')
 assert qty.input_value()!=first_qty
 assert qty.input_value()=='100'
 page.locator('.d24-vc-fold summary').click()
 assert page.locator('.d24-vc-fold').evaluate('(d)=>d.open') is True
 page.locator('button[data-compare-mode="bcFinish"]').click()
 page.wait_for_timeout(350)
 print('MODE STATUS',page.locator('button[data-compare-mode]').evaluate_all('(els)=>els.map(x=>[x.dataset.compareMode,x.getAttribute("aria-pressed")])'),flush=True)
 assert page.locator('button[data-compare-mode="bcFinish"]').get_attribute('aria-pressed')=='true'
 assert page.locator('.d24-vc-fold').evaluate('(d)=>d.open') is True
 page.locator('.d24-preview-fold summary').click()
 assert page.locator('.d24-preview-fold').evaluate('(d)=>d.open') is True
 page.locator('#d24PreviewRotate').click()
 # Selecting a compared variant does not mutate price list and is passed to the native calculator.
 page.locator('.d24-vc-card').last.locator('[data-compare-add="0"]').click()
 page.wait_for_timeout(300)
 assert page.locator('.d24-vc-fold').evaluate('(d)=>d.open') is True
 go('Ulotki 24h')
 assert count_covered()>=4
 assert page.locator('.d24-vc-fold').evaluate('(d)=>d.open') is False
 click_choice('#flyFormat','A5')
 assert 'A5' in page.locator('#flyFormat').input_value()
 go('Druk cyfrowy i ksero 24h')
 assert count_covered()>=2
 # Content changes dynamically when selecting service.
 first_service=page.locator('#digService').input_value()
 other=page.locator('#digService').locator('option').evaluate_all('(a)=>a.map(o=>o.value).filter(x=>x)')
 if len(other)>1:
  page.locator('#digService').evaluate('(s)=>{s.value=Array.from(s.options).map(o=>o.value).find(v=>v!==s.value);s.dispatchEvent(new Event("change",{bubbles:true}))}')
  page.wait_for_timeout(250)
  assert page.locator('#digService').input_value()!=first_service
  assert count_covered()>=2
 # Visit all calculator categories; check that every viable visible selector has buttons.
 names=page.locator('nav#navigation button[data-page]').evaluate_all('(els)=>els.map(e=>e.dataset.page).filter(Boolean)')
 for name in dict.fromkeys(names):
  if name in ('home','cart'):continue
  page.locator(f'nav#navigation button[data-page="{name}"]').first.evaluate('(b)=>b.click()')
  page.wait_for_timeout(120)
  unmatched=page.evaluate('''() => Array.from(document.querySelectorAll('#content > .card .form-grid .field > select')).filter(s=>!s.disabled && !s.closest('.hidden,[hidden]') && s.options.length>1 && Array.from(s.options).some(o=>!o.disabled&&o.value) && !s.classList.contains('d24-native-covered')).map(s=>s.id)''')
  assert not unmatched,(name,unmatched)
  if page.locator('.d24-preview-fold').count():
   assert page.locator('.d24-preview-fold').evaluate('(d)=>d.open') is False,name
 print('Categories checked:',len(set(names)))
 page.set_viewport_size({'width':375,'height':790})
 page.locator('nav#navigation button[data-page="Wizytówki 24h"]').first.evaluate('(b)=>b.click()')
 page.wait_for_timeout(200)
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Horizontal overflow mobile'
 page.locator('#calculate').click()
 page.wait_for_timeout(170)
 assert page.locator('#addToCart').count(), 'Quote did not calculate'
 page.locator('#addToCart').click()
 page.wait_for_timeout(250)
 assert page.locator('#orderPickup').count(), 'Cart pickup not rendered'
 assert page.locator('#orderPickup').evaluate('(el)=>el.classList.contains("d24-native-covered")')
 pickup=page.locator('#orderPickup + .d24-smart-options button[data-option-index]')
 assert pickup.count()>=2
 pickup.last.click()
 assert page.locator('#orderPickup').input_value() == 'Do ustalenia'
 assert not errors,errors
 print('COMPACT CHOICES BROWSER OK')
 browser.close()
