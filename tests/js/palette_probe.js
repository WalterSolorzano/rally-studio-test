// Sonda de pruebas para design/shared.js (paleta de marca).
// Carga shared.js en un contexto de Node con un navegador minimo simulado.
// Uso: node palette_probe.js <comando> [json]
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
  document: { readyState: "complete" },
  fetch: () => Promise.reject(new Error("sin red en la sonda")),
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
const fuente = fs.readFileSync(
  path.join(__dirname, "..", "..", "design", "shared.js"),
  "utf8"
);
vm.runInContext(fuente, sandbox);

function salir(obj) {
  process.stdout.write(JSON.stringify(obj));
}

// --- pixeles sinteticos ---
function rgba(hex, alpha) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
    alpha === undefined ? 255 : alpha,
  ];
}

// logo = {pixels: [[hex, repeticiones]], fondo: "#ffffff"}
function construirPixeles(logo) {
  const out = [];
  (logo.pixels || []).forEach(([hex, rep]) => {
    for (let i = 0; i < (rep || 1); i++) out.push(...rgba(hex));
  });
  return new Uint8ClampedArray(out);
}

function main() {
  const comando = process.argv[2] || "";
  let arg = process.argv[3];
  // "@ruta.json" o "-carga-" (stdin) evitan el escaping de PowerShell.
  if (arg && arg.startsWith("@")) arg = fs.readFileSync(arg.slice(1), "utf8");
  else if (arg === "-carga-") arg = fs.readFileSync(0, "utf8");

  if (comando === "extraer") {
    const logo = JSON.parse(arg);
    const pixeles = construirPixeles(logo);
    const raw = sandbox.extractPaletteFromPixels(pixeles);
    const limpio = raw ? sandbox.sanitizePalette(raw) : null;
    if (limpio) {
      limpio.hasBlack = raw.hasBlack;
      limpio.black = raw.black;
    }
    salir({ raw, limpio });
    return;
  }

  if (comando === "saneo") {
    const paleta = JSON.parse(arg);
    salir(sandbox.sanitizePalette(paleta));
    return;
  }

  if (comando === "saneo-crudo") {
    const paleta = JSON.parse(arg);
    salir(sandbox.sanitizePaletteCruda(paleta));
    return;
  }

  if (comando === "contraste") {
    const [a, b] = JSON.parse(arg);
    salir({ ratio: sandbox.contrastRatio(a, b) });
    return;
  }

  if (comando === "tono") {
    const hex = JSON.parse(arg);
    salir({
      tono: sandbox.hueOf(hex),
      morado: sandbox.isPurpleHex(hex),
      lum: sandbox.lumOf(hex),
    });
    return;
  }

  throw new Error("comando desconocido: " + comando);
}

main();
