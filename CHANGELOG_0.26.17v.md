# Drukulator 0.26.17v

**Strona banera: prosty generator jest na wierzchu, pełny generator jest zwinięty do otwarcia.** Zmiana dotyczy tylko układu strony — działanie generatorów, ceny, formularz, koszyk i `send-order.php` bez zmian (w `app.js` zmieniony tylko numer wersji i łączenie plików z obu generatorów).

---

## Co się zmieniło
- **Na wierzchu prosty generator** — zaraz pod formularzem wymiarów: „GENERATOR BANERA”, nagłówek „Zaprojektuj baner w minutę: kolor tła i treść”, miniatura banera na żywo (zmienia kolor i tekst razem z wyborem) i przycisk „Zaprojektuj baner”.
- **Pełny generator schowany** w rozwijanej sekcji pod spodem: „Chcesz projektować bardziej? Pełny generator: szablony, układy, logo, zdjęcie, kod QR”. Domyślnie **zamknięta**; klik w pasek rozwija dotychczasowy panel z przyciskiem „Otwórz pełny generator”.
- Gdy do zamówienia jest dołączony projekt z pełnego generatora, na zwiniętym pasku widać znaczek **„✓ w zamówieniu”** — klient nie zgubi, że coś jest dołączone, nawet bez rozwijania.
- Rozwinięcie / zwinięcie pamiętane jest w trakcie pracy na stronie (przebudowa panelu po zmianie wymiarów nie zamyka sekcji).
- Panel pełnego generatora ma teraz etykietę „PEŁNY GENERATOR” i nagłówek „Szablony, układy, logo, zdjęcie i kod QR”.
- Wersja angielska: „BANNER GENERATOR” / „Want to design more?” / „Open full generator”.
- Ciemny motyw i telefon: sprawdzone.

## Założenia
- Sekcja pełnego generatora jest **domyślnie zwinięta i nie otwiera się sama** (także gdy klient wcześniej używał pełnego generatora). Jeśli wolisz, żeby otwierała się automatycznie, gdy jest dołączony jego projekt, to jedna linijka.
- Zmiana jest tylko w układzie strony; zasada „jeden projekt naraz” (prosty / pełny), „Zapisz projekt” w prostym i „Użyj w zamówieniu” w pełnym działają jak w 0.26.16v.

## Pliki
Zmienione: `js/banner-generator.js`, `js/banner-generator-simple.js`, `assets/banner-generator.css`, `assets/banner-generator-simple.css`, `index.html` (`?v=0.26.17`, etykieta wersji), `js/app.js` (wersja), `tests/banner_generator_02614_browser.py` (rozwija sekcję przed pracą z pełnym panelem), `tests/banner_generator_simple_02615_browser.py` (kolejność paneli, domyślnie zwinięta sekcja, miniatura, znaczek).
Nowe: `CHANGELOG_0.26.17v.md`.

## Testy
Prosty generator: 72 sprawdzenia OK. Pełny generator (regresja): 76 OK. Podgląd 3D wizytówki: OK. Składnia wszystkich plików JS: OK. Nie sprawdzałem Safari, Firefoksa ani prawdziwego telefonu.
