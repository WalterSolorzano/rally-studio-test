#!/usr/bin/env python3
"""
arsenal.py -- Gestor del arsenal de Rally Studio.

Subcomandos:
  check-duracion [archivos...]   Regla oficial <= 120 s (ffprobe/ffmpeg).
  check-coherencia               Cruza cifras guion / narracion / pautado.
  check-campo [docx]             Caracteres por campo contra la plantilla.
  check-todo                     Los tres checks en orden de gravedad.
  refresh [--write]              Actualiza versiones en arsenal.lock.yaml.
  status                         Resume el registro sin ejecutar checks.

Uso tipico antes de SIRLI:
  python arsenal.py check-todo
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import pathlib
import re
import shutil
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent
LOCK = RAIZ / "arsenal.lock.yaml"

# Permite `python arsenal.py` desde cualquier carpeta del repo.
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from checks import campo_chars, coherencia, duracion  # noqa: E402


def _version_comando(nombre: str, args: list[str]) -> str:
    exe = shutil.which(nombre) or shutil.which(f"{nombre}.exe")
    if not exe:
        return ""
    try:
        salida = subprocess.run(
            [exe, *args], capture_output=True, text=True, errors="replace", timeout=20,
        )
        texto = (salida.stdout or "") + (salida.stderr or "")
        match = re.search(r"\d+\.\d+(?:\.\d+)?", texto)
        return match.group(0) if match else "detectado"
    except Exception:
        return ""


def _version_paquete(modulo: str, dist: str | None = None) -> str:
    if importlib.util.find_spec(modulo) is None:
        return ""
    try:
        from importlib.metadata import version

        return version(dist or modulo)
    except Exception:
        return "instalado"


def _leer_lock() -> dict:
    import yaml

    if not LOCK.exists():
        return {"version": 1, "actualizado": "", "proposito": ""}
    return yaml.safe_load(LOCK.read_text(encoding="utf-8")) or {}


def _escribir_lock(datos: dict) -> None:
    import yaml

    LOCK.write_text(
        yaml.safe_dump(datos, allow_unicode=True, sort_keys=False, width=100),
        encoding="utf-8",
    )


def cmd_refresh(args: argparse.Namespace) -> int:
    datos = _leer_lock()
    detectadas = {
        "ffmpeg": _version_comando("ffmpeg", ["-version"]),
        "ffprobe": _version_comando("ffprobe", ["-version"]),
        "blender": _version_comando("blender", ["--version"]),
        "node": _version_comando("node", ["--version"]),
        "python": sys.version.split()[0],
        "edge-tts": _version_paquete("edge_tts"),
        "kokoro": _version_paquete("kokoro"),
        "chatterbox-tts": _version_paquete("chatterbox"),
        "piper-tts": _version_paquete("piper"),
        "python-docx": _version_paquete("docx", "python-docx"),
        "openpyxl": _version_paquete("openpyxl"),
        "pillow": _version_paquete("PIL", "pillow"),
        "pyyaml": _version_paquete("yaml", "pyyaml"),
    }
    if not detectadas["ffmpeg"]:
        ffmpeg = duracion.find_ffmpeg()
        if ffmpeg:
            detectadas["ffmpeg"] = _version_comando(ffmpeg, ["-version"]) or "imageio-ffmpeg"
    if not detectadas["ffprobe"]:
        ffprobe = duracion.find_ffprobe()
        if ffprobe:
            detectadas["ffprobe"] = _version_comando(ffprobe, ["-version"])

    for categoria, entradas in datos.items():
        if not isinstance(entradas, list):
            continue
        for entrada in entradas:
            if not isinstance(entrada, dict):
                continue
            nombre = entrada.get("nombre", "")
            if nombre in detectadas:
                entrada["version"] = detectadas[nombre]
    datos["actualizado"] = "2026-10-19"

    print(f"  {'HERRAMIENTA':<18} VERSION")
    for nombre, version in detectadas.items():
        estado = version or "no detectado"
        print(f"  {nombre:<18} {estado}")

    if args.write:
        _escribir_lock(datos)
        print(f"\n  OK: {LOCK} actualizado.")
    else:
        print("\n  Modo lectura. Usa --write para guardar.")
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    datos = _leer_lock()
    print(f"  arsenal.lock.yaml -- actualizado: {datos.get('actualizado', 'sin fecha')}\n")
    for categoria, entradas in datos.items():
        if not isinstance(entradas, list):
            continue
        print(f"  {categoria.upper()}")
        for entrada in entradas:
            if not isinstance(entrada, dict):
                continue
            nombre = entrada.get("nombre", "?")
            estado = entrada.get("estado", "?")
            licencia = entrada.get("licencia", "?")
            version = entrada.get("version") or "-"
            print(f"    {nombre:<18} {version:<10} {estado:<16} {licencia}")
        print()
    return 0


def cmd_duracion(args: argparse.Namespace) -> int:
    rutas = [pathlib.Path(p) for p in args.archivos] if args.archivos else [
        pathlib.Path("assets/voice/narration.mp4"),
    ]
    presentes = [p for p in rutas if p.exists()]
    if not presentes:
        print("  PENDIENTE: no hay video ni locucion para medir.")
        print("  Buscado: " + ", ".join(str(p) for p in rutas))
        return 1
    hallazgos: list[dict] = []
    for ruta in presentes:
        segundos, _, motor = duracion.medir(ruta)
        etiqueta = f"{segundos:.1f} s" if segundos is not None else "ilegible"
        print(f"  {ruta}: {etiqueta} [{motor}]")
        hallazgos.extend(duracion.revisar(ruta))
    print(duracion.formatear(hallazgos))
    return 1 if any(h["gravedad"] == "critico" for h in hallazgos) else 0


def cmd_coherencia(args: argparse.Namespace) -> int:
    ignorar = {coherencia._canonico(coherencia._normalizar_token(x)) for x in args.ignorar}
    fuentes: dict[str, dict] = {}
    for nombre, ruta in {
        "guion": pathlib.Path(args.guion),
        "narracion": pathlib.Path(args.narracion),
        "pautado": pathlib.Path(args.pautado),
    }.items():
        if not ruta.exists():
            print(f"  PENDIENTE: {nombre} no existe ({ruta}).")
            continue
        fuentes[nombre] = coherencia.desde_archivo(ruta)
        print(f"  {nombre}: {len(fuentes[nombre])} cifras distintas")
    if len(fuentes) < 2:
        print("  PENDIENTE: hacen falta al menos dos entregables.")
        return 1
    if "pautado" not in fuentes:
        print("  PENDIENTE: sin pautado no se puede cerrar la coherencia antes de SIRLI.")
        return 1
    hallazgos = coherencia.comparar(fuentes, ignorar)
    if not hallazgos:
        print("  OK: las cifras coinciden.")
        return 0
    for h in hallazgos:
        icono = "!" if h["gravedad"] == "importante" else "."
        print(f"  [{icono}] {h['que']}")
        print(f"      -> {h['hacer']}")
    importantes = [h for h in hallazgos if h["gravedad"] == "importante"]
    print(f"\n  {len(importantes)} significativas de {len(hallazgos)} discrepancias.")
    return 1 if importantes else 0


def cmd_campo(args: argparse.Namespace) -> int:
    docx_path = pathlib.Path(args.docx)
    plantilla = pathlib.Path(args.plantilla)
    if not docx_path.exists():
        print(f"  PENDIENTE: {docx_path} no existe.")
        return 1
    hallazgos, conteos = campo_chars.revisar(docx_path, plantilla)
    print("  CAMPO            CUENTA / LIMITE")
    for campo, limite in campo_chars.LIMITS.items():
        cuenta = conteos.get(campo)
        if cuenta is None:
            print(f"  [.] {campo.upper():<13} {'--':>6} / {limite:<6}")
            continue
        marca = "X" if cuenta > limite else "v"
        print(f"  [{marca}] {campo.upper():<13} {cuenta:>6} / {limite:<6}  {(cuenta / limite) * 100:5.1f}%")
    if not hallazgos:
        print("\n  OK: todos los campos respetan su limite.")
        return 0
    print()
    for h in hallazgos:
        icono = "X" if h["gravedad"] == "critico" else "!"
        print(f"  [{icono}] {h.get('campo', '--')}: {h['que']} -> {h['hacer']}")
    return 1 if any(h["gravedad"] == "critico" for h in hallazgos) else 0


def cmd_todo(args: argparse.Namespace) -> int:
    resultados: dict[str, int] = {}
    print("\n== 1. Duracion (regla oficial) ==")
    resultados["duracion"] = cmd_duracion(argparse.Namespace(archivos=args.archivos))
    print("\n== 2. Coherencia de cifras ==")
    resultados["coherencia"] = cmd_coherencia(argparse.Namespace(
        guion=args.guion, narracion=args.narracion, pautado=args.pautado, ignorar=args.ignorar,
    ))
    print("\n== 3. Caracteres por campo ==")
    resultados["campo"] = cmd_campo(argparse.Namespace(docx=args.docx, plantilla=args.plantilla))

    print("\n== RESUMEN ==")
    for nombre, codigo in resultados.items():
        print(f"  {nombre:<12} {'PASA' if codigo == 0 else 'REVISAR'}")
    return 1 if any(resultados.values()) else 0


def construir_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="arsenal.py",
        description="Checks deterministas y registro de herramientas del rally.",
    )
    sub = parser.add_subparsers(dest="comando", required=True)

    p = sub.add_parser("check-duracion", help="Valida <= 120 s y pista de audio")
    p.add_argument("archivos", nargs="*")
    p.set_defaults(func=cmd_duracion)

    p = sub.add_parser("check-coherencia", help="Cruza cifras entre entregables")
    p.add_argument("--guion", default="script/script.md")
    p.add_argument("--narracion", default="script/narration.txt")
    p.add_argument("--pautado", default="docs/pautado_draft.docx")
    p.add_argument("--ignorar", default="", help="Cifras permitidas, separadas por coma")
    p.set_defaults(func=cmd_coherencia)

    p = sub.add_parser("check-campo", help="Caracteres por campo del pautado")
    p.add_argument("--docx", default="docs/pautado_draft.docx")
    p.add_argument("--plantilla", default="docs/pautado_template.docx")
    p.set_defaults(func=cmd_campo)

    p = sub.add_parser("check-todo", help="Los tres checks antes de SIRLI")
    p.add_argument("archivos", nargs="*")
    p.add_argument("--guion", default="script/script.md")
    p.add_argument("--narracion", default="script/narration.txt")
    p.add_argument("--pautado", default="docs/pautado_draft.docx")
    p.add_argument("--docx", default="docs/pautado_draft.docx")
    p.add_argument("--plantilla", default="docs/pautado_template.docx")
    p.add_argument("--ignorar", default="")
    p.set_defaults(func=cmd_todo)

    p = sub.add_parser("refresh", help="Actualiza versiones en arsenal.lock.yaml")
    p.add_argument("--write", action="store_true")
    p.set_defaults(func=cmd_refresh)

    p = sub.add_parser("status", help="Resume el registro")
    p.set_defaults(func=cmd_status)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = construir_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
