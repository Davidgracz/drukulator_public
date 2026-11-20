"""Podgląd 3D wizytówki (0.26.13v): panel tylko na wizytówkach, wgranie przodu i tyłu, obracanie, orientacja, ostrzeżenia.

Uruchomienie: python tests/card_3d_02613_browser.py   (wymaga playwright i Pillow; PDF testowany, gdy jest reportlab)
Serwer HTTP startuje sam z katalogu projektu (pdf.js ładuje się przez import(), więc file:// i set_content nie wystarczą).
"""
import functools, http.server, pathlib, re, socketserver, tempfile, threading
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
tmp = pathlib.Path(tempfile.mkdtemp())

def card(path, w, h, color):
    im = Image.new('RGB', (w, h), color)
    ImageDraw.Draw(im).rectangle([20, 20, w - 20, h - 20], outline=(255, 255, 255), width=8)
    im.save(path)

card(tmp / 'front.png', 1063, 591, (18, 38, 84))      # 90 x 50 mm, 300 dpi
card(tmp / 'back.png', 1063, 591, (245, 240, 230))
card(tmp / 'vertical.png', 591, 1063, (18, 84, 60))   # pionowa
card(tmp / 'square.png', 900, 900, (120, 40, 40))
card(tmp / 'bleed.png', 1098, 626, (60, 60, 120))     # 93 x 53 mm = spad 1,5 mm
(tmp / 'plik.txt').write_text('x')

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
    def do_POST(self): self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(b'{"success":true}')

handler = functools.partial(Quiet, directory=str(root))
server = socketserver.TCPServer(('127.0.0.1', 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_address[1]}/index.html'
IGNORE = re.compile(r'googletagmanager|fonts.googleapis|favicon|logo|404|501|ERR_FAILED|ERR_ABORTED')

def goto_page(page, name):
    page.evaluate("name => document.querySelector(`[data-page=\"${name}\"]`).click()", name)
    page.wait_for_timeout(500)

def notes(page): return page.locator('.d24c3-notes').inner_text()
def transform(page): return page.evaluate("document.querySelector('.d24c3-scene').style.transform")

with sync_playwright() as p:
    launch = dict(headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    browser = None
    for exe in ('/usr/bin/chromium', '/usr/bin/google-chrome', None):
        try:
            browser = p.chromium.launch(**({'executable_path': exe} if exe else {}), **launch); break
        except Exception: continue
    assert browser, 'nie znaleziono przeglądarki dla Playwrighta'
    page = browser.new_page(viewport={'width': 1360, 'height': 1100}, locale='pl-PL')
    page.route(re.compile(r'googletagmanager|google-analytics|fonts.googleapis'), lambda r: r.abort())
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and not IGNORE.search(m.text) else None)
    page.goto(base, wait_until='load'); page.wait_for_timeout(500)

    # panel jest tylko na wizytówkach
    goto_page(page, 'Ulotki 24h'); assert page.locator('.d24c3-panel').count() == 0
    goto_page(page, 'Wizytówki 24h'); page.wait_for_selector('.d24c3-panel')
    assert page.locator('.d24-preview-panel').count() == 2, 'obok podglądu 3D ma zostać stary podgląd wydruku'
    page.select_option('#bcSides', 'Dwustronne')
    page.locator('.d24c3-fold > summary').click(); page.wait_for_timeout(400)
    assert 'DPI' not in notes(page) and 'Nie wgrano' in notes(page)

    # przód + tył
    page.set_input_files('[data-input=front]', str(tmp / 'front.png'))
    page.set_input_files('[data-input=back]', str(tmp / 'back.png'))
    page.wait_for_function("document.querySelectorAll('.d24c3-slot.has-file').length === 2")
    assert '300 DPI' in notes(page), notes(page)
    assert 'Poziom' in page.locator('[data-dims]').inner_text()

    # obracanie myszką, przyciski i klawiatura
    start = transform(page)
    box = page.locator('.d24c3-stage').bounding_box(); cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    page.mouse.move(cx, cy); page.mouse.down(); page.mouse.move(cx + 160, cy, steps=8); page.mouse.up(); page.wait_for_timeout(1500)
    assert transform(page) != start
    page.click('[data-view=back]'); page.wait_for_timeout(1500)
    assert re.search(r'rotateY\((-?180|180)(\.0+)?deg\)', transform(page)), transform(page)
    page.click('[data-view=front]'); page.wait_for_timeout(1500)
    assert re.search(r'rotateY\(-?(0|360)(\.0+)?deg\)', transform(page)), transform(page)
    page.locator('.d24c3-stage').focus(); page.keyboard.press('ArrowRight')
    assert re.search(r'rotateY\(12', transform(page)) or re.search(r'rotateY\(-?\d', transform(page))

    # pionowy plik ustawia kartę pionowo; kwadrat daje ostrzeżenie o proporcjach
    page.click('[data-clear=front]'); page.set_input_files('[data-input=front]', str(tmp / 'vertical.png')); page.wait_for_timeout(1000)
    assert 'Pionowa' in page.locator('[data-dims]').inner_text()
    page.click('[data-clear=front]'); page.set_input_files('[data-input=front]', str(tmp / 'square.png')); page.wait_for_timeout(900)
    assert 'proporcje' in notes(page)
    page.click('[data-fill]'); page.wait_for_timeout(400); assert 'przycięty' in notes(page)

    # spad 1,5 mm wykrywany automatycznie
    page.click('[data-clear=front]'); page.set_input_files('[data-input=front]', str(tmp / 'bleed.png')); page.wait_for_timeout(900)
    assert 'spad 1,5 mm obcięty' in notes(page) and page.locator('[data-bleed]').is_checked()

    # nieobsługiwany plik
    page.set_input_files('[data-input=back]', str(tmp / 'plik.txt')); page.wait_for_timeout(500)
    assert 'Obsługiwane formaty' in notes(page)

    # zadruk jednostronny + wgrany tył = ostrzeżenie
    page.set_input_files('[data-input=back]', str(tmp / 'back.png')); page.wait_for_timeout(700)
    page.select_option('#bcSides', 'Jednostronne'); page.wait_for_timeout(500)
    assert 'wycena nie obejmuje druku tyłu' in notes(page)

    # PDF dwustronny (strona 1 = przód, strona 2 = tył)
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import mm
        from reportlab.lib.utils import ImageReader
        pdf = tmp / 'dwie_strony.pdf'
        c = canvas.Canvas(str(pdf), pagesize=(93 * mm, 53 * mm))
        for name in ('bleed.png', 'back.png'):
            c.drawImage(ImageReader(str(tmp / name)), 0, 0, 93 * mm, 53 * mm); c.showPage()
        c.save()
        page.select_option('#bcSides', 'Dwustronne')
        page.click('[data-clear=front]'); page.click('[data-clear=back]')
        page.set_input_files('[data-input=front]', str(pdf))
        page.wait_for_function("document.querySelectorAll('.d24c3-slot.has-file').length === 2", timeout=20000)
        assert 'strona 2' in notes(page) and 'spad 1,5 mm obcięty' in notes(page), notes(page)
    except ImportError:
        print('reportlab niedostępny — pomijam test PDF')

    # nawigacja: po wyjściu z wizytówek panelu nie ma, po powrocie jest pusty
    goto_page(page, 'Ulotki 24h'); assert page.locator('.d24c3-panel').count() == 0
    goto_page(page, 'Wizytówki 24h'); page.wait_for_selector('.d24c3-panel'); assert page.locator('.d24c3-slot.has-file').count() == 0

    assert not errors, errors
    browser.close()
server.shutdown()
print('OK: podgląd 3D wizytówki')
