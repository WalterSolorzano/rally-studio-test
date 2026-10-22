"""Linea base del modelo: predecir primer lugar con variables de evento y de video.

Sin texto (muestra de texto aun pequena) y sin variables posteriores al premio
(vistas, likes). Validacion agrupada por edicion (anio + sede) para no mezclar
equipos del mismo certamen entre entrenamiento y prueba.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
ANALISIS = ROOT / "research" / "sirli" / "analisis"

CAT = ["collection", "category", "challenge_theme"]
NUM = [
    "sede_size", "challenge_size", "team_prior_awards", "country_prior_rate",
    "duration_s", "duration_ratio", "over_limit",
    "title_len", "title_words", "desc_len", "desc_lines",
    "desc_util", "desc_has_url", "desc_credits", "desc_specificity",
]


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    m = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, c - m), min(1.0, c + m))


def dentro_de_grupo(df: pd.DataFrame, prob: np.ndarray, group_cols: list[str]) -> pd.DataFrame:
    """Acierto top-1 al elegir, dentro de cada desafio, el equipo con mayor probabilidad."""
    tmp = df[group_cols].copy()
    tmp["y"] = df["won"].values
    # el desempate con jitter evita favorecer al orden del archivo
    rng = np.random.default_rng(11)
    tmp["p"] = prob + rng.normal(0, 1e-9, len(prob))
    aciertos, total, base = 0, 0, 0
    for _, g in tmp.groupby(group_cols):
        if g["y"].nunique() < 2 or len(g) < 2:
            continue
        total += 1
        aciertos += int(g.loc[g["p"].idxmax(), "y"] == 1)
        base += 1 / len(g)  # acierto esperado eligiendo al azar
    return pd.DataFrame([{"grupos": total, "top1_modelo": aciertos,
                          "top1_azar": round(base, 1),
                          "tasa_modelo": round(aciertos / total, 3) if total else None,
                          "tasa_azar": round(base / total, 3) if total else None}])


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    df = pd.read_csv(ANALISIS / "dataset_videos.csv")
    df["won"] = pd.to_numeric(df["won"], errors="coerce")
    d = df.dropna(subset=["won"]).copy()
    # 2017-2020 solo publica primeros lugares: incluirlos inventaria una senal falsa
    d = d[(d["place_best"].isin([1, 2, 3])) & (d["collection"] == "sede") & (d["year"] >= 2021)].copy()
    d["won"] = d["won"].astype(int)
    d["grupo"] = d["year"].astype(str) + "|" + d["sede"].fillna("?")

    X = d[CAT + NUM]
    y = d["won"].values
    grupos = d["grupo"].values
    print(f"filas para modelar: {len(d)} · tasa base de primer lugar: {y.mean():.3f}")

    preproceso = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore", min_frequency=20), CAT),
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")),
                          ("esc", StandardScaler())]), NUM),
    ])

    modelos = {
        "base_frecuencia": None,  # linea base: siempre predecir la tasa base
        "logistica": Pipeline([("prep", preproceso),
                               ("clf", LogisticRegression(max_iter=2000, C=0.5))]),
        "hist_gb": Pipeline([("prep", preproceso),
                             ("clf", HistGradientBoostingClassifier(
                                 max_depth=6, learning_rate=0.06, max_iter=400,
                                 min_samples_leaf=40, l2_regularization=1.0,
                                 random_state=7))]),
    }

    cv = GroupKFold(n_splits=5)
    salida = {"filas": int(len(d)), "tasa_base": round(float(y.mean()), 4), "modelos": {}}

    for nombre, modelo in modelos.items():
        oof = np.full(len(d), y.mean())
        if modelo is not None:
            for tr, te in cv.split(X, y, groups=grupos):
                modelo.fit(X.iloc[tr], y[tr])
                oof[te] = modelo.predict_proba(X.iloc[te])[:, 1]
        metrica = {
            "roc_auc": round(float(roc_auc_score(y, oof)), 4),
            "pr_auc": round(float(average_precision_score(y, oof)), 4),
            "brier": round(float(brier_score_loss(y, oof)), 4),
        }
        dg = dentro_de_grupo(d, oof, ["year", "sede", "challenge_name"])
        metrica.update(dg.iloc[0].to_dict())
        salida["modelos"][nombre] = metrica
        print(f"\n{nombre}: ROC-AUC {metrica['roc_auc']} · PR-AUC {metrica['pr_auc']} "
              f"· Brier {metrica['brier']}")
        if metrica["grupos"]:
            print(f"  top-1 dentro del desafio: {metrica['tasa_modelo']:.1%} "
                  f"(azar {metrica['tasa_azar']:.1%}, {int(metrica['grupos'])} grupos)")

    # variables mas influyentes en la logistica
    log = modelos["logistica"]
    log.fit(X, y)
    nombres = log.named_steps["prep"].get_feature_names_out()
    coefs = log.named_steps["clf"].coef_[0]
    orden = np.argsort(np.abs(coefs))[::-1][:15]
    salida["coeficientes"] = [
        {"variable": str(nombres[i]).replace("num__", "").replace("cat__", ""),
         "coeficiente": round(float(coefs[i]), 3)} for i in orden
    ]
    print("\nvariables con mas peso (logistica):")
    for c in salida["coeficientes"][:10]:
        print(f"  {c['variable']}: {c['coeficiente']:+.3f}")

    destino = ANALISIS / "modelo_baseline.json"
    destino.write_text(json.dumps(salida, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nescrito: {destino}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
