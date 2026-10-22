"""Base compartida del libro: carga de datos y utilidades de formato.

Todo lo que el libro afirma sale de aquí. No hay cifras escritas a mano en las
partes: si un número aparece en el texto, viene de `dataset_videos.csv`,
`winners.jsonl`, `sistemico.json` o `audio.csv`.
"""

from __future__ import annotations

import csv
import json
import math
import statistics
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SIRLI = ROOT / "research" / "sirli"
TRANS = SIRLI / "transcripts"
AN = SIRLI / "analisis"
FIG = "figuras"

# --------------------------------------------------------------------------
# formato
# --------------------------------------------------------------------------


def num(x, dec: int = 0) -> str:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return "—"
    s = f"{x:,.{dec}f}"
    return s.replace(",", "@").replace(".", ",").replace("@", ".")


def pct(x, dec: int = 1) -> str:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return "—"
    return f"{x * 100:.{dec}f}".replace(".", ",") + " %"


def pp(x, dec: int = 1) -> str:
    if x is None:
        return "—"
    return f"{x * 100:+.{dec}f}".replace(".", ",") + " pp"


def fp(p) -> str:
    if p is None or (isinstance(p, float) and math.isnan(p)):
        return "—"
    if p < 0.001:
        return "< 0,001"
    return f"{p:.3f}".replace(".", ",")


def tabla(cabeceras: list[str], filas: list[list], alinear: str = "") -> str:
    out = ["| " + " | ".join(cabeceras) + " |"]
    out.append("|" + "|".join("---:" if a == "d" else "---" for a in
                              (alinear.ljust(len(cabeceras), "i")[: len(cabeceras)])) + "|")
    for f in filas:
        out.append("| " + " | ".join(str(c) for c in f) + " |")
    return "\n".join(out)


def fig(nombre: str, pie: str) -> str:
    return f"![{pie}]({FIG}/{nombre})\n\n*{pie}.*"


# --------------------------------------------------------------------------
# carga
# --------------------------------------------------------------------------


def _fila(r: dict) -> dict:
    for k in list(r):
        if k.startswith("\ufeff"):
            r[k.lstrip("\ufeff")] = r.pop(k)
    num_cols = ("year", "place_best", "n_awards", "won", "sede_size", "challenge_size",
                "challenge_size_sede", "challenge_total", "team_prior_awards",
                "country_prior_rate", "has_meta", "has_text", "duration_s",
                "duration_ratio", "over_limit", "title_len", "title_words",
                "desc_len", "desc_lines", "desc_util", "desc_has_url", "desc_credits",
                "desc_specificity", "views", "likes", "text_words", "wpm",
                "t_hook_pregunta", "t_problema", "t_solucion", "t_impacto",
                "t_equipo", "t_cierre", "t_testimonio", "t_demo", "t_cifras")
    for k in num_cols:
        if k in r:
            v = (r[k] or "").strip()
            try:
                r[k] = float(v) if v not in ("", "None", "nan") else None
            except ValueError:
                r[k] = None
    for k in ("year", "place_best", "n_awards", "won", "sede_size", "challenge_size",
              "challenge_size_sede", "challenge_total", "team_prior_awards",
              "has_meta", "has_text", "over_limit", "desc_lines", "desc_util",
              "desc_has_url", "desc_credits", "text_words",
              "t_hook_pregunta", "t_problema", "t_solucion", "t_impacto",
              "t_equipo", "t_cierre", "t_testimonio", "t_demo"):
        if k in r and r[k] is not None:
            r[k] = int(r[k])
    return r


with open(AN / "dataset_videos.csv", encoding="utf-8-sig") as fh:
    DF = [_fila(r) for r in csv.DictReader(fh)]

WINNERS = [json.loads(l) for l in
           (SIRLI / "winners.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]

META: dict[str, dict] = {}
for _l in (SIRLI / "meta" / "videos.jsonl").read_text(encoding="utf-8").splitlines():
    if not _l.strip():
        continue
    _r = json.loads(_l)
    if _r.get("failed"):
        continue
    META[_r["video_id"]] = _r

SIS = json.loads((AN / "sistemico.json").read_text(encoding="utf-8"))
HIP = {h["id"]: h for h in SIS["hipotesis"]}

AUDIO: dict[str, dict] = {}
_ap = AN / "audio.csv"
if _ap.exists():
    with open(_ap, encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            AUDIO[r["video_id"]] = r

# --------------------------------------------------------------------------
# muestras
# --------------------------------------------------------------------------

CORE = [r for r in DF if r["collection"] == "sede" and (r["year"] or 0) >= 2021]
NIC = [r for r in DF if r["country"] == "NICARAGUA"]
NIC_SEDE = [r for r in CORE if r["country"] == "NICARAGUA"]
INTL = [r for r in DF if r["collection"] == "internacional"]
NAC = [r for r in DF if r["collection"] == "nacional"]
TXT = [r for r in DF if r["has_text"] == 1 and (r["text_words"] or 0) > 20]
VIDEOS = len({r["video_id"] for r in DF})
ANIOS = sorted({int(r["year"]) for r in DF if r["year"]})

# --------------------------------------------------------------------------
# estadística
# --------------------------------------------------------------------------


def wilson(k: int, n: int) -> tuple[float, float]:
    if not n:
        return (0.0, 0.0)
    z = 1.96
    p = k / n
    d = 1 + z * z / n
    c = p + z * z / (2 * n)
    m = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return ((c - m) / d, (c + m) / d)


def tasa(filas: list[dict]) -> tuple[int, int, float]:
    n = len(filas)
    k = sum(1 for r in filas if r["won"] == 1)
    return k, n, (k / n if n else 0.0)


def tasa_por(filas: list[dict], clave) -> list[tuple]:
    grupos: dict = defaultdict(list)
    for r in filas:
        grupos[clave(r)].append(r)
    out = []
    for k, g in grupos.items():
        c, n, t = tasa(g)
        out.append((k, c, n, t))
    return out


def mediana(xs) -> float | None:
    xs = [x for x in xs if x is not None]
    return statistics.median(xs) if xs else None


def media(xs) -> float | None:
    xs = [x for x in xs if x is not None]
    return sum(xs) / len(xs) if xs else None


def nombre_pais(cod: str) -> str:
    return {
        "NICARAGUA": "Nicaragua", "MEXICO": "México", "ARGENTINA": "Argentina",
        "COLOMBIA": "Colombia", "EL SALVADOR": "El Salvador", "CHILE": "Chile",
        "GUATEMALA": "Guatemala", "PERU": "Perú", "HONDURAS": "Honduras",
        "COSTA RICA": "Costa Rica", "PANAMA": "Panamá", "ECUADOR": "Ecuador",
        "BOLIVIA": "Bolivia", "PARAGUAY": "Paraguay", "URUGUAY": "Uruguay",
        "BRASIL": "Brasil", "REPUBLICA DOMINICANA": "República Dominicana",
    }.get((cod or "").upper(), (cod or "—").title())


def titulo_limpio(vid: str) -> str:
    m = META.get(vid) or {}
    return (m.get("title") or "").strip()
