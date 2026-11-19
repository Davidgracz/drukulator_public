"""0.26.12: link do zapisanego zamówienia (?q=KOD) ze starymi pozycjami (bez typu produktu) — bez komunikatów o „starszej wersji kalkulatora”,
pozycje są w koszyku, a zamówienie da się wysłać (serwer też ich nie odrzuca)."""
import json,re,shutil,subprocess,tempfile
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
BASE='https://druk24.test/drukulator/'
TOKEN='KYKACH242GP9'
legacy=[
  {"title":"Plakaty 24h","description":"stary plakat A2, 3 szt.","price":90,"details":[["Format","A2"]]},
  {"title":"Naklejki, etykiety","description":"50 x 50 mm, 100 szt.","price":70,"details":[]},
  {"title":"Plansza pianka 5 mm","description":"A3, 2 szt.","price":90,"details":[["Format","A3"]]},
]
MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'}
state={'orders':0,'share':0}
def handler(route):
    url=urlparse(route.request.url); path=url.path[len('/drukulator/'):] if url.path.startswith('/drukulator/') else url.path.lstrip('/')
    path=path or 'index.html'
    if path=='quote-share.php':
        state['share']+=1
        return route.fulfill(status=200,content_type='application/json',body=json.dumps({'success':True,'cart':legacy}))
    if path=='send-order.php':
        state['orders']+=1
        return route.fulfill(status=200,content_type='application/json',body=json.dumps({'success':True,'orderId':'T-7','confirmationSent':True}))
    if path in ('analytics-track.php','promo-validate.php','upload-files.php'):
        return route.fulfill(status=200,content_type='application/json',body='{"success":true}')
    f=root/path
    if f.is_file(): return route.fulfill(status=200,content_type=MIME.get(f.suffix,'application/octet-stream'),body=f.read_bytes())
    return route.fulfill(status=404,body='')
def run(browser,width):
    ctx=browser.new_context(viewport={'width':width,'height':900},locale='pl-PL')
    page=ctx.new_page(); errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    dialogs=[]; page.on('dialog',lambda d:(dialogs.append(d.message),d.accept()))
    page.route('https://druk24.test/**',handler)
    page.goto(BASE+'?q='+TOKEN,wait_until='domcontentloaded',timeout=20000)
    page.wait_for_selector('#homeProductSearch',timeout=15000); page.wait_for_timeout(1200)
    return page,errors,dialogs,ctx
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        state.update(orders=0,share=0)
        page,errors,dialogs,ctx=run(browser,width)
        assert state['share']==1
        # zamówienie z linku jest w koszyku, bez żadnego ostrzeżenia
        assert page.locator('.cart-card').count()==3,page.locator('.cart-card').count()
        body=page.locator('body').inner_text()
        assert 'starszej wersji' not in body and 'Oblicz ponownie' not in body and 'wymaga ponownego obliczenia' not in body
        assert page.locator('.d24-stale-cart-alert, .d24-stale-note, .cart-card.is-stale, [data-recalc]').count()==0
        assert dialogs==[],dialogs
        # wysyłka nie jest blokowana
        page.locator('#orderName').fill('Jan Test'); page.locator('#orderEmail').fill('jan@example.com')
        if not page.locator('#orderPrivacy').is_checked(): page.locator('#orderPrivacy').check()
        page.locator('#sendOrder').click(); page.wait_for_timeout(1200)
        assert state['orders']==1,state
        status=page.locator('#orderSendStatus').inner_text()
        assert 'T-7' in status and 'starszej wersji' not in status,status
        assert not errors,errors
        print('PASS shared link legacy width',width,flush=True)
        ctx.close()
    browser.close()
# serwer: pozycje bez typu produktu nie są odrzucane (walidator wycięty z send-order.php)
src=(root/'send-order.php').read_text()
assert 'starszej wersji kalkulatora' not in src
print('OK shared_link_legacy_02612_browser')
