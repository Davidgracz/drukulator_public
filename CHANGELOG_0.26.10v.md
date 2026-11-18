# Drukulator 0.26.10v

**Druk cyfrowy 24h: gdy klient nie wpisał liczby stron, wybór zadruku sam ustawia ją na 1 (jednostronny) albo 2 (dwustronny).** Poprawka do 0.26.9v. **Zmienił się tylko front-end (JS / HTML / CSS) — pliki PHP, baza danych i `data/prices.json` bez zmian.**

---

## Co się zmieniło
W usłudze **Druk cyfrowy 24h**, w polu **Zadruk** (kafelki lub lista):

| Wybór zadruku | Liczba stron, gdy klient jej nie wpisał |
|---|---|
| **Jednostronny** | **1** |
| **Dwustronny** | **2** |

- „Klient nie wpisał liczby stron” oznacza: **pole jest puste** albo **zostaje w nim wartość ustawiona automatycznie** przez kalkulator (na starcie jest to 2 przy domyślnym dwustronnym). Zmiana zadruku w obie strony przestawia wtedy liczbę stron: 2 → 1 → 2 → 1…
- **Liczba wpisana przez klienta zostaje bez zmian** przy zmianie zadruku — także wtedy, gdy jest równa wartości domyślnej (np. klient wpisał „2” i przełączył na jednostronny: dalej jest 2). Wyjątek jak dotąd: **dwustronny wymaga minimum 2 stron**, więc wpisane „1” zostaje podniesione do 2 (reguła z 0.26.8v).
- Liczba stron z **wyszukiwarki / asystenta** (np. „2 strony A4 kolor jednostronnie”) jest traktowana jak wpisana przez klienta, więc późniejsza zmiana zadruku jej nie zmienia.
- **Kafelki zadruku pokazują cenę dla liczby stron, jaka zostanie ustawiona po kliknięciu**: gdy liczba jest automatyczna — kafelek „Jednostronny” pokazuje cenę 1 strony, a „Dwustronny” — 2 stron. Gdy klient wpisał własną liczbę, kafelki pokazują cenę dla niej.
- Po wyjściu z usługi i powrocie formularz zaczyna od nowa: dwustronny, 2 strony (wartość automatyczna).
- Podpowiedź pod polem („Druk dwustronny: minimum 2 strony.” / „Druk jednostronny: minimum 1 strona.”), komunikat kalkulatora i angielskie teksty — bez zmian.

## Założenia
- „Jeżeli nie wpisał klient żadnej liczby stron” rozumiem jako: pole puste albo nietknięte przez klienta (na starcie wypełnione domyślnymi 2 stronami). Gdyby miało działać tylko przy pustym polu (bez wartości domyślnej na starcie), to jest jedna zmiana — daj znać.
- Gdy klient wpisał 1 przy jednostronnym, a potem wybrał dwustronny (liczba rośnie do 2), powrót na jednostronny **nie** przywraca 1 — liczba została już raz wpisana przez klienta.
- Zmiana dotyczy wyłącznie usługi **Druk cyfrowy 24h** (tam jest wybór zadruku z polem „Liczba stron”).

## Pliki
- **Zmienione:** `js/app.js` (logika automatycznej liczby stron i cena kafelków zadruku), `index.html`, `assets/ux-clarity.css` (numer wersji).
- **Bez zmian:** wszystkie pliki PHP (w tym panel pracowniczy), baza danych, `data/prices.json`.
- **Testy:** nowy `digital_autopages_02610_browser.py` (kafelki i lista, puste pole, liczba wpisana z klawiatury, ceny kafelków, wyszukiwarka, reset po zmianie usługi, angielski; 1300 i 390 px); `merge_0250_browser.py` (numer wersji).
