# Drukulator 0.25.7v

Pięć kolejnych działów wygląda i działa jak **Ulotki 24h**: ceny na kafelkach zmieniają się razem z wybranym nakładem, jest „Porównaj warianty”, a dolny cennik zniknął. **Pliki PHP i `data/prices.json` bez zmian** — ceny są te same co w 0.25.6v.

Dotyczy: **Notesy i bloczki**, **Koperty, teczki i papier firmowy**, **Kalendarze**, **Restauracje, hotele**, **Śluby, wesela i imprezy**.

---

## 1. Wszystkie pięć działów

- **Ceny na kafelkach wariantu i formatu.** Pod nazwą wariantu i formatu widać kwotę dla aktualnego nakładu (jak w ulotkach). Po kliknięciu innego nakładu wszystkie kwoty przeliczają się od razu. Kwota przy kafelku jest dokładnie tą ceną, którą klient zobaczy po jego kliknięciu.
- **Zmiana wariantu lub formatu zachowuje nakład** (oraz format przy zmianie wariantu), jeśli dana kombinacja istnieje w cenniku. Wcześniej każde kliknięcie wracało do pierwszego formatu i pierwszego nakładu. Gdy kombinacji nie ma (np. inny zestaw nakładów), formularz wybiera pierwszą dostępną.
- **„Porównaj warianty”** — zwijany panel pod parametrami, taki jak w ulotkach: porównanie **nakładów**, **formatów** i **wariantów** (całkowita cena i cena za sztukę), z przyciskami „Wybierz wariant” i „Dodaj do koszyka”. „Dodaj do koszyka” ponownie liczy cenę w kalkulatorze i sprawdza, czy zgadza się z kartą.
- **Usunięty dolny cennik** („Cennik wybranego wariantu”) w Notesach, materiałach firmowych, kalendarzach i restauracjach. Opis wariantu (np. „Okładka kredowa 170 g, środek offset 80 g…”) zostaje w niebieskiej ramce.
- **Wersja angielska:** dopisane tłumaczenia nazw produktów i wariantów w tych działach (wcześniej np. „Papier firmowy” wychodziło jako „Paper firmowy”).
- Opisy w koszyku i zamówieniu bez zmian (np. „Bez okładki, format A4, 100 szt.”).

## 2. Koperty, teczki, papier firmowy

- **Koperty C5 i C6 wyglądają jak DL:** miniatura arkusza, rozmiar i cena. Rozmiary kopert są inne niż ulotek o tych samych nazwach: **DL 110 × 220 mm**, **C5 162 × 229 mm**, **C6 114 × 162 mm** (ulotka DL zostaje 99 × 210 mm).
- **Teczki** (jedno- i dwubigowe) mają miniaturę arkusza i ceny na kafelkach. W cenniku nie ma wymiarów teczek, więc rozmiaru nie podajemy — nie zgadujemy.
- **Papier firmowy** A4: miniatura i rozmiar 210 × 297 mm.

## 3. Kalendarze i restauracje

- Kalendarze: ceny na kafelkach wariantów (płaska / wypukła główka, folie) i formatów (A1, A2, B1, B2, A5, DL); format „Standard” nie ma wymiarów, więc bez miniatury.
- Restauracje: ceny na kafelkach wariantów (menu A3 jedno-/dwustronne, laminowane) i formatów (prezenter DL / A6); „40 × 30 cm” ma miniaturę w poziomie.

## 4. Śluby, wesela i imprezy

- Pakiety (zaproszenia): ceny na kafelkach dla wybranego nakładu 20 / 50 / 100.
- Plan stołów i dekoracja sali (cena za sztukę): kwoty na kafelkach = cena za sztukę × wpisana ilość; w porównaniu jest tryb **„Ilość”** (wpisywana ilość) oraz format i wariant.
- Przy wyborze wariantu bez dotychczasowego formatu (np. Folia + PCV nie ma A2) kafelek pokazuje cenę pierwszego dostępnego formatu — czyli tego, który zostanie wybrany po kliknięciu.
- **Zaproszenia składane**: pod „A5 do A6” i „2×DL do DL” jest rozmiar po rozłożeniu (148 × 210 mm, 198 × 210 mm) zamiast błędnego „99 × 210 mm” przy 2×DL.
- Nazwy, które same podają rozmiar w cm (np. „A2 (42×59 cm)”, „40 × 30 cm”), nie mają już drugiej linijki z rozmiarem w mm.
- **Poprawka starego błędu:** po przejściu z zaproszeń na plan stołów lub dekoracje zostawały kafelki nakładu 20 / 50 / 100, które nic nie robiły. Teraz ich nie ma — jest tylko pole „Ilość sztuk”.

## Pliki
`js/app.js` (wersja 0.25.7v, wspólny widok stron katalogowych, podgląd cen, Śluby), `js/intelligent-configurator.js` (ceny na kafelkach, miniatury C5/C6/teczek), `js/variant-comparison.js` („Porównaj warianty” dla nowych stron), `js/smart-forms.js` (rozmiar w nazwie nie jest powtarzany), `js/i18n.js` (EN), `assets/ux-clarity.css`, `index.html` (wersja zasobów `?v=0.25.7`). Testy: nowy `catalog_pages_look_0257_browser.py`; dostosowany `merge_0250_browser.py`.

## Wgrywanie
Wgraj całą paczkę i odśwież stronę klawiszami Ctrl+F5.
