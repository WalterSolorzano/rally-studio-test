"""Genera design/presets.json a partir de design/presets.js (fuente de verdad).

Uso: python scripts/gen_presets_json.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / "design" / "presets.js"
OUT = ROOT / "design" / "presets.json"


def main() -> int:
    raw = JS.read_text(encoding="utf-8")
    m = re.search(r"var\s+RALLY_PRESETS\s*=\s*(\[.*?\])\s*;", raw, re.S)
    if not m:
        print("No se encontro RALLY_PRESETS en presets.js")
        return 1
    body = m.group(1)
    # convierte el literal JS a JSON: claves sin comillas -> claves entrecomilladas
    keys = (
        "id|name|skin|cover|card|deco|notes|pal|fonts|kicker|title|tag|foot|"
        "bg|bg2|ac|ink|mu|gl|t|b|l"
    )
    body = re.sub(rf"(?<![\"'\w])({keys})(\s*):", r'"\1"\2:', body)
    # convierte el literal JS a JSON: comillas simples -> dobles
    body = re.sub(r"'", '"', body)
    body = re.sub(r",(\s*[}\]])", r"\1", body)
    data = json.loads(body)
    payload = {
        "version": 2,
        "description": "Diseños preestablecidos de Rally Design. Puntos de partida editables.",
        "presets": data,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK -> {OUT} ({len(data)} presets)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
