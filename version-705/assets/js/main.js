(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var toggle = document.querySelector('.menu-toggle');
    var panel = document.querySelector('.mobile-panel');

    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        panel.classList.toggle('open');
      });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var current = 0;

    function setSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        setSlide(index);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        setSlide(current + 1);
      }, 5200);
    }

    var filterInput = document.querySelector('.filter-input');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
    var chipButtons = Array.prototype.slice.call(document.querySelectorAll('.chip-filter'));
    var activeChip = '';

    function applyFilter() {
      var query = filterInput ? filterInput.value.trim().toLowerCase() : '';
      cards.forEach(function (card) {
        var text = (card.getAttribute('data-text') || '').toLowerCase();
        var matchedQuery = !query || text.indexOf(query) !== -1;
        var matchedChip = !activeChip || text.indexOf(activeChip.toLowerCase()) !== -1;
        card.hidden = !(matchedQuery && matchedChip);
      });
    }

    if (filterInput) {
      filterInput.addEventListener('input', applyFilter);
    }

    chipButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeChip = button.getAttribute('data-filter') || '';
        chipButtons.forEach(function (item) {
          item.classList.toggle('active', item === button);
        });
        applyFilter();
      });
    });
  });
})();
