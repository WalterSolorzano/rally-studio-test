"""Genera las figuras 1-8 del plan de investigacion a partir del dataset.

Cada figura se guarda como PNG en analisis/figuras/ y los datos que la alimentan
quedan en analisis/figuras/<nombre>.csv para que sea reproducible.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
ANALISIS = SIRLI / "analisis"
FIGS = ANALISIS / "figuras"

PRIMARY = "#1d45b9"
SECONDARY = "#f81110"
ACCENT = "#2aa7ad"
DARK = "#111111"
GRIS = "#9aa3b2"

plt.rcParams.update({
    "figure.dpi": 200,
    "savefig.dpi": 200,
    "font.size": 9,
    "axes.titlesize": 11,
    "axes.titleweight": "bold",
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.edgecolor": "#444444",
    "figure.facecolor": "white",
    "axes.facecolor": "white",
})

PLACE_COLORS = {1: PRIMARY, 2: ACCENT, 3: GRIS}
PLACE_LABEL = {1: "Primer lugar", 2: "Segundo lugar", 3: "Tercer lugar"}


def save(fig, name: str, data: pd.DataFrame | None = None) -> None:
    FIGS.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    destino = FIGS / f"{name}.png"
    for intento in range(4):
        try:
            fig.savefig(destino)
            break
        except OSError as exc:  # Windows a veces bloquea el archivo un instante
            if intento == 3:
                raise SystemExit(f"no se pudo guardar {destino}: {exc}")
            import time
            time.sleep(0.6)
    plt.close(fig)
    if data is not None:
        data.to_csv(FIGS / f"{name}.csv", index=False, encoding="utf-8-sig")
    print(f"figura: {name}.png")


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    denom = 1 + z * z / n
    centro = (p + z * z / (2 * n)) / denom
    margen = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return (max(0.0, centro - margen), min(1.0, centro + margen))


def fig01_duracion(df: pd.DataFrame) -> None:
    # 2017-2020 solo publica primeros lugares: comparar puestos ahi seria falso
    d = df[(df["year"] >= 2021) & (df["collection"] == "sede")].dropna(subset=["duration_s", "place_best"])
    d = d[d["duration_s"].between(10, 400)]
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 3.6))

    for place in (1, 2, 3):
        vals = d.loc[d["place_best"] == place, "duration_s"]
        ax1.hist(vals, bins=np.arange(0, 300, 10), density=True, alpha=0.45,
                 color=PLACE_COLORS[place], label=f"{PLACE_LABEL[place]} (n={len(vals)})")
    ax1.axvline(120, color=SECONDARY, linestyle="--", linewidth=1)
    ax1.text(121, ax1.get_ylim()[1] * 0.92, "tope 120 s", color=SECONDARY, fontsize=8)
    ax1.set_xlim(0, 300)
    ax1.set_xlabel("Duración del video (segundos)")
    ax1.set_ylabel("Densidad")
    ax1.set_title("Figura 1a. Duración por puesto (sede, 2021-2026)")
    ax1.legend(frameon=False, fontsize=8)

    for place in (1, 2, 3):
        vals = np.sort(d.loc[d["place_best"] == place, "duration_s"].values)
        if len(vals) == 0:
            continue
        ax2.plot(vals, np.arange(1, len(vals) + 1) / len(vals), color=PLACE_COLORS[place],
                 label=PLACE_LABEL[place])
    ax2.axvline(120, color=SECONDARY, linestyle="--", linewidth=1)
    ax2.set_xlim(0, 240)
    ax2.set_xlabel("Duración del video (segundos)")
    ax2.set_ylabel("Proporción acumulada")
    ax2.set_title("Figura 1b. Acumulada: quién agota el tiempo (sede, 2021-2026)")
    ax2.legend(frameon=False, fontsize=8)

    resumen = d.groupby("place_best")["duration_s"].describe()
    save(fig, "fig01_duracion_puesto", resumen.reset_index())


def fig02_tope(df: pd.DataFrame) -> None:
    d = df[(df["year"] >= 2021) & (df["collection"] == "sede")].dropna(subset=["duration_s", "place_best"])
    filas = []
    for place in (1, 2, 3):
        sub = d[d["place_best"] == place]
        k = int((sub["duration_s"] <= 120).sum())
        n = len(sub)
        lo, hi = wilson(k, n)
        filas.append({"place": place, "n": n, "k": k, "pct": 100 * k / n,
                      "lo": 100 * lo, "hi": 100 * hi})
    res = pd.DataFrame(filas)

    fig, ax = plt.subplots(figsize=(6.4, 3.6))
    ax.bar([PLACE_LABEL[p] for p in res["place"]], res["pct"],
           color=[PLACE_COLORS[p] for p in res["place"]], width=0.55)
    ax.errorbar([PLACE_LABEL[p] for p in res["place"]], res["pct"],
                yerr=[res["pct"] - res["lo"], res["hi"] - res["pct"]],
                fmt="none", ecolor=DARK, capsize=4, linewidth=1)
    for i, r in res.iterrows():
        ax.text(i, r["hi"] + 1.5, f"{r['pct']:.1f}%\nn={int(r['n'])}", ha="center", fontsize=8)
    ax.set_ylim(0, 100)
    ax.set_ylabel("% de videos de 120 s o menos")
    ax.set_title("Figura 2. Tope de 120 s por puesto, sede 2021-2026 (IC 95 %)")
    save(fig, "fig02_tope_120s", res)


def fig03_calor(df: pd.DataFrame) -> None:
    tabla = df.pivot_table(index="year", columns="collection", values="video_id",
                           aggfunc="count", fill_value=0)
    tabla = tabla.sort_index()
    fig, ax = plt.subplots(figsize=(6.6, 4.2))
    im = ax.imshow(tabla.values, cmap="Blues", aspect="auto")
    ax.set_xticks(range(len(tabla.columns)), tabla.columns)
    ax.set_yticks(range(len(tabla.index)), [str(y) for y in tabla.index])
    for i in range(tabla.shape[0]):
        for j in range(tabla.shape[1]):
            v = tabla.values[i, j]
            ax.text(j, i, f"{v:,}".replace(",", "."), ha="center", va="center", fontsize=8,
                    color="white" if v > tabla.values.max() * 0.55 else DARK)
    ax.set_title("Figura 3. Premios registrados por año y colección")
    fig.colorbar(im, ax=ax, shrink=0.8, label="videos")
    save(fig, "fig03_calor_anio_coleccion", tabla.reset_index())


def fig04_paises(df: pd.DataFrame, top: int = 15) -> None:
    d = df.dropna(subset=["country"])
    total = d.groupby("country").size()
    primeros = d[d["place_best"] == 1].groupby("country").size()
    res = pd.DataFrame({"participaciones": total, "primeros": primeros}).fillna(0)
    res["conversion"] = 100 * res["primeros"] / res["participaciones"]
    res = res.sort_values("primeros", ascending=False).head(top).iloc[::-1]

    fig, ax = plt.subplots(figsize=(7.4, 4.8))
    ax.barh(res.index, res["primeros"], color=PRIMARY, height=0.62, label="primeros lugares")
    for i, (pais, r) in enumerate(res.iterrows()):
        ax.text(r["primeros"] + 6, i, f"{int(r['primeros'])}  ({r['conversion']:.0f}% de {int(r['participaciones'])})",
                va="center", fontsize=7.5, color=DARK)
    ax.set_xlabel("Primeros lugares")
    ax.set_title(f"Figura 4. Los {top} países con más primeros lugares")
    ax.set_xlim(0, res["primeros"].max() * 1.35)
    save(fig, "fig04_paises", res.reset_index())


def fig05_desafios(df: pd.DataFrame, top: int = 12) -> None:
    """Saturacion real: se agrupa por el texto del desafio, no por su numero de orden."""
    d = df.dropna(subset=["challenge_name"]).copy()
    d["challenge_name"] = d["challenge_name"].str.strip().str.upper()
    serie = d.groupby("challenge_name").size().sort_values(ascending=False)
    top_serie = serie.head(top).iloc[::-1]

    def corto(s: str, n: int = 42) -> str:
        return s if len(s) <= n else s[: n - 1].rstrip() + "…"

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.6), gridspec_kw={"width_ratios": [1.7, 1]})
    ax1.barh([corto(i) for i in top_serie.index], top_serie.values, color=ACCENT, height=0.65)
    for i, v in enumerate(top_serie.values):
        ax1.text(v + 3, i, str(v), va="center", fontsize=7.5)
    ax1.set_xlabel("Equipos que compitieron")
    ax1.set_xlim(0, top_serie.max() * 1.12)
    ax1.set_title(f"Figura 5a. Los {top} desafíos más disputados")

    acum = np.cumsum(np.sort(serie.values)[::-1]) / serie.values.sum()
    ax2.plot(np.arange(1, len(acum) + 1), 100 * acum, color=PRIMARY, linewidth=2)
    ax2.plot([0, len(acum)], [0, 100], color=GRIS, linestyle="--", linewidth=1)
    ax2.set_xlabel(f"{len(serie)} desafíos ordenados por volumen")
    ax2.set_ylabel("% acumulado de equipos")
    ax2.set_title("Figura 5b. Concentración de la competencia")
    ax2.set_xlim(0, len(acum))

    save(fig, "fig05_desafios", serie.reset_index(name="equipos"))


def fig06_descripcion(df: pd.DataFrame) -> None:
    d = df.dropna(subset=["desc_len", "place_best"])
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 3.6))

    for place in (1, 2, 3):
        vals = np.sort(d.loc[d["place_best"] == place, "desc_len"].values)
        vals = vals[vals <= 800]
        ax1.plot(vals, np.arange(1, len(vals) + 1) / len(vals), color=PLACE_COLORS[place],
                 label=PLACE_LABEL[place])
    ax1.set_xlim(0, 800)
    ax1.set_xlabel("Caracteres de la descripción del video")
    ax1.set_ylabel("Proporción acumulada")
    ax1.set_title("Figura 6a. Cuánto se documenta cada puesto")
    ax1.legend(frameon=False, fontsize=8)

    filas = []
    for place in (1, 2, 3):
        sub = d[d["place_best"] == place]
        k = int((sub["desc_len"] > 80).sum())
        n = len(sub)
        lo, hi = wilson(k, n)
        filas.append({"place": place, "n": n, "pct": 100 * k / n, "lo": 100 * lo, "hi": 100 * hi})
    res = pd.DataFrame(filas)
    ax2.bar([PLACE_LABEL[p] for p in res["place"]], res["pct"],
            color=[PLACE_COLORS[p] for p in res["place"]], width=0.55)
    ax2.errorbar([PLACE_LABEL[p] for p in res["place"]], res["pct"],
                 yerr=[res["pct"] - res["lo"], res["hi"] - res["pct"]],
                 fmt="none", ecolor=DARK, capsize=4, linewidth=1)
    ax2.set_ylim(0, 100)
    ax2.set_ylabel("% con descripción útil (>80 car.)")
    ax2.set_title("Figura 6b. Descripción útil por puesto")
    plt.setp(ax2.get_xticklabels(), rotation=12)

    save(fig, "fig06_descripcion", res)


def fig07_marcadores(df: pd.DataFrame) -> None:
    cols = ["t_hook_pregunta", "t_problema", "t_solucion", "t_impacto",
            "t_equipo", "t_cierre", "t_demo", "t_testimonio"]
    # un video puede aparecer en varias ediciones: se cuenta una sola vez
    df = df.drop_duplicates("video_id")
    d = df.dropna(subset=["t_solucion"])
    filas = []
    for c in cols:
        n = int(df[c].notna().sum())
        k = int(df[c].fillna(0).sum())
        lo, hi = wilson(k, n)
        filas.append({"marcador": c.replace("t_", ""), "n": n, "k": k,
                      "pct": 100 * k / n if n else 0, "lo": 100 * lo, "hi": 100 * hi})
    res = pd.DataFrame(filas).sort_values("pct")

    fig, ax = plt.subplots(figsize=(7.2, 4.2))
    ax.barh(res["marcador"], res["pct"], color=[SECONDARY if p < 30 else PRIMARY for p in res["pct"]],
            height=0.62)
    ax.errorbar(res["pct"], res["marcador"],
                xerr=[res["pct"] - res["lo"], res["hi"] - res["pct"]],
                fmt="none", ecolor=DARK, capsize=3, linewidth=1)
    for i, r in enumerate(res.itertuples()):
        ax.text(max(r.hi, r.pct) + 1.5, i, f"{r.pct:.0f}%  (n={r.n})", va="center", fontsize=8)
    ax.set_xlim(0, 100)
    ax.set_xlabel("% de videos con el marcador")
    ax.set_title(f"Figura 7. Marcadores narrativos en {len(d)} videos transcritos")
    save(fig, "fig07_marcadores", res)


def fig08_serie(df: pd.DataFrame) -> None:
    d = df.dropna(subset=["duration_s"])
    g = d.groupby(["year", "collection"])["duration_s"].median().unstack()
    fig, ax = plt.subplots(figsize=(6.8, 3.8))
    for col in g.columns:
        ax.plot(g.index, g[col], marker="o", markersize=4,
                color={"sede": PRIMARY, "nacional": SECONDARY, "internacional": ACCENT}.get(col, GRIS),
                label=col)
    ax.axhline(120, color=DARK, linestyle="--", linewidth=1)
    ax.set_xlabel("Año")
    ax.set_ylabel("Duración mediana (s)")
    ax.set_title("Figura 8. Duración mediana por año y colección")
    ax.legend(frameon=False, fontsize=8)
    save(fig, "fig08_duracion_anio", g.reset_index())


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    df = pd.read_csv(ANALISIS / "dataset_videos.csv")
    print(f"dataset: {len(df)} filas")
    fig01_duracion(df)
    fig02_tope(df)
    fig03_calor(df)
    fig04_paises(df)
    fig05_desafios(df)
    fig06_descripcion(df)
    fig07_marcadores(df)
    fig08_serie(df)
    print(f"figuras en {FIGS}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
