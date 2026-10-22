#!/usr/bin/env python3
"""
gen_palette.py -- Genera paleta de colores desde el logo del proyecto.
Uso: python scripts/gen_palette.py brand/logo.png

Proceso:
1. Extrae colores dominantes del logo con Pillow
2. Consulta Colormind API (gratuita, sin key) para armonizar
3. Verifica contraste WCAG AA
4. Guarda en brand/palette.json y brand/tokens.css
"""
import sys
import json
import pathlib
import requests
from PIL import Image
from collections import Counter

LOGO_PATH    = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path("brand/logo.png")
PALETTE_PATH = pathlib.Path("brand/palette.json")
TOKENS_PATH  = pathlib.Path("brand/tokens.css")
COLORMIND_URL = "http://colormind.io/api/"

# ── Utilitarios de color ─────────────────────────────────

def hex_to_rgb(h: str) -> list[int]:
    h = h.lstrip("#")
    return [int(h[i:i+2], 16) for i in (0, 2, 4)]

def rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"

def relative_luminance(rgb: list[int]) -> float:
    """WCAG 2.1 luminancia relativa."""
    c = [x / 255.0 for x in rgb]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def contrast_ratio(hex1: str, hex2: str) -> float:
    l1 = relative_luminance(hex_to_rgb(hex1))
    l2 = relative_luminance(hex_to_rgb(hex2))
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def wcag_grade(ratio: float) -> str:
    if ratio >= 7.0:  return "AAA"
    if ratio >= 4.5:  return "AA"
    if ratio >= 3.0:  return "AA Large"
    return "FAIL"

# ── Extraccion de colores dominantes ────────────────────

def dominant_colors(img_path: pathlib.Path, n: int = 6) -> list[str]:
    """Extrae los N colores mas frecuentes del logo (sin contar blanco/negro puros)."""
    img = Image.open(img_path).convert("RGBA").resize((120, 120))
    pixels = []
    for r, g, b, a in img.getdata():
        if a < 50:  # transparente → skip
            continue
        # Ignorar blanco casi puro y negro casi puro
        if r > 240 and g > 240 and b > 240:
            continue
        if r < 15 and g < 15 and b < 15:
            continue
        # Reducir precision para agrupar colores similares
        bucket = (r // 24 * 24, g // 24 * 24, b // 24 * 24)
        pixels.append(bucket)

    if not pixels:
        print("  WARN: No se encontraron colores utiles en el logo. Usando paleta por defecto.")
        return ["#1a1a1a", "#4a90d9", "#e8f0fe", "#ffffff", "#111111"]

    counts = Counter(pixels)
    top = counts.most_common(n)
    return [rgb_to_hex(*rgb) for rgb, _ in top]

# ── Colormind API ──────────────────────────────────────

def fetch_from_colormind(seed_colors: list[str]) -> list[str]:
    """Consulta Colormind para armonizar colores."""
    try:
        seed_rgb = [hex_to_rgb(c) for c in seed_colors[:2]]
        payload = {
            "model": "default",
            "input": seed_rgb + ["N", "N", "N"]
        }
        resp = requests.post(COLORMIND_URL, json=payload, timeout=8)
        resp.raise_for_status()
        result = resp.json().get("result", [])
        return [rgb_to_hex(*c) for c in result]
    except Exception as e:
        print(f"  WARN: Colormind no disponible ({e}). Usando colores extraidos directamente.")
        return seed_colors[:5] + ["#ffffff"] if len(seed_colors) < 5 else seed_colors[:5]

# ── Construir paleta final ─────────────────────────────

def build_palette(colors: list[str]) -> dict:
    """Asigna roles semanticos a los colores."""
    # Ordenar por luminancia: oscuros primero como primary
    sorted_by_lum = sorted(colors, key=lambda h: relative_luminance(hex_to_rgb(h)))

    primary   = sorted_by_lum[0]                        # mas oscuro = mayor autoridad
    secondary = sorted_by_lum[min(1, len(sorted_by_lum)-1)]
    accent    = sorted_by_lum[min(2, len(sorted_by_lum)-1)]
    bg        = "#ffffff"
    text      = "#111111"

    # Verificar contraste primary/bg
    cr = contrast_ratio(primary, bg)
    if cr < 4.5:
        # Oscurecer primary hasta alcanzar AA
        rgb = hex_to_rgb(primary)
        factor = 0.85
        while contrast_ratio(rgb_to_hex(*rgb), bg) < 4.5 and factor > 0.1:
            rgb = [max(0, int(c * factor)) for c in rgb]
            factor -= 0.05
        primary = rgb_to_hex(*rgb)
        cr = contrast_ratio(primary, bg)

    return {
        "primary":   primary,
        "secondary": secondary,
        "accent":    accent,
        "bg":        bg,
        "text":      text,
        "_source":   "colormind.io",
        "_contrast_primary_bg": round(cr, 2),
        "_wcag_grade": wcag_grade(cr),
    }

# ── Tokens CSS ─────────────────────────────────────────

def write_tokens_css(palette: dict) -> None:
    lines = [":root {"]
    for k, v in palette.items():
        if not k.startswith("_") and v.startswith("#"):
            lines.append(f"  --color-{k}: {v};")
    lines.append("}")
    TOKENS_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")

# ── MAIN ──────────────────────────────────────────────

def main():
    print("\nRally Studio -- Generador de Paleta")
    print("-" * 40)

    if not LOGO_PATH.exists():
        print(f"ERROR: {LOGO_PATH} no encontrado.")
        print("Coloca el logo en brand/logo.png (o .svg convertido a PNG) y vuelve a ejecutar.")
        sys.exit(1)

    print(f"[1/4] Extrayendo colores de {LOGO_PATH} ...")
    colors = dominant_colors(LOGO_PATH)
    print(f"      Colores dominantes: {colors}")

    print("[2/4] Consultando Colormind API ...")
    harmonized = fetch_from_colormind(colors)
    print(f"      Paleta armonizada: {harmonized}")

    print("[3/4] Construyendo paleta con roles semanticos ...")
    palette = build_palette(harmonized)
    cr      = palette["_contrast_primary_bg"]
    grade   = palette["_wcag_grade"]
    print(f"      Primary: {palette['primary']} | Contraste s/fondo: {cr}:1 ({grade})")

    if grade == "FAIL":
        print("      WARN: Contraste bajo. Considera elegir manualmente un primary mas oscuro.")

    print("[4/4] Guardando palette.json y tokens.css ...")
    PALETTE_PATH.write_text(json.dumps(palette, indent=2, ensure_ascii=False), encoding="utf-8")
    write_tokens_css(palette)

    print(f"\nOK: brand/palette.json")
    print(f"OK: brand/tokens.css")
    print(f"\nPaleta generada:")
    for k, v in palette.items():
        if not k.startswith("_"):
            print(f"  {k:<12} {v}")
    print("\nRecarga el dashboard para ver los colores aplicados.")
    print("Si quieres otra opcion, ejecuta el script de nuevo o edita palette.json manualmente.")


if __name__ == "__main__":
    main()
