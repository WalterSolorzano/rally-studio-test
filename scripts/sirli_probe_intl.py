"""Sonda lenta de los 58 videos internacionales.

Para cada video abre la pagina publica (1 peticion, 4-6 s de separacion) y guarda
evidencia dura: si el video es reproducible, si tiene pistas de subtitulos reales,
cuantos idiomas y si tiene audio. No descarga subtitulos.

Salida: research/sirli/meta/intl_probe.jsonl
"""
from __future__ import annotations

import json
import random
import re
import time
from pathlib import Path

import requests
import urllib3

urllib3.disable_warnings()

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
OUT = SIRLI / "meta" / "intl_probe.jsonl"

UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
}


def load_winners() -> list[dict]:
    rows = []
    for line in (SIRLI / "winners.jsonl").read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        w = json.loads(line)
        if w["collection"] == "internacional" and w.get("video_id"):
            rows.append(w)
    return rows


def probe(video_id: str) -> dict:
    url = f"https://www.youtube.com/watch?v={video_id}"
    r = requests.get(url, headers=UA, timeout=30, verify=False)
    out = {
        "video_id": video_id,
        "http": r.status_code,
        "bytes": len(r.content),
    }
    html = r.text
    if r.status_code != 200:
        out["status"] = f"http-{r.status_code}"
        return out

    m = re.search(r'"playabilityStatus":\{"status":"([A-Z_]+)"(?:,"reason":"((?:[^"\\]|\\.)*)")?', html)
    if m:
        out["status"] = m.group(1)
        if m.group(2):
            out["reason"] = m.group(2)[:160]
    else:
        out["status"] = "sin-playabilityStatus"

    caps = re.search(r'"captionTracks":(\[.*?\])(?=,")', html)
    if caps:
        try:
            tracks = json.loads(caps.group(1))
        except json.JSONDecodeError:
            tracks = []
        out["caption_tracks"] = len(tracks)
        out["caption_langs"] = sorted({t.get("languageCode", "?") for t in tracks})
        out["caption_kinds"] = sorted({t.get("kind", "manual") or "manual" for t in tracks})
    else:
        out["caption_tracks"] = 0 if '"captionTracks"' in html else None
        out["caption_langs"] = []
        out["caption_kinds"] = []

    audio = re.search(r'"audioTracks":\[(.*?)\]', html, re.S)
    out["audio_tracks"] = audio.group(1).count('"audioTrackId"') if audio else 0
    dur = re.search(r'"lengthSeconds":"(\d+)"', html)
    out["length_s"] = int(dur.group(1)) if dur else None
    if '"isLiveContent":true' in html:
        out["live"] = True
    return out


def main() -> None:
    done = set()
    if OUT.exists():
        for line in OUT.read_text(encoding="utf-8").splitlines():
            if line.strip():
                done.add(json.loads(line)["video_id"])

    rows = [w for w in load_winners() if w["video_id"] not in done]
    rows.sort(key=lambda w: (-w["year"], w["place"] or 9))
    print(f"probe: {len(rows)} pendientes de 58 internacionales", flush=True)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("a", encoding="utf-8") as fh:
        for i, w in enumerate(rows, 1):
            try:
                rec = probe(w["video_id"])
            except Exception as exc:  # red caida: se reintenta en la proxima corrida
                rec = {"video_id": w["video_id"], "status": f"error-{type(exc).__name__}"}
            rec.update(
                year=w["year"], place=w["place"], team=w["team"], sede=w.get("sede"),
                url=w["video_url"],
            )
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
            fh.flush()
            print(
                f"[{i}/{len(rows)}] {w['year']} {w['video_id']} {rec.get('status')} "
                f"caps={rec.get('caption_tracks')} {rec.get('caption_langs') or ''}",
                flush=True,
            )
            if i < len(rows):
                time.sleep(4 + random.random() * 2)


if __name__ == "__main__":
    main()
