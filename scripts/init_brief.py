#!/usr/bin/env python3
"""
init_brief.py — Entrevista interactiva para poblar brief.json
Ejecutar: python scripts/init_brief.py

Nada se genera hasta que el brief esté completo.
"""
import json
import pathlib
import datetime

BRIEF_PATH = pathlib.Path("brief.json")
ENV_PATH = pathlib.Path("env.json")
ENV_EXAMPLE_PATH = pathlib.Path("env.example.json")


def ensure_env_file() -> bool:
    """Copia env.example.json -> env.json si falta. Nunca sobrescribe el existente."""
    if ENV_PATH.exists() or not ENV_EXAMPLE_PATH.exists():
        return False
    ENV_PATH.write_text(ENV_EXAMPLE_PATH.read_text(encoding="utf-8"), encoding="utf-8")
    return True


QUESTIONS = [
    ("rally_type",          "¿Nacional (24h) o Latam (28h)? [nacional/latam]",      ["nacional", "latam"]),
    ("hours_total",         "¿Cuántas horas quedan desde ahora? (número):",          None),
    ("category",            "Categoría:\n  Nacional → tecnologica / social / procesos\n  Latam   → innovacion / impacto\n  Tu respuesta:", None),
    ("challenge_id",        "ID del desafío elegido (ej. 03):",                      None),
    ("challenge_title",     "Título completo del desafío:",                           None),
    ("project_name",        "Nombre comercial del proyecto:",                         None),
    ("team_name",           "Nombre del equipo:",                                     None),
    ("university",          "Universidad / sede:",                                    None),
    ("city",                "Ciudad / municipio piloto donde opera la solución:",     None),
    ("description_one_line","Describe el proyecto en UNA oración sin tecnicismos:",  None),
    ("has_logo",            "¿Tienen logo? [s/n]",                                   ["s", "n"]),
    ("has_palette",         "¿Tienen paleta de colores definida? [s/n]",             ["s", "n"]),
    ("has_components",      "¿Tienen lista de componentes/materiales? [s/n]",        ["s", "n"]),
    ("has_script_draft",    "¿Tienen borrador de guion? [s/n]",                      ["s", "n"]),
    ("deliverable_type",    "¿Qué hay que generar? [3d/web/both/none]",              ["3d", "web", "both", "none"]),
    ("pc_gpu_vram_gb",      "VRAM de la GPU en GB (0 si no hay GPU discreta):",      None),
    ("pc_ram_gb",           "RAM total del PC en GB:",                               None),
    ("problem_stats_count", "¿Cuántas estadísticas del problema ya tienen verificadas?:", None),
    ("ods_ids",             "ODS relevantes, separados por coma (ej. ODS3,ODS11):",  None),
    ("national_plan_axis",  "Eje del Plan Nacional de Lucha Contra la Pobreza al que aporta\n  (dejar vacío si es Latam o no aplica):", None),
]

BOOL_KEYS = {"has_logo", "has_palette", "has_components", "has_script_draft"}
FLOAT_KEYS = {"hours_total", "pc_gpu_vram_gb", "pc_ram_gb", "problem_stats_count"}
LIST_KEYS = {"ods_ids"}


def ask(key: str, question: str, options: list | None) -> str:
    while True:
        print(f"\n  {question}")
        if options:
            print(f"  [{'/'.join(options)}]")
        val = input("  → ").strip()
        if not val and key not in ("national_plan_axis",):
            print("  ⚠ Campo obligatorio. Vuelve a intentar.")
            continue
        if options and val.lower() not in options:
            print(f"  ⚠ Opciones válidas: {options}")
            continue
        return val


def main():
    print("\n" + "═" * 55)
    print("  🚀  RALLY STUDIO — Entrevista Inicial")
    print("═" * 55)
    print("  Responde cada pregunta. Sin brief completo,")
    print("  ningún generador arranca.\n")

    brief: dict = {"_generated_at": datetime.datetime.now().isoformat()}

    for key, question, options in QUESTIONS:
        val = ask(key, question, options)

        # Conversiones de tipo
        if key in BOOL_KEYS:
            val = val.lower() == "s"
        elif key in FLOAT_KEYS:
            try:
                val = float(val)
            except ValueError:
                print(f"  ⚠ Se esperaba un número para '{key}'. Usando 0.")
                val = 0.0
        elif key in LIST_KEYS:
            val = [x.strip() for x in val.split(",") if x.strip()]

        brief[key] = val

    # Campos derivados
    brief["hours_remaining"] = brief["hours_total"]
    brief["alert_times_h"] = [6, 4, 3, 2, 1, 0.5]
    brief["video_url"] = ""
    brief["site_url"] = ""

    BRIEF_PATH.write_text(
        json.dumps(brief, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\n  ✅ brief.json guardado en {BRIEF_PATH.resolve()}")
    if ensure_env_file():
        print("  ✅ env.json creado desde env.example.json (edita hardware si aplica).")
    print("  Siguiente paso:")
    print("    python scripts/validate_brief.py")
    print("    python scripts/gen_readme.py")
    print("    python scripts/gen_palette.py brand/logo.png")


if __name__ == "__main__":
    main()
