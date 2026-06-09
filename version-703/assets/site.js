
(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function cardTemplate(item) {
    return '<a class="movie-card" href="' + escapeHtml(item.url) + '">' +
      '<span class="card-cover card-cover-small">' +
      '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
      '<span class="card-shade"></span>' +
      '<span class="card-play">▶</span>' +
      '<span class="card-type">' + escapeHtml(item.type) + '</span>' +
      '</span>' +
      '<span class="card-body">' +
      '<strong>' + escapeHtml(item.title) + '</strong>' +
      '<span>' + escapeHtml(item.oneLine) + '</span>' +
      '<em>' + escapeHtml(item.region) + ' · ' + escapeHtml(item.year) + '年</em>' +
      '</span>' +
      '</a>';
  }

  ready(function () {
    var header = document.querySelector('.site-header');
    if (header) {
      var syncHeader = function () {
        if (window.scrollY > 20) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      };
      syncHeader();
      window.addEventListener('scroll', syncHeader, { passive: true });
    }

    var menuButton = document.querySelector('.mobile-menu-button');
    var mobileMenu = document.querySelector('.mobile-menu');
    if (menuButton && mobileMenu) {
      menuButton.addEventListener('click', function () {
        var expanded = menuButton.getAttribute('aria-expanded') === 'true';
        menuButton.setAttribute('aria-expanded', String(!expanded));
        mobileMenu.hidden = expanded;
      });
    }

    document.querySelectorAll('[data-hero-slider]').forEach(function (slider) {
      var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
      var dots = Array.prototype.slice.call(slider.querySelectorAll('.hero-dot'));
      var prev = slider.querySelector('.hero-prev');
      var next = slider.querySelector('.hero-next');
      var index = 0;
      var timer;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('is-active', i === index);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === index);
        });
      }

      function play() {
        window.clearInterval(timer);
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5200);
      }

      if (prev) {
        prev.addEventListener('click', function () {
          show(index - 1);
          play();
        });
      }
      if (next) {
        next.addEventListener('click', function () {
          show(index + 1);
          play();
        });
      }
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          show(i);
          play();
        });
      });
      show(0);
      play();
    });

    document.querySelectorAll('.filter-input').forEach(function (input) {
      var grid = document.querySelector('[data-filter-grid]');
      var empty = document.querySelector('.empty-filter');
      if (!grid) {
        return;
      }
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.js-filter-card'));
      input.addEventListener('input', function () {
        var q = input.value.trim().toLowerCase();
        var shown = 0;
        cards.forEach(function (card) {
          var ok = !q || (card.getAttribute('data-search') || '').indexOf(q) !== -1;
          card.hidden = !ok;
          if (ok) {
            shown += 1;
          }
        });
        if (empty) {
          empty.hidden = shown !== 0;
        }
      });
    });

    var searchResults = document.getElementById('search-results');
    var searchSummary = document.getElementById('search-summary');
    var searchInput = document.getElementById('search-query');
    if (searchResults && window.SEARCH_INDEX) {
      var params = new URLSearchParams(window.location.search);
      var q = (params.get('q') || '').trim();
      if (searchInput) {
        searchInput.value = q;
      }
      if (!q) {
        searchResults.innerHTML = '';
      } else {
        var query = q.toLowerCase();
        var result = window.SEARCH_INDEX.filter(function (item) {
          return item.search.indexOf(query) !== -1;
        }).slice(0, 120);
        if (searchSummary) {
          searchSummary.textContent = result.length ? '为你找到相关影片' : '没有找到相关影片';
        }
        searchResults.innerHTML = result.map(cardTemplate).join('');
      }
    }
  });

  window.initMoviePlayer = function (videoId, overlayId, source) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(overlayId);
    if (!video || !overlay || !source) {
      return;
    }
    var attached = false;
    var player = null;

    function attach() {
      if (attached) {
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        player = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        player.loadSource(source);
        player.attachMedia(video);
      } else {
        video.src = source;
      }
      video.setAttribute('controls', 'controls');
      attached = true;
    }

    function start() {
      attach();
      overlay.classList.add('hidden');
      var request = video.play();
      if (request && typeof request.catch === 'function') {
        request.catch(function () {
          overlay.classList.remove('hidden');
        });
      }
    }

    overlay.addEventListener('click', start);
    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener('play', function () {
      overlay.classList.add('hidden');
    });
    video.addEventListener('error', function () {
      overlay.classList.remove('hidden');
      overlay.querySelector('strong').textContent = '播放暂时不可用，请稍后再试';
      if (player) {
        player.destroy();
        player = null;
      }
      attached = false;
    });
  };
})();
