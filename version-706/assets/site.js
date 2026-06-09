(function () {
  var root = document.documentElement;
  var base = root.getAttribute("data-base") || "";

  function selectAll(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function setActiveSlide(index) {
    var slides = selectAll(".hero-slide");
    var dots = selectAll(".hero-dot");
    if (!slides.length) {
      return;
    }
    var normalized = (index + slides.length) % slides.length;
    slides.forEach(function (slide, current) {
      slide.classList.toggle("is-active", current === normalized);
    });
    dots.forEach(function (dot, current) {
      dot.classList.toggle("is-active", current === normalized);
    });
    root.setAttribute("data-current-slide", String(normalized));
  }

  function currentSlideIndex() {
    var value = parseInt(root.getAttribute("data-current-slide") || "0", 10);
    return Number.isFinite(value) ? value : 0;
  }

  var slides = selectAll(".hero-slide");
  if (slides.length) {
    setActiveSlide(0);
    var next = document.querySelector(".hero-control--next");
    var prev = document.querySelector(".hero-control--prev");
    if (next) {
      next.addEventListener("click", function () {
        setActiveSlide(currentSlideIndex() + 1);
      });
    }
    if (prev) {
      prev.addEventListener("click", function () {
        setActiveSlide(currentSlideIndex() - 1);
      });
    }
    selectAll(".hero-dot").forEach(function (dot) {
      dot.addEventListener("click", function () {
        setActiveSlide(parseInt(dot.getAttribute("data-slide") || "0", 10));
      });
    });
    window.setInterval(function () {
      setActiveSlide(currentSlideIndex() + 1);
    }, 5200);
  }

  var menuButton = document.querySelector(".mobile-menu-button");
  var mobileMenu = document.querySelector(".mobile-menu");
  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", function () {
      var willOpen = mobileMenu.hasAttribute("hidden");
      if (willOpen) {
        mobileMenu.removeAttribute("hidden");
      } else {
        mobileMenu.setAttribute("hidden", "");
      }
      menuButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  }

  function setupPlayer(player) {
    var video = player.querySelector("video");
    var overlay = player.querySelector(".player-overlay");
    var source = player.getAttribute("data-src");
    var instance = null;
    var ready = false;

    function attachSource() {
      if (ready || !video || !source) {
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        instance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        instance.loadSource(source);
        instance.attachMedia(video);
        instance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal && instance) {
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              instance.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              instance.recoverMediaError();
            } else {
              instance.destroy();
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else {
        video.src = source;
      }
      ready = true;
    }

    function playVideo() {
      attachSource();
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          player.classList.remove("is-playing");
        });
      }
    }

    if (overlay && video) {
      overlay.addEventListener("click", playVideo);
      video.addEventListener("click", function () {
        if (video.paused) {
          playVideo();
        }
      });
      video.addEventListener("play", function () {
        player.classList.add("is-playing");
      });
      video.addEventListener("pause", function () {
        player.classList.remove("is-playing");
      });
    }

    window.addEventListener("pagehide", function () {
      if (instance) {
        instance.destroy();
      }
    });
  }

  selectAll(".movie-player").forEach(setupPlayer);

  function renderSearch() {
    var data = window.MOVIE_INDEX || [];
    var results = document.getElementById("search-results");
    var heading = document.getElementById("search-heading");
    var summary = document.getElementById("search-summary");
    var form = document.querySelector(".search-page-form");
    var typeFilter = document.getElementById("search-type");
    var yearFilter = document.getElementById("search-year");
    if (!results || !data.length || !form) {
      return;
    }
    var input = form.querySelector("input[name='q']");
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    if (input) {
      input.value = query;
    }

    function card(movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return "<span>" + escapeHtml(tag) + "</span>";
      }).join("");
      return [
        "<article class=\"movie-card\">",
        "<a class=\"movie-card__poster\" href=\"" + escapeAttribute(movie.url) + "\" aria-label=\"" + escapeAttribute(movie.title) + "\">",
        "<img src=\"" + escapeAttribute(movie.image) + "\" alt=\"" + escapeAttribute(movie.title) + "\" loading=\"lazy\" />",
        "<span class=\"movie-card__type\">" + escapeHtml(movie.type) + "</span>",
        "</a>",
        "<div class=\"movie-card__body\">",
        "<h3><a href=\"" + escapeAttribute(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h3>",
        "<p>" + escapeHtml(movie.line) + "</p>",
        "<div class=\"movie-card__meta\"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span></div>",
        "<div class=\"movie-card__tags\">" + tags + "</div>",
        "</div>",
        "</article>"
      ].join("");
    }

    function escapeHtml(value) {
      return String(value || "").replace(/[&<>\"]/g, function (match) {
        return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[match];
      });
    }

    function escapeAttribute(value) {
      return escapeHtml(value).replace(/'/g, "&#39;");
    }

    function apply() {
      var q = (input ? input.value : "").trim().toLowerCase();
      var typeValue = typeFilter ? typeFilter.value : "";
      var yearValue = yearFilter ? yearFilter.value : "";
      var filtered = data.filter(function (movie) {
        var haystack = [movie.title, movie.region, movie.type, movie.year, movie.genre, (movie.tags || []).join(" "), movie.line].join(" ").toLowerCase();
        var matchesQuery = !q || haystack.indexOf(q) !== -1;
        var matchesType = !typeValue || String(movie.type || "").indexOf(typeValue) !== -1 || String(movie.genre || "").indexOf(typeValue) !== -1;
        var matchesYear = !yearValue || String(movie.year || "") === yearValue;
        return matchesQuery && matchesType && matchesYear;
      }).slice(0, 120);
      if (heading) {
        heading.textContent = q ? "搜索结果" : "推荐浏览";
      }
      if (summary) {
        summary.textContent = q ? "已展示匹配当前条件的影片。" : "输入关键词后可查看匹配结果。";
      }
      results.innerHTML = filtered.map(card).join("") || "<p class=\"empty-result\">未找到匹配内容，可更换关键词继续搜索。</p>";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var q = (input ? input.value : "").trim();
      var url = new URL(window.location.href);
      if (q) {
        url.searchParams.set("q", q);
      } else {
        url.searchParams.delete("q");
      }
      history.replaceState(null, "", url.toString());
      apply();
    });
    [input, typeFilter, yearFilter].forEach(function (control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });
    apply();
  }

  renderSearch();
})();
