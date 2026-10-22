# Sincronización por secciones

Rally Studio guarda el estado del proyecto en `localStorage` como caché y lo
sincroniza con el servidor local por secciones independientes. Dos personas ya
no se pisan: cada escritura declara la versión sobre la que se editó.

## Cómo se divide el estado

Cada clave de primer nivel es una sección. `pautado` y `script` se dividen por
subclave:

- `team_name`, `team_roster`, `challenges`, `budget`, `tasks`, `deliverables`
- `pautado.problema`, `pautado.solucion`, `pautado.impacto`,
  `pautado.innovacion`, `pautado.prefactibilidad`
- `script.acto1` … `script.acto4`

`authorship`, `active_locks`, `active_tab` y `_sync_ts` son locales y no viajan.

## API

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/sections?since=N` | Secciones cambiadas desde el evento N |
| POST | `/api/sections/<key>` | Guardar `{data, base_version, actor, actor_id}` |
| POST | `/api/sections/<key>/lock` | Bloquear 10–30 min (`ttl_minutes`) |
| POST | `/api/sections/<key>/unlock` | Liberar el bloqueo propio |
| POST | `/api/sections/import` | Importar un estado completo solo si faltan secciones |
| GET | `/api/events?since=N` | Auditoría: quién cambió qué y cuándo |
| GET | `/api/state` | Estado agregado (compatibilidad y exportación) |

Una escritura con `base_version` vieja responde **409** con `current` y
`yours`. El cliente muestra las dos versiones y el usuario elige. Nunca hay
fusión automática. Una sección bloqueada por otra persona responde **423**.

## Compartir con el equipo (modo local)

Un operador crea el proyecto una sola vez:

```powershell
python scripts/crear_proyecto.py --project mi-grupo --name "Ana"
```

Imprime `project`, `token` de operador y `join_url`. Ese enlace **es de un solo
uso**: se reparte uno por persona (WhatsApp, correo, QR). Quien lo abre llega a
`join.html`, escribe su nombre y recibe su propia sesión; no instala nada ni
toca la terminal.

- El primer arranque con `crear_proyecto.py` siembra el estado local existente.
  Los miembros normales **no siembran**: si el proyecto está vacío, esperan al
  operador.
- Con miembros creados, toda lectura y escritura exige
  `Authorization: Bearer <token>`; sin él la API responde **401**.
- Las invitaciones caducan (48 h por defecto) y se pueden emitir más desde
  `dashboard/admin.html`, donde también se revoca a alguien. La primera vez,
  pega allí el token de operador que imprimió `crear_proyecto.py`; el navegador
  lo guarda como sesión.
- `state.json`, las bases `members.db` y `sections.db` y el buzón no se
  sirven como archivos estáticos: solo se leen por la API autenticada.
- Un miembro revocado recibe **401** en el siguiente sondeo (≤1 s). Sus cambios
  sin subir se quedan en su navegador y se pueden exportar; **nunca se suben**.
- Un proyecto sin miembros (por ejemplo `localhost:8000` recién instalado)
  sigue abierto como antes, con proyecto `main`.

### IA escribe secciones directo

Los generadores ya no pasan por Aceptar/Descartar. Con un token de operador:

```powershell
python scripts/publicar_seccion.py --project mi-grupo --section pautado.problema \
  --text "..." --token <token>
```

Si hay conflicto devuelve **409** (o **423** si está bloqueada), imprime las dos
versiones y sale con código distinto de cero. El operador decide si reintenta
sobre la versión nueva. `servir_propuesta.py` queda para contenido que no es
sección (assets, notas).

El `POST /api/state` anterior se conserva solo como importación de secciones
faltantes: una pestaña vieja no puede sobrescribir lo nuevo.

## Cliente

`dashboard/section_sync.js`:

- escucha los guardados de `app.js` y manda solo las secciones cambiadas;
- conserva `localStorage` cuando no hay red y reintenta al volver;
- muestra un conflicto con las dos versiones;
- muestra quién está editando y cuánto queda del bloqueo;
- guarda versiones y pendientes en `rally_section_sync_meta_v1`.

`content_bridge.js` queda solo para el buzón de propuestas; ya no sube el
estado completo.

## Almacenamiento

`scripts/section_store.py` define la interfaz `SectionStore` y el adaptador
`SQLiteSectionStore` (`dashboard/data/sections.db`, ignorado por Git). Para
migrar a Supabase se implementa la misma interfaz sin tocar la API ni el
cliente.

Al arrancar, el servidor importa una sola vez `dashboard/data/state.json` a las
secciones que falten. El espejo `state.json` se reescribe después de cada
cambio para conservar exportaciones y compatibilidad.

## CORS

No hay comodín. Se acepta el mismo origen, `localhost`, `127.0.0.1` y rangos de
IP privadas. Para permitir orígenes concretos:

```powershell
$env:RALLY_ALLOWED_ORIGINS="http://192.168.1.20:8000,http://10.0.0.5:8000"
python scripts/rally_service.py
```

## Pruebas

```powershell
python -m pytest tests/test_sections_api.py tests/test_service_api.py `
  tests/test_members_api.py tests/test_colaboracion_local.py -q
```

Cubren 409, bloqueo, desbloqueo, eventos, CORS privado, migración de
`state.json`, compatibilidad del endpoint anterior, invitaciones de un solo uso,
401/403 por rol, revocación y el flujo de aceptación entre dos personas.
