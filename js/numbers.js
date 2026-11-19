/* Sekcja „Firma w liczbach”: rozwijane panele (akordeon) oraz animowane liczniki (CountUp.js). */
(() => {
    'use strict';

    const t = (key, fallback) => (window.i18n ? window.i18n.t(key, fallback) : fallback);

    /* ---------- Akordeon ---------- */
    const toggles = [];

    document.querySelectorAll('.numbers-box').forEach((box) => {
        const button = box.querySelector('.numbers-toggle');
        const label = box.querySelector('.numbers-box-left p');
        if (!button || !label) return;

        // etykieta dostępności zależy od stanu i aktualnego języka
        const updateLabel = () => {
            const isOpen = box.classList.contains('is-open');
            const action = isOpen ? t('numbers.hide', 'Ukryj szczegóły') : t('numbers.show', 'Pokaż szczegóły');
            button.setAttribute('aria-label', `${action}: ${label.textContent.trim()}`);
        };

        button.addEventListener('click', () => {
            const isOpen = box.classList.toggle('is-open');
            button.setAttribute('aria-expanded', String(isOpen));
            updateLabel();
        });

        toggles.push(updateLabel);
        updateLabel();
    });

    document.addEventListener('i18n:change', () => toggles.forEach((update) => update()));

    /* ---------- Animowane liczniki ---------- */
    const counters = document.querySelectorAll('[data-countup]');
    const CountUp = window.countUp && window.countUp.CountUp;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Bez biblioteki, IntersectionObserver lub przy reduced-motion zostaje wartość statyczna z HTML.
    if (!counters.length || !CountUp || reduceMotion || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                obs.unobserve(el);

                const counter = new CountUp(el, Number(el.dataset.countup), {
                    prefix: el.dataset.prefix || '',
                    duration: 1.8,
                    useEasing: true
                });
                if (!counter.error) counter.start();
            });
        },
        { threshold: 0.6 }
    );

    counters.forEach((el) => observer.observe(el));
})();
