/* CAIS — 交互脚本
   双城时钟 / 主题开关 / Show all projects / 项目详情覆盖层 / 新闻卡滚动进场 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 双城时钟：纽约 ⇄ 伦敦，每 6 秒轮换 ---------- */
  var CITIES = [
    { zone: "America/New_York", label: "New York" },
    { zone: "Europe/London", label: "London" }
  ];
  var cityIndex = 0;

  function parts(date, zone) {
    var dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "long", day: "numeric", month: "long" });
    var timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    var day = dayFmt.format(date);
    var time = timeFmt.format(date).replace(/\s?[AP]M$/i, "");
    return { day: day, time: time };
  }

  function tickClock(swap) {
    var el = document.querySelector("[data-clock]");
    if (!el) return;
    var now = new Date();
    var city = CITIES[cityIndex];
    var p = parts(now, city.zone);
    var inner = el.querySelector(".clock__inner");
    if (inner && swap) {
      el.classList.remove("clock--swap");
      void el.offsetWidth; /* 重启动画 */
      el.classList.add("clock--swap");
    }
    if (inner) {
      inner.innerHTML =
        '<span class="clock__line">' + p.day + "</span>" +
        '<span class="clock__line clock__city">' + city.label + ", " + p.time + "</span>";
    }
    el.setAttribute("aria-label", city.label + " time, " + p.day + ", " + p.time);
  }

  var clockEl = document.querySelector("[data-clock]");
  if (clockEl) {
    clockEl.innerHTML = '<span class="clock__inner" aria-live="polite"></span>';
    tickClock(false);
    setInterval(tickClock, 1000, false);
    if (!reduceMotion) setInterval(function () { cityIndex = (cityIndex + 1) % CITIES.length; tickClock(true); }, 6000);
  }

  /* ---------- 主题开关 ---------- */
  var themeBtn = document.querySelector("[data-theme-toggle]");
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeBtn) themeBtn.setAttribute("aria-pressed", String(theme === "dark"));
    try { localStorage.setItem("cais-theme", theme); } catch (e) { /* 隐私模式忽略 */ }
  }
  if (themeBtn) {
    var saved = null;
    try { saved = localStorage.getItem("cais-theme"); } catch (e) { /* 忽略 */ }
    applyTheme(saved || "light");
    themeBtn.addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ---------- 覆盖层基础：开/关、Esc、焦点归还 ---------- */
  var lastFocus = null;

  function openOverlay(overlay) {
    lastFocus = document.activeElement;
    overlay.setAttribute("data-open", "true");
    document.body.classList.add("has-overlay");
    var close = overlay.querySelector(".overlay__close");
    if (close) close.focus();
  }

  function closeOverlay(overlay) {
    overlay.setAttribute("data-open", "false");
    document.body.classList.remove("has-overlay");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll("[data-overlay]").forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeOverlay(overlay);
    });
    overlay.querySelectorAll("[data-close]").forEach(function (btn) {
      btn.addEventListener("click", function () { closeOverlay(overlay); });
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.querySelectorAll('[data-overlay][data-open="true"]').forEach(closeOverlay);
  });

  /* ---------- Show all projects ---------- */
  var showAllBtn = document.querySelector("[data-show-all]");
  var showAllOverlay = document.querySelector("[data-overlay='all']");
  if (showAllBtn && showAllOverlay) {
    /* 全部项目网格复用侧栏同一批行，避免双份维护 */
    var allGrid = showAllOverlay.querySelector("[data-all-grid]");
    var source = document.querySelector(".project-index");
    if (allGrid && source) {
      Array.prototype.slice.call(source.children).forEach(function (row) {
        allGrid.appendChild(row.cloneNode(true));
      });
    }
    showAllBtn.addEventListener("click", function () { openOverlay(showAllOverlay); });
  }

  /* ---------- 项目详情 ---------- */
  var PROJECTS = {
    ember: {
      title: "Ember",
      year: "2026",
      services: "Brand strategy, Identity, Product design",
      img: "assets/img/news-09.jpg",
      body: [
        "Ember arrived with a question that had nothing to do with aesthetics: how does a dating app stay warm at scale? We rebuilt the brand around one idea — the moment before the match — and carried it from the wordmark to the smallest empty state.",
        "The identity runs on a warm neutral base with one signal colour reserved for intent. Photography is candid and unretouched; type is compact and confident. Every screen answers one question at a time, and the product got quieter as it grew."
      ]
    },
    nestor: {
      title: "Nestor",
      year: "2025",
      services: "Naming, Identity, Design system",
      img: "assets/img/news-07.jpg",
      body: [
        "Nestor is a planning tool for teams that never hold one shape for long — merging, shrinking, and spinning up new rituals every quarter. The brand had to work as software, as signage, and as a promise to people mid-transition.",
        "We built a modular identity on a strict 8px grid — one typeface, two weights, a single accent — so the system could be operated by any team, anywhere, without a designer in the room."
      ]
    },
    lume: {
      title: "Museu Lume",
      year: "2025",
      services: "Positioning, Identity, Environmental graphics",
      img: "assets/img/news-06.jpg",
      body: [
        "Museu Lume is a house for experimental art in a converted waterfront depot. The identity treats the building as the first artefact: a frame that holds whatever hangs inside it.",
        "Wayfinding is set in a compact grotesque with a single accent for direction, and the seasonal programme ships as a set of printed broadsides collected at the door."
      ]
    },
    mercado: {
      title: "Mercado",
      year: "2024",
      services: "Brand, Art direction, Merchandise",
      img: "assets/img/news-02.jpg",
      body: [
        "Mercado asked a finance brand to sell something you can wear. The insight was simple: people wear the brands they trust, and trust in finance is earned in fabric, not in fonts.",
        "Each season drops as a small, considered collection — heavyweight cotton, honest pricing, and a wordmark that stays out of the way."
      ]
    },
    longtake: {
      title: "Longtake Film Festival",
      year: "2024",
      services: "Identity, Motion, Print",
      img: "assets/img/news-05.jpg",
      body: [
        "Longtake is a festival for the long take — films shot in a single, unbroken breath. The identity is one continuous line that never lifts off the page.",
        "That line became the spine of everything: posters, titles, lanyards, and the festival's own loading state."
      ]
    },
    fio: {
      title: "Ateliê Fio",
      year: "2023",
      services: "Identity, Publication design",
      img: "assets/img/news-01.jpg",
      body: [
        "Ateliê Fio is a craft publication about slow making, printed twice a year on a press older than most of its readers.",
        "The identity borrows from the workshop, not the newsstand: one serif for the page, one grotesque for the margins, and a mark cut from a single rotated square."
      ]
    },
    bounce: {
      title: "Bounce",
      year: "2023",
      services: "Naming, Identity, Packaging",
      img: "assets/img/news-10.jpg",
      body: [
        "Bounce is a toy brand built on curiosity — objects that do one surprising thing well. Packaging is the first toy: flat-pack, fold-out, recyclable.",
        "The mark is a circle with a dot at its centre, drawn at any size, by anyone, in one stroke."
      ]
    },
    vinyl: {
      title: "Vinyl Club",
      year: "2022",
      services: "Brand, Membership system",
      img: "assets/img/news-04.jpg",
      body: [
        "Vinyl Club is a listening society for the streaming age: one record a month, pressed small, shipped in a sleeve you keep.",
        "Membership cards are letterpressed; the app is deliberately quiet. The brand speaks in the language of record sleeves, not dashboards."
      ]
    }
  };

  var detailOverlay = document.querySelector("[data-overlay='detail']");
  document.querySelectorAll("[data-project]").forEach(function (row) {
    row.addEventListener("click", function () {
      var key = row.getAttribute("data-project");
      var p = PROJECTS[key];
      if (!p || !detailOverlay) return;
      detailOverlay.querySelector("[data-detail-title]").textContent = p.title;
      var img = detailOverlay.querySelector("[data-detail-img]");
      img.src = p.img;
      img.alt = p.title + " — project image";
      var meta = detailOverlay.querySelector("[data-detail-meta]");
      meta.innerHTML =
        "<li><b>" + p.year + "</b></li>" +
        "<li>" + p.services + "</li>";
      var bodyEl = detailOverlay.querySelector("[data-detail-body]");
      bodyEl.innerHTML = p.body.map(function (t) { return "<p>" + t + "</p>"; }).join("");
      openOverlay(detailOverlay);
    });
  });

  /* ---------- 新闻卡滚动进场（错峰、仅一次） ---------- */
  var cards = Array.prototype.slice.call(document.querySelectorAll(".news-card"));
  if (reduceMotion || !("IntersectionObserver" in window)) {
    cards.forEach(function (c) { c.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var card = entry.target;
        var delay = Math.min(cards.indexOf(card), 5) * 60;
        card.style.setProperty("--reveal-delay", delay + "ms");
        card.classList.add("is-in");
        io.unobserve(card);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    cards.forEach(function (c) { c.classList.add("reveal"); io.observe(c); });
  }
})();
