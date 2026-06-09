(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function setupNavSearch() {
    document.querySelectorAll("[data-nav-search]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q']");
        var query = input ? input.value.trim() : "";
        var target = "search.html" + (query ? "?q=" + encodeURIComponent(query) : "");
        window.location.href = target;
      });
    });
  }

  function setupHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) return;
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) return;
    var index = 0;
    var timer;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function restart() {
      window.clearInterval(timer);
      start();
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-index") || 0));
        restart();
      });
    });
    start();
  }

  function setupFilters() {
    var scope = document.querySelector("[data-filter-scope]");
    if (!scope) return;
    var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));
    var search = scope.querySelector("[data-filter-search]");
    var active = { region: "", type: "", year: "" };

    function normalize(value) {
      return String(value || "").toLowerCase();
    }

    function apply() {
      var query = normalize(search ? search.value : "");
      cards.forEach(function (card) {
        var pass = true;
        if (active.region && card.getAttribute("data-region") !== active.region) pass = false;
        if (active.type && card.getAttribute("data-type") !== active.type) pass = false;
        if (active.year && card.getAttribute("data-year") !== active.year) pass = false;
        if (query && normalize(card.getAttribute("data-keywords")).indexOf(query) === -1) pass = false;
        card.classList.toggle("is-filtered-out", !pass);
      });
    }

    scope.querySelectorAll("[data-filter-button]").forEach(function (button) {
      button.addEventListener("click", function () {
        var kind = button.getAttribute("data-filter-kind");
        var value = button.getAttribute("data-filter-value") || "";
        active[kind] = active[kind] === value ? "" : value;
        scope.querySelectorAll("[data-filter-kind='" + kind + "']").forEach(function (item) {
          item.classList.toggle("is-active", item === button && active[kind] === value);
        });
        apply();
      });
    });

    scope.querySelectorAll("[data-filter-reset]").forEach(function (button) {
      button.addEventListener("click", function () {
        active = { region: "", type: "", year: "" };
        scope.querySelectorAll("[data-filter-button]").forEach(function (item) {
          item.classList.remove("is-active");
        });
        if (search) search.value = "";
        apply();
      });
    });

    if (search) {
      search.addEventListener("input", apply);
    }
  }

  function setupSearchPage() {
    var root = document.querySelector("[data-search-page]");
    if (!root || !window.MovieSearchData) return;
    var form = root.querySelector("[data-site-search]");
    var input = root.querySelector("[data-site-search-input]");
    var status = root.querySelector("[data-search-status]");
    var results = root.querySelector("[data-search-results]");
    var params = new URLSearchParams(window.location.search);

    function escapeText(value) {
      return String(value || "").replace(/[&<>"]/g, function (s) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[s];
      });
    }

    function card(movie) {
      return "<article class=\"movie-card\">" +
        "<a class=\"poster-wrap\" href=\"" + escapeText(movie.url) + "\"><img src=\"" + escapeText(movie.cover) + "\" alt=\"" + escapeText(movie.title) + "\" loading=\"lazy\"><span class=\"card-play\">播放</span></a>" +
        "<div class=\"card-body\"><div class=\"card-meta\"><span>" + escapeText(movie.region) + "</span><span>" + escapeText(movie.year) + "</span><span>" + escapeText(movie.type) + "</span></div>" +
        "<h3><a href=\"" + escapeText(movie.url) + "\">" + escapeText(movie.title) + "</a></h3>" +
        "<p>" + escapeText(movie.oneLine) + "</p><div class=\"tag-row\"><span>" + escapeText(movie.category) + "</span></div></div></article>";
    }

    function render(query) {
      var q = String(query || "").trim().toLowerCase();
      if (input) input.value = query || "";
      if (!q) {
        status.textContent = "输入关键词开始搜索";
        results.innerHTML = "";
        return;
      }
      var items = window.MovieSearchData.filter(function (movie) {
        return String(movie.keywords || "").toLowerCase().indexOf(q) !== -1;
      }).slice(0, 120);
      status.textContent = items.length ? "相关视频" : "暂无相关视频";
      results.innerHTML = items.map(card).join("");
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        render(input ? input.value : "");
      });
    }

    root.querySelectorAll("[data-search-chip]").forEach(function (button) {
      button.addEventListener("click", function () {
        render(button.getAttribute("data-search-chip") || "");
      });
    });

    render(params.get("q") || "");
  }

  ready(function () {
    setupMenu();
    setupNavSearch();
    setupHero();
    setupFilters();
    setupSearchPage();
  });
})();

function initializeMoviePlayer(streamUrl) {
  var video = document.getElementById("moviePlayer");
  var button = document.getElementById("playOverlay");
  var message = document.getElementById("playerMessage");
  if (!video || !streamUrl) return;
  var attached = false;
  var hlsInstance = null;

  function showMessage(text) {
    if (!message) return;
    message.textContent = text;
    message.classList.add("is-visible");
  }

  function attach() {
    if (attached) return;
    attached = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);
      hlsInstance.on(window.Hls.Events.ERROR, function (_, data) {
        if (!data || !data.fatal) return;
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hlsInstance.startLoad();
          return;
        }
        if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hlsInstance.recoverMediaError();
          return;
        }
        showMessage("播放暂时不可用，请稍后再试");
      });
    } else {
      showMessage("播放暂时不可用，请稍后再试");
    }
  }

  function play() {
    attach();
    var promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {
        showMessage("轻触播放按钮继续观看");
      });
    }
  }

  if (button) {
    button.addEventListener("click", function () {
      play();
    });
  }

  video.addEventListener("click", function () {
    if (video.paused) play();
  });

  video.addEventListener("play", function () {
    if (button) button.classList.add("is-hidden");
  });

  video.addEventListener("pause", function () {
    if (button && !video.ended) button.classList.remove("is-hidden");
  });

  window.addEventListener("pagehide", function () {
    if (hlsInstance) hlsInstance.destroy();
  });
}
