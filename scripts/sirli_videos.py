#!/usr/bin/env python3
"""Pipeline de video del banco de ganadores SIRLI.

Subcomandos:

    queue    arma la cola de videos con prioridad
    subs     baja subtitulos/auto-subtitulos de YouTube y los deja en texto
    frames   baja el video en baja calidad, corta fotogramas y arma hoja de contacto
    report   estado del pipeline

Todo es reanudable: si el archivo de salida existe, se salta.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
QUEUE = SIRLI / "video_queue.jsonl"
TRANS = SIRLI / "transcripts"
FRAMES = SIRLI / "frames"
TMP = ROOT / "tmp" / "sirli_video"
LOG = SIRLI / "video_pipeline.log"

# Prioridad: 0 = internacional (jurado internacional), 1 = nacional Nicaragua,
# 2..4 = sede Nicaragua por puesto. Nicaragua es el foco del usuario.
PRIORITY = {"internacional": 0, "nacional": 1, "sede": None}
FOCUS_COUNTRY = "NICARAGUA"


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def log(msg: str) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    line = f"[{now()}] {msg}"
    print(line, flush=True)
    with LOG.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def load_rows() -> list[dict]:
    path = SIRLI / "winners.jsonl"
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def in_scope(r: dict) -> bool:
    if r["collection"] == "internacional":
        return True
    return r["country"] == FOCUS_COUNTRY


def priority_of(r: dict) -> int:
    if r["collection"] == "internacional":
        return 0
    if r["collection"] == "nacional":
        return 1
    return 1 + (r["place"] or 4)


def cmd_queue(args: argparse.Namespace) -> int:
    rows = [r for r in load_rows() if r["video_id"] and in_scope(r)]
    if args.since_year:
        rows = [r for r in rows if r["year"] >= args.since_year]
    if args.sede_sample:
        # muestra de ganadores de sede de Nicaragua: primeros lugares, N por anio
        sede = [r for r in rows if r["collection"] == "sede" and (r["place"] or 9) == 1]
        keep, count = [], {}
        for r in sorted(sede, key=lambda r: (-r["year"], r["team"])):
            n = count.get(r["year"], 0)
            if n < args.sede_sample:
                keep.append(r)
                count[r["year"]] = n + 1
        rows = [r for r in rows if r["collection"] != "sede"] + keep
    items: dict[str, dict] = {}
    for r in rows:
        vid = r["video_id"]
        item = items.get(vid)
        prio = priority_of(r)
        if item:
            item["priority"] = min(item["priority"], prio)
            item["awards"].append(
                {
                    "year": r["year"],
                    "collection": r["collection"],
                    "place_label": r["place_label"],
                    "team": r["team"],
                    "country": r["country"],
                    "sede": r["sede"],
                    "challenge": r["challenge"],
                    "category": r["category"],
                }
            )
            continue
        items[vid] = {
            "video_id": vid,
            "url": f"https://www.youtube.com/watch?v={vid}",
            "year": r["year"],
            "collection": r["collection"],
            "country": r["country"],
            "team": r["team"],
            "place_label": r["place_label"],
            "priority": prio,
            "awards": [
                {
                    "year": r["year"],
                    "collection": r["collection"],
                    "place_label": r["place_label"],
                    "team": r["team"],
                    "country": r["country"],
                    "sede": r["sede"],
                    "challenge": r["challenge"],
                    "category": r["category"],
                }
            ],
        }

    ordered = sorted(
        items.values(), key=lambda v: (v["priority"], -v["year"], v["country"], v["team"])
    )
    with QUEUE.open("w", encoding="utf-8") as fh:
        for item in ordered:
            fh.write(json.dumps(item, ensure_ascii=False) + "\n")

    by_prio: dict[int, int] = {}
    for item in ordered:
        by_prio[str(item["priority"])] = by_prio.get(str(item["priority"]), 0) + 1
    print(f"cola: {len(ordered)} videos unicos -> {QUEUE}")
    print("por prioridad:", dict(sorted(by_prio.items())))
    return 0


def load_queue(path: Path | None = None) -> list[dict]:
    path = path or QUEUE
    if not path.exists():
        raise SystemExit("falta video_queue.jsonl: corre primero `queue`")
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def ytdlp(args: list[str], timeout: int = 300) -> subprocess.CompletedProcess:
    base = ["yt-dlp", "--js-runtimes", "node", "--no-warnings", "--no-progress"]
    return subprocess.run(
        base + args, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout
    )


TS_RE = re.compile(r"^\d{2}:\d{2}:\d{2}[.,]\d{3}\s+-->")
TAG2_RE = re.compile(r"<[^>]+>")


def vtt_to_text(path: Path) -> str:
    lines: list[str] = []
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")):
            continue
        if TS_RE.match(line) or "-->" in line or line.isdigit():
            continue
        line = TAG2_RE.sub("", line).strip()
        if not line:
            continue
        if lines and lines[-1] == line:
            continue
        lines.append(line)
    text = " ".join(lines)
    text = re.sub(r"\s+", " ", text).strip()
    # los auto-subtitulos repiten la linea anterior con una palabra nueva: se limpia
    return text


def find_subs(folder: Path, vid: str) -> list[Path]:
    return sorted(folder.glob(f"{vid}*.vtt"))


def cmd_subs(args: argparse.Namespace) -> int:
    queue = load_queue()
    TRANS.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    todo = [q for q in queue if not (TRANS / f"{q['video_id']}.json").exists()]
    if getattr(args, "redo_none", False):
        for q in queue:
            p = TRANS / f"{q['video_id']}.json"
            if p.exists():
                try:
                    if not (json.loads(p.read_text(encoding="utf-8")).get("text") or "").strip():
                        todo.append(q)
                except Exception:  # noqa: BLE001
                    todo.append(q)
        seen = set()
        todo = [q for q in todo if not (q["video_id"] in seen or seen.add(q["video_id"]))]
        todo.sort(key=lambda q: q["priority"])
    if args.max_priority is not None:
        todo = [q for q in todo if q["priority"] <= args.max_priority]
    if getattr(args, "shards", 1) > 1:
        todo = [q for i, q in enumerate(todo) if i % args.shards == args.shard]
    if args.limit:
        todo = todo[: args.limit]
    log(f"subs: {len(todo)} pendientes de {len(queue)} en cola")
    done = 0
    for i, item in enumerate(todo, 1):
        vid = item["video_id"]
        folder = TMP / vid
        folder.mkdir(parents=True, exist_ok=True)
        out = TRANS / f"{vid}.json"
        for attempt in range(args.retries):
            try:
                proc = ytdlp(
                    [
                        "--skip-download",
                        "--write-subs",
                        "--write-auto-subs",
                        "--sub-langs",
                        "es.*,es,en.*,en",
                        "--sub-format",
                        "vtt/best",
                        "--write-info-json",
                        "--no-simulate",
                        "-o",
                        str(folder / "%(id)s.%(ext)s"),
                        item["url"],
                    ]
                )
            except subprocess.TimeoutExpired:
                proc = None
            err = (proc.stderr if proc else "") or ""
            if "429" in err or "Too Many Requests" in err:
                wait = min(90, 15 * (attempt + 1))
                log(f"429 en {vid}, espero {wait}s")
                time.sleep(wait)
                continue
            break

        subs = find_subs(folder, vid)
        record = {
            "video_id": vid,
            "url": item["url"],
            "year": item["year"],
            "collection": item["collection"],
            "country": item["country"],
            "team": item["team"],
            "place_label": item["place_label"],
            "priority": item["priority"],
            "awards": item["awards"],
            "fetched_at": now(),
            "caption_source": "",
            "language": "",
            "text": "",
            "segments": [],
            "has_info": (folder / f"{vid}.info.json").exists(),
        }
        info_path = folder / f"{vid}.info.json"
        if info_path.exists():
            try:
                info = json.loads(info_path.read_text(encoding="utf-8"))
                record["title"] = info.get("title", "")
                record["duration_s"] = info.get("duration")
                record["upload_date"] = info.get("upload_date", "")
                record["view_count"] = info.get("view_count")
                record["like_count"] = info.get("like_count")
                record["channel"] = info.get("channel", "")
                record["thumbnail"] = info.get("thumbnail", "")
            except Exception:  # noqa: BLE001
                pass

        if subs:
            manual = [p for p in subs if "orig" not in p.name]
            pick = manual[0] if manual else subs[0]
            record["caption_source"] = "youtube-manual" if manual else "youtube-auto"
            record["language"] = pick.stem.split(".")[-1]
            record["text"] = vtt_to_text(pick)
        else:
            record["caption_source"] = "none"
        out.write_text(json.dumps(record, ensure_ascii=False), encoding="utf-8")
        done += 1
        status = record["caption_source"]
        log(f"[{i}/{len(todo)}] {vid} {status} {len(record['text'])} chars p{item['priority']}")
        if status == "none":
            time.sleep(args.interval * 1.5)
        else:
            time.sleep(args.interval)
    log(f"subs: terminado, {done} procesados")
    return 0


def cmd_frames(args: argparse.Namespace) -> int:
    queue = load_queue(Path(args.queue_file) if args.queue_file else None)
    FRAMES.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    from imageio_ffmpeg import get_ffmpeg_exe

    ffmpeg = get_ffmpeg_exe()
    todo = [q for q in queue if not (FRAMES / f"{q['video_id']}.jpg").exists()]
    if args.max_priority is not None:
        todo = [q for q in todo if q["priority"] <= args.max_priority]
    if args.year:
        todo = [q for q in todo if q["year"] in args.year]
    if args.limit:
        todo = todo[: args.limit]
    log(f"frames: {len(todo)} pendientes")
    for i, item in enumerate(todo, 1):
        vid = item["video_id"]
        folder = TMP / vid
        folder.mkdir(parents=True, exist_ok=True)
        mp4 = next(folder.glob(f"{vid}.mp4"), None)
        if mp4 is None:
            proc = ytdlp(
                [
                    "-f",
                    args.format,
                    "--no-part",
                    "--write-info-json",
                    "-o",
                    str(folder / "%(id)s.%(ext)s"),
                    item["url"],
                ],
                timeout=600,
            )
            err = proc.stderr or ""
            if "429" in err or "Too Many Requests" in err:
                log(f"429 bajando {vid}, espero 60s")
                time.sleep(60)
                continue
            mp4 = next(folder.glob(f"{vid}.mp4"), None)
            if mp4 is None:
                log(f"sin archivo para {vid}: {err.strip().splitlines()[-1] if err.strip() else 'desconocido'}")
                (FRAMES / f"{vid}.failed").write_text(err, encoding="utf-8")
                continue
        # 6 fotogramas: 6%, 20%, 36%, 54%, 72%, 90% del video
        sheet = FRAMES / f"{vid}.jpg"
        dur = 120.0
        try:
            probe = subprocess.run(
                [ffmpeg, "-i", str(mp4)], capture_output=True, text=True, errors="replace"
            ).stderr
            hh, mm, ss = probe.split("Duration: ")[1].split(",")[0].strip().split(":")
            dur = int(hh) * 3600 + int(mm) * 60 + float(ss)
        except Exception:  # noqa: BLE001 - duracion por defecto si el probe falla
            pass
        fractions = (0.06, 0.20, 0.36, 0.54, 0.72, 0.90)
        files = []
        for idx, frac in enumerate(fractions):
            frame = folder / f"f{idx}.jpg"
            subprocess.run(
                [ffmpeg, "-y", "-ss", f"{max(0.5, dur * frac):.1f}", "-i", str(mp4),
                 "-frames:v", "1", "-vf", "scale=480:-2", str(frame)],
                capture_output=True,
            )
            if frame.exists():
                files.append(frame)
        if not files:
            log(f"sin fotogramas {vid}")
            continue
        # hoja de contacto 3x2 con ffmpeg tile
        pattern = folder / "f%d.jpg"
        subprocess.run(
            [ffmpeg, "-y", "-framerate", "1", "-i", str(pattern), "-vf", "tile=3x2", "-frames:v", "1", str(sheet)],
            capture_output=True,
        )
        if not sheet.exists():
            log(f"sin hoja {vid}")
            continue
        for f in files:
            f.unlink(missing_ok=True)
        mp4.unlink(missing_ok=True)
        log(f"[{i}/{len(todo)}] hoja {vid} ({dur:.0f}s)")
        time.sleep(args.interval)
    log("frames: terminado")
    return 0


def cmd_report(args: argparse.Namespace) -> int:
    queue = load_queue()
    total = len(queue)
    trans = list(TRANS.glob("*.json")) if TRANS.exists() else []
    with_text = 0
    sources: dict[str, int] = {}
    for p in trans:
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            continue
        src = d.get("caption_source", "?")
        sources[src] = sources.get(src, 0) + 1
        if d.get("text"):
            with_text += 1
    sheets = list(FRAMES.glob("*.jpg")) if FRAMES.exists() else []
    print(f"cola total       : {total}")
    print(f"transcripciones  : {len(trans)} ({with_text} con texto)")
    print("fuentes          :", sources)
    print(f"hojas de imagen  : {len(sheets)}")
    for prio in sorted({q["priority"] for q in queue}):
        sub = [q for q in queue if q["priority"] == prio]
        have = sum(1 for q in sub if (TRANS / f"{q['video_id']}.json").exists())
        sh = sum(1 for q in sub if (FRAMES / f"{q['video_id']}.jpg").exists())
        print(f"  p{prio}: {len(sub):>4} videos | {have:>4} transcritos | {sh:>4} con hoja")
    return 0


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    q = sub.add_parser("queue")
    q.add_argument("--since-year", type=int, default=None, help="descarta anios anteriores")
    q.add_argument(
        "--sede-sample",
        type=int,
        default=None,
        help="maximo de primeros lugares de sede por anio (Nicaragua)",
    )
    q.set_defaults(func=cmd_queue)

    s = sub.add_parser("subs")
    s.add_argument("--interval", type=float, default=6.0)
    s.add_argument("--retries", type=int, default=4)
    s.add_argument("--limit", type=int, default=0)
    s.add_argument("--max-priority", type=int, default=None)
    s.add_argument("--shard", type=int, default=0, help="indice de este worker")
    s.add_argument("--shards", type=int, default=1, help="cuantos workers en paralelo")
    s.add_argument("--redo-none", action="store_true", help="reintenta los que quedaron sin texto")
    s.set_defaults(func=cmd_subs)

    f = sub.add_parser("frames")
    f.add_argument("--interval", type=float, default=4.0)
    f.add_argument("--limit", type=int, default=0)
    f.add_argument("--format", default="worstvideo[height<=360]/worstvideo/worst")
    f.add_argument("--year", type=int, action="append")
    f.add_argument("--max-priority", type=int, default=None)
    f.add_argument("--queue-file", default="")
    f.set_defaults(func=cmd_frames)

    r = sub.add_parser("report")
    r.set_defaults(func=cmd_report)

    args = ap.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())

