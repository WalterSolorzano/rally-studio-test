"""Genera design/ods_data.js desde el catalogo ODS del dashboard.

Lee el bloque `const ODS_CATALOG = [...]` de dashboard/app.js y escribe en
design/ods_data.js solo los campos que el modulo de diseno necesita para
presentar clips (id, code, name, color, icon, shortTarget). Idempotente:
misma entrada -> misma salida con formato estable.

Regla del proyecto: dashboard/app.js es fuente unica del catalogo; este
archivo NUNCA se edita a mano. Correr: python scripts/gen_ods_data.py
"""
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
APPS = RAIZ / "dashboard" / "app.js"
SALIDA = RAIZ / "design" / "ods_data.js"
CABECERA = ("// Generado por scripts/gen_ods_data.py — editar el catalogo del\n"
            "// dashboard (ODS_CATALOG) y regenerar, no este archivo.\n")

ENTRADA = re.compile(r"(?ms)^  \{$(.*?)^  \}[,]?$")
CAMPOS = {
    "id": re.compile(r"\bid:\s*(\d+)"),
    "code": re.compile(r'\bcode:\s*"([^"]*)"'),
    "name": re.compile(r'\bname:\s*"([^"]*)"'),
    "color": re.compile(r'\bcolor:\s*"([^"]*)"'),
    "icon": re.compile(r"\bicon:\s*`([^`]*)`"),
    "shortTarget": re.compile(r'\bshortTarget:\s*"([^"]*)"'),
}


def extraer_catalogo(texto):
    m = re.search(r"const\s+ODS_CATALOG\s*=\s*\[", texto)
    if not m:
        raise SystemExit("dashboard/app.js no contiene const ODS_CATALOG")
    fin = texto.index("];", m.end())
    bloque = texto[m.end():fin]
    filas = []
    for trozo in ENTRADA.findall(bloque):
        fila = {}
        for nombre, rx in CAMPOS.items():
            c = rx.search(trozo)
            if c is None:
                raise SystemExit(f"entrada ODS sin campo {nombre}: {trozo[:120]}")
            fila[nombre] = int(c.group(1)) if nombre == "id" else c.group(1)
        filas.append(fila)
    filas.sort(key=lambda f: f["id"])
    return filas


def serializar(filas):
    import json

    lineas = []
    for fila in filas:
        lineas.append("  " + json.dumps(fila, ensure_ascii=False))
    return CABECERA + "var ODS_DATA = [\n" + ",\n".join(lineas) + "\n];\n"


def main():
    texto = APPS.read_text(encoding="utf-8")
    filas = extraer_catalogo(texto)
    if not filas:
        raise SystemExit("ODS_CATALOG vacio")
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(serializar(filas), encoding="utf-8")
    print(f"design/ods_data.js con {len(filas)} entradas ODS")


if __name__ == "__main__":
    main()
