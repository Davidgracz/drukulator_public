# Drukulator 0.26.6v

**Druk cyfrowy 24h: dwustronny zadruk jest pierwszy i domyślny, a foliowanie ma rodzaje „Brak / Z folią soft skin / Z folią błysk / Z folią mat”.** Poprawki do 0.26.5v. **Zmieniły się tylko pliki front-endu (JS / HTML / CSS) — pliki PHP, baza danych i ceny (`prices.json`) bez zmian.**

---

## 1. Zadruk: dwustronny pierwszy i domyślnie wybrany
W usłudze **Druk cyfrowy 24h** pole „Zadruk” ma teraz kolejność **Dwustronny, Jednostronny** i po wejściu na stronę (oraz po przełączeniu usługi i powrocie) zaznaczony jest **dwustronny**. Klient, który chce jednostronny, klika drugi kafelek — wycena działa jak dotąd.
- Asystent zamówień pyta teraz „Wydruk dwustronny czy jednostronny?” z dwustronnym na pierwszym miejscu. Jeśli klient wpisze wprost „jednostronny” (albo „dwustronny”), jest tak, jak napisał; gdy w opisie nie ma ani jednego, ani drugiego, szybka wycena zakłada dwustronny (w podsumowaniu widać to słowami, więc klient to zobaczy).
- **Bez zmian:** „Arkuszowanie 24h” (zostaje domyślnie jednostronny), wizytówki i pozostałe produkty — ich domyślne wartości nie były w zleceniu.

## 2. Foliowanie: rodzaj folii
W rozwijanej sekcji „Foliowanie” pole **„Rodzaj folii”** ma teraz opcje w tej kolejności:
1. **Brak**
2. **Z folią soft skin**
3. **Z folią błysk**
4. **Z folią mat**

Te same nazwy są w nagłówku zwiniętej sekcji (np. „Z folią mat · +30,00 zł”), w wycenie („Foliowanie: Z folią mat”), w opisie pozycji w koszyku i w zamówieniu („…, 40 str., z folią mat”) oraz po angielsku („With soft-skin film / With gloss film / With matt film”). Foliowanie nadal działa tylko dla kredy od 250 g (cieńszy papier zeruje wybór) i jest liczone od liczby arkuszy.

**Ceny bez zmian:** soft skin 2,00 zł, błysk 1,50 zł, mat 1,50 zł za arkusz A4 (A3 = 2 × A4). W cenniku (`druk_cyfrowy_i_ksero` → `foliowanie`) klucze zostają `Satyna`, `Błysk`, `Mat`, więc zapisane cenniki działają bez migracji; „Satyna” = folia soft skin (dopisałem to w nagłówku tej tabeli w edytorze cen).

## Założenia
- „Druk cyfrowy” to usługa **Druk cyfrowy 24h** (tam są dwa zadruki i foliowanie); dwustronny jako domyślny wprowadziłem tylko tam i w pytaniu asystenta o wydruk. Jeśli to samo ma być w „Ksero i druk” czy „Arkuszowaniu 24h”, wystarczy powiedzieć.
- Dwustronny nie zmienia ceny druku (liczona od liczby stron), za to zmniejsza liczbę arkuszy, więc papier kredowy i foliowanie wychodzą taniej niż przy jednostronnym.

## Pliki
- **Zmienione:** `js/app.js` (0.26.6v: kolejność i domyślny zadruk, nazwy folii w formularzu / nagłówku / zamówieniu, pytanie asystenta, szybka wycena), `js/calculators.js` (nazwy i kolejność rodzajów folii), `js/i18n.js` (nowe tłumaczenia), `index.html` (`?v=0.26.6`), `assets/ux-clarity.css` (komentarz z wersją).
- **Bez zmian:** wszystkie pliki PHP, `data/prices.json`, baza danych.
- **Testy:** nowy `digital_defaults_0266_browser.py` (kolejność i domyślny zadruk, wycena, powrót po zmianie usługi, Arkuszowanie bez zmian, nazwy i kolejność folii w kafelkach / nagłówku / wycenie, ceny folii bez zmian, EN, asystent); zaktualizowane testy, które zakładały jednostronny jako domyślny, oraz `merge_0250_browser.py` (numer wersji).
