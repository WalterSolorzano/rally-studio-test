# Colaboración en vivo — diseño

Fecha: 2026-10-19
Estado: propuesta, pendiente de aprobación

## Intención

La ventana de Rally Studio es el único lugar donde el grupo ve y edita el proyecto
mientras dura el rally. Drive y Canvas dejan de ser el espacio de trabajo: quedan como
enlaces pegados en la UI. Una o dos personas corren la IA y los generadores en su
máquina; el resto entra por un enlace, sin instalar nada, y edita lo mismo que ve.

## Objetivos

- Un cambio guardado se ve en los demás navegadores en 3 segundos o menos.
- Todo lo editable de la UI se puede editar por cualquier miembro: pautado, retos,
  presupuesto, canvas, guion, recursos, entregables.
- Entrada por enlace único por persona; al entrar pide nombre; el admin ve quién está
  dentro y puede sacarlo.
- Local primero: si la red permite alcanzar la máquina del operador, se usa esa.
  Si no (wifi de la universidad con aislamiento de clientes), la misma UI y la misma
  API funcionan contra la nube.
- La IA deposita su trabajo directamente en la UI como contenido editable. No hay
  paso de "aceptar / descartar".
- Sin red, cada navegador conserva su copia y su cola, y sube al reconectar.

## No objetivos

- Edición colaborativa carácter por carácter (OT/CRDT). El grano es la sección.
- Replicar el editor de Drive o el lienzo de Canvas dentro de la ventana.
- Que los espectadores instalen Python, corran modelos o generen assets.
- Tocar rúbricas, validadores, cálculos de puntaje o generadores de contenido.

## Estado actual que se conserva

Ya existe y no se rehace:

- `scripts/section_store.py`: secciones versionadas, `base_version`, conflicto 409,
  bloqueo 10–30 min, bitácora de eventos, adaptador SQLite tras una interfaz.
- `dashboard/section_sync.js`: caché en `localStorage`, cola de pendientes, sondeo
  cada 3 s, diálogo de conflicto con las dos versiones, presencia y bloqueos.
- `scripts/rally_service.py`: API HTTP local (`/api/sections`, `/api/events`,
  `/api/state`, `/api/content/*`).
- `scripts/content_store.py` y el buzón: hoy entrega propuestas con Aceptar/Descartar.

La interfaz `SectionStore` ya fue escrita para cambiar de SQLite a un backend remoto
sin tocar la API ni el cliente.

## Arquitectura

### Transporte

Misma API HTTP/JSON, dos destinos intercambiables:

| Modo | Autoridad | Cuándo |
|---|---|---|
| Local | `rally_service.py` en la máquina del operador | Todos los miembros alcanzan esa IP |
| Nube | Backend gestionado con Postgres | La red impide el acceso directo entre laptops |

Regla dura: **un modo por sesión, para todos**. Mezclar modos produce dos verdades y
se prohíbe.

El modo se decide **antes de abrir la ventana**, al crear el proyecto, no en cada
navegador. Motivo técnico: una página servida por HTTPS no puede llamar a
`http://192.168.x.x:8000` (contenido mixto y Private Network Access). Por eso el
enlace de invitación lleva el modo y el destino; no hay sondeo desde la página.

Cambiar de modo a mitad de sesión es una acción explícita del admin: se sube el estado
local completo, se congelan las escrituras, se cambia el destino y se reemiten las
invitaciones. Las versiones y `seq` de cada modo son independientes y no se reutilizan.

### Nube

- Postgres con las mismas columnas que `sections` (proyecto, clave, datos, versión,
  autor, bloqueo, `seq`).
- **La transacción vive en funciones SQL**, no en un servidor Python desplegado: una
  función hace en un solo `BEGIN` el chequeo de `base_version`, el 409 con `current` y
  `yours`, el 423 por bloqueo, el incremento de `seq` y el evento. El navegador llama
  esas funciones y escucha los cambios; no reimplementa reglas.
- **Un solo backend compartido, multi-proyecto**: `project_id` en cada fila y en cada
  política. La clave pública no basta para leer: sin fila de miembro válida, RLS
  devuelve vacío. Cada grupo es un `project_id`, no una instancia.
- Realtime por suscripción a cambios; el sondeo de 3 s queda como respaldo.
- UI estática en un hosting normal. El HTML puede ser público; los datos no.
- Proveedor por defecto: Supabase gratuito (Postgres + RLS + Realtime + sesión
  anónima). Alternativa: Cloudflare. Antes de construir se confirman límites y
  pausado por inactividad del plan gratuito.
- Pruebas de contrato: las mismas operaciones (escribir, conflicto, bloquear, listar
  eventos) se corren contra SQLite y contra las funciones SQL, para que los dos
  caminos no se separen.

### Identidad y acceso

- El creador del proyecto es admin. Los operadores también pueden serlo.
- El admin genera un enlace por persona. El enlace se canjea una sola vez, lleva el
  `project_id` y el modo, pide nombre, crea la ficha del miembro y guarda un token de
  dispositivo en el navegador.
- Cada modo emite y valida sus propios tokens: en local los guarda el servidor local;
  en nube los valida RLS. No se sincronizan entre modos en v1; cambiar de modo implica
  reemitir invitaciones.
- El espejo de estado solo se importa automáticamente en el primer arranque del
  creador. Un miembro que llega con `localStorage` de otro proyecto no puede sembrar
  ni pisar el proyecto al que fue invitado.
- El modo local sin invitación sigue funcionando como hoy: proyecto `main`, un solo
  usuario, sin nube. No se rompe el flujo de instalación de una persona.
- El admin ve nombre, último acceso y dispositivo; revocar corta el acceso en el
  siguiente sondeo. El contenido ya guardado se conserva. La cola pendiente de un
  revocado se queda en su navegador, se le avisa y se le ofrece exportarla; nunca se
  sube sola.
- Sin correo ni PIN en la primera versión. El enlace es una capacidad: quien lo tiene
  entra. Se mitiga con un solo uso, revocación y bitácora.
- En modo local, el servidor valida los mismos tokens; no hay dos sistemas de permisos
  dentro del mismo modo.

## Recursos y archivos binarios

El logo del equipo viaja como data URL y sincroniza sin problema. Las subidas binarias
(`/api/asset-upload`) escriben en disco del operador y no existen en un hosting
estático. Decisión v1: en modo nube la UI acepta **enlaces** y el logo; las subidas de
archivos quedan en modo local y el botón se oculta con una explicación. Un bucket con
URLs firmadas queda como ampliación, no como requisito del primer despliegue.

## Flujo de la IA hacia la UI

1. El operador corre el generador (pautado, presupuesto, guion, canvas, recursos).
2. Un script autenticado con token de operador (`scripts/publicar_seccion.py`, nuevo)
   lee la versión actual y escribe la sección con autor `IA:<script>`. No usa el
   navegador ni la identidad de una persona.
3. La UI lo muestra ya puesto y editable. No hay tarjeta de aprobación.
4. Si un humano editó esa sección después de la base que leyó la IA, la escritura
   choca con 409: el script imprime ambas versiones, sale con código distinto de cero
   y el operador decide reintentar sobre la versión nueva o descartar. La IA nunca pisa
   trabajo humano en silencio. Un bloqueo activo responde 423 con el mismo criterio.
5. `scripts/servir_propuesta.py` y la skill `servir-a-ventana` siguen existiendo para
   contenido que no es sección (imágenes, enlaces, notas), pero dejan de ser la vía
   obligatoria para pautado, presupuesto o guion.

El buzón con Aceptar/Descartar se retira del flujo principal. `content_store.py`
puede quedarse para contenido que no es sección (imágenes, enlaces, notas), pero no
como puerta obligatoria.

## Cambios por archivo

| Archivo | Cambio | Riesgo |
|---|---|---|
| `scripts/section_store.py` | Adaptador remoto o espejo; no cambia la interfaz | Bajo |
| `scripts/rally_service.py` | Rutas de invitación/sesión; proxy opcional a nube | Medio |
| `dashboard/section_sync.js` | Destino local/nube, token, reconexión | Medio |
| `dashboard/content_bridge.js` | Dejar de exigir aceptación; inyectar directo | Medio |
| `dashboard/app.js` | Solo puntos de montaje de sesión y aviso de modo | Alto por tamaño; cambios mínimos |
| `dashboard/index.html` | Pantalla de entrada por enlace y nombre | Bajo |
| `scripts/content_store.py` | Semántica de propuesta → sección | Bajo |
| `scripts/publicar_seccion.py` | Nuevo: escritura autenticada de la IA, 409/423 legibles | Bajo |
| `supabase/` (nuevo) | Esquema, funciones SQL, políticas RLS | Medio |
| `AGENTS.md`, `skills/servir-a-ventana/` | Dejar de exigir aprobación para secciones | Bajo |
| `tests/*` | Pruebas de invitación, revocación, modos y cola | Bajo |

No se tocan: `gen_*.py`, `validate_*.py`, cálculos de rúbrica, `brand/`, `research/`.

## Línea base verificada

`python -m pytest -q` hoy: **83 pasan, 1 falla**.

La falla es previa y no tiene relación con este diseño:
`tests/test_content_bridge_js.py::test_state_is_posted_to_server` espera un
`POST /api/state` que `content_bridge.js` ya no hace porque el estado completo pasó a
`section_sync.js` (ver `docs/SINCRONIZACION_SECCIONES.md`). Hay que corregir o retirar
esa prueba antes de empezar, para no confundirla con una regresión.

## Despliegue

1. Reparar la prueba obsoleta y dejar la suite en verde.
2. Modo local con invitaciones y sesión; probar con dos navegadores en la misma red.
3. Adaptador de nube y UI publicada; probar con un miembro fuera de la red local.
4. Cambiar el flujo de IA a escritura directa de sección.
5. Prueba de carga: 10 navegadores, edición simultánea de secciones distintas y de la
   misma sección, corte y retorno de red.

## Criterios de aceptación

- Dos personas editan `pautado.problema`: la segunda recibe conflicto con ambas
  versiones; ninguna se pierde.
- Diez navegadores ven el cambio en ≤3 s, en local (sondeo de 1 s) y en nube
  (Realtime, con 3 s de respaldo).
- Un enlace ya canjeado no abre una segunda sesión nueva.
- Un miembro revocado queda fuera en ≤1 sondeo; su cola no se sube.
- Un enlace inventado no lee ni escribe nada.
- Un miembro no puede sembrar el proyecto con el `localStorage` de otro.
- Con la nube caída, un operador sigue editando y sube al volver.
- En modo nube las subidas binarias no aparecen; los enlaces y el logo sí funcionan.
- La suite completa queda en verde.

## Decisiones tomadas por el agente

- Un solo modo por sesión; nunca local y nube a la vez. El modo viene en el enlace.
- "En vivo" = 3 s, sin prometer tiempo real de milisegundos. Local con sondeo de 1 s.
- Sin paso de aprobación para la IA; sí versiones, bloqueos y autoría.
- Enlaces de un solo uso, sin PIN en v1.
- Admin: creador + operadores.
- Proveedor por defecto Supabase gratuito, confirmando límites antes de construir.
- Un backend compartido multi-proyecto, no una instancia por grupo.
- La transacción de escritura vive en funciones SQL; no se despliega Python.
- En nube, archivos binarios fuera de v1; enlaces y logo dentro.
- La cola de un revocado no se sube nunca; se exporta.

## Pendiente de decisión humana

- Nada bloqueante. Si el grupo ya tiene una cuenta de nube concreta, se usa esa.
