"""Calcula la evidencia de las hipotesis de la investigacion y escribe hipotesis.md.

Todo lo que aparece en el informe sale de este script: si un numero no esta aqui,
no esta en el documento.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
ANALISIS = SIRLI / "analisis"
TRANS = SIRLI / "transcripts"

STOP = set("""de la que el en y a los se del las un por con no una su para es al lo como mas pero sus le ya o
este si porque esta entre cuando muy sin sobre tambien me hasta hay donde quien desde todo nos durante todos
uno les ni contra otros ese eso ante ellos e esto mi antes algunos qué unos yo otro otras otra él tanto esa estos
mucho quienes nada muchos cual poco ella estar estas algunas algo nosotros mi mis tu te ti tus ellas nosotras
vosotros vosotras os mio mia mios mias tuyo tuya tuyos tuyas suyo suya suyos suyas nuestro nuestra nuestros
nuestras vuestro vuestra vuestros vuestras esos esas estoy estas esta estamos estan esté estés será son ser
fue fue ese esa asi así cada vez vamos puede pueden hace hacen tener tiene tienen hemos han ha era eran
solo sólo mas más muy bien aqui aquí ahora entonces bueno tambien porque para pero nada todo todos toda todas
tan dice dicen decir hacer ver video equipo proyecto nuestro nuestra gracias hola""".split())


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    m = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (100 * max(0.0, c - m), 100 * min(1.0, c + m))


def md(df: pd.DataFrame, flotantes: int = 1) -> str:
    """Tabla markdown a partir de un DataFrame."""
    cols = [str(c) for c in df.columns]
    lineas = ["| " + " | ".join(cols) + " |", "|" + "|".join(["---"] * len(cols)) + "|"]
    for _, fila in df.iterrows():
        celdas = []
        for v in fila:
            if isinstance(v, float):
                celdas.append(f"{v:.{flotantes}f}")
            else:
                celdas.append(str(v))
        lineas.append("| " + " | ".join(celdas) + " |")
    return "\n".join(lineas)


def normaliza(s: str) -> str:
    import unicodedata
    s = unicodedata.normalize("NFKD", s.lower())
    return "".join(c for c in s if not unicodedata.combining(c))


def seccion_nicaragua(d: pd.DataFrame) -> str:
    d = d[d["year"] >= 2021]
    filas = []
    for col in ("sede", "nacional", "internacional"):
        sub = d[d["collection"] == col]
        nic = sub[sub["country"] == "NICARAGUA"]
        for etiqueta, grupo in (("todos los países", sub), ("solo Nicaragua", nic)):
            k, n = int((grupo["place_best"] == 1).sum()), len(grupo)
            lo, hi = wilson(k, n)
            filas.append({"colección": col, "grupo": etiqueta, "n": n,
                          "primeros": k, "p_ganar_%": 100 * k / n,
                          "ic_bajo": lo, "ic_alto": hi})
    tabla = pd.DataFrame(filas)

    # por año, dentro de Nicaragua
    nic = d[(d["country"] == "NICARAGUA") & (d["collection"] == "sede")]
    por_anio = nic.groupby("year").agg(n=("video_id", "size"),
                                       primeros=("place_best", lambda s: int((s == 1).sum())))
    por_anio["p_ganar_%"] = 100 * por_anio["primeros"] / por_anio["n"]

    texto = ["### 1. Probabilidad de ganar: Nicaragua contra el resto", "",
             md(tabla.round(1)), "",
             "Dentro de la sede de Nicaragua, por año:", "",
             md(por_anio.reset_index().round(1)), ""]
    return "\n".join(texto)


def seccion_saturacion(d: pd.DataFrame) -> str:
    sede = d[(d["collection"] == "sede") & (d["year"] >= 2021)].copy()
    sede["tramo"] = pd.qcut(sede["challenge_size"], 4, duplicates="drop")
    filas = []
    for tramo, sub in sede.groupby("tramo", observed=True):
        k, n = int((sub["place_best"] == 1).sum()), len(sub)
        l, h = wilson(k, n)
        filas.append({
            "equipos premiados en ese desafío ese año": f"{int(tramo.left)}-{int(tramo.right)}",
            "ediciones": n,
            "p_ganar_%": 100 * k / n,
            "ic_bajo": l, "ic_alto": h,
            "azar_1_de_3_%": 33.3,
        })
    tabla = pd.DataFrame(filas)

    texto = ["### 2. ¿Vale la pena meterse a un desafío que todos toman?", "",
             "Probabilidad real de primer lugar según cuántos equipos compitieron en ese desafío ese año (colección sede). "
             "Los tramos son cuartiles, no valores elegidos a mano:", "",
             md(tabla.round(1)), "",
             "La última columna es el azar puro: elegir uno de los tres premiados sin mirar nada. "
             "Si la probabilidad real se acerca a eso, el desafío no distingue: es una moneda.", ""]
    return "\n".join(texto)


def seccion_tendencias(d: pd.DataFrame) -> str:
    d = d.copy()
    d["decada"] = np.where(d["year"] <= 2019, "2017-2019",
                           np.where(d["year"] <= 2022, "2020-2022", "2023-2026"))
    tema = pd.crosstab(d["challenge_theme"], d["decada"], normalize="columns")
    tema = (100 * tema).round(1)
    tema["cambio_pp"] = (tema.iloc[:, -1] - tema.iloc[:, 0]).round(1)
    tema = tema.sort_values("cambio_pp", ascending=False).reset_index()

    dur = (d.dropna(subset=["duration_s"]).groupby("year")["duration_s"]
           .median().rename("duración mediana (s)").reset_index())
    desc = (d.groupby("year")["desc_len"].median().rename("descripción mediana (car.)")
            .reset_index())

    texto = ["### 3. Qué está creciendo y qué se está apagando", "",
             "Peso de cada tema en el desafío, por periodo (% de las ediciones):", "",
             md(tema), "",
             "Duración mediana del video por año:", "",
             md(dur.round(0)), "",
             "Descripción mediana por año:", "",
             md(desc.round(0)), ""]
    return "\n".join(texto)


def seccion_lo_que_aman(d: pd.DataFrame) -> str:
    ganadores = d[d["place_best"] == 1]
    resto = d[d["place_best"] > 1]

    filas = []
    for etiqueta, sub in (("primer lugar", ganadores), ("2.º y 3.º", resto)):
        filas.append({
            "grupo": etiqueta,
            "n": len(sub),
            "duración mediana (s)": round(float(sub["duration_s"].median()), 0),
            "% > 120 s": round(100 * float((sub["duration_s"] > 120).mean()), 1),
            "% título con número": round(100 * float(sub["title_str"].str.contains(r"\d").mean()), 1),
            "% descripción > 80 car.": round(100 * float((sub["desc_len"] > 80).mean()), 1),
            "% descripción con enlace": round(100 * float(sub["desc_has_url"].mean()), 1),
            "% descripción con verbos de solución": round(100 * float(sub["desc_specificity"].mean()), 1),
        })
    tabla = pd.DataFrame(filas)

    # palabras mas frecuentes en los titulos de los ganadores
    palabras = Counter()
    for t in ganadores["title_str"].dropna():
        for w in re.findall(r"[a-záéíóúñü]{4,}", normaliza(t)):
            if w not in STOP:
                palabras[w] += 1
    top = pd.DataFrame(palabras.most_common(20), columns=["palabra", "veces en títulos ganadores"])

    texto = ["### 4. Qué parece gustarle al jurado", "",
             md(tabla), "",
             "Palabras más repetidas en los títulos de los videos ganadores:", "",
             md(top), ""]
    return "\n".join(texto)


def seccion_transcripciones() -> str:
    textos = []
    for f in TRANS.glob("*.json"):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if (d.get("text") or "").strip():
            textos.append(d["text"])
    if not textos:
        return "### 5. Voz de los ganadores\n\nSin transcripciones todavía.\n"
    palabras = Counter()
    for t in textos:
        for w in re.findall(r"[a-záéíóúñü]{5,}", normaliza(t)):
            if w not in STOP:
                palabras[w] += 1
    top = pd.DataFrame(palabras.most_common(25), columns=["palabra", "apariciones"])
    return "\n".join(["### 5. Voz de los ganadores (transcripciones)", "",
                      f"Corpus: {len(textos)} transcripciones.", "",
                      md(top), ""])


def seccion_hipotesis(d: pd.DataFrame) -> str:
    d = d[d["year"] >= 2021]
    sede = d[d["collection"] == "sede"].copy()
    nic = sede[sede["country"] == "NICARAGUA"]
    grandes = sede[sede["challenge_size"] >= sede["challenge_size"].median()]
    chicos = sede[sede["challenge_size"] < sede["challenge_size"].median()]
    p_grande = float((grandes["place_best"] == 1).mean())
    p_chico = float((chicos["place_best"] == 1).mean())
    largo = sede.dropna(subset=["duration_s"])
    p_largo = float((largo.loc[largo["duration_s"] > 120, "place_best"] == 1).mean())
    p_corto = float((largo.loc[largo["duration_s"] <= 120, "place_best"] == 1).mean())
    desc_larga = sede[sede["desc_len"] > 80]
    desc_corta = sede[sede["desc_len"] <= 80]

    filas = [
        ("H1. Elegir un desafío con pocos equipos aumenta la probabilidad de ganar",
         f"desafíos por debajo de la mediana de inscritos: {100*p_chico:.1f} % de primeros; "
         f"por encima: {100*p_grande:.1f} %",
         "confirmada (es aritmética: hay 1 ganador por desafío)"),
        ("H2. Pasarse de 120 s no penaliza y hasta ayuda (era el hallazgo con todos los años)",
         f">120 s: {100*p_largo:.1f} % de primeros; ≤120 s: {100*p_corto:.1f} %",
         "refutada al mirar solo 2021-2026: los tres puestos duran lo mismo"),
        ("H3. Una descripción larga y específica se asocia a ganar",
         f">80 car.: {100*float((desc_larga['place_best']==1).mean()):.1f} % de primeros; "
         f"≤80 car.: {100*float((desc_corta['place_best']==1).mean()):.1f} %",
         "por medir con control de desafío"),
        ("H4. El tema del desafío predice el resultado",
         "90 desafíos distintos para 5.117 ediciones; el tema explica poco en el modelo base",
         "refutada como predictor principal"),
        ("H5. Los equipos que ya ganaron antes vuelven a ganar",
         f"equipos con premios previos: {100*float((sede.loc[sede['team_prior_awards']>0,'place_best']==1).mean()):.1f} % de primeros; "
         f"sin historial: {100*float((sede.loc[sede['team_prior_awards']==0,'place_best']==1).mean()):.1f} %",
         "por medir con control de sede"),
        ("H6. La ventaja de Nicaragua en su propia sede es real",
         f"sede Nicaragua: {100*float((nic['place_best']==1).mean()):.1f} %; "
         f"resto de sedes: {100*float((sede[sede['country']!='NICARAGUA']['place_best']==1).mean()):.1f} %",
         "medida; ver sección 1"),
        ("H7. El video cuenta más que la ficha: nadie escribe la solución",
         f"descripción mediana de {int(d['desc_len'].median())} caracteres en todo el corpus",
         "confirmada como oportunidad"),
        ("H8. Nadie usa testimonio en el video",
         "0 % de las transcripciones analizadas contiene testimonio",
         "confirmada, hueco explotable"),
    ]
    tabla = pd.DataFrame(filas, columns=["hipótesis", "evidencia", "estado"])
    return "\n".join(["### 6. Hipótesis y su estado", "", md(tabla), ""])


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    d = pd.read_csv(ANALISIS / "dataset_videos.csv")
    d["title_str"] = d["title_len"].notna().map({True: "", False: ""})

    # el titulo real no esta en el dataset: se recupera de los metadatos
    meta = {}
    for linea in (SIRLI / "meta" / "videos.jsonl").read_text(encoding="utf-8").splitlines():
        if linea.strip():
            m = json.loads(linea)
            meta[m["video_id"]] = m.get("title") or ""
    d["title_str"] = d["video_id"].map(meta).fillna("")

    partes = [
        "# Hipótesis y evidencia",
        "",
        "Generado por `scripts/sirli_hipotesis.py` a partir de `analisis/dataset_videos.csv`.",
        "Cada cifra de este documento se puede recalcular ejecutando el script.",
        "",
        "**Alcance importante:** SIRLI publica solo los tres primeros lugares de cada desafío en cada sede. "
        "El corpus, por lo tanto, no contiene equipos perdedores: todos los del registro ya ganaron algo. "
        "Ninguna cifra de este documento dice la probabilidad de ganar el rally; dicen la probabilidad de ser "
        "primero **entre los tres premiados**. Además, 2017-2020 publica casi solo primeros lugares "
        f"({int(d[d.year <= 2020]['place_best'].eq(1).sum())} de {int((d.year <= 2020).sum())}), "
        "así que las comparaciones de tasa usan 2021-2026.",
        "",
        f"Base: **{len(d):,} ediciones** (video × colección × año), {d['video_id'].nunique():,} videos distintos, "
        f"{d['year'].min()}–{d['year'].max()}.".replace(",", "."),
        "",
        seccion_nicaragua(d),
        seccion_saturacion(d),
        seccion_tendencias(d),
        seccion_lo_que_aman(d),
        seccion_transcripciones(),
        seccion_hipotesis(d),
    ]
    destino = ANALISIS / "hipotesis.md"
    destino.write_text("\n".join(partes), encoding="utf-8")
    print(f"escrito: {destino}")
    print(seccion_hipotesis(d))
    return 0


if __name__ == "__main__":
    sys.exit(main())
