#!/usr/bin/env python3
"""Analisis del corpus de videos ganadores SIRLI.

Lee `research/sirli/transcripts/*.json` + `winners.jsonl` y produce:

    analisis/corpus.jsonl   una fila por video con rasgos calculados
    analisis/resumen.json   agregados del corpus
    analisis/patrones.md    lectura corta de que comparten los videos ganadores

Uso:
    python scripts/sirli_analisis.py
"""

from __future__ import annotations

import json
import re
import statistics
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
OUT = SIRLI / "analisis"

THEMES = {
    "agua": ["agua", "hidrico", "hídrico", "potable", "riego", "acuifero", "acuífero", "lluvia"],
    "residuos": ["residuo", "basura", "desecho", "reciclaje", "reciclar", "compost", "plastico", "plástico"],
    "energia": ["energia", "energía", "solar", "electricidad", "biogas", "biogás", "panel"],
    "agro": ["agricola", "agrícola", "cafe", "café", "cacao", "cultivo", "suelo", "campesino", "ganado"],
    "salud": ["salud", "medic", "paciente", "enfermedad", "diagnostico", "diagnóstico", "clinica", "clínica"],
    "educacion": ["educacion", "educación", "escuela", "estudiante", "docente", "aprendizaje", "alfabetizacion"],
    "inclusion": ["discapacidad", "inclusion", "inclusión", "accesibilidad", "sordo", "ciego", "autismo"],
    "movilidad": ["transporte", "movilidad", "trafico", "tráfico", "bus", "vehiculo", "vehículo", "ruta"],
    "vivienda": ["vivienda", "casa", "hogar", "construccion", "construcción", "techo", "habitabilidad"],
    "emprendimiento": ["emprendimiento", "negocio", "pyme", "mipyme", "venta", "comercio", "ingreso"],
    "clima": ["clima", "inundacion", "inundación", "sequia", "sequía", "huracan", "huracán", "riesgo"],
    "digital": ["app", "aplicacion", "aplicación", "software", "plataforma", "digital", "sensor", "iot", "inteligencia artificial"],
    "genero": ["mujer", "genero", "género", "violencia", "empoderamiento"],
    "alimentacion": ["alimento", "nutricion", "nutrición", "comida", "hambre", "dieta", "cosecha"],
    "turismo": ["turismo", "turista", "cultura", "patrimonio", "artesania", "artesanía"],
}

MARKERS = {
    "hook_pregunta": [r"¿", r"\bte has preguntado\b", r"\bimagina\b", r"\bque pasaria si\b"],
    "problema": [r"\bproblema\b", r"\bnecesidad\b", r"\bdificultad\b", r"\bafecta\b", r"\bcarece\b"],
    "solucion": [r"\bsolucion\b", r"\bsolución\b", r"\bpropuesta\b", r"\bprototipo\b", r"\bdesarrollamos\b", r"\bcreamos\b"],
    "impacto": [r"\bimpacto\b", r"\bbenefici", r"\bfamilias\b", r"\bcomunidad\b", r"\bods\b", r"\bsostenible\b"],
    "equipo": [r"\bsomos\b", r"\bequipo\b", r"\buniversidad\b", r"\bestudiantes\b", r"\bcarrera\b"],
    "cierre": [r"\bgracias\b", r"\bmuchas gracias\b", r"\bvota\b", r"\bapoyanos\b", r"\bapóyanos\b"],
    "cifra": [r"\b\d+([.,]\d+)?\s?%", r"\b\d{2,}\b"],
    "testimonio": [r"\bnos conto\b", r"\bnos contó\b", r"\bdijo\b", r"\b testimonio\b"],
    "demo": [r"\baqui\b", r"\baquí\b", r"\bvean\b", r"\bfunciona\b", r"\bprobamos\b"],
}


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", strip_accents(s.lower()))


def tags_for(text: str) -> list[str]:
    t = norm(text)
    hits = []
    for theme, words in THEMES.items():
        if any(norm(w) in t for w in words):
            hits.append(theme)
    return hits


def markers_for(text: str) -> dict:
    t = norm(text)
    return {
        name: bool(any(re.search(p, t) for p in pats))
        for name, pats in MARKERS.items()
        if name != "cifra"
    } | {"cifra": bool(re.search(MARKERS["cifra"][0], t))}


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    OUT.mkdir(parents=True, exist_ok=True)
    winners = [json.loads(l) for l in (SIRLI / "winners.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
    by_video = defaultdict(list)
    for w in winners:
        if w["video_id"]:
            by_video[w["video_id"]].append(w)

    rows = []
    for path in sorted((SIRLI / "transcripts").glob("*.json")):
        d = json.loads(path.read_text(encoding="utf-8"))
        text = d.get("text") or ""
        awards = by_video.get(d["video_id"], [])
        if not text:
            continue
        words = len(text.split())
        dur = d.get("duration_s") or 0
        wpm = round(words / (dur / 60), 1) if dur else None
        rows.append(
            {
                "video_id": d["video_id"],
                "year": d["year"],
                "collection": d["collection"],
                "country": d["country"],
                "team": d["team"],
                "place_label": d["place_label"],
                "duration_s": dur,
                "words": words,
                "wpm": wpm,
                "caption_source": d.get("caption_source"),
                "language": d.get("language"),
                "themes": tags_for(" ".join([text, awards[0]["challenge"] if awards else ""])),
                "challenge": awards[0]["challenge"] if awards else "",
                "sede": awards[0]["sede"] if awards else "",
                "markers": markers_for(text),
                "text": text,
            }
        )

    with (OUT / "corpus.jsonl").open("w", encoding="utf-8") as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")

    def share(key: str) -> dict:
        c = Counter()
        for r in rows:
            if isinstance(r["markers"], dict):
                if r["markers"].get(key):
                    c["si"] += 1
                else:
                    c["no"] += 1
        return {"si": c["si"], "no": c["no"], "pct": round(100 * c["si"] / max(1, len(rows)), 1)}

    theme_count = Counter(t for r in rows for t in r["themes"])
    durations = [r["duration_s"] for r in rows if r["duration_s"]]
    wpm = [r["wpm"] for r in rows if r["wpm"]]
    resumen = {
        "videos_transcritos": len(rows),
        "duracion_media_s": round(statistics.mean(durations)) if durations else None,
        "duracion_mediana_s": round(statistics.median(durations)) if durations else None,
        "palabras_media": round(statistics.mean([r["words"] for r in rows])) if rows else None,
        "wpm_medio": round(statistics.mean(wpm), 1) if wpm else None,
        "marcadores_pct": {k: share(k) for k in ("hook_pregunta", "problema", "solucion", "impacto", "equipo", "cierre", "testimonio", "demo")},
        "temas": theme_count.most_common(),
        "por_coleccion": Counter(r["collection"] for r in rows).most_common(),
    }
    (OUT / "resumen.json").write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in resumen.items() if k != "marcadores_pct"}, ensure_ascii=False, indent=2))
    print("\nmarcadores:", json.dumps(resumen["marcadores_pct"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
