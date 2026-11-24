/* <site-footer> – wspólna stopka wszystkich podstron (natywny Web Component, bez bibliotek).
   Dane firmy są w jednym miejscu (COMPANY), teksty przechodzą przez window.i18n (PL/EN).
   Wewnątrz tagu można zostawić statyczną treść zastępczą – zostanie podmieniona,
   a bez JS nadal widać dane kontaktowe. */
(() => {
    'use strict';

    const COMPANY = {
        name: 'PRORECYKLING',
        phone: { label: '792 977 793', href: 'tel:+48792977793' },
        email: 'skuptransformatorow@gmail.com',
        socials: [
            { icon: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/?locale=pl_PL', external: true },
            {
                icon: 'instagram',
                label: 'Instagram',
                href: 'https://www.instagram.com/mateusz_slezakkk?igsh=ZWR5MXd6aGV3N3di',
                external: true
            },
            { icon: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@fazka332', external: true },
            { icon: 'x', label: 'X', href: 'https://x.com/', external: true }
        ]
    };

    const ICONS = 'img/icons.svg';

    /** Tłumaczenie z awaryjnym polskim tekstem (gdy i18n.js nie jest załadowany). */
    const t = (key, fallback) => (window.i18n ? window.i18n.t(key, fallback) : fallback);

    const escapeHtml = (value) =>
        String(value).replace(
            /[&<>"']/g,
            (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
        );

    const icon = (name) =>
        `<svg viewBox="0 0 256 256" aria-hidden="true" focusable="false"><use href="${ICONS}#${name}"></use></svg>`;

    const pin = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${ICONS}#pin"></use></svg>`;

    const socialLink = ({ icon: name, label, href, external }) => {
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        const text = external ? `${label} ${t('footer.newTab', '(otwiera się w nowej karcie)')}` : label;
        return `<li><a class="site-footer__social" href="${escapeHtml(href)}"${attrs} aria-label="${escapeHtml(text)}">${icon(name)}</a></li>`;
    };

    class SiteFooter extends HTMLElement {
        connectedCallback() {
            this.render();
            this.onLanguageChange = () => this.render();
            document.addEventListener('i18n:change', this.onLanguageChange);
        }

        disconnectedCallback() {
            document.removeEventListener('i18n:change', this.onLanguageChange);
        }

        render() {
            const { name, phone, email, socials } = COMPANY;
            const year = new Date().getFullYear();

            const links = [
                { label: t('nav.about', 'O firmie'), href: 'index.html#main-header' },
                { label: t('nav.offer', 'Realizacje'), href: 'index.html#offer' },
                { label: t('nav.numbers', 'Liczby'), href: 'index.html#numbers' },
                { label: t('footer.carbides', 'Skup węglików'), href: 'skup-weglikow.html' },
                { label: t('nav.contact', 'Kontakt'), href: 'contact.html' }
            ];
            const address = ['Diamentowa 24', '36-060 Głogów Małopolski', t('footer.country', 'Cała Polska')];

            this.innerHTML = `
        <footer class="site-footer">
            <div class="site-footer__inner">
                <section class="site-footer__cta" aria-labelledby="footer-cta-title">
                    <div>
                        <h2 id="footer-cta-title">${escapeHtml(t('footer.cta.title', 'Masz transformator do odbioru?'))}</h2>
                        <p>${escapeHtml(t('footer.cta.text', 'Zadzwoń lub napisz – odbierzemy go w całej Polsce, a płacimy od ręki.'))}</p>
                    </div>
                    <div class="site-footer__cta-actions">
                        <a class="site-footer__btn" href="${phone.href}">${escapeHtml(t('footer.call', 'Zadzwoń'))} ${phone.label}</a>
                        <a class="site-footer__btn site-footer__btn--ghost" href="contact.html">${escapeHtml(t('footer.write', 'Napisz do nas'))}</a>
                    </div>
                </section>

                <div class="site-footer__grid">
                    <div class="site-footer__brand">
                        <p class="site-footer__logo">${escapeHtml(name)}</p>
                        <p>${escapeHtml(t('footer.tagline', 'Skup węglików spiekanych i transformatorów. Najlepsze ceny, najszybsza realizacja.'))}</p>
                        <ul class="site-footer__socials" aria-label="${escapeHtml(t('footer.socials', 'Media społecznościowe'))}">${socials.map(socialLink).join('')}</ul>
                    </div>

                    <nav class="site-footer__col" aria-labelledby="footer-nav-title">
                        <h2 id="footer-nav-title">${escapeHtml(t('footer.quick', 'Na skróty'))}</h2>
                        <ul>
                            ${links.map((l) => `<li><a href="${l.href}">${escapeHtml(l.label)}</a></li>`).join('\n                            ')}
                        </ul>
                    </nav>

                    <div class="site-footer__col">
                        <h2>${escapeHtml(t('footer.contact', 'Kontakt'))}</h2>
                        <address>
                            <ul>
                                <li><span class="site-footer__ico">${icon('phone')}</span><a href="${phone.href}">${phone.label}</a></li>
                                <li><span class="site-footer__ico">${icon('mail')}</span><a href="mailto:${email}">${email}</a></li>
                                <li><span class="site-footer__ico">${pin}</span><span>${address.map(escapeHtml).join('<br>')}</span></li>
                            </ul>
                        </address>
                    </div>
                </div>

                <div class="site-footer__bottom">
                    <p>&copy; ${year} ${escapeHtml(name)}. ${escapeHtml(t('footer.rights', 'Wszelkie prawa zastrzeżone.'))}</p>
                    <a class="site-footer__top" href="#" aria-label="${escapeHtml(t('footer.topAria', 'Wróć na górę strony'))}">${escapeHtml(t('footer.top', 'Do góry'))} <span aria-hidden="true">↑</span></a>
                </div>
            </div>
        </footer>`;
        }
    }

    if (!customElements.get('site-footer')) customElements.define('site-footer', SiteFooter);
})();
