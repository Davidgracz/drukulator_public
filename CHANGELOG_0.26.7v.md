# Drukulator 0.26.7v

**Druk cyfrowy 24h: bindowanie nad foliowaniem i tylko dla papieru 80 g, rozmiar oprawy dobierany automatycznie do liczby kartek (klient go nie wybiera) oraz nowy cennik opraw z pojemnością.** Poprawki do 0.26.6v. **Zmieniły się pliki front-endu (JS / HTML / CSS) i `data/prices.json` — pliki PHP i baza danych bez zmian.**

---

## 1. Bindowanie jest pierwsze i działa tylko dla papieru 80 g
- W usłudze **Druk cyfrowy 24h** sekcja **„Bindowanie i oprawy” jest teraz nad „Foliowaniem”**.
- Obie sekcje działają tak samo: **bindowanie — tylko dla papieru 80 g, foliowanie — tylko dla papieru od 250 g.** Gdy wybrany papier się nie nadaje, sekcja zostaje na swoim miejscu, ale jest przygaszona i nieklikalna, a obok jej nazwy stoi napis **„Tylko dla papieru 80 g”** (bindowanie) albo **„Tylko dla papieru od 250 g”** (foliowanie; wcześniej „Tylko kreda od 250 g”). Po rozwinięciu przygaszonego pola widać to samo zdanie pod kafelkami.
- Zmiana papieru na nieodpowiedni **zeruje wybór** (jak dotąd przy foliowaniu): z 80 g na kredę znika oprawa, z kredy 250 g na 80 g znika folia. Bindowania i foliowania nie da się więc połączyć w jednym zamówieniu.
- Na starcie (papier „Standardowy 80 g”) dostępne jest bindowanie, a foliowanie jest przygaszone.

## 2. Rozmiar oprawy dobiera się sam — do liczby kartek w komplecie
Klient wybiera tylko **rodzaj oprawy**. **Rozmiar jest dobierany automatycznie: najmniejszy, który mieści wszystkie kartki jednego kompletu** — ani mniejszy (nie zmieści się), ani większy (droższy). Pole „Rozmiar oprawy / spirali” pokazuje wszystkie rozmiary z opisem „do N kartek”, **dobrany jest podświetlony i ma kwotę, pozostałe są przygaszone i nie da się ich kliknąć** (także klawiaturą). Pod polem widać zdanie „Kartek w jednym komplecie: 86. Rozmiar oprawy dobieramy automatycznie.”
- **Kartka = arkusz**: przy druku jednostronnym 1 strona = 1 kartka, przy dwustronnym 2 strony na kartce (nieparzysta ostatnia strona zajmuje całą kartkę). Przykład: 86 kartek → spirala plastikowa **do 14 mm** (do 90 kartek), spirala metalowa **do 12,7 mm** (do 90), oprawa zaciskowa **do 10 mm** (do 90); 91 kartek → spirala plastikowa do 19 mm.
- Rozmiar zależy od **jednego kompletu**; oprawa jest na każdy komplet (cena × liczba kompletów), jak dotąd.
- Zmiana liczby stron, zadruku, kompletów albo rodzaju oprawy od razu przesuwa podświetlenie.
- **Kalkulator liczy rozmiar sam** — nawet gdyby ktoś jakimś sposobem przekazał inny, zostanie on zignorowany, więc nie da się „wybrać najtańszej” oprawy, która się nie zmieści.
- **Za dużo kartek** (więcej niż mieści największy rozmiar tego rodzaju): żaden kafelek nie jest podświetlony, pod polem pojawia się czerwone zdanie „Kartek w jednym komplecie (500) jest więcej niż mieści ta oprawa (maks. 430). Wybierz inną oprawę albo skontaktuj się z nami.”, a przycisk „Oblicz cenę” pokazuje ten sam komunikat zamiast ceny.
- W nagłówku zwiniętej sekcji: np. „Bindowanie – spirala plastikowa, do 14 mm · +10,00 zł”. Na kafelkach rodzaju oprawy stoi cena całego zamówienia z dobranym rozmiarem. W koszyku i w zamówieniu opis ma dobrany rozmiar (np. „…, Bindowanie – spirala plastikowa 14 mm × 2”), a szczegóły wyceny — pojemność („14 mm (do 90 kartek) × 2 szt.”).

## 3. Nowy cennik opraw (druk cyfrowy)
Nowe ceny i pojemności według zamówienia (cena za oprawę jednego kompletu):

| Oprawa | Rozmiar | Do kartek | Cena |
|---|---|---|---|
| **Oprawa miękka zaciskowa** | do 5 mm | 40 | 12,50 zł |
| | do 10 mm | 90 | 14,50 zł |
| | do 13 mm | 110 | 17,50 zł |
| | do 16 mm | 145 | 20,50 zł |
| **Bindowanie – spirala plastikowa** | do 14 mm | 90 | 10 zł |
| | do 19 mm | 150 | 12 zł |
| | do 25 mm | 200 | 15 zł |
| | do 32 mm | 260 | 17 zł |
| | do 38 mm | 320 | 20 zł |
| | do 51 mm | 430 | 23 zł |
| **Bindowanie – spirala metalowa** | do 6,4 mm | 30 | 11 zł |
| | do 9,5 mm | 60 | 13 zł |
| | do 12,7 mm | 90 | 15 zł |
| | do 14,3 mm | 105 | 18 zł |

**Gdzie to jest w cenniku:** `data/prices.json` → `druk_cyfrowy_i_ksero` → `oprawy_ceny` (zł za oprawę) i `oprawy_pojemnosc_kartek` (do ilu kartek 80 g). Obie tabele widać i można zmieniać w edytorze cen („Oprawy w druku cyfrowym — cena” i „— pojemność”); rozmiary bez ceny albo bez pojemności są pomijane. Cenniki zapisane wcześniej na serwerze lub w przeglądarce **dostają te tabele przy wczytaniu**; jeśli już je mają (własne zmiany), nic nie jest nadpisywane.

## Założenia
- **„Oprawa prac” (osobna strona „Druk i oprawa prac”) zostaje bez zmian** — ma stary cennik (`oprawa_prac`, z oprawą kanałową i rozmiarami, których nie ma na nowej liście), bo nowa lista dotyczy druku cyfrowego. Dotąd obie strony korzystały z jednego cennika; teraz druk cyfrowy ma własny. Jeśli nowe ceny i dobór po kartkach mają działać także na stronie „Oprawa prac”, wystarczy powiedzieć.
- „Do 80 gram” rozumiem jako papier „Standardowy 80 g” (to jedyny 80-gramowy papier w tej usłudze).
- Rozmiary spirali / opraw, których nie ma na nowej liście (spirala plastikowa 12,5 i 16 mm, metalowa 4, 8 i 11 mm), w druku cyfrowym już się nie pojawiają.
- „Kartek” liczę jako arkusze w jednym komplecie (tak jak „liczba arkuszy” w wycenie), a pojemność dotyczy kartek 80 g.

## Pliki
- **Zmienione:** `js/app.js` (0.26.7v: kolejność sekcji, dostępność wg papieru, automatyczny dobór i blokada rozmiaru, komunikaty, wycena i opisy, migracja cennika, etykiety edytora cen), `js/calculators.js` (cennik i pojemności opraw, dobór rozmiaru, ograniczenie do papieru 80 g, komunikaty błędów), `js/i18n.js` (tłumaczenia), `assets/ux-clarity.css` (zablokowane pole rozmiaru, komunikaty), `index.html` (`?v=0.26.7`), `data/prices.json` (nowe tabele `oprawy_ceny`, `oprawy_pojemnosc_kartek`).
- **Bez zmian:** wszystkie pliki PHP, baza danych, cennik „Oprawy prac”.
- **Testy:** nowe `digital_bindings_0267.test.cjs` (kalkulator: wszystkie rozmiary na granicach pojemności, 86 kartek, kartki na komplet, ignorowanie przekazanego rozmiaru, za dużo kartek, tylko papier 80 g, własny cennik) i `digital_bindings_0267_browser.py` (kolejność sekcji, napisy w nagłówkach, podświetlenie i blokada, komunikat przy przekroczeniu, koszyk, migracja cennika, „Oprawa prac”, angielski, telefon i komputer); zaktualizowane `digital_layout_0263_browser.py`, `digital_pages_0261_browser.py`, `digital_pages_0261.test.cjs`, `digital_sets_0262.test.cjs` (nowe zasady: bindowanie i foliowanie się wykluczają, rozmiar dobierany) oraz `merge_0250_browser.py` (numer wersji).
