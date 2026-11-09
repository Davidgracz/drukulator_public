# Drukulator 0.25.3v

Drobne zmiany po 0.25.2v: ważność linku do zamówienia, korekta dwóch cen obrazów na płótnie i koniec fałszywego ostrzeżenia „pozycja ze starszej wersji kalkulatora”. Wygląd strony bez zmian.

---

## 1. Link do zamówienia ważny 7 dni
- „Utwórz link do zamówienia” (koszyk → „Udostępnij to zamówienie”) tworzy teraz link **ważny 7 dni** (wcześniej 30 dni). W oknie z linkiem jest podana data wygaśnięcia, np. „Link jest ważny do 16.11.2026” — liczona przez serwer, więc zawsze zgodna z rzeczywistością.
- Po terminie link pokazuje komunikat „Ta wycena nie istnieje albo link już wygasł.”, a wygasłe wpisy są sprzątane automatycznie (jak dotąd).
- **Zmieniony plik PHP: `quote-share.php`** (jedna stała: `D24_SHARED_QUOTES_RETENTION_DAYS = 7`). Trzeba go wgrać na serwer razem z resztą paczki.
- Linki utworzone **przed** wgraniem tej wersji zachowują swój dotychczasowy termin (do 30 dni od utworzenia) — nowy termin dotyczy tylko nowych linków. Link do plików w mailu z zamówienia (48 godzin) bez zmian.

## 2. Ceny obrazów na płótnie — dwie korekty
- **80 × 80 cm: 305 zł → 185 zł** (wcześniej drożej niż 80 × 90 cm za 195 zł).
- **40 × 120 cm: 160 zł → 175 zł** (wcześniej tyle samo co 40 × 110 i taniej niż 30 × 120).
- W cenniku obrazów większy format nigdy nie kosztuje mniej niż mniejszy — pilnuje tego nowy test.
- **`data/prices.json` jest w paczce** (te dwie ceny; reszta bez zmian). Jeśli ceny były zmieniane w panelu edycji cen na serwerze, wgranie pliku je nadpisze — wtedy te dwie pozycje wystarczy poprawić w panelu.

## 3. Koniec ostrzeżenia „Jedna z pozycji pochodzi ze starszej wersji kalkulatora”
Serwer zgłaszał to ostrzeżenie przy wysyłce zamówienia dla każdej pozycji, w której brakowało danych technicznych (typu produktu). Dotyczyło to nie tylko starych koszyków — **dwa produkty z aktualnej wersji też nie przekazywały tych danych**: **X-baner** i **Komplet magnesy + naklejki taxi**. Zamówienie z tym produktem było odrzucane nawet tuż po obliczeniu ceny.
- X-baner, roll-upy i komplet taxi przekazują teraz typ produktu.
- **Każda pozycja dodana do koszyka** dostaje typ produktu (jeśli produkt nie ma własnego, jest to „other”), więc ostrzeżenie nie pojawi się dla żadnego nowego produktu.
- Koszyk zapisany w przeglądarce **przed** aktualizacją: X-banery, roll-upy i komplety taxi są uzupełniane automatycznie po wczytaniu strony (także przy otwarciu zamówienia z linku).
- Pozostałe pozycje bez typu (np. plakat, PCV, obraz dodane w bardzo starej wersji) **nadal** wymagają usunięcia i ponownego obliczenia — dla nich serwer musi znać wymiary i ilość, żeby sprawdzić limity. To jedyny przypadek, w którym ostrzeżenie może jeszcze się pojawić.
- Serwer (`send-order.php`) bez zmian — kontrola limitów zostaje.

## Pliki
`quote-share.php`, `data/prices.json`, `js/app.js` (typ produktu w koszyku, numer wersji), `index.html` (wersja zasobów `?v=0.25.3`), `assets/ux-clarity.css` (tylko komentarz). Testy: nowe `quote_share_prices_0253.test.cjs`, `cart_product_type_0253_browser.py` (sprawdza pozycje serwerowym walidatorem); `merge_0250_browser.py` (numer wersji).

## Wgrywanie
Po wgraniu odśwież stronę klawiszami Ctrl+F5. Wgraj całą paczkę, w tym **`quote-share.php`** (ważność linku), **`data/prices.json`** (dwie ceny) i `js/app.js` + `index.html` (koszyk).
