# Drukulator 0.26.18v

**Pełny generator banerów: bez eksportu do pliku, zakładka „Wygląd” → „Układ”.** Prosty generator, ceny, formularz, koszyk i `send-order.php` bez zmian (w `app.js` zmieniony tylko numer wersji).

---

## Co się zmieniło w pełnym generatorze
- **Usunięta zakładka „Eksport”:** nie ma już pobierania PDF / JPG / PNG, wyboru rozdzielczości ani przycisku „Pobierz plik”. Z modułu usunięty został kod pobierania i publiczna funkcja `exportBlob` (wewnętrznie nadal powstaje PDF dołączany do zamówienia).
- **Nowa zakładka „Projekt”** (w miejsce „Eksportu”): zostaje „Zapisz projekt (.json)” i „Wczytaj projekt…” oraz krótka informacja o „Użyj w zamówieniu”. Na telefonie jest tam też „Wyczyść projekt” (na komputerze ten przycisk jest w pasku u góry).
- **„Użyj w zamówieniu”** (przycisk w pasku u góry) działa jak dotąd: zapisuje projekt jako PDF w rozmiarze banera i dołącza do zamówienia.
- **Zakładka „Wygląd” nazywa się teraz „Układ”** (EN: „Layout”); poprawiony też komunikat „wgraj zdjęcie (Układ → Tło)”. Wewnątrz zakładki sekcje bez zmian: Układ, Kolory, Tło, Czcionka, Tekst.
- Opis w panelu pod formularzem nie obiecuje już pobrania pliku: „…a na koniec zapiszesz projekt i dołączysz go do zamówienia jako PDF”.

## Założenia
- „Zapisz projekt” w pełnym generatorze zostawiłem jako **zapis pliku projektu (.json)** — to nie jest plik do druku, tylko do wczytania z powrotem w generatorze. Jeśli ma działać tak jak w prostym generatorze (tylko dołączenie do zamówienia), wystarczy usunąć zakładkę „Projekt” i zmienić nazwę przycisku „Użyj w zamówieniu” na „Zapisz projekt”.
- To ograniczenie interfejsu, a nie zabezpieczenie techniczne: klient znający przeglądarkę może zrobić zrzut ekranu podglądu.
- Wewnętrzny identyfikator zakładki „Układ” pozostał `look` (zmiana tylko nazwy widocznej dla klienta).

## Pliki
Zmienione: `js/banner-generator.js`, `index.html` (`?v=0.26.18`, etykieta wersji), `js/app.js` (wersja), `assets/banner-generator.css` (nagłówek), `tests/banner_generator_02614_browser.py` (PDF/PNG sprawdzane z pliku dołączanego do zamówienia i z renderu; nowe sprawdzenia: brak Eksportu, brak przycisków pobierania, nazwy zakładek, brak `exportBlob`), `tests/banner_generator_simple_02615_browser.py` (wersja).
Nowe: `CHANGELOG_0.26.18v.md`.

## Testy
Pełny generator: 79 OK. Prosty generator: 72 OK. Podgląd 3D wizytówki: OK. Składnia JS: OK. Nie sprawdzałem Safari, Firefoksa ani prawdziwego telefonu.
