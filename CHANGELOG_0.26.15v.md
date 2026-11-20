# Drukulator 0.26.15v

**Generator banerów: usunięty gradient i wzór tła + nowy PROSTY generator (kolor tła i treść).** Ceny, formularz, wycena, koszyk i `send-order.php` bez zmian. W `app.js` zmieniony jest numer wersji i jedna linia w wycenie banera (załącznik z jednego z dwóch generatorów, patrz pkt 3).

---

## 1. Pełny generator: bez gradientu i wzoru tła
- Tło ma teraz tylko dwa tryby: **Kolor** (jednolity, z palety albo własny „Kolor tła”) i **Zdjęcie**. Zniknęły: przełącznik „Gradient”, „Kolor 2”, „Kierunek” i lista „Wzór tła” (kropki / linie / siatka).
- Szablony, losowa inspiracja i palety rysują wyłącznie jednolite tło. Paleta nie ma już drugiego koloru tła, a jej kafelek pokazuje jeden kolor.
- **Stare projekty** (zapis w przeglądarce i pliki `.json` z 0.26.14v) wczytują się bez błędu: gradient zamienia się w kolor jednolity (zostaje „Kolor 1”), a dawny wzór i drugi kolor są pomijane.
- Przyciemnienie zdjęcia, ramki, plakietki, pasy i inne ozdoby układów działają jak dotąd.

## 2. Nowy PROSTY generator banerów
Osobna wersja obok pełnej: **wybierasz kolor tła i wpisujesz treść, i tyle.**
- **Panel** „Prosty generator” pojawia się na stronie „Folie i banery 24h” tuż pod panelem pełnego generatora (przycisk **Otwórz prosty generator** + zgoda „Dołącz projekt do zamówienia”). Na innych produktach go nie ma.
- **Małe okno** z podglądem banera w prawdziwych proporcjach i dwoma krokami:
  1. **Kolor tła** — 12 gotowych kolorów (biały, czarny, czerwony, pomarańczowy, żółty, zielony, turkusowy, niebieski, granatowy, fioletowy, różowy, szary) + „Własny kolor”.
  2. **Treść** — Nagłówek (do 46 znaków), Opis (do 70, opcjonalnie), Kontakt (do 70, opcjonalnie), z licznikami znaków.
- **Kolor tekstu i jego rozmiar dobierają się same** (biały albo czarny — ten z lepszym kontrastem do tła; tekst sam dopasowuje się do powierzchni banera). Układ jest jeden, wyśrodkowany. Bez szablonów, zakładek, logo, QR, plakietek i czcionek.
- **Rozmiar banera pochodzi z formularza** (pola „Szerokość / Wysokość”) i generator go nie zmienia — widać go w nagłówku okna. Działa dla wszystkich dozwolonych proporcji (od kwadratu po pasy 10 × 1 m i wysokie banery).
- **Pobieranie:** „Pobierz PDF” (strona w fizycznym rozmiarze banera) i „JPG”. Przycisk **„Użyj w zamówieniu”** zapisuje PDF i dołącza go do wyceny.
- **Zabezpieczenie przed pomyłką w druku:** „Użyj w zamówieniu” i zgoda w panelu nie działają, dopóki w polach zostaje przykładowy tekst (np. „TWÓJ NAGŁÓWEK”, przykładowy numer telefonu) albo nagłówek jest pusty — pojawia się komunikat, co poprawić. Pole z przykładowym tekstem zaznacza się po kliknięciu, więc wystarczy zacząć pisać. Zwykłe pobranie pliku nie jest blokowane.
- **Link „Otwórz pełny generator”** w oknie przenosi wybrany kolor i treść do pełnego generatora (tam można dodać logo, zdjęcie, QR, szablon).
- Ostatnie ustawienia (kolor i teksty) pamięta przeglądarka. Tryb ciemny, wersja angielska i telefon (okno na cały ekran, podgląd przyklejony u góry, przycisk „Użyj w zamówieniu” zawsze widoczny; bez automatycznego wysuwania klawiatury) są obsłużone.

## 3. Zamówienie: jeden projekt naraz
Do zamówienia można dołączyć projekt z **prostego albo z pełnego** generatora, nigdy z obu naraz: włączenie jednego (zgoda w panelu lub „Użyj w zamówieniu”) wyłącza drugi. Po zmianie wymiarów w formularzu plik jest przebudowywany. Bez zgody klienta nic nie jest dołączane ani wysyłane — projekt powstaje lokalnie w przeglądarce.

## 4. Pliki
Nowe: `js/banner-generator-simple.js`, `assets/banner-generator-simple.css`, `tests/banner_generator_simple_02615_browser.py`.
Zmienione: `index.html` (nowe pliki, `?v=0.26.15`, etykieta wersji), `js/app.js` (wersja + w wycenie banera `files:` zbiera załącznik z obu generatorów), `js/banner-gen-engine.js` (bez gradientu, wzoru i drugiego koloru tła), `js/banner-generator.js` (interfejs tła bez gradientu/wzoru; włączenie załącznika wyłącza prosty generator), `tests/banner_generator_02614_browser.py` (selektory panelu pełnego generatora, bo na stronie są teraz dwa panele).

## Założenia i ograniczenia
- „Osobna wersja” zrobiona jako **drugi panel i drugie okno w tej samej stronie banerów**, nie jako osobna podstrona. Jeśli ma to być samodzielna strona (np. do osadzenia gdzie indziej), da się to zrobić na tym samym kodzie.
- Prosty generator ma **jeden układ i jeden krój pisma**; wielkie litery w nagłówku są zawsze włączone (jak w pełnym generatorze domyślnie).
- Tekst jest rysowany czcionkami systemowymi klienta (+ Montserrat, jeśli strona go załadowała), więc na innym urządzeniu krój może się nieco różnić. PDF jest rastrowy (JPEG), jak w pełnym generatorze.
- Testowano w Chrome (komputer, widok telefonu, tryb ciemny, EN). Nie testowano na Safari, Firefoxie ani na fizycznym telefonie.
