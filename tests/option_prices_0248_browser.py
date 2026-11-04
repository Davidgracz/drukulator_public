"""0.24.8/0.24.9 (0.25.0): kafelki opcji pokazują faktyczne ceny (bez „+/−”); kafelki ilości są bez cen."""
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
 import re
 sign=re.compile(r'(?<![\w])[+−–-]\s?\d[\d\s.,]*\s?zł|bez dopłaty|taniej')
 def setv(sel,val):
  page.evaluate("([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))}",[sel,val]); page.wait_for_timeout(450)
 def open_page(name):
  page.locator(f'nav#navigation button[data-page="{name}"]').first.evaluate('(b)=>b.click()'); page.wait_for_timeout(700)
 def price_tiles(): return page.locator('#content .field .d24-smart-choice:has(.d24-config-price)').all_inner_texts()
 def check_no_signs(tag):
  tx=page.evaluate("document.querySelector('#content').innerText")
  assert not sign.search(tx),(tag,sign.findall(tx))
 # Plakaty offset A3: faktyczne ceny formatów przy 100 szt.
 open_page('Plakaty 24h'); setv('#posterPrint','Offsetowy'); setv('#posterFormat','A3')
 page.locator('#posterQtyWrap .d24-smart-choice',has_text='100').first.click(); page.wait_for_timeout(500)
 t=page.locator('.field:has(#posterFormat) .d24-smart-choice').all_inner_texts()
 assert [x.split('\n')[-1] for x in t[:5]]==['305,00 zł','595,00 zł','1075,00 zł','680,00 zł','1320,00 zł'],t
 check_no_signs('plakaty offset')
 # Plakaty wielkoformatowe: formaty z cenami za 1 szt.
 page.locator('[data-print-mode="large"]').click(); page.wait_for_timeout(600)
 t=[x for x in price_tiles() if 'cm' in x]
 assert [x.split('\n')[-1] for x in t]==['30,00 zł','55,00 zł','100,00 zł','35,00 zł','65,00 zł','110,00 zł'],t
 check_no_signs('plakaty large')
 # Wizytówki: wykończenie i zadruk
 open_page('Wizytówki 24h')
 t=price_tiles(); print('BC',t,flush=True)
 assert [x.split('\n')[-1] for x in t[:4]]==['50,00 zł','80,00 zł','50,00 zł','60,00 zł'],t
 check_no_signs('wizytowki')
 # Karty porównania: brak różnic, są ceny łączne i za sztukę
 page.evaluate("document.querySelectorAll('details.d24-vc-fold').forEach(d=>d.open=true)"); page.wait_for_timeout(300)
 cards=page.locator('.d24-vc-card').all_inner_texts()
 assert cards and all(not sign.search(x) for x in page.locator('.d24-vc-card__difference').all_inner_texts())
 assert all('zł' in c for c in cards)
 check_no_signs('porownanie')
 # Naklejki: produkty z cenami całości
 open_page('Naklejki, etykiety i magnesy')
 t=[x for x in price_tiles() if 'zł' in x]
 assert t[0].endswith('100,00 zł') and any(x.endswith('120,00 zł') for x in t) and any(x.endswith('160,00 zł') for x in t),t
 check_no_signs('naklejki')
 # Podpowiedzi po wycenie: faktyczne ceny zamiast „+N szt. za +X zł”
 open_page('Ulotki 24h'); page.locator('#calculate').click(); page.wait_for_timeout(900)
 best=page.evaluate("document.querySelector('.best-value-card')?.textContent||''")
 assert re.search(r'200 szt\. za 150,00 zł zamiast 100 szt\. za 90,00 zł',best),best
 assert not re.search(r'\+\d',best),best
 open_page('Wizytówki 24h'); page.locator('#calculate').click(); page.wait_for_timeout(900)
 up=page.evaluate("document.querySelector('.variant-upgrade-card')?.textContent||''")
 assert 'za całe zamówienie (obecnie 50,00 zł)' in up and '+' not in up.replace('+ ',''),up
 # 0.24.9: kafelki „Ilość sztuk” bez żadnych cen (ani łącznej, ani „za sztukę”); ceny zostają przy formatach i innych opcjach.
 qty_probe="""()=>{const ids=['bcQuantity','flyQuantity','posterQty','digQty','bannerQty','stickQty','rollQty'];
   const out={rows:0,pricedQtyTiles:0,pricedOtherTiles:0};
   document.querySelectorAll('#content .field').forEach(f=>{const sel=f.querySelector(':scope > select');const row=f.querySelector(':scope > .d24-smart-options');if(!sel||!row)return;
     const n=row.querySelectorAll('.d24-config-price,.d24-config-unit').length;
     if(ids.includes(sel.id)){out.rows++;out.pricedQtyTiles+=n;}else out.pricedOtherTiles+=n;});
   return out;}"""
 for pg in ['Wizytówki 24h','Ulotki 24h','Plakaty 24h','Druk cyfrowy i ksero 24h','Folie i banery 24h','Naklejki, etykiety i magnesy','Roll-upy i X-banery']:
  open_page(pg)
  r=page.evaluate(qty_probe)
  assert r['pricedQtyTiles']==0,(pg,r)
  assert r['pricedOtherTiles']>0,(pg,r)   # ceny są przy formatach / materiałach / wykończeniach
 open_page('Plakaty 24h'); setv('#posterPrint','Offsetowy'); setv('#posterFormat','A3')
 page.locator('#posterQtyWrap .d24-smart-choice',has_text='500').first.click(); page.wait_for_timeout(500)
 assert page.locator('#posterQtyWrap .d24-smart-choice').all_inner_texts()==['100','250','500']
 assert page.locator('.field:has(#posterFormat) .d24-smart-choice').first.inner_text().split('\n')[-1]=='575,00 zł'
 assert not errors,errors
 print('OPTION PRICES 0.24.9 BROWSER OK',flush=True)
 browser.close()
