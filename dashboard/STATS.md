# Resumen de partida

`stats.html` no tiene datos escritos a mano. Todo sale de `scripts/build_stats.py`, que lee:

- `dashboard/data/state.json` — sesión, equipo, entregables, pautado, guion, presupuesto, claims y guardrails.
- `brief.json` — identidad y rumbo del proyecto.
- `research/claims.json`, `budget/budget.json`, `script/*`, `docs/canvas.md`,
  `docs/bibliography.md`, `site/index.html` — material del proyecto y conflictos.
- Fechas de modificación de los archivos — ventana de la sesión.

## Regenerar a mano

```bash
python scripts/build_stats.py
```

Salida:

- `dashboard/data/stats.generated.json` — para revisar o auditar.
- `dashboard/data/stats.generated.js` — lo que carga la página.

El índice de preparación es una fórmula explícita:

```text
35% entregables + 20% pautado + 15% guion + 15% presupuesto + 10% fuentes + 5% guardrails
```

Solo cuenta la sesión viva. El material de otra versión del proyecto que esté en disco no se
mezcla con la sesión: se muestra como conflicto.

## Generación automática

El watcher revisa `state.json` y genera el resumen en dos momentos:

- **T-1h**: última lectura completa antes del cierre.
- **T-0**: resumen final.

```bash
python scripts/watch_stats.py --once
python scripts/watch_stats.py --interval 300
```

Cada disparo:

1. Ejecuta `build_stats.py --phase t-1h` o `--phase final`.
2. Escribe `dashboard/data/stats.status.json`.
3. Deja un aviso en la pestaña `timeline` del workbench. El aviso no tiene botón
   Aceptar, así que no puede sobrescribir el proyecto por accidente.

### Instalar como tarea de Windows

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install_stats_task.ps1
```

Corre cada 5 minutos y se puede quitar con:

```powershell
Unregister-ScheduledTask -TaskName "RallyStudioStatsWatcher" -Confirm:$false
```

## Reglas

- No editar `stats.generated.js` a mano: se sobrescribe.
- Los avatares son ilustrativos; los nombres, roles y frentes salen de la sesión.
- Si `state.json` no tiene equipo o proyecto, la página muestra un estado vacío, no un
  ejemplo inventado.
- Una fase `t-1h` o `final` muestra una banda de fase en la parte superior de la página.
