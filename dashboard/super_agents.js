"use strict";
// dashboard/super_agents.js — Super Agentes ("Herramientas") del dashboard.
// Módulo autocontenido: no toca el motor (app.js). Núcleo puro arriba,
// arranque de UI abajo (Tasks 3–5 del plan 2026-10-21-super-agentes).
//
// Contrato con el resto del proyecto:
// - Lee, JAMÁS escribe, el estado del tablero
//   (localStorage["rally_studio_production_state_2026_v3"]).
// - La IA va SOLO por el servicio local (scripts/rally_service.py):
//   POST /api/ai + GET /api/ai/progress (cliente entra en Task 4).
// - Historial con llaves rally_super_agents_*.
// globalThis.RSAprocessablepure disponible para tests vía node:vm.

(function () {
  const STORE_KEY = "rally_studio_production_state_2026_v3";
  const HISTORY_KEY = "rally_super_agents_history_v1";

  // Espejo de dashboard/app.js (getPautadoLimit): nunca fuente creativa.
  const PAUTADO_LIMITS = {
    problema: 1250, solucion: 1250, impacto: 1000, innovacion: 1000, prefactibilidad: 1500
  };
  const PAUTADO_MIN = 150; // .agents/rules/pautado-y-guion.md (mínimo por sección)
  const PAUTADO_LABELS = {
    problema: "Problema", solucion: "Solución", impacto: "Impacto",
    innovacion: "Innovación", prefactibilidad: "Prefactibilidad"
  };
  // Espejo de app.js:8220 — exactamente 9 bloques.
  const CANVAS_KEYS = [
    "socios", "actividades", "propuesta", "relaciones", "segmentos",
    "recursos", "canales", "costes", "ingresos"
  ];
  // Decisión del dueño: mismo rango en ambos certámenes (Nacional en C$ con
  // la tasa BCN de la conversión; USD canónico siempre en el estado).
  const BUDGET_MIN_USD = 4000;
  const BUDGET_MAX_USD = 6000;
  // .agents/rules/pautado-y-guion.md: locución 130–140 palabras/min → ~135.
  // Duración estimada = palabras / 2.25 segundos.
  const WPS = 2.25;
  const WORDS_MIN = 240;
  const WORDS_MAX = 270;

  const MOD = {};

  function p(severity, title, evidence) {
    return { title: String(title), severity, evidence: String(evidence == null ? "" : evidence) };
  }
  function countWords(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }
  function normalize(text) {
    return String(text || "").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  // Escapa TODO texto no controlado antes de innerHTML. El valor de la IA, el
  // texto extraído de un documento y la respuesta externa son datos hostiles:
  // un prompt-injection puede devolver <img onerror=…> dentro del JSON.
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  MOD.esc = esc;
  // Las rúbricas piden "Crítico"/"Cumple"; la IA puede devolver "critico" o
  // "Cumple " — se compara normalizado, se muestra el texto original.
  MOD._labelClass = function _labelClass(label) {
    const s = normalize(label);
    if (!s) return "soft";
    if (s === "cumple") return "ok";
    if (s === "parcial") return "warn";
    if (s === "falla" || s === "critico") return "err";
    if (s === "mejora") return "warn";
    return "soft";
  };
  MOD._countCritical = function _countCritical(problemas) {
    return (Array.isArray(problemas) ? problemas : []).filter(function (p) {
      return normalize((p && (p.severidad || p.severity)) || "") === "critico";
    }).length;
  };
  function fmt(n) {
    return Number(n).toLocaleString("en-US");
  }
  // Decisión 12 de la spec: montos literales solamente. Números ≥ 1000 en
  // textos de costes/ingresos de canvas; la semántica la lleva la IA.
  function amountsOf(text) {
    const out = [];
    const re = /\d[\d.,]*(?=[^\d]|$)/g;
    const t = String(text || "");
    let m;
    while ((m = re.exec(t)) !== null) {
      const n = parseFloat(m[0].replace(/[.,]/g, ""));
      if (n >= 1000) out.push(n);
    }
    return out;
  }
  // Primera frase literal (≥ minLen caracteres ya normalizados) compartida
  // entre dos textos. Matching exacto, nada difuso.
  function sharedPhrase(a, b, minLen) {
    if (!a || a.length < minLen || !b || b.length < minLen) return "";
    for (let i = 0; i + minLen <= a.length; i++) {
      const sub = a.slice(i, i + minLen);
      if (b.includes(sub)) return sub;
    }
    return "";
  }

  // ── Estado (solo lectura) ────────────────────────────────────────────────
  MOD.readState = function readState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const st = raw ? JSON.parse(raw) : {};
      return st && typeof st === "object" ? st : {};
    } catch (e) {
      return {};
    }
  };

  // ── Checks locales deterministas ─────────────────────────────────────────
  MOD.scriptChecks = function scriptChecks(state, projectName) {
    const problems = [];
    const script = state && state.script;
    if (!script) return { problems };
    const quáli = [];
    const actNames = ["Acto I", "Acto II", "Acto III", "Acto IV"];
    const acts = [script.acto1, script.acto2, script.acto3, script.acto4];
    let total = 0;
    acts.forEach((t, i) => {
      const w = countWords(t);
      total += w;
      if (w === 0) problems.push(p("Critico", actNames[i] + " está vacío", "El acto " + (i + 1) + " del guion no tiene texto."));
    });
    if (total > 0) {
      const secs = Math.round(total / WPS);
      if (secs > 120) problems.push(p("Critico", "Duración estimada supera 120 s (" + secs + " s)", total + " palabras a ~135 palabras/min."));
      if (total < WORDS_MIN || total > WORDS_MAX) {
        problems.push(p("Mejora", "Palabras fuera del rango 240–270: " + total, "El guion completo tiene " + total + " palabras."));
      }
    }
    const pn = projectName && String(projectName).trim();
    if (pn && acts[0]) {
      const nc = normalize(acts[0]);
      const npn = normalize(pn);
      if (nc && npn && nc.includes(npn)) {
        problems.push(p("Critico", "Acto I menciona el nombre del proyecto (prohibido)", "Los primeros 20 s no llevan nombre ni logo del proyecto."));
      }
    }
    return { problems };
  };

  MOD.pautadoChecks = function pautadoChecks(state) {
    const problems = [];
    const pa = state && state.pautado && typeof state.pautado === "object" ? state.pautado : null;
    const esNac = state && state.rally_type === "nacional";
    if (!pa) {
      problems.push(p("Mejora", "El pautado está vacío: llénalo en la pestaña 06", ""));
      return { problems };
    }
    const keys = Object.keys(PAUTADO_LIMITS);
    if (keys.every((k) => !String(pa[k] || "").trim())) {
      problems.push(p("Mejora", "El pautado está vacío: llénalo en la pestaña 06", ""));
      return { problems };
    }
    const norm = {};
    keys.forEach((k) => { norm[k] = normalize(pa[k] || ""); });
    keys.forEach((k) => {
      const len = String(pa[k] || "").length;
      const limit = esNac ? null : PAUTADO_LIMITS[k];
      if (limit !== null && len > limit) {
        problems.push(p("Critico", PAUTADO_LABELS[k] + ": " + len + " caracteres exceden el tope " + limit + " del pautado", len + " > " + limit + " caracteres"));
      }
      if (limit !== null && len < PAUTADO_MIN) {
        problems.push(p("Mejora", PAUTADO_LABELS[k] + ": " + len + " caracteres (mínimo 150)", "La sección " + k + " es corta."));
      }
      if (limit === null && len === 0) {
        problems.push(p("Mejora", PAUTADO_LABELS[k] + ": sección vacía", "En Nacional no hay tope, pero la sección no puede quedar vacía."));
      }
    });
    // Datos repetidos entre secciones: frases literales ≥ 25 caracteres.
    for (let i = 0; i < keys.length; i++) {
      const a = norm[keys[i]];
      for (let j = i + 1; j < keys.length; j++) {
        const b = norm[keys[j]];
        const dup = sharedPhrase(a, b, 25);
        if (dup) {
          problems.push(p("Mejora", "Dato repetido en secciones " + PAUTADO_LABELS[keys[i]] + " y " + PAUTADO_LABELS[keys[j]], "Frase literal repetida (" + dup.length + " caracteres): \"" + dup.slice(0, 40) + "…\" Cada sección debe aportar información nueva."));
        }
      }
    }
    // Nombre del proyecto: máximo 1 mención por sección.
    const pn = normalize(state && state.project_name || "");
    if (pn) {
      keys.forEach((k) => {
        const c = norm[k].split(pn).length - 1;
        if (c > 1) {
          problems.push(p("Mejora", "El nombre del proyecto aparece " + c + " veces en " + PAUTADO_LABELS[k] + " (máximo 1 por sección)", "Sección " + k + "."));
        }
      });
    }
    return { problems };
  };

  MOD.budgetChecks = function budgetChecks(state) {
    const problems = [];
    const rows = state && Array.isArray(state.budget) ? state.budget : [];
    let totalUsd = 0;
    rows.forEach((r) => {
      const name = (r && (r.element || r.concept)) || "sin nombre";
      const units = Number(r && r.units) || 0;
      const cost = Number(r && r.unit_cost) || 0;
      totalUsd += units * cost;
      if (units <= 0) problems.push(p("Critico", "Fila '" + name + "': units debe ser > 0", "units=" + units));
      if (!r || !r.url) problems.push(p("Mejora", "Fila '" + name + "': sin URL de respaldo", "Cada fila necesita enlace del proveedor."));
    });
    const inRange = totalUsd >= BUDGET_MIN_USD && totalUsd <= BUDGET_MAX_USD;
    if (!inRange) {
      const esNac = state && state.rally_type === "nacional";
      const rate = esNac ? Number(state.exchange_rate_bcn) || 0 : 0;
      if (esNac && rate > 0) {
        const lo = Math.round(BUDGET_MIN_USD * rate);
        const hi = Math.round(BUDGET_MAX_USD * rate);
        problems.push(p("Critico", "Presupuesto fuera de rango: " + fmt(totalUsd) + " USD = " + fmt(Math.round(totalUsd * rate)) + " C$ (rango " + fmt(lo) + "–" + fmt(hi) + " C$)", "Rango $4,000–$6,000 USD convertido con tasa " + rate + " del BCN."));
      } else {
        problems.push(p("Critico", "Presupuesto fuera de rango: $" + fmt(totalUsd) + " USD (rango $4,000–$6,000 USD)", "Suma de units × unit_cost."));
      }
    }
    return { problems, totalUsd };
  };

  MOD.canvasChecks = function canvasChecks(state) {
    const problems = [];
    const canvas = state && state.model_canvas && typeof state.model_canvas === "object" ? state.model_canvas : {};
    const missing = CANVAS_KEYS.filter((k) => !String(canvas[k] || "").trim());
    if (missing.length) {
      problems.push(p("Mejora", "Faltan " + missing.length + " de 9 bloques del canvas: " + missing.join(", "), "Lista completa de bloques: " + CANVAS_KEYS.join(", ") + "."));
    }
    const total = MOD.budgetChecks(state).totalUsd;
    const shown = Math.round(total);
    if (shown > 0) {
      ["costes", "ingresos"].forEach((k) => {
        const amounts = amountsOf(canvas[k] || "");
        // Un canvas itemizado ("2,000 + 3,000 = 5,000") incluye componentes
        // además del total: avisar solo si NINGÚN monto coincide.
        if (!amounts.length || amounts.some((n) => n === shown)) return;
        problems.push(p("Mejora",
          "Canvas '" + k + "' no coincide con el presupuesto (cita " + amounts.map(fmt).join(", ") +
            "; el presupuesto suma " + fmt(shown) + ")",
          "Montos en canvas = " + amounts.join(", ") + "; presupuesto totalUsd = " + String(shown) + " USD (Alerta de Discrepancia Númérica)."));
      });
    }
    return { problems };
  };

  MOD.shotlistChecks = function shotlistChecks(state) {
    const problems = [];
    const plan = state && Array.isArray(state.shot_plan) ? state.shot_plan : [];
    if (!plan.length) return { problems };
    const seen = new Set();
    plan.forEach((row) => {
      const id = String((row && row.id) || "").trim();
      if (!id) return;
      if (seen.has(id)) {
        problems.push(p("Mejora", "Shotlist: id duplicado '" + id + "' en el plan de tomas", "Dos tomas comparten el id " + id + "."));
      }
      seen.add(id);
    });
    const ids = Array.from(seen);
    // Los ids vienen del estado (sincronizado/importado): escapar antes de
    // meterlos en un RegExp o un id como "a1(" rompe el panel entero.
    const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = ids.length
      ? new RegExp("^asset_(" + ids.map(escRe).join("|") + ")_[a-z0-9_\\-]+\\.[a-z0-9]+$", "i")
      : null;
    const items = state && state.video_assets && Array.isArray(state.video_assets.items) ? state.video_assets.items : [];
    items.forEach((it) => {
      const name = String((it && it.name) || "");
      if (!name) return;
      if (!re || !re.test(name)) {
        problems.push(p("Sugerencia", "Asset '" + name + "' no sigue la convención asset_<id>_<descripción>.<ext>", "Nombres de assets: asset_<shotlist_id>_<descripcion>.<ext>"));
      }
    });
    return { problems };
  };

  // ── Prompts (decisión 11: la tarea y el formato va dentro) ────────────────
  function contentBlock(agentId, state) {
    const vacio = "(sin contenido aún en la pestaña correspondiente)";
    if (agentId === "guion") {
      const s = (state && state.script) || {};
      return "Acto I: " + (s.acto1 || vacio) + "\nActo II: " + (s.acto2 || vacio) +
        "\nActo III: " + (s.acto3 || vacio) + "\nActo IV: " + (s.acto4 || vacio);
    }
    if (agentId === "presupuesto") {
      const rows = state && Array.isArray(state.budget) ? state.budget : [];
      if (!rows.length) return vacio;
      return rows.map((r) => "- " + ((r && (r.element || r.concept)) || "sin nombre") +
        " | " + ((r && r.category) || "") + " | unidades " + ((r && r.units) || 0) +
        " | costo unitario " + fmt((r && r.unit_cost) || 0) + " | " + ((r && r.url) || "sin URL")).join("\n");
    }
    if (agentId === "pautado") {
      const pa = (state && state.pautado) || {};
      return Object.keys(PAUTADO_LIMITS).map((k) => PAUTADO_LABELS[k] + ": " + (pa[k] || vacio)).join("\n\n");
    }
    if (agentId === "canvas") {
      const c = (state && state.model_canvas) || {};
      return CANVAS_KEYS.map((k) => k + ": " + (c[k] || vacio)).join("\n\n");
    }
    if (agentId === "videoEditor") {
      const plan = state && Array.isArray(state.shot_plan) ? state.shot_plan : [];
      if (!plan.length) return vacio;
      return plan.map((r) => "- " + (r && r.id) + " (" + (r && r.acto) + "): " + (r && r.label)).join("\n");
    }
    if (agentId === "docs") {
      // El texto del documento llega por extra.docText (extracción del panel);
      // no hay copia en el estado del proyecto.
      return vacio;
    }
    return vacio;
  }

  MOD.buildPrompt = function buildPrompt(agentCfg, rubricAgent, state, mode, extra) {
    const st = state || {};
    const cfg = agentCfg || {};
    const rub = rubricAgent || { reglas: [], promptTarea: {}, salidaEsperada: {} };
    const ext = extra || null;
    const parts = [];
    parts.push("[ROL]\nEres el Super Agente \"" + (cfg.name || cfg.id) + "\" del Rally Studio, asesor experto del certamen. Ayudas a un equipo de innovación a ganar evaluación perfecta.");
    parts.push("[RÚBRICA ACTIVA]\n" + (rub.reglas || []).map((r) => "- " + r.texto + " (ref: " + r.ref + ")").join("\n"));
    const ctxLines = ["- Certamen: " + (st.rally_type || "sin definir")];
    if (st.project_name) ctxLines.push("- Proyecto: " + st.project_name);
    if (st.challenge_title) ctxLines.push("- Reto: " + st.challenge_title);
    if (st.solution_thesis) ctxLines.push("- Solución: " + st.solution_thesis);
    if (st.exchange_rate_bcn) ctxLines.push("- Tasa BCN: " + st.exchange_rate_bcn + " C$/USD");
    parts.push("[CONTEXTO DEL PROYECTO]\n" + ctxLines.join("\n"));
    parts.push("[CONTENIDO ACTUAL]\n" + contentBlock(cfg.id, st));
    const tarea = (rub.promptTarea && rub.promptTarea[mode]) ||
      (mode === "externa" ? ((rub.promptTarea && rub.promptTarea.directo) || "") : "");
    const tareaTxt = mode === "externa"
      ? "Contrastá la RESPUESTA EXTERNA contra la rúbrica activa y el contenido actual: marcá qué sirve, qué falta y qué corregir.\n" + tarea
      : tarea;
    parts.push("[TAREA]\n" + tareaTxt);
    if (mode === "externa" && ext && ext.externalText) {
      parts.push("[RESPUESTA EXTERNA A CONTRASTAR]\n" +
        "Lo siguiente lo produjo otra IA fuera del proyecto. Contrastalo contra la r\u00fabrica activa:\n" +
        "<<<RESPUESTA_EXTERNA\n" + String(ext.externalText) + "\nRESPUESTA_EXTERNA>>>");
    }
    if (ext && ext.docText) {
      parts.push("[CONTENIDO DEL DOCUMENTO]\n" + String(ext.docText));
    }
    let salida = (rub.salidaEsperada && rub.salidaEsperada[mode]) ||
      (mode === "externa" ? ((rub.salidaEsperada && rub.salidaEsperada.directo) || "") : "");
    let salidaTxt = salida;
    if (mode === "directo" || mode === "externa") {
      salidaTxt += (salidaTxt ? "\n" : "") +
        "Responde EXCLUSIVAMENTE con JSON válido:\n" +
        '{"veredictos":[{"criterio":"...","estado":"Cumple|Parcial|Falla"}],' +
        ' "problemas":[{"titulo":"...","severidad":"Critico|Mejora|Sugerencia","evidencia":"...","correccion":"..."}],' +
        ' "ajustes":[{"texto de reemplazo","tab","slot"}],' +
        ' "visuales":["..."]}';
    }
    parts.push("[FORMATO DE SALIDA]\n" + salidaTxt);
    return parts.join("\n\n");
  };

  // ── Resultado de IA (JSON estructurado o crudo, nunca inventa) ────────────
  const AI_KEYS = ["veredictos", "problemas", "ajustes", "visuales"];
  MOD.parseAIResult = function parseAIResult(text) {
    const s = String(text == null ? "" : text);
    const i = s.indexOf("{");
    if (i < 0) return { format: "raw", text: s };
    const j = s.lastIndexOf("}");
    if (j <= i) return { format: "raw", text: s };
    try {
      const data = JSON.parse(s.slice(i, j + 1));
      if (data && typeof data === "object" && AI_KEYS.some((k) => k in data)) {
        return { format: "json", data };
      }
    } catch (e) { /* cae a raw */ }
    return { format: "raw", text: s };
  };

  // ── Historial (máx 10 por agente, más nuevo primero) ─────────────────────
  MOD.historyList = function historyList(agentId) {
    try {
      const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
      return Array.isArray(h && h[agentId]) ? h[agentId].slice(0, 10) : [];
    } catch (e) {
      return [];
    }
  };
  MOD.historyAdd = function historyAdd(agentId, entry) {
    let h = {};
    try { h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}"); } catch (e) { h = {}; }
    if (!h || typeof h !== "object") h = {};
    const list = Array.isArray(h[agentId]) ? h[agentId].filter(Boolean) : [];
    const rec = Object.assign({ ts: Date.now() }, entry || {});
    list.unshift(rec);
    h[agentId] = list.slice(0, 10);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch (e) { /* storage lleno */ }
    return h[agentId];
  };

  // ── Task 4: cliente IA local (solo el servicio :8000, sin claves ni fallback duplicado) ──
  const AI_BASE = "http://localhost:8000/api/ai";
  const FETCH_TIMEOUT_MS = 10000;
  const POST_TIMEOUT_MS = 45000; // POST /api/ai puede listar modelos del CLI (cold cache)
  const POLL_MS = 2000;
  const MAX_POLLS = 150; // 5 min de techo: un job colgado no puede poll-ear para siempre

  MOD._classifyAIResponse = function _classifyAIResponse(res) {
    if (!res || typeof res !== "object" || !res.body || typeof res.body !== "object") {
      return { kind: "down", message: "buz\u00f3n local apagado: el servicio no respondi\u00f3" };
    }
    const body = res.body;
    if (res.status === 429 && body.status === "rate-limit") {
      return { kind: "rate-limit", message: body.message || "l\u00edmite de uso alcanzado" };
    }
    if (typeof body.status === "string") {
      if (body.status === "started") return { kind: "started", job: body.job, provider: body.provider || body.model || "" };
      if (body.status === "done") return { kind: "done", text: body.text || "", provider: body.provider || body.model || "" };
      if (body.status === "error") return { kind: "error", message: body.message || "error del servicio" };
      if (body.status === "no-provider") return { kind: "no-provider", message: body.message || "sin proveedor de IA configurado" };
      if (body.status === "running" || body.status === "queued") {
        return { kind: "running", message: body.message || "" };
      }
      return { kind: "running", message: body.message || ("estado de job: " + body.status) };
    }
    return { kind: "down", message: body.message || ("servicio respondi\u00f3 HTTP " + res.status) };
  };

  function fetchWithTimeout(url, opts, timeoutMs) {
    const ctrl = new AbortController();
    const t = setTimeout(function () { ctrl.abort(); }, timeoutMs || FETCH_TIMEOUT_MS);
    return fetch(url, Object.assign({}, opts, { signal: ctrl.signal })).finally(function () { clearTimeout(t); });
  }

  // Un solo análisis activo: abrir/cerrar el panel o lanzar otro corta el poll
  // (sin jobs huérfanos ni resultado de un run viejo pisando el panel nuevo).
  let activeRun = null;
  MOD.cancelAnalysis = function cancelAnalysis() {
    if (activeRun) { activeRun.cancelled = true; activeRun = null; }
  };

  // analyze(promptText, onProgress?) → Promise<{ok:true,text,provider} | {ok:false,status,message}>
  MOD.analyze = function analyze(promptText, onProgress) {
    MOD.cancelAnalysis();
    const run = { cancelled: false };
    activeRun = run;
    return new Promise(function (resolve) {
      let p = typeof onProgress === "function" ? onProgress : function () {};
      fetchWithTimeout(AI_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: String(promptText || "") })
      }, POST_TIMEOUT_MS)
        .then(function (r) { return r.json().then(function (b) { return { status: r.status, body: b }; }); })
        .then(function (r) { return MOD._classifyAIResponse(r); })
        .then(function (cls) {
          if (run.cancelled) { resolve({ ok: false, status: "cancelled", message: "análisis cancelado" }); return; }
          if (cls.kind !== "started") { p(cls); resolve(fail(cls)); return; }
          pollJob(cls.job, p, resolve, run, 0);
        })
        .catch(function (err) {
          if (run.cancelled) { resolve({ ok: false, status: "cancelled", message: "análisis cancelado" }); return; }
          const slow = err && err.name === "AbortError";
          const cls = slow
            ? { kind: "timeout", message: "el servicio tardó en responder (no está apagado): reintenta en unos segundos" }
            : MOD._classifyAIResponse(null);
          p(cls);
          resolve(fail(cls));
        });
      function fail(cls) { return { ok: false, status: cls.kind, message: cls.message || "sin respuesta" }; }
    });
  };

  function pollJob(job, p, resolve, run, count) {
    if (run.cancelled) { resolve({ ok: false, status: "cancelled", message: "análisis cancelado" }); return; }
    if (count >= MAX_POLLS) {
      const cls = { kind: "timeout", message: "la IA lleva más de 5 minutos sin terminar; revisa el proveedor y vuelve a intentar" };
      p(cls);
      resolve({ ok: false, status: "timeout", message: cls.message });
      return;
    }
    fetchWithTimeout(AI_BASE + "/progress?job=" + encodeURIComponent(job))
      .then(function (r) { return r.json().then(function (b) { return { status: r.status, body: b }; }); })
      .then(function (r) {
        if (run.cancelled) { resolve({ ok: false, status: "cancelled", message: "análisis cancelado" }); return; }
        const cls = MOD._classifyAIResponse(r);
        if (cls.kind === "done") { p(cls); resolve({ ok: true, text: cls.text, provider: cls.provider }); return; }
        if (cls.kind === "error") { p(cls); resolve({ ok: false, status: "error", message: cls.message }); return; }
        if (cls.kind === "down") { p(cls); resolve({ ok: false, status: "down", message: cls.message }); return; }
        setTimeout(function () { pollJob(job, p, resolve, run, count + 1); }, POLL_MS);
      })
      .catch(function (err) {
        if (run.cancelled) { resolve({ ok: false, status: "cancelled", message: "análisis cancelado" }); return; }
        const slow = err && err.name === "AbortError";
        const cls = slow
          ? { kind: "timeout", message: "el servicio tardó en responder al consultar el progreso" }
          : MOD._classifyAIResponse(null);
        p(cls);
        resolve({ ok: false, status: cls.kind, message: cls.message });
      });
  }

  // Chip de proveedor: GET /api/ai/status tolerante a falla.
  MOD.aiStatus = function aiStatus() {
    return fetchWithTimeout(AI_BASE + "/status")
      .then(function (r) { return r.json(); })
      .then(function (b) { return b && typeof b === "object" ? b : {}; })
      .catch(function (err) {
        return {
          status: "down",
          message: err && err.name === "AbortError"
            ? "el servicio tardó en responder (¿está ocupado?)"
            : "buzón local apagado"
        };
      });
  };

  MOD.POLL_MS = POLL_MS;

  // ── Task 5: Analizador de Documentos ─────────────────────────────────────
  const DOC_MAX = 24000;
  MOD.truncateWithNotice = function truncateWithNotice(text, max) {
    const m = max || DOC_MAX;
    const s = String(text == null ? "" : text);
    return {
      text: s.slice(0, m),
      originalLength: s.length,
      truncated: s.length > m
    };
  };
  MOD.DOC_MAX = DOC_MAX;

  // extractDoc(file, onStage) → {text, source:"pdf"|"docx"|"ocr", pages, truncated}
  // Solo navegador: requiere FileReader / pdf.js / mammoth / tesseract.js (ya cargadas).
  MOD.extractDoc = function extractDoc(file, onStage) {
    const stage = (typeof onStage === "function") ? onStage : function () {};
    return new Promise(function (resolve, reject) {
      if (!file || !file.name) { reject(new Error("no se reconoció el archivo")); return; }
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const reader = new FileReader();
      reader.onerror = function () { reject(new Error("no se pudo leer el archivo")); };
      stage("Leyendo " + file.name + "…");

      if (ext === "docx") {
        reader.onload = function () {
          const M = window.mammoth;
          if (!M || !M.extractRawText) { reject(new Error("mammoth no está disponible en esta página")); return; }
          stage("Extrayendo texto del DOCX…");
          M.extractRawText({ arrayBuffer: reader.result })
            .then(function (r) {
              const t = RSA.truncateWithNotice(r.value || "", DOC_MAX);
              resolve({ text: t.text, source: "docx", pages: null, truncated: t.truncated, originalLength: t.originalLength });
            })
            .catch(function (e) { reject(new Error("el DOCX no se pudo leer: " + (e && e.message || "error"))); });
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      if (ext === "pdf") {
        reader.onload = function () {
          const PDF = window.pdfjsLib;
          if (!PDF || !PDF.getDocument) { reject(new Error("pdf.js no está disponible en esta página")); return; }
          stage("Abriendo PDF…");
          PDF.getDocument({ data: reader.result }).promise.then(function (pdf) {
            const n = pdf.numPages;
            const head = Math.min(n, 60);
            const pages = [];
            let p = 1;
            function next() {
              if (p > head) { finish(); return; }
              pdf.getPage(p).then(function (page) {
                return page.getTextContent();
              }).then(function (tc) {
                const txt = tc.items.map(function (i) { return i.str; }).join(" ").trim();
                pages.push(txt);
                stage("Página " + p + " de " + head + "…");
                p += 1;
                setTimeout(next, 0);
              }).catch(function () { pages.push(""); p += 1; setTimeout(next, 0); });
            }
            function finish() {
              const native = pages.filter(Boolean).length;
              if (native > 0) {
                stage("Texto nativo extraído (" + native + "/" + head + " páginas con texto).");
                const all = pages.join("\n\n");
                const t = RSA.truncateWithNotice(all, DOC_MAX);
                resolve({ text: t.text, source: "pdf", pages: head, truncated: t.truncated, originalLength: t.originalLength });
                return;
              }
              // PDF escaneado: OCR solo primeras páginas (aviso cuántas).
              stage("Sin texto nativo — OCR con tesseract sobre las primeras 3 páginas…");
              const ocrPages = Math.min(n, 3);
              const ocrTexts = [];
              let op = 1;
              const T = window.Tesseract;
              if (!T || !T.recognize) { reject(new Error("tesseract no está disponible para leer un PDF escaneado")); return; }
              function ocrNext() {
                if (op > ocrPages) {
                  const all = ocrTexts.filter(Boolean).join("\n\n");
                  const t = RSA.truncateWithNotice(all, DOC_MAX);
                  resolve({ text: t.text, source: "ocr", pages: ocrPages, truncated: t.truncated, originalLength: t.originalLength });
                  return;
                }
                pdf.getPage(op).then(function (page) {
                  const vp = page.getViewport({ scale: 2 });
                  const cv = document.createElement("canvas");
                  cv.width = vp.width; cv.height = vp.height;
                  return page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise.then(function () {
                    return T.recognize(cv);
                  });
                }).then(function (r) {
                  ocrTexts.push((r && r.data && r.data.text || "").trim());
                  stage("OCR página " + op + " de " + ocrPages + "…");
                  op += 1;
                  setTimeout(ocrNext, 0);
                }).catch(function (e) { reject(new Error("el OCR falló: " + (e && e.message || "error"))); });
              }
              ocrNext();
            }
            next();
          }).catch(function (e) { reject(new Error("el PDF se abrió pero no se pudo leer: " + (e && e.message || "error"))); });
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      if (ext === "txt" || ext === "md") {
        reader.onload = function () {
          const t = RSA.truncateWithNotice(String(reader.result || ""), DOC_MAX);
          resolve({ text: t.text, source: "txt", pages: null, truncated: t.truncated, originalLength: t.originalLength });
        };
        reader.readAsText(file);
        return;
      }

      reject(new Error("formato no soportado (" + (ext || "desconocido") + "). Sube PDF, DOCX, TXT o MD."));
    });
  };

  globalThis.RSA = MOD;

  // ── Arranque de UI (Tasks 3–5): navegador con #topbar presente ──────────
  if (typeof window !== "undefined" && window.document) {
    bootDashboardUI(MOD);
  }

  function bootDashboardUI(RSA) {
    // — Iconos SVG inline monocromos (prohibido el emoji) —
    const svgOf = function (inner) {
      return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
    };
    const ICONS = {
      wrench: svgOf('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/>'),
      claqueta: svgOf('<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.6-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>'),
      tabla: svgOf('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M3 14h18"/><path d="M9 9v11"/>'),
      folios: svgOf('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>'),
      cuadricula: svgOf('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
      documento: svgOf('<path d="M14 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="11.5" r="2.5"/><path d="m14.6 14.1 1.9 1.9"/>'),
      cortes: svgOf('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88"/><path d="M14.47 14.48 20 20"/><path d="M8.12 8.12 12 12"/>')
    };

    // — Registro de los 6 agentes (Task 3): datos puros, sin handlers IA —
    const AGENTS = [
      {
        id: "guion", nombre: "Revisor de Guión", icono: ICONS.claqueta, tab: "script",
        checksFn: (st) => RSA.scriptChecks(st, st.project_name),
        isEmpty: (st) => !(st.script && ["acto1", "acto2", "acto3", "acto4"].some((k) => String(st.script[k] || "").trim())),
        emptyMsg: "tu guión está vacío — llénalo en la pestaña 10 (Guion 120s)"
      },
      {
        id: "presupuesto", nombre: "Analizador de Presupuesto", icono: ICONS.tabla, tab: "budget",
        checksFn: (st) => RSA.budgetChecks(st),
        isEmpty: (st) => !(Array.isArray(st.budget) && st.budget.length),
        emptyMsg: "tu presupuesto está vacío — llénalo en la pestaña 07 (Presupuesto de Marcha)"
      },
      {
        id: "pautado", nombre: "Analizador de Pautado", icono: ICONS.folios, tab: "pautado",
        checksFn: (st) => RSA.pautadoChecks(st),
        isEmpty: (st) => {
          const pa = st.pautado;
          return !(pa && typeof pa === "object" && Object.keys(pa).length &&
            Object.keys(pa).some((k) => String(pa[k] || "").trim()));
        },
        emptyMsg: "tu pautado está vacío — llénalo en la pestaña 06 (Pautado Oficial)"
      },
      {
        id: "canvas", nombre: "Analizador de Canvas", icono: ICONS.cuadricula, tab: "canvas",
        checksFn: (st) => RSA.canvasChecks(st),
        isEmpty: (st) => {
          const c = st.model_canvas;
          return !(c && typeof c === "object" && Object.keys(c).some((k) => String(c[k] || "").trim()));
        },
        emptyMsg: "tu canvas está vacío — llénalo en la pestaña 09 (Modelo Canvas)"
      },
      {
        id: "docs", nombre: "Analizador de Documentos", icono: ICONS.documento, tab: null,
        checksFn: null, isEmpty: null, emptyMsg: null
      },
      {
        id: "videoEditor", nombre: "Guía de Editor de Video", icono: ICONS.cortes, tab: "resources",
        checksFn: (st) => ({ problems: RSA.scriptChecks(st, st.project_name).problems.concat(RSA.shotlistChecks(st).problems) }),
        isEmpty: (st) => !((Array.isArray(st.shot_plan) && st.shot_plan.length) ||
          (st.video_assets && Array.isArray(st.video_assets.items) && st.video_assets.items.length)),
        emptyMsg: "sin plan de tomas ni materiales — levántalos en la pestaña 08 (Bóveda de Recursos)"
      }
    ];

    const esc = RSA.esc; // una sola implementación, testeada en el núcleo
    function el(tag, cls, html) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html != null) n.innerHTML = html;
      return n;
    }
    function copyText(text, done) {
      const fallback = function () {
        const ta = el("textarea", "rsa-static-ta");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) { /* sin portapapeles */ }
        document.body.removeChild(ta);
        done && done(true);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done && done(true); }, fallback);
      } else { fallback(); }
    }
    function jump(tab) {
      // switchTab es la función pública de app.js (app.js:2219).
      if (tab && typeof window.switchTab === "function") {
        window.switchTab(tab);
        closeOverlays();
      }
    }
    // Rúbrica del agente: reglas propias + reglas del certamen activo.
    function rubricFor(agentId, rallyType) {
      const R = window.RSA_RUBRICS;
      if (!R || !R[agentId]) return null;
      const pt = (rallyType && R.porTipo && R.porTipo[rallyType]) || {};
      return {
        reglas: (R[agentId].reglas || []).concat(pt.reglas || []),
        promptTarea: (pt.promptTarea && pt.promptTarea[agentId]) ?
          Object.assign({}, R[agentId].promptTarea, pt.promptTarea[agentId]) : (R[agentId].promptTarea || {}),
        salidaEsperada: (pt.salidaEsperada && pt.salidaEsperada[agentId]) ?
          Object.assign({}, R[agentId].salidaEsperada, pt.salidaEsperada[agentId]) : (R[agentId].salidaEsperada || {})
      };
    }
    // Carga dinámica de super_agents_rubrics.js (una sola vez). El módulo no
    // está en index.html porque ahí solo se permiten 2 líneas nuevas.
    function ensureRubrics(done) {
      if (window.RSA_RUBRICS) { done && done(true); return; }
      if (document.getElementById("rsa-rubrics-script")) { done && done(false); return; }
      const s = document.createElement("script");
      s.id = "rsa-rubrics-script";
      s.src = "super_agents_rubrics.js";
      s.onload = function () { done && done(true); };
      s.onerror = function () { done && done(false); };
      document.head.appendChild(s);
    }

    // — Overlays compartidos (menú + panel) —
    let overlay = null;
    function makeOverlay() {
      overlay = el("div", "rsa-overlay");
      overlay.addEventListener("mousedown", function (ev) {
        if (ev.target === overlay) closeOverlays();
      });
      document.body.appendChild(overlay);
      return overlay;
    }
    function closeOverlays() {
      // Cerrar el panel corta el análisis en curso (un job huérfano sigue
      // quemando cupo del proveedor y su resultado ya no tiene dónde ir).
      if (typeof RSA.cancelAnalysis === "function") RSA.cancelAnalysis();
      if (overlay) { overlay.parentNode.removeChild(overlay); overlay = null; }
    }
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") closeOverlays();
    });

    // — Cuadrito del topbar —
    function makeSquare() {
      const b = el("button", "rsa-tools-square");
      b.id = "rsa-tools-btn";
      b.title = "Herramientas";
      b.setAttribute("aria-haspopup", "true");
      b.innerHTML = ICONS.wrench;
      b.addEventListener("click", openMenu);
      return b;
    }
    function ensureSquare() {
      const topbar = document.getElementById("topbar");
      if (!topbar) return;
      if (document.getElementById("rsa-tools-btn")) return;
      // #topbar es flex space-between con 2 hijos: agregarlo como 3er hijo lo
      // deja flotando al centro. Va dentro del bloque de acciones de la derecha.
      const host = topbar.querySelector(".topbar-actions") || topbar;
      host.appendChild(makeSquare());
    }
    // El topbar lo pinta app.js: observa hasta que exista y sigue vivo por si
    // la carcasa lo re-renderiza (re-append idempotente por id).
    const bootObs = new MutationObserver(ensureSquare);
    bootObs.observe(document.documentElement, { childList: true, subtree: true });
    ensureSquare();

    // — Menú —
    function openMenu() {
      closeOverlays();
      const ov = makeOverlay();
      const menu = el("div", "rsa-menu");
      menu.appendChild(el("div", "rsa-menu-title", "Herramientas"));
      const grid = el("div", "rsa-menu-grid");
      AGENTS.forEach(function (a) {
        const item = el("button", "rsa-menu-item");
        item.innerHTML = '<span class="rsa-menu-icon">' + a.icono + "</span>" +
          '<span class="rsa-menu-label">' + esc(a.nombre) + "</span>";
        item.addEventListener("click", function () { renderPanel(a.id); });
        grid.appendChild(item);
      });
      menu.appendChild(grid);
      ov.appendChild(menu);
      ov.classList.add("is-open");
    }

    // — Panel —
    function renderPanel(agentId) {
      const agent = AGENTS.filter(function (a) { return a.id === agentId; })[0];
      if (!agent) return;
      ensureRubrics(function (rubricasOk) {
        closeOverlays();
        const ov = makeOverlay();
        const panel = el("div", "rsa-panel");
        // Re-lee el estado AHORA (cada apertura muestra el estado vivo).
        const st = RSA.readState();

        panel.appendChild(el("div", "rsa-panel-head",
          "<div><h3 class='rsa-panel-title'>" + esc(agent.nombre) + "</h3>" +
          "<span class='rsa-panel-sub'>" + (agent.tab ? "lee la pestaña " + esc(agent.tab) + " · solo lectura" : "analiza un documento tuyo · solo lectura") + "</span></div>" +
          "<div class='rsa-panel-actions-head'>" +
          "<button class='rsa-btn rsa-btn-ghost' data-rsa-back>Volver al menú</button>" +
          "<button class='rsa-btn rsa-btn-ghost' data-rsa-close>Cerrar</button></div>"));

        const rail = el("div", "rsa-provider-rail",
          "IA local: <span class='rsa-provider-chip' data-rsa-provider>estado no verificado</span>");
        panel.appendChild(rail);

        // ── Aviso de proyecto sin definir / empty state (avesPA) ──
        const avisos = el("div", "rsa-avisos");
        if (!st.rally_type) {
          const w = el("div", "rsa-notice", "<strong>define tu proyecto primero.</strong> Sin certamen activo no hay rúbrica contra la cual revisar.");
          const jb = el("button", "rsa-btn rsa-btn-mini", "Ir a la pestaña 00 · Certamen");
          jb.addEventListener("click", function () { jump("certamen"); });
          w.appendChild(jb);
          avisos.appendChild(w);
        }
        if (agent.isEmpty && st.rally_type && agent.isEmpty(st)) {
          const w = el("div", "rsa-notice", esc(agent.emptyMsg));
          const jb = el("button", "rsa-btn rsa-btn-mini", "Ir a la pestaña " + esc(agent.tab));
          jb.addEventListener("click", function () { jump(agent.tab); });
          w.appendChild(jb);
          avisos.appendChild(w);
        }
        if (avisos.children.length) panel.appendChild(avisos);

        // ── Zona (c) Checks locales, siempre, sin IA ──
        const secChecks = el("div", "rsa-section");
        secChecks.appendChild(el("h4", "rsa-section-title", "Checks locales (sin IA)"));
        const chips = el("div", "rsa-chips");
        if (agent.checksFn) {
          const res = agent.checksFn(st);
          const probs = (res && res.problems) || [];
          if (!probs.length) {
            chips.appendChild(el("span", "rsa-chip rsa-chip-ok", "Sin hallazgos locales"));
          } else {
            probs.forEach(function (pri) {
              const sev = pri.severity === "Critico" ? "err" : (pri.severity === "Mejora" ? "warn" : "soft");
              chips.appendChild(el("span", "rsa-chip rsa-chip-" + sev,
                "<strong>" + esc(pri.severity) + "</strong> " + esc(pri.title)));
            });
          }
        } else {
          chips.appendChild(el("span", "rsa-chip rsa-chip-soft",
            "Este agente revisa un documento que tú subes (PDF/DOCX) contra la rúbrica activa."));
        }
        secChecks.appendChild(chips);
        panel.appendChild(secChecks);

        // ── Task 5: zona del Analizador de Documentos (subir, extraer, confirmar) ──
        let docTextRef = null; // textarea con el texto extraído; (c) lo envía como docText
        if (agent.id === "docs") {
          const secD = el("div", "rsa-section rsa-docs-zone");
          secD.appendChild(el("h4", "rsa-section-title", "Sube tu documento (PDF, DOCX, TXT o MD)"));
          const inDoc = el("input", "rsa-file");
          inDoc.type = "file"; inDoc.accept = ".pdf,.docx,.txt,.md";
          const btnExtract = el("button", "rsa-btn rsa-btn-primary", "Extraer texto");
          btnExtract.disabled = true;
          const docStage = el("div", "rsa-doc-stage");
          const docChip = el("div", "rsa-doc-chip");
          const taDoc = el("textarea", "rsa-cfg-doc");
          taDoc.readOnly = true;
          taDoc.placeholder = "Aquí se verá el texto extraído (solo lectura, hasta 24,000 caracteres).";
          inDoc.addEventListener("change", function () { btnExtract.disabled = !inDoc.files || !inDoc.files[0]; docStage.textContent = ""; docChip.textContent = ""; taDoc.value = ""; });
          btnExtract.addEventListener("click", function () {
            const f = inDoc.files && inDoc.files[0];
            if (!f) return;
            btnExtract.disabled = true;
            docChip.textContent = ""; taDoc.value = ""; docStage.textContent = "Extrayendo…";
            RSA.extractDoc(f, function (m) { docStage.textContent = m; }).then(function (ex) {
              docStage.textContent = "Extracción lista.";
              const partes = ["fuente: " + ex.source];
              if (ex.pages) partes.push("páginas: " + ex.pages);
              partes.push("caracteres enviados: " + ex.text.length);
              if (ex.truncated) partes.push("TRUNCADO desde " + ex.originalLength + " caracteres (por límite de envío)");
              docChip.textContent = partes.join(" · ");
              taDoc.value = ex.text;
              docTextRef = taDoc;
              btnDocSend.classList.remove("rsa-hidden");
            }).catch(function (e2) {
              docStage.textContent = "";
              docChip.textContent = "No pude extraer: " + (e2 && e2.message || "error");
              btnDocSend.classList.add("rsa-hidden");
            }).then(function () { btnExtract.disabled = false; });
          });
          // Confirmación explícita antes de la primera llamada (decisión 14 de la spec).
          const confirmRow = el("div", "rsa-doc-confirm");
          confirmRow.appendChild(el("span", "rsa-doc-confirm-text",
            "El contenido del documento se enviará al proveedor configurado: "));
          const provMini = el("span", "rsa-provider-chip", "estado no verificado");
          RSA.UI_refreshProvider(provMini);
          confirmRow.appendChild(provMini);
          const btnDocSend = el("button", "rsa-btn rsa-btn-primary rsa-hidden", "Enviar a análisis");
          btnDocSend.addEventListener("click", function () {
            const txt = taDoc.value;
            if (!txt) { resultado.innerHTML = ""; resultado.appendChild(el("div", "rsa-note rsa-note-err", "Extrae primero el texto del documento.")); return; }
            RSA.analyzeDirect({
              agentId: agent.id, agentCfg: { id: agent.id, name: agent.nombre, tab: null },
              state: RSA.readState(), docText: txt, resultEl: resultado, btn: btnDocSend
            });
          });
          secD.appendChild(inDoc); secD.appendChild(btnExtract);
          secD.appendChild(docStage); secD.appendChild(docChip);
          secD.appendChild(taDoc);
          secD.appendChild(confirmRow); secD.appendChild(btnDocSend);
          panel.appendChild(secD);
        }

        // ── Zonas de decisión 4: (a) prompt lleva, (b) pegar respuesta, (c) directo ──
        const resultado = el("div", "rsa-result");
        const rub = rubricFor(agentId, st.rally_type);

        const secA = el("div", "rsa-section");
        secA.appendChild(el("h4", "rsa-section-title", "(a) Prompt para llevar — contexto completo para cualquier IA"));
        if (!rub) {
          secA.appendChild(el("div", "rsa-notice", "rúbricas no cargadas: no puedo armar el prompt. El check local de arriba sigue activo."));
        }
        const btnPrompt = el("button", "rsa-btn rsa-btn-primary", "Generar prompt para llevar");
        btnPrompt.disabled = !rub;
        const taPrompt = el("textarea", "rsa-prompt rsa-hidden");
        taPrompt.readOnly = true;
        const btnCopy = el("button", "rsa-btn rsa-btn-mini rsa-hidden", "Copiar");
        btnPrompt.addEventListener("click", function () {
          const stNow = RSA.readState(); // contexto fresco en cada acción
          const rubNow = rubricFor(agentId, stNow.rally_type) || rub;
          if (!rubNow) return;
          const promptTxt = RSA.buildPrompt({ id: agent.id, name: agent.nombre, tab: agent.tab }, rubNow, stNow, "lleva");
          taPrompt.value = promptTxt;
          taPrompt.classList.remove("rsa-hidden");
          btnCopy.classList.remove("rsa-hidden");
        });
        btnCopy.addEventListener("click", function () {
          copyText(taPrompt.value, function (ok) {
            btnCopy.textContent = ok ? "Copiado" : "Sin portapapeles";
            setTimeout(function () { btnCopy.textContent = "Copiar"; }, 1500);
          });
        });
        secA.appendChild(btnPrompt); secA.appendChild(taPrompt); secA.appendChild(btnCopy);
        panel.appendChild(secA);

        const secB = el("div", "rsa-section");
        secB.appendChild(el("h4", "rsa-section-title", "(b) Pegar respuesta de la IA externa"));
        const taExt = el("textarea", "rsa-externa");
        taExt.placeholder = "Pega acá la respuesta que te dio la IA externa…";
        const btnExt = el("button", "rsa-btn rsa-btn-primary", "Analizar respuesta");
        btnExt.addEventListener("click", function () {
          if (typeof RSA.analyzeExternal === "function") {
            RSA.analyzeExternal({
              agentId: agent.id, agentCfg: { id: agent.id, name: agent.nombre, tab: agent.tab },
              state: RSA.readState(), externalText: taExt.value, resultEl: resultado, btn: btnExt
            });
          } else {
            resultado.innerHTML = "";
            resultado.appendChild(el("div", "rsa-note",
              "El análisis IA va por el servicio local (rally_service). Sin proveedor conectado este análisis no puede correr — los checks locales de arriba siguen siendo válidos."));
          }
        });
        secB.appendChild(taExt); secB.appendChild(btnExt);
        panel.appendChild(secB);

        const secC = el("div", "rsa-section");
        secC.appendChild(el("h4", "rsa-section-title", "(c) Analizar aquí — la IA local revisa tu contenido"));
        const btnDirecto = el("button", "rsa-btn rsa-btn-primary", "Analizar aquí");
        btnDirecto.addEventListener("click", function () {
          if (typeof RSA.analyzeDirect === "function") {
            // El agente de Documentos analiza el texto extraído, no el estado.
            const docText = (agent.id === "docs" && docTextRef && docTextRef.value)
              ? docTextRef.value : null;
            if (agent.id === "docs" && !docText) {
              resultado.innerHTML = "";
              resultado.appendChild(el("div", "rsa-note rsa-note-err",
                "Extrae primero el texto del documento (arriba): sin documento no hay nada que analizar."));
              return;
            }
            RSA.analyzeDirect({
              agentId: agent.id, agentCfg: { id: agent.id, name: agent.nombre, tab: agent.tab },
              state: RSA.readState(), docText: docText, resultEl: resultado, btn: btnDirecto
            });
          } else {
            resultado.innerHTML = "";
            resultado.appendChild(el("div", "rsa-note",
              "El análisis IA va por el servicio local (rally_service). Sin proveedor conectado este análisis no puede correr — los checks locales de arriba siguen siendo válidos."));
          }
        });
        secC.appendChild(btnDirecto);
        panel.appendChild(secC);

        panel.appendChild(resultado);

        // ── Historial compacto (máx 10 por agente) ──
        const hist = RSA.historyList(agent.id);
        const secH = el("div", "rsa-section rsa-history-sec");
        secH.appendChild(el("h4", "rsa-section-title", "Historial"));
        const ol = el("ol", "rsa-history");
        if (!hist.length) {
          ol.appendChild(el("li", "rsa-history-empty", "Aún no hay análisis registrados."));
        } else {
          hist.forEach(function (h) {
            const resumen = h.resumen || h.veredicto || h.mode || "";
            ol.appendChild(el("li", null,
              esc(new Date(h.ts).toLocaleString()) + " · " + esc(h.mode || "") + " · " + esc(resumen)));
          });
        }
        secH.appendChild(ol);
        panel.appendChild(secH);

        // Acciones del header.
        panel.querySelector("[data-rsa-close]").addEventListener("click", closeOverlays);
        panel.querySelector("[data-rsa-back]").addEventListener("click", openMenu);

        // Chip de proveedor: lo llena quien consuma el panel (Task 4 usa /api/ai/status).
        const chip = panel.querySelector("[data-rsa-provider]");
        if (chip && typeof RSA.UI_refreshProvider === "function") RSA.UI_refreshProvider(chip);

        panel.dataset.rsaAgent = agent.id;
      ov.appendChild(panel);
        ov.classList.add("is-open");
      });
    }

    // ── Task 4: análisis directo / respuesta externa / render estructurado ──
    // renderAnalysis(rootEl, result): result = {ok:true,text,provider} | {ok:false,status,message}
    RSA.renderAnalysis = function renderAnalysis(rootEl, result) {
      rootEl.innerHTML = "";
      if (!result || !result.ok) {
        const notes = {
          "rate-limit": "El servicio alcanzó su límite de uso. Mensaje del servicio:",
          "no-provider": "No hay proveedor de IA conectado en el servicio local. Mensaje:",
          "error": "El servicio reportó un error. Mensaje:",
          "timeout": "El servicio no terminó a tiempo. Detalle:",
          "cancelled": "Análisis cancelado.",
          "down": "El buzón local (rally_service) no responde. Mensaje:"
        };
        const note = el("div", "rsa-note rsa-note-err");
        note.appendChild(document.createTextNode(notes[result && result.status] || notes.down + " "));
        if (result && result.message) {
          note.appendChild(document.createTextNode(" " + String(result.message)));
        }
        rootEl.appendChild(note);
        return;
      }
      const parsed = RSA.parseAIResult(result.text || "");
      if (parsed.format === "raw") {
        rootEl.appendChild(el("div", "rsa-raw-label", "respuesta sin formato"));
        const pre = document.createElement("pre");
        pre.className = "rsa-raw-text";
        pre.textContent = result.text || "";
        rootEl.appendChild(pre);
        return parsed;
      }
      const data = parsed.data || {};
      // Veredictos
      if (Array.isArray(data.veredictos) && data.veredictos.length) {
        const vs = el("div", "rsa-verdicts");
        data.veredictos.forEach(function (v) {
          const estado = String(v.estado || "");
          const cls = RSA._labelClass(estado);
          vs.appendChild(el("span", "rsa-chip rsa-chip-" + cls,
            "<strong>" + esc(estado) + "</strong> " + esc(v.criterio || "")));
        });
        rootEl.appendChild(vs);
      }
      // Problemas
      if (Array.isArray(data.problemas) && data.problemas.length) {
        const ps = el("div", "rsa-problems");
        data.problemas.forEach(function (p) {
          const sevLabel = p.severidad || p.severity || "Sugerencia";
          const sev = RSA._labelClass(sevLabel);
          const row = el("div", "rsa-problem rsa-problem-" + sev);
          // p.titulo es salida de IA (entrada hostil): esc() obligatorio.
          row.appendChild(el("strong", null, esc(sevLabel) + " · " + esc(p.titulo || p.title || "")));
          if (p.evidencia) row.appendChild(el("div", "rsa-problem-evidence", esc(p.evidencia)));
          if (p.correccion) row.appendChild(el("div", "rsa-problem-fix", "Corrección: " + esc(p.correccion)));
          ps.appendChild(row);
        });
        const h = el("h4", "rsa-section-title", "Problemas");
        rootEl.appendChild(h);
        rootEl.appendChild(ps);
      }
      // Ajustes: copiar ANTES de saltar; pegarlo es decisión del humano (decisión 6).
      if (Array.isArray(data.ajustes) && data.ajustes.length) {
        const h = el("h4", "rsa-section-title", "Ajustes propuestos");
        rootEl.appendChild(h);
        data.ajustes.forEach(function (a) {
          const row = el("div", "rsa-adjust");
          row.appendChild(el("div", "rsa-adjust-text", esc(a.texto || a.text || "")));
          const acts = el("div", "rsa-adjust-acts");
          const btnCopy = el("button", "rsa-btn rsa-btn-mini", "Copiar");
          btnCopy.addEventListener("click", function () {
            copyText(a.texto || a.text || "", function (ok) {
              btnCopy.textContent = ok ? "Copiado" : "Sin portapapeles";
              setTimeout(function () { btnCopy.textContent = "Copiar"; }, 1500);
            });
          });
          acts.appendChild(btnCopy);
          if (a.tab) {
            const btnGo = el("button", "rsa-btn rsa-btn-mini", "Ir a " + esc(a.tab));
            btnGo.addEventListener("click", function () {
              copyText(a.texto || a.text || "", function () {
                jump(a.tab); // salto tras copia; pegar es manual
              });
            });
            acts.appendChild(btnGo);
          }
          row.appendChild(acts);
          rootEl.appendChild(row);
        });
      }
      // Visuales
      if (Array.isArray(data.visuales) && data.visuales.length) {
        const h = el("h4", "rsa-section-title", "Sugerencias visuales");
        rootEl.appendChild(h);
        const ul = el("ul", "rsa-visuals");
        data.visuales.forEach(function (v) {
          ul.appendChild(el("li", null, esc(typeof v === "string" ? v : (v.texto || v.descripcion || JSON.stringify(v)))));
        });
        rootEl.appendChild(ul);
      }
      return parsed;
    };

    // Resumen de una salida para historial (≤ 120 chars).
    function resumenDe(parsed, result) {
      if (parsed && parsed.format === "json" && parsed.data && Array.isArray(parsed.data.problemas)) {
        const crit = RSA._countCritical(parsed.data.problemas);
        return crit + " crítico(s), " + parsed.data.problemas.length + " problema(s) marcados";
      }
      if (parsed && parsed.format === "raw") return String(result.text || "").slice(0, 120);
      return "sin problemas marcados";
    }

    // Un botón dispara un solo análisis: deshabilitado mientras corre (un
    // doble clic abría dos jobs compitiendo por el mismo panel).
    function busyBtn(btn, on) {
      if (!btn) return;
      btn.disabled = !!on;
    }

    // analyzeDirect(ctx): prompt directo → analyze → render → historial
    // ctx.docText opcional (Analizador de Documentos): analiza el texto extraído.
    RSA.analyzeDirect = function analyzeDirect(ctx) {
      const RSAv = RSA;
      const st = ctx.state || RSAv.readState();
      const resultEl = ctx.resultEl;
      if (ctx.btn && ctx.btn.disabled) return;
      busyBtn(ctx.btn, true);
      resultEl.innerHTML = "";
      resultEl.appendChild(el("div", "rsa-note", "Analizando con la IA local… (poll cada 2 s)"));
      const rub = rubricFor(ctx.agentId, st.rally_type);
      if (!rub) {
        resultEl.innerHTML = "";
        resultEl.appendChild(el("div", "rsa-note rsa-note-err",
          "rúbricas no cargadas: no puedo armar el prompt de análisis. Los checks locales siguen activos."));
        busyBtn(ctx.btn, false);
        return;
      }
      const extra = ctx.docText ? { docText: ctx.docText } : null;
      const promptText = RSAv.buildPrompt(ctx.agentCfg || { id: ctx.agentId }, rub, st, "directo", extra);
      RSAv.analyze(promptText).then(function (res) {
        busyBtn(ctx.btn, false);
        const parsed = RSA.renderAnalysis(resultEl, res);
        if (res.ok) {
          RSA.historyAdd(ctx.agentId, { mode: ctx.docText ? "documento" : "directo", resumen: resumenDe(parsed, res), veredicto: parsed && parsed.format });
        }
      });
    };

    // analyzeExternal(ctx): respuesta externa → la IA local la contrasta → render → historial
    RSA.analyzeExternal = function analyzeExternal(ctx) {
      const RSAv = RSA;
      const st = ctx.state || RSAv.readState();
      const resultEl = ctx.resultEl;
      const ext = String(ctx.externalText || "").trim();
      resultEl.innerHTML = "";
      if (!ext) {
        resultEl.appendChild(el("div", "rsa-note rsa-note-err",
          "Pega primero la respuesta de la IA externa en el cuadro de texto."));
        return;
      }
      if (ctx.btn && ctx.btn.disabled) return;
      busyBtn(ctx.btn, true);
      resultEl.appendChild(el("div", "rsa-note", "Contrastando tu respuesta externa con la IA local…"));
      const rub = rubricFor(ctx.agentId, st.rally_type);
      if (!rub) {
        resultEl.innerHTML = "";
        resultEl.appendChild(el("div", "rsa-note rsa-note-err",
          "rúbricas no cargadas: no puedo armar el prompt de contraste. Los checks locales siguen activos."));
        busyBtn(ctx.btn, false);
        return;
      }
      const promptText = RSAv.buildPrompt(
        ctx.agentCfg || { id: ctx.agentId },
        rub, st, "externa",
        { externalText: ext }
      );
      RSAv.analyze(promptText).then(function (res) {
        busyBtn(ctx.btn, false);
        const parsed = RSA.renderAnalysis(resultEl, res);
        if (res.ok) {
          RSA.historyAdd(ctx.agentId, { mode: "externa", resumen: resumenDe(parsed, res), veredicto: parsed && parsed.format });
        }
      });
    };

    // Chip de proveedor real (GET /api/ai/status, tolerante a falla).
    RSA.UI_refreshProvider = function UI_refreshProvider(chip) {
      RSA.aiStatus().then(function (stUS) {
        if (!chip) return;
        if (stUS && stUS.provider) {
          chip.textContent = stUS.provider + (stUS.model ? " · " + stUS.model : "");
          chip.classList.add("rsa-provider-ok");
        } else {
          chip.textContent = (stUS && stUS.message) || "no disponible";
          chip.classList.add("rsa-provider-down");
        }
      });
    };

    // Superficie pública para Tasks 4–5.
    globalThis.RSA_UI = {
      AGENTS: AGENTS,
      renderPanel: renderPanel,
      openMenu: openMenu,
      closeOverlays: closeOverlays,
      jump: jump,
      esc: esc,
      el: el,
      copyText: copyText,
      rubricFor: rubricFor,
      ensureRubrics: ensureRubrics
    };
  }
})();
