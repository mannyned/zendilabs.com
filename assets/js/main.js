(function () {
  'use strict';

  // ─── Theme toggle (dark/light) ───
  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    var root = document.documentElement;

    function labelFor(isLight) {
      return isLight ? 'Switch to dark mode' : 'Switch to light mode';
    }

    themeToggle.setAttribute('aria-label', labelFor(root.classList.contains('light')));

    themeToggle.addEventListener('click', function () {
      var isLight = root.classList.toggle('light');
      themeToggle.setAttribute('aria-label', labelFor(isLight));
      try {
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
      } catch (e) {
        /* localStorage unavailable (private browsing, etc.) — theme just won't persist */
      }
    });
  }

  // ─── Mobile navigation ───
  var toggle = document.querySelector('.nav-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (toggle && mobileNav) {
    var menuIcon = toggle.innerHTML;
    var closeIcon =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    function setNavOpen(isOpen) {
      mobileNav.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      toggle.innerHTML = isOpen ? closeIcon : menuIcon;
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setNavOpen(!mobileNav.classList.contains('is-open'));
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setNavOpen(false);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        setNavOpen(false);
        toggle.focus();
      }
    });
  }

  // ─── Active nav link (belt-and-suspenders; pages also set aria-current inline) ───
  var currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('a.nav-link').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.setAttribute('aria-current', 'page');
    }
  });

  // ─── Reveal-on-scroll ───
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');
  if (!reduceMotion && 'IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ─── Contact form ───
  var form = document.getElementById('contact-form');
  if (form) {
    var statusEl = document.getElementById('form-status');
    var submitBtn = form.querySelector('button[type="submit"]');

    var requiredFields = form.querySelectorAll('[required]');

    function showFieldError(field, message) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.add('has-error');
      var errEl = wrap.querySelector('.field-error');
      if (errEl) errEl.textContent = message;
    }

    function clearFieldError(field) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.remove('has-error');
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    requiredFields.forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
    });

    function validateField(field) {
      clearFieldError(field);
      if (!field.value || !field.value.trim()) {
        showFieldError(field, 'This field is required.');
        return false;
      }
      if (field.type === 'email' && !isValidEmail(field.value.trim())) {
        showFieldError(field, 'Enter a valid email address.');
        return false;
      }
      return true;
    }

    function setStatus(message, type) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = 'form-status' + (type ? ' is-' + type : '');
      statusEl.setAttribute('role', type === 'error' ? 'alert' : 'status');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot spam trap — bots tend to fill every field
      var honeypot = form.querySelector('input[name="company_website"]');
      if (honeypot && honeypot.value) {
        return;
      }

      var valid = true;
      requiredFields.forEach(function (field) {
        if (!validateField(field)) valid = false;
      });

      if (!valid) {
        setStatus('Please fix the highlighted fields and try again.', 'error');
        return;
      }

      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint || endpoint.indexOf('REPLACE_WITH') !== -1) {
        setStatus(
          'Form delivery is not configured yet. Please email us directly at contact@zendilabs.com.',
          'error'
        );
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      setStatus('', '');

      fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            setStatus("Thanks — we'll be in touch within one business day.", 'success');
          } else {
            setStatus('Something went wrong sending your message. Please try again or email contact@zendilabs.com.', 'error');
          }
        })
        .catch(function () {
          setStatus('Something went wrong sending your message. Please try again or email contact@zendilabs.com.', 'error');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Project Inquiry';
        });
    });
  }
})();
