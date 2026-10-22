"""El catalogo ODS de design/ vive en ods_data.js, generado desde app.js.

scripts/gen_ods_data.py extrae el bloque const ODS_CATALOG del dashboard y
escribe design/ods_data.js (solo campos de presentacion). Este test ejecuta
el generador, idempotencia y valida el contenido via probe de Node.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

NODE = shutil.which("node")
RAIZ = Path(__file__).parent.parent
SCRIPT = RAIZ / "scripts" / "gen_ods_data.py"
SALIDA = RAIZ / "design" / "ods_data.js"

pytestmark = pytest.mark.skipif(NODE is None, reason="node no disponible para probar ods_data.js")


def generar():
    salida = subprocess.run(
        [sys.executable, str(SCRIPT)], capture_output=True, text=True, encoding="utf-8", timeout=60
    )
    assert salida.returncode == 0, salida.stderr
    return SALIDA.read_text(encoding="utf-8")


def evaluar(src_csv_instr):
    """Corre un probe inline: src es JS que usa ODS_DATA y devuelve JSON."""
    datos = SALIDA.read_text(encoding="utf-8")
    probe = f"eval(fs.readFileSync(process.argv[1],'utf8'));let f={{}};({src_csv_instr})(ODS_DATA,f);console.log(JSON.stringify(f))"
    salida = subprocess.run([NODE, "-e", probe, str(SALIDA)], capture_output=True, text=True, encoding="utf-8", timeout=30)
    assert salida.returncode == 0, salida.stderr
    return json.loads(salida.stdout)


def test_generar_produce_el_archivo_y_es_idempotente():
    primera = generar()
    assert "ODS_DATA" in primera
    segunda = generar()
    assert primera == segunda


def test_ods_data_tiene_17_entradas_completas():
    generar()
    datos = evaluar("(d,f)=>{f.n=d.length;f.ids=d.map(o=>o.id);f.todos=d.every(o=>"
                    "typeof o.id==='number'&&/^ODS\\s?\\d+$/.test(o.code)&&o.name&&"
                    "/^#[0-9A-Fa-f]{6}$/.test(o.color)&&/^<\\w/.test(o.icon)&&/<(path[^>]+d=|circle)/.test(o.icon)&&o.shortTarget)}")
    assert datos["n"] == 17
    assert datos["todos"] is True
    assert datos["ids"] == list(range(1, 18))


def test_ods_data_conoce_colores_oficiales_conocidos():
    generar()
    datos = evaluar("(d,f)=>{const p={};d.forEach(o=>p[o.id]=o.color);f.colores=p;}")
    colores = datos["colores"]
    assert colores["1"].upper() == "#E5243B"
    assert colores["2"].upper() == "#DDA63A"
    assert colores["13"].upper() == "#3F7E44"
