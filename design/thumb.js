// Thumbnail de YouTube · Rally Design
// Identidad compartida (shared.js) + mapa real de Nicaragua (mapa_ni.js).
// Regla: nada de datos del proyecto escritos a mano. Todo sale de la identidad.

var S = loadIdentity();

// Lienzo de diseño del thumbnail. La tarjeta siempre mide esto y se escala
// con --k para caber en cualquier pantalla sin redibujar nada.
var TH_DESIGN = { w: 1280, h: 720 };

// Valores por defecto solo cuando la identidad no trae el dato.
var TH_DEFAULTS = {
  title: 'Título del proyecto',
  sub: 'Innovación · Impacto social',
  badge: '',   // vacío = usa el nombre del certamen (ver TH_EVENTS)
  kicker: '',
  preset: 'editorial'
};

// Certamen: logo oficial y nombre corto. El logo viene de design/assets/.
var TH_EVENTS = {
  nacional: { name: 'Rally Nacional de Innovación', short: 'RALLY NACIONAL', logo: 'assets/logo_rally_nacional.png' },
  latam: { name: 'Rally Latinoamericano de Innovación', short: 'RALLY LATAM', logo: 'assets/logo_rally_latam.png' }
};

// Presets: composición, no contenido. El estilo vive en CSS (data-style).
var TH_PRESETS = [
  { id: 'editorial', name: 'Editorial', note: 'Titular dominante, acento en una sola palabra, territorio en segundo plano.' },
  { id: 'mapa', name: 'Mapa', note: 'Nicaragua como figura principal: el territorio manda, el texto acompaña.' },
  { id: 'bold', name: 'Bold', note: 'Bloque de color plano y titular máximo. Cero ornamento.' },
  { id: 'minimal', name: 'Minimal', note: 'Papel, aire y una sola línea de tinta. Contraste por peso, no por color.' },
  { id: 'poster', name: 'Poster', note: 'Cartel de festival: titular enorme arriba, territorio abajo a la derecha.' },
  { id: 'diagonal', name: 'Diagonal', note: 'Corte diagonal: separa titular de territorio sin cajas ni sombras.' }
];

function $(id) { return document.getElementById(id); }

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function presetById(id) {
  for (var i = 0; i < TH_PRESETS.length; i++) if (TH_PRESETS[i].id === id) return TH_PRESETS[i];
  return TH_PRESETS[0];
}

function markEm(title, em) {
  if (!em) return esc(title);
  var re = new RegExp('(' + em.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i');
  return esc(title).replace(re, '<em>$1</em>');
}

// --- identidad -> variables CSS de la tarjeta ---------------------------------
// La paleta del grupo entra completa: fondo, acento, tinta, suave y formas.
// Los mezclados se calculan en JS: html2canvas no entiende color-mix().
function toRGB(c) {
  if (!c) return null;
  c = String(c).trim();
  if (c[0] === '#') {
    var h = c.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length < 6) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  var m = c.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    var p = m[1].split(/[,\s\/]+/).filter(Boolean).map(parseFloat);
    return [p[0] || 0, p[1] || 0, p[2] || 0];
  }
  return null;
}

function mix(a, b, w) {
  var A = toRGB(a), B = toRGB(b);
  if (!A || !B) return a;
  var c = [0, 1, 2].map(function (i) { return Math.round(A[i] * (1 - w) + B[i] * w); });
  return 'rgb(' + c.join(',') + ')';
}

// El color con mas contraste contra el fondo, de una lista corta.
function bestOn(bg, list) {
  var best = list[0], bestCr = -1;
  for (var i = 0; i < list.length; i++) {
    var cr = contrastRatio(list[i], bg);
    if (cr == null) continue;
    if (cr > bestCr) { bestCr = cr; best = list[i]; }
  }
  return best;
}

function paintVars(el) {
  var p = S.pal || {};
  // Roles canonicos (shared.js): bg/bg2 superficies, ac marca, ink texto.
  var paper = paperColor();
  var brand = brandColor(paper);
  var ink = legibleInk(paper);
  var accent = p.ac || brand;
  el.style.setProperty('--t-primary', brand);
  el.style.setProperty('--t-paper', paper);
  el.style.setProperty('--t-accent', accent);
  el.style.setProperty('--t-ink', ink);
  el.style.setProperty('--t-mu', p.mu || '#5C7193');
  el.style.setProperty('--t-forms', p.gl || '#DCE7F5');
  // Los medios tonos se derivan hacia el navy del sistema: la tinta de la
  // identidad puede ser clara y ensuciaria los fondos.
  el.style.setProperty('--t-mix38', mix(brand, '#0D1B35', 0.38));
  el.style.setProperty('--t-mix30', mix(brand, '#0D1B35', 0.30));
  // Sobre el bloque de acento solo cabe blanco o tinta profunda: el papel
  // puede ser demasiado claro. Se elige el de mayor contraste real.
  el.style.setProperty('--t-on-accent', bestOn(accent, ['#ffffff', '#0D1B35']));
  el.style.setProperty('--t-on-primary', bestOn(brand, ['#ffffff', '#0D1B35']));
  // Territorio: tono propio derivado de marca + papel. Distinto del fondo,
  // del papel (titular) y del acento, y siempre legible como figura.
  el.style.setProperty('--t-territory', mix(brand, paper, 0.32));
  el.style.setProperty('--t-territory-soft', mix(brand, ink, 0.62));
  // Suelo profundo para fondos oscuros: se deriva de la marca hacia el
  // navy del sistema, nunca del "ink" de la identidad (puede ser claro).
  el.style.setProperty('--t-ground', mix(brand, '#0D1B35', 0.58));
  el.style.setProperty('--t-ground-2', mix(brand, '#0D1B35', 0.34));
  el.style.setProperty('--t-on-ink', contrastRatio(ink, '#FFFFFF') >= 4.5 ? '#ffffff' : '#0D1B35');
  var f = S.fonts || {};
  el.style.setProperty('--fd', "'" + (f.t || 'Plus Jakarta Sans') + "',var(--rs-sans)");
  el.style.setProperty('--fb', "'" + (f.b || 'Barlow') + "',var(--rs-sans)");
  el.style.setProperty('--fm', "'" + (f.l || 'JetBrains Mono') + "',var(--rs-mono)");
}

// --- procedencia de los logos ------------------------------------------------
// Prioridad: override del thumbnail > kit de prensa / contenido > oficial del
// certamen > iniciales > marca neutra.
function rallyType() {
  return (S.rallyType && TH_EVENTS[S.rallyType]) ? S.rallyType : 'nacional';
}

function eventInfo() { return TH_EVENTS[rallyType()]; }

function eventLogoSrc() {
  if (S.thEventLogo) return S.thEventLogo;
  if (S.team && S.team.logoEvento) return S.team.logoEvento;
  return eventInfo().logo;
}

function teamLogoSrc() {
  if (S.thTeamLogo) return S.thTeamLogo;
  // Logo canonico compartido: el que se sube en el kit vive en S.team.logo.
  return teamLogo();
}

function uniLogoSrc() {
  if (S.thUniLogo) return S.thUniLogo;
  if (S.team && S.team.logoUni) return S.team.logoUni;
  // Por defecto: monograma de la Universidad Nacional de Ingenieria (Nicaragua).
  // El monograma, no el wordmark largo: a este tamano el texto pequeno del
  // lockup no se lee y la marca se ve de baja calidad.
  return INSTITUTION_DEFAULT.symbol;
}

function uniName() {
  var n = (S.team && S.team.university) ? String(S.team.university) : '';
  return n || INSTITUTION_DEFAULT.name;
}

function teamInitials() {
  var tag = (S.team && S.team.tag) ? String(S.team.tag).replace('#', '').trim() : '';
  if (tag) return tag.slice(0, 3).toUpperCase();
  var name = (S.team && S.team.name) ? String(S.team.name) : '';
  var parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// --- pintado de una tarjeta (preview grande y miniaturas usan la misma) -------
function paintCard(el, c) {
  if (!el) return;
  var q = function (sel) { return el.querySelector(sel); };
  var title = q('.title');
  if (title) title.innerHTML = markEm(c.title, c.em);
  var kicker = q('.kicker');
  if (kicker) kicker.textContent = c.kicker;
  var meta = q('.meta');
  if (meta) meta.textContent = c.sub;
  var team = q('.teamname');
  if (team) team.textContent = (S.team && S.team.name) || '';

  // Etiqueta de la esquina: el reto. Da contexto de un vistazo.
  var ribbon = q('.ribbon');
  if (ribbon) {
    var reto = c.reto || '';
    ribbon.textContent = reto;
    ribbon.hidden = !reto;
  }

  // Firma institucional: los tres logos al mismo nivel, en una sola banda.
  var sigTeam = q('.sig-team');
  if (sigTeam) {
    var tl = teamLogoSrc();
    var ini = teamInitials();
    sigTeam.innerHTML = tl ? '<img src="' + esc(tl) + '" alt="">'
      : (ini ? '<span class="initials">' + esc(ini) + '</span>'
        : '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="16" cy="16" r="5"/><ellipse cx="16" cy="16" rx="14" ry="6" transform="rotate(-24 16 16)"/></svg>');
  }
  var ev = q('.sig-event');
  if (ev) {
    if (S.thShowEvent === false) {
      ev.hidden = true;
      ev.innerHTML = '';
    } else {
      ev.hidden = false;
      ev.innerHTML = '<img src="' + esc(eventLogoSrc()) + '" alt="' + esc(eventInfo().name) + '">';
    }
  }
  var ulogo = q('.unilogo');
  if (ulogo) {
    var ul = uniLogoSrc();
    ulogo.innerHTML = ul ? '<img src="' + esc(ul) + '" alt="">' : '';
    ulogo.hidden = !ul;
  }
  var uname = q('.uniname');
  if (uname) {
    var un = uniName();
    uname.textContent = un;
    uname.hidden = !un;
  }
  var map = q('.mapni');
  if (map) {
    map.innerHTML = (typeof MAPA_NI !== 'undefined')
      ? '<svg viewBox="' + MAPA_NI.vb + '" preserveAspectRatio="xMidYMid meet"><path d="' + MAPA_NI.path + '"/></svg>'
      : '';
  }
  paintVars(el);
}

// --- contenido desde la identidad -------------------------------------------
// --- contenido desde la identidad -------------------------------------------
// El kicker nunca repite la universidad (ya está junto a su logo) ni el
// nombre del equipo si ya está en la cabecera.
function kickerText() {
  var team = (S.team && S.team.name) ? String(S.team.name) : '';
  var uni = uniName();
  if (S.thKicker) {
    // Si el kicker guardado traía la universidad, se limpia.
    var k = String(S.thKicker);
    if (uni && k.indexOf(uni) !== -1) {
      k = k.split(uni).join('').replace(/\s*·\s*$/, '').replace(/^\s*·\s*/, '').trim();
    }
    if (team && k === team) return team;
    return k || team || TH_DEFAULTS.kicker;
  }
  return team || TH_DEFAULTS.kicker;
}

function content() {
  return {
    title: S.thTitle || (S.team && S.team.title) || TH_DEFAULTS.title,
    em: S.thEm || '',
    sub: S.thSub || TH_DEFAULTS.sub,
    // El nombre de la universidad ya vive junto a su logo en la banda de
    // firma: aquí no se repite (ley de no duplicar datos).
    kicker: kickerText(),
    reto: S.thReto || (S.team && S.team.reto) || ''
  };
}

function syncControls() {
  var c = content();
  $('thTitleInput').value = c.title;
  $('thEm').value = c.em;
  $('thSub').value = c.sub;
  $('thKickerInput').value = c.kicker;
  $('thRetoInput').value = c.reto;
  S.thPreset = presetById(S.thPreset || TH_DEFAULTS.preset).id;
  syncRallyUI();
}

// ---- UI de certamen y logos -------------------------------------------------
// Los dos logos oficiales se muestran con su nombre debajo: no hay selector
// de texto, se elige con la imagen. El activo lleva la marca de estado.
function renderRallyChoices() {
  var box = $('thRallyChoices');
  if (!box) return;
  var ids = Object.keys(TH_EVENTS);
  if (box.getAttribute('data-built') !== '1') {
    box.innerHTML = ids.map(function (id) {
      return '<button type="button" class="logo-choice" data-rally="' + id + '">' +
        '<span class="logo-choice-mark"><img src="' + esc(TH_EVENTS[id].logo) + '" alt=""></span>' +
        '<span class="logo-choice-name">' + esc(TH_EVENTS[id].short) + '</span>' +
        '<span class="logo-choice-state" aria-hidden="true"></span>' +
        '</button>';
    }).join('');
    box.setAttribute('data-built', '1');
  }
  var btns = box.querySelectorAll('.logo-choice');
  for (var i = 0; i < btns.length; i++) {
    var on = btns[i].getAttribute('data-rally') === rallyType();
    btns[i].classList.toggle('on', on);
    btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
  }
}

function syncRallyUI() {
  renderRallyChoices();
  var show = $('thShowEvent');
  if (show) show.checked = S.thShowEvent !== false;
  var wm = $('thWatermark');
  if (wm) wm.checked = S.thWatermark !== false;

  var evPrev = $('thEventPreview');
  if (evPrev) {
    evPrev.innerHTML = '<img src="' + esc(eventLogoSrc()) + '" alt="">';
  }
  var tmPrev = $('thTeamPreview');
  if (tmPrev) {
    var tl = teamLogoSrc();
    var ini = teamInitials();
    tmPrev.innerHTML = tl ? '<img src="' + esc(tl) + '" alt="">' : (ini ? '<span>' + esc(ini) + '</span>' : '<span>—</span>');
  }
  var unPrev = $('thUniPreview');
  if (unPrev) {
    var ul = uniLogoSrc();
    unPrev.innerHTML = ul ? '<img src="' + esc(ul) + '" alt="">' : '<span>—</span>';
  }
  var evName = $('thEventFileName');
  if (evName) {
    evName.textContent = S.thEventLogo ? 'Logo propio para este thumbnail'
      : (S.team && S.team.logoEvento ? 'Logo del contenido del proyecto' : eventInfo().name);
  }
  var tmName = $('thTeamFileName');
  if (tmName) {
    tmName.textContent = S.thTeamLogo ? 'Logo propio para este thumbnail'
      : (S.team && S.team.logo ? 'Logo del equipo (carrusel / kit)' : 'Iniciales del equipo');
  }
  var unName = $('thUniFileName');
  if (unName) {
    unName.textContent = S.thUniLogo ? 'Logo propio para este thumbnail'
      : (S.team && S.team.logoUni ? 'Del contenido del proyecto' : 'Monograma de la UNI');
  }
}

// --- ajuste tipográfico: el titular nunca se desborda -----------------------
// Manda la altura disponible, no el tamaño fijo: si el título es largo,
// baja de peso y de cuerpo hasta caber. Un thumbnail se lee en un segundo.
function fitTitle(card) {
  var t = card.querySelector('.title');
  if (!t) return;
  t.style.fontSize = '';
  var base = parseFloat(getComputedStyle(t).fontSize) || 96;
  var maxH = (card.clientHeight || TH_DESIGN.h) - 300;
  var size = base;
  t.style.fontSize = size + 'px';
  var guard = 0;
  while (size > 36 && guard < 60 && (t.scrollHeight > maxH || t.scrollWidth > t.clientWidth + 1)) {
    size -= 3;
    t.style.fontSize = size + 'px';
    guard++;
  }
}

function fitAllTitles() {
  var main = $('thumbPreview');
  if (main) fitTitle(main);
  var previews = document.querySelectorAll('.preset-preview .thumb-card');
  for (var i = 0; i < previews.length; i++) fitTitle(previews[i]);
}

// --- escalado responsive ------------------------------------------------------
// La tarjeta mide 1280x720 fijo. --k la reduce al ancho disponible.
function fitStage(stage, card) {
  if (!stage || !card) return;
  var w = stage.clientWidth;
  if (!w) return;
  card.style.setProperty('--k', w / TH_DESIGN.w);
}

function fitAll() {
  fitStage($('thumbStage'), $('thumbPreview'));
  var previews = document.querySelectorAll('.preset-preview');
  for (var i = 0; i < previews.length; i++) {
    var p = previews[i];
    var card = p.querySelector('.thumb-card');
    if (card && p.clientWidth) card.style.setProperty('--k', p.clientWidth / TH_DESIGN.w);
  }
  fitAllTitles();
}

// --- presets: la miniatura es un clon de la tarjeta real --------------------
function miniThumb(presetId) {
  var src = $('thumbPreview');
  if (!src) return '';
  var clone = src.cloneNode(true);
  clone.removeAttribute('id');
  clone.setAttribute('data-style', presetId);
  clone.style.removeProperty('transform');
  paintCard(clone, content());
  return clone.outerHTML;
}

function renderPresets() {
  var row = $('thPresetRow');
  if (!row) return;
  row.innerHTML = TH_PRESETS.map(function (p) {
    var on = (S.thPreset === p.id) ? ' on' : '';
    return '<button class="preset-btn' + on + '" data-preset="' + p.id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<span class="preset-preview">' + miniThumb(p.id) + '</span>' +
      '<span class="preset-name">' + p.name + '</span>' +
      '</button>';
  }).join('');
  row.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      S.thPreset = b.getAttribute('data-preset');
      saveAll();
      renderPresets();
      renderThumb();
    });
  });
  var note = $('thPresetNote');
  if (note) note.textContent = presetById(S.thPreset).note;
  fitAll();
}

// --- render principal ---------------------------------------------------------
function renderThumb() {
  var card = $('thumbPreview');
  if (!card) return;
  card.setAttribute('data-style', presetById(S.thPreset).id);
  paintCard(card, content());
  var f = S.fonts || {};
  loadFont(f.t || 'Plus Jakarta Sans');
  loadFont(f.b || 'Barlow');
  fitAll();
}

function saveAll() {
  S.thTitle = $('thTitleInput').value;
  S.thEm = $('thEm').value;
  S.thSub = $('thSub').value;
  S.thKicker = $('thKickerInput').value;
  S.thReto = $('thRetoInput').value;
  saveIdentity(S);
}

// --- exportación: se clona a 1280x720 real para que salga nítido -------------
function snapshot() {
  var src = $('thumbPreview');
  var box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:fixed;left:-99999px;top:0;width:' + TH_DESIGN.w + 'px;height:' + TH_DESIGN.h + 'px;overflow:hidden;';
  var clone = src.cloneNode(true);
  clone.removeAttribute('id');
  clone.classList.remove('exporting');   // si no, el clon sale translúcido (.6)
  clone.style.transform = 'none';
  clone.style.width = TH_DESIGN.w + 'px';
  clone.style.height = TH_DESIGN.h + 'px';
  // Marca de agua sutil (solo en la exportación, no en pantalla) y solo si el
  // equipo la deja activa.
  if (S.thWatermark !== false) {
    var mark = document.createElement('div');
    mark.className = 'export-mark';
    mark.textContent = 'Rally Studio';
    clone.appendChild(mark);
  }
  box.appendChild(clone);
  document.body.appendChild(box);
  return { box: box, el: clone };
}

function exportPNG(targetId, filename, statusId) {
  var el = $(targetId);
  $(statusId).textContent = 'Generando PNG…';
  el.classList.add('exporting');
  var snap = snapshot();
  html2canvas(snap.el, { scale: 2, useCORS: true, backgroundColor: null }).then(function (canvas) {
    var link = document.createElement('a');
    link.download = filename + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    $(statusId).textContent = 'PNG descargado (' + canvas.width + '×' + canvas.height + ').';
  }).catch(function (e) {
    $(statusId).textContent = 'Error: ' + e.message;
  }).finally(function () {
    document.body.removeChild(snap.box);
    el.classList.remove('exporting');
  });
}

function exportPDF(targetId, filename, statusId) {
  var el = $(targetId);
  $(statusId).textContent = 'Generando PDF…';
  el.classList.add('exporting');
  var snap = snapshot();
  html2canvas(snap.el, { scale: 2, useCORS: true, backgroundColor: null }).then(function (canvas) {
    var imgData = canvas.toDataURL('image/png');
    var pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(filename + '.pdf');
    $(statusId).textContent = 'PDF descargado.';
  }).catch(function (e) {
    $(statusId).textContent = 'Error: ' + e.message;
  }).finally(function () {
    document.body.removeChild(snap.box);
    el.classList.remove('exporting');
  });
}

function readImage(file, cb) {
  if (!file) return;
  var r = new FileReader();
  r.onload = function () { cb(r.result); };
  r.readAsDataURL(file);
}

function bindRally() {
  // Elección del certamen con el logo: se elige la imagen, no una palabra.
  var box = $('thRallyChoices');
  if (box) {
    box.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.logo-choice') : null;
      if (!btn) return;
      var t = btn.getAttribute('data-rally');
      if (!TH_EVENTS[t] || t === rallyType()) return;
      S.rallyType = t;
      saveIdentity(S);
      syncControls();
      renderThumb();
      renderPresets();
    });
  }
  var show = $('thShowEvent');
  if (show) {
    show.addEventListener('change', function () {
      S.thShowEvent = show.checked;
      saveIdentity(S);
      renderThumb();
      renderPresets();
    });
  }
  var wm = $('thWatermark');
  if (wm) {
    wm.addEventListener('change', function () {
      S.thWatermark = wm.checked;
      saveIdentity(S);
    });
  }
  var evFile = $('thEventFile');
  if (evFile) {
    evFile.addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      readImage(f, function (data) {
        S.thEventLogo = data;
        saveIdentity(S);
        syncRallyUI();
        renderThumb();
        renderPresets();
      });
    });
  }
  var evReset = $('thEventReset');
  if (evReset) {
    evReset.addEventListener('click', function () {
      S.thEventLogo = '';
      saveIdentity(S);
      syncRallyUI();
      renderThumb();
      renderPresets();
    });
  }
  var tmFile = $('thTeamFile');
  if (tmFile) {
    tmFile.addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      readImage(f, function (data) {
        S.thTeamLogo = data;
        saveIdentity(S);
        syncRallyUI();
        renderThumb();
        renderPresets();
      });
    });
  }
  var tmReset = $('thTeamReset');
  if (tmReset) {
    tmReset.addEventListener('click', function () {
      S.thTeamLogo = '';
      saveIdentity(S);
      syncRallyUI();
      renderThumb();
      renderPresets();
    });
  }
  var unFile = $('thUniFile');
  if (unFile) {
    unFile.addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      readImage(f, function (data) {
        S.thUniLogo = data;
        saveIdentity(S);
        syncRallyUI();
        renderThumb();
        renderPresets();
      });
    });
  }
  var unReset = $('thUniReset');
  if (unReset) {
    unReset.addEventListener('click', function () {
      S.thUniLogo = '';
      saveIdentity(S);
      syncRallyUI();
      renderThumb();
      renderPresets();
    });
  }
}

function bind() {
  ['thTitleInput', 'thEm', 'thSub', 'thKickerInput', 'thRetoInput'].forEach(function (id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('input', function () { saveAll(); renderThumb(); renderPresets(); });
    el.addEventListener('change', function () { saveAll(); renderThumb(); renderPresets(); });
  });
  bindRally();
  $('exportPngThumb').addEventListener('click', function () { exportPNG('thumbPreview', 'thumbnail-youtube', 'statusThumb'); });
  $('exportPdfThumb').addEventListener('click', function () { exportPDF('thumbPreview', 'thumbnail-youtube', 'statusThumb'); });
  window.addEventListener('resize', fitAll);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(fitAll);
    if ($('thumbStage')) ro.observe($('thumbStage'));
  }
}

syncControls();
bind();
renderPresets();
renderThumb();

// brief.json -> identidad compartida (mismo cargador que el carrusel y el kit).
cargarBrief(S, function () { syncControls(); renderThumb(); renderPresets(); });
