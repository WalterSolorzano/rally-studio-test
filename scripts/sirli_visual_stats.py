"""Mide color, brillo, saturacion, densidad de bordes y caras en miniaturas y fotogramas.

Entradas:
  research/sirli/meta/thumbs/<id>.jpg   (miniatura del video)
  research/sirli/frames/<id>.jpg        (hoja de contacto 3x2 con 6 fotogramas)

Salidas:
  research/sirli/analisis/visual.csv
  research/sirli/analisis/resumen_visual.json
  research/sirli/analisis/figuras/fig09_visual_puesto.png
  research/sirli/analisis/figuras/fig10_visual_coleccion.png

Las metricas son deliberadamente simples y auditables: no hay modelos de vision,
solo estadistica de pixeles y un detector de caras en cascada incluido en OpenCV.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
ANALISIS = SIRLI / "analisis"
FIGS = ANALISIS / "figuras"
THUMBS = SIRLI / "meta" / "thumbs"
FRAMES = SIRLI / "frames"

PRIMARY = "#1d45b9"
SECONDARY = "#f81110"
ACCENT = "#2aa7ad"
GRIS = "#9aa3b2"
DARK = "#111111"

plt.rcParams.update({
    "figure.dpi": 200, "savefig.dpi": 200, "font.size": 9,
    "axes.titlesize": 11, "axes.titleweight": "bold",
    "axes.spines.top": False, "axes.spines.right": False,
    "figure.facecolor": "white",
})

CARAS = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def metricas(img: np.ndarray) -> dict:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    b, g, r = (img[:, :, i].astype(np.float32) for i in range(3))
    rg = r - g
    yb = 0.5 * (r + g) - b
    colorfulness = float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2))

    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    bordes = cv2.Canny(gris, 100, 200)
    caras = CARAS.detectMultiScale(gris, scaleFactor=1.15, minNeighbors=4, minSize=(24, 24))

    return {
        "brillo": float(hsv[:, :, 2].mean()),
        "saturacion": float(hsv[:, :, 1].mean()),
        "colorfulness": colorfulness,
        "contraste": float(gris.std()),
        "bordes": float((bordes > 0).mean()),
        "caras": int(len(caras)),
        "verde": float(((hsv[:, :, 0] > 35) & (hsv[:, :, 0] < 95) & (hsv[:, :, 1] > 60)).mean()),
        "piel": float(((hsv[:, :, 0] < 25) | (hsv[:, :, 0] > 160)).mean() if hsv[:, :, 1].mean() > 0 else 0),
    }


def analiza_hoja(ruta: Path) -> dict:
    img = cv2.imread(str(ruta))
    if img is None:
        return {}
    alto, ancho = img.shape[:2]
    filas, cols = 2, 3
    porciones = []
    for f in range(filas):
        for c in range(cols):
            y0, y1 = int(f * alto / filas), int((f + 1) * alto / filas)
            x0, x1 = int(c * ancho / cols), int((c + 1) * ancho / cols)
            trozo = img[y0:y1, x0:x1]
            if trozo.size:
                porciones.append(metricas(trozo))
    if not porciones:
        return {}
    salida = {}
    for clave in porciones[0]:
        valores = [p[clave] for p in porciones]
        salida[f"f_{clave}_medio"] = round(float(np.mean(valores)), 3)
        salida[f"f_{clave}_max"] = round(float(np.max(valores)), 3)
    salida["f_caras_alguna"] = int(any(p["caras"] > 0 for p in porciones))
    salida["f_caras_3mas"] = int(sum(p["caras"] for p in porciones) >= 3)
    salida["f_primer_frame_caras"] = int(porciones[0]["caras"])
    return salida


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    filas = []

    for ruta in sorted(THUMBS.glob("*.jpg")):
        img = cv2.imread(str(ruta))
        if img is None:
            continue
        m = {f"t_{k}": round(v, 3) if isinstance(v, float) else v for k, v in metricas(img).items()}
        m["video_id"] = ruta.stem
        filas.append(m)
    print(f"miniaturas analizadas: {len(filas)}")

    hojas = sorted(FRAMES.glob("*.jpg"))
    for ruta in hojas:
        m = analiza_hoja(ruta)
        if not m:
            continue
        m["video_id"] = ruta.stem
        # se fusiona con la fila de la miniatura si existe
        filas.append(m)
    print(f"hojas de fotogramas analizadas: {len(hojas)}")

    df = pd.DataFrame(filas)
    df = df.groupby("video_id", as_index=False).first()
    salida = ANALISIS / "visual.csv"
    df.to_csv(salida, index=False, encoding="utf-8-sig")
    print(f"escrito: {salida} · {len(df)} videos")

    # cruce con resultado
    d = pd.read_csv(ANALISIS / "dataset_videos.csv")
    d = d[(d["collection"] == "sede") & (d["year"] >= 2021)]
    cruce = d.merge(df, on="video_id", how="inner")
    print(f"videos con visual y resultado: {len(cruce)}")

    resumen = {"videos_con_miniatura": int(df["t_brillo"].notna().sum()),
               "videos_con_fotogramas": int(df.get("f_caras_alguna", pd.Series(dtype=float)).notna().sum())}
    if len(cruce):
        por_puesto = cruce.groupby("place_best").agg(
            n=("video_id", "size"),
            brillo=("t_brillo", "mean"),
            saturacion=("t_saturacion", "mean"),
            colorfulness=("t_colorfulness", "mean"),
            bordes=("t_bordes", "mean"),
            caras_medio=("t_caras", "mean"),
            piel=("t_piel", "mean"),
        ).round(2)
        resumen["miniatura_por_puesto"] = por_puesto.reset_index().to_dict(orient="records")
        print("\nMiniatura por puesto:")
        print(por_puesto.to_string())

        if "f_caras_alguna" in cruce:
            ff = cruce.groupby("place_best").agg(
                n=("f_caras_alguna", "count"),
                caras_alguna=("f_caras_alguna", "mean"),
                verde=("f_verde_medio", "mean"),
                bordes=("f_bordes_medio", "mean"),
                brillo=("f_brillo_medio", "mean"),
            ).round(3)
            resumen["fotogramas_por_puesto"] = ff.reset_index().to_dict(orient="records")
            print("\nFotogramas por puesto:")
            print(ff.to_string())

            # figura 9: caras y color
            fig, axes = plt.subplots(1, 3, figsize=(11, 3.4))
            for ax, col, titulo in zip(
                axes,
                ["t_colorfulness", "t_bordes", "f_caras_alguna"],
                ["Colorido medio de la miniatura", "Densidad de bordes", "% de videos con cara"],
            ):
                if col not in cruce:
                    ax.axis("off")
                    continue
                medios = cruce.groupby("place_best")[col].mean()
                ax.bar(["1.º", "2.º", "3.º"], medios.values, color=[PRIMARY, ACCENT, GRIS])
                ax.set_title(titulo, fontsize=9)
                for i, v in enumerate(medios.values):
                    ax.text(i, v, f"{v:.2f}" if v < 5 else f"{v:.1f}", ha="center", va="bottom", fontsize=7)
            fig.suptitle("Figura 9. Qué se ve en el video, por puesto", fontweight="bold")
            fig.tight_layout()
            fig.savefig(FIGS / "fig09_visual_puesto.png")
            plt.close(fig)

            # figura 10: por coleccion
            tot = d.merge(df, on="video_id", how="inner")
            fig, ax = plt.subplots(figsize=(6.6, 3.6))
            agrupado = tot.groupby("collection").agg(
                color=("t_colorfulness", "mean"), caras=("t_caras", "mean"))
            x = np.arange(len(agrupado))
            ax.bar(x - 0.18, agrupado["color"], width=0.36, color=PRIMARY, label="colorido")
            ax.bar(x + 0.18, agrupado["caras"], width=0.36, color=SECONDARY, label="caras por miniatura")
            ax.set_xticks(x, agrupado.index)
            ax.legend(frameon=False, fontsize=8)
            ax.set_title("Figura 10. Estilo visual por colección")
            fig.tight_layout()
            fig.savefig(FIGS / "fig10_visual_coleccion.png")
            plt.close(fig)

    (ANALISIS / "resumen_visual.json").write_text(
        json.dumps(resumen, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nescrito: {ANALISIS / 'resumen_visual.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
