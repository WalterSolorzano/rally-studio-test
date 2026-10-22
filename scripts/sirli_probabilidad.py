"""Probabilidad absoluta de ganar: qué se puede identificar y qué no.

Hallazgo estructural (2021-2026): el podio de SIRLI es **por sede y categoría**, no por
desafío. Cada sede entrega como máximo un 1.º, un 2.º y un 3.º por categoría, y esos tres
premios suelen recaer en equipos que trabajaron desafíos distintos. Cuando la sede tiene
menos equipos, entrega menos premios.

Eso censura el tamaño de la delegación:

    grupo con 1 premio -> tuvo exactamente 1 equipo
    grupo con 2 premios -> tuvo exactamente 2 equipos
    grupo con 3 premios -> tuvo 3 o más (cola no identificable)

Con esa censura se acota la probabilidad absoluta:

    P(1.º | participas en tu categoría) = 1 / T

donde T es el número de equipos de tu categoría en tu sede. La cola (T>=3) no se puede
estimar desde el registro: se presenta como banda con escenarios declarados.

Salidas:
    research/sirli/analisis/probabilidad.json
    research/sirli/analisis/figuras/fig16_probabilidad.png

Uso:
    python scripts/sirli_probabilidad.py
"""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SIRLI = ROOT / "research" / "sirli"
AN = SIRLI / "analisis"
FIG = AN / "figuras"

AZUL, ROJO, ACERO, GRIS = "#1d45b9", "#f81110", "#2aa7ad", "#9aa3b2"
ESCENARIOS = [3, 5, 8, 12, 20, 30]


def load() -> list[dict]:
    rows = []
    with open(SIRLI / "winners.jsonl", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def grupos(rows, claves):
    g = defaultdict(list)
    for r in rows:
        g[tuple(r[k] for k in claves)].append(r)
    return g


def censo(rows) -> dict:
    """Cuenta grupos por número de premios (1, 2, 3+)."""
    g = grupos(rows, ["year", "sede", "category"])
    c = Counter()
    for v in g.values():
        c[min(len(v), 3)] += 1
    return {"n1": c[1], "n2": c[2], "n3": c[3], "grupos": sum(c.values()),
            "premios": sum(len(v) for v in g.values())}


def wilson(k: int, n: int) -> tuple[float, float]:
    if n == 0:
        return (0.0, 0.0)
    z = 1.96
    ph = k / n
    d = 1 + z * z / n
    c = (ph + z * z / (2 * n)) / d
    m = z * np.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / d
    return (max(0.0, c - m), min(1.0, c + m))


def banda(c: dict) -> list[dict]:
    """P(1.º) para cada escenario de k equipos en los grupos con 3 premios.

    Cada grupo sede-categoría entrega exactamente un primer lugar, así que la
    probabilidad de ganarlo es grupos / equipos: uno de cada T.
    """
    out = []
    for k in ESCENARIOS:
        equipos = c["n1"] + 2 * c["n2"] + k * c["n3"]
        premios = c["n1"] + 2 * c["n2"] + 3 * c["n3"]
        out.append({"equipos_por_grupo_completo": k,
                    "equipos_estimados": equipos,
                    "p_primero": round(c["grupos"] / equipos, 4) if equipos else 0.0,
                    "p_podio": round(premios / equipos, 4) if equipos else 0.0})
    return out


def escenarios(c: dict) -> dict:
    """Las tres cifras que se usan en las tablas: techo documentado, sede media, sede grande."""
    out = {}
    for etiqueta, k in (("techo", 3), ("media", 8), ("grande", 15)):
        equipos = c["n1"] + 2 * c["n2"] + k * c["n3"]
        out[f"p_{etiqueta}"] = round(c["grupos"] / equipos, 4) if equipos else 0.0
        out[f"equipos_{etiqueta}"] = equipos
    out["p_chico"] = round(c["n1"] / c["grupos"], 4) if c["grupos"] else 0.0
    out["equipos_por_grupo"] = round(
        (c["n1"] + 2 * c["n2"] + 8 * c["n3"]) / c["grupos"], 2) if c["grupos"] else 0.0
    return out


def main() -> int:
    rows = load()
    sede = [r for r in rows if r["collection"] == "sede"]
    moderno = [r for r in sede if r["year"] >= 2021]

    # forma del podio
    pat = Counter()
    for v in grupos(moderno, ["year", "sede", "category"]).values():
        pl = Counter(x["place"] for x in v)
        pat[(pl[1], pl[2], pl[3])] += 1
    podio = [{"primero": k[0], "segundo": k[1], "tercero": k[2], "grupos": v}
             for k, v in pat.most_common()]

    # ¿los tres premios van a desafíos distintos?
    desafios = Counter()
    for v in grupos(moderno, ["year", "sede", "category"]).values():
        if len(v) == 3:
            desafios[len({x["challenge_name"] for x in v})] += 1
    desafios = {str(k): v for k, v in sorted(desafios.items())}

    # premios por sede y edición
    tam = Counter()
    for v in grupos(moderno, ["year", "sede"]).values():
        tam[min(len(v), 8)] += 1
    sede_tam = [{"premiados": k, "ediciones": v} for k, v in sorted(tam.items())]

    c_glob = censo(moderno)
    nic = [r for r in moderno if r["country"] == "NICARAGUA"]
    c_nic = censo(nic)

    # por estrato
    est = {}
    for campo in ("year", "country", "category"):
        out = []
        for valor in sorted({r[campo] for r in moderno}, key=str):
            sub = [r for r in moderno if r[campo] == valor]
            c = censo(sub)
            if c["grupos"] < 40:
                continue
            ic = wilson(c["n1"], c["grupos"])
            out.append({
                "valor": str(valor), "grupos": c["grupos"],
                "n1": c["n1"], "n2": c["n2"], "n3": c["n3"],
                "p_grupo_minimo": round(c["n1"] / c["grupos"], 4),
                "ic_p_grupo_minimo": [round(ic[0], 4), round(ic[1], 4)],
                "p_primero_k8": round(c["n3"] / (c["n1"] + 2 * c["n2"] + 8 * c["n3"]), 4),
            })
        est[campo] = out

    gana = sum(1 for r in moderno if r["place"] == 1)
    p_entre = gana / len(moderno)
    ic_entre = wilson(gana, len(moderno))

    # país: probabilidad general con los tres escenarios
    por_pais = []
    for pais in sorted({r["country"] for r in moderno}):
        sub = [r for r in moderno if r["country"] == pais]
        c = censo(sub)
        if c["grupos"] < 25:
            continue
        e = escenarios(c)
        por_pais.append({
            "pais": pais, "grupos": c["grupos"], "n1": c["n1"], "n2": c["n2"], "n3": c["n3"],
            "premios": c["premios"], **e,
        })
    por_pais.sort(key=lambda x: -x["grupos"])

    # sede: Nicaragua, una fila por sede
    sedes_nic = []
    nic_sede = [r for r in nic if r["collection"] == "sede"]
    for sed in sorted({r["sede"] for r in nic_sede}):
        sub = [r for r in nic_sede if r["sede"] == sed]
        c = censo(sub)
        if c["grupos"] < 2:
            continue
        e = escenarios(c)
        sedes_nic.append({
            "sede": sed, "grupos": c["grupos"], "premios": c["premios"],
            "ediciones": len({(r["year"]) for r in sub}),
            "anios": sorted({r["year"] for r in sub}),
            "n1": c["n1"], "n2": c["n2"], "n3": c["n3"], **e,
        })
    sedes_nic.sort(key=lambda x: (-x["grupos"], x["sede"]))

    res = {
        "muestra": {"premios_sede": len(sede), "premios_sede_2021": len(moderno),
                    "grupos_sede_categoria": c_glob["grupos"]},
        "podio": podio,
        "desafios_distintos_en_grupos_de_tres": desafios,
        "premiados_por_sede": sede_tam,
        "celdas": c_glob,
        "banda": banda(c_glob),
        "nicaragua": {"celdas": c_nic, "banda": banda(c_nic),
                      "escenarios": escenarios(c_nic)},
        "por_pais": por_pais,
        "sedes_nicaragua": sedes_nic,
        "estratos": est,
        "probabilidad": {
            "entre_premiados": round(p_entre, 4),
            "entre_premiados_ic": [round(ic_entre[0], 4), round(ic_entre[1], 4)],
            "piso_absoluto": round(c_glob["n3"] / (c_glob["n1"] + 2 * c_glob["n2"] + 3 * c_glob["n3"]), 4),
            "techo_absoluto_documentado": round(c_glob["n3"] / c_glob["grupos"], 4),
        },
    }

    AN.mkdir(parents=True, exist_ok=True)
    (AN / "probabilidad.json").write_text(json.dumps(res, indent=1, ensure_ascii=False),
                                          encoding="utf-8")
    for b in res["banda"]:
        print(f"k={b['equipos_por_grupo_completo']:>2} -> P(1.º) {b['p_primero']:.1%}"
              f" · P(podio) {b['p_podio']:.1%} · equipos {b['equipos_estimados']:,}")
    print("entre premiados:", f"{p_entre:.1%}")

    figura(res)
    return 0


def figura(res) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    FIG.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(7.4, 4.2), dpi=170)

    t = np.arange(2, 34, 0.1)
    ax.plot(t, 100 / t, color=AZUL, lw=2, label="P(1.º) = 1 / equipos en tu categoría")
    ax.plot(t, np.minimum(100 * 3 / t, 100), color=ACERO, lw=1.3, ls="--",
            label="P(podio) = 3 / equipos")

    ax.axvspan(3, 5, color=GRIS, alpha=0.16)
    ax.annotate("piso documentado\n(3 equipos por grupo)", xy=(4, 12), xytext=(6.2, 20),
                fontsize=7.5, color="#4b5563",
                arrowprops=dict(arrowstyle="-", color=GRIS, lw=0.8))

    nic = res["nicaragua"]["banda"]
    k8 = next((b for b in nic if b["equipos_por_grupo_completo"] == 8), None)
    if k8:
        ax.plot(8, 100 * k8["p_primero"], "o", color=ROJO, ms=6,
                label=f"Nicaragua, escenario 8 equipos ({k8['p_primero']:.0%})")

    ax.set_xlabel("Equipos de tu categoría en tu sede")
    ax.set_ylabel("Probabilidad (%)")
    ax.set_xlim(2, 33)
    ax.set_ylim(0, 60)
    ax.grid(alpha=0.25, lw=0.6)
    ax.legend(frameon=False, fontsize=8, loc="upper right")
    ax.set_title("Probabilidad absoluta: 1 de cada 3 como máximo, 1 de cada 20 en una sede grande",
                 fontsize=10, loc="left")
    fig.tight_layout()
    fig.savefig(FIG / "fig16_probabilidad.png", facecolor="white")
    plt.close(fig)
    print(f"figura: {FIG / 'fig16_probabilidad.png'}")


if __name__ == "__main__":
    raise SystemExit(main())
