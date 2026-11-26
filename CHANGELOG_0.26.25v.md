# Drukulator 0.26.25v

## Generator wizytówek — jak zaawansowany generator banerów: kolory, więcej układów, osobne rewersy

**Kolory wybierane tak samo jak w generatorze banerów**
- **18 gotowych zestawów kolorów** (te same palety co w banerach: „Granat i żółć”, „Czerwień i biel”, „Czerń i złoto”, „Mięta”, „Lawenda” …) — kafelek pokazuje tło, akcent i literę
  w kolorze tekstu;
- **własny kolor tekstu, akcentu i tła** (pole koloru) z przyciskiem **↺** „wróć do koloru z palety” (jak w banerach); wybór nowej palety zeruje kolory własne;
- gdy zmienisz tylko tło, kolor tekstu dobiera się sam, żeby był czytelny; akcent zlewający się z tłem zamienia się na kolor tekstu; tekst na kolorowym polu ma zawsze
  wystarczający kontrast;
- zastąpiło to dawne 12 próbek akcentu i wybór „białe / kolorowe / ciemne” — **stare zapisy projektów** (z 0.26.24v) wczytują się same: akcent + rodzaj tła zamieniają się
  na paletę i kolory własne, a „tło rewersu” na nowy wybór tła rewersu.

**12 układów awersu** (poziomo i pionowo; każdy jako miniatura z aktualnymi danymi): pasek z boku, **górny pasek**, kolorowy nagłówek, **dolny pasek** (dane kontaktowe na
kolorowym pasie), podział, **ukośny panel**, wyśrodkowana, minimalistyczna, narożnik, **ramka**, **znak i dane** (logo albo monogram w kółku obok nazwiska), **dwie kolumny**.
Wszystkie 12 układów mieszczą dane przykładowe w obu orientacjach z tekstem ≥ 5 pt.

**Osobne układy rewersu (6)** — wybierane niezależnie od awersu, każdy z miniaturą:
marka na środku, **kolorowy pas** (logo / nazwa na całej szerokości), **ramka**, **duży kod QR** (kafelek sam włącza kod QR), **dane kontaktowe** (znak, hasło i dane po lewej),
**pole na notatki** (linie do odręcznego wpisania np. terminu wizyty).
- **tło rewersu**: jak awers / kolor akcentu / białe;
- przy zadruku jednostronnym sekcja rewersu nie znika, tylko pokazuje krótką informację i przycisk **„Dodaj rewers (zadruk dwustronny)”** (przestawia formularz i cenę);
- przykładowe hasło blokuje „Użyj w zamówieniu” tylko w układach, które to hasło pokazują (np. nie w „polu na notatki”).

**Logo na ciemnym tle:** gdy logo jest ciemne, a tło (albo kolorowy panel) też ciemne, logo dostaje **białą zaokrągloną płytkę**; jasne logo na ciemnym tle i każde logo na jasnym
tle są rysowane bez płytki.

**Zmiany techniczne**
- `js/card-generator.js`: model kolorów `pal` + `custom {text, accent, bg}` (jak `E.effPalette` w banerach), `LAYOUTS` (12), `BACKS` (6), `drawLogoOn` (płytka pod logo),
  migracja starego zapisu w `applyRaw`; `getState()` zwraca teraz `pal`, `custom`, `backLayout`, `backBg` (zamiast `color`, `paper`, `back`; `setState` nadal przyjmuje stare pola);
- `assets/card-generator.css`: style palet i pól kolorów (korzysta z klas `.d24bg-pals`, `.d24bg-color`, `.d24bg-mini` z generatora banerów);
- `index.html`, `js/app.js`, `README.md`: wersja 0.26.25v.

**Testy:** `tests/card_generator_02624_browser.py` → `tests/card_generator_02625_browser.py` (149 sprawdzeń): 12 układów (piksele w kluczowych miejscach), palety i kolory własne
(↺, auto-kontrast, zlewający się akcent), migracja zapisu z 0.26.24v (także z pamięci przeglądarki po przeładowaniu), 6 układów rewersu i tło rewersu, kod QR w układzie „duży QR”,
płytka pod logo, „Dodaj rewers” przy zadruku jednostronnym, EN, telefon. `merge_0250_browser.py`: numer wersji. Test `banner_generator_02614_browser.py` nadal ma 4 nieaktualne
sprawdzenia PDF (dotyczą wyłączonego pełnego generatora banerów — bez zmian względem wcześniejszych wersji).

Paczka zawiera tylko pliki zmienione od 0.26.24v.
