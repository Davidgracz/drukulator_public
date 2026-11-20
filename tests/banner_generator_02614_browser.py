"""Generator banerów (0.26.14v): panel tylko na banerach, edycja, cofanie, rozmiar ↔ formularz, logo, zdjęcie, kod QR (dekodowany OpenCV),
eksport JPG/PNG/PDF (wymiar strony), załączanie do zamówienia, zapis/odczyt projektu, układy × proporcje, motyw ciemny, EN, mobile.

Uruchomienie: python tests/banner_generator_02614_browser.py   (wymaga playwright, Pillow, numpy, opencv-python, pypdf)
Serwer HTTP startuje sam z katalogu projektu.
"""
import base64, functools, http.server, io, json, pathlib, re, socketserver, tempfile, threading
import numpy as np
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

try:
    import cv2
except Exception:  # bez OpenCV test QR jest pomijany
    cv2 = None
try:
    import pypdf
except Exception:
    pypdf = None

root = pathlib.Path(__file__).resolve().parent.parent
tmp = pathlib.Path(tempfile.mkdtemp())
shot = pathlib.Path('/home/claude/out') if pathlib.Path('/home/claude/out').exists() else tmp

# ---- pliki testowe ----
logo = Image.new('RGBA', (400, 200), (0, 0, 0, 0))
d = ImageDraw.Draw(logo); d.ellipse([10, 10, 190, 190], fill=(220, 30, 60, 255)); d.rectangle([220, 60, 390, 140], fill=(20, 20, 20, 255))
logo.save(tmp / 'logo.png')
w, h = 3000, 2000
ph = np.zeros((h, w, 3), np.uint8)
ph[..., 0] = np.linspace(40, 200, w)[None, :]; ph[..., 1] = np.linspace(80, 150, h)[:, None]; ph[..., 2] = 120
Image.fromarray(ph).save(tmp / 'photo.jpg', quality=88)
(tmp / 'zly.txt').write_text('x')

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self): self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(b'{"success":true}')

server = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_address[1]}/index.html'
IGNORE = re.compile(r'googletagmanager|fonts.googleapis|fonts.gstatic|favicon|logo|404|501|ERR_FAILED|ERR_ABORTED|Failed to load resource')

fails = []
def check(name, cond, detail=''):
    print(('OK   ' if cond else 'FAIL ') + name + (f'  [{detail}]' if detail and not cond else ''))
    if not cond: fails.append(name)

def goto_page(page, name):
    page.evaluate("name => document.querySelector(`[data-page=\"${name}\"]`).click()", name); page.wait_for_timeout(450)

def api(page, expr): return page.evaluate(expr)

def export_bytes(page, fmt, px):
    b64 = page.evaluate("""async ([fmt, px]) => { const o = await Druk24BannerGen.exportBlob(fmt, px); const u = new Uint8Array(await o.blob.arrayBuffer());
      let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return {b: btoa(s), name: o.name, w: o.w, h: o.h, scale: o.scale}; }""", [fmt, px])
    return base64.b64decode(b64['b']), b64

def decode_qr(png):
    img = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_COLOR)
    val, pts, _ = cv2.QRCodeDetector().detectAndDecode(img)
    return val

with sync_playwright() as p:
    launch = dict(headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    browser = None
    for exe in ('/usr/bin/google-chrome', '/usr/bin/chromium', None):
        try:
            browser = p.chromium.launch(executable_path=exe, **launch) if exe else p.chromium.launch(**launch); break
        except Exception: continue
    ctx = browser.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
    ctx.route(re.compile(r'googletagmanager|fonts\.g'), lambda r: r.abort())
    page = ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and not IGNORE.search(m.text) else None)
    page.on('pageerror', lambda e: errors.append('PAGEERROR ' + str(e)))
    page.goto(base); page.wait_for_timeout(700)

    # --- 1. panel tylko na banerach ---
    goto_page(page, 'Wizytówki 24h')
    check('brak panelu generatora na wizytówkach', page.locator('.d24bg-entry').count() == 0)
    goto_page(page, 'Folie i banery 24h')
    check('panel generatora na banerach', page.locator('.d24bg-entry').count() == 1)
    check('miniatura projektu narysowana', page.evaluate("document.querySelector('.d24bg-entry canvas').width") > 100)

    # --- 2. otwarcie edytora ---
    page.locator('.d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(900)
    check('okno edytora otwarte', page.evaluate("document.querySelector('dialog.d24bg-dialog').open"))
    check('rozmiar z formularza (100 × 100)', page.input_value('[data-size=w]') == '100' and page.input_value('[data-size=h]') == '100')
    check('nazwa materiału w nagłówku', 'Baner' in page.inner_text('[data-mat]'))
    rep = api(page, 'Druk24BannerGen.getReport() && {r: Druk24BannerGen.getReport().rating, d: Druk24BannerGen.getReport().distM}')
    check('raport czytelności z podglądu', bool(rep) and rep['r'] in ('great', 'good') and rep['d'] >= 1, str(rep))
    hash0 = api(page, "document.querySelector('[data-canvas]').toDataURL().length")

    # --- 3. edycja tekstu, licznik, cofnij / ponów ---
    page.click('[data-tab=text]'); page.fill('#d24bg-head', 'WIELKA WYPRZEDAŻ'); page.wait_for_timeout(700)
    check('licznik znaków nagłówka', '16/46' in page.inner_text('[data-count=headline]'))
    check('stan zawiera nowy nagłówek', api(page, 'Druk24BannerGen.getState().headline') == 'WIELKA WYPRZEDAŻ')
    hash1 = api(page, "document.querySelector('[data-canvas]').toDataURL().length")
    check('podgląd zmienił się po edycji', hash1 != hash0)
    page.click('[data-act=undo]'); page.wait_for_timeout(300)
    check('cofnij przywraca nagłówek', api(page, 'Druk24BannerGen.getState().headline') == 'TWÓJ NAGŁÓWEK' and page.input_value('#d24bg-head') == 'TWÓJ NAGŁÓWEK')
    page.click('[data-act=redo]'); page.wait_for_timeout(300)
    check('ponów przywraca zmianę', api(page, 'Druk24BannerGen.getState().headline') == 'WIELKA WYPRZEDAŻ')
    page.fill('#d24bg-head', 'x' * 80); check('limit znaków nagłówka (46)', len(page.input_value('#d24bg-head')) == 46)
    page.fill('#d24bg-head', 'WIELKA WYPRZEDAŻ')
    page.click('[data-sugg] >> nth=0') if False else None
    page.locator('[data-act=suggest][data-k=head]').nth(1).click(); page.wait_for_timeout(300)
    check('podpowiedź wstawia nagłówek', api(page, 'Druk24BannerGen.getState().headline') == 'PROMOCJA -30%')

    # --- 4. szablony, układ, kolory ---
    page.click('[data-tab=tpl]'); page.wait_for_timeout(500)
    check('miniatury szablonów (24)', page.locator('[data-act=tpl]:visible').count() == 24)
    page.click('[data-act=cat][data-id=food]'); page.wait_for_timeout(200)
    check('filtr kategorii szablonów', page.locator('[data-act=tpl]:visible').count() == 4)
    page.click('[data-act=tpl][data-id=food-pizza]'); page.wait_for_timeout(500)
    s = api(page, 'Druk24BannerGen.getState()')
    check('szablon ustawia układ, paletę i teksty', s['layout'] == 'left' and s['pal'] == 'red-white' and s['headline'] == 'PIZZA NA WYNOS' and s['badge']['on'])
    page.click('[data-tab=look]'); page.wait_for_timeout(400)
    page.click('[data-act=layout][data-id=ribbon]'); page.click('[data-act=palette][data-id=black-gold]'); page.wait_for_timeout(300)
    s = api(page, 'Druk24BannerGen.getState()')
    check('zmiana układu i palety', s['layout'] == 'ribbon' and s['pal'] == 'black-gold' and s['custom']['accent'] == '')
    page.click('[data-set="bg.type"][data-val=solid]'); page.wait_for_timeout(200)
    page.click('[data-act=random]') if page.locator('[data-act=random]:visible').count() else None
    page.click('[data-set=font][data-val=serif]'); page.wait_for_timeout(200)
    check('czcionka zmieniona', api(page, 'Druk24BannerGen.getState().font') == 'serif')

    # --- 5. rozmiar ↔ formularz ---
    page.fill('[data-size=w]', '300'); page.wait_for_timeout(300)
    check('zmiana szerokości w generatorze → formularz', page.evaluate("document.getElementById('bannerWidth').value") == '300')
    page.evaluate("document.querySelector('dialog.d24bg-dialog').close()")
    page.fill('#bannerHeight', '150'); page.dispatch_event('#bannerHeight', 'change'); page.wait_for_timeout(300)
    s = api(page, 'Druk24BannerGen.getState()')
    check('zmiana formularza → stan generatora', s['widthCm'] == 300 and s['heightCm'] == 150)
    page.locator('.d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(600)
    check('pola rozmiaru po ponownym otwarciu', page.input_value('[data-size=w]') == '300' and page.input_value('[data-size=h]') == '150')
    cw, ch = api(page, "[document.querySelector('[data-canvas]').width, document.querySelector('[data-canvas]').height]")
    check('proporcje podglądu 2:1', abs(cw / ch - 2) < 0.03, f'{cw}x{ch}')
    page.click('[data-act=swap]'); page.wait_for_timeout(300)
    check('zamiana wymiarów', page.evaluate("document.getElementById('bannerWidth').value") == '150' and page.evaluate("document.getElementById('bannerHeight').value") == '300')
    page.select_option('[data-act=preset]', '200x100'); page.wait_for_timeout(300)
    check('rozmiar z listy popularnych', page.evaluate("document.getElementById('bannerWidth').value") == '200')

    # reguły materiału: limit rozmiaru i oczka tylko dla banera z oczkami
    page.fill('[data-size=w]', '200'); page.fill('[data-size=h]', '200'); page.dispatch_event('[data-size=h]', 'change'); page.wait_for_timeout(400)
    check('ostrzeżenie o limicie krótszego boku (160 cm)', 'limit 160' in page.inner_text('[data-quality]'), page.inner_text('[data-quality]')[:160])
    page.evaluate("(() => { const m = document.getElementById('bannerMaterial'); m.value = 'Folia mat'; m.dispatchEvent(new Event('change', {bubbles: true})); })()"); page.wait_for_timeout(300)
    check('folia: pole „Margines bezpieczny” bez oczek', 'oczka' not in page.inner_text('[data-guidelabel]'))
    page.evaluate("(() => { const m = document.getElementById('bannerMaterial'); m.value = 'Baner powlekany 510g'; m.dispatchEvent(new Event('change', {bubbles: true})); })()"); page.wait_for_timeout(300)
    check('baner: pole „Margines bezpieczny i oczka”', 'oczka' in page.inner_text('[data-guidelabel]'))
    page.fill('[data-size=h]', '100'); page.dispatch_event('[data-size=h]', 'change'); page.wait_for_timeout(300)
    check('brak ostrzeżenia dla 200×100', 'limit 160' not in page.inner_text('[data-quality]'))

    # --- 6. logo ---
    page.click('[data-tab=extra]')
    page.set_input_files('[data-file=logo]', str(tmp / 'logo.png')); page.wait_for_timeout(700)
    s = api(page, 'Druk24BannerGen.getState()')
    check('logo wczytane', bool(s['logo']['id']))
    check('raport zawiera dpi logo', api(page, 'Druk24BannerGen.getReport().logoDpi') is not None)
    page.click('[data-set="logo.anchor"][data-val=br]'); page.wait_for_timeout(300)
    check('pozycja logo', api(page, 'Druk24BannerGen.getState().logo.anchor') == 'br')
    page.set_input_files('[data-file=logo]', str(tmp / 'zly.txt')); page.wait_for_timeout(400)
    check('zły format pliku → komunikat', 'Dozwolone' in page.inner_text('[data-msg]'))
    page.click('[data-act=remove-logo]'); page.wait_for_timeout(300)
    check('usunięcie logo', api(page, 'Druk24BannerGen.getState().logo.id') == '')

    # --- 7. zdjęcie w tle ---
    page.click('[data-tab=look]'); page.click('[data-set="bg.type"][data-val=photo]'); page.wait_for_timeout(300)
    check('ostrzeżenie o braku zdjęcia', any(i['id'] == 'need-photo' for i in api(page, 'Druk24BannerGen.getReport().issues')))
    page.click('[data-act=pick-photo]') if False else None
    page.set_input_files('[data-file=photo]', str(tmp / 'photo.jpg')); page.wait_for_timeout(1200)
    s = api(page, 'Druk24BannerGen.getState()')
    check('zdjęcie tła wczytane', s['bg']['type'] == 'photo' and bool(s['bg']['photo']))
    check('raport zawiera dpi zdjęcia', api(page, 'Druk24BannerGen.getReport().photoDpi') is not None)
    page.fill('[data-bind="bg.dim"]', '70'); page.dispatch_event('[data-bind="bg.dim"]', 'change'); page.wait_for_timeout(300)
    check('przyciemnienie zdjęcia', api(page, 'Druk24BannerGen.getState().bg.dim') == 70)

    # --- 8. kod QR ---
    page.click('[data-tab=extra]'); page.check('[data-bind="qr.on"]'); page.fill('#d24bg-qr', 'https://druk24szczecin.pl/kontakt?x=1'); page.wait_for_timeout(400)
    check('informacja o rozmiarze kodu QR', 'cm' in page.inner_text('[data-qrinfo]'))
    png, meta = export_bytes(page, 'png', 3000)
    check('eksport PNG (sygnatura)', png[:8] == b'\x89PNG\r\n\x1a\n' and meta['name'].endswith('.png'))
    if cv2 is not None:
        check('kod QR na banerze 200×100 dekoduje się', decode_qr(png) == 'https://druk24szczecin.pl/kontakt?x=1', decode_qr(png))
        for size in ('1000x100', '300x100', '100x200', '60x300'):
            wd, ht = size.split('x')
            api(page, f"Druk24BannerGen.setState({{...Druk24BannerGen.getState(), widthCm: {wd}, heightCm: {ht}, qr: {{...Druk24BannerGen.getState().qr, size: 32}}, bg: {{...Druk24BannerGen.getState().bg, type: 'gradient'}}}})")
            png2, _ = export_bytes(page, 'png', 4500)
            check(f'kod QR na banerze {wd}×{ht} dekoduje się', decode_qr(png2) == 'https://druk24szczecin.pl/kontakt?x=1')
    page.screenshot(path=str(shot / 'bg_t_editor_qr.png'))

    # --- 9. PDF: wymiar strony, UserUnit ---
    api(page, "Druk24BannerGen.setState({...Druk24BannerGen.getState(), widthCm: 100, heightCm: 100, qr: {...Druk24BannerGen.getState().qr, size: 20}})")
    pdf, meta = export_bytes(page, 'pdf', 2500)
    check('PDF ma sygnaturę i nazwę', pdf[:5] == b'%PDF-' and meta['name'].endswith('.pdf') and meta['name'].startswith('baner-100x100cm'))
    if pypdf:
        r = pypdf.PdfReader(io.BytesIO(pdf)); box = r.pages[0].mediabox
        check('PDF 100×100 cm = 2834,6 pt', abs(float(box.width) - 2834.65) < 0.5 and abs(float(box.height) - 2834.65) < 0.5, f'{box.width}x{box.height}')
        imgs = list(r.pages[0].images)
        check('PDF zawiera obraz JPEG', len(imgs) == 1 and imgs[0].image.size == (meta['w'], meta['h']))
        api(page, "Druk24BannerGen.setState({...Druk24BannerGen.getState(), widthCm: 1000, heightCm: 100})")
        pdf2, meta2 = export_bytes(page, 'pdf', 3000)
        r2 = pypdf.PdfReader(io.BytesIO(pdf2)); pg = r2.pages[0]
        check('PDF 1000×100 cm w skali (UserUnit)', meta2['scale'] >= 2 and float(pg.get('/UserUnit', 1)) == meta2['scale'] and float(pg.mediabox.width) <= 14400, f"{pg.mediabox.width} uu={pg.get('/UserUnit')}")
        (tmp / 'out.pdf').write_bytes(pdf)
        import subprocess
        res = subprocess.run(['pdfinfo', str(tmp / 'out.pdf')], capture_output=True, text=True)
        check('pdfinfo odczytuje PDF bez błędów', res.returncode == 0 and 'Page size' in res.stdout and not res.stderr.strip(), res.stderr[:120])
    api(page, "Druk24BannerGen.setState({...Druk24BannerGen.getState(), widthCm: 100, heightCm: 100})")

    # --- 10. przycisk „Pobierz” ---
    page.click('[data-tab=export]'); page.wait_for_timeout(300)
    check('informacja o wyniku w px i dpi', 'dpi' in page.inner_text('[data-exportinfo]'))
    for fmt, magic in (('pdf', b'%PDF-'), ('jpg', b'\xff\xd8\xff'), ('png', b'\x89PNG')):
        page.click(f'[data-exportfmt={fmt}]')
        with page.expect_download() as dl:
            page.click('[data-dl]')
        path = dl.value.path(); data = pathlib.Path(path).read_bytes()
        check(f'pobieranie {fmt.upper()}', data[:len(magic)] == magic and dl.value.suggested_filename.endswith('.' + fmt), dl.value.suggested_filename)

    # --- 11. zapis / odczyt projektu ---
    page.click('[data-tab=text]'); page.fill('#d24bg-head', 'TEST ZAPISU'); page.wait_for_timeout(300)
    page.click('[data-tab=export]')
    with page.expect_download() as dl:
        page.click('[data-act=save]')
    proj = pathlib.Path(dl.value.path()).read_text(encoding='utf-8'); obj = json.loads(proj)
    check('plik projektu zawiera stan i zasoby', obj['app'] == 'drukulator-banner' and obj['state']['headline'] == 'TEST ZAPISU' and len(obj['assets']) >= 1)
    page.click('[data-tab=text]'); page.fill('#d24bg-head', 'INNY'); page.wait_for_timeout(300)
    (tmp / 'proj.json').write_text(proj, encoding='utf-8')
    page.click('[data-tab=export]'); page.set_input_files('[data-file=project]', str(tmp / 'proj.json')); page.wait_for_timeout(700)
    s = api(page, 'Druk24BannerGen.getState()')
    check('wczytanie projektu przywraca teksty i zdjęcie', s['headline'] == 'TEST ZAPISU' and bool(s['bg']['photo']) and api(page, "document.querySelector('[data-canvas]').width") > 100)
    (tmp / 'zly.json').write_text('{"a":1}'); page.set_input_files('[data-file=project]', str(tmp / 'zly.json')); page.wait_for_timeout(300)
    check('zły plik projektu → komunikat', 'nie jest poprawnym' in page.inner_text('[data-msg]') or 'nie jest poprawny' in page.inner_text('[data-msg]'))

    # --- 12. Esc zamyka okno ---
    page.keyboard.press('Escape'); page.wait_for_timeout(300)
    check('Esc zamyka okno', not page.evaluate("document.querySelector('dialog.d24bg-dialog').open"))

    # --- 13. dołączanie do zamówienia ---
    check('domyślnie projekt NIE jest dołączany', api(page, 'Druk24BannerGen.getAttachFiles().length') == 0 and not page.is_checked('[data-attach]'))
    page.fill('#bannerWidth', '100'); page.dispatch_event('#bannerWidth', 'change'); page.fill('#bannerHeight', '100'); page.dispatch_event('#bannerHeight', 'change'); page.wait_for_timeout(300)
    page.evaluate("document.getElementById('calculate').click()"); page.wait_for_timeout(300)
    page.evaluate("document.getElementById('addToCart').click()"); page.wait_for_timeout(500)
    check('bez zgody plik nie trafia do koszyka', 'baner-100x100cm' not in page.inner_text('#cartPanel'))
    page.check('[data-attach]'); page.wait_for_function("document.querySelector('.d24bg-entry__status').textContent.includes('✓')", timeout=20000)
    check('status: plik gotowy do dołączenia', 'baner-100x100cm' in page.inner_text('.d24bg-entry__status'))
    files = api(page, 'Druk24BannerGen.getAttachFiles().map(f => [f.name, f.type, f.size])')
    check('getAttachFiles zwraca PDF', len(files) == 1 and files[0][1] == 'application/pdf' and files[0][2] > 1000, str(files))
    page.evaluate("document.getElementById('calculate').click()"); page.wait_for_timeout(300)
    page.evaluate("document.getElementById('addToCart').click()"); page.wait_for_timeout(700)
    check('po zgodzie plik trafia do koszyka', 'baner-100x100cm' in page.inner_text('#cartPanel'), page.inner_text('#cartPanel')[:200])
    check('toast „wraz z plikiem”', 'wraz z plikiem' in page.inner_text('body'))
    page.fill('#bannerWidth', '120'); page.dispatch_event('#bannerWidth', 'input'); page.dispatch_event('#bannerWidth', 'change')
    check('zmiana rozmiaru unieważnia załącznik do czasu przebudowy', api(page, 'Druk24BannerGen.getAttachFiles().length') == 0)
    page.wait_for_function("Druk24BannerGen.getAttachFiles().length === 1", timeout=20000)
    check('załącznik przebudowany po zmianie rozmiaru', 'baner-120x100cm' in api(page, 'Druk24BannerGen.getAttachFiles()[0].name'))
    page.uncheck('[data-attach]'); page.wait_for_timeout(200)
    check('wyłączenie zgody usuwa załącznik', api(page, 'Druk24BannerGen.getAttachFiles().length') == 0)
    # „Użyj w zamówieniu”
    page.locator('.d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(500)
    page.click('[data-act=use]'); page.wait_for_function("!document.querySelector('dialog.d24bg-dialog').open", timeout=20000)
    check('„Użyj w zamówieniu” zamyka okno i dołącza PDF', api(page, 'Druk24BannerGen.getAttachFiles().length') == 1 and page.is_checked('[data-attach]'))
    page.uncheck('[data-attach]')

    # --- 14. zapamiętanie ustawień po odświeżeniu ---
    page.locator('.d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(400)
    page.click('[data-tab=text]'); page.fill('#d24bg-head', 'ZAPAMIĘTANY'); page.wait_for_timeout(700); page.keyboard.press('Escape')
    page.reload(); page.wait_for_timeout(800); goto_page(page, 'Folie i banery 24h')
    check('ustawienia tekstowe pamiętane po odświeżeniu', api(page, 'Druk24BannerGen.getState().headline') == 'ZAPAMIĘTANY')

    # --- 15. układy × proporcje: brak wyjątków i brak przepełnień ---
    problems = page.evaluate("""() => {
      const E = window.Druk24BannerEngine, bad = [];
      for (const [w, h] of [[100,100],[200,100],[300,100],[100,200],[1000,100],[60,300],[150,50],[500,100],[30,30]]) for (const L of E.LAYOUTS) for (const tpl of E.TEMPLATES) {
        let s = E.applyTemplate(E.defaultState(), tpl, true); s.layout = L.id; s.widthCm = w; s.heightCm = h; s.qr.on = true; s.qr.text = 'https://x.pl'; s.logo.id = '';
        const c = document.createElement('canvas'); const r = Math.max(w,h)/Math.min(w,h); c.width = w >= h ? 700 : Math.round(700 / r); c.height = w >= h ? Math.round(700 / r) : 700;
        try { const rep = E.render(c, s, {}, {analyze: true}); if (Object.values(rep.blocks).some(b => b.overflow)) bad.push(`${w}x${h} ${L.id} ${tpl.id} overflow`); }
        catch (e) { bad.push(`${w}x${h} ${L.id} ${tpl.id} ERR ${e.message}`); }
      }
      return bad.slice(0, 12);
    }""")
    check('wszystkie układy × szablony × proporcje bez wyjątków i przepełnień', not problems, str(problems))

    # --- 16. ciemny motyw, EN, mobile ---
    page.evaluate("document.documentElement.setAttribute('data-theme','dark')")
    page.locator('.d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(600)
    page.click('[data-tab=look]'); page.wait_for_timeout(400); page.screenshot(path=str(shot / 'bg_t_dark.png'))
    page.keyboard.press('Escape'); page.evaluate("document.documentElement.setAttribute('data-theme','light')")
    page.evaluate("document.documentElement.lang = 'en'"); page.wait_for_timeout(500)
    check('wersja EN panelu', 'BANNER GENERATOR' in page.inner_text('.d24bg-entry'))
    page.locator('.d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(700)
    check('wersja EN edytora', 'Banner generator' in page.inner_text('.d24bg-top__title') and 'Templates' in page.inner_text('.d24bg-tabs'))
    page.screenshot(path=str(shot / 'bg_t_en.png')); page.keyboard.press('Escape')
    page.evaluate("document.documentElement.lang = 'pl'"); page.wait_for_timeout(400)
    page.set_viewport_size({'width': 390, 'height': 844}); page.wait_for_timeout(300)
    page.locator('.d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(800)
    box = page.evaluate("(() => { const r = document.querySelector('dialog.d24bg-dialog').getBoundingClientRect(); return [r.width, r.height]; })()")
    check('mobile: okno na cały ekran', box[0] >= 389 and box[1] >= 843, str(box))
    page.screenshot(path=str(shot / 'bg_t_mobile.png'))
    page.evaluate("document.querySelector('.d24bg-main').scrollTop = 600"); page.wait_for_timeout(300)
    top = page.evaluate("[document.querySelector('.d24bg-stagewrap').getBoundingClientRect().top, document.querySelector('.d24bg-main').getBoundingClientRect().top]")
    check('mobile: podgląd przyklejony u góry podczas przewijania', abs(top[0] - top[1]) < 3, str(top))
    page.screenshot(path=str(shot / 'bg_t_mobile_scroll.png'))
    overflow = page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1 && document.querySelector('.d24bg').scrollWidth <= document.querySelector('.d24bg').clientWidth + 1")
    check('mobile: brak poziomego przewijania', overflow)

    check('brak błędów w konsoli', not errors, '; '.join(errors[:4]))
    browser.close()

print('\nNIEUDANE:', fails if fails else 'brak')
raise SystemExit(1 if fails else 0)
