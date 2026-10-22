#!/usr/bin/env python3
"""
gen_readme.py -- Genera y actualiza dinamicamente el README.md maestro del proyecto.
Funciona como la 'Biblia del Proyecto' y se sincroniza con brief.json y el estado de entregables.
"""
import json
import pathlib
import datetime
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BRIEF_PATH = pathlib.Path("brief.json")
README_PATH = pathlib.Path("README.md")

def check_file_status(path_str):
    p = pathlib.Path(path_str)
    return "[x]" if (p.exists() and p.stat().st_size > 50) else "[ ]"

def main():
    if not BRIEF_PATH.exists():
        print("ERROR: brief.json no existe. Ejecuta python scripts/init_brief.py primero.")
        sys.exit(1)

    brief = json.loads(BRIEF_PATH.read_text(encoding="utf-8"))
    today_str = datetime.date.today().strftime("%d/%m/%Y")

    project = brief.get("project_name", "PROYECTO RALLY").upper()
    team = brief.get("team_name", "EQUIPO DE INNOVACION")
    university = brief.get("university", "Universidad Sede")
    city = brief.get("city", "Managua")
    rally = brief.get("rally_type", "nacional").upper()
    hours = brief.get("hours_total", 24)
    cat = brief.get("category", "General")
    ch_id = brief.get("challenge_id", "00")
    ch_title = brief.get("challenge_title", "Desafio Seleccionado")
    ods = ", ".join(brief.get("ods_ids", ["ODS 11"]))
    desc = brief.get("description_one_line", "Solucion integral desarrollada en maraton de innovacion.")
    axis = brief.get("national_plan_axis", "Eje Estrategico Nacional")

    readme_content = f"""# {project} -- {team}

> **Certamen:** Rally {rally} ({hours} horas continuas)  
> **Sede / Universidad:** {university} ({city}, Nicaragua)  
> **Categoria:** {cat.capitalize()} | **Desafio #{ch_id}:** {ch_title}  
> **Alineacion Estrategica:** {ods} | **Eje Plan Nacional:** {axis}  
> **Ultima sincronizacion:** {today_str} (generado automaticamente por Rally Studio)

---

## 1. Tesis y Resumen Ejecutivo
**{desc}**

Este repositorio contiene la arquitectura completa de ingenieria, documentacion pautada oficial, estudio de prefactibilidad economica sustentada, matriz Canvas, guion audiovisual de 120 segundos y recursos multimedia requeridos por el sistema de evaluacion SIRLI.

---

## 2. Estado de Entregables Oficiales (Auditoria en Vivo)

- {check_file_status("brief.json")} **Fuente Unica de Verdad:** `brief.json` configurado y validado.
- {check_file_status("brand/palette.json")} **Identidad y Tokens:** `brand/palette.json` y `brand/tokens.css` (Contraste WCAG AA).
- {check_file_status("research/claims.json")} **Evidencia e Investigacion:** `research/claims.json` con fuentes verificables.
- {check_file_status("docs/pautado_draft.docx")} **Reporte Pautado Oficial:** `docs/pautado_draft.docx` (limite estricto de caracteres).
- {check_file_status("budget/budget.xlsx")} **Presupuesto Mayorista:** `budget/budget.xlsx` ($4,000 - $6,000 USD con enlaces y flete).
- {check_file_status("docs/canvas.md")} **Modelo Canvas:** `docs/canvas.md` coherente con costos y propuesta de valor.
- {check_file_status("docs/bibliography.md")} **Referencias APA 7:** `docs/bibliography.md` con declaracion etica de uso de IA.
- {check_file_status("script/script.md")} **Guion de Produccion:** `script/script.md` estructurado en 4 actos (120s exactos).
- {check_file_status("assets/voice/narration.mp4")} **Locucion Oficial:** `assets/voice/narration.mp4` (MP4 con audio AAC, sin video).
- {check_file_status("site/index.html")} **Plataforma Web Demo:** Desplegada en `site/` (GitHub Pages / Netlify).

---

## 3. Toolkit de Comandos de Automatizacion

Todos los scripts operan de manera sincronizada y alimentan el dashboard local:

```bash
# Entrevista y Validacion de Brief
python scripts/init_brief.py            # Entrevista inicial guiada
python scripts/validate_brief.py        # Validador previo a generacion

# Identidad Visual y Scoring
python scripts/gen_palette.py brand/logo.png  # Extraccion de paleta y tokens CSS
python scripts/score_challenges.py      # Ranking predictivo de desafios 2014-2026

# Documentos Ejecutivos
python scripts/gen_pautado.py --clean   # Generador de pautado Word oficial
python scripts/validate_pautado.py      # Conteo auditado de caracteres con espacios
python scripts/gen_budget.py            # Generador de hoja Excel formal
python scripts/validate_budget.py       # Auditoria de URLs y coherencia de costos
python scripts/gen_canvas.py            # Generador de Business Model Canvas
python scripts/gen_bibliography.py      # Generador de bibliografia APA 7

# Produccion Audiovisual y Narrativa
python scripts/gen_script.py            # Guion 4 actos + shotlist.csv + locucion
python scripts/gen_voice.py             # Sintesis de voz adaptativa (Chatterbox / Kokoro)

# Monitor y Control de Tiempo
python scripts/render_watch.py          # Monitor de RAM/CPU para prevenir cuelgues
python scripts/rally_clock.py           # Cronometro regresivo y alertas criticas

# Publicacion y Despliegue
python scripts/gen_readme.py            # Actualizar esta biblia del proyecto
python scripts/publish_site.py          # Despliegue de demo a Netlify / Pages
```

---

## 4. Reglas Innegociables para Agentes de IA (`AGENTS.md`)
1. **Unica Fuente:** Ningun modulo ni redactor hardcodea datos; todo se lee de `brief.json` y `claims.json`.
2. **Cero Clichés de IA:** Prohibido el uso de gradientes morados, cards repetidas, sombras difusas o texto inflado.
3. **Puntuacion Estrategica:** Los ultimos 25 segundos del video y el pautado deben coincidir al 100% en costos unitarios y métricas.
4. **Respeto de Tiempos:** Subir el video a YouTube al menos 45 minutos antes del cierre de SIRLI.
"""

    README_PATH.write_text(readme_content, encoding="utf-8")
    print(f"OK: {README_PATH} actualizado exitosamente.")

if __name__ == "__main__":
    main()
