#!/usr/bin/env python3
"""Baja la miniatura de cada video ganador a research/sirli/meta/thumbs/.

Las miniaturas son la pieza grafica mas barata del banco: 480x360, ~25 KB,
y sirven para analizar el gancho visual de cada video sin descargarlo.

    python scripts/sirli_thumbs.py
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import requests
import urllib3

urllib3.disable_warnings()
ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
DEST = SIRLI / "meta" / "thumbs"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    DEST.mkdir(parents=True, exist_ok=True)
    index = json.loads((SIRLI / "video_index.json").read_text(encoding="utf-8"))
    todo = [v["video_id"] for v in index if not (DEST / f"{v['video_id']}.jpg").exists()]
    print(f"thumbs: {len(todo)} pendientes de {len(index)}", flush=True)
    ok = 0
    with requests.Session() as s:
        s.headers.update({"User-Agent": UA})
        for i, vid in enumerate(todo, 1):
            for name in ("hqdefault.jpg", "mqdefault.jpg"):
                try:
                    r = s.get(f"https://i.ytimg.com/vi/{vid}/{name}", timeout=15)
                except Exception:  # noqa: BLE001
                    continue
                if r.status_code == 200 and len(r.content) > 1500:
                    (DEST / f"{vid}.jpg").write_bytes(r.content)
                    ok += 1
                    break
            if i % 100 == 0:
                print(f"[{i}/{len(todo)}] {ok} ok", flush=True)
            time.sleep(0.05)
    print(f"thumbs: {ok} descargadas", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
