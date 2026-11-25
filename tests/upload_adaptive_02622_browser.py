"""0.26.22: wysyłanie załączników — adaptacyjny rozmiar fragmentów, wspólny limit dla plików, ponawianie i wykrywanie zawieszonego połączenia.

Test uruchamia prawdziwą stronę (index.html + js/app.js) na lokalnym serwerze HTTP, który udaje upload-files.php / send-order.php
i potrafi: ograniczyć przepustowość łącza, odrzucać za duże lub zbyt wolno odbierane fragmenty (jak PHP z max_input_time / post_max_size
albo serwer pośredniczący), zrywać połączenie i „wieszać” odpowiedź. Każdy odebrany plik jest porównywany bajt w bajt z oryginałem.

Uruchomienie: python3 tests/upload_adaptive_02622_browser.py [katalog_z_witryną]   (domyślnie katalog nadrzędny testu)
"""
import hashlib, json, os, re, shutil, sys, tempfile, threading, time
from email.parser import BytesParser
from email.policy import default as email_policy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
MIME = {'.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
        '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2'}
MB = 1024 * 1024

cfg = {}
sessions = {}
log = []
orders = []
lock = threading.Lock()


def reset(**kw):
    with lock:
        cfg.clear()
        cfg.update(rate=0, announce=8 * MB, max_input_announce=0, stall_ms=0, enforce_input=0, hard_limit=0,
                   drop_chunks=0, stall_response=0, stall_response_seconds=4.0)
        cfg.update(kw)
        sessions.clear(); log.clear(); orders.clear()


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *a):
        pass

    def reply(self, status, body, ctype='application/json; charset=utf-8'):
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        try:
            self.send_response(status)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass

    def do_GET(self):
        path = self.path.split('?')[0].lstrip('/') or 'index.html'
        f = (ROOT / path).resolve()
        if ROOT in f.parents and f.is_file():
            return self.reply(200, f.read_bytes(), MIME.get(f.suffix, 'application/octet-stream'))
        self.reply(404, b'', 'text/plain')

    def read_body(self, length, throttle, stall_after=None):
        chunks, got, t0 = [], 0, time.monotonic()
        while got < length:
            n = min(16384, length - got)
            data = self.rfile.read(n)
            if not data:
                raise ConnectionResetError('client left')
            chunks.append(data); got += len(data)
            if throttle and cfg['rate']:
                wait = t0 + got / cfg['rate'] - time.monotonic()
                if wait > 0: time.sleep(wait)
            if stall_after is not None and got >= stall_after[0]:
                stall_after[1]()
                stall_after = None
        return b''.join(chunks), time.monotonic() - t0

    def do_POST(self):
        path = self.path.split('?')[0].lstrip('/')
        length = int(self.headers.get('Content-Length') or 0)
        try:
            if path == 'upload-files.php':
                return self.upload(length)
            if path == 'send-order.php':
                body, _ = self.read_body(length, False)
                payload = json.loads(body or b'{}')
                orders.append(payload)
                return self.reply(200, {'success': True, 'orderId': 'T-9', 'confirmationSent': True})
            body, _ = self.read_body(length, False)
            return self.reply(200, {'success': True})
        except (BrokenPipeError, ConnectionResetError, OSError):
            self.close_connection = True

    def upload(self, length):
        ctype = self.headers.get('Content-Type', '')
        if ctype.startswith('application/json'):
            body, _ = self.read_body(length, False)
            req = json.loads(body)
            if req.get('action') == 'start':
                token = os.urandom(24).hex()
                with lock:
                    sessions[token] = [{'size': int(f['size']), 'data': bytearray()} for f in req['files']]
                out = {'success': True, 'token': token, 'chunkSize': cfg['announce'], 'maxInputTime': cfg['max_input_announce']}
                if cfg['stall_ms']: out['stallMs'] = cfg['stall_ms']
                return self.reply(200, out)
            return self.reply(400, {'success': False, 'message': 'Nieprawidłowe dane przesyłania plików.'})
        # multipart: fragment pliku
        started = time.monotonic()
        with lock:
            drop = cfg['drop_chunks'] > 0
            if drop: cfg['drop_chunks'] -= 1
        if drop:
            self.read_body(length // 2, True)
            self.close_connection = True
            try: self.connection.shutdown(2)
            except OSError: pass
            return
        body, secs = self.read_body(length, True)
        msg = BytesParser(policy=email_policy).parsebytes(b'Content-Type: ' + ctype.encode() + b'\r\nMIME-Version: 1.0\r\n\r\n' + body)
        fields, blob = {}, b''
        for part in msg.iter_parts():
            name = part.get_param('name', header='content-disposition')
            if name == 'chunk': blob = part.get_payload(decode=True) or b''
            else: fields[name] = part.get_content()
        rec = {'index': int(fields.get('index', -1)), 'offset': int(fields.get('offset', -1)), 'size': len(blob), 'secs': round(secs, 2), 'status': 200}
        too_big = cfg['hard_limit'] and len(blob) > cfg['hard_limit']
        too_slow = cfg['enforce_input'] and secs > cfg['enforce_input']
        if too_big or too_slow:
            rec['status'] = 400; rec['why'] = 'size' if too_big else 'time'
            log.append(rec)
            return self.reply(400, {'success': False, 'message': 'Nieprawidłowe dane przesyłania plików.'})
        with lock:
            files = sessions.get(fields.get('token'))
            f = files[rec['index']] if files else None
            if f is None:
                rec['status'] = 422; log.append(rec)
                return self.reply(422, {'success': False, 'message': 'Sesja przesyłania nie istnieje.'})
            expected = len(f['data'])
            if rec['offset'] == expected:
                f['data'] += blob
            elif expected == rec['offset'] + len(blob) and bytes(f['data'][rec['offset']:expected]) == blob:
                rec['duplicate'] = True            # to samo co serwer produkcyjny: identyczny powtórzony fragment = sukces
            else:
                rec['status'] = 422; log.append(rec)
                return self.reply(422, {'success': False, 'message': 'Nieprawidłowa kolejność fragmentów pliku.'})
            received = len(f['data'])
            stall = cfg['stall_response'] > 0 and not rec.get('duplicate')
            if stall: cfg['stall_response'] -= 1
        log.append(rec)
        if stall:
            time.sleep(cfg['stall_response_seconds'])      # fragment zapisany, ale odpowiedź „wisi”
        self.reply(200, {'success': True, 'received': received, 'fileSize': f['size']})


def make_files(tmp, sizes):
    paths, digests = [], []
    for i, size in enumerate(sizes):
        p = Path(tmp) / f'plik_{i}_{size}.zip'
        data = os.urandom(size)
        p.write_bytes(data)
        paths.append(str(p)); digests.append(hashlib.sha256(data).hexdigest())
    return paths, digests


def run_order(browser, sizes, tmp, wait_progress_text=False, timeout=120):
    paths, digests = make_files(tmp, sizes)
    ctx = browser.new_context(viewport={'width': 1300, 'height': 900}, locale='pl-PL')
    ctx.add_init_script("localStorage.setItem('drukulator_cart', JSON.stringify([{id:1,title:'Laminowanie',description:'A4',price:100,details:[]}]));")
    page = ctx.new_page(); errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '/index.html', wait_until='domcontentloaded', timeout=20000)
    page.wait_for_selector('#orderFiles', state='attached', timeout=15000)
    page.locator('#orderName').fill('Jan Test'); page.locator('#orderEmail').fill('jan@example.com')
    if not page.locator('#orderPrivacy').is_checked(): page.locator('#orderPrivacy').check()
    page.locator('#orderFiles').set_input_files(paths)
    texts = set()
    t0 = time.monotonic()
    page.locator('#sendOrder').click()
    deadline = t0 + timeout
    while time.monotonic() < deadline:
        txt = page.locator('#orderSendStatus').text_content() or ''
        if wait_progress_text and 'Wysyłanie załączników' in txt: texts.add(re.sub(r'\s+', ' ', txt).strip())
        if 'T-9' in txt or 'nie' in txt.lower() and 'Nie zamykaj' not in txt and 'Przygotowanie' not in txt and 'Pliki przesłane' not in txt and 'Wysyłanie' not in txt:
            break
        time.sleep(0.15)
    elapsed = time.monotonic() - t0
    status = page.locator('#orderSendStatus').text_content() or ''
    ctx.close()
    return {'elapsed': elapsed, 'status': status, 'texts': texts, 'errors': errors, 'digests': digests, 'sizes': sizes}


def check_files(res):
    """Plik po pliku porównujemy to, co dotarło na serwer, z oryginałem."""
    assert len(orders) == 1 and orders[0].get('uploadToken'), orders
    files = sessions[orders[0]['uploadToken']]
    assert len(files) == len(res['digests']), (len(files), len(res['digests']))
    for f, digest, size in zip(files, res['digests'], res['sizes']):
        assert len(f['data']) == size and hashlib.sha256(bytes(f['data'])).hexdigest() == digest, 'plik uszkodzony lub niepełny'


def rejects(): return [r for r in log if r['status'] == 400]
def sizes_log(): return [r['size'] for r in log if r['status'] == 200]


server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
server.daemon_threads = True
BASE = f'http://127.0.0.1:{server.server_address[1]}'
threading.Thread(target=server.serve_forever, daemon=True).start()
tmp = tempfile.mkdtemp(prefix='upl02622_')

with sync_playwright() as p:
    exe = next((c for c in ('/usr/bin/chromium', '/usr/bin/google-chrome', '/usr/bin/chromium-browser') if os.path.exists(c)), None)
    browser = p.chromium.launch(headless=True, executable_path=exe, args=['--no-sandbox', '--disable-dev-shm-usage'])

    # 1) szybkie łącze: próbny fragment 1 MB, potem rośnie do największego dozwolonego (8 MB)
    reset()
    r = run_order(browser, [24 * MB], tmp)
    assert 'T-9' in r['status'], r['status']
    s = sizes_log()
    assert s[0] == 1 * MB, s
    assert max(s) == 8 * MB and max(s) <= 8 * MB, s
    assert s == sorted(s) or s[-1] < s[-2], s                      # rośnie, ostatni może być resztą
    assert len(s) <= 8, s
    assert not rejects() and not r['errors'], (rejects(), r['errors'])
    check_files(r)
    st = orders[0].get('uploadStats')                                  # statystyki trafiają do serwera (monitoring w panelu)
    assert st and st['chunks'] == len(s) and st['retries'] == 0 and st['rejected'] == 0 and st['maxChunkKb'] == 8192 and st['seconds'] >= 0, st
    print('PASS 1 szybkie łącze:', [round(x / MB, 2) for x in s], f"{r['elapsed']:.1f}s", flush=True)

    # 2) wolne łącze (600 KB/s) i limit serwera 3 s na fragment: ani jedno odrzucenie, fragmenty dobrane do łącza
    reset(rate=600 * 1024, max_input_announce=8, enforce_input=3.0)
    r = run_order(browser, [4 * MB], tmp, wait_progress_text=True)
    assert 'T-9' in r['status'], r['status']
    assert not rejects(), rejects()
    assert max(x['secs'] for x in log) < 3.0, log
    assert sizes_log()[0] == 1 * MB and max(sizes_log()) < 2 * MB + 1, sizes_log()
    check_files(r)
    ui = ' | '.join(sorted(r['texts']))
    assert re.search(r'\d+ (KB|MB)/s', ui), ui
    assert 'pozostało' in ui, ui                                      # pasek pokazuje pozostały czas
    print('PASS 2 wolne łącze:', [round(x / MB, 2) for x in sizes_log()], f"{r['elapsed']:.1f}s, odrzuceń: 0", flush=True)

    # 3) limit z ustawień PHP (upload_max_filesize) ogłoszony przez serwer: żaden fragment go nie przekracza
    reset(announce=512 * 1024)
    r = run_order(browser, [3 * MB], tmp)
    assert 'T-9' in r['status'] and not rejects() and max(sizes_log()) <= 512 * 1024, (r['status'], sizes_log())
    check_files(r)
    print('PASS 3 limit ogłoszony przez serwer: max', max(sizes_log()) // 1024, 'KB', flush=True)

    # 4) serwer ogłasza 8 MB, ale pośrednik odrzuca >700 KB: odrzuceń najwyżej po jednym na kolejkę, kolejne pliki uczą się z pierwszych
    reset(hard_limit=700 * 1024)
    r = run_order(browser, [2 * MB, 2 * MB, 2 * MB], tmp)
    assert 'T-9' in r['status'], r['status']
    assert 1 <= len(rejects()) <= 2, rejects()
    assert max(sizes_log()) <= 700 * 1024, sizes_log()
    check_files(r)
    print('PASS 4 limit pośrednika: odrzuceń', len(rejects()), '| max', max(sizes_log()) // 1024, 'KB', flush=True)

    # 5) zerwane połączenie w trakcie fragmentu: ten sam fragment idzie ponownie, plik jest kompletny
    reset(drop_chunks=1)
    r = run_order(browser, [3 * MB], tmp)
    assert 'T-9' in r['status'], r['status']
    check_files(r)
    print('PASS 5 zerwane połączenie: ponowienie OK', f"{r['elapsed']:.1f}s", flush=True)

    # 6) „wisząca” odpowiedź serwera: po stallMs klient przerywa i ponawia; serwer rozpoznaje duplikat fragmentu
    reset(stall_ms=1500, stall_response=1, stall_response_seconds=5.0)
    r = run_order(browser, [3 * MB], tmp)
    assert 'T-9' in r['status'], r['status']
    assert any(x.get('duplicate') for x in log), log
    assert r['elapsed'] < 20, r['elapsed']
    check_files(r)
    print('PASS 6 zawieszona odpowiedź: wykryta i ponowiona', f"{r['elapsed']:.1f}s", flush=True)

    browser.close()

shutil.rmtree(tmp, ignore_errors=True)
print('OK upload_adaptive_02622_browser')
