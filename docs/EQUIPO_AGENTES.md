# El equipo de agentes especialistas · Rally Studio

> Un director y cinco especialistas trabajando **a la vez** sobre los mismos
> contratos, con una guardia técnica que impide que dos procesos pesados
> choquen. Nada se improvisa: cada pieza existe porque una toma la pide y un
> criterio de la rúbrica la sostiene.

Este documento explica, en español claro, cómo funciona la orquestación de
agentes integrada en Rally Studio: quién hace qué, qué contratos comparten,
cómo evitan chocarse y cómo se despacha el equipo. Complemento de detalle
técnico: [`docs/superpowers/specs/2026-10-21-orquestacion-especialistas-design.md`](superpowers/specs/2026-10-21-orquestacion-especialistas-design.md).

---

## 1. Lo que resuelve (en una frase)

Un solo agente produce todo en secuencia: primero modela, luego el escenario,
luego las escenas, y el guionista espera — con piezas improvisadas (cubos
"sensor", escenarios que nadie pidió). Rally Studio reemplaza eso por un
**equipo de especialistas que corre en paralelo** sabiendo, cada uno, por qué
produce lo que produce.

## 2. Los roles

| Rol | Produce | Donde escribe |
|---|---|---|
| **director** | contratos e integración; no produce contenido | `brief.json`, `shots/*.yaml`, `budget/bom.csv`, `script/shotlist.csv` |
| **guionista** | los actos del guion, escritos sabiendo qué pieza entra en cámara | `script/` |
| **modeler** | ficha técnica, 3D con `.blend` reproducible y renders | `blender/` + `dashboard/assets/` |
| **pautador** | secciones del pautado y canvas | `docs/` |
| **presupuestador** | presupuesto con precios y proveedores reales | `budget/` |
| **investigador** | estadísticas citables con fuente, URL y año | `research/` |
| **grafista2d** | piezas 2D, si la toma lo pide | la zona que el director le asigne |

Nadie escribe en la zona de otro. El único que cruza contratos es el director.

## 3. Los tres contratos (y por qué no se crean elementos "a lo tonto")

**Toma — `shots/S01.yaml` (uno por toma del video).** La escribió el director.
Lleva: qué es la toma, en qué acto va, cuántos segundos dura en pantalla,
**`rubric_item`** (qué criterio de la rúbrica sostiene), `claim_ids` (qué
estadística cita, de `research/claims.json`), **`owner`** (quién produce la
pieza), **`depends_on`** (de qué otras tomas depende) y **`quality_tier`**
(borrador / revisar / final).

**Lista de tomas — `script/shotlist.csv`.** Compilada por
`python scripts/build_shotlist.py` desde los YAML; valida todo antes de
escribir (y si algo está roto, no escribe nada). Guionista y modeler leen la
misma lista: el guionista sabe qué pieza existirá y cuando; el modeler sabe
para qué acto, por cuánto tiempo y con qué criterio de rúbrica.

**Lista de materiales — `budget/bom.csv`.** Única fuente de lo físico:
nombre real de cada componente, material, **dimensiones en milímetros**,
cantidad, costo y URL del proveedor. De ahí salen el presupuesto, la ficha
técnica y las dimensiones que los scripts de Blender leen (nada se dimensiona
"a ojo"). Componentes concretos por proyecto: entran cuando se abre un
proyecto; la base lleva el formato, no datos.

## 4. La ficha técnica ("materiales antes de la geometría")

Antes de que Blender abra, el modeler escribe `blender/ficha_<shot_id>.md`:

1. **Propósito**: toma, acto, duración, qué comunica la pieza, `rubric_item`.
2. **Materiales elegidos con justificación** (tabla: pieza / material / por
   qué / costo relativo / color en cámara). El material define rugosidad,
   reflejo y el detalle necesario — se elige ANTES de modelar.
3. **Componentes reales**: si la pieza lleva tecnología, su nombre y medidas
   vienen del `bom.csv` (nada de cubos sin identidad).
4. **Interfaces físicas**: espacio para cables, posición y material de cada
   tornillo, anclaje. Un modelo técnico sin cables ni tornillos se percibe
   falso.
5. **Diseño para cámara**: encuadre, luz de 3 puntos, fondo, escala.
6. **Validación física mínima**: proporciones contra las dimensiones del
   `bom.csv`, volumen y estabilidad plausibles.
7. **Presupuesto de render** por tier, desde `env.json`.

Y antes de modelar, **buscar**: bibliotecas de modelos existentes primero
(CC0, kits, material del propio proyecto); solo lo que no se encontró se
modela desde cero.

## 5. La guardia de recursos (por qué explotar la PC ya no pasa)

Los procesos pesados (Blender, ffmpeg, TTS, grabación de pantalla) compiten por
GPU, CPU y RAM. La regla "un proceso a la vez" aquí no es una conducta espera:
es un **guardia físico** (`scripts/gpu_lock.py`):

- Tres recursos con cupos: `gpu` (exclusivo), `cpu` y `ram`, configurables en
  `env.json`.
- Cada titular graba **PID + hora de inicio + prioridad** (baja / media /
  alta). Si el proceso muere, el lock queda huérfano y **se limpia solo**.
- Creación y robo del lock son **atómicos** (nunca se edita el archivo en
  vivo).
- Un esperador de prioridad **alta** puede sustituir a un titular **baja**
  solo con 5 minutos de espera, con aviso impreso.
- Timeouts informan quién tiene el recurso, desde cuándo y con qué prioridad.
- Los locks viven en `locks/`, **fuera de git**: cada PC del equipo serializa
  su propia GPU.
- `scripts/heavy_guard.py` **bloquea llamadas directas** a binarios pesados:
  la única vía correcta es

  ```bash
  python scripts/gpu_lock.py run --owner <agente> -- <comando>
  ```

  El lock se sostiene mientras viva el hijo. Si el hijo muere, el lock muere
  con él. `render_watch.py` sigue midiendo RAM y CPU en vivo.
  El hook `.opencode/plugins/heavy-guard.js` bloquea el intento directo en
  sesiones nuevas de OpenCode; fuera de la app lo sostiene el skill.

## 6. Cómo se despacha el equipo

**Precondición:** `brief.json` con proyecto (nombre, equipo, universidad,
ciudad, tipo de certamen). Sin proyecto, la base está montada pero **no se
despacha a nadie**; el sistema pregunta.

1. El director lee brief, claims y rúbrica del certamen activo.
2. El director arma las tomas en `shots/` y compila:
   `python scripts/build_shotlist.py`.
3. **Misma PC**: una segunda sesión de OpenCode por especialista (o
   subagentes en background desde la sesión del director). Cada despacho
   lleva: zona exacta, sus tomas, el criterio de rúbrica, su tier de
   presupuesto y el recordatorio de la guardia.
4. **Otra PC**: clon del repo o `git worktree`; los contratos viajan por
   `git push/pull`. Cada PC serializa su GPU con su propio lock; el binario
   pesado corre donde el recurso está libre.
5. Tablero de solo lectura en cualquier momento:
   `python scripts/orchestrate.py status` — precondición, env, locks,
   progreso de tomas, horas 3D acumuladas y zonas tocadas.
6. Al terminar, cada especialista entrega informe (qué produjo, en qué
   archivo, qué falta); el director integra y marca estado. El cierre pasa
   por `python arsenal.py check-todo`.

## 7. El techo de horas 3D

Cada render registra minutos en `blender/horas_3d.csv`. `orchestrate.py`
compara contra `caps.max_3d_hours_total` de `env.json` y avisa. Render final
(Cycles) solo cuando el reloj del certamen pasó ~75 % del tiempo: antes, todo
es borrador (EEVEE, 50 % para revisar encuadres).

## 8. Más allá del 3D: planos, páginas web y otros entregables

El patrón de contrato (owner + `depends_on` + `rubric_item` + `quality_tier`)
no es solo para piezas 3D. Cuando el proyecto de un dominio distinto abre,
se crea una **lista de cotejo del dominio** en `knowledge/checklists/`:

- **Arquitectura u obra (una casa, un módulo)**: planos basados en técnicas
  constructivas oficiales del país — escala y acotado reales, gruesos de muro,
  ventilación e iluminación, materiales coherentes con el `bom.csv`, norma
  citable en `research/claims.json`. Un plano bonito pero indebido no cumple.
- **Página web / prototipo digital**: función primero, impacto visual después
  — flujo navegable completo, jerarquía visual clara, contraste y
  accesibilidad, rendimiento en la máquina de la demo.
- **Documento técnico**: mismo patrón con su propia lista.

Nada queda hardcodeado: la lista de cotejo de cada dominio entra cuando el
proyecto la necesita, como el resto de los datos.

## 9. Por qué esto importa (la propuesta en una tabla)

| Sin orquestación | Con el equipo de especialistas |
|---|---|
| Un agente: modelo, luego escenario, luego escenas | Varios a la vez, por zonas exclusivas |
| Piezas improvisadas, cubos "sensor" | Toda pieza justificada por toma + rúbrica |
| Dos renderizados que congelan la PC | Guardia de recursos con PID, prioridad y timeout |
| Especialistas que no se hablan | Contratos compartidos (`shots/`, `bom.csv`) |
| Horas 3D sin control | Techo global y registro por toma |
| Estado del equipo en la cabeza de alguien | Tablero: `python scripts/orchestrate.py status` |

> **Regla final:** nada se produce sin contrato, todo los binarios pesados
> pasan por el guardia, todo se sirve por la ventana con aprobación humana.
> Mientras no haya proyecto en `brief.json`, el equipo espera.
