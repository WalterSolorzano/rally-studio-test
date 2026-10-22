---
name: auditar-entregable
description: Revisa un entregable contra la rúbrica del certamen, las bases del evento y el propósito del grupo, y devuelve hallazgos ordenados por gravedad sin reescribir nada. Úsala antes de dar algo por terminado o cuando el usuario pida una revisión.
---

# Auditar un entregable

## Cuándo usarla

- Antes de cerrar una etapa o de exportar.
- El usuario pregunta "¿esto está bien?", "¿qué me falta?", "¿pasa la rúbrica?".
- Hay que decidir entre dos versiones.

## Procedimiento

1. Fija el objeto de la auditoría: qué archivo o sección, y a qué certamen pertenece.
2. Carga los criterios que aplican:
   - `.agents/rules/rubricas-y-puntajes.md` (pesos y qué mira cada criterio)
   - `.agents/rules/modos-rally.md` (exigencias propias de Nacional o Latam)
   - `.agents/rules/pautado-y-guion.md` si es pautado o guion
3. Revisa en este orden, porque es el orden en que un jurado pierde puntos:
   1. **Incumplimiento de bases** (descalifica o resta fuerte): límites de caracteres,
      duración del video, coherencia de cifras, datos inventados.
   2. **Criterios de mayor peso** del certamen activo.
   3. **Criterios secundarios**.
   4. **Forma**: marca, paleta, tipografías, naming de assets.
4. Devuelve **hallazgos**, no reescrituras:
   - `Gravedad` — `crítico` (pierde puntos o descalifica) / `importante` / `menor`
   - `Ubicación` — sección o línea
   - `Qué pasa` — una frase
   - `Qué hacer` — una frase accionable
5. Ordena por gravedad. Máximo 10 hallazgos: si hay más, agrupa los menores.
6. Cierra con **una** recomendación: lo único que cambiarías si solo hubiera tiempo para una
   cosa.

## Reglas

- No inventes criterios. Si la rúbrica no dice algo, no lo presentes como requisito.
- No confundas "no me gusta" con "resta puntos".
- Si un dato no tiene respaldo, es un hallazgo crítico, no un detalle de estilo.
- No edites el entregable en esta skill: auditar y arreglar son pasos distintos, y el arreglo
  va por `servir-a-ventana` como propuesta.

## Punteros

- Pesos y criterios: `.agents/rules/rubricas-y-puntajes.md`
- Reglas de cada certamen: `.agents/rules/modos-rally.md`
- Pautado y guion: `.agents/rules/pautado-y-guion.md`
- Cifras citables: `research/claims.json`
