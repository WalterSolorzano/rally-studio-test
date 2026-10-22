"""Guardas de ingesta de retos: un informe del corpus no puede volverse catálogo.

Cubre los fallos que dejaron pasar 15 secciones del Informe de sustento como
si fueran retos del comité, con IDs repetidos y votos huérfanos.
"""

import json
import shutil
import subprocess
from pathlib import Path

import pytest

NODE = shutil.which("node")
PROBE = Path(__file__).parent / "js" / "challenge_parser_probe.js"

pytestmark = pytest.mark.skipif(NODE is None, reason="node no disponible para probar el parser")

# Encabezados reales que entraron como retos (state.json / UI, 2026-10-21).
INFORME = "\n".join(
    [
        "3 El reporte nacional El documento nacional admite hasta diez páginas y se evalúa junto con el pitch. La dif",
        "3 La lógica común Pese a las diferencias, ambos certámenes comparten una arquitectura: Tiempo comprimido.",
        "El ecosistema: dos rallies, una misma lógica 3.1 Origen y gobernanza El Rally Latinoamericano de Innovación",
        "5 Resultados del índice Edición IPC medio Distribución 2023 7,5 0, 0, 0, 15, 15, 15",
        "3 Catálogo audiovisual Año Equipo Plataforma Duración Estado 2019 Lexonic YouTube 2:57 Dispo",
        "Qué sostiene este informe Este documento reúne, en un solo lugar, la investigación que alimenta a Rally Studio.",
        "4 2026 — la redistribución La cuarta edición se celebró el 28 y 29 de agosto de 2026, con cifras récord: más",
        "El naming evolucionó y hoy es un requisito competitivo. En 2023 cinco de seis equipos usaban sufijos genéricos.",
        "3 Matriz comparativa Criterio Nacional Tecnológica Nacional Social Nacional Procesos Latam Innovación",
        "4 Tres modelos de canal y producción Modelo Descripción Ejemplos Qué revela A. Académico-institucional",
        "6 Clusters temáticos Cluster Evidencia Ediciones Café de especialidad 3 de 3 en Procesos 2026 2026",
        "3 Métricas Entre 2023 y 2024, ninguno de los doce ganadores tenía métricas de impacto en la descripción oficial.",
        "Anexos 17.1 Registro completo de ganadores nacionales (2023–2026) Año Categoría 1.º 2.º 3.º 2023",
        "8 Qué haría falta para un modelo predictivo Requisito Estado actual Registro de todos los equipos (ganadores)",
        "2 La rúbrica nacional La rúbrica nacional se reconstruyó a partir de las bases, los comunicados y el comportamiento",
        "El certamen consolidó su alcance con podios publicados por SIRLI. BottleLife (Uruguay) ganó Impacto Social.",
    ]
)

COMITE = """RETO 01: Segunda vida y reconversión de motores eléctricos de electrodomésticos en desuso
Demanda del comité: Reutilizar motores de lavadoras desechadas para tracción agrícola de bajo costo.
ODS: 12, 8, 9

RETO 02: Red comunitaria para prevención y alerta temprana de inundaciones
Demanda del comité: Alertar a comunidades ribereñas antes de una crecida con tecnología local.
ODS: 11, 13, 3
"""


def correr(comando, arg=None):
    args = [NODE, str(PROBE), comando]
    if arg is not None:
        args.append(json.dumps(arg, ensure_ascii=False))
    salida = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", timeout=30)
    assert salida.returncode == 0, salida.stderr
    return json.loads(salida.stdout)


def test_informe_no_produce_retos():
    retos = correr("parse", {"texto": INFORME})["retos"]
    assert retos == []


def test_comunicado_oficial_se_parsea_completo():
    retos = correr("parse", {"texto": COMITE})["retos"]
    assert [r["id"] for r in retos] == ["01", "02"]
    assert retos[0]["title"].startswith("Segunda vida")
    assert retos[0]["ods"] == ["ODS 12", "ODS 8", "ODS 9"]
    assert "tracción agrícola" in retos[0]["officialExpectation"]
    assert retos[1]["ods"] == ["ODS 11", "ODS 13", "ODS 3"]


def test_lista_numerada_sin_prefijo_tambien_entra():
    texto = "01. Reconversión de motores en desuso\n02. Sensores comunitarios de inundación"
    retos = correr("parse", {"texto": texto})["retos"]
    assert [r["id"] for r in retos] == ["01", "02"]


def test_ids_repetidos_se_renumeran():
    texto = "RETO 03: Motores eléctricos en desuso\nRETO 03: Sensores de inundación"
    retos = correr("parse", {"texto": texto})["retos"]
    ids = [r["id"] for r in retos]
    assert len(ids) == len(set(ids)) == 2


def test_titulo_de_seccion_se_rechaza():
    assert correr("titulo", {"titulo": "3 El reporte nacional"})["valido"] is False
    assert correr("titulo", {"titulo": "La lógica común"})["valido"] is False
    assert correr("titulo", {"titulo": "Anexos 17.1 Registro completo"})["valido"] is False
    assert correr("titulo", {"titulo": "Sensores comunitarios de inundación"})["valido"] is True


def test_reemplazo_renumera_y_reporta_eliminados():
    existing = [
        {"id": "03", "title": "Viejo tres"},
        {"id": "10", "title": "Viejo diez"},
        {"id": "10", "title": "Viejo diez bis"},
    ]
    incoming = [{"id": "05", "title": "Motores en desuso"}, {"id": "05", "title": "Sensores de inundación"}]
    res = correr("merge", {"existing": existing, "incoming": incoming, "append": False})
    ids = [c["id"] for c in res["list"]]
    assert ids == ["01", "02"]
    assert set(res["removedIds"]) == {"03", "10"}


def test_append_continua_numeracion_y_descarta_titulo_repetido():
    existing = [{"id": "01", "title": "Motores en desuso"}]
    incoming = [
        {"id": "01", "title": "Motores en desuso"},
        {"id": "01", "title": "Sensores de inundación"},
    ]
    res = correr("merge", {"existing": existing, "incoming": incoming, "append": True})
    assert [c["title"] for c in res["list"]] == ["Motores en desuso", "Sensores de inundación"]
    ids = [c["id"] for c in res["list"]]
    assert len(ids) == len(set(ids)) == 2
    assert ids[1] == "02"


def test_purga_votos_ideas_y_seleccion_huerfanos():
    estado = {
        "challenge_id": "03",
        "challenge_title": "Viejo",
        "active_deliberation_challenge_id": "03",
        "challenge_mesa": {"votes": {"03": {"yes": [], "no": [], "res": [], "at": {}}, "01": {"yes": [], "no": [], "res": [], "at": {}}}},
        "challenge_ideas": {"03": [{"text": "x"}], "01": []},
    }
    res = correr("purge", {"estado": estado, "ids": ["03"]})
    estado = res["estado"]
    assert "03" not in estado["challenge_mesa"]["votes"]
    assert "01" in estado["challenge_mesa"]["votes"]
    assert "03" not in estado["challenge_ideas"]
    assert estado["challenge_id"] == ""
    assert estado["challenge_title"] == ""
    assert estado["active_deliberation_challenge_id"] == ""


# ── Contratos del motor: que la UI no reintroduzca los atajos ────────────────

APP = Path(__file__).resolve().parent.parent / "dashboard" / "app.js"
INDEX = Path(__file__).resolve().parent.parent / "dashboard" / "index.html"


def test_app_ya_no_usa_regex_permisivo_de_ingesta():
    js = APP.read_text(encoding="utf-8")
    assert "(?:reto|desaf[ií]o)?\\s*#?\\s*(\\d+)" not in js
    assert "RallyChallengeParser" in js


def test_app_no_reimprime_el_anclaje_territorial():
    js = APP.read_text(encoding="utf-8")
    assert "Anclaje territorial listo" not in js
    assert "Factibilidad & despliegue" in js


def test_nav_cuenta_el_total_y_no_el_filtrado():
    js = APP.read_text(encoding="utf-8")
    assert "${list.length} ACTIVOS" not in js
    assert "renderMesaNav(mesaList, mesaActive.id, list.length)" in js


def test_index_carga_el_parser_antes_de_app():
    html = INDEX.read_text(encoding="utf-8")
    assert html.index("challenge_parser.js") < html.index("app.js?v=")
