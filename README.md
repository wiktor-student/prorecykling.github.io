<<<<<<< HEAD

# PRORECYKLING

Statyczna strona firmy PRORECYKLING – skup i recykling transformatorów.
Czysty HTML, CSS i JavaScript – bez frameworków i bez kroku budowania.

## Struktura

```
index.html, contact.html, realizacje-<miasto>.html (generowane), 404.html
css/      style.css (tokeny, układ, responsywność), contact.css, implementations.css
js/       i18n.js (przełącznik PL/EN), components/site-footer.js (wspólna stopka, Web Component), implementations.js (render z JSON), script.js (menu + karuzela), numbers.js (akordeon + liczniki), reveal.js (animacje wejścia)
data/     implementations.json – realizacje (PL + pole "en"), i18n.en.json – tłumaczenia angielskie
vendor/   biblioteki self-hosted (CountUp.js)
img/      grafiki (oryginały + wygenerowane WebP używane na stronie)
scripts/  narzędzia: build.mjs (SEO + strony miast), optimize-images.mjs, copy-vendor.mjs; templates/city.html
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
=======

# prorecykling.github.io

> > > > > > > a26ccbdc33d3615a5c7c20cc483c98abcc249474

## SEO i build

`npm run build` (po każdej zmianie w `data/implementations.json` lub tytułach/opisach stron):

- generuje statyczne strony `realizacje-<miasto>.html` z `data/implementations.json` (szablon: `scripts/templates/city.html`),
- wstawia do `<head>` każdej strony blok SEO między `<!-- seo:start -->` a `<!-- seo:end -->` (canonical, robots, Open Graph, Twitter, JSON-LD),
- tworzy `sitemap.xml`, `robots.txt` i obraz `img/og-image.jpg`.

Adres witryny jest w `scripts/site.config.json` (`siteUrl`). Domena produkcyjna: prorecykling.com (plik `CNAME`). Przy zmianie domeny zmień `siteUrl` i `CNAME`, potem `npm run build`.
Tytuł i opis strony głównej oraz kontaktu edytuj w ich `<title>` i `<meta name="description">` – build przepisuje je do Open Graph/Twitter.

## Bezpieczeństwo

- **Zero zasobów zewnętrznych:** czcionki (Montserrat, Material Symbols) i biblioteki są hostowane lokalnie (`fonts/`, `vendor/`) – brak połączeń z Google, lepsza prywatność (RODO) i wydajność.
- **CSP:** polityka ustawiana centralnie w `scripts/build.mjs` (`script-src 'self'`, `style-src 'self'`, bez inline-skryptów i inline-stylów, `frame-src 'none'`, `upgrade-insecure-requests`). Zmieniasz ją w jednym miejscu i uruchamiasz `npm run build`.
- **Zdjęcia:** oryginały z telefonu zawierają lokalizację GPS (EXIF). Leżą wyłącznie lokalnie w `originals/` (ignorowane przez git); publikujemy tylko WebP bez metadanych (`npm run images`).
- **security.txt:** `/.well-known/security.txt` (data ważności odświeżana przy każdym buildzie).
- **Nagłówki HTTP** (HSTS, X-Frame-Options / `frame-ancestors`, Permissions-Policy itd.) nie są możliwe na GitHub Pages – ustaw je w Cloudflare (Rules → Transform Rules → Modify Response Header).
- **Repozytorium:** włączone secret scanning z push protection, alerty i automatyczne poprawki Dependabot, ochrona gałęzi `main` przed force-push i usunięciem.
