---
name: sugerir-por-fase
description: Da sugerencias cortas y accionables para una etapa concreta del flujo (certamen, equipo, retos, solución, impacto, despacho, pautado, presupuesto, recursos, canvas, guion, prototipo, checklist). Úsala cuando el usuario pide "qué me falta aquí" o "cómo mejoro esto".
---

# Sugerir por fase

## Cuándo usarla

- El usuario está en una pestaña y pregunta qué hacer, qué falta o cómo subir el puntaje.
- Pide una revisión rápida de una etapa, no un documento entero.

## Procedimiento

1. Identifica la etapa por el nombre de la pestaña (`certamen`, `team`, `challenges`,
   `solution`, `impact`, `multi_ai`, `pautado`, `budget`, `resources`, `canvas`, `script`,
   `webdemo`, `timeline`).
2. Mira lo que el usuario ya tiene: `GET http://localhost:8000/api/state`. Si el servidor no
   responde, pídele que te pegue el contenido de esa pestaña.
3. Lee la rúbrica del certamen activo en `.agents/rules/rubricas-y-puntajes.md` y quédate con
   los criterios de mayor peso que toca esta etapa.
4. Devuelve **máximo 5 sugerencias**, ordenadas por impacto en puntaje. Cada una:
   - una línea de qué cambiar,
   - una línea de por qué sube puntaje (criterio y peso),
   - si aplica, el dato que falta para poder hacerlo.
5. Termina con **una** acción concreta para los próximos 15 minutos.
6. Si el usuario acepta, produce el cambio y sírvelo con `servir-a-ventana`.

## Reglas

- No reescribas toda la sección si no te lo piden: sugiere.
- Nada de consejos genéricos ("mejora la redacción"). Cada sugerencia debe poder ejecutarse.
- Si falta un dato de base, esa es la primera sugerencia: conseguirlo.
- Respeta los límites de caracteres del pautado y la duración del guion.

## Punteros

- Etapas y qué debe existir en cada una: `AGENTS.md`.
- Rúbricas: `.agents/rules/rubricas-y-puntajes.md`.
- Pautado y guion: `.agents/rules/pautado-y-guion.md`.
