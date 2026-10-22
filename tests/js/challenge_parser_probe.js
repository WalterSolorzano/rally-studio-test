// Sonda de pruebas para dashboard/challenge_parser.js
// Carga el parser de retos en un contexto de Node, sin DOM.
// Uso: node challenge_parser_probe.js <comando> [json]
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = { console, JSON, Object, Array, String, Number, Boolean, Math, RegExp, Set, Map, Error };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const fuente = fs.readFileSync(
  path.join(__dirname, "..", "..", "dashboard", "challenge_parser.js"),
  "utf8"
);
vm.runInContext(fuente, sandbox);

const parser = sandbox.RallyChallengeParser;
if (!parser) {
  process.stderr.write("RallyChallengeParser no expuesto\n");
  process.exit(1);
}

function salir(obj) {
  process.stdout.write(JSON.stringify(obj));
}

function main() {
  const comando = process.argv[2] || "";
  const arg = process.argv[3] ? JSON.parse(process.argv[3]) : {};

  if (comando === "parse") {
    salir({ retos: parser.parse(arg.texto || "") });
    return;
  }

  if (comando === "merge") {
    const res = parser.merge(arg.existing || [], arg.incoming || [], !!arg.append);
    salir(res);
    return;
  }

  if (comando === "purge") {
    const estado = arg.estado || {};
    parser.purgeRefs(estado, arg.ids || []);
    salir({ estado });
    return;
  }

  if (comando === "titulo") {
    salir({ valido: parser.isPlausibleTitle(arg.titulo || "") });
    return;
  }

  throw new Error("comando desconocido: " + comando);
}

main();
