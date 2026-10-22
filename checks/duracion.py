#!/usr/bin/env python3
"""
duracion.py -- Verifica que el video o la locucion no supere los 120 segundos.

Regla oficial del certamen: un video de mas de 120 s descalifica. No es una
observacion de patrones: es una base. Por eso este check falla con codigo 1.

No requiere ffprobe: si solo hay ffmpeg, lee la linea "Duration:" de su salida
de diagnostico. Tambien detecta si el archivo no tiene pista de audio.
"""
from __future__ import annotations

import os
import pathlib
import re
import shutil
import subprocess
import sys

LIMITE_S = 120.0
MARGEN_S = 119.0  # por debajo de esto se duerme tranquilo

_DURATION_RE = re.compile(r"Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)")
_AUDIO_RE = re.compile(r"Stream #\d+:\d+.*?Audio:", re.IGNORECASE)


def _candidatos(nombre: str) -> list[str]:
    return [
        os.environ.get(f"{nombre.upper()}_BINARY", ""),
        shutil.which(nombre) or "",
        shutil.which(f"{nombre}.exe") or "",
        str(pathlib.Path.home() / "AppData/Local/Microsoft/WinGet/Links" / f"{nombre}.exe"),
    ]


def find_ffmpeg() -> str | None:
    """Busca ffmpeg en PATH, variable de entorno, winget o imageio-ffmpeg."""
    for candidato in _candidatos("ffmpeg"):
        if candidato and pathlib.Path(candidato).exists():
            return candidato
    try:
        import imageio_ffmpeg  # type: ignore

        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and pathlib.Path(exe).exists():
            return exe
    except Exception:
        pass
    return None


def find_ffprobe() -> str | None:
    for candidato in _candidatos("ffprobe"):
        if candidato and pathlib.Path(candidato).exists():
            return candidato
    return None


def _probe_con_ffprobe(exe: str, ruta: pathlib.Path) -> tuple[float | None, bool]:
    cmd = [
        exe, "-v", "error",
        "-show_entries", "format=duration:stream=codec_type",
        "-of", "default=noprint_wrappers=1",
        str(ruta),
    ]
    salida = subprocess.run(cmd, capture_output=True, text=True, errors="replace")
    if salida.returncode != 0:
        return None, False
    duracion = None
    tiene_audio = False
    for linea in salida.stdout.splitlines():
        if linea.startswith("duration="):
            try:
                duracion = float(linea.split("=", 1)[1])
            except ValueError:
                pass
        if linea.strip() == "codec_type=audio":
            tiene_audio = True
    return duracion, tiene_audio


def _probe_con_ffmpeg(exe: str, ruta: pathlib.Path) -> tuple[float | None, bool]:
    """ffmpeg -i escribe la metadata en stderr y devuelve codigo != 0."""
    salida = subprocess.run(
        [exe, "-hide_banner", "-i", str(ruta)],
        capture_output=True, text=True, errors="replace",
    )
    texto = salida.stderr
    match = _DURATION_RE.search(texto)
    if not match:
        return None, False
    horas, minutos, segundos = match.groups()
    duracion = int(horas) * 3600 + int(minutos) * 60 + float(segundos)
    return duracion, bool(_AUDIO_RE.search(texto))


def medir(ruta: pathlib.Path) -> tuple[float | None, bool, str]:
    """Devuelve (duracion_s, tiene_audio, motor_usado)."""
    if not ruta.exists():
        return None, False, "no existe"
    ffprobe = find_ffprobe()
    if ffprobe:
        duracion, audio = _probe_con_ffprobe(ffprobe, ruta)
        if duracion is not None:
            return duracion, audio, "ffprobe"
    ffmpeg = find_ffmpeg()
    if ffmpeg:
        duracion, audio = _probe_con_ffmpeg(ffmpeg, ruta)
        if duracion is not None:
            return duracion, audio, "ffmpeg"
    return None, False, "sin ffmpeg/ffprobe"


def revisar(ruta: pathlib.Path) -> list[dict]:
    hallazgos: list[dict] = []
    duracion, audio, motor = medir(ruta)
    if duracion is None:
        hallazgos.append({
            "gravedad": "critico",
            "archivo": str(ruta),
            "que": f"No se pudo leer la duracion ({motor})",
            "hacer": "Instala ffmpeg (winget install Gyan.FFmpeg) o define FFMPEG_BINARY",
        })
        return hallazgos
    if duracion > LIMITE_S:
        hallazgos.append({
            "gravedad": "critico",
            "archivo": str(ruta),
            "que": f"{duracion:.1f} s supera el limite oficial de {LIMITE_S:.0f} s",
            "hacer": "Corta al menos {:.1f} s antes de subir; el exceso descalifica".format(duracion - LIMITE_S),
        })
    elif duracion > MARGEN_S:
        hallazgos.append({
            "gravedad": "importante",
            "archivo": str(ruta),
            "que": f"{duracion:.1f} s entra en la zona de riesgo (> {MARGEN_S:.0f} s)",
            "hacer": "Deja 1-2 s de holgura por redondeos del reproductor",
        })
    if ruta.suffix.lower() in {".mp4", ".mov", ".mkv"} and not audio:
        hallazgos.append({
            "gravedad": "critico",
            "archivo": str(ruta),
            "que": "El contenedor no tiene pista de audio",
            "hacer": "Reexporta con la locucion incluida antes de subir",
        })
    return hallazgos


def formatear(hallazgos: list[dict]) -> str:
    if not hallazgos:
        return "  OK: duracion dentro de la regla oficial (<= 120 s)."
    lineas = []
    for h in hallazgos:
        icono = "X" if h["gravedad"] == "critico" else "!"
        lineas.append(f"  [{icono}] {h['archivo']}: {h['que']} -> {h['hacer']}")
    return "\n".join(lineas)


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    rutas = [pathlib.Path(p) for p in argv] if argv else [
        pathlib.Path("assets/voice/narration.mp4"),
    ]
    presentes = [p for p in rutas if p.exists()]
    if not presentes:
        print("  PENDIENTE: no hay archivos de video/locucion para medir.")
        print("  Rutas buscadas: " + ", ".join(str(p) for p in rutas))
        return 1
    hallazgos: list[dict] = []
    for ruta in presentes:
        duracion, _, motor = medir(ruta)
        etiqueta = f"{duracion:.1f} s" if duracion is not None else "ilegible"
        print(f"  {ruta}: {etiqueta} [{motor}]")
        hallazgos.extend(revisar(ruta))
    print(formatear(hallazgos))
    return 1 if any(h["gravedad"] == "critico" for h in hallazgos) else 0


if __name__ == "__main__":
    raise SystemExit(main())
