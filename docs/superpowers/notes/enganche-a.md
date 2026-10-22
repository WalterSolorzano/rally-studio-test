# Enganche del puente de contenido en (a)

Reconocimiento de `dashboard/app.js` para decidir **cómo** `content_bridge.js` aplica una
propuesta al estado de la ventana. Task 3 depende de esto.

## Clave de `localStorage`

`rally_studio_production_state_2026_v3`

Evidencia:

- `dashboard/app.js:626` — `const saved = localStorage.getItem("rally_studio_production_state_2026_v3");`
- `dashboard/app.js:701` — `localStorage.setItem("rally_studio_production_state_2026_v3", JSON.stringify(state));` (dentro de `saveState()`)
- `dashboard/app.js:712` — `localStorage.removeItem(...)` en `resetProject()`

## Forma del estado

`state` es el objeto que devuelve `getInitialState()` (`dashboard/app.js:331`), fusionado con
lo guardado (`Object.assign(getInitialState(), JSON.parse(saved))`, línea 628).

Campos que le importan al puente:

```js
pautado: { problema: "", solucion: "", prefactibilidad: "", innovacion: "", impacto: "" }  // línea 379
budget:  []                                                                                // línea 388
script:  { acto1: "", acto2: "", acto3: "", acto4: "" }                                    // línea 391
```

- **`pautado`**: cinco claves de texto. El orden de `getInitialState()` es
  `problema, solucion, prefactibilidad, innovacion, impacto`; los topes por sección viven en
  `PAUTADO_LIMITS` (línea 254) = `problema 1250, solucion 1250, impacto 1000, innovacion 1000,
  prefactibilidad 1500` (solo aplican si `rally_type !== "nacional"`; en nacional
  `getPautadoLimit()` devuelve `null`).
- **`script`**: cuatro claves de texto (`acto1`…`acto4`).
- **`budget`**: arreglo de filas con esta forma (líneas 743–747 y 848–850):

```js
{ concept: "…", category: "…", units: 1, unit_cost: 250, url: "…" }
```

  Total de una fila = `units * unit_cost` (línea 583: `acc + (it.units * it.unit_cost)`).
  `url` es opcional.

## Mecanismo: **A** — hay canal de sincronización propio y listener de `storage`

Evidencia:

- `dashboard/app.js:674` — `let syncBroadcastChannel = null;`
- `dashboard/app.js:677` — `syncBroadcastChannel = new BroadcastChannel("rally_studio_auto_sync");`
- `dashboard/app.js:678-683` — `onmessage`: si `event.data.type === "AUTO_SYNC_STATE"` y trae
  `state`, hace `state = Object.assign(getInitialState(), event.data.state); syncUI();`
- `dashboard/app.js:688-696` — `window.addEventListener("storage", …)`: si cambia la clave
  `rally_studio_production_state_2026_v3`, fusiona y llama `syncUI()`.
- `dashboard/app.js:699-708` — `saveState()` escribe `localStorage` y además hace
  `syncBroadcastChannel.postMessage({ type: "AUTO_SYNC_STATE", state })`.

### Consecuencia para el puente

`state` **no** está expuesto en `window` (es un `let` de módulo, línea 428), así que el puente
no puede leerlo ni llamar funciones de `app.js`. Usa el canal:

1. Lee el estado actual de `localStorage` (siempre está fresco: `saveState()` escribe en cada
   cambio). Si no hay nada, usa `{}`.
2. Fusiona la propuesta en el campo que corresponda (`pautado[slot]`, `script[slot]`, o
   `budget`).
3. Escribe el resultado en `localStorage` con la clave de arriba → dispara el evento `storage`
   en **otras** pestañas/ventanas, que se sincronizan solas.
4. Crea su **propia** instancia `new BroadcastChannel("rally_studio_auto_sync")` y hace
   `postMessage({ type: "AUTO_SYNC_STATE", state })` → la instancia de `app.js` la recibe
   aunque esté en la **misma** pestaña (BroadcastChannel no se entrega al emisor, pero sí a
   las demás instancias del mismo nombre en el mismo documento) y llama `syncUI()`.
5. Cierra el canal que creó.

**Fallback** si `BroadcastChannel` no existe: escribir `localStorage` y `location.reload()`.

### Notas

- El puente **no** toca `app.js` ni `index.html` más allá de la única línea `<script>`.
- El puente **nunca** escribe sin acción humana: solo aplica cuando el usuario pulsa
  *Aceptar*.
- `getInitialState()` no incluye `active_tab`, pero `loadSavedState()` lo lee si existe
  (línea 653). El puente **no** debe tocarlo: no cambia de pestaña al aplicar.
- El evento `storage` no se dispara en la pestaña que escribe; por eso el paso 4 es
  obligatorio para que (a) se actualice en vivo en la pestaña del usuario que acepta.
