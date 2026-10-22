#!/usr/bin/env python3
"""
moneda.py -- Resuelve la moneda del presupuesto segun el certamen.

Regla del evento:
  - Rally Nacional  -> cordobas (C$), convertidos con la tasa del BCN.
  - Rally Latam     -> dolares estadounidenses (USD).

La fuente de verdad es brief.json: `rally_type` y `exchange_rate_bcn`.
No se inventa una tasa: si falta, se devuelve None y quien llama decide.
"""
from __future__ import annotations

RANGO_IDEAL_USD = (4000.0, 6000.0)
RANGO_MINIMO_USD = 3000.0
RANGO_MAXIMO_USD = 7000.0


def _numero(valor):
    try:
        numero = float(valor)
    except (TypeError, ValueError):
        return None
    return numero if numero > 0 else None


def contexto(brief: dict | None) -> dict:
    """Devuelve como se muestra y se convierte el presupuesto."""
    brief = brief or {}
    rally = str(brief.get("rally_type", "")).strip().lower()
    tasa = _numero(
        brief.get("exchange_rate_bcn")
        or brief.get("tipo_cambio_bcn")
        or brief.get("exchange_rate")
    )

    if rally in ("latam", "latinoamerica", "latinoamérica"):
        return {
            "rally_type": "latam",
            "code": "USD",
            "simbolo": "$",
            "etiqueta": "Dólares estadounidenses (USD)",
            "tasa": None,
            "definido": True,
            "advertencia": "",
        }

    if rally in ("nacional", "national"):
        advertencia = ""
        if not tasa:
            advertencia = (
                "Falta exchange_rate_bcn en brief.json: no se puede expresar "
                "el presupuesto en C$ sin la tasa del BCN."
            )
        return {
            "rally_type": "nacional",
            "code": "NIO",
            "simbolo": "C$",
            "etiqueta": "Córdobas (C$)",
            "tasa": tasa,
            "definido": True,
            "advertencia": advertencia,
        }

    return {
        "rally_type": rally,
        "code": "USD",
        "simbolo": "$",
        "etiqueta": "Dólares estadounidenses (USD)",
        "tasa": None,
        "definido": False,
        "advertencia": (
            "rally_type vacío o desconocido en brief.json: se muestra USD. "
            "Define Nacional (C$) o Latam (USD) antes de exportar."
        ),
    }


def costo_unitario(item: dict, ctx: dict) -> float | None:
    """Costo unitario en la moneda que se muestra (C$ o USD)."""
    usd = _numero(item.get("unit_cost_usd"))
    nio = _numero(item.get("unit_cost_nio") or item.get("unit_cost_local"))
    tasa = ctx.get("tasa")

    if ctx.get("code") == "NIO":
        if nio is not None:
            return nio
        if usd is not None and tasa:
            return usd * tasa
        return None

    if usd is not None:
        return usd
    if nio is not None and tasa:
        return nio / tasa
    return None


def costo_unitario_usd(item: dict, ctx: dict) -> float | None:
    """Costo unitario normalizado a USD para validar el rango del evento."""
    usd = _numero(item.get("unit_cost_usd"))
    nio = _numero(item.get("unit_cost_nio") or item.get("unit_cost_local"))
    tasa = ctx.get("tasa")

    if usd is not None:
        return usd
    if nio is not None and tasa:
        return nio / tasa
    return None


def formato(monto: float | None, ctx: dict) -> str:
    if monto is None:
        return "s/d"
    return f"{ctx.get('simbolo', '$')}{monto:,.2f}"


def numero_excel(ctx: dict) -> str:
    formato_moneda = '"C$"#,##0.00' if ctx.get("code") == "NIO" else '"$"#,##0.00'
    return formato_moneda
