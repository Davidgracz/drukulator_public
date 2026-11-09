# Drukulator 0.25.4v

Strona „PCV i pianki” → **Plansza pianka 5 mm**: nowe ceny progowe i wybór wyglądający jak w plakatach wielkoformatowych. Folia z nadrukiem + PCV oraz pozostałe produkty bez zmian. **Pliki PHP bez zmian. Zmieniony `data/prices.json` (tylko cennik pianek).**

---

## 1. Ceny pianek (brutto, za sztukę, zależnie od ilości)

| Format | 1 szt. | 2–4 szt. | 5–9 szt. | od 10 szt. |
|---|---|---|---|---|
| A3 (30 × 42 cm) | 50 | 45 | 40 | 35 |
| A2 (42 × 59 cm) | 55 | 50 | 45 | 40 |
| A1 (59 × 84 cm) | 90 | 85 | 75 | 70 |
| B2 (50 × 70 cm) | 65 | 60 | 55 | 50 |
| B1 (70 × 100 cm) | 120 | 110 | 100 | 90 |
| B0 (100 × 140 cm) | 220 | 200 | 190 | 180 |

- W cenniku każdy format ma teraz `progi_ilosciowe` (1 / 2 / 5 / 10 szt.) — **tak samo jak plakaty wielkoformatowe**. W „Edycji cen” widać je jako „Progi ilościowe → Próg 1…4 (Od liczby sztuk, Cena za sztukę)”.
- Dawna pojedyncza „Cena za sztukę” przy formacie została usunięta, żeby nie wprowadzała w błąd.
- Własny wymiar: rozliczany według najmniejszego formatu z cennika, w którym mieści się plansza (również po obróceniu), **ceną progu dla zamawianej ilości** (np. 45 × 60 cm = B2: 65 zł przy 1 szt., 60 zł przy 2–4, 55 zł przy 5–9, 50 zł od 10 szt.). Limit 100 × 140 cm bez zmian.

## 2. Wygląd — jak w plakatach wielkoformatowych
- **Format**: kafelki formatów (A3, A2, A1, B2, B1, B0) i na końcu kafelek **„Własny wymiar”** (zastępuje dawny przełącznik „Sposób wyboru wymiaru”). Na kafelku widać cenę za sztukę **dla aktualnie wybranej ilości** (zmienia się po kliknięciu w ilość).
- **Własny wymiar**: pola „Szerokość planszy [cm]” i „Wysokość planszy [cm]” obok siebie; nad ostrzeżeniami zielony komunikat „Własny wymiar … zostanie rozliczony jako pełny format …”, a w tabeli podświetla się odpowiedni wiersz.
- **Ilość sztuk**: kafelki **1, 3, 5, 10, 20** oraz przycisk **„+ Własna ilość”** (1–100 szt.; wpisana ilość od razu przelicza cenę i próg).
- **Tabela „Ceny brutto za sztukę”** pod formularzem, zawsze rozwinięta: kolumny **1 szt. / 2–4 szt. / 5–9 szt. / od 10 szt.**; wybrany format i aktualny próg ilościowy są podświetlone. Na telefonie rozmiar formatu jest w drugiej linii, żeby kolumna nie była ciasna.
- W wycenie szczegółowej doszła linia „Próg ilościowy” (np. „2–4 szt.”).

## 3. Zgodność ze starymi danymi
- Ceny zapisane wcześniej w przeglądarce (panel „Edycja cen”) lub zaimportowane ze starego pliku z jedną ceną za sztukę **nie psują cennika**: przy zapisanym lokalnie starym formacie obowiązują progi z `data/prices.json`; plik bez progów działa jako jedna cena dla każdej ilości.
- **Uwaga przy wgrywaniu:** `data/prices.json` nadpisuje cennik na serwerze — jeśli ceny były zmieniane w panelu i zapisane na serwerze, trzeba je ponownie uwzględnić (zmienia się tylko blok pianek).

## Kalkulator
`getFoamBoardUnitPrice` (cena wg progu), `calculateFoamBoardStandard` i `calculateFoamBoardCustom` liczą cenę z progu ilościowego; `findFoamBoardBillingFormat` przyjmuje ilość. Stary zapis z jedną ceną nadal działa.

## Pliki
`data/prices.json` (pianki), `js/calculators.js`, `js/app.js` (wersja 0.25.4v, widok pianek, migracja cen), `js/smart-forms.js`, `js/i18n.js` (EN), `assets/order-experience-239.css` (kafelki ilości i „Własna ilość” także dla pianek), `assets/ux-clarity.css` (tabela progów), `index.html` (wersja zasobów `?v=0.25.4`). Testy: nowe `foam_tiers_0254.test.cjs`, `foam_tiers_0254_browser.py`; dostosowane `foam_caps_0243_browser.py`, `merge_0250_browser.py`.

## Wgrywanie
Wgraj **całą paczkę razem z `data/prices.json`** i odśwież stronę klawiszami Ctrl+F5.
