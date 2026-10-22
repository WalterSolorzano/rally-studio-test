import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent


def _free_port() -> int:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


@pytest.fixture
def servidor(tmp_path):
    port = _free_port()
    data_dir = tmp_path / "data"
    data_dir.mkdir()

    env = os.environ.copy()
    env["RALLY_SERVICE_PORT"] = str(port)
    env["RALLY_DATA_DIR"] = str(data_dir)
    env["PYTHONIOENCODING"] = "utf-8"

    proc = subprocess.Popen(
        [sys.executable, "scripts/rally_service.py"],
        cwd=str(REPO_ROOT),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    base = f"http://127.0.0.1:{port}"

    deadline = time.time() + 30
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(base + "/health", timeout=1) as resp:
                if resp.status == 200:
                    break
        except Exception:
            time.sleep(0.2)
    else:
        proc.kill()
        salida = proc.stdout.read().decode("utf-8", "replace")
        pytest.fail(f"el servidor no arrancó: {salida}")

    yield base, data_dir / "content"

    proc.terminate()
    try:
        proc.wait(timeout=5)
    except Exception:
        proc.kill()


def get_json(url):
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        cuerpo = exc.read().decode("utf-8")
        return exc.code, (json.loads(cuerpo) if cuerpo else {})


def post_json(url, payload=None):
    data = b"" if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, method="POST", headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        cuerpo = exc.read().decode("utf-8")
        return exc.code, (json.loads(cuerpo) if cuerpo else {})


def envelope(item_id="p1", tab="pautado", slot="problema"):
    return {
        "id": item_id, "tab": tab, "slot": slot, "kind": "text",
        "title": "Propuesta", "source": "test",
        "created_at": "2026-10-19T10:00:00-06:00",
        "confidence": "media", "simulated": False,
        "payload": {"text": "Hola"},
    }


def test_content_roundtrip(servidor):
    base, content_dir = servidor

    status, body = post_json(base + "/api/state", {"state": {"team_name": "Ñandú"}})
    assert status == 200 and body["ok"] is True

    status, body = get_json(base + "/api/state")
    assert status == 200
    assert body["state"]["team_name"] == "Ñandú"

    status, body = get_json(base + "/api/content/manifest")
    assert status == 200
    assert body["items"] == []

    content_dir.mkdir(parents=True, exist_ok=True)
    (content_dir / "p1.json").write_text(
        json.dumps(envelope(), ensure_ascii=False), encoding="utf-8"
    )

    status, body = get_json(base + "/api/content/manifest")
    assert status == 200
    assert [i["id"] for i in body["items"]] == ["p1"]

    status, body = get_json(base + "/api/content/p1")
    assert status == 200
    assert body["payload"] == {"text": "Hola"}

    status, body = post_json(base + "/api/content/p1/apply")
    assert status == 200 and body["ok"] is True

    status, body = get_json(base + "/api/content/manifest")
    assert body["items"] == []

    status, body = post_json(base + "/api/content/p1/apply")
    assert status == 200 and body["ok"] is True


def test_content_manifest_survives_corrupt_file(servidor):
    base, content_dir = servidor
    content_dir.mkdir(parents=True, exist_ok=True)
    (content_dir / "roto.json").write_text("{no es json", encoding="utf-8")

    status, body = get_json(base + "/api/content/manifest")
    assert status == 200
    assert body["items"] == []


def test_content_rejects_bad_id(servidor):
    base, _ = servidor
    status, _body = get_json(base + "/api/content/..%2f..%2fetc%2fpasswd")
    assert status == 404


def test_content_schema_lists_tabs(servidor):
    base, _ = servidor
    status, body = get_json(base + "/api/content/schema")
    assert status == 200
    assert "pautado" in body["tabs"]
    assert "problema" in body["slots"]["pautado"]


def _request(base, path, metodo="GET", cuerpo=None, cabeceras=None):
    data = json.dumps(cuerpo).encode("utf-8") if cuerpo is not None else None
    req = urllib.request.Request(base + path, data=data, method=metodo)
    req.add_header("Content-Type", "application/json")
    for clave, valor in (cabeceras or {}).items():
        req.add_header(clave, valor)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, dict(resp.headers), resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read().decode("utf-8")


def test_new_routes_do_not_advertise_cross_origin(servidor):
    base, _ = servidor
    estado, cabeceras, _ = _request(base, "/api/state")
    assert estado == 200
    assert "Access-Control-Allow-Origin" not in cabeceras


def test_post_from_foreign_origin_is_rejected(servidor):
    base, _ = servidor
    estado, _, _ = _request(base, "/api/state", "POST", {"state": {"a": 1}}, {"Origin": "http://malo.example"})
    assert estado == 403
    estado_propio, _, _ = _request(base, "/api/state", "POST", {"state": {"a": 1}}, {"Origin": base})
    assert estado_propio == 200

