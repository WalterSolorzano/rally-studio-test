// Sonda de pruebas para el modulo impacto: estado compartido.
// Carga design/shared.js (y mas adelante impacto.js) en Node con navegador
// minimo simulado. Uso: node impacto_probe.js <comando> [json]
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const store = Object.create(null);

function memoria(destino) {
  return {
    getItem: (k) => (k in destino ? destino[k] : null),
    setItem: (k, v) => {
      destino[k] = String(v);
    },
    removeItem: (k) => {
      delete destino[k];
    },
  };
}

const sandbox = {
  console,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  Math,
  Date,
  Promise,
  Error,
  isFinite,
  encodeURIComponent,
  location: { protocol: "http:" },
  localStorage: memoria(store),
  sessionStorage: memoria(Object.create(null)),
  document: {
    readyState: "complete",
    addEventListener: () => {},
    querySelector: () => null,
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
  },
  fetch: () => Promise.reject(new Error("sin red en la sonda")),
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "..", "design", "shared.js"), "utf8"), sandbox);

// Modulos que la sonda del modulo impacto puede necesitar (si existen).
for (const archivo of ["ods_data.js", "impacto.js"]) {
  const ruta = path.join(__dirname, "..", "..", "design", archivo);
  if (fs.existsSync(ruta)) {
    vm.runInContext(fs.readFileSync(ruta, "utf8"), sandbox);
  }
}

function salir(obj) {
  process.stdout.write(JSON.stringify(obj));
}

const comando = process.argv[2];

switch (comando) {
  case "odsof":
    salir({
      d12: typeof sandbox.odsOf === "function" ? sandbox.odsOf(process.argv[3] || "ODS 12") : null,
    });
    break;
  case "odsof-lote": {
    const textos = JSON.parse(process.argv[3] || "[]");
    salir(
      textos.map((t) => (typeof sandbox.odsOf === "function" ? sandbox.odsOf(t) : "__ausente__"))
    );
    break;
  }
  case "por-defecto": {
    const def = typeof sandbox.impactoPorDefecto === "function" ? sandbox.impactoPorDefecto() : null;
    if (!def) { salir({ error: "impactoPorDefecto ausente" }); break; }
    salir({
      claves: { preset: def.preset === "", dur: def.dur === 5, odsOn: !!def.odsOn, textos: !!def.textos,
        plan: !!def.plan, narracion: !!def.narracion, anim: !!def.anim },
      plan: def.plan && def.plan.modo === "" && Array.isArray(def.plan.programas),
      animOK: !!def.anim && def.anim.mosaico && def.anim.mosaico.entrada === "banda"
        && def.anim.mosaico.enfasis === "pulso" && def.anim.mosaico.salida === "fade"
        && def.anim.ficha && def.anim.ficha.entrada === "fade"
        && def.anim.ficha.enfasis === "pop" && def.anim.ficha.salida === "none"
        && def.anim.plan && def.anim.plan.entrada === "wipe"
        && def.anim.plan.enfasis === "none" && def.anim.plan.salida === "fade",
    });
    break;
  }
  case "normalize": {
    const id = JSON.parse(process.argv[3] || "{}");
    const n = sandbox.normalizeIdentity(id);
    salir({
      impact: n.impacto && n.impacto.odsOn && n.impacto.odsOn["12"] === false,
      impactoCompleto: !!n.impacto && n.impacto.dur === 5 && !!n.impacto.anim,
    });
    break;
  }
  // --- Task 4: composicion y pintadores ---
  case "ods-activos": {
    const [ident, briefOds] = JSON.parse(process.argv[3]);
    const filas = typeof sandbox.odsActivos === "function" ? sandbox.odsActivos(ident, briefOds) : null;
    salir({ filas });
    break;
  }
  case "modo": {
    const [ident, brief] = JSON.parse(process.argv[3]);
    const modo = typeof sandbox.modoEfectivo === "function" ? sandbox.modoEfectivo(ident, brief) : null;
    salir({ modo });
    break;
  }
  // --- fix-batch review: conexiones propuestas + guard _modosPlan ---
  case "repartir": {
    const texto = JSON.parse(process.argv[3] || '""');
    sandbox.IMP = { impacto: { narracion: {} } };
    const n = typeof sandbox.repartirConexiones === "function" ? sandbox.repartirConexiones(texto) : null;
    const nar = sandbox.IMP.impacto.narracion;
    salir({ n, props: nar.props || null, claves: Object.keys(nar) });
    break;
  }
  case "modos-plan": {
    const estado = JSON.parse(process.argv[3] || "{}");
    if (typeof sandbox._modosPlan !== "function") { salir({ error: "_modosPlan ausente" }); break; }
    salir({ modo: sandbox._modosPlan(estado) });
    break;
  }
  // --- video limpio + coreografía de cuadritos ---
  case "limpio": {
    const [limpio] = JSON.parse(process.argv[3] || "[false]");
    if (typeof sandbox.componerLamina !== "function") { salir({ error: "componerLamina ausente" }); break; }
    const estado = {
      limpio: !!limpio,
      imp: { preset: "bloques", textos: {}, anim: {}, plan: {} },
      pal: JSON.parse(JSON.stringify(sandbox.PAL_DEFAULT)),
      team: { name: "Equipo Demo", university: "UNI", city: "Managua" },
      fonts: null,
    };
    const sel = [1, 2, 3, 4, 5, 6].map((i) => ({ id: i, on: true }));
    const prims = sandbox.componerLamina("mosaico", estado, sel);
    const gs = prims.filter((p) => p.g !== undefined).map((p) => p.g);
    const zonas = prims.filter((p) => p.k === "rect" && p.r === 24).map((p) => p.y);
    salir({
      hayMarca: prims.some((p) => p.k === "txt" && /RALLY STUDIO/i.test(String(p.text))),
      hayUni: prims.some((p) => p.k === "txt" && p.text === "UNI · Managua"),
      zonaY: zonas[0] ?? null,
      gs,
      gsUnicos: new Set(gs).size,
    });
    break;
  }
  case "tile-tipo": {
    const [i, tiles] = JSON.parse(process.argv[3]);
    salir({ tipo: sandbox.IMP_TILE_TIPO(i, tiles) });
    break;
  }
  case "tiles-plan": {
    const [n, dur, ritmo] = JSON.parse(process.argv[3]);
    salir(sandbox.IMP_TILES_PLAN(n, dur, ritmo));
    break;
  }
  case "orden-mosaico": {
    const [n, orden, cols, filas] = JSON.parse(process.argv[3]);
    const o = sandbox._ordenMosaico(n, orden, cols, filas);
    salir({ orden: o, completa: o.length === n && new Set(o).size === n && o.every((x) => x >= 0 && x < n) });
    break;
  }
  case "mosaico-config": {
    const cfg = JSON.parse(process.argv[3] || "{}");
    if (typeof sandbox.componerLamina !== "function") { salir({ error: "componerLamina ausente" }); break; }
    const estado = {
      limpio: true,
      imp: { preset: "bloques", textos: {}, anim: { mosaico: cfg }, plan: {} },
      pal: JSON.parse(JSON.stringify(sandbox.PAL_DEFAULT)),
      team: { name: "E", university: "", city: "" },
      fonts: null,
    };
    const sel = [1, 2, 3, 4, 5, 6].map((i) => ({ id: i, on: true }));
    const prims = sandbox.componerLamina("mosaico", estado, sel);
    const gs = prims.filter((p) => p.g !== undefined).map((p) => p.g);
    const ts = prims.filter((p) => p.g === 0 && p.w !== undefined).map((p) => p.w);
    salir({ gs, gsUnicos: new Set(gs).size, wTile0: ts[0] ?? null });
    break;
  }
  case "tinta": {
    const hexa = JSON.parse(process.argv[3]);
    const color = typeof sandbox.tintaSobre === "function" ? sandbox.tintaSobre(hexa) : null;
    const ratio = color ? sandbox.contrastRatio(color, hexa) : null;
    salir({ color, ratio });
    break;
  }
  case "componer": {
    const { tipo, estado, odsSel } = JSON.parse(process.argv[3]);
    if (typeof sandbox.componerLamina !== "function") { salir({ error: "componerLamina ausente" }); break; }
    const prims = sandbox.componerLamina(tipo, estado, odsSel);
    salir({
      n: prims.length,
      ks: prims.map((p) => p.k),
      rectColores: prims.filter((p) => p.k === "rect").map((p) => p.color),
      textos: prims.filter((p) => p.k === "txt").map((p) => p.text),
    });
    break;
  }
  case "canvas": {
    const { tipo, estado, odsSel, escala } = JSON.parse(process.argv[3]);
    if (typeof sandbox.pintarCanvas !== "function") { salir({ error: "pintarCanvas ausente" }); break; }
    const usados = new Set();
    const reg = (k) => { usados.add(k); return () => { usados.add(k); }; };
    const mock = {
      save: reg("save"), restore: reg("restore"), scale: reg("scale"), translate: reg("translate"),
      beginPath: reg("beginPath"), closePath: reg("closePath"),
      rect: reg("rect"), roundRect: reg("roundRect"), arc: reg("arc"),
      fill: reg("fill"), stroke: reg("stroke"), fillText: reg("fillText"), measureText: () => ({ width: 10 }),
      setProperty: reg("x"),
    };
    let fillStyleVals = [];
    Object.defineProperty(mock, "fillStyle", { set(v) { fillStyleVals.push(v); }, get() { return "#000"; } });
    let fontVals = [];
    Object.defineProperty(mock, "font", { set(v) { fontVals.push(v); }, get() { return ""; } });
    sandbox.Path2D = function (d) { this.d = d; };
    sandbox.pintarCanvas(mock, sandbox.componerLamina(tipo, estado, odsSel), escala || 1);
    salir({ usados: Array.from(usados).sort(), fillStyleVals, fontVals });
    break;
  }
  // --- Task 7: plan de grabacion ---
  case "planificar": {
    const [segundos, hayRecorder] = JSON.parse(process.argv[3]);
    if (typeof sandbox.planificarGrabacion !== "function") { salir({ error: "planificarGrabacion ausente" }); break; }
    let plan = null;
    let err = null;
    try { plan = sandbox.planificarGrabacion(segundos, hayRecorder); } catch (e) { err = String(e && e.constructor ? e.constructor.name : "Error"); }
    salir({ plan, err });
    break;
  }
  case "frames-fase": {
    const segundos = JSON.parse(process.argv[3]);
    if (typeof sandbox.tamanosFase !== "function" || typeof sandbox.faseEn !== "function") { salir({ error: "timeline ausente" }); break; }
    const flec = sandbox.tamanosFase("banda", "pulso", "fade", segundos);
    const fps = 24;
    const frames = Math.round(fps * segundos);
    const orden = [];
    for (let i = 0; i <= frames; i++) {
      const f = sandbox.faseEn(i / fps, flec);
      if (orden[orden.length - 1] !== f) orden.push(f);
    }
    salir({ frames, orden });
    break;
  }
  // --- Task 8: narracion con IA ---
  case "palabras-max": {
    const seg = JSON.parse(process.argv[3]);
    salir({ n: typeof sandbox.palabrasMax === "function" ? sandbox.palabrasMax(seg) : null });
    break;
  }
  case "pulir": {
    const [texto, contexto, max] = JSON.parse(process.argv[3]);
    salir({ prompt: typeof sandbox.promptPulir === "function" ? sandbox.promptPulir(texto, contexto, max) : null });
    break;
  }
  case "puede-aplicar": {
    const [original, confirmacion] = JSON.parse(process.argv[3]);
    salir({ ok: typeof sandbox.puedeAplicar === "function" ? sandbox.puedeAplicar(original, confirmacion) : null });
    break;
  }
  case "truncar": {
    const [texto, max] = JSON.parse(process.argv[3]);
    salir(typeof sandbox.truncarPalabras === "function" ? sandbox.truncarPalabras(texto, max) : { error: "truncarPalabras ausente" });
    break;
  }
  // --- Task 5: timeline ---
  case "fases": {
    const [entrada, enfasis, salida, dur, t] = JSON.parse(process.argv[3]);
    if (typeof sandbox.tamanosFase !== "function") { salir({ error: "tamanosFase ausente" }); break; }
    let err = null;
    let fases = null;
    try { fases = sandbox.tamanosFase(entrada, enfasis, salida, dur); } catch (e) { err = String(e && e.constructor ? e.constructor.name : "Error"); }
    const res = { fases, err };
    if (fases && t !== undefined) {
      res.fase = typeof sandbox.faseEn === "function" ? sandbox.faseEn(t, fases) : null;
    }
    salir(res);
    break;
  }
  default:
    salir({ error: "comando desconocido: " + comando });
}
