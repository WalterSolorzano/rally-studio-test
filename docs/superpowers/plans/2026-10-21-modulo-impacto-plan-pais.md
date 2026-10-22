# Módulo Impacto y Plan País — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cuarto módulo de `design/` que produce recursos de video (PNG y WebM animados) de alineación ODS + Plan Nacional, con animaciones editables, narración pulible con IA y grabación con micrófono opcional.

**Architecture:** Módulo estático vanilla JS al estilo `kit.html`. Una función de composición `componerLamina()` genera primitivas declarativas (rect/texto/icono en lienzo 1920×1080) que pintan DOS renders desde la misma fuente: pintor DOM (edición/preview) y pintor canvas (video/PNG) — cero drift visual. Estado dentro de la identidad compartida `rally_design_v5` (campo `impacto`). IA por `RallyIA` (design/ia.js, cuota diaria). Datos ODS en `design/ods_data.js` generado desde el catálogo del dashboard.

**Tech Stack:** Vanilla ES5 + CSS container queries, html2canvas (ya en kit), MediaRecorder + canvas.captureStream, JSZip (CDN, fallback secuencia PNG), pytest + Node probes (patrón tests/js/palette_probe.js).

**Spec:** `docs/superpowers/specs/2026-10-21-modulo-impacto-plan-pais-design.md`

## Global Constraints

- Vanilla ES5, sin framework ni bundler (igual que el resto de design/).
- Láminas 16:9 fijas a 1920×1080 (coordenadas de primitivas en esas unidades).
- Duración de clip: 3–10 s, campo por tipo de lámina, default 5.
- Vocabulario cerrado de animación: entrada `fade|slide-izq|slide-arriba|wipe|banda`; énfasis `none|pulso|pop`; salida `none|fade|slide`.
- Nada de morado en presets de identidad; los colores oficiales ODS son contenido.
- Nada de emojis como iconos; iconos SVG del catálogo ODS.
- Nunca fingir IA; sin isla → modo manual con aviso honesto (reutilizar RallyIA).
- Textos generados por IA: siempre marcados como propuesta y editables; límite ≤ `dur × 2.25` palabras.
- Cifras (beneficiarios, etc.): solo campos manuales — nunca autogeneradas.
- Estado persistido en la identidad compartida; shock de claves legacy preservando `impacto`.
- Nombres de archivo export: `clip_<tipo>_<detalle>.<ext>`, detalle editable en el form (prefijo default derivado del brief/project_name).

## Review Focus

1. `brief.ods_ids` llega como `ODS 12` / `ODS12` / `ODS11` → chips deben casar igual. Test: Task 2 (`odsOf`).
2. Brief vacío u `ods_ids: []` → el módulo muestra los 17 ODS desactivados; no se bloquea. Test: Task 2 (`odsActivos`).
3. `rally_type` vacío → lámina `plan` en modo nacional permitido con override manual Nacional/Latam visible. Test: Task 2 (`modoEfectivo`).
4. Cuota IA agotada o isla offline → botones de IA devuelven aviso, nada se pinta como si fuera resultado de IA. Test: Task 8.
5. Máquina lenta no llega a 24 fps al grabar → fallback a secuencia PNG en ZIP sin error silencioso. Test: Task 7 (`grabarClip` maneja falla).
6. ODS 2/11 amarillos-led claros → texto sobre bloque color ODS usa tinte oscurecido si contraste < 4.5. Test: Task 4 (`tintaSobre`).

---

### Task 1: Catálogo ODS en design/

**Files:**
- Create: `scripts/gen_ods_data.py`
- Create: `design/ods_data.js` (salida del script)
- Test: `tests/test_ods_data.py`

**Interfaces:**
- Consumes: `dashboard/app.js` — const `ODS_CATALOG` (línea 6005+, campos `id, code, name, color, icon, shortTarget`).
- Produces: `var ODS_DATA = [{id:int, code:str, name:str, color:'#hex', icon:'<svg path...>', shortTarget:str}, ...]` en `design/ods_data.js` — 17 entradas. Lo consumen Tasks 4, 5, 7, 8.

- [ ] **Step 1: Write the failing test** — `tests/test_ods_data.py`: correr `python scripts/gen_ods_data.py`, luego leer `design/ods_data.js` y correr en Node un probe inline (`node -e "load file; console.log(JSON.stringify(...))"`) afirmando: existe `ODS_DATA`, 17 entradas, cada una con `id, code, name, color (#hex), icon, shortTarget` no vacíos, ids 1..17 sin repetidos. Skip si node no disponible (patrón de `tests/test_design_palette.py`).
- [ ] **Step 2: Run test to verify it fails** — `python -m pytest tests/test_ods_data.py -v` → FAIL (archivo no existe).
- [ ] **Step 3: Implement `scripts/gen_ods_data.py`** — parser con regex que extrae objetos de `ODS_CATALOG` de `dashboard/app.js` (campos id/code/name/color/icon/shortTarget; ignorar `unTarget/diagnostic/mechanism`), re-serializa como `design/ods_data.js` con cabecera de comentario "generado por scripts/gen_ods_data.py — editar el catálogo del dashboard, no este archivo". Idempotente.
- [ ] **Step 4: Run test to verify it passes** — `python -m pytest tests/test_ods_data.py -v` → PASS.
- [ ] **Step 5: Commit** — `git add scripts/gen_ods_data.py design/ods_data.js tests/test_ods_data.py && git commit -m "feat(design): catalogo ODS canonical para el modulo impacto"`

### Task 2: Estado `impacto` en la identidad compartida

**Files:**
- Modify: `design/shared.js` — tras `defaultIdentity()` agregar `impactoPorDefecto()`; `normalizeIdentity` debe preservar/merge `impacto` (incl. migración LEGACY_KEYS); `cargarBrief(ident, cb)` cambia `cb(true)` → `cb(true, b)` (b = objeto brief; los módulos existentes ignoran el arg extra).
- Test: `tests/test_design_impacto.py` + probe `tests/js/impacto_probe.js` (patrón `tests/js/palette_probe.js`: carga `design/shared.js` y `design/impacto.js` con stubs mínimos en Node).

**Interfaces:**
- Consumes: Task 1 `ODS_DATA`.
- Produces (firmas que usan Tasks 4–8):
  - `impactoPorDefecto()` → `{ preset:'', dur:5, odsOn:{}, textos:{}, plan:{modo:'', programas:[], municipio:'', cifra:'', texto:''}, narracion:{}, anim:{ mosaico:{entrada:'banda',enfasis:'pulso',salida:'fade'}, ficha:{entrada:'fade',enfasis:'pop',salida:'none'}, plan:{entrada:'wipe',enfasis:'none',salida:'fade'} } }`.
  - `odsOf(txt)` → int|null (parser tolerante: dígitos tras la subcadena 'ODS', case-insensitive, sin espacios).
- Delimitación exacta: `impactoPorDefecto` y `odsOf` viven en `design/shared.js` y se implementan y prueban aquí. `odsActivos`, `modoEfectivo` y `tintaSobre` son de `design/impacto.js` y se implementan y prueban en Task 4 (no en Task 3, que solo crea páginas).

- [ ] **Step 1: Write the failing test** — en probe Node: (a) `odsOf('ODS 12')==12`, `odsOf('ODS11')==11`, `odsOf('ods 9')==9`, `odsOf('')==null`, `odsOf('Reto 3')==null`; (b) `impactoPorDefecto()` tiene las claves y defaults del contrato; (c) `normalizeIdentity(JSON.parse(JSON.stringify({...identMinima, impacto:{odsOn:{12:false}}})))` conserva `impacto.odsOn[12]===false`.
- [ ] **Step 2: Run test to verify it fails** — `python -m pytest tests/test_design_impacto.py -v` → FAIL.
- [ ] **Step 3: Implement** — firmas exactas arriba en `design/shared.js`.
- [ ] **Step 4: Run all design tests** — `python -m pytest tests/test_design_palette.py tests/test_design_impacto.py -v` → PASS (regresión de paleta incluida).
- [ ] **Step 5: Commit** — `git commit -m "feat(design): estado impacto en identidad compartida + parser ODS tolerante"`

### Task 3: Módulo — páginas y navegación

**Files:**
- Create: `design/impacto.html` (clona estructura de `kit.html`: sidebar + `main` + controles en `<details>` + columna preview).
- Create: `design/impacto.css` (tokens del chrome copiados del bloque `:root` de `index.html`; layout de preview 16:9).
- Create: `design/impacto.js` (creado aquí vacío con el esqueleto de tareas 4–8; primero solo carga identidad y brief).
- Modify: `design/index.html`, `design/kit.html`, `design/thumb.html` — añadir al sidebar el enlace `<a href="impacto.html"` con icono objetivo/plan (SVG stroke propio, no emoji) y tooltip "Impacto y Plan País".
- Modify: `design/kit.html`/`index.html`/`thumb.html` no requieren más cambios.

**Interfaces:**
- Consumes: `shared.js` (`loadIdentity/cargarBrief`), `ods_data.js` (ODS_DATA), `ia.js` (RallyIA), `fonts.js` (loadFont).
- Produces: página navegable en el sidebar; `impacto.js` expone el estado global `IMP = loadIdentity()` con repintado central `pintar()` (stub en este task; se llena en Task 4).

- [ ] **Step 1: Crear `design/impacto.html`** — secciones de controles: "Preset y láminas", "ODS" (chips on/off), "Plan کشور" (programas checkbox, municipio, cifra), "Animación" (selects entrada/enfasis/salida + input segundos por tipo), "Narración" (textarea por lámina + botones "Pulir con IA"/"Proponer conexión" + estado), "Exportar" (PNG por lámina, Grabar clip con checkbox micrófono, fallback ZIP, campo nombre de archivo). Preview central: `<div class="stage">` con `<div id="lamina">` 16:9.
- [ ] **Step 2: Añadir enlace de sidebar** en los 3 módulos existentes (marcar active solo en impacto.html).
- [ ] **Step 3: Verificación manual** — `python -m http.server 8899` y abrir `http://127.0.0.1:8899/design/impacto.html`: carga sin errores en consola, sidebar navega, el brief vacío no rompe (aparecen ODS del catálogo si el renderer stub los lista — puede ser lista sin pintar aún; lo QUE pinta es Task 4).
- [ ] **Step 4: Commit** — `git commit -m "feat(design): pagina del modulo impacto con sidebar en los 4 modulos"`

### Task 4: Composición y render de láminas (DOM + canvas desde primitivas)

**Files:**
- Modify: `design/impacto.js` — funciones puras + pintadores.
- Test: `tests/test_design_impacto.py` (extender probe).

**Interfaces:**
- Consumes: `impactoPorDefecto`, `odsOf` (Task 2, shared.js); `ODS_DATA` (Task 1); identidad `S` (pal/fonts/team).
- Produces (firmas exactas):
  - `odsActivos(ident, briefOds)` → lista `[{id, on, brief:bool}]` — unión: ids del brief on por defecto (`brief:true`) + resto del catálogo `on:false` salvo override en `ident.impacto.odsOn`; orden: ids del brief primero, luego catálogo ascendente.
  - `modoEfectivo(ident, brief)` → `'nacional'|'latam'` — `ident.impacto.plan.modo` si hay override manual, si no `ident.rallyType`/brief.
  - `tintaSobre(hexFondo)` → color de texto con contraste ≥ 4.5 (usa `contrastRatio`/`darken` ya existentes en shared.js).
  - `componerLamina(tipo, estado, odsSel)` → array de primitivas en unidades 1920×1080:
    `RECT {k:'rect', x,y,w,h, color, r?}`, `TXT {k:'txt', x,y, text, font, size, weight, color, align?, letter?}`, `ICO {k:'ico', x,y, s, color, path}` (path = atributo `d` del icono ODS). `tipo`: `'mosaico'|'ficha'|'plan'`. `odsSel` = lista de Task 2 con `on:true`. Estado incluye `S.impacto`, `S.pal`, `S.fonts`, `S.team`.
  - `pintarDOM(el, primitivas)` — crea `<div>`s absolutos (rect) / `<span>` (txt) / `<svg><path>` (ico) dentro de `el`.
  - `pintarCanvas(ctx, primitivas, escala)` — mismas primitivas con `ctx.roundRect`/`fillText`/`Path2D`.
  - Contrato: mismo `componerLamina` alimenta ambos; el plan: banda sup. con "PNDH 2022–2026" + eje (nacional) o "Agenda sostenible" chips libres (latam), chips de checkboxes de programas, municipio y cifra como TXT.

- [ ] **Step 1: Write the failing test** — probe: `odsActivos({}, [])` devuelve los 17 del catálogo con `on:false,brief:false`; `odsActivos(identConOverride, ['ODS 12','ODS 9'])` marca 12 y 9 `on:true,brief:true` y respeta `odsOn`; `modoEfectivo` devuelve override antes que brief; `tintaSobre('#DDA63A')` contraste ≥ 4.5; `componerLamina('mosaico', estadoFijo, ods2on)` devuelve primitivas con `rect` coloreados = `ODS_DATA[i].color` de los ODS activos y TXT con el nombre corto; `pintarCanvas` no lanza (mock de ctx que registra llamadas).
- [ ] **Step 2: Run test** → FAIL.
- [ ] **Step 3: Implement** — en `design/impacto.js`: `odsActivos`, `modoEfectivo`, `tintaSobre`, los 3 pintadores y la definición de los 3 presets (`RALLY_IMPACTO_PRESETS = [{id:'bloques',...},{id:'bandas',...},{id:'ficha',...}]` en el mismo impacto.js, cada uno con composición y deco distinta del mismo vocabulario de primitivas).
- [ ] **Step 4: Run test** → PASS.
- [ ] **Step 5: Verificación visual manual** — abrir el módulo: el preview DOM y 2 capturas (PNG por pintarCanvas via botón export en Task 6) muestran lo mismo.
- [ ] **Step 6: Commit** — `git commit -m "feat(design): compositor+renderers de lamina mosaico/ficha/plan"`

### Task 5: Animación con timeline editable

**Files:**
- Modify: `design/impacto.js` + `design/impacto.css`.
- Test: `tests/test_design_impacto.py` (extender probe).

**Interfaces:**
- Consumes: `componerLamina`/`pintarDOM`/`pintarCanvas` (Task 4); `S.impacto.anim` + `S.impacto.dur` (Task 2).
- Produces:
  - `tamanosFase(entrada,enfasis,salida,dur)` → `{tIn, tEn, tOut}` en segundos: entrada 20% del total (mín 0.6 s), énfasis 30% (sienfasis≠'none'), salida 20% (si ≠ 'none'); el remanente es hold. Suma ≤ dur. Lanza `RangeError` si `dur` fuera de 3–10.
  - `faseEn(t, fases)` → `'in'|'enf'|'hold'|'out'|'fin'`.
  - Reproductor DOM: botón "Ver animación" que aplica clases CSS (`anim-in-fade`, `anim-in-banda`, `anim-enf-pulso`, …) con delays según fases; al terminar todo queda en estado final (frame de export).

- [ ] **Step 1: Write the failing test** — `tamanosFase('banda','pulso','fade',5)` → `{tIn:1.0,tEn:1.5,tOut:1.0}` (hold 1.5); `tamanosFase('fade','none','none',5)` → `{tIn:1.0,tEn:0,tOut:0}`; `tamanosFase(...,2)` lanza RangeError; `faseEn` en t=0→'in', t=2→'hold', t≥5→'fin'.
- [ ] **Step 2: Run test** → FAIL.
- [ ] **Step 3: Implement** — CSS del vocabulario cerrado (5 entradas + 3 énfasis + 3 salidas) y selects del form enlazados a `S.impacto.anim[tipo]`/`dur` con guardado en identidad.
- [ ] **Step 4: Run test** → PASS.
- [ ] **Step 5: Verificación manual** — cambiar entrada/énfasis/salida y dur, replay reproduce lo elegido.
- [ ] **Step 6: Commit** — `git commit -m "feat(design): timeline de animacion editable del modulo impacto"`

### Task 6: Export PNG

**Files:**
- Modify: `design/impacto.js`, `design/impacto.html`.
- Test: manual (salida binaria; el pipeline canvas se prueba por contraste en Task 4 y el zoom de captura es puro runtime). Añadir `tests/test_ui_contracts.py` caso si existe el patrón de presencia de botones (`grep`-declarativo) — opcional.

**Interfaces:**
- Consumes: `componerLamina`+`pintarCanvas` al frame final (t=dur → fase 'fin'), `S.team.slug` no existe → slug de `S.team.name`/brief.
- Produces: función `exportarPNG(tipo)` — genera canvas 1920×1080 (escala x2 con `ctx.scale` optional correctness: primitivas ya están en 1920×1080, se exporta 3840×2160 con `escala=2`), `canvas.toBlob` → descarga `clip_<tipo>_<detalle>.png` (detalle del input de nombre del form, default "odsmosaico" / "ficha03" / "planpais" según tipo+ODS).

- [ ] **Step 1: Implement** botones "PNG" junto a cada lámina generada; el estado final debe coincidir con el preview DOM (dato de vérif manual Task 4/5).
- [ ] **Step 2: Verificación manual** — exportar 3 PNG (1 por tipo) y confirmar dimensiones 3840×2160 y contenido correcto.
- [ ] **Step 3: Commit** — `git commit -m "feat(design): export PNG del modulo impacto"`

### Task 7: Grabar clip WebM (+ audio y fallback ZIP)

**Files:**
- Modify: `design/impacto.js`, `design/impacto.html` (checkbox micrófono + estado).
- Test: `tests/test_design_impacto.py` (lógica de fases/fallback; la grabación real es manual).

**Interfaces:**
- Consumes: pintor canvas (Task 4), `tamanosFase`/`faseEn` (Task 5).
- Produces: `grabarClip(tipo, segundos, streamAudio|null) → Promise<Blob>`:

- [ ] **Step 1: Write the failing test** — probe: secuencia de llamadas `faseEn` para `mock` de 24 fps sobre dur=5 reproduce orden `in→enf|hold→out` y totales de frames `Math.round(24*segundos)`; si `MediaRecorder` falla (stub que lanza), `grabarClip` resuelve contipo de fallback `{zip:true}` — separar en `planificarGrabacion(segundos)` → `{modo:'webm', fps:24} | {modo:'png', fps:24, frames:N}` y probar `planificarGrabacion` directo.
- [ ] **Step 2: Run test** → FAIL.
- [ ] **Step 3: Implement** — canvas offscreen 1920×1080, `canvas.captureStream(24)`, si hay audio: `new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks])`; `MediaRecorder` con mimeType `'video/webm;codecs=vp8,opus'` fallback `'video/webm'`; cuenta regresiva 3-2-1 visible; raf loop que pinta `faseEn(t/dur)` hasta t=segundos y detiene recorder; `Promise<Blob>` → descarga `clip_<tipo>_<detalle>.webm`. Fallback: si MediaRecorder no existe o lanza, capturar 1 canvas por frame (24/s) → `JSZip` (CDN `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`) → zip descargado; aviso en el estado.
- [ ] **Step 4: Run test** → PASS.
- [ ] **Step 5: Verificación manual** — grabar clip de 3 s con animación y revisar: duración del webm ≈ 3 s (±0.5), re-grabable, con checkbox micrófono el archivo lleva audio.
- [ ] **Step 6: Commit** — `git commit -m "feat(design): grabacion webm del clip con audio optativo y fallback zip"`

### Task 8: Narración con IA

**Files:**
- Modify: `design/impacto.js`, `design/impacto.html`.
- Test: `tests/test_design_impacto.py` (extender probe).

**Interfaces:**
- Consumes: `RallyIA.job(prompt)` (design/ia.js, cuota), textos del form, `modoEfectivo`, ODS activos.
- Produces:
  - `palabrasMax(seg)` → `Math.floor(seg * 2.25)` (135 wpm).
  - `promptPulir(texto, contexto, palabrasMax)` → string.
  - `aplicarPropuesta(area, texto)` → nunca auto-ejecuta: muestra el resultado en el textarea con clase `propuesta` (placeholder editable) y botón "Aplicar"; si excede `palabrasMax` se muestra truncado con aviso.
  - "Proponer conexión": un solo `RallyIA.job` arrastrando TODOS los ODS activos + campo "resumen de la solución" (input en la sección Narración); reparte el resultado por ODS en las área ficha.

- [ ] **Step 1: Write the failing test** — `palabrasMax(5)==11`, `palabrasMax(3)==6`; `promptPulir` exige "solo el texto narrado, ≤ N palabras, español neutro" en el string; `aplicarPropuesta` no escribe si el textarea original estaba vacío y sin confirmación (código de guard).
- [ ] **Step 2: Run test** → FAIL.
- [ ] **Step 3: Implement** — textareas por lámina guardados en `S.impacto.narracion`; botones conectan a `RallyIA.job` con consumo de cuota ya interno; estado de cada llamada con aviso fiel ("Cuota agotada…", "Sin conexión…"); sin isla → sigue manual (spec §2).
- [ ] **Step 4: Run test** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(design): narracion pulible por IA en el modulo impacto"`

### Task 9: Empaquetado y cierre

**Files:**
- Modify: `scripts/gen_pagina_diseno.py` — `COPIAR_HTML += ['impacto.html']`, `COPIAR_JS += ['impacto.js', 'ods_data.js']`, `COPIAR_CSS += ['impacto.css']`.
- Test: `tests/test_gen_diseno_pack.py` (nuevo, pequeño).

- [ ] **Step 1: Write the failing test** — correr `scripts/gen_pagina_diseno.py --slug probe` contra out temporal y afirmar que `impacto.html`, `impacto.js`, `ods_data.js`, `impacto.css` existen en la salida.
- [ ] **Step 2: Run test** → FAIL.
- [ ] **Step 3: Implement** las listas del script.
- [ ] **Step 4: Run test** → PASS.
- [ ] **Step 5: Suite completa** — `python -m pytest tests/ -k "design or ods or gen_diseno" -v` → PASS.
- [ ] **Step 6: Commit** — `git commit -m "feat(design): pagina publicada incluye modulo impacto"`

---

## Notas para el executor

- Windows/PowerShell: `python -m pytest`, no pytest global; Node probes con `NODE = shutil.which("node")` y skip si falta (patrón `tests/test_design_palette.py`).
- Nada de morado (`isPurpleHex` ya existe en shared.js); los colores ODS oficiales entran como datos, no como paleta.
- El módulo no toca `rally_service.py`, `dashboard/app.js` ni validaciones (solo leer app.js en gen_ods_data.py).
- `contraste` — validar con contrastRatio sobre 'light' ODS 2/11 amarillos ya cubierto por `tintaSobre` en Review Focus 6.
