# Drukulator 0.26.26v

## Generator wizytówek — rewers z listą usług (blok tekstu z punktorami)

Nowy, siódmy układ rewersu **„Lista usług”**:
- u góry znak firmy (logo albo nazwa firmy), pod nim **nagłówek listy** (domyślnie „Nasze usługi”, można zmienić albo usunąć) i **pozycje listy** — każda linia z pola
  „Usługi” to jedna pozycja (do 10 pozycji, do 400 znaków; puste linie są pomijane);
- **punktory** w kolorze akcentu przed każdą pozycją (pole „Punktory przed pozycjami”; po wyłączeniu lista jest zwykłym blokiem tekstu);
- długa pozycja zawija się do drugiej linii z wcięciem pod punktorem; wszystkie pozycje mają ten sam rozmiar pisma, a gdy lista jest długa, cała zmniejsza się razem
  (poniżej 5 pt „Użyj w zamówieniu” jest blokowane — „skróć treść albo usuń jedną linię”);
- działa poziomo i pionowo, z dowolnym tłem rewersu (jak awers / kolor akcentu / białe) i z opcjonalnym kodem QR (po prawej, a pionowo na dole);
- pola „Usługi” i nagłówka pojawiają się tylko po wybraniu tego układu, a pole „Hasło” znika (w tym układzie hasła nie ma);
- przykładowa lista usług blokuje „Użyj w zamówieniu” (komunikat: zamień na własną albo wybierz inny układ); pusta lista i pusty nagłówek — „Wpisz usługi…”, a podgląd
  wraca do układu „marka na środku”;
- teksty list zapisują się w przeglądarce razem z projektem; w wersji EN domyślna lista jest po angielsku („Graphic design …”).

**Zmiany techniczne**
- `js/card-generator.js`: `BACKS.services`, `servicesList()`, nowe pola stanu `services`, `servicesTitle`, `servicesBullets`; `flow()` obsługuje wcięcie (`indent`)
  i punktor (`bullet`) — można go użyć w kolejnych układach; walidacja w `problem()`;
- `assets/card-generator.css`: style pól listy usług;
- `index.html`, `js/app.js`, `README.md`: wersja 0.26.26v.

**Testy:** `tests/card_generator_02625_browser.py` → `tests/card_generator_02626_browser.py` (158 sprawdzeń; nowe: 7 miniatur rewersu, widoczność pól tylko w układzie „Lista usług”,
blokada przykładowej listy, liczenie punktorów na obrazie, przełącznik punktorów, pusta lista, limit 400 znaków, EN). `merge_0250_browser.py`: numer wersji.
Test `banner_generator_02614_browser.py` nadal ma 4 nieaktualne sprawdzenia PDF (bez zmian względem wcześniejszych wersji).

Paczka zawiera tylko pliki zmienione od 0.26.25v.
