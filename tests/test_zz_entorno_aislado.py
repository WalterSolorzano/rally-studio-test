"""Aislamiento del entorno de pruebas.

Los tests que simulan la IA parchean `urllib.request.urlopen` y cambian
variables de entorno. Si esos parches no se revierten, el fixture `servidor`
de tests/conftest.py (que lee /health con urllib.request.urlopen) empieza a
fallar en todos los archivos que se ejecutan despues, y la suite se cuelga
30 s por cada test.

Este archivo se llama test_zz_* a proposito: pytest ordena los archivos por
nombre, asi que corre al final y verifica que el entorno global quedo limpio.
"""
import os
import urllib.request


def test_urlopen_global_sigue_siendo_el_estandar():
    import inspect

    fn = urllib.request.urlopen
    assert fn.__module__ == "urllib.request", (
        "urllib.request.urlopen sigue parcheado por un test anterior: %s" % fn
    )
    assert "url" in inspect.signature(fn).parameters


def test_vars_de_ia_no_quedan_en_el_entorno():
    # Valores de simulacion de tests/test_ai_isla.py: si sobreviven, el
    # servidor de los tests hereda un endpoint falso.
    for var in ("RALLY_AI_URL", "RALLY_AI_KEY", "RALLY_AI_KEYS", "RALLY_AI_MODEL"):
        valor = os.environ.get(var, "")
        assert "provider.example" not in valor, (
            "%s quedo con el endpoint de simulacion y se hereda al servidor" % var
        )
        assert valor not in ("k1", "k2", "clave-principal", "demo-model"), (
            "%s quedo con la clave de simulacion" % var
        )
