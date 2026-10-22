import json
import subprocess
import sys

from scripts.servir_propuesta import seccion_destino
from tests.support import REPO_ROOT, auth, bootstrap, call


def test_mapeo_de_pestanas_a_secciones():
    assert seccion_destino("pautado", "problema") == "pautado.problema"
    assert seccion_destino("script", "acto2") == "script.acto2"
    assert seccion_destino("budget", "costos") == "budget"
    assert seccion_destino("resources", "main") == "resources"
    assert seccion_destino("timeline", "main") is None


def test_cli_escribe_directo_cuando_hay_token(servidor, tmp_path):
    base, data_dir = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    payload = tmp_path / "propuesta.json"
    payload.write_text(json.dumps({"text": "Hola directo"}), encoding="utf-8")
    out = subprocess.run(
        [sys.executable, "scripts/servir_propuesta.py",
         "--tab", "pautado", "--slot", "problema", "--kind", "text",
         "--title", "Problema", "--payload", str(payload),
         "--server", base, "--project", "equipo01", "--token", boot["admin_token"]],
        cwd=str(REPO_ROOT), capture_output=True, text=True, encoding="utf-8", timeout=30,
    )
    assert out.returncode == 0, out.stderr
    status, body, _ = call("GET", base + "/api/sections?project=equipo01",
                           headers=auth(boot["admin_token"]))
    assert status == 200
    assert body["sections"]["pautado.problema"]["data"] == "Hola directo"
    content_dir = data_dir / "content"
    assert not content_dir.exists() or not list(content_dir.glob("*.json"))
