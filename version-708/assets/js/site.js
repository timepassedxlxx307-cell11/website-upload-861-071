(function () {
    var menuButton = document.querySelector("[data-menu-button]");
    var mobileNav = document.querySelector("[data-mobile-nav]");

    if (menuButton && mobileNav) {
        menuButton.addEventListener("click", function () {
            mobileNav.classList.toggle("is-open");
        });
    }

    document.querySelectorAll("[data-search-form]").forEach(function (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var input = form.querySelector("input[name='q']");
            var query = input ? input.value.trim() : "";
            var url = "all-movies.html";

            if (query) {
                url += "?q=" + encodeURIComponent(query);
            }

            window.location.href = url;
        });
    });

    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var previous = document.querySelector("[data-hero-prev]");
    var next = document.querySelector("[data-hero-next]");
    var activeIndex = 0;
    var timer = null;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }

        activeIndex = (index + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle("is-active", slideIndex === activeIndex);
        });

        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle("is-active", dotIndex === activeIndex);
        });
    }

    function startHero() {
        if (timer || slides.length < 2) {
            return;
        }

        timer = window.setInterval(function () {
            showSlide(activeIndex + 1);
        }, 5000);
    }

    function resetHero() {
        if (timer) {
            window.clearInterval(timer);
            timer = null;
        }

        startHero();
    }

    if (slides.length) {
        showSlide(0);
        startHero();

        if (previous) {
            previous.addEventListener("click", function () {
                showSlide(activeIndex - 1);
                resetHero();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                showSlide(activeIndex + 1);
                resetHero();
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                showSlide(index);
                resetHero();
            });
        });
    }

    var movieList = document.querySelector("[data-movie-list]");

    if (movieList) {
        var cards = Array.prototype.slice.call(movieList.querySelectorAll("[data-movie-card]"));
        var searchInput = document.querySelector("[data-filter-search]");
        var categorySelect = document.querySelector("[data-filter-category]");
        var yearSelect = document.querySelector("[data-filter-year]");
        var typeSelect = document.querySelector("[data-filter-type]");
        var emptyMessage = document.querySelector("[data-empty-message]");
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get("q");

        if (searchInput && initialQuery) {
            searchInput.value = initialQuery;
        }

        function normalize(value) {
            return String(value || "").toLowerCase();
        }

        function applyFilter() {
            var query = normalize(searchInput ? searchInput.value : "");
            var category = categorySelect ? categorySelect.value : "";
            var year = yearSelect ? yearSelect.value : "";
            var type = typeSelect ? typeSelect.value : "";
            var visible = 0;

            cards.forEach(function (card) {
                var haystack = normalize(card.getAttribute("data-search"));
                var matched = true;

                if (query && haystack.indexOf(query) === -1) {
                    matched = false;
                }

                if (category && card.getAttribute("data-category") !== category) {
                    matched = false;
                }

                if (year && card.getAttribute("data-year") !== year) {
                    matched = false;
                }

                if (type && card.getAttribute("data-type") !== type) {
                    matched = false;
                }

                card.hidden = !matched;

                if (matched) {
                    visible += 1;
                }
            });

            if (emptyMessage) {
                emptyMessage.classList.toggle("is-visible", visible === 0);
            }
        }

        [searchInput, categorySelect, yearSelect, typeSelect].forEach(function (control) {
            if (control) {
                control.addEventListener("input", applyFilter);
                control.addEventListener("change", applyFilter);
            }
        });

        applyFilter();
    }

    var playerBox = document.querySelector("[data-player-box]");

    if (playerBox) {
        var video = playerBox.querySelector("video");
        var playButton = playerBox.querySelector("[data-player-button]");
        var stream = playerBox.getAttribute("data-stream");
        var attached = false;
        var hlsInstance = null;

        function attachStream() {
            if (attached || !video || !stream) {
                return;
            }

            attached = true;

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = stream;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new Hls({
                    maxBufferLength: 30
                });
                hlsInstance.loadSource(stream);
                hlsInstance.attachMedia(video);
            } else {
                video.src = stream;
            }
        }

        function startPlayback() {
            attachStream();

            if (playButton) {
                playButton.classList.add("is-hidden");
            }

            if (video) {
                video.controls = true;
                video.play().catch(function () {});
            }
        }

        if (playButton) {
            playButton.addEventListener("click", startPlayback);
        }

        if (video) {
            video.addEventListener("click", function () {
                if (video.paused) {
                    startPlayback();
                }
            });

            window.addEventListener("beforeunload", function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        }
    }
})();
