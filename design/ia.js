/* Rally Design — puente de IA (isla compartida).
 *
 * Una sola isla (backend publicado) sirve a todas las páginas estáticas.
 * La URL viene de `RALLY_IA_CONFIG.base` (design/config.js): vacío = mismo
 * origen (rally_service.py local). La cuota diaria se cuenta en el navegador
 * para que la versión publicada funcione sin servidor local y caiga en modo
 * manual cuando se agota.
 *
 * Falta de red, cuota agotada o proveedor caído: se informa con honestidad y
 * la herramienta sigue usándose a mano. Nunca se finge una respuesta de IA.
 */
var RallyIA = (function () {
  var cfg = (typeof RALLY_IA_CONFIG !== 'undefined') ? RALLY_IA_CONFIG : {};
  var BASE = (cfg.base || '').replace(/\/+$/, '');
  var QUOTA = typeof cfg.dailyQuota === 'number' ? cfg.dailyQuota : 12;
  var QKEY = 'rally_ia_quota';

  /* Vocabulario cerrado: la IA elige dentro de estas listas, así el resultado
     siempre se puede renderizar sin CSS inventado. */
  var SPEC = {
    skin: ['refined', 'bold', 'data', 'pop', 'comic'],
    cover: ['a', 'b', 'c', 'd', 'e', 'f'],
    card: ['diagonal', 'right', 'band', 'circle', 'sticker'],
    deco: ['none', 'orbit', 'circuit', 'halftone', 'dots', 'grid', 'blob'],
    titleFont: ['Oswald', 'Archivo Narrow', 'Anton', 'Space Grotesk', 'Barlow Condensed',
      'Instrument Serif', 'Archivo', 'Fredoka', 'Bangers', 'Barlow'],
    bodyFont: ['Barlow', 'Archivo', 'Plus Jakarta Sans', 'Space Grotesk', 'Oswald', 'Archivo Narrow']
  };

  function url(path) { return BASE + path; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function quotaState() {
    try {
      var v = JSON.parse(localStorage.getItem(QKEY) || '{}');
      if (v.day !== today()) v = { day: today(), n: 0 };
      return { day: v.day, n: v.n || 0, left: Math.max(0, QUOTA - (v.n || 0)), limit: QUOTA };
    } catch (e) { return { day: today(), n: 0, left: QUOTA, limit: QUOTA }; }
  }
  function consume() {
    var q = quotaState();
    if (q.left <= 0) return false;
    try {
      localStorage.setItem(QKEY, JSON.stringify({ day: q.day, n: q.n + 1 }));
    } catch (e) {}
    return true;
  }
  function refund() {
    var q = quotaState();
    try { localStorage.setItem(QKEY, JSON.stringify({ day: q.day, n: Math.max(0, q.n - 1) })); } catch (e) {}
  }

  function post(path, body) {
    var actor = '';
    try { actor = (localStorage.getItem('rally_presence_name') || '').trim().slice(0, 80); } catch (e) {}
    return fetch(url(path), {
      method: 'POST',
      headers: (function () {
        var h = { 'Content-Type': 'application/json' };
        if (actor) h['X-Rally-Actor'] = actor;
        return h;
      })(),
      body: JSON.stringify(body || {})
    }).then(function (r) {
      return r.json().catch(function () { return { status: 'error', message: 'Respuesta ilegible del servidor.' }; })
        .then(function (d) {
          if (r.status === 429) { d.status = 'rate-limit'; d.message = d.message || 'Cuota de IA agotada en el servidor. Intenta más tarde o edita a mano.'; }
          return d;
        });
    });
  }

  /* Trabajo largo: arranca el job y sondea el progreso. */
  function job(prompt, onTick) {
    if (!consume()) {
      return Promise.resolve({ status: 'quota', message: 'Cuota diaria de IA agotada en este navegador. Sigue editando a mano o usa el prompt copiado.' });
    }
    return post('/api/ai', { prompt: prompt, model: cfg.model || '' }).then(function (started) {
      if (!started || started.status !== 'started' || !started.job) {
        refund();
        if (started && started.status === 'no-provider') {
          return { status: 'no-provider', message: started.message || 'Sin IA conectada en este servidor.' };
        }
        if (started && started.status === 'rate-limit') {
          return { status: 'rate-limit', message: started.message || 'Cuota de IA agotada en el servidor. Intenta más tarde o edita a mano.' };
        }
        return { status: 'error', message: (started && started.message) || 'No se pudo arrancar el trabajo de IA.' };
      }
      return poll(started.job, onTick);
    }).catch(function (e) {
      refund();
      return { status: 'offline', message: 'Sin conexión con el servidor de IA (' + (e && e.message ? e.message : 'red') + ').' };
    });
  }

  function poll(jobId, onTick) {
    return new Promise(function (resolve) {
      var guard = 0;
      function tick() {
        fetch(url('/api/ai/progress?job=' + encodeURIComponent(jobId)))
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (onTick && d && d.text) onTick(d.text);
            if (d && d.done) {
              if (d.status === 'error') { refund(); return resolve({ status: 'error', message: d.message || 'La IA terminó con error.', text: d.text || '' }); }
              return resolve({ status: 'ok', text: d.text || '', provider: d.provider, model: d.model });
            }
            if (++guard > 400) { refund(); return resolve({ status: 'error', message: 'La IA tardó demasiado. Vuelve a intentarlo.' }); }
            setTimeout(tick, 700);
          })
          .catch(function () {
            if (++guard > 400) { refund(); return resolve({ status: 'error', message: 'Se perdió la conexión con el servidor de IA.' }); }
            setTimeout(tick, 1200);
          });
      }
      setTimeout(tick, 500);
    });
  }

  /* Paleta + tipografías a partir de colores o de la imagen del logo (vision). */
  function design(colors, image) {
    if (!consume()) {
      return Promise.resolve({ status: 'quota', message: 'Cuota diaria de IA agotada en este navegador.' });
    }
    return post('/api/ai/design', { colors: colors || [], image: image || '' }).then(function (d) {
      if (d && d.status === 'ok') return d;
      // El endpoint de visión no tiene proveedor: se pide la paleta por texto
      // al proveedor que sí está conectado, con los colores del logo.
      if (d && d.status === 'no-provider') {
        return job(promptPaleta(colors)).then(function (r) {
          if (r.status !== 'ok') { refund(); return r; }
          var obj = parseJSON(r.text);
          if (!obj || !obj.palette) { refund(); return { status: 'error', message: 'La IA no devolvió una paleta usable.' }; }
          return { status: 'ok', palette: obj.palette, fonts: obj.fonts || {}, rationale: obj.rationale || '' };
        });
      }
      refund();
      return d || { status: 'error', message: 'Sin respuesta del servidor de IA.' };
    }).catch(function (e) {
      refund();
      return { status: 'offline', message: 'Sin conexión con el servidor de IA (' + (e && e.message ? e.message : 'red') + ').' };
    });
  }

  /* Prompt de paleta a partir de los colores dominantes del logo. */
  function promptPaleta(colors) {
    return 'Eres diseñador de identidad visual. Estos son los colores dominantes de un logo de equipo: ' +
      (colors && colors.length ? colors.join(', ') : 'sin datos') + '.\n' +
      'Sugiere una paleta para un carrusel 4:5: bg (fondo de portada), bg2 (fondo de las láminas de integrante), ' +
      'ac (acento), ink (texto principal sobre bg), mu (texto suave) y gl (formas de fondo). ' +
      'ink y bg deben contrastar (WCAG AA o mejor). Nada de morado (#7c3aed ni similares). ' +
      'Elige un par de tipografías de Google Fonts (title, body) coherentes con el estilo del logo, ' +
      'de esta lista de titulares: ' + SPEC.titleFont.join(', ') + '.\n' +
      'Responde SOLO con JSON válido, sin markdown: ' +
      '{"palette":{"primary":"#hex","secondary":"#hex","accent":"#hex","bg":"#hex","text":"#hex"},' +
      '"fonts":{"title":"NombreFuente","body":"NombreFuente"},"rationale":"texto breve"}';
  }

  /* Extrae el primer objeto JSON de un texto (la IA a veces envuelve el JSON). */
  function parseJSON(text) {
    if (!text) return null;
    var s = String(text);
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) {}
    try { return JSON.parse(s.slice(a, b + 1).replace(/,\s*([}\]])/g, '$1')); } catch (e) {}
    return null;
  }

  function hex(c) { return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c.trim()) ? c.trim().toLowerCase() : null; }
  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function mix(a, b, w) {
    var x = rgb(a), y = rgb(b);
    return '#' + x.map(function (v, i) { return Math.round(v + (y[i] - v) * w).toString(16).padStart(2, '0'); }).join('');
  }
  /* Luminancia relativa y contraste WCAG. */
  function lum(h) {
    var c = rgb(h).map(function (v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  /* Si ink y bg2 casi coinciden, el texto desaparece: se separa el fondo. */
  function separar(ink, bg2, bg) {
    if (ratio(ink, bg2) >= 4.5) return bg2;
    if (bg && ratio(ink, bg) >= 4.5 && ratio(bg2, bg) < 1.2) return bg;
    // se busca un punto intermedio claro que conserve el tono de la marca
    for (var w = 0.15; w <= 0.7; w += 0.05) {
      var cand = mix(ink, bg || '#ffffff', w);
      if (ratio(ink, cand) >= 4.5) return cand;
    }
    return ratio(lum(ink) > 0.5 ? '#101010' : '#ffffff', ink) >= 4.5
      ? (lum(ink) > 0.5 ? '#101010' : '#ffffff') : bg2;
  }

  /* Rellena la paleta completa: la IA solo necesita dar bg, ac e ink. */
  function completePal(pal) {
    var out = {};
    var keys = ['bg', 'bg2', 'ac', 'ink', 'mu', 'gl'];
    keys.forEach(function (k) { out[k] = hex(pal[k]); });
    if (!out.bg || !out.ac || !out.ink) return null;
    if (!out.bg2) out.bg2 = mix(out.bg, out.ink, 0.12);
    if (!out.mu) out.mu = mix(out.ink, out.bg, 0.42);
    if (!out.gl) out.gl = mix(out.ac, out.bg, 0.78);
    out.bg2 = separar(out.ink, out.bg2, out.bg);
    if (ratio(out.ink, out.bg) < 4.5) {
      // el texto principal sobre la portada tiene que leerse
      out.ink = lum(out.bg) > 0.5 ? mix(out.bg, '#000000', 0.75) : mix(out.bg, '#ffffff', 0.9);
    }
    return out;
  }

  /* Valida la respuesta de la IA contra el vocabulario cerrado.
     Devuelve null si no sirve; nunca deja el carrusel a medias. */
  function sanitize(obj) {
    if (!obj || typeof obj !== 'object') return null;
    var s = {};
    s.skin = SPEC.skin.indexOf(obj.skin) >= 0 ? obj.skin : null;
    s.cover = SPEC.cover.indexOf(obj.cover) >= 0 ? obj.cover : null;
    s.card = SPEC.card.indexOf(obj.card) >= 0 ? obj.card : null;
    s.deco = SPEC.deco.indexOf(obj.deco) >= 0 ? obj.deco : null;
    s.pal = completePal(obj.pal || obj.palette || {});
    var f = obj.fonts || {};
    s.fonts = {
      t: fuenteOk(f.t, 't'),
      b: fuenteOk(f.b, 'b')
    };
    s.name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim().slice(0, 28) : 'Estilo IA';
    s.notes = typeof obj.notes === 'string' && obj.notes.trim() ? obj.notes.trim().slice(0, 260) : '';
    s.css = cssSeguro(obj.css);
    if (!s.skin && !s.cover && !s.card && !s.deco && !s.pal && !s.fonts.t && !s.css) return null;
    return s;
  }

  /* CSS opcional que la IA propone: se sella para que no rompa la página
     (nada de etiquetas, imports, url() remotas ni scripts) y se acota a la
     lámina (.sl) para que no toque el editor. */
  function cssSeguro(css) {
    if (typeof css !== 'string' || !css.trim()) return '';
    var s = css.replace(/[<>]/g, '').replace(/@import/gi, '').replace(/javascript:/gi, '')
      .replace(/url\s*\(/gi, 'url-blocked(').replace(/expression\s*\(/gi, 'blocked(');
    s = s.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (s.length > 4000) s = s.slice(0, 4000);
    if (!s) return '';
    return scopeSl(s);
  }

  /* Prefija cada selector con .sl (o .sl .x) para que el CSS de la IA
     afecte únicamente a la lámina renderizada. */
  function scopeSl(css) {
    // Reglas con at-rules (@media, @supports) no se reescriben: se descartan
    // para no romper el editor. El estilo se define con el vocabulario del
    // sistema, no con reglas anidadas.
    if (css.indexOf('@') >= 0) return '';
    var out = '', i = 0;
    while (i < css.length) {
      var brace = css.indexOf('{', i);
      if (brace < 0) break;
      var sel = css.slice(i, brace).trim();
      var head = sel.replace(/^@[^ ]*\s*/, '').trim();
      if (head.indexOf('.sl') < 0 && head.indexOf(':root') < 0) head = head.split(',').map(function (x) {
        x = x.trim();
        if (!x) return x;
        if (x.charAt(0) === '.') return '.sl ' + x;
        if (x.charAt(0) === '#') return '.sl ' + x;
        return '.sl ' + x;
      }).join(', ');
      out += (out ? ' ' : '') + head + '{';
      var depth = 1, j = brace + 1;
      while (j < css.length && depth > 0) {
        if (css.charAt(j) === '{') depth++;
        else if (css.charAt(j) === '}') depth--;
        j++;
      }
      out += css.slice(brace + 1, j - 1) + '}';
      i = j;
    }
    return out.trim();
  }

  function promptEstilo(instruccion, contexto) {
    return 'Eres director de arte de Rally Studio. A partir de esta petición del equipo, defines el estilo de un carrusel 4:5 para redes.\n\n' +
      'Petición: ' + instruccion + '\n\n' +
      'Contexto del equipo: ' + (contexto || '') + '\n\n' +
      'Responde SOLO con un JSON válido, sin markdown ni explicaciones:\n' +
      '{"name":"nombre corto del estilo","skin":"' + SPEC.skin.join('|') + '",' +
      '"cover":"' + SPEC.cover.join('|') + '","card":"' + SPEC.card.join('|') + '",' +
      '"deco":"' + SPEC.deco.join('|') + '",' +
      '"pal":{"bg":"#hex","bg2":"#hex","ac":"#hex","ink":"#hex","mu":"#hex","gl":"#hex"},' +
      '"fonts":{"t":"' + SPEC.titleFont.join('|') + '","b":"' + SPEC.bodyFont.join('|') + '"},' +
      '"css":"reglas CSS opcionales que se aplican dentro de la lámina (.sl), sin etiquetas html",' +
      '"notes":"una frase breve, máximo 140 caracteres, explicando la decisión"}\n\n' +
      'Reglas: bg es el color de la portada, bg2 el de las láminas de integrante, ac el acento, ink el texto principal sobre bg, mu el texto suave y gl las formas de fondo. ' +
      'ink y bg deben contrastar (WCAG AA o mejor). Nada de morado (#7c3aed ni similares). ' +
      'Elige skin/cover/card/deco solo de las listas. El nombre es corto y sin repetir el nombre del equipo. ' +
      'El campo css es opcional: úsalo solo si la petición pide un detalle visual que no se logra con la paleta (por ejemplo, una textura o una línea decorativa). ' +
      'Usa variables CSS del sistema (--bg, --bg2, --ac, --ink, --mu, --gl) y unidades cqw.';
  }

  /* Las fuentes que devuelve la IA deben existir en la biblioteca del proyecto:
     si no, se pide una equivalente o se deja la actual. */
  var FALLBACK_T = 'Oswald', FALLBACK_B = 'Barlow';
  function fuenteOk(nombre, categoria) {
    if (!nombre || typeof nombre !== 'string') return null;
    var n = nombre.trim();
    if (typeof FONT_LIBRARY !== 'undefined') {
      for (var i = 0; i < FONT_LIBRARY.length; i++) {
        if (FONT_LIBRARY[i].family.toLowerCase() === n.toLowerCase()) {
          try { loadFont(FONT_LIBRARY[i].family, FONT_LIBRARY[i].weights); } catch (e) {}
          return FONT_LIBRARY[i].family;
        }
      }
    }
    var lista = categoria === 'b' ? SPEC.bodyFont : SPEC.titleFont;
    if (lista.indexOf(n) >= 0) return n;
    return null;
  }

  /* Convierte la respuesta de /api/ai/design (paleta + fuentes) al mismo
     formato que usa el carrusel. */
  function fromDesign(d) {
    var p = (d && d.palette) || {};
    var f = (d && d.fonts) || {};
    var pal = {
      bg: hex(p.bg) || hex(p.secondary),
      bg2: hex(p.secondary),
      ac: hex(p.accent),
      ink: hex(p.text) || hex(p.primary),
      mu: null, gl: null
    };
    var out = {
      pal: completePal(pal),
      fonts: { t: fuenteOk(f.title, 't') || FALLBACK_T, b: fuenteOk(f.body, 'b') || FALLBACK_B },
      notes: (d && d.rationale) ? String(d.rationale).slice(0, 160) : ''
    };
    if (!out.pal) return null;
    return out;
  }

  return {
    SPEC: SPEC,
    quota: quotaState,
    job: job,
    design: design,
    fromDesign: fromDesign,
    parseJSON: parseJSON,
    sanitize: sanitize,
    promptEstilo: promptEstilo,
    promptPaleta: promptPaleta,
    url: url
  };
})();
