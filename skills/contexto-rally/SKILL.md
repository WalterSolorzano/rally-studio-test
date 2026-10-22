---
name: contexto-rally
description: Carga el contexto del proyecto antes de trabajar. Lee brief.json, el índice del corpus y el estado vivo de la ventana, y decide qué documentos abrir. Úsala al empezar una sesión, antes de producir contenido o cuando falte un dato.
---

# Contexto del rally

## Cuándo usarla

- Al empezar una sesión en este repositorio.
- Antes de producir cualquier contenido (pautado, retos, guion, presupuesto).
- Cuando falte un dato y no sepas si ya está en el corpus.

## Procedimiento

1. Lee `brief.json` completo. Es el estado del proyecto: certamen, equipo, reto, horas.
2. Lee `knowledge/INDICE.md`. Es el mapa del corpus: una línea por fuente con "cuándo sí"
   y "cuándo no".
3. Si el servidor está arriba, pide el estado real de la ventana:
   `curl -s http://localhost:8000/api/state`. Si responde `{"state": null}`, el usuario
   todavía no ha escrito nada: ese es un hueco que hay que preguntar.
4. **Di en voz alta qué vas a leer y por qué**, una línea por archivo. El usuario debe poder
   corregirte antes de que gastes contexto.
5. Abre solo esos archivos, y por rangos si son grandes.
6. Si un dato no está en ninguna fuente, anótalo como hueco. No lo rellenes con lo que
   "suena bien".

## Reglas

- `brief.json` manda sobre cualquier suposición tuya.
- `research/claims.json` es la única lista de estadísticas citables. Si una cifra no está
  ahí, no la uses como hecho: márcala como estimación o pídela.
- El corpus tiene dos certámenes. Antes de leer nada del otro, confirma `rally_type`.
- Si `brief.json` trae datos de ejemplo (`hidro-vigia`, `mentes-pinoleras`), son residuo de
  una plantilla: no los presentes como si fueran del usuario.

## Punteros

- Estado del proyecto: `brief.json`
- Mapa del corpus: `knowledge/INDICE.md`
- Estadísticas citables: `research/claims.json`
- Reglas del evento: `AGENTS.md` y `.agents/rules/`
