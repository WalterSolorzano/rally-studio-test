#!/usr/bin/env python3
"""
validate_brief.py -- Falla con SystemExit si brief.json esta incompleto.
Ejecutar antes de cualquier generador.
"""
import json
import sys
import pathlib
import io

# Forzar UTF-8 en stdout para Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BRIEF_PATH = pathlib.Path("brief.json")

REQUIRED_KEYS = [
    "project_name",
    "team_name",
    "university",
    "city",
    "category",
    "challenge_id",
    "challenge_title",
    "rally_type",
    "hours_total",
    "has_logo",
    "has_palette",
    "has_components",
    "deliverable_type",
    "description_one_line",
    "ods_ids",
]

VALID_RALLY_TYPES = {"nacional", "latam"}
VALID_DELIVERABLE_TYPES = {"3d", "web", "both", "none"}


def main():
    if not BRIEF_PATH.exists():
        print("❌ brief.json no existe.")
        print("   Ejecuta: python scripts/init_brief.py")
        sys.exit(1)

    try:
        brief = json.loads(BRIEF_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"❌ brief.json tiene JSON inválido: {e}")
        sys.exit(1)

    errors = []

    # Campos requeridos
    for key in REQUIRED_KEYS:
        val = brief.get(key)
        if val is None or val == "" or val == []:
            errors.append(f"Campo faltante o vacío: '{key}'")

    # Validaciones de valores
    rally_type = brief.get("rally_type", "")
    if rally_type not in VALID_RALLY_TYPES:
        errors.append(f"rally_type='{rally_type}' inválido. Debe ser: {VALID_RALLY_TYPES}")

    deliverable = brief.get("deliverable_type", "")
    if deliverable not in VALID_DELIVERABLE_TYPES:
        errors.append(f"deliverable_type='{deliverable}' inválido. Debe ser: {VALID_DELIVERABLE_TYPES}")

    hours = brief.get("hours_total", 0)
    if not isinstance(hours, (int, float)) or hours <= 0:
        errors.append("hours_total debe ser un número positivo")

    ods = brief.get("ods_ids", [])
    if not isinstance(ods, list) or len(ods) == 0:
        errors.append("ods_ids debe ser una lista con al menos un ODS (ej. ['ODS11'])")

    if errors:
        print("❌ brief.json incompleto o con errores:\n")
        for e in errors:
            print(f"   · {e}")
        print("\n   Ejecuta: python scripts/init_brief.py")
        sys.exit(1)

    print(f"✅ brief.json válido")
    print(f"   Proyecto : {brief['project_name']}")
    print(f"   Equipo   : {brief['team_name']}")
    print(f"   Rally    : {brief['rally_type'].upper()} — {brief['hours_total']}h")
    print(f"   Desafío  : {brief['challenge_id']} · {brief['challenge_title']}")
    print(f"   ODS      : {', '.join(brief['ods_ids'])}")


if __name__ == "__main__":
    main()
