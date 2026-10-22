# Plan: Backend cooperativo en vivo (Fase 2)

> Diseño autorizado para escribirse, NO autorizado para implementarse todavía.
> Toca el motor (`scripts/rally_service.py`, `dashboard/app.js`); cada fase pasa por
> puerta de autorización explícita del dueño antes de codificarse.
> Extiende `PLAN_BACKEND_ISLA.md` (isla de IA, ya implemented).

## Objetivo

 Que cualquier persona sin saber programar entre a una URL y:
 1. Ve **todo** el estado del rally (las 13 pestañas) actualizado casi en vivo.
 2. Edite con confianza: sus cambios y los de otros aparecen en vivo, en la misma
    pizarra, sin recargar (typing, cursors, quién edita qué).
 3. Usa IA gratis (OCR visual, botón Pulir, copiloto auto) sin configurar nada.
 4. El agente local OpenCode **conserva todos sus poderes**: edita y sube todo en
    vivo exactamente como hoy edita archivos, sin aprender nada nuevo.

## Restricción dura que respetamos

 El motor actual es un solo usuario porque vive en archivos locales servidos por
 `rally_service.py:8000`. La cooperación en vivo exige estado remoto compartido.


## Arquitectura decidida

```
┌────────────────────────┐      ┌──────────────────────────┐
│  Frontend (Netlify)   │──────▶  Backend isla (Render)  │
│  dashboard/index.html │  ws  │  rally_service.py:8080  │
│  (design intacto)    │───────▶  deploy/Dockerfile       │
└────────┬───────────────┘      └────┬───────────────────┬───┘
         │ lo que editan los demás │                   │
         ▼                        │                   │
 Supabase (Postgres + Realtime + Auth)      FreeLLMAPI (self-host)
 cada equipo: su workspace                  proveedores gratis agregados
```

 - **Front en Netlify**: `dashboard/` + `site/` tal como hoy, con el design system
   existente (tokens, no card genérico). Solo apunta su `RALLY_BACKEND_URL` a la isla.
 - **Back en Render** (Dockerfile ya escrito) es el MISMO `rally_service.py`, ampliado:
   misma máquina de estados, mismos cálculos de rúbrica, mismos validadores. Se reutiliza
   el código en vez de reescribir otro motor paralelo (menos riesgo, menos bug).
 - **Supabase** reemplaza los archivos JSON como fuente de verdad cuando el rally es
   cooperativo. Cada tabla = cada JSON de hoy (ver modelo de datos).
 - **FreeLLMAPI** detrás de la isla, ya conectado vía `RALLY_AI_URL`/`RALLY_AI_KEY`.
   Sin cuota infinita: mismos límites de `PLAN_BACKEND_ISLA.md` (por IP/ventana + rotación).


## Los tres actores que comparten la misma pizarra

| Actor | Cómo entra | Rol en Supabase |
|---|---|---|
| Humano sin GitHub | Link público a la página del rally, modo espectador / editor con magic link | rol `viewer` o `editor` |
| Humano editor del equipo | Magic link invitado por el dueño | rol `editor` |
| **Agente local OpenCode** | Sigue editando archivos; un **bridge** los sube a la isla | rol `agent` (robot con poderes, auditable) |


### El bridge (clave para que no pierdas los poderes locales)

Nuevo script: `scripts/sincronizar_nube.py`
 (contenido, no motor: solo usa endpoints HTTP públicos de la isla, no hackea nada).

```
# puente: RALLY_BRIDGE = agente_local:opencode
watcher (local, watchfiles):
  modificas X.json en disco  ─▶ POST /api/sync/push  {"path":"budget/budget.json",
                                                    "content_hash_old":"ab12",
                                                    "content_new": {...},
                                                    "actor":"agente_local:opencode"}
 isla: valida con los validadores existentes,
       compara con content_hash_old (CAST de optimistic-locking),
       si coinciden → persiste en Supabase → Realtime broadcast "X.json cambió"
       si NO coinciden → 409 CONFLICTO y devuelve el diff: el agente ve qué cambió remoto
         y decide (repull con `sincronizar_nube.py --pull` o re-aplicar el patch).
pull: GET /api/sync/pull?since=cursor → escribe los archivos locales desactualizados.
```

 Efecto para el agente: tú sigues trabajando **exactamente igual que hoy** (abres
 OpenCode, editas archivos, sirves propuestas por el buzón). Detrás, cada archivo
 que tocas viaja en vivo a la pizarra web y aparece en la pantalla de los humanos
 que están viendo el rally llegar a su impacto.

 - Sin conflicto: flujo normal; el agente es un actor más en la misma cola.
 - Con conflicto: no se pisa silenciosamente — hay diff visible para ambos.
 - **Offline-tolerante**: si la isla está caída, `sincronizar_nube.py` encola los
   pushes con sus `content_hash_old` y reintenta. Nada se pierde localmente; nada
   se perderá en la nube cuando vuelva el servicio.



## Modelo de datos (Supabase, un 1:1 con los archivos de hoy)

| Tabla / slot | Equivalente archivo de hoy | Live en Realtime |
|---|---|---|
| `brief_state` | `brief.json` | sí (broadcast en cada campo aceptado) |
| `dash_slots` (`tab_id`, `slot_id`, `payload jsonb`, `actor`, `version`) | slots del pautado, guion, canvas, presupuesto | sí (typing-broadcast en cada tecla con throttle para no saturar) |
| `buzon_propuestas` | propuestas de `scripts/servir_propuesta.py` | sí (llegan en vivo a quien acepta) |
| `revision_history` | (nuevo) 30 días de undo | bajo demanda |
| `budget_items` | `budget/budget.json` | sí |

 - `auth.users` con magic link (sin password). Roles por tabla vía RLS.
 - El agente local SÍ puede `upsert` (su token vive en `.env.local` del repo del
   equipo, en `.gitignore`: hoy gitignora `scripts/freellmapi.key`, se agrega
   `scripts/.env.local` al `.gitignore` con la misma disciplina).


## Fases, cada una con puerta de autorización

| Fase | Qué se toca | Motor sí/no | Criterio de hecho | Estado |
|---|---|---|---|---|
| 2.0 | Doc de migración: espejo JSON→tablas + seed desde archivos de un brief real existente | no (solo lectura) | un brief local subido produce un estado idéntico en la nube | **Hecho (vía nube.db; Supabase queda para 2.2+)** |
| 2.1 | Endpoints `/api/sync/push` `/api/sync/pull` en la isla + `sincronizar_nube.py` | **sí (motor)** | OpenCode local edita `budget.json` y en <2 s se ve en el front de la isla | **Hecho (smoke E2E verificado, conflicto verificado)** |
| 2.2 | Realtime para el front: typing-presence, diff en vivo por slot | **sí (motor)** | dos editores simultáneos se ven teclarear sin recargar | **Hecho (chips + toasts en vivo; E2E verificado; suite 211)** |
| 2.3 | Buzón cooperativo: propuestas del agente llegan a la web y un humano Acepta/Descarta desde el navegador | **sí (motor)** | el agente propone, humano online acepta, cambia la pizarra | **Hecho (decisión web se ejecuta en el puente local; idempotente; suite 211)** |
| 2.4 | OCR visual y Pulir vía isla con FreeLLMAPI + cuota por usuario | **sí (motor)** | foto de cartón (equipo) → texto a campo de pautado, gratis | **Hecho (cuota por usuario vía X-Rally-Actor; 3 tests nuevos; suite 213)** |
| 2.5 | Seed automático (fork público de este repo sigue funcionando local sin nube) | no | modo local puro no cambia nada (regresión = 0) | **Hecho (suite 213 passed + smoke local sin env: ai/status ok, schema ok, sync solo localhost)** |


## Lo que explícitamente NO hace esta fase

 - No elimina el modo 100 % local de hoy; solo agrega la nube encima.
 - No sube las `.key` ni el `.env` públicos. `freellmapi.key` sigue en gitignore.
 - No cambia las validaciones (`validate_*.py`) ni la rúbrica.
 - No reemplaza la ventana local: los dos siguen funcionando juntos.


## Decisiones del dueño (cerradas)

 1. Instancia compartida: un solo workspace de Supabase mientras los rallies no se
    contaminen. Defensa: columna `rally_id` en TODAS las tablas + RLS que filtra por
    `rally_id`; un rally jamás ve los datos de otro. Si algún día se quiere
    aislamiento fuerte, la migración es copiar las filas de un `rally_id` a un
    proyecto nuevo de Supabase.
 2. revision_history: 30 días. Purga automática con un job diario que borra
    revisiones con `created_at < now() - interval '30 days'`.
 3. El agente local obra con confianza: auto-push directo en vivo de lo que edita,
    sin pasar por el buzón. El buzón queda para las propuestas que el agente
    explícitamente sirve con `servir_propuesta.py`; los demás cambios de archivos
    fluyen al vuelo con su etiqueta de actor.

 ———
 Documento Viviente. Durante la implementación, este plan NO puede saltarse las 13
 reglas de `AGENTS.md` (modo nacional/latam, presupuesto, guion ≤ 120 s, etc.):
 la nube hereda la disciplina, no la relaja.
