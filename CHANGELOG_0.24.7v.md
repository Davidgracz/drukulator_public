# Drukulator 0.24.7v

Wydanie na bazie **0.24.6v** (zawiera wszystkie jej zmiany).

**Nie zmieniono cen, logiki liczenia ani plików PHP.** Zmiana dotyczy tylko podglądu odzieży (strona „Koszulki i odzież”).

## Usunięte przyciski kroju
Z podglądu produktu zniknął cały blok **„Krój”** (przyciski Męska / Damska / Dziecięca, uwaga o zdjęciach poglądowych kroju oraz stała etykieta „Unisex” przy modelach z jednym krojem). Informacja o krojach została jako tekst pod nazwą modelu:
- „Koszulka bawełniana · 160 g · unisex”
- „Dostępne kroje: męski, damski i dziecięcy”

Skutki dla zamówienia:
- Krój nie jest już wybierany, więc **nie trafia do zamówienia** – znika wiersz „Krój (preferencja)” i fragment „krój: …” w opisie pozycji. Wcześniej dla modeli z wieloma krojami zapisywał się domyślny „męski”, teraz tego nie ma. Klient może wpisać krój w uwagach do zamówienia.
- Modele z jedynym krojem (Heavy New, Pixel, Essential, kamizelka Malfini Rimeck) nadal zapisują w zamówieniu „unisex”.
- Tekst pod podglądem: „Wybrany kolor zapisujemy jako preferencję…” (bez „i krój”).

## Pliki zmienione względem 0.24.6v
`index.html` (wersja zasobów `?v=0.24.7`), `js/app.js` (VERSION 0.24.7v), `js/malfini-preview.js`, `tests/malfini_preview_unit.py`, `tests/apparel_nocut_0247_browser.py` (nowy).
Style `.d24-malfini-cut*` w `assets/malfini-preview.css` zostają (nieużywane).

## Testy
Nowy test `tests/apparel_nocut_0247_browser.py` (1440 px i 375 px) oraz zaktualizowany `tests/malfini_preview_unit.py` przechodzą; pozostałe testy – wyniki jak w 0.24.6v (te same 5 testów przeglądarkowych nie przechodzi także na działającej 0.23.27). Przegląd wszystkich stron: bez błędów.

## Wgrywanie
Po wgraniu odśwież stronę klawiszami Ctrl+F5 – przeglądarka potrafi przez kilka godzin trzymać starą kopię `index.html`.
