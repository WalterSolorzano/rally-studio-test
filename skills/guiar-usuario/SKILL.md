---
name: guiar-usuario
description: Lleva al usuario por las 13 etapas del workbench, detecta qué falta en cada una y lo pregunta de a una. Úsala cuando el usuario no sepa por dónde empezar, cuando pida "qué sigue" o cuando una pestaña esté incompleta.
---

# Guiar al usuario

## Cuándo usarla

- El usuario abre el proyecto por primera vez.
- Pregunta "¿qué hago ahora?" o "¿qué me falta?".
- Una etapa está a medias y hay que desbloquear la siguiente.

## Procedimiento

1. Corre `contexto-rally` primero. Sin saber qué hay, no puedes saber qué falta.
2. Compara el estado con la tabla de etapas de `AGENTS.md` y elige **la primera incompleta**.
3. Para esa etapa, identifica **un solo hueco**. No enumeres diez carencias.
4. Haz **una pregunta a la vez**, concreta y respondible:
   - Bien: "¿En qué municipio de Nicaragua van a probar el prototipo?"
   - Mal: "Cuéntame sobre el equipo, el impacto y el presupuesto."
5. Cuando responda, registra el dato en `brief.json` (tu memoria del proyecto).
6. Si el campo también existe en la ventana, dile al usuario **dónde escribirlo**. No
   prometas que se rellena solo: la interfaz la escribe él.
7. Solo cuando la etapa esté completa, anuncia la siguiente y por qué depende de la anterior.

## Reglas

- **Nunca inventes** para poder avanzar. Si no hay respuesta, la etapa queda abierta.
- No hagas más de una pregunta por mensaje.
- Si el usuario pide saltarse una etapa, dile qué se rompe después (no bloquees, avisa).
- Si detectas una contradicción (dos cifras distintas en guion y presupuesto), señálala
  antes de seguir.

## Punteros

- Etapas y qué debe existir: `AGENTS.md`, sección "El flujo (13 etapas)".
- Modo de cada certamen: `.agents/rules/modos-rally.md`.
- Cómo servir lo que produzcas: skill `servir-a-ventana`.
- Auditar lo ya hecho: skill `auditar-entregable`.
