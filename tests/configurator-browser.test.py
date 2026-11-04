from playwright.sync_api import sync_playwright
from pathlib import Path
import json,re
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html=re.sub(r'<img[^>]*>','',html,flags=re.I)
scripts=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js']
pr=json.loads((root/'data/prices.json').read_text())
tr=json.loads((root/'data/search-terms.json').read_text())
ci=json.loads((root/'data/case-items.json').read_text())
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900},locale='pl-PL')
 page_errors=[]
 page.on('pageerror',lambda e:page_errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded',timeout=15000)
 page.evaluate('''() => { const make=()=>{const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k),clear:()=>d.clear()}}; Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});}''')
 page.evaluate('([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}',[pr,tr,ci])
 for f in scripts: page.add_script_tag(content=(root/f).read_text())
 page.wait_for_selector('#homeProductSearch',timeout=12000)
 def go(name):
  page.locator(f'nav#navigation button[data-page="{name}"]').evaluate('(button)=>button.click()')
  page.wait_for_timeout(300)
 def compare_prices():
  return page.locator('.d24-config-comparison .d24-config-comparison__option')
 # Business cards: switch finish, compare uses original C.calculateBusinessCards
 go('Wizytówki 24h')
 assert page.locator('#bcFinish').count()==1
 options=compare_prices()
 print('Business compare: ',options.all_text_contents(),flush=True)
 assert options.count()>=2,'Missing business card comparison'
 saved=page.locator('#bcFinish').input_value()
 button=options.filter(has_text='Folia').first
 assert button.count()==1
 button.click()
 page.wait_for_timeout(150)
 assert page.locator('#bcFinish').input_value()!=saved
 assert page.locator('#quoteArea .quote-card').count()==1
 assert page.locator('.d24-smart-options .d24-config-price').count()>=2
 # Flyers: dynamic format comparisons match actual price JSON
 go('Ulotki 24h')
 print('Flyer compare:',compare_prices().all_text_contents(),flush=True)
 assert compare_prices().count()>=2,'Missing flyer price comparison'
 fields=page.evaluate('''() => ({print:document.querySelector('#flyPrint').value,variant:document.querySelector('#flyVariant').value,format:document.querySelector('#flyFormat').value,quantity:document.querySelector('#flyQuantity').value})''')
 expected=pr['ulotki'][fields['print']][fields['variant']][fields['format']][fields['quantity']]
 actual=page.evaluate('''() => window.Druk24ConfiguratorPricing.preview('flyFormat',document.querySelector('#flyFormat').value,Object.fromEntries([...document.querySelectorAll('#content input,#content select')].filter(e=>e.id).map(e=>[e.id,e.value])))''')
 assert actual==expected,(actual,expected)
 compare_prices().first.click()
 page.wait_for_timeout(80)
 assert page.locator('#quoteArea .quote-card').count()==1
 # Digital paper: dependent controls and quantity edit should recalculate prices
 go('Druk cyfrowy i ksero 24h')
 page.locator('#digQty').fill('200')
 page.wait_for_timeout(250)
 print('Digital compare:',compare_prices().all_text_contents(),flush=True)
 assert compare_prices().count()>=2,'Missing digital price comparison'
 first_price=compare_prices().first.locator('strong').inner_text()
 page.locator('#digQty').fill('300')
 page.wait_for_timeout(250)
 assert compare_prices().first.locator('strong').inner_text()!=first_price,'Stale price after quantity change'
 # Banner material preview
 go('Folie i banery 24h')
 print('Banners compare:',compare_prices().all_text_contents(),flush=True)
 assert compare_prices().count()>=2
 # Sticker, should not mistake taxi variant for same geometry
 go('Naklejki, etykiety i magnesy')
 allprice=page.evaluate('''() => window.Druk24ConfiguratorPricing.preview('stickProduct','Nieistniejący produkt',{stickQty:'100',stickWidth:'100',stickHeight:'100'})''')
 assert allprice is None
 # general navigation: 18 categories, assistant still active
 go('Wizytówki 24h')
 page.locator('#productSearch').fill('ulotki 200 sztuk')
 page.wait_for_timeout(100)
 assert page.locator('#productSearchResults .d24-quote-help').count()==1
 # Mobile check
 page.set_viewport_size({'width':390,'height':844})
 page.locator('#productSearch').fill('')
 page.wait_for_timeout(160)
 assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),'mobile horizontal overflow'
 assert not page_errors, page_errors
 browser.close()
 print('CONFIGURATOR BROWSER OK',flush=True)
