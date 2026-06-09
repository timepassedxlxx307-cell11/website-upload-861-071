(function () {
  function getQuery() {
    var params = new URLSearchParams(window.location.search);
    return (params.get('q') || '').trim();
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[char];
    });
  }

  function makeCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="movie-card small" data-text="' + escapeHtml([movie.title, movie.region, movie.type, movie.genre, (movie.tags || []).join(' ')].join(' ')) + '">',
      '  <a class="movie-cover" href="' + escapeHtml(movie.url) + '" aria-label="' + escapeHtml(movie.title) + '">',
      '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '">',
      '    <span class="score-badge">' + escapeHtml(movie.rating) + '</span>',
      '    <span class="cover-play">▶</span>',
      '  </a>',
      '  <div class="movie-info">',
      '    <div class="movie-meta-line"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.type) + '</span></div>',
      '    <h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '    <p>' + escapeHtml(movie.oneLine) + '</p>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('\n');
  }

  function render(query) {
    var results = document.getElementById('search-results');
    var summary = document.getElementById('search-summary');
    var input = document.getElementById('search-page-input');
    var data = window.SEARCH_MOVIES || [];

    if (!results || !summary) {
      return;
    }

    if (input) {
      input.value = query;
    }

    if (!query) {
      summary.textContent = '热门推荐';
      return;
    }

    var lower = query.toLowerCase();
    var matched = data.filter(function (movie) {
      return [
        movie.title,
        movie.year,
        movie.region,
        movie.type,
        movie.genre,
        (movie.tags || []).join(' '),
        movie.oneLine
      ].join(' ').toLowerCase().indexOf(lower) !== -1;
    }).slice(0, 120);

    summary.textContent = matched.length ? '搜索结果' : '暂无匹配影片';
    results.innerHTML = matched.map(makeCard).join('');
  }

  render(getQuery());
})();
