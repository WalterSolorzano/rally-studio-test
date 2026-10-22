"""Cierra la fase grande: espera al ASR, saca fotogramas y regenera todo el libro.

Orden:
  1. espera a que no queden procesos sirli_asr / yt-dlp
  2. fotogramas de la cola nueva (300 videos)
  3. dataset -> visual -> figuras -> modelo -> sistemico -> resumen -> excel
  4. libro en markdown, docx y html
  5. escribe cierre2.json y, si se pide, apaga la PC

Uso:
    python scripts/sirli_final2.py                # no apaga
    python scripts/sirli_final2.py --shutdown     # apaga al terminar
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
AN = SIRLI / "analisis"
LOG = SIRLI / "final2.log"

PY = sys.executable


def log(msg: str) -> None:
    linea = f"[{datetime.now(timezone.utc).isoformat(timespec='seconds')}] {msg}"
    print(linea, flush=True)
    with open(LOG, "a", encoding="utf-8") as fh:
        fh.write(linea + "\n")


def workers() -> list[str]:
    cmd = (
        "Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | "
        "Where-Object { $_.CommandLine -match 'sirli_asr|sirli_videos' } | "
        "Select-Object -ExpandProperty ProcessId"
    )
    try:
        out = subprocess.run(["powershell", "-NoProfile", "-Command", cmd],
                             capture_output=True, text=True, timeout=60).stdout
    except subprocess.TimeoutExpired:
        return ["timeout"]
    return [x.strip() for x in out.splitlines() if x.strip()]


def corre(nombre: str, args: list[str], timeout: int = 7200) -> bool:
    log(f"▶ {nombre}")
    t0 = time.time()
    env = {"PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"}
    import os
    e = {**os.environ, **env}
    p = subprocess.run([PY, *args], cwd=str(ROOT), capture_output=True, text=True,
                       timeout=timeout, env=e)
    if p.returncode != 0:
        log(f"✗ {nombre} rc={p.returncode}")
        cola = (p.stderr or "").strip().splitlines()[-6:]
        for l in cola:
            log("   " + l[:200])
        return False
    log(f"✓ {nombre} en {time.time() - t0:.0f}s")
    return True


def corre_paralelo(nombre: str, args: list[str], n: int, timeout: int = 172800) -> bool:
    """Lanza n procesos del mismo script con --shard/--shards y espera a todos."""
    import os
    log(f"? {nombre} x{n}")
    t0 = time.time()
    e = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"}
    procs = []
    for i in range(n):
        hilos = max(1, (os.cpu_count() or 4) // n)
        cmd = [PY, *args, "--shard", str(i), "--shards", str(n), "--cpu-threads", str(hilos)]
        procs.append(subprocess.Popen(cmd, cwd=str(ROOT), stdout=subprocess.DEVNULL,
                                      stderr=subprocess.DEVNULL, env=e))
    limite = t0 + timeout
    for p in procs:
        restante = max(30, int(limite - time.time()))
        try:
            p.wait(timeout=restante)
        except subprocess.TimeoutExpired:
            p.kill()
            log(f"? {nombre} timeout")
            return False
    log(f"V {nombre} en {time.time() - t0:.0f}s ({n} procesos)")
    return all(p.returncode == 0 for p in procs)


def merge_audio() -> None:
    """Une audio_s0.csv, audio_s1.csv... en audio.csv sin duplicar videos."""
    import csv
    destino = AN / "audio.csv"
    partes = sorted(AN.glob("audio_s*.csv"))
    if not partes:
        return
    filas: dict[str, dict] = {}
    cabecera: list[str] = []
    if destino.exists():
        with open(destino, newline="", encoding="utf-8") as fh:
            r = csv.DictReader(fh)
            cabecera = list(r.fieldnames or [])
            for row in r:
                filas[row.get("video_id", "")] = row
    for parte in partes:
        with open(parte, newline="", encoding="utf-8") as fh:
            r = csv.DictReader(fh)
            cabecera = cabecera or list(r.fieldnames or [])
            for row in r:
                filas[row.get("video_id", "")] = row
        parte.unlink(missing_ok=True)
    if not filas or not cabecera:
        return
    with open(destino, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cabecera)
        w.writeheader()
        for row in filas.values():
            w.writerow({k: row.get(k, "") for k in cabecera})
    log(f"audio.csv unificado: {len(filas)} filas")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--shutdown", action="store_true")
    ap.add_argument("--skip-frames", action="store_true")
    ap.add_argument("--extra-asr", action="store_true",
                    help="tras el ASR en curso, transcribir todos los primeros lugares")
    args = ap.parse_args()

    log("final2: esperando a que termine el ASR")
    while True:
        vivos = workers()
        if not vivos:
            break
        time.sleep(120)
    log("ASR terminado")

    if args.extra_asr:
        log("fase 2: todos los primeros lugares del banco")
        corre_paralelo("asr primeros", ["scripts/sirli_asr.py", "--scope", "todos",
                                        "--places", "1", "--model", "small"], n=3)
        log("fase 2 terminada")

    merge_audio()

    if not args.skip_frames:
        cola = SIRLI / "video_queue_frames2.jsonl"
        if cola.exists():
            corre("fotogramas", ["scripts/sirli_videos.py", "frames",
                                 "--queue-file", str(cola), "--interval", "5"])

    pasos = [
        ("dataset", ["scripts/sirli_dataset.py"]),
        ("visual", ["scripts/sirli_visual_stats.py"]),
        ("figuras", ["scripts/sirli_figuras.py"]),
        ("modelo", ["scripts/sirli_modelo.py"]),
        ("probabilidad", ["scripts/sirli_probabilidad.py"]),
        ("sistemico", ["scripts/sirli_sistemico.py"]),
        ("resumen", ["scripts/sirli_resumen_ejecutivo.py"]),
        ("excel", ["scripts/sirli_excel.py"]),
        ("libro", ["scripts/sirli_libro.py"]),
    ]
    for nombre, cmd in pasos:
        corre(nombre, cmd)

    libro = AN / "libro.md"
    if libro.exists():
        for ext, extra in [("docx", ["--toc", "--toc-depth=2"]),
                           ("html", ["--standalone", "--embed-resources", "--toc",
                                     "--toc-depth=2", "--css=libro.css",
                                     "-M", "title=Anatomía de un ganador"])]:
            corre(f"libro.{ext}", ["-m", "pandoc", str(libro), "-o", str(libro.with_suffix("." + ext)),
                                   *extra, "-f", "markdown+pipe_tables", "--resource-path=.",
                                   "-M", "lang=es"])

    resumen = {
        "terminado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "transcripciones": len(list((SIRLI / "transcripts").glob("*.json"))),
        "fotogramas": len(list((SIRLI / "frames").glob("*.jpg"))),
        "audio_filas": (len((AN / "audio.csv").read_text(encoding="utf-8").splitlines()) - 1)
        if (AN / "audio.csv").exists() else 0,
        "libro_bytes": libro.stat().st_size if libro.exists() else 0,
    }
    (SIRLI / "cierre2.json").write_text(json.dumps(resumen, indent=1, ensure_ascii=False),
                                        encoding="utf-8")
    log(f"listo: {resumen}")

    if args.shutdown:
        subprocess.run(["shutdown", "/s", "/t", "120", "/c",
                        "Pipeline SIRLI terminado: libro y datos listos"], check=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
