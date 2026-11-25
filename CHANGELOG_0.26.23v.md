# Drukulator 0.26.23v

## Druk cyfrowy 24h — domyślnie jednostronny, naprawa przełączania zadruku po powrocie do 1–2 stron

**1. Jednostronny jako pierwszy wybór.** Formularz „Druk cyfrowy 24h” otwiera się z zadrukiem *Jednostronny* (najtańszy) i liczbą stron 1.
Dwustronny nadal jest drugim kafelkiem i zaczyna się od 2 stron. Po przełączeniu usługi i powrocie formularz znów startuje od jednostronnego.
Wyszukiwarka i asystent działają jak dotąd (zadruk z zapytania albo pytanie o zadruk).

**2. Błąd: kliknięcie jednostronny / dwustronny nie zmieniało ceny.** Gdy klient wpisał liczbę stron (3, 5, 17…) i wracał do 1 albo 2 stron,
kalkulator traktował to jako „świadomy wybór klienta” i przestawał dopasowywać liczbę stron do zadruku — oba kafelki pokazywały tę samą cenę,
a kliknięcia nic nie zmieniały. Teraz:
- ręcznie wpisane **1 albo 2 strony** to wartość startowa: kliknięcie *Jednostronny* ustawia 1 stronę, *Dwustronny* 2 strony (jak przy pierwszym
  otwarciu formularza), a ceny na kafelkach znów się różnią;
- liczba stron podniesiona przez kalkulator do minimum (np. wpisane 1 przy dwustronnym → 2) też jest wartością startową;
- **3 i więcej stron** wpisane przez klienta oraz liczba stron z wyszukiwarki zostają bez zmian po zmianie zadruku;
- wybrany kafelek zadruku zawsze pokazuje cenę aktualnej konfiguracji (np. przy 2 stronach jednostronnych — cenę 2 stron).

Cennik druku nie zmienił się: cena zależy od liczby stron i dopłaty do papieru, więc przy tej samej liczbie stron jednostronny i dwustronny na papierze
80 g kosztują tyle samo — różnica pojawia się przy zmianie liczby stron (1 ↔ 2) lub przy papierze z dopłatą.

**Cennik:** folia podłogowa (do 3 m² 140 zł, powyżej 3 do 10 m² 130 zł, powyżej 10 m² 120 zł) jest w cenniku od 0.26.20v.

**Zmiany w plikach:** `js/app.js`. Testy: nowy `tests/digital_return_pages_02623_browser.py` (prawdziwe wpisywanie z klawiatury); zaktualizowane
`digital_autopages_02610`, `digital_defaults_0266`, `digital_minpages_0268`, `digital_pages_0261` (nowy domyślny zadruk).

Paczka zawiera też zmiany z 0.26.22v (wysyłanie plików), jeśli nie były jeszcze wgrane.
