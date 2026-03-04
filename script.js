// script.js — Gushwork
// Handles: sticky header, mobile menu, carousel, zoom portal, smooth scroll, scroll reveal

// ─── 1. Sticky Header ───────────────────────────────────────────
// Show after scrolling past the hero, hide when scrolling back up

var header     = document.getElementById('stickyHeader');
var mainNav    = document.getElementById('mainNav');
var lastScroll = 0;

window.addEventListener('scroll', function () {
  var current   = window.scrollY;
  var threshold = mainNav.offsetHeight + window.innerHeight * 0.85;

  if (current > threshold && current > lastScroll) {
    header.classList.add('visible');      // scrolling down past hero
  } else if (current < lastScroll || current <= threshold) {
    header.classList.remove('visible');   // scrolling up or back above hero
  }

  lastScroll = current;
}, { passive: true });


// ─── 2. Mobile Menu ─────────────────────────────────────────────
// Toggle hamburger / drawer open state

var hamburger  = document.getElementById('hamburger');
var mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', function () {
  var isOpen = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
});

// Close drawer when a link inside it is clicked
mobileMenu.querySelectorAll('a').forEach(function (link) {
  link.addEventListener('click', function () {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});


// ─── 3. Carousel ────────────────────────────────────────────────
// Slide track by translating it on X axis

var track    = document.getElementById('cTrack');
var prevBtn  = document.getElementById('prevBtn');
var nextBtn  = document.getElementById('nextBtn');
var dotsWrap = document.getElementById('cDots');
var items    = Array.from(track.querySelectorAll('.c-item'));
var total    = items.length;
var index    = 0;
var dots     = [];

function perView() {
  if (window.innerWidth <= 600) return 1;
  if (window.innerWidth <= 900) return 2;
  return 3;
}

function getOffset(i) {
  var gap  = parseFloat(getComputedStyle(track).gap) || 20;
  var w    = items[0].getBoundingClientRect().width;
  return i * (w + gap);
}

function goTo(i) {
  var pv  = perView();
  var max = Math.max(0, total - pv);
  index = Math.min(Math.max(i, 0), max);

  track.style.transform = 'translateX(-' + getOffset(index) + 'px)';
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index >= max;

  var activePage = Math.floor(index / pv);
  dots.forEach(function (d, n) {
    d.classList.toggle('active', n === activePage);
    d.setAttribute('aria-selected', n === activePage);
  });
}

function buildDots() {
  dotsWrap.innerHTML = '';
  dots = [];
  var pages = Math.ceil(total / perView());
  for (var i = 0; i < pages; i++) {
    (function (p) {
      var d = document.createElement('button');
      d.className = 'dot-btn';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Go to slide ' + (p + 1));
      d.addEventListener('click', function () { goTo(p * perView()); });
      dotsWrap.appendChild(d);
      dots.push(d);
    })(i);
  }
}

prevBtn.addEventListener('click', function () { goTo(index - 1); });
nextBtn.addEventListener('click', function () { goTo(index + 1); });

// Keyboard arrow navigation
document.addEventListener('keydown', function (e) {
  var carousel = document.getElementById('carousel');
  if (carousel.contains(document.activeElement)) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
  }
});

// Mouse drag
var dragStart = 0, dragEnd = 0, dragging = false;

track.addEventListener('mousedown', function (e) {
  dragStart = e.clientX;
  dragEnd   = e.clientX; // reset so a click with no movement never triggers a slide
  dragging  = true;
  track.classList.add('dragging');
});
window.addEventListener('mousemove', function (e) {
  if (dragging) dragEnd = e.clientX;
});
window.addEventListener('mouseup', function () {
  if (!dragging) return;
  dragging = false;
  track.classList.remove('dragging');
  var delta = dragStart - dragEnd;
  if (Math.abs(delta) > 50) goTo(delta > 0 ? index + 1 : index - 1);
  else goTo(index);
});

// Touch swipe
track.addEventListener('touchstart', function (e) { dragStart = e.touches[0].clientX; }, { passive: true });
track.addEventListener('touchend',   function (e) {
  var delta = dragStart - e.changedTouches[0].clientX;
  if (Math.abs(delta) > 50) goTo(delta > 0 ? index + 1 : index - 1);
  else goTo(index);
});

// Rebuild on resize
var resizeTimer;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () {
    buildDots();
    goTo(Math.min(index, Math.max(0, total - perView())));
  }, 200);
});

buildDots();
goTo(0);


// ─── 4. Zoom Portal ─────────────────────────────────────────────
// WHY PORTAL? The carousel has overflow:hidden to clip off-screen
// slides. Any absolute child escaping that boundary gets clipped too.
// Solution: render the zoom preview as position:fixed at body level
// (the #zoomPortal div) — it has no overflow:hidden ancestor at all.
//
// On hover, JS clones the card's hidden .zoom-tpl into the portal,
// positions it above the card, and shows it.

var portal    = document.getElementById('zoomPortal');
var cardItems = document.querySelectorAll('.c-item');

function showZoom(item) {
  if (window.matchMedia('(hover: none)').matches) return; // skip on touch screens

  var tpl = item.querySelector('.zoom-tpl');
  if (!tpl) return;

  portal.innerHTML = tpl.innerHTML;

  var rect  = item.querySelector('.c-img-wrap').getBoundingClientRect();
  var pw    = 280; // portal width (matches CSS)
  var left  = rect.left + rect.width / 2 - pw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8)); // clamp to screen

  portal.style.left = left + 'px';
  portal.style.top  = rect.top + 'px'; // CSS transform lifts it above by height + gap

  portal.classList.add('visible');
  portal.setAttribute('aria-hidden', 'false');
}

function hideZoom() {
  portal.classList.remove('visible');
  portal.setAttribute('aria-hidden', 'true');
}

cardItems.forEach(function (item) {
  item.addEventListener('mouseenter', function () { showZoom(item); });
  item.addEventListener('mouseleave', hideZoom);
  item.addEventListener('focus',      function () { showZoom(item); });
  item.addEventListener('blur',       hideZoom);
});

// Hide if user scrolls (portal position would be stale)
window.addEventListener('scroll', hideZoom, { passive: true });
window.addEventListener('resize', hideZoom);


// ─── 5. Smooth Scroll ───────────────────────────────────────────
// Fallback for browsers that don't support CSS scroll-behavior

document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var href = this.getAttribute('href');
    if (!href || href === '#') { e.preventDefault(); return; }
    var target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});


// ─── 6. Scroll Reveal ───────────────────────────────────────────
// Fade cards in as they enter the viewport

if ('IntersectionObserver' in window) {
  var revealItems = document.querySelectorAll('.reveal');

  // Stagger delay per row (every 3rd item resets the delay)
  revealItems.forEach(function (el, i) {
    el.style.transitionDelay = ((i % 3) * 90) + 'ms';
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target); // animate once only
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealItems.forEach(function (el) { observer.observe(el); });
}
