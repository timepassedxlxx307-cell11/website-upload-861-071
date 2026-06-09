(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    ready(function () {
        var header = document.querySelector("[data-header]");
        var toggle = document.querySelector("[data-nav-toggle]");

        function setHeader() {
            if (!header) {
                return;
            }
            if (window.scrollY > 16) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        }

        setHeader();
        window.addEventListener("scroll", setHeader, { passive: true });

        if (toggle && header) {
            toggle.addEventListener("click", function () {
                document.body.classList.toggle("nav-open");
                header.classList.toggle("open");
            });
        }

        document.querySelectorAll("[data-hero]").forEach(function (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-slide]"));
            var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
            var prev = hero.querySelector("[data-hero-prev]");
            var next = hero.querySelector("[data-hero-next]");
            var index = 0;
            var timer = null;

            function show(nextIndex) {
                if (!slides.length) {
                    return;
                }
                index = (nextIndex + slides.length) % slides.length;
                slides.forEach(function (slide, i) {
                    slide.classList.toggle("active", i === index);
                });
                dots.forEach(function (dot, i) {
                    dot.classList.toggle("active", i === index);
                });
            }

            function schedule() {
                if (timer) {
                    window.clearInterval(timer);
                }
                timer = window.setInterval(function () {
                    show(index + 1);
                }, 5200);
            }

            if (prev) {
                prev.addEventListener("click", function () {
                    show(index - 1);
                    schedule();
                });
            }

            if (next) {
                next.addEventListener("click", function () {
                    show(index + 1);
                    schedule();
                });
            }

            dots.forEach(function (dot, i) {
                dot.addEventListener("click", function () {
                    show(i);
                    schedule();
                });
            });

            show(0);
            schedule();
        });

        document.querySelectorAll("[data-search-scope]").forEach(function (scope) {
            var input = scope.querySelector("[data-search-input]");
            var buttons = Array.prototype.slice.call(scope.querySelectorAll("[data-filter-value]"));
            var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-card]"));
            var empty = scope.querySelector("[data-empty]");
            var active = "all";

            function normalize(value) {
                return String(value || "").toLowerCase().trim();
            }

            function render() {
                var query = normalize(input ? input.value : "");
                var visible = 0;
                cards.forEach(function (card) {
                    var text = normalize(card.getAttribute("data-search"));
                    var type = card.getAttribute("data-type") || "";
                    var matchedType = active === "all" || type === active;
                    var matchedText = !query || text.indexOf(query) !== -1;
                    var show = matchedType && matchedText;
                    card.hidden = !show;
                    if (show) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.hidden = visible !== 0;
                }
            }

            if (input) {
                input.addEventListener("input", render);
            }

            buttons.forEach(function (button) {
                button.addEventListener("click", function () {
                    active = button.getAttribute("data-filter-value") || "all";
                    buttons.forEach(function (item) {
                        item.classList.toggle("active", item === button);
                    });
                    render();
                });
            });

            render();
        });

        document.querySelectorAll(".movie-player").forEach(function (box) {
            var video = box.querySelector("video");
            var playButton = box.querySelector(".js-play");
            var streamUrl = box.getAttribute("data-stream");
            var hlsInstance = null;
            var loaded = false;

            function playVideo() {
                var attempt = video.play();
                if (attempt && typeof attempt.catch === "function") {
                    attempt.catch(function () {});
                }
            }

            function start() {
                if (!video || !streamUrl) {
                    return;
                }
                box.classList.add("is-started");
                if (loaded) {
                    playVideo();
                    return;
                }
                loaded = true;

                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = streamUrl;
                    video.addEventListener("loadedmetadata", playVideo, { once: true });
                    playVideo();
                    return;
                }

                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(streamUrl);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal && hlsInstance) {
                            hlsInstance.destroy();
                            hlsInstance = null;
                            video.src = streamUrl;
                            playVideo();
                        }
                    });
                    return;
                }

                video.src = streamUrl;
                video.addEventListener("loadedmetadata", playVideo, { once: true });
                playVideo();
            }

            if (playButton) {
                playButton.addEventListener("click", start);
            }

            box.addEventListener("click", function (event) {
                if (event.target === video || event.target === box || event.target.classList.contains("player-overlay")) {
                    if (video.paused || !loaded) {
                        start();
                    }
                }
            });

            video.addEventListener("play", function () {
                box.classList.add("is-started");
            });
        });
    });
})();
