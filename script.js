// ============ Scroll reveal ============
document.addEventListener('DOMContentLoaded', () => {

  // ============ Dynamic site content (Hero + Footer, admin-editable) ============
  // Falls back silently to the static HTML already on the page if no backend
  // is connected yet, or if the site_content table/rows don't exist.
  (async function loadDynamicContent() {
    if (typeof supabaseClient === 'undefined') return;
    try {
      const { data, error } = await supabaseClient.from('site_content').select('key, value');
      if (error || !data) return;
      const content = Object.fromEntries(data.map(row => [row.key, row.value]));

      if (content.hero) {
        const { eyebrow, heading, subtext, accent_words } = content.hero;
        const eyebrowEl = document.getElementById('hero-eyebrow-text');
        const headingEl = document.getElementById('hero-heading');
        const subtextEl = document.getElementById('hero-subtext');
        if (eyebrowEl && eyebrow) eyebrowEl.textContent = eyebrow;
        if (subtextEl && subtext) subtextEl.textContent = subtext;
        if (headingEl && heading) {
          const words = heading.split(' ');
          const accentCount = accent_words || 3;
          headingEl.innerHTML = words.map((w, i) => {
            const isAccent = i >= words.length - accentCount;
            return `<span class="word${isAccent ? ' text-gradient' : ''}" style="transition-delay:${i * 70}ms">${w}</span>`;
          }).join(' ');
          headingEl.classList.add('is-visible'); // already-loaded hero shouldn't wait for scroll
        }
      }

      if (content.footer) {
        const { blurb, address, phone } = content.footer;
        const blurbEl = document.getElementById('footer-blurb-text');
        const addressEl = document.getElementById('footer-address-text');
        const phoneEl = document.getElementById('footer-phone-text');
        if (blurbEl && blurb) blurbEl.textContent = blurb;
        if (addressEl && address) addressEl.textContent = address;
        if (phoneEl && phone) phoneEl.textContent = phone;
      }
    } catch (e) {
      // No backend connected yet — static content stays as-is.
    }
  })();

  // ============ Theme toggle (light/dark) ============
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('nebro-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nebro-theme', next);
  });

  // ============ Animated counters (re-trigger every time in view) ============
  document.querySelectorAll('[data-count-to]').forEach(el => {
    const target = parseFloat(el.dataset.countTo);
    const suffix = el.dataset.countSuffix || '';
    const duration = 1200;
    let animating = false;
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animating) {
          animating = true;
          const start = performance.now();
          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(target * eased).toLocaleString();
            el.textContent = value + suffix;
            if (progress < 1) requestAnimationFrame(tick);
            else animating = false;
          }
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.5 });
    counterIO.observe(el);
  });

  // ============ Animated word-by-word headings ============
  // Wrap each word in a span BEFORE observing, so the stagger animates in.
  document.querySelectorAll('[data-animate-text]').forEach(el => {
    const text = el.textContent;
    el.innerHTML = text.split(' ').map((word, i) =>
      `<span class="word" style="transition-delay:${i * 55}ms">${word}</span>`
    ).join(' ');
    el.classList.add('animate-words');
  });

  const els = document.querySelectorAll('.reveal, .animate-words');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));

  // ============ Contact page: Quote vs Appointment tab toggle ============
  const tabQuote = document.getElementById('tab-quote');
  const tabAppointment = document.getElementById('tab-appointment');
  if (tabQuote && tabAppointment) {
    const formHeading = document.getElementById('form-heading');
    const formSubheading = document.getElementById('form-subheading');
    const detailsLabel = document.getElementById('details-label');
    const urgencyField = document.getElementById('urgency-field');
    const submitBtn = document.getElementById('form-submit-btn');

    const copy = {
      quote: {
        heading: 'Request a Quote',
        sub: "Fill out the form below and we'll get back to you within 24 hours with a detailed quote.",
        details: 'Detailed Requirements *',
        submit: 'Send Quote Request',
      },
      appointment: {
        heading: 'Request an Appointment',
        sub: "Tell us when works for you and we'll confirm a time to visit or call.",
        details: 'What would you like to discuss? *',
        submit: 'Request Appointment',
      },
    };

    function setTab(tab) {
      tabQuote.setAttribute('aria-pressed', tab === 'quote' ? 'true' : 'false');
      tabAppointment.setAttribute('aria-pressed', tab === 'appointment' ? 'true' : 'false');
      formHeading.textContent = copy[tab].heading;
      formSubheading.textContent = copy[tab].sub;
      detailsLabel.textContent = copy[tab].details;
      submitBtn.lastChild.textContent = ' ' + copy[tab].submit;
      if (urgencyField) urgencyField.style.display = tab === 'quote' ? '' : 'none';
    }
    tabQuote.addEventListener('click', () => setTab('quote'));
    tabAppointment.addEventListener('click', () => setTab('appointment'));
  }

  // ============ Mobile nav toggle ============
  const toggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('flex');
      mobileNav.classList.toggle('hidden');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.getElementById('icon-open')?.classList.toggle('hidden');
      document.getElementById('icon-close')?.classList.toggle('hidden');
    });
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.add('hidden');
        mobileNav.classList.remove('flex');
        toggle.setAttribute('aria-expanded', 'false');
        document.getElementById('icon-open')?.classList.remove('hidden');
        document.getElementById('icon-close')?.classList.add('hidden');
      });
    });
  }

  // ============ Header shadow on scroll ============
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ============ Product / specialization hover switcher ============
  document.querySelectorAll('[data-switcher]').forEach(switcher => {
    const triggers = switcher.querySelectorAll('[data-switch-trigger]');
    const panels = switcher.querySelectorAll('[data-switch-panel]');
    triggers.forEach(trigger => {
      const activate = () => {
        const key = trigger.dataset.switchTrigger;
        triggers.forEach(t => t.classList.toggle('is-active', t === trigger));
        panels.forEach(p => p.classList.toggle('is-active', p.dataset.switchPanel === key));
      };
      trigger.addEventListener('mouseenter', activate);
      trigger.addEventListener('focus', activate);
      trigger.addEventListener('click', activate);
    });
  });

  // ============ Hero / page slideshow ============
  document.querySelectorAll('[data-slideshow]').forEach(show => {
    const slides = Array.from(show.querySelectorAll('.slide'));
    const dotsWrap = show.querySelector('.slide-dots');
    if (!slides.length) return;
    let dots = [];
    if (dotsWrap) {
      dots = slides.map((_, i) => {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'slide-dot' + (i === 0 ? ' is-active' : '');
        d.setAttribute('aria-label', `Show slide ${i + 1}`);
        d.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(d);
        return d;
      });
    }
    let current = 0;
    let timer;
    function goTo(i) {
      slides[current].classList.remove('is-active');
      dots[current]?.classList.remove('is-active');
      current = i;
      slides[current].classList.add('is-active');
      dots[current]?.classList.add('is-active');
    }
    function next() { goTo((current + 1) % slides.length); }
    function start() {
      if (slides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        timer = setInterval(next, 4500);
      }
    }
    show.addEventListener('mouseenter', () => clearInterval(timer));
    show.addEventListener('mouseleave', start);
    start();
  });

  // ============ Product category filter (products.html) ============
  const filterButtons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.product-card');
  const emptyState = document.getElementById('empty-state');
  if (filterButtons.length && cards.length) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        const filter = btn.dataset.filter;
        let visibleCount = 0;
        cards.forEach(card => {
          const match = filter === 'all' || card.dataset.category === filter;
          card.classList.toggle('hidden-card', !match);
          if (match) visibleCount++;
        });
        if (emptyState) emptyState.classList.toggle('hidden', visibleCount !== 0);
      });
    });
  }

  // ============ Contact / quote form (front-end only) ============
  const quoteForm = document.getElementById('quote-form');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const feedback = document.getElementById('form-feedback');
      if (feedback) {
        feedback.textContent = 'Thanks — this form is a front-end preview only. Connect it to Web3Forms, Formspree, or your backend to receive real submissions.';
        feedback.classList.remove('hidden');
      }
      quoteForm.reset();
    });
  }

  // ============ AI assistant widget (front-end demo) ============
  const aiButton = document.getElementById('ai-widget-button');
  const aiPanel = document.getElementById('ai-widget-panel');
  const aiForm = document.getElementById('ai-widget-form');
  const aiMessages = document.getElementById('ai-widget-messages');
  const aiInput = document.getElementById('ai-widget-input');

  if (aiButton && aiPanel) {
    aiButton.addEventListener('click', () => aiPanel.classList.toggle('is-open'));
    document.getElementById('ai-widget-close')?.addEventListener('click', () => aiPanel.classList.remove('is-open'));
  }

  if (aiForm && aiInput && aiMessages) {
    const canned = [
      { match: /price|cost|quote/i, reply: "Happy to help with pricing — the fastest way is the Request a Quote form on our Contact page. Want me to take you there?" },
      { match: /ventilator|icu|surgical/i, reply: "Our Surgical & ICU range includes patient monitors, ventilators, and instrument sets — check the Products page and filter by \"Surgical & ICU\"." },
      { match: /lab|analyzer|laboratory/i, reply: "For laboratory equipment — hematology and biochemistry analyzers, centrifuges — see the Laboratory filter on our Products page." },
      { match: /diagnostic|stethoscope|bp monitor|oximeter/i, reply: "Diagnostic devices like stethoscopes, BP monitors, and oximeters are all under the Diagnostic filter on Products." },
      { match: /contact|phone|email|reach/i, reply: "You can reach our team at info@nebro.co.tz or +255 621 132 663 — or use the form on our Contact page." },
      { match: /delivery|shipping|logistics/i, reply: "We track every order from dispatch to installation, with typical quote turnaround around 48 hours. Delivery timelines depend on the equipment and your location." },
    ];
    aiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = aiInput.value.trim();
      if (!text) return;
      const userMsg = document.createElement('div');
      userMsg.className = 'ai-msg user';
      userMsg.textContent = text;
      aiMessages.appendChild(userMsg);
      aiInput.value = '';
      aiMessages.scrollTop = aiMessages.scrollHeight;

      setTimeout(() => {
        const found = canned.find(c => c.match.test(text));
        const reply = found ? found.reply : "Thanks for the question — this assistant is a front-end preview. For a real answer right now, reach us at info@nebro.co.tz or use the Contact form.";
        const botMsg = document.createElement('div');
        botMsg.className = 'ai-msg bot';
        botMsg.textContent = reply;
        aiMessages.appendChild(botMsg);
        aiMessages.scrollTop = aiMessages.scrollHeight;
      }, 500);
    });
  }
});
