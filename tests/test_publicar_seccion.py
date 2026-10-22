import pytest

from tests.support import auth, bootstrap, call
from scripts.publicar_seccion import Conflicto, publicar


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
