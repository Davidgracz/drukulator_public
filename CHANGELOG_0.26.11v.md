# Drukulator 0.26.11v

**Naklejki i etykiety: minimalny wymiar zmieniony z 30 × 30 mm na 20 × 20 mm.** Poprawka do 0.26.10v. **Zmieniły się pliki front-endu (JS / HTML / CSS) oraz `send-order.php` — baza danych i `data/prices.json` bez zmian.**

---

## Co się zmieniło
Dotyczy usługi **Naklejki, etykiety i magnesy** (naklejki, etykiety, naklejki laminowane i pozostałe produkty liczone z wymiarów jednej sztuki). Maksimum **500 × 500 mm** bez zmian.

| Miejsce | Plik | Zmiana |
|---|---|---|
| Kalkulator (ostateczne sprawdzenie wymiaru) | `js/calculators.js` | minimum 20 mm na obu wymiarach, komunikat „Minimalny wymiar naklejki to 20 × 20 mm.” |
| Pola „Szerokość / Wysokość jednej sztuki” | `js/app.js` | atrybut `min="20"` |
| Tekst pod formularzem | `js/app.js` | „Minimalny wymiar: 20 × 20 mm. Maksymalny wymiar: 500 × 500 mm…” |
| Asystent (pytanie o wymiary) | `js/app.js` | „od 20 × 20 do 500 × 500 mm” |
| Wyszukiwarka / gotowe wyceny z wpisanego zapytania | `js/app.js` | np. „naklejki 20x20 mm 100 szt” otwiera formularz z wymiarem 20 × 20 (wcześniej odrzucane poniżej 30 mm) |
| Sprawdzenie po stronie serwera przy wysyłce zamówienia | `send-order.php` | zakres 20–500 mm i komunikat „od 20 × 20 mm do 500 × 500 mm” |

- **Wycena małych sztuk** liczy się tym samym wzorem co dotąd: do wymiaru dodawane jest 3 mm, ile sztuk mieści się w rzędzie (np. 20 × 20 mm → 43 w rzędzie na folii 1000 mm) i obowiązuje minimum zamówienia z cennika (0,7 m²). Cennik się nie zmienił.
- **Wymiary 19 mm i mniejsze** nadal są odrzucane czytelnym komunikatem, w kalkulatorze i na serwerze.

## Założenia
- „Minimalny rozmiar etykiety do druku” rozumiem jako minimalny wymiar jednej sztuki w usłudze Naklejki, etykiety i magnesy, na **obu bokach**: 20 × 20 mm.
- Zmiana nie dotyczy foliowania, banerów ani obrazów na płótnie (mają własne, inne limity).

## Pliki
- **Zmienione:** `js/calculators.js`, `js/app.js`, `send-order.php` (**PHP — trzeba wgrać na serwer**), `index.html`, `assets/ux-clarity.css` (numer wersji i odświeżenie pamięci podręcznej przeglądarki).
- **Bez zmian:** pozostałe pliki PHP, baza danych, `data/prices.json`.
- **Testy:** nowe `sticker_min20_02611.test.cjs` (kalkulator, granice 19/20/500/501, wycena 20 × 20, zakres w `send-order.php`) i `sticker_min20_02611_browser.py` (pola, komunikaty, wycena, wyszukiwarka i asystent; 1300 i 390 px); `merge_0250_browser.py` (numer wersji).
