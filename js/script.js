/* Wspólne zachowania stron: menu mobilne i karuzela realizacji. */
(() => {
    'use strict';

    /* ---------- Menu mobilne ---------- */
    const toggle = document.getElementById('menu-button');
    const menu = document.getElementById('mobile-menu');

    if (toggle && menu) {
        const desktop = window.matchMedia('(min-width: 1025px)');
        const isOpen = () => !menu.classList.contains('hidden-menu');

        const openAnim = document.getElementById('hb-open');
        const closeAnim = document.getElementById('hb-close');

        const t = (key, fallback) => (window.i18n ? window.i18n.t(key, fallback) : fallback);
        const updateLabel = () =>
            toggle.setAttribute(
                'aria-label',
                isOpen() ? t('menu.close', 'Zamknij menu') : t('menu.open', 'Otwórz menu')
            );
        document.addEventListener('i18n:change', updateLabel);

        const setOpen = (open) => {
            menu.classList.toggle('hidden-menu', !open);
            toggle.setAttribute('aria-expanded', String(open));
            updateLabel();

            // animacja ikony (SMIL) sterowana ze stanu menu – działa też z klawiatury
            const anim = open ? openAnim : closeAnim;
            if (anim && typeof anim.beginElement === 'function') anim.beginElement();
        };

        toggle.addEventListener('click', () => setOpen(!isOpen()));

        menu.addEventListener('click', (event) => {
            if (event.target.closest('a') && isOpen()) setOpen(false);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && isOpen()) {
                setOpen(false);
                toggle.focus();
            }
        });

        desktop.addEventListener('change', (event) => {
            if (event.matches && isOpen()) setOpen(false);
        });
    }

    /* ---------- Karuzela realizacji ---------- */
    const track = document.getElementById('implementations');
    const prev = document.getElementById('prev');
    const next = document.getElementById('next');

    if (track && prev && next) {
        const step = () => {
            const card = track.querySelector('.implementation');
            if (!card) return 350;
            const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            return card.getBoundingClientRect().width + gap;
        };

        const scrollTrack = (direction) => {
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            track.scrollBy({ left: direction * step(), behavior: reduce ? 'auto' : 'smooth' });
        };

        prev.addEventListener('click', () => scrollTrack(-1));
        next.addEventListener('click', () => scrollTrack(1));
    }
})();
