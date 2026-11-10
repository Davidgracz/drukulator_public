# Drukulator 0.25.6v

Poprawki widoku **pianek** (PCV i pianki → Plansza pianka 5 mm) tak, żeby działały dokładnie jak plakaty wielkoformatowe, oraz drobna zmiana w **plakatach**. **Pliki PHP i `data/prices.json` bez zmian** — ceny pianek są te same co w 0.25.4v.

---

## 1. Pianki

- **Kafelki formatów pokazują sumę, nie cenę za sztukę.** Po kliknięciu ilości (3, 5, 10, 20 lub „Własna ilość”) przy każdym formacie widać kwotę za całą partię — np. przy 3 szt. A3 = 135,00 zł, A2 = 150,00 zł, B0 = 600,00 zł (cena za sztukę z odpowiedniego progu × ilość). Zniknęło „/szt.” — kwota wygląda tak samo jak w plakatach („75,00 zł”).
- **Grafika formatu nie znika.** Miniatura arkusza na kafelkach formatów gubiła się po kliknięciu ilości (kafelki były przebudowywane bez ponownego ozdobienia). Teraz zostaje po każdej zmianie ilości, formatu i produktu.
- **Cennik pod niebieską ramką jak w plakatach.** Zamiast dużej, zawsze rozwiniętej tabeli wszystkich formatów jest zwijany **„Cennik: A3 (30 × 42 cm)”** z tabelą *Nakład / Cena jednostkowa* (1 szt., 2–4 szt., 5–9 szt., od 10 szt.) dla wybranego formatu. Wiersz progu odpowiadającego wybranej ilości jest wyróżniony. Przy własnym wymiarze cennik pokazuje format rozliczeniowy (np. „Cennik: B2 (50 × 70 cm)”); przy zbyt dużym wymiarze cennik się chowa.
- Niebieska ramka odsyła teraz do „cennika poniżej”.

## 2. Plakaty

- Pod nazwą formatu **nie ma już rozmiaru w mm** (np. „420 × 594 mm”). W druku wielkoformatowym zostaje wymiar w nazwie (A2 (42 × 59 cm)); w druku cyfrowym i offsetowym pod nazwą (A4, A3…) pokazujemy wymiar w cm (np. „21 × 29,7 cm”), żeby kafelek nadal mówił, jak duży jest format. Nazwy w koszyku i w zamówieniu bez zmian (np. „format A4”).
- Dotyczy tylko plakatów; ulotki i druk cyfrowy pokazują dalej rozmiar w mm.

## Pliki
`js/app.js` (wersja 0.25.6v, widok pianek, formaty plakatów), `js/smart-forms.js` i `js/intelligent-configurator.js` (ponowne ozdobienie przebudowanych kafelków), `js/i18n.js` (EN), `assets/ux-clarity.css`, `index.html` (wersja zasobów `?v=0.25.6`). Testy: nowy `foam_poster_look_0256_browser.py`; zaktualizowane `foam_tiers_0254_browser.py`, `foam_caps_0243_browser.py`, `merge_0250_browser.py`.

## Wgrywanie
Wgraj całą paczkę i odśwież stronę klawiszami Ctrl+F5.
