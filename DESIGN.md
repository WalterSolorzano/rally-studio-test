---
name: Rally Studio · Workbench de Innovación
description: The Mission Control Workbench — Swiss/Linear tactical precision for 28-hour continuous innovation marathons.
colors:
  primary: "#0866F5"
  primary-hover: "#0057E7"
  navy: "#0D1B35"
  navy-dark: "#10213F"
  accent: "#0284C7"
  bg-app: "#FFFFFF"
  bg-subtle: "#F8FAFD"
  bg-secondary: "#F0F6FF"
  border-light: "#DCE7F5"
  border-strong: "#CBD5E1"
  text-title: "#0D1B35"
  text-main: "#13213A"
  text-body: "#334155"
  text-muted: "#5C7193"
  text-faint: "#94A3B8"
  status-ok: "#1D4ED8"
  status-ok-bg: "#EFF6FF"
  status-err: "#DC2626"
  status-err-bg: "#FEF2F2"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.02em"
  headline:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "12px"
  lg: "18px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "6px 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.bg-app}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
---

# Design System: Rally Studio

## Overview

**Creative North Star: "The Cardless Typographic Workbench"**

Rally Studio abraza una filosofía de diseño estrictamente **cardless (sin tarjetas)** inspirada en el diseño editorial suizo, las terminales de alto rendimiento (Linear, Bloomberg, GitHub issue tracker) y la arquitectura tipográfica funcional. Se elimina por completo el cliché contemporáneo de encajonar cada elemento en cajas flotantes ("cards") con bordes inflados y sombras difusas.

La jerarquía espacial no la crean las cajas contenedoras, sino:
1. **Tipografía con autoridad:** Contraste contundente entre pesos tipográficos (Black 900 vs Regular 400), tamaños escalados con rigor y seguimiento visual natural.
2. **Líneas divisorias hairline (1px):** Separadores lineales horizontales limpios (`1px solid var(--border-light)`) que delimitan secciones sin encerrar el contenido.
3. **Espaciado rítmico intencional:** El espacio negativo (whitespace) es el agrupador principal. El lienzo respira en una superficie diurna clara y luminosa.
4. **Símbolo de comando (`//`):** La doble barra diagonal azul (`#0066FF`) actúa como ancla visual de velocidad, ejecución paralela y precisión técnica, marcando el inicio de comandos, títulos y la cabecera bicromática `// RALLY STUDIO`.

**Key Characteristics:**
- **Filosofía Sin Cards (Cardless):** Cero archipiélagos de tarjetas; datos y formularios fluyen en filas tabulares, columnas abiertas y listas continuas.
- **Identidad Bicromática Táctica:** Contraste estricto entre Deep Academic Navy (`#091E42` / `#0D1B35`) y Cobalt Engineering Blue (`#0066FF` / `#0866F5`).
- **Claridad Diurna Continua:** Fondos blancos de alta pureza con micro-gradientes radiales sutiles, facilitando 28 horas de lectura sin fatiga.
- **Rigor Tabular:** Cifras, cronómetros y parámetros en `JetBrains Mono` con `tabular-nums`.
- **Cero Artificios:** Cero emojis, cero degradados de fantasía y transiciones inmediatas de 120ms.

## Colors

Paleta técnica de alta fidelidad centrada en azules profundos, blancos de alta pureza y acentos de precisión, con ratio de contraste WCAG AAA en textos críticos.

### Primary
- **Cobalt Mission Blue** (`#0866F5` / hover `#0057E7`): Color de acción principal, botones de avance de flujo, marcadores de progreso completados y foco interactivo.
- **Deep Academic Navy** (`#0D1B35` / `#091E42`): Color de anclaje institucional, títulos principales, emblemas heráldicos y estados activos de alta jerarquía.

### Secondary
- **Precision Cyan Accent** (`#0284C7` / `#2AA7AD`): Indicadores de sincronización, telemetría de rúbricas y estados de cómputo en segundo plano.

### Neutral
- **Crisp Daylight White** (`#FFFFFF`): Superficie principal de la aplicación, paneles y contenedores de trabajo.
- **Ice Daylight Subtle** (`#F8FAFD` / `#F0F6FF`): Fondos de tarjetas secundarias, barras de estado y chips de metadatos.
- **Technical Slate Border** (`#DCE7F5` / `#CBD5E1`): Separadores de 1px, bordes de modales y delimitación estructural.
- **Main Command Text** (`#13213A`): Lectura principal de alta legibilidad.
- **Slate Body Text** (`#334155`): Textos descriptivos, guías y contenido de tarjetas.
- **Muted Technical Text** (`#5C7193` / `#94A3B8`): Leyendas secundarias, etiquetas de parámetro y metadatos.

### Named Rules
**The Focused Accent Rule.** El color Cobalt Mission Blue se reserva estrictamente para acciones primarias y elementos de navegación activos, ocupando ≤ 10% de la superficie visual. Los datos y paneles permanecen neutrales para evitar fatiga cognitiva.

## Typography

**Display Font:** Plus Jakarta Sans (fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)  
**Body Font:** Plus Jakarta Sans  
**Label/Mono Font:** JetBrains Mono (fallback: ui-monospace, SFMono-Regular, monospace)  
**Script Font:** Caveat (para notas y bocetos de ideación)

**Character:** Plus Jakarta Sans aporta estructura geométrica moderna y legibilidad en pesos extremos (700/800/900), mientras que JetBrains Mono dota de rigor tabular a cronómetros, puntuaciones de rúbrica, tokens y prompts estructurados.

### Hierarchy
- **Display** (Weight 900, `1.25rem` / `20px`, Line Height 1.2, Letter Spacing `0.02em`): Encabezados de topbar, títulos de certamen y bienvenida.
- **Headline** (Weight 700–800, `1.0rem` / `16px`, Line Height 1.3): Títulos de fase del flujo secuencial y nombres de tarjetas de retos.
- **Title** (Weight 700, `0.875rem` / `14px`, Line Height 1.4): Encabezados de sección, nombres de paso y títulos de modal.
- **Body** (Weight 400–500, `0.8125rem` / `13px`, Line Height 1.5): Textos operativos, instrucciones de taller y descripciones de roles.
- **Label** (Weight 600–700, `0.6875rem` / `11px`, JetBrains Mono, Letter Spacing `0.04em`, Uppercase): Chips de estado, cronómetro regresivo, métricas de rúbrica y badges de certamen.

### Named Rules
**The Tabular Precision Rule.** Cualquier número, tiempo de cronómetro, porcentaje o puntaje evaluador debe presentarse con `font-variant-numeric: tabular-nums` y tipografía monospaciada JetBrains Mono.

## Layout

El layout principal se organiza como un puesto de mando diurno continuo a pantalla completa (`100vh`, `overflow: hidden`) basado en la **Doctrina Sin Cards**:
- **Topbar:** `60px` fijo superior que aloja la identidad de marca `// RALLY STUDIO`, cronómetro oficial de competencia, emblemas institucionales (UNI, Latam, Nacional) y avatar de equipo. Sin cajas ni encapsulados.
- **Sidebar:** `240px` colapsable para la navegación por pasos secuenciales del certamen, estructurada con enlaces limpios y divisores lineales.
- **Main Area:** `minmax(0, 1fr)` con scroll independiente para el espacio de trabajo activo. No contiene archipiélagos de tarjetas; los retos, prompts y talleres se despliegan en filas tabulares abiertas con divisores de 1px.
- **Panel Lateral:** `300px` colapsable para inspección de rúbricas y parámetros, en columna de lectura limpia.

La densidad espacial se rige por una escala modular de múltiplos de 4px (`4px`, `8px`, `12px`, `16px`, `24px`).

## Elevation & Depth

Rally Studio implementa una estrategia de profundidad completamente plana y basada en líneas estructurales, prescindiendo de sombras difusas o tarjetas flotantes elevadas.

### Shadow Vocabulary
- **Resting Canvas:** Sin sombra (`box-shadow: none`), el lienzo respira sobre fondo `#FFFFFF` continuo con delimitaciones lineales de `1px solid var(--border-light)`.
- **Subtle Layer Line:** `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02)` limitado a la topbar fija para anclar la barra al hacer scroll.
- **Floating Modals:** `box-shadow: 0 12px 36px rgba(13, 27, 53, 0.08)` exclusivo para modales críticos obligatorios.

### Named Rules
**The Cardless Doctrine (The No-Card Rule).** Prohibido el uso de tarjetas (cards) como contenedor genérico por defecto. La estructura de la información se construye con:
1. Jerarquía tipográfica inequívoca (tamaño, peso y contraste de color).
2. Líneas divisorias horizontales de 1px (`border-bottom: 1px solid var(--border-light)`).
3. Filas tabulares interactivas con hover en `var(--bg-subtle)`.
4. Espacio negativo rítmico que agrupa lógicamente sin encerrar en cajas.

## Shapes

- **Radio de Esquinas:** Reducido y funcional (solo para elementos interactivos, nunca para encerrar páginas):
  - `var(--radius-sm)` (`8px`): Botones compactos, inputs y píldoras tácticas de estado.
  - Modales: `14px` máximo con borde fino de 1px.
- **Bordes:** 1px sólido continuo (`#DCE7F5`). Estados de foco con borde de 1.5px en `var(--color-primary)` y outline nulo.
- **Iconos:** SVGs técnicos vectoriales limpios y el glifo angular `//` trazado en trazos diagonales paralelos de precisión.

## Components

### Buttons
- **Shape:** `border-radius: var(--radius-sm)` (`8px`), altura compacta y quirúrgica.
- **Primary:** `background: var(--color-primary)` (`#0866F5`), texto blanco, padding `6px 14px`, peso 600.
- **Primary Hover:** `background: var(--color-primary-hover)` (`#0057E7`), transición de 120ms.
- **Secondary:** `background: var(--bg-surface)` (`#FFFFFF`), borde `1px solid var(--border-light)`, texto `var(--text-body)`, hover con fondo `var(--bg-subtle)`.
- **Pill / Discreet:** `padding: 4px 10px`, bordes de 8px, texto atenuado para acciones secundarias como copiar o descargar.

### Chips & Badges
- **Tactical Indicator (.tactical-status-pill):** Contenedor sobrio con fondo neutro `var(--bg-subtle)` (`#F8FAFD`), borde técnico `1px solid var(--border-light)` (`#DCE7F5`), radio compacto `var(--radius-sm)` (`8px`), micro-dot de 6px (`.status-dot`) y tipografía monospaciada en minúsculas/capitalizado regular (`JetBrains Mono`, 11px, weight 600).
- **Timer Chip:** Fondo `var(--bg-subtle)`, borde `var(--border-light)`, números tubulares monospaciados y micro-pulso de estado.
- **Prohibición de Píldoras de Juguete:** Prohibidas las cápsulas celestes saturadas con texto en mayúsculas negritas forzadas (e.g. `ESPERANDO COMUNICADO`), bordes celestes inflados (`#BFDBFE`) o fondos pasteles tipo chip amateur.

### Arquitectura Sin Cards (Filas y Secciones Abiertas)
- **Filas Tabulares:** Los elementos de catálogo (retos, roles, prompts) se presentan en filas abiertas con `border-bottom: 1px solid var(--border-light)`, padding vertical de 14px, e interacción hover limpia (`background: var(--bg-subtle)`).
- **Encabezados Tipográficos:** Cada sección se introduce con un encabezado sobrio en `var(--text-title)` (`#0D1B35`) y descripción en `var(--text-muted)` (`#5C7193`), sin necesidad de encapsular en cajas.
- **Divisores Hairline:** La separación entre etapas se ejecuta con líneas de 1px o espaciado vertical generoso (`24px`–`32px`).

### Inputs & Selectors
- **Style:** Fondo `#FFFFFF`, borde `1px solid var(--border-light)`, padding `8px 12px`, radio `8px`.
- **Focus:** `border-color: var(--color-primary)`, sombra de anillo tenue (`box-shadow: 0 0 0 2px rgba(8, 102, 245, 0.12)`).

### Navigation & Topbar
- **Topbar:** Fondo blanco sólido continuo, borde inferior de 1px, distribución simétrica:
  - Izquierda: Logotipo bicromático `// RALLY STUDIO` con doble barra diagonal vectorial.
  - Centro-izquierda: Badges heráldicos institucionales (UNI, Latam, Nacional) en contenedor sobrio.
  - Centro-derecha: Cronómetro tubular monospaciado de 28h y controles de exportación.
  - Derecha: Avatar de equipo y menú de opciones.
- **Sidebar:** Lista vertical de pasos con estados completado (círculo azul check SVG), activo (fondo tenue y borde izquierdo resaltado) y bloqueado (candado discreto).

## Do's and Don'ts

### Do:
- **Do** promover y diseñar interfaces **sin cards (cardless)**: la estructura se crea con jerarquía tipográfica, filas tabulares y divisores lineales hairline (1px).
- **Do** emplear el isotipo de doble barra diagonal `//` (`#0066FF`) y la palabra bicromática `RALLY STUDIO` (`#091E42` + `#0066FF`) como estándar supremo de identidad.
- **Do** mantener el fondo de trabajo luminoso y limpio con contraste AAA para máxima legibilidad.
- **Do** utilizar JetBrains Mono con `tabular-nums` para tiempos, tokens, ponderaciones y códigos.
- **Do** aplicar micro-transiciones ágiles de 120ms para respuesta táctil inmediata.
- **Do** utilizar `.tactical-status-pill` con micro-dot luminoso de 6px para indicar estados de radar, espera y selección.

### Don't:
- **Don't** encajonar contenidos en tarjetas (cards) flotantes con bordes inflados y rellenos innecesarios.
- **Don't** fragmentar la pantalla en archipiélagos de cajas que obligan al usuario a procesar contenedores en lugar de datos.
- **Don't** diseñar píldoras o badges de juguete ("toy badges"): fondos celestes saturados (`#EFF6FF`), bordes celestes inflados (`#BFDBFE`), texto gritón en mayúsculas negritas (`font-weight: 800`) ni radios de 4px o 9999px.
- **Don't** inyectar estilos visuales inline (`style="..."`) para representar estados o componentes; usar siempre las clases estandarizadas del sistema.
- **Don't** usar emojis bajo ninguna circunstancia en la interfaz, etiquetas o botones.
- **Don't** aplicar degradados púrpura/magenta saturados tipo "AI startup" en paneles de trabajo.
- **Don't** utilizar radios de curvatura excesivos (>18px) en botones o elementos interactivos.
- **Don't** ocultar el cronómetro oficial de la competencia durante la sesión de trabajo.
- **Don't** introducir dependencias pesadas de componentes que impidan el funcionamiento con Wi-Fi universitario degradado.


