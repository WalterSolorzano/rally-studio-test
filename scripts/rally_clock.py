#!/usr/bin/env python3
"""
rally_clock.py -- Cronometro regresivo inteligente y avisos criticos para competencias de 24h/28h.
"""
import time
import datetime
import json
import pathlib
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BRIEF_PATH = pathlib.Path("brief.json")

CRITICAL_MILESTONES = {
    6.0: "T-6h: CONGELAR INVESTIGACION. No se admiten nuevas estadisticas ni cambios de direccion.",
    4.0: "T-4h: Pautado y presupuesto deben estar al 90%. Iniciar renders en calidad previa/borrador.",
    3.0: "T-3h: Grabar demostracion de la plataforma web / prototipo físico. Cerrar el guion narrado.",
    2.0: "T-2h: Render en calidad MEDIA. Exportar modelos 3D y capturas finales.",
    1.0: "T-1h: EXPORTACION FINAL DE VIDEO. Ensamblar pistas de audio, verificar que dure <= 119s.",
    0.5: "T-30min: BLOQUEO TOTAL. Subir video a YouTube (Modo 'Oculto' o 'Publico') y registrar en SIRLI.",
    0.15: "T-9min: CIERRE INMINENTE DE PLATAFORMA. Verificar enlace de YouTube y PDF en la plataforma."
}

def main():
    brief = json.loads(BRIEF_PATH.read_text(encoding="utf-8")) if BRIEF_PATH.exists() else {}
    hours_total = float(brief.get("hours_remaining", brief.get("hours_total", 24)))
    project = brief.get("project_name", "PROYECTO")
    rally = brief.get("rally_type", "nacional").upper()

    end_time = datetime.datetime.now() + datetime.timedelta(hours=hours_total)
    notified = set()

    print("\n" + "═" * 65)
    print(f"  CRONOMETRO INTELIGENTE DE RALLY -- {project} ({rally})")
    print("═" * 65)
    print(f"  Duracion activa: {hours_total:.1f} horas.")
    print(f"  Hora de entrega programada: {end_time.strftime('%I:%M:%S %p (%d %b)')}")
    print("  Presiona Ctrl + C para salir.\n")

    try:
        while True:
            now = datetime.datetime.now()
            diff = end_time - now
            seconds_left = diff.total_seconds()

            if seconds_left <= 0:
                print("\n\n" + "!" * 65)
                print("  TIEMPO AGOTADO. LA PLATAFORMA SIRLI CIERRA AHORA.")
                print("!" * 65)
                break

            hours_left = seconds_left / 3600.0
            
            # Chequeo de hitos criticos
            for milestone_h, message in CRITICAL_MILESTONES.items():
                if hours_left <= milestone_h and milestone_h not in notified:
                    notified.add(milestone_h)
                    print(f"\n\n[ALERTA PROGRAMADA] {message}\n")

            h = int(seconds_left // 3600)
            m = int((seconds_left % 3600) // 60)
            s = int(seconds_left % 60)

            print(f"\r  Tiempo restante: {h:02d}h {m:02d}m {s:02d}s  |  Entrega: {end_time.strftime('%I:%M %p')}  ", end="", flush=True)
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nCronometro detenido.")

if __name__ == "__main__":
    main()
