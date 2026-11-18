# Drukulator 0.26.9v

**Panel pracowniczy: przeprojektowana zakładka „Analityka” — więcej szczegółów i czytelniejszy układ.** Poprawki do 0.26.8v. **Zmieniły się pliki PHP (`staff-panel.php`, `analytics-v2-lib.php`) i front-end (`js/app.js`); tabela analityki w bazie aktualizuje się sama (wersja 2.2).** `data/prices.json` bez zmian.

---

## 1. Nowy układ: pięć widoków zamiast jednej długiej strony
Nad raportem stoi nagłówek z zakresem dat, godziną aktualizacji, wyborem okresu (**Dziś / 7 / 14 / 30 / 90 dni**), przełącznikiem „Porównaj z poprzednim okresem”, przyciskiem „Odśwież” i trzema eksportami CSV. Poniżej zakładki:

| Zakładka | Co pokazuje |
|---|---|
| **Przegląd** | 8 kafelków KPI, wykres „Dzień po dniu”, lejek w skrócie, najważniejsze wnioski, najlepsze kategorie, źródła ruchu |
| **Lejek** | pełny lejek z przejściami między etapami, koszyki porzucone, błędy wysyłki, lejek wg urządzenia / źródła / języka |
| **Produkty** | najczęściej oglądana / dodawana do koszyka / największa wartość, sortowalna tabela kategorii z filtrem |
| **Ruch** | źródła, urządzenia, język, wejścia wg godziny, mapa dzień tygodnia × godzina, oglądane kategorie, wyszukiwane hasła |
| **Dni** | tabela dzień po dniu z zaznaczonym najlepszym dniem w każdej kolumnie i wierszem „Razem” |

## 2. Kafelki KPI z porównaniem do poprzedniego okresu
- Sesje, sesje z koszykiem, przyjęte zapytania, konwersja, wartość zapytań, średnia wartość zapytania, koszyki porzucone, błędy wysyłki. Każdy ma opis (znak „?”), a większość mini-wykres trendu.
- **Zmiana względem poprzedniego okresu o tej samej długości** (np. 7 dni → poprzednie 7 dni): strzałka ▲/▼ i procent, dla współczynników (konwersja) — różnica w **punktach procentowych**. Kolor zależy od sensu wskaźnika (więcej błędów albo porzuconych koszyków = czerwony, nie zielony). Gdy w poprzednim okresie było 0, pokazujemy „nowe”.
- Porównanie można wyłączyć jedną opcją.

## 3. Wykres „Dzień po dniu”
- Wybierasz wskaźnik: **Sesje, Cena po konfiguracji, Wyceny, Koszyki, Przyjęte zapytania, Wartość zapytań**. Linia przerywana to poprzedni okres. Dla zakresu **Dziś** wykres to słupki sesji wg godziny (dziś kontra wczoraj).
- Po najechaniu, dotknięciu albo strzałkami ←/→ (po zaznaczeniu wykresu) pojawia się dymek z dniem tygodnia, wartością i wartością z odpowiadającego dnia poprzedniego okresu.
- Wykres rysuje się w rzeczywistej szerokości ekranu, więc opisy osi są czytelne także na telefonie i przeliczają się po obrocie ekranu.

## 4. Lejek sprzedaży
- Dla każdego etapu (Sesje → Cena po konfiguracji → Wyceny → Koszyki → Formularz → Przyjęte zapytania): liczba, % sesji, **% „przechodzi dalej” i ile sesji odpadło**, zmiana względem poprzedniego okresu.
- **Etap z największą stratą jest oznaczony** żółtą etykietą.
- **Lejek wg urządzenia, źródła ruchu i języka strony** — te same etapy dla każdego segmentu z konwersją, żeby widać było np. że telefon konwertuje gorzej niż komputer.
- Koszyki porzucone (liczba i udział) oraz błędy wysyłki zamówienia z rozbiciem na przyczyny; krótka ściąga „Jak czytać lejek”.

## 5. Produkty i kategorie
- Tabela: oglądane, cena po konfiguracji, do koszyka, w zapytaniach (pozycje), **wartość zapytań**, „koszyk ÷ cena” i „zapytanie ÷ koszyk”, wiersz „Razem”. Sortowanie kliknięciem w nagłówek, pole filtra, słupek wartości.
- Współczynniki są orientacyjne (liczone na zdarzeniach, a nie na tych samych sesjach, więc mogą przekraczać 100%) — jest o tym opis pod tytułem tabeli.

## 6. Ruch, godziny, urządzenia, język, wyszukiwanie
- **Wejścia wg godziny** (czas strony) i **mapa dzień tygodnia × godzina** z podpowiedzią „najruchliwszy termin”.
- **Urządzenia** (telefon / tablet / komputer), **język strony**, **źródła ruchu** — udział, liczba sesji i konwersja.
- **Wyszukiwanie w kalkulatorze**: najczęstsze hasła oraz hasła **bez wyników** (np. czego klienci szukają, a kalkulator tego nie ma). Adresy e-mail i numery telefonu nie są zapisywane.
- Żółta informacja, gdy część starszych sesji nie ma jeszcze danych o urządzeniu / języku / godzinie.

## 7. Najważniejsze wnioski (automatyczne)
Do 8 zdań wyliczonych z danych okresu, najpierw te, które wymagają reakcji (czerwone, żółte), potem pozytywne i informacyjne: błędy wysyłki i ich najczęstsza przyczyna, największa strata w lejku, porzucone koszyki, odsetek wyszukiwań bez wyników, najlepszy dzień (ruch / zapytania), kategoria o największej wartości, najczęściej dodawana do koszyka, godzina szczytu.

## 8. Eksport CSV
- **CSV (dni)** — jak dotąd, dzień po dniu (układ kolumn bez zmian).
- **CSV (produkty)** — nowy: tabela kategorii z wartościami i współczynnikami.
- **CSV (szczegóły)** — nowy: wszystkie rozbicia (kategorie, źródła, urządzenia, język, godziny, błędy, podsumowanie i poprzedni okres). Plik jest w UTF-8 z BOM, więc polskie znaki otwierają się poprawnie w Excelu.

## 9. Co zmieniło się w danych (backend)
- **Baza analityki 2.1 → 2.2:** do tabeli sesji dochodzą kolumny `device` i `lang`. Migracja idzie automatycznie (dbDelta) przy pierwszym zapisie zdarzenia lub otwarciu raportu — nic nie trzeba uruchamiać ręcznie.
- **Nowe liczniki:** wejścia wg godziny (czas strony), urządzenie, język oraz **wartość zapytań wg kategorii** (z potwierdzonych po stronie serwera zapytań).
- **Odpowiedź raportu** (`staff-api.php?action=analytics`) dostała pola: `previous` (poprzedni okres z serią dni), `hours`, `weekday_hours`, `devices`, `langs`, `ordered_value_cents`, `segments` (lejki wg urządzenia / źródła / języka), `segment_window_days`, `search`, `generated_at`. Dozwolone okresy: 1, 7, 14, 30, 90 dni (nieznany → 7).
- **Front-end (`js/app.js`):** do zdarzeń analityki dołącza ogólna klasa urządzenia (telefon / tablet / komputer — wg obsługi dotyku i krótszego boku ekranu) oraz język strony (PL / EN). Nic poza tym — bez User-Agenta, bez adresów IP.

## Prywatność
Nadal wyłącznie dane zbiorcze: brak adresów IP, imion, e-maili, telefonów, treści plików i identyfikatorów stałych. Sesja to losowy token, na serwerze zapisany tylko jako skrót i trzymany 45 dni; liczniki dzienne 180 dni.

## Założenia
- „Przeprojektuj panel pracowniczy tak, aby analityka była bardziej szczegółowa i czytelna” rozumiem jako **przeprojektowanie zakładki Analityka** (pozostałe zakładki panelu — zamówienia, produkcja, pracownicy — bez zmian).
- **Dane o urządzeniu, języku, godzinie wejścia i wartości wg kategorii zbieramy dopiero od tej wersji**, więc dla starszych dni te widoki będą puste lub z pozycją „Nieznane (starsze sesje)”; z czasem się uzupełnią.
- **Lejki wg segmentów** liczone są z sesji, które serwer trzyma 45 dni — dla okresu 90 dni obejmują więc ostatnie 45 dni (jest o tym informacja w widoku).
- **Listy haseł wyszukiwania** pochodzą ze starszego licznika (suma od początku zbierania, nie z wybranego okresu) — liczba wyszukiwań i „bez wyników” w nagłówku karty dotyczy wybranego okresu.
- Wartość zapytań to suma z kalkulatora dla zapytań przyjętych przez serwer (nie sprzedaż zrealizowana ani opłacona).

## Pliki
- **Zmienione (PHP — trzeba wgrać na serwer):** `staff-panel.php`, `analytics-v2-lib.php`.
- **Zmienione (front-end):** `js/app.js` (urządzenie i język w zdarzeniach analityki), `index.html`, `assets/ux-clarity.css` (numer wersji).
- **Bez zmian:** pozostałe pliki PHP (w tym `staff-api.php`, `analytics-track.php`, `send-order.php`), `data/prices.json`.
- **Testy:** nowy `staff_analytics_0269_browser.py` (panel w przeglądarce na 1300 i 390 px: KPI, porównanie, wykres, lejek, produkty, ruch, dni, CSV, stany pusty i błędu) oraz `analytics_v2_0269.py` + `analytics_v2_0269_harness.php` (backend: świeża instalacja i aktualizacja bazy, nowe pola raportu); zaktualizowane `analytics_v2_0255_harness.php` (wersja bazy 2.2) i `merge_0250_browser.py` (numer wersji). Usunięty zastąpiony `staff_analytics_0255_browser.py`.
