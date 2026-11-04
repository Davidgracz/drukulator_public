from playwright.sync_api import sync_playwright
import pathlib,re,json
root=pathlib.Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text(encoding='utf-8')
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>', '',html, flags=re.I)
html=re.sub(r'<script[^>]*\basync\b[^>]*>\s*</script>', '',html, flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
styles=['assets/styles.css','assets/frontend-refresh.css','assets/druk24-brand-forms.css','assets/product-preview.css','assets/checkout-experience.css','assets/intelligent-search.css','assets/quote-assistant-235.css','assets/intelligent-configurator.css','assets/variant-comparison.css','assets/changes-02313.css','assets/malfini-preview.css','assets/compact-choices.css','assets/order-experience-239.css']
scripts=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/malfini-preview.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js','js/variant-comparison.js']
prices=json.loads((root/'data/prices.json').read_text()); terms=json.loads((root/'data/search-terms.json').read_text());cases=json.loads((root/'data/case-items.json').read_text())
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking'])
 for width in (1440,390):
  page=browser.new_page(viewport={'width':width,'height':900}, locale='pl-PL', service_workers='block')
  errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.set_content(html,wait_until='domcontentloaded', timeout=10000)
  page.evaluate('''()=>{const make=()=>{const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k),clear:()=>d.clear()}};Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});}''')
  page.evaluate('([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}',[prices,terms,cases])
  page.add_style_tag(content='\n'.join((root/f).read_text(encoding='utf-8') for f in styles))
  for f in scripts:page.add_script_tag(content=(root/f).read_text(encoding='utf-8'))
  page.wait_for_selector('#homeProductSearch',timeout=7000)
  page.evaluate('''()=>{const card=[...document.querySelectorAll('button,a')].find(e=>e.textContent.trim()==='Koszulki i odzież');if(card)card.click();}''')
  if not page.locator('#appCategory').count():
   page.evaluate('''()=>{document.querySelector('#productSearch').value='Koszulki';}''')
   # click via navigation search result
   page.locator('#productSearch').fill('koszulki')
   page.wait_for_timeout(250)
   page.locator('#productSearchResults button').first.click()
  page.wait_for_selector('#d24ApparelCatalog .d24-malfini-title',timeout=5000)
  assert 'Basic 129' in page.locator('#d24ApparelCatalog .d24-malfini-title').inner_text(), page.locator('#d24ApparelCatalog .d24-malfini-title').inner_text()
  assert page.locator('#d24ApparelCatalog .d24-malfini-swatch').count()>=8
  assert page.locator('#d24ApparelCatalog [data-app-view]').count()==3
  assert page.locator('#d24ApparelCatalog a[href*="malfini.com"]').count()==1
  assert page.locator('.d24-preview-panel').count()==0,'Generic paper preview should be absent'
  page.locator('#d24ApparelCatalog [data-app-color="01"]').click()
  page.wait_for_timeout(130)
  assert 'Czarny' in page.locator('.d24-malfini-color-label').inner_text()
  page.locator('#d24ApparelCatalog [data-app-view="back"]').click()
  assert page.locator('#d24ApparelCatalog [data-app-view="back"]').get_attribute('aria-pressed')=='true'
  page.locator('#appQty').fill('25')
  page.locator('#calculate').click()
  page.wait_for_timeout(250)
  quote=page.locator('#quoteArea').inner_text()
  print('width',width,'quote',quote[:250].replace('\n',' | '),flush=True)
  assert 'Czarny' in quote or 'czarny' in quote, quote
  assert not errors,errors
  overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth')
  print('overflow',overflow,'width',width,flush=True)
  assert not overflow
  page.locator('#appProduct').select_option(label='Heavy New 200 g')
  page.wait_for_timeout(130)
  assert 'Heavy New 137' in page.locator('#d24ApparelCatalog .d24-malfini-title').inner_text()
  page.locator('#appCategory').select_option(label='Kamizelki odblaskowe')
  page.wait_for_timeout(120)
  assert page.locator('#d24ApparelCatalog .d24-malfini-photo').count()==1
  page.locator('#d24ApparelCatalog [data-app-color]').nth(1).click()
  assert 'Pomarańczowy' in page.locator('#d24ApparelCatalog .d24-malfini-color-label').inner_text()
  page.screenshot(path=f'/mnt/data/drukulator_02314_preview_{width}.png',full_page=False)
  page.close()
 browser.close()
print('MALFINI PREVIEW BROWSER TEST OK')
