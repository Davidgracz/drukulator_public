# Drukulator 0.26.5v

**Ceny na kafelkach w „Restauracje, hotele” (podkładki, menu A3 offset, menu A3 laminowane), poprawione tłumaczenie na angielski oraz gotowy tekst do polityki prywatności.** Poprawki do 0.26.4v. **Zmieniły się tylko pliki front-endu (JS / HTML / CSS) — pliki PHP i baza danych bez zmian.**

---

## 1. Polityka prywatności — dane gromadzone podczas rejestracji
Polityka prywatności jest podstroną WordPressa (https://druk24.szczecin.pl/polityka-prywatnosci/), a nie częścią paczki kalkulatora, więc **tę zmianę trzeba wprowadzić w panelu WordPressa** (Strony → Polityka prywatności → §8 „Rodzaje gromadzonych danych”). Obecnie w sekcji jest tylko „Adres e-mail”. Gotowy tekst do wklejenia (lista punktowana pod nagłówkiem):

> **Dane gromadzone podczas rejestracji:**
> - Adres e-mail
> - Numer telefonu
> - Imię i nazwisko lub nazwa firmy

Sekcja „Dane gromadzone podczas zapisu do usługi Newsletter” (sam adres e-mail) zostaje bez zmian.

## 2. Restauracje, hotele — ceny na kafelkach
Kalkulator pokazuje cenę na kafelku wyboru tylko wtedy, gdy jest z czego wybierać (więcej niż jedna opcja). Podkładki na tackę, menu A3 offset i menu A3 laminowane mają jeden format, więc kafelek formatu był bez ceny. Teraz **cena stoi na kafelku formatu** i zmienia się razem z nakładem (i, w menu offsetowym, z wariantem jedno-/dwustronnym):

| Produkt | Kafelek formatu | Ceny |
|---|---|---|
| Podkładki na tackę | 40 × 30 cm | 500 szt. – 380 zł, 1000 szt. – 520 zł, 2500 szt. – 880 zł |
| Menu A3 offset preprint 90 g | A3 · 297 × 420 mm | jednostronnie 480 / 580 / 860 zł, dwustronnie 630 / 780 / 1090 zł (500 / 1000 / 2500 szt.) |
| Menu A3 laminowane | A3 · 297 × 420 mm | 10 szt. – 170 zł, 20 szt. – 320 zł, 30 szt. – 450 zł |

W menu A3 offset zostają też ceny na kafelkach wariantu (jednostronnie / dwustronnie). Pozostałe produkty tej strony (prezenter trójkątny, notesy kelnerskie, bloczki) mają ceny jak dotąd. Reguła dotyczy tylko strony „Restauracje, hotele” — inne strony katalogu wyglądają jak wcześniej.

## 3. Tłumaczenie na angielski
Przejrzałem całą ścieżkę zamówienia po angielsku (strona główna, wszystkie strony katalogu, konfigurator, koszyk, formularz, podsumowanie, asystent, tekst zamówienia) i poprawiłem to, co zostawało po polsku albo wychodziło koślawo:
- **ok. 200 nowych tłumaczeń** (m.in. „Koperty, teczki i papier firmowy” → „Envelopes, folders and letterhead paper”, „Kalendarze”, „Zobacz koszyk” → „View cart”, „Zamów online”, „Reklama i ekspozycja”, „NAJKORZYSTNIEJ” → „BEST VALUE”, „RAZEM BRUTTO” → „TOTAL INCL. VAT”, „Podsumowanie Twojego zamówienia”, opisy kalendarzy, kopert i teczek, limity wymiarów banerów i folii, teksty o dostawie, cenach i potwierdzeniu zamówienia),
- **wzorce zamiast pojedynczych zdań:** liczba mnoga i pojedyncza („1 product / 3 products”, „1 pc / 5 pcs”, „1 copy / 3 copies”, „1 item / 2 items”), „N / M plików” → „N / M files”, zdania „N szt. za X zł zamiast M szt. za Y zł”, „po 80 stron” → „80 pages each”, „folią 80 mikronów” → „80-micron film”,
- **angielski nie jest już psuty:** wcześniej zamiany słów robiły z angielskich zdań np. „do not” → „to not”; teraz tekst, który już jest po angielsku, zostaje bez zmian. Naprawiony też błąd, przez który „Materiały” wychodziło jako „Materialy” (a także formy typu „Ilości”, „Szerokości” — dopasowanie wyrazów ze znakami polskimi było wadliwe),
- **tekst wpisany przez klienta w asystencie** („chcę ulotki A6 dwustronne 500 sztuk”) nie jest już tłumaczony na wpół — zostaje tak, jak go klient napisał; przyciski z odpowiedziami są tłumaczone normalnie,
- „druk cyfrowy 24h” w środku zdania → „digital printing 24h” (było „printing digital 24h”).

Celowo po polsku zostaje tylko przycisk „Przełącz język na polski”.

## 4. Drobiazg w wersji polskiej
W etykiecie dostępności (`aria-label`) podsumowania była literówka — teraz „Podsumowanie Twojego zamówienia”.

## Pliki
- **Zmienione:** `js/i18n.js` (tłumaczenia, wzorce, dopasowanie całych wyrazów), `js/intelligent-configurator.js` (ceny na kafelku formatu w „Restauracje, hotele”), `js/app.js` (0.26.5v: numer wersji, tekst klienta w asystencie bez tłumaczenia), `index.html` (`?v=0.26.5`, literówka), `assets/ux-clarity.css` (komentarz z wersją).
- **Bez zmian:** wszystkie pliki PHP, `data/prices.json`, baza danych.
- **Testy:** nowe `restaurants_prices_0265_browser.py` (ceny na kafelkach trzech produktów dla każdego nakładu i wariantu, zgodność z wyceną, brak zmian na pozostałych stronach, telefon i komputer) oraz `english_0265_browser.py` (tłumaczenia i wzorce, angielski nie jest psuty, brak polskich liter na żadnej stronie katalogu w wersji EN); zaktualizowany `merge_0250_browser.py` (numer wersji).
