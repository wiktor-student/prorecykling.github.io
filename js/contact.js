/* Formularz kontaktowy: walidacja i wysyłka przez program pocztowy użytkownika (mailto:).
   Strona jest statyczna, więc nie ma serwera, który przyjąłby formularz. */
(() => {
    'use strict';

    const RECIPIENT = 'skuptransformatorow@gmail.com';

    const form = document.getElementById('form');
    if (!form) return;

    const status = document.getElementById('form-status');
    const topic = document.getElementById('contact-topic');

    // ?temat=weglik|transformatory|inne wstępnie wybiera temat (linki ze strony o węglikach)
    if (topic) {
        const requested = new URLSearchParams(window.location.search).get('temat');
        if (requested && [...topic.options].some((option) => option.value === requested)) topic.value = requested;
    }
    const t = (key, fallback) => (window.i18n ? window.i18n.t(key, fallback) : fallback);

    const setStatus = (text, state) => {
        if (!status) return;
        status.textContent = text;
        if (state) status.dataset.state = state;
        else delete status.dataset.state;
    };

    // zaznacz pola z błędem (dla czytników ekranu i stylów)
    const markInvalid = () => {
        form.querySelectorAll('.form-input').forEach((input) => {
            input.setAttribute('aria-invalid', String(!input.checkValidity()));
        });
    };

    form.addEventListener('input', (event) => {
        if (event.target.matches('.form-input')) {
            event.target.setAttribute('aria-invalid', String(!event.target.checkValidity()));
            if (status && status.dataset.state === 'error') setStatus('');
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
            markInvalid();
            setStatus(t('contact.form.invalid', 'Uzupełnij poprawnie wszystkie pola.'), 'error');
            const firstInvalid = form.querySelector('.form-input:invalid');
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        const data = new FormData(form);
        const topicLabel = topic && topic.selectedOptions[0] ? topic.selectedOptions[0].textContent.trim() : '';
        const baseSubject = t('contact.form.subject', 'Zapytanie ze strony PRORECYKLING');
        const subject = encodeURIComponent(topicLabel ? `${baseSubject} – ${topicLabel}` : baseSubject);
        const body = encodeURIComponent(`${data.get('message')}\n\n--\n${data.get('name')}\n${data.get('email')}`);

        setStatus(t('contact.form.opening', 'Otwieram Twojego klienta poczty…'));
        window.location.href = `mailto:${RECIPIENT}?subject=${subject}&body=${body}`;
    });

    // komunikat statusu w nowym języku po przełączeniu PL/EN
    document.addEventListener('i18n:change', () => {
        if (status && status.textContent) setStatus('');
    });
})();
