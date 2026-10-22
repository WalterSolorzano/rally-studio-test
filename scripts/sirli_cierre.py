#!/usr/bin/env python3
"""Orquesta el cierre del pipeline y apaga la maquina al terminar.

    python scripts/sirli_cierre.py            # frames -> analisis -> apagado
    python scripts/sirli_cierre.py --no-shutdown

Reanudable: los pasos saltan lo que ya existe.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PY = sys.executable
STEPS = [
    ("frames", [PY, "scripts/sirli_videos.py", "frames", "--interval", "3"]),
    ("analisis", [PY, "scripts/sirli_analisis.py"]),
    ("visual", [PY, "scripts/sirli_visual_resumen.py"]),
    ("report", [PY, "scripts/sirli_videos.py", "report"]),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-shutdown", action="store_true")
    args = ap.parse_args()
    for name, cmd in STEPS:
        print(f"== {name} ==", flush=True)
        proc = subprocess.run(cmd, cwd=ROOT)
        print(f"== {name} salida {proc.returncode} ==", flush=True)
    if not args.no_shutdown:
        print("apagando en 60 s (cancelar: shutdown /a)", flush=True)
        subprocess.run(["shutdown", "/s", "/t", "60", "/c", "Pipeline SIRLI terminado"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
