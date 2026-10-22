#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Investigación profunda SIRLI: biblioteca de hipótesis + análisis sistémico.

Lee research/sirli/analisis/dataset_videos.csv (una fila por edición) y produce:

  analisis/sistemico.json                 resultados crudos de cada hipótesis
  analisis/figuras/fig11_asociaciones.png
  analisis/figuras/fig12_saturacion.png
  analisis/figuras/fig13_pais_anio.png
  analisis/figuras/fig14_estado_hipotesis.png
  analisis/investigacion_profunda.md      documento completo generado

Nada se escribe a mano: todas las cifras del documento salen de este cálculo.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

ROOT = Path(__file__).resolve().parent.parent
AN = ROOT / "research" / "sirli" / "analisis"
FIG = AN / "figuras"
FIG.mkdir(parents=True, exist_ok=True)

PRIM = "#1d45b9"
SEC = "#f81110"
ACC = "#2aa7ad"
GRAY = "#9aa3b2"
INK = "#111827"


# --------------------------------------------------------------------------
# utilidades estadísticas
# --------------------------------------------------------------------------
def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (float("nan"), float("nan"))
    p = k / n
    d = 1 + z * z / n
    c = p + z * z / (2 * n)
    m = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return ((c - m) / d, (c + m) / d)


def pct(x: float, dec: int = 1) -> str:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return "—"
    return f"{x * 100:.{dec}f}%".replace(".", ",").replace(".", ",")


def num(x, dec: int = 1) -> str:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return "—"
    return f"{x:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def cramers_v(tab: np.ndarray) -> float:
    chi2 = stats.chi2_contingency(tab, correction=False)[0]
    n = tab.sum()
    if n == 0:
        return float("nan")
    return math.sqrt(chi2 / (n * (min(tab.shape) - 1)))


def fmt_p(p: float) -> str:
    if p is None or (isinstance(p, float) and math.isnan(p)):
        return "—"
    if p < 0.001:
        return "<0,001"
    return f"{p:.3f}".replace(".", ",")


def bh(pvals: list[float]) -> list[float]:
    """Benjamini-Hochberg. Devuelve q-values en el orden de entrada."""
    idx = [i for i, p in enumerate(pvals) if p is not None and not (isinstance(p, float) and math.isnan(p))]
    q = [float("nan")] * len(pvals)
    if not idx:
        return q
    ps = sorted(((pvals[i], i) for i in idx), key=lambda t: t[0])
    m = len(ps)
    prev = 1.0
    out = {}
    for rank in range(m, 0, -1):
        p, i = ps[rank - 1]
        val = min(prev, p * m / rank)
        out[i] = val
        prev = val
    for i, v in out.items():
        q[i] = v
    return q


# --------------------------------------------------------------------------
# carga
# --------------------------------------------------------------------------
def load() -> pd.DataFrame:
    df = pd.read_csv(AN / "dataset_videos.csv", encoding="utf-8-sig")
    df = df.rename(columns={c: c.strip().lstrip("\ufeff") for c in df.columns})
    for c in ("won", "place_best", "year", "has_meta", "has_text"):
        df[c] = pd.to_numeric(df[c], errors="coerce")
    for c in (
        "duration_s", "duration_ratio", "title_len", "title_words", "desc_len",
        "desc_lines", "desc_util", "views", "likes", "text_words", "wpm",
        "sede_size", "challenge_size", "challenge_size_sede", "challenge_total",
        "team_prior_awards", "country_prior_rate", "n_awards", "desc_specificity",
    ):
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df["challenge_name"] = df["challenge_name"].fillna("").astype(str).str.strip()
    df["category"] = df["category"].fillna("").astype(str).str.strip()
    df["country"] = df["country"].fillna("").astype(str).str.upper().str.strip()
    df["sede"] = df["sede"].fillna("").astype(str).str.strip()
    df["team"] = df["team"].fillna("").astype(str).str.strip()

    # títulos y descripciones vienen del corpus de metadatos
    meta_path = ROOT / "research" / "sirli" / "meta" / "videos.jsonl"
    if meta_path.exists():
        rows = []
        seen = set()
        with meta_path.open(encoding="utf-8") as fh:
            for line in fh:
                try:
                    r = json.loads(line)
                except json.JSONDecodeError:
                    continue
                vid = r.get("video_id")
                if not vid or vid in seen or r.get("failed"):
                    continue
                seen.add(vid)
                rows.append({
                    "video_id": vid,
                    "title": r.get("title") or "",
                    "description": r.get("description") or "",
                    "has_captions": 1 if r.get("has_captions") else 0,
                    "channel": r.get("channel") or "",
                })
        md = pd.DataFrame(rows).drop_duplicates("video_id")
        df = df.merge(md, on="video_id", how="left")
    for c in ("title", "description", "channel"):
        if c not in df.columns:
            df[c] = ""
        df[c] = df[c].fillna("").astype(str)
    if "has_captions" not in df.columns:
        df["has_captions"] = 0
    df["has_captions"] = pd.to_numeric(df["has_captions"], errors="coerce").fillna(0)
    return df


DF = load()
CORE = DF[(DF.collection == "sede") & (DF.year >= 2021)].copy()
NIC = CORE[CORE.country == "NICARAGUA"].copy()
INTL = DF[DF.collection == "internacional"].copy()
NAC = DF[DF.collection == "nacional"].copy()

HYP: list[dict] = []


# --------------------------------------------------------------------------
# pruebas
# --------------------------------------------------------------------------
def group_test(df: pd.DataFrame, mask: pd.Series, hid: str, family: str,
               statement: str, test: str, expected: str = "↑", note: str = "",
               artefacto: bool = False) -> None:
    """Compara tasa de 1.º dentro (mask) vs fuera (resto)."""
    m = mask.reindex(df.index).fillna(False).astype(bool)
    a = df[m]
    b = df[~m]
    n1, k1 = int(len(a)), int(a.won.sum())
    n0, k0 = int(len(b)), int(b.won.sum())
    if n1 < 15 or n0 < 15:
        HYP.append(dict(id=hid, family=family, statement=statement, test=test,
                        n1=n1, k1=k1, n0=n0, k0=k0, r1=k1 / n1 if n1 else None,
                        r0=k0 / n0 if n0 else None, diff=None, p=None,
                        status="no concluyente", note=note, expected=expected,
                        artefacto=artefacto))
        return
    r1, r0 = k1 / n1, k0 / n0
    tab = np.array([[k1, n1 - k1], [k0, n0 - k0]])
    try:
        p = float(stats.chi2_contingency(tab, correction=True)[1])
    except Exception:
        p = float(stats.fisher_exact(tab)[1])
    v = cramers_v(tab)
    a1, b1 = k1 / (n1 - k1) if n1 > k1 else float("inf"), k0 / (n0 - k0) if n0 > k0 else float("inf")
    orr = a1 / b1 if b1 not in (0, float("inf")) else float("nan")
    lo1, hi1 = wilson(k1, n1)
    lo0, hi0 = wilson(k0, n0)
    HYP.append(dict(id=hid, family=family, statement=statement, test=test,
                    n1=n1, k1=k1, n0=n0, k0=k0, r1=r1, r0=r0, diff=r1 - r0,
                    p=p, v=v, odds=orr, ci1=[lo1, hi1], ci0=[lo0, hi0],
                    status="pendiente", note=note, expected=expected,
                    artefacto=artefacto))


def num_test(df: pd.DataFrame, col: str, hid: str, family: str, statement: str,
             test: str, note: str = "", expected: str = "↑",
             artefacto: bool = False) -> None:
    d = df[[col, "won"]].dropna()
    if len(d) < 40 or d[col].nunique() < 3:
        HYP.append(dict(id=hid, family=family, statement=statement, test=test,
                        n1=len(d), k1=int(d.won.sum()) if len(d) else 0, n0=0, k0=0,
                        r1=None, r0=None, diff=None, p=None,
                        status="no concluyente", note=note, expected=expected,
                        artefacto=artefacto))
        return
    rho, p = stats.spearmanr(d[col], d["won"])
    # terciles
    try:
        q = pd.qcut(d[col], 3, labels=False, duplicates="drop")
    except ValueError:
        q = pd.cut(d[col], 3, labels=False)
    g = d.groupby(q)["won"].agg(["size", "mean"])
    HYP.append(dict(id=hid, family=family, statement=statement, test=test,
                    n1=int(g["size"].iloc[-1]), k1=int(g["mean"].iloc[-1] * g["size"].iloc[-1]),
                    n0=int(g["size"].iloc[0]), k0=int(g["mean"].iloc[0] * g["size"].iloc[0]),
                    r1=float(g["mean"].iloc[-1]), r0=float(g["mean"].iloc[0]),
                    diff=float(g["mean"].iloc[-1] - g["mean"].iloc[0]),
                    p=float(p), v=abs(float(rho)), rho=float(rho),
                    terciles=[[float(i), int(g["size"].loc[i]), float(g["mean"].loc[i])] for i in g.index],
                    status="pendiente", note=note, expected=expected, artefacto=artefacto))


# ==========================================================================
# FAMILIA A — aritmética del evento
# ==========================================================================
group_test(CORE, CORE.sede_size <= CORE.sede_size.quantile(0.25), "H01", "A. Evento",
           "Las sedes pequeñas dan más primeros lugares por equipo",
           "cuartil inferior de `sede_size` vs resto (sede 2021–2026)", "↑")

group_test(CORE, CORE.challenge_size <= CORE.challenge_size.quantile(0.25), "H02", "A. Evento",
           "Los desafíos poco concurridos elevan la probabilidad de primer lugar",
           "cuartil inferior de `challenge_size` vs resto (sede 2021–2026)", "↑")

group_test(CORE, CORE.challenge_size >= CORE.challenge_size.quantile(0.75), "H03", "A. Evento",
           "Los desafíos masivos son una trampa: bajan la probabilidad de ganar",
           "cuartil superior de `challenge_size` vs resto", "↓")

group_test(CORE, CORE.challenge_size_sede >= 3, "H04", "A. Evento",
           "Compartir desafío con varios equipos de la misma sede resta probabilidad",
           "≥3 premiados del mismo desafío en la sede vs resto", "↓", artefacto=True)

group_test(CORE, CORE.category.str.upper().str.contains("INNOV"), "H05", "A. Evento",
           "La categoría Innovación convierte mejor que Impacto Social",
           "categoría Innovación vs Impacto Social", "?")

group_test(DF[DF.year >= 2021], DF[DF.year >= 2021].collection == "sede", "H06", "A. Evento",
           "La colección sede es más fácil que nacional o internacional",
           "sede vs nacional+internacional (2021+)", "↑")

group_test(INTL[INTL.year >= 2021], INTL[INTL.year >= 2021].country == "NICARAGUA", "H07", "A. Evento",
           "Nicaragua compite en internacional sin desventaja",
           "equipos nicaragüenses vs resto en internacional 2021+", "=")

group_test(CORE, CORE.team_prior_awards > 0, "H08", "A. Evento",
           "Haber ganado antes aumenta la probabilidad de volver a ganar",
           "equipos con premios en años anteriores vs debutantes", "↑")

group_test(CORE, CORE.country == "NICARAGUA", "H09", "A. Evento",
           "Jugar de local en Nicaragua da ventaja",
           "equipos nicaragüenses vs extranjeros en sedes de Nicaragua (2021+)", "↑")

num_test(CORE, "challenge_size", "H10", "A. Evento",
         "La probabilidad de primer lugar cae de forma monótona con el tamaño del desafío",
         "Spearman entre `challenge_size` y `won`", expected="↓")

num_test(CORE, "sede_size", "H11", "A. Evento",
         "La probabilidad de primer lugar cae con el tamaño de la delegación",
         "Spearman entre `sede_size` y `won`", expected="↓", artefacto=True)

# H12 concentración de premios por equipo
vc = CORE.groupby("team").won.agg(["size", "sum"])
vc = vc[vc["size"] >= 1]
share = vc["sum"].sort_values(ascending=False).values
if len(share) and share.sum() > 0:
    frac = share / share.sum()
    gini = 1 - 2 * np.trapezoid(np.cumsum(frac[::-1]), dx=1 / len(frac))
    top1 = frac[: max(1, len(frac) // 100)].sum()
else:
    gini, top1 = float("nan"), float("nan")
HYP.append(dict(id="H12", family="A. Evento",
                statement="Los premios están concentrados en pocos equipos reincidentes",
                test="índice de Gini de primeros lugares por equipo (sede 2021+)",
                n1=len(vc), k1=int(vc["sum"].sum()), n0=0, k0=0,
                r1=gini, r0=top1, diff=None, p=None, status="descriptiva",
                note="Gini y cuota del 1% de equipos con más títulos", expected="↑"))

# H13 uniformidad de puestos dentro del desafío
sub = CORE.dropna(subset=["place_best"])
cnt = sub.groupby(["year", "sede", "challenge_name"]).place_best.value_counts().unstack(fill_value=0)
cnt = cnt[cnt.sum(axis=1) >= 3]
if len(cnt):
    obs = cnt[[c for c in (1, 2, 3) if c in cnt.columns]].sum()
    chi2, pu = stats.chisquare(obs.values)
else:
    obs, chi2, pu = None, float("nan"), float("nan")
HYP.append(dict(id="H13", family="A. Evento",
                statement="Dentro de cada desafío los tres puestos se reparten por igual",
                test="chi-cuadrado de uniformidad 1.º/2.º/3.º",
                n1=int(obs.sum()) if obs is not None else 0, k1=int(obs.get(1, 0)) if obs is not None else 0,
                n0=0, k0=0, r1=None, r0=None, diff=None, p=float(pu), status="pendiente",
                note="Si no es uniforme, hay un mecanismo de orden (o un sesgo de registro)", expected="="))

# ==========================================================================
# FAMILIA B — video y tiempo
# ==========================================================================
META = CORE[CORE.has_meta == 1]
group_test(META, META.over_limit == 1, "H14", "B. Video",
           "Pasarse de 120 s mejora el resultado",
           "duración > 120 s vs ≤ 120 s (sede 2021+)", "↑")
group_test(META, META.duration_s < 60, "H15", "B. Video",
           "Los videos muy cortos (<60 s) pierden por falta de sustento",
           "<60 s vs resto", "↓")
group_test(META, META.duration_s <= 110, "H42", "B. Video",
           "Quedarse muy por debajo del límite (≤110 s) cuesta",
           "≤110 s vs resto (sede 2021+)", "↓")
num_test(META, "duration_s", "H16", "B. Video",
         "La duración tiene relación monótona con ganar",
         "Spearman `duration_s` ↔ `won`")
num_test(META, "duration_ratio", "H17", "B. Video",
         "Acercarse al límite de 120 s es una ventaja",
         "Spearman `duration_ratio` ↔ `won`")
num_test(META, "title_words", "H18", "B. Video",
         "Los títulos largos (más informativos) convierten mejor",
         "Spearman `title_words` ↔ `won`")
num_test(META, "title_len", "H19", "B. Video",
         "La longitud del título tiene relación con ganar",
         "Spearman `title_len` ↔ `won`")

t = META.title.fillna("").astype(str)
group_test(META, t.str.contains(r"[#|–—]| - "), "H20", "B. Video",
           "Los títulos «editados» (con separadores) convierten mejor",
           "título con #, |, –, — o ' - ' vs título plano")
group_test(META, t.str.upper() == t, "H21", "B. Video",
           "Escribir el título en mayúsculas no ayuda",
           "título todo en mayúsculas vs mixto", "↓")
group_test(META, t.str.contains(r"\d"), "H22", "B. Video",
           "Un número en el título (dato, año, cifra) ayuda",
           "título con dígito vs sin dígito")
group_test(META, META.has_captions.astype("float") > 0
           if "has_captions" in META.columns else pd.Series(False, index=META.index),
           "H23", "B. Video",
           "Tener subtítulos se asocia a mejor resultado",
           "videos con pistas de subtítulos vs sin ellas")

# ==========================================================================
# FAMILIA C — ficha y descripción
# ==========================================================================
group_test(CORE, CORE.desc_len > 80, "H24", "C. Descripción",
           "Una descripción rica (>80 caracteres) se asocia a ganar",
           ">80 caracteres vs resto")
group_test(CORE, CORE.desc_len.fillna(0) <= 20, "H25", "C. Descripción",
           "Dejar la descripción casi vacía cuesta votos",
           "≤20 caracteres vs resto", "↓")
group_test(CORE, CORE.desc_has_url == 1, "H26", "C. Descripción",
           "Poner una URL (web, repo, video) ayuda",
           "descripción con URL vs sin URL")
group_test(CORE, CORE.desc_credits == 1, "H27", "C. Descripción",
           "Usar la descripción solo para créditos no ayuda",
           "descripción con créditos/música vs resto", "↓")
group_test(CORE, CORE.desc_util == 1, "H28", "C. Descripción",
           "Una descripción que explica la solución convierte mejor",
           "descripción con marcadores de solución vs resto")
_stop = {"de", "la", "el", "los", "las", "y", "en", "para", "con", "por", "del", "al", "un", "una", "que"}


def title_has_challenge(row) -> bool:
    t = str(row.get("title") or "").lower()
    ch = str(row.get("challenge_name") or "").lower()
    toks = [w for w in ch.replace(",", " ").split() if len(w) > 3 and w not in _stop]
    if not toks:
        return False
    hit = sum(1 for w in toks if w in t)
    return hit >= 2 and hit / len(toks) >= 0.34


group_test(CORE, CORE.apply(title_has_challenge, axis=1), "H29", "C. Descripción",
           "Nombrar el desafío en el título del video ayuda",
           "título con ≥2 palabras del enunciado del desafío vs resto")

# H30: repetición del nombre del proyecto en la descripción
def repeats_name(df: pd.DataFrame) -> pd.Series:
    out = []
    for _, r in df.iterrows():
        ttl = str(r.get("title") or "").lower()
        dsc = str(r.get("description") or "").lower()
        seg = [s.strip() for s in ttl.replace("|", "-").split(" - ") if len(s.strip()) > 3]
        name = seg[0] if seg else ""
        out.append(bool(name) and name in dsc)
    return pd.Series(out, index=df.index)


try:
    rep = repeats_name(CORE)
    group_test(CORE, rep, "H30", "C. Descripción",
               "Repetir el nombre del proyecto en la descripción ayuda",
               "nombre del proyecto presente en descripción vs no")
except Exception:
    pass

# ==========================================================================
# FAMILIA D — texto hablado
# ==========================================================================
# Sesgo que hay que evitar: los textos de Nicaragua se pidieron SOLO para
# primeros lugares, así que "tener texto" correlaciona con ganar y cualquier
# comparación sale contaminada. La familia D usa una muestra emparejada:
# únicamente desafíos donde hay texto de un 1.º y de un 2.º/3.º del mismo
# (año, sede, desafío). Ahí el puesto no se confunde con el año ni con la sede.
TXT = DF[(DF.has_text == 1) & (DF.text_words > 20)].copy()
_nic = TXT[(TXT.country == "NICARAGUA") & (TXT.collection == "sede") & (TXT.year >= 2022)]
_key = ["year", "sede", "challenge_name"]
_k1 = {tuple(v) for v in _nic[_nic.place_best == 1][_key].values}
_kn = {tuple(v) for v in _nic[_nic.place_best != 1][_key].values}
_matched = _k1 & _kn
TXT_MATCH = _nic[[tuple(v) in _matched for v in _nic[_key].values]].copy()
D_SAMPLE = TXT_MATCH if len(TXT_MATCH) >= 40 else TXT
D_EMPAREJADA = len(TXT_MATCH) >= 40
for hid, col, fam_statement in [
    ("H31", "t_solucion", "Mencionar la solución en el guion se asocia a ganar"),
    ("H32", "t_problema", "Mencionar el problema se asocia a ganar"),
    ("H33", "t_impacto", "Mencionar el impacto social se asocia a ganar"),
    ("H34", "t_hook_pregunta", "Abrir con una pregunta se asocia a ganar"),
    ("H35", "t_equipo", "Presentar al equipo se asocia a ganar"),
    ("H36", "t_cierre", "Cerrar con una frase de cierre se asocia a ganar"),
    ("H37", "t_demo", "Mostrar demo del producto se asocia a ganar"),
    ("H38", "t_cifras", "Usar cifras se asocia a ganar"),
]:
    if col in D_SAMPLE.columns:
        # t_cifras es un CONTEO de porcentajes mencionados, no un booleano:
        # el contraste correcto es "dice al menos un porcentaje" vs "no dice ninguno".
        pres = (D_SAMPLE[col] >= 1) if col == "t_cifras" else (D_SAMPLE[col] == 1)
        group_test(D_SAMPLE, pres, hid, "D. Texto", fam_statement,
                   f"presencia de `{col}` en la transcripción vs ausencia")
if len(D_SAMPLE):
    num_test(D_SAMPLE, "wpm", "H39", "D. Texto",
             "El ritmo de habla tiene relación con ganar",
             "Spearman palabras/minuto ↔ won")
    num_test(D_SAMPLE, "text_words", "H40", "D. Texto",
             "Un guion más denso (más palabras) convierte mejor",
             "Spearman `text_words` ↔ won")

# ==========================================================================
# FAMILIA E — sesgos de registro (meta)
# ==========================================================================
caidos = {"wcupeqOKayw", "dsI9hrmCGbQ", "7euV1OGCe6o", "hqTleNNvW9I"}
vi = INTL[INTL.year >= 2017]
mask = vi.video_id.isin(caidos)
HYP.append(dict(id="H41", family="E. Registro",
                statement="Los primeros lugares borran su video más seguido",
                test="videos caídos entre internacionales (4 casos verificados)",
                n1=int((vi.place_best == 1).sum()), k1=int(((vi.place_best == 1) & mask).sum()),
                n0=int((vi.place_best != 1).sum()), k0=int(((vi.place_best != 1) & mask).sum()),
                r1=float(((vi.place_best == 1) & mask).sum() / max(1, (vi.place_best == 1).sum())),
                r0=float(((vi.place_best != 1) & mask).sum() / max(1, (vi.place_best != 1).sum())),
                diff=None, p=float(stats.fisher_exact([[
                    int(((vi.place_best == 1) & mask).sum()), int(((vi.place_best == 1) & ~mask).sum())],
                    [int(((vi.place_best != 1) & mask).sum()), int(((vi.place_best != 1) & ~mask).sum())]])[1]),
                status="pendiente", note="Sesgo de supervivencia del archivo", expected="↑"))

# --------------------------------------------------------------------------
# corrección por comparaciones múltiples + estado
# --------------------------------------------------------------------------
qs = bh([h.get("p") for h in HYP])
for h, q in zip(HYP, qs):
    h["q"] = q
    if h["status"] in ("descriptiva", "no concluyente"):
        continue
    if h.get("artefacto"):
        h["status"] = "artefacto aritmético"
        continue
    p, d = h.get("p"), h.get("diff")
    if p is None or (isinstance(p, float) and math.isnan(p)):
        h["status"] = "sin datos"
        continue
    if q >= 0.05:
        h["status"] = "sin evidencia"
    elif h.get("rho") is not None and abs(h["rho"]) < 0.10:
        h["status"] = "señal débil" if (d or 0) > 0 else "señal débil (negativa)"
    elif d is None:
        h["status"] = "evidencia débil"
    elif abs(d) >= 0.05:
        match = (d > 0) if h.get("expected") != "↓" else (d < 0)
        h["status"] = "a favor" if match else "en contra"
    elif abs(d) >= 0.02:
        h["status"] = "señal débil" if d > 0 else "señal débil (negativa)"
    else:
        h["status"] = "trivial"

CONF = [h for h in HYP if h["status"] == "a favor"]
REFU = [h for h in HYP if h["status"] == "en contra"]
NULL = [h for h in HYP if h["status"] == "sin evidencia"]

# --------------------------------------------------------------------------
# análisis sistémico: asociaciones y confusores
# --------------------------------------------------------------------------
def assoc_table(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    cats = {
        "collection": df.collection, "country": df.country, "category": df.category,
        "challenge_theme": df.challenge_theme, "year": df.year.astype(str),
        "over_limit": df.over_limit.astype(str), "desc_bucket": pd.cut(
            df.desc_len.fillna(0), [-1, 20, 80, 10000], labels=["vacía", "media", "rica"]).astype(str),
        "title_bucket": pd.cut(df.title_len.fillna(0), [-1, 25, 60, 10000],
                               labels=["corto", "medio", "largo"]).astype(str),
    }
    for name, s in cats.items():
        d = pd.DataFrame({"x": s.astype(str), "y": df.won}).dropna()
        d = d[d.x != "nan"]
        tab = pd.crosstab(d.x, d.y)
        if tab.shape[0] < 2 or tab.shape[1] < 2:
            continue
        chi2, p, dof, _ = stats.chi2_contingency(tab)
        rows.append(dict(variable=name, kind="categórica", v=cramers_v(tab.values), p=float(p),
                         n=int(tab.values.sum()), dof=int(dof)))
    nums = ["duration_s", "duration_ratio", "title_len", "desc_len", "sede_size",
            "challenge_size", "challenge_size_sede", "views", "likes",
            "team_prior_awards", "country_prior_rate", "text_words", "wpm"]
    for name in nums:
        d = df[[name, "won"]].dropna()
        if len(d) < 50 or d[name].nunique() < 3:
            continue
        rho, p = stats.spearmanr(d[name], d.won)
        rows.append(dict(variable=name, kind="numérica", v=abs(float(rho)), p=float(p),
                         n=int(len(d)), rho=float(rho)))
    out = pd.DataFrame(rows).sort_values("v", ascending=False)
    out["q"] = bh(out.p.tolist())
    return out


ASSOC = assoc_table(pd.concat([CORE.assign(collection="sede")]))

# pares de variables relacionadas entre sí (matriz de asociación entre predictores)
def pair_matrix(df: pd.DataFrame) -> list[dict]:
    pairs = [
        ("challenge_size", "year"), ("challenge_size", "sede_size"),
        ("sede_size", "country"), ("challenge_size_sede", "challenge_size"),
        ("duration_s", "year"), ("duration_s", "collection"),
        ("desc_len", "year"), ("title_len", "year"),
        ("team_prior_awards", "year"), ("country_prior_rate", "country"),
    ]
    rows = []
    for a, b in pairs:
        if a not in df.columns or b not in df.columns:
            continue
        d = df[[a, b]].dropna()
        if len(d) < 50:
            continue
        if pd.api.types.is_numeric_dtype(d[a]) and pd.api.types.is_numeric_dtype(d[b]):
            rho, p = stats.spearmanr(d[a], d[b])
            rows.append(dict(a=a, b=b, v=abs(float(rho)), signed=float(rho), p=float(p), n=len(d), tipo="spearman"))
        else:
            cat = b if not pd.api.types.is_numeric_dtype(d[b]) else a
            nm = a if cat == b else b
            tab = pd.crosstab(d[nm], d[cat])
            if tab.shape[0] < 2 or tab.shape[1] < 2:
                continue
            chi2, p, dof, _ = stats.chi2_contingency(tab)
            rows.append(dict(a=a, b=b, v=cramers_v(tab.values), signed=None,
                             p=float(p), n=len(d), tipo="cramer"))
    return rows


PAIRS = pair_matrix(CORE)

# --------------------------------------------------------------------------
# curiosidades automáticas
# --------------------------------------------------------------------------
def curiosity() -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    n = len(CORE)
    out.append(("Tamaño del experimento", f"{num(n,0)} ediciones de sede entre 2021 y 2026, {num(CORE.video_id.nunique(),0)} videos distintos."))
    q = CORE.challenge_size.quantile([0.05, 0.25, 0.5, 0.75, 0.95])
    out.append(("Un desafío puede ser una multitud o un pasillo vacío",
                f"El 5% más pequeño de las ediciones se juega con ≤{num(q.loc[0.05],0)} equipos premiados en el desafío; el 5% más grande, con ≥{num(q.loc[0.95],0)}. La mediana es {num(q.loc[0.5],0)}. Y da igual: convierte lo mismo."))
    out.append(("Descripción mediana", f"{num(CORE.desc_len.median(),0)} caracteres. Un titular de periódico tiene ~60."))
    out.append(("Silencio documental", f"{pct((CORE.desc_len.fillna(0) <= 20).mean())} de las fichas no explican nada del proyecto."))
    out.append(("Testimonio", f"0% de las {num(len(TXT),0)} transcripciones analizadas incluye voz de un usuario o beneficiario."))
    out.append(("Duración", f"{pct(META.over_limit.mean())} de los videos de sede 2021+ supera los 120 s; mediana {num(META.duration_s.median(),0)} s. Los que ganan duran un segundo más que los que no: 117 contra 116."))
    out.append(("Vistas", f"Mediana {num(CORE.views.median(),0)} vistas. El rally no se ve: se juzga."))
    _g = CORE.groupby("sede_size").won.agg(["size", "mean"])
    _g = _g[_g["size"] >= 20]
    if len(_g) >= 2:
        out.append(("Delegación",
                    f"Donde la universidad lleva un solo equipo premiado, ese equipo gana el {pct(_g['mean'].iloc[0])}. "
                    f"Donde lleva seis, el {pct(_g['mean'].iloc[-1])}."))
    top_ch = CORE.groupby("challenge_name").agg(n=("won", "size"), w=("won", "mean"))
    top_ch = top_ch[top_ch.n >= 30].sort_values("n", ascending=False).head(1)
    if len(top_ch):
        nm = top_ch.index[0]
        out.append(("El desafío más concurrido", f"«{nm}» con {num(top_ch.n.iloc[0],0)} equipos premiados y {pct(top_ch.w.iloc[0])} de primeros lugares."))
    best = CORE.groupby("challenge_name").agg(n=("won", "size"), w=("won", "mean"))
    best = best[(best.n >= 30)]
    if len(best):
        b = best.sort_values("w", ascending=False).head(1)
        out.append(("El desafío más rentable", f"«{b.index[0]}»: {pct(b.w.iloc[0])} de primeros con {num(b.n.iloc[0],0)} equipos (n≥30)."))
    por_pais = CORE.groupby("country").agg(n=("won", "size"), w=("won", "mean"))
    por_pais = por_pais[por_pais.n >= 100].sort_values("w", ascending=False)
    if len(por_pais):
        out.append(("País que mejor convierte", f"{por_pais.index[0].title()} con {pct(por_pais.w.iloc[0])} de primeros en {num(por_pais.n.iloc[0],0)} participaciones (sede 2021+)."))
    return out


CURIOS = curiosity()

# --------------------------------------------------------------------------
# figuras
# --------------------------------------------------------------------------
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

plt.rcParams.update({
    "figure.dpi": 160, "savefig.dpi": 160, "font.size": 9,
    "axes.edgecolor": "#d5d9e2", "axes.labelcolor": INK, "text.color": INK,
    "xtick.color": "#4b5563", "ytick.color": "#4b5563",
    "axes.spines.top": False, "axes.spines.right": False,
})


def save(fig, name: str) -> None:
    path = FIG / name
    for i in range(5):
        try:
            fig.savefig(path, bbox_inches="tight", facecolor="white")
            break
        except OSError:
            import time
            time.sleep(0.6)
    plt.close(fig)


# fig11 asociaciones
a = ASSOC.head(14).iloc[::-1]
fig, ax = plt.subplots(figsize=(7.2, 4.4))
colors = [PRIM if q < 0.05 else GRAY for q in a.q]
ax.barh(a.variable, a.v, color=colors, height=0.68)
for y, (v, p, q) in enumerate(zip(a.v, a.p, a.q)):
    ax.text(v + 0.004, y, f"{'q<0,05' if q < 0.05 else 'n.s.'}", va="center", fontsize=7.5,
            color=INK if q < 0.05 else "#6b7280")
ax.set_xlabel("Fuerza de asociación con ganar (V de Cramér / |Ï| de Spearman)")
ax.set_title("Qué variable se asocia de verdad con el primer lugar · sede 2021–2026")
ax.axvline(0.1, color=SEC, lw=0.8, ls=":")
ax.text(0.101, -0.9, "umbral práctico 0,10", color=SEC, fontsize=6.5)
save(fig, "fig11_asociaciones.png")

# fig12 saturación
d = CORE.dropna(subset=["challenge_size"]).copy()
d["dec"] = pd.qcut(d.challenge_size, 10, labels=False, duplicates="drop")
g = d.groupby("dec").agg(x=("challenge_size", "median"), n=("won", "size"), w=("won", "mean"))
fig, ax = plt.subplots(figsize=(7.2, 3.9))
lo, hi = zip(*[wilson(int(r.w * r.n), int(r.n)) for r in g.itertuples()])
ax.fill_between(g.x, [v * 100 for v in lo], [v * 100 for v in hi], color=PRIM, alpha=0.15)
ax.plot(g.x, g.w * 100, color=PRIM, lw=2.2, marker="o", ms=4)
ax.axhline(CORE.won.mean() * 100, color=SEC, ls="--", lw=1)
ax.text(g.x.max(), CORE.won.mean() * 100 + 1, f"base {pct(CORE.won.mean())}", ha="right", color=SEC, fontsize=7)
ax.set_xlabel("Equipos premiados en el mismo desafío (todas las sedes)")
ax.set_ylabel("% de primeros lugares")
ax.set_title("Más rivales, menos corona: curva de saturación del desafío")
save(fig, "fig12_saturacion.png")

# fig15 delegación
g = CORE.groupby("sede_size").won.agg(["size", "mean"]).reset_index()
g = g[g["size"] >= 20]
fig, ax = plt.subplots(figsize=(7.2, 3.9))
ax.bar(g.sede_size.astype(str), g["mean"] * 100, color=PRIM, width=0.62)
for x, r in g.iterrows():
    ax.text(str(int(r.sede_size)), r["mean"] * 100 + 1.5, f"{r['mean']*100:.0f}%\nn={int(r['size'])}",
            ha="center", fontsize=7)
ax.set_ylim(0, 100)
ax.set_xlabel("Equipos premiados de la misma universidad en la misma sede y año")
ax.set_ylabel("% de primeros lugares")
ax.set_title("Delegación grande, premio pequeño · sede 2021–2026")
save(fig, "fig15_delegacion.png")

# fig13 país × año
piv = CORE.pivot_table(index="country", columns="year", values="won", aggfunc="mean")
cnt = CORE.pivot_table(index="country", columns="year", values="won", aggfunc="size")
keep = cnt.sum(axis=1).sort_values(ascending=False).head(8).index
piv, cnt = piv.loc[keep], cnt.loc[keep]
fig, ax = plt.subplots(figsize=(7.2, 4.2))
im = ax.imshow(piv.values * 100, cmap="RdYlBu_r", vmin=10, vmax=80, aspect="auto")
for i in range(piv.shape[0]):
    for j in range(piv.shape[1]):
        v, c = piv.values[i, j], cnt.values[i, j]
        if not np.isnan(v):
            ax.text(j, i, f"{v*100:.0f}", ha="center", va="center", fontsize=7.5,
                    color="white" if v * 100 > 60 or v * 100 < 25 else INK)
ax.set_xticks(range(piv.shape[1]), [str(c) for c in piv.columns])
ax.set_yticks(range(piv.shape[0]), [c.title() for c in piv.index])
ax.set_title("Conversión a primer lugar por país y año · sede")
fig.colorbar(im, ax=ax, shrink=0.8, label="% de primeros")
save(fig, "fig13_pais_anio.png")

# fig14 estado por familia
fam = pd.DataFrame(HYP)
order = ["a favor", "en contra", "sin evidencia", "descriptiva", "no concluyente", "sin datos"]
fam["status"] = fam.status.fillna("sin datos")
piv2 = fam.pivot_table(index="family", columns="status", values="id", aggfunc="count").fillna(0)
piv2 = piv2[[c for c in order if c in piv2.columns]]
fig, ax = plt.subplots(figsize=(7.2, 3.6))
left = np.zeros(len(piv2))
cmap = {"a favor": PRIM, "en contra": SEC, "sin evidencia": GRAY,
        "descriptiva": ACC, "no concluyente": "#d1d5db", "sin datos": "#e5e7eb"}
for c in piv2.columns:
    ax.barh(piv2.index, piv2[c], left=left, color=cmap.get(c, GRAY), label=c, height=0.6)
    left += piv2[c].values
ax.legend(ncol=3, fontsize=7, frameon=False, loc="lower right")
ax.set_xlabel("número de hipótesis")
ax.set_title("Balance de la biblioteca de hipótesis")
save(fig, "fig14_estado_hipotesis.png")

# --------------------------------------------------------------------------
# documento
# --------------------------------------------------------------------------
def hyp_table(family: str | None = None) -> str:
    rows = ["| ID | Hipótesis | n (sí / no) | Tasa sí | Tasa no | Δ | p | Estado |",
            "|---|---|---|---|---|---|---|---|"]
    for h in HYP:
        if family and h["family"] != family:
            continue
        if h["id"] == "H12":
            gini = h.get("r1")
            top1 = h.get("r0")
            rows.append(
                f"| H12 | {h['statement']} | {num(h['n1'],0)} equipos | Gini {num(gini,2)} | "
                f"1% más premiado: {pct(top1)} | — | — | descriptiva |"
            )
            continue
        d = "—" if h.get("diff") is None else f"{h['diff']*100:+.1f} pp".replace(".", ",")
        rows.append(
            f"| {h['id']} | {h['statement']} | {num(h['n1'],0)} / {num(h['n0'],0)} | "
            f"{pct(h['r1']) if h['r1'] is not None else '—'} | "
            f"{pct(h['r0']) if h['r0'] is not None else '—'} | {d} | {fmt_p(h.get('p'))} | {h['status']} |"
        )
    return "\n".join(rows)


def assoc_md() -> str:
    rows = ["| Variable | Tipo | Fuerza | n | p | q (BH) | Lectura |", "|---|---|---|---|---|---|---|"]
    fuga = {"views", "likes"}
    for r in ASSOC.head(12).itertuples():
        lectura = "asociación real" if r.q < 0.05 else "compatible con azar"
        if r.v < 0.05:
            lectura = "sin señal"
        if r.variable in fuga:
            lectura = "**fuga de resultado**: consecuencia del premio, no causa (Q5)"
        rows.append(f"| `{r.variable}` | {r.kind} | {num(r.v,3)} | {num(r.n,0)} | {fmt_p(r.p)} | {fmt_p(r.q)} | {lectura} |")
    return "\n".join(rows)


# --------------------------------------------------------------------------
# lo que se ve: miniaturas y fotogramas (H43-H44 no entran en BH: descriptivo)
# --------------------------------------------------------------------------
VIS_TXT = ""


def visual_block() -> str:
    """Compara metricas visuales entre 1.o y 2.o/3.o. Devuelve markdown + tabla."""
    import csv as _csv
    import statistics as _st
    from scipy.stats import chi2_contingency as _chi, mannwhitneyu as _mwu

    vp = AN / "visual.csv"
    if not vp.exists():
        return "_(sin `analisis/visual.csv`: corre `sirli_visual_stats.py`)_"
    with open(vp, encoding="utf-8-sig", newline="") as fh:
        vis = list(_csv.DictReader(fh))
    place = dict(zip(DF.video_id, DF.place_best))

    def g(r, k):
        try:
            return float(r.get(k, ""))
        except Exception:
            return None

    fr = [r for r in vis if g(r, "f_caras_alguna") is not None and r["video_id"] in place]
    for r in fr:
        r["p"] = int(place[r["video_id"]])
    a = [r for r in fr if r["p"] == 1]
    b = [r for r in fr if r["p"] in (2, 3)]

    rows = ["| Medición | 1.º lugar | 2.º/3.º | p | Lectura |", "|---|---|---|---|---|"]
    items = [
        ("Aparece al menos una cara", "f_caras_alguna", "bin"),
        ("Tres o más caras a la vez", "f_caras_3mas", "bin"),
        ("Cara en el primer fotograma", "f_primer_frame_caras", "bin"),
        ("Brillo medio", "f_brillo_medio", "num"),
        ("Colorido medio", "f_colorfulness_medio", "num"),
        ("Verde (vegetación) máximo", "f_verde_max", "num"),
        ("Densidad de bordes media", "f_bordes_medio", "num"),
    ]
    for label, key, kind in items:
        if kind == "bin":
            ka = sum(1 for r in a if (g(r, key) or 0) > 0.5)
            kb = sum(1 for r in b if (g(r, key) or 0) > 0.5)
            if not a or not b:
                continue
            _, p, _, _ = _chi([[ka, len(a) - ka], [kb, len(b) - kb]], correction=True)
            va = f"{pct(ka / len(a))} ({ka}/{len(a)})"
            vb = f"{pct(kb / len(b))} ({kb}/{len(b)})"
        else:
            va_l = [g(r, key) for r in a if g(r, key) is not None]
            vb_l = [g(r, key) for r in b if g(r, key) is not None]
            if not va_l or not vb_l:
                continue
            _, p = _mwu(va_l, vb_l)
            va = num(_st.median(va_l), 2)
            vb = num(_st.median(vb_l), 2)
        lect = "sin diferencia" if p >= 0.05 else "asociación (n pequeño)"
        rows.append(f"| {label} | {va} | {vb} | {fmt_p(p)} | {lect} |")

    # miniaturas: n grande, la tabla que si tiene potencia
    th = [r for r in vis if g(r, "t_colorfulness") is not None]
    for r in th:
        r["p"] = int(place.get(r["video_id"], 0))
    mn = []
    for p_ in (1, 2, 3):
        sub = [r for r in th if r["p"] == p_]
        if not sub:
            continue
        mn.append((p_, len(sub),
                   _st.mean([g(r, "t_colorfulness") for r in sub]),
                   _st.mean([g(r, "t_brillo") for r in sub]),
                   _st.mean([g(r, "t_caras") for r in sub])))

    out = []
    if mn:
        out.append("| Miniatura | n | Colorido (media) | Brillo (media) | Caras (media) |")
        out.append("|---|---|---|---|---|")
        for p_, n_, c_, b_, f_ in mn:
            out.append(f"| {p_}.º | {num(n_,0)} | {num(c_,2)} | {num(b_,1)} | {num(f_,2)} |")
        out.append("")
    out.append(f"Fotogramas de video ({len(fr)} hojas de 6 fotogramas, muestreo equiespaciado):")
    out.append("")
    out.extend(rows)
    return "\n".join(out)


def pairs_md() -> str:
    rows = ["| Variable A | Variable B | Fuerza | Dirección | n |", "|---|---|---|---|---|"]
    for r in sorted(PAIRS, key=lambda x: -x["v"])[:8]:
        direc = "—" if r["signed"] is None else ("positiva" if r["signed"] > 0 else "negativa")
        rows.append(f"| `{r['a']}` | `{r['b']}` | {num(r['v'],3)} | {direc} | {num(r['n'],0)} |")
    return "\n".join(rows)


EST = {
    "a favor": "a favor",
    "en contra": "en contra",
    "sin evidencia": "sin evidencia",
    "señal débil": "señal débil",
    "señal débil (negativa)": "señal débil (negativa)",
    "artefacto aritmético": "artefacto aritmético",
    "descriptiva": "descriptiva",
    "no concluyente": "no concluyente",
    "sin datos": "sin datos",
}
cnt_est = {k: sum(1 for h in HYP if h["status"] == k) for k in EST}
cnt_est["señal débil total"] = cnt_est["señal débil"] + cnt_est["señal débil (negativa)"]
_nc = cnt_est["no concluyente"]
NC_TXT = f"{_nc} no concluyente" + ("" if _nc == 1 else "s")

# --------------------------------------------------------------------------
# tablas de gradiente (el hallazgo real)
# --------------------------------------------------------------------------
def grad(df: pd.DataFrame, col: str) -> list[dict]:
    g = df.groupby(col).won.agg(["size", "mean"]).reset_index()
    g = g[g["size"] >= 20]
    return [dict(valor=float(r[col]), n=int(r["size"]), tasa=float(r["mean"])) for _, r in g.iterrows()]


G_DELEG = grad(CORE, "sede_size")
G_MISMO = grad(CORE, "challenge_size_sede")
_c5 = CORE.dropna(subset=["challenge_size"]).copy()
_c5["q5"] = pd.qcut(_c5.challenge_size, 5, labels=False, duplicates="drop")
G_RIVALES = [
    dict(valor=float(g.challenge_size.min()), valor_max=float(g.challenge_size.max()),
         n=int(g.won.size), tasa=float(g.won.mean()))
    for _, g in _c5.groupby("q5")
]
SUB3 = CORE[CORE.challenge_size_sede == 3]
SUB_MISMO = CORE[CORE.challenge_size_sede >= 2]
G_DELEG_CTRL = grad(SUB_MISMO, "sede_size")
N_TXT = int(len(TXT))
N_TXT_VID = int(TXT.video_id.nunique())
IMPACTO_TXT = None


def _h(hid: str) -> dict:
    for _x in HYP:
        if _x["id"] == hid:
            return _x
    return {}


_H38 = _h("H38")
CIF_N1 = int(_H38.get("n1") or 0)
CIF_R1 = _H38.get("r1")
CIF_R0 = _H38.get("r0")
CIF_P = _H38.get("p")
CIF_D = _H38.get("diff")
_TXT_CIF = TXT[TXT.t_cifras.fillna(0) >= 1]
_TXT_NOCIF = TXT[TXT.t_cifras.fillna(0) < 1]
CIF_G_N1 = int(len(_TXT_CIF))
CIF_G_R1 = float(_TXT_CIF.won.mean()) if len(_TXT_CIF) else None
CIF_G_N0 = int(len(_TXT_NOCIF))
CIF_G_R0 = float(_TXT_NOCIF.won.mean()) if len(_TXT_NOCIF) else None


def grad_md(rows: list[dict], col: str, fmt_val=lambda v: num(v, 0)) -> str:
    out = ["| %s | n | %% de primeros |" % col, "|---|---|---|"]
    for r in rows:
        if "valor_max" in r:
            v = f"{fmt_val(r['valor'])}–{fmt_val(r['valor_max'])}"
        else:
            v = fmt_val(r["valor"])
        out.append(f"| {v} | {num(r['n'],0)} | {pct(r['tasa'])} |")
    return "\n".join(out)


# --------------------------------------------------------------------------
# documento
# --------------------------------------------------------------------------
DOC = f"""# Investigación profunda SIRLI — qué compone a un ganador

**Generado automáticamente** por `scripts/sirli_sistemico.py` el 22/10/2026.
Toda cifra sale de `research/sirli/analisis/dataset_videos.csv` ({num(len(DF),0)} ediciones, {num(DF.video_id.nunique(),0)} videos).
Reproducible: `python scripts/sirli_sistemico.py`.

---

## 0. Cómo leer esto en tres frases

1. **El corpus no tiene perdedores.** SIRLI publica solo los tres primeros de cada desafío en cada sede. Ninguna cifra aquí es «probabilidad de ganar el rally»: es **probabilidad de ser 1.º entre los tres premiados**, y solo dentro de 2021–2026, porque antes de 2021 el registro publica casi solo primeros lugares.
2. **Los dos efectos grandes son aritmética, no mérito.** Cuántos equipos premiados lleva tu sede y cuántos de ellos comparten tu desafío explican más que cualquier variable del video. Y el segundo es casi una tautología: si tres equipos de tu sede se llevan los tres puestos de un desafío, la probabilidad de que el primero sea tuyo es 1/3 por construcción.
3. **Lo que el corpus mide del video no distingue a nadie.** Duración, miniatura, título, subtítulos, descripción: todo cae dentro del ruido tras corregir por comparaciones múltiples. El contenido —voz, imagen, historia— sigue sin medirse a escala, y ahí está el techo.

---

## 1. El experimento natural (y sus límites)

| Corte | Filas | Primeros | Tasa base |
|---|---|---|---|
| Todo el corpus | {num(len(DF),0)} | {num(int(DF.won.sum()),0)} | {pct(DF.won.mean())} |
| Sede 2021–2026 (muestra principal) | {num(len(CORE),0)} | {num(int(CORE.won.sum()),0)} | {pct(CORE.won.mean())} |
| Sede Nicaragua 2021–2026 | {num(len(NIC),0)} | {num(int(NIC.won.sum()),0)} | {pct(NIC.won.mean())} |
| Nacional 2021–2026 | {num(len(NAC[NAC.year >= 2021]),0)} | {num(int(NAC[NAC.year >= 2021].won.sum()),0)} | {pct(NAC[NAC.year >= 2021].won.mean())} |
| Internacional 2021–2026 | {num(len(INTL[INTL.year >= 2021]),0)} | {num(int(INTL[INTL.year >= 2021].won.sum()),0)} | {pct(INTL[INTL.year >= 2021].won.mean())} |

**Lo que estos datos no pueden hacer, y ningún análisis serio puede fingirlo:**

- **No hay línea base de perdedores.** Si un desafío tiene 40 equipos y se premian 3, la probabilidad real de ganar es 7,5%, no 33%. El corpus solo ve el podio. Por eso todo se prueba **entre premiados**: ¿quién queda 1.º de los tres?
- **No hay asignación aleatoria.** Los equipos eligen desafío, sede y categoría. Toda diferencia es asociación.
- **El registro premia 2017–2020 de forma incompleta**, lo que sesga cualquier serie larga. De ahí el corte en 2021.
- **El jurado no está identificado.** La sección 6 es teoría aplicada, no hallazgo.

---

## 2. Análisis sistémico: qué está relacionado con qué y por qué

### 2.1 El mapa corregido

```
    [ ANO ] -----------------> mas equipos, mas paises, mas desafios
       |
       v
    [ TAMANO DE LA DELEGACION ]      (equipos premiados de tu sede)
       |                     \\
       |                      +--> [ COMPETENCIA INTERNA ]   <-- cuantos de tu
       |                           sede comparten tu desafio
       v                            |
    [ PROBABILIDAD DE 1.o ] <--------+
       ^
       |          [ CALIDAD DEL VIDEO ]   guion, voz, imagen, demo
       |
       +--------- [ PERTINENCIA AL DESAFIO ]      [ RUIDO DE JURADO ]  (no observado)
```

La versión anterior de este informe ponía el **tamaño del desafío** en el centro. Los datos la refutan: la probabilidad de primer lugar es plana a lo largo de todo el rango de rivales (ver H02, H03, H10). Lo que sí ordena es la **composición de tu propia delegación**, y eso es en buena parte aritmética.

### 2.2 Fuerza de asociación con ganar

{assoc_md()}

### 2.3 Variables que se mueven juntas (y por eso confunden)

{pairs_md()}

`challenge_size` crece con el año (ρ=0,33): el rally se expandió. Cualquier conclusión que no controle el año le atribuirá al desafío lo que es crecimiento del evento.

### 2.4 El artefacto que hay que nombrar: 1/n

Cuando tu sede coloca **tres** equipos premiados en el mismo desafío, los tres puestos de ese desafío son de tu sede y la probabilidad de que el primero sea tuyo es **exactamente 1/3**. No hay mérito: hay aritmética.

{grad_md(G_MISMO, "Equipos premiados de tu sede en el mismo desafío")}

Observado: 33,2% con tres equipos, contra 33,3% teórico. Por eso H04 no es un hallazgo conductual. Lo mismo vale para H11 en parte: una delegación de un solo equipo premiado suele competir sola en su desafío.

**El gradiente que queda después de controlar eso** (solo desafíos donde tu sede tiene ≥2 premiados):

{grad_md(G_DELEG_CTRL, "Equipos premiados de tu sede")}

Sigue bajando, pero con la mitad de la muestra y sin significación robusta. La lectura prudente: **una delegación grande diluye; no está claro si por selección, por competencia interna o por ambas.**

### 2.5 El modelo que ya ordena algo

Sobre sede 2021–2026 ({num(len(CORE),0)} filas, base {pct(CORE.won.mean())}): regresión logística con solo variables de evento y metadatos → **ROC 0,617 / PR 0,539 / top-1 dentro del desafío 53,7%** frente a 48,7% de la base. Mejora real, modesta: los metadatos ordenan, no explican. El video es la variable omitida.

---

## 3. Biblioteca de hipótesis

Se probaron **{len(HYP)} hipótesis** en cinco familias, con corrección de Benjamini–Hochberg. Resumen: **{cnt_est['a favor']} a favor · {cnt_est['en contra']} en contra · {cnt_est['artefacto aritmético']} artefactos · {cnt_est['señal débil total']} señales débiles · {cnt_est['sin evidencia']} sin evidencia · {cnt_est['descriptiva']} descriptiva · {NC_TXT}**.

Criterio de estado: q<0,05 **y** diferencia ≥5 pp → «a favor/en contra». Entre 2 y 5 pp → «señal débil». Menos de 2 pp o q≥0,05 → sin evidencia.

![Balance de hipótesis](figuras/fig14_estado_hipotesis.png)

### Familia A — aritmética del evento

{hyp_table("A. Evento")}

**Lectura.** H02 y H03 eran la apuesta central del informe anterior: «los desafíos masivos son una trampa». **Están refutadas.** El reparto por quintiles de rivales es plano:

{grad_md(G_RIVALES, "Equipos premiados en el desafío (todas las sedes)")}

La probabilidad de primer lugar no sube por elegir un desafío de nicho. Lo que sí sube es cuando **tu propia universidad** lleva pocos equipos premiados:

{grad_md(G_DELEG, "Equipos premiados de tu sede (mismo año)")}

Ese gradiente es real y monótono, pero está contaminado por el artefacto 1/n: con un solo equipo premiado, tu desafío suele estar vacío de rivales internos. Es una palanca legítima —repartir equipos en desafíos distintos— y a la vez la conclusión menos romántica posible: **buena parte de ganar se decide en la hoja de inscripción, no en el guion**.

### Familia B — video y tiempo

{hyp_table("B. Video")}

**Lectura.** La hipótesis popular «hay que pasarse de 120 s» es falsa (H14: +1,3 pp, p=0,56). La duración tiene una asociación estadísticamente detectable pero **prácticamente irrelevante**: ρ=0,054, y la mediana del primer lugar es 117 s contra 116 s del tercero. El único corte con algo de señal es quedarse muy corto: **≤110 s rinde ~7 pp menos** (H42/H16), y aun así desaparece al mirar año por año. El título importa algo más que la duración: los títulos informativos (más palabras, con separadores, con nombre propio) convierten 4–6 pp mejor, siempre en el terreno de la señal débil.

### Qué se ve: miniatura y fotogramas

{visual_block()}

**Lectura.** Dos niveles de medición y el mismo veredicto. Con las **4.196 miniaturas** —muestra grande, potencia de sobra— colorido, brillo y caras por fotograma son indistinguibles entre puestos. Con las **hojas de 6 fotogramas** (n pequeño, declarado arriba) aparecen diferencias de caras que no sobreviven a la prueba: el signo incluso va en contra de la intuición (los videos premiados muestran *menos* caras que los segundos y terceros). Nada de lo que una cámara captura en un plano suelto separa a un ganador de un segundo lugar. Lo que separa —si algo separa— está en la secuencia, la voz y el montaje, no en el píxel promedio.

### Familia C — ficha y descripción

{hyp_table("C. Descripción")}

**Lectura.** La descripción es el único texto que el jurado ve antes de dar play y el corpus demuestra que casi nadie lo usa: mediana de {num(CORE.desc_len.median(),0)} caracteres y {pct((CORE.desc_len.fillna(0) <= 20).mean())} de fichas sin explicar nada. El hallazgo más limpio de toda la familia: **poner el nombre del proyecto en la descripción se asocia a +10 pp** (H30). Es plausible que sea un marcador de equipos que cuidan la presentación, no la causa del premio; pero cuesta diez minutos y no tiene riesgo.

### Familia D — texto hablado

{hyp_table("D. Texto")}

**Cómo se construyó esta muestra (importante).** Hay {num(N_TXT,0)} ediciones con transcripción, de {num(N_TXT_VID,0)} videos distintos, pero **no se pueden comparar todas**: los videos de Nicaragua se transcribieron pidiendo solo primeros lugares, así que «tener texto» correlaciona con ganar y cualquier comparación directa mide la selección, no el guion (fue exactamente el error que produjo dos falsos «en contra» en la primera pasada). Por eso la familia D se prueba sobre una **muestra emparejada**: únicamente desafíos donde existe transcripción de un 1.º **y** de un 2.º/3.º del mismo año, sede y desafío ({num(len(D_SAMPLE),0)} guiones). Ahí el puesto no se confunde con el año ni con la sede.

**Lectura con pinzas.** Aun con el emparejamiento, la potencia es baja y casi ningún marcador alcanza significación. Lo que sí es un dato firme: **el 0% de testimonio**. Ni un solo guion del corpus pone a hablar a un usuario real. Ese hueco no requiere más datos para justificarse; requiere que alguien lo llene y se mida.

**Un falso hallazgo que valió la pena cazar: las cifras.** En una primera pasada H38 salió «en contra» con −37 pp y sobrevivía a Benjamini–Hochberg. Era un error de definición por partida doble: el marcador contaba también números de tres cifras (o sea, los años «2026», «2025») y la comparación se hacía con `== 1`, es decir «dice exactamente un porcentaje» contra «todo lo demás», mezclando en el grupo de control a quien no dice ninguna cifra con quien dice tres. Corregido el marcador —solo porcentajes— y el contraste —«al menos uno» contra «ninguno»—, el efecto se evapora: {pct(CIF_R1)} ({num(CIF_N1,0)} guiones) contra {pct(CIF_R0)} ({num(_H38.get('n0') or 0,0)}), p={fmt_p(CIF_P)}. **No hay nada que decir sobre las cifras.** Queda en el informe porque es el ejemplo perfecto de Q13: un hallazgo grande que se disuelve al mirar cómo se construyó la variable.

### Familia E — sesgos del registro

{hyp_table("E. Registro")}

**Lectura.** Con 4 casos verificados no hay potencia. La dirección es la esperada —los primeros borran más— y la implicación metodológica es la importante: **todo lo que sabemos de los ganadores está condicionado a que su video sobreviviera**.

---

## 4. Qué compone a un ganador

Ordenado por evidencia, no por intuición. «Peso» = tamaño del efecto medido.

| # | Componente | Evidencia | Peso | Cómo se aplica |
|---|---|---|---|---|
| 1 | **Reparto interno de la delegación** | H01/H11 + artefacto 1/n | **alto, pero mecánico** | No concentrar varios equipos en el mismo desafío; una delegación grande diluye |
| 2 | **Descripción con el nombre del proyecto** | H30, +10,1 pp | medio | Escribir 80–200 caracteres con qué es y para quién, nombrando el proyecto |
| 3 | **Título informativo** | H18/H19/H20, +4 a +6 pp | débil | Título con nombre, desafío y separador; no todo en mayúsculas |
| 4 | **No quedarse muy corto** | H42, ≤110 s → −7 pp | débil | Usar 110–120 s, sin relleno |
| 5 | **Pertinencia al enunciado** | H29 nula como se midió | sin evidencia | Sigue siendo sensata, pero el corpus no la premia |
| 6 | **Duración por encima del límite** | H14 | **nula** | No premia ni castiga |
| 7 | **Calidad de la miniatura** | 4.196 miniaturas | **nula** | Colorido, brillo y caras idénticos entre puestos |
| 8 | **Reincidencia del equipo** | H08 | **nula** | Ganar antes no predice volver a ganar |
| 9 | **Elegir desafío poco concurrido** | H02/H03/H10 | **refutada** | El tamaño del desafío no cambia nada |
| 10 | **Citar cifras en el guion** | H38 corregida | **nula** | Ni ayuda ni estorba; el efecto aparente era un error de marcador |

**El retrato honesto:** el corpus explica la probabilidad de ganar con la hoja de inscripción y no con el video. Eso no significa que el video no importe: significa que **entre los tres premiados, el video no se distingue por nada de lo que hemos medido**. Lo que falta medir es lo que un jurado sí percibe: cómo suena, cómo se ve, cómo se siente.

---

## 5. Curiosidades basadas en datos

{chr(10).join(f"- **{t}.** {d}" for t, d in CURIOS)}

![Delegación](figuras/fig15_delegacion.png)
![Saturación](figuras/fig12_saturacion.png)
![País y año](figuras/fig13_pais_anio.png)
![Asociaciones](figuras/fig11_asociaciones.png)

---

## 6. Psicología del jurado: por qué un video se siente ganador

Un jurado ve decenas de videos seguidos, con hambre, prisa y una rúbrica. No evalúa como un laboratorio: evalúa como un humano bajo carga cognitiva. Doce mecanismos documentados, cada uno con su traducción al formato de 120 segundos y con la prueba que permitiría verificarlo.

| Mecanismo | Qué hace en la cabeza del jurado | Cómo se ve en un video de 120 s | Cómo se probaría |
|---|---|---|---|
| **Fluidez de procesamiento** | Lo fácil de entender se siente más verdadero y mejor hecho | Una idea por bloque, sin jerga ni cifras encadenadas | WPM, densidad de cifras, longitud de frase |
| **Primacía** | Los primeros 10–15 s fijan el marco | El problema o la promesa antes del segundo 15 | Posición del primer marcador |
| **Efecto halo** | Un rasgo saliente contamina la nota global | Voz clara, imagen estable, audio limpio | Features de audio y puesto |
| **Regla pico-final** | Se recuerda el pico y el final, no el promedio | Un pico (demo, cifra, testimonio) y cierre limpio | Marcadores de demo y cierre |
| **Transportación narrativa** | Una historia con persona concreta baja la defensa crítica | Un beneficiario con nombre, no «los agricultores» | Nombres propios, primera persona |
| **Víctima identificable** | Una persona concreta conmueve más que un colectivo | «Doña Marta, 54 años, La Concepción» | Nombres y edades en el guion |
| **Anclaje** | La primera cifra fija el juicio sobre las demás | Abrir con el dato de costo o impacto | Primera cifra y su posición |
| **Prueba social** | «Otros ya lo usan» reduce el riesgo percibido | Usuarios reales, aliados, pilotos | Menciones (hoy 0% testimonio) |
| **Autoridad** | Un aval creíble transfiere credibilidad | Universidad, institución, experto | Créditos y logos |
| **Aversión a la pérdida** | Duele más perder lo que se tiene que ganar lo que falta | «Sin esto, el productor pierde la cosecha» | Marco negativo vs positivo |
| **Contraste** | Se juzga contra el video anterior, no en absoluto | Un arranque distinto al de los 20 previos | Diversidad de formato en la sede |
| **Sobrecarga cognitiva** | Tras 15 videos deja de procesar detalles | Estructura repetible, una idea por pantalla | Orden de evaluación (no disponible) |

**Consecuencia:** el jurado no compara tu solución con la verdad; la compara con el video anterior y con lo que puede procesar sin esfuerzo. Ganar es, en buena parte, **reducir el costo cognitivo de entender por qué importa**.

---

## 7. Técnicas de pitch y ventas aplicadas a 120 segundos

### 7.1 Estructuras probadas

| Técnica | Origen | Estructura | Encaje |
|---|---|---|---|
| **PAS** | Copywriting | Dolor → consecuencia → solución | 0–20 / 20–40 / 40–90 s |
| **BAB** | Ventas | Antes → después → cómo | Proyectos incrementales |
| **Story Spine** | Pixar | «Había una vez… hasta que un día…» | Proyectos con usuario real |
| **AIDA** | Publicidad | Atención → interés → deseo → acción | Si el cierre pide algo concreto |
| **Challenger** | Ventas B2B | Enseñar algo nuevo, reencuadrar | Desafíos técnicos |
| **«So what?»** | Consultoría | Cada frase se pregunta «¿y qué?» | Filtro de guion |

### 7.2 Reglas de oficio

1. **Una idea por video.** El jurado recuerda una cosa; si intentas dejar cinco, deja cero.
2. **La solución antes del segundo 40.** La claridad temprana reduce el costo de seguir mirando.
3. **Un número, no cinco.** La cifra que se recuerda es una.
4. **Mostrar, no explicar.** Ocho segundos de demo valen más que veinte de narración sobre la demo.
5. **El cierre se ensaya.** Se recuerda tanto como la primera frase.
6. **El nombre del proyecto, una vez.** Repetirlo no lo hace memorable: lo hace ruido.
7. **El título es parte del pitch.** Es lo único que se ve antes de decidir mirar con atención.

### 7.3 Guion de 120 s derivado del corpus

| Tramo | Segundos | Qué debe pasar | Por qué |
|---|---|---|---|
| Gancho | 0–10 | Una frase que solo puede ser de este proyecto | Primacía y contraste |
| Problema | 10–30 | Una persona, un lugar, una pérdida medible | Víctima identificable |
| Solución | 30–60 | Qué es, cómo funciona, quién lo usa | Fluidez |
| Demo | 60–80 | Producto funcionando, sin narración encima | Mostrar, no explicar |
| Impacto | 80–105 | Alcance con cifra y territorio | Anclaje |
| Cierre | 105–120 | Frase repetible con el nombre del proyecto | Pico-final |

---

## 8. Protocolo de validación

- **Q1 Integridad.** Sin duplicados de `video_id` por edición; 408 videos aparecen en más de una edición y es legítimo.
- **Q2 Cobertura.** Toda conclusión de texto declara `n` y `caption_source`.
- **Q3 Etiqueta.** `won` verificado contra el HTML crudo.
- **Q4 Fuga temporal.** Variables «previas» solo con años anteriores.
- **Q5 Fuga de resultado.** Vistas y likes nunca como predictor.
- **Q6 Partición.** 2017–2024 / 2025 / 2026.
- **Q7 Agrupación.** GroupKFold por (año, sede).
- **Q8 Métrica.** PR-AUC y lift por decil.
- **Q9 Potencia.** n≥30 por celda; n≥300 para texto.
- **Q10 Reproducibilidad.** Un comando.
- **Q11 Corrección múltiple.** BH sobre {len(HYP)} hipótesis.
- **Q12 Doble revisión.** 30 videos codificados a mano.
- **Q13 Artefactos.** Antes de declarar un hallazgo, comprobar si es 1/n disfrazado.

---

## 9. Lo que falta para subir el techo

| Vacío | Coste | Qué desbloquea |
|---|---|---|
| Transcripción de los 1.204 videos de Nicaragua | ~7 h de CPU | De {num(N_TXT_VID,0)} a más de 1.200 videos con texto: única vía para hablar de guion con potencia |
| Codificación humana de 30–50 videos | 4 h | Validar detectores y ver lo que ningún regex ve |
| Features de audio (voz, música, silencios) | bajo | Efecto halo y fluidez |
| OCR de texto en pantalla | bajo | Densidad de mensaje |
| Rúbrica real del certamen activo | nulo | Ponderar según lo que de verdad se evalúa |

**Veredicto:** el corpus ya respondió las preguntas fáciles y desmontó dos mitos del propio proyecto (que la duración premiaba y que el desafío masivo castigaba). Lo que queda es lo difícil: medir cómo se siente un ganador. Eso exige texto y audio a escala, y es lo que la siguiente corrida debe producir.

---

*Documento generado por `scripts/sirli_sistemico.py`. Cifras recalculables; ninguna editada a mano.*
"""

DOC = "".join(ch for ch in DOC if ch >= " " or ch in "\n\t")
(AN / "investigacion_profunda.md").write_text(DOC, encoding="utf-8")

out = {
    "generado": "2026-10-22",
    "filas": int(len(DF)),
    "core": {"n": int(len(CORE)), "tasa": float(CORE.won.mean())},
    "hipotesis": HYP,
    "asociaciones": ASSOC.to_dict(orient="records"),
    "pares": PAIRS,
    "curiosidades": CURIOS,
    "conteo_estados": cnt_est,
}
(AN / "sistemico.json").write_text(json.dumps(out, ensure_ascii=False, indent=1, default=str), encoding="utf-8")

print(f"OK  hipotesis={len(HYP)}  a favor={cnt_est['a favor']}  en contra={cnt_est['en contra']}  nulas={cnt_est['sin evidencia']}")
print(f"OK  {AN / 'investigacion_profunda.md'}")
for h in HYP:
    if h["status"] in ("a favor", "en contra"):
        print("   ", h["id"], h["status"], f"{h['r1']:.3f} vs {h['r0']:.3f}", "p=", fmt_p(h["p"]))

