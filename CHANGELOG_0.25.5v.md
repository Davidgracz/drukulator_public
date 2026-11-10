# Drukulator 0.25.5v

Wydanie oparte na analizie statystyk z 30 dni: **nowe dane w statystykach** (krok „cena po konfiguracji”, błędy wysyłki zamówienia, wartość pozycji w koszykach, rozszerzone eksporty CSV) oraz **obsługa starych pozycji w koszyku** (ostrzeżenie + „Oblicz ponownie”). Ceny i cennik bez zmian (`data/prices.json` nie jest zmieniany).

**Zmienione pliki PHP (trzeba wgrać): `analytics-v2-lib.php`, `analytics-track.php`, `staff-panel.php`.**

---

## 1. Statystyki — nowe dane (liczone od momentu wgrania 0.25.5v)

- **Cena po konfiguracji** — nowy krok lejka między „Sesje” a „Wyceny”: sesje, w których klient *sam zmienił parametry* (kliknął kafelek, wpisał wymiar/ilość, zmienił listę) albo kliknął „Dodaj do koszyka · cena” i zobaczył cenę. Cena domyślna widoczna zaraz po wejściu na stronę **nie jest liczona**. Zdarzenie wysyłane jest raz na kategorię w danej sesji przeglądarki. Dostępny jest też podział na kategorie produktów („Kategorie z ceną po konfiguracji”).
- **Błędy wysyłki zamówienia** — licznik nieudanych prób wysłania z przyczyną: *pozycja ze starszej wersji kalkulatora*, *przekroczony limit*, *odrzucone przez serwer (walidacja)*, *pliki*, *błąd połączenia*, *błąd serwera*. Zapisywana jest tylko kategoria błędu — bez treści zamówienia i bez danych klienta. Zwykłe niedopatrzenia w formularzu (brak imienia, e-maila, zgody) nie są liczone.
- **Wartość pozycji w koszykach** — liczba pozycji dodanych do koszyka i ich suma (tylko poprawne kwoty do limitu zamówienia 5000 zł); w panelu widoczna jako „Średnia pozycja w koszyku”.
- **Panel personelu → Statystyki:** dodatkowy rząd kafelków (cena po konfiguracji, średnia pozycja w koszyku, błędy wysyłki), karta „Błędy wysyłki zamówienia” oraz dopisek o tym, od kiedy dane są zbierane.
- **Eksport CSV (dni)** — dotychczasowe kolumny w tej samej kolejności (`Dzień; Sesje; Wyceny; Koszyki; Zapytania potwierdzone; Wartość zapytań PLN`), **nowe kolumny na końcu:** `Cena po konfiguracji; Formularz; Pozycje w koszykach; Wartość pozycji w koszykach PLN; Błędy wysyłki`.
- **Nowy eksport „↓ CSV (szczegóły)”** — jeden plik z kategoriami (oglądane / cena po konfiguracji / dodane do koszyka / zamówione), źródłami ruchu, błędami wysyłki i podsumowaniem okresu.

### Jak czytać wcześniejsze dane
Kolumny „Wyceny” i „Koszyki” to liczby **sesji**, które dotarły do danego kroku (nie liczba pozycji). Od ok. 27.10 oba kroki są niemal równe, bo kliknięcie „Dodaj do koszyka · cena” zapisuje jednocześnie wycenę i dodanie do koszyka — dlatego właśnie dodano krok „cena po konfiguracji”. Źródła ruchu i kategorie były zbierane już wcześniej (widać je w panelu); do pliku CSV trafiają dopiero teraz.

### Baza danych
Wersja struktury 2.0 → **2.1** (nowa kolumna `price_seen` w tabeli sesji). Aktualizacja odbywa się **automatycznie** przy pierwszym zdarzeniu statystyk po wgraniu plików, dotychczasowe dane zostają. Gdyby użytkownik bazy nie miał prawa `ALTER`, pozostałe statystyki działają dalej, a tylko krok „Cena po konfiguracji” pokazuje 0.

## 2. Stare pozycje w koszyku (z wcześniejszych wersji kalkulatora)

Serwer odrzuca pozycje (plakaty, banery/folie, naklejki/etykiety, PCV/pianki, płótno) zapisane w koszyku przed wersją 0.25.3, bo nie mają zapisanych wymiarów — klient widział wtedy tylko komunikat po kliknięciu „Wyślij”. Teraz:

- w koszyku taka pozycja jest **oznaczona** („Pozycja ze starszej wersji kalkulatora — wymaga ponownego obliczenia”) i nad listą pojawia się ostrzeżenie;
- przy pozycji jest przycisk **„Oblicz ponownie”**: usuwa starą pozycję, otwiera właściwy produkt i zostawia na górze strony podpowiedź z nazwą i opisem starej pozycji (żeby klient pamiętał, co wycenia);
- **„Wyślij zamówienie” zatrzymuje się od razu** z jasnym komunikatem (bez zapytania do serwera) i zapisuje błąd „stale_item” w statystykach;
- automatyczne przeliczenie nie jest możliwe — stare pozycje nie mają zapisanych wymiarów ani ilości, tylko opis tekstowy.

Warunek rozpoznania jest taki sam jak w `send-order.php` (tytuł zawiera: plakat, baner, folia, naklejk, etykiet, pcv, piank, płótn/plotn i brak typu produktu). X-banery, roll-upy i komplety taxi nadal są uzupełniane automatycznie (0.25.3).

## Pliki
`analytics-v2-lib.php`, `analytics-track.php`, `staff-panel.php`, `js/app.js` (wersja 0.25.5v, krok ceny, błędy wysyłki, stare pozycje), `js/i18n.js` (EN), `assets/ux-clarity.css`, `index.html` (wersja zasobów `?v=0.25.5`). Testy: nowe `analytics_v2_0255.py` (+ `analytics_v2_0255_harness.php`), `staff_analytics_0255_browser.py`, `stale_cart_analytics_0255_browser.py`; dostosowany `merge_0250_browser.py`.

## Uwagi
- Test strony serwerowej (SQL) wykonano na atrapie WordPressa z bazą SQLite — przed produkcją warto po wgraniu otworzyć Statystyki i sprawdzić, czy panel się ładuje.
- Strona „PCV i pianki” jest w statystykach grupowana jako „Płyty PCV” (jak dotychczas).

## Wgrywanie
Wgraj całą paczkę (w tym trzy pliki PHP powyżej) i odśwież stronę klawiszami Ctrl+F5.
