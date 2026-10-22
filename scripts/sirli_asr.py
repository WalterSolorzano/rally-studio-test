"""Transcribe en local los videos que YouTube no expone con subtitulos.

Baja el audio (no descarga video), lo decodifica con el ffmpeg de imageio_ffmpeg y
lo pasa por faster-whisper en CPU. Escribe el mismo esquema que sirli_videos.py pero
con caption_source "whisper-<modelo>-local".

Uso:
    python scripts/sirli_asr.py --scope intl --model medium
    python scripts/sirli_asr.py --scope queue --limit 5
    python scripts/sirli_asr.py --scope all --model small --jobs 1
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import subprocess
import sys
import time
import wave
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
TRANS = SIRLI / "transcripts"
AUDIO = ROOT / "tmp" / "asr"
MODELS = ROOT / "tmp" / "models"
QUEUE = SIRLI / "video_queue.jsonl"
AN = SIRLI / "analisis"
AUDIO_CSV = AN / "audio.csv"

AUDIO_COLS = [
    "video_id", "duration_s", "rms_db", "rms_std_db", "silencio_pct", "habla_pct",
    "zcr", "centroide_hz", "rolloff_hz", "planitud", "onsets_por_s",
    "dinamica_db", "cambios_energia", "speech_s", "segmentos", "wpm",
]

FOCUS_COUNTRY = "NICARAGUA"


def log(msg: str) -> None:
    print(f"[{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S+00:00')}] {msg}", flush=True)


def norm(s: str) -> str:
    s = (s or "").upper()
    for a, b in (("Á", "A"), ("É", "E"), ("Í", "I"), ("Ó", "O"), ("Ú", "U"), ("Ü", "U")):
        s = s.replace(a, b)
    return s


def load_winners() -> list[dict]:
    rows = []
    for line in (SIRLI / "winners.jsonl").read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def output_path(video_id: str) -> Path:
    return TRANS / f"{video_id}.json"


def has_text(video_id: str) -> bool:
    p = output_path(video_id)
    if not p.exists():
        return False
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return False
    return bool((d.get("text") or "").strip())


def build_targets(scope: str, limit: int | None, collection_filter: str = "", since_year: int = 0,
                  places: tuple[int, ...] = (), video_file: str = "") -> list[dict]:
    """Devuelve un registro por video con awards agrupados."""
    winners = load_winners()
    only: set[str] | None = None
    if video_file:
        with open(video_file, encoding="utf-8") as fh:
            only = {ln.strip() for ln in fh if ln.strip()}
    by_video: dict[str, dict] = {}
    for w in winners:
        vid = w.get("video_id")
        if not vid:
            continue
        collection = w["collection"]
        country = norm(w.get("country"))
        if collection == "internacional":
            in_scope = True
        elif collection == "nacional":
            in_scope = country == FOCUS_COUNTRY
        else:
            in_scope = country == FOCUS_COUNTRY
        if scope == "intl":
            in_scope = in_scope and collection == "internacional"
        if scope == "todos":
            in_scope = True
        if not in_scope:
            continue
        if only is not None and vid not in only:
            continue
        if collection_filter and collection != collection_filter:
            continue
        if since_year and int(w["year"]) < since_year:
            continue
        if places and w.get("place") not in places:
            continue
        rec = by_video.setdefault(
            vid,
            {
                "video_id": vid,
                "url": w["video_url"],
                "year": w["year"],
                "collection": collection,
                "country": w.get("country"),
                "team": w.get("team"),
                "place_label": w.get("place_label"),
                "priority": {0: 0, 1: 1}.get({"internacional": 0, "nacional": 1}.get(collection, 2), 2),
                "awards": [],
            },
        )
        rec["awards"].append(
            {
                "year": w["year"],
                "collection": collection,
                "place_label": w.get("place_label"),
                "team": w.get("team"),
                "challenge": w.get("challenge"),
            }
        )

    targets = [r for r in by_video.values() if not has_text(r["video_id"])]
    targets.sort(key=lambda r: (r["priority"], -int(r["year"]), norm(r["country"]), r["team"] or ""))
    if limit:
        targets = targets[:limit]
    return targets


CLIENTS = ("web_safari", "mweb", "web_embedded", "")


def download_audio(video_id: str, attempts: int = 2) -> Path | None:
    """Baja el audio probando varios clientes del reproductor.

    Algunos videos solo se sirven por un cliente concreto; si un cliente no da
    formatos se pasa al siguiente antes de gastar un reintento.
    """
    AUDIO.mkdir(parents=True, exist_ok=True)
    out_tpl = str(AUDIO / f"{video_id}.%(ext)s")
    base = ["yt-dlp", "--js-runtimes", "node", "--no-warnings", "--no-progress"]
    url = f"https://www.youtube.com/watch?v={video_id}"
    last = "sin salida"
    for n in range(attempts):
        for client in CLIENTS:
            extra = ["--extractor-args", f"youtube:player_client={client}"] if client else []
            cmd = base + extra + ["-f", "worstaudio/worst", "-o", out_tpl, url]
            proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
            files = sorted(AUDIO.glob(f"{video_id}.*"))
            if proc.returncode == 0 and files:
                return files[0]
            lines = (proc.stderr or proc.stdout or "").strip().splitlines()
            last = lines[-1] if lines else "sin salida"
            if "429" in last or "Too Many Requests" in last:
                wait = 20 * (n + 1)
                log(f"{video_id}: 429, espero {wait}s")
                time.sleep(wait)
                break
    log(f"{video_id}: {last[:120]}")
    return None


def load_audio(path: Path) -> np.ndarray | None:
    from imageio_ffmpeg import get_ffmpeg_exe

    proc = subprocess.run(
        [get_ffmpeg_exe(), "-v", "quiet", "-i", str(path), "-ac", "1", "-ar", "16000", "-f", "wav", "-"],
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0 or len(proc.stdout) < 2000:
        return None
    with wave.open(io.BytesIO(proc.stdout)) as w:
        raw = w.readframes(w.getnframes())
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    return text


def audio_features(vid: str, audio: np.ndarray) -> dict:
    """Rasgos objetivos del audio. Todo en numpy, sin dependencias nuevas.

    Las ventanas son de 25 ms con salto de 10 ms, suficiente para energía y
    espectro aproximado; no pretende ser un analizador musical.
    """
    sr = 16000
    n = len(audio)
    dur = n / sr
    win, hop = 400, 160
    if n < win * 2:
        return {}
    frames = np.lib.stride_tricks.sliding_window_view(audio, win)[::hop]
    rms = np.sqrt((frames ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-12)
    piso = float(np.percentile(db, 10))
    umbral = max(piso + 8.0, -55.0)
    habla = db > umbral

    # ZCR
    sign = np.signbit(frames)
    zcr = float((sign[:, 1:] != sign[:, :-1]).mean())

    # Espectro (magnitud) por ventana
    spec = np.abs(np.fft.rfft(frames * np.hanning(win), axis=1)) + 1e-12
    freqs = np.fft.rfftfreq(win, 1 / sr)
    pot = spec ** 2
    total = pot.sum(axis=1) + 1e-12
    centroide = float((pot * freqs).sum(axis=1).mean() / total.mean())
    acum = np.cumsum(pot, axis=1)
    roll = freqs[np.argmax(acum >= 0.85 * acum[:, -1:], axis=1)].mean()
    planitud = float(np.exp(np.log(spec).mean(axis=1)).mean() / spec.mean(axis=1).mean())

    # Cambios de energía: picos de derivada positiva por segundo
    d = np.diff(db)
    onsets = int(((d[:-1] > 0) & (d[:-1] > 4.0)).sum())
    silencio = float((~habla).mean())
    return dict(
        video_id=vid,
        duration_s=round(dur, 1),
        rms_db=round(float(db[habla].mean()) if habla.any() else float(db.mean()), 2),
        rms_std_db=round(float(db.std()), 2),
        silencio_pct=round(silencio * 100, 1),
        habla_pct=round((1 - silencio) * 100, 1),
        zcr=round(zcr, 5),
        centroide_hz=round(centroide, 1),
        rolloff_hz=round(float(roll), 1),
        planitud=round(planitud, 5),
        onsets_por_s=round(onsets / dur, 2),
        dinamica_db=round(float(np.percentile(db, 95) - np.percentile(db, 5)), 2),
        cambios_energia=onsets,
    )


def write_audio_row(rec: dict) -> None:
    AN.mkdir(parents=True, exist_ok=True)
    nuevo = not AUDIO_CSV.exists()
    with open(AUDIO_CSV, "a", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=AUDIO_COLS, extrasaction="ignore")
        if nuevo:
            w.writeheader()
        w.writerow(rec)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scope", choices=["intl", "queue", "all", "todos"], default="intl",
                    help="intl: solo internacionales; queue: solo los de video_queue.jsonl; all: todo el alcance")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--model", default="medium", help="tiny|base|small|medium|large-v3")
    ap.add_argument("--language", default="es")
    ap.add_argument("--no-download", action="store_true", help="usar audios ya bajados en tmp/asr")
    ap.add_argument("--collection", default="", choices=["", "sede", "nacional", "internacional"])
    ap.add_argument("--since-year", type=int, default=0)
    ap.add_argument("--places", default="", help="puestos separados por coma, ej. 1 o 1,2,3")
    ap.add_argument("--video-file", default="",
                    help="archivo con un video_id por línea; restringe a esos videos")
    ap.add_argument("--no-audio", action="store_true",
                    help="no calcular rasgos de audio (por defecto sí, cuesta ~0,3 s por video)")
    ap.add_argument("--shard", type=int, default=0, help="indice de este proceso (0..shards-1)")
    ap.add_argument("--shards", type=int, default=1, help="numero de procesos en paralelo")
    ap.add_argument("--cpu-threads", type=int, default=0,
                    help="hilos por proceso; 0 = automatico (cores // shards)")
    args = ap.parse_args()

    global AUDIO_CSV
    if args.shards > 1:
        AUDIO_CSV = AN / f"audio_s{args.shard}.csv"

    places = tuple(int(x) for x in args.places.split(",") if x.strip()) if args.places else ()
    targets = build_targets(args.scope, args.limit or None, args.collection, args.since_year, places,
                            args.video_file)
    if args.scope == "queue":
        queued = set()
        for line in QUEUE.read_text(encoding="utf-8").splitlines():
            if line.strip():
                queued.add(json.loads(line)["video_id"])
        targets = [t for t in targets if t["video_id"] in queued]

    if args.shards > 1:
        targets = [t for k, t in enumerate(targets) if k % args.shards == args.shard]
        if not 0 <= args.shard < args.shards:
            log(f"shard {args.shard} fuera de rango 0..{args.shards - 1}")
            return

    log(f"asr {args.model}: {len(targets)} videos sin texto"
        + (f" (shard {args.shard + 1}/{args.shards})" if args.shards > 1 else ""))
    if not targets:
        return

    from faster_whisper import WhisperModel

    hilos = args.cpu_threads or max(1, (os.cpu_count() or 4) // max(1, args.shards))
    t0 = time.time()
    model = WhisperModel(args.model, device="cpu", compute_type="int8",
                         download_root=str(MODELS), cpu_threads=hilos)
    log(f"modelo {args.model} listo en {time.time() - t0:.0f}s ({hilos} hilos)")

    TRANS.mkdir(parents=True, exist_ok=True)
    ok = fail = 0
    for i, t in enumerate(targets, 1):
        vid = t["video_id"]
        started = time.time()
        audio_path = sorted(AUDIO.glob(f"{vid}.*"))[0] if sorted(AUDIO.glob(f"{vid}.*")) else None
        if audio_path is None and not args.no_download:
            audio_path = download_audio(vid)
        if audio_path is None:
            fail += 1
            log(f"[{i}/{len(targets)}] {vid} sin audio (video restringido)")
            continue
        audio = load_audio(audio_path)
        if audio is None or len(audio) / 16000 < 3:
            audio_path.unlink(missing_ok=True)
            fail += 1
            log(f"[{i}/{len(targets)}] {vid} audio vacio")
            continue

        segments, info = model.transcribe(
            audio, language=args.language, vad_filter=True, beam_size=1,
        )
        parts = []
        segs_out = []
        for s in segments:
            parts.append(s.text.strip())
            segs_out.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()})
        text = clean_text(" ".join(parts))

        if not args.no_audio:
            try:
                af = audio_features(vid, audio)
                if af:
                    habla_s = sum(max(0.0, s["end"] - s["start"]) for s in segs_out)
                    palabras = len(text.split())
                    af.update(
                        speech_s=round(habla_s, 1),
                        segmentos=len(segs_out),
                        wpm=round(palabras / habla_s * 60, 1) if habla_s > 5 else "",
                    )
                    write_audio_row(af)
            except Exception as exc:  # nunca tumbar la transcripción por esto
                log(f"{vid}: audio features fallaron ({exc})")

        rec = dict(t)
        rec.update(
            fetched_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
            caption_source=f"whisper-{args.model}-local",
            language=info.language or args.language,
            text=text,
            segments=segs_out,
            has_info=False,
            duration_s=round(len(audio) / 16000, 1),
        )
        output_path(vid).write_text(json.dumps(rec, ensure_ascii=False, indent=1), encoding="utf-8")
        audio_path.unlink(missing_ok=True)
        ok += 1
        log(
            f"[{i}/{len(targets)}] {vid} {t['year']} {len(text)} chars "
            f"{time.time() - started:.0f}s {t['team']}"
        )

    log(f"asr: terminado, {ok} transcritos, {fail} sin audio")


if __name__ == "__main__":
    sys.exit(main())
