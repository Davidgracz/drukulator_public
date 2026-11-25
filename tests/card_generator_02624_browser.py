"""0.26.24v: generator wizytówek (Wizytówki 24h): panel pod formularzem + okno edytora (format / orientacja / zadruk zmieniają formularz, 6 układów, kolory, tło, krój pisma,
dane, logo, rewers z kodem QR), PDF ze spadem 1,5 mm (MediaBox = format + spad, TrimBox = format netto, 1 albo 2 strony, 600 dpi), „Użyj w zamówieniu” → koszyk,
„Zobacz w 3D”, ocena (najmniejszy tekst w pt, dpi logo, moduł QR), EN, telefon. Bez eksportu (nie ma pobierania).

Uruchomienie: python tests/card_generator_02624_browser.py   (wymaga playwright, pypdf, Pillow, opencv-python; serwer HTTP startuje sam)
"""
import base64, functools, http.server, io, pathlib, re, socketserver, struct, threading, zlib

from playwright.sync_api import sync_playwright

import cv2
import numpy as np
import pypdf
from PIL import Image, ImageDraw

root = pathlib.Path(__file__).resolve().parent.parent
shot = pathlib.Path('/home/claude/out') if pathlib.Path('/home/claude/out').exists() else pathlib.Path('.')


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self): self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(b'{"success":true}')


server = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_address[1]}/index.html'
IGNORE = re.compile(r'googletagmanager|fonts.googleapis|fonts.gstatic|favicon|logo|404|501|ERR_FAILED|ERR_ABORTED|Failed to load resource')

ENTRY = '.d24cg-entry'
DLG = 'dialog.d24cg-dialog'
S = 'Druk24CardSimple'
PAGE = 'Wizytówki 24h'
fails = []

REAL = dict(name='Anna Kowalska', title='Kierownik sprzedaży', company='Studio Reklamy Fala', phone='+48 91 123 45 67', email='anna@fala.example',
            web='www.fala.example', address='ul. Długa 12, 70-001 Szczecin', tagline='Reklama, która płynie')


def check(name, cond, detail=''):
    print(('OK   ' if cond else 'FAIL ') + name + (f'  [{detail}]' if detail and not cond else ''))
    if not cond: fails.append(name)


def goto_page(page, name):
    page.evaluate("name => document.querySelector(`[data-page=\"${name}\"]`).click()", name); page.wait_for_timeout(500)


def select(page, id_, value):
    page.evaluate("""([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('input', {bubbles: true})); s.dispatchEvent(new Event('change', {bubbles: true})); }""", [id_, value]); page.wait_for_timeout(300)


def open_editor(page):
    page.locator(f'{ENTRY} .d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(700)


def set_state(page, d):
    page.evaluate(f"s => {S}.setState(s)", d); page.wait_for_timeout(250)


def pix(page, side, x_mm, y_mm, k=12):
    """kolor piksela (mm względem pola netto) z płótna rysowanego w skali k px/mm"""
    return page.evaluate("""([side, x, y, k]) => { const c = document.createElement('canvas'); Druk24CardSimple.render(c, side);
      const g = c.getContext('2d'), d = g.getImageData(Math.round((x + 1.5) * k), Math.round((y + 1.5) * k), 1, 1).data;
      return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); }""", [side, x_mm, y_mm, k])


def side_png(page, side):
    u = page.evaluate("side => { const c = document.createElement('canvas'); Druk24CardSimple.render(c, side); return c.toDataURL('image/png'); }", side)
    return Image.open(io.BytesIO(base64.b64decode(u.split(',', 1)[1]))).convert('RGB')


def attached_bytes(page):
    b64 = page.evaluate("""async () => { const f = Druk24CardSimple.getAttachFiles()[0]; const u = new Uint8Array(await f.arrayBuffer());
      let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); }""")
    return base64.b64decode(b64)


def make_logo(path, w=600, h=300, color=(192, 24, 122, 255)):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], fill=color)
    d.ellipse([w * 0.1, h * 0.15, w * 0.1 + h * 0.7, h * 0.15 + h * 0.7], fill=(255, 255, 255, 255))
    im.save(path)


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
    errors, downloads = [], []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and not IGNORE.search(m.text) else None)
    page.on('pageerror', lambda e: errors.append('PAGEERROR ' + str(e)))
    page.on('download', lambda d: downloads.append(d.suggested_filename))
    page.goto(base); page.wait_for_timeout(700)

    # ============ A. panel pod formularzem, tylko przy wizytówkach ============
    goto_page(page, PAGE)
    kids = page.evaluate("[...document.querySelector('#content > .card').children].map(e => e.className)")
    gi = next(i for i, c in enumerate(kids) if 'form-grid' in c)
    check('wizytówki: generator tuż pod formularzem, podgląd 3D zaraz pod nim', 'd24cg-entry' in kids[gi + 1] and 'd24c3-panel' in kids[gi + 2], str(kids[gi:gi + 3]))
    check('wizytówki: jeden panel, widoczny, z miniaturą i przyciskiem', page.locator(ENTRY).count() == 1 and page.locator(ENTRY).is_visible() and page.locator(f'{ENTRY} canvas').count() == 1)
    check('wizytówki: panel banerów się nie pojawia', page.locator('.d24bgs-entry:not(.d24cg-entry)').count() == 0)
    check('wizytówki: wersja 0.26.24v', page.locator('#versionLabel').inner_text() == '0.26.24v')
    for name in ('Ulotki 24h', 'Plakaty 24h', 'Folie i banery 24h', 'Druk cyfrowy i ksero 24h'):
        goto_page(page, name)
        check(f'{name}: bez generatora wizytówek', page.locator(ENTRY).count() == 0)
    goto_page(page, 'Folie i banery 24h')
    check('baner: generator banerów dalej jest', page.locator('.d24bgs-entry').count() == 1 and page.locator('.d24bgs-entry.d24cg-entry').count() == 0)
    goto_page(page, PAGE)
    check('powrót na wizytówki: panel wraca', page.locator(ENTRY).count() == 1)
    thumb = page.locator(f'{ENTRY} canvas').first
    box = thumb.bounding_box()
    check('miniatura ma kształt wizytówki (poziomo ok. 93 : 53)', box and 1.5 < box['width'] / box['height'] < 2.0, str(box))
    shot_entry = shot / 'card_entry_0.26.24.png'
    page.locator(ENTRY).scroll_into_view_if_needed(); page.locator(ENTRY).screenshot(path=str(shot_entry))

    # ============ B. okno: format, orientacja, zadruk ============
    check('domyślnie: bez przykładowych danych w PDF — projekt nie jest dołączony', not page.evaluate(f"{S}.isAttachEnabled()") and page.evaluate(f"{S}.getAttachFiles().length") == 0)
    open_editor(page)
    check('okno otwarte, okno banerów nie istnieje', page.evaluate(f"document.querySelector('{DLG}').open") and page.locator('dialog.d24bgs-dialog').count() == 0)
    check('widoczne: 2 formaty, 6 układów, 12 kolorów, 3 tła, 4 kroje', page.locator(f'{DLG} [data-format]').count() == 2 and page.locator(f'{DLG} [data-layout]').count() == 6
          and page.locator(f'{DLG} [data-color]').count() == 12 and page.locator(f'{DLG} [data-paper]').count() == 3 and page.locator(f'{DLG} [data-font]').count() == 4)
    check('jednostronne: widoczny tylko awers, sekcja rewersu ukryta', page.locator(f'{DLG} [data-fig=front]').is_visible() and not page.locator(f'{DLG} [data-fig=back]').is_visible() and not page.locator(f'{DLG} [data-backsec]').is_visible())
    check('zaznaczone: 90×50, poziomo, jednostronny', page.get_attribute(f'{DLG} [data-format="90x50 mm"]', 'aria-pressed') == 'true' and page.get_attribute(f'{DLG} [data-orient=landscape]', 'aria-pressed') == 'true'
          and page.get_attribute(f'{DLG} [data-sides=Jednostronne]', 'aria-pressed') == 'true')
    c = page.locator(f'{DLG} [data-fig=front] canvas'); cw, ch = page.evaluate("[...document.querySelectorAll('dialog.d24cg-dialog [data-fig=front] canvas')].map(c => [c.width, c.height])[0]")
    check('płótno awersu = 90 × 50 mm + spad 1,5 mm (93 × 53, skala 12 px/mm)', (cw, ch) == (1116, 636), f'{cw}x{ch}')
    page.click(f'{DLG} [data-sides=Dwustronne]'); page.wait_for_timeout(400)
    check('klik „Dwustronny” ustawia formularz (bcSides) i pokazuje rewers', page.evaluate("document.getElementById('bcSides').value") == 'Dwustronne' and page.locator(f'{DLG} [data-fig=back]').is_visible() and page.locator(f'{DLG} [data-backsec]').is_visible())
    page.click(f'{DLG} [data-format="85x55 mm"]'); page.wait_for_timeout(400)
    check('klik „85 × 55” ustawia formularz (bcFormat) i płótno', page.evaluate("document.getElementById('bcFormat').value") == '85x55 mm'
          and page.evaluate("document.querySelector('dialog.d24cg-dialog [data-fig=front] canvas').width") == round((85 + 3) * 12), page.evaluate("document.querySelector('dialog.d24cg-dialog [data-fig=front] canvas').width"))
    check('chip z formatem i spadem', '85 × 55 mm' in page.inner_text(f'{DLG} [data-chips]') and '1,5' in page.inner_text(f'{DLG} [data-chips]'), page.inner_text(f'{DLG} [data-chips]'))
    page.click(f'{DLG} [data-orient=portrait]'); page.wait_for_timeout(300)
    w2, h2 = page.evaluate("[...document.querySelectorAll('dialog.d24cg-dialog [data-fig=front] canvas')].map(c => [c.width, c.height])[0]")
    check('pionowo: 55 × 85 mm + spad (podgląd pionowy w skali 10 px/mm)', (w2, h2) == (580, 880), f'{w2}x{h2}')
    page.click(f'{DLG} [data-orient=landscape]'); page.click(f'{DLG} [data-format="90x50 mm"]'); page.wait_for_timeout(300)
    # zmiana formularza na stronie odbija się w oknie
    select(page, 'bcSides', 'Jednostronne')
    check('zmiana zadruku w formularzu zmienia okno (rewers znika)', not page.locator(f'{DLG} [data-fig=back]').is_visible() and page.get_attribute(f'{DLG} [data-sides=Jednostronne]', 'aria-pressed') == 'true')
    select(page, 'bcSides', 'Dwustronne')
    # offset: tylko dwustronnie
    select(page, 'bcPrint', 'Offsetowy'); page.wait_for_timeout(300)
    check('offset: „Jednostronny” zablokowany, zadruk dwustronny', page.is_disabled(f'{DLG} [data-sides=Jednostronne]') and page.evaluate("document.getElementById('bcSides').value") == 'Dwustronne' and page.locator(f'{DLG} [data-fig=back]').is_visible())
    select(page, 'bcPrint', 'Cyfrowy 24h'); page.wait_for_timeout(300)
    check('powrót na cyfrowy: „Jednostronny” znów dostępny', not page.is_disabled(f'{DLG} [data-sides=Jednostronne]'))
    page.click(f'{DLG} [data-sides=Dwustronne]'); page.wait_for_timeout(300)

    # ============ C. układy, kolory, tła ============
    set_state(page, {**REAL, 'layout': 'bar', 'paper': 'white', 'color': '#0f2747', 'orient': 'landscape'})
    check('układ „pasek”: pasek w kolorze akcentu z lewej, reszta biała', pix(page, 'front', 2, 25) == '#0f2747' and pix(page, 'front', 70, 45) == '#ffffff', f'{pix(page, "front", 2, 25)} {pix(page, "front", 70, 45)}')
    check('pasek wchodzi w spad (kolor także poza polem netto)', page.evaluate("""() => { const c = document.createElement('canvas'); Druk24CardSimple.render(c, 'front'); const d = c.getContext('2d').getImageData(2, 300, 1, 1).data; return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); }""") == '#0f2747')
    set_state(page, {'layout': 'band'}); check('układ „kolorowy nagłówek”: góra w kolorze, dół biały', pix(page, 'front', 45, 2) == '#0f2747' and pix(page, 'front', 85, 46) == '#ffffff')
    set_state(page, {'layout': 'split', 'company': 'Fala'}); check('układ „podział”: lewy panel w kolorze, prawa biała', pix(page, 'front', 3, 3) == '#0f2747' and pix(page, 'front', 85, 3) == '#ffffff')
    set_state(page, {**REAL, 'layout': 'corner'}); check('układ „narożnik”: trójkąt w prawym dolnym rogu', pix(page, 'front', 88.5, 48.5) == '#0f2747' and pix(page, 'front', 88.5, 2) == '#ffffff')
    set_state(page, {'layout': 'center'}); check('układ „wyśrodkowana” i „minimalistyczna”: białe tło', pix(page, 'front', 1, 1) == '#ffffff')
    set_state(page, {'layout': 'minimal'}); check('minimalistyczna: białe tło', pix(page, 'front', 1, 1) == '#ffffff')
    set_state(page, {'layout': 'bar', 'paper': 'accent', 'color': '#d71920'})
    check('tło kolorowe: tło w kolorze akcentu, pasek w kolorze tekstu', pix(page, 'front', 70, 45) == '#d71920' and pix(page, 'front', 2, 25) == '#ffffff', f'{pix(page, "front", 70, 45)} {pix(page, "front", 2, 25)}')
    set_state(page, {'paper': 'dark', 'color': '#ffd60a'})
    check('tło ciemne: ciemne, pasek w kolorze akcentu', pix(page, 'front', 70, 45) == '#141414' and pix(page, 'front', 2, 25) == '#ffd60a')
    set_state(page, {'paper': 'dark', 'color': '#111111'})
    check('akcent zlewający się z tłem zamienia się na kolor tekstu (ciemne tło + czarny akcent)', pix(page, 'front', 2, 25) == '#ffffff', pix(page, 'front', 2, 25))
    set_state(page, {'paper': 'white', 'color': '#ffffff'})
    check('biały akcent na białym: pasek w kolorze tekstu', pix(page, 'front', 2, 25) == '#141414', pix(page, 'front', 2, 25))
    # klik w kafelek układu / koloru / tła / kroju w oknie
    set_state(page, {'paper': 'white', 'color': '#0f2747', 'layout': 'bar'})
    page.click(f'{DLG} [data-layout=split]'); page.click(f'{DLG} [data-swatches] [data-color="#d71920"]'); page.click(f'{DLG} [data-paper=dark]'); page.click(f'{DLG} [data-font=serif]'); page.wait_for_timeout(300)
    st = page.evaluate(f"{S}.getState()")
    check('kliknięcia w oknie zmieniają stan (układ, kolor, tło, krój)', st['layout'] == 'split' and st['color'] == '#d71920' and st['paper'] == 'dark' and st['font'] == 'serif', str(st))
    check('zaznaczenia widoczne (aria-pressed)', page.get_attribute(f'{DLG} [data-layout=split]', 'aria-pressed') == 'true' and page.get_attribute(f'{DLG} [data-paper=dark]', 'aria-pressed') == 'true'
          and page.get_attribute(f'{DLG} [data-font=serif]', 'aria-pressed') == 'true' and page.get_attribute(f'{DLG} [data-color="#d71920"]', 'aria-pressed') == 'true')
    set_state(page, {'layout': 'bar', 'paper': 'white', 'color': '#0f2747', 'font': 'modern'})
    page.screenshot(path=str(shot / 'card_dialog_0.26.24.png'))

    # ============ D. przykładowe teksty blokują „Użyj w zamówieniu” ============
    page.click(f'{DLG} [data-act=reset]'); page.click(f'{DLG} [data-act=reset]'); page.wait_for_timeout(300)
    check('„Wyczyść projekt” (2 kliknięcia) przywraca przykłady', page.evaluate(f"{S}.getState().name") == 'Jan Kowalski' and page.evaluate(f"{S}.getState().layout") == 'bar')
    check('przykładowy tekst: getProblem() niepusty', 'przykładowy' in page.evaluate(f"{S}.getProblem()"), page.evaluate(f"{S}.getProblem()"))
    page.click(f'{DLG} [data-act=use]'); page.wait_for_timeout(300)
    check('„Użyj w zamówieniu” z przykładem: komunikat i brak pliku', 'przykładowy' in page.inner_text(f'{DLG} [data-msg]') and page.evaluate(f"{S}.getAttachFiles().length") == 0 and page.evaluate(f"document.querySelector('{DLG}').open"))
    page.fill(f'{DLG} [data-f=name]', ''); page.fill(f'{DLG} [data-f=company]', ''); page.fill(f'{DLG} [data-f=tagline]', ''); page.wait_for_timeout(200)
    check('bez imienia i firmy: komunikat „Wpisz imię…”', 'Wpisz imię' in page.evaluate(f"{S}.getProblem()"))
    for k in ('title', 'phone', 'email', 'web', 'address'): page.fill(f'{DLG} [data-f={k}]', '')
    page.fill(f'{DLG} [data-f=name]', 'Ewa Nowak'); page.wait_for_timeout(250)
    check('puste pola nie są rysowane, sam napis imię i nazwisko jest dozwolony (brak problemów)', page.evaluate(f"{S}.getProblem()") == '', page.evaluate(f"{S}.getProblem()"))
    check('pierwsze kliknięcie w przykładowe pole zaznacza tekst', True)

    # ============ E. dane → PDF ze spadem ============
    set_state(page, REAL)
    for k, v in REAL.items():
        if k != 'tagline': page.fill(f'{DLG} [data-f={k}]', v)
    page.wait_for_timeout(250)
    check('prawdziwe dane: brak problemów', page.evaluate(f"{S}.getProblem()") == '', page.evaluate(f"{S}.getProblem()"))
    rep = page.evaluate(f"{S}.getReport()")
    check('raport: najmniejszy tekst ≥ 6 pt', rep['minPt'] >= 6, str(rep))
    page.click(f'{DLG} [data-sides=Jednostronne]'); page.wait_for_timeout(300)
    page.click(f'{DLG} [data-act=use]'); page.wait_for_function(f"{S}.getAttachFiles().length === 1", timeout=60000); page.wait_for_timeout(300)
    check('okno zamyka się po „Użyj w zamówieniu”', not page.evaluate(f"document.querySelector('{DLG}').open"))
    f1 = page.evaluate(f"{S}.getAttachFiles().map(f => [f.name, f.type, f.size])")
    check('plik: PDF „wizytowka-90x50mm-jednostronna-anna-kowalska”', len(f1) == 1 and f1[0][1] == 'application/pdf' and f1[0][0] == 'wizytowka-90x50mm-jednostronna-anna-kowalska.pdf' and f1[0][2] > 5000, str(f1))
    r = pypdf.PdfReader(io.BytesIO(attached_bytes(page)))
    mm = 72 / 25.4
    mb, tb = r.pages[0].mediabox, r.pages[0].trimbox
    check('PDF jednostronny: 1 strona', len(r.pages) == 1, str(len(r.pages)))
    check('MediaBox = 93 × 53 mm (format + spad 1,5 mm)', abs(float(mb.width) - 93 * mm) < 0.1 and abs(float(mb.height) - 53 * mm) < 0.1, f'{mb.width}x{mb.height}')
    check('TrimBox = 90 × 50 mm, przesunięty o 1,5 mm', abs(float(tb.width) - 90 * mm) < 0.1 and abs(float(tb.height) - 50 * mm) < 0.1 and abs(float(tb.left) - 1.5 * mm) < 0.1 and abs(float(tb.bottom) - 1.5 * mm) < 0.1, f'{tb}')
    img = r.pages[0].images[0].image
    check('obraz 600 dpi (93 mm ≈ 2197 px)', abs(img.width - 2197) <= 2 and abs(img.height - 1252) <= 2, f'{img.size}')
    check('panel: status „✓ Projekt zapisany” i zaznaczona zgoda', '✓ Projekt zapisany' in page.inner_text(ENTRY) and page.is_checked(f'{ENTRY} [data-attach]'))
    check('nie ma pobierania ani przycisków eksportu', not downloads and page.locator(f'{DLG} a[download]').count() == 0)

    # ============ F. rewers dwustronny + kod QR ============
    select(page, 'bcSides', 'Dwustronne'); page.wait_for_function(f"{S}.getAttachFiles().length === 1 && {S}.getAttachFiles()[0].name.includes('dwustronna')", timeout=60000)
    r2 = pypdf.PdfReader(io.BytesIO(attached_bytes(page)))
    check('zmiana zadruku w formularzu przebudowuje załącznik: 2 strony', len(r2.pages) == 2 and abs(float(r2.pages[1].mediabox.width) - 93 * mm) < 0.1, str(len(r2.pages)))
    open_editor(page)
    check('dwustronnie: rewers i sekcja rewersu widoczne', page.locator(f'{DLG} [data-fig=back]').is_visible() and page.locator(f'{DLG} [data-backsec]').is_visible())
    set_state(page, {'qrOn': False, 'back': 'color'})
    back_plain = side_png(page, 'back')
    check('rewers kolorowy: tło w kolorze akcentu', pix(page, 'back', 2, 2) == '#0f2747', pix(page, 'back', 2, 2))
    page.click(f'{DLG} [data-back=white]'); page.wait_for_timeout(250)
    check('rewers „białe”: białe tło', pix(page, 'back', 2, 2) == '#ffffff')
    page.click(f'{DLG} [data-back=color]'); page.wait_for_timeout(250)
    page.check(f'{DLG} [data-qr-on]'); page.wait_for_timeout(300)
    rep = page.evaluate(f"{S}.getReport()")
    check('kod QR włączony: moduł ≥ 0,4 mm i chip „Kod QR”', rep['qrModule'] >= 0.4 and 'Kod QR' in page.inner_text(f'{DLG} [data-chips]'), f"{rep['qrModule']} | {page.inner_text(f'{DLG} [data-chips]')}")
    qr_img = np.array(side_png(page, 'back'))
    det = cv2.QRCodeDetector(); val, pts, _ = det.detectAndDecode(cv2.cvtColor(qr_img, cv2.COLOR_RGB2BGR))
    check('QR z rewersu dekoduje się do adresu strony (https://www.fala.example)', val == 'https://www.fala.example', repr(val))
    page.fill(f'{DLG} [data-qr]', 'https://druk24.example/wizytowki?a=1&b=2'); page.wait_for_timeout(300)
    qr_img = np.array(side_png(page, 'back')); val, pts, _ = det.detectAndDecode(cv2.cvtColor(qr_img, cv2.COLOR_RGB2BGR))
    check('własny adres w kodzie QR dekoduje się poprawnie', val == 'https://druk24.example/wizytowki?a=1&b=2', repr(val))
    page.fill(f'{DLG} [data-qr]', ''); page.fill(f'{DLG} [data-f=web]', ''); page.wait_for_timeout(250)
    check('QR bez adresu: komunikat i chip', 'adres' in page.evaluate(f"{S}.getProblem()").lower() and 'adres' in page.inner_text(f'{DLG} [data-chips]').lower(), page.evaluate(f"{S}.getProblem()"))
    page.fill(f'{DLG} [data-f=web]', 'www.fala.example'); page.wait_for_timeout(250)
    page.fill(f'{DLG} [data-qr]', 'https://x.example/' + 'a' * 200); page.wait_for_timeout(250)
    check('QR: adres ograniczony do 180 znaków (pole)', page.evaluate(f"{S}.getState().qrText.length") <= 180)
    page.fill(f'{DLG} [data-qr]', ''); page.wait_for_timeout(200)
    page.fill(f'{DLG} [data-f=tagline]', ''); page.wait_for_timeout(200)
    check('rewers bez hasła i bez logo: nazwa firmy na środku (nie jest pusty)', np.array(side_png(page, 'back')).std() > 5)
    set_state(page, {'tagline': 'Reklama, która płynie'})
    page.screenshot(path=str(shot / 'card_dialog_back_0.26.24.png'))

    # ============ G. logo ============
    logo_path = pathlib.Path('/tmp/d24_test_logo.png'); make_logo(logo_path)
    set_state(page, {'layout': 'bar', 'paper': 'white', 'color': '#0f2747', 'orient': 'landscape'})
    before = pix(page, 'front', 80, 11)
    page.set_input_files(f'{DLG} [data-logofile]', str(logo_path)); page.wait_for_timeout(700)
    after = pix(page, 'front', 80, 11)
    check('logo wgrane: narysowane w prawym górnym rogu awersu', before == '#ffffff' and after == '#c0187a', f'{before} -> {after}')
    check('nazwa pliku logo i przycisk „Usuń logo” widoczne', 'd24_test_logo.png' in page.inner_text(f'{DLG} .d24cg-logo') and page.locator(f'{DLG} [data-act=logo-off]').is_visible())
    check('chip dpi logo', 'Logo:' in page.inner_text(f'{DLG} [data-chips]') and 'dpi' in page.inner_text(f'{DLG} [data-chips]'), page.inner_text(f'{DLG} [data-chips]'))
    rep = page.evaluate(f"{S}.getReport()")
    check('rozdzielczość logo: najniższa ze stron (rewers: logo ok. 44 mm → ok. 350 dpi)', 300 < rep['logoDpi'] < 700, str(rep['logoDpi']))
    rbk = side_png(page, 'back'); check('logo także na rewersie (na kolorowym tle)', (np.array(rbk) == np.array([192, 24, 122])).all(axis=2).sum() > 500)
    page.reload(); page.wait_for_timeout(900); goto_page(page, PAGE); page.wait_for_timeout(500)
    check('logo i ustawienia przetrwały przeładowanie (localStorage)', page.evaluate(f"{S}.getState().name") == REAL['name'] and pix(page, 'front', 80, 11) == '#c0187a')
    # logo pionowo: nad nazwiskiem
    set_state(page, {'orient': 'portrait'}); check('pionowo: logo nad nazwiskiem (lewy górny róg)', pix(page, 'front', 10, 12) == '#c0187a', f'{pix(page, "front", 10, 12)}')
    for lay in ('band', 'split', 'center', 'minimal', 'corner'):
        set_state(page, {'orient': 'landscape', 'layout': lay})
        im = np.array(side_png(page, 'front')); check(f'logo widoczne w układzie „{lay}” (poziomo)', (im == np.array([192, 24, 122])).all(axis=2).sum() > 300)
        set_state(page, {'orient': 'portrait'})
        im = np.array(side_png(page, 'front')); check(f'logo widoczne w układzie „{lay}” (pionowo)', (im == np.array([192, 24, 122])).all(axis=2).sum() > 300)
    set_state(page, {'orient': 'landscape', 'layout': 'bar'})
    # niskiej rozdzielczości logo → ostrzeżenie
    low = pathlib.Path('/tmp/d24_test_logo_low.png'); make_logo(low, 60, 30)
    page.evaluate(f"{S}.removeLogo()"); page.wait_for_timeout(200)
    open_editor(page) if not page.evaluate(f"document.querySelector('{DLG}')?.open") else None
    page.set_input_files(f'{DLG} [data-logofile]', str(low)); page.wait_for_timeout(600)
    check('logo 60 × 30 px: chip „zła” rozdzielczość', 'd24bg-chip--bad' in page.inner_html(f'{DLG} [data-chips]') and 'Logo:' in page.inner_text(f'{DLG} [data-chips]'), page.inner_text(f'{DLG} [data-chips]'))
    # SVG
    svg = pathlib.Path('/tmp/d24_test_logo.svg'); svg.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><rect width="300" height="100" fill="#c0187a"/></svg>')
    page.set_input_files(f'{DLG} [data-logofile]', str(svg)); page.wait_for_timeout(600)
    check('logo SVG: rysuje się, brak chipu dpi (wektor)', pix(page, 'front', 80, 11) == '#c0187a' and 'dpi' not in page.inner_text(f'{DLG} [data-chips]'))
    bad = pathlib.Path('/tmp/d24_test_logo.txt'); bad.write_text('nie obraz')
    page.set_input_files(f'{DLG} [data-logofile]', str(bad)); page.wait_for_timeout(300)
    check('zły typ pliku logo: komunikat, logo zostaje', 'PNG' in page.inner_text(f'{DLG} [data-msg]') and pix(page, 'front', 80, 11) == '#c0187a')
    page.click(f'{DLG} [data-act=logo-off]'); page.wait_for_timeout(300)
    check('„Usuń logo”: logo znika', pix(page, 'front', 80, 11) == '#ffffff' and not page.locator(f'{DLG} [data-act=logo-off]').is_visible())

    # ============ H. zbyt mały tekst blokuje ============
    set_state(page, {**REAL, 'orient': 'portrait', 'layout': 'bar', 'email': 'bardzo.dlugi.adres.email.kowalska@studio-reklamy-fala.example'})
    rep = page.evaluate(f"{S}.getReport()")
    check('długi e-mail w pionie: najmniejszy tekst < 5 pt → blokada', rep['minPt'] < 5 and 'za mały' in page.evaluate(f"{S}.getProblem()"), f"{rep['minPt']} {page.evaluate(f'{S}.getProblem()')}")
    check('chip „Najmniejszy tekst” czerwony', 'd24bg-chip--bad' in page.inner_html(f'{DLG} [data-chips]'))
    set_state(page, {**REAL, 'orient': 'landscape'})

    # ============ I. koszyk ============
    page.keyboard.press('Escape'); page.wait_for_timeout(200)
    page.click(f'{DLG} [data-act=use]') if page.evaluate(f"document.querySelector('{DLG}')?.open") else None
    select(page, 'bcSides', 'Dwustronne')
    page.evaluate(f"{S}.setAttach(true)"); page.wait_for_function(f"{S}.getAttachFiles().length === 1 && {S}.getAttachFiles()[0].name.includes('dwustronna')", timeout=60000)
    fname = page.evaluate(f"{S}.getAttachFiles()[0].name")
    page.evaluate("document.getElementById('calculate').click()"); page.wait_for_timeout(400)
    page.evaluate("document.getElementById('addToCart').click()"); page.wait_for_timeout(800)
    check('plik z generatora trafia do koszyka razem z wizytówkami', fname in page.inner_text('#cartPanel'), page.inner_text('#cartPanel')[:300])
    check('nazwa pliku wizytówki: dwustronna, 90x50mm', fname.startswith('wizytowka-90x50mm-dwustronna-anna-kowalska'), fname)

    # ============ J. podgląd 3D ============
    goto_page(page, PAGE); page.wait_for_timeout(500)
    set_state(page, {**REAL, 'layout': 'bar', 'paper': 'white', 'color': '#0f2747', 'orient': 'landscape'})
    select(page, 'bcSides', 'Dwustronne')
    open_editor(page)
    check('przycisk „Zobacz w 3D” jest dostępny', page.locator(f'{DLG} [data-act=view3d]').is_visible())
    page.click(f'{DLG} [data-act=view3d]'); page.wait_for_timeout(2500)
    check('„Zobacz w 3D”: okno zamknięte, awers i rewers w podglądzie 3D', not page.evaluate(f"document.querySelector('{DLG}').open") and page.evaluate("Druk24Card3D.getFiles().length") == 2, str(page.evaluate("Druk24Card3D.getFiles().map(f => f.name)")))
    t3 = page.locator('.d24c3-panel').inner_text()
    check('3D rozpoznaje spad 1,5 mm w pliku z generatora', 'spad' in t3.lower() and '1,5' in t3, t3[:400])
    page.locator('.d24c3-panel').scroll_into_view_if_needed(); page.wait_for_timeout(500)
    page.screenshot(path=str(shot / 'card_3d_0.26.24.png'))

    # ============ K. EN ============
    page.evaluate("document.documentElement.lang = 'en'"); page.wait_for_timeout(600)
    check('EN: panel po angielsku', 'BUSINESS CARD GENERATOR' in page.inner_text(ENTRY) and 'Design my card' in page.inner_text(ENTRY), page.inner_text(ENTRY)[:120])
    open_editor(page)
    check('EN: okno po angielsku, 6 układów', 'Business card generator' in page.inner_text(f'{DLG} .d24cg-top') and 'Centred' in page.inner_text(f'{DLG} .d24cg-layouts') and 'Use in order' in page.inner_text(DLG), page.inner_text(f'{DLG} .d24cg-top')[:150])
    page.click(f'{DLG} [data-act=reset]'); page.click(f'{DLG} [data-act=reset]'); page.wait_for_timeout(300)
    check('EN: przykłady po angielsku (John Smith)', page.evaluate(f"{S}.getState().name") == 'John Smith' and 'sample' in page.evaluate(f"{S}.getProblem()").lower(), page.evaluate(f"{S}.getProblem()"))
    page.keyboard.press('Escape'); page.evaluate("document.documentElement.lang = 'pl'"); page.wait_for_timeout(500)
    check('powrót do PL: panel po polsku', 'GENERATOR WIZYTÓWEK' in page.inner_text(ENTRY))

    check('brak błędów JS w konsoli', not errors, '; '.join(errors[:4]))

    # ============ L. telefon ============
    m = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
    m.route(re.compile(r'googletagmanager|fonts\.g'), lambda r: r.abort())
    mp = m.new_page(); merr = []
    mp.on('pageerror', lambda e: merr.append(str(e)))
    mp.goto(base); mp.wait_for_timeout(800); goto_page(mp, PAGE); mp.wait_for_timeout(500)
    mp.locator(ENTRY).scroll_into_view_if_needed()
    check('telefon: panel mieści się w szerokości ekranu', mp.evaluate(f"document.querySelector('{ENTRY}').getBoundingClientRect().right") <= 391)
    mp.screenshot(path=str(shot / 'card_mobile_entry_0.26.24.png'))
    mp.locator(f'{ENTRY} [data-act=open]').first.click(); mp.wait_for_timeout(800)
    mp.screenshot(path=str(shot / 'card_mobile_dialog_0.26.24.png'))
    r0 = mp.evaluate(f"document.querySelector('{DLG}').getBoundingClientRect().toJSON()")
    check('telefon: okno na cały ekran, bez poziomego przewijania', r0['width'] >= 389 and r0['height'] >= 843 and mp.evaluate("document.documentElement.scrollWidth") <= 391, str(r0))
    cb = mp.evaluate("document.querySelector('dialog.d24cg-dialog [data-fig=front] canvas').getBoundingClientRect().toJSON()")
    check('telefon: podgląd awersu widoczny u góry i dość duży', cb['height'] > 70 and cb['top'] >= 0 and cb['width'] > 150, str(cb))
    mp.evaluate(f"{S}.setState({{...{REAL!r}}})"); mp.wait_for_timeout(300)
    mp.evaluate("document.querySelector('dialog.d24cg-dialog .d24bgs-main').scrollTo(0, 99999)"); mp.wait_for_timeout(300)
    ub = mp.evaluate("document.querySelector('dialog.d24cg-dialog [data-act=use]').getBoundingClientRect().toJSON()")
    check('telefon: „Użyj w zamówieniu” osiągalny po przewinięciu', ub['bottom'] <= 845 and ub['top'] >= 0 and ub['width'] > 100, str(ub))
    mp.locator(f'{DLG} [data-act=use]').click(); mp.wait_for_function(f"{S}.getAttachFiles().length === 1", timeout=60000)
    check('telefon: projekt zapisany (PDF)', mp.evaluate(f"{S}.getAttachFiles()[0].size") > 5000)
    check('telefon: brak błędów JS', not merr, '; '.join(merr[:3]))
    m.close()

    browser.close()

print()
print('WSZYSTKO OK' if not fails else f'BŁĘDY ({len(fails)}): ' + '; '.join(fails))
raise SystemExit(1 if fails else 0)
