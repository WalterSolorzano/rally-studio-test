#!/usr/bin/env python3
"""
publish_site.py -- Script de publicacion y despliegue para la web demo en Netlify CLI o GitHub Pages.
"""
import subprocess
import shutil
import pathlib
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

SITE_DIR = pathlib.Path("site")

def main():
    if not (SITE_DIR / "index.html").exists():
        print("ERROR: site/index.html no existe.")
        sys.exit(1)

    print("\n" + "═" * 60)
    print("  RALLY STUDIO -- PUBLICACION DE LA WEB DEMO")
    print("═" * 60)

    # 1. Chequeo de Netlify CLI
    netlify_bin = shutil.which("netlify")
    if netlify_bin:
        print("  Detectado Netlify CLI. Iniciando despliegue de produccion...")
        try:
            res = subprocess.run([netlify_bin, "deploy", "--prod", f"--dir={SITE_DIR}"], check=True)
            print("  OK: Despliegue en Netlify completado exitosamente.")
            return
        except Exception as e:
            print(f"  WARN: Error al desplegar con Netlify: {e}")

    # 2. Alternativa GitHub Pages
    print("  INFO: Netlify CLI no disponible localmente o no autenticado.")
    print("  Para desplegar gratis en GitHub Pages:")
    print("  1. Haz commit de la carpeta 'site/'.")
    print("  2. Empuja los cambios al repositorio de GitHub: git push origin main")
    print("  3. El workflow .github/workflows/publish.yml publicara automaticamente tu sitio.")
    print(f"\n  Vista previa local disponible abriendo directamente: {SITE_DIR.resolve() / 'index.html'}")

if __name__ == "__main__":
    main()
