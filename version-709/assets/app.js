(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initImages() {
    $all('img[data-fallback]').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) {
        img.classList.add('is-hidden');
      }
      img.addEventListener('error', function () {
        img.classList.add('is-hidden');
      });
    });
  }

  function initMenu() {
    var button = $('[data-menu-toggle]');
    var nav = $('[data-site-nav]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function initHero() {
    var root = $('[data-hero-slider]');
    if (!root) {
      return;
    }
    var slides = $all('[data-slide]', root);
    var dots = $all('[data-hero-dot]', root);
    var prev = $('[data-hero-prev]', root);
    var next = $('[data-hero-next]', root);
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function play() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        play();
      });
    });
    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        play();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        play();
      });
    }
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', play);
    show(0);
    play();
  }

  function initFilters() {
    var bar = $('[data-filter-bar]');
    if (!bar) {
      return;
    }
    var input = $('[data-search-input]', bar);
    var year = $('[data-filter-year]', bar);
    var category = $('[data-filter-category]', bar);
    var reset = $('[data-filter-reset]', bar);
    var cards = $all('[data-card]');
    var noResult = $('[data-no-result]');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');

    if (query && input) {
      input.value = query;
    }

    function apply() {
      var q = normalize(input ? input.value : '');
      var y = normalize(year ? year.value : '');
      var c = normalize(category ? category.value : '');
      var visible = 0;
      cards.forEach(function (card) {
        var text = normalize(card.textContent);
        var ok = true;
        if (q && text.indexOf(q) === -1) {
          ok = false;
        }
        if (y && normalize(card.getAttribute('data-year')) !== y) {
          ok = false;
        }
        if (c && normalize(card.getAttribute('data-category')) !== c) {
          ok = false;
        }
        card.style.display = ok ? '' : 'none';
        if (ok) {
          visible += 1;
        }
      });
      if (noResult) {
        noResult.classList.toggle('is-visible', visible === 0);
      }
    }

    [input, year, category].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });
    if (reset) {
      reset.addEventListener('click', function () {
        if (input) {
          input.value = '';
        }
        if (year) {
          year.value = '';
        }
        if (category) {
          category.value = '';
        }
        apply();
      });
    }
    apply();
  }

  function initPlayer() {
    var video = $('[data-player]');
    var button = $('[data-play]');
    if (!video || !button) {
      return;
    }
    var hls = null;
    var source = video.getAttribute('data-stream') || button.getAttribute('data-stream');

    function start() {
      if (!source) {
        return;
      }
      button.classList.add('is-hidden');
      if (video.getAttribute('data-ready') !== '1') {
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            maxBufferLength: 30,
            enableWorker: true
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else {
          video.src = source;
          video.addEventListener('loadedmetadata', function () {
            video.play().catch(function () {});
          }, { once: true });
        }
        video.setAttribute('data-ready', '1');
      } else {
        video.play().catch(function () {});
      }
    }

    button.addEventListener('click', start);
    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });
    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initImages();
    initMenu();
    initHero();
    initFilters();
    initPlayer();
  });
})();
