/* Pruebas del cliente de IA (design/ia.js) sin navegador.
   Simula fetch y localStorage para verificar cuota, errores y saneado. */
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync(new URL('../design/ia.js', import.meta.url), 'utf8');

function makeCtx(responder, quotaPre = null) {
  const store = new Map();
  if (quotaPre) store.set('rally_ia_quota', JSON.stringify(quotaPre));
  const ctx = {
    console,
    RALLY_IA_CONFIG: { base: '', dailyQuota: 12, model: 'demo-model' },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k)
    },
    fetch: responder,
    setTimeout, clearTimeout, Date, JSON, Math, String, Number, Array, Object, RegExp, Error, parseInt, parseFloat, isNaN
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return { ctx, store };
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? ' -> ' + JSON.stringify(extra) : '')); }
}

async function main() {
  /* 1. Cuota agotada: no se llama al servidor y se informa con honestidad. */
  {
    let called = 0;
    // La cuota se cuenta por fecha LOCAL (igual que el cliente), no por UTC.
    const hoy = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
    const { ctx } = makeCtx(async () => { called++; return { ok: true, json: async () => ({}) }; },
      { day: hoy, n: 12 });
    const r = await ctx.RallyIA.job('hola');
    check('cuota agotada devuelve status quota', r.status === 'quota', r);
    check('cuota agotada no llama al servidor', called === 0, called);
    check('cuota agotada explica el camino manual', /cuota|mano|chats web/i.test(r.message), r.message);
  }

  /* 2. El contador de cuota baja al usar. */
  {
    const { ctx, store } = makeCtx(async () => ({
      ok: true,
      json: async () => ({ status: 'started', job: 'j1' })
    }));
    // El poll se resuelve con done inmediato.
    const fetchMock = async (url) => {
      if (String(url).includes('/api/ai/progress')) {
        return { ok: true, json: async () => ({ status: 'ok', text: '{}', done: true }) };
      }
      return { ok: true, json: async () => ({ status: 'started', job: 'j1' }) };
    };
    const c2 = makeCtx(fetchMock);
    const r = await c2.ctx.RallyIA.job('hola');
    check('job sin proveedor de verdad no crashea', typeof r.status === 'string', r);
    const q = c2.ctx.RallyIA.quota();
    check('la cuota se consume al usar', q.n === 1, q);
  }

  /* 3. Un 429 del servidor se reporta como rate-limit, no como error genérico. */
  {
    const fetchMock = async () => ({
      ok: false, status: 429,
      json: async () => ({ status: 'rate-limit', message: 'Limite alcanzado para esta conexion.' })
    });
    const { ctx } = makeCtx(fetchMock);
    const r = await ctx.RallyIA.job('hola');
    check('429 se traduce a rate-limit', r.status === 'rate-limit', r);
    check('el mensaje del servidor se conserva', /Limite alcanzado/.test(r.message), r.message);
  }

  /* 4. Error de red: honestidad + no se consume cuota. */
  {
    const fetchMock = async () => { throw new Error('red caida'); };
    const { ctx } = makeCtx(fetchMock);
    const r = await ctx.RallyIA.job('hola');
    check('sin red devuelve offline', r.status === 'offline', r);
    check('sin red no consume cuota', ctx.RallyIA.quota().n === 0, ctx.RallyIA.quota());
  }

  /* 5. Saneado: rechaza lo que no se puede renderizar, acepta lo válido. */
  {
    const { ctx } = makeCtx(async () => ({ ok: true, json: async () => ({}) }));
    const okSpec = ctx.RallyIA.sanitize({
      name: 'Arena editorial',
      skin: 'refined', cover: 'b', card: 'right', deco: 'none',
      pal: { bg: '#f5f0e6', ac: '#a8432b', ink: '#1f1b16' },
      fonts: { t: 'Instrument Serif', b: 'Archivo' },
      notes: 'Poco aire, mucho contraste.'
    });
    check('saneado acepta un estilo valido', !!okSpec, okSpec);
    check('saneado completa la paleta', okSpec && okSpec.pal.bg2 && okSpec.pal.mu && okSpec.pal.gl, okSpec && okSpec.pal);
    const bad = ctx.RallyIA.sanitize({ skin: 'inventado', cover: 'zzz', pal: { bg: 'rojo' }, fonts: { t: 'Comic Sans' } });
    check('saneado rechaza paleta inutil', !bad || (!bad.pal && !bad.skin && !bad.cover), bad);
    check('saneado rechaza null', ctx.RallyIA.sanitize(null) === null);
  }

  /* 6. Contraste garantizado: bg2 no puede quedar igual al texto. */
  {
    const { ctx } = makeCtx(async () => ({ ok: true, json: async () => ({}) }));
    const s = ctx.RallyIA.sanitize({ pal: { bg: '#ffffff', bg2: '#111111', ac: '#d1662a', ink: '#111111' } });
    check('la paleta final es usable', !!s && !!s.pal, s);
    check('ink y bg2 no coinciden', s && s.pal.ink !== s.pal.bg2, s && s.pal);
  }

  /* 7. parseJSON saca el objeto aunque la IA envuelva el texto. */
  {
    const { ctx } = makeCtx(async () => ({ ok: true, json: async () => ({}) }));
    const p = ctx.RallyIA.parseJSON('Claro! Aqui tienes:\n```json\n{"name":"X","pal":{"bg":"#fff"}}\n```\nListo.');
    check('parseJSON encuentra el objeto', !!p && p.name === 'X', p);
    check('parseJSON devuelve null si no hay JSON', ctx.RallyIA.parseJSON('sin json aqui') === null);
  }

  /* 8. El prompt incluye el vocabulario cerrado (la IA no puede inventar). */
  {
    const { ctx } = makeCtx(async () => ({ ok: true, json: async () => ({}) }));
    const pr = ctx.RallyIA.promptEstilo('quiero algo calido', 'Equipo X');
    check('el prompt menciona el equipo', /Equipo X/.test(pr));
    check('el prompt lista las skins validas', /refined/.test(pr) && /comic/.test(pr));
    check('el prompt prohibe el morado', /morado/i.test(pr));
  }

  console.log('\n' + pass + ' ok, ' + fail + ' fail');
  if (fail) process.exit(1);
}

main();
