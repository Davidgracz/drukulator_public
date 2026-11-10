"""0.25.5: analityka v2 — krok „cena po konfiguracji”, wartość koszyków, błędy wysyłki; aktualizacja bazy 2.0 → 2.1 (na atrapie WordPressa z SQLite).
Dodatkowo: analytics-track.php przyjmuje nowe zdarzenia i nie zapisuje ich w starych licznikach v1."""
import re,shutil,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if not shutil.which('php'):
    print('UWAGA: brak php — pominięto test analityki'); raise SystemExit(0)
for mode in ('fresh','upgrade'):
    r=subprocess.run(['php',str(root/'tests/analytics_v2_0255_harness.php'),str(root),mode],capture_output=True,text=True)
    assert r.returncode==0,(mode,r.stdout,r.stderr)
    assert f'OK {mode}' in r.stdout,r.stdout
track=(root/'analytics-track.php').read_text()
m=re.search(r"\$allowedEvents = array\(([^)]*)\)",track); events=re.findall(r"'([a-z_]+)'",m.group(1))
assert {'price_seen','order_error','quote_view','checkout_view','add_to_cart'}<=set(events),events
# nowe zdarzenia kończą się przed licznikami v1
stage_only=re.search(r"in_array\(\$event, array\(([^)]*)\), true\)\) \{\s*drukulator_analytics_response\(true",track)
assert stage_only and {'price_seen','order_error'}<=set(re.findall(r"'([a-z_]+)'",stage_only.group(1))),stage_only
lint=subprocess.run(['php','-l',str(root/'analytics-track.php')],capture_output=True,text=True); assert lint.returncode==0,lint.stdout+lint.stderr
print('PASS analytics_v2_0255',flush=True)
