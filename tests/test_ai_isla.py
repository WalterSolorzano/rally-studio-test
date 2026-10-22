"""Pruebas del limite de uso y la rotacion de claves de la isla.

No toca la red: simula el handler HTTP y el endpoint de IA.
"""
import importlib.util
import os
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("rally_service", ROOT / "scripts" / "rally_service.py")
rs = importlib.util.module_from_spec(spec)
sys.modules["rally_service"] = rs
spec.loader.exec_module(rs)


class FakeHeaders(dict):
    def get(self, key, default=None):
        for k, v in self.items():
            if k.lower() == key.lower():
                return v
        return default


class FakeHandler:
    def __init__(self, ip="203.0.113.9", fwd="", actor=""):
        data = {}
        if fwd:
            data["X-Forwarded-For"] = fwd
        if actor:
            data["X-Rally-Actor"] = actor
        self.headers = FakeHeaders(data)
        self.client_address = (ip, 5555)


def test_rate_limit_por_ip():
    rs.AI_RATE_LIMIT = 3
    rs.AI_RATE_WINDOW = 60
    rs.AI_RATE_STATE.clear()
    rs.AI_USER_RATE_LIMIT = 0
    h = FakeHandler(ip="198.51.100.7")
    for i in range(3):
        ok, _, _ = rs.ai_rate_check(h)
        assert ok, f"peticion {i} deberia pasar"
    ok, extra, msg = rs.ai_rate_check(h)
    assert not ok, "la 4a peticion debe rebotar"
    assert "Retry-After" in extra
    assert msg, "debe explicar el limite en espanol"
    # Otra IP no se ve afectada.
    ok2, _, _ = rs.ai_rate_check(FakeHandler(ip="198.51.100.8"))
    assert ok2, "otra IP tiene su propia cuota"


def test_ventana_expira():
    rs.AI_RATE_LIMIT = 1
    rs.AI_RATE_WINDOW = 60
    rs.AI_RATE_STATE.clear()
    rs.AI_USER_RATE_LIMIT = 0
    h = FakeHandler(ip="198.51.100.9")
    assert rs.ai_rate_check(h)[0]
    assert not rs.ai_rate_check(h)[0]
    # Se simula que paso la ventana.
    key = list(rs.AI_RATE_STATE.keys())[0]
    rs.AI_RATE_STATE[key] = (rs.AI_RATE_STATE[key][0] - 61, rs.AI_RATE_STATE[key][1])
    assert rs.ai_rate_check(h)[0], "tras la ventana vuelve a pasar"


def test_respeta_proxy():
    rs.AI_RATE_LIMIT = 1
    rs.AI_RATE_WINDOW = 60
    rs.AI_RATE_STATE.clear()
    rs.AI_USER_RATE_LIMIT = 0
    a = FakeHandler(ip="10.0.0.1", fwd="198.51.100.20")
    b = FakeHandler(ip="10.0.0.2", fwd="198.51.100.20")
    assert rs.ai_rate_check(a)[0]
    assert not rs.ai_rate_check(b)[0], "X-Forwarded-For manda sobre la IP del socket"


def test_cuota_por_usuario_rebota_y_aisla():
    """Fase 2.4: identidad X-Rally-Actor → cuota propia; sin header no toca."""
    rs.AI_RATE_LIMIT = 0            # capa IP desactivada; solo manda la de usuario
    rs.AI_RATE_WINDOW = 60
    rs.AI_USER_RATE_LIMIT = 2
    rs.AI_RATE_STATE.clear()
    rs.AI_USER_RATE_STATE.clear()
    # Sin header de actor: no toca la cuota de usuario.
    ok, extra, _ = rs.ai_rate_check(FakeHandler(ip="198.51.100.30"))
    assert ok and "X-RateLimit-Scope" not in extra, "sin actor no hay cuota por usuario"
    # Dos peticiones de 'ana' pasan (en IPs distintas), la 3a rebota por usuario.
    assert rs.ai_rate_check(FakeHandler(ip="198.51.100.31", actor="ana"))[0]
    assert rs.ai_rate_check(FakeHandler(ip="198.51.100.32", actor="ana"))[0]
    ok, extra, msg = rs.ai_rate_check(FakeHandler(ip="198.51.100.33", actor="ana"))
    assert not ok
    assert extra.get("X-RateLimit-Scope") == "usuario"
    assert extra.get("X-RateLimit-Remaining") == "0"
    assert "usuario" in msg and msg.strip(), "debe explicar el limite por usuario"
    # Otra identidad en la misma IP de ana: no agotada por ella.
    ok2, _, _ = rs.ai_rate_check(FakeHandler(ip="198.51.100.31", actor="luis"))
    assert ok2, "la cuota es por usuario, no por IP"
    # 'ana' en su 1a IP tiene su contador lleno igualmente.


def test_cuota_por_usuario_convive_con_la_por_ip():
    """Ambas capas: la IP manda en headers, el usuario cuenta aparte."""
    rs.AI_RATE_LIMIT = 2
    rs.AI_RATE_WINDOW = 60
    rs.AI_USER_RATE_LIMIT = 5
    rs.AI_RATE_STATE.clear()
    rs.AI_USER_RATE_STATE.clear()
    h = FakeHandler(ip="198.51.100.40", actor="ana")
    ok1, extra1, _ = rs.ai_rate_check(h)
    assert ok1
    # La IP por delante limita a 2: la 3a rebota aunque el usuario tenga 5.
    rs.ai_rate_check(h)
    ok3, extra3, msg3 = rs.ai_rate_check(h)
    assert not ok3, "la capa IP sigue mandando cuando ambas estan activas"
    assert "Retry-After" in extra3 and extra3.get("X-RateLimit-Remaining") == "0"
    assert rs.AI_USER_RATE_STATE["ana"][1] == 3, "el contador de usuario avanzo (2 ok + 1 que la IP rebotó)"


def test_limite_desactivado():
    rs.AI_RATE_LIMIT = 0
    rs.AI_RATE_STATE.clear()
    h = FakeHandler()
    for _ in range(50):
        assert rs.ai_rate_check(h)[0], "sin limite no debe rebotar"


def test_rotacion_de_claves(monkeypatch):
    """Si la primera clave da 429, se prueba la siguiente."""
    rs.AI_RATE_LIMIT = 0
    intentos = []

    class FakeResp:
        def __init__(self, payload):
            self._p = payload

        def read(self):
            return json_dumps(self._p).encode("utf-8")

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    def fake_urlopen(req, timeout=None):
        key = req.headers.get("Authorization", "")
        intentos.append(key)
        if len(intentos) == 1:
            raise FakeError("429 rate limit exceeded")
        return FakeResp({"choices": [{"message": {"content": "ok desde la segunda clave"}}]})

    class FakeError(Exception):
        def read(self):
            return b"429 Too Many Requests"

    # monkeypatch restaura urllib.request.urlopen y las variables de entorno
    # al terminar el test. Sin esto, el parche global se queda puesto y el
    # fixture `servidor` (que usa urllib.request.urlopen para leer /health)
    # empieza a fallar en los archivos de test siguientes.
    monkeypatch.setattr(rs.urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setenv("RALLY_AI_URL", "https://provider.example/v1")
    monkeypatch.setenv("RALLY_AI_KEY", "clave-principal")
    monkeypatch.setenv("RALLY_AI_KEYS", "clave-respaldo-1,clave-respaldo-2")
    monkeypatch.setenv("RALLY_AI_MODEL", "demo-model")

    env = rs._env_endpoint_config()
    assert env["keys"][0] == "clave-principal"
    assert "clave-respaldo-1" in env["keys"]

    texto, err = rs._endpoint_chat_raw([{"role": "user", "content": "hola"}], 5, "demo-model", "test")
    assert err is None, f"no deberia fallar: {err}"
    assert texto == "ok desde la segunda clave"
    assert len(intentos) == 2, f"debio rotar una vez, intentos={intentos}"


def json_dumps(obj):
    import json
    return json.dumps(obj)


def test_no_rota_errores_de_contenido(monkeypatch):
    """Un 400 no debe cambiar de clave (no es cuota)."""
    rs.AI_RATE_LIMIT = 0
    intentos = []

    class FakeResp:
        def read(self):
            return b'{"choices":[]}'

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    class FakeError(Exception):
        def read(self):
            return b"400 Bad Request: prompt invalido"

    def fake_urlopen(req, timeout=None):
        intentos.append(req.headers.get("Authorization", ""))
        raise FakeError("400")

    monkeypatch.setattr(rs.urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setenv("RALLY_AI_URL", "https://provider.example/v1")
    monkeypatch.setenv("RALLY_AI_KEY", "k1")
    monkeypatch.setenv("RALLY_AI_KEYS", "k2")
    texto, err = rs._endpoint_chat_raw([{"role": "user", "content": "x"}], 5, "m", "test")
    assert err and "400" in err
    assert len(intentos) == 1, "no debe rotar ante errores que no son de cuota"
