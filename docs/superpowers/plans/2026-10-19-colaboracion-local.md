# Colaboración local con invitaciones — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un grupo comparta en vivo las secciones del proyecto en la red local, con entrada por enlace único por persona, nombre al entrar, admin que revoca, y escritura directa de la IA sin paso de aprobación.

**Architecture:** Se conserva el modelo de secciones versionadas (`base_version`, 409, 423) y el sondeo del cliente. Se añade un almacén de miembros e invitaciones en SQLite, sesiones Bearer, una pantalla de canje y una de administración. La IA escribe con un script autenticado. Este plan cubre solo el modo local; la nube va en un plan posterior.

**Tech Stack:** Python 3 (stdlib: `http.server`, `sqlite3`, `hashlib`, `secrets`), JavaScript vanilla, pytest, Node solo para la sonda existente.

**Spec:** `docs/superpowers/specs/2026-10-19-colaboracion-en-vivo-design.md`

## Global Constraints

- Un solo modo por sesión. Este plan implementa **solo modo local**.
- Toda escritura de sección conserva `base_version`, la respuesta 409 con `current` y `yours`, y la 423 por bloqueo. No se fusiona nada en silencio.
- Un cambio guardado se ve en los demás navegadores en **≤3 s**. En local el sondeo baja a **1 s**.
- Invitación de **un solo uso**, sin PIN ni correo.
- Un miembro revocado no sube su cola pendiente; se le avisa y se le ofrece exportar.
- Un miembro que llega con `localStorage` de otro proyecto no puede sembrar el proyecto.
- No se tocan `scripts/gen_*.py`, `scripts/validate_*.py`, cálculos de rúbrica, `brand/`, `research/` ni `knowledge/`.
- Textos de interfaz en español, sin emojis, sin morado, sin fuentes fuera de `brand/tokens.css`.
- La suite completa queda en verde. Hoy hay una falla previa que se corrige en la Tarea 1.
- Commits frecuentes, uno por tarea.

## Review Focus

- Dos personas escriben la misma sección a la vez: la segunda debe recibir 409 con ambas versiones y elegir; nada se pierde. (Tarea 9)
- Un enlace de invitación reenviado o abierto dos veces: el segundo canje debe fallar; no se crean identidades duplicadas. (Tareas 2 y 4)
- Miembro revocado con cola offline: al reconectar recibe 401, no sube nada y conserva sus datos. (Tarea 6)
- Miembro nuevo con estado local de otro proyecto entra a un proyecto vacío: no debe sembrarlo. (Tarea 6)
- Un no miembro llama la API con un `project` adivinado: 401 y cero lectura/escritura. (Tarea 4)

---

## Estructura de archivos

**Crear**

| Archivo | Responsabilidad |
|---|---|
| `scripts/member_store.py` | Miembros, invitaciones y sesiones en SQLite. Sin HTTP. |
| `scripts/crear_proyecto.py` | Alta del proyecto y del admin; imprime el primer enlace. |
| `scripts/publicar_seccion.py` | Escritura autenticada de la IA; traduce 409/423 a salida legible. |
| `dashboard/join.html` | Pantalla de canje del enlace. |
| `dashboard/join.js` | Canje, guardado de sesión y redirección. |
| `dashboard/admin.html` | Lista de miembros, invitaciones y revocación. |
| `dashboard/admin.js` | Llamadas autenticadas de administración. |
| `tests/test_member_store.py` | Un solo uso, expiración, revocación, hash. |
| `tests/test_members_api.py` | 401/403, canje, lista, revocación. |
| `tests/test_publicar_seccion.py` | Escritura correcta y conflicto 409. |
| `tests/test_servir_directo.py` | Mapeo pestaña → sección y modo directo. |
| `tests/test_colaboracion_local.py` | Flujo completo de dos miembros y revocación. |
| `tests/test_ui_contracts.py` | Contratos mínimos de `join.html`, `admin.html`, `section_sync.js`. |

**Modificar**

| Archivo | Cambio |
|---|---|
| `tests/test_content_bridge_js.py:50-55` | Retirar la expectativa obsoleta de `POST /api/state`. |
| `scripts/rally_service.py` | `MEMBER_STORE`, rutas de sesión/miembros, guardas de acceso, CORS con `Authorization`. |
| `dashboard/section_sync.js` | Token y proyecto en cada llamada, 401 que detiene la subida, sondeo 1 s, siembra solo admin/operador. |
| `dashboard/content_bridge.js` | Enviar el token en sus llamadas. |
| `dashboard/index.html:25` | Subir el `?v=` de `section_sync.js`. |
| `scripts/servir_propuesta.py` | Modo directo para secciones; el buzón queda para lo demás. |
| `docs/SINCRONIZACION_SECCIONES.md` | Modo local, invitaciones y autoría. |
| `docs/INSTALACION_Y_DESPLIEGUE.md` | Cómo crear el proyecto e invitar. |

---

### Task 1: Dejar la suite en verde

**Files:**
- Modify: `tests/test_content_bridge_js.py:50-55`

**Interfaces:**
- Consumes: la sonda existente `tests/js/bridge_probe.js`, comando `subir-estado`, que llama a `puente._subirEstado(...)`.
- Produces: suite base en verde; ninguna interfaz nueva.

- [ ] **Step 1: Reemplazar la prueba obsoleta**

```python
def test_content_bridge_does_not_post_full_state():
    datos = correr("subir-estado", {"team_name": "Ñandú"})
    assert not any(
        c.get("url") == "/api/state" and c.get("method") == "POST"
        for c in datos["llamadas"]
    )
```

- [ ] **Step 2: Correr la prueba y verificar que pasa**

Run: `python -m pytest tests/test_content_bridge_js.py -q`
Expected: PASS.

- [ ] **Step 3: Correr la suite completa**

Run: `python -m pytest -q`
Expected: `84 passed` (o el total vigente), 0 fallas.

- [ ] **Step 4: Commit**

```bash
git add tests/test_content_bridge_js.py
git commit -m "test: retire stale full-state upload expectation"
```

---

### Task 2: Almacén de miembros, invitaciones y sesiones

**Files:**
- Create: `scripts/member_store.py`
- Test: `tests/test_member_store.py`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `class MemberStore(path: str | Path)`
  - `has_members(project_id: str) -> bool`
  - `bootstrap(project_id: str, admin_name: str, device_id: str) -> dict`
  - `create_invite(project_id: str, actor_id: str, ttl_hours: int = 48) -> dict`
  - `claim_invite(token: str, name: str, device_id: str) -> dict`
  - `authenticate(project_id: str, token: str) -> dict | None`
  - `list_members(project_id: str) -> list[dict]`
  - `revoke_member(project_id: str, member_id: str) -> dict`
  - Miembro: `{"id": str, "name": str, "role": "admin"|"operator"|"member", "device_id": str, "revoked": bool, "last_seen": float}`
  - `bootstrap` y `claim_invite` devuelven además `{"project": str, "token": str}` con el token en claro **una sola vez**.

- [ ] **Step 1: Escribir las pruebas que fallan**

```python
import pytest
from scripts.member_store import MemberStore


def test_bootstrap_creates_admin_and_token(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    out = store.bootstrap("main", "Ana", "dev-admin")
    assert out["project"] == "main"
    assert out["member"]["role"] == "admin"
    assert store.authenticate("main", out["token"])["name"] == "Ana"


def test_invite_is_single_use(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    store.bootstrap("main", "Ana", "dev-admin")
    inv = store.create_invite("main", store.list_members("main")[0]["id"])
    first = store.claim_invite(inv["token"], "Luis", "dev-luis")
    assert first["member"]["role"] == "member"
    with pytest.raises(ValueError, match="invite-usado"):
        store.claim_invite(inv["token"], "Otra", "dev-x")


def test_expired_invite_is_rejected(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    store.bootstrap("main", "Ana", "dev-admin")
    inv = store.create_invite("main", store.list_members("main")[0]["id"], ttl_hours=-1)
    with pytest.raises(ValueError, match="invite-expirado"):
        store.claim_invite(inv["token"], "Luis", "dev-luis")


def test_revoked_member_cannot_authenticate(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    out = store.bootstrap("main", "Ana", "dev-admin")
    store.revoke_member("main", out["member"]["id"])
    assert store.authenticate("main", out["token"]) is None


def test_only_hashes_are_stored(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    out = store.bootstrap("main", "Ana", "dev-admin")
    raw = (tmp_path / "members.db").read_bytes()
    assert out["token"].encode() not in raw


def test_cannot_revoke_last_admin(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    out = store.bootstrap("main", "Ana", "dev-admin")
    with pytest.raises(ValueError, match="ultimo-admin"):
        store.revoke_member("main", out["member"]["id"])
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `python -m pytest tests/test_member_store.py -q`
Expected: FAIL con `ModuleNotFoundError: No module named 'scripts.member_store'`.

- [ ] **Step 3: Implementar `MemberStore`**

Tablas:

```sql
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    device_id TEXT NOT NULL DEFAULT '',
    token_hash TEXT NOT NULL UNIQUE,
    created_at REAL NOT NULL,
    last_seen REAL NOT NULL DEFAULT 0,
    revoked INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS invites (
    token_hash TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at REAL NOT NULL,
    expires_at REAL NOT NULL,
    used_by TEXT,
    used_at REAL
);
CREATE INDEX IF NOT EXISTS idx_members_project ON members(project_id);
```

Reglas de implementación:

- Tokens: `secrets.token_urlsafe(32)`; se guarda `hashlib.sha256(token.encode()).hexdigest()`.
- `id` de miembro: `"mem_" + secrets.token_hex(8)`.
- `authenticate` devuelve `None` si no existe, si `revoked = 1` o si el token no coincide; si coincide, actualiza `last_seen`.
- `claim_invite` busca por hash, rechaza `used_at` no nulo (`invite-usado`), `expires_at <= now` (`invite-expirado`) o inexistente (`invite-invalido`). En una sola transacción marca la invitación y crea el miembro `member`.
- `create_invite` exige que `actor_id` sea `admin` u `operator` del proyecto; si no, `ValueError("sin-permiso")`.
- `revoke_member` impide dejar el proyecto sin ningún admin activo (`ultimo-admin`).
- `list_members` nunca devuelve `token_hash`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `python -m pytest tests/test_member_store.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/member_store.py tests/test_member_store.py
git commit -m "feat: add member, invite and session store"
```

---

### Task 3: Alta del proyecto por CLI

**Files:**
- Create: `scripts/crear_proyecto.py`
- Test: `tests/test_member_store.py` (añadir una prueba de CLI)

**Interfaces:**
- Consumes: `MemberStore.bootstrap`, `MemberStore.create_invite`.
- Produces: `python scripts/crear_proyecto.py --project <id> --name "<admin>" [--data-dir <dir>]` imprime un JSON con `project`, `token`, `join_url` y `member`; sale 0.

- [ ] **Step 1: Escribir la prueba que falla**

```python
import json
import subprocess
import sys


def test_bootstrap_cli_prints_join_url(tmp_path):
    out = subprocess.run(
        [sys.executable, "scripts/crear_proyecto.py",
         "--project", "equipo01", "--name", "Ana",
         "--data-dir", str(tmp_path)],
        capture_output=True, text=True, encoding="utf-8", timeout=30,
    )
    assert out.returncode == 0, out.stderr
    data = json.loads(out.stdout)
    assert data["project"] == "equipo01"
    assert data["join_url"].startswith("join.html?t=")
    assert data["member"]["role"] == "admin"
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `python -m pytest tests/test_member_store.py::test_bootstrap_cli_prints_join_url -q`
Expected: FAIL, el script no existe.

- [ ] **Step 3: Implementar el CLI**

- `--data-dir` por defecto: `os.environ.get("RALLY_DATA_DIR", REPO_ROOT/"dashboard"/"data")`.
- `--project` por defecto `main`, validado con `^[A-Za-z0-9_-]{1,64}$`.
- Si el proyecto ya tiene miembros, sale 2 con `{"error": "proyecto-existente"}`.
- Crea admin, crea su primera invitación y arma `join_url = "join.html?t=" + token`.
- Imprime un único objeto JSON en `stdout`; errores en `stderr`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `python -m pytest tests/test_member_store.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/crear_proyecto.py tests/test_member_store.py
git commit -m "feat: add project bootstrap CLI"
```

---

### Task 4: Rutas de sesión, miembros e invitaciones en la API

**Files:**
- Modify: `scripts/rally_service.py:103-105` (crear `MEMBER_STORE`), `:268-355` (GET), `:480-532` (POST), `:770-835` (CORS y guardas)
- Test: `tests/test_members_api.py`

**Interfaces:**
- Consumes: `MemberStore`.
- Produces:
  - `POST /api/project/claim` → `{ok, project, member, session}`
  - `GET /api/session` → `{ok, project, member}`
  - `GET /api/members?project=<id>` → `{ok, members}`
  - `POST /api/invites?project=<id>` → `{ok, token, url_path}`
  - `POST /api/members/<id>/revoke?project=<id>` → `{ok, member}`
  - Cabecera `Authorization: Bearer <session>`.
  - Guardas: si el proyecto tiene miembros, lecturas y escrituras de secciones exigen sesión válida; importar exige `admin` u `operator`; sin miembros, todo sigue abierto como hoy.

- [ ] **Step 1: Crear el soporte compartido de pruebas**

`tests/__init__.py` vacío. `tests/support.py`:

```python
import json, os, socket, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

def free_port() -> int:
    s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
    return port

def call(method, url, payload=None, headers=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw else {}), dict(resp.headers)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        return exc.code, (json.loads(raw) if raw else {}), dict(exc.headers)

def auth(token): return {"Authorization": "Bearer " + token}

def bootstrap(base, project, name):
    data_dir = os.environ["RALLY_TEST_DATA_DIR"]
    out = subprocess.run(
        [sys.executable, "scripts/crear_proyecto.py", "--project", project,
         "--name", name, "--data-dir", data_dir],
        cwd=str(REPO_ROOT), capture_output=True, text=True, encoding="utf-8", timeout=30,
    )
    assert out.returncode == 0, out.stderr
    data = json.loads(out.stdout)
    return {"admin_token": data["token"], "join_token": data["join_url"].split("t=", 1)[1],
            "member": data["member"], "project": project}

def claim(base, invite_token, name):
    status, body, _ = call("POST", base + "/api/project/claim",
                           {"token": invite_token, "name": name, "device_id": "dev-" + name})
    assert status == 200, body
    return body
```

`tests/conftest.py` define el fixture `servidor` que arranca `scripts/rally_service.py`
con `RALLY_DATA_DIR` temporal, expone `(base, data_dir)`, escribe
`os.environ["RALLY_TEST_DATA_DIR"]` y limpia al terminar.

- [ ] **Step 2: Escribir las pruebas que fallan**

```python
from tests.support import auth, bootstrap, call


def test_claim_returns_session_and_second_claim_fails(servidor):
    base, data_dir = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    status, body, _ = call("POST", base + "/api/project/claim", {
        "token": boot["join_token"], "name": "Luis", "device_id": "dev-luis",
    })
    assert status == 200
    assert body["member"]["name"] == "Luis"
    assert body["session"]
    status2, _, _ = call("POST", base + "/api/project/claim", {
        "token": boot["join_token"], "name": "Otra", "device_id": "dev-x",
    })
    assert status2 == 400


def test_sections_require_session_when_project_has_members(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    status, _, _ = call("GET", base + "/api/sections?project=equipo01")
    assert status == 401
    status2, body2, _ = call("GET", base + "/api/sections?project=equipo01",
                             headers={"Authorization": "Bearer " + boot["admin_token"]})
    assert status2 == 200


def test_member_cannot_create_invite(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    member = claim(base, boot["join_token"], "Luis")
    status, _, _ = call("POST", base + "/api/invites?project=equipo01",
                        {"ttl_hours": 2}, headers=auth(member["session"]))
    assert status == 403


def test_admin_revokes_member_and_token_dies(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    member = claim(base, boot["join_token"], "Luis")
    status, _, _ = call("POST", base + "/api/members/" + member["member"]["id"] + "/revoke?project=equipo01",
                        {}, headers=auth(boot["admin_token"]))
    assert status == 200
    status2, _, _ = call("GET", base + "/api/sections?project=equipo01",
                         headers=auth(member["session"]))
    assert status2 == 401
```

Helpers del archivo de prueba:

```python
def auth(token):
    return {"Authorization": "Bearer " + token}

def bootstrap(base, project, name):
    # ejecuta scripts/crear_proyecto.py con RALLY_DATA_DIR temporal y
    # devuelve {"admin_token", "join_token"} leyendo el JSON impreso
```

La prueba de `project=main` sin miembros (modo local de una persona) debe seguir respondiendo 200 sin cabecera.

- [ ] **Step 3: Correr y verificar que falla**

Run: `python -m pytest tests/test_members_api.py -q`
Expected: FAIL con 404 en `/api/project/claim`.

- [ ] **Step 4: Implementar el servidor**

- Añadir `MEMBER_STORE = MemberStore(DATA_DIR / "members.db")` junto a `SECTION_STORE`.
- En `do_GET`, antes de `/api/state`:

```python
elif req_path == "/api/session":
    project = self.project_id(url.query)
    member = self.require_member(project)
    if member is None:
        return
    self.send_json_response(200, {"ok": True, "project": project, "member": member}, cors=True)
elif req_path == "/api/members":
    project = self.project_id(url.query)
    member = self.require_member(project, ("admin", "operator"))
    if member is None:
        return
    self.send_json_response(200, {"ok": True, "members": MEMBER_STORE.list_members(project)}, cors=True)
```

- En `do_POST`, antes de `/api/sections`:

```python
elif url.path == "/api/project/claim":
    self.handle_claim_invite()
elif url.path == "/api/invites":
    self.handle_create_invite(url)
elif url.path.startswith("/api/members/") and url.path.endswith("/revoke"):
    self.handle_revoke_member(url)
```

- `handle_claim_invite`: lee `{token, name, device_id}`, valida nombre de 1–40 caracteres, llama `MEMBER_STORE.claim_invite`, responde 200 y en `ValueError` responde 400 con `{"ok": false, "error": str(exc)}`.
- `handle_create_invite`: exige admin/operador, lee `ttl_hours` (1–168, por defecto 48), responde `{ok, token, url_path}`.
- `handle_revoke_member`: exige admin/operador; extrae el id entre `/api/members/` y `/revoke`; 400 si el id queda vacío; `ValueError("ultimo-admin")` → 400.
- `bearer_token()` y `require_member()`:

```python
def bearer_token(self) -> str:
    raw = (self.headers.get("Authorization") or "").strip()
    return raw[7:].strip() if raw.lower().startswith("bearer ") else ""

def require_member(self, project: str, roles: tuple[str, ...] = ()) -> dict | None:
    if not MEMBER_STORE.has_members(project):
        return {"id": "legacy", "name": "Local", "role": "legacy"}
    member = MEMBER_STORE.authenticate(project, self.bearer_token())
    if member is None:
        self.send_json_response(401, {"ok": False, "error": "no-autenticado"}, cors=True)
        return None
    if roles and member["role"] not in roles:
        self.send_json_response(403, {"ok": False, "error": "sin-permiso"}, cors=True)
        return None
    return member
```

- En `/api/state`, `/api/sections`, `/api/events`: `if self.require_member(project) is None: return`.
- En `handle_post_sections` y `handle_post_sections_import`: `member = self.require_member(project)`; si es `None`, return. Para importar, además exigir `("admin", "operator")`.
- En escrituras autenticadas, la autoría sale del miembro: `actor, actor_id = member["name"], member["id"]`. En modo legacy se conserva `self.actor_from(data)`.
- Añadir `Authorization` a `Access-Control-Allow-Headers`.

- [ ] **Step 5: Correr las pruebas nuevas y las de secciones**

Run: `python -m pytest tests/test_members_api.py tests/test_sections_api.py tests/test_service_api.py -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/rally_service.py tests/test_members_api.py tests/__init__.py tests/support.py tests/conftest.py
git commit -m "feat: add invite claim and session-guarded section API"
```

---

### Task 5: Pantalla de canje

**Files:**
- Create: `dashboard/join.html`, `dashboard/join.js`
- Test: `tests/test_ui_contracts.py`

**Interfaces:**
- Consumes: `POST /api/project/claim`.
- Produces: claves `rally_session_token`, `rally_project`, `rally_member_id`, `rally_member_name`, `rally_member_role` en `localStorage`; redirección a `/?project=<id>`.

- [ ] **Step 1: Escribir la prueba que falla**

```python
from pathlib import Path

DASH = Path(__file__).resolve().parent.parent / "dashboard"


def test_join_page_has_name_field_and_claim_endpoint():
    html = (DASH / "join.html").read_text(encoding="utf-8")
    js = (DASH / "join.js").read_text(encoding="utf-8")
    assert 'id="join-name"' in html
    assert 'id="join-form"' in html
    assert "/api/project/claim" in js
    assert "rally_session_token" in js
    assert "rally_project" in js
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `python -m pytest tests/test_ui_contracts.py -q`
Expected: FAIL, los archivos no existen.

- [ ] **Step 3: Implementar la pantalla**

`join.html`: página mínima con el mismo `style.css` del dashboard, un `<form id="join-form">`, `<input id="join-name" maxlength="40" required>`, un botón y un `<p id="join-status">`. Sin scripts inline.

`join.js`:

```js
const params = new URLSearchParams(location.search);
const token = (params.get("t") || "").trim();
if (!token) { mostrar("Este enlace no trae invitación."); }
document.getElementById("join-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("join-name").value.trim();
  if (!name) { mostrar("Escribe tu nombre."); return; }
  const res = await fetch("/api/project/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, name: name, device_id: deviceId() }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { mostrar(body.error || "No se pudo entrar."); return; }
  localStorage.setItem("rally_session_token", body.session);
  localStorage.setItem("rally_project", body.project);
  localStorage.setItem("rally_member_id", body.member.id);
  localStorage.setItem("rally_member_name", body.member.name);
  localStorage.setItem("rally_member_role", body.member.role);
  location.replace("/?project=" + encodeURIComponent(body.project));
});
function deviceId() {
  let id = localStorage.getItem("rally_device_id");
  if (!id) { id = "dev_" + crypto.randomUUID(); localStorage.setItem("rally_device_id", id); }
  return id;
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `python -m pytest tests/test_ui_contracts.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add dashboard/join.html dashboard/join.js tests/test_ui_contracts.py
git commit -m "feat: add invite claim page"
```

---

### Task 6: Cliente sincronizado con sesión y proyecto

**Files:**
- Modify: `dashboard/section_sync.js:14` (`POLL_MS`), `:171-192` (`api`), `:194-238` (siembra), `:306-325` (401), `:66-79` (actor)
- Modify: `dashboard/content_bridge.js` (cabecera de sesión en sus `fetch`)
- Modify: `dashboard/index.html:25` (`?v=20261019_rev11`)
- Test: `tests/test_ui_contracts.py`

**Interfaces:**
- Consumes: claves de sesión de la Tarea 5.
- Produces: toda llamada a `/api/*` lleva `Authorization: Bearer` y `project`; 401/403 activa `accessRevoked`, detiene el sondeo y no sube la cola.

- [ ] **Step 1: Añadir las pruebas que fallan**

```python
def test_section_sync_sends_session_and_project():
    js = (DASH / "section_sync.js").read_text(encoding="utf-8")
    assert "Authorization" in js
    assert "rally_session_token" in js
    assert "rally_project" in js
    assert "POLL_MS = 1000" in js
    assert "accessRevoked" in js


def test_section_sync_blocks_seeding_for_plain_members():
    js = (DASH / "section_sync.js").read_text(encoding="utf-8")
    assert '"operator"' in js and '"admin"' in js
    assert "sections/import" in js
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `python -m pytest tests/test_ui_contracts.py -q`
Expected: FAIL en las dos pruebas nuevas.

- [ ] **Step 3: Implementar**

- `POLL_MS = 1000`.
- `projectId()`: parámetro `project` de la URL, si no `localStorage["rally_project"]`, si no `"main"`; lo persiste.
- `sessionToken()`: `localStorage["rally_session_token"] || ""`.
- En `api(path, options)`: añadir `Authorization` si hay token y agregar `project` a la ruta con `withProject(path)`.
- En `api`, si `res.status === 401 || res.status === 403`: `accessRevoked = true; serverAvailable = false; setStatus("Acceso revocado · tus cambios quedan en este equipo", "offline"); return`.
- `poll()` y `flush()` retornan temprano si `accessRevoked`.
- `initialSync`: solo importar cuando el servidor esté vacío y el rol sea `admin` u `operator`. Si el rol es `member`, no importar: aplicar lo remoto y dejar lo local como pendiente sin subir hasta que el servidor tenga contenido.
- `actor()`: usar `rally_member_name` antes que `rally_user_name`.
- En `content_bridge.js`, su helper de `fetch` añade `Authorization` si existe el token.
- Subir la versión del script en `index.html` para evitar caché.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `python -m pytest tests/test_ui_contracts.py -q`
Expected: PASS en las pruebas de `section_sync` (admin aún puede faltar).

- [ ] **Step 5: Commit**

```bash
git add dashboard/section_sync.js dashboard/content_bridge.js dashboard/index.html tests/test_ui_contracts.py
git commit -m "feat: authenticate section sync and scope it to the project"
```

---

### Task 7: Pantalla de administración

**Files:**
- Create: `dashboard/admin.html`, `dashboard/admin.js`
- Test: `tests/test_ui_contracts.py`

**Interfaces:**
- Consumes: `GET /api/members`, `POST /api/invites`, `POST /api/members/<id>/revoke`.
- Produces: lista con nombre, rol, último acceso y estado; botón de invitación que muestra la URL completa; botón de revocación por miembro.

- [ ] **Step 1: Escribir la prueba que falla**

```python
def test_admin_page_has_member_and_invite_controls():
    html = (DASH / "admin.html").read_text(encoding="utf-8")
    js = (DASH / "admin.js").read_text(encoding="utf-8")
    assert 'id="members-list"' in html
    assert 'id="create-invite"' in html
    assert "/api/members" in js
    assert "/api/invites" in js
    assert "/revoke" in js
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `python -m pytest tests/test_ui_contracts.py -k admin -q`
Expected: FAIL, archivos inexistentes.

- [ ] **Step 3: Implementar**

`admin.html`: contenedor `#members-list`, botón `#create-invite`, `<output id="invite-url">`, `<p id="admin-status">`. Mismo `style.css`.

`admin.js`:

- `token()` lee `rally_session_token`; si falta, muestra "Abre tu enlace de invitación".
- `cargarMiembros()` llama `GET /api/members?project=` y pinta filas; cada fila con botón `data-member-id`.
- `crearInvitacion()` llama `POST /api/invites?project=` y muestra `location.origin + "/" + url_path`.
- `revocar(id)` pide confirmación y llama `POST /api/members/<id>/revoke?project=`.
- 401/403: mensaje "Sin permiso" y sin reintentos.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `python -m pytest tests/test_ui_contracts.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add dashboard/admin.html dashboard/admin.js tests/test_ui_contracts.py
git commit -m "feat: add member administration page"
```

---

### Task 8: Escritura directa de la IA

**Files:**
- Create: `scripts/publicar_seccion.py`
- Modify: `scripts/servir_propuesta.py`
- Test: `tests/test_publicar_seccion.py`, `tests/test_servir_directo.py`

**Interfaces:**
- Consumes: `GET /api/sections`, `POST /api/sections/<key>`, `Authorization: Bearer`.
- Produces:
  - `publicar(server: str, project: str, section: str, data, token: str, base_version: int | None = None, actor: str = "IA") -> dict`
  - Excepciones `Conflicto(body)`, `Bloqueada(body)`, `NoAutorizado(body)`.
  - CLI: `python scripts/publicar_seccion.py --project <id> --section pautado.problema --text "..." --token <token> [--base-version N] [--server URL]`; sale 0, 2 (409), 3 (423), 4 (auth/red).
  - `servir_propuesta.py` escribe directo cuando hay mapeo y token; el buzón queda para assets, notas y contenido simulado.

- [ ] **Step 1: Escribir las pruebas que fallan**

```python
def test_publicar_escribe_y_lee_version(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    out = publicar(base, "equipo01", "pautado.problema", {"text": "Hola"}, boot["admin_token"])
    assert out["section"]["version"] == 1
    status, body, _ = call("GET", base + "/api/sections?project=equipo01",
                           headers=auth(boot["admin_token"]))
    assert body["sections"]["pautado.problema"]["data"]["text"] == "Hola"


def test_publicar_sin_base_actualizada_da_conflicto(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    publicar(base, "equipo01", "pautado.problema", {"text": "A"}, boot["admin_token"])
    with pytest.raises(Conflicto):
        publicar(base, "equipo01", "pautado.problema", {"text": "B"},
                 boot["admin_token"], base_version=0)
```

```python
def test_mapeo_de_pestanas_a_secciones():
    assert seccion_destino("pautado", "problema") == "pautado.problema"
    assert seccion_destino("script", "acto2") == "script.acto2"
    assert seccion_destino("budget", "costos") == "budget"
    assert seccion_destino("resources", "main") == "resources"
    assert seccion_destino("timeline", "main") is None
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `python -m pytest tests/test_publicar_seccion.py tests/test_servir_directo.py -q`
Expected: FAIL, módulos inexistentes.

- [ ] **Step 3: Implementar `publicar_seccion.py`**

- `publicar` sin `base_version`: `GET /api/sections?project=<id>&since=0`, toma `sections[section]["version"]` o 0.
- `POST /api/sections/<section>?project=<id>` con `{"data", "base_version", "actor", "actor_id": "ia"}`.
- 409 → `raise Conflicto(body)`; 423 → `raise Bloqueada(body)`; 401/403 → `raise NoAutorizado(body)`.
- El CLI imprime un JSON con `ok`, `version` o el conflicto completo.

- [ ] **Step 4: Implementar el modo directo en `servir_propuesta.py`**

```python
SECCION_POR_TAB = {
    "pautado": lambda slot: f"pautado.{slot}",
    "script": lambda slot: f"script.{slot}",
    "budget": lambda slot: "budget",
    "canvas": lambda slot: "model_canvas",
    "challenges": lambda slot: "challenges",
    "resources": lambda slot: "resources",
}

def seccion_destino(tab, slot):
    fn = SECCION_POR_TAB.get(tab)
    return fn(slot) if fn else None
```

- Nuevos argumentos: `--token` (o `RALLY_SESSION_TOKEN`), `--server`, `--project`, `--mailbox`.
- Si `--simulated`, o no hay token, o no hay mapeo, o `--mailbox`: escribir el buzón como hoy.
- Si hay mapeo y token: convertir payload a dato (`payload["text"]` si es texto; `payload["items"]` para budget; si no, el payload completo) y llamar `publicar`. En `Conflicto`/`Bloqueada`, imprimir y salir 2/3 sin escribir el buzón.
- Conservar la validación de sobre y los códigos de salida actuales.

- [ ] **Step 5: Correr y verificar que pasa**

Run: `python -m pytest tests/test_publicar_seccion.py tests/test_servir_directo.py -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/publicar_seccion.py scripts/servir_propuesta.py tests/test_publicar_seccion.py tests/test_servir_directo.py
git commit -m "feat: let AI write sections directly without approval"
```

---

### Task 9: Flujo completo y documentación

**Files:**
- Create: `tests/test_colaboracion_local.py`
- Modify: `docs/SINCRONIZACION_SECCIONES.md`, `docs/INSTALACION_Y_DESPLIEGUE.md`
- Test: `tests/test_colaboracion_local.py`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: prueba de aceptación del modo local.

- [ ] **Step 1: Escribir la prueba de aceptación**

```python
def test_dos_miembros_editan_y_el_segundo_recibe_conflicto(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    luis = claim(base, boot["join_token"], "Luis")
    headers_a = auth(boot["admin_token"])
    headers_l = auth(luis["session"])
    call("POST", base + "/api/sections/pautado.problema?project=equipo01",
         {"data": {"text": "A"}, "base_version": 0}, headers=headers_a)
    status, body, _ = call("POST", base + "/api/sections/pautado.problema?project=equipo01",
                           {"data": {"text": "B"}, "base_version": 0}, headers=headers_l)
    assert status == 409
    assert body["current"]["data"]["text"] == "A"
    assert body["yours"]["data"]["text"] == "B"


def test_revocado_pierde_acceso(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    luis = claim(base, boot["join_token"], "Luis")
    call("POST", base + "/api/members/" + luis["member"]["id"] + "/revoke?project=equipo01",
         {}, headers=auth(boot["admin_token"]))
    status, _, _ = call("GET", base + "/api/sections?project=equipo01",
                        headers=auth(luis["session"]))
    assert status == 401


def test_proyecto_sin_miembros_sigue_abierto(servidor):
    base, _ = servidor
    status, body, _ = call("GET", base + "/api/sections?project=main")
    assert status == 200
```

- [ ] **Step 2: Correr y verificar que pasa**

Run: `python -m pytest tests/test_colaboracion_local.py -q`
Expected: PASS.

- [ ] **Step 3: Actualizar la documentación**

En `docs/SINCRONIZACION_SECCIONES.md` añadir:

- modo local con invitaciones; cómo se crea el proyecto;
- que la sesión va en `Authorization: Bearer`;
- que un miembro no siembra el proyecto;
- que un revocado conserva su cola y no la sube;
- que la IA escribe con `publicar_seccion.py` y ya no pasa por Aceptar/Descartar.

En `docs/INSTALACION_Y_DESPLIEGUE.md` añadir el flujo de tres pasos: crear proyecto, repartir enlaces, abrir `admin.html` para revocar.

- [ ] **Step 4: Correr la suite completa**

Run: `python -m pytest -q`
Expected: todas pasan, 0 fallas.

- [ ] **Step 5: Verificación manual**

1. `python scripts/crear_proyecto.py --project prueba --name "Ana"`.
2. Abrir el `join_url` en dos navegadores distintos con nombres distintos.
3. Editar `pautado.problema` en uno; ver el cambio en el otro en ≤3 s.
4. Editar la misma sección en ambos; confirmar el diálogo de conflicto.
5. Revocar a uno desde `admin.html`; confirmar que su siguiente acción recibe "Acceso revocado".

- [ ] **Step 6: Commit**

```bash
git add tests/test_colaboracion_local.py docs/SINCRONIZACION_SECCIONES.md docs/INSTALACION_Y_DESPLIEGUE.md
git commit -m "test: cover local collaboration acceptance flow"
```

---

## Autoevaluación del plan

- **Cobertura de la especificación:** invitaciones de un solo uso (T2/T4), nombre al entrar (T5), admin revoca (T4/T7), sesión Bearer en todas las llamadas (T4/T6), siembra restringida (T6), cola de revocado (T6), IA directa sin aprobación (T8), ≤3 s con sondeo 1 s (T6), modo local sin miembros intacto (T4/T9). La nube queda explícitamente fuera de este plan.
- **Consistencia de tipos:** `token` en claro solo en `bootstrap`, `create_invite` y `claim_invite`; el resto usa `session`. `member["id"]` es el `actor_id` de las escrituras.
- **Enlaces entre tareas:** T4 consume T2/T3; T5 consume T4; T6 consume T5; T7 consume T4; T8 consume T4; T9 consume todo.
- **Riesgo principal:** `app.js` no se toca. La sesión y el modo viven en `section_sync.js` y en páginas separadas, para no romper la lógica existente.
