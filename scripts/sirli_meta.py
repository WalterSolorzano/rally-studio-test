#!/usr/bin/env python3
"""Descarga metadatos de los videos del banco SIRLI sin usar la API de reproductor.

Lee la pagina publica del video y extrae titulo, descripcion, duracion, fecha,
vistas y miniatura. Es rapido (~1 s por video) y no dispara el 429 de subtitulos.

    python scripts/sirli_meta.py --limit 50
    python scripts/sirli_meta.py                 # todos los videos unicos (4.709)
    python scripts/sirli_meta.py --only-priority 2   # solo los de la cola corta
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
import time
from pathlib import Path

import requests
import urllib3

urllib3.disable_warnings()
ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
OUT = SIRLI / "meta" / "videos.jsonl"
QUEUE = SIRLI / "video_queue.jsonl"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
HEADERS = {"User-Agent": UA, "Accept-Language": "es-ES,es;q=0.9,en;q=0.7"}


def grab(vid: str) -> dict | None:
    url = f"https://www.youtube.com/watch?v={vid}"
    r = requests.get(url, headers=HEADERS, timeout=25, verify=False)
    if r.status_code == 429:
        return {"_status": 429}
    if r.status_code != 200:
        return {"_status": r.status_code}
    html = r.text
    out: dict = {"video_id": vid, "url": url}

    def pick(pattern: str, cast=str):
        m = re.search(pattern, html, re.S)
        if not m:
            return None
        raw = m.group(1)
        try:
            val = json.loads('"' + raw + '"')
        except Exception:  # noqa: BLE001
            val = raw
        try:
            return cast(val)
        except Exception:  # noqa: BLE001
            return None

    def first(*vals):
        for v in vals:
            if v not in (None, "", [], 0):
                return v
        return None

    out["title"] = pick(r'"title":"(.*?)","lengthSeconds"') or pick(r'<meta name="title" content="(.*?)"')
    out["description"] = pick(r'"shortDescription":"(.*?)","isCrawlable"') or ""
    out["length_s"] = first(pick(r'"lengthSeconds":"(\d+)"', int), pick(r'"approxDurationMs":"(\d+)"', lambda x: int(x) // 1000))
    out["view_count"] = pick(r'"viewCount":"(\d+)"', int)
    out["like_count"] = first(
        pick(r'"likeCount":"(\d+)"', int),
        pick(r'like this video along with ([\d,]+) other', lambda x: int(x.replace(",", ""))),
    )
    out["publish_date"] = pick(r'"publishDate":"(.*?)"')
    out["upload_date"] = pick(r'"uploadDate":"(.*?)"')
    out["channel"] = pick(r'"ownerChannelName":"(.*?)"')
    out["channel_id"] = pick(r'"channelId":"(UC[\w-]{20,24})"')
    out["channel_url"] = f"https://www.youtube.com/channel/{out['channel_id']}" if out.get("channel_id") else ""
    tags_raw = pick(r'"keywords":\[(.*?)\]')
    out["tags"] = []
    if tags_raw:
        try:
            out["tags"] = json.loads("[" + tags_raw + "]")
        except Exception:  # noqa: BLE001
            out["tags"] = re.findall(r'"([^"]+)"', tags_raw)
    out["keyword_meta"] = pick(r'<meta name="keywords" content="(.*?)"')
    cap_langs = sorted(set(re.findall(r'"languageCode":"([a-zA-Z-]{2,10})"', html)))
    out["subtitle_langs"] = cap_langs
    out["has_captions"] = bool(cap_langs)
    out["is_short"] = (out["length_s"] or 0) <= 60
    out["thumbnail"] = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
    out["unavailable"] = '"playabilityStatus":{"status":"ERROR"' in html
    return out



def sentences(text: str) -> list[str]:
    clean = re.sub(r"https?://\S+", " ", text)
    clean = re.sub(r"#\w+", " ", clean)
    clean = re.sub(r"\s+", " ", clean)
    parts = re.split(r"(?<=[.!?])\s+|\s{2,}|\n", clean)
    return [p.strip() for p in parts if len(p.strip()) > 25]


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--sleep", type=float, default=0.8)
    ap.add_argument("--only-priority", type=int, default=None)
    ap.add_argument("--scope", choices=["all", "queue"], default="all")
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    done = set()
    if OUT.exists():
        for line in OUT.read_text(encoding="utf-8").splitlines():
            if line.strip():
                try:
                    rec = json.loads(line)
                except Exception:  # noqa: BLE001
                    continue
                if rec.get("failed"):
                    continue
                done.add(rec["video_id"])

    queue = [json.loads(l) for l in QUEUE.read_text(encoding="utf-8").splitlines() if l.strip()]
    if args.scope == "queue":
        targets = queue
    else:
        index = json.loads((SIRLI / "video_index.json").read_text(encoding="utf-8"))
        targets = [
            {
                "video_id": v["video_id"],
                "year": v["year"],
                "collection": (v.get("collections") or [""])[0],
                "country": (v["winners"][0].get("country") if v.get("winners") else ""),
                "team": (v["winners"][0].get("team") if v.get("winners") else ""),
                "priority": 9,
            }
            for v in index
        ]
    todo = [q for q in targets if q["video_id"] not in done]
    if args.only_priority is not None:
        todo = [q for q in todo if q["priority"] <= args.only_priority]
    if args.limit:
        todo = todo[: args.limit]
    print(f"meta: {len(todo)} pendientes, {len(done)} ya hechos, {args.workers} workers", flush=True)
    lock = threading.Lock()
    counter = {"i": 0}
    stop = threading.Event()

    def handle(fh, item) -> None:
        if stop.is_set():
            return
        vid = item["video_id"]
        rec = None
        for attempt in range(4):
            try:
                rec = grab(vid)
            except Exception as exc:  # noqa: BLE001
                rec = {"_status": str(exc)}
            if rec and rec.get("_status") == 429:
                wait = 15 * (attempt + 1)
                with lock:
                    print(f"429 {vid}, espero {wait}s", flush=True)
                time.sleep(wait)
                continue
            break
        with lock:
            counter["i"] += 1
            i = counter["i"]
            if not rec or rec.get("_status") not in (None,):
                fh.write(json.dumps({"video_id": vid, "url": f"https://www.youtube.com/watch?v={vid}", "failed": True}, ensure_ascii=False) + "\n")
                fh.flush()
                print(f"[{i}/{len(todo)}] fallo {vid} {rec.get('_status') if rec else ''}", flush=True)
                return
            body = rec.get("description") or ""
            rec["description_lines"] = sentences(body)[:8]
            rec["year"] = item["year"]
            rec["collection"] = item["collection"]
            rec["country"] = item["country"]
            rec["team"] = item["team"]
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
            fh.flush()
            if i % 100 == 0:
                print(f"[{i}/{len(todo)}] {vid} {rec.get('title','')[:55]}", flush=True)
        time.sleep(args.sleep + random.random() * 0.4)

    with OUT.open("a", encoding="utf-8") as fh:
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = [pool.submit(handle, fh, item) for item in todo]
            for f in futures:
                f.result()
    print("meta: terminado", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

