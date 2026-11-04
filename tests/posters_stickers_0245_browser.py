"""0.24.5: plakaty (cena 500 szt. A3 pod formatem, ilości wielkoformatowe 1/3/6/10/20, maks. 30, własna ilość tylko w wielkoformatowym, plakietka 24h) i etykieta „Ilość sztuk” przy naklejkach."""
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
 def setv(sel,val):
  page.evaluate("([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))}",[sel,val])
 def open_page(name):
  page.locator(f'nav#navigation button[data-page="{name}"]').first.evaluate('(b)=>b.click()')
  page.wait_for_timeout(600)
 tiles=lambda sel: page.locator(sel).all_inner_texts()
 open_page('Plakaty 24h')
 fmt='.field:has(#posterFormat) .d24-smart-choice'
 qtyt='#posterQtyWrap .d24-smart-choice'
 own=page.locator('#posterOwnQtyToggle')

 # 1) Offset A3: po wybraniu 500 szt. kafelek formatu A3 pokazuje 575,00 zł.
 setv('#posterPrint','Offsetowy'); page.wait_for_timeout(400)
 setv('#posterFormat','A3'); page.wait_for_timeout(400)
 page.locator(qtyt,has_text='500').first.click(); page.wait_for_timeout(500)
 assert page.locator('#posterQty').input_value()=='500'
 a3=page.locator(fmt).first.inner_text()
 print('A3 tile @500:',repr(a3),flush=True)
 assert a3.startswith('A3') and '575,00 zł' in a3,a3
 q500=page.locator(qtyt,has_text='500').first.inner_text()
 assert '575,00 zł' in q500 and q500.count('za sztukę')==1,q500   # brak zdublowanej linii po kliknięciu
 for t in tiles(qtyt): assert t.count('za sztukę')==1,t
 # przy 100 szt. nadal pokazują się różnice cen pozostałych formatów
 page.locator(qtyt,has_text='100').first.click(); page.wait_for_timeout(500)
 texts=tiles(fmt)
 # 0.24.8: każdy format pokazuje faktyczną cenę całego zamówienia, bez różnic „+/−”.
 assert [t.split('\n')[-1] for t in texts[:5]]==['305,00 zł','595,00 zł','1075,00 zł','680,00 zł','1320,00 zł'],texts
 assert not any(('+' in t or '−' in t) for t in texts),texts
 assert not own.is_visible(),'Własna ilość nie istnieje w offsecie.'

 # 2) Druk wielkoformatowy: plakietka 24h, kafelki 1/3/6/10/20 bez cen za sztukę.
 tech=page.locator('.d24-technology-select--posters [data-print-mode]')
 badges=[tech.nth(i).locator('.service-badge-24h').count() for i in range(3)]
 print('24h badges per technology tile:',badges,flush=True)
 assert badges==[0,0,1],badges
 assert 'Druk wielkoformatowy' in tech.nth(2).inner_text() and '24h' in tech.nth(2).inner_text()
 tech.nth(2).click(); page.wait_for_timeout(600)
 choices=page.locator(qtyt)
 assert [c.get_attribute('data-option-value') for c in choices.all()]==['1','3','6','10','20']
 txt=tiles(qtyt); print('Large tiles:',txt,flush=True)
 for t in txt:
  assert 'szt.' not in t and 'za sztukę' not in t and 'zł/szt' not in t,t
  assert 'zł' in t,t
 assert txt[0].split('\n')[0]=='1' and '30,00 zł' in txt[0]
 assert '75,00 zł' in txt[1] and '132,00 zł' in txt[2] and '200,00 zł' in txt[3] and '400,00 zł' in txt[4],txt
 page.locator(qtyt+'[data-option-value="6"]').click(); page.wait_for_timeout(500)
 for t in tiles(qtyt): assert 'za sztukę' not in t,t
 assert page.locator('#posterQty').input_value()=='6'
 assert [o for o in page.locator('#posterQty option').all_inner_texts()][:3]==['1','2','3']
 assert page.locator('#posterQty option').count()==30   # 1–30 zostaje dla asystenta i presetów

 # 3) Własna ilość: tylko wielkoformatowy, maks. 30.
 assert own.is_visible()
 own.click()
 box=page.locator('#posterOwnQty')
 assert box.get_attribute('max')=='30'
 box.fill('30'); page.wait_for_timeout(400)
 assert page.locator('#posterQty').input_value()=='30'
 assert 'Cena zostanie obliczona' in page.locator('#posterOwnQtyNote').inner_text()
 assert '600' in page.locator('#calculate').inner_text(),page.locator('#calculate').inner_text()
 box.fill('31'); page.wait_for_timeout(400)
 assert 'od 1 do 30' in page.locator('#posterOwnQtyNote').inner_text()
 assert 'sprawdź parametry' in page.locator('#calculate').inner_text().lower()
 box.fill('100'); page.wait_for_timeout(400)
 assert 'sprawdź parametry' in page.locator('#calculate').inner_text().lower()
 assert 'do 30 sztuk' in page.locator('#posterInfo').inner_text() and '100 sztuk' not in page.locator('#posterInfo').inner_text()

 # 4) Wyjście do cyfry/offsetu chowa przycisk i panel.
 tech.nth(0).click(); page.wait_for_timeout(500)
 assert not own.is_visible() and not page.locator('#posterOwnQtyPanel').is_visible()
 assert [c.get_attribute('data-option-value') for c in page.locator(qtyt).all()]==['5','10','20','50']
 tech.nth(2).click(); page.wait_for_timeout(500)
 assert own.is_visible() and not page.locator('#posterOwnQtyPanel').is_visible() and page.locator('#posterQty').input_value()=='1'

 # 5) Mobile bez przewijania w poziomie.
 page.set_viewport_size({'width':375,'height':812}); page.wait_for_timeout(300)
 w=page.evaluate('({s:document.documentElement.scrollWidth,c:document.documentElement.clientWidth})')
 assert w['s']<=w['c']+1,w
 page.set_viewport_size({'width':1440,'height':900})

 # 6) Naklejki: „Ilość sztuk”.
 open_page('Naklejki, etykiety i magnesy')
 label=page.locator('label[for="stickQty"]').inner_text().strip()
 print('Sticker qty label:',label,flush=True)
 assert label=='Ilość sztuk',label
 assert 'Liczba naklejek' not in page.locator('#content').inner_text()

 # 7) EN: plakietka i etykieta po angielsku.
 open_page('Plakaty 24h')
 page.locator('[data-language-toggle], #languageToggle, button:has-text("EN")').first.evaluate('(b)=>b.click()')
 page.wait_for_timeout(700)
 big=page.locator('.d24-technology-select--posters [data-print-mode="large"]')
 print('EN large tile:',repr(big.inner_text()),flush=True)
 assert big.locator('.service-badge-24h').count()==1
 assert 'Large-format printing' in big.inner_text() and 'Formats A2–B0' in big.inner_text(),big.inner_text()
 assert not errors,errors
 print('POSTERS + STICKERS 0.24.5 BROWSER OK',flush=True)
 browser.close()
