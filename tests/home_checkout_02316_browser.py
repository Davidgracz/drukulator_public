"""Druk24 0.23.16 UI: home order, 3 steps and cart totals including selected delivery."""
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text()
html = re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>', '', html, flags=re.I)
html = re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>', '', html, flags=re.I)
styles = ['assets/styles.css', 'assets/frontend-refresh.css', 'assets/druk24-brand-forms.css',
          'assets/product-preview.css', 'assets/checkout-experience.css', 'assets/intelligent-search.css',
          'assets/quote-assistant-235.css', 'assets/intelligent-configurator.css', 'assets/variant-comparison.css',
          'assets/changes-02313.css', 'assets/malfini-preview.css', 'assets/compact-choices.css', 'assets/order-experience-239.css']
scripts = ['js/i18n.js', 'js/calculators.js', 'js/checkout-experience.js', 'js/intelligent-search.js',
           'js/quote-interpreter.js', 'js/malfini-preview.js', 'js/app.js', 'js/frontend-refresh.js',
           'js/smart-forms.js', 'js/product-preview.js', 'js/intelligent-configurator.js', 'js/variant-comparison.js']
prices, terms, cases = [json.loads((root / f).read_text()) for f in
                       ['data/prices.json', 'data/search-terms.json', 'data/case-items.json']]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',
                                args=['--no-sandbox', '--disable-dev-shm-usage'])
    for width in (1440, 375):
        for cart_mode in (False, True):
            page = browser.new_page(viewport={'width': width, 'height': 900}, locale='pl-PL')
            errors=[]
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.set_content(html, wait_until='domcontentloaded')
            page.evaluate('''cart => {
                const mem=new Map();
                if(cart){ mem.set('drukulator_cart',JSON.stringify([{
                    id:101,title:'Wizytówki',description:'100 sztuk',price:120,details:[]
                }])); }
                const storage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,String(v)),
                               removeItem:k=>mem.delete(k),clear:()=>mem.clear()};
                Object.defineProperty(window,'localStorage',{configurable:true,value:storage});
                Object.defineProperty(window,'sessionStorage',{configurable:true,value:storage});
            }''', cart_mode)
            page.evaluate('''([pr,tr,ci]) => {
                window.fetch=async u=>({ok:true,json:async()=>String(u).includes('prices.json')?pr:
                    String(u).includes('search-terms.json')?tr:
                    String(u).includes('case-items.json')?ci:{success:true}})
            }''', [prices, terms, cases])
            
            for f in styles:
                page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/f).read_text())
            for script in scripts:
                page.add_script_tag(content=(root/script).read_text())
            page.wait_for_selector('#homeProductSearch', timeout=10000)
            page.wait_for_timeout(200)
            home = page.locator('.home-popular--conversion [data-home-page]')
            popular = [el.get_attribute('data-home-page') for el in home.all()]
            assert popular == ['Wizytówki 24h', 'Ulotki 24h', 'Plakaty 24h', 'Koszulki i odzież',
                               'Naklejki, etykiety i magnesy', 'Folie i banery 24h'], popular
            groups = page.locator('.home-category-group')
            firm = groups.filter(has=page.locator('h3',has_text='Dla firm'))
            assert firm.locator('[data-home-page]').first.get_attribute('data-home-page') == 'Druk cyfrowy i ksero 24h'
            if not cart_mode:
                assert page.locator('#quoteDockPrice').is_hidden()
                assert page.locator('.cart-review-summary').count() == 0
            else:
                assert page.locator('#quoteDockPrice').get_attribute('hidden') is None
                assert page.locator('#quoteDockTotal').inner_text() == '120,00 zł'
                assert page.locator('#quoteDockTotalLabel').inner_text() == 'Razem brutto'
                steps = page.locator('.d24-checkout-steps span').all_inner_texts()
                assert [' '.join(x.split()) for x in steps] == [
                    '1 Kontakt i dostawa', '2 Pliki i szczegóły (nieobowiązkowe)', '3 Wyślij zamówienie'], steps
                assert page.locator('.order-step-badge').all_inner_texts() == ['1','2','3']
                assert page.locator('.cart-review-summary__note').count()==0
                assert page.locator('#orderFinalTotalLabel').inner_text()=='Razem obecnie — brutto'
                assert page.locator('#cartFinalTotalLabel').inner_text()=='Razem brutto'
                page.locator('#orderPickup').select_option('Dostawa na terenie Szczecina')
                assert page.locator('#orderFinalTotal').inner_text()=='140,00 zł'
                assert page.locator('#cartFinalTotal').inner_text()=='140,00 zł'
                assert page.locator('#quoteDockTotal').inner_text()=='140,00 zł'
                assert page.locator('#quoteDockTotalLabel').inner_text()=='Razem brutto z dostawą'
                assert page.locator('#cartFinalTotalLabel').inner_text()=='Razem brutto z dostawą'
                assert page.locator('#orderDeliveryAddress').get_attribute('required') is not None
                page.locator('#orderPickup').select_option('Wysyłka kurierska (do ustalenia)')
                assert page.locator('#quoteDockTotal').inner_text()=='120,00 zł'
                assert page.locator('#cartFinalTotalLabel').inner_text()=='Razem brutto'
                assert 'nie obejmuje kosztu kuriera' in page.locator('#orderDeliveryExplanation').inner_text()
                assert '120,00 zł brutto' in page.locator('#mobileCartSummary').inner_text()
            assert not errors, (width,cart_mode,errors)
            print(f'OK: width={width}, cart={cart_mode}', flush=True)
            page.close()
    browser.close()
