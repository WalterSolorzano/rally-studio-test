from tests.support import auth, bootstrap, call, claim


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
