"use strict";
// Suite del núcleo puro de Super Agentes (Task 2) y, más adelante, de las
// funciones puras que añadan Task 4/5. Cero dependencias: node:assert + node:vm.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const SRC_PATH = path.join(__dirname, "..", "dashboard", "super_agents.js");
const src = fs.readFileSync(SRC_PATH, "utf8");

// Storage de bolsillo para el contexto VM.
const storage = {};
const ls = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

const ctx = { window: undefined, document: undefined, localStorage: ls, console };
vm.createContext(ctx);
vm.runInContext(src, ctx, { filename: "super_agents.js" });
const RSA = ctx.RSA;
assert.ok(RSA, "RSA debe existir en el contexto VM");

// Rubricas reales del Task 1 (se registran en globalThis y window si existe).
const rubSrcPath = path.join(__dirname, "..", "dashboard", "super_agents_rubrics.js");
vm.runInContext(fs.readFileSync(rubSrcPath, "utf8"), ctx, { filename: "super_agents_rubrics.js" });
const RSA_RUBRICS = ctx.RSA_RUBRICS || (ctx.window && ctx.window.RSA_RUBRICS);
assert.ok(RSA_RUBRICS, "RSA_RUBRICS debe existir en el contexto VM");

const STATE_KEY = "rally_studio_production_state_2026_v3";
const words = (n) => Array.from({ length: n }, (_, i) => "w" + i).join(" ");
const hit = (p, re) => (re.test(String(p.title)) || re.test(String(p.evidence || "")));
const CANVAS_KEYS = ["socios", "actividades", "propuesta", "relaciones", "segmentos", "recursos", "canales", "costes", "ingresos"];
// deepStrictEqual compara prototypes: los objetos creados dentro del realm del
// vm no comparten el Object.prototype del host. Comparamos por JSON.
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b), "esperado " + JSON.stringify(b));

// ── readState ────────────────────────────────────────────────────────────────
ls.setItem(STATE_KEY, JSON.stringify({ rally_type: "latam", budget: [] }));
assert.equal(RSA.readState().rally_type, "latam");
ls.setItem(STATE_KEY, "{junk inv(aa");
eq(RSA.readState(), {});
ls.removeItem(STATE_KEY);
eq(RSA.readState(), {});

// ── scriptChecks ─────────────────────────────────────────────────────────────
eq(
  RSA.scriptChecks({ script: { acto1: words(50), acto2: words(80), acto3: words(60), acto4: words(55) } }, "K"),
  { problems: [] }
);
const s2 = RSA.scriptChecks(
  { script: { acto1: words(90), acto2: words(90), acto3: words(90), acto4: words(90) } }, "K");
assert.equal(s2.problems.some((p) => p.title.includes("120 s")), true, "360 palabras ≈ 160 s");
const s3 = RSA.scriptChecks(
  { script: { acto1: "dolor y estadística PROYECTO AURORA " + words(40), acto2: words(80), acto3: words(60), acto4: words(55) } },
  "PROYECTO AURORA");
assert.equal(s3.problems.some((p) => p.title.includes("Acto I") && /nombre/i.test(p.title)), true);
const s4 = RSA.scriptChecks(
  { script: { acto1: words(50), acto2: words(80), acto3: "", acto4: words(55) } }, "K");
assert.equal(s4.problems.some((p) => p.title.includes("Acto III")), true);
const s5 = RSA.scriptChecks(
  { script: { acto1: words(40), acto2: words(40), acto3: words(40), acto4: words(30) } }, "K");
assert.equal(s5.problems.some((p) => p.title.includes("240")), true, "150 palabras < 240");
eq(RSA.scriptChecks({}, "X"), { problems: [] });

// ── pautadoChecks ────────────────────────────────────────────────────────────
const pa = { rally_type: "latam", pautado: {
  problema: "x".repeat(1260), solucion: "s".repeat(200), impacto: "i".repeat(200),
  innovacion: "n".repeat(200), prefactibilidad: "p".repeat(200) } };
const rp = RSA.pautadoChecks(pa);
assert.equal(rp.problems.some((p) => p.title.startsWith("Problema") && String(p.evidence).includes("1260")), true);

const paMin = { rally_type: "latam", pautado: {
  problema: "c".repeat(10), solucion: "s".repeat(200), impacto: "i".repeat(200),
  innovacion: "n".repeat(200), prefactibilidad: "p".repeat(200) } };
assert.equal(RSA.pautadoChecks(paMin).problems.some((p) => p.title.includes("150")), true);

const paNac = { rally_type: "nacional", pautado: {
  problema: "x".repeat(1260), solucion: "s".repeat(40), impacto: "i".repeat(200),
  innovacion: "n".repeat(200), prefactibilidad: "p".repeat(200) } };
assert.equal(RSA.pautadoChecks(paNac).problems.length, 0, "nacional sin tope de longitud");

const frase = "fuga de dolares en la costa azul";
const paDup = { rally_type: "latam", pautado: {
  problema: frase + " " + "s".repeat(200), solucion: frase + " " + "z".repeat(200), impacto: "i".repeat(200),
  innovacion: "n".repeat(200), prefactibilidad: "p".repeat(200) } };
assert.equal(RSA.pautadoChecks(paDup).problems.some((p) => /repetid/i.test(p.title)), true);

const paName = { rally_type: "latam", project_name: "Aurora", pautado: {
  problema: "Aurora Aurora " + "s".repeat(180), solucion: "s".repeat(200), impacto: "i".repeat(200),
  innovacion: "n".repeat(200), prefactibilidad: "p".repeat(200) } };
assert.equal(RSA.pautadoChecks(paName).problems.some((p) => /nombre/i.test(p.title)), true);

assert.equal(RSA.pautadoChecks({}).problems.some((p) => /vac[ií]/i.test(p.title)), true);

// ── budgetChecks ─────────────────────────────────────────────────────────────
const rowOk = { element: "Sensor", category: "Hardware", units: 5, unit_cost: 1000, url: "https://x" };
const bOk = RSA.budgetChecks({ rally_type: "latam", budget: [Object.assign({}, rowOk)] });
eq(bOk.problems, []);
assert.equal(bOk.totalUsd, 5000);
const bBig = RSA.budgetChecks({ rally_type: "latam", budget: [Object.assign({}, rowOk, { unit_cost: 3000 })] });
assert.equal(bBig.problems.some((p) => hit(p, /4,?000|6,?000/i)), true);
const bNac = RSA.budgetChecks({ rally_type: "nacional", exchange_rate_bcn: 36.8, budget: [Object.assign({}, rowOk, { unit_cost: 3000 })] });
assert.equal(bNac.problems.some((p) => hit(p, /C\$|córdoba/i)), true);
const bUnits = RSA.budgetChecks({ rally_type: "latam", budget: [Object.assign({}, rowOk, { units: 0, unit_cost: 0 })] });
assert.equal(bUnits.problems.some((p) => /units/i.test(p.title)), true);
const bUrl = RSA.budgetChecks({ rally_type: "latam", budget: [{ element: "x", category: "S", units: 1, unit_cost: 5000 }] });
assert.equal(bUrl.problems.some((p) => /url/i.test(p.title)), true);
const bEmpty = RSA.budgetChecks({});
assert.ok(bEmpty.problems.length > 0 && bEmpty.totalUsd === 0);
assert.ok(bEmpty.problems.some((p) => hit(p, /4,?000|6,?000/i)));

// ── canvasChecks ─────────────────────────────────────────────────────────────
const okCanvas = CANVAS_KEYS.reduce((o, k) => {
  o[k] = k === "costes" ? "Total costo: 5000" : k === "ingresos" ? "Total ingresos: 5000" : "texto de " + k;
  return o;
}, {});
const cOk = { rally_type: "latam", model_canvas: okCanvas, budget: [Object.assign({}, rowOk)] };
eq(RSA.canvasChecks(cOk), { problems: [] });
const cMiss = Object.assign({}, cOk, { model_canvas: Object.assign({}, okCanvas, { canales: "" }) });
assert.equal(RSA.canvasChecks(cMiss).problems.some((p) => hit(p, /canales/)), true);
const cBig = Object.assign({}, cOk, { model_canvas: Object.assign({}, okCanvas, { costes: "Total costo: 9000" }) });
const cb = RSA.canvasChecks(cBig).problems.find((p) => hit(p, /9000/) && hit(p, /5000/));
assert.ok(cb, "el monto compartido cit\u00f3 9000 y 5000");
assert.equal(RSA.canvasChecks({ rally_type: "latam", model_canvas: undefined, budget: [] }).problems.some((p) => /9/.test(p.title)), true);
assert.doesNotThrow(() => RSA.canvasChecks({}));

// ── shotlistChecks ───────────────────────────────────────────────────────────
const planRows = [
  { id: "a1_broll", acto: "Acto I", label: "B-roll" },
  { id: "a2_demo", acto: "Acto II", label: "Demo" }
];
const stShots = {
  shot_plan: planRows,
  video_assets: { plan_done: ["a1_broll"], items: [
    { id: "x1", name: "asset_a1_broll_toma_campo.mp4" },
    { id: "x2", name: "toma_sin_formato.mp4" },
    { id: "x3", name: "asset_a9_broll_toma.mp4" }
  ] }
};
const sr = RSA.shotlistChecks(stShots, "K");
assert.equal(sr.problems.some((p) => hit(p, /toma_sin_formato/)), true);
assert.equal(sr.problems.some((p) => hit(p, /asset_a9_broll_toma/)), true);
assert.equal(sr.problems.some((p) => hit(p, /asset_a1_broll_toma_campo/)), false, "nombre v\u00e1lido no se marca");
const stDup = { shot_plan: [{ id: "a1_broll", acto: "Acto I" }, { id: "a1_broll", acto: "Acto I" }], video_assets: { plan_done: [], items: [] } };
assert.equal(RSA.shotlistChecks(stDup, "K").problems.some((p) => /duplicad/i.test(p.title) && p.title.includes("a1_broll")), true);
eq(RSA.shotlistChecks({ video_assets: {} }, "K"), { problems: [] });
eq(RSA.shotlistChecks({}, "K"), { problems: [] });

// ── parseAIResult ────────────────────────────────────────────────────────────
const good = "Ac\u00e1 va el an\u00e1lisis: " + JSON.stringify({
  veredictos: [], problemas: [{ titulo: "t", severidad: "Critico" }], ajustes: [], visuales: []
}) + " listo.";
const g = RSA.parseAIResult(good);
assert.equal(g.format, "json");
assert.ok(Array.isArray(g.data.veredictos));
assert.equal(RSA.parseAIResult("lorem ipsum sin llaves").format, "raw");
assert.equal(RSA.parseAIResult('{"veredictos": [truncado').format, "raw");
assert.equal(RSA.parseAIResult('{"otras": {"clave": 1}} valores').format, "raw");
assert.equal(RSA.parseAIResult("").format, "raw");
assert.doesNotThrow(() => RSA.parseAIResult(null));

// ── buildPrompt ──────────────────────────────────────────────────────────────
const agentCfg = { id: "guion", name: "Revisor de Gui\u00f3n", tab: "script" };
const rubricAgent = {
  titulo: "Guion",
  reglas: [
    { id: "g1", texto: "Cuatro actos PAS-V, 240\u2013270 palabras.", ref: "pautado-y-guion" },
    { id: "g2", texto: "Acto I sin nombre del proyecto.", ref: "pautado-y-guion" }
  ],
  promptTarea: { lleva: "Redacta el guion completo.", directo: "Analiza el guion y reporta con JSON." },
  salidaEsperada: { lleva: "Entregable: guion por actos.", directo: "JSON con veredictos, problemas, ajustes y visuales." }
};
const stP = { rally_type: "latam", project_name: "Aurora", challenge_title: "Agua", solution_thesis: "Filtro de bajo costo",
  script: { acto1: "a1", acto2: "a2", acto3: "a3", acto4: "a4" } };
const pl = RSA.buildPrompt(agentCfg, rubricAgent, stP, "lleva");
["R\u00daBRICA ACTIVA", "CONTEXTO DEL PROYECTO", "CONTENIDO ACTUAL", "FORMATO DE SALIDA", "240\u2013270", "pautado-y-guion",
 "Aurora", "Agua", "Redacta el guion completo.", "Entregable: guion por actos."].forEach((s) => {
  assert.ok(pl.includes(s), "prompt lleva debe incluir: " + s);
});
const pd = RSA.buildPrompt(agentCfg, rubricAgent, stP, "directo");
["veredictos", "problemas", "ajustes", "visuales", "Critico", "Mejora", "Sugerencia", "Analiza el guion",
 "JSON con veredictos"].forEach((s) => {
  assert.ok(pd.includes(s), "prompt directo debe incluir: " + s);
});
assert.equal(pl.includes("veredictos"), false, "el prompt lleva no exige JSON");
assert.doesNotThrow(() => RSA.buildPrompt(agentCfg, rubricAgent, {}, "directo"));

// ── historial ────────────────────────────────────────────────────────────────
const h1 = RSA.historyAdd("guion", { mode: "directo" });
assert.equal(h1.length, 1);
assert.equal(RSA.historyList("guion").length, 1);
for (let i = 0; i < 12; i++) RSA.historyAdd("presu", { n: i });
const hl = RSA.historyList("presu");
assert.equal(hl.length, 10);
assert.equal(hl[0].n, 11, "m\u00e1s nuevo primero");
assert.equal(hl[9].n, 2);
eq(RSA.historyList("noexiste"), []);

// ── severidades bien formadas en todo problema emitido ──────────────────────
const all = []
  .concat(s2.problems, s3.problems, s4.problems, s5.problems)
  .concat(RSA.pautadoChecks(pa).problems, RSA.pautadoChecks(paMin).problems, RSA.pautadoChecks(paDup).problems,
          RSA.pautadoChecks(paName).problems, RSA.pautadoChecks({}).problems)
  .concat(RSA.budgetChecks({}).problems, RSA.canvasChecks(cMiss).problems, RSA.canvasChecks(cBig).problems)
  .concat(RSA.shotlistChecks(stShots, "K").problems, RSA.shotlistChecks(stDup, "K").problems);
assert.equal(all.length > 0, true);
all.forEach((p) => {
  assert.ok(["Critico", "Mejora", "Sugerencia"].includes(p.severity), "severidad v\u00e1lida: " + p.title);
  assert.ok(p.title && typeof p.evidence === "string", "forma {title, severity, evidence}");
});

// ── Task 4: _classifyAIResponse (pura) ───────────────────────────────────────
assert.equal(RSA._classifyAIResponse({status: 429, body: {status: "rate-limit", message: "limite"}}).kind, "rate-limit");
assert.equal(RSA._classifyAIResponse({status: 200, body: {status: "no-provider", message: "x"}}).kind, "no-provider");
assert.equal(RSA._classifyAIResponse({status: 200, body: {status: "started", job: "j1"}}).kind, "started");
assert.equal(RSA._classifyAIResponse({status: 200, body: {status: "done", text: "hola"}}).kind, "done");
assert.equal(RSA._classifyAIResponse({status: 200, body: {status: "error", message: "m"}}).kind, "error");
// estados intermedios del job: polling contin�a, no es "down"
assert.equal(RSA._classifyAIResponse({status: 200, body: {status: "running", text: ""}}).kind, "running");
assert.equal(RSA._classifyAIResponse({status: 200, body: {status: "queued"}}).kind, "running");
assert.equal(RSA._classifyAIResponse({status: 500, body: {}}).kind, "down");
assert.equal(RSA._classifyAIResponse(null).kind, "down");
// mensaje honesto del servicio viaja con la clasificación cuando existe
assert.equal(RSA._classifyAIResponse({status: 429, body: {status: "rate-limit", message: "MSG-429"}}).message, "MSG-429");
assert.equal(RSA._classifyAIResponse({status: 200, body: {status: "error", message: "MSG-ERR"}}).message, "MSG-ERR");

// buildPrompt(mode externa) inyecta la respuesta externa a contrastar
const pExt = RSA.buildPrompt({id: "guion", name: "Revisor de Gui\u00f3n"}, RSA_RUBRICS.guion,
  {rally_type: "latam"}, "externa", {externalText: "DESDE-IA-EXTERNA-123"});
assert.ok(pExt.includes("[RESPUESTA EXTERNA A CONTRASTAR]"), "secci\u00f3n respuesta externa");
assert.ok(pExt.includes("DESDE-IA-EXTERNA-123"), "texto externo presente");
// y sin respuesta externa la seccion no aparece
assert.equal(RSA.buildPrompt({id: "guion"}, RSA_RUBRICS.guion, {rally_type: "latam"}, "directo")
  .includes("RESPUESTA EXTERNA"), false);

// buildPrompt inyecta el texto del documento subido (Task 5)
const pDoc = RSA.buildPrompt({id: "docs"}, RSA_RUBRICS.docs,
  {rally_type: "nacional"}, "directo", {docText: "CONTENIDO-DOC-XYZ"});
assert.ok(pDoc.includes("[CONTENIDO DEL DOCUMENTO]"), "secci\u00f3n documento");
assert.ok(pDoc.includes("CONTENIDO-DOC-XYZ"), "texto del documento presente");
assert.equal(RSA.buildPrompt({id: "docs"}, RSA_RUBRICS.docs, {rally_type: "nacional"}, "lleva")
  .includes("[CONTENIDO DEL DOCUMENTO]"), false);

// truncateWithNotice (Task 5)
const big = RSA.truncateWithNotice("x".repeat(30000), 24000);
assert.equal(big.text.length, 24000);
assert.equal(big.truncated, true);
assert.equal(big.originalLength, 30000);
assert.equal(RSA.truncateWithNotice("abc", 24000).truncated, false);
assert.equal(RSA.truncateWithNotice("abc", 24000).text, "abc");
assert.equal(RSA.truncateWithNotice("", 24000).text, "");

// ── Fix pass (review whole-branch): regresiones ─────────────────────────────

// (1) Critico: TODO campo de IA se escapa antes de innerHTML.
const escOut = RSA.esc('<img src=x onerror=alert(1)>');
assert.ok(escOut.includes("&lt;img"), "esc() debe neutralizar <");
assert.equal(escOut.includes("<img"), false, "esc() no debe dejar HTML vivo");
assert.equal(RSA.esc('a & "b" \'c\''), "a &amp; &quot;b&quot; &#39;c&#39;");

// (2) Importante: modo externa pide tarea y formato (no un prompt vacío).
["guion", "presupuesto", "pautado", "canvas", "docs", "videoEditor"].forEach((id) => {
  const txt = RSA.buildPrompt({id: id, name: id}, RSA_RUBRICS[id],
    {rally_type: "latam"}, "externa", {externalText: "RESP-EXT"});
  const tarea = txt.split("[TAREA]\n")[1].split("\n\n")[0];
  assert.ok(tarea.trim().length > 20, id + ": [TAREA] de modo externa no puede quedar vacía");
  assert.ok(txt.includes('"veredictos"'), id + ": modo externa exige el JSON estructurado");
});

// (5) Importante: ids de shot_plan con metacaracteres no rompen el regex.
const metaState = {
  shot_plan: [{id: "a1("}, {id: "a2[.*+]"}, {id: "normal_id"}],
  video_assets: {items: [{name: "asset_a1(_toma.mp4"}, {name: "asset_normal_id_toma.mp4"}]}
};
assert.doesNotThrow(() => RSA.shotlistChecks(metaState), "ids con metacaracteres no deben lanzar");
// y un asset con id normal sigue validando bien (sin hallazgo)
const okShot = RSA.shotlistChecks({
  shot_plan: [{id: "a1_broll"}],
  video_assets: {items: [{name: "asset_a1_broll_toma.mp4"}]}
});
eq(okShot, {problems: []});

// (6) Importante: normalización de etiquetas de la IA (acentos/mayúsculas).
assert.equal(RSA._labelClass("Crítico"), "err");
assert.equal(RSA._labelClass("critico"), "err");
assert.equal(RSA._labelClass("Cumple"), "ok");
assert.equal(RSA._labelClass("cumple"), "ok");
assert.equal(RSA._labelClass("Parcial"), "warn");
assert.equal(RSA._labelClass("Falla"), "err");
assert.equal(RSA._labelClass("Sugerencia"), "soft");
assert.equal(RSA._labelClass(""), "soft");
assert.equal(RSA._countCritical([{severidad: "Crítico"}, {severidade: "x"}, {severity: "Critico"}]), 2);

// (7) Importante: canvas itemizado no produce falsos avisos si un monto es el total.
const canvasItemized = {
  rally_type: "latam",
  budget: [{element: "x", category: "S", units: 1, unit_cost: 5000, url: "u"}],
  model_canvas: {
    socios: "s", actividades: "a", propuesta: "p", relaciones: "r", segmentos: "g",
    recursos: "rec", canales: "c",
    costes: "Sensores 2,000 + gateway 3,000 + instalación 0 = 5,000",
    ingresos: "Total ingresos: 5,000"
  }
};
eq(RSA.canvasChecks(canvasItemized), {problems: []});
const canvasWrong = {
  rally_type: "latam",
  budget: [{element: "x", category: "S", units: 1, unit_cost: 5000, url: "u"}],
  model_canvas: {
    socios: "s", actividades: "a", propuesta: "p", relaciones: "r", segmentos: "g",
    recursos: "rec", canales: "c", costes: "Total costo: 9000", ingresos: "x"
  }
};
assert.equal(RSA.canvasChecks(canvasWrong).problems.some((p) => p.title.includes("9,000")), true);

console.log("SUITE COMPLETA: todos los asserts de Task 2+4 pasan.");
