# Cerebro de conocimiento — cómo se construye

Este directorio es la **memoria de dominio** del proyecto: todo lo que un equipo necesita
saber para ganar el rally, sin una sola línea del motor.

```
brain/
  corpus/              ← lo que el cerebro lee (generado, no se edita a mano)
  sync_corpus.py       ← reconstruye corpus/ desde las fuentes canónicas
  corpus_state.json    ← qué entró, qué faltó, si hay proyecto activo
```

Grafo resultante en `graphify-out/`:

| Archivo | Para qué |
|---|---|
| `graph.json` | el grafo (nodos, aristas, comunidades) |
| `graph.html` | visualizador interactivo |
| `GRAPH_REPORT.md` | informe con comunidades, nodos centrales y preguntas |
| `.graphify_labels.json` | nombres de las comunidades |

## Qué entra y qué no

**Entra** conocimiento que gana: rúbricas oficiales (texto e imagen), banco de retos,
análisis de ganadores 2014–2026, casos internacionales, patrones de pitch, claims con
fuente, estructura del pautado y del video de 120 s.

**No entra** (y es deliberado):

| Excluido | Por qué |
|---|---|
| `scripts/`, `dashboard/`, `site/` | el motor no se programa: lo opera el usuario |
| `LEEME.md`, `docs/INSTALACION_AGENTE.md` | instrucciones de arranque, no conocimiento |
| `graphify-out/converted/` | pautados de ediciones anteriores (regla 11 de `AGENTS.md`) |
| capturas sueltas de WhatsApp | ruido sin valor probatorio |

El grafo anterior tenía 177 nodos y **33 % de ellos eran ruido**: una foto de WhatsApp,
dos proyectos muertos y el LEEME. Ese ruido generó comunidades fantasma como
«Proyecto Güegüense Pinolero» o «Sede UNAN-León» que no aportaban nada al equipo.

## Reconstruir el cerebro

```powershell
# 1. Sincronizar corpus (copia y normaliza desde knowledge/, research/ y docs base)
python brain/sync_corpus.py

# 2. Reconstruir el grafo (asistente con la skill graphify)
/graphify brain/corpus
```

`sync_corpus.py` es idempotente: puedes correrlo las veces que quieras. Deduplica,
convierte `.docx` y `.json` a Markdown (si un JSON entra como código, graphify lo pasa
por AST y produce nodos basura) y nunca borra `proyecto_actual.md`.

## El proyecto real: el cerebro espera

El cerebro se distribuye **sin proyecto**. Eso es intencional: cada usuario corre el
sistema con su propio reto y su propio equipo.

El cerebro incluye el proyecto cuando se cumple esta condición:

1. `brief.json` tiene `project_name`, `team_name`, `university` y `city` con valor.
2. Existe `brain/corpus/proyecto_actual.md` con el brief, la solución y el pautado.

Mientras el archivo no exista, el cerebro solo contiene conocimiento del certamen.
Cuando el usuario define su proyecto, el agente lo crea y corre:

```powershell
graphify update brain/corpus
```

Regla para el agente (también en `AGENTS.md`): **no inventar un proyecto**. Si
`brief.json` está vacío, el cerebro se queda esperando y se le dice al usuario que
defina su reto. Nunca se rellena con un proyecto de ejemplo.

## Fusión de entidades

`sync_corpus.py` deja el corpus listo, pero la extracción se hace por archivo, así que
la misma idea puede aparecer con ids distintos. Al reconstruir se aplica una pasada de
resolución de entidades (fusión por etiqueta normalizada) y se descartan aristas
colgantes o duplicadas antes de construir el grafo. Sin ese paso el grafo no cruza
documentos y pierde justo lo que lo hace útil.
