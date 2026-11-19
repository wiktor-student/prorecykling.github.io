# PRORECYKLING

Statyczna strona firmy PRORECYKLING – skup i recykling transformatorów.
Czysty HTML, CSS i JavaScript – bez frameworków i bez kroku budowania.

## Struktura

```
index.html, contact.html, implementations.html (wszystkie miasta: ?miasto=rzeszow|warszawa|krakow|lodz), 404.html
css/      style.css (tokeny, układ, responsywność), contact.css, implementations.css
js/       i18n.js (przełącznik PL/EN), components/site-footer.js (wspólna stopka, Web Component), implementations.js (render z JSON), script.js (menu + karuzela), numbers.js (akordeon + liczniki), reveal.js (animacje wejścia)
data/     implementations.json – realizacje (PL + pole "en"), i18n.en.json – tłumaczenia angielskie
vendor/   biblioteki self-hosted (CountUp.js)
img/      grafiki (oryginały + wygenerowane WebP używane na stronie)
scripts/  narzędzia developerskie (obrazy, vendor)
```

## Uruchomienie

```bash
npm install --legacy-peer-deps
npm start            # serwer na http://localhost:8080
```

## Jakość kodu

```bash
npm run lint         # html-validate, stylelint, eslint
npm run format       # prettier (CSS/JS/JSON/MD)
npm run images       # regeneracja WebP z oryginałów w img/ (po dodaniu nowych zdjęć)
npm run vendor       # aktualizacja bibliotek w vendor/
```

Po dodaniu nowego zdjęcia: wstaw w HTML ścieżkę oryginału, uruchom `npm run images`, a następnie użyj
wygenerowanego pliku `.webp` (wymiary w `scripts/image-sizes.json`).

## Technologie i decyzje

- Design tokens (zmienne CSS), mobile-first, jeden breakpoint desktopowy (1025 px).
- Dostępność: semantyczny HTML, skip-link, ARIA dla menu i akordeonu, widoczny fokus, `prefers-reduced-motion`.
- Wydajność: WebP, `loading="lazy"`, wymiary obrazów (brak CLS), `defer` dla skryptów, brak jQuery.
- Bezpieczeństwo: Content-Security-Policy (meta), `rel="noopener noreferrer"`, biblioteki hostowane lokalnie.
- SEO: title/description, Open Graph, JSON-LD (LocalBusiness), `robots.txt`.

## Dodawanie realizacji

Edytuj `data/implementations.json`: dopisz obiekt do `items` wybranego miasta (tytuł, data `RRRR-MM-DD`, lokalizacja, opis, zdjęcie lub wideo). Strona sama go wyrenderuje.
Dane firmy w stopce są w jednym miejscu: stała `COMPANY` w `js/components/site-footer.js`.

## Wersje językowe (PL / EN)

Polski tekst jest w HTML (SEO, działa bez JS). Angielski ładuje się z `data/i18n.en.json` po kliknięciu **EN**
(wybór zapamiętywany w `localStorage`, można też użyć `?lang=en`).
Nowy tekst: dodaj do elementu `data-i18n="klucz"` (tekst), `data-i18n-html="klucz"` (HTML) lub
`data-i18n-attr="alt:klucz"` (atrybuty) i wpisz tłumaczenie pod tym kluczem w `i18n.en.json`.
Skrypty używają `window.i18n.t('klucz', 'polski tekst')` i zdarzenia `i18n:change`.
