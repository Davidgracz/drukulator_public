# Drukulator 0.26.8v

**Druk cyfrowy 24h: zamieniona kolejność wyboru „Jednostronny / Dwustronny” oraz wymuszone minimum stron — dwustronnie 2, jednostronnie 1.** Poprawki do 0.26.7v. **Zmieniły się pliki front-endu (JS / HTML / CSS) — pliki PHP, baza danych i `data/prices.json` bez zmian.**

---

## 1. Jednostronny i dwustronny zamienione miejscami
- W usłudze **Druk cyfrowy 24h**, w polu **Zadruk**, kafelki mają teraz kolejność: **Jednostronny, potem Dwustronny** (od 0.26.6v było odwrotnie).
- **Domyślnie wybrany zostaje „Dwustronny”** (to ustawienie z 0.26.6v). Zmieniła się tylko kolejność kafelków. Jeśli domyślnie ma być zaznaczony pierwszy kafelek (Jednostronny), to jest jedna zmiana w kodzie — daj znać.
- Tak samo zamienione jest pytanie asystenta przy wpisaniu np. „wydruk 100 stron A4 kolor”: **„Wydruk jednostronny czy dwustronny?”** z przyciskami „Jednostronny”, „Dwustronny” (po angielsku: „Single-sided or double-sided printing?”).
- Strona „Arkuszowanie 24h” i „Druk i oprawa prac” miały już Jednostronny jako pierwszy — bez zmian.

## 2. Minimalna liczba stron zależy od zadruku
| Zadruk | Minimum |
|---|---|
| **Dwustronny** | **2 strony** (1 kartka zadrukowana z obu stron) |
| **Jednostronny** | **1 strona** |

- **Pole „Liczba stron”**: pod polem stoi podpowiedź „Druk dwustronny: minimum 2 strony.” albo „Druk jednostronny: minimum 1 strona.” (po angielsku: „Double-sided printing: minimum 2 pages.” / „Single-sided printing: minimum 1 page.”). Atrybut `min` pola zmienia się razem z zadrukiem (2 / 1).
- **Na starcie** (domyślnie dwustronnie) w polu jest **2** strony (wcześniej 1).
- **Przełączenie na dwustronny przy 1 stronie podnosi liczbę stron do 2**; większa liczba (np. 7) zostaje bez zmian. Przełączenie na jednostronny niczego nie zmienia.
- **Wymuszanie przy wpisywaniu**: gdy klient wpisuje liczbę, niczego nie poprawiamy w trakcie pisania (żeby dało się wpisać np. „12”), tylko po zatwierdzeniu pola (Enter, Tab, kliknięcie obok, przycisk „Oblicz cenę”) — wartość mniejsza od minimum (także 0 i liczby ujemne) jest zamieniana na minimum. Puste pole nadal daje komunikat „Liczba stron musi być większa od zera.”.
- **Kalkulator jest ostatecznym strażnikiem**: wycena 1 strony dwustronnie jest odrzucana komunikatem **„Przy druku dwustronnym minimalna liczba stron to 2.”** (po angielsku: „For double-sided printing the minimum is 2 pages.”), więc nie da się obejść formularza (dotyczy też starszej funkcji liczącej „Druk cyfrowy”). Minimum dotyczy **stron jednego kompletu**, a nie liczby kompletów.
- **Kafelki zadruku** pokazują cenę zamówienia: kafelek „Dwustronny” przy wpisanej 1 stronie pokazuje cenę dla 2 stron (bo tyle zostanie ustawione po kliknięciu), a nie brak ceny.
- **Wyszukiwarka / asystent**: „1 strona A4 kolor” (bez słowa „dwustronny”) trafia do formularza jako **jednostronny**; jeśli klient wprost wpisze „dwustronny” przy 1 stronie, formularz ustawia **2 strony** (tak samo jak ręczna zmiana).

## Założenia
- „Zamieniamy wybór jedno- i dwustronnie miejscami” rozumiem jako zamianę **kolejności kafelków**; domyślny wybór (Dwustronny) zostaje, bo został zamówiony w 0.26.6v i nie prosiłeś o jego zmianę.
- Minimum 2 stron przy dwustronnym i 1 przy jednostronnym dotyczy tylko usługi **Druk cyfrowy 24h** (tam jest wybór zadruku z polem „Liczba stron”). „Ksero i druk”, „Dla studentów 24h”, skanowanie i „Ksero książki” nie mają wyboru zadruku, więc bez zmian.

## Pliki
- **Zmienione:** `js/app.js` (0.26.8v: kolejność kafelków, minimum stron w polu i podpowiedź, podnoszenie do minimum, cena kafelków zadruku, pytanie asystenta, wyszukiwarka), `js/calculators.js` (`getDigitalMinPages`, komunikat „minimalna liczba stron”, sprawdzenie w `calculateDigitalPrint` i `calculateDigital`), `js/i18n.js` (tłumaczenia EN), `index.html`, `assets/ux-clarity.css` (numer wersji).
- **Bez zmian:** wszystkie pliki PHP, baza danych, `data/prices.json`.
- **Testy:** nowe `digital_minpages_0268.test.cjs` (kalkulator) i `digital_minpages_0268_browser.py` (formularz, wpisywanie, kafelki, wyszukiwarka, EN); zaktualizowane `digital_defaults_0266_browser.py`, `digital_pages_0261_browser.py`, `digital_pages_0261.test.cjs` (1 strona dwustronnie nie jest już dozwolona), `merge_0250_browser.py` (numer wersji).
