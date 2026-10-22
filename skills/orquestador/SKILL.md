---
name: orquestador
description: Orquesta agentes especialistas (guionista, modeler 3D, pautador, presupuestador, investigador) que trabajan a la vez sin chocarse, con contratos por archivo y guardia de recursos. Úsala cuando el humano pida despachar al equipo o que varios trabajen en paralelo.
---

# Orquestador: director + especialistas

Reglas completas y decisiones D1–D7 en
`docs/superpowers/specs/2026-10-21-orquestacion-especialistas-design.md`.

## Cuándo usarla

- El humano pide despachar a varios agentes ("que trabajen a la vez").
- Hay 2 o más piezas por producir y no comparten zona de escritura.

## Palabras fijas

- **director**: integra y arma contratos; no produce contenido.
- **toma**: pieza del video; su contrato vive en `shots/<id>.yaml`.
- **bom**: lista de materiales y componentes reales en `budget/bom.csv`;
  única fuente de presupuesto, ficha técnica y dimensiones.
- **rúbrica**: el criterio que la pieza sostiene. Quien evalúa no se nombra:
  la justificación siempre es la rúbrica del certamen activo.

## Reglas duras (cada una tiene respaldo en un archivo)

1. **Precondición**: `brief.json` debe tener proyecto (nombre, equipo,
   universidad, ciudad, rally_type). Si está vacío: NO despachar. Pregunta al
   humano y espera. La base se monta sin abrir proyecto.
2. **El director escribe los contratos**: `brief.json`, `shots/*.yaml`,
   `budget/bom.csv` y `script/shotlist.csv` (compilado). Ningún especialista
   edita esos cuatro caminos por su cuenta.
3. **Zonas de escritura exclusivas** (cada quien escribe solo ahí):
   - `guionista` → `script/` (salvo `shotlist.csv`, que compila el director)
   - `modeler` → `blender/` (fichas, scripts `.py`, `.blend`, `horas_3d.csv`)
     y renders a `dashboard/assets/`, nombre `asset_<shotlist_id>_<desc>.<ext>`
   - `pautador` → `docs/`
   - `presupuestador` → `budget/` (salvo `bom.csv`, del director)
   - `investigador` → `research/` (solo `claims.json`, con fuente, URL y año)
4. **Todo binario pesado pasa por el guardia**:
   ```bash
   python scripts/gpu_lock.py run --owner <agente> --priority <baja|media|alta> -- <comando>
   ```
   Nunca blender, ffmpeg ni TTS directo: `scripts/heavy_guard.py` lo bloquea.
   El hook `.opencode/plugins/heavy-guard.js` aplica en sesiones nuevas de
   OpenCode; especialistas lanzados fuera de la app no pasan por el hook:
   el guardia lo sostiene esta regla del skill.
   Desde código Python se usa la API de import de `gpu_lock`.
   Para verificar que el guardia rechaza cuando el recurso está ocupado,
   los dos holders deben CORRER A LA VEZ: dos `run` en procesos separados,
   o un acquire contra un `run` vivo. Acquires temporizados uno tras otro
   en el mismo shell nunca se solapan: el primero libera antes de que el
   segundo corra, y la prueba miente con un OK falso.
   `release --resource <r> --force` lo usa SOLO el director, avisando al humano.
5. **Nadie improvisa**: antes de producir, el especialista responde sobre su
   fila: qué toma, en qué acto, cuántos segundos en cámara, qué criterio de
   rúbrica sostiene y con qué tomas se conecta (`depends_on`). Si algo no lo
   sabe: pregunta al director.
6. **Informe obligatorio**: al terminar, diga qué produjo, en qué archivo exacto
   lo guardó y qué queda pendiente. Sin informe, la pieza no cuenta como
   terminada. El director marca el `status` de la fila.
7. **Disciplina de commits**: nadie amenda sin antes comprobar qué commit es el
   `HEAD` con `git log -1` (otros agentes pueden haber commiteado en la misma
   rama). Cada commit se arma por rutas explícitas: `git add -- <archivo>`,
   nunca un `add` suelto que arrastra el trabajo de otra zona. El director
   integra los commits finales de zona.

## Protocolo del director (en orden)

1. **Leer antes de despachar**: `brief.json` (si hay proyecto),
   `research/claims.json`, la rúbrica del certamen activo
   (`knowledge/rubric_*.md` según `rally_type`) y `env.json`.
2. **Armar las tomas**: crea o edita `shots/<id>.yaml`, con campos
   `id, act, description, asset_id, asset_type, duration_s, status, notes` y
   `rubric_item, claim_ids, owner, depends_on, quality_tier`.
   Sin `rubric_item` la toma no se crea (D1).
3. **Compilar y validar**: `python scripts/build_shotlist.py`. Con errores:
   corregir antes de despachar a nadie. Sin errores: `script/shotlist.csv`
   queda listo.
4. **Despachar con 5 datos por especialista**: (a) zona de escritura exacta;
   (b) sus filas de `shotlist.csv`; (c) el `rubric_item` de cada fila;
   (d) recordatorio del guardia + su tier de presupuesto (`quality_tier` leido
   de `env.json`, D7); (e) límite de tiempo de la tarea.
5. **Chequear el tablero**: `python scripts/orchestrate.py status`. Muestra
   precondición, env, locks, tomas, horas 3D y zonas tocadas.
6. **Integrar**: revisa el informe, marca el `status` de la fila y decide si
   la pieza sirve (se sirve a la ventana con `servir_propuesta.py`) o vuelve
   con una corrección puntual. Sin nada silencioso.
7. **Cierre**: `python arsenal.py check-todo` antes de integrar todo
   (duración ≤ 120 s, coherencia de cifras, caracteres por campo). Lo que
   falla vuelve a su especialista; el director no lo arregla a mano.
8. **Cronómetro**: cada hora informa al humano tiempo restante y estado por
   especialista. A T-6h propone congelar assets y preparar exportación.

## Cómo se lanza un especialista, por host (D5)

**Misma PC**: segunda sesión de OpenCode en otra ventana, una por especialista,
o un subagente en background desde la sesión del director con el despacho del
paso 4 como prompt exacto. Zonas + locks permiten compartir carpeta.

**Otra PC**: clon del mismo repositorio o `git worktree` para aislamiento
total. Los contratos (`shots/`, `budget/bom.csv`, `shotlist.csv`) viajan por
`git push/pull` del director. El lock es local a cada máquina: cada PC
serializa su propia GPU, no existe lock global de hardware. El binario pesado
corre en la PC cuyo lock de recurso está libre. Los renders viajan por git o
por carpeta compartida; el equipo lo decide al abrir el proyecto.

## Tabla de coordinación (anti-improvisación)

| Especialista | Produce | Lee | Coordina con |
|---|---|---|---|
| guionista | actos del guion | tomas (shots + shotlist), fichas `blender/ficha_*.md`, claims | modeler (piezas en cámara), investigador (números) |
| modeler | ficha, `.blend`, scripts, renders | tomas (acto, duración, cámara), `budget/bom.csv` (dimensiones y materiales), `env.json` (tier) | guionista, presupuestador (la ficha alimenta los precios), director (`rubric_item`) |
| investigador | claims con fuente, URL y año | fuentes citables | guionista, pautador |
| pautador | secciones del pautado, canvas | brief, claims, budget | presupuestador |
| presupuestador | `budget/budget.json` | `budget/bom.csv`, fichas `blender/ficha_*.md` (lo que dijo el modeler), claims, proveedores con URL | modeler (lo que la pieza necesita de verdad), pautador, director |
| grafista2d | piezas 2D si se despacha | tomas con owner grafista2d | guionista |

## Cómo se ponen los precios (presupuestador)

Reglas de sentido común, sin tecnicismos:

1. **El precio se apoya en la ficha**. Cada línea del presupuesto sale de lo
   que otro especialista dijo que se necesita: si el modeler escribió en su
   ficha qué materiales y piezas lleva el modelo, los precios cubren exactamente
   eso. Si es una app, el costo sale de lo que la app necesita para funcionar,
   no de lo que a nadie se le ocurra. Nadie presupuesta en el aire.
2. **Precios creíbles**: ni locos ni regalados. Si una cosa cuesta 5 cuando en
   cualquier tienda cuesta 200, el precio está mal (demasiado barato = parece
   inventado). Si cuesta 2 000 cuando el promedio real es 50, también está mal.
   Antes de escribir un precio se busca la página del vendedor y se anota el
   enlace en la fila. Sin enlace, la fila no pasa.
3. **Pagar por usar, casi nunca construir**. Si ya existe un servicio que se
   paga por uso (alojamiento, envío de mensajes, voz, cajas, transporte), se
   contrata: es más barato, más rápido y más creíble que fabricarlo. Lo único
   que el propio equipo construye con sus manos (el prototipo, el modelo, el
   código propio) casi no cuesta dinero: ahí no se pone un precio grande. El
   presupuesto real vive en los servicios que se contratan a terceros.
4. **Gastos anuales para lo digital**. Si la solución es una app o una web,
   pensar en membresías que se pagan por año y planes por uso, no solo en el
   gasto del primer día. Siempre con el precio y el enlace real del plan.
5. **Palabras normales**. La tabla la lee gente que no es ingeniera: nombre de
   la cosa, para qué sirve y cuántas. Sin siglas raras ni jerga.

## Anti-objetivos (lo que el director NO hace)

- No produce contenido propio, salvo emergencia con aviso al humano.
- No despacha sin tomas validadas y `shotlist.csv` compilado.
- No toca `rally_service.py`, `dashboard/app.js`, validadores ni localStorage
  (motor del sistema; prohibido, ver AGENTS.md).
- Máximo 3 especialistas concurrentes (2 típico + 1 esperando).
- No inventa datos: toda cifra nace de `research/claims.json`.

## Checklist de despacho rápido

- [ ] `brief.json` con proyecto; si no, nada se despacha.
- [ ] Tomas en `shots/*.yaml` completas (`rubric_item` no vacío).
- [ ] `python scripts/build_shotlist.py` sin errores.
- [ ] `env.json` cargado (hardware, slots, caps, tiers).
- [ ] `python scripts/orchestrate.py status` muestra los recursos libres.
- [ ] Cada despacho con los 5 datos del paso 4.
- [ ] Nada pesado fuera de `gpu_lock.py run`.
