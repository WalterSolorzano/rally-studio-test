/* Prueba end-to-end del cliente IA contra el motor real (rally_service).
   Solo corre si el motor esta levantado en RALLY_SERVICE_URL (default :8000). */
import fs from 'node:fs';
import vm from 'node:vm';

const BASE = process.env.RALLY_SERVICE_URL || 'http://127.0.0.1:8000';
const src = fs.readFileSync(new URL('../design/ia.js', import.meta.url), 'utf8');

const store = new Map();
const ctx = {
  console,
  RALLY_IA_CONFIG: { base: BASE, dailyQuota: 12, model: process.env.RALLY_AI_MODEL || 'opencode-go/deepseek-v4.1-flash' },
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  },
  fetch: (u, o) => fetch(u, o),
  setTimeout, clearTimeout, Date, JSON, Math, String, Number, Array, Object, RegExp, Error, parseInt, parseFloat, isNaN
};
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(src, ctx);

const st = await fetch(BASE + '/api/ai/status').then(r => r.json()).catch(() => null);
if (!st || st.status !== 'ok') {
  console.log('SKIP: no hay motor IA en ' + BASE + ' (' + (st ? st.status : 'sin respuesta') + ')');
  process.exit(0);
}
console.log('motor ok -> ' + JSON.stringify(st).slice(0, 200));

const r = await ctx.RallyIA.job(ctx.RallyIA.promptEstilo('editorial minimalista, fondo arena, acento verde oscuro, titular en serif', 'Equipo de prueba, Nicaragua'));
console.log('status: ' + r.status);
if (r.status !== 'ok') { console.log('mensaje: ' + r.message); process.exit(1); }
console.log('texto bruto: ' + String(r.text).slice(0, 300));

const spec = ctx.RallyIA.sanitize(ctx.RallyIA.parseJSON(r.text));
if (!spec) { console.log('FAIL: la respuesta no se pudo sanear'); process.exit(1); }
console.log('spec: ' + JSON.stringify(spec));
console.log('OK: el flujo completo funciona contra el motor real');
