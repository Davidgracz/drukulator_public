# Drukulator 0.26.0v

**Kody promocyjne.** Pracownik tworzy kod w panelu, wybiera wysokość zniżki i okres ważności, a klient wpisuje go w koszyku. Zniżka widać w koszyku, w mailu do drukarni, w potwierdzeniu dla klienta i w szczegółach zlecenia w panelu. **Ta wersja zmienia pliki PHP i bazę danych** — patrz „Wgrywanie”.

---

## 1. Panel pracowniczy — zakładka „Kody promocyjne”

- **Nowy kod:** kod (3–32 znaki: litery bez polskich znaków, cyfry, „-”, „_”; wielkość liter nie ma znaczenia) albo przycisk **„Wygeneruj”** (np. `DRUK-7KQ4MX`), nazwa wewnętrzna (opcjonalnie), rodzaj zniżki **% albo zł**, wysokość.
- **Okres ważności:** daty „ważny od” i „ważny do” (do końca wskazanego dnia, czas strony). Szybkie przyciski: **Od dziś · Dziś + 7 / 14 / 30 dni · Bez ograniczenia czasu**. Puste „od” = działa od razu, puste „do” = bez końca.
- **Opcjonalnie:** minimalna wartość produktów (np. „od 100 zł”) i limit użyć (np. 50 zamówień). Pod formularzem jest podgląd zasady w jednym zdaniu.
- **Lista kodów** ze statusem (Aktywny / Zaplanowany / Wygasł / Wyczerpany / Wyłączony), zniżką, okresem, licznikiem użyć i sumą udzielonych zniżek. Przyciski: **Edytuj, Wyłącz/Włącz, Kopiuj kod, Usuń** (z potwierdzeniem; zamówienia, które użyły kodu, zostają bez zmian). Kodu nie da się zmienić po utworzeniu — wystarczy założyć nowy.
- **Uprawnienie:** administrator widzi zakładkę zawsze. Pracownik widzi ją po nadaniu nowego uprawnienia **„Kody promocyjne (tworzenie i edycja)”** (Panel → Pracownicy → edycja konta).
- W szczegółach zlecenia widać **użyty kod i kwotę zniżki**; kwota zlecenia jest już po zniżce.

## 2. Koszyk

- Pole **„Masz kod promocyjny?”** nad sumą. Po zastosowaniu: plakietka z kodem, zniżką i datą ważności oraz trzy linie: *Produkty brutto → Kod promocyjny −X zł → Produkty po zniżce*. Przycisk „Usuń” zdejmuje kod.
- **Zniżka obejmuje wartość produktów, nie dostawę.** Próg darmowej dostawy w Szczecinie (300 zł) liczy się **po zniżce**: produkty za 320 zł z kodem −10% to 288 zł, więc dostawa kosztuje 20 zł.
- Limit wartości zamówienia przez kalkulator (5 000 zł) sprawdzany jest **przed zniżką**.
- Kod jest zapamiętany w przeglądarce razem z koszykiem. Przy wczytaniu strony kalkulator sprawdza raz, czy kod nadal obowiązuje — jeśli wygasł albo został wyłączony, zdejmuje go i informuje o tym.
- Gdy wartość produktów spadnie poniżej minimum kodu, zniżka nie jest naliczana, a koszyk wyjaśnia dlaczego; po dodaniu produktów działa sama.
- Zniżka jest też w **tekście wiadomości do skopiowania** i w pliku **CSV** (wiersze „Produkty”, „Kod promocyjny …”, „RAZEM”).
- Wersja angielska bloku kodu.

## 3. Serwer (źródło prawdy)

- **`promo-validate.php`** (nowy) — sprawdza kod z koszyka. Tylko POST z tej samej strony. Dla kodu nieznanego, wyłączonego, jeszcze nieaktywnego, wygasłego i wyczerpanego zwraca **ten sam komunikat**, żeby nie dało się odgadywać, które kody istnieją. Limit: ok. 30 sprawdzeń na 10 minut z jednego adresu (błędny kod liczy się podwójnie).
- **`send-order.php`** — przy wysyłce **sprawdza kod od nowa** i liczy zniżkę po swojej stronie (przeglądarce nie ufa), potem atomowo **rezerwuje użycie** (limit użyć nie da się obejść dwoma równoczesnymi zamówieniami). Gdy poczta nie przyjmie wiadomości, użycie wraca. Jeśli kod w międzyczasie wygasł, klient dostaje komunikat, kod jest zdejmowany z koszyka i zamówienie można wysłać ponownie bez niego.
- Mail do drukarni: linie **KOD PROMOCYJNY** i **PRODUKTY PO ZNIŻCE**. Potwierdzenie dla klienta: ramka z kodem, zniżką i kwotą produktów po zniżce. Zdarzenie `promo_used` w monitoringu.
- Zamówienia (`order-status-lib.php`) zapisują `promo_code` i `discount`.

## 4. Przy okazji: poprawka zapisu zleceń

Przy zapisie zlecenia do bazy lista formatów była o jeden element za krótka, przez co **notatka wewnętrzna nowych zleceń zapisywała się jako „0”**. Poprawione; jednorazowo przy aktualizacji bazy „0” w notatkach starszych zleceń jest czyszczone (prawdziwe notatki zostają).

## Pliki
- **Nowe:** `promo-lib.php`, `promo-validate.php`.
- **Zmienione PHP:** `send-order.php`, `order-status-lib.php`, `staff-api.php`, `staff-panel.php`, **`staff-auth-lib.php`** (nowe uprawnienie).
- **Zmienione front:** `js/app.js` (0.26.0v), `js/i18n.js`, `assets/ux-clarity.css`, `index.html` (`?v=0.26.0`).
- **Testy:** nowe `promo_0260.py` (+ `promo_0260_harness.php`, `promo_0260_cases.json` — wspólna tabela przypadków dla PHP i JS), `promo_0260_browser.py`, `promo_staff_0260_browser.py`; dostosowany `merge_0250_browser.py`.

## Wgrywanie
1. Wgraj **całą paczkę** (w tym oba nowe pliki PHP i zmienione `staff-*.php`).
2. Baza zaktualizuje się **sama** przy pierwszym wejściu: tabela zamówień do wersji 1.4 (dwie nowe kolumny) i nowa tabela kodów. Dane starych zleceń zostają.
3. Odśwież stronę klawiszami Ctrl+F5. Zaloguj się do panelu jako administrator — zakładka „Kody promocyjne” pojawi się od razu. Pracownikom nadaj uprawnienie „Kody promocyjne”.
4. Na próbę utwórz kod `TEST10` (10%, bez limitu) i zamów jedną pozycję z kodem na własny adres e-mail.

Uwaga: kod PHP był sprawdzony testami na atrapie WordPressa (SQLite), nie na prawdziwym MySQL — dlatego warto zrobić próbne zamówienie z kodem tuż po wgraniu.
