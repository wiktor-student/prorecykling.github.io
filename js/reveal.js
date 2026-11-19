/* Delikatne pojawianie się elementów przy przewijaniu (IntersectionObserver).
   Progressive enhancement: bez JS lub przy prefers-reduced-motion wszystko jest od razu widoczne. */
(() => {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const targets = document.querySelectorAll('.square1, .square2, .art-steps, .numbers-box, .main-contact-content');
    if (!targets.length) return;

    document.documentElement.classList.add('js-reveal');

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
    );

    targets.forEach((el, index) => {
        el.classList.add('reveal');
        // kaskadowe opóźnienie dla kolejnych elementów w tej samej grupie
        el.style.setProperty('--reveal-delay', `${(index % 3) * 80}ms`);
        observer.observe(el);
    });
})();
