"""0.26.15v–0.26.18v: (1) pełny generator banerów BEZ gradientu i wzoru tła (zostaje kolor i zdjęcie; stare projekty z gradientem wczytują się jako kolor),
(2) PROSTY generator banerów: wybór koloru tła + treść, osobny panel i okno, BEZ eksportu (0.26.16v: tylko „Zapisz projekt” → do zamówienia), jeden projekt naraz; (3) 0.26.17v: prosty generator NA WIERZCHU, pełny w zwijanej sekcji „Chcesz projektować bardziej?”.

Uruchomienie: python tests/banner_generator_simple_02615_browser.py   (wymaga playwright, pypdf; Pillow opcjonalnie)
Serwer HTTP startuje sam z katalogu projektu.
"""
import functools, http.server, io, json, pathlib, re, socketserver, threading

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

FULL = '.d24bg-entry:not(.d24bgs-entry)'
SIMPLE = '.d24bgs-entry'
fails = []


def check(name, cond, detail=''):
    print(('OK   ' if cond else 'FAIL ') + name + (f'  [{detail}]' if detail and not cond else ''))
    if not cond: fails.append(name)


def goto_page(page, name):
    page.evaluate("name => document.querySelector(`[data-page=\"${name}\"]`).click()", name); page.wait_for_timeout(450)


def expand_full(page):
    page.evaluate("(() => { const d = document.querySelector('.d24bg-more'); if (d) d.open = true; })()")


def setdims(page, w, h):
    page.evaluate("""([w, h]) => { for (const [id, v] of [['bannerWidth', w], ['bannerHeight', h]]) { const e = document.getElementById(id); e.value = v;
      e.dispatchEvent(new Event('input', {bubbles: true})); e.dispatchEvent(new Event('change', {bubbles: true})); } }""", [w, h]); page.wait_for_timeout(300)


def px(page, sel, x, y):
    """kolor piksela płótna jako #rrggbb (x, y w ułamkach 0–1)"""
    return page.evaluate("""([sel, fx, fy]) => { const c = document.querySelector(sel), g = c.getContext('2d');
      const d = g.getImageData(Math.round((c.width - 1) * fx), Math.round((c.height - 1) * fy), 1, 1).data;
      return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); }""", [sel, x, y])


def ink(page, sel):
    """średnia jasność pikseli różniących się od tła (tekst) w środku płótna: ~255 = jasny tekst, ~0 = ciemny"""
    return page.evaluate("""(sel) => { const c = document.querySelector(sel), g = c.getContext('2d'), bg = g.getImageData(2, 2, 1, 1).data;
      const x0 = Math.round(c.width * 0.2), y0 = Math.round(c.height * 0.25), w = Math.round(c.width * 0.6), h = Math.round(c.height * 0.5);
      const d = g.getImageData(x0, y0, w, h).data; let n = 0, s = 0;
      for (let i = 0; i < d.length; i += 4) { const df = Math.abs(d[i] - bg[0]) + Math.abs(d[i+1] - bg[1]) + Math.abs(d[i+2] - bg[2]); if (df > 200) { n++; s += (d[i] + d[i+1] + d[i+2]) / 3; } }
      return n < 20 ? -1 : s / n; }""", sel)


def attached_bytes(page):
    """bajty pliku dołączonego przez prosty generator (File → base64)"""
    import base64
    b64 = page.evaluate("""async () => { const f = Druk24BannerSimple.getAttachFiles()[0]; const u = new Uint8Array(await f.arrayBuffer());
      let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); }""")
    return base64.b64decode(b64)


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

    # ============ A. pełny generator: bez gradientu i wzoru ============
    check('wersja 0.26.18v', page.inner_text('#versionLabel') == '0.26.18v')
    downloads = []
    page.on('download', lambda d: downloads.append(d.suggested_filename))
    probs = page.evaluate("""() => {
      const E = window.Druk24BannerEngine, bad = [];
      if (E.PATTERNS) bad.push('PATTERNS nadal eksportowane');
      if (E.TEMPLATES.some(t => 'pattern' in t)) bad.push('szablon z polem pattern');
      if (E.PALETTES.some(p => 'bg2' in p)) bad.push('paleta z bg2');
      const d = E.defaultState(); if (d.bg.type !== 'solid' || 'pattern' in d.bg || 'c2' in d.bg || 'angle' in d.bg) bad.push('stan domyślny: ' + JSON.stringify(d.bg));
      for (let i = 0; i < 60; i++) { const r = E.randomize(E.defaultState()); if (r.bg.type !== 'solid' || 'pattern' in r.bg) bad.push('randomize: ' + JSON.stringify(r.bg)); }
      for (const t of E.TEMPLATES) { const s = E.applyTemplate(E.defaultState(), t, true); if (s.bg.type !== 'solid' || 'pattern' in s.bg) bad.push('szablon ' + t.id); }
      // stary projekt z gradientem i wzorem → kolor jednolity, bez dawnych pól
      const old = E.normalizeState({ v: 1, bg: { type: 'gradient', c1: '#ff0000', c2: '#00ff00', angle: 45, pattern: 'dots', dim: 30 } });
      if (old.bg.type !== 'solid' || old.bg.c1 !== '#ff0000' || 'pattern' in old.bg || 'c2' in old.bg || 'angle' in old.bg || old.bg.dim !== 30) bad.push('stary projekt: ' + JSON.stringify(old.bg));
      // render: te same kolory w narożnikach i w kilku miejscach tła (brak gradientu i wzoru)
      const c = document.createElement('canvas'); c.width = 600; c.height = 600; const s = E.defaultState(); s.layout = 'minimal'; s.bg.c1 = '#336699';
      E.render(c, s, {}, {}); const g = c.getContext('2d'), at = (x, y) => Array.from(g.getImageData(x, y, 1, 1).data).join(',');
      const pts = [[3, 3], [596, 3], [3, 596], [596, 596], [300, 590], [590, 300]].map(([x, y]) => at(x, y));
      if (new Set(pts).size !== 1) bad.push('tło niejednolite: ' + pts.join(' | '));
      return bad;
    }""")
    check('silnik: tylko kolor i zdjęcie, bez gradientu i wzoru (stary projekt → kolor)', not probs, str(probs))

    goto_page(page, 'Folie i banery 24h')
    expand_full(page); page.locator(f'{FULL} .d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(800)
    page.click('[data-tab=look]'); page.wait_for_timeout(300)
    check('edytor: brak przełącznika „Gradient”', page.locator('[data-set="bg.type"][data-val=gradient]').count() == 0)
    check('edytor: brak pola „Wzór tła”', page.locator('[data-bind="bg.pattern"]').count() == 0 and 'Wzór tła' not in page.inner_text('dialog.d24bg-dialog'))
    check('edytor: brak „Kolor 2” i „Kierunek”', page.locator('[data-bind="bg.c2"]').count() == 0 and page.locator('[data-bind="bg.angle"]').count() == 0)
    check('edytor: tło = Kolor / Zdjęcie', page.locator('[data-set="bg.type"]').count() == 2)
    page.click('[data-set="bg.type"][data-val=solid]'); page.wait_for_timeout(200)
    check('edytor: wybór „Kolor tła”', page.locator('[data-bind="bg.c1"]').is_visible())
    page.evaluate("Druk24BannerGen.setState({...Druk24BannerGen.getState(), bg: {type: 'gradient', c1: '#cc2200', c2: '#2200cc', angle: 90, pattern: 'grid'}})"); page.wait_for_timeout(300)
    bgs = page.evaluate("Druk24BannerGen.getState().bg")
    check('setState ze starym gradientem → kolor jednolity', bgs['type'] == 'solid' and bgs['c1'] == '#cc2200' and 'pattern' not in bgs and 'c2' not in bgs, str(bgs))
    page.keyboard.press('Escape'); page.wait_for_timeout(200)
    page.evaluate("document.querySelector('.d24bg-more').open = false"); page.wait_for_timeout(100)

    # ============ B. panel prostego generatora ============
    order = page.evaluate("""() => { const g = document.querySelector('#content > .card > .form-grid'), a = document.querySelector('.d24bgs-entry'), m = document.querySelector('.d24bg-more');
      return !!g && !!a && !!m && g.nextElementSibling === a && a.nextElementSibling === m && m.contains(document.querySelector('.d24bg-entry:not(.d24bgs-entry)')); }""")
    check('kolejność: formularz → PROSTY generator → zwinięta sekcja z pełnym', order)
    check('pełny generator jest domyślnie zwinięty (niewidoczny)', not page.evaluate("document.querySelector('.d24bg-more').open") and not page.locator(f'{FULL}').is_visible())
    check('prosty generator jest widoczny od razu', page.locator(SIMPLE).is_visible() and page.locator(f'{SIMPLE} .d24bg-entry__actions [data-act=open]').is_visible())
    check('nagłówek sekcji: „Chcesz projektować bardziej?”', 'Chcesz projektować bardziej?' in page.inner_text('.d24bg-more > summary') and 'Pełny generator' in page.inner_text('.d24bg-more > summary'))
    check('miniatura prostego generatora narysowana w kolorze tła', page.evaluate("document.querySelector('.d24bgs-entry canvas').width") > 100 and px(page, f'{SIMPLE} canvas', .5, .02) in ('#0f2747',) )
    page.click('.d24bg-more > summary'); page.wait_for_timeout(250)
    check('klik w nagłówek rozwija pełny generator', page.evaluate("document.querySelector('.d24bg-more').open") and page.locator(f'{FULL}').is_visible() and page.locator(f'{FULL} .d24bg-entry__actions [data-act=open]').is_visible())
    page.click('.d24bg-more > summary'); page.wait_for_timeout(250)
    check('ponowny klik zwija sekcję', not page.evaluate("document.querySelector('.d24bg-more').open") and not page.locator(f'{FULL}').is_visible())
    check('znaczek „w zamówieniu” domyślnie ukryty', page.evaluate("document.querySelector('[data-more-badge]').hidden"))
    check('panel prostego: przycisk i zgoda domyślnie wyłączona', page.locator(f'{SIMPLE} .d24bg-entry__actions [data-act=open]').count() == 1 and not page.is_checked(f'{SIMPLE} [data-attach]'))
    goto_page(page, 'Wizytówki 24h')
    check('brak prostego generatora na wizytówkach', page.locator(SIMPLE).count() == 0)
    goto_page(page, 'Folie i banery 24h')
    check('prosty generator wraca na banerach (1 panel)', page.locator(SIMPLE).count() == 1)

    # ============ C. okno prostego generatora ============
    page.evaluate("localStorage.removeItem('druk24-banner-simple-v1')")
    setdims(page, 100, 100)
    page.locator(f'{SIMPLE} .d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(700)
    check('okno prostego generatora otwarte', page.evaluate("document.querySelector('dialog.d24bgs-dialog').open"))
    check('rozmiar z formularza', '100 × 100 cm' in page.inner_text('.d24bgs-top'), page.inner_text('.d24bgs-top'))
    check('podgląd kwadratowy', page.evaluate("(() => { const c = document.querySelector('.d24bgs canvas'); return c.width === c.height && c.width > 300; })()"))
    check('są tylko pola: kolor + 3 pola treści (bez szablonów, układów, zakładek)',
          page.locator('.d24bgs [data-color]').count() == 12 and page.locator('.d24bgs [data-f]').count() == 3 and page.locator('.d24bgs [role=tab]').count() == 0 and page.locator('.d24bgs select').count() == 0)
    check('domyślny kolor tła = granatowy, na płótnie ten sam', page.evaluate("Druk24BannerSimple.getState().color") == '#0f2747' and px(page, '.d24bgs canvas', .02, .02) == '#0f2747')
    check('tekst na ciemnym tle jest jasny', ink(page, '.d24bgs canvas') > 200, str(ink(page, '.d24bgs canvas')))
    page.click('[data-color="#ffd60a"]'); page.wait_for_timeout(300)
    check('żółty: tło na płótnie', px(page, '.d24bgs canvas', .02, .02) == '#ffd60a' and page.get_attribute('[data-color="#ffd60a"]', 'aria-pressed') == 'true')
    check('żółty: tekst sam robi się ciemny', 0 <= ink(page, '.d24bgs canvas') < 90, str(ink(page, '.d24bgs canvas')))
    page.click('[data-color="#ffffff"]'); page.wait_for_timeout(300)
    check('biały: tekst ciemny', 0 <= ink(page, '.d24bgs canvas') < 90)
    page.click('[data-color="#d71920"]'); page.wait_for_timeout(300)
    check('czerwony: tło i jasny tekst', px(page, '.d24bgs canvas', .02, .02) == '#d71920' and ink(page, '.d24bgs canvas') > 200)
    check('miniatura w panelu zmienia kolor razem z wyborem', px(page, f'{SIMPLE} canvas', .5, .02) == '#d71920')
    page.evaluate("(() => { const i = document.querySelector('.d24bgs [data-custom]'); i.value = '#00aa88'; i.dispatchEvent(new Event('input', {bubbles: true})); })()"); page.wait_for_timeout(300)
    check('własny kolor tła', px(page, '.d24bgs canvas', .02, .02) == '#00aa88' and page.evaluate("Druk24BannerSimple.getState().color") == '#00aa88')

    # pola treści
    page.focus('[data-f=headline]')
    check('klik w przykładowy tekst zaznacza go', page.evaluate("(() => { const i = document.querySelector('[data-f=headline]'); return i.selectionStart === 0 && i.selectionEnd === i.value.length; })()"))
    page.fill('[data-f=headline]', 'WIELKA WYPRZEDAŻ'); page.wait_for_timeout(300)
    check('nagłówek trafia do stanu i licznika', page.evaluate("Druk24BannerSimple.getState().headline") == 'WIELKA WYPRZEDAŻ' and '16/46' in page.inner_text('.d24bgs [data-count=headline]'))
    page.fill('[data-f=headline]', 'x' * 80); check('limit nagłówka 46 znaków', len(page.input_value('[data-f=headline]')) == 46)
    page.fill('[data-f=sub]', 'y' * 90); check('limit opisu 70 znaków', len(page.input_value('[data-f=sub]')) == 70)
    page.fill('[data-f=headline]', 'WIELKA WYPRZEDAŻ'); page.fill('[data-f=sub]', 'Wszystko do -50%'); page.fill('[data-f=contact]', 'tel. 600 111 222'); page.wait_for_timeout(400)
    h0 = page.evaluate("document.querySelector('.d24bgs canvas').toDataURL().length")
    page.fill('[data-f=sub]', ''); page.wait_for_timeout(400)
    check('opis jest opcjonalny (pusty znika z banera)', page.evaluate("document.querySelector('.d24bgs canvas').toDataURL().length") != h0 and not page.evaluate("Druk24BannerSimple.getProblem()"))
    page.fill('[data-f=sub]', 'Wszystko do -50%'); page.wait_for_timeout(300)
    page.screenshot(path=str(shot / 'bgs_okno.png'))

    # ochrona przed przykładowym tekstem i pustym nagłówkiem (tylko ścieżka „do zamówienia”)
    page.fill('[data-f=contact]', 'tel. 500 600 700 • www.twojafirma.pl'); page.wait_for_timeout(200)
    check('przykładowy kontakt blokuje „Użyj w zamówieniu”', bool(page.evaluate("Druk24BannerSimple.getProblem()")))
    page.click('.d24bgs [data-act=save]'); page.wait_for_timeout(400)
    check('komunikat o przykładowym tekście, okno otwarte, brak pliku', 'przykładowy' in page.inner_text('.d24bgs [data-msg]') and page.evaluate("document.querySelector('dialog.d24bgs-dialog').open") and page.evaluate("Druk24BannerSimple.getAttachFiles().length") == 0, page.inner_text('.d24bgs [data-msg]'))
    page.fill('[data-f=contact]', ''); page.fill('[data-f=headline]', ''); page.click('.d24bgs [data-act=save]'); page.wait_for_timeout(300)
    check('pusty nagłówek blokuje zapis', 'nagłówek' in page.inner_text('.d24bgs [data-msg]'))
    page.fill('[data-f=headline]', 'WIELKA WYPRZEDAŻ'); page.fill('[data-f=contact]', 'tel. 600 111 222'); page.wait_for_timeout(300)

    # ============ D. bez eksportu ============
    check('brak przycisków pobierania PDF / JPG', page.locator('.d24bgs [data-act=pdf]').count() == 0 and page.locator('.d24bgs [data-act=jpg]').count() == 0
          and 'Pobierz' not in page.inner_text('.d24bgs') and 'JPG' not in page.inner_text('.d24bgs'))
    check('jedyna akcja w oknie to „Zapisz projekt”', page.locator('.d24bgs-actions button').count() == 1 and page.inner_text('.d24bgs-actions').strip() == 'Zapisz projekt', page.inner_text('.d24bgs-actions'))
    check('API bez eksportu do pliku (jest tylko zapis do zamówienia)', page.evaluate("typeof Druk24BannerSimple.exportBlob") == 'undefined')

    # ============ E. zamówienie ============
    check('domyślnie nic nie jest dołączone', page.evaluate("Druk24BannerSimple.getAttachFiles().length") == 0 and page.evaluate("Druk24BannerGen.getAttachFiles().length") == 0)
    page.click('.d24bgs [data-act=save]'); page.wait_for_function("!document.querySelector('dialog.d24bgs-dialog').open", timeout=30000)
    files = page.evaluate("Druk24BannerSimple.getAttachFiles().map(f => [f.name, f.type, f.size])")
    check('„Zapisz projekt” zamyka okno i zapisuje PDF do zamówienia', len(files) == 1 and files[0][1] == 'application/pdf' and files[0][2] > 1000 and files[0][0].startswith('baner-100x100cm'), str(files))
    pdf = attached_bytes(page)
    check('zapisany projekt to poprawny PDF', pdf[:5] == b'%PDF-' and len(pdf) > 5000)
    if pypdf:
        pg = pypdf.PdfReader(io.BytesIO(pdf)).pages[0]
        w_cm, h_cm = float(pg.mediabox.width) / 72 * 2.54, float(pg.mediabox.height) / 72 * 2.54
        check('PDF projektu ma fizyczny rozmiar 100 × 100 cm', abs(w_cm - 100) < 0.2 and abs(h_cm - 100) < 0.2, f'{w_cm:.2f} × {h_cm:.2f}')
    check('status w panelu mówi, że projekt zapisany', 'Projekt zapisany' in page.inner_text(f'{SIMPLE} .d24bg-entry__status'))
    check('panel: zgoda zaznaczona i status ✓', page.is_checked(f'{SIMPLE} [data-attach]') and '✓' in page.inner_text(f'{SIMPLE} .d24bg-entry__status'))
    page.evaluate("document.getElementById('calculate').click()"); page.wait_for_timeout(300)
    page.evaluate("document.getElementById('addToCart').click()"); page.wait_for_timeout(700)
    check('plik z prostego generatora trafia do koszyka', 'baner-100x100cm-wielka-wyprzedaz' in page.inner_text('#cartPanel'), page.inner_text('#cartPanel')[:160])
    # zmiana rozmiaru unieważnia, potem przebudowa
    page.fill('#bannerWidth', '150'); page.dispatch_event('#bannerWidth', 'input'); page.dispatch_event('#bannerWidth', 'change')
    check('zmiana rozmiaru unieważnia załącznik do czasu przebudowy', page.evaluate("Druk24BannerSimple.getAttachFiles().length") == 0)
    page.wait_for_function("Druk24BannerSimple.getAttachFiles().length === 1", timeout=30000)
    check('załącznik przebudowany na nowy rozmiar', 'baner-150x100cm' in page.evaluate("Druk24BannerSimple.getAttachFiles()[0].name"))

    # jeden projekt naraz: pełny wyłącza prosty i odwrotnie
    page.evaluate("Druk24BannerGen.setAttach(true)"); page.wait_for_function("Druk24BannerGen.getAttachFiles().length === 1", timeout=30000)
    check('znaczek „✓ w zamówieniu” w nagłówku sekcji, gdy pełny generator jest dołączony', not page.evaluate("document.querySelector('[data-more-badge]').hidden"))
    check('pełny generator włączony → prosty wyłączony', not page.evaluate("Druk24BannerSimple.isAttachEnabled()") and page.evaluate("Druk24BannerSimple.getAttachFiles().length") == 0 and not page.is_checked(f'{SIMPLE} [data-attach]') and page.is_checked(f'{FULL} [data-attach]'))
    page.check(f'{SIMPLE} [data-attach]'); page.wait_for_function("Druk24BannerSimple.getAttachFiles().length === 1", timeout=30000)
    check('prosty włączony → pełny wyłączony', not page.evaluate("Druk24BannerGen.isAttachEnabled()") and page.evaluate("Druk24BannerGen.getAttachFiles().length") == 0 and not page.is_checked(f'{FULL} [data-attach]'))
    page.evaluate("document.getElementById('calculate').click()"); page.wait_for_timeout(300)
    page.evaluate("document.getElementById('addToCart').click()"); page.wait_for_timeout(700)
    check('znaczek w nagłówku sekcji znika, gdy dołączony jest prosty', page.evaluate("document.querySelector('[data-more-badge]').hidden"))
    check('w koszyku trafia dokładnie jeden projekt', page.inner_text('#cartPanel').count('baner-150x100cm') == 1, str(page.inner_text('#cartPanel').count('baner-150x100cm')))
    page.uncheck(f'{SIMPLE} [data-attach]'); page.wait_for_timeout(200)
    check('wyłączenie zgody usuwa załącznik', page.evaluate("Druk24BannerSimple.getAttachFiles().length") == 0 and not page.evaluate("Druk24BannerSimple.isAttachEnabled()"))
    # zaznaczenie zgody z przykładowym tekstem jest odrzucane
    page.evaluate("Druk24BannerSimple.setState({headline: 'TWÓJ NAGŁÓWEK'})")
    page.click(f'{SIMPLE} [data-attach]'); page.wait_for_timeout(300)
    check('zgoda z przykładowym tekstem jest odrzucona z komunikatem', not page.is_checked(f'{SIMPLE} [data-attach]') and 'przykładowy' in page.inner_text(f'{SIMPLE} .d24bg-entry__status'))
    page.evaluate("Druk24BannerSimple.setState({headline: 'WIELKA WYPRZEDAŻ'})")

    # ============ F. pamięć ustawień i przejście do pełnego ============
    page.reload(); page.wait_for_timeout(800); goto_page(page, 'Folie i banery 24h')
    st = page.evaluate("Druk24BannerSimple.getState()")
    check('ustawienia prostego generatora pamiętane po odświeżeniu', st['color'] == '#00aa88' and st['headline'] == 'WIELKA WYPRZEDAŻ' and st['contact'] == 'tel. 600 111 222', str(st))
    page.locator(f'{SIMPLE} .d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(600)
    page.click('.d24bgs [data-act=full]'); page.wait_for_timeout(900)
    gs = page.evaluate("Druk24BannerGen.getState()")
    check('„Otwórz pełny generator” zamyka prosty i przenosi kolor i treść',
          not page.evaluate("document.querySelector('dialog.d24bgs-dialog').open") and page.evaluate("document.querySelector('dialog.d24bg-dialog').open")
          and gs['headline'] == 'WIELKA WYPRZEDAŻ' and gs['bg']['c1'] == '#00aa88' and gs['bg']['type'] == 'solid' and gs['sub'] == 'Wszystko do -50%', str(gs['bg']))
    page.keyboard.press('Escape'); page.wait_for_timeout(300)

    # ============ G. skrajne proporcje, EN, ciemny motyw, telefon ============
    for (w, h) in [(1000, 100), (100, 1000), (30, 30), (300, 150)]:
        setdims(page, w, h)
        page.locator(f'{SIMPLE} .d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(500)
        dims = page.evaluate("(() => { const c = document.querySelector('.d24bgs canvas'); return [c.width, c.height]; })()")
        ok = abs(dims[0] / dims[1] - w / h) / (w / h) < 0.03
        check(f'proporcje podglądu {w}×{h}', ok, str(dims))
        page.keyboard.press('Escape'); page.wait_for_timeout(150)
    setdims(page, 300, 100)
    page.locator(f'{SIMPLE} .d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(500)
    page.evaluate("document.documentElement.setAttribute('data-theme','dark')"); page.wait_for_timeout(200)
    page.screenshot(path=str(shot / 'bgs_ciemny.png'))
    page.evaluate("document.documentElement.setAttribute('data-theme','light')"); page.keyboard.press('Escape')
    page.evaluate("document.documentElement.lang = 'en'"); page.wait_for_timeout(500)
    check('wersja EN panelu', 'BANNER GENERATOR' in page.inner_text(SIMPLE) and 'Want to design more' in page.inner_text('.d24bg-more > summary'))
    page.locator(f'{SIMPLE} .d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(600)
    check('wersja EN okna', 'Simple banner generator' in page.inner_text('.d24bgs-top') and 'Background colour' in page.inner_text('.d24bgs'))
    page.keyboard.press('Escape'); page.evaluate("document.documentElement.lang = 'pl'"); page.wait_for_timeout(400)
    page.set_viewport_size({'width': 390, 'height': 844}); page.wait_for_timeout(300)
    page.locator(f'{SIMPLE} .d24bg-entry__actions [data-act=open]').click(); page.wait_for_timeout(800)
    box = page.evaluate("(() => { const r = document.querySelector('dialog.d24bgs-dialog').getBoundingClientRect(); return [r.width, r.height]; })()")
    check('mobile: okno na cały ekran', box[0] >= 389 and box[1] >= 843, str(box))
    check('mobile: bez poziomego przewijania', page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1 && document.querySelector('.d24bgs').scrollWidth <= document.querySelector('.d24bgs').clientWidth + 1"))
    page.screenshot(path=str(shot / 'bgs_mobile.png'))
    page.evaluate("document.querySelector('.d24bgs-main').scrollTop = 600"); page.wait_for_timeout(300)
    top = page.evaluate("[document.querySelector('.d24bgs-stage').getBoundingClientRect().top, document.querySelector('.d24bgs-main').getBoundingClientRect().top]")
    check('mobile: podgląd przyklejony u góry podczas przewijania', abs(top[0] - top[1]) < 3, str(top))
    vis = page.evaluate("(() => { const b = document.querySelector('.d24bgs [data-act=save]').getBoundingClientRect(); return b.bottom <= window.innerHeight + 1 && b.top >= 0; })()")
    check('mobile: przycisk „Użyj w zamówieniu” zawsze widoczny', vis)

    check('żadne pobieranie pliku nie zostało wywołane w prostym generatorze', not downloads, str(downloads))
    check('brak błędów w konsoli', not errors, '; '.join(errors[:4]))
    browser.close()

print('\nNIEUDANE:', fails if fails else 'brak')
raise SystemExit(1 if fails else 0)
