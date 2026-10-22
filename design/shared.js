// Identidad compartida entre los 3 modulos de design/ (carrusel, kit, thumbnail).
// Una sola clave, un solo objeto: lo que se guarda aqui lo ven los tres.
//
// Paleta canonica (mismos roles en los 3 modulos):
//   bg  = fondo de superficie   bg2 = fondo secundario
//   ac  = color de marca (acento)  ink = texto principal
//   mu  = texto suave             gl  = formas
// Tipografia: fonts.t (titular) / fonts.b (texto) / fonts.l (etiquetas).
// Equipo: team.* (nombre, tag, universidad, ciudad, logo) y mem[].

var KEY = 'rally_design_v5';
var LEGACY_KEYS = ['rally_design_v4'];

var PAL_DEFAULT = { bg: '#FFFFFF', bg2: '#F0F6FF', ac: '#0866F5', ink: '#0D1B35', mu: '#5C7193', gl: '#DCE7F5' };
var FONTS_DEFAULT = { t: 'Plus Jakarta Sans', b: 'Barlow', l: 'JetBrains Mono' };

// Datos por defecto de la institucion. La ciudad se deja vacia a proposito:
// se completa cuando el equipo la confirme.
var INSTITUTION_DEFAULT = {
  name: 'Universidad Nacional de Ingeniería',
  logo: 'assets/logo_uni.png',       // lockup con el nombre
  symbol: 'assets/logo_uni_symbol.png' // monograma para espacios cuadrados
};
var TEAM_DEFAULT = { university: INSTITUTION_DEFAULT.name, city: '' };
// Valores de plantilla que se sustituyen por los de arriba al normalizar.
var TEAM_PLACEHOLDERS = { university: ['Nombre de la universidad', 'Nombre de la Universidad'], city: ['Ciudad'] };

function _clone(o) { return JSON.parse(JSON.stringify(o)); }

function _presets() {
  return (typeof RALLY_PRESETS !== 'undefined' && RALLY_PRESETS.length) ? RALLY_PRESETS : [];
}

function _contenido() {
  return (typeof RALLY_CONTENIDO !== 'undefined' && RALLY_CONTENIDO) ? RALLY_CONTENIDO : null;
}

function byId(id) {
  var ps = _presets();
  for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return ps[i];
  return ps[0] || null;
}

function mkStyle(p) {
  if (!p) return { id: 'base', skin: 'refined', cover: 'a', card: 'diagonal', deco: 'none' };
  return { id: p.id, skin: p.skin, cover: p.cover, card: p.card, deco: p.deco };
}

// Identidad por defecto: primer preset + contenido de referencia.
function defaultIdentity() {
  var cont = _contenido();
  var p0 = _presets()[0] || { id: 'base', skin: 'refined', cover: 'a', card: 'diagonal', deco: 'none', pal: {}, fonts: {} };
  var def = {};
  def.style = mkStyle(p0);
  def.pal = _clone(p0.pal || {});
  for (var k in PAL_DEFAULT) if (!def.pal[k]) def.pal[k] = PAL_DEFAULT[k];
  def.fonts = { t: p0.fonts && p0.fonts.t, b: p0.fonts && p0.fonts.b, l: p0.fonts && p0.fonts.l };
  for (var f in FONTS_DEFAULT) if (!def.fonts[f]) def.fonts[f] = FONTS_DEFAULT[f];
  def.team = cont ? _clone(cont.team) : { name: '', tag: '', kicker: '', title: '', foot: '', university: '', city: '' };
  def.mem = cont ? _clone(cont.mem) : [];
  def.styles = [];                       // estilos generados por IA para este equipo
  def.decor = p0.deco || 'none';
  def.bio = '';
  def.impacto = impactoPorDefecto();
  return def;
}

// --- estado del modulo impacto (laminas ODS + plan nacional) ---
// Todo vive aqui para que la identidad compartida lo preserve entre modulos
// y sesiones. {preset, dur, odsOn, textos, plan, narracion, anim}.
function impactoPorDefecto() {
  return {
    preset: '',
    dur: 5,
    odsOn: {},
    textos: {},
    plan: { modo: '', programas: [], municipio: '', cifra: '', texto: '' },
    narracion: {},
    anim: {
      mosaico: { entrada: 'banda', enfasis: 'pulso', salida: 'fade' },
      ficha: { entrada: 'fade', enfasis: 'pop', salida: 'none' },
      plan: { entrada: 'wipe', enfasis: 'none', salida: 'fade' }
    }
  };
}

// Parser tolerante de referencias ODS: 'ODS 12' | 'ODS12' | 'ods 9' -> 1..17.
// Cualquier texto sin digitos tras 'ODS' (o fuera de rango) es null.
function odsOf(txt) {
  var m = String(txt || '').match(/ODS\s*(\d{1,2})/i);
  if (!m) return null;
  var n = parseInt(m[1], 10);
  return (n >= 1 && n <= 17) ? n : null;
}

// Mezcla el impacto guardado con los defaults: las claves nuevas (futuras)
// y las secciones ausentes salen del default, lo escrito se conserva.
function impactoNormalizado(v) {
  var d = impactoPorDefecto();
  if (!v || typeof v !== 'object') return d;
  ['odsOn', 'textos', 'narracion'].forEach(function (k) {
    if (v[k] && typeof v[k] === 'object') d[k] = v[k];
  });
  if (v.plan) { for (var k in d.plan) if (v.plan[k] !== undefined) d.plan[k] = v.plan[k]; }
  if (v.anim) {
    ['mosaico', 'ficha', 'plan'].forEach(function (t) {
      if (v.anim[t]) { for (var kk in d.anim[t]) if (v.anim[t][kk] !== undefined) d.anim[t][kk] = v.anim[t][kk]; }
    });
  }
  if (v.preset !== undefined) d.preset = v.preset;
  if (v.dur != null) d.dur = v.dur;
  return d;
}

// Normaliza cualquier identidad guardada (vieja o incompleta).
function normalizeIdentity(v) {
  var base = defaultIdentity();
  if (!v || typeof v !== 'object') return base;
  var out = _clone(v);
  if (typeof out.style === 'string') {
    var p = byId(out.style);
    if (p) { out.style = mkStyle(p); out.pal = _clone(p.pal); out.fonts = _clone(p.fonts); }
  }
  if (!out.style || !out.style.skin) out.style = mkStyle(byId(out.style && out.style.id));
  out.pal = out.pal || {};
  for (var k in PAL_DEFAULT) if (!out.pal[k]) out.pal[k] = base.pal[k];
  out.fonts = out.fonts || {};
  for (var f in FONTS_DEFAULT) if (!out.fonts[f]) out.fonts[f] = base.fonts[f];
  out.team = out.team || base.team;
  var cont = _contenido();
  if (cont && cont.team) {
    for (var tk in cont.team) if (out.team[tk] === undefined) out.team[tk] = cont.team[tk];
  }
  // Migracion de plantilla: la institucion por defecto es la UNI y la ciudad
  // se deja vacia hasta que el equipo la confirme.
  if (!out.team.university || TEAM_PLACEHOLDERS.university.indexOf(out.team.university) >= 0) {
    out.team.university = TEAM_DEFAULT.university;
  }
  if (!out.team.city || TEAM_PLACEHOLDERS.city.indexOf(out.team.city) >= 0) {
    out.team.city = TEAM_DEFAULT.city;
  }
  out.mem = Array.isArray(out.mem) ? out.mem : base.mem;
  out.styles = Array.isArray(out.styles) ? out.styles : [];
  if (!out.decor) out.decor = base.decor;
  out.impacto = impactoNormalizado(out.impacto);
  return out;
}

function loadIdentity() {
  try {
    var v = JSON.parse(localStorage.getItem(KEY));
    if (v && v.team && v.pal) return normalizeIdentity(v);
  } catch (e) {}
  // Migracion: claves viejas -> clave actual.
  for (var i = 0; i < LEGACY_KEYS.length; i++) {
    try {
      var old = JSON.parse(localStorage.getItem(LEGACY_KEYS[i]));
      if (old && old.team && old.pal) {
        var mig = normalizeIdentity(old);
        saveIdentity(mig);
        return mig;
      }
    } catch (e2) {}
  }
  return defaultIdentity();
}

function saveIdentity(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) {}
}

// Compatibilidad con el codigo existente de index.html
function load() { return loadIdentity(); }
function save() { saveIdentity(typeof S !== 'undefined' ? S : loadIdentity()); }

// ---------- brief.json -> identidad compartida ----------
// Los 3 modulos leen el mismo brief. Nada se escribe a mano.
var BRIEF_URLS = ['../brief.json', 'brief.json', '/brief.json'];

function aplicarBrief(b, ident) {
  if (!b) return false;
  var id = ident || (typeof S !== 'undefined' ? S : null);
  if (!id) return false;
  var cont = _contenido();
  var d = (cont && cont.team) ? cont.team : {};
  var hit = false;
  function poner(campo, valor) {
    if (!valor) return;
    var actual = id.team[campo];
    if (!actual || actual === d[campo]) { id.team[campo] = valor; hit = true; }
  }
  poner('name', b.team_name || b.project_name);
  poner('title', b.project_name || b.description_one_line);
  poner('foot', [b.university, b.city].filter(Boolean).join(' · '));
  // El brief manda sobre el valor por defecto de la institucion, pero no
  // sobre lo que el equipo haya escrito a mano.
  if (b.university && (!id.team.university || id.team.university === TEAM_DEFAULT.university)) {
    id.team.university = b.university; hit = true;
  }
  if (b.city && (!id.team.city || id.team.city === TEAM_DEFAULT.city)) { id.team.city = b.city; hit = true; }
  poner('kicker', b.rally_type
    ? (b.rally_type === 'latam' ? 'Rally Latinoamericano de Innovación' : 'Rally Nacional de Innovación')
    : '');
  // Tipo de rally: lo fijan el brief o el selector manual del thumbnail.
  if (b.rally_type && !id.rallyType) {
    id.rallyType = (b.rally_type === 'latam') ? 'latam' : 'nacional';
    hit = true;
  }
  if (hit) saveIdentity(id);
  return hit;
}

// ---------- color derivado ----------
// La identidad guarda 6 roles. Cada modulo los traduce a su propio CSS
// sin volver a inventar colores: aqui viven las reglas de legibilidad.
function hexToRGB(c) {
  c = String(c || '').trim();
  if (c[0] !== '#') return null;
  var h = c.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function lumOf(c) {
  var p = hexToRGB(c);
  if (!p) return null;
  var r = p.r / 255, g = p.g / 255, b = p.b / 255;
  r = r <= 0.039 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.039 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.039 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  var la = lumOf(a), lb = lumOf(b);
  if (la == null || lb == null) return null;
  var hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

// Oscurece un color conservando el tono (para texto legible sobre claro).
function darken(c, factor) {
  var p = hexToRGB(c);
  if (!p) return c;
  var f = factor || 0.35;
  function h(n) { return Math.max(0, Math.min(255, Math.round(n * f))).toString(16).padStart(2, '0'); }
  return '#' + h(p.r) + h(p.g) + h(p.b);
}

// --- helpers de color para paletas sugeridas ---

// Saturacion 0-1 de un color (0 en grises, negro y blanco).
function satOf(c) {
  var p = hexToRGB(c);
  if (!p) return 0;
  var mx = Math.max(p.r, p.g, p.b), mn = Math.min(p.r, p.g, p.b);
  return mx === 0 ? 0 : (mx - mn) / mx;
}

// Negro o casi negro: el detalle de texto del logo.
function esCasiNegro(c) {
  if (!c || lumOf(c) == null) return false;
  return lumOf(c) <= 0.08 && satOf(c) <= 0.35;
}

// Tono 0-360 de un color (null si es gris/negro puro).
function hueOf(c) {
  var p = hexToRGB(c);
  if (!p) return null;
  var r = p.r / 255, g = p.g / 255, b = p.b / 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx === mn) return null;
  var h;
  if (mx === r) h = ((g - b) / (mx - mn)) % 6;
  else if (mx === g) h = (b - r) / (mx - mn) + 2;
  else h = (r - g) / (mx - mn) + 4;
  h = h * 60; if (h < 0) h += 360;
  return h;
}

// Morado/violeta: vetado por la marca. No se propone ni se deja pasar.
function isPurpleHex(c) {
  var h = hueOf(c);
  if (h == null) return false;
  return h >= 258 && h <= 345;
}

function _rgbToHsl(hex) {
  var p = hexToRGB(hex);
  if (!p) return null;
  var r = p.r / 255, g = p.g / 255, b = p.b / 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  var l = (mx + mn) / 2, s = 0, h = 0;
  if (mx !== mn) {
    var d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = h * 60; if (h < 0) h += 360;
  }
  return { h: h, s: s, l: l };
}

function _hslToHex(hsl) {
  function h2(h, m1, m2) {
    h = (h % 360 + 360) % 360;
    if (h < 60) return m1 + (m2 - m1) * h / 60;
    if (h < 180) return m2;
    if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
    return m1;
  }
  var m2 = hsl.l <= 0.5 ? hsl.l * (1 + hsl.s) : hsl.l + hsl.s - hsl.l * hsl.s;
  var m1 = 2 * hsl.l - m2;
  var r = h2(hsl.h + 120, m1, m2), g = h2(hsl.h, m1, m2), b = h2(hsl.h - 120, m1, m2);
  function hx(v) { return Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0'); }
  return '#' + hx(r) + hx(g) + hx(b);
}

// Rota el tono a un objetivo conservando saturacion y luz (para sacar morado).
function rotateHue(hex, targetHue) {
  var hsl = _rgbToHsl(hex);
  if (!hsl) return hex;
  hsl.h = targetHue;
  return _hslToHex(hsl);
}

// Aclara el color mezclandolo con blanco (para alejarlo de un primary oscuro).
function lighten(c, f) {
  var p = hexToRGB(c);
  if (!p) return c;
  var k = f == null ? 0.4 : f;
  function h(n) { return Math.max(0, Math.min(255, Math.round(n + (255 - n) * k))).toString(16).padStart(2, '0'); }
  return '#' + h(p.r) + h(p.g) + h(p.b);
}

// Oscurece/aclara en pasos hasta cumplir el contraste minimo pedido.
// Devuelve null si ningun ajuste llega al minimo.
function ensureContrast(fg, bg, min) {
  if (!fg || !bg) return null;
  var need = min || 3;
  if (contrastRatio(fg, bg) >= need) return fg;
  var i;
  for (i = 0.85; i >= 0.1; i -= 0.05) {
    var d = darken(fg, i);
    if (contrastRatio(d, bg) >= need) return d;
  }
  for (i = 0.1; i <= 0.9; i += 0.05) {
    var l = lighten(fg, i);
    if (contrastRatio(l, bg) >= need) return l;
  }
  return null;
}

// Tonos de marca seguros: el morado esta vetado por las reglas del proyecto,
// asi que cuando el logo es morado se propone un color de contraste real.
var TONOS_SEGUROS = ['#0866F5', '#0F766E', '#15803D', '#B45309', '#C2410C', '#B91C1C'];

// Elige un color de marca que contraste con el fondo y con la tinta.
function colorDeMarcaSeguro(primary, bg) {
  var mejor = null, mejorRatio = -1;
  for (var i = 0; i < TONOS_SEGUROS.length; i++) {
    var c = TONOS_SEGUROS[i];
    if (isPurpleHex(c)) continue;
    var cr = contrastRatio(c, bg);
    var cp = primary ? contrastRatio(c, primary) : 99;
    if (cr >= 3 && cp >= 2) return c;
    var min = Math.min(cr / 3, cp / 2);
    if (min > mejorRatio) { mejorRatio = min; mejor = c; }
  }
  return mejor || '#0866F5';
}

// Ajusta el acento para que se lea sobre el fondo y se distinga de la tinta.
// Prioridad: legibilidad sobre el fondo (dura). La distincion frente a la
// tinta es blanda: si no cabe sin romper la legibilidad, se deja como esta.
function ajustarContraste(accent, bg, primary) {
  var base = accent;
  var sobreFondo = ensureContrast(base, bg, 3);
  if (sobreFondo) base = sobreFondo;
  if (!primary) return base;
  if (contrastRatio(base, primary) >= 2) return base;
  var i, cand;
  // Primero aclarando (el acento suele ser claro sobre tinta oscura).
  for (i = 0.05; i <= 0.9; i += 0.05) {
    cand = lighten(base, i);
    if (contrastRatio(cand, primary) >= 2 && contrastRatio(cand, bg) >= 3) return cand;
  }
  // Despues oscureciendo (tinta clara, acento oscuro).
  for (i = 0.9; i >= 0.1; i -= 0.05) {
    cand = darken(base, i);
    if (contrastRatio(cand, primary) >= 2 && contrastRatio(cand, bg) >= 3) return cand;
  }
  return base;
}

// --- extraccion de paleta desde los pixeles del logo ---
// Funcion pura: recibe RGBA y devuelve la paleta.
// Reglas: el negro NO se descarta (puede ser la tinta del texto del logo),
// el morado queda vetado, y el acento debe contrastar con la tinta.
function extractPaletteFromPixels(data) {
  var buckets = {};
  for (var i = 0; i < data.length; i += 4) {
    var r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a < 60) continue;
    // Solo se va el blanco de fondo del archivo. El negro se conserva.
    if (r > 235 && g > 235 && b > 235) continue;
    var key = (Math.floor(r/24)*24) + ',' + (Math.floor(g/24)*24) + ',' + (Math.floor(b/24)*24);
    var exacto = '#' + [r,g,b].map(function(x){return x.toString(16).padStart(2,'0');}).join('');
    var bucket = buckets[key];
    if (!bucket) { bucket = buckets[key] = { n: 0, tonos: {} }; }
    bucket.n++;
    bucket.tonos[exacto] = (bucket.tonos[exacto] || 0) + 1;
  }
  var keys = Object.keys(buckets).sort(function(a,b){return buckets[b].n-buckets[a].n;}).slice(0,10);
  if (!keys.length) return null;
  // De cada bucket se usa el tono exacto mas frecuente (no el del bucket):
  // asi un negro #111111 no se convierte en #000000.
  function tonoExacto(key) {
    var tonos = buckets[key].tonos;
    var mejor = null, n = -1;
    Object.keys(tonos).forEach(function(t){
      if (tonos[t] > n) { n = tonos[t]; mejor = t; }
    });
    return mejor;
  }
  function lum(c){ var r=c.r/255,g=c.g/255,b=c.b/255; r=r<=.039?r/12.92:Math.pow((r+.055)/1.055,2.4); g=g<=.039?g/12.92:Math.pow((g+.055)/1.055,2.4); b=b<=.039?b/12.92:Math.pow((b+.055)/1.055,2.4); return .2126*r+.7152*g+.0722*b; }
  function sat(c){ var mx=Math.max(c.r,c.g,c.b), mn=Math.min(c.r,c.g,c.b); return mx===0?0:(mx-mn)/mx; }
  function hue(c){
    var r=c.r/255,g=c.g/255,b=c.b/255;
    var mx=Math.max(r,g,b), mn=Math.min(r,g,b);
    if (mx===mn) return null;
    var h;
    if (mx===r) h = ((g-b)/(mx-mn)) % 6;
    else if (mx===g) h = (b-r)/(mx-mn)+2;
    else h = (r-g)/(mx-mn)+4;
    h = h*60; if (h<0) h+=360;
    return h;
  }
  function isPurple(c){ var h = hue(c); return h != null && h >= 258 && h <= 345; }
  function cr(a,b){ var la=lum(a), lb=lum(b); var hi=Math.max(la,lb), lo=Math.min(la,lb); return (hi+0.05)/(lo+0.05); }
  function hex(c){ return '#' + [c.r,c.g,c.b].map(function(x){return x.toString(16).padStart(2,'0');}).join(''); }

  var cols = keys.map(function(k){
    var p = k.split(',');
    var e = hexToRGB(tonoExacto(k)) || { r: +p[0], g: +p[1], b: +p[2] };
    return { r: e.r, g: e.g, b: e.b, n: buckets[k].n };
  });
  // Negro real (detalle del logo) y grises muy oscuros.
  var blacks = cols.filter(function(c){ return lum(c) <= 0.08 && sat(c) <= 0.35; });
  // Color de marca: saturado, no morado, no demasiado claro.
  var brand = cols.filter(function(c){ return sat(c) >= 0.15 && !isPurple(c) && lum(c) <= 0.55; });
  // Cualquier color no morado (para el fondo secundario).
  var rest = cols.filter(function(c){ return !isPurple(c); });
  // Morados detectados (por si el logo es solo morado: se rotan a azul).
  var purples = cols.filter(isPurple);
  if (!blacks.length && !brand.length && !rest.length && !purples.length) return null;

  // Logo monocromático morado: no hay tinta ni color de marca utilizables.
  // El morado esta vetado, asi que se propone tinta neutra y un color de
  // marca con contraste real en vez de un morado disguise.
  if (!blacks.length && !brand.length && !rest.length && purples.length) {
    var tintaNeutra = '#0D1B35';
    var marcaSegura = colorDeMarcaSeguro(tintaNeutra, '#FFFFFF');
    return {
      bg: '#FFFFFF',
      primary: tintaNeutra,
      secondary: lighten(marcaSegura, 0.88),
      accent: marcaSegura,
      hasBlack: false,
      black: '',
    };
  }

  // Tinta: primero el negro del logo (es lo que el usuario quiere ver),
  // si no hay negro, el color de marca mas oscuro.
  var ink = null;
  if (blacks.length) ink = blacks.slice().sort(function(a,b){ return lum(a)-lum(b); })[0];
  else if (brand.length) ink = brand.slice().sort(function(a,b){ return lum(a)-lum(b); })[0];
  else if (rest.length) ink = rest.slice().sort(function(a,b){ return lum(a)-lum(b); })[0];
  else ink = purples.slice().sort(function(a,b){ return lum(a)-lum(b); })[0];

  // Acento: el color mas saturado que contraste con la tinta (>= 3:1).
  var pool = brand.concat(rest).filter(function(c){ return c !== ink; });
  var accent = null;
  for (var j = 0; j < pool.length; j++) {
    if (cr(pool[j], ink) >= 3) { accent = pool[j]; break; }
  }
  if (!accent) {
    accent = pool.slice().sort(function(a,b){ return sat(b)-sat(a); })[0] || (purples[0] || ink);
  }

  // Fondo secundario: un tinte claro. Si el logo tiene un tono claro real
  // se usa; si no, se deriva del acento (nunca igual a la tinta ni al acento).
  var light = rest.filter(function(c){ return lum(c) > 0.6; });
  var accentHex = hex(accent);
  var inkHex = hex(ink);
  var secondaryHex;
  if (light.length) {
    secondaryHex = hex(light.slice().sort(function(a,b){ return sat(b)-sat(a); })[0]);
  } else {
    secondaryHex = lighten(accentHex, 0.85);
  }
  if (secondaryHex.toUpperCase() === accentHex.toUpperCase() ||
      secondaryHex.toUpperCase() === inkHex.toUpperCase()) {
    secondaryHex = lighten(accentHex, 0.85);
  }

  // Salida en forma CANONICA: primary = tinta, secondary = fondo 2,
  // accent = color de marca. (La conversion de la paleta cruda de la IA a
  // esta forma la hace el backend: sanitize_design_palette.)
  var out = {
    bg: '#FFFFFF',
    primary: inkHex,
    secondary: secondaryHex,
    accent: accentHex,
  };
  // El negro detectado es dato duro: la IA no puede taparlo.
  out.hasBlack = blacks.length > 0;
  out.black = blacks.length ? hex(blacks.slice().sort(function(a,b){ return lum(a)-lum(b); })[0]) : '';
  return out;
}

// Convierte la paleta CRUDA que devuelve la IA ({primary, secondary, accent,
// bg, text}) a la forma canonica {bg, primary(tinta), secondary(fondo 2),
// accent(marca)}. Es el espejo en JS de sanitize_design_palette del backend,
// para que el cliente no dependa de la conversion del servidor.
function sanitizePaletteCruda(pal) {
  var p = pal || {};
  var notes = [];
  var bg = p.bg || '#FFFFFF';
  if (lumOf(bg) == null || lumOf(bg) < 0.85) { bg = '#FFFFFF'; notes.push('fondo forzado a blanco'); }

  var crudos = [p.primary, p.secondary, p.accent].filter(function (c) {
    return c && lumOf(c) != null;
  });

  // Tinta: el negro que declara la IA, si no el negro de los candidatos,
  // si no el color mas oscuro disponible.
  var tinta = null;
  if (p.text && lumOf(p.text) != null && esCasiNegro(p.text)) {
    tinta = p.text;
    notes.push('tinta = negro del logo');
  } else {
    var negros = crudos.filter(esCasiNegro);
    if (negros.length) {
      tinta = negros.sort(function (a, b) { return lumOf(a) - lumOf(b); })[0];
      notes.push('tinta = negro del logo');
    } else {
      var noMorados = crudos.filter(function (c) { return !isPurpleHex(c); });
      if (noMorados.length) {
        tinta = noMorados.sort(function (a, b) { return lumOf(a) - lumOf(b); })[0];
      } else {
        tinta = '#0D1B35';
      }
    }
  }
  if (isPurpleHex(tinta)) { tinta = '#0D1B35'; notes.push('tinta morada -> tinta neutra'); }
  if (lumOf(tinta) > 0.30) {
    var f = 0.6;
    while (f > 0.05 && lumOf(darken(tinta, f)) > 0.30) f -= 0.05;
    tinta = darken(tinta, f);
    notes.push('tinta oscurecida para legibilidad');
  }

  // Color de marca: el primero que contraste con la tinta, sin morado.
  var candidatos = crudos.filter(function (c) { return !esCasiNegro(c) && !isPurpleHex(c); });
  var morados = crudos.filter(isPurpleHex);
  var marca = null;
  for (var i = 0; i < candidatos.length; i++) {
    if (contrastRatio(candidatos[i], tinta) >= 3) { marca = candidatos[i]; break; }
  }
  if (!marca && candidatos.length) {
    marca = candidatos.sort(function (a, b) { return satOf(b) - satOf(a); })[0];
  }
  if (!marca && morados.length) {
    marca = rotateHue(morados[0], 214);
    notes.push('marca morada -> azul');
  }
  if (!marca) {
    marca = colorDeMarcaSeguro(tinta, bg);
    notes.push('marca de contraste real');
  }

  var canonica = sanitizePalette({
    bg: bg, primary: tinta, secondary: lighten(marca, 0.88), accent: marca
  });
  canonica.notes = notes.concat(canonica.notes);
  return canonica;
}

// Saneo de una paleta canonica de la marca.
// Entrada: {bg, primary(tinta), secondary(fondo 2), accent(marca)}.
// Salida: la misma forma, con notes[] de lo que se ajusto.
// Reglas: nada de morado/violeta, la tinta es oscura y legible, el color de
// marca contrasta con la tinta y con el fondo, y el fondo 2 es una superficie
// clara. (La conversion de la paleta cruda de la IA a esta forma la hace el
// backend, en scripts/rally_service.py: sanitize_design_palette.)
function sanitizePalette(pal) {
  var p = pal || {};
  var notes = [];
  var bg = p.bg || '#FFFFFF';
  if (lumOf(bg) == null || lumOf(bg) < 0.85) { bg = '#FFFFFF'; notes.push('fondo forzado a blanco'); }

  // --- tinta ---
  var tinta = p.primary || '#0D1B35';
  if (isPurpleHex(tinta)) { tinta = '#0D1B35'; notes.push('tinta morada -> tinta neutra'); }
  if (lumOf(tinta) == null) tinta = '#0D1B35';
  if (lumOf(tinta) > 0.30) {
    var f = 0.6;
    while (f > 0.05 && lumOf(darken(tinta, f)) > 0.30) f -= 0.05;
    tinta = darken(tinta, f);
    notes.push('tinta oscurecida para legibilidad');
  }

  // --- color de marca ---
  var crudos = [p.accent, p.secondary].filter(function (c) {
    return c && lumOf(c) != null;
  });
  var candidatos = crudos.filter(function (c) {
    return !esCasiNegro(c) && !isPurpleHex(c);
  });
  var morados = crudos.filter(isPurpleHex);
  // Un color de marca tiene que leerse sobre el fondo (>= 3:1). Por eso un
  // tinte claro (el fondo 2) no puede ganar el puesto de marca.
  var legibles = candidatos.filter(function (c) { return contrastRatio(c, bg) >= 3; });
  var pool = legibles.length ? legibles : candidatos;
  var marca = null;
  for (var i = 0; i < pool.length; i++) {
    if (contrastRatio(pool[i], tinta) >= 3) { marca = pool[i]; break; }
  }
  if (!marca && pool.length) {
    marca = pool.slice().sort(function (a, b) { return satOf(b) - satOf(a); })[0];
  }
  if (!marca && morados.length) {
    marca = rotateHue(morados[0], 214);
    notes.push('marca morada -> azul');
  }
  if (!marca) {
    marca = colorDeMarcaSeguro(tinta, bg);
    notes.push('marca de contraste real');
  }
  if (isPurpleHex(marca)) { marca = rotateHue(marca, 214); notes.push('marca morada -> azul'); }
  // La marca debe distinguirse de la tinta.
  if (contrastRatio(marca, tinta) < 2) {
    var seguro = colorDeMarcaSeguro(tinta, bg);
    if (contrastRatio(seguro, tinta) >= 2 && contrastRatio(seguro, bg) >= 3) {
      marca = seguro;
      notes.push('marca con contraste real');
    }
  }
  // Legibilidad sobre el fondo: es dura (3:1).
  marca = ajustarContraste(marca, bg, tinta);

  // --- fondo 2: siempre una superficie clara ---
  var secondary = p.secondary || '';
  if (!secondary || lumOf(secondary) == null || lumOf(secondary) <= 0.85) {
    secondary = lighten(marca, 0.88);
    if (lumOf(secondary) <= 0.85) secondary = lighten(marca, 0.93);
    notes.push('fondo 2 derivado de la marca');
  }
  if (isPurpleHex(secondary)) { secondary = lighten(marca, 0.88); notes.push('fondo 2 morado -> derivado'); }

  return { bg: bg, primary: tinta, secondary: secondary, accent: marca, notes: notes };
}

// Tinta legible sobre un papel claro: si la tinta de la identidad es clara,
// se oscurece (mismo tono) para no perder legibilidad en kit y thumbnail.
function legibleInk(paper) {
  var ink = (S && S.pal && S.pal.ink) || '#0D1B35';
  var bg = paper || '#FFFFFF';
  var cr = contrastRatio(ink, bg);
  if (cr == null) return ink;
  if (cr >= 4.5) return ink;
  var f = 0.4;
  while (f > 0.05) {
    var cand = darken(ink, f);
    if (contrastRatio(cand, bg) >= 4.5) return cand;
    f -= 0.05;
  }
  return '#0D1B35';
}

// Color de marca fuerte (acento) legible sobre papel claro.
function brandColor(paper) {
  var ac = (S && S.pal && S.pal.ac) || '#0866F5';
  var bg = paper || '#FFFFFF';
  var cr = contrastRatio(ac, bg);
  if (cr == null || cr >= 4.5) return ac;
  var f = 0.5;
  while (f > 0.05) {
    var cand = darken(ac, f);
    if (contrastRatio(cand, bg) >= 4.5) return cand;
    f -= 0.05;
  }
  return '#0D1B35';
}

// Papel claro para superficiesKIT/thumb: usa bg2 si es claro, si no blanco.
function paperColor() {
  var p = (S && S.pal) || {};
  var c2 = p.bg2, c1 = p.bg;
  if (lumOf(c2) != null && lumOf(c2) > 0.85) return c2;
  if (lumOf(c1) != null && lumOf(c1) > 0.85) return c1;
  return '#FFFFFF';
}

// Logo canonico del equipo: el que sube el kit es el que ve el carrusel.
function teamLogo() {
  if (!S) return '';
  if (S.team && S.team.logo) return S.team.logo;
  return S.logo || '';
}

// Carga el brief y avisa cuando termino (para repintar el modulo).
function cargarBrief(ident, cb) {
  var id = ident || (typeof S !== 'undefined' ? S : null);
  var i = 0;
  function siguiente() {
    if (i >= BRIEF_URLS.length) { if (cb) cb(false); return; }
    var url = BRIEF_URLS[i++];
    fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (b) {
        if (b) { aplicarBrief(b, id); if (cb) cb(true, b); return; }
        siguiente();
      })
      .catch(function () { siguiente(); });
  }
  siguiente();
}
