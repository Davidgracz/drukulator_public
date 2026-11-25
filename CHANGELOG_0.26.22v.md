# Drukulator 0.26.22v

## Przesyłanie plików w zamówieniu — szybsze na wolnych łączach i odporne na zawieszenia

**Co było nie tak.** Pliki szły w stałych fragmentach po 8 MB. Serwer ma limit czasu na odebranie jednego żądania
(`max_input_time = 120 s`). Przy wolniejszym łączu (poniżej ok. 70 KB/s, czyli ok. 0,5 Mbit/s — słaby LTE, hotspot, Wi‑Fi na granicy zasięgu)
pierwszy fragment 8 MB nie mieścił się w tym czasie, serwer go odrzucał, a przeglądarka dopiero wtedy zmniejszała fragment
o połowę i zaczynała od nowa. Każda taka próba kosztowała do 2 minut, a wiedza o limicie ginęła przy następnym pliku.
Zawieszone połączenie nie było wykrywane wcale — pasek stał w miejscu bez końca.

**Zmiany (js/app.js, upload-files.php):**
- **Adaptacyjny rozmiar fragmentu.** Pierwszy fragment ma 1 MB i służy za próbę. Potem rozmiar jest dobierany tak, żeby jeden fragment
  trwał kilka sekund (maks. 8 s, a przy znanym `max_input_time` nie więcej niż jego ćwierć); rośnie najwyżej 2× na krok.
  Szybkie łącze dochodzi do 8 MB po trzech fragmentach, wolne dostaje małe fragmenty, które mieszczą się w limicie.
- **Wspólna wiedza dla wszystkich plików.** Rozmiar i wykryty limit (odrzucenie 400/413) są wspólne dla wszystkich plików
  i obu kolejek — kolejny plik nie powtarza błędu poprzedniego.
- **Limit z ustawień serwera.** `upload-files.php` podaje największy fragment obliczony z `upload_max_filesize` i `post_max_size`
  (z zapasem na nagłówki), a także `max_input_time`. Dotąd był to stały 8 MB niezależnie od hostingu.
- **Wykrywanie zawieszonego połączenia.** Brak postępu przez 45 s (lub brak odpowiedzi serwera przez ok. 68 s po wysłaniu fragmentu)
  przerywa żądanie i ponawia ten sam fragment; serwer rozpoznaje powtórzony, identyczny fragment i nie dubluje danych.
- **Po zerwaniu połączenia kolejne fragmenty są mniejsze** (ten sam fragment jest ponawiany bez zmiany rozmiaru, jak dotąd).
- **Pasek postępu:** prędkość w KB/s przy wolnym łączu oraz „pozostało ok. …”.

**Monitoring (send-order.php, staff-panel.php).** Po przyjęciu zamówienia z plikami w monitoringu pojawia się wpis „Wysyłka plików
(czas i prędkość)”: czas przesyłania, średnia prędkość, liczba fragmentów, największy fragment, ponowienia i odrzucenia. Dzięki temu na
działającym serwerze widać, czy wolne wysyłanie to kwestia łącza klienta, czy limitów hostingu.

**Test:** `tests/upload_adaptive_02622_browser.py` — prawdziwa strona na lokalnym serwerze udającym wolne łącze, limity PHP i pośrednika,
zerwane połączenia i zawieszone odpowiedzi; każdy plik jest porównywany bajt w bajt z oryginałem.

**Czego ta zmiana nie robi:** nie przyspiesza samego łącza klienta. Plik 50 MB przy uploadzie 10 Mbit/s zajmie ok. 40 s niezależnie od kodu.
