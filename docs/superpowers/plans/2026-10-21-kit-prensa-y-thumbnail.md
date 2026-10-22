# Kit de prensa + Thumbnail de YouTube — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el mockup del kit de prensa en un módulo funcional y bonito (preview protagonista, controles secundarios), exportable a PNG/PDF, con biblioteca grande de fuentes; y un thumbnail de YouTube con diseño editorial adaptable al proyecto (sin referencia fija a la universidad, sin duración).

**Architecture:** Módulo HTML/CSS/JS vanilla en `design/kit.html` + `design/kit.js` + `design/kit.css`, compartiendo identidad con `design/index.html` (carrusel de equipo) vía `localStorage` con la misma key `rally_design_v2`. El preview es el protagonista (tarjeta grande de marca); los controles viven en un panel colapsable. Exportación con `html2canvas` + `jsPDF` (CDN). Fuentes desde Google Fonts con una lista curada de ~40 familias. Thumbnail reutiliza la misma identidad pero con composición editorial propia y slots editables.

**Tech Stack:** HTML5, CSS3 (variables, container queries), JavaScript vanilla (ES2020), Google Fonts, html2canvas, jsPDF. Sin backend. Sin tests automatizados de UI (contratos mínimos en `tests/test_ui_contracts.py`).

**Spec:** `design/mockups_v2.html` (referencia visual), `design/index.html` (módulo 01, carrusel de equipo).

## Global Constraints

- Sin emojis en la UI. Sin morado (#7c3aed o similar). Sin fuentes fuera de la biblioteca declarada.
- Textos en español.
- Toda pieza comparte la identidad del módulo 01: nombre del equipo, paleta, fuentes, logo. Fuente única: `localStorage` key `rally_design_v2`.
- El kit de prensa NO revela reto ni solución (secreto de estado). Solo identidad, equipo, paleta, tipografía.
- El thumbnail NO muestra duración ni referencia fija a la universidad; se adapta al proyecto (título, palabra destacada, subtítulo, kicker editable).
- Exportación siempre incluye marca de agua sutil "Rally Studio" en la esquina.
- Los controles de edición son secundarios: el preview ocupa ≥60% del ancho en desktop.
- Biblioteca de fuentes: mínimo 40 familias de Google Fonts, agrupadas por categoría (sans, serif, display, mono).
- Un solo proceso de exportación a la vez (no bloquea GPU, pero evita dobles clics).

## Review Focus

- El kit y el thumbnail deben leer la misma identidad que el carrusel de equipo; si el usuario cambia la paleta en el carrusel, el kit debe reflejarlo al recargar. (Tarea 1, Tarea 4)
- Exportar a PNG debe producir una imagen nítida (scale 2x) sin cortes. (Tarea 5)
- La biblioteca de fuentes debe cargar dinámicamente solo las familias seleccionadas para no bloquear el render. (Tarea 2)
- El thumbnail no debe mostrar duración ni "Universidad" fijo; el kicker debe ser editable. (Tarea 6)
- El preview debe ser protagonista; los controles no deben desplazarlo por debajo del fold en desktop. (Tarea 3, Tarea 6)

---

## Estructura de archivos

**Crear**

| Archivo | Responsabilidad |
|---|---|
| `design/kit.css` | Estilos del kit de prensa y del thumbnail. Preview protagonista, controles colapsables. |
| `design/kit.js` | Lógica: carga de identidad compartida, render del kit, render del thumbnail, selector de fuentes, exportación. |
| `design/kit.html` | Página con preview grande + panel de controles colapsable. |
| `design/fonts.js` | Biblioteca curada de fuentes (lista de familias + categorías + URLs de Google Fonts). |
| `tests/test_ui_contracts.py` (ampliar) | Contratos mínimos del kit: ids clave, export, fuentes. |

**Modificar**

| Archivo | Cambio |
|---|---|
| `design/index.html` | Añadir enlace al kit en la cabecera (navegación entre módulos). |
| `design/mockups_v2.html` | Marcar como referencia (no tocar). |

---

### Task 1: Extraer la identidad compartida a un módulo común

**Files:**
- Create: `design/shared.js`
- Modify: `design/index.html` (cargar `shared.js` antes que su script)

**Interfaces:**
- Produces:
  - `loadIdentity() -> object` con `{team, pal, fontTitle, fontBody, decor, mem}`.
  - `saveIdentity(obj)`.
  - `defaultIdentity() -> object`.
  - Constante `KEY = 'rally_design_v2'`.

- [ ] **Step 1: Crear `design/shared.js`** con las funciones extraídas del script inline de `index.html` (`load`, `save`, `DEF`).

- [ ] **Step 2: Modificar `design/index.html`** para cargar `<script src="shared.js"></script>` antes de `presets.js` y usar `loadIdentity()`.

- [ ] **Step 3: Verificar en navegador** que el carrusel sigue funcionando (sin regresión).

- [ ] **Step 4: Commit**

```bash
git add design/shared.js design/index.html
git commit -m "refactor(design): extract shared identity module"
```

---

### Task 2: Biblioteca grande de fuentes

**Files:**
- Create: `design/fonts.js`
- Modify: `design/kit.html` (selectores de fuente)

**Interfaces:**
- Produces:
  - `FONT_LIBRARY` array de `{id, family, category, googleUrl, weights}`.
  - `loadFont(family)` que inyecta el `<link>` de Google Fonts si no existe.
  - `fontOptions(category)` que devuelve `<option>` HTML.

- [ ] **Step 1: Crear `design/fonts.js`** con mínimo 40 familias agrupadas: sans (15), serif (8), display (10), mono (7). Incluir: Plus Jakarta Sans, Inter, Manrope, Space Grotesk, DM Sans, Sora, Outfit, Lexend, Barlow, Barlow Condensed, Fraunces, Playfair Display, Lora, Merriweather, Cormorant Garamond, Archivo Black, Bebas Neue, Oswald, Anton, Righteous, JetBrains Mono, Fira Code, IBM Plex Mono, Space Mono, etc.

- [ ] **Step 2: Implementar `loadFont(family)`** que crea un `<link rel="stylesheet">` con la URL de Google Fonts (weights 400,600,700,800,900) si no existe ya.

- [ ] **Step 3: Implementar `fontOptions(category)`** que devuelve string de `<option>` para poblar `<select>`.

- [ ] **Step 4: Commit**

```bash
git add design/fonts.js
git commit -m "feat(design): add large font library for kit and thumbnail"
```

---

### Task 3: Kit de prensa — preview protagonista + controles colapsables

**Files:**
- Create: `design/kit.css`, `design/kit.html`, `design/kit.js`

**Interfaces:**
- Consumes: `shared.js` (`loadIdentity`, `saveIdentity`), `fonts.js` (`FONT_LIBRARY`, `loadFont`, `fontOptions`).
- Produces:
  - `renderKit()` que pinta el kit en `#kitPreview`.
  - `renderThumb()` que pinta el thumbnail en `#thumbPreview`.
  - `exportPNG(targetId, filename)` y `exportPDF(targetId, filename)`.

- [ ] **Step 1: Crear `design/kit.css`** con layout de 2 columnas: preview (65%) + panel de controles (35%) colapsable en móvil. Preview con sombra, fondo sutil, tipografía protagonista. Controles en acordeón (`<details>`).

- [ ] **Step 2: Crear `design/kit.html`** con:
  - Cabecera con navegación: "← Carrusel de equipo" → `index.html`.
  - Sección "Kit de prensa": preview grande + panel de controles colapsable (identidad, fuentes, equipo, bio, exportar).
  - Sección "Thumbnail de YouTube": preview grande + panel de controles (título, palabra destacada, subtítulo, kicker, badge, exportar).
  - Sin duración. Sin referencia fija a la universidad.

- [ ] **Step 3: Crear `design/kit.js`** con:
  - Carga de identidad al inicio.
  - `renderKit()`: pinta logo, nombre, H1/H2/H3 con fuentes, paleta, equipo, bio, contacto.
  - `renderThumb()`: pinta thumbnail editorial (tipografía grande, composición asimétrica, acento, overlay de grilla, decoración geométrica). Sin duración. Kicker editable.
  - Listeners en controles → `saveIdentity()` + re-render.
  - Selector de fuentes poblado desde `fontOptions()`, con `loadFont()` al cambiar.

- [ ] **Step 4: Verificar en navegador** que el preview es protagonista y los controles funcionan.

- [ ] **Step 5: Commit**

```bash
git add design/kit.css design/kit.html design/kit.js
git commit -m "feat(design): add kit de prensa module with preview-first layout"
```

---

### Task 4: Conectar kit y thumbnail a la identidad compartida

**Files:**
- Modify: `design/kit.js`
- Modify: `design/index.html`

**Interfaces:**
- Consumes: `shared.js`.
- Produces: cambio de paleta/fuente en el carrusel se refleja en el kit al recargar.

- [ ] **Step 1: En `kit.js`**, al cargar, leer identidad con `loadIdentity()`. Si no existe, usar `defaultIdentity()`.

- [ ] **Step 2: En `index.html`**, añadir enlace "Kit de prensa →" en la cabecera que apunte a `kit.html`.

- [ ] **Step 3: Verificar** que cambiar paleta en `index.html` y recargar `kit.html` refleja el cambio.

- [ ] **Step 4: Commit**

```bash
git add design/kit.js design/index.html
git commit -m "feat(design): connect kit and thumbnail to shared identity"
```

---

### Task 5: Exportación a PNG y PDF

**Files:**
- Modify: `design/kit.js`
- Modify: `design/kit.html` (botones de exportar + CDN de html2canvas/jsPDF)

**Interfaces:**
- Produces:
  - `exportPNG(targetId, filename)` → descarga PNG a scale 2x.
  - `exportPDF(targetId, filename)` → descarga PDF A4 con la pieza centrada.
  - Ambos deshabilitan el botón durante la exportación y muestran estado.

- [ ] **Step 1: Añadir CDN** de html2canvas y jsPDF en `kit.html` (antes del script).

- [ ] **Step 2: Implementar `exportPNG`** en `kit.js`: usar `html2canvas(element, {scale:2, useCORS:true})`, convertir a blob, descargar.

- [ ] **Step 3: Implementar `exportPDF`** en `kit.js`: renderizar con html2canvas, crear PDF con jsPDF, añadir imagen centrada, descargar.

- [ ] **Step 4: Añadir marca de agua** "Rally Studio" en la esquina inferior derecha de la exportación (CSS `::after` en el elemento exportado, o dibujar en canvas).

- [ ] **Step 5: Verificar** exportación en navegador (PNG nítido, PDF legible).

- [ ] **Step 6: Commit**

```bash
git add design/kit.js design/kit.html
git commit -m "feat(design): add PNG and PDF export for kit and thumbnail"
```

---

### Task 6: Thumbnail — diseño editorial adaptable (sin duración, sin uni fija)

**Files:**
- Modify: `design/kit.css`, `design/kit.js`, `design/kit.html`

**Interfaces:**
- Consumes: identidad compartida.
- Produces: thumbnail con composición editorial propia: tipografía grande, acento de color, overlay de grilla, decoración geométrica, kicker editable, sin duración, sin "Universidad" fijo.

- [ ] **Step 1: Diseñar el thumbnail** en `kit.css` con:
  - Fondo gradiente navy→primary.
  - Tipografía display grande (fuente de títulos) con palabra destacada en acento.
  - Overlay de grilla sutil.
  - Barra de acento vertical.
  - Decoración geométrica (círculos/líneas).
  - Kicker editable (no fijo a universidad).
  - Badge configurable.
  - Sin elemento de duración.

- [ ] **Step 2: Implementar controles** en `kit.html`: título, palabra destacada, subtítulo/promesa, kicker, badge. Todos editables.

- [ ] **Step 3: Implementar `renderThumb()`** en `kit.js` con los nuevos controles.

- [ ] **Step 4: Verificar** que el thumbnail se adapta al proyecto y no muestra duración ni uni fija.

- [ ] **Step 5: Commit**

```bash
git add design/kit.css design/kit.js design/kit.html
git commit -m "feat(design): redesign youtube thumbnail editorial and adaptable"
```

---

### Task 7: Contratos mínimos de UI

**Files:**
- Modify: `tests/test_ui_contracts.py`

**Interfaces:**
- Produces: pruebas de contrato para `kit.html` y `kit.js`.

- [ ] **Step 1: Añadir pruebas** que verifiquen:
  - `kit.html` contiene `id="kitPreview"`, `id="thumbPreview"`, `id="exportPngKit"`, `id="exportPdfKit"`, `id="exportPngThumb"`.
  - `kit.js` contiene `renderKit`, `renderThumb`, `exportPNG`, `exportPDF`, `loadFont`.
  - `fonts.js` contiene al menos 40 familias (contar `family:`).

- [ ] **Step 2: Correr las pruebas**

Run: `python -m pytest tests/test_ui_contracts.py -q`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test_ui_contracts.py
git commit -m "test(design): add ui contracts for kit and thumbnail"
```

---

### Task 8: Verificación manual

- [ ] **Step 1: Abrir `design/kit.html`** en el navegador.

- [ ] **Step 2: Verificar** que:
  1. El preview del kit es protagonista (≥60% del ancho).
  2. Los controles están en acordeón colapsable.
  3. Cambiar paleta/fuente actualiza el preview en vivo.
  4. El selector de fuentes muestra ≥40 familias agrupadas.
  5. Exportar PNG produce imagen nítida.
  6. Exportar PDF produce documento legible.
  7. El thumbnail no muestra duración ni "Universidad" fijo.
  8. El kicker del thumbnail es editable.
  9. Cambiar identidad en `index.html` y recargar `kit.html` refleja el cambio.

- [ ] **Step 3: Commit final** (si hubo ajustes).

---

## Autoevaluación del plan

- **Cobertura:** identidad compartida (T1), biblioteca de fuentes (T2), kit preview-first (T3), conexión con módulo 01 (T4), exportación (T5), thumbnail editorial adaptable (T6), contratos (T7), verificación manual (T8). El secreto de estado se respeta (no se incluye reto/solución en el kit).
- **Consistencia de tipos:** `loadIdentity`, `saveIdentity`, `defaultIdentity` en `shared.js`; `FONT_LIBRARY`, `loadFont`, `fontOptions` en `fonts.js`; `renderKit`, `renderThumb`, `exportPNG`, `exportPDF` en `kit.js`.
- **Enlaces entre tareas:** T1 antes de T3/T4; T2 antes de T3; T5 después de T3; T6 después de T3; T7 después de T3/T6; T8 al final.
- **Riesgo principal:** html2canvas puede tener problemas con fuentes web (CORS). Mitigación: `useCORS: true` y verificar en navegador. Si falla, fallback a `dom-to-image`.