---
name: servir-a-ventana
description: Entrega una propuesta a la interfaz para que el usuario la acepte o la descarte. Arma el sobre, elige pestaña y ranura correctas y ejecuta servir_propuesta.py. Úsala siempre que produzcas contenido que deba aparecer en la ventana.
---

# Servir a la ventana

## Cuándo usarla

- Acabas de producir texto, filas de presupuesto, un acto del guion o cualquier contenido
  que el usuario deba ver en la interfaz.
- El usuario dice "pásalo al tablero", "ponlo en presupuesto" o "muéstrame eso".

## Procedimiento

1. Escribe el payload en un archivo JSON temporal. Formatos:
   - `pautado` y `script`: `{"text": "..."}`
   - `budget`: `{"items": [{"element": "...", "category": "...", "units": 1, "unit_cost": 0, "url": "..."}]}`
  (la tabla y los exports leen `element`; el puente también acepta `concept` y escribe ambos).
   - Otras pestañas: el objeto que tenga sentido para esa pestaña.
2. Elige `--tab` (una de las 13) y `--slot`:
   - `pautado` → `problema | solucion | impacto | innovacion | prefactibilidad`
   - `budget` → `costos`
   - `script` → `acto1 | acto2 | acto3 | acto4`
   - el resto → `main`
3. Ejecuta:

```bash
python scripts/servir_propuesta.py --tab pautado --slot problema --kind text \
  --title "Problema, versión revisada" --source "investigación externa" \
  --payload propuesta.json
```

4. Verifica que respondió con la ruta escrita. Si devuelve errores de validación, corrígelos
   y vuelve a intentar; no fuerces un `tab`/`slot` que no exista.
5. Dile al usuario, en una línea, **qué va a ver y dónde**: "Te dejé una propuesta en
   06 Pautado · Problema. Pulsa Aceptar para aplicarla."
6. Si el servidor no está corriendo, avísalo: sin servidor no hay buzón.

## Reglas

- Marca `--simulated` siempre que el contenido no sea real. La ventana lo muestra con
  distintivo y el usuario tiene derecho a saberlo.
- Una propuesta = un slot. No mezcles dos secciones en un mismo sobre.
- No sobrescribas nada por tu cuenta: el buzón existe para que el humano decida.
- Si el payload supera 5 MB, no lo sirvas: resume o divide.

## Punteros

- Validador y esquema: `scripts/content_store.py` (`ALLOWED_TABS`, `SLOTS_BY_TAB`).
- CLI: `scripts/servir_propuesta.py --help`.
- Cómo lo muestra la interfaz: `dashboard/content_bridge.js`.
