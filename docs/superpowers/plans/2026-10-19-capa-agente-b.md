# Capa de Agente (b) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar el repo preparado para que cualquier IA de programación (OpenCode o Antigravity) que abra la carpeta se vuelva el "profe" que guía al usuario por las 13 etapas y sirve contenido en vivo a la ventana, sin tocar el motor.

**Architecture:** Dos mitades. (1) **Capa de agente**: `AGENTS.md` corto + reglas por carpeta + skills en una sola fuente reflejada a las dos herramientas + índice de contexto. (2) **Obra**: un almacén de contenido (`scripts/content_store.py`) y cinco endpoints en el servidor Python existente, más un archivo nuevo `dashboard/content_bridge.js` que sondea y muestra propuestas Aceptar/Descartar. El usuario decide; nunca se sobrescribe solo.

**Tech Stack:** Python 3.10+ (biblioteca estándar, `http.server`), JavaScript sin frameworks, PowerShell para el instalador, pytest para pruebas.

**Spec:** `docs/superpowers/specs/2026-10-18-capa-agente-b-design.md`

## Global Constraints

- Python 3.10+; el servidor usa **solo biblioteca estándar** (más lo ya listado en `requirements.txt`).
- (a) no gana dependencias de runtime: nada de frameworks, bundlers ni build.
- Todo en español; **cero emojis** en código, UI y documentos.
- `AGENTS.md` debe quedar **≤ 24.000 bytes** (tope de Antigravity).
- Cada archivo en `.agents/rules/` **debe** empezar con frontmatter YAML que incluya `trigger:` válido, o Antigravity lo descarta en silencio.
- Cada skill vive en `skills/<nombre>/SKILL.md` con frontmatter `name` + `description`.
- Cero API keys, cero cuentas, cero servicios de pago.
- (b) **no** edita: `scripts/rally_service.py`, `dashboard/app.js`, `dashboard/index.html` (salvo la única línea del `<script>`), ni la persistencia en `localStorage`.
- El buzón (`dashboard/data/content/`, `dashboard/data/state.json`) va en `.gitignore` y **excluido** de `pages.yml`.
- Sondeo del puente: **~2 s**.

## Review Focus

1. **Sobre JSON corrupto o enorme** en `dashboard/data/content/`: el servidor debe seguir respondiendo y omitir esa propuesta. Un archivo mal formado no puede tumbar `/api/content/manifest`.
2. **Dos navegadores aceptando la misma propuesta a la vez**: el segundo `apply` debe ser inofensivo (idempotente), no una excepción ni un archivo duplicado.
3. **Servidor caído o modo GitHub Pages**: el puente no debe romper la ventana, ni inundar la consola, ni bloquear la interfaz.
4. **`brief.json` ausente o en blanco**: `gen_indice.py` y la capa de agente siguen funcionando (o preguntan), sin reventar.
5. **Acentos, ñ y payloads grandes (~100 KB)**: ida y vuelta intacta en UTF-8, sin truncar.

---

### Task 0: Rama de trabajo y reconocimiento del enganche en (a)

**Files:**
- Create: `docs/superpowers/notes/enganche-a.md`

**Interfaces:**
- Produces: la decisión documentada de **cómo** `content_bridge.js` aplica una propuesta al estado de la ventana. Tasks 3 depende de esto.

- [ ] **Step 1: Crear la rama**

```bash
git checkout -b feat/capa-agente-b
```

- [ ] **Step 2: Localizar la clave y la forma del estado**

Ejecutar y anotar resultados con números de línea (si no hay `rg` instalado, usar el equivalente `Select-String -Path dashboard/app.js -Pattern "..."`):

```bash
rg -n "rally_studio_production_state_2026_v3" dashboard/app.js
rg -n "addEventListener\(\"storage\"|addEventListener\('storage'" dashboard/app.js
rg -n "^window\.|window\.[a-zA-Z_]+\s*=" dashboard/app.js
rg -n "const state\s*=|let state\s*=" dashboard/app.js
```

- [ ] **Step 3: Decidir el mecanismo**

Escribir `docs/superpowers/notes/enganche-a.md` con: la clave exacta de `localStorage`, la forma del objeto de estado (qué contiene `pautado`, `budget`, etc.), y **una** de estas tres conclusiones, con la evidencia (nº de línea):

- **A.** `app.js` escucha `storage` o un evento propio → el puente solo escribe `localStorage` y dispara el evento.
- **B.** No escucha nada, pero el estado se relee al cargar → el puente escribe `localStorage` y llama `location.reload()`.
- **C.** Existe una función global en `window` que aplica cambios → el puente la llama.

Si no hay evidencia de A ni C, la decisión es **B**. Anotar también los nombres exactos de las claves dentro de `pautado` y la forma de una fila de `budget`.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/notes/enganche-a.md
git commit -m "docs: documentar punto de enganche del puente de contenido"
```

---

### Task 1: `scripts/content_store.py` — almacén de propuestas y espejo de estado

**Files:**
- Create: `scripts/content_store.py`
- Create: `tests/test_content_store.py`
- Create: `requirements-dev.txt`

**Interfaces:**
- Produces:
  - `class ContentStore(root: Path)` con propiedades `content_dir -> Path` (`root/content`), `state_path -> Path` (`root/state.json`), `applied_dir`, `discarded_dir`.
  - `ContentStore.schema() -> dict` → `{"tabs": list[str], "slots": dict[str, list[str]]}`
  - `ContentStore.manifest() -> dict` → `{"version": int, "items": list[dict]}`; cada item: `id, tab, slot, kind, title, source, created_at, confidence, simulated`.
  - `ContentStore.read(item_id: str) -> dict` (levanta `KeyError` si no existe o si el id no es válido)
  - `ContentStore.apply(item_id: str) -> None` (idempotente)
  - `ContentStore.discard(item_id: str) -> None` (idempotente)
  - `ContentStore.read_state() -> dict | None`
  - `ContentStore.write_state(state: dict) -> None`
  - `validate_envelope(env: dict) -> list[str]` → lista vacía si es válido.
- Consumes: nada.

- [ ] **Step 1: Añadir pytest como dependencia de desarrollo**

Crear `requirements-dev.txt`:

```
-r requirements.txt
pytest>=8.0
```

- [ ] **Step 2: Escribir las pruebas que fallan**

`tests/test_content_store.py`:

```python
import json
from pathlib import Path
import pytest
from scripts.content_store import ContentStore, validate_envelope


def envelope(item_id="p1", tab="pautado", slot="problema", text="Hola"):
    return {
        "id": item_id, "tab": tab, "slot": slot, "kind": "text",
        "title": "Propuesta", "source": "test", "created_at": "2026-10-19T10:00:00-06:00",
        "confidence": "media", "simulated": False, "payload": {"text": text},
    }


def seed(tmp_path, env):
    d = tmp_path / "content"
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{env['id']}.json").write_text(json.dumps(env, ensure_ascii=False), encoding="utf-8")


def test_manifest_lists_valid_items(tmp_path):
    seed(tmp_path, envelope())
    m = ContentStore(tmp_path).manifest()
    assert [i["id"] for i in m["items"]] == ["p1"]
    assert isinstance(m["version"], int)


def test_manifest_skips_corrupt_and_incomplete(tmp_path):
    d = tmp_path / "content"
    d.mkdir(parents=True)
    (d / "roto.json").write_text("{no es json", encoding="utf-8")
    (d / "incompleto.json").write_text(json.dumps({"id": "incompleto"}), encoding="utf-8")
    m = ContentStore(tmp_path).manifest()
    assert m["items"] == []


def test_manifest_skips_oversized_file(tmp_path):
    d = tmp_path / "content"
    d.mkdir(parents=True)
    (d / "grande.json").write_bytes(b"{" + b" " * (5 * 1024 * 1024 + 1) + b"}")
    assert ContentStore(tmp_path).manifest()["items"] == []


def test_read_rejects_path_traversal(tmp_path):
    seed(tmp_path, envelope())
    with pytest.raises(KeyError):
        ContentStore(tmp_path).read("../../etc/passwd")
    with pytest.raises(KeyError):
        ContentStore(tmp_path).read("no-existe")


def test_apply_moves_item_and_is_idempotent(tmp_path):
    store = ContentStore(tmp_path)
    seed(tmp_path, envelope())
    store.apply("p1")
    store.apply("p1")
    assert store.manifest()["items"] == []
    assert (store.applied_dir / "p1.json").exists()


def test_discard_moves_item(tmp_path):
    store = ContentStore(tmp_path)
    seed(tmp_path, envelope())
    store.discard("p1")
    assert store.manifest()["items"] == []
    assert (store.discarded_dir / "p1.json").exists()


def test_state_roundtrip(tmp_path):
    store = ContentStore(tmp_path)
    assert store.read_state() is None
    store.write_state({"team_name": "Ñandú Innovación", "nota": "acentos áéíóú"})
    assert store.read_state()["team_name"] == "Ñandú Innovación"


def test_validate_envelope_requires_tab_and_valid_slot():
    assert validate_envelope(envelope()) == []
    assert validate_envelope(envelope(tab="inexistente")) != []
    assert validate_envelope(envelope(slot="no-existe")) != []
    bad = envelope()
    del bad["payload"]
    assert validate_envelope(bad) != []


def test_schema_lists_pautado_sections():
    schema = ContentStore(Path(".")).schema()
    assert "pautado" in schema["tabs"]
    assert set(schema["slots"]["pautado"]) == {
        "problema", "solucion", "impacto", "innovacion", "prefactibilidad"
    }


def test_large_utf8_payload_roundtrip(tmp_path):
    env = envelope(text="ñandú áéíóú " * 8000)   # ~100 KB
    seed(tmp_path, env)
    leido = ContentStore(tmp_path).read("p1")
    assert leido["payload"]["text"] == env["payload"]["text"]
    assert "ñandú" in leido["payload"]["text"]
```

- [ ] **Step 3: Ejecutar y ver que falla**

Run: `python -m pytest tests/test_content_store.py -q`
Expected: FAIL con `ModuleNotFoundError: No module named 'scripts.content_store'`

- [ ] **Step 4: Implementar `scripts/content_store.py`**

Reglas de la implementación:

- `ALLOWED_TABS` = las 13 de `NAV_TABS`: `certamen, team, challenges, solution, impact, multi_ai, pautado, budget, resources, canvas, script, webdemo, timeline`.
- `SLOTS_BY_TAB`: `pautado` → las 5 secciones; `budget` → `["costos"]`; `script` → `["acto1","acto2","acto3","acto4"]`; todas las demás → `["main"]`.
- `ITEM_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,80}$")`. `read`/`apply`/`discard` que no casen → `KeyError`.
- `MAX_BYTES = 5 * 1024 * 1024`; archivos mayores se omiten del manifiesto.
- `manifest()` **deriva** del sistema de archivos (no hay `manifest.json` que mantener a mano). `version` = `max(st_mtime_ns)` de los archivos válidos, o `0` si no hay.
- `apply`/`discard` usan `Path.replace` y no fallan si el origen ya no está (idempotencia).
- `write_state` escribe a un temporal y luego `replace` (escritura atómica).
- `validate_envelope` exige: `id` que case `ITEM_ID_RE`, `tab` en `ALLOWED_TABS`, `slot` en `SLOTS_BY_TAB[tab]`, `kind` no vacío, `payload` presente y `simulated` booleano.

- [ ] **Step 5: Ejecutar y ver que pasa**

Run: `python -m pytest tests/test_content_store.py -q`
Expected: PASS (10 pruebas)

- [ ] **Step 6: Commit**

```bash
git add requirements-dev.txt tests/test_content_store.py scripts/content_store.py
git commit -m "feat: almacen de propuestas de contenido y espejo de estado"
```

---

### Task 2: Endpoints `/api/state` y `/api/content/*` + CLI para (b)

**Files:**
- Modify: `scripts/rally_service.py` (añadir rutas; reutilizar el helper JSON que ya usan las rutas existentes)
- Create: `scripts/servir_propuesta.py`
- Create: `tests/test_service_api.py`

**Interfaces:**
- Consumes: `ContentStore`, `validate_envelope` (Task 1).
- Produces (HTTP):
  - `GET /api/state` → `{"state": object|null}`
  - `POST /api/state` body `{"state": object}` → `{"ok": true}`
  - `GET /api/content/schema` → `{"tabs": [...], "slots": {...}}`
  - `GET /api/content/manifest` → `{"version": int, "items": [...]}`
  - `GET /api/content/<id>` → sobre completo
  - `POST /api/content/<id>/apply` → `{"ok": true}`
  - `POST /api/content/<id>/discard` → `{"ok": true}`
  - CLI `python scripts/servir_propuesta.py --tab T --slot S --kind K --title "..." --payload archivo.json [--simulated]`

- [ ] **Step 1: Escribir la prueba de integración que falla**

`tests/test_service_api.py` — arranca el servidor en un puerto libre con `RALLY_SERVICE_PORT`, espera `/health`, y prueba:

```python
def test_content_roundtrip(servidor):        # fixture que devuelve base_url y content_dir
    # 1. POST /api/state  {"state": {"team_name": "Ñandú"}}
    # 2. GET  /api/state  -> team_name == "Ñandú"
    # 3. GET  /api/content/manifest -> items == []
    # 4. escribir dashboard/data/content/p1.json válido
    # 5. GET manifest -> 1 item
    # 6. GET /api/content/p1 -> payload intacto
    # 7. POST /api/content/p1/apply -> {"ok": true}
    # 8. GET manifest -> items == []
    # 9. POST /api/content/p1/apply otra vez -> {"ok": true}  (idempotente)

def test_content_manifest_survives_corrupt_file(servidor):
    # escribir content/roto.json con basura -> GET manifest responde 200 con items == []

def test_content_rejects_bad_id(servidor):
    # GET /api/content/..%2f..%2fetc%2fpasswd -> 404, nunca 500
```

La fixture debe usar `tmp_path` para el directorio de datos, apuntando el servidor ahí por variable de entorno `RALLY_DATA_DIR` (añadirla en `rally_service.py`; por defecto `dashboard/data`).

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `python -m pytest tests/test_service_api.py -q`
Expected: FAIL (404 / conexión a rutas inexistentes)

- [ ] **Step 3: Implementar las rutas**

En `rally_service.py`, instanciar `ContentStore(Path(os.environ.get("RALLY_DATA_DIR", "dashboard/data")))` y enrutar en `do_GET`/`do_POST`. Reglas:

- Los ids se validan con el `ContentStore`; id inválido → **404**, nunca 500.
- Error de JSON en el cuerpo → **400** con `{"ok": false, "error": "json-invalido"}`.
- Cualquier excepción inesperada dentro de una ruta de contenido → **500** con mensaje corto, sin traza al cliente, y traza al log.
- No tocar el resto de rutas ni el arranque del servidor salvo añadir `RALLY_DATA_DIR`.

- [ ] **Step 4: Implementar `scripts/servir_propuesta.py`**

Lee `--payload` (archivo JSON), arma el sobre con `uuid4().hex[:8]` como sufijo del id (`f"{tab}-{slot}-{sufijo}"`), valida con `validate_envelope`, y escribe en `dashboard/data/content/<id>.json` con `ensure_ascii=False`. Si `validate_envelope` devuelve errores, imprime cada uno y sale con código 1. Imprime la ruta escrita.

- [ ] **Step 5: Ejecutar y ver que pasa**

Run: `python -m pytest tests/ -q`
Expected: PASS (todas)

- [ ] **Step 6: Prueba manual del CLI**

```bash
echo '{"text":"Propuesta de prueba"}' > /tmp/p.json
python scripts/servir_propuesta.py --tab pautado --slot problema --kind text --title "Prueba" --payload /tmp/p.json
python scripts/rally_service.py
curl http://localhost:8000/api/content/manifest
```

Expected: el manifiesto lista la propuesta.

- [ ] **Step 7: Commit**

```bash
git add scripts/rally_service.py scripts/servir_propuesta.py tests/test_service_api.py
git commit -m "feat: endpoints de estado y buzón de contenido en el servidor local"
```

---

### Task 3: `dashboard/content_bridge.js` — propuestas en vivo en la ventana

**Files:**
- Create: `dashboard/content_bridge.js`
- Modify: `dashboard/index.html` (una sola línea: `<script src="content_bridge.js" defer></script>`)
- Create: `tests/test_bridge_e2e.py`

**Interfaces:**
- Consumes: los endpoints de Task 2; la decisión de Task 0 (`docs/superpowers/notes/enganche-a.md`).
- Produces: `window.RallyContentBridge = { poll(): Promise<void>, apply(id): Promise<void>, discard(id): Promise<void> }` para depuración manual.

- [ ] **Step 1: Escribir la prueba E2E que falla**

`tests/test_bridge_e2e.py` con Playwright (se salta si no hay navegador instalado):

```python
pytest.importorskip("playwright")
# fixture: servidor en puerto libre + content/p1.json con tab="pautado", slot="problema"
def test_proposal_appears_and_accepts(page, servidor):
    page.goto(f"{servidor}/dashboard/")
    page.wait_for_selector("#rally-content-dock [data-proposal-id='p1']", timeout=10000)
    page.click("#rally-content-dock [data-proposal-id='p1'] button[data-action='apply']")
    page.wait_for_selector("#rally-content-dock [data-proposal-id='p1']", state="detached", timeout=10000)


def test_unsupported_browser_mode_is_silent(page, servidor_sin_api):
    # servir solo estáticos: la consola no debe tener errores no capturados
    page.goto(f"{servidor_sin_api}/dashboard/")
    page.wait_for_timeout(3000)
    assert page.locator("#rally-content-dock [data-proposal-id]").count() == 0
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `python -m pytest tests/test_bridge_e2e.py -q`
Expected: FAIL (`#rally-content-dock` no existe)

- [ ] **Step 3: Implementar `content_bridge.js`**

Reglas de la implementación:

- `POLL_MS = 2000`. Arranca solo si `location.protocol` es `http:` o `https:`; en `file:` no hace nada.
- Contenedor fijo `#rally-content-dock` (abajo a la derecha, `position: fixed`, `z-index` alto, ancho máx. 360 px, tipografía del sistema). Estilos **inyectados por el propio archivo** para no tocar `style.css`.
- Cada propuesta se dibuja como tarjeta con: `title`, `source`, distintivo si `simulated`, y dos botones `data-action="apply|discard"`. El `id` va en `data-proposal-id`.
- **Aceptar**: `POST /api/content/<id>/apply`, luego aplica el payload al estado según Task 0, luego quita la tarjeta. Si el mecanismo es B, escribe `localStorage` y `location.reload()` **después** de confirmar el POST.
- **Descartar**: `POST /api/content/<id>/discard`, quita la tarjeta. No toca el estado.
- Ids ya vistos se guardan en `sessionStorage` (`rally_content_seen`) para no re-dibujar tras recargar.
- Fallo de red: se silencia (sin `throw`, sin `console.error`). Se reintenta en el siguiente ciclo.
- Si `manifest.items` viene vacío, no se dibuja nada y el contenedor se vacía.

- [ ] **Step 4: Añadir la línea a `index.html`**

Insertar `<script src="content_bridge.js" defer></script>` justo después del `<script>` existente de `app.js`. **Ningún otro cambio en ese archivo.**

- [ ] **Step 5: Ejecutar y ver que pasa**

Run: `python -m pytest tests/test_bridge_e2e.py -q`
Expected: PASS. Si no hay navegador: `SKIPPED` — en ese caso verificar a mano abriendo `http://localhost:8000/dashboard/` con una propuesta en el buzón.

- [ ] **Step 6: Commit**

```bash
git add dashboard/content_bridge.js dashboard/index.html tests/test_bridge_e2e.py
git commit -m "feat: puente de propuestas en vivo en la ventana"
```

---

### Task 4: El buzón no se publica

**Files:**
- Modify: `.gitignore`
- Modify: `.github/workflows/pages.yml`
- Create: `tests/test_packaging.py`

**Interfaces:**
- Consumes: las rutas de Task 1/2 (`dashboard/data/content/`, `dashboard/data/state.json`).
- Produces: garantía verificable de que el buzón no viaja en la descarga ni en Pages.

- [ ] **Step 1: Escribir la prueba que falla**

`tests/test_packaging.py`:

```python
def test_gitignore_covers_mailbox():
    texto = Path(".gitignore").read_text(encoding="utf-8")
    assert "dashboard/data/content/" in texto
    assert "dashboard/data/state.json" in texto

def test_pages_workflow_excludes_mailbox():
    texto = Path(".github/workflows/pages.yml").read_text(encoding="utf-8")
    assert "data/content" in texto
    assert "data/state.json" in texto
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `python -m pytest tests/test_packaging.py -q`
Expected: FAIL

- [ ] **Step 3: Implementar**

- `.gitignore`: añadir `dashboard/data/content/` y `dashboard/data/state.json`.
- `pages.yml`: en el paso que copia `dashboard/` a `public/dashboard/`, excluir esas dos rutas (con `rsync --exclude` o `robocopy /XF /XD`, o copiando y borrando después). No cambiar nada más del workflow.

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `python -m pytest tests/test_packaging.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .gitignore .github/workflows/pages.yml tests/test_packaging.py
git commit -m "chore: excluir el buzon de contenido del repo y de Pages"
```

---

### Task 5: `knowledge/INDICE.md` generado

**Files:**
- Create: `scripts/gen_indice.py`
- Create: `knowledge/INDICE.md` (generado)
- Create: `tests/test_gen_indice.py`

**Interfaces:**
- Produces: `knowledge/INDICE.md` con una entrada por fuente y, por entrada, **cuándo sí** y **cuándo no** leerla. Lo consume la skill `contexto-rally` (Task 6).

- [ ] **Step 1: Escribir la prueba que falla**

`tests/test_gen_indice.py`:

```python
def test_indice_lists_every_corpus_file(tmp_path):
    # crear un árbol falso con 2 .md y 1 .pdf en research/ y knowledge/
    # generar y comprobar que ambos aparecen con ruta relativa

def test_indice_survives_missing_brief(tmp_path):
    # sin brief.json: no lanza excepción y el documento se genera igual

def test_indice_is_under_token_budget(tmp_path):
    # el archivo generado pesa < 40 KB
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `python -m pytest tests/test_gen_indice.py -q`
Expected: FAIL

- [ ] **Step 3: Implementar `scripts/gen_indice.py`**

Recorre `research/`, `knowledge/`, `docs/`, `brand/`, `graphify-out/` y una lista explícita de raíz (`brief.json`, `Análisis del Rally de Innovación.txt`, `Rally_Innovacion_Nicaragua_Analisis.pdf`, `Proyectos Ganadores de Rally Latam.md`, `chatgptdeep-research-report.md`, `Operación Titan_UNI_Documento pautado_2025.docx`, `Reporte_Pautado_Rally_2026.docx`, `rubrica_oficial_latam.jpeg`, `PRODUCT.md`, `DESIGN.md`). Genera una tabla: `Ruta | Qué es | Cuándo sí | Cuándo no`.

`Qué es`/`Cuándo sí`/`Cuándo no` salen de un diccionario `DESCRIPCIONES` en el propio script (una entrada por archivo conocido). Los archivos no listados se emiten con descripción `"(sin describir — añadir a DESCRIPCIONES)"` para que el hueco sea visible, nunca silencioso.

El script es idempotente: no reescribe si el contenido no cambió.

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `python -m pytest tests/test_gen_indice.py -q && python scripts/gen_indice.py`
Expected: PASS y `knowledge/INDICE.md` creado.

- [ ] **Step 5: Revisar a mano el índice generado**

Leer `knowledge/INDICE.md` y confirmar que no hay entradas `"(sin describir...)"` en el corpus real. Si las hay, completar `DESCRIPCIONES` y regenerar.

- [ ] **Step 6: Commit**

```bash
git add scripts/gen_indice.py knowledge/INDICE.md tests/test_gen_indice.py
git commit -m "feat: indice de contexto del corpus generado"
```

---

### Task 6: Capa de agente en `AGENTS.md` + reglas por carpeta

**Files:**
- Modify: `AGENTS.md` (anteponer bloque; el contenido existente no se toca)
- Create: `.agents/rules/frontera-contenido-motor.md`
- Create: `.agents/rules/modos-rally.md`
- Create: `.agents/rules/rubricas-y-puntajes.md`
- Create: `.agents/rules/pautado-y-guion.md`
- Create: `tests/test_agent_layer.py`

**Interfaces:**
- Consumes: `knowledge/INDICE.md` (Task 5).
- Produces: el contrato que leen OpenCode y Antigravity al abrir la carpeta.

- [ ] **Step 1: Escribir la prueba que falla**

`tests/test_agent_layer.py`:

```python
def test_agents_md_under_antigravity_limit():
    assert len(Path("AGENTS.md").read_bytes()) <= 24_000

def test_agents_md_keeps_event_rules():
    texto = Path("AGENTS.md").read_text(encoding="utf-8")
    assert "Reglas de oro" in texto
    assert "SIRLI" in texto

def test_agents_md_declares_the_profe_and_the_boundary():
    texto = Path("AGENTS.md").read_text(encoding="utf-8")
    assert "knowledge/INDICE.md" in texto
    assert "no programas el motor" in texto.lower()

def test_every_rule_has_trigger_frontmatter():
    for p in Path(".agents/rules").glob("*.md"):
        cabecera = p.read_text(encoding="utf-8").split("---")[1]
        assert "trigger:" in cabecera
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `python -m pytest tests/test_agent_layer.py -q`
Expected: FAIL

- [ ] **Step 3: Anteponer el bloque nuevo a `AGENTS.md`**

Debe contener, en este orden y sin relleno: (1) quién eres (el profe) y la frontera dura; (2) orden de lectura (`brief.json` → `AGENTS.md` → `knowledge/INDICE.md` → solo lo que el índice marque); (3) el flujo de 13 etapas en una tabla de una línea por etapa; (4) cómo servir a (a) (§8.5 del spec) y el comando `python scripts/servir_propuesta.py`; (5) puntero a `docs/INSTALACION_AGENTE.md`. Máximo ~120 líneas. El contenido original queda debajo, intacto.

- [ ] **Step 4: Escribir las cuatro reglas**

Cada archivo empieza con frontmatter:

```yaml
---
trigger: model_decision
description: <una frase que diga cuándo aplica>
---
```

Contenido: el detalle del spec (§7 frontera, §8.7 flujo, rúbricas y puntajes, pautado y guion). Son documentos, no código: mover el detalle aquí es lo que mantiene `AGENTS.md` bajo el tope.

- [ ] **Step 5: Ejecutar y ver que pasa**

Run: `python -m pytest tests/test_agent_layer.py -q`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md .agents/rules/ tests/test_agent_layer.py
git commit -m "feat: capa de agente (el profe) en AGENTS.md y reglas por tema"
```

---

### Task 7: Skills núcleo

**Files:**
- Modify: `requirements.txt` (añadir `pdfplumber>=0.11`)
- Create: `skills/contexto-rally/SKILL.md`
- Create: `skills/guiar-usuario/SKILL.md`
- Create: `skills/servir-a-ventana/SKILL.md`
- Create: `skills/ingestar-investigacion/SKILL.md`
- Create: `skills/auditar-entregable/SKILL.md`
- Create: `tests/test_skills.py`

**Interfaces:**
- Consumes: `knowledge/INDICE.md`, `scripts/servir_propuesta.py`, `scripts/content_store.py`.
- Produces: la convención `skills/<nombre>/SKILL.md` que Task 9 refleja a las dos herramientas.

- [ ] **Step 0: Añadir el lector de PDF**

Agregar `pdfplumber>=0.11` a `requirements.txt` (única dependencia nueva de runtime) e instalarlo:

```bash
pip install -r requirements.txt
```

Motivo: `ingestar-investigacion` debe leer el PDF del humano **sin depender de una IA** — si la IA no está disponible, el contenido igual se extrae.

- [ ] **Step 1: Escribir la prueba que falla**

`tests/test_skills.py`:

```python
NUCLEO = ["contexto-rally", "guiar-usuario", "servir-a-ventana",
          "ingestar-investigacion", "auditar-entregable"]

@pytest.mark.parametrize("nombre", NUCLEO)
def test_skill_has_valid_frontmatter(nombre):
    texto = Path(f"skills/{nombre}/SKILL.md").read_text(encoding="utf-8")
    assert texto.startswith("---")
    cabecera = texto.split("---")[1]
    assert "name:" in cabecera and "description:" in cabecera

@pytest.mark.parametrize("nombre", NUCLEO)
def test_skill_is_short(nombre):
    assert len(Path(f"skills/{nombre}/SKILL.md").read_bytes()) <= 8_000
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `python -m pytest tests/test_skills.py -q`
Expected: FAIL

- [ ] **Step 3: Escribir las cinco skills**

Cada una: frontmatter (`name`, `description` con palabras clave en español), **cuándo usarla**, **procedimiento numerado**, y **punteros** al corpus/scripts. Sin volcar conocimiento (eso vive en el índice y las reglas).

- `contexto-rally`: lee `brief.json` y `knowledge/INDICE.md`, decide qué archivos abrir según la tarea, y **dice en voz alta** qué va a leer y por qué.
- `guiar-usuario`: recorre las 13 etapas; en cada una detecta el hueco, **pregunta** (una pregunta a la vez), y registra la respuesta.
- `servir-a-ventana`: arma el sobre, elige `tab` + `slot` correctos, valida y ejecuta `servir_propuesta.py`; explica al humano qué verá en la ventana.
- `ingestar-investigacion`: recibe un PDF/DOCX/MD de fuera; extrae texto, lo contrasta contra `research/claims.json` (nada inventado), lo alinea a la rúbrica del certamen activo y lo sirve como propuesta en la pestaña correcta. Marca `simulated` cuando corresponda.
- `auditar-entregable`: contrasta un entregable contra rúbrica + bases + propósito del grupo; devuelve hallazgos ordenados por gravedad, sin reescribir nada.

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `python -m pytest tests/test_skills.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/ tests/test_skills.py
git commit -m "feat: skills nucleo del agente"
```

---

### Task 8: Skills de producción

**Files:**
- Create: `skills/proponer-retos/SKILL.md`
- Create: `skills/sugerir-por-fase/SKILL.md`
- Create: `skills/propuesta-diseno/SKILL.md`
- Create: `skills/modelo-3d-blender/SKILL.md`
- Create: `skills/publicar-sitio/SKILL.md`
- Modify: `tests/test_skills.py` (ampliar la lista)

**Interfaces:**
- Consumes: la convención de Task 7, `research/challenges.json`, `brand/palette.json`, `scripts/publish_site.py`.
- Produces: las cinco skills restantes.

- [ ] **Step 1: Ampliar la prueba**

Añadir a `tests/test_skills.py` el parámetro `PRODUCCION` con las cinco y correr el mismo par de pruebas.

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `python -m pytest tests/test_skills.py -q`
Expected: FAIL para las nuevas

- [ ] **Step 3: Escribir las cinco skills**

- `proponer-retos`: propone retos anclados al certamen activo, con demanda real y ODS; nunca inventa cifras (usa `research/claims.json`).
- `sugerir-por-fase`: sugerencias puntuales para una etapa concreta; salida corta y accionable.
- `propuesta-diseno`: de nombre/logo/semilla → paleta, tipografías y tokens; propone, no aplica sola.
- `modelo-3d-blender`: **solo si el usuario lo pide**; verifica `render_watch.py` antes de lanzar; un proceso a la vez.
- `publicar-sitio`: construye `site/` y explica cómo publicar. **Nunca** pide tokens ni publica sola.

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `python -m pytest tests/test_skills.py -q`
Expected: PASS (10 skills)

- [ ] **Step 5: Commit**

```bash
git add skills/ tests/test_skills.py
git commit -m "feat: skills de produccion del agente"
```

---

### Task 9: Instalación de una vía (OpenCode + Antigravity)

**Files:**
- Create: `scripts/setup_agente.ps1`
- Create: `opencode.json`
- Create: `docs/INSTALACION_AGENTE.md`
- Create: `tests/test_setup_agente.py`

**Interfaces:**
- Consumes: `skills/`, `opencode.json`, `requirements.txt`.
- Produces: `skills/` reflejado en `.opencode/skills/` y `.agents/skills/`; el bloque MCP escrito en `opencode.json`.

- [ ] **Step 1: Escribir la prueba que falla**

`tests/test_setup_agente.py`:

```python
def test_opencode_json_is_valid_and_declares_playwright():
    cfg = json.loads(Path("opencode.json").read_text(encoding="utf-8"))
    assert "playwright" in cfg["mcp"]

def test_install_doc_covers_both_tools():
    texto = Path("docs/INSTALACION_AGENTE.md").read_text(encoding="utf-8")
    assert ".agents/skills" in texto
    assert ".opencode/skills" in texto
    assert "24" in texto  # aviso del tope de Antigravity

def test_setup_script_is_idempotent_by_inspection():
    texto = Path("scripts/setup_agente.ps1").read_text(encoding="utf-8")
    assert "Test-Path" in texto
    assert "Junction" in texto
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `python -m pytest tests/test_setup_agente.py -q`
Expected: FAIL

- [ ] **Step 3: Crear `opencode.json`**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp"],
      "enabled": true
    }
  }
}
```

(Si el repo ya tiene un `opencode.json` al momento de ejecutar, **fusionar** en vez de sobrescribir.)

- [ ] **Step 4: Escribir `scripts/setup_agente.ps1`**

Pasos, todos idempotentes y con salida legible:

1. Comprobar Python ≥ 3.10 y avisar si falta.
2. Instalar `requirements.txt` (preguntar antes de los opcionales pesados).
3. Para cada carpeta de `skills/`: crear junction `.opencode/skills/<n>` y `.agents/skills/<n>`; si la junction falla, copiar. Si ya existe y apunta al lugar correcto, no hacer nada.
4. Escribir el bloque MCP en `opencode.json` solo si falta `playwright`; nunca borrar MCPs existentes.
5. Comprobar que el servidor arranca: lanzar `python scripts/rally_service.py` en un puerto libre, pedir `/health`, matarlo.
6. Resumen final: qué se instaló, qué se omitió y por qué.

- [ ] **Step 5: Escribir `docs/INSTALACION_AGENTE.md`**

Cubre: requisitos, los **dos** caminos (OpenCode con `opencode.json` en el proyecto; Antigravity con config MCP **global** en `~/.gemini/…`), dónde viven las skills en cada herramienta, el tope de 24 KB / 20.000 tokens de Antigravity, el MCP opcional de Blender (con su advertencia), y qué hacer si algo falla.

- [ ] **Step 6: Ejecutar y ver que pasa**

Run: `python -m pytest tests/test_setup_agente.py -q`
Expected: PASS

- [ ] **Step 7: Probarlo de verdad**

```powershell
.\scripts\setup_agente.ps1
.\scripts\setup_agente.ps1
```

Expected: la segunda pasada no cambia nada y lo dice.

- [ ] **Step 8: Commit**

```bash
git add scripts/setup_agente.ps1 opencode.json docs/INSTALACION_AGENTE.md tests/test_setup_agente.py
git commit -m "feat: instalacion de una via para OpenCode y Antigravity"
```

---

### Task 10: Paquete limpio para descarga

**Files:**
- Modify: `brief.json` (plantilla en blanco, misma forma)
- Create: `docs/DESCARGA.md`
- Create: `tests/test_paquete_limpio.py`
- Delete (moviéndolos a la rama de respaldo): capturas, DOCX/PDF personales, `budget/screenshots/`, `dashboard/assets_uploads/`

**Interfaces:**
- Consumes: nada.
- Produces: un repo que se descarga sin datos de ningún proyecto anterior.

- [ ] **Step 1: Crear el respaldo antes de borrar**

```bash
git checkout -b archivo/trabajo-personal
git add -A
git commit -m "chore: respaldo del trabajo personal antes de limpiar el paquete"
git checkout feat/capa-agente-b
```

- [ ] **Step 2: Escribir la prueba que falla**

`tests/test_paquete_limpio.py`:

```python
def test_brief_is_blank_template():
    brief = json.loads(Path("brief.json").read_text(encoding="utf-8"))
    for campo in ("project_name", "team_name", "university", "city", "challenge_id"):
        assert brief[campo] == ""

def test_no_demo_project_identity():
    for p in [Path("brief.json"), Path("README.md"), Path("docs/DESCARGA.md")]:
        texto = p.read_text(encoding="utf-8")
        assert "hidro-vigia" not in texto
        assert "mentes-pinoleras" not in texto

def test_personal_artifacts_absent():
    for ruta in ("budget/screenshots", "dashboard/assets_uploads"):
        assert not Path(ruta).exists()

def test_corpus_still_present():
    for ruta in ("research/claims.json", "knowledge/rubric_latam.md",
                 "knowledge/INDICE.md", "AGENTS.md", "docs/INSTALACION_AGENTE.md"):
        assert Path(ruta).exists()
```

- [ ] **Step 3: Ejecutar y ver que falla**

Run: `python -m pytest tests/test_paquete_limpio.py -q`
Expected: FAIL

- [ ] **Step 4: Limpiar**

- `brief.json`: misma estructura, todos los campos de identidad en `""`, URLs en `""`, `_generated_at` vacío.
- Borrar del árbol de trabajo: `dash-*.png`, `tab*.png`, `tab2-*.png`, `tab3-script.png`, `graphify_knowledge_graph.png`, `Operación Titan_UNI_Documento pautado_2025.docx`, `Reporte_Pautado_Rally_2026.docx`, `docs/pautado_draft.docx`, `docs/Matriz_Seleccion_Desafios_2026.docx`, `budget/screenshots/`, `dashboard/assets_uploads/`, `.playwright-mcp/`, `.superpowers/`.
- Quitar de `README.md` y de `docs/DESCARGA.md` cualquier mención al proyecto demo.

- [ ] **Step 5: Escribir `docs/DESCARGA.md`**

Qué trae el paquete, qué no, cómo empezar en 5 pasos, y dónde está el respaldo del trabajo personal.

- [ ] **Step 6: Ejecutar todo y ver que pasa**

Run: `python -m pytest tests/ -q`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: paquete limpio de descarga"
```

---

## Verificación final (después de la última tarea)

1. `python -m pytest tests/ -q` → todo verde.
2. `python scripts/gen_indice.py` → sin cambios pendientes.
3. Abrir el repo con OpenCode en una carpeta nueva: identificar al profe, certamen y siguiente paso (prueba 1 del spec).
4. Abrir el mismo repo con Antigravity: mismas skills visibles, `AGENTS.md` cargado.
5. Con dos navegadores en `http://localhost:8000/dashboard/`, depositar una propuesta con `servir_propuesta.py`: aparece en los dos; aceptar en uno se refleja en el otro.
6. Publicar la rama y comprobar que `dashboard/data/content/` no viaja.
7. **A mano, con la IA real** (pruebas 2, 5 y 6 del spec, que no se pueden automatizar porque son conducta del agente):
   - Con `brief.json` en blanco, pedirle "avancemos": debe **preguntar** nombre/equipo/ciudad, no inventar.
   - Pedirle un prompt para una IA externa, darle un PDF de vuelta, y comprobar que lo sirve en la pestaña correcta sin inventar cifras.
   - Pedirle "cambia los puntajes de la rúbrica": debe **negarse** y ofrecer una tarea de Obra.
