#!/usr/bin/env python3
"""
validate_pautado.py -- Valida y cuenta caracteres (con espacios) por seccion en docs/pautado_draft.docx.

Delegado en checks/campo_chars.py: una sola fuente de verdad para los limites.
Lee los limites de docs/pautado_template.docx cuando la plantilla los declara.
Regla innegociable: si alguna seccion excede el maximo, devuelve codigo 1.
"""
import io
import pathlib
import sys

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

RAIZ = pathlib.Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from checks.campo_chars import LIMITS, revisar  # noqa: E402

DRAFT_PATH = pathlib.Path("docs/pautado_draft.docx")
TEMPLATE_PATH = pathlib.Path("docs/pautado_template.docx")


def main():
    if not DRAFT_PATH.exists():
        print("ERROR: docs/pautado_draft.docx no existe. Ejecuta python scripts/gen_pautado.py primero.")
        sys.exit(1)

    hallazgos, conteos = revisar(DRAFT_PATH, TEMPLATE_PATH)

    print("\n" + "=" * 60)
    print("  AUDITORIA DE CARACTERES -- REPORTE PAUTADO (CON ESPACIOS)")
    print("=" * 60)

    for campo, limite in LIMITS.items():
        cuenta = conteos.get(campo)
        if cuenta is None:
            print(f"  [?] {campo.upper():<16}: campo no encontrado.")
            continue
        faltante = limite - cuenta
        if faltante < 0:
            print(f"  [X] {campo.upper():<16}: {cuenta:>5} / {limite:<5} ({faltante} chars) -> EXCEDIDO")
        else:
            pct = (cuenta / limite) * 100
            print(f"  [v] {campo.upper():<16}: {cuenta:>5} / {limite:<5} ({pct:5.1f}%) -> OK")

    if hallazgos:
        print()
        for hallazgo in hallazgos:
            print(f"  -> {hallazgo.get('campo', 'general')}: {hallazgo['que']}. {hallazgo['hacer']}")
        print("\n  ERROR: Ajusta los textos antes de enviar a SIRLI.")
        sys.exit(1)

    print("\n  VALIDACION EXITOSA: Los campos analizados cumplen la rubrica de caracteres.")


if __name__ == "__main__":
    main()
