# Drukulator 0.26.21v

**Generator banera tylko przy banerach.** Do tej pory panel „Generator banera” był pod formularzem całej strony „Folie i banery 24h”, także przy foliach (mat, błysk, laminat, OWH, transparentna, do podświetleń, podłogowa, z transferem). Teraz pokazuje się tylko dla materiałów typu **baner**: „Baner powlekany 510g” i „Baner siatka mesh”.

## Zasady
- **Co jest banerem:** każdy materiał, którego nazwa nie zaczyna się od „Folia” — tak samo odróżnia je kalkulator (min. krótszy bok 30 cm, brak min. dla folii). Nowy materiał o nazwie „Baner …” dodany w cenniku dostanie generator automatycznie; „Folia …” — nie.
- **Przełączenie na folię:** panel znika od razu (bez przeładowania strony), okno generatora jest zamykane, a **dołączony projekt jest wyłączany** — plik PDF z banerem nie trafi do zamówienia folii. Zapamiętany projekt (kolory, teksty) zostaje w przeglądarce.
- **Powrót na baner:** panel wraca; zgodę „Dołącz projekt do zamówienia” trzeba zaznaczyć ponownie (jest odznaczona po przejściu na folię).
- Działa też przy wejściu z wyszukiwarki lub asystenta (np. „folia mat 100x100 3 szt” → bez generatora, „baner mesh 150x100 2 szt” → z generatorem) oraz po przejściu na inną stronę i powrocie.
- Dodatkowe zabezpieczenie: przy folii funkcje modułu (`open`, `setAttach`, `getAttachFiles`) nie otwierają okna, nie dołączają projektu i nie oddają pliku do koszyka.

## Zmienione pliki
`js/banner-generator-simple.js`, `assets/banner-generator-simple.css` (reguła `[hidden]` dla panelu), `js/app.js` i `index.html` (numer wersji), test `tests/banner_generator_02619_browser.py` (nowa sekcja „I2”: banery/folie, przełączanie, koszyk, powrót, wyszukiwarka; łącznie 120 sprawdzeń, wszystkie zaliczone).
