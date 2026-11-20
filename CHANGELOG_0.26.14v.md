# Drukulator 0.26.14v

**Generator banerów: klient projektuje baner w przeglądarce (szablon → tekst → logo / kod QR → plik PDF / JPG / PNG), z podglądem w skali.** Zmiana jest dodatkowa — **ceny, formularz, wycena, koszyk i `send-order.php` bez zmian**. W `app.js` zmieniony jest numer wersji i jedna linia w wycenie banera (załącznik tylko za zgodą klienta, patrz pkt 3).

---

## 1. Panel na stronie „Folie i banery 24h”
Pod formularzem (nad „Porównaj warianty”) jest nowy panel **„Generator banera”** z miniaturą bieżącego projektu, przyciskiem **Otwórz generator** i przełącznikiem **„Dołącz projekt do zamówienia”** (domyślnie wyłączony).

## 2. Edytor (okno pełnoekranowe)
- **Wymiary** są zsynchronizowane z formularzem banera: zmiana w generatorze zmienia pola „Szerokość / Wysokość”, zmiana w formularzu zmienia generator. Przycisk ⇄ zamienia wymiary, lista popularnych rozmiarów (100×100, 200×100, 300×100, 300×150, 500×100, 100×200, 150×50, 1000×100).
- **Szablony (24)** w 7 kategoriach (promocje, otwarcia, usługi, gastronomia, nieruchomości, wydarzenia, rekrutacja). Miniatury pokazują baner w proporcjach klienta. Szablon zmienia styl, a teksty tylko za zgodą (pole „Wstaw też przykładowe teksty”) — własnych tekstów klienta nie nadpisuje bez pytania. Przycisk **Losowa inspiracja**.
- **12 układów** (wyśrodkowany, tekst z lewej / z prawej, pas z kontaktem, pas nagłówka, ukośny pas, ramka, wielki nagłówek, podział, pasy, minimalny, wstęga) i **18 palet kolorów** + własny kolor tekstu i akcentu. Układy automatycznie dopasowują się do proporcji: kwadrat, poziomy, pionowy oraz bardzo długi pas (np. 10 × 1 m, wtedy jedna linia: nagłówek | opis i kontakt | przycisk).
- **Tło:** kolor, gradient (kierunek) albo **własne zdjęcie** (przyciemnienie, powiększenie, położenie) oraz wzór (kropki, linie, siatka).
- **Teksty:** nagłówek (maks. 46 znaków, można łamać Enterem), opis (70), kontakt (70), przycisk (24). Podpowiedzi gotowych haseł dla 8 branż. 5 krojów pisma, suwaki rozmiaru, odstęp liter, wyrównanie, cień, obrys, wielkie litery. Tekst sam dopasowuje rozmiar do pola; polskie spójniki jednoliterowe nie zostają na końcu wiersza.
- **Dodatki:** logo (PNG / JPG / WebP / SVG, 6 pozycji, rozmiar, białe tło pod logo), **kod QR** (własny generator, korekcja błędów M, pozycja i rozmiar), **plakietka** (np. „-30%”, 3 kształty), ramka.
- **Podgląd w skali** z przerywaną ramką marginesu bezpiecznego (3 cm) i — dla materiału z oczkami w standardzie („Baner powlekany 510g”) — orientacyjnymi oczkami (co ok. 50 cm). Powiększenie 200% / 400% (przydatne przy długich banerach).
- **Kontrola projektu na żywo:** czytelność tekstu względem tła (także na zdjęciu), orientacyjna odległość, z jakiej czytelny jest nagłówek (ok. 1 cm wysokości liter na 1,2 m), rozmiar kodu QR w cm i odległość skanowania, niska rozdzielczość zdjęcia / logo, zbyt długi tekst, brak nagłówka oraz **limity materiału z kalkulatora** (krótszy bok maks. 160 cm / 135 cm dla folii z laminatem, min. 30 cm dla banerów, dłuższy bok do 10 m).
- **Cofnij / Ponów** (przyciski i Ctrl+Z / Ctrl+Y), **Wyczyść projekt** (z potwierdzeniem), zapis projektu do pliku `.json` i wczytanie go później. Ostatnie ustawienia (bez zdjęć i logo) pamięta przeglądarka.
- Tryb ciemny, wersja angielska interfejsu, telefon (podgląd przyklejony u góry podczas przewijania ustawień).

## 3. Eksport i zamówienie
- **Pobierz** jako **PDF**, **JPG** lub **PNG** w trzech jakościach (2500 / 4000 / 6000 px po dłuższym boku, z podaniem dpi). Proporcje pliku = proporcje banera. Na telefonach z limitem pamięci rozmiar jest automatycznie ograniczany.
- **PDF** ma stronę równą fizycznemu rozmiarowi banera (obraz JPEG, bez warstw tekstowych). Dla banerów dłuższych niż ok. 5 m plik jest w skali 1:k (ustawiony `/UserUnit`, żeby Acrobat otworzył stronę) — wtedy wymiar w pliku to rozmiar ÷ k.
- **„Użyj w zamówieniu”** (lub przełącznik pod formularzem) zapisuje projekt jako PDF i **dołącza go do wyceny** — po „Oblicz cenę” → „Dodaj do koszyka” plik trafia do istniejącej listy załączników zamówienia (te same limity: do 5 plików, 50 MB). Po zmianie wymiarów plik jest automatycznie przebudowywany.
- **Bez zgody klienta nic nie jest dołączane ani wysyłane.** Projekt powstaje lokalnie w przeglądarce.

## 4. Pliki
Nowe: `js/banner-gen-qr.js` (enkoder QR), `js/banner-gen-pdf.js` (zapis PDF), `js/banner-gen-engine.js` (rysowanie, układy, palety, szablony), `js/banner-generator.js` (edytor i panel), `assets/banner-generator.css`, `tests/banner_generator_02614_browser.py`.
Zmienione: `index.html` (nowe pliki, `?v=0.26.14`, etykieta wersji), `js/app.js` (wersja + `files: window.Druk24BannerGen?.getAttachFiles?.() || []` w wycenie banera).

## Założenia i ograniczenia
- **Bez bibliotek i bez sieci** — kod QR i PDF zapisuje własny kod; kod QR zweryfikowano dekoderem OpenCV (wersje 1–12, w tym na bannerach 10 × 1 m i 60 × 300 cm), ale **warto raz przetestować własny kod telefonem** przed publikacją.
- **PDF jest rastrowy** (JPEG w pełnym rozmiarze) — dobry do druku wielkoformatowego, ale tekstu nie da się w nim edytować. Dla zlecenia, które wymaga wektora, klient nadal może wgrać własny plik w koszyku.
- **Czcionki to czcionki systemowe** klienta (+ Montserrat, jeśli strona go załadowała) — podgląd jest taki sam jak eksport na tym samym komputerze, ale na innym urządzeniu krój może się nieco różnić.
- Biblioteka to **24 szablony** i 12 układów × 18 palet (dowolnie łączone). Kolejne szablony dopisuje się w tablicy `TEMPLATES` w `js/banner-gen-engine.js`.
- „Podpowiedzi tekstów” to uniwersalne, gotowe hasła (nie sztuczna inteligencja) — klient powinien sam sprawdzić pisownię, ceny, daty i dane kontaktowe.
- Oczka w podglądzie są orientacyjne (rozstaw ok. 50 cm); o ich rozmieszczeniu nadal decyduje drukarnia.
- Testowano w Chrome (komputer, widok telefonu, tryb ciemny, EN). Nie testowano na Safari, Firefoxie ani na fizycznym telefonie.
