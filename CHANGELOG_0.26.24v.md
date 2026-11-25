# Drukulator 0.26.24v

## Generator wizytówek (strona „Wizytówki 24h”)

Pod formularzem wizytówek (nad podglądem 3D) pojawił się panel z miniaturą i przyciskiem **Zaprojektuj wizytówkę**. Generator działa na tej samej zasadzie co generator
banerów: okno edytora, podgląd w skali, ocena jakości i jedna akcja — **„Użyj w zamówieniu”** (bez pobierania plików). Projekt trafia do zamówienia jako PDF
tylko wtedy, gdy klient go dołączy (przycisk w oknie albo pole „Dołącz projekt do zamówienia” w panelu).

**Okno edytora**
- u góry: **format** (90 × 50 / 85 × 55 mm), **poziomo / pionowo**, **zadruk** jednostronny / dwustronny — format i zadruk zmieniają formularz na stronie, a z nim cenę
  (i odwrotnie: zmiana w formularzu przestawia okno); przy druku offsetowym dostępny jest tylko zadruk dwustronny;
- po lewej podgląd **awersu** i (przy zadruku dwustronnym) **rewersu** z linią cięcia, spadem i marginesem bezpiecznym (da się wyłączyć);
- **6 układów**: pasek z boku, kolorowy nagłówek, podział, wyśrodkowana, minimalistyczna, narożnik — każdy jako miniatura z aktualnymi danymi;
- **kolory**: akcent (12 kolorów jak w generatorze banerów), tło (białe / kolorowe / ciemne), krój pisma (nowoczesna, elegancka, wąska, zaokrąglona);
  akcent zlewający się z tłem sam zamienia się na kolor tekstu;
- **dane**: imię i nazwisko, stanowisko, firma, telefon, e-mail, strona www, adres; puste pola nie są rysowane; dwa suwaki rozmiaru
  (nazwisko / pozostałe teksty); tekst zawsze mieści się w polu (długie dane zmniejszają się, a nie wychodzą poza wizytówkę);
- **logo**: PNG, JPG, WebP albo SVG do 8 MB (zapamiętywane w przeglądarce klienta); układ sam dobiera miejsce (poziomo w rogu, pionowo nad nazwiskiem);
- **rewers** (tylko zadruk dwustronny): tło kolorowe albo białe, hasło, **kod QR** (domyślnie adres ze strony www albo własny adres; wbudowany generator QR, nic nie
  wychodzi z przeglądarki);
- **ocena**: najmniejszy tekst w pt (zalecane ≥ 6 pt, poniżej 5 pt „Użyj w zamówieniu” jest zablokowane), rozdzielczość logo w dpi, wielkość „piksela” kodu QR;
- „Użyj w zamówieniu” nie przepuści przykładowych tekstów (np. „Jan Kowalski”, „Twoja Firma Sp. z o.o.”) ani projektu bez imienia i nazwy firmy;
- **Zobacz w 3D** przekazuje awers i rewers do istniejącego podglądu 3D wizytówki (spad 1,5 mm rozpoznawany automatycznie).

**Plik do druku:** PDF z 1 stroną (jednostronne) albo 2 stronami (awers + rewers); `MediaBox` = format + **spad 1,5 mm z każdej strony**, `TrimBox` = format netto,
obrazy 600 dpi (np. 90 × 50 mm → 93 × 53 mm, 2197 × 1252 px); nazwa np. `wizytowka-90x50mm-dwustronna-anna-kowalska.pdf`. Plik trafia do koszyka razem z wizytówkami
(`quote.files`), tak jak projekt banera.

**Zmiany techniczne**
- nowe: `js/card-generator.js`, `assets/card-generator.css` (silnik rysowania w mm; krój pisma z silnika banerów, `Druk24QR`, `Druk24PDF`);
- `js/banner-gen-pdf.js`: nowa funkcja `Druk24PDF.fromJpegPages` (wiele stron, spad, TrimBox); `fromJpeg` bez zmian;
- `js/app.js`: wizytówki dołączają `files` z generatora do wyceny;
- `js/card-3d-preview.js`: podgląd 3D układa się zaraz pod panelem generatora (zamiast bezpośrednio pod formularzem);
- `index.html`: nowe pliki + numer wersji.

**Testy:** nowy `tests/card_generator_02624_browser.py` (panel tylko na wizytówkach, format / zadruk / orientacja ↔ formularz, układy i kolory, blokady, PDF — liczba stron,
MediaBox, TrimBox, dpi, odczyt kodu QR, logo PNG / SVG / złe pliki, koszyk, podgląd 3D, EN, telefon). Stary `banner_generator_02614_browser.py` ma poprawiony selektor
„brak panelu banerów na wizytówkach” (4 jego inne sprawdzenia dotyczące PDF nie przechodziły już wcześniej — to nieaktualny test wyłączonego pełnego generatora).

Paczka zawiera też zmiany z 0.26.22v–0.26.23v, jeśli nie były jeszcze wgrane.
