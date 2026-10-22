// Sonda de pruebas para dashboard/content_bridge.js
// Carga el puente en un contexto de Node con un navegador mínimo simulado.
// Uso: node bridge_probe.js <comando> [json]
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const KEY = "rally_studio_production_state_2026_v3";

const store = Object.create(null);
const session = Object.create(null);
const calls = [];
let respuesta = { ok: true, status: 200, json: async () => ({}) };

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
  location: { protocol: "file:", reload() {} },
  localStorage: memoria(store),
  sessionStorage: memoria(session),
  document: { readyState: "complete" },
  BroadcastChannel: class {
    postMessage(m) {
      calls.push({ kind: "broadcast", message: m });
    }
    close() {}
  },
  fetch: (url, opts) => {
    calls.push({ kind: "fetch", url, method: (opts && opts.method) || "GET" });
    return Promise.resolve(respuesta);
  },
  setInterval: () => 0,
  setTimeout: (fn) => {
    fn();
    return 0;
  },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
const fuente = fs.readFileSync(
  path.join(__dirname, "..", "..", "dashboard", "content_bridge.js"),
  "utf8"
);
vm.runInContext(fuente, sandbox);

const puente = sandbox.RallyContentBridge;

function salir(obj) {
  process.stdout.write(JSON.stringify(obj));
}

async function main() {
  const comando = process.argv[2] || "";
  const arg = process.argv[3];

  if (comando === "filas") {
    salir({ filas: puente._filas(JSON.parse(arg)) });
    return;
  }

  if (comando === "filas-con-estado") {
    const datos = JSON.parse(arg);
    store[KEY] = JSON.stringify(datos.estado || {});
    salir({ filas: puente._filas(datos.payload) });
    return;
  }

  if (comando === "fusionar") {
    const ok = puente._fusionar(JSON.parse(arg));
    salir({ ok, estado: JSON.parse(store[KEY] || "{}"), llamadas: calls });
    return;
  }

  if (comando === "sinred") {
    // El puente solo sondea en http(s); el sandbox arranca en file: para no
    // tocar el DOM. Aquí activamos el sondeo a propósito.
    sandbox.location.protocol = "http:";
    respuesta = { ok: false, status: 404, json: async () => ({}) };
    await puente.poll();
    await puente.poll();
    salir({ salud: puente._salud() });
    return;
  }

  if (comando === "aceptar-falla") {
    respuesta = { ok: false, status: 500, json: async () => ({}) };
    const ok = await puente.apply("p1");
    salir({ ok, salud: puente._salud() });
    return;
  }

  if (comando === "subir-estado") {
    puente._subirEstado(JSON.parse(arg));
    salir({ llamadas: calls });
    return;
  }

  throw new Error("comando desconocido: " + comando);
}

main().catch((e) => {
  process.stderr.write(String(e && e.stack ? e.stack : e));
  process.exit(1);
});
