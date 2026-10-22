#!/usr/bin/env python3
"""
build_shotlist.py -- Compila los contratos de tomas en la shotlist del video.

Entra:  shots/<id>.yaml   (un archivo por toma; lo escribe el DIRECTOR)
Sale:   script/shotlist.csv (contrato compartido; zona del guionista)

Nadie produce contenido si este compilador no termina limpio: si hay errores,
se listan y no se escribe el CSV (evita contratos rotos en circulacion).

Columnas de coordinacion exigidas (ademas de las base):
    rubric_item   criterio de la rubrica que la toma sostiene (D1)
    claim_ids     entradas de research/claims.json que la toma cita
    owner         especialista responsable de la pieza
    depends_on    otras tomas de las que depende (orden/entregables)
    quality_tier  draft | revisar | final   (presupuesto en env.json, D7)

Uso:
    python scripts/build_shotlist.py            # compilar y validar
"""
import csv
import json
import sys
import io
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DIR_SHOTS = RAIZ / "shots"
SALIDA = RAIZ / "script" / "shotlist.csv"
ARCHIVO_CLAIMS = RAIZ / "research" / "claims.json"

COLUM_BASE = ["id", "act", "description", "asset_id", "asset_type",
              "duration_s", "status", "notes"]
COLUM_COORD = ["rubric_item", "claim_ids", "owner", "depends_on", "quality_tier"]
COLUMNAS = COLUM_BASE + COLUM_COORD

OWNERS_VALIDOS = {"guionista", "modeler", "pautador", "presupuestador",
                  "investigador", "grafista2d", "director"}
STATUS_VALIDOS = {"pendiente", "asignado", "borrador", "revisado",
                  "integrado", "bloqueado"}
TIERS_VALIDOS = {"draft", "revisar", "final"}


def _cargar_yaml(ruta: Path):
    try:
        import yaml  # type: ignore
    except ImportError:
        print("Falta PyYAML: instala con 'pip install pyyaml'.")
        sys.exit(2)
    return yaml.safe_load(ruta.read_text(encoding="utf-8"))


def _cargar_ids_utc_claim() -> set:
    if not ARCHIVO_CLAIMS.exists():
        return set()
    try:
        datos = json.loads(ARCHIVO_CLAIMS.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return set()
    if isinstance(datos, list):
        return {str(c.get("id", "")) for c in datos if isinstance(c, dict)}
    if isinstance(datos, dict):
        return set(datos.keys())
    return set()


def cargar_shots() -> tuple[list[dict], list[str]]:
    """Lee shots/*.yaml y valida. Devuelve (filas, errores)."""
    errores: list[str] = []
    filas: list[dict] = []
    archivos = sorted(DIR_SHOTS.glob("*.yaml")) if DIR_SHOTS.exists() else []
    ids_utc = _cargar_ids_utc_claim()
    vistos: set = set()
    for ruta in archivos:
        try:
            d = _cargar_yaml(ruta) or {}
        except Exception as e:
            errores.append(f"{ruta.name}: YAML ilegible ({e})")
            continue
        fid = str(d.get("id", ruta.stem))
        if fid in vistos:
            errores.append(f"{ruta.name}: id duplicado '{fid}'")
        vistos.add(fid)

        for campo in ("rubric_item", "owner", "asset_id", "asset_type", "act"):
            if not str(d.get(campo, "")).strip():
                errores.append(f"{ruta.name}: falta campo obligatorio '{campo}'")
        owner = str(d.get("owner", "")).strip()
        if owner and owner not in OWNERS_VALIDOS:
            errores.append(f"{ruta.name}: owner '{owner}' no es especialista conocido "
                           f"({sorted(OWNERS_VALIDOS)})")
        tier = str(d.get("quality_tier", "")).strip()
        if tier and tier not in TIERS_VALIDOS:
            errores.append(f"{ruta.name}: quality_tier '{tier}' invalido (draft|revisar|final)")
        status = str(d.get("status", "pendiente")).strip()
        if status not in STATUS_VALIDOS:
            errores.append(f"{ruta.name}: status '{status}' invalido ({sorted(STATUS_VALIDOS)})")
        try:
            dur = float(d.get("duration_s", 0) or 0)
            if dur < 0:
                errores.append(f"{ruta.name}: duration_s negativo")
        except (TypeError, ValueError):
            errores.append(f"{ruta.name}: duration_s no es numero")
        claims = _v(d.get("claim_ids"))
        if ids_utc:
            for c in claims:
                if c not in ids_utc:
                    errores.append(f"{ruta.name}: claim_id '{c}' no existe en research/claims.json")

        fila = {k: d.get(k, "") for k in COLUMNAS}
        fila["id"] = fid
        fila["status"] = status or "pendiente"
        fila["depends_on"] = ", ".join(_v(d.get("depends_on")))
        fila["claim_ids"] = ", ".join(claims)
        filas.append(fila)

    # depende de tomas que existan
    ids = {f["id"] for f in filas}
    for f in filas:
        for dep in _v(f["depends_on"]):
            if dep not in ids:
                errores.append(f"S{f['id']}: depends_on '{dep}' no apunta a toma existente")
    return filas, errores


def _v(valor) -> list:
    if valor is None:
        return []
    if isinstance(valor, list):
        return [str(x).strip() for x in valor if str(x).strip()]
    return [t.strip() for t in str(valor).split(",") if t.strip()]


def compilar() -> int:
    filas, errores = cargar_shots()
    if errores:
        print("ERRORES al compilar tomas (no se escribe el CSV):")
        for e in errores:
            print(f"  - {e}")
        return 1
    if not filas:
        print("Sin tomas en shots/: sin despachar (precondicion del orquestador).")
        return 0
    SALIDA.parent.mkdir(exist_ok=True)
    with SALIDA.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNAS)
        w.writeheader()
        for fila in sorted(filas, key=lambda x: str(x["id"])):
            w.writerow(fila)
    print(f"OK: {len(filas)} tomas compiladas en {SALIDA} ({SALIDA.relative_to(RAIZ)}).")
    return 0


if __name__ == "__main__":
    if sys.platform == "win32":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.exit(compilar())
