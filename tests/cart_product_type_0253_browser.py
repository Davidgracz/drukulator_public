"""0.25.3: pozycje dodane do koszyka mają typ produktu, więc serwer nie zgłasza „pozycja ze starszej wersji kalkulatora”
(X-baner, komplet magnesy + naklejki taxi); stare pozycje X-baner/taxi w koszyku zapisanym w przeglądarce są uzupełniane."""
import json,re,struct,zlib,tempfile,os
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
import subprocess,shutil
legacy=[
  {"id":1,"title":"X-baner","description":"X-baner, 80 x 180 cm, 1 szt.","price":100,"details":[]},
  {"id":2,"title":"Komplet magnesy + naklejki taxi","description":"x, 1 szt./kompletów","price":120,"details":[]},
  {"id":3,"title":"Roll-up Standard","description":"x","price":150,"details":[]},
  {"id":4,"title":"Plakaty 24h","description":"stary plakat bez danych","price":50,"details":[]},
]
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
foreach($items as $it){ try{ drukulator_validate_item_limits($it,$it['title']); $out[$it['title']]='ok'; }catch(Rejected $e){ $out[$it['title']]=$e->getMessage(); } }
echo json_encode($out,JSON_UNESCAPED_UNICODE);
'''
def php_validate(items):
    if not shutil.which('php'): return None
    d=tempfile.mkdtemp(); open(d+'/v.php','w').write(validator_source()); open(d+'/items.json','w').write(json.dumps(items))
    return json.loads(subprocess.run(['php',d+'/v.php',d+'/items.json'],capture_output=True,text=True,check=True).stdout)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900},locale='pl-PL')
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=20000)
    page.evaluate('''(cart)=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});st.setItem('drukulator_cart',JSON.stringify(cart));}''',legacy)
    page.evaluate('''([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}''',[prices,terms,cases])
    for style in styles: page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
    for script in scripts: page.add_script_tag(content=(root/script).read_text())
    page.wait_for_selector('#homeProductSearch',timeout=15000)
    cart=lambda: json.loads(page.evaluate("localStorage.getItem('drukulator_cart')") or '[]')
    # 1) pozycje z koszyka zapisanego przed aktualizacją: X-baner, roll-up i komplet taxi dostają typ, plakat bez danych — nie
    page.evaluate("()=>document.querySelector('button.nav-button[data-page=\"Roll-upy i X-banery\"]').click()"); page.wait_for_timeout(400)
    page.locator('#rollProduct').select_option('X-baner'); page.locator('#calculate').click(); page.wait_for_timeout(400)
    saved={i['title']:i for i in cart()}
    types={t:(i.get('meta') or {}).get('productType') for t,i in saved.items()}
    assert types['Roll-up Standard']=='rollup',types
    assert types['Komplet magnesy + naklejki taxi']=='taxi',types
    assert types['Plakaty 24h'] is None,types
    # 2) nowa pozycja X-baner z kalkulatora ma typ produktu
    xb=[i for i in cart() if i['title']=='X-baner']
    assert len(xb)==2 and all(i['meta']['productType']=='rollup' for i in xb),xb
    # 3) komplet taxi z kalkulatora
    page.evaluate("()=>document.querySelector('button.nav-button[data-page=\"Naklejki, etykiety i magnesy\"]').click()"); page.wait_for_timeout(400)
    page.locator('#stickProduct').select_option('Komplet magnesy + naklejki taxi'); page.locator('#calculate').click(); page.wait_for_timeout(400)
    taxi=[i for i in cart() if i['title']=='Komplet magnesy + naklejki taxi']
    assert len(taxi)==2 and all(i['meta']['productType']=='taxi' for i in taxi),taxi
    # 4) produkt bez własnych danych (laminowanie) też dostaje typ „other”, a istniejące typy zostają
    page.evaluate("()=>document.querySelector('button.nav-button[data-page=\"Laminowanie\"]').click()"); page.wait_for_timeout(400)
    page.locator('#calculate').click(); page.wait_for_timeout(400)
    lam=[i for i in cart() if i['title']=='Laminowanie']
    assert lam and lam[0]['meta']['productType']=='other',lam
    page.evaluate("()=>document.querySelector('button.nav-button[data-page=\"Obrazy na płótnie\"]').click()"); page.wait_for_timeout(500)
    page.locator('#calculateCanvas').click(); page.wait_for_timeout(400)
    can=[i for i in cart() if i['title']=='Obrazy na płótnie']
    assert can and can[0]['meta']['productType']=='canvas',can
    # 5) walidator serwera (wycięty z send-order.php): nowe pozycje przechodzą, stara pozycja bez danych nadal jest odrzucana
    result=php_validate(cart())
    if result is None: print('UWAGA: brak php — pominięto walidator serwera')
    else:
        items=cart()
        for i in items:
            if i['title']=='Plakaty 24h': assert 'starszej wersji' in result[i['title']],result
        for t in ('X-baner','Komplet magnesy + naklejki taxi','Roll-up Standard','Laminowanie','Obrazy na płótnie'):
            assert result[t]=='ok',(t,result[t])
    assert not errors,errors
    print('PASS 0.25.3 typ produktu w koszyku',flush=True)
    browser.close()
