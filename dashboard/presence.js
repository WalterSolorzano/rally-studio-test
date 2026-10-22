/* presence.js -- Presencia y avisos en vivo (Fases 2.2 y 2.3).
 *
 * - Marca latido del editor actual (POST /api/presence) con lo que esta
 *   editando (campo [data-section-lock] o [data-lockable] mas cercano).
 * - Consulta quien mas esta en la pizarra (GET /api/presence) y lo publica
 *   como chips flotantes, sin tocar la maquina de estados del usuario.
 * - Escucha el feed /api/sync/changes y avisa cuando el host local o el
 *   agente actualizo un archivo de la pizarra.
 *
 * No es motor: no edita estado, no decide nada. Solo observa y avisa.
 */
(function (global) {
  "use strict";
  if (typeof fetch !== "function") return;
  if (!global.location || global.location.protocol === "file:") return;

  var TTL_MS = 4000;           // cadencia de latido / consulta
  var EDITING_HOLD_MS = 9000;  // cuantos ms se anuncia lo ultimo editado
  var CHIPS_ID = "rally-presence-bar";
  var MY_KEY = "rally_presence_name";

  var myName = "";
  try { myName = global.localStorage.getItem(MY_KEY) || ""; } catch (e) {}
  if (!myName) {
    myName = "invitado-" + Math.random().toString(36).slice(2, 6);
    try { global.localStorage.setItem(MY_KEY, myName); } catch (e) {}
  }

  var lastEditing = "";
  var editingAt = 0;
  var seenCursor = null;

  function editingKeyFrom(target) {
    var node = target;
    while (node && node.getAttribute) {
      var k = node.getAttribute("data-section-lock");
      if (k) return String(k);
      k = node.getAttribute("data-lockable");
      if (k) return String(k);
      node = node.parentNode;
    }
    return "";
  }

  function currentEditing() {
    if (!lastEditing) return "";
    return (Date.now() - editingAt <= EDITING_HOLD_MS) ? lastEditing : "";
  }

  function beat() {
    var body = { actor: myName };
    var ed = currentEditing();
    if (ed) body.editing = ed;
    try {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).catch(function () {});
    } catch (e) {}
  }

  function chips(list) {
    var bar = document.getElementById(CHIPS_ID);
    if (!bar) {
      bar = document.createElement("div");
      bar.id = CHIPS_ID;
      bar.style.cssText = "position:fixed;top:8px;right:8px;z-index:99998;display:flex;" +
        "gap:6px;align-items:center;flex-wrap:wrap;max-width:40vw;pointer-events:none;" +
        "font:12px/1.3 system-ui,sans-serif;";
      (document.body || document.documentElement).appendChild(bar);
    }
    var otros = (list || []).filter(function (a) { return a.actor !== myName; });
    bar.textContent = "";
    otros.forEach(function (a) {
      var chip = document.createElement("span");
      chip.style.cssText = "padding:3px 8px;border-radius:999px;background:#0f172a;" +
        "color:#e2e8f0;border:1px solid #334155;box-shadow:0 1px 4px rgba(15,23,42,.25);";
      var quien = document.createElement("b");
      quien.textContent = a.actor;
      chip.appendChild(quien);
      if (a.editing) {
        var en = document.createElement("span");
        en.style.color = "#7dd3fc";
        en.textContent = " edita " + a.editing;
        chip.appendChild(en);
      }
      bar.appendChild(chip);
    });
  }

  function pollPresence() {
    fetch("/api/presence")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data && data.actors) chips(data.actors); })
      .catch(function () {});
  }

  function humanPath(rel) {
    if (String(rel).indexOf("content_decisiones/") === 0) return "una propuesta";
    if (String(rel).indexOf("content/") === 0) return "una propuesta nueva";
    return String(rel);
  }

  function pollChanges() {
    var url = "/api/sync/changes?project=main&since=" + (seenCursor === null ? 0 : seenCursor);
    fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        if (seenCursor === null) { seenCursor = data.cursor || 0; return; }
        var cambios = data.changes || [];
        cambios.forEach(function (ch) {
          if (ch.id <= (seenCursor || 0)) return;
          if (typeof showToast === "function") {
            showToast("🌐 " + ch.actor + " actualizó " + humanPath(ch.path));
          }
        });
        seenCursor = Math.max(seenCursor, data.cursor || 0);
      })
      .catch(function () {});
  }

  document.addEventListener("input", function (ev) {
    var k = editingKeyFrom(ev.target);
    if (k) { lastEditing = k; editingAt = Date.now(); }
  }, true);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") beat();
  });

  beat();
  setInterval(beat, TTL_MS);
  setInterval(pollPresence, TTL_MS);
  setInterval(pollChanges, TTL_MS);
})(window);
