/* Rally Studio — puente de contenido en vivo.
 *
 * Escucha el buzón del servidor local (`/api/content/manifest`) y muestra las
 * propuestas que deja el agente (b) como tarjetas con Aceptar / Descartar.
 * Al aceptar, fusiona el contenido en el estado del usuario y avisa a app.js
 * por su mismo canal de sincronización.
 *
 * Este archivo NO toca la lógica de app.js ni de style.css: inyecta sus
 * propios estilos y solo escucha su canal público.
 */
(function () {
  "use strict";

  var POLL_MS = 2000;
  var STORAGE_KEY = "rally_studio_production_state_2026_v3";
  var CHANNEL_NAME = "rally_studio_auto_sync";
  var SEEN_KEY = "rally_content_seen";
  var DOCK_ID = "rally-content-dock";

  // Pestañas cuyo contenido va a un campo concreto del estado. Las que no
  // están aquí (canvas, timeline) todavía no tienen destino: no se aceptan.
  var CAMPOS_POR_TAB = {
    certamen: ["rally_type", "category", "hours_total"],
    team: ["team_name", "university", "city", "project_name", "team_logo_img"],
    challenges: ["challenge_id", "challenge_title"],
    solution: ["solution_raw_input", "solution_thesis", "solution_simple", "solution_approved"],
    impact: ["ods_ids", "national_plan_axis"],
    multi_ai: ["tasks"],
    resources: ["team_logo_img"],
    webdemo: ["site_url"]
  };

  var SUBIR_MS = 800;
  var MAX_FALLOS = 2;
  var REPOSO_MS = 10000;

  var fallos = 0;
  var salud = "ok";
  var proximoPoll = 0;
  var subidaPendiente = null;
  var suprimirSubida = 0;

  var rendered = Object.create(null);
  var busy = Object.create(null);
  var dock = null;

  function soportado() {
    return location.protocol === "http:" || location.protocol === "https:";
  }

  // -- utilidades -------------------------------------------------------

  function leerVistos() {
    try {
      var raw = sessionStorage.getItem(SEEN_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function marcarVisto(id) {
    try {
      var vistos = leerVistos();
      if (vistos.indexOf(id) === -1) {
        vistos.push(id);
        sessionStorage.setItem(SEEN_KEY, JSON.stringify(vistos));
      }
    } catch (e) {
      /* sin sessionStorage: se re-dibuja, no es grave */
    }
  }

  function yaVisto(id) {
    return leerVistos().indexOf(id) !== -1;
  }

  function textoDe(payload) {
    if (!payload || typeof payload !== "object") return "";
    if (typeof payload.text === "string") return payload.text;
    if (typeof payload.value === "string") return payload.value;
    return JSON.stringify(payload);
  }

  function filasDePresupuesto(payload) {
    var fuente = null;
    if (Array.isArray(payload)) fuente = payload;
    else if (payload && Array.isArray(payload.items)) fuente = payload.items;
    else if (payload && Array.isArray(payload.budget)) fuente = payload.budget;
    if (!fuente) return null;

    // El estado del tablero guarda el costo canónico en USD. Si la propuesta
    // declara córdobas, se convierte con la tasa BCN del estado.
    var estado = leerEstado();
    var tasa = Number(estado.exchange_rate_bcn) || 0;
    var moneda = String((payload && (payload.currency || payload.moneda)) || "").toUpperCase();
    var enCordobas = moneda === "NIO" || moneda === "C$" || moneda === "CORDOBAS" || moneda === "CÓRDOBAS";

    var filas = [];
    for (var i = 0; i < fuente.length; i++) {
      var it = fuente[i] || {};
      var units = Number(it.units);
      var unitCost = Number(it.unit_cost);
      if (!isFinite(units)) units = 1;
      if (!isFinite(unitCost)) unitCost = 0;
      var itemMoneda = String(it.currency || it.moneda || "").toUpperCase();
      var itemEnCordobas = itemMoneda === "NIO" || itemMoneda === "C$" || itemMoneda === "CORDOBAS" || itemMoneda === "CÓRDOBAS";
      if ((enCordobas || itemEnCordobas) && tasa > 0) {
        unitCost = unitCost / tasa;
      }
      var texto = String(it.element || it.concept || it.name || it.description || "");
      var fila = {
        // La tabla y los exports de app.js leen `element`; el dossier lee
        // `concept`. Se escriben los dos con el mismo valor.
        element: texto,
        concept: texto,
        category: String(it.category || "General"),
        units: units,
        unit_cost: unitCost
      };
      if (it.url) fila.url = String(it.url);
      filas.push(fila);
    }
    return filas;
  }

  // -- estado -----------------------------------------------------------

  function leerEstado() {
    var st = {};
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") st = parsed;
      }
    } catch (e) {
      st = {};
    }
    return st;
  }

  function asegurarForma(st) {
    if (!st.pautado || typeof st.pautado !== "object") {
      st.pautado = { problema: "", solucion: "", prefactibilidad: "", innovacion: "", impacto: "" };
    }
    if (!st.script || typeof st.script !== "object") {
      st.script = { acto1: "", acto2: "", acto3: "", acto4: "" };
    }
    if (!Array.isArray(st.budget)) st.budget = [];
    return st;
  }

  function escribirEstado(st, esRemoto) {
    // `active_tab` no se toca nunca: el puente no cambia de pestaña.
    if (!esRemoto) st._sync_ts = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
    } catch (e) {
      return;
    }

    // app.js escucha este canal; crear una instancia propia hace que la
    // pestaña que acepta también se refresque (el evento `storage` no se
    // dispara en la pestaña que escribe).
    try {
      if (typeof BroadcastChannel === "function") {
        var bc = new BroadcastChannel(CHANNEL_NAME);
        bc.postMessage({ type: "AUTO_SYNC_STATE", state: st });
        bc.close();
      } else {
        location.reload();
      }
    } catch (e) {
      try {
        location.reload();
      } catch (e2) {
        /* nada */
      }
    }

    // La sincronizacion del estado vive ahora en section_sync.js. Cada seccion
    // viaja sola y con version; aqui solo queda el buzon de propuestas.
  }

  function subirEstado() {
    // Compatibilidad con la API publica del puente. Ya no sube el estado
    // completo: section_sync.js manda solo las secciones que cambiaron.
  }

  function sincronizarRemoto() {
    return Promise.resolve();
  }

  function fusionar(env) {
    if (!env || typeof env !== "object") return false;
    var st = asegurarForma(leerEstado());
    var tab = env.tab;
    var slot = env.slot;
    var payload = env.payload;
    var cambio = false;

    if (tab === "pautado" && typeof st.pautado[slot] === "string") {
      st.pautado[slot] = textoDe(payload);
      cambio = true;
    } else if (tab === "script" && typeof st.script[slot] === "string") {
      st.script[slot] = textoDe(payload);
      cambio = true;
    } else if (tab === "budget") {
      var filas = filasDePresupuesto(payload);
      if (filas && filas.length) {
        st.budget = filas;
        cambio = true;
      }
    } else if (CAMPOS_POR_TAB[tab] && payload && typeof payload === "object") {
      var campos = CAMPOS_POR_TAB[tab];
      for (var i = 0; i < campos.length; i++) {
        var campo = campos[i];
        if (Object.prototype.hasOwnProperty.call(payload, campo)) {
          st[campo] = payload[campo];
          cambio = true;
        }
      }
    }

    if (!cambio) return false;
    escribirEstado(st);
    return true;
  }

  // -- red --------------------------------------------------------------

  function pedirJSON(url) {
    return fetch(url, { cache: "no-store", headers: cabeceras() }).then(function (res) {
      if (!res.ok) throw new Error("http " + res.status);
      return res.json();
    });
  }

  function postear(url) {
    return fetch(url, { method: "POST", cache: "no-store", headers: cabeceras() }).then(function (res) {
      if (!res.ok) throw new Error("http " + res.status);
      return res.json().catch(function () {
        return { ok: true };
      });
    });
  }

  function cabeceras() {
    var headers = {};
    try {
      var token = localStorage.getItem("rally_session_token");
      if (token) headers.Authorization = "Bearer " + token;
    } catch (e) {}
    return headers;
  }

  // -- interfaz ---------------------------------------------------------

  function asegurarDock() {
    if (dock && document.body.contains(dock)) return dock;
    if (!document.body) return null;

    dock = document.getElementById(DOCK_ID);
    if (!dock) {
      dock = document.createElement("div");
      dock.id = DOCK_ID;
      document.body.appendChild(dock);
    }
    inyectarEstilos();
    return dock;
  }

  function inyectarEstilos() {
    if (document.getElementById(DOCK_ID + "-styles")) return;
    var css =
      "#" + DOCK_ID + "{position:fixed;right:18px;bottom:18px;z-index:2147483000;" +
      "display:flex;flex-direction:column;gap:10px;max-width:360px;" +
      "font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
      "#" + DOCK_ID + ":empty{display:none}" +
      "#" + DOCK_ID + " .rally-content-card{background:#ffffff;border:1px solid #d7dced;" +
      "border-left:3px solid #1d45b9;border-radius:6px;padding:12px 14px;" +
      "box-shadow:0 8px 24px rgba(16,24,40,.18);color:#111827}" +
      "#" + DOCK_ID + " .rcc-head{display:flex;align-items:baseline;gap:8px;justify-content:space-between}" +
      "#" + DOCK_ID + " .rcc-title{font-size:13px;font-weight:700;line-height:1.3}" +
      "#" + DOCK_ID + " .rcc-badge{font-size:9px;letter-spacing:.08em;text-transform:uppercase;" +
      "background:#fde68a;color:#7c4a03;border-radius:3px;padding:2px 5px;white-space:nowrap}" +
      "#" + DOCK_ID + " .rcc-meta{font-size:11px;color:#5b6478;margin-top:4px;line-height:1.35}" +
      "#" + DOCK_ID + " .rcc-status{font-size:10px;color:#5b6478;background:#f6f7fb;" +
      "border:1px dashed #c7cede;border-radius:4px;padding:6px 8px;text-align:center}" +
      "#" + DOCK_ID + " .rcc-note{font-size:10px;color:#7c4a03;margin-top:8px}" +
      "#" + DOCK_ID + " .rcc-actions{display:flex;gap:8px;margin-top:10px}" +
      "#" + DOCK_ID + " button{font:inherit;font-size:11px;font-weight:600;cursor:pointer;" +
      "border-radius:4px;padding:5px 10px;border:1px solid #c7cede;background:#f6f7fb;color:#1f2937}" +
      "#" + DOCK_ID + " button[data-action='apply']{background:#1d45b9;border-color:#1d45b9;color:#fff}" +
      "#" + DOCK_ID + " button[disabled]{opacity:.55;cursor:default}";

    var style = document.createElement("style");
    style.id = DOCK_ID + "-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function puedeAceptar(tab) {
    if (tab === "pautado" || tab === "script" || tab === "budget") return true;
    return !!CAMPOS_POR_TAB[tab];
  }

  function crearTarjeta(item) {
    var card = document.createElement("div");
    card.className = "rally-content-card";
    card.setAttribute("data-proposal-id", item.id);

    var head = document.createElement("div");
    head.className = "rcc-head";

    var title = document.createElement("span");
    title.className = "rcc-title";
    title.textContent = item.title || "Propuesta";
    head.appendChild(title);

    if (item.simulated) {
      var badge = document.createElement("span");
      badge.className = "rcc-badge";
      badge.textContent = "Simulado";
      head.appendChild(badge);
    }

    var meta = document.createElement("div");
    meta.className = "rcc-meta";
    var partes = [item.tab, item.slot, item.source].filter(function (p) {
      return p;
    });
    meta.textContent = partes.join(" · ");

    var actions = document.createElement("div");
    actions.className = "rcc-actions";

    if (puedeAceptar(item.tab)) {
      var apply = document.createElement("button");
      apply.type = "button";
      apply.setAttribute("data-action", "apply");
      apply.textContent = "Aceptar";
      actions.appendChild(apply);
    }

    var discard = document.createElement("button");
    discard.type = "button";
    discard.setAttribute("data-action", "discard");
    discard.textContent = "Descartar";

    actions.appendChild(discard);

    card.appendChild(head);
    card.appendChild(meta);
    card.appendChild(actions);

    if (!puedeAceptar(item.tab)) {
      var nota = document.createElement("div");
      nota.className = "rcc-note";
      nota.textContent = "Esta pestaña todavía no tiene un campo donde mostrarla.";
      card.appendChild(nota);
    }
    return card;
  }

  function actualizarSalud() {
    var cont = asegurarDock();
    if (!cont) return;
    var nodo = cont.querySelector(".rcc-status");
    if (salud === "apagado") {
      if (!nodo) {
        nodo = document.createElement("div");
        nodo.className = "rcc-status";
        nodo.textContent = "Buzón local apagado — sin propuestas en vivo";
        cont.appendChild(nodo);
      }
    } else if (nodo && nodo.parentNode) {
      nodo.parentNode.removeChild(nodo);
    }
  }

  function quitarTarjeta(id) {
    delete rendered[id];
    var nodo = dock && dock.querySelector("[data-proposal-id='" + id + "']");
    if (nodo && nodo.parentNode) nodo.parentNode.removeChild(nodo);
  }

  function render(items) {
    var cont = asegurarDock();
    if (!cont) return;

    var vivos = Object.create(null);
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item || !item.id) continue;
      vivos[item.id] = true;
      if (yaVisto(item.id) || rendered[item.id]) continue;
      cont.appendChild(crearTarjeta(item));
      rendered[item.id] = true;
    }

    // Lo que ya no está en el manifiesto deja de mostrarse.
    for (var id in rendered) {
      if (!vivos[id]) quitarTarjeta(id);
    }
  }

  // -- acciones ---------------------------------------------------------

  function aceptar(id, boton) {
    if (busy[id]) return Promise.resolve(false);
    busy[id] = true;
    var ok = false;

    return pedirJSON("/api/content/" + encodeURIComponent(id))
      .catch(function () {
        return null; // ya aplicada en otra pestaña
      })
      .then(function (env) {
        return postear("/api/content/" + encodeURIComponent(id) + "/apply").then(function () {
          if (env) fusionar(env);
          marcarVisto(id);
          quitarTarjeta(id);
          ok = true;
        });
      })
      .catch(function () {
        // Fallo de red: el botón vuelve a estar vivo y la tarjeta se
        // re-dibuja en el próximo ciclo.
        if (boton) boton.disabled = false;
        delete rendered[id];
      })
      .then(function () {
        delete busy[id];
        return ok;
      });
  }

  function descartar(id, boton) {
    if (busy[id]) return Promise.resolve(false);
    busy[id] = true;
    var ok = false;

    return postear("/api/content/" + encodeURIComponent(id) + "/discard")
      .then(function () {
        marcarVisto(id);
        quitarTarjeta(id);
        ok = true;
      })
      .catch(function () {
        if (boton) boton.disabled = false;
        delete rendered[id];
      })
      .then(function () {
        delete busy[id];
        return ok;
      });
  }

  function alPulsar(event) {
    var boton = event.target.closest ? event.target.closest("button[data-action]") : null;
    if (!boton) return;
    var card = boton.closest("[data-proposal-id]");
    if (!card) return;

    var id = card.getAttribute("data-proposal-id");
    var accion = boton.getAttribute("data-action");
    boton.disabled = true;

    if (accion === "apply") aceptar(id, boton);
    else if (accion === "discard") descartar(id, boton);
  }

  // -- ciclo ------------------------------------------------------------

  function poll() {
    if (!soportado()) return Promise.resolve();
    if (salud === "apagado" && Date.now() < proximoPoll) return Promise.resolve();
    return pedirJSON("/api/content/manifest")
      .then(function (m) {
        fallos = 0;
        if (salud !== "ok") {
          salud = "ok";
          actualizarSalud();
        }
        var items = m && Array.isArray(m.items) ? m.items : [];
        render(items);
      })
      .catch(function () {
        fallos += 1;
        if (fallos >= MAX_FALLOS) {
          salud = "apagado";
          proximoPoll = Date.now() + REPOSO_MS;
          actualizarSalud();
        }
      });
  }

  function escucharCambios() {
    // La sincronizacion de estado vive en section_sync.js. El puente solo
    // escucha propuestas del buzon; no sube el estado completo.
  }

  function iniciar() {
    if (!soportado()) return;
    asegurarDock();
    if (dock) dock.addEventListener("click", alPulsar);
    poll();
    setInterval(poll, POLL_MS);
  }

  window.RallyContentBridge = {
    poll: poll,
    apply: aceptar,
    discard: descartar,
    _filas: filasDePresupuesto,
    _fusionar: fusionar,
    _salud: function () {
      return salud;
    },
    _subirEstado: subirEstado,
    _puedeAceptar: puedeAceptar
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
