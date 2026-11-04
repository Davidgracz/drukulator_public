from playwright.sync_api import sync_playwright
import pathlib, re, json
root=pathlib.Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text()
# No remote resources: inject the real app scripts after a local-only fetch mock.
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html=re.sub(r'<img[^>]*>','',html,flags=re.I)
scripts=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js']
pr=json.loads((root/'data/prices.json').read_text())
tr=json.loads((root/'data/search-terms.json').read_text())
ci=json.loads((root/'data/case-items.json').read_text())
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900},locale='pl-PL')
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded',timeout=12000)
 page.evaluate('''() => { const make=()=>{const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k),clear:()=>d.clear()}}; Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});}''')
 page.evaluate('([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}',[pr,tr,ci])
 for f in scripts:
  print("Injecting",f,flush=True)
  page.add_script_tag(content=(root/f).read_text())
  print("Done",f,flush=True)
 page.wait_for_selector('#homeProductSearch')
 print('home title:',page.locator('#content h1').first.inner_text(), flush=True)
 page.locator('#homeProductSearch').fill('Potrzebuję 200 ulotek na imprezę')
 page.wait_for_timeout(250)
 card=page.locator('#homeSearchResults .d24-quote-help')
 print('card count:',card.count(),flush=True)
 print('card:',card.inner_text()[:1000],flush=True)
 assert card.count() == 1
 assert 'Jaki format ulotki' in card.inner_text()
 assert '200 szt.' in card.inner_text()
 assert card.get_by_role('button',name='A5').count() == 1
 assert card.get_by_role('button',name='A4',exact=True).count() == 0
 card.get_by_role('button',name='A5').click()
 page.wait_for_timeout(250)
 card=page.locator('#homeSearchResults .d24-quote-help')
 print('after A5:',card.inner_text()[:700],flush=True)
 if card.get_by_role('button',name='Policz tę konfigurację').count():
  card.get_by_role('button',name='Policz tę konfigurację').click()
  page.wait_for_timeout(250)
  print('quote:',page.locator('#quoteArea').inner_text()[:500] if page.locator('#quoteArea').count() else None,flush=True)
  assert page.locator('#quoteArea .quote-card').count() > 0
 page.locator('#productSearch').fill('100 wizytówek')
 page.wait_for_timeout(250)
 sidebar=page.locator('#productSearchResults .d24-quote-help')
 print('sidebar:',sidebar.inner_text()[:600],flush=True)
 assert sidebar.count()==1
 sidebar.get_by_role('button',name='Doprecyzuj z asystentem').click()
 page.wait_for_timeout(250)
 assert page.locator('#quoteAssistant').is_visible()
 print('wizard:',page.locator('#quoteAssistantMessages').inner_text()[:450],flush=True)
 page.locator('#productSearch').fill('mowa srebrem')
 page.wait_for_timeout(200)
 assert page.locator('#productSearchResults .d24-quote-help').count()==0
 print('errors:',errors[:10],flush=True)
 assert not errors,errors
 # retest compact viewport in same mocked context
 page.set_viewport_size({'width':390,'height':840})
 page.locator('#productSearch').fill('100 wizytówek')
 assert page.locator('#productSearchResults .d24-quote-help').count()==0 or not page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
 print('mobile overflow:',page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),flush=True)
 browser.close()
print('BROWSER MOCK SMOKE OK',flush=True)
