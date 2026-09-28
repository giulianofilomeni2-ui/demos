/* ==========================================================================
   FASE · main.js — landing
   Vanilla, sin dependencias. Todo el movimiento se apaga con reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  window.__fase = true;   // avisa al failsafe del <head> que el JS sí corrió

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Un rAF con red de seguridad. En una pestaña congelada o dentro de una vista
     previa embebida requestAnimationFrame puede no correr nunca; si de eso
     depende que el contenido se vea, la página queda en negro. El timeout
     garantiza que el trabajo se haga igual, aunque sin sincronizar con el frame. */
  function frame(fn) {
    var done = false;
    function go() { if (done) return; done = true; fn(); }
    requestAnimationFrame(go);
    setTimeout(go, 120);
  }

  /* ---------- PORTADA ---------------------------------------------------- */
  (function cover() {
    var el = $('[data-cover]');
    var hero = $('[data-hero]');
    if (!el) { if (hero) hero.classList.add('ready'); return; }

    var closed = false;
    function out() {
      if (closed) return;
      closed = true;
      el.classList.add('out');
      document.body.style.overflow = '';
      if (hero) setTimeout(function () { hero.classList.add('ready'); }, 220);
      setTimeout(function () { if (el.parentNode) el.remove(); }, 1400);
    }
    function kill() {                       // sin animación, de una
      if (closed) return;
      closed = true;
      document.body.style.overflow = '';
      if (hero) hero.classList.add('ready');
      el.remove();
    }

    // Si el visitante pidió menos movimiento, o abrió el link en una pestaña de
    // fondo (ahí rAF no corre y la portada dejaría la página trabada), no hay intro.
    if (reduce || document.visibilityState === 'hidden') { kill(); return; }

    document.body.style.overflow = 'hidden';
    // Red de seguridad: pase lo que pase con rAF, a los 2,6 s la portada se va.
    var failsafe = setTimeout(out, 2600);

    var n = $('[data-cover-count]'), bar = $('[data-cover-bar]');
    var t0 = performance.now(), dur = 1350;

    (function tick(t) {
      var p = Math.min((t - t0) / dur, 1);
      // easeOutExpo: arranca rápido y frena — lee como un cronómetro que se detiene
      var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      n.textContent = String(Math.round(e * 80)).padStart(2, '0');
      bar.style.width = (e * 100) + '%';
      if (p < 1) { requestAnimationFrame(tick); }
      else { clearTimeout(failsafe); setTimeout(out, 260); }
    })(t0);
  })();

  /* ---------- NAV: sólido, auto-ocultar, progreso ------------------------ */
  (function nav() {
    var nav = $('[data-nav]'), prog = $('[data-prog]'), dr = $('[data-drawer]');
    var aviso = $('.aviso');
    if (!nav) return;
    var last = 0, ticking = false;

    function update() {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var menuOpen = dr && !dr.hasAttribute('hidden');

      // La barra fija arranca debajo del aviso y "acopla" arriba a medida que
      // el aviso se va: nunca lo tapa, nunca salta.
      if (aviso) nav.style.top = Math.max(0, aviso.offsetHeight - y) + 'px';
      if (dr) dr.style.top = nav.getBoundingClientRect().bottom + 'px';

      nav.classList.toggle('solid', y > 40);
      // Se esconde solo bajando y ya pasado el hero; nunca con el menú abierto
      nav.classList.toggle('hide', !menuOpen && y > 620 && y > last + 4);
      if (prog) prog.style.setProperty('--p', (max > 0 ? (y / max) * 100 : 0) + '%');
      last = y;
      ticking = false;
    }
    function schedule() {
      if (!ticking) { ticking = true; frame(update); }
    }
    window.addEventListener('scroll', schedule, { passive: true });
    // El alto del aviso cambia cuando el texto re-envuelve (rotar el celular,
    // achicar la ventana) y también si se mide antes de tiempo. Sin esto la
    // barra se queda clavada en el offset viejo hasta el primer scroll.
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('load', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    update();
  })();

  /* ---------- DRAWER MÓVIL ----------------------------------------------- */
  (function drawer() {
    var btn = $('[data-burger]'), dr = $('[data-drawer]');
    if (!btn || !dr) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
      if (open) dr.setAttribute('hidden', ''); else dr.removeAttribute('hidden');
    });
    $$('a', dr).forEach(function (a) {
      a.addEventListener('click', function () {
        btn.setAttribute('aria-expanded', 'false');
        dr.setAttribute('hidden', '');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        btn.click(); btn.focus();
      }
    });
  })();

  /* ---------- DISPARADOR POR VIEWPORT ------------------------------------ */
  /* Barrido por scroll en vez de IntersectionObserver. Razones:
     1. Hay contextos donde el callback del observer no llega nunca (pestañas
        con throttling agresivo, vistas previas embebidas). Ahí el contenido
        quedaría invisible para siempre, que es el peor final posible.
     2. Un bloque más alto que la ventana nunca alcanza un threshold del 12%.
     El costo real es un getBoundingClientRect por elemento pendiente y por
     frame de scroll, sobre una lista que se vacía enseguida. */
  function watch(items, fire) {
    var pending = items.slice(), ticking = false;

    function sweep() {
      ticking = false;
      var h = window.innerHeight;
      for (var i = pending.length - 1; i >= 0; i--) {
        var r = pending[i].getBoundingClientRect();
        if (r.top < h * 0.92 && r.bottom > -h * 0.2) {
          fire(pending[i]);
          pending.splice(i, 1);
        }
      }
      if (!pending.length) {
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
      }
    }
    function schedule() { if (!ticking) { ticking = true; frame(sweep); } }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    sweep();        // primera pasada sincrónica: lo que ya está a la vista, se ve
    schedule();
    // Segunda pasada tras las webfonts: cambian alturas y por lo tanto qué entra.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    return schedule;
  }

  /* ---------- REVEAL AL SCROLL ------------------------------------------- */
  (function reveal() {
    var items = $$('[data-reveal], .principio');
    if (!items.length) return;
    if (reduce) { items.forEach(function (el) { el.classList.add('in'); }); return; }
    watch(items, function (el) { el.classList.add('in'); });
  })();

  /* ---------- CONTADORES -------------------------------------------------- */
  (function counters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function run(el) {
      var to = parseFloat(el.dataset.count);
      var pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
      if (reduce) { el.textContent = pre + to + suf; return; }
      var t0 = performance.now(), dur = 1100;
      (function tick(t) {
        var p = Math.min((t - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(e * to) + suf;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }

    if (reduce) { nums.forEach(run); return; }
    watch(nums, run);
  })();

  /* ---------- TICKER: duplicar para loop sin costura ---------------------- */
  (function ticker() {
    var track = $('[data-ticker]');
    if (!track) return;
    track.innerHTML += track.innerHTML;
  })();

  /* ---------- PARALLAX DEL HERO ------------------------------------------ */
  (function parallax() {
    var el = $('[data-parallax]');
    if (!el || reduce) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      frame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          // Solo transform + opacity: nunca top/height (no dispara layout)
          el.style.transform = 'translate3d(0,' + (y * 0.22) + 'px,0) scale(' + (1 + y * 0.00012) + ')';
        }
        ticking = false;
      });
    }, { passive: true });
  })();

  /* ---------- FOTOS: FUNDIDO AL CARGAR ----------------------------------- */
  /* Las fotos arrancan en opacity 0 sólo si .js está puesto. Marcamos .ok
     tanto en load como en error: una foto rota es preferible a un hueco. */
  (function photos() {
    var imgs = $$('.ph img, .hero-media img');
    if (!imgs.length) return;

    function ok(img) { img.classList.add('ok'); }

    imgs.forEach(function (img) {
      if (img.complete && img.naturalWidth > 0) { ok(img); return; }
      img.addEventListener('load',  function () { ok(img); }, { once: true });
      img.addEventListener('error', function () { ok(img); }, { once: true });
    });

    // Red de seguridad: pase lo que pase, a los 5 s se ven todas.
    setTimeout(function () { imgs.forEach(ok); }, 5000);
  })();

  /* ---------- TABS DE PUESTOS -------------------------------------------- */
  (function puestos() {
    var tabs = $$('.pu-tab');
    if (!tabs.length) return;

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (!panel) return;
        panel.classList.remove('on');
        if (on) {
          panel.removeAttribute('hidden');
          // Reflow forzado: fija el 0 de las barras antes de animarlas al valor.
          void panel.offsetWidth;
          panel.classList.add('on');
        } else {
          panel.setAttribute('hidden', '');
        }
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
              : e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        select(tabs[(i + d + tabs.length) % tabs.length], true);
      });
    });
  })();

  /* ---------- CRÉDITOS: ABRIR AL LLEGAR POR EL LINK ---------------------- */
  /* <details> no se abre solo por ser el :target del hash. Si alguien entra
     desde "ver créditos", lo que tiene que ver es la lista, no un acordeón. */
  (function creditos() {
    var el = $('#creditos');
    if (!el) return;
    function check() { if (location.hash === '#creditos') el.open = true; }
    window.addEventListener('hashchange', check);
    check();
  })();

  /* ---------- FORMULARIO (demo) ------------------------------------------ */
  /* No manda nada a ningún lado: valida, confirma y limpia. Lo importante es
     que el visitante vea el estado de error y el de éxito como en uno real. */
  (function form() {
    var f = $('[data-form]');
    if (!f) return;
    var msg = $('[data-msg]', f);

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var faltan = [];

      $$('input[required]', f).forEach(function (i) {
        var vacio = !i.value.trim();
        i.classList.toggle('bad', vacio);
        i.setAttribute('aria-invalid', String(vacio));
        if (vacio) faltan.push(i);
      });

      if (faltan.length) {
        msg.textContent = 'Falta completar ' + (faltan.length === 1 ? 'un campo.' : faltan.length + ' campos.');
        msg.classList.remove('ok');
        faltan[0].focus();
        return;
      }

      var nombre = ($('#f-nom', f).value.trim().split(/\s+/)[0] || '').replace(/[^\p{L}'-]/gu, '');
      msg.textContent = 'Listo' + (nombre ? ', ' + nombre : '') + '. Es una demo: no se envió nada.';
      msg.classList.add('ok');
      f.reset();
    });

    // Al escribir se limpia el estado de error del campo tocado.
    $$('input', f).forEach(function (i) {
      i.addEventListener('input', function () {
        i.classList.remove('bad');
        i.removeAttribute('aria-invalid');
      });
    });
  })();

})();
