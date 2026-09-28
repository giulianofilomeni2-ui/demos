/* ==========================================================================
   FASE · app.js — Portal del jugador
   Router por hash + microinteracciones. Sin dependencias.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var TITLES = { hoy:'Hoy', gimnasio:'Gimnasio', nutricion:'Nutrición', extras:'Extras' };

  /* ---------- ROUTER POR HASH -------------------------------------------- */
  (function router() {
    var views = $$('.view');
    var links = $$('[data-view]');
    var title = $('[data-title]');
    if (!views.length) return;

    function show(id) {
      if (!TITLES[id]) id = 'hoy';

      views.forEach(function (v) {
        var on = v.id === id;
        v.classList.remove('on');
        if (on) {
          v.removeAttribute('hidden');
          // Reflow forzado: fija el estado inicial de los anillos ya visibles
          // para que la transición interpole. Sincrónico, sin depender de rAF.
          void v.offsetWidth;
          v.classList.add('on');
        } else {
          v.setAttribute('hidden', '');
        }
      });

      links.forEach(function (a) {
        if (a.dataset.view === id) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });

      if (title) title.textContent = TITLES[id];
      document.title = TITLES[id] + ' — Portal FASE';
      $('.main').scrollIntoView({ block:'start', behavior:'auto' });
    }

    window.addEventListener('hashchange', function () {
      show(location.hash.replace('#', ''));
    });
    show(location.hash.replace('#', '') || 'hoy');
  })();

  /* ---------- CHECKS DE EJERCICIO ---------------------------------------- */
  (function checks() {
    var counter = $('[data-progress]');

    function tally() {
      if (!counter) return;
      var all  = $$('#gimnasio [data-lift]');
      var done = all.filter(function (l) { return l.classList.contains('done'); });
      counter.textContent = done.length + ' de ' + all.length + ' hechos';
      counter.classList.toggle('tag-ok', done.length === all.length && all.length > 0);
    }

    $$('.check').forEach(function (btn) {
      if (btn.tagName !== 'BUTTON') return;
      btn.addEventListener('click', function () {
        var row = btn.closest('[data-lift]') || btn.closest('.lift');
        var on  = btn.getAttribute('aria-pressed') === 'true';
        btn.setAttribute('aria-pressed', String(!on));
        if (row) row.classList.toggle('done', !on);
        tally();
      });
    });
    tally();
  })();

  /* ---------- GRUPOS DE BOTONES A PRESIÓN (RPE) --------------------------- */
  (function pressGroups() {
    $$('[role="group"]').forEach(function (group) {
      if (group.hasAttribute('aria-label') && /cancha/i.test(group.getAttribute('aria-label'))) return;
      var btns = $$('button', group);
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        });
      });
    });
  })();

  /* ---------- SELECTOR DE TAPONES ---------------------------------------- */
  (function studs() {
    var out = $('[data-stud-out]');
    var btns = $$('[data-pitch]');
    if (!out || !btns.length) return;

    var DATA = {
      seca: {
        t: 'Moldeado 13 mm',
        k: 'tag-ok',
        s: 'Cancha seca y dura',
        p: 'Suela de goma con tapones cortos y muchos puntos de apoyo. El aluminio largo no entra en el piso duro: te queda el pie apoyado sobre seis puntas y la rodilla se lleva toda la torsión.',
        n: ['Repartí la presión: mínimo 10 tapones', 'Revisá ampollas en el arco del pie', 'Si el suelo está rajado, sumá plantilla']
      },
      firme: {
        t: 'Mixto 15 mm',
        k: 'tag-ok',
        s: 'Cancha firme con algo de humedad',
        p: 'El clásico: aluminio en el perímetro y moldeado en el medio. Agarre suficiente para empujar en el scrum sin quedarte clavado en el cambio de dirección.',
        n: ['Es el botín por defecto de casi todo el torneo', 'Chequeá el ajuste de los tapones de rosca', 'Llevá los dos juegos al partido']
      },
      pesada: {
        t: 'Aluminio 18 mm',
        k: 'tag-red',
        s: 'Cancha pesada, barrosa o con lluvia',
        p: 'Seis u ocho tapones de aluminio largos. Penetran el barro y te dan el punto de apoyo que el scrum necesita. Sin esto, en la primera formación te vas de boca.',
        n: ['Obligatorio para primera línea con cancha blanda', 'Limá el borde si quedó filoso: el árbitro revisa', 'Limpiálos apenas termina: el barro seco los come']
      },
      sinte: {
        t: 'Turf multitaco',
        k: 'tag-amber',
        s: 'Césped sintético',
        p: 'Suela con muchos tacos chatos y cortos. El aluminio en sintético no perfora: engancha. Y lo que engancha en sintético no lo suelta el piso, lo suelta tu ligamento.',
        n: ['Nunca aluminio en sintético', 'Muchos clubes lo prohíben por reglamento', 'Medias más gruesas: el sintético calienta y raspa']
      }
    };

    function render(key) {
      var d = DATA[key];
      out.innerHTML =
        '<span class="tag ' + d.k + '"><span class="dot"></span>' + d.s + '</span>' +
        '<p class="big">' + d.t + '</p>' +
        '<p style="color:var(--ash);margin:0">' + d.p + '</p>' +
        '<ul style="list-style:none;margin:.4rem 0 0;padding:0;display:grid;gap:.45rem">' +
        d.n.map(function (n) {
          return '<li style="position:relative;padding-left:1.3rem;font-size:.9rem;color:var(--ash)">' +
                 '<span style="position:absolute;left:0;top:.55em;width:8px;height:2px;background:var(--red)"></span>' +
                 n + '</li>';
        }).join('') +
        '</ul>';
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        render(b.dataset.pitch);
      });
    });

    render('seca');
  })();

  /* ---------- ATAJOS INTERNOS -------------------------------------------- */
  $$('[data-go]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      location.hash = a.dataset.go;
    });
  });

  /* ---------- ARRANQUE ---------------------------------------------------- */
  /* La pantalla se va sola por CSS; acá sólo la sacamos del DOM para que no
     quede un div a pantalla completa interceptando nada. */
  (function boot() {
    var el = $('[data-boot]');
    if (!el) return;
    setTimeout(function () { if (el.parentNode) el.remove(); }, 1100);
  })();

  /* ---------- INSTALAR ---------------------------------------------------- */
  /* Chrome/Edge/Android disparan beforeinstallprompt cuando la app cumple los
     requisitos (manifest + service worker + https). Si no llega el evento el
     botón no existe: nada de un botón que no hace nada. */
  (function install() {
    var btn = $('[data-install]');
    if (!btn) return;
    var deferred = null;

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      btn.hidden = false;
      btn.classList.add('on');
    });

    btn.addEventListener('click', function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () {
        deferred = null;
        btn.hidden = true;
        btn.classList.remove('on');
      });
    });

    window.addEventListener('appinstalled', function () {
      btn.hidden = true;
      btn.classList.remove('on');
    });
  })();

  /* ---------- SERVICE WORKER ---------------------------------------------- */
  /* El worker está una carpeta más arriba para que su scope alcance base.css,
     que vive en la raíz del sitio. Sólo sobre http(s): abierto como file://
     el registro tira excepción. */
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('../sw.js').catch(function () { /* sin offline, y listo */ });

      // Limpieza: una versión anterior registraba el worker dentro de /app/.
      // Ese scope no alcanzaba base.css, así que sin red el portal abría sin
      // estilos. Si quedó dado de alta en el navegador de alguien, lo damos
      // de baja acá; el de la raíz lo reemplaza.
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (reg) {
          if (/\/app\/$/.test(reg.scope)) reg.unregister();
        });
      }).catch(function () {});
    });
  }

})();
