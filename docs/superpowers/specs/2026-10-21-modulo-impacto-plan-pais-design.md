# Diseño: Módulo "Impacto y Plan País" (design/impacto.html)

Fecha: 2026-10-21 · Estado: borrador para revisión

## 1. Intención y por qué

El video pitch Nacional exige (rúbrica, criterio 2 — 25 pts): alineación explí­cita con el
PNDH 2022–2026, articulación con programas nacionales (Red de Ciudades Creativas,
Soberanía Alimentaria, Ley 763), anclaje territorial y cuantificación. El Acto IV del video
cierra con métricas + alineación ODS + escalabilidad. Hoy ese material se hace a mano en
CapCut. El equipo quiere una **área de diseño** que produzca esos recursos reutilizables
(clips y láminas) que luego se montan (o no) en CapCut.

El usuario lo pidió así (resumen fiel): en design, versiones/presets para clips, animación
editable, elegir qué ODS entra y cuál no, cómo se alinea con cada ODS, y que el usuario
"su solo edite y saque ese clip con los segundos que quiere, incluso hasta pueda grabar
sobre él y salga ahí mismo lo que dirá, pulido por una IA basada en todo el contexto".

Design es una **fábrica de recursos**, no línea de tiempo: el papel es generar PNG y WebM
listos para CapCut.

## 2. Alcance

### Láminas (todas 16:9, 1920×1080 — el video pitch es horizontal)

| Tipo | Contenido | Cuándo se usa |
|---|---|---|
| `mosaico` | Mosaico de bloques color-ODS (número grande + nombre corto) de los ODS activos. Kicker "ALINEADO CON LOS ODS". Pie con marca/hashtag del equipo. | Resumen de los 2–5 ODS del brief |
| `ficha` | Una por ODS activo: bloque color oficial ODS (número + icono + nombre), a la derecha `shortTarget` + frase editable "cómo conecta" | Clip en serie con fade en CapCut |
| `plan` | Banda superior PNDH 2022–2026 + eje del plan (checkbox de programas: Ciudades Creativas, Soberanía Alimentaria, Ley 763, MEFCCA, INATEC — lista editable) + municipio + cifra de beneficiarios (manual) | Cierre de alineación nacional |
| `plan` variante Latam | Si `brief.rally_type === 'latam'`: sin siglas nacionales; chips de agenda libres y editables | Certamen Latam |

Fuente de datos: `brief.json` (ods_ids, national_plan_axis, team_*, city, challenge_title),
`ODS_CATALOG` del dashboard (color, nombre, shortTarget, icono SVG) extraído de
`dashboard/app.js` lí­nea 6005+ a un archivo nuevo `design/ods_data.js` (copia única; nunca
referenciar app.js desde design). Cifras: solo campos manuales — no inventar (regla 2).

### Presets de diseño del módulo

3 presets propios del módulo (distintos a los del carrusel), cada uno define composición +
deco + ritmo de animación por defecto. Heredan `pal`/`fonts`/`team` de la identidad
compartida (shared.js, mis­ma KEY). Nombres provisionales para que el builder los refine:
"Mosaico" (bloques en retícula), "Banda" (franja ODS apilada), "Ficha" (dos columnas).

### Animaciones (vocabulario cerrado, editable por lámina)

- Entrada: `fade | slide-izq | slide-arriba | wipe | banda` (bloques que entran escalonados)
- Énfasis medio: `none | pulso | pop` (sobre el bloque color ODS)
- Salida: `none | fade | slide`
- Duración total por clip: campo numérico en segundos (rango 3–10, default 5). El hold
  central se reparte lo que sobra. "Los segundos que quiere" = este campo por lámina.

### Exportación

- **PNG** por lámina (estado final de la animación, t = fin del hold). Patrón
  `exportPNG` ya existente en kit.js.
- **WebM**: MediaRecorder sobre el lámina animado a 24–30 fps, exactitud de los segundos
  configurados, cuenta regresiva de 3 s, se puede regrabar. Pipeline de rasterización
  (DOM→canvas vía foreignObject o renderer canvas nativo): **decisión del builder**, con
  contrato: (a) el WebM debe coincidir visualmente con la previsualización DOM; (b) si el
  navegador no alcanza 24 fps, caer a exportar "secuencia PNG" (1 PNG por frame en ZIP).
- Nombre de archivo prefix editable por export (default derivado del slug de
  `project_name`), patrón `clip_<tipo>_<detalle>` coherente con la regla de assets 7.
- Conversión MP4: fuera del módulo (ffmpeg a mano si se pide). Sin mux de MP4 dentro.

### Narración sobre el clip

- Textarea "lo que dirás" por lámina.
- Botón **Pulir con IA**: envía texto del usuario + contexto (nombre de proyecto, ciudad,
  ODS activos con nombre/meta, eje del plan via `RallyIA.job`). Restricción dura de
  longitud: salida ≤ `segundos × 2.25 palabras` (135 wpm). Resultado SIEMPRE editable y
  mostrado; nunca se aplica sin vista. Cuota diaria de `ia.js` respetada. Sin conexión:
  aviso honesto y modo manual (nunca fingir IA).
- Botón opcional "Proponer conexión": dado un campo editable "resumen de la solución",
  propone frase por ODS — marcada como propuesta, editable.
- **Grabar con micrófono**: checkbox `getUserMedia(audio)`; si está activo, el WebM lleva
  la pista de audio del mic sincronizada con la animación. Sin TTS en el módulo (eso es
  gen_voice.py).

## 3. No-goals / anti-goals

- NO: editar video, línea de tiempo, ni componer el MP4 final (eso es CapCut).
- NO: tocar motor (rally_service.py, dashboard/app.js, validaciones).`dashboard/app.js`
  se lee una sola vez para extraer ODS_CATALOG a `design/ods_data.js` (con script
  `scripts/gen_ods_data.py` idempotente o CPU-copy manual documentado).
- NO: inventar cifras ni datos — todas las casillas son editables y con placeholder.
- NO: emojis como iconos (iconos SVG del catálogo ODS), no morado en presets
  (#7c3aed prohibido — los colores oficiales ODS son contenido, no paleta de marca).
- NO: TTS. NO: quemar subtítulos (CapCut).

## 4. Decisiones ya tomadas (del usuario, del sistema y del autor del diseño)

1. Formato de ODS: `brief.ods_ids` puede llegar como `ODS 12`, `ODS12` u `ODS11`
   (el repo usa los tres). El módulo sigue la regla del builder check: **parse
   tolerante** — se extraen los dígitos tras "ODS" y se normaliza a id numérico del
   catálogo. Nunca casar por string exacto.
2. Brief vacío (estado actual del repo): la lista de chips es la **unión** de los ODS
   del brief (activados por defecto) y de todo el catálogo de 17 (desactivados por
   defecto). Si el ODS venía del brief se marca con un punto; si no, aviso discreto
   "no está en el brief — agrégalo en el dashboard".
3. `rally_type` vacío o ilegible: selector manual Nacional/Latam en el módulo, con
   auto-selección cuando el brief sí lo trae (override manual siempre permitido).
4. "Pulir con IA" y "Proponer conexión" pasan por `RallyIA.job` (consumen cuota).
   "Proponer conexión" agrupa TODOS los ODS activos en un solo job para gastar
   una sola cuota diaria.
5. Es un **cuarto módulo** en el sidebar de design (carrusel / kit / thumbnail / + Impacto).
6. Hereda paleta/tipografías/equipo de la identidad compartida (misma clave localStorage
   `rally_design_v5`); el estado específico del módulo (ODS activos, animaciones,
   narraciones, preset) va como campo `impacto` en la misma identidad, extendiendo
   `normalizeIdentity` en shared.js — conservando `impacto` en la migración de claves
   legacy (builder check #4).
7. Láminas 16:9 fijas. Duración por clip configurable 3–10 s.
8. La IA entra por `RallyIA` (isla compartida, cuota, modo manual sin fingir).
9. ODS activo/inactivo: chips on/off; el mosaico usa los activos en el orden del brief.
10. `scripts/gen_pagina_diseno.py` (listas COPIAR_*) se actualiza para incluir
   `impacto.html`, `impacto.js`, `ods_data.js`.

## 5. Qué deja abiertos al builder

- Pipeline exacta de rasterizado (foreignObject vs renderer canvas nativo): decisión
  técnica del builder, sujeta al contrato de coincidencia visual y fallback a secuencia PNG.
- CSS y micro-animaciones concretas dentro del vocabulario cerrado.
- Detalles de layout de cada preset mientras respete: color ODS = fondo del bloque,
  texto con contraste AA, identidad del equipo legible.
- Estructura interna de impacto.js (sin framework, vanilla como el resto de design/).

## 6. Criterios de aceptación

1. En la página del módulo: elegir preset, activar/desactivar ODS, editar frase por ODS,
   elegir animación y segundos → previsualización inmediata.
2. "Exportar PNG" produce el frame correcto con nombre asset-coherente.
3. "Grabar clip" produce WebM con la duración exacta configurada (±0.5s), re-grabable,
   con pista de audio si se activa el mic (probable conflitos de formatos de audio en
   WebM: aceptable VP8+Opus).
4. "Pulir con IA" respeta límite de palabras, cuota y modo manual.
5. Sin conexión a la isla: todo sigue funcionando a mano.
6. Ningún texto autogenerado aparece sin ser marcado como propuesta y editable.
