# Drukulator 0.26.19v

**Generator banerów: zostaje jeden, rozbudowany (dawny „prosty”). Pełny generator (profi) wyłączony.** Ceny, formularz, koszyk i `send-order.php` bez zmian (w `app.js` zmieniony tylko numer wersji).

---

## Pełny generator wyłączony
- Pod formularzem banera jest już tylko panel „GENERATOR BANERA” z miniaturą i przyciskiem „Zaprojektuj baner”. Sekcja „Chcesz projektować bardziej? Pełny generator…” zniknęła.
- Kod pełnego generatora zostaje w repozytorium (`js/banner-generator.js` + test `tests/banner_generator_02614_browser.py`), ale `index.html` go nie ładuje. **Żeby go przywrócić**, w `index.html` odkomentuj linię `<script src="js/banner-generator.js…">` (jest oznaczona komentarzem).
- Z okna generatora usunięty został link „Otwórz pełny generator”.

## Nowe okno generatora (układ jak w Twoim szkicu)
- **Góra, od lewej:** „Generator banera”, **Wymiary** (szerokość × wysokość w cm) i **„Wyczyść projekt”**. Na końcu paska jest tylko krzyżyk zamykający okno.
- **Wymiary są wspólne z formularzem na stronie** — zmiana w oknie zmienia formularz i cenę, a zmiana w formularzu zmienia pola w oknie. Wartości niepełne w trakcie pisania (np. „2” z „200”) nie trafiają do formularza; po zatwierdzeniu wymiar jest ograniczany do 10–1000 cm.
- **Pod podglądem** (wyśrodkowane): np. „200 × 100 cm”, „Nagłówek czytelny z ok. 23 m”, „Czytelność: świetna”. Ocena czytelności liczy się z kontrastu tekstu do tła, więc reaguje na wybrane kolory. Dodatkowe ostrzeżenia pojawiają się tylko gdy trzeba: „Przycisk zlewa się z tłem” i przekroczenie rozmiarów materiału (np. krótszy bok powyżej 160 cm).
- **Po prawej, od góry:**
  1. **Kolory** — te same 12 kolorów co dotąd, bez własnych kolorów RGB. Pod nimi wybór **Kolor: Tło / Tekst / Przycisk** (przy każdym kółko z aktualnym kolorem); kliknięty kolor zmienia wybrany element.
  2. **Pola:** Nagłówek, Opis / hasło, Kontakt oraz Przycisk (pole wyboru „pokaż” + tekst, jak w profi), z licznikami znaków.
  3. **Suwaki:** rozmiar nagłówka, opisu, kontaktu i przycisku (40–100%, jak w profi).
  4. **Wyrównanie:** Do lewej / Środek / Do prawej.
  5. Niebieski przycisk **„Użyj w zamówieniu”** (dołącza projekt do zamówienia jako PDF w rozmiarze banera, okno się zamyka). Zastąpił „Zapisz projekt”.
- **Okno jest większe** (do 1240 × 820 px) i prawa kolumna mieści się **bez paska przewijania** na ekranach 1440 × 900, 1366 × 768 i 1280 × 720. Na telefonie okno jest pełnoekranowe, podgląd przyklejony u góry, a przycisk „Użyj w zamówieniu” zawsze widoczny.
- **Silnik:** nowy parametr `ctaScale` (rozmiar przycisku, 40–100%, domyślnie 100) — pełny generator go nie używa, więc jego wygląd się nie zmienia.

## Zasady działania i założenia
- **Kolor tekstu i przycisku są domyślnie automatyczne:** tekst biały albo czarny (zależnie od jasności tła), przycisk w kolorze tekstu. Dopóki klient nie wybierze własnego, zmieniają się razem z tłem. Wybrany ręcznie kolor tekstu zostaje po zmianie tła — wtedy o słabej widoczności ostrzega ocena czytelności.
- **Przycisk jest domyślnie wyłączony** (żeby nie wydrukować niechcianego „Zadzwoń teraz”). Wpisanie tekstu w polu „Przycisk” albo zaznaczenie pola włącza go. Gdy przycisk jest wyłączony, „Przycisk” w wyborze koloru i suwak jego rozmiaru są nieaktywne.
- **„Wyczyść projekt”** wymaga dwóch kliknięć (pierwsze zmienia napis na „Na pewno? Kliknij ponownie”, wygasa po ok. 3,5 s). Przywraca kolory, teksty, suwaki, wyrównanie i wyłącza przycisk. **Wymiary zostają** (są częścią zamówienia). Jeśli projekt był dołączony do zamówienia, dołączenie jest wyłączane, bo wróciły przykładowe teksty.
- Zabezpieczenie przed przykładowym tekstem działa jak dotąd: „Użyj w zamówieniu” nie przejdzie z tekstem „TWÓJ NAGŁÓWEK” itp. ani z pustym nagłówkiem. Tekst przycisku („Zadzwoń teraz”) nie jest traktowany jako przykład — klient włącza go świadomie.
- Wyrównanie zmienia ułożenie napisów w obrębie banera; sam układ (blok wyśrodkowany w pionie, czcionka Montserrat, wielkie litery w nagłówku i przycisku) pozostaje stały.
- Z okna nie ma już cofania/ponawiania, listy popularnych rozmiarów, marginesu bezpiecznego z oczkami i powiększenia — zgodnie z „i to wszystko” w Twoim opisie.
- Ustawienia (kolory, teksty, przycisk, suwaki, wyrównanie) pamięta przeglądarka klienta; zapis z wersji 0.26.15–0.26.18 (kolor i teksty) jest przejmowany automatycznie. Bez eksportu: nie ma pobierania PDF/JPG, a to ograniczenie interfejsu, nie zabezpieczenie techniczne (zrzut ekranu podglądu nadal jest możliwy).

## Pliki
Zmienione: `js/banner-generator-simple.js` (przepisany), `assets/banner-generator-simple.css` (przepisany), `js/banner-gen-engine.js` (`ctaScale`), `index.html` (`?v=0.26.19`, etykieta wersji, skrypt pełnego generatora w komentarzu), `js/app.js` (wersja), `assets/banner-generator.css` (nagłówek), `tests/banner_generator_02614_browser.py` (test pełnego generatora włącza jego skrypt przez podmianę `index.html`).
Nowe: `tests/banner_generator_02619_browser.py`, `CHANGELOG_0.26.19v.md`.
Usunięte: `tests/banner_generator_simple_02615_browser.py` (zastąpiony nowym testem; sprawdzenia silnika „bez gradientu i wzoru” przeniesione).

## Testy
Nowy generator: 91 sprawdzeń OK (układ okna, kolejność kolumny, kolory tło / tekst / przycisk, przycisk zlewający się z tłem, pola i limity, suwaki, wyrównanie, wymiary ↔ formularz, „Użyj w zamówieniu” → PDF 200 × 100 cm w koszyku, „Wyczyść projekt”, pamięć i migracja zapisu, skrajne proporcje, EN, ciemny motyw, 1440 × 900 / 1366 × 768 bez przewijania, telefon). Pełny generator (przywrócony w teście): 79 OK. Podgląd 3D wizytówki: OK. Składnia JS: OK. Nie sprawdzałem Safari, Firefoksa ani prawdziwego telefonu.
