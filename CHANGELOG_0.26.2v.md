# Drukulator 0.26.2v

**Druk cyfrowy 24h: komplety, stały układ foliowania i opraw, ceny na kafelkach.** Poprawki do 0.26.1v. **Pliki PHP i baza danych bez zmian** — wystarczy podmienić pliki front-endu.

---

## 1. Ilość kompletów
- Nowe pole **„Ilość kompletów”** obok „Liczby stron” (domyślnie 1). **Komplet = jeden egzemplarz całego dokumentu**: np. 40 stron × 3 komplety = 120 zadrukowanych stron.
- Cena druku liczona jest od **wszystkich stron** (strony × komplety), więc próg cenowy (1–20 / 21–100 / 101–500 / 501+) obejmuje cały nakład. Dwustronnie każdy komplet ma własne arkusze (`ceil(strony / 2)` na komplet): 5 stron × 2 komplety = 6 arkuszy, nie 5.
- Papier i foliowanie liczone są od liczby arkuszy wszystkich kompletów (A3 = 2 × A4).
- Pod polami: „Potrzebne arkusze A4: 40 (20 na komplet)” oraz krótkie wyjaśnienie, czym jest komplet.
- Przykład: 40 stron, kolor, dwustronnie, kreda 130 g, **2 komplety** = 80 stron × 2,50 zł + 40 arkuszy × 0,30 zł = **212 zł**.
- W wycenie: „Ilość kompletów”, „Łącznie stron”, „Liczba arkuszy”; w opisie pozycji w koszyku: „… 40 str. × 3 kompl. …”. Pole kompletów jest teraz też polem „nakładu” w podpowiedzi „Sprawdź większy nakład”.

## 2. Oprawa na każdy komplet — bez „Liczby opraw”
Pole **„Liczba opraw” zostało usunięte**. Każdy komplet dostaje własną oprawę, więc liczba opraw = ilość kompletów (cena oprawy = cena wybranego rozmiaru × komplety). Pod „Ilością kompletów” podpowiedź zmienia się na „Każdy komplet dostaje własną oprawę.”, gdy wybrano oprawę.

## 3. Stały układ — kafelki się nie przesuwają
- **Układ 2 × 2 jest zawsze taki sam:** *Foliowanie | Rodzaj folii* oraz *Bindowanie i oprawy | Rozmiar oprawy / spirali*. Wcześniej pola „Rodzaj folii” i „Rozmiar…” pojawiały się dopiero po wyborze, przez co „Bindowanie i oprawy” przeskakiwało do następnego wiersza.
- Dopóki po lewej wybrane jest „Brak”, pole po prawej jest **przygaszone** (bez zaznaczenia i bez kwot, ale kafelki mają ten sam rozmiar; nie da się ich kliknąć ani wejść na nie klawiaturą). Przy „Bindowanie i oprawy: Brak” w miejscu rozmiarów jest podpowiedź „Najpierw wybierz rodzaj oprawy.”.
- **Zaznaczenie nie rusza kafelka.** Dotąd wybrany kafelek miał zaznaczenie ✓ w układzie, które dokładało 4 px wysokości i przesuwało tekst o 2 px, a miejsce na ✓ było tylko na wybranym, więc długa nazwa (np. „Bindowanie – spirala plastikowa”) zawijała się inaczej niż na niewybranych. Teraz miejsce na ✓ jest na wszystkich kafelkach, a ✓ nie zmienia wysokości. **Ta poprawka dotyczy kafelków na wszystkich stronach kalkulatora.**

## 4. Ceny na kafelkach
Kwoty (cena całego zamówienia po wyborze danej opcji, jak przy formacie, zadruku i papierze) są teraz także na kafelkach: **Foliowanie** (Brak / Jednostronne / Dwustronne), **Rodzaj folii** (Satyna / Błysk), **Bindowanie i oprawy** (z bieżącym rozmiarem, a gdy go nie ma w nowym rodzaju — z pierwszym z listy) oraz **Rozmiar oprawy / spirali**. Kwoty uwzględniają liczbę stron, komplety, papier i pozostałe wybrane opcje.

## Pliki
- **Zmienione:** `js/app.js` (0.26.2v), `js/calculators.js` (`calculateDigitalPrint` przyjmuje `sets`; liczba opraw = komplety), `js/intelligent-configurator.js` (ceny na kafelkach), `js/i18n.js`, `assets/ux-clarity.css`, `index.html` (`?v=0.26.2`).
- **Testy:** nowe `digital_sets_0262.test.cjs` (11 przypadków kalkulacji kompletów), `digital_layout_0262_browser.py` (pozycje kafelków przy każdej zmianie wyboru na komputerze i telefonie, ceny na kafelkach, brak „skoku” tekstu po zaznaczeniu, EN); dostosowane `digital_pages_0261.test.cjs`, `digital_pages_0261_browser.py`, `merge_0250_browser.py`.

## Wgrywanie
Wgraj paczkę (PHP bez zmian; własnego `data/prices.json` z serwera nie trzeba nadpisywać). Odśwież stronę klawiszami Ctrl+F5.

## Przyjęte założenia (do potwierdzenia)
1. „Rodzaj foliowania” zrozumiałem jako kafelki **Foliowanie** (jedno-/dwustronne) i **Rodzaj folii** (satyna/błysk) — kwoty są na obu; do tego dodałem je na kafelkach rodzaju oprawy.
2. **Jedna oprawa na komplet** — jeśli klient chce np. jedną oprawę na kilka kompletów, kalkulator tego nie obsługuje (po usunięciu pola „Liczba opraw”).
3. Kwota na kafelku rodzaju foliowania przy „Brak” po prawej jest ukryta, bo nie ma jeszcze wybranego foliowania.
