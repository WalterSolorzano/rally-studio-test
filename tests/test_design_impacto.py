"""Pruebas del modulo Impacto y Plan Pais (design/).

La logica pura vive en design/shared.js (estado impacto, parser ODS) y en
design/impacto.js (composicion, animacion, IA). Se cargan en Node con
tests/js/impacto_probe.js aunque el modulo siga sin existencia completa:
la sonda carga los archivos si estan en disco.
"""
import json
import shutil
import subprocess
from pathlib import Path

import pytest

NODE = shutil.which("node")
PROBE = Path(__file__).parent / "js" / "impacto_probe.js"
RAIZ = Path(__file__).parent.parent

pytestmark = pytest.mark.skipif(NODE is None, reason="node no disponible para probar el modulo impacto")


def correr(comando, arg=None):
    args = [NODE, str(PROBE), comando]
    if arg is not None:
        args.append(json.dumps(arg, ensure_ascii=False))
    salida = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", timeout=30)
    assert salida.returncode == 0, salida.stderr
    return json.loads(salida.stdout)


# --- parser tolerante de ODS (shared.js: odsOf) ---

@pytest.mark.parametrize("texto,esperado", [
    ("ODS 12", 12),
    ("ODS11", 11),
    ("ods 9", 9),
    ("", None),
    ("Reto 3", None),
])
def test_odsof_parsea_variantes_con_digitos(texto, esperado):
    datos = correr("odsof-lote", [texto])[0]
    assert datos == esperado


# --- estado impacto por defecto (shared.js: impactoPorDefecto) ---

def test_impacto_por_defecto_cumple_el_contrato():
    datos = correr("por-defecto")
    assert "error" not in datos
    assert datos["claves"] == {
        "preset": True, "dur": True, "odsOn": True, "textos": True,
        "plan": True, "narracion": True, "anim": True,
    }
    assert datos["plan"] is True
    assert datos["animOK"] is True


# --- normalizacion preserva impacto (shared.js: normalizeIdentity) ---

def test_normalize_identity_preserva_impacto_y_rellena_defaults():
    identidad = {"team": {"name": "x", "university": "UNI", "city": "Managua"}, "pal": {}, "impacto": {"odsOn": {"12": False}}}
    datos = correr("normalize", identidad)
    assert datos["impact"] is True
    assert datos["impactoCompleto"] is True


# --- Task 4: composicion de laminas y pintadores ---

ESTADO = {
    "imp": {
        "preset": "bloques", "textos": {}, "narracion": {},
        "plan": {"modo": "", "programas": ["Red de Ciudades Creativas"], "municipio": "Matagalpa", "cifra": "240 familias", "texto": ""},
        "anim": {}, "dur": 5, "odsOn": {},
    },
    "pal": {"bg": "#FFFFFF", "bg2": "#F0F6FF", "ac": "#0866F5", "ink": "#0D1B35", "mu": "#5C7193", "gl": "#DCE7F5"},
    "fonts": {"t": "Plus Jakarta Sans", "b": "Barlow", "l": "JetBrains Mono"},
    "team": {"name": "Rally", "university": "UNI", "city": "Managua"},
    "modo": "nacional",
    "brief": {},
}


def test_odsactivos_brief_vacio_da_17_off():
    filas = correr("ods-activos", [{}, []])["filas"]
    assert len(filas) == 17
    assert all(f["on"] is False and f["brief"] is False for f in filas)


def test_odsactivos_marca_brief_y_respeta_override():
    filas = correr("ods-activos", [{"impacto": {"odsOn": {"9": False}}}, ["ODS 12", "ODS 9"]])["filas"]
    marco = {f["id"]: f for f in filas}
    assert marco[12]["on"] is True and marco[12]["brief"] is True
    assert marco[9]["on"] is False and marco[9]["brief"] is True
    assert marco[1]["on"] is False and marco[1]["brief"] is False
    # breve primero, resto ascendente:
    ids = [f["id"] for f in filas]
    assert ids.index(12) < ids.index(1)
    assert ids.index(1) < ids.index(2)


def test_modoe_fectivo_override_gana():
    datos = correr("modo", [{"impacto": {"plan": {"modo": "latam"}}, "rallyType": "nacional"}, {"rally_type": "nacional"}])
    assert datos["modo"] == "latam"
    datos = correr("modo", [{"rallyType": "latam"}, {}])
    assert datos["modo"] == "latam"
    datos = correr("modo", [{"impacto": {"plan": {"modo": ""}}}, {"rally_type": "nacional"}])
    assert datos["modo"] == "nacional"


def test_tinta_sobre_amarillos_contrasta():
    for hexa in ("#DDA63A", "#FCC30B", "#E5243B"):
        datos = correr("tinta", hexa)
        assert datos["ratio"] >= 4.5, hexa


def test_componer_mosaico_usa_colores_y_nombres():
    datos = correr("componer", {"tipo": "mosaico", "estado": ESTADO, "odsSel": [{"id": 1}, {"id": 2}]})
    assert datos["n"] > 0
    assert "#E5243B" in datos["rectColores"]
    assert "#DDA63A" in datos["rectColores"]
    texto = " ".join(datos["textos"])
    assert "ODS 1" in texto and "Hambre Cero" in texto


def test_componer_ficha_y_plan_producen_texto():
    ficha = correr("componer", {"tipo": "ficha", "estado": ESTADO, "odsSel": [{"id": 2}]})
    assert "Hambre Cero" in " ".join(ficha["textos"])
    plano = correr("componer", {"tipo": "plan", "estado": ESTADO, "odsSel": []})
    t = " ".join(plano["textos"])
    assert "PNDH" in t or "Plan Nacional" in t
    assert "Matagalpa" in t and "240 familias" in t


def test_pintarcanvas_con_mock_no_lanza():
    for tipo, sel in (("mosaico", [{"id": 1}, {"id": 2}]), ("ficha", [{"id": 2}]), ("plan", [])):
        datos = correr("canvas", {"tipo": tipo, "estado": ESTADO, "odsSel": sel, "escala": 2})
        assert "fill" in datos["usados"], tipo
        assert "fillText" in datos["usados"], tipo


# --- Task 5: timeline animada ---

def test_tamanosfase_resto_hold():
    datos = correr("fases", ["banda", "pulso", "fade", 5])["fases"]
    assert round(datos["tIn"], 2) == 1.0
    assert round(datos["tEn"], 2) == 1.5
    assert round(datos["tOut"], 2) == 1.0


def test_tamanosfase_sin_enfasis_ni_salida():
    datos = correr("fases", ["fade", "none", "none", 5])["fases"]
    assert round(datos["tIn"], 2) == 1.0
    assert datos["tEn"] == 0
    assert datos["tOut"] == 0


def test_tamanosfase_duracion_fuera_de_rango():
    datos = correr("fases", ["fade", "none", "none", 2])
    assert datos["err"] == "RangeError"


def test_faseen_por_tramos():
    # tIn=1.0, tEn=1.5 ([1.0,2.5) enfasis), hold [2.5,4), salida [4,5), fin t>=5
    assert correr("fases", ["banda", "pulso", "fade", 5, 0])["fase"] == "in"
    assert correr("fases", ["banda", "pulso", "fade", 5, 2])["fase"] == "enf"
    assert correr("fases", ["banda", "pulso", "fade", 5, 3])["fase"] == "hold"
    assert correr("fases", ["banda", "pulso", "fade", 5, 5])["fase"] == "fin"
    assert correr("fases", ["banda", "pulso", "fade", 5, 4.5])["fase"] == "out"


# --- Task 7: grabacion ---

def test_planificar_webm_cuando_hay_recorder():
    datos = correr("planificar", [5, True])
    assert datos["plan"] == {"modo": "webm", "fps": 24}


def test_planificar_png_como_fallback():
    datos = correr("planificar", [5, False])
    assert datos["plan"]["modo"] == "png"
    assert datos["plan"]["fps"] == 24
    assert datos["plan"]["frames"] == 120


def test_planificar_duracion_invalida():
    datos = correr("planificar", [11, True])
    assert datos["err"] == "RangeError"


def test_secuencia_fase_a_24fps():
    datos = correr("frames-fase", 5)
    assert datos["frames"] == 120
    assert datos["orden"] == ["in", "enf", "hold", "out", "fin"]


# --- Task 8: narracion con IA ---

def test_palabrasmax_a_135_wpm():
    assert correr("palabras-max", 5)["n"] == 11
    assert correr("palabras-max", 3)["n"] == 6


def test_prompt_pulir_exige_formato():
    prompt = correr("pulir", ["Borrador suelto.", "ODS 2 · Hambre Cero, Matagalpa", 11])["prompt"]
    assert "solo el texto narrado" in prompt
    assert "≤ 11 palabras" in prompt
    assert "español neutro" in prompt
    assert "Hambre Cero" in prompt


def test_puede_aplicar_guard():
    # textarea vacio sin confirmacion: NO aplica
    assert correr("puede-aplicar", ["", False])["ok"] is False
    # texto del usuario presente: aplica
    assert correr("puede-aplicar", ["texto propio", False])["ok"] is True
    # vacio pero confirmado por el boton Aplicar: aplica
    assert correr("puede-aplicar", ["", True])["ok"] is True


def test_truncar_palabras_con_aviso():
    largo = " ".join("pal%d" % i for i in range(15))
    datos = correr("truncar", [largo, 11])
    assert datos["truncado"] is True
    assert datos["aviso"]
    assert len(datos["texto"].split()) <= 11
    corto = "Una frase corta."
    datos = correr("truncar", [corto, 11])
    assert datos["truncado"] is False
    assert datos["texto"] == corto


# --- fix-batch revisión: conexiones como propuesta y guard del modo plan ---

def test_repartir_conexiones_va_a_propuestas_y_no_toca_el_borrador():
    datos = correr("repartir", ["ODS 12: Iss + salud para barrio Zaragoza"])
    assert datos["n"] == 1
    assert datos["props"] and datos["props"]["ficha12"] == "Iss + salud para barrio Zaragoza"
    assert "ficha12" not in datos["claves"]
    datos = correr("repartir", ["ODS 105: fuera de rango"])
    assert datos["n"] == 0
    assert not datos["props"]


@pytest.mark.parametrize("estado", [
    {"imp": {}, "modo": "", "brief": {}},
    {"modo": "latam", "brief": None},
    {},
])
def test_modos_plan_sin_impacto_no_lanza_typeerror(estado):
    datos = correr("modos-plan", estado)
    assert "error" not in datos
    assert "modo" in datos


# --- video limpio y coreografia de cuadritos (pedido del usuario) ---

def test_modo_limpio_quita_marca_marca_y_pie_del_mosaico():
    sucio = correr("limpio", [False])
    assert sucio["hayMarca"] is True and sucio["hayUni"] is True
    # gs es por prim: cada tile lleva 5 prims con el mismo g (rank del tile).
    assert sucio["gsUnicos"] == 6 and sucio["gs"][0] == 0 and sucio["gs"][5] == 1
    limpio = correr("limpio", [True])
    assert limpio["hayMarca"] is False
    assert limpio["hayUni"] is False
    assert limpio["zonaY"] == 64  # la zona crece al irse la cabecera
    assert limpio["gsUnicos"] == 6


def test_orden_mosaico_cy_posiciones_y_permutacion():
    datos = correr("orden-mosaico", [5, "centro-fuera", 3, 2])
    assert datos["completa"] is True
    assert datos["orden"][0] == 1  # el del centro sale primero
    datos = correr("orden-mosaico", [6, "aleatorio", 3, 2])
    assert datos["completa"] is True  # permutación válida (0..5)
    datos = correr("orden-mosaico", [6, "secuencial", 3, 2])
    assert datos["orden"] == [0, 1, 2, 3, 4, 5]


def test_tile_tipo_opciones_escogidas():
    datos = correr("tile-tipo", [0, "ciclo"])
    assert datos["tipo"] == "pop"
    datos = correr("tile-tipo", [1, "ciclo"])
    assert datos["tipo"] == "arriba"
    assert correr("tile-tipo", [3, "solo-izq"])["tipo"] == "izq"
    assert correr("tile-tipo", [0, "solo-wipe"])["tipo"] == "wipe"
    datos = correr("tile-tipo", [0, "aleatorio"])
    assert datos["tipo"] == "fade"  # (0*7+3) % 5 = 3


def test_tiles_plan_ritmo_escalada_paso_y_duracion():
    normal = correr("tiles-plan", [6, 6, 1])
    lento = correr("tiles-plan", [6, 6, 1.35])
    assert normal["tDur"] == 1.1
    assert lento["tDur"] > normal["tDur"] and lento["paso"] >= normal["paso"]
    assert normal["paso"] > 0 and normal["tDur"] <= 6


def test_mosaico_config_cols_y_orden_aplican_en_composicion():
    datos = correr("mosaico-config", {"cols": 2})
    assert datos["gsUnicos"] == 6  # sin colisiones de rango
    datos = correr("mosaico-config", {"orden": "centro-fuera", "cols": 3})
    assert datos["gsUnicos"] == 6
    # gs va por prim (5 prims por tile): gs[5..9] son los del tile id 1, el
    # central del grid 3×2 (fila 0, col 1) que entra primero → rank 0.
    assert datos["gs"][5] == 0

