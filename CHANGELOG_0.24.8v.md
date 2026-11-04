# Drukulator 0.24.8v

Wydanie na bazie **0.24.7v** (zawiera wszystkie jej zmiany).

**Nie zmieniono cen, progów rabatowych, logiki liczenia ani plików PHP** – zmienił się tylko sposób pokazywania kwot: wszędzie faktyczne ceny zamiast różnic „+” i „−”.

## Faktyczne ceny zamiast „+ / −”
- **Kafelki opcji** (formaty, papier, wykończenie, zadruk, produkty, rozmiary itd.): każda opcja pokazuje swoją **cenę całego zamówienia** po wybraniu tej opcji, np. format A2 „595,00 zł”, A1 „1075,00 zł” (wcześniej „+480,00 zł”, „bez dopłaty”, „−18,00 zł”). Zniknęło „… łącznie” z wybranego kafelka – wszystkie kafelki wyglądają tak samo.
- Podpowiedź pod kafelkami: „**Kwoty to cena całego zamówienia z daną opcją.**” (wcześniej „Kwoty pokazują zmianę ceny…”).
- **Karty „Porównaj warianty”**: zniknęła linia „+30,00 zł łącznie” / „−… łącznie” / „Taka sama cena”. Karta pokazuje cenę łączną i cenę za sztukę (tak jak dotąd).
- **Stara karta porównania w konfiguratorze**: zniknęły „… taniej” i „+…”; wybrany wariant dalej jest oznaczony.
- **Podpowiedzi po wycenie**:
  - „Sprawdź większy nakład”: zamiast „+100 szt. za +60 zł” jest „**200 szt. za 150,00 zł zamiast 100 szt. za 90,00 zł**”;
  - „Warto rozważyć”: zamiast „za +40 zł względem obecnego zamówienia” jest „**… : 60,00 zł za całe zamówienie (obecnie 50,00 zł)**”.
- Opcja, która nie ma ceny dla wybranej ilości (np. offset A2 przy 500 szt. – taki nakład nie istnieje w cenniku), nadal nie ma kwoty.

Bez zmian (to nie są różnice cen opcji): kwota rabatu ilościowego w szczegółach wyceny („Rabat ilościowy 10% (−45,00 zł)”), przyciski „−/+” przy liczbach, napis „+ Własna ilość”.

## Pliki zmienione względem 0.24.7v
`index.html` (wersja zasobów `?v=0.24.8`), `js/app.js` (VERSION 0.24.8v; teksty podpowiedzi po wycenie), `js/intelligent-configurator.js`, `js/variant-comparison.js`, `tests/option_prices_0248_browser.py` (nowy), `tests/posters_stickers_0245_browser.py`.

## Testy
Nowy test `tests/option_prices_0248_browser.py` (plakaty offset i wielkoformatowe, wizytówki, karty porównania, naklejki, podpowiedzi po wycenie; sprawdza też, że na stronach nie ma wzorców „+/− kwota”) przechodzi. Pozostałe testy – wyniki jak w 0.24.7v (te same 5 testów przeglądarkowych nie przechodzi także na działającej 0.23.27). Przegląd wszystkich stron: bez błędów.

## Wgrywanie
Po wgraniu odśwież stronę klawiszami Ctrl+F5 – przeglądarka potrafi przez kilka godzin trzymać starą kopię `index.html`.
