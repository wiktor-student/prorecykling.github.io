// Generator SEO i stron miast: node scripts/build.mjs   (npm run build)
//
// Co robi:
//  1. generuje statyczne strony realizacji dla każdego miasta (realizacje-<miasto>.html)
//     z data/implementations.json i szablonu scripts/templates/city.html,
//  2. wstawia do <head> wszystkich stron blok SEO (canonical, robots, Open Graph, Twitter, JSON-LD),
//  3. generuje obraz społecznościowy img/og-image.jpg, sitemap.xml i robots.txt.
// Adres witryny ustawiasz w scripts/site.config.json (siteUrl).
import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';

const config = JSON.parse(readFileSync('scripts/site.config.json', 'utf8'));
const { cities } = JSON.parse(readFileSync('data/implementations.json', 'utf8'));
const SITE = config.siteUrl.replace(/\/$/, '');
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const escapeHtml = (value) =>
    String(value).replace(
        /[&<>"']/g,
        (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
    );
const url = (path = '') => `${SITE}/${path}`;
const cityFile = (id) => `realizacje-${id}.html`;
const dateFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
const modified = (file) => statSync(file).mtime.toISOString().slice(0, 10);

/* ---------------------------------------------------------------- strony miast */

const mediaHtml = (media, first) => {
    if (media.type === 'video') {
        return `<video controls autoplay muted loop playsinline preload="metadata" aria-label="${escapeHtml(media.alt)}" src="${escapeHtml(media.src)}"></video>`;
    }
    const size = media.width && media.height ? ` width="${media.width}" height="${media.height}"` : '';
    const lazy = first ? '' : ' loading="lazy"';
    return `<img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt)}"${size}${lazy} decoding="async">`;
};

const cardHtml = (item, index) => `                    <article class="implementation" id="${item.id}">
                        ${mediaHtml(item.media, index === 0)}
                        <h2>${escapeHtml(item.title)}</h2>
                        <div class="implementation-icon-text">
                            <span class="material-symbols-outlined" aria-hidden="true">calendar_month</span>
                            <p class="implementation-date"><time datetime="${item.date}">${dateFormat.format(new Date(`${item.date}T12:00:00`))}</time></p>
                        </div>
                        <div class="implementation-icon-text">
                            <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
                            <p class="implementation-location">${escapeHtml(item.location)}</p>
                        </div>
                        <p class="implementation-text">${escapeHtml(item.text)}</p>
                        <a class="square-button" href="contact.html">Skontaktuj się!</a>
                    </article>`;

const cityMeta = (city) => ({
    title: `Skup transformatorów ${city.locative} – realizacje | PRORECYKLING`,
    description: `Zobacz nasze realizacje: odbiór i skup transformatorów ${city.locative} i okolicach. Daty, lokalizacje i opisy odbiorów. Zamów odbiór transformatora.`,
    heading: `Odbiory ${city.locative}`,
    intro: `Sprawdź nasze przykładowe odbiory z <strong><span class="accent">${escapeHtml(city.genitive)}</span></strong> oraz skontaktuj się z nami w celu ustalenia odbioru.`
});

const tabsHtml = (current) =>
    cities
        .map((c) => {
            const active = c.id === current.id ? ' aria-current="page"' : '';
            return `                <a data-city="${c.id}" data-i18n="city.${c.id}" href="${cityFile(c.id)}"${active}>${escapeHtml(c.name)}</a>`;
        })
        .join('\n');

const template = readFileSync('scripts/templates/city.html', 'utf8');
for (const city of cities) {
    const meta = cityMeta(city);
    const html = template
        .replaceAll('{{TITLE}}', escapeHtml(meta.title))
        .replaceAll('{{DESC}}', escapeHtml(meta.description))
        .replace('{{H1}}', escapeHtml(meta.heading))
        .replace('{{INTRO}}', meta.intro)
        .replace('{{TABS}}', tabsHtml(city))
        .replace('{{CITY_ID}}', city.id)
        .replace('{{CARDS}}', city.items.map(cardHtml).join('\n'));
    writeFileSync(cityFile(city.id), html, { newline: 'lf' });
}

/* ------------------------------------------------------------------- JSON-LD */

const businessId = `${SITE}/#business`;
const websiteId = `${SITE}/#website`;

const business = {
    '@type': 'LocalBusiness',
    '@id': businessId,
    name: config.name,
    legalName: config.legalName,
    url: url(),
    description: config.description,
    slogan: 'Tworzymy lepszy świat',
    logo: { '@type': 'ImageObject', url: url('img/logo.png'), width: 160, height: 65 },
    image: [url(config.ogImage)],
    telephone: config.telephone,
    email: config.email,
    address: { '@type': 'PostalAddress', ...config.address },
    areaServed: { '@type': 'Country', name: 'Polska' },
    openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59'
    },
    knowsAbout: [
        'skup transformatorów',
        'recykling transformatorów',
        'odbiór transformatorów',
        'złom',
        'surowce wtórne'
    ],
    sameAs: config.sameAs
};

const website = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: url(),
    name: config.name,
    inLanguage: ['pl', 'en'],
    publisher: { '@id': businessId }
};

const breadcrumb = (pageUrl, items) => ({
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item }))
});

/** Pytania i odpowiedzi z <details class="faq-item"> – jedno źródło prawdy: HTML strony. */
const faqFromHtml = (html) =>
    [
        ...html.matchAll(/<details class="faq-item">\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>/g)
    ].map((m) => [m[1].trim(), m[2].trim()]);

/* --------------------------------------------------------------------- strony */

const pages = [
    {
        file: 'index.html',
        path: '',
        priority: '1.0',
        graph: (p) => [
            business,
            website,
            {
                '@type': 'WebPage',
                '@id': `${p.url}#webpage`,
                url: p.url,
                name: p.title,
                description: p.description,
                inLanguage: 'pl',
                isPartOf: { '@id': websiteId },
                about: { '@id': businessId },
                primaryImageOfPage: { '@type': 'ImageObject', url: url(config.ogImage) }
            }
        ]
    },
    {
        file: 'contact.html',
        path: 'contact.html',
        priority: '0.8',
        graph: (p) => [
            business,
            website,
            {
                '@type': 'ContactPage',
                '@id': `${p.url}#webpage`,
                url: p.url,
                name: p.title,
                description: p.description,
                inLanguage: 'pl',
                isPartOf: { '@id': websiteId },
                mainEntity: { '@id': businessId }
            },
            breadcrumb(p.url, [
                ['Strona główna', url()],
                ['Kontakt', p.url]
            ])
        ]
    },
    {
        file: 'skup-weglikow.html',
        path: 'skup-weglikow.html',
        priority: '0.9',
        graph: (p, html) => [
            business,
            website,
            {
                '@type': 'WebPage',
                '@id': `${p.url}#webpage`,
                url: p.url,
                name: p.title,
                description: p.description,
                inLanguage: 'pl',
                isPartOf: { '@id': websiteId },
                about: { '@id': businessId }
            },
            {
                '@type': 'FAQPage',
                '@id': `${p.url}#faq`,
                mainEntity: faqFromHtml(html).map(([question, answer]) => ({
                    '@type': 'Question',
                    name: question,
                    acceptedAnswer: { '@type': 'Answer', text: answer }
                }))
            },
            breadcrumb(p.url, [
                ['Strona główna', url()],
                ['Skup węglików spiekanych', p.url]
            ])
        ]
    },
    ...cities.map((city) => ({
        file: cityFile(city.id),
        path: cityFile(city.id),
        priority: '0.7',
        city,
        graph: (p) => [
            business,
            website,
            {
                '@type': 'CollectionPage',
                '@id': `${p.url}#webpage`,
                url: p.url,
                name: p.title,
                description: p.description,
                inLanguage: 'pl',
                isPartOf: { '@id': websiteId },
                about: { '@id': businessId },
                mainEntity: {
                    '@type': 'ItemList',
                    itemListElement: city.items.map((item, i) => ({
                        '@type': 'ListItem',
                        position: i + 1,
                        name: item.title,
                        url: `${p.url}#${item.id}`
                    }))
                }
            },
            breadcrumb(p.url, [
                ['Strona główna', url()],
                [`Realizacje ${city.name}`, p.url]
            ])
        ]
    })),
    { file: '404.html', path: '404.html', noindex: true }
];

/* ----------------------------------------------------------- bezpieczeństwo */

// Content-Security-Policy w <meta> (GitHub Pages nie pozwala ustawiać nagłówków; pełny zestaw nagłówków – Cloudflare).
// Wszystko hostujemy lokalnie (czcionki, skrypty, obrazy), nie ma inline-skryptów ani inline-stylów.
const CSP = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    "img-src 'self' data:",
    "media-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests'
].join('; ');

const applyCsp = (html) => {
    const tag = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
    if (/<meta http-equiv="Content-Security-Policy"[^>]*>/.test(html)) {
        return html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, tag);
    }
    return html.replace(
        /(<meta name="viewport"[^>]*>)/,
        `$1
        ${tag}`
    );
};

/* ------------------------------------------------------------------- blok SEO */

const readTag = (html, re) => {
    const m = html.match(re);
    return m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : '';
};

const seoBlock = (page, title, description, html) => {
    const lines = ['<!-- seo:start -->'];
    if (page.noindex) {
        lines.push('<meta name="robots" content="noindex, nofollow">');
    } else {
        const pageUrl = url(page.path);
        const alt = 'PRORECYKLING – skup i recykling transformatorów';
        lines.push(
            `<link rel="canonical" href="${pageUrl}">`,
            '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
            `<meta name="author" content="${escapeHtml(config.name)}">`,
            '<meta name="geo.region" content="PL-18">',
            `<meta name="geo.placename" content="${escapeHtml(config.address.addressLocality)}">`,
            '<meta property="og:locale:alternate" content="en_GB">',
            `<meta property="og:url" content="${pageUrl}">`,
            `<meta property="og:image" content="${url(config.ogImage)}">`,
            `<meta property="og:image:width" content="${OG_WIDTH}">`,
            `<meta property="og:image:height" content="${OG_HEIGHT}">`,
            '<meta property="og:image:type" content="image/jpeg">',
            `<meta property="og:image:alt" content="${alt}">`,
            '<meta name="twitter:card" content="summary_large_image">',
            `<meta name="twitter:title" content="${escapeHtml(title)}">`,
            `<meta name="twitter:description" content="${escapeHtml(description)}">`,
            `<meta name="twitter:image" content="${url(config.ogImage)}">`,
            `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': page.graph({ url: pageUrl, title, description }, html) }, null, 2)}</script>`
        );
    }
    lines.push('<!-- seo:end -->');
    return lines.map((l, i) => (i === 0 ? l : `        ${l}`)).join('\n');
};

for (const page of pages) {
    let html = readFileSync(page.file, 'utf8');
    const title = readTag(html, /<title[^>]*>([\s\S]*?)<\/title>/);
    const description = readTag(html, /<meta name="description" content="([^"]*)"/);

    html = applyCsp(html);

    // usuń stare, ręcznie dodane JSON-LD (blok generujemy sami)
    html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, (m) =>
        m.includes('seo:') ? m : ''
    );

    const block = seoBlock(page, title, description, html);
    if (html.includes('<!-- seo:start -->')) {
        html = html.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, block);
    } else {
        html = html.replace('    </head>', `        ${block}\n    </head>`);
    }

    // 404 jest serwowana pod dowolną ścieżką – <base> sprawia, że linki względne zawsze działają
    if (page.file === '404.html') {
        html = html.replace(/\s*<base [^>]*>/, '');
        html = html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n        <base href="${SITE}/">`);
    }
    writeFileSync(page.file, html, { newline: 'lf' });
}

/* ------------------------------------------------------ sitemap, robots, OG */

const indexable = pages.filter((p) => !p.noindex);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable
    .map(
        (p) => `  <url>
    <loc>${url(p.path)}</loc>
    <lastmod>${modified(p.file)}</lastmod>
    <priority>${p.priority}</priority>
  </url>`
    )
    .join('\n')}
</urlset>
`;
writeFileSync('sitemap.xml', sitemap, { newline: 'lf' });
writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${url('sitemap.xml')}\n`, { newline: 'lf' });

const overlay = Buffer.from(`<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#232d5a" stop-opacity="0.96"/>
      <stop offset="0.55" stop-color="#232d5a" stop-opacity="0.78"/>
      <stop offset="1" stop-color="#232d5a" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#g)"/>
  <rect x="64" y="236" width="84" height="7" rx="3.5" fill="#4caf50"/>
  <g font-family="Segoe UI, Arial, Helvetica, sans-serif" fill="#ffffff">
    <text x="64" y="212" font-size="30" font-weight="700" letter-spacing="5" fill="#b9e6bb">PRORECYKLING</text>
    <text x="64" y="330" font-size="72" font-weight="800">Skup i recykling</text>
    <text x="64" y="414" font-size="72" font-weight="800">transformatorów</text>
    <text x="64" y="488" font-size="30" fill="#e3e7f3">Cała Polska · odbiór D2D · płatność natychmiast</text>
  </g>
</svg>`);
await sharp('img/IMG_9979.webp')
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlay }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile('img/og-image.jpg');

// Plik security.txt (RFC 9116) – gdzie zgłaszać luki w zabezpieczeniach; data ważności odświeżana przy każdym buildzie.
mkdirSync('.well-known', { recursive: true });
const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
writeFileSync(
    '.well-known/security.txt',
    `Contact: mailto:${config.email}
Expires: ${expires}
Preferred-Languages: pl, en
Canonical: ${url('.well-known/security.txt')}
`,
    { newline: 'lf' }
);

console.log(
    `Gotowe: ${cities.length} stron miast, blok SEO w ${pages.length} plikach, sitemap.xml, robots.txt, og-image.jpg`
);
console.log(`Adres witryny: ${SITE}`);
