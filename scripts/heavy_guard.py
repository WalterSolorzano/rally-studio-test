#!/usr/bin/env python3
"""
heavy_guard.py -- Bloquea llamadas DIRECTAS a binarios pesados.

Regla: todo binario pesado (blender, ffmpeg, TTS, ...) lanza de la unica
forma correcta:

    python scripts/gpu_lock.py run -- <comando>

Si el comando pasa por gpu_lock.py run, se permite. Si no:
- Si hay un titular vivo -> bloquea (es un intruso contra un recurso ocupado).
- Si no hay titular -> bloquea igual ("sin lock").

Codigo 0 = permitir; 3 = bloquear. Pensado para usar como pre-cheque de un
hook del harness (plugin de OpenCode o equivalente) o a mano:

    python scripts/heavy_guard.py -- blender -b escena.blend
    python scripts/heavy_guard.py --str "blender -b escena.blend"   (hook)
"""
import json
import os
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ARCHIVO_ENV = RAIZ / "env.json"

DEFECTOS_BINARIOS = ["blender", "ffmpeg", "ffprobe", "ffplay", "piper"]


def _pesados() -> set:
    lista = list(DEFECTOS_BINARIOS)
    if ARCHIVO_ENV.exists():
        try:
            lista = (json.loads(ARCHIVO_ENV.read_text(encoding="utf-8")).get("blocked_binaries")
                     or DEFECTOS_BINARIOS)
        except Exception:
            pass
    return {str(b).lower() for b in lista}


def _base_minuscula(token: str) -> str:
    return os.path.basename(str(token)).strip().strip('"').lower()


def main() -> None:
    argv = sys.argv[1:]
    # modo --str: el hook pasa la frase del comando completa (un solo token)
    if "--str" in argv:
        i = argv.index("--str")
        argv = argv[i + 1:i + 2]
    # extraer comando desde "--" si viene
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    uni = " ".join(argv)
    if not uni:
        print("[GUARD] Sin comando: revisar la llamada.")
        sys.exit(2)
    if "gpu_lock.py" in uni and " run " in f" {uni} ":
        sys.exit(0)  # via correcta: el propio lock sostiene el hijo
    pesados = _pesados()
    if "--str" in sys.argv[1:]:
        # en modo frase un token puede traer ruta con espacios: escanea la frase
        # completa por palabra completa (blender.exe, C:\...\ffmpeg -i, etc.).
        bajo = uni.lower()
        tocados = sorted({n for n in pesados
                          if re.search(rf"(?<![\w]){re.escape(n)}(\.exe)?(?![\w])", bajo)})
    else:
        tocados = sorted({t for t in argv if _base_minuscula(t) in pesados})
    if not tocados:
        sys.exit(0)  # comando liviano: sin jugador
    print(
        f"[GUARD] BLOQUEADO: {', '.join(tocados)} es binario pesado y fue "
        "llamado directo. Lanzalo siempre por el guardia:\n"
        "    python scripts/gpu_lock.py run --owner <agente> -- <comando>\n"
        "Esto no es negociable: evita que dos procesos GPU colguen la maquina."
    )
    sys.exit(3)


if __name__ == "__main__":
    main()
