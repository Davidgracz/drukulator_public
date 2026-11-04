# Drukulator 0.24.5v

Wydanie na bazie **0.24.4v** (zawiera wszystkie jej zmiany).

**Nie zmieniono cen w `data/prices.json` ani plików PHP.** Cena **575 zł za 500 szt. A3 offset** już była w cenniku – poprawka dotyczy jej wyświetlania (punkt 1).

---

## 1. Plakaty offset – cena 500 szt. A3 pod formatem
Po wybraniu 500 szt. kafelki formatów traciły wszystkie ceny (tylko A3 ma nakład 500 szt., więc nie było z czym porównywać). Teraz kafelek **A3 pokazuje „575,00 zł łącznie”**. Pozostałe formaty (A2, A1, B2, B1) nie mają takiego nakładu w cenniku, więc przy 500 szt. nie mają kwoty – po kliknięciu przełączają się na nakład, który mają.
- Naprawiona przy okazji **zdublowana linia „za sztukę”** na kafelkach ilości po kliknięciu (po każdej zmianie dopisywała się kolejna).

## 2. Plakaty – druk wielkoformatowy: wybór ilości jak w cyfrowym i offsetowym
- Kafelki ilości: **1, 3, 6, 10, 20** (wcześniej 1, 5, 10, 20, 30).
- Na kafelku jest sama ilość i **cena łączna** (np. „6 → 132,00 zł”); zniknęły napisy „N szt. · XX,XX zł/szt.” i linia „za sztukę”.
- Cena za sztukę nadal widać w pasku ceny pod formularzem i w tabeli „Cennik”.
- Ilości 1–30 nadal są dostępne dla asystenta i wyszukiwarki zamówień z tekstu.

## 3. Własna ilość: maksymalnie 30 szt. (było 100)
- Pole „Wpisz liczbę plakatów”: `max=30`, komunikat „Wpisz pełną liczbę sztuk od 1 do 30.”, tekst informacyjny „własny nakład od 1 do 30 sztuk”.
- Kalkulator (`js/calculators.js`) też odrzuca ponad 30 szt. plakatów wielkoformatowych („Maksymalny nakład … to 30 sztuk.”) – wcześniej limit wynosił 100.
- Przycisk **„+ Własna ilość” jest tylko w druku wielkoformatowym**; w cyfrowym i offsetowym znika (po przełączeniu technologii panel własnej ilości też się zamyka).

## 4. Plakietka 24h przy „Druk wielkoformatowy”
Na kafelku wyboru technologii druku: „Druk wielkoformatowy **24h**” (plakietka jak na stronie głównej). Wersja angielska kafelka jest teraz w pełni przetłumaczona („Large-format printing 24h”, „Formats A2–B0 · from 1 pc”, „+ Custom quantity”).

## 5. Naklejki, etykiety i magnesy
Etykieta pola „Liczba naklejek” → **„Ilość sztuk”**.

---

## Pliki zmienione względem 0.24.4v
`index.html` (wersja zasobów `?v=0.24.5`), `js/app.js` (VERSION 0.24.5v), `js/calculators.js` (tylko limit ilości plakatów wielkoformatowych), `js/intelligent-configurator.js`, `js/i18n.js`, `assets/order-experience-239.css`, testy: `tests/posters_stickers_0245_browser.py` (nowy), `tests/posters_02311_browser.test.py`, `tests/posters_02312_custom_qty_browser.test.py`, `tests/forms_02317_browser.py`, `tests/checkout_limits_02310.test.cjs`, `tests/new_catalog_02313.test.cjs`.

## Testy
Nowy test `tests/posters_stickers_0245_browser.py` przechodzi; zaktualizowane testy plakatów i limitów (nowe ilości, max 30) przechodzą. Reszta jak w 0.24.4v (te same 5 testów przeglądarkowych nie przechodzi także na działającej 0.23.27: `browser_smoke_mocked`, `compact-choices-browser`, `configurator-browser`, `configurator-regression`, `malfini_preview_browser`). Przegląd wszystkich stron: bez błędów.

## Wgrywanie
Po wgraniu odśwież stronę klawiszami Ctrl+F5 – przeglądarka potrafi przez kilka godzin trzymać starą kopię `index.html`.
