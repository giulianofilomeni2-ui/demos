(function () {
  "use strict";
  window.__BRAND__ = {
    name: "Giuliano Filomeni",
    role: "Diseño y desarrollo web",
    city: "Córdoba",
    contact: {
      email: "giulianofilomeni2@gmail.com",
      // Formato wa.me: 54 + 9 (móvil) + característica sin 0 + número sin 15
      whatsapp: "5493516655499",
      whatsappVisible: "+54 351 665 5499",
      whatsappMsg: "Hola Giuliano, vi tu portafolio y quería consultarte por una web."
    },
    // Cada demo vive en su carpeta de este mismo repositorio de GitHub
    // Pages. Si cambia alguna, se toca acá y el portafolio entero (botones
    // "Abrir sitio" y vistas previas) queda actualizado solo.
    projects: {
      starlink: "starlink/",
      barberia: "barberia-la-navaja/",
      cafe:     "cafe-union/",
      nucleo:   "nucleo/",
      nacar:    "casa-nacar/",
      fase:     "fase/"
    },

    // Precios. El valor en USD NO es una conversión del precio en pesos:
    // al cliente del exterior se le cobra la tarifa del mercado internacional.
    precios: {
      esencial:     { ars: "280.000", usd: "390" },
      pro:          { ars: "420.000", usd: "590" },
      completo:     { ars: "750.000", usd: "1.050" },
      mantenimiento:{ ars: "45.000",  usd: "60" }
    },
    year: new Date().getFullYear()
  };
})();
