# Drukulator 0.26.16v

**Prosty generator banerów: bez eksportu — zostaje tylko „Zapisz projekt”.** Pełny generator, ceny, formularz, koszyk i `send-order.php` bez zmian (w `app.js` zmieniony tylko numer wersji).

---

## Co się zmieniło w prostym generatorze
- **Usunięte pobieranie plików:** przyciski „Pobierz PDF” i „JPG” zniknęły, a z modułu usunięty został kod pobierania. Klient nie dostaje z prostego generatora gotowego pliku do własnego użytku.
- **Jedyna akcja w oknie: „Zapisz projekt”** (wcześniej „Użyj w zamówieniu”). Zapisuje projekt i dołącza go do zamówienia jako PDF w fizycznym rozmiarze banera; okno zamyka się, a w panelu pod formularzem pojawia się potwierdzenie „✓ Projekt zapisany — do zamówienia zostanie dołączony plik …”. Plik pojawia się w koszyku po dodaniu banera.
- Pod polami jest krótka podpowiedź, że „Zapisz projekt” dołącza projekt do zamówienia.
- Zabezpieczenie przed przykładowym tekstem działa jak dotąd: „Zapisz projekt” (i zgoda w panelu) nie przejdzie, dopóki w polach zostaje przykładowy tekst albo nagłówek jest pusty.
- Zgoda „Dołącz projekt do zamówienia” w panelu, przebudowa pliku po zmianie wymiarów i zasada „jeden projekt naraz” (prosty / pełny generator) działają bez zmian. Ostatni kolor i teksty nadal pamięta przeglądarka (to zapis roboczy, nie plik).

## Założenia
- **Zmiana dotyczy tylko prostego generatora.** Pełny generator zachowuje zakładkę „Eksport” (PDF / JPG / PNG) i zapis projektu do pliku `.json`. Jeśli ma być w nim to samo, wystarczy usunąć zakładkę „Eksport” i zostawić „Użyj w zamówieniu”.
- „Zapis projektu” rozumiem jako **zapis do zamówienia** (PDF w koszyku). Nie dodawałem zapisu projektu do pliku `.json` w prostym generatorze.
- To ograniczenie interfejsu, a nie zabezpieczenie techniczne: klient, który zna się na przeglądarce, wciąż może zrobić zrzut ekranu podglądu.

## Pliki
Zmienione: `js/banner-generator-simple.js`, `assets/banner-generator-simple.css`, `index.html` (`?v=0.26.16`, etykieta wersji), `js/app.js` (wersja), `tests/banner_generator_simple_02615_browser.py` (sprawdza brak przycisków pobierania, brak jakiegokolwiek pobrania pliku, PDF zapisany do zamówienia w rozmiarze 100 × 100 cm).
Nowe: `CHANGELOG_0.26.16v.md`.
