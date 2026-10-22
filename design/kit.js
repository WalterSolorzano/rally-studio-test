// kit.js — lógica del kit de prensa + thumbnail
// Comparte identidad con design/index.html vía shared.js

var S = loadIdentity();

function $(id) { return document.getElementById(id); }

function cssVar(name, val) {
  document.documentElement.style.setProperty(name, val);
}

// Paleta canonica compartida (ver shared.js):
//   bg fondo · bg2 fondo 2 · ac marca · ink texto · mu texto suave · gl formas
function applyPalette() {
  var paper = paperColor();
  var ink = legibleInk(paper);
  var brand = brandColor(paper);
  cssVar('--paper', paper);
  cssVar('--primary', brand);
  cssVar('--navy', ink);
  cssVar('--accent', S.pal.ac || '#0284C7');
  var kit = $('kitPreview');
  if (kit) {
    kit.style.setProperty('--paper', paper);
    kit.style.setProperty('--primary', brand);
    kit.style.setProperty('--navy', ink);
    kit.style.setProperty('--accent', S.pal.ac);
  }
}

function syncControls() {
  $('teamName').value = S.team.name || '';
  $('logoText').value = (S.team.tag || '').replace('#', '').slice(0, 3) || '';
  $('bio').value = S.bio || '';
  $('uni').value = S.team.university || INSTITUTION_DEFAULT.name;
  $('city').value = S.team.city || '';
  $('cAc').value = S.pal.ac || '#0866F5';
  $('cInk').value = S.pal.ink || '#0D1B35';
  $('cMu').value = S.pal.mu || '#5C7193';
  $('cGl').value = S.pal.gl || '#DCE7F5';
  $('cBg').value = S.pal.bg || '#FFFFFF';
  $('cBg2').value = S.pal.bg2 || '#F0F6FF';
  $('fontTitle').innerHTML = allFontOptions();
  $('fontBody').innerHTML = allFontOptions();
  var ft = (S.fonts && S.fonts.t) || 'Plus Jakarta Sans';
  var fb = (S.fonts && S.fonts.b) || 'Barlow';
  $('fontTitle').value = ft;
  $('fontBody').value = fb;
}

function renderKit() {
  var tn = S.team.name || '';
  var logo = (S.team.tag || tn).replace('#', '').slice(0, 3).toUpperCase();
  // Logo del equipo (el que sube el kit). Si no hay, iniciales.
  var lg = teamLogo();
  $('kitName').textContent = tn;
  $('kitSub').textContent = S.team.kicker || S.team.foot || '';
  if (lg) {
    ['kitLogo','lv1','lv2','lv3'].forEach(function(b){
      var el=$(b); el.style.backgroundImage='url('+lg+')'; el.style.backgroundSize='contain'; el.style.backgroundRepeat='no-repeat'; el.style.backgroundPosition='center'; el.textContent='';
    });
  } else {
    $('kitLogo').textContent = logo; $('lv1').textContent = logo; $('lv2').textContent = logo; $('lv3').textContent = logo;
    $('kitLogo').style.backgroundImage=''; $('lv1').style.backgroundImage=''; $('lv2').style.backgroundImage=''; $('lv3').style.backgroundImage='';
  }
  $('kitBio').textContent = S.bio || '';
  // Institucion: logo de la UNI + nombre. La ciudad se queda vacia a proposito:
  // si no hay ciudad, la celda no se muestra.
  var uniLogo = (S.team && S.team.logoUni) || INSTITUTION_DEFAULT.symbol || INSTITUTION_DEFAULT.logo;
  var mark = $('kitUniMark');
  if (mark) {
    if (uniLogo) {
      mark.style.backgroundImage = 'url(' + uniLogo + ')';
      mark.style.display = 'block';
    } else {
      mark.style.backgroundImage = '';
      mark.style.display = 'none';
    }
  }
  $('kitUni').textContent = S.team.university || INSTITUTION_DEFAULT.name;
  var cityCell = $('kitCityCell');
  var city = S.team.city || '';
  $('kitCity').textContent = city;
  if (cityCell) cityCell.style.display = city ? '' : 'none';
  // fonts
  var ft = (S.fonts && S.fonts.t) || 'Plus Jakarta Sans';
  var fb = (S.fonts && S.fonts.b) || 'Barlow';
  ['fH1', 'fH2', 'fH3'].forEach(function (id) { $(id).style.fontFamily = "'" + ft + "',sans-serif"; });
  $('fBody').style.fontFamily = "'" + fb + "',sans-serif";
  $('fMono').style.fontFamily = "'JetBrains Mono',monospace";
  // palette: los 6 roles canonicos, compartidos con el carrusel y el thumbnail
  var pals = [
    { n: 'Marca', c: S.pal.ac },
    { n: 'Texto', c: S.pal.ink },
    { n: 'Suave', c: S.pal.mu },
    { n: 'Formas', c: S.pal.gl },
    { n: 'Fondo', c: S.pal.bg },
    { n: 'Fondo 2', c: S.pal.bg2 },
  ];
  $('kitPal').innerHTML = pals.map(function (p) {
    return '<div class="sw" style="background:' + p.c + '"><span>' + p.n + '</span></div>';
  }).join('');
  // team
  var mem = S.mem || [];
  var av = S.pal.ac || '#0866F5';
  $('kitTeam').innerHTML = mem.map(function (m, i) {
    var ini = (m.n || '?').charAt(0).toUpperCase();
    return '<div class="team-card"><div class="av" style="background:' + av + '">' + ini + '</div><div class="nm">' + (m.n || '') + ' ' + (m.s || '') + '</div><div class="rl">' + (m.r || '') + '</div></div>';
  }).join('') || '<div class="team-card"><div class="av" style="background:' + av + '">?</div><div class="nm">Sin integrantes</div><div class="rl">Agrega en el carrusel</div></div>';
  // logo variants colors (solo si no hay logo: se pintan con la marca)
  if (!lg) {
    var brand = brandColor(paperColor());
    $('lv1').style.background = brand; $('lv1').style.color = '#fff';
    $('lv2').style.background = '#fff'; $('lv2').style.color = brand; $('lv2').style.border = '1px solid ' + brand;
    $('lv3').style.background = S.pal.ink; $('lv3').style.color = '#fff';
    $('kitLogo').style.background = brand; $('kitLogo').style.color = '#fff';
  }
  $('kitName').style.fontFamily = "'" + ft + "',sans-serif";
  $('kitName').style.color = legibleInk(paperColor());
  applyPalette();
  // load fonts
  loadFont(ft); loadFont(fb);
}

function saveAll() {
  S.team.name = $('teamName').value;
  var uniVal = ($('uni').value || '').trim();
  S.team.university = uniVal || INSTITUTION_DEFAULT.name;
  S.team.city = ($('city').value || '').trim();
  S.bio = $('bio').value;
  S.university = S.team.university;
  S.city = S.team.city;
  S.pal.ac = $('cAc').value;
  S.pal.ink = $('cInk').value;
  S.pal.mu = $('cMu').value;
  S.pal.gl = $('cGl').value;
  S.pal.bg = $('cBg').value;
  S.pal.bg2 = $('cBg2').value;
  if (!S.fonts) S.fonts = {};
  S.fonts.t = $('fontTitle').value;
  S.fonts.b = $('fontBody').value;
  saveIdentity(S);
}

function exportPNG(targetId, filename, statusId) {
  var el = $(targetId);
  var btn = event && event.target;
  if (btn) btn.disabled = true;
  $(statusId).textContent = 'Generando PNG…';
  // Nada de opacidad durante la captura: html2canvas respeta el alfa del
  // elemento y la imagen saldría translúcida.
  html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null }).then(function (canvas) {
    var link = document.createElement('a');
    link.download = filename + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    $(statusId).textContent = 'PNG descargado.';
  }).catch(function (e) {
    $(statusId).textContent = 'Error: ' + e.message;
  }).finally(function () {
    if (btn) btn.disabled = false;
  });
}

function exportPDF(targetId, filename, statusId) {
  var el = $(targetId);
  $(statusId).textContent = 'Generando PDF…';
  html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null }).then(function (canvas) {
    var imgData = canvas.toDataURL('image/png');
    var pdf = new jspdf.jsPDF({ orientation: canvas.width > canvas.height ? 'landscape' : 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(filename + '.pdf');
    $(statusId).textContent = 'PDF descargado.';
  }).catch(function (e) {
    $(statusId).textContent = 'Error: ' + e.message;
  });
}

// --- listeners ---
function bind() {
  var ids = ['teamName', 'logoText', 'bio', 'uni', 'city', 'cAc', 'cInk', 'cMu', 'cGl', 'cBg', 'cBg2', 'fontTitle', 'fontBody'];
  ids.forEach(function (id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('input', function () { saveAll(); renderKit(); });
    el.addEventListener('change', function () { saveAll(); renderKit(); });
  });
  // Extraccion de paleta desde el logo (la logica vive en shared.js
  // como funcion pura: asi se puede testear con imagenes sinteticas).
  function extractPaletteFromImage(src, cb) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 128, 128);
      var data = ctx.getImageData(0, 0, 128, 128).data;
      var raw = extractPaletteFromPixels(data);
      if (!raw) { cb(null); return; }
      // La extraccion local ya sale en forma canonica; el saneo la deja
      // sin morado, con tinta legible y con acento de contraste real.
      var out = sanitizePalette(raw);
      out.hasBlack = raw.hasBlack;
      out.black = raw.black;
      cb(out);
    };
    img.onerror = function(){ cb(null); };
    img.src = src;
  }

  $('logoFile').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    $('logoFileName').textContent = f.name;
    var r = new FileReader();
    r.onload = function () {
      var boxes = ['kitLogo', 'lv1', 'lv2', 'lv3'];
      boxes.forEach(function (b) {
        var el = $(b);
        el.style.backgroundImage = 'url(' + r.result + ')';
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundPosition = 'center';
        el.textContent = '';
      });
      // El logo vive en S.team.logo: es el campo canonico que comparten
      // el carrusel, el kit y el thumbnail.
      S.team.logo = r.result;
      S.logo = r.result;
      saveIdentity(S);
      extractPaletteFromImage(r.result, function (pal) {
        if (!pal) return;
        function applySuggested(p, fonts, msg) {
          // Toda paleta (de IA o local) pasa por el mismo saneo:
          // negro permitido, morado vetado, contraste real exigido.
          // La IA entrega la forma cruda (primary/secondary/accent/text);
          // la conversion a la forma canonica la hace sanitizePaletteCruda.
          var sp = p && p.text != null ? sanitizePaletteCruda(p) : sanitizePalette(p);
          // Dato duro del pixel: si el logo tiene negro, ese negro es la tinta.
          // La IA no puede taparlo con un color de marca.
          if (pal.hasBlack && pal.black && lumOf(pal.black) <= 0.12) {
            sp.primary = pal.black;
            sp.notes.push('tinta = negro detectado en el logo');
          }
          var bgCand = sp.bg || '#ffffff';
          S.pal.bg = bgCand;
          var inkCand = sp.primary || '#0D1B35';
          S.pal.ink = inkCand;
          S.pal.ac = sp.accent || '#0866F5';
          S.pal.bg2 = sp.secondary || '#F0F6FF';
          // Tinta suave y formas se derivan de la propia paleta.
          S.pal.mu = lighten(inkCand, 0.35);
          S.pal.gl = lighten(S.pal.ac, 0.82);
          if (fonts && fonts.title) S.fonts.t = fonts.title;
          if (fonts && fonts.body) S.fonts.b = fonts.body;
          var cAc = $('cAc'); if (cAc) cAc.value = S.pal.ac;
          var cInk = $('cInk'); if (cInk) cInk.value = S.pal.ink;
          var cMu = $('cMu'); if (cMu) cMu.value = S.pal.mu;
          var cGl = $('cGl'); if (cGl) cGl.value = S.pal.gl;
          var cBg = $('cBg'); if (cBg) cBg.value = S.pal.bg;
          var cBg2 = $('cBg2'); if (cBg2) cBg2.value = S.pal.bg2;
          var ft = $('fontTitle'); if (ft) ft.value = S.fonts.t;
          var fb = $('fontBody'); if (fb) fb.value = S.fonts.b;
          saveAll();
          renderKit();
          var st = $('statusKit'); if (st) st.textContent = msg || 'Paleta y fuente sugeridas desde tu logo.';
        }
        // Intentar motor backend con IA; fallback a extraccion local
        fetch('/api/ai/design', {
          method: 'POST',
          headers: (function () {
            var h = { 'Content-Type': 'application/json' };
            try {
              var actor = (localStorage.getItem('rally_presence_name') || '').trim().slice(0, 80);
              if (actor) h['X-Rally-Actor'] = actor;
            } catch (e) {}
            return h;
          })(),
          body: JSON.stringify({ colors: [pal.primary, pal.secondary, pal.accent], image: r.result })
        }).then(function (res) { return res.json(); }).then(function (data) {
          if (data && data.status === 'ok' && data.palette) {
            applySuggested(data.palette, data.fonts, 'Paleta y fuente sugeridas por IA desde tu logo.');
          } else {
            var pairs = [['Archivo','Plus Jakarta Sans'],['Barlow Condensed','Barlow'],['Instrument Serif','Plus Jakarta Sans'],['Fredoka','Plus Jakarta Sans'],['Bangers','Archivo']];
            var idx = (pal.primary.charCodeAt(1)+pal.primary.charCodeAt(2)+pal.primary.charCodeAt(3)) % pairs.length;
            applySuggested(pal, { title: pairs[idx][0], body: pairs[idx][1] }, 'Paleta sugerida localmente (sin IA).');
          }
        }).catch(function () {
          var pairs2 = [['Archivo','Plus Jakarta Sans'],['Barlow Condensed','Barlow'],['Instrument Serif','Plus Jakarta Sans'],['Fredoka','Plus Jakarta Sans'],['Bangers','Archivo']];
          var idx2 = (pal.primary.charCodeAt(1)+pal.primary.charCodeAt(2)+pal.primary.charCodeAt(3)) % pairs2.length;
          applySuggested(pal, { title: pairs2[idx2][0], body: pairs2[idx2][1] }, 'Paleta sugerida localmente (sin IA).');
        });
      });
    };
    r.readAsDataURL(f);
  });
  $('addCustomFont').addEventListener('click', function () {
    var url = $('customFontUrl').value.trim();
    if (!url) return;
    loadFontFromUrl(url).then(function () {
      // try to extract family name from url
      var m = url.match(/family=([^&:]+)/);
      var fam = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : 'Custom';
      var opt = document.createElement('option');
      opt.value = fam; opt.textContent = fam + ' (custom)';
      $('fontTitle').appendChild(opt);
      $('fontBody').appendChild(opt.cloneNode(true));
      $('fontTitle').value = fam;
      $('fontBody').value = fam;
      saveAll(); renderKit();
    });
  });
  $('exportPngKit').addEventListener('click', function (e) { exportPNG('kitPreview', 'kit-prensa', 'statusKit'); });
  $('exportPdfKit').addEventListener('click', function (e) { exportPDF('kitPreview', 'kit-prensa', 'statusKit'); });

  // --- enviar a la ventana (buzon de seccion) ---
  var btnVentana = $('enviarVentana');
  if (btnVentana) {
    btnVentana.addEventListener('click', function () {
      var st = $('statusVentana');
      if (!window.RallyVentana) { if (st) st.textContent = 'ventana.js no cargó.'; return; }
      saveAll();
      btnVentana.disabled = true;
      if (st) st.textContent = 'Enviando a la ventana…';
      window.RallyVentana.enviarIdentidad(S).then(function (claves) {
        if (st) st.textContent = 'Enviado: ' + claves.join(', ') + '. La ventana ya lo tiene.';
      }).catch(function (e) {
        if (st) st.textContent = 'No se pudo enviar: ' + e.message;
      }).finally(function () {
        btnVentana.disabled = false;
      });
    });
  }
}

// init
syncControls();
bind();
renderKit();
var stVentana = $('statusVentana');
if (stVentana && window.RallyVentana && window.RallyVentana.servidorLocal()) {
  stVentana.textContent = 'Listo: el logo y la paleta se escriben en la ventana del rally.';
}
// load fonts
loadFont((S.fonts && S.fonts.t) || 'Plus Jakarta Sans');
loadFont((S.fonts && S.fonts.b) || 'Barlow');

// brief.json -> identidad compartida (mismo cargador que el carrusel y el thumbnail)
cargarBrief(S, function () { syncControls(); renderKit(); });