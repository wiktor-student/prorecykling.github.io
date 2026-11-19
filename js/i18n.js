/* Wielojęzyczność PL / EN bez bibliotek.
 *
 * - Domyślny język (polski) jest w samym HTML – dobry dla SEO i działa bez JS.
 * - Tłumaczenia angielskie są w data/i18n.en.json i ładowane dopiero po wybraniu EN.
 * - Elementy oznaczamy atrybutami:
 *     data-i18n="klucz"                 → podmienia tekst elementu
 *     data-i18n-html="klucz"            → podmienia HTML (zaufany słownik z własnego pliku)
 *     data-i18n-attr="atrybut:klucz;…"  → podmienia atrybuty (alt, aria-label, content…)
 * - Skrypty dynamiczne używają window.i18n.t(klucz, polskiTekst) i nasłuchują zdarzenia "i18n:change".
 * - Wybór zapamiętywany w localStorage; można też wymusić ?lang=en.
 */
(() => {
    'use strict';

    const STORAGE_KEY = 'prorecykling-lang';
    const LANGS = ['pl', 'en'];
    const DEFAULT_LANG = 'pl';
    const DICT_URL = 'data/i18n.en.json';
    const LOCALES = { pl: 'pl-PL', en: 'en-GB' };

    const originals = new WeakMap(); // oryginalne (polskie) treści elementów
    const cache = {};
    let dict = {};
    let lang = DEFAULT_LANG;

    const readStored = () => {
        try {
            return window.localStorage.getItem(STORAGE_KEY);
        } catch {
            return null;
        }
    };

    const store = (value) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, value);
        } catch {
            /* tryb prywatny / zablokowany storage – pomijamy */
        }
    };

    const detect = () => {
        const fromUrl = new URLSearchParams(window.location.search).get('lang');
        if (LANGS.includes(fromUrl)) return fromUrl;
        const stored = readStored();
        return LANGS.includes(stored) ? stored : DEFAULT_LANG;
    };

    const loadDict = (code) => {
        if (code === DEFAULT_LANG) return Promise.resolve({});
        if (!cache[code]) {
            cache[code] = fetch(DICT_URL).then((response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            });
        }
        return cache[code];
    };

    /** Zwraca tłumaczenie; dla polskiego (i braków) – podany tekst domyślny. */
    const t = (key, fallback) => dict[key] ?? fallback ?? key;

    const remember = (el) => {
        if (!originals.has(el)) originals.set(el, { text: el.textContent, html: el.innerHTML, attrs: {} });
        return originals.get(el);
    };

    const translateNode = (el) => {
        const saved = remember(el);

        if (el.hasAttribute('data-i18n')) {
            el.textContent = t(el.getAttribute('data-i18n'), saved.text);
        }
        if (el.hasAttribute('data-i18n-html')) {
            el.innerHTML = t(el.getAttribute('data-i18n-html'), saved.html);
        }
        if (el.hasAttribute('data-i18n-attr')) {
            el.getAttribute('data-i18n-attr')
                .split(';')
                .map((pair) => pair.trim())
                .filter(Boolean)
                .forEach((pair) => {
                    const [attr, key] = pair.split(':').map((part) => part.trim());
                    if (!(attr in saved.attrs)) saved.attrs[attr] = el.getAttribute(attr);
                    el.setAttribute(attr, t(key, saved.attrs[attr]));
                });
        }
    };

    const apply = (root = document) => {
        root.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-attr]').forEach(translateNode);
    };

    const syncButtons = () => {
        document.querySelectorAll('[data-lang]').forEach((button) => {
            const active = button.dataset.lang === lang;
            button.setAttribute('aria-pressed', String(active));
            button.classList.toggle('is-active', active);
        });
    };

    const setLang = async (code, { persist = true } = {}) => {
        if (!LANGS.includes(code)) return;

        try {
            dict = await loadDict(code);
            lang = code;
        } catch {
            dict = {};
            lang = DEFAULT_LANG; // brak słownika – zostajemy przy polskim
        }

        if (persist) store(lang);
        document.documentElement.lang = lang;
        document.documentElement.dataset.lang = lang;
        apply();
        syncButtons();
        document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
    };

    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-lang]');
        if (button) setLang(button.dataset.lang);
    });

    const initial = detect();
    document.documentElement.lang = initial;

    window.i18n = {
        t,
        setLang,
        get lang() {
            return lang;
        },
        get locale() {
            return LOCALES[lang];
        },
        ready: setLang(initial, { persist: false })
    };
})();
