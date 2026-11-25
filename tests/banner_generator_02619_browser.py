"""0.26.19v: generator banerów (jedyny na stronie): okno z wymiarami i „Wyczyść projekt” u góry, podgląd z oceną czytelności, kolory (tło / tekst / przycisk, tylko paleta),
pola Nagłówek / Opis / Kontakt / Przycisk, suwaki rozmiarów, wyrównanie, „Użyj w zamówieniu”; bez eksportu; pełny generator wyłączony.
Dodatkowo: silnik bez gradientu i wzoru (stare projekty → kolor), suwak rozmiaru przycisku (ctaScale).

Uruchomienie: python tests/banner_generator_02619_browser.py   (wymaga playwright, pypdf)
Serwer HTTP startuje sam z katalogu projektu.
"""
import base64, functools, http.server, io, json, pathlib, re, socketserver, threading

from playwright.sync_api import sync_playwright

try:
    import pypdf
except Exception:
    pypdf = None

root = pathlib.Path(__file__).resolve().parent.parent
shot = pathlib.Path('/home/claude/out') if pathlib.Path('/home/claude/out').exists() else pathlib.Path('.')


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self): self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(b'{"success":true}')


server = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_address[1]}/index.html'
IGNORE = re.compile(r'googletagmanager|fonts.googleapis|fonts.gstatic|favicon|logo|404|501|ERR_FAILED|ERR_ABORTED|Failed to load resource')

ENTRY = '.d24bgs-entry'
DLG = 'dialog.d24bgs-dialog'
CANVAS = '.d24bgs-stage canvas'
fails = []


def check(name, cond, detail=''):
    print(('OK   ' if cond else 'FAIL ') + name + (f'  [{detail}]' if detail and not cond else ''))
    if not cond: fails.append(name)


def goto_page(page, name):
    page.evaluate("name => document.querySelector(`[data-page=\"${name}\"]`).click()", name); page.wait_for_timeout(450)


def setdims(page, w, h):
    page.evaluate("""([w, h]) => { for (const [id, v] of [['bannerWidth', w], ['bannerHeight', h]]) { const e = document.getElementById(id); e.value = v;
      e.dispatchEvent(new Event('input', {bubbles: true})); e.dispatchEvent(new Event('change', {bubbles: true})); } }""", [w, h]); page.wait_for_timeout(300)


def open_editor(page):
    page.locator(f'{ENTRY} .d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(600)


def px(page, sel, x, y):
    """kolor piksela płótna jako #rrggbb (x, y w ułamkach 0–1)"""
    return page.evaluate("""([sel, fx, fy]) => { const c = document.querySelector(sel), g = c.getContext('2d');
      const d = g.getImageData(Math.round((c.width - 1) * fx), Math.round((c.height - 1) * fy), 1, 1).data;
      return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); }""", [sel, x, y])


def count_color(page, sel, hexc, tol=40):
    """ile pikseli płótna jest bliskich danemu kolorowi"""
    return page.evaluate("""([sel, hexc, tol]) => { const c = document.querySelector(sel), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data;
      const t = [1, 3, 5].map(i => parseInt(hexc.slice(i, i + 2), 16)); let n = 0;
      for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - t[0]) + Math.abs(d[i+1] - t[1]) + Math.abs(d[i+2] - t[2]) < tol) n++;
      return n; }""", [sel, hexc, tol])


def ink_centroid(page, sel):
    """środek ciężkości pikseli różniących się od tła, jako ułamek szerokości (0–1); -1 gdy brak"""
    return page.evaluate("""(sel) => { const c = document.querySelector(sel), g = c.getContext('2d'), bg = g.getImageData(2, 2, 1, 1).data;
      const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0, sx = 0;
      for (let i = 0; i < d.length; i += 4) { const df = Math.abs(d[i] - bg[0]) + Math.abs(d[i+1] - bg[1]) + Math.abs(d[i+2] - bg[2]); if (df > 200) { n++; sx += (i / 4) % c.width; } }
      return n < 20 ? -1 : sx / n / c.width; }""", sel)


def report(page):
    return page.evaluate("Druk24BannerSimple.getReport()")


def attached_bytes(page):
    b64 = page.evaluate("""async () => { const f = Druk24BannerSimple.getAttachFiles()[0]; const u = new Uint8Array(await f.arrayBuffer());
      let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); }""")
    return base64.b64decode(b64)


def fill_text(page, k, v):
    page.fill(f'{DLG} [data-f={k}]', v); page.wait_for_timeout(120)


def side_overflow(page):
    return page.evaluate("(() => { const s = document.querySelector('.d24bgs-side'); return [s.scrollHeight, s.clientHeight]; })()")


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

    # ============ A. wersja, silnik, pełny generator wyłączony ============
    check('wersja 0.26.xx v', bool(re.fullmatch(r'0\.26\.\d+v', page.inner_text('#versionLabel').strip())))
    check('pełny generator jest wyłączony (nie jest ładowany)', page.evaluate("typeof window.Druk24BannerGen") == 'undefined' and page.locator('script[src*="banner-generator.js"]').count() == 0)
    probs = page.evaluate("""() => {
      const E = window.Druk24BannerEngine, bad = [];
      if (E.PATTERNS) bad.push('PATTERNS nadal eksportowane');
      if (E.TEMPLATES.some(t => 'pattern' in t)) bad.push('szablon z polem pattern');
      const d = E.defaultState(); if (d.bg.type !== 'solid' || 'pattern' in d.bg || 'c2' in d.bg || 'angle' in d.bg) bad.push('stan domyślny: ' + JSON.stringify(d.bg));
      const old = E.normalizeState({ v: 1, bg: { type: 'gradient', c1: '#ff0000', c2: '#00ff00', angle: 45, pattern: 'dots', dim: 30 } });
      if (old.bg.type !== 'solid' || old.bg.c1 !== '#ff0000' || 'pattern' in old.bg || 'c2' in old.bg || 'angle' in old.bg) bad.push('stary projekt: ' + JSON.stringify(old.bg));
      if (E.defaultState().ctaScale !== 100) bad.push('ctaScale domyślnie ' + E.defaultState().ctaScale);
      if (E.normalizeState({ ctaScale: 5 }).ctaScale !== 40 || E.normalizeState({ ctaScale: 500 }).ctaScale !== 100 || E.normalizeState({ ctaScale: 70 }).ctaScale !== 70) bad.push('ctaScale: granice 40–100');
      return bad;
    }""")
    check('silnik: bez gradientu i wzoru, stary projekt → kolor, ctaScale 40–100', not probs, str(probs))

    # ============ B. panel pod formularzem ============
    goto_page(page, 'Folie i banery 24h')
    setdims(page, 200, 100)
    order = page.evaluate("""() => { const card = document.querySelector('#content > .card'); return [...card.children].map(e => e.matches('.form-grid') ? 'grid' : e.matches('.d24bgs-entry') ? 'simple' : e.matches('.d24bg-more') ? 'more' : '-'); }""")
    check('panel generatora jest tuż pod formularzem; bez sekcji pełnego generatora', 'grid' in order and order.index('simple') == order.index('grid') + 1 and 'more' not in order, str(order))
    check('panel: GENERATOR BANERA, przycisk „Zaprojektuj baner”', 'GENERATOR BANERA' in page.inner_text(ENTRY) and page.locator(f'{ENTRY} .d24bg-entry__actions [data-act=open]').inner_text().strip() == 'Zaprojektuj baner')
    check('miniatura w panelu: domyślnie granat', px(page, f'{ENTRY} canvas', .5, .02) == '#0f2747')

    # ============ C. okno: układ ============
    open_editor(page)
    check('okno otwarte', page.evaluate(f"document.querySelector('{DLG}').open"))
    top = page.inner_text('.d24bgs-top')
    check('góra: „Generator banera”, wymiary, „Wyczyść projekt”', 'Generator banera' in top and 'Wymiary' in top and 'Wyczyść projekt' in top)
    check('góra: dwa pola wymiarów z wartościami z formularza', page.input_value('[data-size=w]') == '200' and page.input_value('[data-size=h]') == '100')
    check('góra: bez cofania, popularnych rozmiarów i innych dodatków', page.locator('.d24bgs-top select').count() == 0 and page.locator('.d24bgs-top [data-act=undo]').count() == 0 and page.locator('.d24bgs-top [data-act=swap]').count() == 0)
    check('kolory: 12 kafelków, bez własnego koloru RGB', page.locator('[data-swatches] [data-color]').count() == 12 and page.locator(f'{DLG} input[type=color]').count() == 0)
    check('wybór koloru: Tło / Tekst / Przycisk', [t.strip() for t in page.eval_on_selector_all('[data-target]', 'els => els.map(e => e.textContent)')] == ['Tło', 'Tekst', 'Przycisk'])
    check('pola: Nagłówek, Opis / hasło, Kontakt, Przycisk', page.locator('.d24bgs-fields [data-f]').count() == 4 and all(x in page.inner_text('.d24bgs-fields') for x in ('Nagłówek', 'Opis / hasło', 'Kontakt', 'Przycisk')))
    sl = [t.strip() for t in page.eval_on_selector_all('.d24bgs-sliders .d24bg-row > span', 'els => els.map(e => e.textContent)')]
    check('suwaki: rozmiar nagłówka, opisu, kontaktu, przycisku', sl == ['Rozmiar nagłówka', 'Rozmiar opisu', 'Rozmiar kontaktu', 'Rozmiar przycisku'], str(sl))
    check('wyrównanie: do lewej / środek / do prawej', [t.strip() for t in page.eval_on_selector_all('[data-align]', 'els => els.map(e => e.textContent)')] == ['Do lewej', 'Środek', 'Do prawej'])
    check('jeden niebieski przycisk „Użyj w zamówieniu”, bez „Zapisz projekt” i pobierania', page.locator('.d24bgs [data-act=use]').inner_text().strip() == 'Użyj w zamówieniu' and page.locator('.d24bgs [data-act=save]').count() == 0 and 'Pobierz' not in page.inner_text('.d24bgs'))
    geo = page.evaluate("""() => { const t = s => document.querySelector(s).getBoundingClientRect(); return {
      canvas: t('.d24bgs-stage canvas'), chips: t('[data-chips]'), sw: t('[data-swatches]'), tg: t('.d24bgs-targets'), fields: t('.d24bgs-fields'), sl: t('.d24bgs-sliders'), al: t('.d24bgs-align'), act: t('.d24bgs-actions'), side: t('.d24bgs-side'), top: t('.d24bgs-top') }; }""")
    check('pod podglądem: wymiary, czytelność, ocena', geo['chips']['top'] >= geo['canvas']['bottom'] - 1 and geo['chips']['top'] - geo['canvas']['bottom'] < 60 and abs((geo['chips']['left'] + geo['chips']['width'] / 2) - (geo['canvas']['left'] + geo['canvas']['width'] / 2)) < 12, str((geo['canvas']['bottom'], geo['chips']['top'])))
    chips = page.inner_text('[data-chips]')
    check('chipy: „200 × 100 cm”, „Nagłówek czytelny z ok. N m”, „Czytelność: świetna”', '200 × 100 cm' in chips and re.search(r'Nagłówek czytelny z ok\. \d+ m', chips) and 'Czytelność: świetna' in chips, chips)
    check('prawa kolumna od góry: kolory → wybór koloru → pola → suwaki → wyrównanie → przycisk',
          geo['sw']['top'] < geo['tg']['top'] < geo['fields']['top'] < geo['sl']['top'] < geo['al']['top'] < geo['act']['top'])
    check('podgląd po lewej, kolumna ustawień po prawej', geo['canvas']['right'] < geo['side']['left'] + 2)
    sh, ch = side_overflow(page)
    check('1440×900: prawa kolumna bez paska przewijania', sh <= ch + 1, f'{sh} > {ch}')
    page.screenshot(path=str(shot / 'bg19_okno.png'))
    check('początek: tło granatowe, tekst biały', px(page, CANVAS, .02, .02) == '#0f2747' and count_color(page, CANVAS, '#ffffff', 30) > 2000)

    # ============ D. wymiary w oknie ↔ formularz ============
    page.fill('[data-size=w]', '300'); page.wait_for_timeout(300)
    check('wymiary w oknie → formularz (szerokość)', page.input_value('#bannerWidth') == '300')
    c = page.evaluate(f"(() => {{ const c = document.querySelector('{CANVAS}'); return c.width / c.height; }})()")
    check('podgląd zmienia proporcje na 300 × 100', abs(c - 3) < 0.05, str(c))
    page.fill('[data-size=h]', '2'); page.wait_for_timeout(200)
    check('niepełna wartość w trakcie pisania („2”) nie trafia do formularza', page.input_value('#bannerHeight') == '100')
    page.dispatch_event('[data-size=h]', 'change'); page.wait_for_timeout(300)
    check('po zatwierdzeniu wartość jest ograniczona do 10 cm', page.input_value('#bannerHeight') == '10' and page.input_value('[data-size=h]') == '10')
    page.fill('[data-size=h]', '150'); page.dispatch_event('[data-size=h]', 'change'); page.wait_for_timeout(300)
    check('wysokość 150 → formularz', page.input_value('#bannerHeight') == '150')
    page.evaluate("""() => { const e = document.getElementById('bannerWidth'); e.value = '240'; e.dispatchEvent(new Event('input', {bubbles: true})); e.dispatchEvent(new Event('change', {bubbles: true})); }"""); page.wait_for_timeout(300)
    check('formularz → pole w oknie', page.input_value('[data-size=w]') == '240')
    page.fill('[data-size=w]', '200'); page.dispatch_event('[data-size=w]', 'change'); page.fill('[data-size=h]', '100'); page.dispatch_event('[data-size=h]', 'change'); page.wait_for_timeout(300)
    chips = page.inner_text('[data-chips]')
    check('chip z wymiarami 200 × 100 cm po powrocie', '200 × 100 cm' in chips, chips)
    page.fill('[data-size=h]', '200'); page.dispatch_event('[data-size=h]', 'change'); page.wait_for_timeout(300)
    check('rozmiar poza zakresem materiału → ostrzeżenie w chipach', 'Krótszy bok może mieć maks.' in page.inner_text('[data-chips]'), page.inner_text('[data-chips]'))
    page.fill('[data-size=h]', '100'); page.dispatch_event('[data-size=h]', 'change'); page.wait_for_timeout(300)

    # ============ E. kolory: tło / tekst / przycisk ============
    page.click('[data-swatches] [data-color="#d71920"]'); page.wait_for_timeout(250)
    check('czerwone tło, tekst dobrany automatycznie (biały)', px(page, CANVAS, .02, .02) == '#d71920' and count_color(page, CANVAS, '#ffffff', 30) > 2000 and page.evaluate("Druk24BannerSimple.getState().textColor") == '')
    check('miniatura w panelu zmienia kolor razem z wyborem', px(page, f'{ENTRY} canvas', .5, .02) == '#d71920')
    page.click('[data-swatches] [data-color="#ffffff"]'); page.wait_for_timeout(250)
    check('białe tło → tekst automatycznie ciemny', px(page, CANVAS, .02, .02) == '#ffffff' and count_color(page, CANVAS, '#111111', 30) > 1500)
    page.click('[data-swatches] [data-color="#0f2747"]'); page.wait_for_timeout(200)
    check('„Przycisk” wyłączony, dopóki przycisk nie jest pokazany', page.is_disabled('[data-target=btn]') and page.is_disabled('[data-s=ctaScale]'))
    page.click('[data-target=text]'); page.wait_for_timeout(150)
    check('wybrany cel „Tekst”', page.get_attribute('[data-target=text]', 'aria-pressed') == 'true' and page.get_attribute('[data-target=bg]', 'aria-pressed') == 'false')
    page.click('[data-swatches] [data-color="#ffd60a"]'); page.wait_for_timeout(250)
    check('żółty tekst na granatowym tle', page.evaluate("Druk24BannerSimple.getState().textColor") == '#ffd60a' and count_color(page, CANVAS, '#ffd60a', 30) > 2000 and px(page, CANVAS, .02, .02) == '#0f2747')
    check('kafelek żółty zaznaczony dla celu „Tekst”', page.get_attribute('[data-color="#ffd60a"]', 'aria-pressed') == 'true')
    page.click('[data-target=bg]'); page.click('[data-swatches] [data-color="#ffffff"]'); page.wait_for_timeout(250)
    check('zmiana tła nie psuje ręcznie wybranego koloru tekstu (żółty zostaje)', page.evaluate("Druk24BannerSimple.getState().textColor") == '#ffd60a')
    check('żółty na białym → ocena czytelności zła/słaba', re.search(r'Czytelność: (zła|słaba)', page.inner_text('[data-chips]')) is not None, page.inner_text('[data-chips]'))
    page.click('[data-swatches] [data-color="#0f2747"]'); page.wait_for_timeout(250)
    # przycisk: włączenie, kolor
    page.check('[data-cta-on]'); page.wait_for_timeout(250)
    check('przycisk pokazany po zaznaczeniu „Przycisk”', report(page)['blocks'].get('cta') is not None and not page.is_disabled('[data-target=btn]') and not page.is_disabled('[data-s=ctaScale]'))
    page.click('[data-target=btn]'); page.click('[data-swatches] [data-color="#0b8a4b"]'); page.wait_for_timeout(250)
    cta = page.evaluate("""() => { const c = document.createElement('canvas'); c.width = 1000; c.height = 500; const r = Druk24BannerSimple.render(c); const b = r.blocks.cta.box, g = c.getContext('2d');
      const d = g.getImageData(Math.round(b.x + 6), Math.round(b.y + b.h / 2), 1, 1).data; return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); }""")
    check('zielony przycisk (kolor wybrany osobno od tekstu)', cta == '#0b8a4b', cta)
    page.click('[data-swatches] [data-color="#0f2747"]'); page.wait_for_timeout(250)
    check('przycisk w kolorze tła → ostrzeżenie „zlewa się z tłem”', 'zlewa się z tłem' in page.inner_text('[data-chips]'), page.inner_text('[data-chips]'))
    page.click('[data-swatches] [data-color="#ffd60a"]'); page.wait_for_timeout(250)
    check('po zmianie koloru przycisku ostrzeżenie znika', 'zlewa się' not in page.inner_text('[data-chips]'))
    page.uncheck('[data-cta-on]'); page.wait_for_timeout(250)
    check('wyłączony przycisk znika z banera, cel wraca na „Tło”', report(page)['blocks'].get('cta') is None and page.get_attribute('[data-target=bg]', 'aria-pressed') == 'true')

    # ============ F. pola tekstowe ============
    fill_text(page, 'headline', 'Wielka wyprzedaż')
    check('nagłówek na podglądzie i licznik znaków', page.inner_text('[data-count=headline]') == '16/46' and report(page)['blocks']['head'] is not None)
    check('limity pól (maxlength): nagłówek 46, opis 70, kontakt 70, przycisk 24', [page.get_attribute(f'[data-f={k}]', 'maxlength') for k in ('headline', 'sub', 'contact', 'cta')] == ['46', '70', '70', '24'])
    fill_text(page, 'cta', 'Sprawdź ofertę')
    check('wpisanie tekstu przycisku od razu go pokazuje', page.is_checked('[data-cta-on]') and report(page)['blocks'].get('cta') is not None)
    page.fill('[data-f=headline]', ''); page.wait_for_timeout(120)
    page.fill('[data-f=headline]', 'Wielka wyprzedaż'); fill_text(page, 'sub', 'Do -50% na wszystko'); fill_text(page, 'contact', 'tel. 111 222 333')
    check('po wpisaniu własnych tekstów brak problemu', page.evaluate("Druk24BannerSimple.getProblem()") == '')
    page.fill('[data-f=headline]', ''); page.wait_for_timeout(120)
    check('pusty nagłówek → problem', page.evaluate("Druk24BannerSimple.getProblem()") == 'Wpisz nagłówek.')
    page.fill('[data-f=headline]', 'TWÓJ NAGŁÓWEK'); page.wait_for_timeout(120)
    check('przykładowy tekst → problem', 'przykładowy tekst' in page.evaluate("Druk24BannerSimple.getProblem()"))
    page.click('.d24bgs [data-act=use]'); page.wait_for_timeout(300)
    check('„Użyj w zamówieniu” z przykładowym tekstem: komunikat i brak zapisu', 'przykładowy tekst' in page.inner_text('[data-msg]') and not page.evaluate("Druk24BannerSimple.isAttachEnabled()") and page.evaluate(f"document.querySelector('{DLG}').open"))
    page.fill('[data-f=headline]', 'Wielka wyprzedaż'); page.wait_for_timeout(150)
    check('komunikat znika po poprawieniu tekstu', page.inner_text('[data-msg]') == '')

    # ============ G. suwaki ============
    page.uncheck('[data-cta-on]'); page.wait_for_timeout(200)
    h100 = report(page)['blocks']['head']['size']
    page.evaluate("(() => { const i = document.querySelector('[data-s=headScale]'); i.value = '60'; i.dispatchEvent(new Event('input', {bubbles: true})); })()"); page.wait_for_timeout(250)
    h60 = report(page)['blocks']['head']['size']
    check('suwak nagłówka 60% zmniejsza napis o ok. 40%', 0.55 < h60 / h100 < 0.65, f'{h100} → {h60}')
    check('wartość suwaka widoczna („60%”)', page.inner_text('[data-out=headScale]') == '60%')
    s100 = report(page)['blocks']['sub']['size']
    page.evaluate("(() => { const i = document.querySelector('[data-s=subScale]'); i.value = '50'; i.dispatchEvent(new Event('input', {bubbles: true})); })()"); page.wait_for_timeout(250)
    check('suwak opisu 50%', 0.45 < report(page)['blocks']['sub']['size'] / s100 < 0.55)
    c100 = report(page)['blocks']['contact']['size']
    page.evaluate("(() => { const i = document.querySelector('[data-s=contactScale]'); i.value = '70'; i.dispatchEvent(new Event('input', {bubbles: true})); })()"); page.wait_for_timeout(250)
    check('suwak kontaktu 70%', 0.65 < report(page)['blocks']['contact']['size'] / c100 < 0.75)
    page.check('[data-cta-on]'); page.wait_for_timeout(250)
    b100 = report(page)['blocks']['cta']['size']
    page.evaluate("(() => { const i = document.querySelector('[data-s=ctaScale]'); i.value = '50'; i.dispatchEvent(new Event('input', {bubbles: true})); })()"); page.wait_for_timeout(250)
    b50 = report(page)['blocks']['cta']['size']
    check('suwak przycisku 50% zmniejsza przycisk', 0.45 < b50 / b100 < 0.55, f'{b100} → {b50}')
    check('suwaki mają zakres 40–100%', all(page.get_attribute(f'[data-s={k}]', 'min') == '40' and page.get_attribute(f'[data-s={k}]', 'max') == '100' for k in ('headScale', 'subScale', 'contactScale', 'ctaScale')))

    # ============ H. wyrównanie ============
    page.uncheck('[data-cta-on]')
    for k in ('headScale', 'subScale', 'contactScale'):
        page.evaluate(f"(() => {{ const i = document.querySelector('[data-s={k}]'); i.value = '40'; i.dispatchEvent(new Event('input', {{bubbles: true}})); }})()")
    page.fill('[data-f=headline]', 'Abc'); page.fill('[data-f=sub]', 'abc'); page.fill('[data-f=contact]', 'abc'); page.wait_for_timeout(250)
    cx = {}
    for k in ('left', 'center', 'right'):
        page.click(f'[data-align={k}]'); page.wait_for_timeout(250); cx[k] = ink_centroid(page, CANVAS)
    check('wyrównanie: do lewej < środek < do prawej', 0 < cx['left'] < 0.35 and 0.42 < cx['center'] < 0.58 and cx['right'] > 0.65, str(cx))
    check('zaznaczone wyrównanie widoczne', page.get_attribute('[data-align=right]', 'aria-pressed') == 'true' and page.evaluate("Druk24BannerSimple.getState().align") == 'right')
    page.click('[data-align=center]')
    for k in ('headScale', 'subScale', 'contactScale'):
        page.evaluate(f"(() => {{ const i = document.querySelector('[data-s={k}]'); i.value = '100'; i.dispatchEvent(new Event('input', {{bubbles: true}})); }})()")
    page.fill('[data-f=headline]', 'Wielka wyprzedaż'); page.fill('[data-f=sub]', 'Do -50% na wszystko'); page.fill('[data-f=contact]', 'tel. 111 222 333'); page.wait_for_timeout(250)

    # ============ I. „Użyj w zamówieniu” → koszyk ============
    page.evaluate("document.getElementById('calculate')?.click()")
    check('domyślnie projekt NIE jest dołączany', not page.evaluate("Druk24BannerSimple.isAttachEnabled()") and page.evaluate("Druk24BannerSimple.getAttachFiles().length") == 0)
    page.click('.d24bgs [data-act=use]'); page.wait_for_function("Druk24BannerSimple.getAttachFiles().length === 1", timeout=30000); page.wait_for_timeout(300)
    check('okno zamyka się po „Użyj w zamówieniu”', not page.evaluate(f"document.querySelector('{DLG}').open"))
    files = page.evaluate("Druk24BannerSimple.getAttachFiles().map(f => [f.name, f.type, f.size])")
    check('dołączony plik: PDF „baner-200x100cm-…”', len(files) == 1 and files[0][1] == 'application/pdf' and files[0][0].startswith('baner-200x100cm-wielka-wyprzedaz') and files[0][2] > 1000, str(files))
    if pypdf:
        r = pypdf.PdfReader(io.BytesIO(attached_bytes(page))); box = r.pages[0].mediabox
        check('PDF ma wymiar strony 200 × 100 cm', abs(float(box.width) - 5669.3) < 1 and abs(float(box.height) - 2834.65) < 1, f'{box.width}x{box.height}')
    check('panel: status „✓ Projekt zapisany”', '✓ Projekt zapisany' in page.inner_text(ENTRY) and page.is_checked(f'{ENTRY} [data-attach]'))
    page.evaluate("document.getElementById('calculate').click()"); page.wait_for_timeout(300)
    page.evaluate("document.getElementById('addToCart').click()"); page.wait_for_timeout(700)
    check('plik trafia do koszyka razem z banerem', 'baner-200x100cm' in page.inner_text('#cartPanel'), page.inner_text('#cartPanel')[:200])
    # zmiana wymiarów w oknie przebudowuje załącznik
    open_editor(page)
    page.fill('[data-size=w]', '120'); page.dispatch_event('[data-size=w]', 'change')
    page.wait_for_function("Druk24BannerSimple.getAttachFiles().length === 1 && Druk24BannerSimple.getAttachFiles()[0].name.includes('120x100cm')", timeout=30000)
    check('zmiana wymiarów w oknie przebudowuje załącznik (120 × 100)', True)
    page.fill('[data-size=w]', '200'); page.dispatch_event('[data-size=w]', 'change')
    page.wait_for_function("Druk24BannerSimple.getAttachFiles().length === 1 && Druk24BannerSimple.getAttachFiles()[0].name.includes('200x100cm')", timeout=30000)
    page.keyboard.press('Escape'); page.wait_for_timeout(200)
    page.uncheck(f'{ENTRY} [data-attach]'); page.wait_for_timeout(200)
    check('odznaczenie zgody usuwa załącznik', page.evaluate("Druk24BannerSimple.getAttachFiles().length") == 0)

    # ============ I2. generator tylko przy banerach (0.26.21v) ============
    def setmat(v):
        page.evaluate("""v => { const s = document.getElementById('bannerMaterial'); s.value = v; s.dispatchEvent(new Event('input', {bubbles: true})); s.dispatchEvent(new Event('change', {bubbles: true})); }""", v); page.wait_for_timeout(350)
    mats = page.evaluate("[...document.getElementById('bannerMaterial').options].map(o => o.value)")
    banners = [m for m in mats if not m.startswith('Folia')]; films = [m for m in mats if m.startswith('Folia')]
    check('materiały: są banery (powlekany, mesh) i folie', 'Baner powlekany 510g' in banners and 'Baner siatka mesh' in banners and len(films) >= 5, str(mats))
    for m in banners:
        setmat(m)
        check(f'baner „{m}”: panel generatora widoczny', page.locator(ENTRY).is_visible() and page.locator(f'{ENTRY} [data-act=open]').first.is_visible())
    page.evaluate("Druk24BannerSimple.setAttach(true)"); page.wait_for_function("Druk24BannerSimple.getAttachFiles().length === 1", timeout=30000)
    setmat('Baner siatka mesh')
    check('mesh: dołączony projekt zostaje (to też baner)', page.evaluate("Druk24BannerSimple.isAttachEnabled()") and page.evaluate("Druk24BannerSimple.getAttachFiles().length") == 1)
    for m in films:
        setmat('Baner siatka mesh'); page.evaluate("Druk24BannerSimple.setAttach(true)"); page.wait_for_function("Druk24BannerSimple.getAttachFiles().length === 1", timeout=30000)
        setmat(m)
        check(f'folia „{m}”: panel ukryty', not page.locator(ENTRY).is_visible() and page.locator(ENTRY).count() == 1)
        check(f'folia „{m}”: projekt nie jest dołączany', not page.evaluate("Druk24BannerSimple.isAttachEnabled()") and page.evaluate("Druk24BannerSimple.getAttachFiles().length") == 0)
    # folia: kalkulator nie dostaje pliku, API nie otwiera okna ani nie dołącza
    setmat('Folia mat')
    page.evaluate("Druk24BannerSimple.open(); Druk24BannerSimple.setAttach(true)"); page.wait_for_timeout(400)
    check('folia: API nie otwiera okna i nie dołącza projektu', not page.evaluate(f"!!(document.querySelector('{DLG}') && document.querySelector('{DLG}').open)") and not page.evaluate("Druk24BannerSimple.isAttachEnabled()"))
    n_files = page.inner_text('#cartPanel').count('baner-200x100cm')
    page.evaluate("document.getElementById('calculate').click()"); page.wait_for_timeout(300)
    page.evaluate("document.getElementById('addToCart').click()"); page.wait_for_timeout(600)
    cart_txt = page.inner_text('#cartPanel')
    check('folia w koszyku bez pliku projektu (liczba plików projektu bez zmian)', 'Folia mat' in cart_txt and cart_txt.count('baner-200x100cm') == n_files, f'{n_files} -> {cart_txt.count("baner-200x100cm")}')
    # powrót do banera: panel wraca (projekt trzeba zaznaczyć ponownie — był wyłączony przy przejściu na folię)
    setmat('Baner powlekany 510g')
    check('powrót do banera: panel znów widoczny, zgoda odznaczona', page.locator(ENTRY).is_visible() and not page.is_checked(f'{ENTRY} [data-attach]'))
    open_editor(page)
    check('powrót do banera: okno generatora się otwiera', page.evaluate(f"document.querySelector('{DLG}').open"))
    page.keyboard.press('Escape'); page.wait_for_timeout(200)
    # przełączenie strony i powrót: stan zależy od aktualnego materiału
    setmat('Folia OWH'); goto_page(page, 'Roll-upy i X-banery'); goto_page(page, 'Folie i banery 24h')
    mat_now = page.evaluate("document.getElementById('bannerMaterial').value")
    check('po powrocie na stronę panel zgadza się z materiałem', page.locator(ENTRY).is_visible() == (not mat_now.startswith('Folia')), mat_now)
    # wyszukiwarka z opisem ustawia materiał programowo — panel też ma się zgadzać
    for q, want_vis in (('folia mat 100x100 3 szt', False), ('baner mesh 150x100 2 szt', True), ('folia podłogowa 100x200 cm 2 szt', False), ('baner 150x100 2 szt', True)):
        goto_page(page, 'Start'); page.fill('#homeProductSearch', q); page.keyboard.press('Enter'); page.wait_for_timeout(1300)
        mat_q = page.evaluate("document.getElementById('bannerMaterial') && document.getElementById('bannerMaterial').value")
        check(f'wyszukiwarka „{q}”: panel {"widoczny" if want_vis else "ukryty"} (materiał: {mat_q})', bool(mat_q) and page.locator(ENTRY).is_visible() == want_vis and want_vis == (not mat_q.startswith('Folia')))
    setmat('Baner powlekany 510g'); setdims(page, 200, 100)   # powrót na stronę odtworzył formularz z domyślnymi wymiarami

    # ============ J. „Wyczyść projekt” ============
    open_editor(page)
    page.click('.d24bgs [data-act=reset]'); page.wait_for_timeout(200)
    check('pierwsze kliknięcie tylko prosi o potwierdzenie', 'Na pewno' in page.inner_text('.d24bgs-top') and page.evaluate("Druk24BannerSimple.getState().headline") == 'Wielka wyprzedaż')
    page.wait_for_timeout(3800)
    check('potwierdzenie wygasa samo', 'Na pewno' not in page.inner_text('.d24bgs-top') and 'Wyczyść projekt' in page.inner_text('.d24bgs-top'))
    page.click('.d24bgs [data-act=use]'); page.wait_for_function("Druk24BannerSimple.isAttachEnabled()", timeout=30000)
    open_editor(page)
    page.click('[data-target=text]'); page.click('[data-swatches] [data-color="#ffd60a"]'); page.click('[data-align=left]'); page.check('[data-cta-on]')
    page.click('.d24bgs [data-act=reset]'); page.click('.d24bgs [data-act=reset]'); page.wait_for_timeout(350)
    st = page.evaluate("Druk24BannerSimple.getState()")
    check('wyczyszczony projekt: kolory, teksty, suwaki, wyrównanie i przycisk wracają do domyślnych',
          st['color'] == '#0f2747' and st['textColor'] == '' and st['btnColor'] == '' and st['headline'] == 'TWÓJ NAGŁÓWEK' and st['sub'].startswith('Krótki opis') and st['ctaOn'] is False
          and st['headScale'] == 100 and st['ctaScale'] == 100 and st['align'] == 'center', str(st))
    check('wyczyszczenie zachowuje wymiary zamówienia', page.input_value('#bannerWidth') == '200' and page.input_value('#bannerHeight') == '100' and page.input_value('[data-size=w]') == '200')
    check('wyczyszczenie wyłącza dołączony projekt (przykładowy tekst nie trafi do zamówienia)', not page.evaluate("Druk24BannerSimple.isAttachEnabled()"))
    check('pola w oknie wracają do przykładów', page.input_value('[data-f=headline]') == 'TWÓJ NAGŁÓWEK' and not page.is_checked('[data-cta-on]'))
    page.keyboard.press('Escape'); page.wait_for_timeout(200)

    # ============ K. pamięć ustawień i migracja ============
    open_editor(page)
    page.click('[data-swatches] [data-color="#0b8a4b"]'); page.click('[data-target=text]'); page.click('[data-swatches] [data-color="#111111"]'); page.click('[data-align=right]')
    page.fill('[data-f=headline]', 'Zapamiętany'); page.check('[data-cta-on]'); page.fill('[data-f=cta]', 'Kup teraz')
    page.evaluate("(() => { const i = document.querySelector('[data-s=ctaScale]'); i.value = '80'; i.dispatchEvent(new Event('input', {bubbles: true})); })()")
    page.keyboard.press('Escape'); page.wait_for_timeout(300)
    page.reload(); page.wait_for_timeout(900); goto_page(page, 'Folie i banery 24h')
    st = page.evaluate("Druk24BannerSimple.getState()")
    check('po odświeżeniu: kolory, tekst, przycisk, suwak i wyrównanie zapamiętane', st['color'] == '#0b8a4b' and st['textColor'] == '#111111' and st['headline'] == 'Zapamiętany' and st['ctaOn'] is True and st['cta'] == 'Kup teraz' and st['ctaScale'] == 80 and st['align'] == 'right', str(st))
    page.evaluate("localStorage.removeItem('druk24-banner-simple-v2'); localStorage.setItem('druk24-banner-simple-v1', JSON.stringify({color: '#d71920', headline: 'STARY ZAPIS', sub: '', contact: ''}))")
    page.reload(); page.wait_for_timeout(900); goto_page(page, 'Folie i banery 24h')
    st = page.evaluate("Druk24BannerSimple.getState()")
    check('migracja ze starego zapisu (kolor i teksty z wersji 0.26.15–0.26.18)', st['color'] == '#d71920' and st['headline'] == 'STARY ZAPIS' and st['ctaOn'] is False and st['align'] == 'center', str(st))
    page.evaluate("localStorage.clear()"); page.reload(); page.wait_for_timeout(900); goto_page(page, 'Folie i banery 24h')

    # ============ L. skrajne proporcje, EN, ciemny motyw, 1366×768, telefon ============
    for w, h in ((1000, 100), (100, 300), (60, 300), (500, 50)):
        setdims(page, w, h); open_editor(page)
        d = page.evaluate(f"(() => {{ const c = document.querySelector('{CANVAS}'); return [c.width, c.height]; }})()")
        check(f'proporcje podglądu {w}×{h}', abs(d[0] / d[1] - w / h) / (w / h) < 0.03, str(d))
        page.keyboard.press('Escape'); page.wait_for_timeout(120)
    setdims(page, 200, 100)
    page.set_viewport_size({'width': 1366, 'height': 768}); page.wait_for_timeout(300)
    open_editor(page); sh, ch = side_overflow(page)
    check('1366×768: prawa kolumna bez paska przewijania', sh <= ch + 1, f'{sh} > {ch}')
    vis = page.evaluate("(() => { const b = document.querySelector('.d24bgs [data-act=use]').getBoundingClientRect(); return b.bottom <= window.innerHeight && b.top >= 0; })()")
    check('1366×768: przycisk „Użyj w zamówieniu” widoczny', vis)
    page.screenshot(path=str(shot / 'bg19_laptop.png'))
    page.set_viewport_size({'width': 1280, 'height': 720}); page.wait_for_timeout(300)
    sh, ch = side_overflow(page)
    print(f'INFO 1280×720: kolumna {sh}/{ch} px')
    page.set_viewport_size({'width': 1440, 'height': 900}); page.wait_for_timeout(200)
    page.evaluate("document.documentElement.setAttribute('data-theme','dark')"); page.wait_for_timeout(250)
    page.screenshot(path=str(shot / 'bg19_ciemny.png'))
    page.evaluate("document.documentElement.setAttribute('data-theme','light')"); page.keyboard.press('Escape')
    page.evaluate("document.documentElement.lang = 'en'"); page.wait_for_timeout(500)
    check('wersja EN panelu', 'BANNER GENERATOR' in page.inner_text(ENTRY))
    open_editor(page)
    txt = page.inner_text('.d24bgs')
    check('wersja EN okna', 'Banner generator' in txt and 'Use in order' in txt and 'Reset design' in txt and 'Headline size' in txt and 'Button size' in txt and 'Centre' in txt, txt[:200])
    page.keyboard.press('Escape'); page.evaluate("document.documentElement.lang = 'pl'"); page.wait_for_timeout(400)
    page.set_viewport_size({'width': 390, 'height': 844}); page.wait_for_timeout(300)
    open_editor(page); page.wait_for_timeout(300)
    box = page.evaluate(f"(() => {{ const r = document.querySelector('{DLG}').getBoundingClientRect(); return [r.width, r.height]; }})()")
    check('telefon: okno na cały ekran', box[0] >= 389 and box[1] >= 843, str(box))
    check('telefon: bez poziomego przewijania', page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1 && document.querySelector('.d24bgs').scrollWidth <= document.querySelector('.d24bgs').clientWidth + 1"))
    page.screenshot(path=str(shot / 'bg19_mobile.png'))
    page.evaluate("document.querySelector('.d24bgs-main').scrollTop = 500"); page.wait_for_timeout(300)
    t = page.evaluate("[document.querySelector('.d24bgs-stage').getBoundingClientRect().top, document.querySelector('.d24bgs-main').getBoundingClientRect().top]")
    check('telefon: podgląd przyklejony u góry podczas przewijania', abs(t[0] - t[1]) < 3, str(t))
    vis = page.evaluate("(() => { const b = document.querySelector('.d24bgs [data-act=use]').getBoundingClientRect(); return b.bottom <= window.innerHeight + 1 && b.top >= 0; })()")
    check('telefon: przycisk „Użyj w zamówieniu” zawsze widoczny', vis)
    top_m = page.evaluate("(() => { const r = document.querySelector('.d24bgs-top').getBoundingClientRect(); return r.height; })()")
    check('telefon: pasek u góry nie zajmuje więcej niż 120 px', top_m <= 120, str(top_m))

    check('żadne pobieranie pliku nie zostało wywołane', not downloads, str(downloads))
    check('brak błędów w konsoli', not errors, '; '.join(errors[:4]))
    browser.close()

print('\nNIEUDANE:', fails if fails else 'brak')
raise SystemExit(1 if fails else 0)
