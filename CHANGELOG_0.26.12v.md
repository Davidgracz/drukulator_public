# Drukulator 0.26.12v

**Linki do zamówienia bez komunikatu o „starszej wersji kalkulatora”, nowy przedział cen druku czarno-białego oraz zamiana pól „Ilość sztuk” i „Liczba stron”.** Poprawki do 0.26.11v. **Zmieniły się pliki front-endu (JS / HTML / CSS), `data/prices.json` i `send-order.php` — baza danych bez zmian.**

---

## 1. Koniec z komunikatem o „starszej wersji kalkulatora”
Problem: po otwarciu linku do zapisanego zamówienia (np. `…/drukulator/?q=KYKACH242GP9`) pozycje zapisane we wcześniejszych wersjach (bez zapisanych parametrów produktu) były oznaczane jako „ze starszej wersji kalkulatora”, a zamówienia z nimi **nie dało się wysłać**.

Teraz:
- **Nie ma już żadnych komunikatów** o starszej wersji: ani żółtego ostrzeżenia nad koszykiem, ani dopisku przy pozycji, ani przycisku „Oblicz ponownie”, ani komunikatu przy wysyłaniu.
- **Zamówienie z takimi pozycjami da się wysłać** — pozycje idą tak, jak zostały zapisane w linku (cena, opis i szczegóły bez zmian).
- **Serwer (`send-order.php`) też ich nie odrzuca.** Pozycje bez typu produktu nie mają zapisanych parametrów, więc dla nich serwer nie sprawdza limitów (wymiarów, nakładu) — zamówienie i tak każdorazowo potwierdza drukarnia.
- Statystyki: w panelu pracowniczym (Analityka → Błędy wysyłki) nie będzie już nowych wpisów „Pozycja ze starszej wersji kalkulatora”; stare wpisy zostają w historii.

## 2. Druk cyfrowy 24h — nowy przedział cen czarno-białych
Dotychczasowy przedział „21–100 stron” (0,50 zł) został rozdzielony na dwa:

| Przedział (stron) | Cena za stronę czarno-białą |
|---|---|
| 1–20 | 1,00 zł (bez zmian) |
| **21–50** | **0,80 zł** |
| **51–100** | **0,50 zł** |
| 101–500 | 0,30 zł (bez zmian) |
| 501+ | 0,20 zł (bez zmian) |

- Próg liczy się jak dotąd od **wszystkich zadrukowanych stron** (strony × sztuki × mnożnik formatu: A3 = 2 × A4), więc np. 10 stron × 3 sztuki = 30 stron → 0,80 zł.
- **Kolorowy druk cyfrowy bez zmian** (jeden przedział 21–100).
- Zmiana obejmuje też **„Druk i oprawę prac”**, bo ta usługa liczy druk z tej samej tabeli cen druku cyfrowego.
- **„Ksero i druk” zostaje bez zmian** (ma własną, osobną tabelę z przedziałem 21–100 po 0,50 zł).
- Wybór przedziału jest teraz brany z samego cennika (`data/prices.json`), więc kolejne zmiany przedziałów to edycja cennika, bez zmian w kodzie.

## 3. Druk cyfrowy 24h — „Ilość sztuk” po lewej, „Liczba stron” po prawej
- W ostatnim rzędzie formularza pole **„Ilość sztuk”** (dawniej „Ilość kompletów”) jest po lewej, a **„Liczba stron”** po prawej. Na telefonie najpierw „Ilość sztuk”, pod nim „Liczba stron”.
- Zamiast „komplet” wszędzie w tym formularzu jest **„sztuka”**, żeby nazwy się zgadzały: podpowiedź pod polem („Sztuka to jeden egzemplarz całego dokumentu.” / „Każda sztuka dostaje własną oprawę.”), „Potrzebne arkusze A4: 40 (20 na sztukę)”, „Kartek w jednej sztuce: 86”, opis pod formularzem, linia „Ilość sztuk” w podsumowaniu wyceny, komunikaty o błędach („Ilość sztuk musi być większa od zera.”) i opis cennika opraw w panelu cen. Wersja angielska zaktualizowana (pole nazywa się „Quantity”).
- Sposób liczenia bez zmian: jedna sztuka = jeden egzemplarz całego dokumentu, oprawa jest na każdą sztukę.

## 4. Mail z potwierdzeniem dla klienta — kod rabatowy na następne zamówienie
- Pod sumą zamówienia, przed podpisem „Zespół Druk24”, jest teraz ramka: **„Przy następnym zamówieniu użyj kodu DRUK10, aby otrzymać 10% rabatu.”** oraz podpowiedź „Wpisz kod w koszyku, w polu „Kod rabatowy”.”
- Ramka jest **tylko w mailu do klienta** (nie w mailu do drukarni) i **pokazuje się zawsze**, także gdy to zamówienie już korzystało z kodu rabatowego.
- Kod i opis rabatu to dwie stałe na górze `send-order.php`: `DRUKULATOR_NEXT_ORDER_PROMO_CODE` (`'DRUK10'`) i `DRUKULATOR_NEXT_ORDER_PROMO_BENEFIT` (`'10% rabatu'`). **Pusty kod (`''`) wyłącza ramkę.**
- **Uwaga:** mail tylko informuje o kodzie — sam kod musi istnieć w panelu pracowniczym w zakładce „Kody rabatowe” (rabat 10%, bez limitu użyć albo z limitem, który wystarczy, i z datą ważności po terminie, w którym klienci będą go używać). Inaczej klient dostanie w mailu kod, który w koszyku nie zadziała.
- Wersja kalkulatora bez zmian (0.26.12v) — to zmiana tylko w pliku PHP.

## Założenia
- „Dodajemy jeden przedział do ceny za druk czarno-biały: 21–50 = 0,80 zł, 51–100 = 0,50 zł” rozumiem jako **podział dotychczasowego przedziału 21–100 (0,50 zł) na dwa** w usłudze **Druk cyfrowy 24h** (i w „Druku i oprawie prac”, która liczy z tej samej tabeli). Gdyby to samo miało dotyczyć „Ksero i druk”, to jedna zmiana w cenniku — daj znać.
- Punkt 3 z wiadomości („jak będziesz robił ten dział to powiedz, coś pokażę”) jest prośbą do Ciebie, nie zmianą w kodzie.
- Pozycje z linków bez parametrów produktu są wysyłane bez sprawdzania limitów po stronie serwera (nie da się ich sprawdzić); po stronie klienta to nadal ta sama cena, która była zapisana w linku.

## Pliki
- **Zmienione (PHP — trzeba wgrać na serwer):** `send-order.php` (także ramka z kodem DRUK10 w mailu do klienta).
- **Zmienione (front-end i cennik):** `js/app.js`, `js/calculators.js`, `js/i18n.js`, `data/prices.json`, `index.html`, `assets/ux-clarity.css`.
- **Bez zmian:** pozostałe pliki PHP (w tym panel pracowniczy), baza danych.
- **Testy:** nowe `shared_link_legacy_02612_browser.py` (link `?q=` ze starymi pozycjami: bez komunikatów, wysyłka przechodzi), `tiers_bw_02612.test.cjs` (przedziały i ceny), `digital_fields_02612_browser.py` (kolejność i nazwy pól, ceny w formularzu, angielski); `order_mail_02612.py` + `order_mail_02612_harness.php` (prawdziwy `send-order.php` na atrapie WordPressa: ramka z kodem w mailu do klienta, brak w mailu do drukarni, wyłączanie pustą stałą, zamówienie ze starą pozycją przechodzi); zaktualizowane `stale_cart_analytics_0255_browser.py`, `cart_product_type_0253_browser.py`, `digital_pages_0261(.test.cjs / _browser.py)`, `digital_sets_0262.test.cjs`, `digital_bindings_0267_browser.py`, `merge_0250_browser.py`.
