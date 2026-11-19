/* Strony realizacji (realizacje-<miasto>.html).
   HTML w języku polskim jest generowany statycznie (scripts/build.mjs) – dobry dla SEO i działa bez JS.
   Ten skrypt tylko tłumaczy treść na angielski (i z powrotem) na podstawie data/implementations.json
   oraz window.i18n. Zmiana miasta to zwykłe linki do osobnych stron. */
(() => {
    'use strict';

    const DATA_URL = 'data/implementations.json';

    const list = document.getElementById('implementations');
    const titleEl = document.getElementById('city-title');
    const introEl = document.getElementById('city-intro');
    if (!list || !list.dataset.city) return;

    const metaDescription = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');

    const t = (key, fallback) => (window.i18n ? window.i18n.t(key, fallback) : fallback);
    const isEnglish = () => window.i18n && window.i18n.lang === 'en';
    const locale = () => (window.i18n ? window.i18n.locale : 'pl-PL');

    const escapeHtml = (value) =>
        String(value).replace(
            /[&<>"']/g,
            (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
        );

    /** Tworzy element z klasą i (opcjonalnie) tekstem – bez innerHTML, więc dane nie mogą wstrzyknąć kodu. */
    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };

    /** Pola wpisu w aktualnym języku (EN z item.en, braki uzupełnia polski). */
    const localized = (item) => {
        const en = isEnglish() && item.en ? item.en : {};
        return {
            title: en.title ?? item.title,
            location: en.location ?? item.location,
            text: en.text ?? item.text,
            alt: en.alt ?? item.media.alt
        };
    };

    const iconRow = (icon, valueNode) => {
        const row = el('div', 'implementation-icon-text');
        const symbol = el('span', 'material-symbols-outlined', icon);
        symbol.setAttribute('aria-hidden', 'true');
        row.append(symbol, valueNode);
        return row;
    };

    const buildMedia = (media, alt, isFirst) => {
        if (media.type === 'video') {
            const video = el('video');
            video.controls = true;
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'metadata';
            video.setAttribute('aria-label', alt);
            video.src = media.src;
            return video;
        }
        const img = el('img');
        img.src = media.src;
        img.alt = alt;
        if (media.width && media.height) {
            img.width = media.width;
            img.height = media.height;
        }
        img.decoding = 'async';
        if (!isFirst) img.loading = 'lazy';
        return img;
    };

    const buildCard = (item, index) => {
        const text = localized(item);
        const card = el('article', 'implementation');
        card.id = item.id;

        const dateFormat = new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
        const date = el('p', 'implementation-date');
        const time = el('time', '', dateFormat.format(new Date(`${item.date}T12:00:00`)));
        time.dateTime = item.date;
        date.append(time);

        const cta = el('a', 'square-button', t('cta.contactUs', 'Skontaktuj się!'));
        cta.href = 'contact.html';

        card.append(
            buildMedia(item.media, text.alt, index === 0),
            el('h2', '', text.title),
            iconRow('calendar_month', date),
            iconRow('location_on', el('p', 'implementation-location', text.location)),
            el('p', 'implementation-text', text.text),
            cta
        );
        return card;
    };

    const render = (city, cities) => {
        const english = isEnglish();
        const name = t(`city.${city.id}`, city.name);

        const title = english
            ? t('impl.metaTitle', '').replace('{name}', name)
            : `Skup transformatorów ${city.locative} – realizacje | PRORECYKLING`;
        const description = english
            ? t('impl.metaDesc', '').replace('{name}', name)
            : `Zobacz nasze realizacje: odbiór i skup transformatorów ${city.locative} i okolicach. Daty, lokalizacje i opisy odbiorów. Zamów odbiór transformatora.`;
        const heading = english ? t('impl.heading', '').replace('{name}', name) : `Odbiory ${city.locative}`;
        const intro = english
            ? t('impl.intro', '')
            : 'Sprawdź nasze przykładowe odbiory z {city} oraz skontaktuj się z nami w celu ustalenia odbioru.';

        document.title = title;
        [metaDescription, ogDescription, twitterDescription].forEach((meta) => {
            if (meta) meta.content = description;
        });
        [ogTitle, twitterTitle].forEach((meta) => {
            if (meta) meta.content = title;
        });
        if (titleEl) titleEl.textContent = heading;
        if (introEl) {
            const label = english ? name : city.genitive;
            introEl.innerHTML = intro.replace(
                '{city}',
                `<strong><span class="accent">${escapeHtml(label)}</span></strong>`
            );
        }

        list.replaceChildren(...city.items.map(buildCard));
        list.scrollLeft = 0;
        return cities;
    };

    let data = null;
    let renderedEnglish = false;

    const update = async () => {
        const wantEnglish = isEnglish();
        // polski jest już w HTML – przerysowujemy tylko po zmianie języka
        if (!wantEnglish && !renderedEnglish) return;

        try {
            if (!data) {
                const response = await fetch(DATA_URL);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                data = (await response.json()).cities;
            }
            const city = data.find((c) => c.id === list.dataset.city);
            if (city) render(city, data);
            renderedEnglish = wantEnglish;
        } catch {
            /* zostaje wersja polska wygenerowana statycznie */
        }
    };

    document.addEventListener('i18n:change', update);
})();
