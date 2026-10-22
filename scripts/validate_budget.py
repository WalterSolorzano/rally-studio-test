#!/usr/bin/env python3
"""
validate_budget.py -- Valida rigurosamente budget/budget.json contra las reglas de rally:
1. URLs reales y obligatorias en cada renglon.
2. Fechas de cotizacion presentes.
3. Rango global admisible ($3,000 - $7,000 USD; ideal $4,000 - $6,000 USD).
4. Presencia de flete/arancel de importacion.
"""
import json
import pathlib
import sys
import io

from moneda import contexto, costo_unitario, costo_unitario_usd, formato

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BUDGET_JSON = pathlib.Path("budget/budget.json")
BRIEF_JSON = pathlib.Path("brief.json")

def main():
    if not BUDGET_JSON.exists():
        print("ERROR: budget/budget.json no existe.")
        sys.exit(1)

    try:
        items = json.loads(BUDGET_JSON.read_text(encoding="utf-8-sig"))
    except Exception as e:
        print(f"ERROR: JSON corrupto en {BUDGET_JSON}: {e}")
        sys.exit(1)

    errors = []
    warnings = []
    total = 0.0
    total_usd = 0.0
    has_shipping = False

    brief = json.loads(BRIEF_JSON.read_text(encoding="utf-8-sig")) if BRIEF_JSON.exists() else {}
    ctx = contexto(brief)
    if ctx["advertencia"]:
        warnings.append(ctx["advertencia"])

    print("\n" + "â•" * 60)
    print("  AUDITORIA DE PRESUPUESTO (ALIBABA / FUENTES SUSTENTADAS)")
    print(f"  Moneda de presentacion: {ctx['etiqueta']}")
    print("â•" * 60)

    for i, it in enumerate(items, 1):
        name = it.get("element", f"Item {i}")
        units = float(it.get("units", 0))
        unit_cost = costo_unitario(it, ctx)
        unit_cost_usd = costo_unitario_usd(it, ctx)
        if unit_cost is None or unit_cost_usd is None:
            errors.append(
                f"Fila {i} ({name}): costo ausente o no convertible a "
                f"{ctx['etiqueta']}. Agrega unit_cost_usd"
                + (" o define exchange_rate_bcn." if ctx['code'] == "NIO" else ".")
            )
            continue
        total += units * unit_cost
        total_usd += units * unit_cost_usd

        # Chequeo URLs
        url = it.get("url", "").strip()
        if not url or not (url.startswith("http://") or url.startswith("https://")):
            errors.append(f"Fila {i} ({name}): URL invalida o ausente ('{url}').")

        # Chequeo Fecha
        date = it.get("date", "").strip()
        if not date:
            errors.append(f"Fila {i} ({name}): Fecha de cotizacion ausente.")

        # Chequeo Flete
        elem_lower = name.lower() + " " + it.get("description", "").lower()
        if any(w in elem_lower for w in ["flete", "importacion", "envio", "arancel", "aduan"]):
            has_shipping = True

    if not has_shipping:
        warnings.append("No se detecto linea de 'Flete / Aranceles de Importacion'. Los jurados penalizan cotizaciones de Alibaba sin gastos de internacion.")

    if total_usd < 3000:
        errors.append(f"Total {formato(total, ctx)} (${total_usd:,.2f} USD) es demasiado bajo e inverosimil para un prototipo operativo.")
    elif total_usd > 7000:
        errors.append(f"Total {formato(total, ctx)} (${total_usd:,.2f} USD) excede el presupuesto prudencial de hackathon (maximo $6,000-$7,000 USD).")
    elif total_usd < 4000 or total_usd > 6000:
        warnings.append(f"Total {formato(total, ctx)} (${total_usd:,.2f} USD) fuera del punto dulce optimo ($4,000 - $6,000 USD).")

    print(f"  Total auditado: {formato(total, ctx)} (${total_usd:,.2f} USD, {len(items)} partidas)")

    if warnings:
        print("\n  ALERTAS:")
        for w in warnings:
            print(f"  [!] {w}")

    if errors:
        print("\n  ERRORES BLOQUEANTES:")
        for e in errors:
            print(f"  [X] {e}")
        print("\n  ERROR: Corrige budget/budget.json antes de presentar.")
        sys.exit(1)

    print("\n  VALIDACION EXITOSA: El presupuesto cumple con la rigurosidad sustentada exigida.")

if __name__ == "__main__":
    main()
