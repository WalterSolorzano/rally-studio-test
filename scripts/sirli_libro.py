"""Ensambla el libro completo a partir de las partes en `scripts/libro/`.

Uso:
    python scripts/sirli_libro.py            # escribe research/sirli/analisis/libro.md
    python scripts/sirli_libro.py --stats     # solo cuenta palabras y páginas

Cada parte es un módulo con funciones `capN()` que devuelven markdown. Si un módulo
todavía no existe, se salta: así se puede escribir el libro por capítulos sin romper
la compilación.
"""

from __future__ import annotations

import argparse
import importlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIBRO_DIR = ROOT / "scripts" / "libro"
sys.path.insert(0, str(LIBRO_DIR))

OUT = ROOT / "research" / "sirli" / "analisis" / "libro.md"

MODULOS = ["l1", "l2", "l3", "l4", "l5", "l6"]
PALABRAS_POR_PAGINA = 430


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stats", action="store_true")
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()

    trozos: list[str] = []
    for nombre in MODULOS:
        try:
            mod = importlib.import_module(nombre)
        except ModuleNotFoundError:
            print(f"  (falta {nombre}.py, se salta)")
            continue
        if hasattr(mod, "PARTE"):
            trozos.append(mod.PARTE)
        for i in range(0, 40):
            fn = getattr(mod, f"cap{i}", None)
            if fn is None:
                continue
            txt = fn()
            if txt:
                trozos.append(txt)
                print(f"  {nombre}: cap{i} {len(txt.split()):,} palabras")

    doc = "\n\n".join(t.strip() + "\n" for t in trozos)
    palabras = len(doc.split())
    filas_tabla = sum(1 for l in doc.splitlines()
                      if l.startswith("|") and not set(l) <= set("|-: "))
    figs = doc.count("![")
    paginas = palabras / PALABRAS_POR_PAGINA + filas_tabla / 32 + figs * 0.55
    print(f"total: {palabras:,} palabras · {filas_tabla:,} filas de tabla · {figs} figuras"
          f" ≈ {paginas:.0f} páginas")
    if args.stats:
        return 0
    Path(args.out).write_text(doc, encoding="utf-8")
    print("escrito:", args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
