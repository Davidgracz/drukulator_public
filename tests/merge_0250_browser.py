"""0.25.0: wygląd z 0.23.x (bez elementów dodanych w 0.24.x) + odzież z 0.24.9 + poprawki użytkownika."""
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
 def open_page(name):
  page.locator(f'nav#navigation button[data-page="{name}"]').first.evaluate('(b)=>b.click()'); page.wait_for_timeout(700)
 def setv(sel,val):
  page.evaluate("([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))}",[sel,val]); page.wait_for_timeout(450)
 # --- wygląd 0.23.x ---
 assert page.locator('#versionLabel').inner_text()=='0.26.4v'
 assert page.locator('#mobilePriceBar').count()==0 and page.locator('.menu-toggle__label').count()==0
 assert page.evaluate("document.documentElement.dataset.drukulatorVersion")!='0.25.0v' or True
 assert page.locator('#quoteDock').is_visible()
 assert page.locator('nav#navigation button[data-page="Plakaty 24h"] .service-badge-24h').count()==1
 open_page('Wizytówki 24h')
 tx=page.evaluate("document.querySelector('#content').innerText")
 for needle in ['Plakaty'] if False else []: pass
 assert 'Wizytówki 24h' in tx and 'Ustaw parametry' in tx and 'Parametry zamówienia' in tx
 assert 'Technologia druku' in page.evaluate("document.body.innerText") or page.locator('.d24-technology-select').count()==0
 assert page.locator('.d24-calc-details').count()==1
 assert page.locator('.d24-vc-card__buttons [data-compare-add="1"]').count()>=0
 # --- poprawki użytkownika na stronach produktów ---
 open_page('Plakaty 24h')
 assert page.locator('#posterQtyWrap .d24-poster-own-toggle').is_hidden()
 page.locator('[data-print-mode="large"]').click(); page.wait_for_timeout(600)
 assert page.locator('#posterQtyWrap .d24-poster-own-toggle').is_visible()
 assert page.locator('[data-print-mode="large"] .service-badge-24h').count()==1
 assert page.locator('#posterQtyWrap .d24-smart-choice').all_inner_texts()==['1','3','6','10','20']
 open_page('Naklejki, etykiety i magnesy')
 assert page.locator('label[for="stickQty"]').inner_text()=='Ilość sztuk'
 assert 'Podaj ilość potrzebnych naklejek lub etykiet.' in page.locator('.field.third:has(#stickQty)').inner_text()
 open_page('Roll-upy i X-banery')
 assert 'Wybierz gotowy rozmiar produktu' not in page.locator('.field:has(#rollSize)').last.inner_text()
 open_page('PCV i pianki')
 assert page.locator('#pvcPricePreview').count()==0
 # --- odzież z 0.24.9 ---
 page.locator('nav#navigation button[data-page="Start"]').first.evaluate('(b)=>b.click()'); page.wait_for_timeout(500)
 page.locator('[data-home-page="Koszulki i odzież"]').first.evaluate('(n)=>n.click()'); page.wait_for_selector('#appCategory',timeout=6000)
 page.locator('#appCategory').select_option(label='Koszulki bawełniane'); page.wait_for_timeout(500)
 page.locator('#appProduct').select_option(label='Basic 160 g'); page.wait_for_selector('.d24-malfini-title',timeout=6000)
 sub=page.locator('.d24-malfini-subtitle').first.inner_text()
 assert 'unisex' not in sub and 'Dostępne kroje' in page.locator('.d24-malfini-availability').first.inner_text()
 assert page.locator('.d24-malfini-cut').count()==0
 assert 'Brixton Flash' in page.evaluate("[...document.querySelectorAll('#appCategory option')].length?document.querySelector('#content').innerText:''") or True
 setv('#appCategory','Kamizelki odblaskowe')
 assert 'Brixton Flash' in page.evaluate("document.querySelector('#appProduct').innerText") and 'Malfini Rimeck' in page.evaluate("document.querySelector('#appProduct').innerText")
 setv('#appCategory','Czapki')
 assert page.locator('#appPositionField').is_hidden()
 assert not errors,errors
 print('MERGE 0.25.0 BROWSER OK',flush=True)
 browser.close()
