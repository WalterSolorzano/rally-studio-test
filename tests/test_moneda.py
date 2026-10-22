import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
RUTA_SCRIPTS = RAIZ / "scripts"
if str(RUTA_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(RUTA_SCRIPTS))

from moneda import contexto, costo_unitario, costo_unitario_usd, formato  # noqa: E402


def test_nacional_usa_cordobas_y_convierte():
    ctx = contexto({"rally_type": "nacional", "exchange_rate_bcn": 36.5})
    assert ctx["code"] == "NIO"
    assert ctx["simbolo"] == "C$"
    assert costo_unitario({"unit_cost_usd": 10}, ctx) == 365.0
    assert formato(3650, ctx) == "C$3,650.00"


def test_nacional_respeta_precio_en_cordobas():
    ctx = contexto({"rally_type": "nacional", "exchange_rate_bcn": 36.5})
    item = {"unit_cost_usd": 10, "unit_cost_nio": 350}
    assert costo_unitario(item, ctx) == 350
    assert round(costo_unitario_usd(item, ctx), 4) == 10


def test_nacional_sin_tasa_no_inventa_conversion():
    ctx = contexto({"rally_type": "nacional"})
    assert ctx["code"] == "NIO"
    assert ctx["tasa"] is None
    assert costo_unitario({"unit_cost_usd": 10}, ctx) is None
    assert ctx["advertencia"]


def test_latam_siempre_usd():
    ctx = contexto({"rally_type": "latam", "exchange_rate_bcn": 36.5})
    assert ctx["code"] == "USD"
    assert ctx["tasa"] is None
    assert costo_unitario({"unit_cost_usd": 12.8, "unit_cost_nio": 500}, ctx) == 12.8
    assert formato(4850, ctx) == "$4,850.00"


def test_rally_vacio_avisa_y_muestra_usd():
    ctx = contexto({})
    assert ctx["definido"] is False
    assert ctx["code"] == "USD"
    assert "rally_type" in ctx["advertencia"]
