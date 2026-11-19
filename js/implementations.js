/* Strona realizacji: jedna strona dla wszystkich miast, dane z data/implementations.json.
   Miasto wybiera parametr ?miasto=… (np. implementations.html?miasto=warszawa).
   Treści w dwóch językach: pola bazowe (PL) i item.en (EN), przełączane przez window.i18n. */
(() => {
    'use strict';

    const DATA_URL = 'data/implementations.json';
    const DEFAULT_CITY = 'rzeszow';

    const list = document.getElementById('implementations');
    const tabs = document.getElementById('city-tabs');
    const titleEl = document.getElementById('city-title');
    const introEl = document.getElementById('city-intro');
    if (!list || !tabs) return;

    const metaDescription = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');

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

    const cityFromUrl = (cities) => {
        const requested = new URLSearchParams(window.location.search).get('miasto');
        return cities.find((c) => c.id === requested) || cities.find((c) => c.id === DEFAULT_CITY) || cities[0];
    };

    const render = (city) => {
        const english = isEnglish();
        const name = t(`city.${city.id}`, city.name);

        const title = english
            ? t('impl.metaTitle', 'Realizacje {name} – PRORECYKLING').replace('{name}', name)
            : `Realizacje ${city.name} – PRORECYKLING`;
        const description = english
            ? t('impl.metaDesc', '').replace('{name}', name)
            : `Przykładowe odbiory transformatorów ${city.locative} i okolicach wykonane przez PRORECYKLING. Sprawdź realizacje i zamów odbiór.`;
        const heading = english
            ? t('impl.heading', 'Odbiory {name}').replace('{name}', name)
            : `Odbiory ${city.locative}`;
        const intro = english
            ? t('impl.intro', '')
            : 'Sprawdź nasze przykładowe odbiory z {city} oraz skontaktuj się z nami w celu ustalenia odbioru.';
        const cityLabel = english ? name : city.genitive;

        document.title = title;
        if (metaDescription) metaDescription.content = description;
        if (ogTitle) ogTitle.content = title;
        if (ogDescription) ogDescription.content = description;
        if (titleEl) titleEl.textContent = heading;
        if (introEl) {
            introEl.innerHTML = intro.replace(
                '{city}',
                `<strong><span class="accent">${escapeHtml(cityLabel)}</span></strong>`
            );
        }

        tabs.querySelectorAll('a').forEach((link) => {
            const tabCity = link.dataset.city;
            const known = currentCities.find((c) => c.id === tabCity);
            link.textContent = t(`city.${tabCity}`, known ? known.name : link.textContent);
            if (tabCity === city.id) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });

        list.replaceChildren(...city.items.map(buildCard));
        list.scrollLeft = 0;
        list.setAttribute('aria-busy', 'false');
    };

    const showError = () => {
        const message = el(
            'p',
            'implementation-error',
            t('impl.error', 'Nie udało się wczytać realizacji. Odśwież stronę lub skontaktuj się z nami.')
        );
        message.setAttribute('role', 'alert');
        list.replaceChildren(message);
        list.setAttribute('aria-busy', 'false');
    };

    let currentCities = [];
    let currentCity = null;

    fetch(DATA_URL)
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(({ cities }) => {
            currentCities = cities;
            currentCity = cityFromUrl(cities);
            render(currentCity);

            // Przełączanie miast bez przeładowania strony (z obsługą przycisku „wstecz”).
            tabs.addEventListener('click', (event) => {
                const link = event.target.closest('a[data-city]');
                if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
                event.preventDefault();
                window.history.pushState({}, '', link.href);
                currentCity = cityFromUrl(cities);
                render(currentCity);
            });
            window.addEventListener('popstate', () => {
                currentCity = cityFromUrl(cities);
                render(currentCity);
            });

            // zmiana języka – przerysuj aktualne miasto
            document.addEventListener('i18n:change', () => render(currentCity));
        })
        .catch(showError);
})();
