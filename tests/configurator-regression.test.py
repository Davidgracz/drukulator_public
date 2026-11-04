from playwright.sync_api import sync_playwright
from pathlib import Path
import json,re
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html=re.sub(r'<img[^>]*>','',html,flags=re.I)
js=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js']
styles=['assets/styles.css','assets/frontend-refresh.css','assets/druk24-brand-forms.css','assets/product-preview.css','assets/checkout-experience.css','assets/intelligent-search.css','assets/quote-assistant-235.css','assets/intelligent-configurator.css']
payload=[json.loads((root/x).read_text()) for x in ['data/prices.json','data/search-terms.json','data/case-items.json']]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390]:
  page=browser.new_page(viewport={'width':width,'height':880},locale='pl-PL')
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(html,wait_until='domcontentloaded',timeout=10000)
  page.evaluate('''() => {const make=()=>{const d=new Map();return {getItem:k=>d.get(k)||null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k),clear:()=>d.clear()}};Object.defineProperty(window,'localStorage',{value:make(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:make(),configurable:true});}''')
  page.evaluate('([prices,search,casei])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?prices:String(u).includes("search-terms.json")?search:casei})}',payload)
  for f in styles:page.add_style_tag(content=(root/f).read_text())
  for f in js:page.add_script_tag(content=(root/f).read_text())
  page.wait_for_selector('#homeProductSearch',timeout=12000)
  names=page.locator('#navigation button[data-page]').evaluate_all('items=>items.map(i=>i.dataset.page)')
  tested=[]
  for name in names[:7]:
   print('checking',width,name,flush=True)
   if name in ['Start','Edycja cen','Edycja wyszukiwarki','Statystyki'] or name.startswith('Edycja'):continue
   page.locator('nav#navigation button[data-page]').evaluate_all('([first],needle)=>{}',None) if False else None
   page.locator('nav#navigation').evaluate('(n,name)=>n.querySelectorAll("button[data-page]").forEach(b=>{if(b.dataset.page===name)b.click()})',name)
   page.wait_for_timeout(60)
   if page.locator('.card .form-grid').count():
    tested.append(name)
    assert page.locator('#calculate, #calculateCanvas').count()>0,name
    # conditional comparisons must not override native controls
    assert page.locator('.d24-config-comparison').count()<=1,name
   if width==390:
    has_overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
    assert not has_overflow, ('mobile overflow',name,page.evaluate('[document.documentElement.scrollWidth, innerWidth]'))
  assert not errors,errors
  print(f'REGRESSION {width}px: {len(tested)} calculators checked; no console errors or overflow',flush=True)
  page.close()
 browser.close()
