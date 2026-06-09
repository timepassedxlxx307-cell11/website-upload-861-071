(function () {
    var toggle = document.querySelector('[data-mobile-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');

    if (toggle && panel) {
        toggle.addEventListener('click', function () {
            panel.classList.toggle('open');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var prev = document.querySelector('[data-hero-prev]');
    var next = document.querySelector('[data-hero-next]');
    var activeIndex = 0;
    var timer = null;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }

        activeIndex = (index + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle('active', slideIndex === activeIndex);
        });

        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle('active', dotIndex === activeIndex);
        });
    }

    function moveSlide(step) {
        showSlide(activeIndex + step);
    }

    function startTimer() {
        if (!slides.length) {
            return;
        }

        window.clearInterval(timer);
        timer = window.setInterval(function () {
            moveSlide(1);
        }, 5000);
    }

    if (slides.length) {
        showSlide(0);
        startTimer();

        if (prev) {
            prev.addEventListener('click', function () {
                moveSlide(-1);
                startTimer();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                moveSlide(1);
                startTimer();
            });
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                showSlide(dotIndex);
                startTimer();
            });
        });
    }

    var searchInput = document.querySelector('[data-local-search]');
    var searchCards = Array.prototype.slice.call(document.querySelectorAll('[data-search-card]'));
    var emptyState = document.querySelector('[data-empty-state]');
    var chipButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter-chip]'));
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    var activeFilter = '';

    function normalizeText(value) {
        return String(value || '').toLowerCase().trim();
    }

    function applySearch() {
        if (!searchCards.length) {
            return;
        }

        var query = normalizeText(searchInput ? searchInput.value : '');
        var visibleCount = 0;

        searchCards.forEach(function (card) {
            var haystack = normalizeText([
                card.getAttribute('data-title'),
                card.getAttribute('data-tags'),
                card.getAttribute('data-region'),
                card.getAttribute('data-year'),
                card.getAttribute('data-type')
            ].join(' '));
            var matchQuery = !query || haystack.indexOf(query) !== -1;
            var matchFilter = !activeFilter || haystack.indexOf(activeFilter) !== -1;
            var visible = matchQuery && matchFilter;

            card.style.display = visible ? '' : 'none';

            if (visible) {
                visibleCount += 1;
            }
        });

        if (emptyState) {
            emptyState.classList.toggle('visible', visibleCount === 0);
        }
    }

    if (searchInput) {
        if (initialQuery) {
            searchInput.value = initialQuery;
        }

        searchInput.addEventListener('input', applySearch);
        applySearch();
    }

    chipButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            chipButtons.forEach(function (item) {
                item.classList.remove('active');
            });

            if (activeFilter === normalizeText(button.getAttribute('data-filter-chip'))) {
                activeFilter = '';
            } else {
                activeFilter = normalizeText(button.getAttribute('data-filter-chip'));
                button.classList.add('active');
            }

            applySearch();
        });
    });
}());

function initializeMoviePlayer(source) {
    var video = document.getElementById('moviePlayer');
    var overlay = document.getElementById('playerOverlay');

    if (!video || !source) {
        return;
    }

    function bindSource() {
        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });

            hls.loadSource(source);
            hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
        } else {
            video.src = source;
        }
    }

    function startPlayback() {
        bindSource();

        if (overlay) {
            overlay.classList.add('hidden');
        }

        var playPromise = video.play();

        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {});
        }
    }

    if (overlay) {
        overlay.addEventListener('click', startPlayback);
    }

    video.addEventListener('play', function () {
        if (overlay) {
            overlay.classList.add('hidden');
        }
    });

    video.addEventListener('click', function () {
        if (video.paused) {
            startPlayback();
        }
    });
}
