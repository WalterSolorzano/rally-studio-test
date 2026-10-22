"""Pruebas de la paleta de marca del modulo design/.

La logica vive en design/shared.js (funciones puras) para poder probarla
con pixeles sinteticos: se cargan en Node con tests/js/palette_probe.js.
El backend (scripts/rally_service.py) replica el mismo saneo, asi que
tambien se prueba su version en Python.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

NODE = shutil.which("node")
PROBE = Path(__file__).parent / "js" / "palette_probe.js"
RAIZ = Path(__file__).parent.parent

pytestmark = pytest.mark.skipif(NODE is None, reason="node no disponible para probar la paleta")


def correr(comando, arg=None):
    args = [NODE, str(PROBE), comando]
    if arg is not None:
        args.append(json.dumps(arg, ensure_ascii=False))
    salida = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", timeout=30)
    assert salida.returncode == 0, salida.stderr
    return json.loads(salida.stdout)


def extraer(pixeles):
    """pixeles = [(hex, repeticiones)] -> {raw, limpio}"""
    datos = correr("extraer", {"pixels": [[hexa, rep] for hexa, rep in pixeles]})
    assert datos["limpio"] is not None
    return datos


def es_morado(hexa):
    return correr("tono", hexa)["morado"]


def contraste(a, b):
    return correr("contraste", [a, b])["ratio"]


# --- extraccion local de pixels ---

def test_logo_con_negro_conserva_el_negro_como_tinta():
    datos = extraer([("#000000", 400), ("#0866F5", 300)])
    assert datos["raw"]["hasBlack"] is True
    assert datos["limpio"]["primary"].lower() == "#000000"


def test_negro_casi_negro_tambien_cuenta_como_negro():
    datos = extraer([("#111111", 400), ("#0866F5", 300)])
    assert datos["raw"]["hasBlack"] is True
    assert datos["limpio"]["primary"].lower() == "#111111"


def test_logo_sin_negro_no_inventa_negro():
    datos = extraer([("#F97316", 400)])
    assert datos["raw"]["hasBlack"] is False
    assert datos["limpio"]["primary"].lower() != "#000000"


def test_morado_nunca_aparece_en_ningun_rol_de_la_paleta():
    for pixeles in (
        [("#7C3AED", 400)],
        [("#000000", 400), ("#7C3AED", 300)],
        [("#7C3AED", 300), ("#22C55E", 200)],
    ):
        limpio = extraer(pixeles)["limpio"]
        for rol in ("bg", "primary", "secondary", "accent"):
            assert es_morado(limpio[rol]) is False, f"{rol} = {limpio[rol]} es morado"


def test_acento_contrasta_con_el_fondo_y_con_la_tinta():
    for pixeles in (
        [("#000000", 400), ("#7C3AED", 300)],
        [("#000000", 400), ("#0866F5", 300)],
        [("#7C3AED", 400)],
    ):
        limpio = extraer(pixeles)["limpio"]
        assert contraste(limpio["accent"], limpio["bg"]) >= 3
        assert contraste(limpio["accent"], limpio["primary"]) >= 2


def test_logo_con_negro_y_az_propone_az_de_marca_y_no_morado():
    limpio = extraer([("#000000", 400), ("#0866F5", 300)])["limpio"]
    assert limpio["primary"].lower() == "#000000"
    assert es_morado(limpio["accent"]) is False
    assert contraste(limpio["accent"], limpio["bg"]) >= 3


def test_logo_monocromatico_morado_cae_en_tinta_neutra_y_marca_azul():
    limpio = extraer([("#7C3AED", 400)])["limpio"]
    assert es_morado(limpio["primary"]) is False
    assert es_morado(limpio["accent"]) is False
    assert contraste(limpio["accent"], limpio["bg"]) >= 3


def test_fondo_2_es_una_superficie_clara():
    limpio = extraer([("#000000", 400), ("#0866F5", 300)])["limpio"]
    assert contraste(limpio["secondary"], limpio["bg"]) <= 1.4


# --- saneo de la paleta que llega de la IA ---

def test_saneo_de_paleta_ia_conserva_el_negro_indicado_en_text():
    limpio = correr(
        "saneo-crudo",
        {"primary": "#7C3AED", "secondary": "#7C3AED", "accent": "#7C3AED", "bg": "#ffffff", "text": "#111111"},
    )
    assert limpio["primary"].lower() == "#111111"
    for rol in ("bg", "primary", "secondary", "accent"):
        assert es_morado(limpio[rol]) is False


def test_saneo_de_paleta_ia_pide_contraste_real_en_el_acento():
    limpio = correr(
        "saneo-crudo",
        {"primary": "#0866F5", "secondary": "#0F766E", "accent": "#0866F5", "bg": "#ffffff", "text": "#111111"},
    )
    assert contraste(limpio["accent"], limpio["bg"]) >= 3
    assert contraste(limpio["accent"], limpio["primary"]) >= 2


def test_saneo_de_paleta_ia_sin_negro_no_fabrica_negro():
    limpio = correr(
        "saneo-crudo",
        {"primary": "#F97316", "secondary": "#0866F5", "accent": "#22C55E", "bg": "#ffffff", "text": "#333333"},
    )
    assert limpio["primary"].lower() != "#000000"


# --- sintaxis ---

@pytest.mark.parametrize("archivo", ["design/shared.js", "design/kit.js", "design/thumb.js"])
def test_javascript_del_diseno_pasa_el_parseo(archivo):
    salida = subprocess.run([NODE, "--check", str(RAIZ / archivo)], capture_output=True, text=True, timeout=30)
    assert salida.returncode == 0, salida.stderr


# --- el backend replica el mismo saneo ---

def test_backend_sanea_la_paleta_sin_morado():
    sys.path.insert(0, str(RAIZ / "scripts"))
    import rally_service as rs  # noqa: E402

    limpia, _ = rs.sanitize_design_palette(
        {"primary": "#7C3AED", "secondary": "#7C3AED", "accent": "#7C3AED", "bg": "#ffffff", "text": "#111111"}
    )
    for valor in limpia.values():
        rgb = rs._hex_to_rgb(valor)
        assert rs._is_purple(rgb) is False, valor
    assert limpia["primary"].lower() == "#111111"


def test_backend_elige_color_de_marca_que_contrasta():
    sys.path.insert(0, str(RAIZ / "scripts"))
    import rally_service as rs  # noqa: E402

    limpia, _ = rs.sanitize_design_palette(
        {"primary": "#0866F5", "secondary": "#0F766E", "accent": "#0866F5", "bg": "#ffffff", "text": "#111111"}
    )
    accent = rs._hex_to_rgb(limpia["accent"])
    primary = rs._hex_to_rgb(limpia["primary"])
    bg = rs._hex_to_rgb(limpia["bg"])
    assert rs._contrast(accent, bg) >= 3
    assert rs._contrast(accent, primary) >= 2
