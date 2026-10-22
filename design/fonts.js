// Biblioteca de fuentes para los módulos de design.
// Incluye ~50 familias de Google Fonts agrupadas por categoría.
// La IA o el usuario pueden añadir cualquier fuente pública (Google Fonts u otra) mediante URL.

var FONT_LIBRARY = [
  // --- Sans-serif ---
  { id:'plus-jakarta', family:'Plus Jakarta Sans', category:'sans', weights:'400;500;600;700;800;900' },
  { id:'inter', family:'Inter', category:'sans', weights:'400;500;600;700;800;900' },
  { id:'manrope', family:'Manrope', category:'sans', weights:'400;500;600;700;800' },
  { id:'space-grotesk', family:'Space Grotesk', category:'sans', weights:'400;500;600;700' },
  { id:'dm-sans', family:'DM Sans', category:'sans', weights:'400;500;700' },
  { id:'sora', family:'Sora', category:'sans', weights:'400;500;600;700;800' },
  { id:'outfit', family:'Outfit', category:'sans', weights:'400;500;600;700;800;900' },
  { id:'lexend', family:'Lexend', category:'sans', weights:'400;500;600;700;800' },
  { id:'barlow', family:'Barlow', category:'sans', weights:'400;500;600;700' },
  { id:'nunito', family:'Nunito', category:'sans', weights:'400;600;700;800;900' },
  { id:'poppins', family:'Poppins', category:'sans', weights:'400;500;600;700;800' },
  { id:'work-sans', family:'Work Sans', category:'sans', weights:'400;500;600;700;800' },
  { id:'mulish', family:'Mulish', category:'sans', weights:'400;500;600;700;800' },
  { id:'rubik', family:'Rubik', category:'sans', weights:'400;500;600;700;800;900' },
  { id:'karla', family:'Karla', category:'sans', weights:'400;500;600;700;800' },
  // --- Serif ---
  { id:'fraunces', family:'Fraunces', category:'serif', weights:'400;700;900' },
  { id:'playfair', family:'Playfair Display', category:'serif', weights:'400;600;700;800;900' },
  { id:'lora', family:'Lora', category:'serif', weights:'400;500;600;700' },
  { id:'merriweather', family:'Merriweather', category:'serif', weights:'400;700;900' },
  { id:'cormorant', family:'Cormorant Garamond', category:'serif', weights:'400;500;600;700' },
  { id:'dm-serif', family:'DM Serif Display', category:'serif', weights:'400' },
  { id:'instrument-serif', family:'Instrument Serif', category:'serif', weights:'400' },
  { id:'bodoni-moda', family:'Bodoni Moda', category:'serif', weights:'400;500;600;700;800;900' },
  // --- Display ---
  { id:'barlow-condensed', family:'Barlow Condensed', category:'display', weights:'600;700;800' },
  { id:'archivo-narrow', family:'Archivo Narrow', category:'display', weights:'600;700' },
  { id:'archivo-black', family:'Archivo Black', category:'display', weights:'400' },
  { id:'bebas-neue', family:'Bebas Neue', category:'display', weights:'400' },
  { id:'oswald', family:'Oswald', category:'display', weights:'400;500;600;700' },
  { id:'anton', family:'Anton', category:'display', weights:'400' },
  { id:'righteous', family:'Righteous', category:'display', weights:'400' },
  { id:'bangers', family:'Bangers', category:'display', weights:'400' },
  { id:'fredoka', family:'Fredoka', category:'display', weights:'400;500;600;700' },
  { id:'lobster', family:'Lobster', category:'display', weights:'400' },
  { id:'pacifico', family:'Pacifico', category:'display', weights:'400' },
  // --- Mono ---
  { id:'jetbrains-mono', family:'JetBrains Mono', category:'mono', weights:'400;600;700' },
  { id:'fira-code', family:'Fira Code', category:'mono', weights:'400;500;600;700' },
  { id:'ibm-plex-mono', family:'IBM Plex Mono', category:'mono', weights:'400;500;600;700' },
  { id:'space-mono', family:'Space Mono', category:'mono', weights:'400;700' },
  { id:'roboto-mono', family:'Roboto Mono', category:'mono', weights:'400;500;600;700' },
  { id:'source-code-pro', family:'Source Code Pro', category:'mono', weights:'400;500;600;700' },
  { id:'dm-mono', family:'DM Mono', category:'mono', weights:'400;500' },
];

var _loadedFonts = {};

function _googleFontUrl(family, weights) {
  var fam = family.replace(/ /g, '+');
  return 'https://fonts.googleapis.com/css2?family=' + fam + ':wght@' + weights.replace(/;/g, ';') + '&display=swap';
}

function loadFont(family, weights) {
  weights = weights || '400;500;600;700;800;900';
  var key = family + '|' + weights;
  if (_loadedFonts[key]) return Promise.resolve();
  // check if already in library
  var entry = FONT_LIBRARY.filter(function (f) { return f.family === family; })[0];
  var url = entry ? _googleFontUrl(entry.family, entry.weights) : _googleFontUrl(family, weights);
  return new Promise(function (resolve) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = function () { _loadedFonts[key] = true; resolve(); };
    link.onerror = function () { resolve(); };
    document.head.appendChild(link);
    _loadedFonts[key] = true;
  });
}

function loadFontFromUrl(url) {
  if (_loadedFonts[url]) return Promise.resolve();
  return new Promise(function (resolve) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = function () { _loadedFonts[url] = true; resolve(); };
    link.onerror = function () { resolve(); };
    document.head.appendChild(link);
    _loadedFonts[url] = true;
  });
}

function fontOptions(category) {
  var list = category ? FONT_LIBRARY.filter(function (f) { return f.category === category; }) : FONT_LIBRARY;
  return list.map(function (f) {
    return '<option value="' + f.family + '">' + f.family + ' (' + f.category + ')</option>';
  }).join('');
}

function allFontOptions() {
  var cats = ['sans', 'serif', 'display', 'mono'];
  var labels = { sans: 'Sans-serif', serif: 'Serif', display: 'Display', mono: 'Monoespaciado' };
  return cats.map(function (c) {
    return '<optgroup label="' + labels[c] + '">' + fontOptions(c) + '</optgroup>';
  }).join('');
}