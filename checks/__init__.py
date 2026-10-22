"""
checks -- Validaciones deterministas previas a la carga en SIRLI.

Cada modulo devuelve una lista de hallazgos y un codigo de salida:
0 = pasa, 1 = hay algo que corrige puntos o descalifica.

- duracion: el video/locucion no supera los 120 s (regla oficial).
- coherencia: las cifras del guion, la narracion y el pautado coinciden.
- campo_chars: cada campo del pautado respeta su limite de caracteres.
"""

__all__ = ["duracion", "coherencia", "campo_chars"]
