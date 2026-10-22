// Modulo Impacto y Plan Pais: laminas ODS + plan nacional, animadas y grabables.
// Estado en la identidad compartida (S.impacto). Un compositor de primitivas
// (componerLamina) alimenta DOS pintores — DOM para editar y canvas para
// export/grabar — desde la misma fuente: cero drift visual.
"use strict";

var IMP = loadIdentity();

var IMP_TIPOS = ['mosaico', 'ficha', 'plan'];
var IMP_ANCHO = 1920;
var IMP_ALTO = 1080;
var IMP_SELECCION = null;   // ODS elegido para la lámina ficha (runtime)
var compositorListo = true; // flag de la tarea de composicion

// Programas articulables del plan nacional (rutura: chips checkbox).
var IMP_PROGRAMAS = [
  'Red de Ciudades Creativas',
  'Soberanía Alimentaria',
  'Ley 763 · Sándwich Nutritivo',
  'Bono Productivo Alimentario',
  'ENAPRECA'
];

function _escenario(el, prims) {
  if (!el) return;
  pintarDOM(el, prims);
}

// ---------- union brief + catálogo: que ODS van a la lamina ----------

function odsActivos(ident, briefOds) {
  var cat = (typeof ODS_DATA !== 'undefined') ? ODS_DATA : [];
  var guardados = (ident && ident.impacto && ident.impacto.odsOn) || {};
  var enBrief = [];
  (briefOds || []).forEach(function (t) {
    var n = odsOf(t);
    if (n && enBrief.indexOf(n) < 0) enBrief.push(n);
  });
  var salida = [];
  var vistos = {};
  enBrief.forEach(function (id) {
    if (!cat.some(function (o) { return o.id === id; })) return;
    salida.push({ id: id, on: guardados[id] !== false, brief: true });
    vistos[id] = true;
  });
  cat.forEach(function (o) {
    if (vistos[o.id]) return;
    salida.push({ id: o.id, on: guardados[o.id] === true, brief: false });
  });
  return salida;
}

function modoEfectivo(ident, brief) {
  var m = ident && ident.impacto && ident.impacto.plan && ident.impacto.plan.modo;
  if (m === 'nacional' || m === 'latam') return m;
  var rt = (ident && ident.rallyType) || (brief && brief.rally_type);
  return rt === 'latam' ? 'latam' : 'nacional';
}

// Tinta legible sobre un bloque de color: blanco si alcanza, si no el
// propio tono del bloque oscurecido (nunca gris neutro) hasta 4.5:1.
function tintaSobre(hexFondo) {
  if (contrastRatio('#FFFFFF', hexFondo) >= 4.5) return '#FFFFFF';
  for (var f = 0.85; f >= 0.05; f -= 0.05) {
    var c = darken(hexFondo, f);
    if (contrastRatio(c, hexFondo) >= 4.5) return c;
  }
  if (contrastRatio('#0D1B35', hexFondo) >= 4.5) return '#0D1B35';
  return '#000000';
}

// ---------- compositor: laminas como primitivas 1920x1080 ----------
// estado: {imp, pal, fonts, team, modo, brief}.

function _fontDe(estado, rol) {
  return (estado && estado.fonts && estado.fonts[rol]) || 'Barlow';
}

function _modosPlan(estado) {
  var plan = (estado.imp && estado.imp.plan) || {};
  return modoEfectivo({ impacto: { plan: { modo: plan.modo } }, rallyType: estado.modo }, estado.brief);
}

// Encabezado comun a las tres laminas: marca + titulo del modulo.
function _cabecera(estado, titulo, subTxt) {
  var prims = [];
  var tinta = estado.pal.ink;
  prims.push({ k: 'txt', x: 84, y: 64, text: 'RALLY STUDIO', font: _fontDe(estado, 'l'), size: 22, weight: 700, color: estado.pal.ac, letter: 3 });
  prims.push({ k: 'txt', x: 84, y: 104, text: titulo, font: _fontDe(estado, 't'), size: 54, weight: 900, color: tinta });
  prims.push({ k: 'txt', x: 84, y: 172, text: subTxt, font: _fontDe(estado, 'b'), size: 30, weight: 500, color: estado.pal.mu });
  prims.push({ k: 'txt', x: 1836, y: 104, text: (estado.team && estado.team.name) || '', font: _fontDe(estado, 'b'), size: 30, weight: 700, color: tinta, align: 'right' });
  return prims;
}

function _pie(estado, ancho) {
  var uni = (estado.team && [estado.team.university, estado.team.city].filter(Boolean).join(' · ')) || '';
  var prims = [];
  prims.push({ k: 'rect', x: 84, y: 984, w: 96, h: 4, color: estado.pal.ac });
  if (uni) prims.push({ k: 'txt', x: 84, y: 1000, text: uni, font: _fontDe(estado, 'b'), size: 24, weight: 500, color: estado.pal.mu });
  return prims;
}

// Preset demosaico: 'bloques' | 'bandas' | 'ficha' (grilla compacta).
// Modo limpio (imp.limpio): el video queda SOLO con el mosaico ODS — sin
// cabecera RALLY STUDIO, sin universidad ni pie; la zona crece y el grid respira.
function _laminMosaico(estado, odsSel) {
  var clean = !!estado.limpio;
  var prims = clean ? [] : _cabecera(estado, 'Impacto en ODS', 'Objetivos de Desarrollo Sostenible que atiende la solución');
  var n = odsSel.length;
  var preset = estado.imp.preset || 'bloques';
  if (!n) return prims;
  var cols = n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : n <= 12 ? 4 : 5;
  var aM = (estado.imp.anim && estado.imp.anim.mosaico) || {};
  if (aM.cols && aM.cols !== 'auto' && preset !== 'bandas') {
    cols = Math.max(1, Math.min(parseInt(aM.cols, 10) || 0, n));
  }
  var filas = Math.ceil(n / cols);
  var hueco = 22;
  if (preset === 'bandas') {
    cols = 1;
    filas = n;
    hueco = 14;
  }
  // Orden de entrada: se fija aqui para que canvas, DOM y video coincidan.
  var rango = {};
  _ordenMosaico(n, aM.orden || 'secuencial', preset === 'bandas' ? 1 : cols, filas)
    .forEach(function (pos, rank) { rango[pos] = rank; });
  // Zona de mosaico: campo suave (bg2) con esquinas; la cuadrícula se centra
  // dentro y el sobrante se reparte, nada de agujeros sin sentido.
  var zx = 84, zy = clean ? 64 : 228;
  var zw = IMP_ANCHO - 168, zh = (clean ? IMP_ALTO - 64 - 88 : IMP_ALTO - 228 - 104);
  prims.push({ k: 'rect', x: zx, y: zy, w: zw, h: zh, color: estado.pal.bg2 || '#F0F6FF', r: 24 });
  var pad = preset === 'bandas' ? 36 : 48;
  var gx = zx + pad, gy = zy + pad, gw = zw - pad * 2, gh = zh - pad * 2;
  var cw = (gw - hueco * (cols - 1)) / cols;
  var ch = (gh - hueco * (filas - 1)) / filas;
  odsSel.forEach(function (o, i) {
    var od = ODS_DATA[o.id - 1];
    if (!od) return;
    var col = i % cols, fil = Math.floor(i / cols);
    var x = gx + col * (cw + hueco);
    var y = gy + fil * (ch + hueco);
    var g = rango[i] !== undefined ? rango[i] : i;
    var esBanda = preset === 'bandas';
    // Emblema oficial: cuadrado del color, icono blanco grande y nombre
    // SIEMPRE blanco sobre una franja sombreada (legible en cualquier ODS).
    prims.push({ k: 'rect', x: x, y: y, w: cw, h: ch, color: od.color, r: 6, g: g });
    prims.push({ k: 'txt', x: x + 24, y: y + 18, text: od.code, font: _fontDe(estado, 'l'), size: 28, weight: 800, color: '#FFFFFF', g: g });
    if (esBanda) {
      var sB = Math.min(84, ch - 24);
      prims.push({ k: 'ico', x: x + 24, y: y + (ch - sB) / 2, s: sB, color: '#FFFFFF', path: od.icon, g: g });
      prims.push({ k: 'rect', x: x + cw * 0.22, y: y + ch - 86, w: cw * 0.78 - 24, h: 66, color: 'rgba(9,30,66,0.30)', r: 12, g: g });
      prims.push({ k: 'txt', x: x + cw * 0.22 + 20, y: y + ch - 78, text: od.name, font: _fontDe(estado, 'b'), size: 34, weight: 700, color: '#FFFFFF', g: g });
    } else {
      var sIco = Math.min(Math.round(cw * 0.34), Math.round(ch * 0.42), 150);
      prims.push({ k: 'ico', x: x + (cw - sIco) / 2, y: y + (ch - 96 - sIco) / 2 + 14, s: sIco, color: '#FFFFFF', path: od.icon, g: g });
      prims.push({ k: 'rect', x: x, y: y + ch - 96, w: cw, h: 96, color: 'rgba(9,30,66,0.30)', r: 0, g: g });
      prims.push({ k: 'txt', x: x + 24, y: y + ch - 78, text: od.name, font: _fontDe(estado, 'b'), size: 34, weight: 700, color: '#FFFFFF', g: g });
    }
  });
  return prims.concat(clean ? [] : _pie(estado, IMP_ANCHO));
}

// Ficha de UN ODS: bloque de color a la izquierda + meta y conexión.
// Modo limpio: sin cabecera de marca; el contenido sube a ocupar el alto.
function _laminaFicha(estado, odsSel) {
  var clean = !!estado.limpio;
  var o = odsSel[0];
  var od = o && ODS_DATA[o.id - 1];
  var prims = clean ? [] : _cabecera(estado, 'Ficha de impacto', 'Cómo la solución conecta con este ODS');
  if (!od) return prims;
  var dy = clean ? -136 : 0;
  var bx = 200, bw = 420, tam = 640;
  prims.push({ k: 'rect', x: bx, y: 300 + dy, w: bw, h: tam, color: od.color });
  // Emblema: icono y codigo SIEMPRE blancos sobre franja navy (como el mosaico),
  // nunca tinta navy sobre el color del ODS (se leia como negro).
  prims.push({ k: 'ico', x: bx + 40, y: 340 + dy, s: 84, color: '#FFFFFF', path: od.icon });
  prims.push({ k: 'rect', x: bx, y: 300 + dy + tam - 96, w: bw, h: 96, color: 'rgba(9,30,66,0.30)', r: 0 });
  prims.push({ k: 'txt', x: bx + 40, y: 300 + dy + tam - 78, text: od.code, font: _fontDe(estado, 'l'), size: 34, weight: 700, color: '#FFFFFF' });
  prims.push({ k: 'txt', x: 700, y: 320 + dy, text: od.name, font: _fontDe(estado, 't'), size: 72, weight: 900, color: estado.pal.ink });
  prims.push({ k: 'txt', x: 700, y: 430 + dy, text: od.shortTarget, font: _fontDe(estado, 'b'), size: 34, weight: 600, color: estado.pal.ac });
  var conecta = (estado.imp.textos['conecta' + o.id]) || 'La solución atiende esta meta directamente en el territorio, con pruebas y costo bajo.';
  prims.push({ k: 'txt', x: 700, y: 520 + dy, text: conecta, font: _fontDe(estado, 'b'), size: 30, weight: 400, color: estado.pal.ink });
  return prims;
}

// Lámina plan: banda superior PNDH (nacional) o agenda sostenible (latam).
// Modo limpio: sin pie de marca; la banda vuelve a empezar más arriba.
function _laminaPlan(estado, odsSel, modo) {
  var clean = !!estado.limpio;
  var prims = [];
  var nacional = modo !== 'latam';
  var bandaY = clean ? 64 : 96, bandaH = clean ? 190 : 150;
  var banda = nacional ? estado.pal.ink : estado.pal.ac;
  var tintaBanda = tintaSobre(banda);
  var titulo = nacional ? 'Plan Nacional de Lucha contra la Pobreza y para el Desarrollo Humano 2022–2026' : 'Agenda sostenible para América Latina';
  var planLi = (estado.imp && estado.imp.plan) || {};
  var eje = planLi.eje || (estado.brief && estado.brief.national_plan_axis) || (nacional ? '' : 'Ejes replicables en todo el territorio');
  prims.push({ k: 'rect', x: 84, y: bandaY, w: IMP_ANCHO - 168, h: bandaH, color: banda });
  prims.push({ k: 'txt', x: 124, y: bandaY + 30, text: titulo, font: _fontDe(estado, 't'), size: 42, weight: 900, color: tintaBanda });
  if (eje) {
    prims.push({ k: 'txt', x: 124, y: bandaY + 88, text: 'Eje: ' + eje, font: _fontDe(estado, 'b'), size: 26, weight: 500, color: tintaBanda });
  }
  var y = bandaY + bandaH + 60;
  var progs = (estado.imp.plan.programas || []).slice(0, 6);
  var cy = y;
  if (progs.length) {
    prims.push({ k: 'txt', x: 84, y: y, text: nacional ? 'Programas articulados' : 'Alineamientos de agenda', font: _fontDe(estado, 'b'), size: 26, weight: 700, color: estado.pal.ac });
    y += 52;
    var cx = 84;
    progs.forEach(function (p, i) {
      var woaprox = 12 + p.length * 11.4;
      var chipH = 52;
      if (cx + woaprox > IMP_ANCHO - 84) { cx = 84; cy += chipH + 18; }
      prims.push({ k: 'rect', x: cx, y: cy, w: woaprox, h: chipH, color: estado.pal.gl, r: 26 });
      prims.push({ k: 'txt', x: cx + 20, y: cy + 13, text: p, font: _fontDe(estado, 'b'), size: 22, weight: 600, color: estado.pal.ink });
      cx += woaprox + 18;
    });
    cy = Math.max(cy + 92, y + 92);
  }
  var muni = estado.imp.plan.municipio;
  if (muni) {
    prims.push({ k: 'txt', x: 84, y: cy, text: 'Anclaje territorial: ' + muni, font: _fontDe(estado, 'b'), size: 30, weight: 700, color: estado.pal.ink });
    cy += 56;
  }
  var cifra = estado.imp.plan.cifra;
  if (cifra) {
    prims.push({ k: 'txt', x: 84, y: cy + 8, text: cifra, font: _fontDe(estado, 'l'), size: 44, weight: 700, color: estado.pal.ac });
    cy += 72;
  }
  var texto = estado.imp.plan.texto;
  if (texto) {
    prims.push({ k: 'txt', x: 84, y: cy, text: texto, font: _fontDe(estado, 'b'), size: 24, weight: 400, color: estado.pal.mu });
  }
  prims = prims.concat(clean ? [] : _pie(estado));
  return prims;
}

function componerLamina(tipo, estado, odsSel) {
  var bandera = _modosPlan(estado);
  odsSel = (odsSel || []).filter(function (o) { return o.on !== false && ODS_DATA[o.id - 1]; });
  if (tipo === 'ficha') return _laminaFicha(estado, odsSel);
  if (tipo === 'plan') return _laminaPlan(estado, odsSel, bandera);
  return _laminMosaico(estado, odsSel);
}

// ---------- pintor DOM ----------

function pintarDOM(el, prims) {
  if (!el) return;
  el.innerHTML = '';
  (prims || []).forEach(function (p) {
    if (p.k === 'rect') {
      var d = document.createElement('div');
      d.className = 'p-rect';
      d.style.cssText = 'left:' + p.x + 'px;top:' + p.y + 'px;width:' + p.w + 'px;height:' + p.h + 'px;background:' + p.color + (p.r ? (';border-radius:' + p.r + 'px') : '');
      if (p.g !== undefined) d.dataset.g = p.g;
      el.appendChild(d);
    } else if (p.k === 'txt') {
      var s = document.createElement('p');
      s.className = 'p-txt';
      s.style.cssText = 'left:' + p.x + 'px;top:' + p.y + 'px;color:' + p.color +
        ';font:' + (p.weight || 400) + ' ' + p.size + 'px ' + p.font +
        (p.letter ? (';letter-spacing:' + p.letter + 'px') : '') +
        (p.align === 'right' ? (';left:auto;right:' + (IMP_ANCHO - p.x) + 'px') : '') +
        (p.align === 'center' ? (';transform:translateX(-50%)') : '') + ';text-align:' + (p.align || 'left') + ';';
      s.textContent = p.text;
      if (p.g !== undefined) s.dataset.g = p.g;
      el.appendChild(s);
    } else if (p.k === 'ico') {
      var g = document.createElement('div');
      g.className = 'p-ico';
      g.style.cssText = 'left:' + p.x + 'px;top:' + p.y + 'px;width:' + p.s + 'px;height:' + p.s + 'px;color:' + p.color + ';';
      g.innerHTML = '<svg viewBox="0 0 24 24" width="' + p.s + '" height="' + p.s + '" fill="currentColor" stroke="currentColor">' + p.path + '</svg>';
      if (p.g !== undefined) g.dataset.g = p.g;
      el.appendChild(g);
    }
  });
}

// ---------- pintor canvas ----------

function pintarCanvas(ctx, prims, escala) {
  ctx.save();
  ctx.scale(escala || 1, escala || 1);
  (prims || []).forEach(function (p) {
    var i;
    if (p.k === 'rect') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.r && ctx.roundRect) ctx.roundRect(p.x, p.y, p.w, p.h, p.r);
      else ctx.rect(p.x, p.y, p.w, p.h);
      ctx.fill();
    } else if (p.k === 'txt') {
      ctx.fillStyle = p.color;
      ctx.font = (p.weight || 400) + ' ' + p.size + 'px ' + p.font;
      if (p.letter !== undefined && 'letterSpacing' in ctx) ctx.letterSpacing = p.letter + 'px';
      else if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.textAlign = p.align === 'center' ? 'center' : (p.align === 'right' ? 'right' : 'left');
      ctx.textBaseline = 'top';
      ctx.fillText(p.text, p.x, p.y);
    } else if (p.k === 'ico') {
      var k_ico = (p.s || 24) / 24;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(k_ico, k_ico);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      var piezas = String(p.path || '').match(/<(path|circle)[^>]*>/g) || [];
      for (i = 0; i < piezas.length; i++) {
        var pieza = piezas[i];
        var dh = (pieza.match(/d="([^"]*)"/) || [])[1];
        var esLinea = /fill="none"/.test(pieza);
        var sw = (pieza.match(/stroke-width="([\d.]+)"/) || [])[1];
        var esCirculo = /<circle/.test(pieza);
        if (esCirculo) {
          var ccx = +((pieza.match(/cx="([-\d.]+)"/) || [])[1]);
          var ccy = +((pieza.match(/cy="([-\d.]+)"/) || [])[1]);
          var rr = +((pieza.match(/r="([\d.]+)"/) || [])[1]);
          ctx.beginPath();
          ctx.arc(ccx, ccy, rr, 0, Math.PI * 2);
          if (esLinea) { if (sw) ctx.lineWidth = +sw; ctx.stroke(); }
          else ctx.fill();
        } else if (dh && typeof Path2D !== 'undefined') {
          try {
            var pd = new Path2D(dh);
            if (esLinea) { if (sw) ctx.lineWidth = +sw; ctx.stroke(pd); }
            else ctx.fill(pd);
          } catch (e2) {}
        }
      }
      ctx.restore();
    }
  });
  ctx.restore();
}

// ---------- presets del modulo (editables via identidad y UI) ----------

var RALLY_IMPACTO_PRESETS = [
  { id: 'bloques', nombre: 'Bloques', tipo: 'mosaico' },
  { id: 'bandas', nombre: 'Bandas horizontales', tipo: 'mosaico' },
  { id: 'ficha', nombre: 'Ficha individual', tipo: 'ficha' }
];

// ---------- Task 5: timeline de animacion ----------

// Vocabulario cerrado: entrada fade|slide-izq|slide-arriba|wipe|banda,
// enfasis none|pulso|pop, salida none|fade|slide.
var IMP_ANIM_OPCIONES = {
  entrada: ['fade', 'slide-izq', 'slide-arriba', 'wipe', 'banda'],
  enfasis: ['none', 'pulso', 'pop'],
  salida: ['none', 'fade', 'slide']
};
var IMP_ANIM_CLASES = {
  'fade': 'impInFade', 'slide-izq': 'impInSlideIzq', 'slide-arriba': 'impInSlideArriba',
  'wipe': 'impInWipe', 'banda': 'impInBanda',
  'pulso': 'impEnfPulso', 'pop': 'impEnfPop',
  'salida-fade': 'impOutFade', 'salida-slide': 'impOutSlide'
};

// Tamaios de fase en segundos: entrada 20% (min 0.6), enfasis 30% (si != none),
// salida 20%, el resto hold. dur admitido: 3..10 s.
function tamanosFase(entrada, enfasis, salida, dur) {
  if (!(dur >= 3 && dur <= 10)) throw new RangeError('dur fuera de 3-10');
  var tIn = Math.max(0.6, dur * 0.2);
  var tEn = (enfasis && enfasis !== 'none') ? dur * 0.3 : 0;
  var tOut = (salida && salida !== 'none') ? dur * 0.2 : 0;
  return { tIn: tIn, tEn: tEn, tOut: tOut, dur: dur, entrada: entrada, enfasis: enfasis, salida: salida };
}

function faseEn(t, fases) {
  var d = fases.dur;
  if (t >= d) return 'fin';
  if (t < fases.tIn) return 'in';
  if (fases.tEn && t < fases.tIn + fases.tEn) return 'enf';
  if (fases.tOut && t >= d - fases.tOut) return 'out';
  return 'hold';
}

// ---------- reproductor DOM ----------

// Escala exacta del escenario al ancho disponible (la del CSS es respaldo).
function _escalarEscenario() {
  var stage = document.querySelector('.thumb-stage');
  var el = document.getElementById('laminaImp');
  if (!stage || !el) return;
  var k = stage.clientWidth / IMP_ANCHO;
  el.style.setProperty('--k', k);
}

var _impTimers = [];

function _impSetAnim(hijos, clase, t) {
  if (!clase) return;
  hijos.forEach(function (h) {
    h.style.animation = ''; void h.offsetWidth;
    h.style.animation = clase + ' ' + t + 's cubic-bezier(.33,1,.68,1) both';
  });
}

function reproducirAnimacion(tipo) {
  var a = (IMP.impacto.anim && IMP.impacto.anim[tipo]) || {};
  var dur = a.dur || IMP.impacto.dur || 5;
  var fases = tamanosFase(a.entrada || 'fade', a.enfasis || 'none', a.salida || 'none', dur);
  var el = document.getElementById('laminaImp');
  if (!el) return fases;
  var hijos = Array.prototype.slice.call(el.children);
  var base = [], tiles = {};
  hijos.forEach(function (h) {
    if (h.dataset && h.dataset.g !== undefined) {
      var gi = +h.dataset.g;
      (tiles[gi] = tiles[gi] || []).push(h);
    } else base.push(h);
  });
  var listaTiles = Object.keys(tiles).map(Number).sort(function (a, b) { return a - b; }).map(function (k) { return tiles[k]; });
  var estado = document.getElementById('statusRepro');
  _impClearTimers();
  if (estado) estado.textContent = 'Reproduciendo (' + dur + ' s)…';
  // Base (cabecera, fondo, pie): la entrada elegida, como siempre.
  _impSetAnim(base, IMP_ANIM_CLASES[a.entrada || 'fade'], fases.tIn);
  // Cuadritos: uno por uno, lento, con el movimiento y ritmo elegidos.
  var aM = (IMP.impacto.anim && IMP.impacto.anim.mosaico) || {};
  var ritmo = IMP_RITMO_TILE[aM.ritmo || 'normal'] || 1;
  var plan = IMP_TILES_PLAN(Math.max(1, listaTiles.length), fases.dur, ritmo);
  var paso = plan.paso;
  var CLASES_TILE = ['impInPop', 'impInSlideArriba', 'impInSlideIzq', 'impInFade', 'impInWipe'];
  listaTiles.forEach(function (grupo, idx) {
    var tipo = IMP_TILE_TIPO(idx, aM.tiles || 'ciclo');
    var clase = IMP_CLASES_TILE[tipo];
    var t0 = idx * paso;
    grupo.forEach(function (h) {
      h.style.animation = '';
      void h.offsetWidth;
      h.style.animation = clase + ' ' + plan.tDur + 's cubic-bezier(.33,1,.68,1) ' + t0.toFixed(2) + 's both';
    });
  });
  if (fases.tEn && !listaTiles.length) {
    _impTimers.push(setTimeout(function () {
      _impSetAnim(base, IMP_ANIM_CLASES[a.enfasis || 'none'], fases.tEn);
    }, fases.tIn * 1000));
  }
  if (fases.tOut) {
    _impTimers.push(setTimeout(function () {
      _impSetAnim(hijos, IMP_ANIM_CLASES['salida-' + (a.salida || 'fade')], fases.tOut);
    }, (fases.dur - fases.tOut) * 1000));
  }
  _impTimers.push(setTimeout(function () {
    hijos.forEach(function (h) { h.style.animation = ''; });
    if (estado) estado.textContent = 'Reproducido. La lamina queda en su frame final.';
  }, fases.dur * 1000 + 120));
  return fases;
}

function _impClearTimers() {
  _impTimers.forEach(clearTimeout);
  _impTimers = [];
}

// ---------- guardado y cableado de UI ----------

function _guardar() { saveIdentity(IMP); }

function _estadoLamina() {
  return {
    imp: IMP.impacto, pal: IMP.pal, fonts: IMP.fonts, team: IMP.team,
    modo: IMP.rallyType || '', brief: IMP._brief || {},
    limpio: !!IMP.impacto.limpio
  };
}

function _odsSelPara(tipo) {
  var activos = odsActivos(IMP, (IMP._brief && IMP._brief.ods_ids) || []);
  if (tipo === 'plan') return activos.filter(function (o) { return o.on; });
  if (tipo === 'ficha') {
    var sel = IMP_SELECCION;
    var encendido = activos.filter(function (o) { return o.on && o.id === sel; });
    if (encendido.length) return [{ id: sel, on: true }];
    var on = activos.filter(function (o) { return o.on; });
    return on.length ? [on[0]] : [];
  }
  return activos.filter(function (o) { return o.on; });
}

function pintar() {
  var tipo = IMP_IDENT_TIPO();
  var el = document.getElementById('laminaImp');
  if (el) _escenario(el, componerLamina(tipo, _estadoLamina(), _odsSelPara(tipo)));
  var w = document.getElementById('fichaOdsWrap');
  if (w) w.style.display = tipo === 'ficha' ? '' : 'none';
}

var IMP_IDENT_TIPO = function () {
  var s = document.getElementById('laminaSel');
  return s ? s.value : 'mosaico';
};

// Chips ODS del brief + override manual (persistente).
function renderChips() {
  var wrap = document.getElementById('chipsOds');
  if (!wrap) return;
  var activos = odsActivos(IMP, (IMP._brief && IMP._brief.ods_ids) || []);
  wrap.innerHTML = '';
  activos.forEach(function (o) {
    var od = ODS_DATA[o.id - 1];
    var l = document.createElement('label');
    l.className = 'check odsrow';
    var c = document.createElement('input');
    c.type = 'checkbox';
    c.checked = !!o.on;
    c.addEventListener('change', function () {
      IMP.impacto.odsOn[o.id] = c.checked;
      _guardar();
      renderChips();
      pintar();
    });
    // Emblema real del ODS: color oficial + arte del icono en blanco + número.
    var sw = document.createElement('span');
    sw.className = 'chip-ods';
    sw.style.background = od.color;
    sw.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" aria-hidden="true">' + od.icon + '</svg>' +
      '<i class="num">' + o.id + '</i>';
    var nm = document.createElement('span');
    nm.className = 'odsname';
    nm.textContent = od.code + ' · ' + od.name;
    l.appendChild(c);
    l.appendChild(sw);
    l.appendChild(nm);
    wrap.appendChild(l);
  });
}

function renderFichaOds() {
  var s = document.getElementById('fichaOds');
  if (!s) return;
  s.innerHTML = '';
  var activos = odsActivos(IMP, (IMP._brief && IMP._brief.ods_ids) || []).filter(function (o) { return o.on; });
  if (!IMP_SELECCION && activos.length) IMP_SELECCION = activos[0].id;
  activos.forEach(function (o) {
    var od = ODS_DATA[o.id - 1];
    var op = document.createElement('option');
    op.value = o.id;
    op.textContent = od.code + ' · ' + od.name;
    s.appendChild(op);
  });
  if (IMP_SELECCION) s.value = String(IMP_SELECCION);
  s.addEventListener('change', function () {
    IMP_SELECCION = +s.value;
    pintar();
    _narCargarFicha();
  });
}

// Plan País: modo, programas, municipio, cifra, texto.
function wirePlan() {
  var p = IMP.impacto.plan;
  var sel = document.getElementById('planModo');
  if (sel) {
    sel.value = p.modo || '';
    sel.addEventListener('change', function () { p.modo = sel.value; _guardar(); dibujarChipsProgramas(); pintar(); });
  }
  ['planMuni', 'planEje', 'planCifra', 'planTexto'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var campo = { planMuni: 'municipio', planEje: 'eje', planCifra: 'cifra', planTexto: 'texto' }[id];
    el.value = p[campo] || '';
    el.addEventListener('input', function () { p[campo] = el.value; _guardar(); if (IMP_IDENT_TIPO() === 'plan') pintar(); });
  });
  dibujarChipsProgramas();
}

function dibujarChipsProgramas() {
  var wrap = document.getElementById('planProg');
  if (!wrap) return;
  var p = IMP.impacto.plan;
  var esLatam = modoEfectivo(IMP, IMP._brief) === 'latam';
  wrap.innerHTML = '';
  if (esLatam) {
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = 'Alineamientos de agenda separados por coma';
    inp.value = (p.programas || []).join(', ');
    inp.addEventListener('input', function () {
      p.programas = inp.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      _guardar();
      if (IMP_IDENT_TIPO() === 'plan') pintar();
    });
    wrap.className = '';
    wrap.appendChild(inp);
    return;
  }
  wrap.className = 'chip-row';
  IMP_PROGRAMAS.forEach(function (nombre) {
    var l = document.createElement('label');
    l.className = 'check';
    var c = document.createElement('input');
    c.type = 'checkbox';
    c.checked = (p.programas || []).indexOf(nombre) >= 0;
    c.addEventListener('change', function () {
      var arr = (p.programas || []).slice();
      var i = arr.indexOf(nombre);
      if (c.checked && i < 0) arr.push(nombre);
      if (!c.checked && i >= 0) arr.splice(i, 1);
      p.programas = arr;
      _guardar();
      pintar();
    });
    l.appendChild(c);
    l.appendChild(document.createTextNode(nombre));
    wrap.appendChild(l);
  });
}

// Animación: selects por tipo + dur por tipo (override del dur global).
var IMP_TIPO_ETIQUETA = { mosaico: 'ODS (mosaico)', ficha: 'Ficha de un ODS', plan: 'Plan País (PNLCP)' };

function renderAnimBody() {
  var body = document.getElementById('animBody');
  if (!body) return;
  body.innerHTML = '';
  var tipo = IMP_IDENT_TIPO();
  IMP.impacto.limpio = !!IMP.impacto.limpio;
  var a = (IMP.impacto.anim[tipo] = IMP.impacto.anim[tipo] || impactoPorDefecto().anim[tipo]);
  // Video limpio: la lámina exportada/grabada se dibuja sin marca ni pie.
  var cajaLimpio = document.createElement('div');
  cajaLimpio.className = 'field';
  var chk = document.createElement('label');
  chk.className = 'check';
  var inp = document.createElement('input');
  inp.type = 'checkbox';
  inp.id = 'chkLimpio';
  inp.checked = !!IMP.impacto.limpio;
  inp.addEventListener('change', function () {
    IMP.impacto.limpio = inp.checked;
    _guardar();
    pintar();
  });
  chk.appendChild(inp);
  chk.appendChild(document.createTextNode(' Video limpio: sin marca Rally Studio ni pie (solo ODS y plan)'));
  cajaLimpio.appendChild(chk);
  body.appendChild(cajaLimpio);
  // Duración SOLO del tipo activo (panel compacto; los otros tipos
  // aparecen al cambiar de lámina en el tapiz).
  var cajaDur = document.createElement('div');
  cajaDur.className = 'field';
  cajaDur.innerHTML = '<label class="mini">Duración de ' + (IMP_TIPO_ETIQUETA[tipo] || tipo) + ' (segundos)</label>';
  var dur = document.createElement('input');
  dur.type = 'number';
  dur.min = 3; dur.max = 10; dur.step = 0.5;
  dur.value = a.dur || IMP.impacto.dur || 5;
  dur.addEventListener('change', function () {
    var v = Math.min(10, Math.max(3, parseFloat(dur.value) || 5));
    dur.value = v;
    a.dur = v;
    _guardar();
  });
  cajaDur.appendChild(dur);
  body.appendChild(cajaDur);
  // Mosaico: coreografía en chips visuales ANTES de los avanzados.
  if (tipo === 'mosaico') {
    body.appendChild(_coreografiaMosaico(a));
  }
  // Avanzados plegados: entrada/énfasis/salida (menos técnica, fuera de golpe de vista).
  var avz = document.createElement('details');
  avz.className = 'avz';
  avz.innerHTML = '<summary>Ajustes avanzados de animación (entrada, énfasis, salida)</summary>';
  var grid = document.createElement('div');
  grid.className = 'grid g2';
  [['entrada', 'Entrada'], ['enfasis', 'Énfasis'], ['salida', 'Salida']].forEach(function (par) {
    var campo = par[0], etiqueta = par[1];
    var caja = document.createElement('div');
    caja.innerHTML = '<label class="mini">' + etiqueta + '</label>';
    var s = document.createElement('select');
    IMP_ANIM_OPCIONES[campo].forEach(function (op) {
      var o = document.createElement('option');
      o.value = op;
      o.textContent = op;
      s.appendChild(o);
    });
    s.value = a[campo] || 'none';
    s.addEventListener('change', function () {
      a[campo] = s.value;
      _guardar();
    });
    caja.appendChild(s);
    grid.appendChild(caja);
  });
  avz.appendChild(grid);
  body.appendChild(avz);
  var btn = document.createElement('button');
  btn.className = 'sec';
  btn.textContent = 'Ver animación de esta lámina';
  btn.addEventListener('click', function () { reproducirAnimacion(IMP_IDENT_TIPO()); });
  body.appendChild(btn);
}

// Coreografía de los cuadritos (solo mosaico): chips con mini-preview animado
// (cada demo repite el movimiento real) en lugar de selects técnicos.
function _coreografiaMosaico(a) {
  var DEF = { orden: 'secuencial', ritmo: 'normal', cols: 'auto', tiles: 'ciclo' };
  var caja = document.createElement('div');
  caja.className = 'coreo';
  caja.innerHTML = '<label class="mini lbl-mov">Movimiento de los cuadritos</label>';
  function fila(clave, opciones) {
    var f = document.createElement('div');
    f.className = 'fila-chips';
    var val = a[clave] || DEF[clave];
    opciones.forEach(function (op) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tilechip' + (op.val === val ? ' on' : '');
      var demo = '';
      if (op.demo) demo = '<span class="c-demo" data-a="' + op.demo + '" aria-hidden="true"></span>';
      else if (op.dots) demo = '<span class="dotgrid" aria-hidden="true">' + _mosaicoDot(op.dots) + '</span>';
      b.innerHTML = demo + '<span>' + op.txt + '</span>';
      b.addEventListener('click', function () {
        a[clave] = op.val;
        _guardar();
        if (clave === 'orden' || clave === 'cols') pintar(); // cambian la composición
        Array.prototype.forEach.call(f.children, function (c) { c.classList.toggle('on', c === b); });
      });
      f.appendChild(b);
    });
    return f;
  }
  caja.appendChild(fila('tiles', [
    { val: 'ciclo', txt: 'Ciclo', demo: 'ciclo' },
    { val: 'solo-pop', txt: 'Pop', demo: 'pop' },
    { val: 'solo-arriba', txt: 'Desde abajo', demo: 'arriba' },
    { val: 'solo-izq', txt: 'Desde la izquierda', demo: 'izq' },
    { val: 'solo-fade', txt: 'Desvanecer', demo: 'fade' },
    { val: 'solo-wipe', txt: 'Cortina', demo: 'wipe' },
    { val: 'aleatorio', txt: 'Al azar', demo: 'aleatorio' }
  ]));
  caja.appendChild(fila('ritmo', [
    { val: 'rapido', txt: 'Rápido' }, { val: 'normal', txt: 'Normal' }, { val: 'lento', txt: 'Lento' }
  ]));
  caja.appendChild(fila('orden', [
    { val: 'secuencial', txt: 'Uno tras otro', dots: [0] },
    { val: 'centro-fuera', txt: 'Del centro afuera', dots: [1] },
    { val: 'aleatorio', txt: 'Al azar', dots: [2, 4] }
  ]));
  caja.appendChild(fila('cols', [
    { val: 'auto', txt: 'Auto' }, { val: '2', txt: 'En 2' }, { val: '3', txt: 'En 3' }, { val: '4', txt: 'En 4' }
  ]));
  return caja;
}

// Mini-grilla 3x2 de puntos: el primero que entra brilla en acento.
function _mosaicoDot(activos) {
  var s = '<svg width="28" height="21" viewBox="0 0 28 21">';
  for (var i = 0; i < 6; i++) {
    var x = 5 + (i % 3) * 9, y = 5 + Math.floor(i / 3) * 9;
    var on = activos.indexOf(i) >= 0;
    s += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + (on ? '#0866F5' : '#CBD5E1') + '"/>';
  }
  return s + '</svg>';
}

// Tipo de lamina como TARJETAS con mini-vista (nada de lista): el select
// #laminaSel sigue existiendo (oculto, accesible por teclado via tarjetas)
// y las tarjetas lo gobiernan con change sintetico.
function _thumbLamina(tipo) {
  if (tipo === 'ficha') {
    return '<svg viewBox="0 0 96 64">' +
      '<rect x="8" y="8" width="34" height="48" rx="4" fill="' + (ODS_DATA[0] ? ODS_DATA[0].color : '#E5243B') + '"/>' +
      '<rect x="10" y="44" width="30" height="10" rx="3" fill="rgba(9,30,66,0.30)"/>' +
      '<rect x="50" y="12" width="38" height="9" rx="3" fill="#0D1B35"/>' +
      '<rect x="50" y="28" width="30" height="6" rx="3" fill="#0866F5"/>' +
      '<rect x="50" y="40" width="36" height="5" rx="2.5" fill="#5C7193"/>' +
      '<rect x="50" y="50" width="28" height="5" rx="2.5" fill="#DCE7F5"/></svg>';
  }
  if (tipo === 'plan') {
    return '<svg viewBox="0 0 96 64">' +
      '<rect x="6" y="8" width="84" height="20" rx="4" fill="#0D1B35"/>' +
      '<rect x="12" y="14" width="52" height="7" rx="3" fill="#FFFFFF"/>' +
      '<rect x="10" y="36" width="22" height="11" rx="4" fill="#DCE7F5"/>' +
      '<rect x="36" y="36" width="22" height="11" rx="4" fill="#DCE7F5"/>' +
      '<rect x="62" y="36" width="22" height="11" rx="4" fill="#DCE7F5"/>' +
      '<rect x="10" y="53" width="44" height="5" rx="2.5" fill="#0866F5"/></svg>';
  }
  var c = [1, 2, 3, 4, 5, 6].map(function (i) { return (ODS_DATA[i - 1] || {}).color || '#0866F5'; });
  var s = '<svg viewBox="0 0 96 64"><rect x="4" y="4" width="88" height="56" rx="6" fill="#F0F6FF"/>';
  [0, 1, 2].forEach(function (k) {
    s += '<rect x="' + (10 + k * 27) + '" y="10" width="23" height="20" rx="3" fill="' + c[k] + '"/>';
    s += '<rect x="' + (10 + k * 27) + '" y="34" width="23" height="20" rx="3" fill="' + c[k + 3] + '"/>';
  });
  return s + '</svg>';
}

function renderLaminaTapiz() {
  var sel = document.getElementById('laminaSel');
  var wrap = document.getElementById('laminaTapiz');
  if (!sel || !wrap) return;
  wrap.innerHTML = '';
  IMP_TIPOS.forEach(function (tipo) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'lamina-card' + (sel.value === tipo ? ' on' : '');
    card.innerHTML = _thumbLamina(tipo);
    var nm = document.createElement('span');
    nm.className = 'lamina-name';
    nm.textContent = IMP_TIPO_ETIQUETA[tipo] || tipo;
    card.appendChild(nm);
    card.addEventListener('click', function () {
      if (sel.value !== tipo) {
        sel.value = tipo;
        sel.dispatchEvent(new Event('change'));
      }
      Array.prototype.forEach.call(wrap.children, function (c) { c.classList.toggle('on', c === card); });
    });
    wrap.appendChild(card);
  });
}

function arranqueImpacto() {
  _escalarEscenario();
  window.addEventListener('resize', _escalarEscenario);
  var sel = document.getElementById('laminaSel');
  if (sel) sel.addEventListener('change', function () { pintar(); renderAnimBody(); });
  renderLaminaTapiz();
  var archivo = document.getElementById('archivo');
  if (archivo && !archivo.value) archivo.value = _prefijoArchivo();
  var btnExport = document.getElementById('exportPng');
  if (btnExport) btnExport.addEventListener('click', function () { exportarPNG(IMP_IDENT_TIPO()); });
  var btnVer = document.getElementById('verAnim');
  if (btnVer) btnVer.addEventListener('click', function () { reproducirAnimacion(IMP_IDENT_TIPO()); });
  var btnGrabar = document.getElementById('grabar');
  if (btnGrabar) btnGrabar.addEventListener('click', function () { _grabarActual(); });
  cargarBrief(IMP, function (ok, b) {
    if (b) { IMP._brief = b; aplicarBrief(b, IMP); }
    renderChips();
    renderFichaOds();
    wirePlan();
    renderAnimBody();
    renderNar();
    pintar();
  });
  pintar();
}

function _prefijoArchivo() {
  var n = (IMP.team && IMP.team.name) || '';
  return String(n).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12);
}

function _archivoDetalle(ext, tipo) {
  var inp = document.getElementById('archivo');
  var det = ((inp && inp.value) || '').replace(/[\\/:*?"<>|]+/g, '').trim() || tipo;
  return 'clip_' + det + '.' + ext;
}

// ---------- Task 6: export PNG (frame final, escala 2) ----------

function _descargar(blob, nombre) {
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
}

function exportarPNG(tipo) {
  var estado = _estadoLamina();
  var prims = componerLamina(tipo, estado, _odsSelPara(tipo));
  var cv = document.createElement('canvas');
  cv.width = IMP_ANCHO * 2;
  cv.height = IMP_ALTO * 2;
  var ctx = cv.getContext('2d');
  ctx.fillStyle = (estado.pal && estado.pal.bg) || '#FFFFFF';
  ctx.fillRect(0, 0, cv.width, cv.height);
  pintarCanvas(ctx, prims, 2);
  var st = document.getElementById('statusExport');
  if (st) st.textContent = 'Renderizando PNG…';
  cv.toBlob(function (blob) {
    if (!blob) { if (st) st.textContent = 'El navegador rechazó el PNG (blob vacío).'; return; }
    _descargar(blob, _archivoDetalle('png', tipo));
    if (st) st.textContent = 'PNG exportado a 3840×2160.';
  }, 'image/png');
}

// ---------- Task 7: grabar clip (WebM + audio opcional, fallback ZIP) ----------

function planificarGrabacion(segundos, hayRecorder) {
  if (!(segundos >= 3 && segundos <= 10)) throw new RangeError('dur fuera de 3-10');
  return hayRecorder
    ? { modo: 'webm', fps: 24 }
    : { modo: 'png', fps: 24, frames: Math.round(24 * segundos) };
}

// Pinta el cuadro en tiempo t con los efectos de la animacion (canvas).
// Entradas escalonadas por cuadrito: ciclan 5 movimientos y arrancan uno
// tras otro (lento, ~1.1 s por ficha); la salida es un desvanecido común.
var IMP_ENTRADAS_TILE = ['pop', 'arriba', 'izq', 'fade', 'wipe'];
var IMP_RITMO_TILE = { rapido: 0.75, normal: 1, lento: 1.35 };
var IMP_CLASES_TILE = { pop: 'impInPop', arriba: 'impInSlideArriba', izq: 'impInSlideIzq', fade: 'impInFade', wipe: 'impInWipe' };

// ¿Que movimiento hace el cuadro de rango gIdx?: ciclo, uno fijo ('solo-pop')
// o pseudo-aleatorio estable por rango (canvas, DOM y video ven lo mismo).
function IMP_TILE_TIPO(gIdx, tiles) {
  if (tiles === 'aleatorio') return IMP_ENTRADAS_TILE[(gIdx * 7 + 3) % IMP_ENTRADAS_TILE.length];
  if (tiles && String(tiles).indexOf('solo-') === 0) {
    var fijo = IMP_ENTRADAS_TILE.indexOf(String(tiles).slice(5));
    return fijo >= 0 ? IMP_ENTRADAS_TILE[fijo] : 'pop';
  }
  return IMP_ENTRADAS_TILE[gIdx % IMP_ENTRADAS_TILE.length]; // ciclo
}

// Agenda del escalonado: duración de cada entrada y paso entre arranques.
// El ritmo escala AMBOS (lento = entra menos cuadros por segundo).
function IMP_TILES_PLAN(n, dur, ritmo) {
  var tDur = 1.1 * ritmo;
  var paso = Math.max(0.42 * ritmo, (dur - 1.6 - tDur) / Math.max(1, n));
  return { tDur: tDur, paso: paso };
}

// Orden de entrada del mosaico (se fija al componer la lamina, así el canvas,
// el DOM y el video grabado siempre coinciden): secuencial, centro-fuera o
// barajado aleatorio (se recalcula en cada recomposición).
function _ordenMosaico(n, orden, cols, filas) {
  var ids = [], i, j, k, tmp;
  for (i = 0; i < n; i++) ids.push(i);
  if (orden === 'aleatorio') {
    for (j = n - 1; j > 0; j--) {
      k = Math.floor(Math.random() * (j + 1));
      tmp = ids[j]; ids[j] = ids[k]; ids[k] = tmp;
    }
    return ids;
  }
  if (orden === 'centro-fuera') {
    var cc = (cols - 1) / 2, cf = (filas - 1) / 2;
    ids.sort(function (a, b) {
      var da = Math.abs((a % cols) - cc) + Math.abs(Math.floor(a / cols) - cf);
      var db = Math.abs((b % cols) - cc) + Math.abs(Math.floor(b / cols) - cf);
      return da - db || a - b;
    });
    return ids;
  }
  return ids; // secuencial
}

function _easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }
function _easeOutBack(p) {
  var c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
}

function _bboxDe(grupo) {
  var b = { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity };
  grupo.forEach(function (p) {
    b.x = Math.min(b.x, p.x);
    b.y = Math.min(b.y, p.y);
    b.x2 = Math.max(b.x2, p.x + (p.w || p.s || 40));
    b.y2 = Math.max(b.y2, p.y + (p.h || p.s || 60));
  });
  b.w = b.x2 - b.x;
  b.h = b.y2 - b.y;
  return b;
}

function _pintarCuadro(ctx, prims, t, fases, estado) {
  var W = IMP_ANCHO, H = IMP_ALTO;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = (estado.pal && estado.pal.bg) || '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  var fase = faseEn(t, fases);
  // Salida comun: desvanecido de TODO (y desplazo si la salida lo pide).
  var alphaOut = 1, deslOut = 0;
  if (fase === 'out') {
    var po = fases.tOut ? Math.min(1, (t - (fases.dur - fases.tOut)) / fases.tOut) : 0;
    alphaOut = 1 - po;
    if (fases.salida === 'slide') deslOut = po * 40;
  }
  // Separar base (cabecera/fondo/pie) de los cuadritos del mosaico (con g).
  var base = [], grupos = [];
  prims.forEach(function (p) {
    if (p.g === undefined) { base.push(p); return; }
    (grupos[p.g] = grupos[p.g] || []).push(p);
  });
  var hay = grupos.filter(Boolean);
  ctx.save();
  if (deslOut) ctx.translate(deslOut, 0);
  ctx.globalAlpha = alphaOut;
  if (fase === 'in') {
    var p = fases.tIn ? Math.min(1, t / fases.tIn) : 1;
    var eIn = 1 - Math.pow(1 - p, 3);
    var ent = fases.entrada;
    if (ent === 'slide-izq') ctx.translate((1 - eIn) * -48, 0);
    else if (ent === 'slide-arriba') ctx.translate(0, (1 - eIn) * 32);
    else if (ent === 'wipe') { ctx.beginPath(); ctx.rect(0, 0, eIn * W, H); ctx.clip(); }
    else if (ent === 'banda') { ctx.beginPath(); ctx.rect(0, 0, W, eIn * H); ctx.clip(); }
    else ctx.globalAlpha = alphaOut * eIn; // fade
  }
  // La enfasis (pulso/pop) sigue siendo global y solo toca a la base:
  // los cuadritos ya tienen su propia coreografía.
  if (fase === 'enf' && !hay.length) {
    var pe = fases.tEn ? (t - fases.tIn) / fases.tEn : 0;
    var s = 1 + 0.035 * Math.sin(pe * Math.PI);
    ctx.translate(W / 2, H / 2);
    ctx.scale(s, s);
    ctx.translate(-W / 2, -H / 2);
  }
  pintarCanvas(ctx, base, 1);
  ctx.restore();
  if (!hay.length) return;

  // Uno a la vez: cada cuadro arranca en t0 = indice * paso y tarda tDur en
  // instalarse; el ritmo (rapido/normal/lento) escala paso y duración juntos.
  var aM = (estado.imp && estado.imp.anim && estado.imp.anim.mosaico) || {};
  var ritmo = IMP_RITMO_TILE[aM.ritmo || 'normal'] || 1;
  var plan = IMP_TILES_PLAN(hay.length, fases.dur, ritmo);
  var paso = plan.paso;
  hay.forEach(function (grupo, idx) {
    var b = _bboxDe(grupo);
    var t0 = idx * paso;
    if (t < t0) return; // todavia no le toca
    var p = Math.min(1, (t - t0) / plan.tDur);
    var e = _easeOutCubic(p);
    var tipo = IMP_TILE_TIPO(idx, aM.tiles || 'ciclo');
    ctx.save();
    ctx.globalAlpha = alphaOut;
    if (deslOut) ctx.translate(deslOut, 0);
    var relay = fase === 'in' || fase === 'enf' || fase === 'hold' || fase === 'fin';
    if (relay) {
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      if (tipo === 'pop') {
        var sB = 0.6 + 0.4 * _easeOutBack(Math.max(0, (p - 0.05) * 1.05));
        ctx.scale(sB, sB);
      } else if (tipo === 'arriba') {
        ctx.translate(0, (1 - e) * 110);
      } else if (tipo === 'izq') {
        ctx.translate((1 - e) * -170, 0);
      }
      if (tipo === 'fade' || tipo === 'arriba' || tipo === 'izq') ctx.globalAlpha = alphaOut * e;
      ctx.translate(-b.x - b.w / 2, -b.y - b.h / 2);
      if (tipo === 'wipe') {
        var ew = _easeOutCubic(Math.min(1, p / 0.8));
        ctx.beginPath();
        ctx.rect(b.x, b.y, Math.max(1, ew * b.w), b.h);
        ctx.clip();
      }
    } else if (fase === 'out') {
      // En salida los cuadritos ya estan: solo el desvanecido comun.
      if (alphaOut < 1) ctx.globalAlpha = alphaOut;
    }
    pintarCanvas(ctx, grupo, 1);
    ctx.restore();
  });
}

function _pintarCuenta(ctx, estado, n) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = (estado.pal && estado.pal.bg) || '#FFFFFF';
  ctx.fillRect(0, 0, IMP_ANCHO, IMP_ALTO);
  var tinta = (estado.pal && estado.pal.ink) || '#0D1B35';
  ctx.fillStyle = tinta;
  ctx.font = '900 340px ' + ((estado.fonts && estado.fonts.t) || 'Barlow');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), IMP_ANCHO / 2, IMP_ALTO / 2);
}

function grabarClip(tipo, segundos, streamAudio) {
  return new Promise(function (resolve, reject) {
    var st = document.getElementById('statusExport');
    var estado = _estadoLamina();
    var prims = componerLamina(tipo, estado, _odsSelPara(tipo));
    var an = (IMP.impacto.anim && IMP.impacto.anim[tipo]) || {};
    var fases = tamanosFase(an.entrada || 'fade', an.enfasis || 'none', an.salida || 'none', segundos);
    var cv = document.createElement('canvas');
    cv.width = IMP_ANCHO;
    cv.height = IMP_ALTO;
    var ctx = cv.getContext('2d');
    function aviso(txt) { if (st) st.textContent = txt; }

    // Fallback: captura frame por frame a 24 fps y empaqueta en ZIP (o PNG suelto).
    // Cada frame se captura con toBlob (asíncrono, sin base64) y con avance visible.
    function fallarAPNG(origen) {
      aviso('La grabación WebM falló (' + (origen && origen.message ? origen.message : 'error') + '); secuencia a PNG…');
      var plan = planificarGrabacion(segundos, false);
      var blobs = [];
      var i = 0;
      function siguiente() {
        if (i >= plan.frames) return empaquetar();
        try {
          _pintarCuadro(ctx, prims, i / plan.fps, fases, estado);
        } catch (e1) { reject(e1); return; }
        cv.toBlob(function (b) {
          if (!b) { reject(new Error('El navegador no pudo capturar el frame ' + i + ' a PNG.')); return; }
          blobs.push(b);
          i++;
          if (i % 12 === 0) aviso('Capturando secuencia PNG… ' + i + ' / ' + plan.frames + ' frames');
          siguiente();
        }, 'image/png');
      }
      function empaquetar() {
        if (typeof JSZip === 'undefined') {
          aviso('Sin JSZip: se baja el frame final como PNG.');
          _pintarCuadro(ctx, prims, fases.dur, fases, estado);
          cv.toBlob(function (blob) {
            if (blob) _descargar(blob, _archivoDetalle('png', tipo));
            resolve({ png: true });
          }, 'image/png');
          return;
        }
        var zip = new JSZip();
        var carpeta = zip.folder('frames');
        blobs.forEach(function (b, k) { carpeta.file('f' + String(k).padStart(4, '0') + '.png', b); });
        zip.generateAsync({ type: 'blob' }).then(function (blob) {
          _descargar(blob, _archivoDetalle('zip', tipo));
          aviso('MediaRecorder no disponible: se exportó la secuencia PNG (' + plan.frames + ' frames).');
          resolve({ zip: true });
        })['catch'](reject);
      }
      siguiente();
    }

    function empezarRec() {
      try {
        var stream = cv.captureStream(24);
        if (streamAudio && streamAudio.getAudioTracks && streamAudio.getAudioTracks().length) {
          stream.addTrack(streamAudio.getAudioTracks()[0]);
        }
        // MP4 primero (compatible con la mayoría de reproductores); WebM de respaldo.
        var mime = null;
        ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'].forEach(function (m) {
          if (!mime) { try { if (MediaRecorder.isTypeSupported(m)) mime = m; } catch (e0) {} }
        });
        var rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        var pedazos = [];
        rec.ondataavailable = function (e) { if (e.data && e.data.size) pedazos.push(e.data); };
        rec.onstop = function () {
          if (!pedazos.length) return fallarAPNG({ message: 'grabación vacía' });
          var tipoClip = (mime && mime.indexOf('video/mp4') === 0) ? 'video/mp4' : 'video/webm';
          aviso('Clip ' + (tipoClip === 'video/mp4' ? 'MP4' : 'WebM') + ' listo (' + segundos + ' s' + (streamAudio ? ', con audio' : '') + ').');
          resolve(new Blob(pedazos, { type: tipoClip }));
        };
        _pintarCuadro(ctx, prims, 0, fases, estado);
        rec.start(200);
        var t0 = performance.now();
        (function ciclo() {
          var t = (performance.now() - t0) / 1000;
          _pintarCuadro(ctx, prims, Math.min(t, fases.dur), fases, estado);
          aviso('Grabando… ' + Math.max(0, segundos - t).toFixed(1) + ' s');
          if (t >= segundos) {
            rec.stop();
            setTimeout(function () { _pintarCuadro(ctx, prims, fases.dur, fases, estado); }, 30);
          }
          else requestAnimationFrame(ciclo);
        })();
      } catch (e2) { fallarAPNG(e2); }
    }

    // Cuenta regresiva 3-2-1 (visible, fuera de la grabación).
    var cuenta = 3;
    (function regresa() {
      _pintarCuenta(ctx, estado, cuenta);
      aviso(cuenta > 1 ? 'Preparado… comienza en ' + (cuenta - 1) : '¡Ya!');
      if (cuenta === 0) return empezarRec();
      cuenta--;
      setTimeout(regresa, 800);
    })();
  });
}

// Orquestador del botón Grabar: micrófono opcional + duración del tipo + descarga.
function _grabarActual() {
  var tipo = IMP_IDENT_TIPO();
  var an = (IMP.impacto.anim && IMP.impacto.anim[tipo]) || {};
  var dur = an.dur || IMP.impacto.dur || 5;
  var chkMico = document.getElementById('chkMico');
  var st = document.getElementById('statusExport');
  var pedir = (chkMico && chkMico.checked && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    ? navigator.mediaDevices.getUserMedia({ audio: true })
    : Promise.resolve(null);
  pedir.then(function (stream) {
    return grabarClip(tipo, dur, stream).then(function (blob) {
      detenerMic(stream);
      if (blob && blob.type && blob.type.indexOf('video/') === 0) {
        _descargar(blob, _archivoDetalle(blob.type.indexOf('video/mp4') === 0 ? 'mp4' : 'webm', tipo));
      } else if (blob && blob.zip) {
        avisoEstado('MediaRecorder no disponible: se exportó la secuencia PNG en ZIP.');
      } else if (blob && blob.png) {
        avisoEstado('MediaRecorder no disponible y sin JSZip: se bajó el frame final en PNG.');
      }
    }, function (e) {
      detenerMic(stream);
      throw e;
    });
  })['catch'](function (e) {
    if (st) st.textContent = (e && e.name === 'NotAllowedError')
      ? 'Permiso de micrófono denegado. Desmarca "con micrófono" o permite el acceso.'
      : 'La grabación falló: ' + (e && e.message ? e.message : 'error desconocido');
  });
  function avisoEstado(txt) { if (st) st.textContent = txt; }
  function detenerMic(stream) {
    if (stream && stream.getTracks) stream.getTracks().forEach(function (t) { t.stop(); });
  }
}

// ---------- Task 8: narracion pulible con IA ----------

// Ritmo locución: 135 palabras por minuto.
function palabrasMax(segundos) {
  return Math.floor((segundos || 0) * 2.25);
}

function promptPulir(texto, contexto, maxPalabras) {
  return [
    'Pule el siguiente borrador de narración para un clip de video institucional.',
    contexto ? 'Contexto: ' + contexto + '.' : '',
    'Devuelve solo el texto narrado, sin títulos ni explicaciones.',
    'Límite estricto: ≤ ' + maxPalabras + ' palabras.',
    'Redacción en español neutro, frases cortas, apto para locución.',
    'No inventes datos ni cifras que no estén en el borrador o el contexto.',
    '',
    'Borrador:',
    texto || ''
  ].filter(Boolean).join('\n');
}

// Guard: sin borrador ni confirmación explícita, no se aplica nada.
function puedeAplicar(original, confirmacion) {
  return (original && original.trim().length > 0) || confirmacion === true;
}

// Trunca al límite de palabras y deja aviso (nada silencioso).
function truncarPalabras(texto, max) {
  var t = (texto || '').replace(/\s+/g, ' ').trim();
  var p = t.split(' ').filter(Boolean);
  if (p.length <= max) return { texto: t, truncado: false, aviso: '' };
  var corto = p.slice(0, max).join(' ');
  return {
    texto: corto,
    truncado: true,
    aviso: 'La propuesta excede el límite (' + p.length + ' > ' + max + ' palabras); se recortó a ' + max + '.'
  };
}

// Escribe la propuesta en el área real pero NUNCA solo: marcada editable.
function aplicarPropuesta(area, texto, max) {
  if (!area) return;
  var r = max ? truncarPalabras(texto, max) : { texto: texto, truncado: false, aviso: '' };
  area.value = r.texto;
  area.classList.add('propuesta');
  if (r.aviso && area.setCustomValidity) area.setCustomValidity('');
  return r;
}

// ---------- Narración: UI (renderNar + IA) ----------

// Clave de guardado por lámina: ficha se guarda POR ODS (ficha<id>).
function _narClave(tipo) {
  if (tipo !== 'ficha') return tipo;
  return 'ficha' + (IMP_SELECCION || '');
}

function _narContexto(tipo) {
  var n = IMP.impacto.narracion || {};
  var lug = (IMP.impacto.plan && IMP.impacto.plan.municipio) || (IMP.team && IMP.team.city) || '';
  if (tipo === 'ficha') {
    var od = ODS_DATA[(IMP_SELECCION || 1) - 1];
    return od ? (od.code + ' · ' + od.name + (lug ? ', ' + lug : '')) : '';
  }
  if (tipo === 'mosaico') {
    var nombres = _odsSelPara('mosaico').map(function (o) { return 'ODS ' + o.id; }).join(', ');
    return 'Solución y ODS (' + nombres + ')' + (lug ? ', ' + lug : '');
  }
  var nacional = modoEfectivo(IMP, IMP._brief) !== 'latam';
  return nacional
    ? ('Plan Nacional de Lucha contra la Pobreza y para el Desarrollo Humano 2022–2026' + (lug ? ', ' + lug : ''))
    : ('Agenda sostenible para América Latina' + (lug ? ', ' + lug : ''));
}

var _narRefs = { areas: {}, paneles: {}, botones: {} };

function _palabras(txt) { return (txt || '').split(/\s+/).filter(Boolean).length; }

function renderNar() {
  var body = document.getElementById('narBody');
  if (!body) return;
  IMP.impacto.narracion = IMP.impacto.narracion || {};
  var nar = IMP.impacto.narracion;
  body.innerHTML = '';
  _narRefs = { areas: {}, paneles: {}, botones: {} };

  var stIA = document.getElementById('statusIA');

  function aviso(txt) { if (stIA) stIA.textContent = txt; }

  // Resumen de la solución (input lodado a narracion.resumen).
  var cajaRes = document.createElement('div');
  cajaRes.innerHTML = '<label class="etiqueta" for="narResumen">Resumen de la solución</label>';
  var inpRes = document.createElement('input');
  inpRes.type = 'text';
  inpRes.id = 'narResumen';
  inpRes.value = nar.resumen || '';
  inpRes.addEventListener('input', function () { nar.resumen = inpRes.value; _guardar(); });
  cajaRes.appendChild(inpRes);
  body.appendChild(cajaRes);

  // Un borrador por lámina (ficha: del ODS activo).
  IMP_TIPOS.forEach(function (tipo) {
    var max = palabrasMax((IMP.impacto.anim[tipo] && IMP.impacto.anim[tipo].dur) || IMP.impacto.dur || 5);
    var caja = document.createElement('div');
    caja.className = 'field';
    var titulo = document.createElement('label');
    titulo.className = 'etiqueta';
    titulo.textContent = (IMP_TIPO_ETIQUETA[tipo] || tipo);
    var fila = document.createElement('div');
    fila.className = 'fila-lamina';
    var area = document.createElement('textarea');
    area.rows = 3;
    area.value = nar[_narClave(tipo)] || (tipo === 'ficha' ? (nar['ficha'] || '') : (nar[tipo] || ''));
    area.dataset.tipo = tipo;
    var conta = document.createElement('span');
    conta.className = 'contador';
    conta.textContent = _palabras(area.value) + ' / ' + max;
    area.addEventListener('input', function () {
      nar[_narClave(tipo)] = area.value;
      conta.textContent = _palabras(area.value) + ' / ' + max;
      _guardar();
    });
    fila.appendChild(area);
    fila.appendChild(conta);
    // IA de pulido: propuesta editable + aplicar; NUNCA sustituye sin confirmar.
    var btn = document.createElement('button');
    btn.className = 'sec';
    btn.textContent = 'Pulir con IA';
    btn.addEventListener('click', function () {
      btn.disabled = true;
      aviso('IA trabajando…');
      var prompt = promptPulir(area.value, _narContexto(tipo), max);
      RallyIA.job(prompt).then(function (r) {
        btn.disabled = false;
        if (r.status === 'ok') { _mostrarPropuesta(tipo, r.text, max); aviso('Pulido listo: revisa, edita y Aplica.'); }
        else { aviso(r.message || 'IA no disponible.'); _mostrarPromptManual(prompt); }
      });
    });
    fila.appendChild(btn);
    caja.appendChild(titulo);
    caja.appendChild(fila);
    body.appendChild(caja);
    _narRefs.areas[tipo] = area;
  });

  // Panel único de propuesta: rechazable y editable (no es destructive).
  var panel = document.createElement('div');
  panel.id = 'narPanel';
  panel.hidden = true;
  panel.innerHTML = '<label class="etiqueta">Propuesta IA (editable — no se aplica hasta que lo ordeno)</label>';
  var tprop = document.createElement('textarea');
  tprop.rows = 3;
  tprop.className = 'propuesta';
  var avisoTr = document.createElement('p');
  avisoTr.className = 'status';
  var filaBtn = document.createElement('div');
  filaBtn.className = 'btn-row';
  var aplicar = document.createElement('button');
  aplicar.textContent = 'Aplicar';
  var descartar = document.createElement('button');
  descartar.className = 'sec';
  descartar.textContent = 'Descartar';
  panel.appendChild(tprop);
  panel.appendChild(avisoTr);
  filaBtn.appendChild(aplicar);
  filaBtn.appendChild(descartar);
  panel.appendChild(filaBtn);
  body.appendChild(panel);

  _narRefs.paneles = { panel: panel, tprop: tprop, avisoTr: avisoTr, tipo: null, max: null };

  aplicar.addEventListener('click', function () {
    var refs = _narRefs.paneles;
    var area = _narRefs.areas[refs.tipo];
    if (!area) return;
    if (!puedeAplicar(area.value, true)) return;
    var r = aplicarPropuesta(area, tprop.value, refs.max);
    nar[_narClave(refs.tipo)] = r.texto;
    if (nar.props) delete nar.props[_narClave(refs.tipo)];
    _guardar();
    refs.panel.hidden = true;
    aviso(r.truncado ? r.aviso : 'Propuesta aplicada al borrador de ' + (IMP_TIPO_ETIQUETA[refs.tipo] || refs.tipo) + '.');
  });
  descartar.addEventListener('click', function () {
    var nar = IMP.impacto.narracion || {};
    var tipoDsc = _narRefs.paneles.tipo;
    if (tipoDsc && nar.props) delete nar.props[_narClave(tipoDsc)];
    _guardar();
    _narRefs.paneles.panel.hidden = true;
    aviso('Propuesta descartada. El borrador queda como estaba.');
  });
  _narRefs.mostrar = function (tipo, texto, max) {
    _narRefs.paneles.panel = panel;
    _narRefs.paneles.tprop = tprop;
    _narRefs.paneles.avisoTr = avisoTr;
    panel.hidden = false;
    panel.dataset.tipo = tipo;
    _narRefs.paneles.tipo = tipo;
    _narRefs.paneles.max = max;
    var r = truncarPalabras(texto, max);
    tprop.value = r.texto;
    avisoTr.textContent = r.truncado ? r.aviso : '';
  };
  _narRefs.setAviso = aviso;

  // Proponer conexiones: UN job para todos los ODS activos + resumen.
  var btnConex = document.createElement('button');
  btnConex.className = 'sec';
  btnConex.textContent = 'Proponer conexiones (IA)';
  btnConex.addEventListener('click', function () {
    var sel = _odsSelPara('mosaico');
    if (!sel.length) { aviso('Marca al menos un ODS activo para proponer conexiones.'); return; }
    if (!canConex(sel)) return;
    btnConex.disabled = true;
    aviso('IA trabajando…');
    var lista = sel.map(function (o) { var od = ODS_DATA[o.id - 1]; return 'ODS ' + o.id + ' · ' + (od ? od.name : ''); }).join('; ');
    var prompt = [
      'Para cada objetivo listado, escribe una línea con la conexión concreta de la solución.',
      'Líneas exactamente con este formato: "ODS N: texto" (español neutro, ≤ 22 palabras por línea).',
      'Resumen de la solución: ' + (nar.resumen || '(pendiente)') + '.',
      'Contexto: ' + _narContexto('mosaico') + '.',
      'No inventes datos; si algo no está, escribe la conexión cualitativa sin cifras.',
      '',
      'Objetivos: ' + lista
    ].join('\n');
    RallyIA.job(prompt).then(function (r) {
      btnConex.disabled = false;
      if (r.status !== 'ok') { aviso(r.message || 'IA no disponible.'); _mostrarPromptManual(prompt); return; }
      var hechas = repartirConexiones(r.text || '');
      aviso(hechas ? 'Conexiones propuestas para ' + hechas + ' ODS: entra a cada Ficha para pulir y Aplicar.' : 'La IA no devolvió líneas "ODS N: texto". Copia el prompt y prueba manual.');
    });
  });
  body.appendChild(btnConex);

  function canConex(sel) {
    var sinRes = 'Sin resumen no hay conexión honesta. Escribe primero el resumen de la solución.';
    if (!(nar.resumen && nar.resumen.trim())) { aviso(sinRes); return false; }
    return true;
  }

  // Prompt visible para copia manual (o fallo de IA).
  function _mostrarPropuesta(tipo, texto, max) { _narRefs.mostrar(tipo, texto, max); }
  function _mostrarPromptManual(prompt) {
    var refs = _narRefs.paneles;
    refs.panel = panel;
    refs.tprop = tprop;
    refs.avisoTr = avisoTr;
    panel.hidden = false;
    panel.dataset.tipo = null;
    refs.tipo = null;
    refs.max = null;
    tprop.value = prompt;
    avisoTr.textContent = 'IA no disponible: abajo está el prompt para copiar a una IA externa.';
  }
  _narRefs.manual = _mostrarPromptManual;
}

// Reparto "ODS 12: texto" → claves de PROPUESTA nar.props['ficha12'] (nunca
// sustituye el borrador: la ficha lo muestra con Aplicar o Descartar).
function repartirConexiones(texto) {
  var nar = IMP.impacto.narracion = IMP.impacto.narracion || {};
  nar.props = nar.props || {};
  var lineas = String(texto || '').split(/\n+/);
  var n = 0;
  lineas.forEach(function (ln) {
    var m = ln.match(/^\s*ODS\s*(\d{1,2})\s*[:—-]\s*(.+)$/i);
    if (!m) return;
    var id = +m[1];
    if (!ODS_DATA[id - 1]) return;
    nar.props['ficha' + id] = m[2].trim();
    n++;
  });
  _guardar();
  return n;
}

// Cambio de ficha ODS: el borrador del textarea debe seguir al ODS activo
// y, si la IA dejó una conexión pendiente para esa ficha, se muestra como
// propuesta editable (Aplicar o Descartar), nunca reemplazo silencioso.
function _narCargarFicha() {
  var area = _narRefs.areas && _narRefs.areas.ficha;
  if (!area) return;
  var nar = IMP.impacto.narracion || {};
  area.value = nar[_narClave('ficha')] || '';
  area.dispatchEvent(new Event('input'));
  var pend = nar.props && nar.props[_narClave('ficha')];
  if (pend && _narRefs.mostrar) {
    var dur = (IMP.impacto.anim.ficha && IMP.impacto.anim.ficha.dur) || IMP.impacto.dur || 5;
    _narRefs.mostrar('ficha', pend, palabrasMax(dur));
    if (_narRefs.setAviso) _narRefs.setAviso('La IA dejó una conexión propuesta para esta ficha: edítala y Aplica, o Descártala.');
  }
}

document.addEventListener('DOMContentLoaded', arranqueImpacto);
