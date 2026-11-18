"""0.26.9: analityka — okres poprzedni, rozkład godzin i dni tygodnia, urządzenia i język sesji, wartość zapytań wg kategorii,
lejek sesji wg źródła/urządzenia/języka, hasła wyszukiwania; aktualizacja bazy 2.1 → 2.2 (atrapa WordPressa z SQLite)."""
import re,shutil,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if not shutil.which('php'):
    print('UWAGA: brak php — pominięto test analityki'); raise SystemExit(0)
for mode in ('fresh','upgrade'):
    r=subprocess.run(['php',str(root/'tests/analytics_v2_0269_harness.php'),str(root),mode],capture_output=True,text=True)
    assert r.returncode==0,(mode,r.stdout,r.stderr)
    assert f'OK {mode}' in r.stdout,r.stdout
for f in ('analytics-v2-lib.php','analytics-track.php','staff-api.php','staff-panel.php'):
    lint=subprocess.run(['php','-l',str(root/f)],capture_output=True,text=True); assert lint.returncode==0,f+lint.stdout+lint.stderr
print('PASS analytics_v2_0269',flush=True)
