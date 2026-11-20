"""0.26.12: mail z potwierdzeniem dla klienta zawiera ramkę „Przy następnym zamówieniu użyj kodu DRUK10, aby otrzymać 10% rabatu”;
mail do drukarni jej nie zawiera; stałą w send-order.php można wyłączyć; zamówienie z pozycją bez typu produktu (stary link) przechodzi.
Uruchamia prawdziwy send-order.php na atrapie WordPressa (bez bazy i poczty)."""
import json,re,shutil,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if not shutil.which('php'):
    print('UWAGA: brak php — pominięto test maila'); raise SystemExit(0)
def run(scenario):
    r=subprocess.run(['php',str(root/'tests/order_mail_02612_harness.php'),str(root),scenario],capture_output=True,text=True)
    assert r.returncode==0,(scenario,r.stdout,r.stderr)
    data=json.loads(r.stdout); assert data['response'] and data['response'].get('success') is True,(scenario,data)
    assert data['response']['confirmationSent'] is True,data['response']
    mails={m['category']:m for m in data['mails']}
    assert set(mails)=={'office_order','customer_confirmation'},list(mails)
    return data['response'],mails
def plain(html): return re.sub(r'\s+([.,;:!?])',r'\1',re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',html)))
# --- 1) domyślnie: ramka z kodem w mailu dla klienta
resp,mails=run('plain')
cust=mails['customer_confirmation']; html=cust['message']
assert cust['to']=='jan@example.com' and cust['subject'].startswith('Potwierdzenie otrzymania zamówienia D24-') and cust['subject'].endswith('– Druk24'),cust['subject']
text=plain(html)
assert 'Przy następnym zamówieniu użyj kodu DRUK10 aby otrzymać 10% rabatu.' in text,text[-600:]
assert 'Wpisz kod w koszyku, w polu „Kod rabatowy”.' in text
# ramka jest po sumie i przed podpisem; reszta maila bez zmian
i_total=html.index('RAZEM Z DOSTAWĄ'); i_box=html.index('Przy następnym zamówieniu'); i_sign=html.index('Zespół Druk24')
assert i_total<i_box<i_sign,(i_total,i_box,i_sign)
for needle in ('Dziękujemy za zainteresowanie ofertą Druk24','ZAMÓWIENIE OCZEKUJE NA POTWIERDZENIE DRUKARNI','Podsumowanie zamówienia','1. Plakaty 24h','2. Plansza pianka 5 mm','140,00 zł'):
    assert needle in html or needle in text,needle
assert html.count('DRUK10')==1
assert html.startswith('<!doctype html>') and html.rstrip().endswith('</html>') and html.count('<div')==html.count('</div>'),'HTML maila jest niepoprawny'
# --- 2) mail do drukarni (tekstowy) bez kodu
office=mails['office_order']
assert 'DRUK10' not in office['message'] and 'następnym zamówieniu' not in office['message'] and office['to']=='biuro@druk24.szczecin.pl'
assert 'stara pozycja z linku' in office['message']     # pozycja bez typu produktu przeszła walidację
# --- 3) zamówienie z użytym kodem rabatowym: ramka na następne zamówienie nadal jest, razem z informacją o użytym kodzie
resp,mails=run('promo'); html=mails['customer_confirmation']['message']; text=plain(html)
assert 'Kod rabatowy ABC5' in text and 'Przy następnym zamówieniu użyj kodu DRUK10' in text,text[-700:]
assert html.index('Kod rabatowy')<html.index('Przy następnym zamówieniu')
# --- 4) pusta stała wyłącza ramkę
resp,mails=run('disabled'); html=mails['customer_confirmation']['message']
assert 'DRUK10' not in html and 'Przy następnym zamówieniu' not in html and 'Zespół Druk24' in html
lint=subprocess.run(['php','-l',str(root/'send-order.php')],capture_output=True,text=True); assert lint.returncode==0,lint.stdout+lint.stderr
print('PASS order_mail_02612',flush=True)
