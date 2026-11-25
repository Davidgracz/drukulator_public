# Drukulator 0.26.20v

**Cennik: folia podłogowa, baner siatka mesh, menu A4.** Zmiany w `data/prices.json` (na bazie aktualnego pliku, który wgrałeś — razem z jego nowszymi cenami notesów) oraz drobne poprawki w wyszukiwarce.

---

## 1. Folie i banery
| Materiał | Ceny | Uwagi |
|---|---|---|
| **Folia podłogowa** (nowa) | do 3 m² — **140 zł/m²**, powyżej 3 do 10 m² — **130 zł/m²**, powyżej 10 m² — **120 zł/m²** | minimum zamówienia 70 zł (jak pozostałe folie), bez oczek |
| **Baner siatka mesh** (nowy) | **jak baner powlekany 510 g:** do 3 m² — 80, powyżej 3 do 9 m² — 70, powyżej 9 do 20 m² — 60, powyżej 20 m² — 50 zł/m² | minimum 70 zł, „✓ Oczka w standardzie”; rabaty za ilość działają tak samo (progi liczone od łącznej powierzchni wszystkich sztuk) |

- W liście materiałów: baner powlekany → **baner siatka mesh** → folie; **folia podłogowa** stoi przed folią z transferem.
- Folia podłogowa traktowana jak folia: bez minimalnego krótszego boku 30 cm (jak inne folie), max krótszy bok 160 cm, dłuższy do 10 m. Mesh jak baner: min. krótszy bok 30 cm, max 160 cm.
- Wyszukiwarka i asystent wyceny: „baner mesh 150x100 2 szt”, „mesh 100x100 3 szt”, „folia podłogowa 100x200 2 szt” otwierają kalkulator z właściwym materiałem. Asystent pytający „Jakiej folii potrzebujesz?” ma nową opcję „Podłogowa”. Dodane też słowa kluczowe (`data/search-terms.json` i lista w `app.js`).
- Tłumaczenia EN: „Mesh banner”, „Floor film”.

## 2. Restauracje, hotele — menu
- **„Menu A3 offset preprint 90 g” → „Menu offset preprint 90 g”**, dodany format **A4** (A3 bez zmian):

| | 500 szt. | 1000 szt. | 2500 szt. |
|---|---|---|---|
| A4 jednostronnie | 290 zł | 350 zł | 510 zł |
| A4 dwustronnie | 360 zł | 420 zł | 620 zł |
| (A3 jednostronnie) | 480 | 580 | 860 |
| (A3 dwustronnie) | 630 | 780 | 1090 |

- **„Menu A3 laminowane” → „Menu laminowane”**, tylko dwustronnie, dodany format **A4**: 10 szt. — 90 zł, 20 szt. — 160 zł, 30 szt. — 240 zł (A3: 170 / 320 / 450 zł bez zmian).
- Opisy wariantów: „Formaty A3 i A4, …”. Wyszukiwarka rozpoznaje też „menu a4”. Tłumaczenia EN: „Menu, 90 gsm offset preprint”, „Laminated menu”.
- **Uwaga:** zmieniły się nazwy produktów, więc stare pozycje „Menu A3 …” zapisane w czyimś koszyku lub w starym zapisanym linku zostaną w koszyku z dotychczasową nazwą i ceną (to tylko zapis tekstu), ale po ponownym wyborze w kalkulatorze są już nowe nazwy.

## 3. Poprawka w wyszukiwarce
- Funkcja upraszczająca tekst (`normalizeSearchText` w `app.js`) nie zamieniała „ł” na „l” (w odróżnieniu od wyszukiwarki i interpretera zamówień), więc „błysk”, „podłogowa” itp. wpisane z polskimi znakami zamieniały się w „b ysk”/„pod ogowa” i nie pasowały do słów kluczowych (np. „folia błysk 100x100 2 szt” zamiast policzyć, dopytywało o rodzaj folii). Teraz „ł” → „l”.

## Założenia (do sprawdzenia)
- Minimum zamówienia dla folii podłogowej 70 zł (jak pozostałe folie) — w poleceniu go nie było.
- Mesh ma oczka w standardzie i te same limity rozmiaru co baner powlekany.

## Pliki i testy
- Zmienione: `data/prices.json`, `data/search-terms.json`, `js/app.js`, `js/i18n.js`, `index.html` (wersja), testy `restaurants_prices_0265_browser.py` i `catalog_pages_look_0257_browser.py` (nowe nazwy menu i format A4) oraz `banner_generator_02619_browser.py` (sprawdza wzór numeru wersji zamiast konkretnego numeru).
- Nowy test: `tests/prices_folie_menu_02620_browser.py` (ceny i progi, mesh = baner, minimum, koszyk, wyszukiwarka, menu A3/A4, EN; komputer i telefon).
