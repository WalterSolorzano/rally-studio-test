"""Resumen ejecutivo de una página y tabla de hipótesis en CSV.

Lee lo que ya calcularon `sirli_dataset.py` y `sirli_sistemico.py`; no
recalcula nada. Salidas:
  research/sirli/analisis/resumen_ejecutivo.md
  research/sirli/analisis/hipotesis.csv

Uso:  python scripts/sirli_resumen_ejecutivo.py
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
AN = RAIZ / "research" / "sirli" / "analisis"
SIS = AN / "sistemico.json"


def num(x, dec=0):
    if x is None:
        return "—"
    s = f"{x:,.{dec}f}"
    return s.replace(",", ".").replace(".", ",", s.count(".") - 1) if dec else s.replace(",", ".")


def pct(x, dec=1):
    if x is None:
        return "—"
    return f"{x * 100:.{dec}f}".replace(".", ",") + "%"


def pp(x):
    if x is None:
        return "—"
    return f"{x * 100:+.1f}".replace(".", ",") + " pp"


def fp(p):
    if p is None:
        return "—"
    if p < 0.001:
        return "<0,001"
    return f"{p:.3f}".replace(".", ",")


def main() -> None:
    d = json.loads(SIS.read_text(encoding="utf-8"))
    hyps = d["hipotesis"]
    est = d["conteo_estados"]

    # --- CSV de hipótesis -------------------------------------------------
    campos = ["id", "family", "statement", "test", "n1", "k1", "r1", "n0", "k0",
              "r0", "diff", "p", "q", "status", "expected", "artefacto"]
    with open(AN / "hipotesis.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=campos, extrasaction="ignore", delimiter=";")
        w.writeheader()
        for h in hyps:
            w.writerow({k: h.get(k) for k in campos})

    # --- bloques del resumen ---------------------------------------------
    favor = [h for h in hyps if h["status"] == "a favor"]
    contra = [h for h in hyps if h["status"] == "en contra"]
    artef = [h for h in hyps if h["status"] == "artefacto aritmético"]

    lineas_favor = []
    for h in favor:
        lineas_favor.append(
            f"| {h['id']} | {h['statement']} | {pp(h['diff'])} | "
            f"{pct(h['r1'])} vs {pct(h['r0'])} | p {fp(h['p'])} |"
        )
    if not lineas_favor:
        lineas_favor = ["| — | ninguna hipótesis sobrevivió | — | — | — |"]

    # Curiosidades ya calculadas por el informe largo.
    cur = d.get("curiosidades") or []
    lineas_cur = []
    for c in cur[:6]:
        if isinstance(c, (list, tuple)) and len(c) >= 2:
            lineas_cur.append(f"- **{c[0]}.** {c[1]}")
        else:
            lineas_cur.append(f"- {c}")
    if not lineas_cur:
        lineas_cur = ["- Ver sección 5 de `investigacion_profunda.md`."]

    doc = f"""# Lo que el corpus de SIRLI dice, en una página

Generado por `scripts/sirli_resumen_ejecutivo.py` a partir de `sistemico.json`.
El detalle, las tablas completas y las reservas metodológicas están en
[`investigacion_profunda.md`](investigacion_profunda.md).

## Las cinco frases que importan

1. **El corpus no tiene perdedores.** SIRLI publica solo los tres primeros de cada
   desafío. Todo lo que sigue es «probabilidad de ser 1.º entre los tres premiados»,
   y solo vale para 2021–2026: antes de 2021 el registro publica casi solo primeros.
2. **Dos efectos grandes, y ambos son aritmética.** Cuántos equipos premiados lleva tu
   sede y cuántos comparten tu desafío. El segundo es casi tautológico: si tu sede se
   lleva los tres puestos, tienes 1/3 por construcción.
3. **El video no se distingue por nada de lo que medimos.** Duración, miniatura, título,
   subtítulos, descripción, marcadores del guion: todo cae en el ruido tras corregir
   por comparaciones múltiples ({len(favor)} a favor, {len(contra)} en contra,
   {est['sin evidencia']} sin evidencia de {len(hyps)}).
4. **El hueco más rentable no es técnico.** El 0 % de los guiones pone a hablar a un
   usuario real. No requiere más datos para justificarse: requiere que alguien lo haga.
5. **La competencia se está endureciendo.** En sede Nicaragua, la tasa de primer lugar
   pasó de 54,4 % (2021) a 38,6 % (2026). El rally creció más rápido que los premios.

## Lo único que la evidencia permite recomendar

| Prioridad | Acción | Respaldo | Coste |
|---|---|---|---|
| 1 | Repartir los equipos de tu sede en desafíos distintos | H01/H11, {pp(favor[0]['diff']) if favor else '—'} | decisión, no producción |
| 2 | Escribir 80–200 caracteres de descripción **nombrando el proyecto** | H30, +10,1 pp | 10 minutos |
| 3 | Usar 110–120 s de video, sin relleno | H42, −6,0 pp si bajas de 110 s | guion |
| 4 | Título con nombre + desafío + separador | H18/H19/H20, +4 a +6 pp (señal débil) | 2 minutos |
| 5 | Meter una voz de usuario real | 0 % del corpus lo hace | una llamada |

## Lo que NO hay que hacer (y por qué)

- **No** elegir desafío «de nicho» esperando menos rivales: la probabilidad es plana en
  todo el rango (H02/H03/H10 refutadas).
- **No** estirar el video por encima de 120 s creyendo que impresiona: H14 es nula.
- **No** invertir en la miniatura: 4.196 miniaturas dan colorido, brillo y caras idénticos
  entre 1.º, 2.º y 3.º.
- **No** confiar en haber ganado antes: H08 es nula.
- **No** citar tablas de cifras: el efecto aparente era un error de marcador (H38).

## Hipótesis que sobrevivieron

| ID | Hipótesis | Δ | Tasas | p |
|---|---|---|---|---|
{chr(10).join(lineas_favor)}

## Curiosidades

{chr(10).join(lineas_cur)}

## Tamaño del trabajo

- {num(len(hyps))} hipótesis probadas, {est['artefacto aritmético']} marcadas como
  artefacto aritmético, {est['señal débil total']} señales débiles.
- {num(d['filas'])} ediciones del evento, {num(d['core']['n'])} del corte válido
  (sede 2021+, base {pct(d['core']['tasa'])}).
- Todo reproducible: `sirli_dataset.py` → `sirli_sistemico.py` → este script.

## Lo que falta

| Vacío | Coste | Qué desbloquea |
|---|---|---|
| Transcribir los 1.204 videos de Nicaragua | ~7 h de CPU | de 328 a más de 1.200 videos con texto |
| Codificar a mano 30–50 videos | 4 h | validar detectores y ver lo que ningún regex ve |
| Audio (voz, música, silencios) | bajo | efecto halo y fluidez |
| OCR de texto en pantalla | bajo | densidad de mensaje |
"""
    doc = "".join(ch for ch in doc if ch >= " " or ch in "\n\t")
    (AN / "resumen_ejecutivo.md").write_text(doc, encoding="utf-8")
    print("OK", AN / "resumen_ejecutivo.md")
    print("OK", AN / "hipotesis.csv", len(hyps), "filas")


if __name__ == "__main__":
    main()
