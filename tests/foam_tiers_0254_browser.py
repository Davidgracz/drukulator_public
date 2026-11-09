"""0.25.4: pianki wyglądają jak plakaty wielkoformatowe — kafelki formatów (+ „Własny wymiar”), kafelki ilości 1, 3, 5, 10, 20,
„+ Własna ilość”, tabela cen za sztukę według progów 1 / 2–4 / 5–9 / od 10 szt.; migracja starych zapisanych cen."""
import json,re,subprocess,shutil,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html=re.sub(r'<img[^>]*>','',html,flags=re.I)
styles=['assets/styles.css','assets/frontend-refresh.css','assets/druk24-brand-forms.css','assets/product-preview.css','assets/checkout-experience.css','assets/intelligent-search.css','assets/quote-assistant-235.css','assets/intelligent-configurator.css','assets/variant-comparison.css','assets/changes-02313.css','assets/malfini-preview.css','assets/compact-choices.css','assets/order-experience-239.css','assets/ux-clarity.css']
scripts=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/malfini-preview.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js','js/variant-comparison.js']
prices,terms,cases=[json.loads((root/f).read_text()) for f in ['data/prices.json','data/search-terms.json','data/case-items.json']]
P='Plansza pianka 5 mm'
formats=prices['pvc'][P]['formaty']
def tier(name,q): 
    t=[x for x in formats[name]['progi_ilosciowe'] if x['min_szt']<=q][-1]; return t['cena_sztuki']
def zl(v): return ('%.2f'%v).replace('.',',')
def validator_source():
    src=(root/'send-order.php').read_text()
    fn=src[src.index('function drukulator_number('):src.index('function drukulator_uploaded_files(')]
    return '''<?php
function sanitize_key($s){ return strtolower(preg_replace('/[^a-z0-9_\\-]/i','',(string)$s)); }
function sanitize_text_field($s){ return trim(strip_tags((string)$s)); }
function drukulator_limit_message($m){ return $m; }
class Rejected extends Exception {}
function drukulator_response($ok,$msg,$status=200){ throw new Rejected($msg); }
'''+fn+'''
$items=json_decode(file_get_contents($argv[1]),true); $out=array();
foreach($items as $i=>$it){ try{ drukulator_validate_item_limits($it,$it['title']); $out[$i]='ok'; }catch(Rejected $e){ $out[$i]=$e->getMessage(); } }
echo json_encode($out,JSON_UNESCAPED_UNICODE);
'''
def php_validate(items):
    if not shutil.which('php'): return None
    d=tempfile.mkdtemp(); open(d+'/v.php','w').write(validator_source()); open(d+'/items.json','w').write(json.dumps(items))
    return json.loads(subprocess.run(['php',d+'/v.php',d+'/items.json'],capture_output=True,text=True,check=True).stdout)
def boot(browser,width,saved=None,lang=None):
    page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=20000)
    page.evaluate('''(saved)=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});if(saved)st.setItem('drukulator_prices_override_0_18_2',JSON.stringify(saved));}''',saved)
    page.evaluate('''([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}''',[prices,terms,cases])
    for style in styles: page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
    for script in scripts: page.add_script_tag(content=(root/script).read_text())
    page.wait_for_selector('#homeProductSearch',timeout=15000)
    page.locator('button.nav-button[data-page="PCV i pianki"]').first.evaluate('(n)=>n.click()')
    page.wait_for_selector('#pvcProduct'); page.wait_for_timeout(300)
    page.locator('#pvcProduct').select_option(label=P); page.wait_for_timeout(600)
    return page,errors
FMT='#foamFormat + .d24-smart-options'
QTY='#foamQtyWrap .d24-smart-options'
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width)
        # --- format: 6 kafelków z cennika + „Własny wymiar” (jak w plakatach), cena za sztukę dla wybranej ilości (1 szt.)
        tiles=page.locator(FMT+' button[data-option-index]')
        assert tiles.count()==7,tiles.count()
        assert page.locator(FMT+' button',has_text='Własny wymiar').count()==1
        assert page.locator('#foamMode').count()==0                       # stary przełącznik „Sposób wyboru wymiaru” zniknął
        assert page.locator('#foamFormat').input_value()=='A3 (30 × 42 cm)'
        for name in formats:
            tile=page.locator(FMT+' button[data-option-index]',has_text=name.split(' (')[0]).first
            assert tile.locator('.d24-option-price').inner_text().replace(' ',' ')==zl(tier(name,1))+' zł/szt.',name
        assert page.locator(FMT+' .d24-smart-choice small').count()==0   # bez rozmiaru w mm
        # --- ilości: dokładnie 1, 3, 5, 10, 20 (jak w plakatach), bez cen na kafelkach
        qt=page.locator(QTY+' button[data-option-index]')
        assert [qt.nth(i).inner_text().strip() for i in range(qt.count())]==['1','3','5','10','20'],qt.count()
        assert page.locator('#pvcQty').input_value()=='1'
        # --- tabela progów: nagłówki 1 / 2–4 / 5–9 / od 10 szt., ceny jak w cenniku
        heads=[h.strip() for h in page.locator('.d24-foam-tier-table thead th').all_inner_texts()]
        assert heads==['Format','1 szt.','2–4 szt.','5–9 szt.','od 10 szt.'],heads
        rows=page.locator('.d24-foam-tier-table tbody tr')
        assert rows.count()==6
        for i,name in enumerate(formats):
            cells=[c.replace(' ',' ').strip() for c in rows.nth(i).locator('td').all_inner_texts()]
            assert cells[1:]==[f'{tier(name,q)} zł' for q in (1,2,5,10)],(name,cells)
        assert page.locator('.d24-foam-tier-table tbody tr.is-selected').get_attribute('data-foam-format')=='A3 (30 × 42 cm)'
        assert page.locator('.d24-foam-tier-table thead th.is-active-tier').inner_text().strip()=='1 szt.'
        # --- klik w ilość 5 zmienia cenę na kafelkach i wyróżnioną kolumnę
        page.locator(QTY+' button',has_text='5').first.click(); page.wait_for_timeout(300)
        assert page.locator('#pvcQty').input_value()=='5'
        a3=page.locator(FMT+' button',has_text='A3').first.locator('.d24-option-price').inner_text().replace(' ',' ')
        assert a3==zl(40)+' zł/szt.',a3
        assert page.locator('.d24-foam-tier-table thead th.is-active-tier').inner_text().strip()=='5–9 szt.'
        # --- wybór formatu B1 przy 5 szt. = 100 zł × 5
        page.locator(FMT+' button',has_text='B1').first.click(); page.wait_for_timeout(500)
        assert '500,00' in page.locator('#calculate').inner_text(),page.locator('#calculate').inner_text()
        # --- ilość 10 → próg „od 10 szt.” (90 zł × 10)
        page.locator(QTY+' button',has_text='10').first.click(); page.wait_for_timeout(500)
        assert '900,00' in page.locator('#calculate').inner_text()
        assert page.locator('.d24-foam-tier-table thead th.is-active-tier').inner_text().strip()=='od 10 szt.'
        # --- „Własna ilość”: 4 szt. → próg 2–4; błędne wartości odrzucone
        page.locator('#foamOwnQtyToggle').click(); page.wait_for_timeout(200)
        assert page.locator('#foamOwnQtyPanel').is_visible()
        page.locator('#foamOwnQty').fill('4'); page.wait_for_timeout(500)
        assert page.locator('#pvcQty').input_value()=='4'
        assert '440,00' in page.locator('#calculate').inner_text()           # B1: 110 zł × 4
        assert page.locator('.d24-foam-tier-table thead th.is-active-tier').inner_text().strip()=='2–4 szt.'
        page.locator('#foamOwnQty').fill('101'); page.wait_for_timeout(300)
        assert page.locator('#foamOwnQtyNote').get_attribute('data-status')=='error'
        page.locator('#foamOwnQty').fill('0'); page.wait_for_timeout(300)
        assert page.locator('#foamOwnQtyNote').get_attribute('data-status')=='error'
        page.locator('#foamOwnQty').fill('100'); page.wait_for_timeout(400)
        assert page.locator('#foamOwnQtyNote').get_attribute('data-status')=='success'
        assert '9000,00' in page.locator('#calculate').inner_text().replace(' ','').replace(' ','') or '9 000,00' in page.locator('#calculate').inner_text().replace(' ',' ')
        # kafelek ilości wyłącza własną ilość
        page.locator(QTY+' button',has_text='3').first.click(); page.wait_for_timeout(300)
        assert page.locator('#foamOwnQtyToggle').get_attribute('aria-pressed')=='false'
        assert page.locator('#pvcQty').input_value()=='3'
        # --- „Własny wymiar”: format rozliczeniowy, cena progu, wyróżniony wiersz tabeli
        page.locator(FMT+' button',has_text='Własny wymiar').first.click(); page.wait_for_timeout(400)
        page.locator('#pvcWidth').fill('45'); page.locator('#pvcHeight').fill('60'); page.wait_for_timeout(400)
        notice=page.locator('#foamBillingNotice').inner_text()
        assert '45 × 60 cm' in notice and 'B2 (50 × 70 cm)' in notice,notice
        assert page.locator('.d24-foam-tier-table tbody tr.is-selected').get_attribute('data-foam-format')=='B2 (50 × 70 cm)'
        assert '180,00' in page.locator('#calculate').inner_text()           # B2 przy 3 szt.: 60 zł × 3
        page.locator(QTY+' button',has_text='20').first.click(); page.wait_for_timeout(400)
        assert '1000,00' in page.locator('#calculate').inner_text().replace(' ','').replace(' ','') or '1 000,00' in page.locator('#calculate').inner_text().replace(' ',' ')
        page.locator('#pvcWidth').fill('120'); page.locator('#pvcHeight').fill('120'); page.wait_for_timeout(400)
        assert 'alert error' in page.locator('#foamBillingNotice').inner_html()
        page.locator('#pvcWidth').fill('45'); page.locator('#pvcHeight').fill('60'); page.wait_for_timeout(300)
        page.locator(QTY+' button',has_text='1').first.click(); page.wait_for_timeout(300)   # 1 szt.
        # --- koszyk: pozycja foam z wymiarami i ilością, serwer ją przyjmuje
        page.locator('#calculate').click(); page.wait_for_timeout(500)
        cart=json.loads(page.evaluate("localStorage.getItem('drukulator_cart')") or '[]')
        item=cart[-1]
        assert item['title']=='Plansza pianka 5 mm' and item['price']==65 and item['meta']['productType']=='foam',item
        assert item['meta']['widthCm']==45 and item['meta']['heightCm']==60 and item['meta']['quantity']==1,item['meta']
        assert ('Próg ilościowy','1 szt.') in [tuple(r) for r in item['details']],item['details']
        res=php_validate(cart)
        if res is None: print('UWAGA: brak php — pominięto walidator serwera')
        else: assert res[len(cart)-1]=='ok',res
        # --- standardowy format w koszyku: A2 × 3 = 150
        page.locator(FMT+' button',has_text='A2').first.click(); page.wait_for_timeout(300)
        page.locator(QTY+' button',has_text='3').first.click(); page.wait_for_timeout(300)
        page.locator('#calculate').click(); page.wait_for_timeout(500)
        item=json.loads(page.evaluate("localStorage.getItem('drukulator_cart')"))[-1]
        assert item['price']==150 and item['description']=='A2 (42 × 59 cm), 3 szt.',item
        # --- PCV z folią: nadal zwykłe pole liczby (nie kafelki)
        page.locator('#pvcProduct').select_option(label='Folia z nadrukiem + PCV'); page.wait_for_timeout(500)
        assert page.locator('input#pvcQty').count()==1 and page.locator('#foamQtyWrap').count()==0
        page.locator('#pvcProduct').select_option(label=P); page.wait_for_timeout(500)
        # --- EN
        page.locator('button',has_text='EN').first.click(); page.wait_for_timeout(700)
        page.locator(FMT+' button',has_text='A3').first.click(); page.wait_for_timeout(300)
        text=page.locator('#content').inner_text()
        assert 'Gross price per piece' in text and 'from 10 pcs' in text and '2–4 pcs' in text,text[:2500]
        assert 'zostanie' not in text and 'Własna ilość' not in text
        assert not errors,errors
        dims=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')
        assert dims['scroll']<=dims['inner']+1,(width,dims)
        # tabela nie wychodzi poza kartę (przewija się wewnątrz na bardzo wąskim ekranie)
        print('PASS foam tiers 0.25.4 width',width,flush=True)
        page.close()
    # --- migracja: zapisane lokalnie stare ceny (pojedyncza „cena_sztuki”) nie psują cennika; nowe progi z pliku wygrywają
    old=json.loads(json.dumps(prices))
    for f in old['pvc'][P]['formaty'].values():
        f['cena_sztuki']=f['progi_ilosciowe'][0]['cena_sztuki']+1; del f['progi_ilosciowe']
    page,errors=boot(browser,1300,saved=old)
    assert [h.strip() for h in page.locator('.d24-foam-tier-table thead th').all_inner_texts()]==['Format','1 szt.','2–4 szt.','5–9 szt.','od 10 szt.']
    cells=[c.replace(' ',' ').strip() for c in page.locator('.d24-foam-tier-table tbody tr').first.locator('td').all_inner_texts()]
    assert cells[1:]==['50 zł','45 zł','40 zł','35 zł'],cells
    assert not errors,errors
    page.close()
    # zaimportowany/zapisany plik bez progów: jedna cena dla każdej ilości (stara cena zostaje jedynym progiem)
    legacy_only=json.loads(json.dumps(prices))
    for f in legacy_only['pvc'][P]['formaty'].values():
        f['cena_sztuki']=f['progi_ilosciowe'][0]['cena_sztuki']; del f['progi_ilosciowe']
    page=browser.new_page(viewport={'width':1300,'height':900},locale='pl-PL'); errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=20000)
    page.evaluate('''()=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});}''')
    page.evaluate('''([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}''',[legacy_only,terms,cases])
    for style in styles: page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
    for script in scripts: page.add_script_tag(content=(root/script).read_text())
    page.wait_for_selector('#homeProductSearch',timeout=15000)
    page.locator('button.nav-button[data-page="PCV i pianki"]').first.evaluate('(n)=>n.click()'); page.wait_for_selector('#pvcProduct')
    page.locator('#pvcProduct').select_option(label=P); page.wait_for_timeout(600)
    assert [h.strip() for h in page.locator('.d24-foam-tier-table thead th').all_inner_texts()]==['Format','od 1 szt.'],'jeden próg'
    page.locator(QTY+' button',has_text='10').first.click(); page.wait_for_timeout(400)
    assert '500,00' in page.locator('#calculate').inner_text()        # A3: 50 zł × 10 — jedna cena dla każdej ilości
    assert not errors,errors
    browser.close()
print('PASS foam_tiers_0254_browser')
