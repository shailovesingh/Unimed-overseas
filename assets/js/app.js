(function () {
  'use strict';

  const STORAGE_KEY = 'unimed_welcome_completed';
  
  // Mapping of country codes to their standard mobile number digit lengths
  const PHONE_LENGTHS = {
    '+91': 10,   // India
    '+977': 10,  // Nepal
    '+880': 10,  // Bangladesh
    '+63': 10,   // Philippines
    '+44': 10,   // UK
    '+7': 10,    // Russia & Kazakhstan
    '+995': 9,   // Georgia
    '+373': 8,   // Moldova
    '+998': 9,   // Uzbekistan
    '+996': 9    // Kyrgyzstan
  };

  const dialog = document.getElementById('welcome-dialog');
  const form = document.getElementById('enquiry-form');
  const showWelcome = document.body.dataset.showWelcome === 'true';

  // Read WhatsApp redirect phone dynamically from form to prevent hardcoding redundancy (BUG-03)
  const WHATSAPP = (form && form.dataset.whatsapp) || '918854018866';

  function lockPage(lock) {
    document.body.classList.toggle('modal-locked', lock);
    document.body.classList.toggle('has-welcome-pending', lock);
  }

  function openWelcomeDialog() {
    if (!dialog) return;
    dialog.hidden = false;
    lockPage(true);
    const firstInput = dialog.querySelector('input, select');
    if (firstInput) firstInput.focus();
  }

  function closeWelcomeDialog(persist) {
    if (!dialog) return;
    dialog.hidden = true;
    lockPage(false);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch (_) {
        /* ignore */
      }
    }
  }

  function buildWhatsAppMessage(data) {
    const budgets = data.budgets.length ? data.budgets.join(', ') : 'Not specified';
    return [
      '🎓 *Unimed Overseas — New Enquiry*',
      '',
      `*Name:* ${data.fullName}`,
      `*Mobile:* ${data.countryCode} ${data.mobile}`,
      `*Email:* ${data.email}`,
      `*NEET Score:* ${data.neetScore || 'Not provided'}`,
      `*Preferred Country:* ${data.country}`,
      `*Budget:* ${budgets}`,
    ].join('\n');
  }

  // --- Dynamic Input Validations (BUG-02) ---
  if (form) {
    const countryCodeSelect = form.querySelector('[name="countryCode"]');
    const mobileInput = form.querySelector('[name="mobile"]');
    const neetInput = form.querySelector('[name="neetScore"]');

    // Dynamic mobile length and pattern validation based on country code
    if (countryCodeSelect && mobileInput) {
      const updatePhoneValidation = () => {
        const selectedCode = countryCodeSelect.value;
        const expectedLength = PHONE_LENGTHS[selectedCode] || 10;
        
        mobileInput.pattern = `[0-9]{${expectedLength}}`;
        mobileInput.placeholder = `Enter ${expectedLength}-digit mobile number`;
        mobileInput.title = `Mobile number must be exactly ${expectedLength} digits.`;
        
        // Reset validity on change
        mobileInput.setCustomValidity('');
      };
      
      countryCodeSelect.addEventListener('change', updatePhoneValidation);
      updatePhoneValidation(); // Initial setup on load
    }

    // Interactive NEET Score range verification
    if (neetInput) {
      neetInput.addEventListener('input', () => {
        const val = Number(neetInput.value);
        if (neetInput.value !== '' && (isNaN(val) || val < 0 || val > 720)) {
          neetInput.setCustomValidity('NEET-UG Score must be an integer between 0 and 720.');
        } else {
          neetInput.setCustomValidity('');
        }
      });
    }
  }

  // --- Overlay and Key Listeners (BUG-01) ---
  if (dialog) {
    dialog.querySelectorAll('[data-close-dialog]').forEach((el) => {
      el.addEventListener('click', () => closeWelcomeDialog(true));
    });

    // Keyboard accessibility: Escape close handling and Dropdown closing
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!dialog.hidden) {
          closeWelcomeDialog(true);
        } else {
          // Close open navigation dropdowns
          const openDropdowns = document.querySelectorAll('.nav-dropdown.open');
          openDropdowns.forEach((d) => {
            d.classList.remove('open');
            const trigger = d.querySelector('.nav-dropdown-trigger');
            if (trigger) {
              trigger.setAttribute('aria-expanded', 'false');
              trigger.focus();
            }
          });
        }
      }
    });

    // Dialog Focus Trap for accessibility
    const focusableElements = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex="0"]');
    if (focusableElements.length > 0) {
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      dialog.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstFocusable) {
              lastFocusable.focus();
              e.preventDefault();
            }
          } else { // Tab
            if (document.activeElement === lastFocusable) {
              firstFocusable.focus();
              e.preventDefault();
            }
          }
        }
      });
    }
  }

  // Handle all [data-trigger-enquiry] buttons (e.g. Hero Section CTA) (BUG-01)
  document.querySelectorAll('[data-trigger-enquiry]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openWelcomeDialog();
    });
  });

  // --- Submit Handler ---
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const fd = new FormData(form);
      const budgets = fd.getAll('budget');
      const payload = {
        fullName: fd.get('fullName'),
        countryCode: fd.get('countryCode'),
        mobile: fd.get('mobile'),
        email: fd.get('email'),
        neetScore: fd.get('neetScore'),
        country: fd.get('country'),
        budgets,
      };

      const text = encodeURIComponent(buildWhatsAppMessage(payload));
      window.open(`https://wa.me/${WHATSAPP}?text=${text}`, '_blank', 'noopener,noreferrer');
      closeWelcomeDialog(true);
    });
  }

  // --- Automatic Popup Trigger Logic ---
  if (showWelcome && dialog) {
    let seen = false;
    try {
      seen = localStorage.getItem(STORAGE_KEY) === '1';
    } catch (_) {
      seen = false;
    }
    if (!seen) {
      openWelcomeDialog();
    } else {
      lockPage(false);
      document.body.classList.remove('has-welcome-pending');
    }
  }

  // --- Navigation Toggle (Mobile) ---
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.getElementById('site-nav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const open = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // --- Navigation Dropdowns (Desktop & Mobile Click) ---
  document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
    const trigger = dropdown.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // --- Close Dropdowns on Click Outside / Mobile Tap Away ---
  const closeAllDropdowns = () => {
    document.querySelectorAll('.nav-dropdown.open').forEach((d) => {
      d.classList.remove('open');
      const t = d.querySelector('.nav-dropdown-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  };

  document.addEventListener('click', closeAllDropdowns);
  
  // Touch event listener specifically for iOS tap-away bubbling support
  document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
      closeAllDropdowns();
    }
  }, { passive: true });

  // --- Dynamic Table Responsive Wrapper Injection ---
  document.querySelectorAll('.content-panel table').forEach((table) => {
    if (table.parentElement?.classList.contains('table-scroll')) return;
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });

  // --- Dynamic Active navigation link highlighting based on current path ---
  const currentPath = window.location.pathname;
  document.querySelectorAll('.site-nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href) {
      // Handle index.html and root path mapping
      const isHome = href === 'index.html' || href === './' || href === '';
      const pathEndsWithHref = currentPath.endsWith(href);
      const isRootPath = currentPath === '/' || currentPath.endsWith('/index.html');
      
      if ((isHome && isRootPath) || (!isHome && pathEndsWithHref)) {
        link.classList.add('active');
        
        // Parent link highlight awareness (Destinations Dropdown Trigger)
        const parentDropdown = link.closest('.nav-dropdown');
        if (parentDropdown) {
          const trigger = parentDropdown.querySelector('.nav-dropdown-trigger');
          if (trigger) trigger.classList.add('active');
        }
      }
    }
  });

  // --- Speculative Page Prefetching (Hover to Load) ---
  const prefetchCache = new Set();
  document.querySelectorAll('a[href]').forEach((link) => {
    const url = link.getAttribute('href');
    if (!url || url.startsWith('http') || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) return;
    
    link.addEventListener('mouseenter', () => {
      if (prefetchCache.has(url)) return;
      prefetchCache.add(url);
      
      const linkEl = document.createElement('link');
      linkEl.rel = 'prefetch';
      linkEl.href = url;
      document.head.appendChild(linkEl);
    }, { once: true });
  });
})();
