# Drukulator 0.24.9v

Wydanie na bazie **0.24.8v** (zawiera wszystkie jej zmiany).

**Nie zmieniono cen, progów rabatowych, logiki liczenia ani plików PHP.**

## Kafelki „Ilość sztuk” bez cen
Na kafelkach ilości (wizytówki, ulotki, plakaty cyfrowe / offsetowe / wielkoformatowe, druk cyfrowy, banery, naklejki, roll-upy) zniknęły **wszystkie kwoty**: i cena łączna (np. „305,00 zł”), i „X zł za sztukę” (np. „0,50 zł za sztukę”). Zostaje sama liczba (np. 100 / 250 / 500).

Kwoty są tylko przy **formatach i innych opcjach** (papier, wykończenie, zadruk, materiał, rozmiar itd.) – i zależą od wybranej ilości. Np. plakat offsetowy A3 przy 500 szt.: pod formatem A3 jest „575,00 zł”.

Bez zmian (nie są kafelkami ilości): pasek ceny pod formularzem („575,00 zł • 1,15 zł za sztukę”), karty „Porównaj warianty” (cena łączna i za sztukę), szczegóły wyceny i koszyk.

## Pliki zmienione względem 0.24.8v
`index.html` (wersja zasobów `?v=0.24.9`), `js/app.js` (VERSION 0.24.9v; usunięty niepotrzebny znacznik dla ilości plakatów), `js/intelligent-configurator.js`, `tests/option_prices_0248_browser.py`, `tests/posters_stickers_0245_browser.py`.

## Testy
Zaktualizowane testy (`option_prices_0248_browser.py` – sprawdza na wszystkich 7 stronach z ilościami, że kafelki ilości nie mają cen, a inne kafelki mają; `posters_stickers_0245_browser.py`) przechodzą. Pozostałe testy – jak w 0.24.8v (te same 5 testów przeglądarkowych nie przechodzi także na działającej 0.23.27). Przegląd wszystkich stron: bez błędów.

## Wgrywanie
Po wgraniu odśwież stronę klawiszami Ctrl+F5 – przeglądarka potrafi przez kilka godzin trzymać starą kopię `index.html`.
