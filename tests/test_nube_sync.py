"""Pruebas de la nube de sincronizacion de archivos (Fase 2.1).

No toca la red: NubeStore directo + handler HTTP simulado por rama de enrutado.
"""
import importlib.util
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TMP = Path(tempfile.mkdtemp(prefix="nube_test_"))
os.environ["RALLY_DATA_DIR"] = str(TMP / "data")

spec = importlib.util.spec_from_file_location("rally_service", ROOT / "scripts" / "rally_service.py")
rs = importlib.util.module_from_spec(spec)
sys.modules["rally_service"] = rs
spec.loader.exec_module(rs)

from importlib import import_module

# Clases del MISMO modulo nube_store que el ya importe rally_service,
# sin importar como se haya resuelto la ruta (top-level vs paquete scripts).
_nube_mod = None
for nombre in ("nube_store", "scripts.nube_store"):
    mod = rs.sys.modules.get(nombre)
    if mod is not None and hasattr(mod, "NubeConflict"):
        _nube_mod = mod
        break
assert _nube_mod is not None, "nube_store no quedo importado por rally_service"
NubeStore, NubeConflict, NubeError = _nube_mod.NubeStore, _nube_mod.NubeConflict, _nube_mod.NubeError
SYNCABLE_PATHS = _nube_mod.SYNCABLE_PATHS

STORE = NubeStore(TMP / "data2" / "nube.db")


class FakeHeaders(dict):
    def get(self, key, default=None):
        for k, v in self.items():
            if k.lower() == key.lower():
                return v
        return default


class FakeHandler:
    def __init__(self, ip="127.0.0.1", token=""):
        headers = {"X-Forwarded-For": ""} if ip != "127.0.0.1" else {}
        if token:
            headers["X-Rally-Sync-Token"] = token
        self.headers = FakeHeaders(headers)
        self.client_address = (ip, 5555)


def test_rutas_permitidas_logicas():
    assert rs.NUBE_STORE.normalize_path("brief.json") == "brief.json"
    assert "budget/budget.json" in SYNCABLE_PATHS
    for mal in ("../../etc/passwd", "tests/secret.py", "dashboard/app.js", ""):
        try:
            rs.NUBE_STORE.normalize_path(mal)
        except Exception:
            pass
        else:
            assert False, f"la ruta ilegal {mal!r} debio rebotar"

def test_push_nuevo_archivo():
    res = STORE.push("main", "brief.json", '{"titulo": "rally"}', "", "agente_local:opencode")
    assert res["version"] == 1
    data = STORE.read_file("main", "brief.json")
    assert json.loads(data["content"])["titulo"] == "rally"
    assert data["actor"] == "agente_local:opencode"


def test_push_conflicto_sin_pisar():
    try:
        STORE.push("main", "brief.json", '{"titulo": "otro"}', "", "otro-actor")
    except NubeConflict as cond:
        assert cond.remote["content"] == '{"titulo": "rally"}'
        assert cond.remote["actor"] == "agente_local:opencode"
    else:
        assert False, "sin old_hash con archivo existente debio dar conflicto"
    assert STORE.read_file("main", "brief.json")["content"] == '{"titulo": "rally"}'


def test_push_con_hash_correcto_avanza():
    sha_actual = STORE.read_file("main", "brief.json")["sha256"]
    res = STORE.push("main", "brief.json", '{"titulo": "v2"}', sha_actual, "humano:web")
    assert res["version"] == 2
    assert STORE.read_file("main", "brief.json")["actor"] == "humano:web"


def test_feed_de_cambios():
    feed = STORE.changes("main", since=0)
    assert feed["cursor"] >= 2
    rutas = [c["path"] for c in feed["changes"]]
    assert "brief.json" in rutas
    # descarte: archivo de OTRO rally no aparece
    assert not [c for c in feed["changes"] if c["path"] == "budget/budget.json" and c["actor"] == "x-ajeno"]


def test_contenido_demasidado_rebotado():
    try:
        STORE.push("main", "script/script.md", "x" * (512 * 1024 + 1), "", "gordo")
    except NubeError:
        pass
    else:
        assert False, "el archivo de >512 KB debio rebotar"


def test_proyectos_banlizados_por_rally_id():
    STORE.push("rally-b", "brief.json", '{"b": 1}', "", "equipo-b")
    assert STORE.read_file("main", "brief.json")["content"] == '{"titulo": "v2"}'
    assert json.loads(STORE.read_file("rally-b", "brief.json")["content"])["b"] == 1


def test_borrado_con_conflicto_y_feed():
    try:
        STORE.delete_file("main", "brief.json", "hash-malo", "agente")
    except NubeConflict:
        pass
    else:
        assert False, "borrar con hash equivocado debio dar conflicto"
    sha = STORE.read_file("main", "brief.json")["sha256"]
    STORE.delete_file("main", "brief.json", sha, "agente")
    assert STORE.read_file("main", "brief.json") is None


def test_autorizacion_del_sync():
    # Sin token configurado: solo localhost
    os.environ.pop("RALLY_SYNC_TOKEN", None)
    assert rs.sync_authorized(FakeHandler(ip="127.0.0.1"))
    assert not rs.sync_authorized(FakeHandler(ip="203.0.113.9"))
    # Con token configurado (isla publicada): obligatorio y correcto
    os.environ["RALLY_SYNC_TOKEN"] = "freellm-clave-prueba"
    assert rs.sync_authorized(FakeHandler(ip="127.0.0.1", token="freellm-clave-prueba"))
    assert not rs.sync_authorized(FakeHandler(ip="127.0.0.1", token="otra"))
    # el token es la credencial: IP externa con token correcto pasa, con token malo no
    assert rs.sync_authorized(FakeHandler(ip="203.0.113.9", token="freellm-clave-prueba"))
    assert not rs.sync_authorized(FakeHandler(ip="203.0.113.9", token="clava-mala"))
    os.environ.pop("RALLY_SYNC_TOKEN", None)


def test_buzon_rutas_dinamicas():
    # el buzón cooperativo entra al mismo allow-list por prefijo
    assert rs.NUBE_STORE.normalize_path("content/proy-a1.json") == "content/proy-a1.json"
    assert rs.NUBE_STORE.normalize_path(
        "content_decisiones/proy-a1.json") == "content_decisiones/proy-a1.json"
    for mal in ("content/..%2F.json", "content/Id_con_mayus.json",
                "content/nombre-sin-json", "content_decisiones/a/b.json",
                "content/../secret.json", "content//"):
        try:
            rs.NUBE_STORE.normalize_path(mal)
        except Exception:
            pass
        else:
            assert False, f"la ruta de buzon ilegal {mal!r} debio rebotar"


def test_push_del_sobre_y_decision_fluyen_en_feed():
    sobre = json.dumps({"id": "sobre-check", "tab": "pautado", "slot": "problema",
                        "kind": "text", "payload": {"text": "hola"}, "simulated": False})
    lang = STORE.push("main", "content/sobre-check.json", sobre, "", "agente_local:opencode")
    assert lang["path"] == "content/sobre-check.json"
    # decision web con existe-ya (idempotente con hash actual)
    decis = json.dumps({"action": "discard", "id": "sobre-check", "decision_by": "humano:web"})
    STORE.push("main", "content_decisiones/sobre-check.json", decis, "",
               "humano:web")
    feed = STORE.changes("main", since=0)
    rutas = [c["path"] for c in feed["changes"]]
    assert "content/sobre-check.json" in rutas
    assert "content_decisiones/sobre-check.json" in rutas


def test_espejo_del_buzon_en_disco():
    sobre = '{"id":"sobre-mirror","tab":"pautado","slot":"solucion","kind":"text",' \
            '"payload":{},"simulated":true}'
    assert rs.espejo_nube_contenido("content/sobre-mirror.json", sobre) is True
    fich = rs.DATA_DIR / "content" / "sobre-mirror.json"
    assert fich.is_file() and json.loads(fich.read_text(encoding="utf-8"))["id"] == "sobre-mirror"
    # fuera del buzón: no toca el disco
    assert rs.espejo_nube_contenido("brief.json", '{"falso": 1}') is False
    assert not (rs.DATA_DIR / "brief_fake_mirror.json").exists()
    # decision espejada
    assert rs.espejo_nube_contenido(
        "content_decisiones/sobre-mirror.json", '{"action":"apply","id":"sobre-mirror"}') is True
    assert (rs.DATA_DIR / "content_decisiones" / "sobre-mirror.json").is_file()
    # borrar sobre espejado
    assert rs.espejo_nube_contenido("content/sobre-mirror.json", None) is True
    assert not fich.exists()


def test_pipeline_buzon_apply_baja_y_aplica():
    # simula el ciclo completo en una raiz limpia: push del sobre por el puente,
    # aceptación web (como handle_post_content la deja en la nube) y pull local.
    raiz = TMP / "raiz_buzon"
    data = raiz / "dashboard" / "data"
    sobre_id = "sobre-e2e"
    sobre = json.dumps({"id": sobre_id, "tab": "pautado", "slot": "problema",
                        "kind": "text", "payload": {"text": "x"}, "simulated": False})
    lang = STORE.push("main", "content/" + sobre_id + ".json", sobre, "", "puente")
    # decision web (hash vigente para idempotencia, como hace el motor en la web)
    decis = json.dumps({"action": "apply", "id": sobre_id, "decision_by": "humano:web"})
    STORE.push("main", "content_decisiones/" + sobre_id + ".json", decis, "", "humano:web")
    STORE.delete_file("main", "content/" + sobre_id + ".json", lang["sha256"], "humano:web")

    # el sobre baja al local como lo dejaría root/data/content (write directo a disco)
    destino = data / "content" / (sobre_id + ".json")
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(sobre, encoding="utf-8")
    # decision local: el mismo metodo que usa el puente al bajar el feed
    sys.path.insert(0, str(ROOT / "scripts"))
    from sincronizar_nube import _aplicar_decision_local  # noqa: E402
    assert _aplicar_decision_local(data, decis) is True
    assert not destino.exists()
    aplicados = list((data / "applied").glob(sobre_id + ".json"))
    assert aplicados and json.loads(aplicados[0].read_text(encoding="utf-8"))["id"] == sobre_id
    # idempotente: volver a aplicar no rompe
    assert _aplicar_decision_local(data, decis) is True


def test_presencia_viva_y_ttl():
    rs._PRESENCE.clear()
    rs.presence_beat("agente", tab="pautado", editing="pautado.problema", now=1_000)
    rs.presence_beat("humano", tab="budget", editing="", now=1_001)
    listo = rs.presence_list(now=1_005)
    nombres = [a["actor"] for a in listo["actors"]]
    assert nombres == sorted(["agente", "humano"])
    agente = [a for a in listo["actors"] if a["actor"] == "agente"][0]
    assert agente["editing"] == "pautado.problema" and agente["tab"] == "pautado"
    # pasados 20 s el latido expira
    expirado = rs.presence_list(now=1_000 + int(rs.PRESENCE_TTL_SEC) + 5)
    assert expirado["actors"] == []


if __name__ == "__main__":
    for nombre, fn in sorted(globals().items()):
        if nombre.startswith("test_") and callable(fn):
            fn()
            print(f"  OK  {nombre}")
    print("Todas las pruebas de la nube pasaron.")
