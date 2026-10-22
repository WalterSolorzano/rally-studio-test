#!/usr/bin/env python3
"""Consolida las descripciones visuales de research/sirli/visual/*.json.

Uso:
    python scripts/sirli_visual_resumen.py
"""

from __future__ import annotations

import json
import statistics
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
VIS = SIRLI / "visual"
OUT = SIRLI / "analisis"


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    docs = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(VIS.glob("*.json"))]
    if not docs:
        print("sin descripciones visuales todavia")
        return 0
    estilos = Counter(d.get("estilo", "?") for d in docs)
    recursos = Counter(r for d in docs for r in d.get("recursos", []))
    paletas = Counter(c for d in docs for c in d.get("paleta", []))
    calidad = [d["calidad_produccion"] for d in docs if isinstance(d.get("calidad_produccion"), int)]
    con_texto = sum(1 for d in docs if d.get("texto_en_pantalla"))
    con_demo = sum(1 for d in docs if d.get("hay_demo_producto"))
    con_persona = sum(1 for d in docs if d.get("hay_persona_en_camara"))
    resumen = {
        "videos_descriptos": len(docs),
        "estilos": estilos.most_common(),
        "recursos_frecuentes": recursos.most_common(15),
        "paletas": paletas.most_common(12),
        "calidad_media": round(statistics.mean(calidad), 2) if calidad else None,
        "pct_con_texto_en_pantalla": round(100 * con_texto / len(docs), 1),
        "pct_con_demo_producto": round(100 * con_demo / len(docs), 1),
        "pct_con_persona_en_camara": round(100 * con_persona / len(docs), 1),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "resumen_visual.json").write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(resumen, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
