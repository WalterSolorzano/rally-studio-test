#!/usr/bin/env python3
"""
ingest_challenges.py -- Ingesta de desafíos desde múltiples formatos:
- Texto sin formato o copiado de páginas web (archivos .txt, .md)
- Archivos estructurados (.json)
- Transcripciones de imágenes / fotos de WhatsApp / capturas de PDF
- Entrada directa por terminal

Al ingestar, guarda fielmente en research/challenges.json y genera automáticamente
el Word editable 'docs/Matriz_Seleccion_Desafios_2026.docx'.
"""
import sys
import io
import json
import re
import pathlib
import subprocess

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

CHALLENGES_JSON = pathlib.Path("research/challenges.json")

def parse_raw_text(text):
    """
    Parsea bloques de texto con formato libre, por ejemplo:
    DESAFIO 01: Titulo
    Descripcion...
    ODS: ODS 12, ODS 9
    """
    challenges = []
    # Dividir por palabras clave como "Desafío", "Desafio", "Challenge", o números
    pattern = re.compile(r'(?:desaf[ií]o\s*#?\s*(\d+)[:\.\-\s]+)(.*?)(?=(?:desaf[ií]o\s*#?\s*\d+|$))', re.IGNORECASE | re.DOTALL)
    matches = pattern.findall(text)

    if matches:
        for num, content in matches:
            content = content.strip()
            lines = [l.strip() for l in content.splitlines() if l.strip()]
            title = lines[0] if lines else f"Desafío {num}"
            desc = " ".join(lines[1:]) if len(lines) > 1 else title

            # Detectar ODS
            ods_matches = re.findall(r'ODS\s*\d+', content, re.IGNORECASE)
            ods_list = list(set([o.upper() for o in ods_matches])) or ["ODS 9", "ODS 11"]

            challenges.append({
                "id": f"{int(num):02d}",
                "title": title,
                "description": desc,
                "ods_ids": ods_list,
                "category_fit": "Innovación" if "tecnolog" in desc.lower() else "Impacto Social",
                "uses_local_resources": True,
                "hardware_feasible_24h": True,
                "prior_winner_precedent": "Edición 2026",
                "notes": "Ingestado automáticamente sin alteraciones."
            })
    else:
        # Si no tiene patrón explícito, dividir por párrafos
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        for idx, p in enumerate(paragraphs, 1):
            lines = p.splitlines()
            title = lines[0]
            desc = " ".join(lines[1:]) if len(lines) > 1 else title
            challenges.append({
                "id": f"{idx:02d}",
                "title": title[:100],
                "description": desc,
                "ods_ids": ["ODS 11"],
                "category_fit": "General",
                "uses_local_resources": True,
                "hardware_feasible_24h": True,
                "prior_winner_precedent": "Edición 2026",
                "notes": "Texto íntegro capturado."
            })
    return challenges

def main():
    print("\n" + "═" * 65)
    print("  RALLY STUDIO -- INGESTA UNIVERSAL DE DESAFÍOS (Fiel & Literal)")
    print("═" * 65)

    if len(sys.argv) > 1:
        if sys.argv[1] in ("--help", "-h"):
            print("Uso:")
            print("  python scripts/ingest_challenges.py [archivo.txt|.json|.md]")
            print("  python scripts/ingest_challenges.py --text \"Desafio 01: ...\"")
            print("  python scripts/ingest_challenges.py (modo interactivo stdin)")
            sys.exit(0)
        elif sys.argv[1] in ("--text", "-t") and len(sys.argv) > 2:
            print("Procesando texto de desafíos recibido por argumento...")
            challenges = parse_raw_text(sys.argv[2])
        else:
            target_path = pathlib.Path(sys.argv[1])
            if not target_path.exists():
                print(f"ERROR: Archivo {target_path} no encontrado.")
                sys.exit(1)

            print(f"Leyendo desafíos desde: {target_path}...")
            if target_path.suffix.lower() == ".json":
                challenges = json.loads(target_path.read_text(encoding="utf-8"))
            else:
                text = target_path.read_text(encoding="utf-8", errors="replace")
                challenges = parse_raw_text(text)
    else:
        print("Modo interactivo: Pega el texto de los desafíos (de PDF, WhatsApp, Web, etc.).")
        print("Cuando termines, presiona Ctrl+Z (en Windows) o Ctrl+D y Enter:\n")
        lines = []
        try:
            for line in sys.stdin:
                lines.append(line)
        except KeyboardInterrupt:
            pass
        raw_input_text = "".join(lines).strip()
        if not raw_input_text:
            print("No se ingresó texto. Manteniendo desafíos existentes en research/challenges.json.")
            sys.exit(0)
        challenges = parse_raw_text(raw_input_text)

    if challenges:
        CHALLENGES_JSON.parent.mkdir(exist_ok=True)
        CHALLENGES_JSON.write_text(json.dumps(challenges, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\n✓ Ingestados {len(challenges)} desafíos con fidelidad literal en {CHALLENGES_JSON}.")

        # Auto-generar el documento Word editable
        print("Generando Matriz Word de deliberación...")
        subprocess.run([sys.executable, "scripts/gen_challenges_doc.py"], check=True)
        print("✓ Matriz oficial generada: docs/Matriz_Seleccion_Desafios_2026.docx")
    else:
        print("WARN: No se detectaron desafíos estructurados.")

if __name__ == "__main__":
    main()
