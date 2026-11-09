# Drukulator 0.25.2v

Strona „Obrazy na płótnie” — wygodniejszy wybór formatu, własny wymiar co 10 cm, proponowane formaty jako kafelki i wgrane zdjęcie od razu w podglądzie produktu. Pozostałe produkty bez zmian. **Pliki PHP bez zmian. Ceny bez zmian.**

---

## 1. Układ wyboru (wszystkie trzy tryby)
- „Wybierz format z cennika”, „Wpisz własny wymiar” i „Dopasuj do zdjęcia” są teraz **w jednym rzędzie** na całą szerokość (na telefonie jeden pod drugim).
- „Ilość obrazów” jest **pod nimi, równo z lewą krawędzią przycisków** — tak samo w każdym trybie (wcześniej stała obok i przesuwała się, gdy zmieniał się tryb).

## 2. Wybierz format z cennika — „Pokaż wszystkie formaty i ceny”
- Zamiast tabeli są **kafelki w tym samym stylu co gotowe rozmiary** (rozmiar + cena za wybraną ilość).
- Układ według szerokości: każda szerokość (30, 40, 50 … 150 cm) ma **dwa rzędy: 7 + 6 kafelków** (wysokości 30–150 cm), np. `30×30, 30×40 …` / `40×30, 40×40 …` / `50×30, 50×40, 50×50 …`
- Obie orientacje: `40 × 30 cm` (obraz poziomy) kosztuje tyle samo co `30 × 40 cm` — ta sama pozycja cennika. W zamówieniu zostaje wybrany kierunek (np. „40 × 30 cm”), a w szczegółach wyceny — pozycja cennika („Format cennikowy: 30x40”).
- Brak kafelka `150 × 150 cm` — tego formatu nie ma w cenniku.
- Gotowe rozmiary na górze: **7 w rzędzie** (na węższym ekranie 4 lub 2).
- Wybór kafelka działa jak dotąd: zaznacza format, zwija listę i przewija do wybranego formatu.

## 3. Wpisz własny wymiar
- Przyciski **− i +** zmieniają szerokość i wysokość **co 10 cm** (z dowolnej wartości do najbliższej pełnej dziesiątki, w granicach 30–150 cm). Wpisać można nadal dowolny wymiar (np. 63,5 cm) — jest rozliczany według najbliższego większego formatu, jak dotąd.

## 4. Dopasuj do zdjęcia
- **Proponowane formaty** to kafelki (7 w rzędzie): rozmiar, pod nim „różnica proporcji”, pod nią cena za wybraną ilość. Zmiana ilości odświeża ceny na kafelkach.
- „Podaj jeden bok” — bez zmian (wartość co 10 cm, zaokrąglanie w górę).
- Miniatura wgranego pliku jest teraz małym podglądem obok nazwy; poprawiony też układ tej części (wcześniej obraz i opisy stały obok siebie).

## 5. Wgrany plik w podglądzie produktu
- Zdjęcie lub PDF wgrane w „Dopasuj do zdjęcia” **pokazuje się od razu w „Podglądzie wydruku”** (podgląd otwiera się sam) — **bez drugiego wgrywania**. Pole „Sprawdź swój projekt” jest wtedy ukryte, a w podglądzie widać nazwę pliku, rozmiar i rozdzielczość.
- Rozmiar w podglądzie zgadza się z wybranym kafelkiem (albo, przy „Podaj jeden bok”, z formatem rozliczeniowym); orientacyjna rozdzielczość (DPI) liczy się dla tego formatu.
- Plik nadal jest dołączany do zamówienia automatycznie po dodaniu do koszyka (bez zmian).
- Zmiana trybu zdejmuje plik z podglądu (w innych trybach plik nie jest częścią wyceny). W trybach „format z cennika” i „własny wymiar” działa nadal zwykłe pole podglądu „Sprawdź swój projekt”.

## Kalkulator (bez zmiany cen)
- `calculateCanvasStandard` rozpoznaje format w obu kierunkach (40x30 = cena 30x40) i **zgłasza błąd** dla formatu spoza cennika zamiast zwracać „NaN zł”.

## Pliki
`js/app.js` (wersja 0.25.2v, układ i kafelki obrazów, podgląd pliku), `js/calculators.js`, `js/product-preview.js` (publiczne API dla pliku z kalkulatora, rozmiar w trybie „Dopasuj do zdjęcia”), `js/smart-forms.js` (opis pod kafelkiem: `data-d24-detail`), `js/i18n.js` (EN), `assets/ux-clarity.css`, `index.html` (wersja zasobów `?v=0.25.2`). Testy: nowe `canvas_layout_0252_browser.py`, `canvas_calc_0252.test.cjs`; dostosowane `canvas_rollup_pvc_0242_browser.py`, `merge_0250_browser.py`.

## Wgrywanie
Po wgraniu odśwież stronę klawiszami Ctrl+F5. `data/prices.json` bez zmian (można nie wgrywać).
