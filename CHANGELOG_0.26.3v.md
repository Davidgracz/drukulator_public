# Drukulator 0.26.3v

**Druk cyfrowy 24h: foliowanie i bindowanie w rozwijanych sekcjach, foliowanie jako jedno pole (Brak / Satyna / Błysk / Mat) tylko dla kredy od 250 g.** Poprawki do 0.26.2v. **Pliki PHP i baza danych bez zmian** — wystarczy podmienić pliki front-endu.

---

## 1. Foliowanie i bindowanie są schowane — klient musi je rozwinąć
Pod „Liczbą stron” i „Ilością kompletów” są dwie zwinięte sekcje: **Foliowanie** oraz **Bindowanie i oprawy**. Dopiero po kliknięciu (lub Enter / spacji na klawiaturze) pokazują kafelki. W nagłówku zwiniętej sekcji po prawej stronie widać aktualny wybór i jego cenę, np. „Satyna · +80,00 zł” albo „Bindowanie – spirala plastikowa, 12,5 mm · +13,00 zł” (a „Brak”, gdy nic nie wybrano), więc klient nie zapomni, że coś dobrał. Po rozwinięciu to podsumowanie znika, bo wybór widać na kafelkach. Sekcje są zwinięte przy każdym otwarciu usługi „Druk cyfrowy 24h”.

W środku sekcji układ jest stały (kafelki się nie przesuwają po zmianie wyboru): *Foliowanie* — jedno pole z czterema kafelkami w jednym rzędzie (na telefonie 2 × 2), *Bindowanie i oprawy* — „Rodzaj oprawy” obok „Rozmiaru oprawy / spirali” (ceny na kafelkach jak w 0.26.2v).

## 2. Foliowanie: tylko kreda od 250 g, jedno pole, bez podziału na jedno- i dwustronne
- Wybór: **Brak / Satyna – 2,00 zł / Błysk – 1,50 zł / Mat – 1,50 zł** za arkusz A4 (arkusz A3 = 2 × A4). Jedna cena niezależnie od tego, czy wydruk jest jedno- czy dwustronny; liczona od liczby fizycznych arkuszy (np. 40 stron dwustronnie = 20 arkuszy, czyli satyna 40 zł).
- **Dostępne tylko dla papieru kredowego 250 g, 300 g i 350 g.** Przy 80 g oraz kredzie 130 g i 170 g pole jest przygaszone (z komunikatem „Foliowanie jest dostępne tylko dla papieru kredowego 250 g i grubszego.”), a w nagłówku sekcji widać „Tylko kreda od 250 g”. Zmiana papieru na cieńszy **zeruje foliowanie** (wraca „Brak”); kwoty na kafelkach papierów liczone są już bez folii. Kalkulator odrzuca też taką kombinację w obliczeniach (komunikat błędu), gdyby ktoś ją wymusił.
- Kafelki foliowania pokazują cenę całego zamówienia po wyborze danej opcji (jak format, zadruk i papier). Pole „Rodzaj folii” z 0.26.2v (osobny wybór jedno-/dwustronne + satyna/błysk) zostało zastąpione jednym polem.
- Opis w koszyku: „Druk cyfrowy 24h, Kolorowy, 40 str., foliowanie satyna, …”; w wycenie „Foliowanie: Satyna” i „Foliowanie – cena”.

## 3. Cennik
`data/prices.json` → `druk_cyfrowy_i_ksero.foliowanie` ma teraz płaską postać `{ "Satyna": 2, "Błysk": 1.5, "Mat": 1.5 }` i można ją zmieniać w edytorze cen (sekcja „Foliowanie wydruków”, nowe rodzaje folii też da się dopisać w pliku). Cenniki zapisane wcześniej na serwerze lub w przeglądarce w układzie z 0.26.1v/0.26.2v (Jednostronne / Dwustronne × Satyna / Błysk) są przy wczytaniu **automatycznie zastępowane nowym cennikiem domyślnym** — starych cen jedno- i dwustronnych nie da się przenieść na jedną cenę. Własne ceny w nowym układzie nie są nadpisywane, brakujące pozycje są uzupełniane domyślnymi. Próg „od 250 g” jest stałą w `js/calculators.js` (`DIGITAL_FOIL_MIN_GRAMS`).

## 4. Poprawka stałego układu
Komunikat pod foliowaniem zajmuje miejsce także wtedy, gdy jest niewidoczny — dzięki temu przejście między kredą 250 g a cieńszym papierem nie przesuwa kafelków oprawy pod spodem (test pokazał przesunięcie o ok. 23 px bez tej poprawki).

## Pliki
- **Zmienione:** `js/app.js` (0.26.3v: sekcje rozwijane, jedno pole foliowania, migracja cennika), `js/calculators.js` (`calculateDigitalPrint` z `foilType` Satyna / Błysk / Mat tylko dla kredy ≥ 250 g, nowe `isDigitalFoilPaper`, `getDigitalFoilTypes`), `js/intelligent-configurator.js` (ceny na kafelkach nowego pola), `js/i18n.js`, `assets/ux-clarity.css`, `index.html` (`?v=0.26.3`), `data/prices.json`.
- **Testy:** nowy `digital_layout_0263_browser.py` (zastępuje `digital_layout_0262_browser.py`: zwinięte sekcje, rozwijanie myszą i klawiaturą, stałe pozycje kafelków na komputerze i telefonie, kreda od 250 g, ceny na kafelkach, podsumowania w nagłówkach, „większy nakład” dla kompletów); zaktualizowane `digital_pages_0261.test.cjs`, `digital_sets_0262.test.cjs`, `digital_pages_0261_browser.py` (m.in. migracja starego układu cennika, EN), `merge_0250_browser.py`.

## Wgrywanie
Wgraj paczkę (PHP bez zmian). Jeśli na serwerze był edytowany `data/prices.json` i nie chcesz go nadpisywać, **zostaw swój plik** — kalkulator sam zamieni stary układ foliowania na nowy (Satyna 2 zł, Błysk 1,5 zł, Mat 1,5 zł); po tym ceny można zmienić w edytorze cen. Odśwież stronę klawiszami Ctrl+F5.

## Przyjęte założenia (do potwierdzenia)
1. **Dwie osobne sekcje rozwijane** (Foliowanie i Bindowanie i oprawy), każda rozwijana osobno.
2. **Cena foliowania za arkusz fizyczny**, A3 = 2 × A4, bez względu na zadruk jedno- czy dwustronny (przy dwustronnym druku jeden arkusz = dwie strony = jedna cena folii).
3. „Mat” rozumiem jako rodzaj folii (Mat – 1,50 zł). Foliowanie nie jest dostępne na papierze standardowym 80 g ani na kredzie 130 g / 170 g.
4. Stare ceny jedno- i dwustronne z 0.26.1v/0.26.2v są zastępowane nowymi cenami domyślnymi.
