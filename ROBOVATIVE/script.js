/* ==========================================================================
   ROBOVATIVE - Site Config (edit contact info / socials here)
   ========================================================================== */
const ROBOVATIVE_CONFIG = {
  phone: "+91 83410 57568",
  phoneHref: "+918341057568",
  email: "robovative.in@gmail.com",
  whatsappMessage: "Hello ROBOVATIVE, I would like to know more about your services.",
  address: "3rd Floor, Luminary Knowledge Park, Above Cream Stone Ice Cream, Tolichowki, Toli Chowki, Mehdipatnam, Hyderabad, Telangana 500008",
  // TODO: replace with the exact Google Maps share link/embed for the office
  mapsDirectionsUrl: "https://www.google.com/maps/search/?api=1&query=Luminary+Knowledge+Park+Tolichowki+Mehdipatnam+Hyderabad+Telangana+500008",
  mapsEmbedUrl: "https://www.google.com/maps?q=Luminary+Knowledge+Park+Tolichowki+Mehdipatnam+Hyderabad+Telangana+500008&output=embed",
  socials: {
    instagram: "https://www.instagram.com/robovative.in/",
    linkedin: "https://www.linkedin.com/company/robovative-innovation-in-robotics/",
    youtube: "#",   // TODO: add ROBOVATIVE YouTube URL
  },
  // TODO: this score/count reflects only the 3 reviews below — update both if your Google Business Profile shows more
  reviews: {
    score: 4.0,
    count: 3,
    url: "https://www.google.com/maps/place/ROBOVATIVE/@17.404193,78.4042939,17z/data=!4m8!3m7!1s0x3bcb97b6b7fb626d:0x6643f31cb8e047d1!8m2!3d17.4041879!4d78.4068688!9m1!1b1!16s%2Fg%2F11z9fnm81d",
    items: [
      { name: "mohd Asadullah hussaini", stars: 5, date: "2 months ago", text: "Excellent robotics lab with a great learning environment. The trainers explain concepts clearly, and the hands-on projects make learning fun and practical. A perfect place for students to develop creativity, coding, electronics, and problem-solving skills. Highly recommended!" },
      { name: "shoaib ahmed", stars: 5, date: "a month ago", text: "This is my new robotic it is very good you can make circuit here it is a very big factory please join in here" },
      { name: "Asif Ahmed", stars: 2, date: "2 months ago", text: "I ordered a custom 3D printed part, and I'm very impressed with the quality. The print was precise, durable, and well-finished. The seller understood my requirements perfectly and delivered on time. The entire process was smooth and professional. I would definitely order again." },
    ]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initLucide();
  initConfig();
  initNavbar();
  initMobileNav();
  initMegaMenuA11y();
  initRevealAnimations();
  initTrainingTabs();
  initProjectFilters();
  initInterestChips();
  initContactForm();
  initYear();
  initGallery();
  initWaPreview();
  initReviews();
});

/* ---- Icons ---- */
function initLucide(){
  if (window.lucide) lucide.createIcons();
}

/* ---- Inject config-driven values ---- */
function initConfig(){
  document.querySelectorAll("[data-phone]").forEach(el => el.textContent = ROBOVATIVE_CONFIG.phone);
  document.querySelectorAll("[data-email]").forEach(el => el.textContent = ROBOVATIVE_CONFIG.email);
  document.querySelectorAll("[data-address]").forEach(el => el.textContent = ROBOVATIVE_CONFIG.address);
  document.querySelectorAll("[data-wa-message]").forEach(el => el.textContent = ROBOVATIVE_CONFIG.whatsappMessage);

  document.querySelectorAll("[data-tel-link]").forEach(el => el.href = `tel:${ROBOVATIVE_CONFIG.phoneHref}`);
  document.querySelectorAll("[data-mail-link]").forEach(el => el.href = `mailto:${ROBOVATIVE_CONFIG.email}`);
  document.querySelectorAll("[data-directions-link]").forEach(el => el.href = ROBOVATIVE_CONFIG.mapsDirectionsUrl);

  const mapFrame = document.querySelector("[data-map-embed]");
  if (mapFrame) mapFrame.src = ROBOVATIVE_CONFIG.mapsEmbedUrl;

  const waText = encodeURIComponent(ROBOVATIVE_CONFIG.whatsappMessage);
  document.querySelectorAll("[data-wa-link]").forEach(el => {
    el.href = `https://wa.me/${ROBOVATIVE_CONFIG.phoneHref.replace("+","")}?text=${waText}`;
  });

  const ig = document.querySelector("[data-social-instagram]");
  const li = document.querySelector("[data-social-linkedin]");
  const yt = document.querySelector("[data-social-youtube]");
  if (ig) ig.href = ROBOVATIVE_CONFIG.socials.instagram;
  if (li) li.href = ROBOVATIVE_CONFIG.socials.linkedin;
  if (yt) yt.href = ROBOVATIVE_CONFIG.socials.youtube;
}

/* ---- Sticky navbar ---- */
function initNavbar(){
  const nav = document.querySelector(".navbar");
  if (!nav) return;
  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 30);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---- Mobile nav ---- */
function initMobileNav(){
  const btn = document.querySelector(".hamburger");
  const menu = document.querySelector(".mobile-nav");
  if (!btn || !menu) return;

  const close = () => {
    btn.classList.remove("open");
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };
  const toggle = () => {
    const open = btn.classList.toggle("open");
    menu.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };

  btn.addEventListener("click", toggle);
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
  window.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
}

/* ---- Mega menu keyboard accessibility ---- */
function initMegaMenuA11y(){
  document.querySelectorAll(".nav-item").forEach(item => {
    const trigger = item.querySelector(".nav-link");
    const mega = item.querySelector(".mega");
    if (!trigger || !mega) return;
    trigger.addEventListener("focus", () => mega.style.opacity = "1");
    item.addEventListener("focusout", (e) => {
      if (!item.contains(e.relatedTarget)) mega.style.opacity = "";
    });
  });
}

/* ---- Scroll reveal via IntersectionObserver ---- */
function initRevealAnimations(){
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach(el => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

  els.forEach(el => io.observe(el));

  // Stagger children with data-stagger
  document.querySelectorAll("[data-stagger]").forEach(group => {
    Array.from(group.children).forEach((child, i) => {
      child.style.transitionDelay = `${i * 80}ms`;
    });
  });
}

/* ---- Training tabs ---- */
function initTrainingTabs(){
  const tabs = document.querySelectorAll(".training-tab");
  const panels = document.querySelectorAll(".training-panel");
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle("active", t === tab));
      panels.forEach(p => p.classList.toggle("active", p.dataset.panel === target));
    });
  });
}

/* ---- Project filters ---- */
function initProjectFilters(){
  const filters = document.querySelectorAll(".project-filter");
  const cards = document.querySelectorAll(".project-card");
  if (!filters.length) return;

  filters.forEach(filter => {
    filter.addEventListener("click", () => {
      filters.forEach(f => f.classList.toggle("active", f === filter));
      const cat = filter.dataset.filter;
      cards.forEach(card => {
        const show = cat === "all" || card.dataset.category === cat;
        card.style.display = show ? "" : "none";
      });
    });
  });
}

/* ---- Interest chip multi-select ---- */
function initInterestChips(){
  document.querySelectorAll(".interest-chip").forEach(chip => {
    const input = chip.querySelector("input");
    if (!input) return;
    chip.addEventListener("click", (e) => {
      e.preventDefault();
      input.checked = !input.checked;
      chip.classList.toggle("checked", input.checked);
    });
  });
}

/* ---- Contact form validation ---- */
function initContactForm(){
  const form = document.querySelector("#contact-form");
  if (!form) return;
  const status = form.querySelector(".form-status");

  const setError = (field, message) => {
    const wrap = field.closest(".field");
    if (!wrap) return;
    wrap.classList.add("error");
    const errEl = wrap.querySelector(".field-error");
    if (errEl) errEl.textContent = message;
  };
  const clearError = (field) => {
    const wrap = field.closest(".field");
    if (wrap) wrap.classList.remove("error");
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    const name = form.querySelector("#f-name");
    const email = form.querySelector("#f-email");
    const phone = form.querySelector("#f-phone");
    const message = form.querySelector("#f-message");

    [name, email, phone, message].forEach(f => f && clearError(f));

    if (!name.value.trim()) { setError(name, "Please enter your name."); valid = false; }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailPattern.test(email.value.trim())) {
      setError(email, "Please enter a valid email address."); valid = false;
    }

    const phonePattern = /^[\d+\-\s()]{7,15}$/;
    if (!phone.value.trim() || !phonePattern.test(phone.value.trim())) {
      setError(phone, "Please enter a valid phone number."); valid = false;
    }

    if (!message.value.trim() || message.value.trim().length < 10) {
      setError(message, "Please tell us a little more (10+ characters)."); valid = false;
    }

    status.classList.remove("show", "success", "error");

    if (!valid) {
      status.classList.add("show", "error");
      status.innerHTML = `<i data-lucide="alert-circle"></i> Please fix the highlighted fields and try again.`;
      initLucide();
      return;
    }

    // No backend is connected yet — show a clear success state.
    // TODO: wire this up to an email service / backend endpoint.
    status.classList.add("show", "success");
    status.innerHTML = `<i data-lucide="check-circle-2"></i> Thanks — your enquiry details are ready. Please also reach us directly on WhatsApp or phone for the fastest response.`;
    initLucide();
    form.reset();
    document.querySelectorAll(".interest-chip").forEach(c => c.classList.remove("checked"));
  });
}

/* ---- Gallery carousel + quick-view lightbox ---- */
function initGallery(){
  const carousel = document.querySelector("#galleryCarousel");
  const items = Array.from(document.querySelectorAll("[data-lightbox]"));
  if (!items.length) return;

  const prevBtn = document.querySelector("#galleryPrev");
  const nextBtn = document.querySelector("#galleryNext");
  if (carousel && prevBtn && nextBtn) {
    const scrollByCard = (dir) => {
      const card = carousel.querySelector(".gallery-item");
      const distance = card ? card.getBoundingClientRect().width + 20 : 300;
      carousel.scrollBy({ left: dir * distance, behavior: "smooth" });
    };
    prevBtn.addEventListener("click", () => scrollByCard(-1));
    nextBtn.addEventListener("click", () => scrollByCard(1));
  }

  const lightbox = document.querySelector("#lightbox");
  if (!lightbox) return;
  const img = lightbox.querySelector("#lightboxImg");
  const caption = lightbox.querySelector("#lightboxCaption");
  const closeBtn = lightbox.querySelector("#lightboxClose");
  const prevNav = lightbox.querySelector("#lightboxPrev");
  const nextNav = lightbox.querySelector("#lightboxNext");
  let current = 0;

  const show = (i) => {
    current = (i + items.length) % items.length;
    const el = items[current];
    img.src = el.dataset.full;
    img.alt = el.dataset.caption || "";
    caption.textContent = el.dataset.caption || "";
  };
  const open = (i) => {
    show(i);
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  };

  items.forEach((el, i) => el.addEventListener("click", () => open(i)));
  closeBtn.addEventListener("click", close);
  prevNav.addEventListener("click", () => show(current - 1));
  nextNav.addEventListener("click", () => show(current + 1));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });
  window.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
}

/* ---- WhatsApp quick-view chat preview ---- */
function initWaPreview(){
  const panel = document.querySelector("#waPreview");
  const toggleBtn = document.querySelector("[data-wa-toggle]");
  const closeBtn = document.querySelector("#waPreviewClose");
  if (!panel || !toggleBtn) return;

  const show = () => panel.classList.add("show");
  const hide = () => panel.classList.remove("show");

  toggleBtn.addEventListener("click", () => panel.classList.toggle("show"));
  closeBtn?.addEventListener("click", (e) => { e.stopPropagation(); hide(); localStorage.setItem("robovativeWaDismissed", "1"); });
  panel.querySelector(".wa-preview-cta")?.addEventListener("click", () => localStorage.setItem("robovativeWaDismissed", "1"));

  // Auto-open once per visitor, so the pre-filled message is easy to find without hunting for the button.
  if (!localStorage.getItem("robovativeWaDismissed")) {
    setTimeout(show, 4000);
  }
}

/* ---- Google reviews (config-driven) ---- */
const STAR_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7L12 2.5Z"/></svg>';

function starsMarkup(rating, starCount){
  const bg = STAR_SVG.repeat(starCount);
  const fg = STAR_SVG.repeat(starCount);
  const pct = Math.max(0, Math.min(100, (rating / starCount) * 100));
  return `<span class="stars-bg">${bg}</span><span class="stars-fg" style="width:${pct}%">${fg}</span>`;
}

function initReviews(){
  const cfg = ROBOVATIVE_CONFIG.reviews;
  if (!cfg) return;

  const scoreEl = document.querySelector("[data-review-score]");
  const starsEl = document.querySelector("[data-review-stars]");
  const countEl = document.querySelector("[data-review-count]");
  const linkEl = document.querySelector("[data-review-link]");
  const carousel = document.querySelector("#reviewsCarousel");

  if (linkEl) linkEl.href = cfg.url;

  if (scoreEl) scoreEl.textContent = cfg.score.toFixed(1);
  if (starsEl) starsEl.innerHTML = starsMarkup(cfg.score, 5);
  if (countEl) countEl.textContent = `Based on ${cfg.count} review${cfg.count === 1 ? "" : "s"}`;

  if (carousel && Array.isArray(cfg.items)) {
    carousel.innerHTML = cfg.items.map(r => `
      <div class="review-card">
        <div class="review-card-head">
          <div class="review-avatar">${(r.name || "?").charAt(0).toUpperCase()}</div>
          <div class="review-name-wrap">
            <div class="review-name">${r.name}</div>
            <div class="review-date">${r.date}</div>
          </div>
        </div>
        <span class="stars">${starsMarkup(r.stars, 5)}</span>
        <p class="review-text">${r.text}</p>
      </div>
    `).join("");
  }
}

/* ---- Footer year ---- */
function initYear(){
  const el = document.querySelector("[data-year]");
  if (el) el.textContent = new Date().getFullYear();
}

/* ---- Hero parallax on mouse move ---- */
(function initHeroParallax(){
  const visual = document.querySelector(".hero-visual-frame");
  if (!visual) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const hero = document.querySelector(".hero");
  hero?.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    visual.style.transform = `rotateY(${x * 6}deg) rotateX(${y * -6}deg)`;
  });
  hero?.addEventListener("mouseleave", () => {
    visual.style.transform = "rotateY(0deg) rotateX(0deg)";
  });
})();
