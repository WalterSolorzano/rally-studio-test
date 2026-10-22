"""Prepara la cola de fotogramas para los videos que aún no tienen hoja de contacto.

Prioriza: internacionales, luego Nicaragua por puesto (1.º antes que 2.º/3.º) y año
descendente. Salta los que ya tienen .jpg o marca .failed.

Uso:
    python scripts/sirli_queue_frames2.py --limit 300
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
FRAMES = SIRLI / "frames"

FOCUS = "NICARAGUA"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=300)
    ap.add_argument("--out", default=str(SIRLI / "video_queue_frames2.jsonl"))
    args = ap.parse_args()

    hechos = {p.stem for p in FRAMES.glob("*.jpg")} | {p.stem for p in FRAMES.glob("*.failed")}
    premios = [json.loads(l) for l in
               (SIRLI / "winners.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]

    por_video: dict[str, dict] = {}
    for w in premios:
        vid = w.get("video_id")
        if not vid or vid in hechos:
            continue
        intl = w["collection"] == "internacional"
        if not intl and w.get("country") != FOCUS:
            continue
        rec = por_video.setdefault(vid, {
            "video_id": vid, "awards": [], "priority": 0,
            "country": w.get("country"), "year": w.get("year"), "team": w.get("team"),
        })
        rec["awards"].append({"year": w["year"], "collection": w["collection"],
                              "place": w.get("place"), "team": w.get("team"),
                              "sede": w.get("sede")})
        if intl:
            p = 0
        elif w["collection"] == "nacional":
            p = 1
        else:
            p = 1 + (w.get("place") or 4)
        rec["priority"] = min(rec["priority"] or 9, p)

    cola = sorted(por_video.values(), key=lambda r: (r["priority"], -(r["year"] or 0), r["team"] or ""))
    cola = cola[: args.limit]
    with open(args.out, "w", encoding="utf-8") as fh:
        for r in cola:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"{len(cola)} videos en cola -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
