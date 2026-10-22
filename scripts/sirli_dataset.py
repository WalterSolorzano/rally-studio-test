"""Construye el dataset de modelado: una fila por video con sus caracteristicas.

Lee winners.jsonl, meta/videos.jsonl y transcripts/*.json.
Escribe analisis/dataset_videos.csv y analisis/dataset_videos.jsonl.

Las variables de trayectoria (team_prior_awards, country_prior_rate) se calculan
solo con anios anteriores al de la fila, para no filtrar el resultado.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from collections import defaultdict
from datetime import date
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
ANALISIS = SIRLI / "analisis"
TRANS = SIRLI / "transcripts"

SOLUTION_VERBS = (
    "consiste", "propone", "propuesta", "permite", "desarrollamos", "creamos",
    "implementamos", "fabricamos", "disenamos", "diseñamos", "construimos",
    "elaboramos", "transforma", "convierte", "aprovecha", "reduce",
)
CREDIT_WORDS = ("creditos", "créditos", "edicion", "edición", "musica", "música",
                "siguenos", "síguenos", "instagram", "facebook", "whatsapp", "copyright")


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def norm(s: str | None) -> str:
    return re.sub(r"\s+", " ", strip_accents((s or "").lower())).strip()


def theme_of(challenge: str) -> str:
    """Clasificacion gruesa del desafio en un tema (regla por palabra clave)."""
    t = norm(challenge)
    reglas = [
        ("residuos", ("residuo", "basura", "desecho", "recicl", "plastico", "compost")),
        ("agua", ("agua", "hidric", "potable", "riego", "acuifer")),
        ("vivienda", ("vivienda", "casa", "hogar", "techo", "habitacional")),
        ("digital", ("digital", "tecnolog", "app", "software", "plataforma", "sensor", "inteligencia artificial")),
        ("energia", ("energia", "solar", "electric", "biogas")),
        ("inclusion", ("discapacidad", "inclusion", "accesib", "sordo", "ciego")),
        ("genero", ("mujer", "genero", "violencia")),
        ("salud", ("salud", "medic", "paciente", "enfermedad")),
        ("educacion", ("educacion", "escuela", "estudiante", "docente", "aprendizaje")),
        ("movilidad", ("movilidad", "transporte", "trafico", "vehicul")),
        ("agro", ("agro", "agricola", "cafe", "cacao", "cultivo", "suelo", "campesin")),
        ("alimentacion", ("alimento", "nutricion", "comida", "hambre")),
        ("clima", ("clima", "inundacion", "sequia", "huracan")),
        ("turismo", ("turismo", "cultura", "patrimonio", "artesania")),
        ("emprendimiento", ("emprendimiento", "negocio", "pyme", "mipyme", "comercial")),
    ]
    for tema, claves in reglas:
        if any(k in t for k in claves):
            return tema
    return "otro"


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def marker_features(text: str) -> dict:
    t = norm(text)
    def has(*pats: str) -> int:
        return int(any(re.search(p, t) for p in pats))

    return {
        "t_hook_pregunta": has(r"¿", r"\bte has preguntado\b", r"\bimagina\b"),
        "t_problema": has(r"\bproblema\b", r"\bnecesidad\b", r"\bdificultad\b", r"\bafecta\b", r"\bcarece\b"),
        "t_solucion": has(r"\bsolucion\b", r"\bpropuesta\b", r"\bprototipo\b", r"\bdesarrollamos\b", r"\bcreamos\b"),
        "t_impacto": has(r"\bimpacto\b", r"\bbenefici", r"\bfamilias\b", r"\bcomunidad\b", r"\bods\b", r"\bsostenible\b"),
        "t_equipo": has(r"\bsomos\b", r"\bequipo\b", r"\buniversidad\b", r"\bestudiantes\b"),
        "t_cierre": has(r"\bgracias\b", r"\bvota\b", r"\bapoyanos\b"),
        "t_testimonio": has(r"\bnos conto\b", r"\btestimonio\b", r"\bdijo que\b"),
        "t_demo": has(r"\baqui\b", r"\bvean\b", r"\bfunciona\b", r"\bprobamos\b"),
        "t_cifras": len(re.findall(r"\b\d+([.,]\d+)?\s?%", t)),
    }


def build() -> pd.DataFrame:
    winners = load_jsonl(SIRLI / "winners.jsonl")
    meta = {m["video_id"]: m for m in load_jsonl(SIRLI / "meta" / "videos.jsonl")}
    transcripts = {}
    for f in TRANS.glob("*.json"):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if (d.get("text") or "").strip():
            transcripts[d["video_id"]] = d

    # agrupacion por edicion: un video puede competir en sede y en internacional
    by_video: dict[tuple, list[dict]] = defaultdict(list)
    for w in winners:
        if w.get("video_id"):
            by_video[(w["video_id"], w["collection"], int(w["year"]))].append(w)

    # tamano de sede y presion competitiva por desafio
    sede_size: dict[tuple, int] = defaultdict(int)
    desafio_size: dict[tuple, int] = defaultdict(int)
    desafio_anio: dict[tuple, int] = defaultdict(int)
    desafio_hist: dict[tuple, int] = defaultdict(int)
    for w in winners:
        key = (w["year"], w["collection"], norm(w.get("sede")))
        sede_size[key] += 1
        desafio_size[key + (norm(w.get("challenge_name")),)] += 1
        desafio_anio[(w["year"], w["collection"], norm(w.get("challenge_name")))] += 1
        desafio_hist[(w["collection"], norm(w.get("challenge_name")))] += 1

    # trayectoria de equipo por anio
    awards_por_equipo: dict[str, list[int]] = defaultdict(list)
    for w in winners:
        if w.get("place"):
            awards_por_equipo[norm(w.get("team"))].append(int(w["year"]))

    # tasa historica del pais (solo anios anteriores, suavizada)
    por_pais: dict[tuple, list[int]] = defaultdict(list)
    for w in winners:
        por_pais[(w["collection"], norm(w.get("country")))].append(
            (int(w["year"]), 1 if w.get("place") == 1 else 0)
        )

    def country_rate(collection: str, country: str, year: int) -> float:
        prev = [x for y, x in por_pais.get((collection, norm(country)), []) if y < year]
        return round((sum(prev) + 1) / (len(prev) + 2), 4)

    rows = []
    for (vid, collection, edition_year), awards in by_video.items():
        awards.sort(key=lambda w: w.get("place") or 9)
        best = awards[0]
        m = meta.get(vid, {})
        t = transcripts.get(vid)
        year = edition_year
        place = min((a["place"] for a in awards if a.get("place")), default=None)

        dur = m.get("length_s") or None
        title = m.get("title") or ""
        desc = m.get("description") or ""
        desc_n = norm(desc)
        lines = [l for l in re.split(r"[\n.!?]+", desc) if len(l.strip()) > 25]

        row = {
            "video_id": vid,
            "year": year,
            "collection": best["collection"],
            "country": best.get("country"),
            "sede": best.get("sede"),
            "category": best.get("category"),
            "challenge_number": best.get("challenge_number"),
            "challenge_name": best.get("challenge_name"),
            "challenge_theme": theme_of(best.get("challenge") or ""),
            "team": best.get("team"),
            "place_best": place,
            "n_awards": len(awards),
            "won": int(place == 1) if place else None,
            "sede_size": sede_size[(best["year"], best["collection"], norm(best.get("sede")))],
            "challenge_size_sede": desafio_size[
                (best["year"], best["collection"], norm(best.get("sede")), norm(best.get("challenge_name")))
            ],
            "challenge_size": desafio_anio[
                (best["year"], best["collection"], norm(best.get("challenge_name")))
            ],
            "challenge_total": desafio_hist[
                (best["collection"], norm(best.get("challenge_name")))
            ],
            "team_prior_awards": sum(1 for y in awards_por_equipo[norm(best.get("team"))] if y < year),
            "country_prior_rate": country_rate(best["collection"], best.get("country"), year),
            "has_meta": int(bool(m) and not m.get("failed")),
            "has_text": int(t is not None),
            "duration_s": dur,
            "duration_ratio": round(dur / 120, 3) if dur else None,
            "over_limit": int(dur > 120) if dur else None,
            "title_len": len(title),
            "title_words": len(title.split()),
            "desc_len": len(desc),
            "desc_lines": len(lines),
            "desc_util": int(len(desc) > 80),
            "desc_has_url": int("http" in desc or "www." in desc),
            "desc_credits": int(any(c in desc_n for c in CREDIT_WORDS)),
            "desc_specificity": int(any(v in desc_n for v in SOLUTION_VERBS)),
            "views": m.get("view_count"),
            "likes": m.get("like_count"),
        }

        if t:
            text = t["text"]
            words = len(text.split())
            mins = (dur / 60) if dur else (t.get("duration_s") or 120) / 60
            row.update(
                text_words=words,
                wpm=round(words / mins, 1) if mins else None,
                caption_source=t.get("caption_source"),
                **marker_features(text),
            )
        else:
            row.update(text_words=None, wpm=None, caption_source=None,
                       t_hook_pregunta=None, t_problema=None, t_solucion=None,
                       t_impacto=None, t_equipo=None, t_cierre=None,
                       t_testimonio=None, t_demo=None, t_cifras=None)
        rows.append(row)

    df = pd.DataFrame(rows)
    return df.sort_values(["year", "collection", "place_best", "team"]).reset_index(drop=True)


def audit(df: pd.DataFrame) -> None:
    print(f"filas: {len(df)} ediciones (video × colección × año)")
    print(f"videos repetidos entre ediciones: {df['video_id'].duplicated().sum()}")
    for col in ("duration_s", "title_len", "desc_len", "place_best", "has_text"):
        pct = 100 * df[col].notna().mean()
        print(f"cobertura {col}: {pct:.1f}%")
    print("distribucion de puesto:")
    print(df["place_best"].value_counts(dropna=False).sort_index().to_string())
    print("tasa de primer lugar por coleccion:")
    print(df.groupby("collection")["won"].agg(["count", "mean"]).round(3).to_string())
    print(f"con texto: {int(df['has_text'].sum())} ediciones de {df[df['has_text'] == 1]['video_id'].nunique()} videos")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ANALISIS.mkdir(parents=True, exist_ok=True)
    df = build()
    out_csv = ANALISIS / "dataset_videos.csv"
    out_jsonl = ANALISIS / "dataset_videos.jsonl"
    df.to_csv(out_csv, index=False, encoding="utf-8-sig")
    df.to_json(out_jsonl, orient="records", lines=True, force_ascii=False)
    audit(df)
    print(f"escrito: {out_csv}")
    print(f"escrito: {out_jsonl}")
    print(f"columnas: {len(df.columns)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
