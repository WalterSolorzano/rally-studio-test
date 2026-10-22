# Diseño — Base de orquestación de especialistas (sin proyecto abierto)

Fecha: 2026-10-21 · Estado: reescrito tras indicaciones del humano.

**Estado de partida:** no hay proyecto ni rally abierto. `brief.json` está en plantilla.
Todo lo que sigue es la **base genérica**: nada de nombres de proyectos, componentes
concretos, precios ni composición de jurado. Lo específico entra cuando el proyecto
se abra.

## 1. El problema que resolvemos

Hoy un solo agente produce todo en secuencia: primero modela, luego arma el
escenario, luego las escenas, y el guionista espera. Eso provoca dos daños reales:

1. Horas quemadas en espera pura.
2. Piezas improvisadas: cubos llamados "sensor", materiales al azar, escenarios
   que nadie pidió y que no sirven a ninguna toma.

Queremos varios especialistas trabajando **a la vez**, cada uno sabiendo **por qué
produce lo que produce** (qué toma lo usa, cuántos segundos dura en pantalla, qué
criterio de la rúbrica sostiene) y con un lugar de trabajo que no choque con los
demás.

## 2. Decisiones tomadas

### D1 — La rúbrica justifica, no la composición del jurado

Ninguna skill nombra quién evalúa. Toda pieza se justifica por un **criterio de la
rúbrica** del certamen activo (`knowledge/rubric_latam.md` o
`knowledge/rubric_matrices.md`, según `rally_type`). El contrato de cada toma lleva
el campo `rubric_item` con ese criterio. Si una pieza no sostiene ningún criterio,
no se produce.

### D2 — Lock real de recursos, atado al sistema operativo

`scripts/gpu_lock.py` ya no es solo conducta: es guardia técnica.

- **Recursos**: `gpu`, `cpu` y `ram`, cada uno con capacidad configurable en
  `env.json` (`slots`). Por defecto: gpu = 1 (exclusivo), cpu = 1, ram = 1.
- **Prioridad**: cada titular declara `baja | media | alta`. Se graba en el lock.
- **`run -- <comando>`**: el modo recomendado. El proceso `gpu_lock.py` toma el
  lock y lo sostiene mientras su **proceso hijo** (Blender, ffmpeg, TTS…) corre.
  El lock guarda el PID del hijo y del padre si los conoce. Si el proceso muere,
  el lock queda huérfano y se limpia solo.
- **PID + hora de inicio**: todo titular graba `pid`, `started_at` (epoch) y
  `started_iso` (hora legible). El `status` muestra la edad y avisa cuando un
  titular se acerca a su TTL.
- **Creación y robo atómicos**: la creación usa `O_CREAT|O_EXCL` (dos procesos
  no pueden tomar el mismo lock a la vez). El robo primero **renombra** el lock
  a `locks/roto_<timestamp>.json` (operación atómica) y luego lo borra: nunca se
  edita el lock en caliente.
- **Robo con prioridad**: un esperador con prioridad `alta` puede robar el lock a
  un titular `baja` solo si su espera superó 5 minutos, con aviso impreso. Nunca
  se le roba a `media` ni a otro `alta`.
- **Timeout con aviso**: si un esperador se rinde por timeout, el mensaje dice
  quién tiene el recurso, desde cuándo y qué prioridad.
- **Fuera de git**: `locks/` está en `.gitignore`. El lock protege solo la máquina
  local (cada PC del equipo serializa su propia GPU).
- **Guardia contra llamadas directas**: `scripts/heavy_guard.py` revisa un
  comando; si lanza un binario pesado (lista `blocked_binaries` de `env.json`)
  y el recurso no está tomado, lo bloquea con código 3 y ordena usar
  `gpu_lock.py run`. El modo simple de esfuerzos es: **todo binario pesado pasa
  por `python scripts/gpu_lock.py run -- <comando>`**.

`render_watch.py` sigue viendo RAM y CPU en vivo; el lock decide quién entra,
`render_watch` decide si la máquina aguanta.

### D3 — Un archivo por toma, compilado a shotlist

Cada toma es un YAML: `shots/S01.yaml`. El director los crea y edita; ninguna
skill escribe ahí. Compilar:

```bash
python scripts/build_shotlist.py
```

 genera `script/shotlist.csv` con columnas base y de coordinación:

- Base: `id, act, description, asset_id, asset_type, duration_s, status, notes`
- Coordinación: `rubric_item, claim_ids, owner, depends_on, quality_tier`

`build_shotlist.py` valida antes de escribir: ids únicos, `depends_on` apunta a
tomas existentes, `owner` es un especialista conocido, `rubric_item` no vacío,
`quality_tier` es `draft | revisar | final`, `status` es
`pendiente | asignado | borrador | revisado | integrado | bloqueado`.
Si algo falla: lista de errores y **no escribe el CSV**.
`claim_ids` referencia a entradas de `research/claims.json` que la toma cita.

### D4 — bom.csv como fuente única de lo físico

`budget/bom.csv` es la única fuente de: presupuesto, ficha técnica y dimensiones
que los scripts de Blender leen.

Columnas:

```
id, item, category, model_or_sku, material, dim_x_mm, dim_y_mm, dim_z_mm,
units, unit_cost, currency, source_url, notes
```

Reglas: `currency` es `USD` (Latam) o `NIO` (Nacional) según `rally_type`; el
`id` es estable y lo citan la ficha y el script de Blender; las dimensiones van
en milímetros y el script de Blender las usa para escalar (nadie dimensiona "a
ojo" en el código 3D). Es un **contrato**: lo edita el director integrando
propuestas del modeler (en `blender/`) y del presupuestador (en `budget/`).

### D5 — Cómo se lanza un especialista, por host

**Misma PC**: el director despacha una sesión/subagente por especialista
(segundo OpenCode en otra ventana, o subagente en background). Zonas + lock
evitan choques aunque compartan carpeta.

**Otra PC**: clon del repo (o `git worktree` para aislamiento total). Los
contratos viajan por git (`push`/`pull` del director). El lock es local a cada
máquina: cada PC serializa su propia GPU. Los renders pesados se entregan por
git o por carpeta compartida, lo que el equipo decida al abrir proyecto.

Chequeo del equipo, sin volatile memoria:

```bash
python scripts/orchestrate.py status
```

Muestra: precondición de `brief.json`, `env.json`, titular de cada recurso,
progreso de tomas (estado, tier, dependencias rotas), horas 3D acumuladas y
archivos modificados por zona. Es solo lectura.

### D6 — Ficha técnica genérica, sin listas fijas de componentes

La ficha técnica NO trae una lista memorizada de sensores ni placas: los
componentes concretos los define cada proyecto en `budget/bom.csv`. Lo genérico
es el protocolo:

1. **Buscar antes de modelar**: primero se busca el modelo 3D existente
   (bibliotecas CC0, repositorios abiertos, modelos provistos por el propio
   proyecto). Solo se modela lo que no se encontró o que debe ser fiel al
   diseño propio.
2. **Ficha por toma**: `blender/ficha_<shot_id>.md`, con materiales elegidos
   antes de la geometría y justificados (tabla: pieza / material / por qué /
   costo relativo / color en cámara), espacios reales para cables y tornillos
   si la pieza es tecnología (posición y material), referencias a filas del
   `bom.csv` con `id`.
3. **Validación física mínima**: proporciones contrastadas contra las
   dimensiones del `bom.csv` (no un número inventado), masa/volumen plausible,
   estabilidad (la pieza no flota ni se atravesada), identidad técnica si
   corresponde (componente con nombre real de la bom).
4. **Techo global de horas 3D**: `blender/horas_3d.csv` acumula minutos por
   toma; `orchestrate.py status` compara contra `caps.max_3d_hours_total` de
   `env.json` y avisa. Al llegar al techo: bajar poligonización o eliminar la
   pieza; nunca exceder.

### D7 — Tiempos y presupuesto desde env.json + tier

`env.json` (raíz, fuera de git porque es de la máquina; plantilla en
`env.example.json`) define:

```json
{
  "hardware": {"gpu_vram_gb": 0, "ram_gb": 0, "cpu_cores": 0},
  "slots": {"gpu": 1, "cpu": 1, "ram": 1},
  "blocked_binaries": ["blender", "ffmpeg", "ffprobe", "ffplay", "piper"],
  "caps": {"max_3d_hours_total": 3.0, "render_final_%": 75, "ttl_gpu_min": 25},
  "tiers": {
    "draft":   {"engine": "EEVEE",  "samples": 16,  "res_pct": 50,  "max_min": 5},
    "revisar": {"engine": "EEVEE",  "samples": 64,  "res_pct": 100, "max_min": 20},
    "final":   {"engine": "Cycles", "samples": 128, "res_pct": 100, "max_min": 20}
  }
}
```

Reglas de motor: `draft` es exploración descartable; `revisar` es el tier de
aprobación de encuadre; `final` (Cycles) solo se lanza cuando el reloj del
rally pasó el porcentaje `caps.render_final_%` (~75 % del tiempo transcurrido)
y con `hours_total` ya definido en `brief.json`. Sin proyecto abierto: no
existe render final.

## 3. Generalización: entregables que no son productos

El patrón contrato/owner/depends_on/rubric_item/quality_tier no es solo para
3D. Propuesta del agente (sujeta a revisión del humano): cada dominio recibe el
mismo contrato de toma y **su propia lista de cotejo (checklist)**, que se llena
cuando el proyecto define su dominio. Por ejemplo:

- **Arquitectura / obra (una casa, un módulo, un aula)**: los planos deben basarse
  en técnicas constructivas oficiales del país vigentes; checklist esperado:
  escala y acotado reales, gruesos de muro correctos, ventilación e iluminación
  mínimas, materiales coherentes con el `bom.csv`, referencia normativa citable
  en `research/claims.json`. Un plano bonito pero indebido no cumple.
- **Página web / prototipo digital**: función primero, impacto visual después;
  checklist esperado: flujo de uso navegable completo, jerarquía visual clara,
  contraste y accesibilidad mínimos, rendimiento en la máquina de la demo,
  contenido del pautado presente. Un prototipo que solo llama la atención y no
  funciona no cumple.
- **Documento / plana técnica**: mismo patrón con checklist propio.

Lugar acordado para esas listas: `knowledge/checklists/<dominio>.md`, creadas
cuando el proyecto abra (no antes, para no hardcodear). Las skills apuntan ahí
cuando el dominio exista.

## 4. Zonas de escritura (resumen)

| Zona | Dueño | Contenido |
|---|---|---|
| `shots/` | director | contratos YAML de tomas |
| `script/` | guionista (CSV compilado: director) | guion; `shotlist.csv` compilado |
| `blender/` | modeler | fichas, scripts `.py`, `.blend`, `horas_3d.csv`, propuestas de bom |
| `dashboard/assets/` | modeler | renders `asset_<shotlist_id>_<descripcion>.<ext>` |
| `docs/` | pautador | pautado, canvas, bibliografía |
| `budget/` | presupuestador (bom: director) | `budget.json`, propuestas de bom |
| `research/` | investigador | `claims.json` con fuente, URL y año |
| `brief.json` | director | contrato mayor |

## 5. No-objetivos (sin cambios)

- NO se toca `rally_service.py`, `dashboard/app.js`, validadores ni localStorage.
- Nada automático sin aprobación humana (`servir_propuesta.py` gobierna la ventana).
- El orquestador es protocolo de comportamiento + guardias de archivos; no hace
  servidor nuevo.
- Mientras `brief.json` esté vacío: no despachar especialistas. Construir base
  está bien; producir contenido no.

## 6. Riesgos y mitigaciones

1. **Robo de lock a un proceso vivo**: solo ocurre por prioridad `alta` vs
   `baja` con 5 min de paciencia, huérfano real (PID muerto), TTL vencido o
   archivo corrupto; y el robo es atómico por renombrado.
2. **Dos máquinas con su propio lock**: correcto por diseño; el riesgo real es
   duplicar trabajo, mitigado por el mapa de tomas (`owner` único por fila).
3. **YAML mal escrito por el director**: `build_shotlist.py` valida y no compila
   contratos rotos.
4. **Especialista que junta horas 3D sin registrar**: regla de skill + chequeo
   del director al integrar (`orchestrate.py status` lo saca a la vista).
