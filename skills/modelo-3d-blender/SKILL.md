---
name: modelo-3d-blender
description: Genera modelos o renders 3D con Blender para el video, con ficha técnica previa justificada por la rúbrica y sin improvisación. Úsala solo para piezas 3D; nunca para texto, diagramas ni diseño plano.
---

# Modelo 3D con Blender

## Cuándo usarla

- Hay una toma con `owner: modeler` en `shots/*.yaml` / `script/shotlist.csv`.
- El guion necesita mostrar algo que no existe en fotografía.

**No la uses** para íconos, ilustraciones planas, diagramas ni mockups web.

## Procedimiento (en orden; sin saltar pasos)

1. **Confirma la toma**: lee tu fila (toma, acto, duración en cámara,
   `rubric_item`, `quality_tier`, `depends_on`). Si falta algún dato,
   pregunta al director y no inventes nada. Sin `rubric_item`, la pieza
   no se produce.
2. **Busca antes de modelar**: revisa primero modelos existentes (bibliotecas
   CC0 tipo Poly Haven o Kenney, repositorios abiertos, o modelos que el propio
   proyecto aporte). Solo se modela lo que no se encontró o que debe seguir el
   diseño propio con exactitud.
3. **Toma el guardia de recursos** (obligatorio; nada directo):
   ```bash
   python scripts/gpu_lock.py run --owner modeler_<pieza> --priority media -- <comando>
   ```
   Para chequear sin tomar: `python scripts/gpu_lock.py status`.
   Desde un script Python: `from gpu_lock import acquire, release`.
   Si el recurso está ocupado, espera; no fuerce nada.
4. **Escribe la ficha técnica** `blender/ficha_<shot_id>.md` (protocolo abajo)
   y pide al director que la revise antes de abrir Blender.
5. **Modela con script reproducible** (no a mano en la interfaz). Deja el
   `.blend` y el script en `blender/`. Las dimensiones salen de
   `budget/bom.csv` (`dim_*_mm`): nada se dimensiona a ojo.
6. **Renderiza en el tier de la toma**, leyendo `env.json`:
   - `draft`: EEVEE, 50 %, ≤ 5 min (exploración descartable).
   - `revisar` (tier de aprobación): EEVEE, 100 %, ≤ 20 min.
   - `final` (Cycles): solo cuando el reloj del rally pasó el
     `caps.render_final_%` (~75 % del tiempo transcurrido) y con
     `hours_total` definido en `brief.json`. Sin proyecto: no existe.
7. **Aprobación antes del final**: solo con el humano conforme al encuadre de
   `revisar` se lanza el `final`.
8. **Entrega**: guarda la salida en `dashboard/assets/` como
   `asset_<shotlist_id>_<descripcion>.<ext>`, sírvela a la ventana
   (`--tab resources --slot main`) y anota los minutos en
   `blender/horas_3d.csv` (columnas: fecha, shot_id, minutos).

## Ficha técnica obligatoria (antes de modelar)

Sin ficha revisada, Blender no abre. La ficha existe por una toma y responde
un criterio de la rúbrica:

1. **Propósito**: shot_id, acto, duración en cámara, qué debe comunicar la
   pieza y a qué `rubric_item` responde.
2. **Materiales ANTES de la geometría** (tabla: pieza / material / por qué /
   costo relativo / color en cámara). El material define rugosidad, reflejo,
   cómo recibe la luz y cuánta poligonización basta. Elegir material después
   de modelar es improvisación: prohibido.
3. **Componentes reales**: si la pieza lleva tecnología, los componentes
   concretos y sus medidas salen de `budget/bom.csv` (nombre o modelo real,
   sin inventar). Ningún cubo sin identidad. Si la pieza no lleva tecnología,
   decláralo explícito en la ficha.
4. **Interfaces físicas** (si el equipo lo pide por la naturaleza del proyecto):
   espacio real para cables, posición y material de cada tornillo, bornera,
   sub-carcasa, anclaje a la estructura.
5. **Diseño para cámara**: encuadre previsto, luz de 3 puntos, fondo, algo de
   referencia de escala, y qué no debe verse en el cuadro.
6. **Validación física mínima**: proporciones contrastadas contra las
   dimensiones del `bom.csv`; volumen y estabilidad plausibles (nada flota ni
   atraviesa paredes); detalle proporcional a su tamaño en el plano.
7. **Presupuesto por pieza**: tier y límites de `env.json` (poligonización
   objetivo, minutos máximos del tier). Si la pieza no cabe en su presupuesto:
   baja poligonización o propón eliminar la pieza al director.

## Jerarquía de assets (orden de decisión, no de gustos)

1. **Modelo existente** (CC0 / kit / modelo del proyecto): primera opción;
   cero GPU y sin apariencia genérica.
2. **Pieza protagonista que el kit no cubre**: modelado manual con ficha; es
   la pieza que sostiene el `rubric_item`, por eso sí merece horas.
3. **Nada de "relleno 3D"**: si una pieza no sostiene criterio de rúbrica ni
   la pide una toma, no se produce.

## Reglas

- **Techo global de horas 3D**: `blender/horas_3d.csv` acumula minutos;
  `orchestrate.py status` los compara con `caps.max_3d_hours_total` de
  `env.json`. Al llegar al techo: bajar detalle o eliminar piezas. Nunca exceder.
- Un proceso pesado a la vez por recurso, garantizado por el guardia; nunca en
  paralelo con TTS, Playwright o ffmpeg si estos compiten por el mismo slot.
- Menos de 4 GB de VRAM (dato de `env.json`): dilo y propón alternativa 2D o
  una pieza de baja poligonización; no pongas en riesgo el cuelgue.
- Render final solo en su ventana del reloj (D7, paso 7 del procedimiento).
- El MCP de Blender es opcional: pide permiso antes de instalarlo.

## Punteros

- Spec del sistema: `docs/superpowers/specs/2026-10-21-orquestacion-especialistas-design.md`.
- Guardia de recursos: `scripts/gpu_lock.py` (status / acquire / run / release).
- Tablero del equipo: `python scripts/orchestrate.py status`.
- Contrato de tomas: `shots/*.yaml` → `script/shotlist.csv`.
- Fuente única de lo físico: `budget/bom.csv`.
- Destino de renders: `dashboard/assets/`.
- Registro de horas 3D: `blender/horas_3d.csv`.
