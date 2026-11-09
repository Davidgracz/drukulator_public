"""0.25.1: katalog odzieży (linki do modeli, materiał, rozmiary, gramatura, kolory), kamizelki z nadrukami, czapki 45/50/55 zł."""
from pathlib import Path
import json,re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html=re.sub(r'<img[^>]*>','',html,flags=re.I)
prices,terms,case=[json.loads((root/f).read_text()) for f in ['data/prices.json','data/search-terms.json','data/case-items.json']]
styles=['assets/styles.css','assets/frontend-refresh.css','assets/druk24-brand-forms.css','assets/product-preview.css','assets/checkout-experience.css','assets/intelligent-search.css','assets/quote-assistant-235.css','assets/intelligent-configurator.css','assets/variant-comparison.css','assets/compact-choices.css','assets/order-experience-239.css','assets/malfini-preview.css','assets/ux-clarity.css']
scripts=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/malfini-preview.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js','js/variant-comparison.js']
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

 def setv(sel,val):
  page.evaluate("([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))}",[sel,val]); page.wait_for_timeout(450)
 page.locator('[data-home-page="Koszulki i odzież"]').first.evaluate('(n)=>n.click()')
 page.wait_for_selector('#appCategory',timeout=6000)
 # model -> (link slug, gramatura, materiał zawiera, rozmiary, min liczba kolorów)
 expected={
  ('Koszulki bawełniane','Basic 160 g'):('basic-129','160 g/m²','100% bawełna','XS–5XL',12),
  ('Koszulki poliestrowe','Fantasy 150 g'):('fantasy-124','150 g/m²','100% poliester','S–3XL',17),
  ('Koszulki poliestrowe','Chance 140 g'):('chance-grs-810','140 g/m²','poliester z recyklingu','S–3XL',6),
  ('Koszulki poliestrowe','Pixel 130 g'):('pixel-p81','130 g/m²','100% poliester','S–4XL',5),
  ('Koszulki polo','Pique Polo 200 g'):('pique-polo-203','200 g/m²','65% bawełna, 35% poliester','S–5XL',30),
  ('Koszulki polo','Cotton 170 g'):('cotton-212','170 g/m²','100% bawełna','S–3XL',10),
  ('Koszulki polo','Single Jersey 180 g'):('single-j-202','180 g/m²','100% bawełna','S–3XL',10),
  ('Bluzy','Essential'):('essential-406','300 g/m²','65% bawełna, 35% poliester','S–3XL',10),
  ('Bluzy','Trendy Zipper'):('trendy-zipper-410','300 g/m²','65% bawełna, 35% poliester','S–3XL',10),
  ('Bluzy','Cape'):('cape-413','320 g/m²','65% bawełna, 35% poliester','S–3XL',10),
  ('Czapki','Czapka bejsbolówka'):('6p-305','340 g/m²','100% bawełna','Uniwersalny',10),
  ('Czapki','Czapka raperka'):('rap-5p-301','340 g/m²','100% bawełna','Uniwersalny',7),
  ('Czapki','Czapka dziecięca'):('6p-kids-303','340 g/m²','100% bawełna','Dziecięcy',10),
 }
 for (cat,model),(slug,gram,material,sizes,ncolors) in expected.items():
  setv('#appCategory',cat); setv('#appProduct',model)
  page.wait_for_selector('.d24-malfini-title',timeout=6000)
  facts={d.locator('span').inner_text():d.locator('strong').inner_text() for d in page.locator('.d24-malfini-facts > div').all()}
  assert facts['Gramatura']==gram,(model,facts)
  assert material in facts['Materiał'] and 'potwierdzenia' not in facts['Materiał'],(model,facts)
  assert facts['Rozmiary'].startswith(sizes) and 'ustalenia' not in facts['Rozmiary'],(model,facts)
  href=page.locator('.d24-malfini-link').get_attribute('href')
  assert href.startswith('https://shop.malfini.com/pl/pl/product/'+slug+'?color='),(model,href)
  assert page.locator('.d24-malfini-swatch').count()>=ncolors,(model,page.locator('.d24-malfini-swatch').count())
 # link podąża za wybranym kolorem
 setv('#appCategory','Koszulki poliestrowe'); setv('#appProduct','Fantasy 150 g')
 page.locator('[data-app-color="91"]').click(); page.wait_for_timeout(300)
 assert page.locator('.d24-malfini-link').get_attribute('href').endswith('fantasy-124?color=91')
 # Basic bez „unisex”
 setv('#appCategory','Koszulki bawełniane'); setv('#appProduct','Basic 160 g')
 assert page.locator('.d24-malfini-subtitle').inner_text().strip()=='Koszulka bawełniana · 160 g'
 # --- kamizelki: odzież 25/35 zł + nadruki jak w koszulkach ---
 def add(qty):
  page.locator('#appQty').fill(str(qty)); page.wait_for_timeout(250); page.locator('#calculate').click(); page.wait_for_timeout(450)
  return re.sub(r'\s+',' ',page.locator('#quoteArea').text_content())
 setv('#appCategory','Kamizelki odblaskowe'); setv('#appProduct','Brixton Flash')
 assert page.locator('#appFront option').all_inner_texts()==['Do 10x15 cm','Brak']
 assert page.locator('#appBack option').all_inner_texts()==['Do 10x15 cm','Do 20x30 cm','Brak']
 assert page.locator('#appFront').input_value()=='Do 10x15 cm' and page.locator('#appBack').input_value()=='Brak'
 assert 'Cena brutto40,00 zł' in add(1)
 setv('#appFront','Brak'); setv('#appBack','Do 20x30 cm')
 assert 'Cena brutto45,00 zł' in add(1)
 setv('#appFront','Do 10x15 cm')
 assert 'Cena brutto60,00 zł' in add(1)
 assert 'Cena brutto540,00 zł' in add(10)
 setv('#appFront','Brak'); setv('#appBack','Brak')
 assert 'Wybierz przynajmniej jeden nadruk' in add(1)
 setv('#appProduct','Malfini Rimeck')
 assert page.locator('#appFront option').all_inner_texts()==['Do 10x15 cm','Brak']
 assert 'Cena brutto50,00 zł' in add(1)
 setv('#appBack','Do 20x30 cm'); setv('#appFront','Brak')
 assert 'Cena brutto55,00 zł' in add(1)
 # --- czapki ---
 for model,price in [('Czapka bejsbolówka','50,00'),('Czapka raperka','55,00'),('Czapka dziecięca','45,00')]:
  setv('#appCategory','Czapki'); setv('#appProduct',model)
  assert page.locator('#appFrontField').is_hidden() and page.locator('#appPositionField').is_hidden()
  assert f'Cena brutto{price} zł' in add(1),model
 assert not errors,errors
 print('APPAREL 0.25.1 BROWSER OK',flush=True)
 browser.close()
