#!/usr/bin/env python3
"""Espera a que terminen metadatos y transcripciones, arma el Excel, limpia y apaga.

    python scripts/sirli_finalizar.py               # cierra y apaga
    python scripts/sirli_finalizar.py --no-shutdown

No toca nada fuera de research/sirli, tmp/ y los temporales de la raiz.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
PY = sys.executable
SCRATCH = [
    "tmp_oembed.py", "tmp_labels.py", "tmp_desc.py", "tmp_show.py",
    "tmp_cap.py", "tmp_cap2.py", "tmp_meta.py",
]


def workers_alive() -> list[str]:
    out = subprocess.run(
        ["powershell", "-NoProfile", "-Command",
         "Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | "
         "Where-Object { $_.CommandLine -match 'sirli_(meta|videos)' } | "
         "ForEach-Object { $_.ProcessId }"],
        capture_output=True, text=True, cwd=ROOT,
    )
    return [x for x in out.stdout.split() if x.strip()]


def progress() -> tuple[int, int]:
    meta = 0
    p = SIRLI / "meta" / "videos.jsonl"
    if p.exists():
        meta = sum(1 for line in p.read_text(encoding="utf-8").splitlines() if line.strip())
    trans = len(list((SIRLI / "transcripts").glob("*.json")))
    return meta, trans


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-shutdown", action="store_true")
    ap.add_argument("--max-wait-min", type=int, default=150)
    args = ap.parse_args()

    deadline = time.time() + args.max_wait_min * 60
    while time.time() < deadline:
        alive = workers_alive()
        meta, trans = progress()
        print(f"[{time.strftime('%H:%M:%S')}] workers={len(alive)} meta={meta} transcriptos={trans}", flush=True)
        if not alive:
            break
        time.sleep(60)

    print("== excel ==", flush=True)
    subprocess.run([PY, "scripts/sirli_excel.py"], cwd=ROOT)
    subprocess.run([PY, "scripts/sirli_analisis.py"], cwd=ROOT)

    for name in SCRATCH:
        p = ROOT / name
        if p.exists():
            p.unlink()
    tmp = ROOT / "tmp" / "sirli_video"
    if tmp.exists():
        for f in tmp.rglob("*"):
            if f.is_file():
                f.unlink()
        for d in sorted(tmp.rglob("*"), reverse=True):
            if d.is_dir():
                try:
                    d.rmdir()
                except OSError:
                    pass
        try:
            tmp.rmdir()
        except OSError:
            pass

    meta, trans = progress()
    status = {
        "cerrado": time.strftime("%Y-%m-%d %H:%M:%S"),
        "metadatos_videos": meta,
        "transcripciones": trans,
        "excel": str(SIRLI / "excel" / "ganadores_sirli.xlsx"),
    }
    (SIRLI / "cierre.json").write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(status, ensure_ascii=False), flush=True)

    if not args.no_shutdown:
        subprocess.run(["shutdown", "/s", "/t", "120", "/c",
                        "Banco SIRLI listo. Apagando en 2 minutos (cancelar: shutdown /a)"])
        print("apagado programado en 120 s", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
