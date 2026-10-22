// ventana.js — entrega la identidad de diseño a la ventana del rally.
//
// El módulo de diseño vive en el navegador; la ventana (dashboard) vive en el
// servidor local. Las dos comparten las secciones del proyecto: el logo y la
// paleta se escriben como secciones y el tablero los pinta solo.
//
// Solo el servidor o una IP privada pueden mutar estado, asi que el módulo
// tiene que abrirse desde el servidor:
//   http://127.0.0.1:8000/design/kit.html
// Abierto como archivo (file://) el navegador no puede escribir y el boton
// avisa en vez de fallar en silencio.
(function (global) {
  'use strict';

  var API = '/api';

  function servidorLocal() {
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return false;
    var h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || /^192\.168\./.test(h) || /^10\./.test(h);
  }

  function peticion(ruta, opciones) {
    return fetch(API + ruta, opciones || { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    });
  }

  function secciones() {
    return peticion('/sections?since=0').then(function (m) {
      return (m && m.sections) || {};
    });
  }

  // Escribe una sección usando la versión que hay ahora (el servidor pide
  // base_version; si alguien guardó antes, responde 409 y no pisa a nadie).
  function escribir(clave, data) {
    return secciones().then(function (secs) {
      var sec = secs[clave] || null;
      var version = (sec && typeof sec.version === 'number') ? sec.version : 0;
      return peticion('/sections/' + encodeURIComponent(clave), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: data,
          base_version: version,
          actor: 'IA',
          actor_id: 'ia'
        })
      });
    });
  }

  // Lo que el diseño aporta a la ventana: el logo del equipo y la paleta.
  function datosDeIdentidad(ident) {
    var S = ident || {};
    var pal = S.pal || {};
    var out = {};
    var logo = (S.team && S.team.logo) || S.logo || '';
    if (logo) out.team_logo_img = logo;
    if (pal.ac || pal.ink || pal.mu) {
      out.palette = {
        primary: pal.ac || pal.ink,
        secondary: pal.ink || pal.ac,
        accent: pal.mu || pal.ac
      };
    }
    return out;
  }

  function enviarIdentidad(ident) {
    if (!servidorLocal()) {
      return Promise.reject(new Error('Abre el modulo desde http://127.0.0.1:8000/design/ para enviar a la ventana.'));
    }
    var datos = datosDeIdentidad(ident);
    var claves = Object.keys(datos);
    if (!claves.length) {
      return Promise.reject(new Error('No hay logo ni paleta que enviar.'));
    }
    return claves.reduce(function (cadena, clave) {
      return cadena.then(function () {
        return escribir(clave, datos[clave]);
      });
    }, Promise.resolve()).then(function () {
      return claves;
    });
  }

  global.RallyVentana = {
    enviarIdentidad: enviarIdentidad,
    datosDeIdentidad: datosDeIdentidad,
    escribirSeccion: escribir,
    servidorLocal: servidorLocal
  };
})(window);
