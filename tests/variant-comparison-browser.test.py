"""Browser checks for variant comparison. Uses local pricing fixture, no network/backend."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re

ROOT = Path(__file__).resolve().parent.parent
html = (ROOT/'index.html').read_text(encoding='utf-8')
html = re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html = re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html = re.sub(r'<img[^>]*>','',html,flags=re.I)
scripts = ['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js','js/variant-comparison.js']
fixtures=[json.loads((ROOT/f).read_text()) for f in ['data/prices.json','data/search-terms.json','data/case-items.json']]
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1300,'height':850},locale='pl-PL')
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded',timeout=15000)
  page.evaluate('''() => { const make=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});}''')
  page.evaluate('([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}',fixtures)
  for f in scripts: page.add_script_tag(content=(ROOT/f).read_text())
  page.wait_for_selector('#homeProductSearch',timeout=10000)
  def go(name):
    page.locator(f'nav#navigation button[data-page="{name}"]').evaluate('(button)=>button.click()')
    page.locator('.d24-vc-fold summary').wait_for(timeout=5000)
    page.locator('.d24-vc-fold summary').click()
    page.locator('.d24-vc-card').first.wait_for(timeout=5000)
  def switch(mode):
    control=page.locator('button[data-compare-mode]')
    assert mode in control.evaluate_all('(elements)=>elements.map(e=>e.dataset.compareMode)'),(mode,control.all_text_contents())
    page.locator(f'button[data-compare-mode="{mode}"]').click()
    page.wait_for_timeout(120)
  def take_prices():
    return page.locator('.d24-vc-card__total').all_inner_texts()
  go('Wizytówki 24h')
  switch('bcQuantity')
  print('BUSINESS / QTY:',take_prices(),flush=True)
  assert len(take_prices())>=3
  assert page.locator('.d24-vc-card__unit strong').count()>=3
  target=page.locator('.d24-vc-card').last
  # 0.24.0: karta ma jeden przycisk („Wybierz ten wariant”); do koszyka dodaje stały przycisk przy cenie.
  assert target.locator('button').count()==1,'one action per comparison card'
  wanted=target.locator('[data-compare-add="0"]').get_attribute('data-compare-choice')
  price=target.locator('.d24-vc-card__total').inner_text().split(' zł')[0]
  target.locator('[data-compare-add="0"]').click()
  page.wait_for_timeout(300)
  assert page.locator('#bcQuantity').input_value()==wanted
  assert page.locator('.cart-card').count()==0,'choosing a variant must not add to cart'
  assert price in page.locator('#mobilePriceValue').inner_text(),(price,page.locator('#mobilePriceValue').inner_text())
  page.locator('#mobileAddButton').click()
  page.wait_for_timeout(300)
  assert page.locator('.cart-card').count()==1
  assert price in page.locator('.cart-card-footer').inner_text(),(price,page.locator('.cart-card-footer').inner_text())
  # Switching finish should keep same quantity when allowed
  switch('bcFinish')
  assert page.locator('.d24-vc-card').count()>=2
  page.locator('.d24-vc-card:not(.is-active)').last.locator('[data-compare-add="0"]').click()
  page.wait_for_timeout(200)
  assert page.locator('#bcQuantity').input_value()==wanted
  # Flyer comparison: formats and quantities from actual lists
  go('Ulotki 24h')
  switch('flyQuantity')
  print('FLYERS / QTY:',take_prices(),flush=True)
  assert len(take_prices())>=3
  want=page.locator('.d24-vc-card:not(.is-active)').first.locator('[data-compare-choice]').first.get_attribute('data-compare-choice')
  page.locator('.d24-vc-card:not(.is-active)').first.locator('[data-compare-add="0"]').click()
  page.wait_for_timeout(100)
  assert page.locator('#flyQuantity').input_value()==want
  switch('flyFormat')
  print('FLYERS / FORMAT:',take_prices(),flush=True)
  assert len(take_prices())>=2
  # Digital print paper and quantity: current pricing data
  go('Druk cyfrowy i ksero 24h')
  page.locator('#digQty').fill('100')
  page.wait_for_timeout(120)
  switch('digQty')
  before=take_prices()
  print('DIGITAL / QTY:',before,flush=True)
  assert len(before)>=3
  switch('digPaper')
  print('DIGITAL / PAPER:',take_prices(),flush=True)
  assert len(take_prices())>=3
  # Printing one option should not mutate the cart without clicking add.
  oldCart=page.locator('.cart-card').count()
  page.locator('.d24-vc-card:not(.is-active)').last.locator('[data-compare-add="0"]').click()
  page.wait_for_timeout(200)
  assert page.locator('.cart-card').count()==oldCart
  # Banners, quantity and material
  go('Folie i banery 24h')
  switch('bannerQty')
  assert len(take_prices())>=2
  switch('bannerMaterial')
  assert len(take_prices())>=2
  # Responsive
  page.set_viewport_size({'width':375,'height':800})
  page.wait_for_timeout(200)
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'Horizontal overflow on mobile'
  assert not errors,errors
  browser.close()
  print('VARIANT COMPARISON BROWSER OK')
