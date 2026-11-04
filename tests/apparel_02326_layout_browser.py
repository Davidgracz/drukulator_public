"""Check that apparel print sizes sit below model and use the flyer-like blue selection."""
import json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html=re.sub(r'<img[^>]*>','',html,flags=re.I)
styles=['assets/styles.css','assets/frontend-refresh.css','assets/druk24-brand-forms.css','assets/product-preview.css','assets/checkout-experience.css','assets/intelligent-search.css','assets/quote-assistant-235.css','assets/intelligent-configurator.css','assets/variant-comparison.css','assets/changes-02313.css','assets/malfini-preview.css','assets/compact-choices.css','assets/order-experience-239.css']
scripts=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/malfini-preview.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js','js/variant-comparison.js']
prices,terms,cases=[json.loads((root/f).read_text()) for f in ['data/prices.json','data/search-terms.json','data/case-items.json']]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in [1440,375]:
        page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
        errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded',timeout=20000)
        page.evaluate('''()=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});}''')
        page.evaluate('''([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes('prices.json')?pr:String(u).includes('search-terms.json')?tr:String(u).includes('case-items.json')?ci:{success:true}})}''',[prices,terms,cases])
        for css in styles:page.evaluate('css=>{const n=document.createElement("style");n.textContent=css;document.head.append(n);}',(root/css).read_text())
        for script in scripts:page.add_script_tag(content=(root/script).read_text())
        page.wait_for_selector('#homeProductSearch',timeout=15000)
        page.locator('[data-home-page="Koszulki i odzież"]').first.evaluate('(n)=>n.click()')
        page.wait_for_selector('#appFrontField .d24-smart-choice',timeout=10000)
        geom=page.evaluate('''()=>{
          const ids=['appProduct','appFrontField','appBackField','appQty'];
          const r=Object.fromEntries(ids.map(id=>{let e=document.getElementById(id).getBoundingClientRect();return [id,{left:e.left,right:e.right,top:e.top,bottom:e.bottom,width:e.width}]}));
          const button=document.querySelector('#appFrontField .d24-smart-choice[aria-pressed="true"]');
          r.blue={bg:getComputedStyle(button).backgroundColor,border:getComputedStyle(button).borderColor};
          return r;
        }''')
        assert geom['appFrontField']['top'] >= geom['appProduct']['bottom']-1,(width,geom)
        assert geom['appFrontField']['bottom'] <= geom['appBackField']['top']+2,(width,geom)
        assert geom['appBackField']['bottom'] <= geom['appQty']['top']+2,(width,geom)
        assert geom['blue']['border'].startswith('rgb('), geom
        assert geom['blue']['bg']!='rgb(255, 255, 255)',geom
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
        assert not errors, errors
        print('PASS apparel layout',width,geom['blue'],flush=True)
        page.close()
    browser.close()
