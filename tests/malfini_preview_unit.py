from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parent.parent
script=(root/'js/malfini-preview.js').read_text()
css=(root/'assets/malfini-preview.css').read_text()
html='''<!doctype html><html><head><meta charset="utf-8"></head><body><main style="max-width:1080px;margin:20px auto"><select id="category"><option>Koszulki bawełniane</option><option>Kamizelki odblaskowe</option><option>Czapki</option><option>Torby i worki</option></select><select id="product"><option>Basic 160 g</option><option>Heavy New 200 g</option></select><div id="d24ApparelCatalog" class="d24-apparel-catalog"></div></main></body></html>'''
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (1440,390):
  page=b.new_page(viewport={'width':width,'height':900}, locale='pl-PL')
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded',timeout=8000)
  page.add_style_tag(content=css)
  page.add_script_tag(content=script)
  page.evaluate('''()=>{window.gallery=D24MalfiniPreview.mount(document.getElementById('d24ApparelCatalog'));gallery.render({category:'Koszulki bawełniane',product:'Basic 160 g'});}''')
  assert 'Basic 129' in page.locator('.d24-malfini-title').inner_text()
  assert page.locator('.d24-malfini-swatch').count()==12
  assert page.locator('[data-app-view]').count()==3
  # 0.24.1: no print-area overlay or controls under the visualisation, only colour (and cut) choices.
  for gone in ('.d24-malfini-print-area','.d24-malfini-print-controls','.d24-malfini-print-toggle','.d24-malfini-print-reset','.d24-malfini-print-hint'):
   assert page.locator(gone).count()==0,gone
  # 0.24.7: przyciski wyboru kroju i cały blok „Krój” usunięte; opis i dostępne kroje zostają jako tekst.
  for gone in ('[data-app-cut]','.d24-malfini-cuts','.d24-malfini-cut-options','.d24-malfini-cut-note','.d24-malfini-cut-fixed'):
   assert page.locator(gone).count()==0,gone
  assert 'Krój' not in page.locator('.d24-malfini-detail').inner_text().replace('Dostępne kroje','')
  assert page.locator('.d24-malfini-subtitle').inner_text().strip()=='Koszulka bawełniana · 160 g · unisex',page.locator('.d24-malfini-subtitle').inner_text()
  assert page.locator('.d24-malfini-availability').inner_text().strip()=='Dostępne kroje: męski, damski i dziecięcy'
  # Krój nie jest wybierany, więc nie trafia do zamówienia (modele z wieloma krojami).
  assert page.evaluate('gallery.selection().cut')=='' and page.evaluate('gallery.selection().cutLabel')==''
  page.locator('[data-app-color="01"]').click()
  assert 'Czarny' in page.locator('.d24-malfini-color-label').inner_text()
  page.locator('[data-app-view="back"]').click()
  assert page.locator('[data-app-view="back"]').get_attribute('aria-pressed')=='true'
  assert page.evaluate('gallery.selection().colorCode')=='01'
  overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth')
  assert not overflow, width
  page.evaluate("gallery.render({category:'Koszulki bawełniane',product:'Heavy New 200 g'})")
  assert 'Heavy New 137' in page.locator('.d24-malfini-title').inner_text()
  assert page.locator('[data-app-cut]').count()==0 and page.locator('.d24-malfini-cut-fixed').count()==0
  assert page.evaluate('gallery.selection().cutLabel')=='unisex'   # jedyny możliwy krój zostaje w zamówieniu
  assert page.locator('.d24-malfini-subtitle').inner_text().strip()=='Koszulka bawełniana oversize · 200 g · unisex'
  assert page.locator('.d24-malfini-availability').count()==0
  # Zmiana modelu nie przywraca wyboru kroju (przyciski usunięte).
  page.evaluate("gallery.render({category:'Koszulki bawełniane',product:'Basic 160 g'});gallery.render({category:'Koszulki bawełniane',product:'Classic New 145 g'})")
  assert page.evaluate('gallery.selection().cut')=='' and page.locator('[data-app-cut]').count()==0
  # Vests: two models, two colours each, shown like shirts.
  page.evaluate("gallery.render({category:'Kamizelki odblaskowe',product:'Brixton Flash'})")
  assert 'Brixton Flash' in page.locator('.d24-malfini-title').inner_text()
  assert page.locator('.d24-malfini-swatch').count()==2
  assert page.locator('[data-app-view]').count()==3
  assert page.locator('[data-app-cut]').count()==0
  assert 'Żółty' in page.locator('.d24-malfini-color-label').inner_text()
  page.locator('.d24-malfini-swatch').nth(1).click()
  assert 'Pomarańczowy' in page.locator('.d24-malfini-color-label').inner_text()
  assert page.evaluate('gallery.selection().colorName')=='Pomarańczowy fluorescencyjny'
  assert 'S–3XL' in page.locator('.d24-malfini-facts').inner_text()
  assert page.locator('.d24-malfini-link').get_attribute('href').startswith('https://polstar.com.pl/')
  page.evaluate("gallery.render({category:'Kamizelki odblaskowe',product:'Malfini Rimeck'})")
  assert 'Rimeck' in page.locator('.d24-malfini-title').inner_text()
  assert page.locator('.d24-malfini-swatch').count()==2
  assert 'M, 2XL' in page.locator('.d24-malfini-facts').inner_text()
  assert 'malfini.com' in page.locator('.d24-malfini-link').get_attribute('href')
  # Caps and bags: front only (no back view).
  page.evaluate("gallery.render({category:'Czapki',product:'Czapka bejsbolówka'})")
  assert page.locator('[data-app-view]').all_inner_texts()==['Przód','Profil']
  assert page.locator('.d24-malfini-subtitle').inner_text().strip()=='Czapka bejsbolówka'
  page.evaluate("gallery.render({category:'Torby i worki',product:'Carry'})")
  assert page.locator('.d24-malfini-subtitle').inner_text().strip()=='Torba bawełniana'
  assert page.locator('[data-app-view="back"]').count()==0
  assert not errors,errors
  print('PASS',width, 'cuts, no print area, two vests, front-only caps/bags, no overflow',flush=True)
  page.close()
 b.close()
