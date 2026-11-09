# Drukulator 0.25.1v

Drobne poprawki do 0.25.0v — katalog odzieży, kamizelki i czapki. Wygląd strony, układ i pozostałe produkty bez zmian. **Pliki PHP bez zmian.**

---

## 1. Koszulki, bluzy, polo — dane z katalogu Malfini
Dla modeli, które miały w tabelce „Do potwierdzenia”, wpisane są prawdziwe dane ze sklepu Malfini (gramatura, materiał, rozmiary, lista kolorów):

| Model | Gramatura | Materiał | Rozmiary | Kolorów |
|---|---|---|---|---|
| Fantasy 124 | 150 g/m² | 100% poliester | S–3XL | 17 |
| Chance (GRS) 810 | 140 g/m² | 100% poliester z recyklingu | S–3XL | 6 |
| Pixel P81 | 130 g/m² | 100% poliester | S–4XL | 5 |
| Pique Polo 203 | 200 g/m² | 65% bawełna, 35% poliester* | S–5XL | 37 |
| Cotton 212 | 170 g/m² | 100% bawełna* | S–3XL | 16 |
| Single J. 202 | 180 g/m² | 100% bawełna* | S–3XL | 22 |
| Essential 406 | 300 g/m² | 65% bawełna, 35% poliester | S–3XL, dziecięce 146–158 cm | 15 |
| Trendy Zipper 410 | 300 g/m² | 65% bawełna, 35% poliester | S–3XL | 15 |
| Cape 413 | 320 g/m² | 65% bawełna, 35% poliester | S–3XL | 21 |

\* skład może się nieznacznie różnić w kolorach melanżowych — pod tabelką pojawia się o tym krótka uwaga.

- **Link „Zobacz produkt w katalogu Malfini”** prowadzi teraz do strony **konkretnego modelu** (np. `…/product/fantasy-124`) i od razu otwiera **wybrany kolor** (`?color=…`) — dla wszystkich modeli (koszulki, polo, bluzy, czapki, torby, kamizelka Malfini). Link do Polstar (Brixton Flash) bez zmian.
- **Kolory poliestrów (i polo, bluz, czapek)** — każdy model ma własną listę kolorów z katalogu (kody i nazwy Malfini), więc zdjęcia ładują się dla każdego koloru. Wcześniej wszystkie modele używały listy kolorów od modelu Basic, której część kodów nie istnieje w poliestrach.
- **Basic 160 g:** w podglądzie „Koszulka bawełniana · 160 g” — bez słowa „unisex”.
- Poprawki przy okazji (dane katalogowe): Heavy New — rozmiary XS–5XL (było XS–3XL); Slim Fit V-neck — własna lista kolorów (poprzednia zawierała kolor, którego ten model nie ma).

## 2. Kamizelki odblaskowe
Liczone jak koszulki: **cena kamizelki + nadruki**.
- Brixton Flash — **25 zł**, Malfini Rimeck — **35 zł** (za sztukę, bez nadruku).
- Nadruk z przodu: **Do 10x15 cm** lub **Brak**.
- Nadruk z tyłu: **Do 10x15 cm**, **Do 20x30 cm** lub **Brak**.
- Co najmniej jeden nadruk musi być wybrany (domyślnie: przód Do 10x15 cm).
- Ceny nadruków i rabaty ilościowe — z cennika „Sam nadruk” (Do 10x15 cm — 15 zł, Do 20x30 cm — 20 zł; rabaty 6/10/20/30/50 szt.), tak jak w koszulkach. Domyślny wariant daje te same kwoty co dotąd: 25 + 15 = 40 zł i 35 + 15 = 50 zł.
- Zakres dostępnych nadruków jest zapisany w cenniku (`dostepne_nadruki`), a kalkulator odrzuca nadruk spoza zakresu.

## 3. Czapki
- **Nowa: Czapka dziecięca** (Malfini 6P Kids, 12 kolorów) — **45 zł**, jak pozostałe czapki: cena z jednym nadrukiem z przodu.
- Czapka bejsbolówka — **50 zł** (było 55 zł), Czapka raperka — **55 zł** (bez zmian).
- Link do konkretnego modelu: 6P (bejsbolówka), Rap 5P (raperka), 6P Kids (dziecięca); gramatura 340 g/m², materiał 100% bawełna, rozmiar regulowany — widoczne w tabelce. Bejsbolówka ma teraz 26 kolorów z katalogu (było 4).

## 4. Adres e-mail
W kodzie kalkulatora jest tylko adres **biuro@druk24.szczecin.pl** (kliknięcie e-maila na stronie i w kalkulatorze otwiera nową wiadomość do biura). Zgłoszony adres z domeny iCloud nie występuje w żadnym pliku paczki — to nie jest ustawienie kalkulatora, tylko prawdopodobnie adres nadawcy (konto/alias) w programie pocztowym, który otwiera się po kliknięciu.

## Pliki
`js/malfini-preview.js`, `js/app.js` (wersja 0.25.1v, wybór nadruków dla kamizelek, migracja starych cenników), `js/calculators.js` (walidacja zakresu nadruków), `js/i18n.js` (EN opisów czapek), `data/prices.json` (kamizelki, czapki), `index.html` (wersja zasobów `?v=0.25.1`), `assets/ux-clarity.css` (tylko komentarz). Testy: nowe `apparel_0251_browser.py`, `apparel_print_limits_0251.test.cjs`; dostosowane testy zależne od starych cen kamizelek i „unisex”.

## Wgrywanie
Po wgraniu odśwież stronę klawiszami Ctrl+F5. **Wgraj też `data/prices.json`** (nowe ceny kamizelek i czapek). Jeśli ktoś wcześniej zapisał cennik w panelu edycji cen w swojej przeglądarce, kalkulator sam przelicza stare kamizelki i dodaje czapkę dziecięcą; zapisaną ręcznie cenę bejsbolówki 55 zł zamienia na 50 zł.
