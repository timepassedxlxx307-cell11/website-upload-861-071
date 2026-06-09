(() => {
    const ready = (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    const normalize = (value) => (value || '').toString().toLowerCase().trim();

    const initMenu = () => {
        const toggle = document.querySelector('[data-menu-toggle]');
        const panel = document.querySelector('[data-menu-panel]');
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener('click', () => {
            panel.classList.toggle('is-open');
        });
    };

    const initHero = () => {
        const hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
        const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
        const prev = hero.querySelector('[data-hero-prev]');
        const next = hero.querySelector('[data-hero-next]');
        let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
        let timer = null;
        const show = (index) => {
            current = (index + slides.length) % slides.length;
            slides.forEach((slide, slideIndex) => {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        };
        const play = () => {
            clearInterval(timer);
            timer = setInterval(() => show(current + 1), 5000);
        };
        prev?.addEventListener('click', () => {
            show(current - 1);
            play();
        });
        next?.addEventListener('click', () => {
            show(current + 1);
            play();
        });
        dots.forEach((dot) => {
            dot.addEventListener('click', () => {
                show(Number(dot.dataset.heroDot || 0));
                play();
            });
        });
        show(current);
        play();
    };

    const initFilter = () => {
        const panel = document.querySelector('[data-filter-panel]');
        const list = document.querySelector('[data-card-list]') || document;
        if (!panel) {
            return;
        }
        const input = panel.querySelector('[data-search-input]');
        const typeSelect = panel.querySelector('[data-filter-type]');
        const regionSelect = panel.querySelector('[data-filter-region]');
        const yearSelect = panel.querySelector('[data-filter-year]');
        const cards = Array.from(list.querySelectorAll('.movie-card, .rank-item'));
        const apply = () => {
            const q = normalize(input?.value);
            const type = normalize(typeSelect?.value);
            const region = normalize(regionSelect?.value);
            const year = normalize(yearSelect?.value);
            cards.forEach((card) => {
                const searchable = normalize([
                    card.dataset.title,
                    card.dataset.region,
                    card.dataset.type,
                    card.dataset.year,
                    card.dataset.genre,
                    card.textContent
                ].join(' '));
                const okQuery = !q || searchable.includes(q);
                const okType = !type || normalize(card.dataset.type).includes(type);
                const okRegion = !region || normalize(card.dataset.region).includes(region);
                const okYear = !year || normalize(card.dataset.year) === year;
                card.classList.toggle('is-hidden', !(okQuery && okType && okRegion && okYear));
            });
        };
        [input, typeSelect, regionSelect, yearSelect].forEach((control) => {
            control?.addEventListener('input', apply);
            control?.addEventListener('change', apply);
        });
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q && input) {
            input.value = q;
        }
        apply();
    };

    const initPlayer = () => {
        const video = document.querySelector('[data-player]');
        const button = document.querySelector('[data-play-button]');
        if (!video || !button) {
            return;
        }
        const stream = video.dataset.stream || '';
        let hls = null;
        const attach = () => {
            if (video.dataset.ready === 'true') {
                return;
            }
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = stream;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(stream);
                hls.attachMedia(video);
            } else {
                video.src = stream;
            }
            video.dataset.ready = 'true';
        };
        const start = () => {
            attach();
            video.controls = true;
            button.classList.add('is-hidden');
            const request = video.play();
            if (request && typeof request.catch === 'function') {
                request.catch(() => {
                    button.classList.remove('is-hidden');
                });
            }
        };
        button.addEventListener('click', start);
        video.addEventListener('click', () => {
            if (video.paused) {
                start();
            }
        });
        document.querySelectorAll('.watch-anchor').forEach((anchor) => {
            anchor.addEventListener('click', () => {
                setTimeout(start, 80);
            });
        });
        window.addEventListener('pagehide', () => {
            if (hls) {
                hls.destroy();
            }
        });
    };

    ready(() => {
        initMenu();
        initHero();
        initFilter();
        initPlayer();
    });
})();
