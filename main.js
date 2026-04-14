(function () {
  'use strict';

  /* ── 1. Config Loader ──────────────────────────────────── */
  function loadConfig() {
    // XHR requires HTTP/HTTPS — blocked on file:// by browser security policy.
    // For local dev run:  python3 -m http.server 8080  then open localhost:8080
    // On GitHub Pages this fetch works fine — config.json is the single source of truth.
    if (window.location.protocol === 'file:') {
      console.warn('[Sherwood] Config not loaded: open via a local server, not file://.\n  Run: python3 -m http.server 8080');
      return;
    }
    var scripts = document.querySelectorAll('script[src*="main.js"]');
    var basePath = '';
    if (scripts.length) {
      var src = scripts[scripts.length - 1].getAttribute('src');
      basePath = src.replace(/main\.js.*$/, '');
    }
    var url = basePath + 'config.json';
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onload = function () {
        if (xhr.status === 200) {
          try { applyAll(JSON.parse(xhr.responseText)); } catch (e) {}
        }
      };
      xhr.send();
    } catch (e) {}
  }

  function applyAll(cfg) {
    window._cfg = cfg;
    applyConfig(cfg);
    applyHolidayBanner(cfg);
  }

  function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce(function (o, k) {
      return o && o[k] !== undefined ? o[k] : null;
    }, obj);
  }

  /* Format phone: always display as (XXX) XXX-XXXX */
  function formatPhone(raw) {
    var digits = raw.replace(/\D/g, '');
    if (digits.length === 10) {
      return '(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6);
    }
    if (digits.length === 11 && digits[0] === '1') {
      return '(' + digits.slice(1,4) + ') ' + digits.slice(4,7) + '-' + digits.slice(7);
    }
    return raw; // return as-is if not standard
  }

  function applyConfig(cfg) {
    // 1. Update all data-config text elements
    document.querySelectorAll('[data-config]').forEach(function (el) {
      var key = el.getAttribute('data-config');
      var value = getNestedValue(cfg, key);
      if (value !== null && value !== '') {
        if (key === 'phone') {
          el.textContent = formatPhone(value);
        } else {
          el.textContent = value;
        }
      }
    });

    // 2. Config-driven links via data-config-link attribute
    if (cfg.phone) {
      var phoneDigits = cfg.phone.replace(/\D/g, '');
      document.querySelectorAll('[data-config-link="phone"]').forEach(function (a) {
        a.href = 'tel:' + phoneDigits;
      });
    }
    if (cfg.email) {
      document.querySelectorAll('[data-config-link="email"]').forEach(function (a) {
        a.href = 'mailto:' + cfg.email;
      });
    }
    if (cfg.googleMapsUrl) {
      document.querySelectorAll('[data-config-link="maps"]').forEach(function (a) {
        a.href = cfg.googleMapsUrl;
      });
    }
    if (cfg.facebookUrl) {
      document.querySelectorAll('[data-config-link="facebook"]').forEach(function (a) {
        a.href = cfg.facebookUrl;
      });
    }
    if (cfg.instagramUrl) {
      document.querySelectorAll('[data-config-link="instagram"]').forEach(function (a) {
        a.href = cfg.instagramUrl;
      });
    }
  }

  function applyHolidayBanner(cfg) {
    if (cfg.holidayMessage && cfg.holidayMessage.trim() !== '') {
      var banner = document.createElement('div');
      banner.className = 'holiday-banner visible';
      banner.textContent = cfg.holidayMessage;
      document.body.insertBefore(banner, document.body.firstChild);
    }
  }

  /* ── 2. Mobile Nav Toggle ──────────────────────────────── */
  function initMobileNav() {
    var nav    = document.getElementById('main-nav');
    var toggle = document.querySelector('.nav-toggle');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav-menu a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 1024) {
          if (link.parentElement.classList.contains('has-dropdown')) return;
          nav.classList.remove('nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* ── 3. Dropdown Menu ──────────────────────────────────── */
  function initDropdowns() {
    document.querySelectorAll('.has-dropdown').forEach(function (parent) {
      var link = parent.querySelector('a');
      if (!link) return;
      link.addEventListener('click', function (e) {
        if (window.innerWidth <= 1024) {
          e.preventDefault();
          parent.classList.toggle('open');
        }
      });
    });
  }

  /* ── 4. Hero Slider ────────────────────────────────────── */
  function initHeroSlider() {
    var slider = document.querySelector('.hero-slider');
    if (!slider) return;
    var slides = slider.querySelectorAll('.slide');
    var dotsWrap = slider.querySelector('.slider-dots');
    var prevBtn = slider.querySelector('.slider-prev');
    var nextBtn = slider.querySelector('.slider-next');
    if (!slides.length) return;
    var current = 0, total = slides.length, autoTimer = null;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); resetAuto(); });
      dotsWrap.appendChild(dot);
    });
    function updateDots() {
      dotsWrap.querySelectorAll('.slider-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === current);
      });
    }
    function goTo(index) {
      slides[current].classList.remove('active');
      current = (index + total) % total;
      slides[current].classList.add('active');
      updateDots();
    }
    function startAuto() { autoTimer = setInterval(function () { goTo(current + 1); }, 5000); }
    function resetAuto() { clearInterval(autoTimer); startAuto(); }
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); resetAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); resetAuto(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { goTo(current - 1); resetAuto(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); resetAuto(); }
    });
    startAuto();
  }

  /* ── 5. Testimonials Slider ────────────────────────────── */
  function initTestimonialsSlider() {
    var section = document.querySelector('.testimonials-section');
    if (!section) return;
    var items = section.querySelectorAll('.testimonial');
    var dotsWrap = section.querySelector('.testimonial-dots');
    if (!items.length || !dotsWrap) return;
    var current = 0, total = items.length;
    items.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });
    function goTo(index) {
      items[current].classList.remove('active');
      current = (index + total) % total;
      items[current].classList.add('active');
      dotsWrap.querySelectorAll('.testimonial-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === current);
      });
    }
    setInterval(function () { goTo(current + 1); }, 6000);
  }

  /* ── 6. Sticky Header ──────────────────────────────────── */
  function initStickyHeader() {
    var topbar = document.querySelector('.header-topbar');
    var nav = document.getElementById('main-nav');
    if (!nav) return;
    var topbarH = topbar ? topbar.offsetHeight : 50;
    function onScroll() { nav.classList.toggle('is-sticky', window.scrollY > topbarH); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 7. Back to Top ────────────────────────────────────── */
  function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 8. Current Page Highlight ─────────────────────────── */
  function initActiveNav() {
    var path = window.location.pathname;
    document.querySelectorAll('.nav-menu > li > a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href === '#') return;
      var a = document.createElement('a');
      a.href = href;
      if (a.pathname === path || (a.pathname !== '/' && path.indexOf(a.pathname) === 0)) {
        link.classList.add('active');
      }
    });
  }

  /* ── 9. Contact Forms → mailto ──────────────────────────── */
  function initContactForms() {
    document.querySelectorAll('.contact-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var cfg = window._cfg || {};
        var name = (form.querySelector('[name="name"]') || {}).value || '';
        var email = (form.querySelector('[name="email"]') || {}).value || '';
        var message = (form.querySelector('[name="message"]') || {}).value || '';
        var to = cfg.email || 'info@sherwoodnurseries.ca';
        var subject = 'Website Inquiry from ' + name;
        var body = 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message;
        window.location.href = 'mailto:' + to
          + '?subject=' + encodeURIComponent(subject)
          + '&body=' + encodeURIComponent(body);
      });
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    loadConfig();
    initMobileNav();
    initDropdowns();
    initHeroSlider();
    initTestimonialsSlider();
    initStickyHeader();
    initBackToTop();
    initActiveNav();
    initContactForms();
  });

})();
