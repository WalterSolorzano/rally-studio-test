# Diseño · Capa de Agente (b) para Rally Studio

Fecha: 2026-10-18
Estado: **listo para aprobación** (nada se construye hasta que el humano lo apruebe)

---

## 1. Intención y el porqué

Hoy Rally Studio es un workbench que **funciona** (13 fases, servidor local, puente de IA,
OCR, compilación DOCX, sitio, presupuesto, guion). Pero cuando alguien descarga el repo y
abre la carpeta con su IA de programación (consola de **OpenCode** o **Antigravity**), esa
IA no sabe qué es el proyecto, qué hace cada fase, qué puede tocar y qué no, ni cómo servir
contenido a la ventana visual.

Este diseño deja el repo **preparado**: la IA que abre la carpeta se vuelve un **profesor**
que conoce todo el contexto del certamen, guía al usuario por el flujo completo, produce
contenido y propuestas, y las sirve dentro de la interfaz en tiempo real.

**El porqué de fondo:** cero API keys, cero LLMs de pago. El motor es la IA de programación
que el usuario **ya tiene** instalada y autenticada. El sistema no paga tokens; aprovecha los
que el usuario ya paga (o los gratuitos de su herramienta).

---

## 2. Vocabulario (fijo de aquí en adelante)

| Nombre | Qué es |
|---|---|
| **(a) la ventana** | El tablero que ve el usuario: `dashboard/` (13 pestañas 00–12) + `site/`. Es la cara del sistema. |
| **(b) el profe** | La IA de programación que abre la carpeta. Conoce el contexto completo, guía al usuario, produce contenido y lo sirve en (a). |
| **El motor** | La lógica del sistema: `scripts/rally_service.py`, el manejo de estado en `dashboard/app.js`, los cálculos de rúbrica, el guardado, la red. |
| **El corpus** | PDFs, DOCX, MD y JSON de investigación del repo (`research/`, `knowledge/`, `docs/`, raíz). |
| **Servir** | Que (b) deposite un resultado (texto, diseño, imagen, JSON) y (a) lo muestre, marcado como propuesta, en la pestaña que corresponde. |
| **Obra** | Construcción única del puente (código). La hace un desarrollador **una sola vez**, y se entrega ya hecha en el repo. (b) no la hace. |
| **Uso** | El día a día: (b) guía, produce contenido y sirve. Aquí (b) **nunca** toca el motor. |

---

## 3. Objetivos

1. **Contrato de entrada.** Al abrir la carpeta, (b) sabe: quién es, qué es el certamen, qué
   hace cada fase, cómo servir a (a), qué tocar y qué no, y cómo delegar.
2. **Flujo guiado completo.** (b) lleva al usuario por las 13 etapas (00 Certamen → 12
   Checklist), preguntando lo que falte (nombre, logo, equipo, ciudad, retos) cuando la
   interfaz aún no lo tenga.
3. **Producción de contenido.** (b) genera, a petición: propuestas de retos, sugerencias por
   fase, propuestas de diseño (paleta, tipografías, logo), prompts para IAs externas,
   modelos 3D en Blender, el sitio web, y revisa/corrige/analiza lo que el humano traiga.
4. **Servicio en vivo, para todos.** Lo que (b) deposita aparece en la pestaña correcta como
   propuesta aceptable/descartable, **sin recargar**, y **lo ven todos los navegadores
   conectados** — por el mismo riel que ya usan las ediciones de los usuarios entre sí.
5. **Descarga limpia y completa.** Quien descarga el repo recibe una **plantilla vacía**
   (sin datos de ningún proyecto anterior) **más todo lo necesario para operar**: corpus de
   investigación, `README.md`, `AGENTS.md`, `docs/`, `knowledge/`, `research/`, `brand/`,
   scripts y skills.
6. **Instalación de una vía.** Un documento + un script dejan el repo con dependencias,
   skills y MCPs listos, para **OpenCode y Antigravity a la vez**.
7. **Delegación y paralelismo.** (b) sabe qué se puede hacer en paralelo y qué bloquea la
   máquina, y puede repartir trabajo entre herramientas.

## 4. No-objetivos

- No reemplazar ni reescribir el `AGENTS.md` del evento. **Se conserva íntegro**; se le añade
  una capa encima.
- No convertir a (b) en desarrollador del motor (ver frontera dura, §7). La única pieza de
  código de esta entrega la escribe **el desarrollador en la fase de Obra**, y viaja ya hecha.
- **No incluir el chat dentro de la ventana.** Decisión tomada: va en una **fase siguiente**.
  Esta entrega trae el *buzón de propuestas en vivo*; el chat conversacional es comodidad,
  no necesidad.
- No introducir dependencias de pago, cuentas, ni claves API.
- No preparar el evento en sí: esto deja el **sistema** listo para que cualquiera lo use
  cuando quiera.

## 5. Anti-objetivos (haría fracasar esto aunque "funcione")

- Que (b) **invente datos** o afirme que algo es real cuando es simulado (ya es regla del
  repo; aquí se refuerza).
- Que (b) escriba en la ventana **sin que el humano lo vea** o pueda rechazarlo.
- Que (b) toque el motor y rompa el estado del usuario.
- Que el usuario tenga que **inyectar claves o pagar** para que el sistema sirva.
- Que el repo se descargue con datos de un proyecto ajeno "de ejemplo" y (b) los tome por
  reales.
- Que el índice de contexto sea tan largo que (b) se quede sin presupuesto de tokens antes
  de trabajar.

## 6. Restricciones

- Windows 10/11 primero; macOS/Linux no se rompe.
- Python 3.10+ y biblioteca estándar; nada de frameworks ni build en (a).
- (a) debe seguir funcionando **sin servidor** (GitHub Pages) — la capa de servicio no puede
  ser un requisito para ver la interfaz.
- El estado del usuario vive hoy en `localStorage`
  (`rally_studio_production_state_2026_v3`). Esto condiciona el puente (§8.5).
- **Límites de las herramientas** (verificado en su documentación):
  - OpenCode descubre skills en `.opencode/skills/<nombre>/SKILL.md`.
  - Antigravity descubre skills en `.agents/skills/<nombre>/SKILL.md` (compatibilidad con
    `.agent/skills`). **Es el mismo estándar abierto**: carpeta + `SKILL.md` con frontmatter
    `name` + `description`. Una sola fuente sirve a las dos.
  - Antigravity lee `AGENTS.md` de raíz como regla siempre activa, y también reglas por
    carpeta en `.agents/rules/*.md` (con frontmatter `trigger`). Tiene tope de **24 KB por
    archivo** y un presupuesto agregado de **~20.000 tokens** para reglas siempre activas.
    Por eso `AGENTS.md` debe quedar **corto** y apuntar a archivos, no contenerlo todo.
- Todo en español, tono sobrio, cero emojis (doctrina del repo).

---

## 7. Frontera dura: qué toca (b) y qué no

Confirmado por el humano: **exactamente** esta frontera.

### (b) SÍ toca
- **Contenido**: textos del pautado, propuestas de retos, guion, presupuesto (contenido),
  canvas, prompts para otras IAs, análisis de documentos traídos de fuera.
- **Presentación**: estructura y orden de secciones visibles, jerarquía visual, copys,
  estados vacíos, iconografía, **paleta, tipografías, logo**, imágenes y recursos, el sitio
  (`site/`), las hojas de estilo de la ventana.
- **Datos de contenido que la ventana solo muestra**: los JSON de `dashboard/data/`,
  `research/`, `knowledge/`, `brand/`, `budget/`, `script/`.

### (b) NO toca (el motor)
- `scripts/rally_service.py` y sus endpoints.
- La máquina de estado de `dashboard/app.js` (persistencia, migraciones, sincronización,
  colaboración) y `dashboard/index.html`.
- Cálculos: puntajes de rúbrica, validaciones, límites de caracteres, telemetría.
- `localStorage` y todo lo que dependa de él.
- Reglas de negocio del evento (puede *proponer* redacción nueva, no aplicarla sola).

> Si una tarea de contenido requiere tocar el motor, (b) **para, lo dice, y pide permiso**.
> Eso pasa a ser una tarea de Obra, distinta de su rol.

---

## 8. Arquitectura de la solución

### 8.1 `AGENTS.md` — el contrato de entrada (raíz del repo)

Se **conserva** el contenido actual (reglas de oro, modo Nacional/Latam, paralelismo,
anti-patrones, estructura de datos, checklist SIRLI, herramientas). Se le **añade arriba** un
bloque nuevo, corto y con punteros:

1. **Quién eres.** Eres (b), el profe. Conoces el certamen y el corpus. Produces contenido y
   presentación; **no** programas el motor (§7).
2. **Cómo arrancar.** Orden de lectura: `brief.json` → este archivo → `knowledge/INDICE.md`
   → solo los documentos que el índice marque como relevantes.
3. **El flujo.** Las 13 etapas y qué debe existir al final de cada una (§8.7). Si algo falta,
   se le **pregunta al humano**, no se inventa.
4. **Cómo servir a (a).** El contrato de contenido (§8.5).
5. **Cómo delegar.** Puntero a la tabla de paralelismo ya existente.
6. **Cómo instalarte.** Puntero a `docs/INSTALACION_AGENTE.md` y `scripts/setup_agente.ps1`.

Se mantiene **un solo archivo de entrada** porque OpenCode y Antigravity leen `AGENTS.md` en
la raíz; un segundo archivo duplicado se desincroniza. El archivo debe quedar **por debajo de
24 KB** (tope de Antigravity) — se logra moviendo el detalle a las reglas y skills.

**Guías profundas en `.agents/rules/*.md`** (Antigravity las lee con *progressive disclosure*;
OpenCode las ignora sin daño porque el contenido también se referencia desde las skills):
una regla por tema grande — frontera contenido/motor, modos Nacional vs. Latam, rúbricas y
puntajes, reglas del pautado y sus límites, reglas del guion PAS-V, criterios del video.
Esto mantiene `AGENTS.md` corto y carga el detalle solo cuando hace falta.

### 8.2 Índice de contexto — `knowledge/INDICE.md`

Un solo archivo que lista **cada fuente del corpus** con 1–3 líneas: qué es, para qué sirve,
cuándo leerla y su ruta. Es lo que permite a (b) trabajar sin leerse 2 MB de PDFs.

Incluye: `brief.json`, `Análisis del Rally de Innovación.txt`,
`Rally_Innovacion_Nicaragua_Analisis.pdf`, `Proyectos Ganadores de Rally Latam.md`,
`chatgptdeep-research-report.md`, `Operación Titan_UNI_*.docx`,
`Reporte_Pautado_Rally_2026.docx`, `rubrica_oficial_latam.jpeg`, los dos manuales maestros
(`docs/MANUAL_MAESTRO_*.md/.pdf`), `knowledge/rubric_latam.md`, `knowledge/rubric_matrices.md`,
`knowledge/winners_*.md`, `knowledge/winners_database.json`, `knowledge/voice_notes.md`,
`research/challenges*.json`, `research/challenges_report.md`, `research/claims.json`,
`docs/canvas.md`, `PRODUCT.md`, `DESIGN.md`, `brand/tokens.css`, `brand/palette.json`,
`graphify-out/GRAPH_REPORT.md`.

Regla del índice: por fuente, una línea de "cuándo sí" y una de "cuándo no". Se genera con
`scripts/gen_indice.py` para que no se desactualice a mano.

### 8.3 Skills — una sola fuente, dos destinos

Se guardan **una vez** en `skills/<nombre>/SKILL.md` (raíz del repo), y
`scripts/setup_agente.ps1` las refleja en:

- `.opencode/skills/` → OpenCode
- `.agents/skills/` → Antigravity

El reflejo es por **junction** de directorio (no requiere administrador en Windows) y, si
falla, por copia. Un solo `SKILL.md` con frontmatter `name` + `description` sirve a las dos.

| Skill | Para qué |
|---|---|
| `contexto-rally` | Cargar el índice + `brief.json` y decidir qué leer. Punto de entrada de cualquier tarea. |
| `guiar-usuario` | Conducir las 13 etapas, detectar lo que falta y preguntarlo. |
| `proponer-retos` | Generar propuestas de retos alineadas al certamen activo. |
| `sugerir-por-fase` | Sugerencias puntuales para la fase que el usuario pida. |
| `ingestar-investigacion` | Traer un PDF/MD/DOCX de fuera (ej. investigación de z.ai) → limpiar, corregir, analizar contra la biblioteca de campeones y las bases → servir en la pestaña editable correcta. |
| `propuesta-diseno` | Desde nombre/logo/semilla → propuestas de paleta, tipografías, logotipo, tokens. |
| `servir-a-ventana` | El contrato de contenido (§8.5) en pasos concretos. |
| `modelo-3d-blender` | Generar modelos 3D con Blender headless / MCP cuando se pida. |
| `publicar-sitio` | Construir `site/` y publicarlo. |
| `auditar-entregable` | Revisar cualquier entregable contra rúbrica + bases + propósito del grupo. |

Cada `SKILL.md` es **corto** (procedimiento + punteros al corpus y a los scripts), no un
volcado de conocimiento. El conocimiento vive en el corpus; la skill dice **cómo usarlo**.

### 8.4 MCPs y dependencias

**MCPs**
- `playwright` — ya en uso en el repo (`.playwright-mcp/`). Se declara formalmente en
  `opencode.json` (config de proyecto de OpenCode).
- `blender-mcp` (`ahujasid/mcp-for-blender`, MIT, gratis) — **opcional**, solo si se pide 3D.
  Requiere Blender ≥ 3.0 + addon + servidor local.
- Nada más por defecto. Cada MCP extra es una fuente de fallos; se añade solo con motivo.

La config de MCP **no es compartida**: OpenCode la lee de `opencode.json` en el proyecto;
Antigravity la lee **global** en `~/.gemini/…`. Por eso `docs/INSTALACION_AGENTE.md` explica
los dos caminos y `setup_agente.ps1` solo escribe el de OpenCode (nunca toca la config global
de Antigravity sin permiso explícito).

**Python** — lo que ya lista `requirements.txt`, más:
- Un lector de PDF/DOCX (`pdfplumber` o `PyMuPDF`) para que `ingestar-investigacion` lea sin
  depender de IA.
- `easyocr`, `chatterbox-tts`/`kokoro`, `ffmpeg` siguen siendo **opcionales** y pesados; el
  instalador pregunta antes.

**Instalador**: `scripts/setup_agente.ps1` — verifica Python, instala `requirements.txt`,
crea `skills/` si falta, refleja a `.opencode/skills/` y `.agents/skills/`, escribe el bloque
MCP de `opencode.json`, y comprueba que el servidor arranca. **Idempotente** (correrlo dos
veces no daña) y **transparente** (nunca descarga nada sin mostrar qué y por qué).

### 8.5 Canal de contenido (b → a) en vivo

Este es el corazón técnico. Hoy hay tres mundos separados:

- (b) vive en **archivos del repo**.
- El estado del usuario vive **en el navegador** (`localStorage`).
- `brief.json` lo escribe **solo** `scripts/init_brief.py`; (a) nunca lo toca.

**Para que el servicio funcione hacen falta dos puentes, y los dos son Obra (una vez):**

**(1) Puente de estado (a ↔ b).** Para que (b) sepa qué tiene el usuario **ahora** (y no
pregunte a ciegas), el servidor expone un espejo:

- `POST /api/state` — (a) sube su estado (con rebote/debounce) cuando cambia.
- `GET /api/state` — (b) lo lee.
- El servidor lo persiste en `dashboard/data/state.json`.
- `localStorage` **sigue siendo la fuente de verdad** para el usuario. El espejo es una
  copia. Si el servidor no está, no pasa nada.

**(2) Buzón de contenido (b → a), en vivo y para todos.** Carpeta
`dashboard/data/content/` con un archivo por propuesta más `manifest.json`.

El sondeo (cada ~2 s, mismo patrón que `/api/ai/progress`) hace que **cualquier navegador
conectado** vea la propuesta sin recargar — igual que ya se ven en vivo las ediciones entre
usuarios. Dentro de un mismo navegador se suma `BroadcastChannel` (que el repo ya usa) para
que las pestañas se enteren al instante.

> ⚠️ El buzón es **dato del usuario, no del repo**: va en `.gitignore` y se **excluye** del
> despliegue de Pages (ver §11.B). Es la corrección al anexo original.

Endpoints (misma excepción de motor declarada):

- `GET /api/content/manifest` → propuestas y su versión.
- `GET /api/content/<id>` → contenido de una propuesta.
- `POST /api/content/<id>/apply` · `/discard` → decisión del humano.

**(3) Cómo (a) muestra todo esto sin tocar el motor.** En vez de editar `dashboard/app.js`
(466 KB, alto riesgo), se añade un archivo **nuevo** `dashboard/content_bridge.js` y **una
línea** `<script src="content_bridge.js">` en `dashboard/index.html`. El puente:

- sondea `/api/content/manifest` cada ~2 s,
- dibuja un aviso en la pestaña destino con **Aceptar / Descartar**,
- al aceptar, emite un evento que `app.js` ya sabe consumir (se elige un punto de entrada
  estable, idealmente una función ya expuesta en `window`), y
- **nunca** sobrescribe sin acción humana.

**(4) Sobre de propuesta** (mismo formato para todo tipo):

```json
{
  "id": "budget-2026-10-18-001",
  "tab": "budget",
  "slot": "costos",
  "kind": "budget-json",
  "title": "Presupuesto revisado desde investigación externa",
  "source": "z.ai research (PDF adjuntado por el usuario)",
  "created_at": "2026-10-18T18:12:00-06:00",
  "confidence": "media",
  "simulated": false,
  "payload": { }
}
```

- `simulated: true` es obligatorio cuando algo no es real; la ventana lo pinta con distintivo.
- **`tab` + `slot`** son obligatorios cuando el destino tiene partes. Ejemplo: el pautado
  tiene secciones (`problema`, `solucion`, `impacto`, `innovacion`, `prefactibilidad`); el
  presupuesto es un arreglo donde cada fila tiene `units` y `unit_cost`. El mapeo
  `kind` + `slot` → campo del estado es **tabla explícita** en el puente; sin `slot` válido,
  la propuesta se rechaza en vez de adivinar.

**(5) Sin servidor** (GitHub Pages): el buzón no se despliega, así que (a) muestra un aviso
claro de "servicio apagado" y sigue funcionando igual.

### 8.6 Chat en la ventana — **fase siguiente (fuera de esta entrega)**

Decisión del humano: se deja para después. Queda documentado aquí para no perderlo.

Reutiliza el puente que **ya existe**: `POST /api/ai` → CLI de OpenCode del usuario (gratis,
sin claves) o endpoint compatible con OpenAI. No es una API nueva ni algo que se pague: **es
la misma IA con la que el usuario programa**, hablando desde adentro.

Limitación conocida: si el usuario abre el repo con Antigravity y no tiene el CLI de OpenCode
instalado, ese primer camino no existe y cae al endpoint gratuito o a los chips de chat web.

### 8.7 El flujo guiado (13 etapas)

(b) conoce y usa este mapa (extraído de `NAV_TABS` en `dashboard/app.js`):

```
00 Certamen            → ¿Latam (28h) o Nacional (24h)?
01 Identidad de Equipo → nombre de squad, marca, universidad, ciudad, logo
02 Retos del Comité    → reto elegido (banco + OCR + propuestas de b)
03 Taller de Solución  → la solución, aprobada por el equipo
04 Impacto, ODS & Plan País → ODS, eje del plan nacional, anclaje territorial
05 Despacho Multi-IA   → prompts especializados para IAs externas
06 Pautado Oficial     → documento pautado dentro de límites
07 Presupuesto de Marcha → costos con URLs y respaldos
08 Bóveda de Recursos  → logos, imágenes, videos, assets
09 Modelo Canvas       → modelo de negocio
10 Guion 120s (4 Actos)→ PAS-V, ≤120 s
11 Prototipo para Video→ web demo
12 Checklist de Entrega→ verificación final
```

En cada etapa (b) hace tres cosas: **pregunta lo que falte**, **propone** (marcado como
propuesta) y **verifica** contra rúbrica y bases. Nunca avanza inventando.

**Failure mode conocido:** en el flujo real, la etapa 05 (Despacho Multi-IA) sirve para que el
usuario **salga** a una IA externa (ej. z.ai) con un prompt de (b), y **vuelva** con un PDF.
Ese PDF entra por `ingestar-investigacion` y aterriza como propuesta en la pestaña que toca.
Este ida-y-vuelta es el caso de uso principal y tiene que estar cubierto por la prueba 4.

### 8.8 Delegación y paralelismo

Se conserva la tabla de "Paralelismo autorizado" del `AGENTS.md` (lo que no bloquea GPU/CPU
corre junto: investigación, pautado, presupuesto, canvas, guion, paleta, bibliografía) y lo
que va **de uno en uno** (render 3D, TTS, grabación con Playwright, exportación con ffmpeg).
Se añade: (b) puede **encargar** trabajo a otras IAs del usuario generando el prompt exacto
(skills `sugerir-por-fase` / `proponer-retos`), y **recibe** el resultado por el buzón
(skill `ingestar-investigacion`).

**Fuera de alcance declarado (no es trabajo de (b)):** las reglas 9 y 10 del `AGENTS.md`
(avisar cada hora, congelar a T-6h) son del **motor**, que ya trae `scripts/rally_clock.py`;
el agente trabaja por turnos y no puede ser un reloj. Se dejan tal cual, con una nota.

### 8.9 Qué se descarga (paquete limpio)

Decisión del humano: **plantilla vacía + todo lo necesario**.

**Viaja en la descarga:**
- Todo el corpus de investigación y conocimiento: `research/`, `knowledge/`, `docs/`,
  los manuales maestros, las rúbricas, `graphify-out/`, los análisis.
- `README.md`, `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `AUTO_IA.md`, `LICENSE`,
  `requirements.txt`, `LEEME.md`.
- Todo `scripts/`, `dashboard/` (código), `site/`, `brand/` (estructura y tokens, no el logo
  de un proyecto ajeno).
- La capa nueva: `skills/`, `.agents/rules/`, `knowledge/INDICE.md`, `opencode.json`,
  `docs/INSTALACION_AGENTE.md`, `scripts/setup_agente.ps1`.

**No viaja (se va a una rama/etiqueta aparte, no se borra para siempre):**
- Las ~40 capturas (`dash-*.png`, `tab*.png`, `shots/`), los DOCX/PDF de trabajo personal
  (`Operación Titan_UNI_*.docx`, `Reporte_Pautado_Rally_2026.docx`, `pautado_draft.docx`),
  `budget/screenshots/`, `dashboard/assets_uploads/`.
- Las salidas de trabajo previo que no son referencia: `.playwright-mcp/`, `.superpowers/`,
  `graphify-out/` **solo si** su contenido revela datos del proyecto de ejemplo.
- Las URLs y el nombre del proyecto demo (`hidro-vigia` / `mentes-pinoleras`).

**Se vacía:**
- `brief.json` → plantilla en blanco, con la misma forma pero sin valores.
- `dashboard/data/content/` y `dashboard/data/state.json` → inexistentes al descargar.

> ⚠️ Sacar capturas y documentos personales **borra cosas del humano**. Es una decisión suya
> y está en la lista de confirmación antes de ejecutar.

---

## 9. Decisiones

### 9.1 Tomadas con el humano
- (b) = profe: produce **contenido y presentación**, nunca lógica.
- El `AGENTS.md` del evento **se conserva**.
- Guía al usuario por todo el flujo, preguntando lo que falte.
- Sirve todo a (a) **en vivo y para todos los usuarios conectados**, igual que las ediciones
  entre usuarios; y **sí se incluye la Obra** (los puentes) en esta entrega.
- **Descarga limpia**: plantilla vacía + corpus + todo lo necesario.
- **El chat de la ventana NO entra** en esta entrega; va en la fase siguiente.

### 9.2 Mis decisiones (revísalas mientras lees)
1. **Puente en archivo aparte** (`content_bridge.js` + 1 línea en `index.html`) en lugar de
   editar `app.js`. Mucho menos riesgo.
2. **Espejo de estado** (§8.5.1). Sin él, (b) no puede saber qué tiene el usuario y el
   "pregunta lo que falte" sería a ciegas.
3. **Sondeo cada ~2 s** en vez de WebSockets: el servidor es biblioteca estándar y el repo ya
   usa ese patrón. `BroadcastChannel` para el mismo navegador.
4. **El buzón es efímero**: va a `.gitignore` y se excluye de Pages. Las propuestas del
   usuario no se publican.
5. **Una sola carpeta `skills/`**, reflejada a `.opencode/skills/` y `.agents/skills/`.
6. **MCP de Blender se pregunta**, no se instala por defecto.
7. **`publicar-sitio` no publica sola**: construye `site/` y guía; solo publica
   automáticamente si el usuario ya tiene `gh` o `netlify` autenticados. Nada de pedir tokens.
8. **`server.js` (el servidor Node de prueba) queda fuera de alcance**: los documentos ya
   deben decir que el servidor real es `scripts/rally_service.py`. Se le añade una nota.
9. **No se migra el estado a archivos.** `localStorage` se queda como fuente de verdad.
10. **El índice se genera** con script, no a mano.

### 9.3 Decisiones abiertas (para el constructor)
1. Lector de PDF: `pdfplumber` vs. `PyMuPDF`, según peso y lo ya instalado.
2. Punto de entrada estable en `app.js` para que el puente aplique contenido.
3. Formato final del `manifest.json` (índice + archivos sueltos).
4. Netlify vs. Pages para `site/` (se propone soportar los dos).

---

## 10. Cómo sabremos que funciona (verificación)

Pruebas de aceptación, ejecutables sin pagar nada:

1. **Arranque en frío.** En una carpeta nueva, abrir con OpenCode **y** con Antigravity. Sin
   decirle nada, (b) debe (a) identificarse como el profe, (b) nombrar el certamen activo,
   (c) decir el siguiente paso del flujo.
2. **Preguntar en vez de inventar.** Con `brief.json` vacío, (b) pregunta nombre/equipo/ciudad
   en vez de rellenarlos.
3. **Servicio en vivo.** (b) deposita una propuesta de pautado en el buzón; en (a) aparece el
   aviso en la pestaña 06 en ≤ 5 s, con Aceptar/Descartar; aceptar actualiza el documento;
   descartar no cambia nada.
4. **En vivo para varios.** Con **dos navegadores** abiertos a la vez, la propuesta aparece en
   los dos sin recargar, y aceptar en uno se refleja en el otro.
5. **Ida y vuelta externa (el caso real).** (b) genera un prompt para una IA externa; se le
   devuelve un PDF; (b) lo limpia, lo alinea a la rúbrica del certamen y lo sirve en
   Presupuesto como propuesta coherente y sin datos inventados.
6. **Frontera respetada.** Se le pide "cambia los puntajes de la rúbrica": (b) se niega,
   explica que es motor, y ofrece una tarea de Obra aparte.
7. **Sin servidor.** Abrir `dashboard/index.html` en seco: la interfaz funciona y avisa que
   el buzón está apagado.
8. **Descarga limpia.** Clonar el repo y buscar el proyecto demo (`hidro-vigia`,
   `mentes-pinoleras`): no aparece. `brief.json` está en blanco. No hay capturas personales.
9. **Instalación limpia y doble.** `scripts/setup_agente.ps1` en una máquina limpia deja el
   repo usable (y las skills visibles en las dos herramientas), y correrlo dos veces seguidas
   no produce efectos raros.
10. **Sin fugas.** Tras usar el buzón, `dashboard/data/content/` no aparece en el sitio de
    Pages ni queda listado por git.

---

## 11. Anexos

### A. Estado actual relevante (recon)
- `dashboard/app.js` (~466 KB) contiene las 13 pestañas (`NAV_TABS`), todo el estado y la
  persistencia en `localStorage` bajo `rally_studio_production_state_2026_v3`.
- `dashboard/index.html` es una cáscara (1,3 KB); todo se renderiza desde `app.js`.
- `scripts/rally_service.py` sirve estáticos y expone: `GET` `/health`, `/api/telemetry`,
  `/api/scan-sources`, `/api/rubric`, `/api/template-status`, `/api/ai/status`,
  `/api/ai/models`, `/api/ai/progress`; `POST` `/api/ai`, `/api/compile-docx`,
  `/api/template-upload`, `/api/asset-upload`, `/api/asset-delete`, `/api/ocr`,
  `/api/ai/quick`.
- Puente de IA ya existente (ver `AUTO_IA.md`): CLI de OpenCode o endpoint compatible con
  OpenAI de capa gratuita; detección dinámica y fallback a chips de chat web.
- `AGENTS.md` actual: reglas de evento (SIRLI, rúbricas, presupuesto, guion, T-6h…).
- **No existe** config de agente: ni `.opencode/`, ni `.agents/`, ni skills, ni MCP declarado.
- `brief.json` está escrito a mano por `scripts/init_brief.py` y hoy trae datos **demo** de
  otro proyecto (`hidro-vigia`), no lo que el usuario tenga en la ventana.
- Existe un segundo servidor, `server.js` (Node), que solo simula `/api/telemetry`.
  **Fuera de alcance**; los docs deben apuntar al servidor Python.

### B. Corrección al anexo original
`.github/workflows/pages.yml` copia `dashboard/` completo al sitio público, así que
`dashboard/data/content/` **sí** se publicaría. Por eso `pages.yml` **sí cambia**: se le añade
la exclusión del buzón (y del espejo de estado). Lo demás de `pages.yml` no se toca.

### C. Lo que NO cambia
- `AUTO_IA.md`, `requirements.txt`, `Iniciar Rally.bat`, `iniciar_rally.ps1`.
- La estructura de carpetas existente.
- El contenido del `AGENTS.md` del evento (solo se le antepone la capa nueva).
