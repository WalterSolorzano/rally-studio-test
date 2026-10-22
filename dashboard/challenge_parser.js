// Parser de retos del comité — guardas de ingesta.
// Vive fuera de app.js para poder probarse sin DOM (tests/js/challenge_parser_probe.js).
// Regla dura: un informe del corpus NO puede convertirse en catálogo de retos.
(function (global) {
  "use strict";

  // Encabezado legítimo: exige prefijo RETO / DESAFÍO. Sin prefijo no abre reto.
  var HEADER_RE = /^(?:reto|desaf[ií]o)\s*#?\s*(\d{1,2})\s*[:.)\-–—]\s*(.+)$/i;
  // Respaldo solo cuando el comunicado no usa prefijo: "01. Título".
  var BARE_RE = /^#?(\d{1,2})\s*[:.)\-–—]\s*(.+)$/;
  var ODS_RE = /^ODS\s*:\s*(.+)$/i;
  var IMG_RE = /^\[IMAGEN_ORIGEN:\s*([^\]]+)\]/i;

  // Arranques típicos de sección de informe, no de problema del comité.
  var SECTION_START = /^(el|la|los|las|un|una|unos|unas|qu[eé]|c[oó]mo|anexos?|ap[eé]ndice|matriz|resultados?|m[eé]tricas?|clusters?|cat[aá]logo|r[uú]brica|reporte|informe|l[oó]gica|ecosistema|redistribuci[oó]n|naming|registro|resumen|conclusi[oó]n|introducci[oó]n|[ií]ndice|tabla|figura|cap[ií]tulo|secci[oó]n)\b/i;

  var MAX_TITLE = 90;
  var MAX_WORDS = 14;

  function collapse(s) {
    return String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  }

  function isPlausibleTitle(raw) {
    var s = collapse(raw);
    if (s.length < 3 || s.length > MAX_TITLE) return false;
    // Un título empieza con letra: descarta "3.1 Origen…", "17.1 Registro…".
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(s)) return false;
    var words = s.split(" ");
    if (words.length > MAX_WORDS) return false;
    // Dos frases pegadas = encabezado fusionado con el cuerpo del informe.
    if (/[.!?…]\s+\S/.test(s)) return false;
    if (/[|]{1}|\.{3,}/.test(s)) return false;
    // "La lógica común", "El reporte nacional": arranque de sección corto.
    if (SECTION_START.test(s) && words.length <= 8) return false;
    return true;
  }

  // Separa el título de la demanda cuando el comité los pega en la misma línea.
  function splitTitle(raw) {
    var s = collapse(raw);
    var m = s.match(/^(.+?[.!?])\s+(.+)$/);
    if (m && collapse(m[1]).length >= 12) {
      return { title: cleanTitle(m[1]), rest: collapse(m[2]) };
    }
    if (s.length > MAX_TITLE) {
      var cut = s.lastIndexOf(" ", MAX_TITLE);
      if (cut < 20) cut = MAX_TITLE;
      return { title: cleanTitle(s.slice(0, cut)), rest: collapse(s.slice(cut)) };
    }
    return { title: cleanTitle(s), rest: "" };
  }

  function cleanTitle(s) {
    var t = collapse(s).replace(/\s*[.…]+$/, "");
    // "Reto 03:" pegado al título, por si el OCR repite el encabezado.
    t = t.replace(/^(?:reto|desaf[ií]o)\s*#?\s*\d{1,2}\s*[:.)\-–—]\s*/i, "");
    return t.trim().slice(0, MAX_TITLE);
  }

  function normalizeOds(raw) {
    return String(raw == null ? "" : raw)
      .split(/[,;/]/)
      .map(function (x) {
        var digits = String(x).replace(/[^\d]/g, "");
        return digits ? "ODS " + digits : "";
      })
      .filter(Boolean);
  }

  function inferCategory(title) {
    var t = String(title || "").toLowerCase();
    return t.indexOf("social") !== -1 || t.indexOf("comun") !== -1 ? "Impacto Social" : "Innovación";
  }

  function pad2(n) {
    return String(n).length < 2 ? "0" + n : String(n);
  }

  function parse(text) {
    var lines = String(text == null ? "" : text)
      .split(/\r?\n/)
      .map(collapse)
      .filter(Boolean);

    // Si hay al menos un "RETO n:", el comunicado usa prefijo y solo ese formato abre retos.
    var hasHeader = lines.some(function (l) { return HEADER_RE.test(l); });
    var out = [];
    var current = null;
    var used = Object.create(null);

    function assignId(wanted) {
      var id = pad2(parseInt(wanted, 10) || 0);
      if (!id || id === "00" || used[id]) {
        var n = 1;
        while (used[pad2(n)] && n < 100) n += 1;
        id = pad2(n);
      }
      used[id] = true;
      return id;
    }

    function close() {
      if (!current) return;
      current.title = cleanTitle(current.title);
      if (current.title && !current.ods) current.ods = [];
      out.push(current);
      current = null;
    }

    lines.forEach(function (line) {
      var img = IMG_RE.exec(line);
      if (img) {
        if (current) current.imageKey = collapse(img[1]);
        return;
      }

      var header = hasHeader ? HEADER_RE.exec(line) : null;
      if (!header && !hasHeader) {
        var bare = BARE_RE.exec(line);
        if (bare && isPlausibleTitle(bare[2])) header = bare;
      }

      if (header) {
        close();
        var split = splitTitle(header[2]);
        current = {
          id: assignId(header[1]),
          title: split.title,
          category: inferCategory(split.title),
          officialExpectation: split.rest,
          compDensity: "Edición Oficial en Vivo"
        };
        return;
      }

      var ods = ODS_RE.exec(line);
      if (ods) {
        if (current) current.ods = normalizeOds(ods[1]);
        return;
      }

      if (!current) return;
      var clean = line.replace(/^Demanda del comit[eé]:\s*/i, "").trim();
      if (!clean) return;
      current.officialExpectation = collapse(current.officialExpectation + " " + clean);
    });

    close();
    // Última red: ningún reto con título implausible sale del parser.
    return out.filter(function (c) { return !!c.title; });
  }

  function signature(ch) {
    return collapse(ch && ch.title).toLowerCase().slice(0, 60);
  }

  function dedupe(list) {
    var seen = Object.create(null);
    return list.filter(function (ch) {
      var sig = signature(ch);
      if (!sig || seen[sig]) return false;
      seen[sig] = true;
      return true;
    });
  }

  // Devuelve { list, removedIds } para que la UI purgue votos e ideas de lo que sale.
  function merge(existing, incoming, append) {
    var prev = Array.isArray(existing) ? existing.slice() : [];
    var inc = dedupe(
      (Array.isArray(incoming) ? incoming : []).filter(function (c) {
        return c && typeof c === "object" && isPlausibleTitle(c.title);
      })
    );

    if (!append || !prev.length) {
      var fresh = dedupe(inc).map(function (c, i) {
        var copy = Object.assign({}, c);
        copy.id = pad2(i + 1);
        return copy;
      });
      var removed = [];
      prev.forEach(function (c) {
        var id = String(c && c.id != null ? c.id : "");
        if (id && removed.indexOf(id) === -1) removed.push(id);
      });
      return { list: fresh, removedIds: removed };
    }

    var seen = Object.create(null);
    var taken = Object.create(null);
    prev.forEach(function (c) {
      seen[signature(c)] = true;
      taken[String(c.id)] = true;
    });

    var next = prev.length + 1;
    function nextFreeId() {
      var id;
      do {
        id = pad2(next);
        next += 1;
      } while (taken[id] && next < 1000);
      taken[id] = true;
      return id;
    }

    var added = [];
    inc.forEach(function (c) {
      var sig = signature(c);
      if (!sig || seen[sig]) return;
      seen[sig] = true;
      var copy = Object.assign({}, c);
      copy.id = nextFreeId();
      added.push(copy);
    });

    return { list: prev.concat(added), removedIds: [] };
  }

  // Borrar un reto borra su cubo de votos, sus redacciones y la selección que lo apuntaba.
  function purgeRefs(state, ids) {
    if (!state) return state;
    var gone = (Array.isArray(ids) ? ids : []).map(String);
    if (!gone.length) return state;

    if (state.challenge_mesa && state.challenge_mesa.votes) {
      gone.forEach(function (id) { delete state.challenge_mesa.votes[id]; });
    }
    if (state.challenge_ideas) {
      gone.forEach(function (id) { delete state.challenge_ideas[id]; });
    }
    if (gone.indexOf(String(state.challenge_id || "")) !== -1) {
      state.challenge_id = "";
      state.challenge_title = "";
    }
    if (gone.indexOf(String(state.active_deliberation_challenge_id || "")) !== -1) {
      state.active_deliberation_challenge_id = "";
    }
    return state;
  }

  global.RallyChallengeParser = {
    parse: parse,
    merge: merge,
    purgeRefs: purgeRefs,
    isPlausibleTitle: isPlausibleTitle,
    normalizeOds: normalizeOds,
    MAX_TITLE: MAX_TITLE,
    MAX_WORDS: MAX_WORDS
  };
})(typeof window !== "undefined" ? window : this);
