# Super Agentes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar sección "Herramientas" al dashboard (cuadrito discreto en topbar → menú de 6 Super Agentes, cada uno con prompt saliente, pegado de respuesta externa y análisis directo vía la IA local existente).

**Architecture:** Módulos nuevos autocontenidos (`dashboard/super_agents.js` + `dashboard/super_agents.css` + `dashboard/super_agents_rubrics.js`) que se inyectan en `#topbar` con un MutationObserver; `app.js` no se toca. La única edición al motor es el par de líneas autorizado en `index.html`. Los checks locales son deterministas (sin IA); el análisis IA va solo por `POST /api/ai` + `GET /api/ai/progress` del servicio local `:8000` y devuelve JSON estructurado con fallback crudo. Nada sobrescribe el estado del equipo: copy + salto de pestaña.

**Tech Stack:** JS vanilla (sin build), CSS con prefijo `rsa-`, localStorage (`rally_studio_production_state_2026_v3` + `rally_super_agents_history_v1`), librerías ya cargadas (pdf.js, mammoth, tesseract.js), servicio local `scripts/rally_service.py` como único backend IA.

**Spec:** `docs/superpowers/specs/2026-10-21-super-agentes-design.md`

## Global Constraints

- **MOTOR INTACTO:** prohibido editar `dashboard/app.js`, `dashboard/content_bridge.js`, `dashboard/section_sync.js`, `scripts/rally_service.py`. Única excepción autorizada: exactamente 2 líneas nuevas en `dashboard/index.html` (1 `<link>` CSS + 1 `<script defer>`), insertadas tras `content_bridge.js` (línea 26).
- Prefijo CSS `rsa-` en todo; llaves de localStorage del módulo siempre `rally_super_agents_*`.
- Sin emojis como iconos; SVG inline monocromos. Sin morado, sin glassmorphism. Fuentes ya cargadas: Plus Jakarta Sans + JetBrains Mono.
- IA SOLO por el servicio local: `POST http://localhost:8000/api/ai {prompt, model?}` → `200 {status:"started", job}` → poll `GET /api/ai/progress?job=<id>` cada 2 s → `{status, text, provider, message}`. `GET /api/ai/status` alimenta el chip de proveedor. Prohibido: URLs de nube, claves, duplicar la cadena de fallback del servicio.
- Estado: `localStorage["rally_studio_production_state_2026_v3"]`. Claves confirmadas: `state.shot_plan` (array); `state.model_canvas` con exactamente 9 claves `["socios","actividades","propuesta","relaciones","segmentos","recursos","canales","costes","ingresos"]` (app.js:8220). Salto de pestaña: `switchTab(tabId)` es función global de app.js (app.js:2219) — el módulo la invoca con `window.switchTab(...)`.
- Límites de pautado: espejo de `getPautadoLimit` (app.js:263) — Latam: problema 1250, solucion 1250, impacto 1000, innovacion 1000, prefactibilidad 1500; Nacional: null (sin tope). Mínimo 150 caracteres por sección (espejo de `isPautadoComplete`, app.js:680).
- Guion: 4 actos, 240–270 palabras en total, locución 130–140 palabras/min (`.agents/rules/pautado-y-guion.md`). Duración estimada = palabras totales / 2.25. Acto I: prohibido el nombre del proyecto. Cierre Latam: "piloto en [ciudad], replicable en toda América Latina". Assets: `asset_<shotlist_id>_<descripcion>.<ext>`. Cifras del guion == cifras del presupuesto.
- Presupuesto: total = Σ `units * unit_cost` (USD canónico). Rango $4,000–6,000 USD en Latam; en Nacional el MISMO rango convertido a C$ con `state.exchange_rate_bcn` (decisión del dueño). `units > 0` y URL de respaldo en cada fila.
- Rúbricas: NADA inventado. Cada regla de `super_agents_rubrics.js` lleva su `ref` al documento fuente (`knowledge/*.md`, `.agents/rules/*.md`). Lo no declarado se etiqueta "límite no declarado en el corpus".
- Historial: últimos 10 análisis por agente en `rally_super_agents_history_v1`.
- Commits por tarea, conventional commits.

## Review Focus

Los cinco modos de fallo que la spec implica y ningún test unitario ejercita (cada uno con su prueba en la tarea dueña):

1. **Estado vacío / proyecto sin definir** — abrir cualquier agente con localStorage vacío debe avisar "define tu proyecto primero" sin crash ni llamadas IA. Prueba: Task 2 (funciones puras no lanzan con `{}`) + smoke Task 6.
2. **Estado cambia después de abrir el panel** — checks y prompts releyendo el estado en cada acción, nunca una copia en caché desde la apertura. Prueba: Task 2 (las funciones puras reciben `state` como parámetro; el caller relee siempre) + smoke Task 6.
3. **Servicio IA: 429 rate-limit / no-provider / servicio apagado** — mensaje del servicio mostrado tal cual; `no-provider` no se disfraza de ok; fetch que falla → mensaje "buzón local apagado". Prueba: Task 4 (`_classifyAIResponse`) + smoke Task 6.
4. **IA devuelve texto que no es JSON** — render crudo con etiqueta "respuesta sin formato", jamás estructura inventada. Prueba: Task 2 `parseAIResult` + Task 4 render.
5. **Documento que excede el límite / envío sin permiso** — truncamiento visible (~24k chars) con aviso de cuánto se envió y confirmación explícita antes de la primera llamada, con chip del proveedor activo. Prueba: Task 5 (`truncateWithNotice` puro) + smoke Task 6.

---

### Task 1: Rúbricas compiladas `dashboard/super_agents_rubrics.js`

**Files:**
- Create: `dashboard/super_agents_rubrics.js`

**Interfaces:**
- Consumes: nada (archivo de datos puro; se auto-registra en `window.RSA_RUBRICS` y `globalThis.RSA_RUBRICS`).
- Produces (para Tasks 3–5): `RSA_RUBRICS = { meta: { refs: { "<nombre-sin-ext>": "<ruta fuente>" } }, guion, presupuesto, pautado, canvas, videoEditor, docs }`. Cada sub-objeto de agente: `{ reglas: [{id, texto, ref}], promptTarea: string, salidaEsperada: {lleva: string, directo: string} }`, donde `ref` es una clave de `meta.refs` (ej. `"pautado-y-guion"`).

- [ ] **Step 1: Leer TODAS las fuentes del corpus antes de redactar**

Fuentes obligatorias: `knowledge/winners_latam.md`, `knowledge/winners_analysis.md`, `knowledge/rubric_matrices.md`, `knowledge/rubric_latam.md`, `knowledge/voice_notes.md`, `.agents/rules/pautado-y-guion.md`, `.agents/rules/rubricas-y-puntajes.md`, `.agents/rules/modos-rally.md`. Cifras citables solo desde estos archivos o `research/claims.json` (con su fuente). Las constantes de motor ya confirmadas están en Global Constraints de este plan.

- [ ] **Step 2: Escribir el archivo de datos**

Estructura exacta de la interface. Cada regla con su `ref`. Debe cubrir: guion (rúbrica por certamen + criterios de video ganador de `winners_*.md` + actos/ventanas de la tabla de `.agents/rules/pautado-y-guion.md`), presupuesto (rangos, moneda, unidades, urls), pautado (5 secciones, mínimos/topes/repeticiones/claims), canvas (9 bloques + coherencia con presupuesto), videoEditor (nombres de asset, duración, convenciones de cierre), docs (`promptTarea` genérico de análisis de documento contra la rúbrica activa). Para cada agente: `promptTarea` en español con la petición específica del agente (decisión 11 de la spec) y `salidaEsperada` por modo (entregable nuevo para `lleva`, crítica JSON estructurada para `directo` — decisiones 5 y 11).

- [ ] **Step 3: Verificación sintaxis + refs completas**

Run: `node --check dashboard/super_agents_rubrics.js`
Expected: sin error.
Run además un check inline de refs (cargar el archivo en una VM mínima con `window` stub y validar que todo `ref` de `reglas` existe en `meta.refs`).
Expected: `OK refs`.

- [ ] **Step 4: Commit**

```bash
git add dashboard/super_agents_rubrics.js
git commit -m "feat(super-agents): compiled rubrics data module with source refs"
```

---

### Task 2: Núcleo puro de `super_agents.js` (checks, prompt builder, parseo, historial)

**Files:**
- Create: `dashboard/super_agents.js` (núcleo puro; el mismo archivo crece en Tasks 3–5 con el arranque de UI al final)
- Create: `tests/super_agents_core.test.js` (runner con `node:vm`, cero dependencias)

**Interfaces:**
- Consumes: `window.RSA_RUBRICS` (Task 1).
- Produces (para Tasks 3–5): objeto global `RSA` con exactamente:
  - `RSA.readState()` → parse con try/catch de `localStorage["rally_studio_production_state_2026_v3"]`, fallback `{}`.
  - `RSA.scriptChecks(state, projectName)` → `{problems: [{title, severity, evidence}]}`.
  - `RSA.pautadoChecks(state)` → `{problems: [...]}` con severities `"Critico" | "Mejora" | "Sugerencia"`.
  - `RSA.budgetChecks(state)` → `{problems: [...], totalUsd: number}`.
  - `RSA.canvasChecks(state)` → `{problems: [...]}` (necesita `budgetChecks(state).totalUsd` para montos compartidos).
  - `RSA.shotlistChecks(state, projectName)` → `{problems: [...]}` para `state.shot_plan` (nombres de asset `asset_<id>_<desc>.<ext>`; ids duplicados).
  - `RSA.buildPrompt(agentCfg, rubricAgent, state, mode)` → `string`; `mode ∈ {"lleva", "directo", "externa"}`.
  - `RSA.parseAIResult(text)` → `{format: "json", data}` o `{format: "raw", text}` (nunca lanza).
  - `RSA.historyAdd(agentId, entry)` → array nuevo; `RSA.historyList(agentId)` → array (máx 10).
  - Los tests de este y demás tasks usan `RSA` desde un contexto `node:vm` sobre el source completo del archivo (sin stub DOM: el archivo es puro hasta la IIFE final).

- [ ] **Step 1: Escribir los tests fallando**

`tests/super_agents_core.test.js`: runner que lee el source de `dashboard/super_agents.js` con `fs.readFileSync`, lo corre con `vm.runInNewContext(src, ctx)` donde `ctx = { window: undefined, document: undefined, localStorage: {} , RSA_RUBRICS: stub}` y luego expone `ctx.RSA`. Suites a fijar (todas las aserciones con valores exactos):

- **scriptChecks:** con 4 actos de 50/80/60/55 palabras → `{problems: []}`; con 90/90/90/90 (360 p → ~160 s) → un problem con `"120 s"` en `title`; con `acto1` que contiene el `projectName` → un problem con `"Acto I"` en `title`; con acto vacío → problem con ese acto en `title`.
- **pautadoChecks:** latam problema=1260 chars → problem con `evidence` que incluye `"1260"` y `title` que empieza `"Problema"`; latam problema=10 chars → problem con `"150"` en `title`; nacional siempre → ningún problem por longitud; frase literal ≥25 chars repetida en dos secciones → problem con `/repetid/i` en `title`; con `state.pautado` ausente → problem con `/vac[ií]/i`.
- **budgetChecks:** latam `[{units:5, unit_cost:1000}]` (total 5000) → `problems.length === 0` (sin URL la fila con totales dentro de rango SÍ agrega problem de url — usar filas con `url` en el caso ok); latam `[{units:5, unit_cost:3000}]` (15000) → problem con `/4,?000|6,?000/i`; nacional con `exchange_rate_bcn: 36.8` y total 15000 USD → problem con `/C\$|córdoba/i`; `units: 0` → problem con `/units/i`; fila sin `url` → problem con `/url/i`; y `totalUsd === 5000` exacto en el caso ok.
- **canvasChecks:** `model_canvas` con las 9 claves (costes `"Total costo: 5000"`, ingresos `"Total ingresos: 5000"`) + budget que suma 5000 → `problems.length === 0`; con `canales: ""` → problem cuyo `title` o `evidence` incluye `canales`; con `costes: "Total costo: 9000"` y total 5000 → problem que menciona ambos valores (`/9000/` y `/5000/`); con `state.model_canvas` ausente → problem con `/9/` (bloques faltantes).
- **parseAIResult:** (a) texto con preámbulo + JSON válido con las 4 claves → `format === "json"` y `data.veredictos` array; (b) texto sin JSON → `format === "raw"`; (c) JSON truncado (primer `{` sin cierre válido) → `format === "raw"`; (d) JSON sin ninguna de las claves esperadas → `format === "raw"`.
- **shotlistChecks:** shot cuyo nombre no matchea `asset_<shotlist_id>_<descripcion>.<ext>` → problem con ese asset; dos shots con el mismo id → problem con el id duplicado; `state.shot_plan` vacío o ausente → `{problems: []}` (la shotlist es opcional; la UI avisa aparte).
- **Estado vacío:** `scriptChecks({}, "X")`, `budgetChecks({})`, `canvasChecks({})`, `pautadoChecks({})` — ninguno lanza; cada uno retorna `{problems: [...]}` (todos los avisos van como problems/labels, no como excepciones).
- **historial:** `historyAdd("guion", {mode:"directo"})` → `historyList("guion").length === 1`; insertar 12 → `length === 10` y el más nuevo primero.

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tests/super_agents_core.test.js`
Expected: FAIL (RSA undefined o primera aserción).

- [ ] **Step 3: Implementar `RSA` en `dashboard/super_agents.js`**

Signatures exactas de la interface (arriba). Detalles ya determinados por los tests:

- Duración guion: `totalWords / 2.25` segundos; `> 120` → problem "Duración estimada supera 120 s"; total de palabras fuera de [240, 270] → problem "Palabras fuera del rango 240–270"; acto vacío → problem por acto con su número.
- Nombre en Acto I: substring case-insensitive del `projectName` en `state.script.acto1` → problem "Acto I menciona el nombre del proyecto (prohibido)".
- pautado duplicados: normalizar (lowercase, sin acentos, sin puntuación); frases literales ≥25 chars repetidas entre secciones → problem. Solo literales (decisión 12 de la spec).
- budget nacional: comparar `totalUsd * exchange_rate_bcn` contra `[4000, 6000] * exchange_rate_bcn`; título/mensaje en C$ con la tasa visible en `evidence`.
- canvas montos: cada número parseado (regex `/\d[\d.,]*/` → float sin separadores) de `costes`/`ingresos` se compara contra `totalUsd` redondeado; mismatch → problem citando ambos valores.
- `parseAIResult`: localizar primer `{` y último `}`, `JSON.parse` del substring; si lanza, o el objeto no tiene ninguna clave de `["veredictos","problemas","ajustes","visuales"]` → `{format:"raw", text}`.
- `buildPrompt`: secciones fijas en este orden — `[ROL] [RÚBRICA ACTIVA (texto de rubricAgent.reglas con sus refs)] [CONTEXTO DEL PROYECTO (rally_type, project_name, reto/solución si existen en state)] [CONTENIDO ACTUAL] [TAREA: rubricAgent.promptTarea ajustada por mode] [FORMATO DE SALIDA: rubricAgent.salidaEsperada[mode]]`. `directo` exige el JSON con claves `veredictos/problemas/ajustes/visuales` y severidades `Critico/Mejora/Sugerencia`.
- Historial: key `rally_super_agents_history_v1`, estructura intern per-agent, máx 10, más nuevo primero.
- Al final del archivo: IIFE de arranque que solo activa si `typeof window !== "undefined" && !!window.document && !!document.getElementById("topbar")` — por ahora vacía (Task 3 la llena).

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `node tests/super_agents_core.test.js && node --check dashboard/super_agents.js`
Expected: PASS en ambos.

- [ ] **Step 5: Commit**

```bash
git add dashboard/super_agents.js tests/super_agents_core.test.js
git commit -m "feat(super-agents): pure core — local checks, prompt builder, AI result parser, history"
```

---

### Task 3: UI — cuadrito, menú, paneles por agente, salto de pestaña, CSS e `index.html`

**Files:**
- Modify: `dashboard/super_agents.js` (IIFE de arranque del Task 2)
- Create: `dashboard/super_agents.css`
- Modify: `dashboard/index.html:26` (exactamente 2 líneas nuevas tras `content_bridge.js`)

**Interfaces:**
- Consumes: `RSA` (Task 2), `window.RSA_RUBRICS` (Task 1, carga dinámica), `window.switchTab` (app.js:2219).
- Produces (para Tasks 4–5): registro `AGENTS` de los 6 agentes `{id, nombre, svg, tab, checksFn}` con ids `"guion", "presupuesto", "pautado", "canvas", "docs", "videoEditor"` (videoEditor: checksFn = `scriptChecks` + `shotlistChecks`), y `RSA_UI.renderPanel(agentId, rootEl)` que los Tasks 4–5 conectan a botones IA.

- [ ] **Step 1: Boot con MutationObserver + cuadrito topbar**

IIFE del Task 2: `MutationObserver` sobre `document.body` (subtree opcional) esperando que exista `#topbar`; al aparecer, agregar como último hijo el botón `rsa-tools-btn` con SVG de llave inglesa monocromo, `title="Herramientas"`, `aria-haspopup="true"`. Idempotente: si ya existe `#rsa-tools-btn`, no duplicar. z-index MENOR que el dock de propuestas (inspeccionar z-index real de `dashboard/style.css` antes de elegir; anotar la elección en el comentario CSS).

- [ ] **Step 2: Menú de 6 agentes + carga dinámica de rúbricas**

Click → overlay `rsa-tools-menu` (grid 3×2). Items con icono SVG inline monocromo + label: Revisor de Guión (claqueta), Analizador de Presupuesto (tabla de costos), Analizador de Pautado (folios), Analizador de Canvas (cuadrícula), Analizador de Documentos (documento), Guía de Editor de Video (cortes de video). Al primer panel: si `window.RSA_RUBRICS` no existe, inyectar `<script src="super_agents_rubrics.js">` dinámicamente y continuar en `onload`; si falla, panel muestra "rúbricas no cargadas" y deshabilita botones de prompt (los checks locales siguen activos). Cerrar con ESC / click fuera.

- [ ] **Step 3: Panel por agente con tres acciones y empty-state honesto**

Panel `rsa-agent-panel` con: título + botón volver al menú; chip de proveedor (placeholder en este task — Task 4 lo llena desde `/api/ai/status`); chips de checks locales (motor del Task 2, renderizados de inmediato, SIN IA); y las tres zonas de la decisión 4: (a) "Generar prompt para llevar" → block copiable con botón "Copiar"; (b) "Pegar respuesta de la IA externa" → textarea + botón "Analizar respuesta" (Task 4); (c) "Analizar aquí" → botón directo (Task 4). Empty-state exacto por agente sin datos: guion → "tu guión está vacío — llénalo en la pestaña 10" + botón `window.switchTab("script")`; presupuesto → `switchTab("budget")`; pautado → `switchTab("pautado")`; canvas → `switchTab("canvas")`; docs → pide subir archivo (no depende del estado); proyecto sin `rally_type` en cualquiera → "define tu proyecto primero" + `switchTab("certamen")`.

- [ ] **Step 4: Historial visual compacto y ajustes con copy + jump**

Historial del agente (`RSA.historyList`) como lista compacta `<li>`: fecha, modo, resumen de veredicto; sin cards gigantes. Los `ajuste` del JSON (Task 4) renderizan botón "Copiar" (portapapeles) y botón "Ir a <pestaña>" (`window.switchTab(cfg.tab)` desde el campo `tab` del ajuste); el texto se copia ANTES del salto (decisión 6: copy + jump, sin fusión).

- [ ] **Step 5: `dashboard/super_agents.css`**

Todo con prefijo `rsa-`; colores via variables CSS ya existentes de `dashboard/style.css` (prohibido hardcodear morado); sombras sutiles, radios pequeños, tipografías existentes; el cuadrito opacidad 0.4 reposo → 1 hover/focus; media query < 700 px (panel full-width). Sin emojis, sin glassmorphism.

- [ ] **Step 6: Las 2 líneas en `index.html`**

Tras `content_bridge.js` (línea 26) insertar exactamente:

```html
  <link rel="stylesheet" href="super_agents.css">
  <script src="super_agents.js?v=20261021_v1" defer></script>
```

El diff de `index.html` debe ser exactamente esas 2 líneas.

- [ ] **Step 7: Verificación**

Run: `node --check dashboard/super_agents.js && node tests/super_agents_core.test.js`
Expected: PASS / PASS smoke manual mínimo (servicio `python scripts/rally_service.py` + dashboard en navegador): (i) cuadrito visible con opacidad baja y hover completo; (ii) menú con 6 agentes; (iii) cada agente abre panel con estado vacío → aviso correcto + botón de salto funciona; (iv) con un `localStorage` de prueba sembrado a mano → chips de checks correctos y "Copiar" del prompt funciona.

- [ ] **Step 8: Commit**

```bash
git add dashboard/super_agents.js dashboard/super_agents.css dashboard/index.html
git commit -m "feat(super-agents): topbar tools menu, agent panels, tab jumps, css"
```

---

### Task 4: Cliente IA local + render de análisis (JSON/crudo) y errores honestos

**Files:**
- Modify: `dashboard/super_agents.js`
- Modify: `tests/super_agents_core.test.js` (función pura nueva `_classifyAIResponse`)

**Interfaces:**
- Consumes: `RSA.buildPrompt`, `RSA.parseAIResult`, `RSA.historyAdd` (Task 2); `RSA_UI.renderPanel`/`AGENTS` (Task 3); endpoints `POST /api/ai`, `GET /api/ai/progress?job=`, `GET /api/ai/status` del servicio `:8000`.
- Produces (para Task 5): `RSA._classifyAIResponse({status, body}|null)` → `{kind: "started"|"done"|"error"|"rate-limit"|"no-provider"|"down", message?}` (pura, testeada); `RSA.analyze(promptText, onProgress)` → `Promise<{ok:true,text,provider} | {ok:false,status,message}>`; `RSA.renderAnalysis(rootEl, result)`.

- [ ] **Step 1: Escribir el test de `_classifyAIResponse` fallando**

Agregar al archivo de tests del Task 2 (mismo runner):

```js
assert.equal(RSA._classifyAIResponse({status:429, body:{status:"rate-limit", message:"limite"}}).kind, "rate-limit");
assert.equal(RSA._classifyAIResponse({status:200, body:{status:"no-provider", message:"x"}}).kind, "no-provider");
assert.equal(RSA._classifyAIResponse({status:200, body:{status:"started", job:"j1"}}).kind, "started");
assert.equal(RSA._classifyAIResponse({status:200, body:{status:"done", text:"hola"}}).kind, "done");
assert.equal(RSA._classifyAIResponse({status:200, body:{status:"error", message:"m"}}).kind, "error");
assert.equal(RSA._classifyAIResponse({status:500, body:{}}).kind, "down");
assert.equal(RSA._classifyAIResponse(null).kind, "down");
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tests/super_agents_core.test.js`
Expected: FAIL (`RSA._classifyAIResponse` no existe).

- [ ] **Step 3: Implementar cliente + render**

- `_classifyAIResponse` según los asserts; `analyze`: `fetch POST /api/ai {prompt}` con `AbortController` (timeout 5 s); si `{status:"started", job}` → loop poll cada 2000 ms hasta `status:"done"` (resuelve) o `status:"error"` (resuelve fallido con `message`); catch de fetch/reject → `kind "down"` con mensaje "buzón local apagado". `rate-limit`/`no-provider` se retornan con el `message` del servicio exacto, sin reintentos.
- `renderAnalysis`: veredictos con estado Cumple/Parcial/Falla (colores de la paleta del dashboard); problemas con severidad + evidencia + corrección; ajustes con "Copiar" + "Ir a" (Task 3.4); visuales como lista; si `parseAIResult` dio `raw` → `<pre>` con etiqueta visible "respuesta sin formato" y el texto intacto. Al terminar: `RSA.historyAdd` con resumen.
- Botones IA quedan cableados en los tres modos de `renderPanel`; el chip de proveedor se llena desde `GET /api/ai/status` al abrir el panel (fetch tolerante a falla).

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `node tests/super_agents_core.test.js && node --check dashboard/super_agents.js`
Expected: PASS / PASS.

- [ ] **Step 5: Smoke con IA en vivo y sin IA**

Con servicio + proveedor real (OpenCode abierto o `RALLY_AI_*` en env): estado sembrado, "Analizar aquí" en Revisor de Guión → job → done → estructura renderizada (o crudo con etiqueta si la IA devolvió texto libre); historial actualizado. Con servicio apagado: "buzón local apagado". Con servicio encendido y sin proveedor: `no-provider` con su mensaje original.

- [ ] **Step 6: Commit**

```bash
git add dashboard/super_agents.js tests/super_agents_core.test.js
git commit -m "feat(super-agents): local AI client, honest error states, structured analysis render"
```

---

### Task 5: Analizador de Documentos (PDF/DOCX/OCR, truncamiento, confirmación de envío)

**Files:**
- Modify: `dashboard/super_agents.js`
- Modify: `tests/super_agents_core.test.js`

**Interfaces:**
- Consumes: pdf.js / mammoth / tesseract.js (ya cargadas en `index.html`), `RSA.analyze`, `RSA.renderAnalysis` (Task 4), panel `docs` de `renderPanel` (Task 3).
- Produces: `RSA.truncateWithNotice(text, max=24000)` → `{text, originalLength, truncated}` (pura, testeada); `RSA.extractDoc(file, onStage)` → `Promise<{text, source: "pdf"|"docx"|"ocr", pages, truncated}>`.

- [ ] **Step 1: Test de truncamiento fallando**

Agregar al archivo de tests:

```js
const t = RSA.truncateWithNotice("x".repeat(30000), 24000);
assert.equal(t.text.length, 24000);
assert.equal(t.truncated, true);
assert.equal(t.originalLength, 30000);
assert.equal(RSA.truncateWithNotice("abc", 24000).truncated, false);
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tests/super_agents_core.test.js`
Expected: FAIL (función ausente).

- [ ] **Step 3: Implementar extracción + truncamiento + confirmación**

- PDF por página con pdf.js; si el texto nativo de la primera página es vacío → respaldo OCR con tesseract.js limitado a las primeras 3 páginas (avisar cuántas se leyeron). DOCX con `mammoth.extractRawText`. Extensión desconocida → mensaje claro, no crash.
- `truncateWithNotice` a 24000 chars.
- Panel `docs`: input de archivo + aviso dominante ANTES del envío: "El contenido del documento se enviará a: <chip del proveedor activo de /api/ai/status>" con botón "Enviar a análisis" (sin envío silencioso — decisión 14). Tras extraer: chip de calidad (`source` + páginas + `truncated`), texto visible con scroll, y luego el flujo IA normal (Task 4). El prompt injecta rúbrica activa + texto truncado.

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `node tests/super_agents_core.test.js && node --check dashboard/super_agents.js`
Expected: PASS / PASS.

- [ ] **Step 5: Smoke del agente Documentos**

Con servicio y proveedor: subir un PDF de prueba → aviso con chip de proveedor → confirmar → extracción con chip de fuente/páginas → análisis renderizado. Verificar aviso de truncamiento con un archivo grande (o text sembrado en un DOCX de prueba).

- [ ] **Step 6: Commit**

```bash
git add dashboard/super_agents.js tests/super_agents_core.test.js
git commit -m "feat(super-agents): documents analyzer — pdf/docx/ocr, truncation notice, explicit send confirmation"
```

---

### Task 6: Verificación final

**Files:** read-only (correcciones vuelven a la tarea dueña).

- [ ] **Step 1: Motor limpio + suite**

Run: `git status --short && node --check dashboard/super_agents.js && node --check dashboard/super_agents_rubrics.js && node tests/super_agents_core.test.js`
Expected: solo archivos nuevos + 2 líneas en `dashboard/index.html`; suite PASS.

- [ ] **Step 2: Checklist de verificación de la spec §8 (smoke completo)**

1. Cuadrito "Herramientas": discreto en reposo, legible al hover, con title.
2. Menú con los 6 agentes, cada panel abre con estado vacío y de prueba sin romper.
3. Caso sin IA conectada: chips locales funcionan; botones IA devuelven el `no-provider` honesto; servicio apagado → estado de salud.
4. Caso con IA en vivo: respuesta JSON parseada con labels, o texto crudo con etiqueta "respuesta sin formato"; historial guarda los últimos 10.
5. Documentos: confirmación de envío con chip de proveedor visible y aviso de truncamiento cuando corresponde.
6. Ajuste "Ir a" desde cada agente salta a la pestaña correcta (pautado/budget/canvas/script) con el texto ya copiado.

Fallos → corregir en la tarea dueña correspondiente y re-ejecutar su prueba; sin nuevo scope.

- [ ] **Step 3: Commit final (solo si hubo correcciones)**

Run: `git status --short`
Expected: vacío (o solo los commits de corrección ya hechos por tarea).
