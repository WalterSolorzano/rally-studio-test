import json
import os
import socket
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def call(method, url, payload=None, headers=None, origin=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    if origin:
        req.add_header("Origin", origin)
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, _json(raw), dict(resp.headers)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        return exc.code, _json(raw), dict(exc.headers)


def _json(raw):
    try:
        return json.loads(raw) if raw else {}
    except ValueError:
        return {}


def auth(token):
    return {"Authorization": "Bearer " + token}


def bootstrap(base, project, name):
    data_dir = os.environ["RALLY_TEST_DATA_DIR"]
    out = subprocess.run(
        [sys.executable, "scripts/crear_proyecto.py", "--project", project,
         "--name", name, "--data-dir", data_dir],
        cwd=str(REPO_ROOT), capture_output=True, text=True, encoding="utf-8", timeout=30,
    )
    assert out.returncode == 0, out.stderr
    data = json.loads(out.stdout)
    return {
        "admin_token": data["token"],
        "join_token": data["join_url"].split("t=", 1)[1],
        "member": data["member"],
        "project": project,
    }


def claim(base, invite_token, name):
    status, body, _ = call("POST", base + "/api/project/claim",
                           {"token": invite_token, "name": name, "device_id": "dev-" + name})
    assert status == 200, body
    return body
