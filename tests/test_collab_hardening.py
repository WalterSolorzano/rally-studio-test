import urllib.error
import urllib.request

from tests.support import auth, bootstrap, call


def _status(url):
    try:
        with urllib.request.urlopen(url, timeout=6) as resp:
            resp.read(64)
            return resp.status
    except urllib.error.HTTPError as exc:
        return exc.code


def _upload(url, headers=None, payload=b"PNG"):
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("X-Asset-Name", "prueba.svg")
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            resp.read(64)
            return resp.status
    except urllib.error.HTTPError as exc:
        return exc.code


def test_private_project_files_are_not_served(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    call("POST", base + "/api/sections/pautado.problema?project=equipo01",
         {"data": {"text": "secreto"}, "base_version": 0},
         headers=auth(boot["admin_token"]))

    assert _status(base + "/data/state.json") == 404
    assert _status(base + "/data/members.db") == 404
    assert _status(base + "/data/sections.db") == 404


def test_asset_upload_requires_a_session(servidor):
    base, _ = servidor
    bootstrap(base, "equipo01", "Ana")
    assert _upload(base + "/api/asset-upload?project=equipo01") == 401


def test_invalid_project_id_is_rejected(servidor):
    base, _ = servidor
    status, _, _ = call("GET", base + "/api/sections?project=mal%2Fid")
    assert status == 400


def test_empty_project_does_not_return_another_projects_state(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    call("POST", base + "/api/sections/pautado.problema?project=equipo01",
         {"data": {"text": "solo de equipo01"}, "base_version": 0},
         headers=auth(boot["admin_token"]))

    status, body, _ = call("GET", base + "/api/state?project=equipo02")
    assert status == 200
    assert body["state"] == {}


def test_ai_writes_keep_their_authorship(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    status, _, _ = call("POST", base + "/api/sections/pautado.problema?project=equipo01",
                        {"data": {"text": "texto de la IA"}, "base_version": 0,
                         "actor": "IA:gen_pautado", "actor_id": "ia"},
                        headers=auth(boot["admin_token"]))
    assert status == 200

    _, body, _ = call("GET", base + "/api/events?project=equipo01",
                      headers=auth(boot["admin_token"]))
    assert body["events"][-1]["actor"] == "IA:gen_pautado"


def test_same_hostname_behind_a_proxy_is_allowed(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    port = base.rsplit(":", 1)[1]
    host = "rally.local:" + port
    status, body, _ = call(
        "POST", base + "/api/project/claim",
        {"token": boot["join_token"], "name": "Luis", "device_id": "cli-luis"},
        headers={"Host": host}, origin="http://" + host,
    )
    assert status == 200, body
