# Zdjęcia produktów Malfini — Drukulator 0.23.15v

Podgląd pokazuje bezpośrednio zdjęcia katalogowe dostawcy (jeśli przeglądarka może je pobrać). Nie dołączono zdjęć Malfini do ZIP-a i nie kopiowano plików z serwera producenta.

Przykładowy oficjalny adres zweryfikowanego zdjęcia:
`https://shop.malfini.com/image/product/129/129_01_a~w460.jpg?t=0`

Warianty potwierdzone dla Basic 129 czarnego:
- `a` = przód
- `c` = półprofil
- `e` = profil

Własne, licencjonowane zdjęcia można zapisać lokalnie według schematu:
- `129-01-front.webp`
- `129-01-angle.webp`
- `129-01-side.webp`

Pliki lokalne są używane jako rezerwa, gdy fotografia online się nie wczyta. Można też zdefiniować konkretne ścieżki do zdjęć przez `window.D24_MALFINI_PHOTOS` przed ładowaniem `js/malfini-preview.js`.

Aby całkowicie wyłączyć pobieranie zewnętrznych zdjęć, ustaw wcześniej `window.D24_MALFINI_USE_REMOTE=false`.

**Uwaga o prawach do fotografii:** zdjęcia należą do producenta / uprawnionych właścicieli. Przed wykorzystaniem na stronie komercyjnej uzyskaj odpowiednią zgodę od Malfini albo udostępnioną przez dostawcę paczkę zdjęć dla partnerów. Ładowanie bezpośrednio z obcego serwera może zostać zablokowane lub przestać działać.

---

## Kamizelka Brixton Flash (Polstar) — 0.24.1v

Zdjęcia kamizelki Brixton Flash (AFK4) są ładowane z polstar.com.pl (`product_media/<id>/…jpg`, miniatury z prefiksem `thumb_`).
Lokalna rezerwa (używana, gdy zdjęcie z Polstaru się nie wczyta) — nazwy plików:
- `AFK4-yellow-front.webp`, `AFK4-yellow-side.webp`, `AFK4-yellow-back.webp`
- `AFK4-orange-front.webp`, `AFK4-orange-side.webp`, `AFK4-orange-back.webp`

Zdjęcia należą do Polstar — przed zapisaniem kopii na własnym serwerze uzyskaj zgodę dostawcy.
