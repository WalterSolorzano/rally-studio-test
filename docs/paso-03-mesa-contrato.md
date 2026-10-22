# Paso 03 · Mesa de retos — contrato de diseño

Estado: aprobado por el equipo el 19/10/2026.
Alcance: **solo la pestaña 02 `challenges`** del workbench. No toca rúbrica, no toca `localStorage`, no toca el resto del flujo.
Prototipo de referencia (no conectado al motor): `dashboard/proto-mesa-05.html`.

## 1. Qué reemplaza y qué conserva

Se conserva tal cual del paso 03 actual:

- topbar (marcas, `IA Copilot`, `Auditoría`, deadline, timer, `Grafo`);
- stepper (`PASO 03 DE 11 · RETOS DEL COMITÉ`), `Editar equipo`, `Matriz Word (.docx)`;
- banner `RETO SELECCIONADO #NN` con `Cambiar de Reto` y `Continuar a Taller de Solución →`;
- encabezado de fase y subtítulo;
- catálogo lateral de retos (`deliberation-nav`);
- acciones de la hoja: `Editar Reto`, `Reto Seleccionado`, X roja;
- CTA de cierre: `Elegir Reto #NN e Ir a Solución →` y `Reto #NN →`.

Se elimina: los cuatro chips `1 · Leer / 2 · Descartar / 3 · Votar / 4 · Decidir` y su párrafo. Eran cuatro pantallas con la misma interfaz y no aportaban nada al debate.

El pronóstico del motor (`.ranking-panel`, 9 filas) se conserva pero **plegado** en una línea:

```
Ranking de retos · 9 evaluados · el pronóstico del motor, por si quieren comparar antes de votar      ver ▾
```

## 2. Estructura de la hoja

Un reto a la vez, en carrusel. Nada de nueve tarjetas simultáneas.

```
←   RETO #03 / 09   →        [− 8 +] en la mesa · 4 votos para aprobar
regla: sin quórum · mitad a favor entra · mitad a descarte el sistema lo mueve
[01][02][03]…[09]   ← pips de salto, con estado
```

Pips: azul = actual, rojo = descartado, punteado = reserva, aro cobalto = coronado.

Dentro del reto, cuatro bloques con el mismo peso visual:

| Bloque | Contenido | Editable |
|---|---|---|
| Encabezado | `DESAFÍO #NN`, categoría, ODS, viabilidad, `Editar Reto`, X | no |
| Título | nombre oficial completo (3 líneas máx.) | no |
| Métricas | viabilidad, barra, `puesto #N de 9`, razón real del motor | no |
| 01 · Lo que pide el comité | descripción oficial + cita de la demanda, `fuente bloqueada · no editable` | no |
| 02 · Lo que propone la IA | tesis, factibilidad, precedente + desglose de puntos con ± | no (es sugerencia) |
| 03 · Nuestras redacciones | notas del equipo, autor, hora, votos, fusión | sí |
| 04 · La mesa vota | veredicto, dos barras con la raya del 50 %, roster, constancia, acciones | sí |

Si un reto no tiene texto oficial transcrito, el bloque 01 dice `Descripción oficial pendiente de transcribir` y el ODS dice `por transcribir`. **Nunca rellenar con texto inventado.**

## 3. Regla de decisión

- La mesa son **6–10 personas** según el evento. El control `− / +` recalcula la mayoría: `need = ceil(en la mesa / 2)`.
- **Sin quórum.** Vota quien quiera; el conteo es sobre la gente en la mesa, no sobre cuántos votaron.
- Cada persona: `APRUEBA` / `DESCARTA` / `RESERVA` / `SIN DECIDIR`. Tu propia fila cicla tu voto y el marcador cambia en vivo.
- `APROBADO` con `sí ≥ need`. `DESCARTADO` con `no ≥ need` — el sistema lo mueve al embudo en rojo, sin botón de por medio.
- `RESERVA` no decide; se oye 2 minutos.
- **La IA no vota.** Su bloque está etiquetado `propone · no vota`.
- **Renovable.** En un reto descartado aparece `Renovar este reto`: borra los votos de descarte, vuelve a la mesa y deja registro. Nada es definitivo.

## 4. Constancia

Una línea, en voz baja, debajo del roster. Es el registro de quién hizo qué y a qué hora.

```
constancia  lo tiran 5 JC 12:41 MR 12:43 DA 12:45 KM 12:47 NT 12:49 · en reserva 1 LP 12:51 · sin decidir 2 EB RS
```

Y al renovar:

```
renovado por EB · 10:33 — se borraron los votos de descarte de JC, MR, DA, KM, NT
```

Solo el número de `lo tiran` va en rojo. Resto en `--text-muted`, 11–11.5 px.

## 5. Datos

```js
RETOS = [{
  id, title, cat, via, score, rank, ods: [[n, hex, nombre, tintaBlanca]],
  desc, demanda, tesis, fact, precedente,
  pts: [[label, valor]], notas: [{ quien, hora, texto, votos, fusion }]
}]

VOTES = { '01': { yes: [], no: [], reserva: [], at: { JC: '12:41' } } }
RENEWS = { '06': [{ by, at, removed }] }
state  = { i, team, crowned }
```

`tally(reto)` devuelve `{ yes, no, res, wait, need, approved, discarded }`. El estado del pip, del chip del catálogo y del veredicto se derivan **siempre** de `tally()`, nunca se guardan aparte.

## 6. Tokens y estilos

Solo tokens de `dashboard/style.css`. Cero emojis. Cero sombras nuevas. Radios de la escala existente. Numeración y horas en `--font-mono` con `tabular-nums`. Notas escritas a mano en `Caveat` 18 px (permitido por DESIGN.md para ideación). Piso tipográfico 11 px.

Clases nuevas, prefijo `cr-`: `cr-sheet`, `cr-bar`, `cr-nav`, `cr-rule`, `cr-team`, `cr-map`, `cr-pip`, `cr-viewport`, `cr-track`, `cr-slide`, `cr-title`, `cr-metrics`, `cr-meter`, `cr-body`, `cr-panel`, `cr-pending`, `cr-pt`, `cr-note*`, `cr-compose`, `cr-voters`, `cr-verdict`, `cr-bars`, `cr-bar-fill`, `cr-bar-mark`, `cr-voter`, `cr-record`, `cr-renew`, `cr-consequence`, `cr-toast`. La constancia usa `cr-rec-*`.

## 7. Criterios de aceptación

- 9 retos navegables con ← →, teclado y catálogo; el catálogo muestra siempre el reto correcto (id real, no posición).
- Cambiar `− / +` recalcula la mayoría sin recargar.
- `#06` con 5 de 8 a descarte cae al embudo y su pip se pone rojo.
- `#09` con 4 de 8 a favor queda `APROBADO` (50 % exacto).
- Renovar `#06` lo devuelve con `0 de 8` y deja el log.
- Constancia visible en una línea, sin dominar el bloque.
- Cero desborde horizontal a 1600 px; sin errores de consola.
- Contraste mínimo 4.5:1 en todo texto propio.

## 8. Frontera

Este documento describe interfaz y reglas de presentación. La implementación dentro de `dashboard/app.js` (máquina de estados, persistencia, cálculos) es del motor: **no se toca sin permiso explícito**.
