# Diseño: Super Agentes — sección "Herramientas" del dashboard

Fecha: 2026-10-21. Estado: pendiente de aprobación del dueño del proyecto.

## 1. Intento y por qué

El dueño del proyecto quiere una zona discreta en el dashboard principal
(topbar) que, al hacer clic, abra un menú en cuadrícula con 6 agentes
especializados ("Super Agentes"), cada uno en un cuadradito con icono y
nombre debajo. Cada agente sirve para dos cosas que el dueño describió
así:

1. **Prompt saliente (modo puente):** el agente genera un prompt que
   inyecta todo el contexto crítico del proyecto — rúbrica activa
   (nacional 24 h / latam 28 h), criterios de guión ganador, reto,
   solución, descripción del producto, cómo se hará, paleta de colores,
   nombre del proyecto, todo el contexto disponible — de modo que el
   usuario lleva ese prompt a cualquier IA externa sin tener que copiar
   el contexto a mano.
2. **Regreso con respuesta:** el usuario pega la respuesta de la IA
   externa en el panel y la IA local la analiza (la contrasta contra la
   rúbrica, marca qué sirve, qué falta y qué corregir).
3. **Análisis directo:** la IA local analiza el contenido de una vez y
   devuelve problemas marcados (exceso de palabras, tiempo que supera
   120 s, secciones débiles), ajustes propuestos y sugerencias visuales
   (por ejemplo cómo representar un elemento del guión).

La "IA local" NO es una pieza nueva: es la base de IA que el proyecto ya
tiene (`/api/ai` de `scripts/rally_service.py`, cadena OpenCode CLI →
endpoint OpenAI-compatible vía `RALLY_AI_URL`/`RALLY_AI_KEY`/`RALLY_AI_MODEL`).
El dueño pidió explícitamente: *"usa la misma base, y si esa base se
cambia que sea automático acá también"*. Los agentes invocan el servicio
local, nunca un proveedor directo desde el navegador.

## 2. Objetivos, no-objetivos, anti-objetivos

**Objetivos**
- 6 agentes funcionales en el dashboard con el mismo backend compartido.
- Contexto inyectado de forma automática en cada prompt (nada hecho a mano).
- Los resultados entran como propuestas revisables: nada sobrescribe el
  contenido del equipo sin aceptación explícita.
- Si la base de IA del servicio cambia (env vars / modelo OpenCode), los
  agentes la siguen sin tocar código.

**No-objetivos**
- No es una pestaña 14 del flujo de 13 etapas; es una capa transversal
  (herramientas) que lee las pestañas existentes.
- No cambia la lógica de negocio ni la máquina de estados de `app.js`.
- No reemplaza el flujo de despacho multi_ia (etapa 05); se apoya en él
  conceptualmente pero vive aparte.

**Anti-objetivos (fallaría aunque funcionara)**
- UI "estilo IA": morado, glassmorphism, cards genéricas, emojis como iconos.
- Afirmar que un análisis es real cuando el backend no respondió.
- Inventar datos de rúbrica que no existan en el corpus (`knowledge/`,
  `.agents/rules/`).

## 3. Contexto técnico verificado (hechos, no supuestos)

- El dashboard es una carcasa vacía: `dashboard/index.html` solo contiene
  `#topbar`, `#sidebar`, `#main`, `#panel` y scripts; `app.js` (535 KB)
  pinta todo y posee `NAV_TABS` + `renderTab()`.
- Estado del tablero: `localStorage["rally_studio_production_state_2026_v3"]`.
  Formas confirmadas en `dashboard/content_bridge.js`:
  `state.pautado = {problema, solucion, prefactibilidad, innovacion, impacto}`;
  `state.script = {acto1, acto2, acto3, acto4}`;
  `state.budget = [{element, concept, category, units, unit_cost, url?}]`
  (costo canónico en USD; córdobas se convierten con `state.exchange_rate_bcn`);
  canvas en `state.model_canvas` (objeto con bloques tipo `socios`,
  `actividades`, `recursos`, …; lista exacta de claves a confirmar en
  implementación leyendo `app.js`).
- El estado puede estar vacío (proyecto nuevo): los agentes deben avisar
  "define tu proyecto primero" y no intentar analizar nada sin datos.
- Base de IA existente en `scripts/rally_service.py` (servicio local
  `:8000`, Python `http.server`):
  - `GET /api/ai/status`, `GET /api/ai/models` — resumen del proveedor.
  - `POST /api/ai {prompt, model?}` → `200 {status:"started", job, model}`
    (trabajo asíncrono en `AI_JOBS`, se purgan dejando 20 recientes) →
    `GET /api/ai/progress?job=<id>` con `{status, text, model, provider,
    message}`.
  - `POST /api/ai/quick {task, text}` — tarea síncrona rápida.
  - Cadena de proveedor: OpenCode CLI primero, luego endpoint
    OpenAI-compatible via `RALLY_AI_URL` / `RALLY_AI_KEY` / `RALLY_AI_KEYS`
    (CSV de respaldo) / `RALLY_AI_MODEL`.
  - Rate limit opcional (`RALLY_AI_RATE_LIMIT`): devuelve HTTP 429 con
    `{"status":"rate-limit","message":...}` — el mensaje es honesto y debe
    mostrarse tal cual.
  - Sin proveedor: `200 {"status":"no-provider", "message":...}`.
- Flujo de propuestas existente: `scripts/servir_propuesta.py --tab <tab>
  --slot <slot> --kind text --title "…" --payload <json> [--simulated]`
  deja la propuesta en el buzón; `dashboard/content_bridge.js` consulta
  `GET /api/content/manifest` cada 2 s y pinta tarjetas Aceptar/Descartar;
  al aceptar hace `GET /api/content/<id>` + `POST /api/content/<id>/apply`
  y fusiona en el estado (mapa `CAMPOS_POR_TAB`, y para pautado/script el
  slot exacto; para budget, filas). La validación de "se puede aceptar"
  está en `puedeAceptar(tab)`.
- Librerías ya cargadas en `index.html`: JSZip, pdf.js, mammoth (DOCX),
  tesseract.js (OCR) — reutilizables para el Analizador de Documentos sin
  añadir dependencias.
- Tipografías ya cargadas: Plus Jakarta Sans + JetBrains Mono. Paleta del
  dashboard en `dashboard/style.css` (biblioteca existente; nada de
  morado). Iconos: SVG inline propios (los emojis están prohibidos).
- `section_sync.js` sincroniza secciones por canal público
  (`BroadcastChannel "rally_studio_auto_sync"`); `content_bridge.js` usa
  el token `localStorage["rally_session_token"]` para autorización.

## 4. Decisiones tomadas (mías, revisables)

1. **Resolución del chequeo de construcción (2026-10-21):** la excepción
   de las 2 líneas en `index.html` está **autorizada por el dueño**
   ("Sí, edición directa" — permiso otorgado en la sesión de diseño);
   `state.shot_plan` es la clave confirmada para la shotlist;
   `state.model_canvas` tiene exactamente 9 claves; `/api/ai` no exige
   token; el estado persiste al teclear.
2. **Archivo separado, no tocar `app.js`.** Módulo nuevo
   `dashboard/super_agents.js` (+ `dashboard/super_agents.css`), cargado
   desde `index.html` con dos líneas nuevas (`<link>` y `<script defer>`).
   El único toque al motor permitido es ese par de líneas en
   `index.html`. El módulo se espera a que `app.js` pinte el topbar
   (MutationObserver sobre `#topbar`) e inyecta ahí su cuadrito.
   - Por qué: `app.js` es un motor vivo de 535 KB; tocar la máquina de
     estados crea riesgo de regresión y conflictos. Un módulo aislado con
     prefijo `rsa-` no pisa nada.
2. **Llamadas de IA solo por el servicio local.** El módulo usa
   exclusivamente `POST /api/ai` + `GET /api/ai/progress` (y
   `GET /api/ai/status` para mostrar el chip de proveedor activo). Prohibido
   en el módulo: URLs de proveedores en la nube, claves, o duplicar la
   cadena de fallback. Así la base es la misma y los cambios de base se
   propagan solos.
3. **Verificación instantánea sin IA (motor local de reglas, cliente).**
   Antes de cualquier llamada de IA, cada agente muestra chips con checks
   locales: guión (conteo de caracteres/palabras por acto, estimación de
   duración ≤ 120 s, 4 actos presentes, nombre del proyecto no en el
   primer acto-1), presupuesto (rango latam $4,000–6,000 USD o C$ con
   `exchange_rate_bcn` para nacional, `units` > 0, `url` presente),
   pautado (límites de caracteres por sección, repetición de datos),
   canvas (los 9 bloques llenos, coherencia con presupuesto por montos
   compartidos). Estos checks son deterministas y siempre disponibles,
   incluso sin IA conectada.
4. **Tres acciones por panel de agente**, en este orden visual:
   a. "Generar prompt para llevar" — construye el prompt completo
      (rúbrica activa + contexto de proyecto + contenido actual) y lo
      muestra en un bloque copiable con botón "Copiar".
   b. "Pegar respuesta de la IA externa" — textarea + botón "Analizar
      respuesta" (manda la respuesta + contexto a `/api/ai` para veredicto).
   c. "Analizar aquí" — arranca el análisis directo: checks locales
      inmediatos + análisis IA del contenido propio con problemas,
      ajustes y sugerencias visuales.
5. **Salida estructurada de IA.** Cada prompt de análisis exige respuesta
   JSON con: `veredictos` (por criterio de rúbrica, con estado
   cumple/parcial/falla), `problemas` (título, severidad Crítico/Mejora/
   Sugerencia, evidencia, corrección propuesta), `ajustes` (texto listo
   para reemplazar, con `tab` y `slot` destino) y `visuales`
   (sugerencias de representación). Si la IA no devuelve JSON válido, se
   muestra el texto crudo con etiqueta "respuesta sin formato" — jamás se
   inventa estructura.
6. **Sobrescritura prohibida por diseño.** Veredictos y ajustes viven en
   el panel. Un ajuste concreto puede copiarse al portapapeles con un
   clic + salto a la pestaña destino; pegarlo es decisión del humano.
   (Evaluado y descartado para v1: escribir propuestas en el buzón del
   servicio — requiere endpoints de creación; la vía copy+jump es segura
   y cero-backend. Si en el futuro el servicio expone POST de propuestas,
   se conecta en v2.)
7. **Historial.** Últimos 10 análisis por agente en
   `localStorage["rally_super_agents_history_v1"]` (fecha, modo, veredicto,
   resumen). Llaves del módulo siempre con prefijo `rally_super_agents_`.
8. **Iconografía.** SVG inline monocromos (llave inglesa para el cuadrito;
   claqueta, tabla de costos, folios, cuadrícula canvas, documento, cortes
   de video para cada agente). Nombres: Herramientas (contenedor);
   Revisor de Guión, Analizador de Presupuesto, Analizador de Pautado,
   Analizador de Canvas, Analizador de Documentos, Guía de Editor de Video.
9. **Fuentes y color.** Reutiliza Plus Jakarta Sans / JetBrains Mono ya
   cargadas y la paleta del dashboard existente. Cero morado. El
   cuadrito es "a media vista": opacidad baja, sube al hover, con title
   "Herramientas".
10. **Rúbrica compilada, no inventada.** Un archivo de datos
    `dashboard/super_agents_rubrics.js`, **autoría del agente (b)**
    (contenido, no del implementador): destilado editado de
    `knowledge/` y `.agents/rules/` con referencias al documento fuente
    por cada regla (citas literales solo si son cortas). Incluye los
    criterios de guión ganador (`winners_*.md`) porque el dueño los
    pidió explícitamente. Lo que no exista en el corpus no entra; se
    deja "límite no declarado en el corpus" en el panel. Si existe
    límite de pautado en `app.js` (`getPautadoLimit`), se usa como
    espejo, nunca como fuente creativa.
11. **El prompt para llevar incluye tarea, no solo contexto.** Así lo
    pidió el dueño: el prompt termina con la petición específica del
    agente ("dime qué debe tener un guión para un video ganador…",
    "corrige/ajusta…"), con la salida esperada definida por plantilla
    (entregable nuevo o crítica del actual), para que el modo "pegar
    respuesta" sepa contra qué contrastar.
12. **Checks locales literales solamente.** Duplicados en pautado =
    líneas/frases exactas o casi exactas (normalización simple); montos
    compartidos en canvas ↔ presupuesto = comparación de valores
    parseados. Nada de matching difuso: la semántica la lleva la IA.
13. **Ajustes para presupuesto y canvas.** Sin textarea destino, esos
    dos agentes emiten texto en prosa (recomendaciones) y, cuando la IA
    lo produce, además JSON estructurado copiable (filas de presupuesto
    con `element/category/units/unit_cost/url`; bloques de canvas con
    clave+texto) con instrucción manual de dónde pegarlo. V1 no permite
    fusionar esos JSON con un clic.
14. **Analizador de Documentos: límites y aviso.** Truncamiento con
    aviso visible si el texto excede el tamaño enviado (valor a decidir
    por el implementador, sugerido ~24k caracteres); OCR limitado a
    primeras páginas; aviso explícito en el panel de que el contenido
    del documento se enviará al proveedor configurado (se muestra el
    chip del proveedor activo) con confirmación del usuario antes de
    la primera llamada del análisis. No hay envío silencioso.
15. **Rango de presupuesto también en Nacional (decisión del dueño).**
    El check de rango $4,000–6,000 USD se aplica en ambos certámenes:
    en Nacional se convierte a córdobas con la tasa
    `exchange_rate_bcn` del estado antes de comparar. Decisión del
    dueño aunque la rúbrica Nacional no declara el importe.

## 5. Fuentes de contenido por agente

| # | Agente | Lee (solo lectura) | Checks locales | Prompt inyecta |
|---|--------|--------------------|----------------|----------------|
| 1 | Revisor de Guión | `state.script`, `state.rally_type`, `state.project_name` | duración estimada ≤ 120 s, 4 actos, prohibición nombre en primeros 20 s | rúbrica de guión del certamen activo, criterios de video ganador, reto/solución/paleta/nombre, contexto completo |
| 2 | Analizador de Presupuesto | `state.budget`, `state.exchange_rate_bcn`, `state.rally_type` | rango $4,000–6,000 USD (latam) / C$ convertidos con tasa y el mismo rango (nacional), units, urls | reglas de presupuesto del certamen activo + filas actuales |
| 3 | Analizador de Pautado | `state.pautado`, `state.project_name` | límites de caracteres por sección, datos repetidos, nombre repetido | reglas de pautado del certamen activo + 5 secciones actuales |
| 4 | Analizador de Canvas | `state.model_canvas`, `state.budget` | 9 bloques llenos, coherencia con filas de presupuesto | estructura canvas + presupuesto resumido |
| 5 | Analizador de Documentos | archivo del usuario (PDF/DOCX vía pdf.js/mammoth ya cargadas; tesseract como respaldo) | extracción de texto honesta con fuente marcada (`pdf`/`docx`/`ocr`) | rúbrica activa + texto extraído |
| 6 | Guía de Editor de Video | `state.script`, shotlist si existe (clave a confirmar en implementación) | nombres de assets `asset_<id>_<desc>.<ext>`, duración ≤ 120 s | lista de shots/estado de assets + convenciones del certamen |

Cuando no hay suficiente contenido en el estado, el panel lo dice en
claro ("tu guión está vacío — llénalo en la pestaña 10") con un botón que
salta a la pestaña correspondiente de `NAV_TABS` (usando el canal
público existente para cambiar de pestaña, o `location.hash` que app.js
ya maneja — a confirmar; alternativa mínima: instrucción textual).

## 6. Flujo de datos completo (modo directo, ejemplo guión)

```
Usuario abre Herramientas → Revisor de Guión
  → módulo lee localStorage (solo lectura) + super_agents_rubrics.js
  → checks locales instantáneos (chips)
  → "Analizar aquí":
      POST /api/ai { prompt: [rol + rúbrica activa + contexto proyecto
                              + contenido guión + formato JSON pedido] }
      → {started, job} → GET /api/ai/progress?job=… (poll 2 s)
      → {status:"done", text, provider}
      → parse JSON (o crudo si falla) → render en panel:
          veredictos / problemas con severidad / ajustes copiables /
          sugerencias visuales
  → usuario copia un ajuste → salta a pestaña script → pega → guarda app.js
```

Errores cubiertos: 429 rate-limit (mostrar `message` del servicio),
`no-provider` (mostrar mensaje e instrucciones de `AUTO_IA.md`,
resumidas), job `error` (mostrar `message`), sin JSON (texto crudo con
etiqueta), servicio apagado (mensaje "buzón local apagado" equivalente
con estado de salud, como hace el puente).

## 7. Lo que queda al implementador

- Claves exactas de los 9 bloques de `state.model_canvas` (leer de
  `app.js`, imprimir en pantalla solo las reales).
- Clave de shotlist dentro de `state` (si existe) para el agente 6.
- Mecanismo exacto para saltar de pestaña desde el módulo (hash,
  BroadcastChannel u otro canal público de `app.js`).
- Detalles visuales del cuadrito y del menú (tamaño, animación), dentro
  de: opacidad ≤ 0.5 en reposo, hover ≥ 1, sin emojis, sin morado,
  prefijo CSS `rsa-`, z-index por debajo del dock de propuestas.
- Formato final del historial visual (lista compacta, no cards gigantes).
- Tasas de poll de progreso (sugerido 2 s, igual que el puente).

## 8. Verificación de la implementación

- `node --check dashboard/super_agents.js` — sintaxis.
- El servicio no queda contaminado: `git status` debe mostrar solo los
  archivos nuevos + 2 líneas en `index.html`.
- Smoke test manual con el servicio levantado (`python scripts/rally_service.py`
  o el arranque habitual): abrir dashboard, ver cuadrito, abrir menú,
  abrir cada agente con estado vacío (deben avisar, no romper), con
  estado de prueba (llenar localStorage a mano), y modo directo con
  `/api/ai` en vivo (respuesta parsed + labels).
- Caso sin IA conectada: chips locales funcionan, botones de IA muestran
  el `no-provider` honesto.
