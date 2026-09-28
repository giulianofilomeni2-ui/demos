(function () {
  "use strict";

  var data = window.__BRAND__ || {};

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  /* ---------------------------------------------------------
     Brand data — enriches the hardcoded HTML, never replaces it
  --------------------------------------------------------- */
  function mountBrandBits() {
    $$("[data-year]").forEach(function (el) { el.textContent = data.year || new Date().getFullYear(); });
    if (data.name) $$("[data-name]").forEach(function (el) { el.textContent = data.name; });
    if (data.contact && data.contact.email) {
      $$("[data-email]").forEach(function (el) {
        el.textContent = data.contact.email;
        el.href = "mailto:" + data.contact.email;
      });
    }
    if (data.contact && data.contact.whatsapp) {
      var wa = "https://wa.me/" + data.contact.whatsapp;
      if (data.contact.whatsappMsg) wa += "?text=" + encodeURIComponent(data.contact.whatsappMsg);
      $$("[data-whatsapp]").forEach(function (el) { el.href = wa; });
      $$("[data-whatsapp-visible]").forEach(function (el) {
        el.textContent = data.contact.whatsappVisible || data.contact.whatsapp;
      });
    }
    // Project URLs live in the manifest so they can be swapped for real domains
    if (data.projects) {
      Object.keys(data.projects).forEach(function (key) {
        $$('[data-project-link="' + key + '"]').forEach(function (el) { el.href = data.projects[key]; });
        $$('[data-project-frame="' + key + '"]').forEach(function (el) { el.dataset.src = data.projects[key]; });
      });
    }
  }

  /* ---------------------------------------------------------
     Live previews — each card renders the real site in an iframe.
     Loaded only on approach, and scaled to fit its card.
  --------------------------------------------------------- */
  function initPreviews() {
    var frames = $$("[data-project-frame]");
    if (!frames.length) return;

    var BASE_WIDTH = 1280;

    function scaleFrame(frame) {
      var holder = frame.closest(".preview");
      if (!holder) return;
      var w = holder.getBoundingClientRect().width;
      if (!w) return;
      holder.style.setProperty("--preview-scale", (w / BASE_WIDTH).toFixed(4));
    }

    function scaleAll() { frames.forEach(scaleFrame); }
    scaleAll();

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(scaleAll, 150);
    });

    // Fonts landing can change layout width; rescale once they settle
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scaleAll);

    function load(frame) {
      if (frame.dataset.loaded) return;
      var src = frame.dataset.src;
      if (!src) return;
      frame.dataset.loaded = "1";
      frame.addEventListener("load", function () { frame.classList.add("is-loaded"); });
      frame.src = src;
    }

    if (!("IntersectionObserver" in window)) {
      frames.forEach(load);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          load(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "300px 0px" });

    frames.forEach(function (f) { io.observe(f); });
  }

  /* ---------------------------------------------------------
     Photo — degrade to a neutral block if the file isn't there yet
  --------------------------------------------------------- */
  function initPhoto() {
    var fig = $("[data-photo]");
    if (!fig) return;
    var img = $("img", fig);
    if (!img) return;
    var fail = function () { fig.classList.add("is-missing"); };
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener("error", fail);
  }

  /* ---------------------------------------------------------
     Currency switch — ARS for local clients, USD for abroad.
     The USD figure is a separate price, not a conversion.
  --------------------------------------------------------- */
  function initCurrency() {
    var buttons = $$("[data-currency]");
    var prices = $$("[data-price]");
    if (!buttons.length || !prices.length || !data.precios) return;

    function apply(cur) {
      prices.forEach(function (el) {
        var plan = data.precios[el.dataset.price];
        if (plan && plan[cur]) el.textContent = plan[cur];
      });
      $$("[data-cur-ars]").forEach(function (el) { el.hidden = cur !== "ars"; });
      $$("[data-cur-usd]").forEach(function (el) { el.hidden = cur !== "usd"; });
      buttons.forEach(function (b) {
        var on = b.dataset.currency === cur;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      try { localStorage.setItem("moneda", cur); } catch (e) { /* private mode */ }
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.dataset.currency); });
    });

    var saved = null;
    try { saved = localStorage.getItem("moneda"); } catch (e) { /* private mode */ }
    apply(saved === "usd" ? "usd" : "ars");
  }

  /* ---------------------------------------------------------
     Reveal on scroll
  --------------------------------------------------------- */
  function initReveals() {
    var els = $$("[data-reveal]");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  /* ---------------------------------------------------------
     Smooth anchors
  --------------------------------------------------------- */
  function initSmoothAnchors() {
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 60,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  function boot() {
    safe(mountBrandBits, "mountBrandBits");
    safe(initPhoto, "initPhoto");
    safe(initCurrency, "initCurrency");
    safe(initPreviews, "initPreviews");
    safe(initReveals, "initReveals");
    safe(initSmoothAnchors, "initSmoothAnchors");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
