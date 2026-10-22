---
trigger: model_decision
description: Aplica cuando la tarea pide cambiar comportamiento del sistema, tocar código del motor, o hay duda de si algo es contenido o es lógica.
---

# Frontera: contenido y presentación vs. motor

Regla dura, confirmada por el dueño del proyecto. Si dudas, esta es la autoridad.

## Lo que produces (contenido y presentación)

- Textos: pautado, propuestas de retos, guion, canvas, prompts para otras IAs.
- Presupuesto **como contenido**: filas, conceptos, precios, enlaces de respaldo.
- Análisis de documentos que traiga el usuario (PDF, DOCX, MD): limpiarlos, corregirlos,
  alinearlos a la rúbrica y servirlos como propuesta.
- Presentación: jerarquía de secciones visibles, copys, estados vacíos, iconografía, paleta,
  tipografías, logo, imágenes, recursos.
- Datos de contenido que la ventana solo muestra: `research/`, `knowledge/`, `brand/`,
  `budget/`, `script/`, `dashboard/data/`.
- El sitio (`site/`) y las hojas de estilo de la ventana.

## Lo que NO tocas (el motor)

- `scripts/rally_service.py` y sus endpoints.
- La máquina de estado de `dashboard/app.js` (persistencia, migraciones, sincronización,
  colaboración) y `dashboard/index.html`.
- Cálculos: puntajes de rúbrica, validaciones, límites de caracteres, telemetría.
- `localStorage` y todo lo que dependa de él.
- Reglas de negocio del evento. Puedes **proponer** redacción nueva; no aplicarla sola.

## Qué hacer cuando la tarea cae en el motor

1. Para.
2. Di exactamente qué habría que cambiar y por qué es motor, no contenido.
3. Ofrece la alternativa: una propuesta de contenido que consiga el mismo resultado, o una
   tarea de Obra aparte (con su propio alcance y prueba).
4. No lo hagas sin permiso explícito.

## Cómo sirves sin tocar el motor

Escribes una propuesta en el buzón (`python scripts/servir_propuesta.py ...`). La ventana la
muestra como Aceptar / Descartar y el humano decide. Nunca escribes el estado del usuario
directamente.
