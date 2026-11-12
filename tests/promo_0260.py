"""0.26.0: kody promocyjne — biblioteka promo-lib.php i zapis zamówienia z kodem na atrapie WordPressa (SQLite zamiast MySQL),
plus kontrola statyczna endpointów (promo-validate.php, send-order.php, staff-api.php, staff-panel.php)."""
import re,shutil,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if not shutil.which('php'):
    print('UWAGA: brak php — pominięto test kodów promocyjnych'); raise SystemExit(0)
for name in ('promo-lib.php','promo-validate.php','send-order.php','staff-api.php','staff-panel.php','order-status-lib.php','staff-auth-lib.php'):
    lint=subprocess.run(['php','-l',str(root/name)],capture_output=True,text=True); assert lint.returncode==0,(name,lint.stdout+lint.stderr)
r=subprocess.run(['php',str(root/'tests/promo_0260_harness.php'),str(root)],capture_output=True,text=True)
assert r.returncode==0,(r.stdout,r.stderr)
assert 'OK promo' in r.stdout,r.stdout
send=(root/'send-order.php').read_text()
# serwer jest źródłem prawdy: kod sprawdzany od nowa, użycie rezerwowane przed zapisem i oddawane przy błędzie poczty
assert "d24_promo_evaluate($data['promoCode']" in send and 'd24_promo_reserve(' in send and 'd24_promo_release(' in send
assert send.index('d24_promo_reserve(')<send.index('drukulator_orders_store('),'rezerwacja kodu przed zapisem zlecenia'
assert "'promo_code'" in send and "'discount'" in send
assert send.index("$products_after_discount < 300.0")>send.index('d24_promo_evaluate('),'próg dostawy liczony po zniżce'
assert '$limit_total' in send and 'MAX_ORDER_TOTAL' in send or '5000' in send
# endpoint sprawdzający kod: tylko POST, ta sama strona, limit prób
val=(root/'promo-validate.php').read_text()
assert "!== 'POST'" in val and 'd24_promo_rate_check' in val and 'd24_promo_rate_penalty' in val and 'HTTP_ORIGIN' in val
# API panelu: zapis, włączanie i usuwanie wymagają uprawnienia promo_manage i tokenu CSRF (akcje POST są za sprawdzeniem CSRF)
api=(root/'staff-api.php').read_text()
assert api.index("d24_staff_verify_csrf")<api.index("'promo_save'"),'CSRF przed akcjami kodów'
block=api[api.index("in_array($action, array('promo_save'"):]; block=block[:block.index("if ($action === 'order_status')")]
assert "d24_staff_can('promo_manage')" in block
assert "promo_codes" in api[:api.index("if ($method !== 'POST')")] and "d24_staff_can('promo_manage')" in api[:api.index("if ($method !== 'POST')")]
auth=(root/'staff-auth-lib.php').read_text(); assert "'promo_manage'" in auth
print('PASS promo_0260',flush=True)
