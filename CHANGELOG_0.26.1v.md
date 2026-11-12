# Drukulator 0.26.1v

**Druk cyfrowy 24h: liczba stron, foliowanie, bindowanie i oprawy.** Zmiany dotyczą tylko usługi „Druk cyfrowy 24h” na stronie „Druk cyfrowy i ksero 24h” oraz wyszukiwarki. **Pliki PHP i baza danych bez zmian** — wystarczy podmienić pliki front-endu i `data/`.

---

## 1. Wyszukiwarka
Hasła **cyfra, cyfrowy, cyfrowa, cyfrowe, cyfrowo, cyfrowych, digital, wydruk cyfrowy, druki cyfrowe, cyfrowy wydruk** (i kilka pokrewnych: „wydruk z bindowaniem”, „druk z foliowaniem”, „liczba stron”) prowadzą do „Druku cyfrowego i ksero 24h”. Zapytania o konkretny produkt zostają przy swoich stronach („wizytówki cyfrowe” → Wizytówki, „plakat cyfrowy” → Plakaty). Frazy dopisane są w `data/search-terms.json`, więc działają u wszystkich; edytor słownika w panelu administratora pokazuje je jak pozostałe.

## 2. Liczba stron zamiast kartek
- Pole **„Liczba kartek” → „Liczba stron”**. Pod polem widać na bieżąco **„Potrzebne arkusze A4: N”**.
- **Jednostronnie:** 1 strona = 1 arkusz. **Dwustronnie:** 2 strony na arkusz, czyli `ceil(strony / 2)` arkuszy (nieparzysta ostatnia strona zajmuje cały arkusz; pustego tyłu nie liczymy jako druku).
- **Cena druku** = liczba stron × mnożnik formatu (A3 = 2) × cena z progu (1–20 / 21–100 / 101–500 / 501+, próg liczony od liczby zadrukowanych stron). **Dopłata za papier** = liczba arkuszy × mnożnik formatu × dopłata.
- Przykład: 40 stron kolor, dwustronnie, kreda 130 g, A4 → 20 arkuszy; druk 40 × 2,50 zł = 100 zł + papier 20 × 0,30 zł = 6 zł → **106 zł**. Dawniej to samo pole oznaczało kartki, więc „40 kartek” dwustronnie dawało 80 zadrukowanych stron — teraz klient wpisuje liczbę stron dokumentu.
- W wycenie, opisie pozycji w koszyku, jednostce przy ilości i w asystencie wyceny („Ile stron potrzebujesz?”) jest teraz „str.”. Arkuszowanie, Ksero i druk, Ksero książki, Dla studentów i Skanowanie liczą jak dotąd.

## 3. Papier kolorowy i etykietowy usunięte
Nie ma ich już na liście papierów (ani przy druku czarno-białym, ani kolorowym) i w cenniku (`doplaty_do_papieru`). Starsze cenniki zapisane na serwerze lub w przeglądarce są przy wczytaniu automatycznie czyszczone z tych dwóch pozycji.

## 4. Foliowanie
Nowe pole **Foliowanie: Brak / Jednostronne / Dwustronne** i po wyborze **Rodzaj folii: Satyna / Błysk**. Ceny za arkusz A4 (arkusz A3 = 2 × A4):

| | Satyna | Błysk |
|---|---|---|
| Jednostronne | 2,00 zł | 1,50 zł |
| Dwustronne | 2,50 zł | 2,00 zł |

Cennik jest w `data/prices.json` → `druk_cyfrowy_i_ksero.foliowanie` i można go zmieniać w edytorze cen (sekcja „Foliowanie wydruków”). Starsze, zapisane wcześniej cenniki dostają te ceny domyślnie; własne zmiany nie są nadpisywane.

## 5. Bindowanie i oprawy
Nowe pole **Bindowanie i oprawy: Brak / Oprawa miękka zaciskowa / Bindowanie – spirala plastikowa / Bindowanie – spirala metalowa** — jak w „Oprawie prac”, **bez oprawy kanałowej**. Po wyborze pojawiają się **rozmiar oprawy / spirali** i **liczba opraw** (domyślnie 1). Cena oprawy = cena wybranego rozmiaru × liczba opraw (te same ceny co w „Oprawie prac”; nie zależy od liczby stron).

## 6. Wycena i koszyk
Wycena pokazuje: liczbę stron, liczbę arkuszy, format, zadruk, papier, próg cenowy oraz — gdy wybrano — foliowanie i oprawę z osobnymi kwotami (druk i papier / foliowanie / oprawa). Opis pozycji w koszyku: np. „Druk cyfrowy 24h, Kolorowy, 40 str., foliowanie dwustronne satyna, Bindowanie – spirala metalowa 8 mm × 3”. Wersja angielska nowych pól i opisów.

## Pliki
- **Zmienione:** `js/app.js` (0.26.1v), `js/calculators.js` (nowa `calculateDigitalPrint`, `getDigitalBindingTypes`), `js/i18n.js`, `assets/ux-clarity.css`, `index.html` (`?v=0.26.1`), `data/prices.json`, `data/search-terms.json`.
- **Testy:** nowe `digital_pages_0261.test.cjs` (18 przypadków kalkulacji), `digital_pages_0261_browser.py` (formularz, foliowanie, oprawy, koszyk, wyszukiwarka, migracja cennika, EN, telefon); dostosowany `merge_0250_browser.py`.

## Wgrywanie
Wgraj całą paczkę (PHP bez zmian). Jeśli na serwerze był edytowany `data/prices.json` i nie chcesz go nadpisywać, **zostaw swój plik** — kalkulator sam dopisze brakujące ceny foliowania i usunie dwa wycofane papiery. Odśwież stronę klawiszami Ctrl+F5.

## Przyjęte założenia (do potwierdzenia)
1. **Foliowanie liczone za arkusz fizyczny** (przy druku dwustronnym 40 stron = 20 arkuszy, więc 20 × cena), A3 = 2 × A4. Jeśli ceny miały dotyczyć strony lub sztuki — wystarczy zmienić liczbę w cenniku albo napisać, a przestawię wzór.
2. **Oprawa liczona za sztukę oprawy**, niezależnie od liczby stron; liczbę opraw podaje klient. Kalkulator nie sprawdza, czy dany grzbiet/spirala pomieści tyle stron (tak jak w „Oprawie prac”).
3. **Foliowanie i oprawy dodane tylko do usługi „Druk cyfrowy 24h”** (nie do „Ksero i druk”, „Dla studentów”, „Arkuszowania”).
4. Dwustronnie próg cenowy liczony jest od zadrukowanych stron (nie od arkuszy).
