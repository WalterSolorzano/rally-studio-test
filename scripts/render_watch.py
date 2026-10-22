#!/usr/bin/env python3
"""
render_watch.py -- Monitor de recursos (RAM y GPU) en tiempo real.
Previene desbordamiento y congelamiento de la PC durante renders pesados (Blender / TTS / Video).
"""
import time
import sys
import io
import psutil

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

RAM_ALERT_THRESHOLD = 85.0  # 85% de RAM
RAM_PANIC_THRESHOLD = 92.0  # 92% de RAM
MAX_RENDER_MIN = 20.0       # si un render pasa de esto, no aporta: bajar calidad o cortar


def presupuesto_excedido(inicio: float, max_min: float = MAX_RENDER_MIN) -> bool:
    """True si el render ya consumio mas tiempo del que aporta al video."""
    transcurrido_min = (time.time() - inicio) / 60.0
    if transcurrido_min > max_min:
        print(
            f"\n[PRESUPUESTO] Render en {transcurrido_min:.0f} min (limite {max_min:.0f}). "
            "Baja muestras/resolucion o elimina la pieza: no aporta comprension."
        )
        return True
    return False

def check_resources(task_name="Proceso Pesado"):
    """Llamable desde scripts de render para verificar si es seguro proceder."""
    mem = psutil.virtual_memory()
    if mem.percent >= RAM_PANIC_THRESHOLD:
        print(f"\n[ALERTA ROJA] Memoria RAM al {mem.percent:.1f}%. Peligro inminente de cuelgue.")
        print(f"Pausando {task_name} por 15 segundos para liberar buffer...")
        time.sleep(15)
        return False
    elif mem.percent >= RAM_ALERT_THRESHOLD:
        print(f"\n[AVISO] Memoria RAM elevada ({mem.percent:.1f}%). Procediendo con precaucion.")
    return True

def monitor_loop(interval_s=5):
    print("\n" + "═" * 60)
    print("  RALLY STUDIO -- MONITOR DE SALUD Y RENDIMIENTO DEL SISTEMA")
    print("═" * 60)
    print(f"  CPU Cores: {psutil.cpu_count(logical=True)} | RAM Total: {psutil.virtual_memory().total / (1024**3):.1f} GB")
    print("  Presiona Ctrl + C para detener el monitor.\n")

    try:
        while True:
            mem = psutil.virtual_memory()
            cpu = psutil.cpu_percent(interval=1)
            used_gb = mem.used / (1024**3)
            total_gb = mem.total / (1024**3)
            
            status = "NORMAL"
            if mem.percent >= RAM_PANIC_THRESHOLD:
                status = "CRITICO (PAUSAR RENDERS)"
            elif mem.percent >= RAM_ALERT_THRESHOLD:
                status = "PRECAUCION"

            print(f"\r  [RAM: {mem.percent:4.1f}% ({used_gb:.1f}/{total_gb:.1f} GB)] [CPU: {cpu:4.1f}%] -> Estado: {status:<24}", end="", flush=True)
            time.sleep(interval_s)
    except KeyboardInterrupt:
        print("\n\nMonitor detenido.")

if __name__ == "__main__":
    monitor_loop()
