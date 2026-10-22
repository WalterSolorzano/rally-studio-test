"""Genera las figuras del informe de investigacion.

Salida: docs/figures/*.svg (vectorial, para el PDF) y PNG de control en
%TEMP%/opencode/rally_fig_preview. Paleta: brand/palette.json.
No toca el motor ni datos: solo lee cifras ya verificadas en el informe.
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import FancyBboxPatch, Rectangle  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "figures"
PREVIEW = Path.home() / "AppData" / "Local" / "Temp" / "opencode" / "rally_fig_preview"

palette = json.loads((ROOT / "brand" / "palette.json").read_text(encoding="utf-8"))
PRIMARY = palette["primary"]
SECONDARY = palette["secondary"]
ACCENT = palette["accent"]
INK = palette["text"]
MUTED = "#6b7280"
GRID = "#e3e6ef"
TINT = "#c7d1ee"

plt.rcParams.update(
    {
        "font.family": "Segoe UI",
        "font.size": 8.5,
        "text.color": INK,
        "axes.edgecolor": GRID,
        "axes.labelcolor": MUTED,
        "xtick.color": MUTED,
        "ytick.color": MUTED,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "svg.fonttype": "path",
        "figure.facecolor": "white",
        "axes.facecolor": "white",
    }
)


def save(fig: plt.Figure, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT / f"{name}.svg", format="svg", bbox_inches="tight", pad_inches=0.04)
    fig.savefig(PREVIEW / f"{name}.png", format="png", dpi=170, bbox_inches="tight", pad_inches=0.04)
    plt.close(fig)


def clean(ax: plt.Axes, left: bool = False) -> None:
    ax.spines["left"].set_visible(left)
    ax.spines["bottom"].set_color(GRID)
    ax.tick_params(length=0)


# ---------------------------------------------------------------- figura 1
def fig01_escala_nacional() -> None:
    series = [
        ("Estudiantes", ["2023", "2025", "2026"], [2346, 3650, 5200], ["2.346", "3.650", "+5.200"]),
        ("Equipos", ["2023", "2025", "2026"], [280, 661, 751], ["280", "661", "751"]),
        ("Sedes", ["2023", "2025", "2026"], [57, 91, 113], ["57", "91", "113"]),
    ]
    fig, axes = plt.subplots(1, 3, figsize=(7.0, 2.35), gridspec_kw={"wspace": 0.42})
    for ax, (title, labels, values, shown) in zip(axes, series):
        colors = [PRIMARY, PRIMARY, ACCENT]
        bars = ax.bar(labels, values, width=0.56, color=colors, zorder=3)
        for bar, text in zip(bars, shown):
            ax.annotate(
                text,
                (bar.get_x() + bar.get_width() / 2, bar.get_height()),
                textcoords="offset points",
                xytext=(0, 5),
                ha="center",
                va="bottom",
                fontsize=9,
                fontweight="semibold",
                color=INK,
            )
        ax.set_title(title, loc="left", fontsize=8.5, color=MUTED, pad=8, fontweight="normal")
        ax.set_ylim(0, max(values) * 1.28)
        ax.set_yticks([])
        ax.tick_params(axis="x", labelsize=8.5)
        ax.grid(axis="y", color=GRID, linewidth=0.7, zorder=0)
        ax.set_axisbelow(True)
        clean(ax)
    fig.subplots_adjust(left=0.02, right=0.99, top=0.9, bottom=0.12)
    save(fig, "fig01_escala_nacional")


# ---------------------------------------------------------------- figura 2
def fig02_podios_latam() -> None:
    years = [str(y) for y in range(2016, 2027)]
    medals = {
        ("2016", "Innovación"): ("3.º", "Econova", "UNAN-FAREM Estelí"),
        ("2016", "Impacto Social"): ("1.º", "Geckakz", "UNAN-FAREM Estelí"),
        ("2019", "Impacto Social"): ("3.º", "Lexonic", "UNI-RUPAP"),
        ("2021", "Innovación"): ("1.º", "MT Soluciones Creativas", "UNI-RUPAP"),
        ("2023", "Innovación"): ("1.º", "Güegüense Pinolero", "UNMRMA"),
        ("2023", "Impacto Social"): ("2.º", "Nicarq Sinergy", "UNI-RUSB"),
        ("2024", "Innovación"): ("1.º", "Techriders", "UNI-RUSB"),
        ("2025", "Innovación"): ("1.º", "STEM Synergy", "UAM"),
        ("2025", "Impacto Social"): ("1.º", "Mentes Volcánicas", "UNI-RUPAP"),
    }
    cats = [
        ("Innovación", PRIMARY, 0.38),
        ("Impacto Social", ACCENT, 0.72),
    ]
    col_w = 0.31
    chip_h = 0.62
    row_h = 1.0

    fig, ax = plt.subplots(figsize=(7.0, 3.35))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, len(years) * row_h + 1.15)
    ax.axis("off")

    # cabeceras de categoria
    for name, color, x in cats:
        ax.plot([x - col_w / 2 + 0.02], [len(years) * row_h + 0.46], marker="s", markersize=5.5, color=color, linestyle="none")
        ax.text(x - col_w / 2 + 0.07, len(years) * row_h + 0.455, name, fontsize=7.8, color=INK, va="center", fontweight="semibold")

    for i, year in enumerate(years):
        y = (len(years) - i - 0.5) * row_h
        has = any(key[0] == year for key in medals)
        ax.text(0.03, y, year, fontsize=8, va="center", color=INK if has else "#b3b8c4", fontweight="semibold" if has else "normal")
        ax.plot([0.115, 0.985], [y - row_h / 2, y - row_h / 2], color=GRID, linewidth=0.7, zorder=0)

        for name, color, x in cats:
            medal = medals.get((year, name))
            if not medal:
                continue
            rank, team, uni = medal
            ax.add_patch(
                Rectangle(
                    (x - col_w / 2, y - chip_h / 2),
                    col_w,
                    chip_h,
                    facecolor=color,
                    edgecolor="none",
                )
            )
            ax.text(x, y, f"{rank}  {team}", fontsize=7.4, color="white", va="center", ha="center", fontweight="semibold")

    y2026 = 0.5
    ax.text(0.38, y2026, "fase nacional en curso", fontsize=6.6, color=MUTED, va="center", ha="center", style="italic")

    fig.subplots_adjust(left=0.015, right=0.99, top=0.96, bottom=0.03)
    save(fig, "fig02_podios_latam")


# ---------------------------------------------------------------- figura 3
def fig03_rubricas() -> None:
    crit = ["Innovación", "Impacto", "Prefactibilidad", "Viabilidad técnica", "Presentación / documento"]
    latam = [30, 20, 20, 20, 10]
    nacional = [25, 25, 15, 20, 15]
    y = range(len(crit))
    h = 0.34
    fig, ax = plt.subplots(figsize=(7.0, 2.6))
    ax.barh([i + h / 2 for i in y], latam, height=h, color=PRIMARY, zorder=3, label="Latinoamericano · oficial [A]")
    ax.barh([i - h / 2 for i in y], nacional, height=h, color=TINT, zorder=3, label="Nacional · reconstrucción [B/C]")
    for i, (a, b) in enumerate(zip(latam, nacional)):
        ax.text(a + 0.6, i + h / 2, f"{a}", va="center", fontsize=8, color=PRIMARY, fontweight="semibold")
        ax.text(b + 0.6, i - h / 2, f"{b}", va="center", fontsize=8, color=MUTED)
    ax.set_yticks(list(y))
    ax.set_yticklabels(crit, fontsize=8)
    ax.invert_yaxis()
    ax.set_xlim(0, 36)
    ax.set_xticks([0, 10, 20, 30])
    ax.grid(axis="x", color=GRID, linewidth=0.8, zorder=0)
    ax.set_axisbelow(True)
    clean(ax)
    ax.legend(loc="lower right", bbox_to_anchor=(1.0, 1.0), ncol=2, frameon=False, fontsize=7.4, handlelength=1.1, columnspacing=1.2)
    fig.subplots_adjust(left=0.235, right=0.99, top=0.83, bottom=0.14)
    save(fig, "fig03_rubricas")


# ---------------------------------------------------------------- figura 4
def fig04_pautado() -> None:
    sections = ["Problemática", "Solución", "Impacto", "Innovación", "Prefactibilidad"]
    limits = [1250, 1250, 1000, 1000, 1500]
    fig, ax = plt.subplots(figsize=(7.0, 2.3))
    colors = [PRIMARY, PRIMARY, PRIMARY, PRIMARY, ACCENT]
    bars = ax.barh(sections, limits, height=0.52, color=colors, zorder=3)
    for bar, value in zip(bars, limits):
        ax.text(bar.get_width() + 25, bar.get_y() + bar.get_height() / 2, f"{value:,}".replace(",", "."), va="center", fontsize=8.5, fontweight="semibold", color=INK)
    ax.invert_yaxis()
    ax.set_xlim(0, 1780)
    ax.set_ylim(4.85, -0.55)
    ax.set_xticks([])
    clean(ax)
    ax.tick_params(axis="y", labelsize=8.5)
    ax.text(1780, 4.66, "6.000 caracteres en total", ha="right", va="center", fontsize=8.4, fontweight="semibold", color=PRIMARY)
    fig.subplots_adjust(left=0.235, right=0.99, top=0.97, bottom=0.03)
    save(fig, "fig04_pautado")


# ---------------------------------------------------------------- figura 5
def fig05_pasv() -> None:
    acts = [
        ("I · Dolor", 0, 20, "45 palabras", SECONDARY),
        ("II · Caja negra", 20, 40, "90 palabras", PRIMARY),
        ("III · Prefactibilidad", 60, 35, "75 palabras", ACCENT),
        ("IV · Cierre", 95, 25, "55 palabras", INK),
    ]
    fig, ax = plt.subplots(figsize=(7.0, 1.95))
    for name, start, width, words, color in acts:
        ax.add_patch(Rectangle((start, 0), width, 1.0, facecolor=color, edgecolor="white", linewidth=2, zorder=3))
        ax.text(start + width / 2, 0.62, name, ha="center", va="center", color="white", fontsize=8.4, fontweight="semibold")
        ax.text(start + width / 2, 0.3, f"{start}–{start + width} s", ha="center", va="center", color="white", fontsize=7.4)
        ax.text(start + width / 2, -0.18, words, ha="center", va="top", fontsize=7.2, color=MUTED)
    ax.set_xlim(0, 120)
    ax.set_ylim(-0.55, 1.05)
    ax.set_yticks([])
    ax.set_xticks([0, 20, 40, 60, 80, 100, 120])
    ax.set_xticklabels(["0", "20", "40", "60", "80", "100", "120 s"])
    ax.tick_params(axis="x", labelsize=7.5, pad=6)
    for side in ("left", "right", "top"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_visible(False)
    ax.grid(axis="x", color=GRID, linewidth=0.7, zorder=0)
    ax.text(120, 1.22, "240–270 palabras · 135 palabras/min", ha="right", va="bottom", fontsize=7.4, color=MUTED)
    fig.subplots_adjust(left=0.02, right=0.99, top=0.92, bottom=0.16)
    save(fig, "fig05_pasv")


# ---------------------------------------------------------------- figura 6
def fig06_presupuesto() -> None:
    items = [
        ("Unidad ESP32-S3 + LoRa SX1262", 192.00),
        ("Arreglo de sensores multivariables", 727.50),
        ("Alimentación fotovoltaica autónoma", 1150.00),
        ("Carcasas IP67 con disipación pasiva", 510.00),
        ("Gateway LoRaWAN de 8 canales", 580.00),
        ("Servidor cloud demo y telemetría", 240.00),
        ("Herramental y cableado marino", 380.00),
        ("Flete, aranceles y seguro (18 %)", 670.50),
    ]
    labels = [i[0] for i in items][::-1]
    values = [i[1] for i in items][::-1]
    fig, ax = plt.subplots(figsize=(7.0, 2.85))
    bars = ax.barh(labels, values, height=0.58, color=PRIMARY, zorder=3)
    for bar, value in zip(bars, values):
        ax.text(bar.get_width() + 18, bar.get_y() + bar.get_height() / 2, f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."), va="center", fontsize=7.8, color=INK)
    ax.set_xlim(0, 1560)
    ax.set_xticks([0, 500, 1000])
    ax.grid(axis="x", color=GRID, linewidth=0.7, zorder=0)
    ax.set_axisbelow(True)
    ax.tick_params(axis="y", labelsize=7.4)
    clean(ax)
    fig.subplots_adjust(left=0.315, right=0.87, top=0.9, bottom=0.13)
    fig.text(0.895, 0.78, "4.450", fontsize=19, fontweight="bold", color=PRIMARY, ha="left")
    fig.text(0.895, 0.74, "USD totales", fontsize=7.5, color=MUTED, ha="left")
    fig.text(0.895, 0.5, "Rango del\ncertamen", fontsize=7.2, color=MUTED, ha="left", va="top", linespacing=1.25)
    fig.text(0.895, 0.36, "4.000 – 6.000", fontsize=8.2, color=INK, ha="left", fontweight="semibold")
    fig.text(0.895, 0.2, "Documentación\nde proveedor\nsin confirmar", fontsize=6.8, color=SECONDARY, ha="left", va="top", linespacing=1.3)
    save(fig, "fig06_presupuesto")


# ---------------------------------------------------------------- figura 7
def fig07_grafo() -> None:
    fig = plt.figure(figsize=(7.0, 1.75))
    gs = fig.add_gridspec(1, 2, width_ratios=[1.25, 1.0], wspace=0.16)
    stats = fig.add_subplot(gs[0, 0])
    stats.axis("off")
    data = [("420", "nodos"), ("732", "aristas"), ("29", "comunidades")]
    for i, (value, label) in enumerate(data):
        x = 0.02 + i * 0.33
        stats.text(x, 0.62, value, fontsize=22, fontweight="bold", color=PRIMARY, transform=stats.transAxes, va="center")
        stats.text(x, 0.3, label, fontsize=7.6, color=MUTED, transform=stats.transAxes, va="center")

    bar = fig.add_subplot(gs[0, 1])
    bar.set_xlim(0, 100)
    bar.set_ylim(0, 1)
    bar.add_patch(Rectangle((0, 0.38), 81, 0.34, facecolor=PRIMARY, edgecolor="white", linewidth=2))
    bar.add_patch(Rectangle((81, 0.38), 19, 0.34, facecolor=ACCENT, edgecolor="white", linewidth=2))
    bar.text(40.5, 0.55, "81 % extraídas", ha="center", va="center", color="white", fontsize=8, fontweight="semibold")
    bar.text(90.5, 0.55, "19 %", ha="center", va="center", color="white", fontsize=8, fontweight="semibold")
    bar.text(0, 0.84, "Composición de las aristas", fontsize=7.6, color=MUTED, ha="left")
    bar.text(0, 0.12, "142 aristas inferidas por IA · confianza media 0,81", fontsize=7.4, color=INK, ha="left")
    bar.axis("off")
    fig.subplots_adjust(left=0.01, right=0.99, top=0.95, bottom=0.05)
    save(fig, "fig07_grafo")


# ---------------------------------------------------------------- figura 8
def fig08_erratas() -> None:
    groups = [("Alta", 8, SECONDARY), ("Media", 5, PRIMARY), ("Baja", 1, MUTED)]
    fig, ax = plt.subplots(figsize=(7.0, 1.35))
    cols, rows = 7, 2
    size, gap = 0.72, 0.16
    index = 0
    group_start = {}
    for name, count, color in groups:
        group_start[name] = index
        for _ in range(count):
            col = index % cols
            row = index // cols
            ax.add_patch(
                FancyBboxPatch(
                    (col * (size + gap), -row * (size + gap)),
                    size,
                    size,
                    boxstyle="round,pad=0,rounding_size=0.09",
                    facecolor=color,
                    edgecolor="none",
                )
            )
            index += 1
    ax.set_xlim(-0.05, cols * (size + gap) + 2.9)
    ax.set_ylim(-(rows - 1) * (size + gap) - 0.08, size + 0.12)
    ax.axis("off")
    legend_x = cols * (size + gap) + 0.25
    ax.text(legend_x, 0.72, "14 erratas", fontsize=10, fontweight="bold", color=INK, va="center")
    for i, (name, count, color) in enumerate(groups):
        y = 0.42 - i * 0.24
        ax.add_patch(Rectangle((legend_x, y - 0.045), 0.14, 0.14, facecolor=color, edgecolor="none"))
        ax.text(legend_x + 0.24, y + 0.02, f"{count} {name.lower()}", fontsize=7.4, color=MUTED, va="center")
    fig.subplots_adjust(left=0.01, right=0.99, top=0.98, bottom=0.02)
    save(fig, "fig08_erratas")


# ---------------------------------------------------------------- figura 9
def fig10_complejidad_tecnica() -> None:
    years = ["2023", "2024", "2025", "2026"]
    pct = [17, 0, 67, 78]
    counts = ["1 de 6", "0 de 6", "4 de 6", "7 de 9"]
    fig, ax = plt.subplots(figsize=(6.4, 2.3))
    bars = ax.bar(years, pct, width=0.52, color=[TINT, TINT, PRIMARY, PRIMARY])
    for bar, value, label in zip(bars, pct, counts):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            value + 4,
            f"{value} %",
            ha="center",
            va="bottom",
            fontsize=9,
            fontweight="bold",
            color=INK,
        )
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            value / 2,
            label,
            ha="center",
            va="center",
            fontsize=7.2,
            color="white" if value > 20 else MUTED,
        )
    ax.set_ylim(0, 100)
    ax.set_yticks([0, 25, 50, 75, 100])
    ax.set_yticklabels(["0", "25", "50", "75", "100 %"])
    ax.grid(axis="y", color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    clean(ax)
    ax.set_xlabel("Edición del Rally Nacional", labelpad=8)
    save(fig, "fig10_complejidad_tecnica")


# ---------------------------------------------------------------- figura 10
def fig11_naming_dual() -> None:
    years = ["2023", "2024", "2025", "2026"]
    pct = [0, 0, 100, 100]
    fig, ax = plt.subplots(figsize=(6.0, 2.0))
    ax.plot(years, pct, color=PRIMARY, linewidth=2.4, marker="o", markersize=6, zorder=3)
    ax.fill_between(years, pct, color=PRIMARY, alpha=0.10)
    for x, y in zip(years, pct):
        ax.annotate(
            f"{y} %",
            (x, y),
            textcoords="offset points",
            xytext=(0, 10 if y < 50 else -16),
            ha="center",
            fontsize=8.6,
            fontweight="bold",
            color=PRIMARY,
        )
    ax.set_ylim(-8, 112)
    ax.set_yticks([0, 50, 100])
    ax.set_yticklabels(["0", "50", "100 %"])
    ax.grid(axis="y", color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    clean(ax)
    ax.set_xlabel("Naming dual (squad + marca) en el podio nacional", labelpad=8)
    save(fig, "fig11_naming_dual")


# ---------------------------------------------------------------- figura 11
def fig12_clusters() -> None:
    data = [
        ("Café de especialidad", 3, True),
        ("Inclusión y discapacidad", 3, True),
        ("Soberanía alimentaria", 3, False),
        ("Botaderos → parques", 2, True),
        ("Energía + educación", 2, False),
        ("Vivienda", 2, False),
        ("Agua", 1, False),
    ]
    labels = [d[0] for d in data]
    values = [d[1] for d in data]
    colors = [ACCENT if d[2] else PRIMARY for d in data]
    fig, ax = plt.subplots(figsize=(6.4, 2.4))
    bars = ax.barh(labels[::-1], values[::-1], color=colors[::-1], height=0.58)
    for bar, value in zip(bars, values[::-1]):
        ax.text(
            value + 0.08,
            bar.get_y() + bar.get_height() / 2,
            str(value),
            va="center",
            fontsize=9,
            fontweight="bold",
            color=INK,
        )
    ax.set_xlim(0, 3.8)
    ax.set_xticks([0, 1, 2, 3])
    ax.grid(axis="x", color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    clean(ax)
    ax.set_xlabel("Equipos del podio nacional por cluster (2023–2026)", labelpad=8)
    save(fig, "fig12_clusters")


# ---------------------------------------------------------------- figura 12
def fig13_podios_universidad() -> None:
    data = [
        ("UNI (RUPAP 3 + RUSB 2)", 5),
        ("UNAN-FAREM Estelí", 2),
        ("UM-RMA", 1),
        ("UAM", 1),
        ("Sede no publicada", 1),
    ]
    labels = [d[0] for d in data]
    values = [d[1] for d in data]
    fig, ax = plt.subplots(figsize=(6.4, 2.2))
    bars = ax.barh(labels[::-1], values[::-1], color=[TINT, TINT, MUTED, PRIMARY, PRIMARY], height=0.56)
    for bar, value in zip(bars, values[::-1]):
        ax.text(
            value + 0.08,
            bar.get_y() + bar.get_height() / 2,
            str(value),
            va="center",
            fontsize=9,
            fontweight="bold",
            color=INK,
        )
    ax.set_xlim(0, 6)
    ax.set_xticks([0, 1, 2, 3, 4, 5])
    ax.grid(axis="x", color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    clean(ax)
    ax.set_xlabel("Podios internacionales de Nicaragua (2015–2025)", labelpad=8)
    save(fig, "fig13_podios_universidad")


# ---------------------------------------------------------------- figura 13
def fig14_forest() -> None:
    rows = [
        ("Naming dual", 100.0, 68.3, 100.0, "< 0,0001"),
        ("Tecnología emergente", 65.0, 28.0, 82.2, "0,0014"),
        ("Métricas explícitas", 40.0, 8.5, 64.3, "0,020"),
        ("Territorio específico", 5.0, -29.3, 37.2, "1,00"),
    ]
    fig, ax = plt.subplots(figsize=(6.4, 2.5))
    ys = list(range(len(rows)))[::-1]
    for y, (name, rd, lo, hi, p) in zip(ys, rows):
        color = PRIMARY if lo > 0 else MUTED
        ax.plot([lo, hi], [y, y], color=color, linewidth=2.6, solid_capstyle="round", zorder=2)
        ax.scatter(rd, y, s=46, color=color, zorder=3)
        ax.text(hi + 2.5, y, f"{rd:+.0f} pp  (p {p})", va="center", fontsize=7.6, color=INK)
    ax.axvline(0, color=SECONDARY, linewidth=1.1, linestyle=(0, (4, 3)))
    ax.set_yticks(ys)
    ax.set_yticklabels([r[0] for r in rows], fontsize=8.2)
    ax.set_xlim(-40, 170)
    ax.set_xticks([-25, 0, 25, 50, 75, 100])
    ax.set_xticklabels(["−25", "0", "+25", "+50", "+75", "+100 pp"])
    ax.grid(axis="x", color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    clean(ax, left=True)
    ax.tick_params(axis="y", length=0)
    ax.set_xlabel("Cambio 2025–26 frente a 2023–24 (diferencia de proporciones, IC 95 %)", labelpad=8)
    save(fig, "fig14_forest")


# ---------------------------------------------------------------- figura 14
def fig15_ipc() -> None:
    data = {
        "2023": [0, 0, 0, 15, 15, 15],
        "2024": [0, 0, 0, 0, 15, 15],
        "2025": [25, 60, 60, 65, 85, 100],
        "2026": [40, 40, 60, 60, 75, 75, 85, 85, 100],
    }
    fig, ax = plt.subplots(figsize=(6.4, 2.3))
    offsets = {"2023": [-0.09, -0.03, 0.05, -0.08, 0.02, 0.1], "2024": [-0.1, -0.04, 0.03, 0.09, -0.02, 0.06]}
    for i, (year, values) in enumerate(data.items()):
        xs = [i + o for o in offsets.get(year, [-0.1, -0.06, -0.02, 0.02, 0.06, 0.1] * 2)[: len(values)]]
        ax.scatter(xs, values, s=38, color=PRIMARY, alpha=0.55, edgecolor="white", linewidth=0.6, zorder=2)
        mean = sum(values) / len(values)
        ax.plot([i - 0.18, i + 0.18], [mean, mean], color=SECONDARY, linewidth=2.0, zorder=3)
        ax.text(i + 0.21, mean + 4, f"{mean:.1f}", va="bottom", fontsize=8.0, color=SECONDARY, fontweight="bold")
    ax.set_xticks(range(len(data)))
    ax.set_xticklabels(list(data.keys()))
    ax.set_ylim(-5, 108)
    ax.set_yticks([0, 25, 50, 75, 100])
    ax.set_yticklabels(["0", "25", "50", "75", "100"])
    ax.grid(axis="y", color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    clean(ax)
    ax.set_xlabel("Índice de preparación competitiva por equipo del podio", labelpad=8)
    save(fig, "fig15_ipc")


if __name__ == "__main__":
    fig01_escala_nacional()
    fig02_podios_latam()
    fig03_rubricas()
    fig04_pautado()
    fig05_pasv()
    fig06_presupuesto()
    fig07_grafo()
    fig08_erratas()
    fig10_complejidad_tecnica()
    fig11_naming_dual()
    fig12_clusters()
    fig13_podios_universidad()
    fig14_forest()
    fig15_ipc()
    print("figuras generadas en", OUT)
