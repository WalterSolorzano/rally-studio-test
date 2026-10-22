#!/usr/bin/env python3
"""
orchestrate.py -- Tablero de solo lectura del equipo de especialistas.

Muestra, en una sola pasada:
    1. Precondicion: brief.json con proyecto o vacio (NO despachan).
    2. env.json: existe, hardware cargado, techo de horas 3D.
    3. Locks de recursos: titulares vivos, edad, prioridad, avisos de TTL.
    4. Tomas: id/act/owner/tier/estado + dependencias rotas.
    5. Horas 3D acumuladas vs caps.max_3d_hours_total.
    6. Archivos tocados por zona (git status, agrupado).

Uso:  python scripts/orchestrate.py status
No escribe nada. La accion la toman el director y los especialistas.
"""
import csv
import json
import subprocess
import sys
import io
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "scripts"))

import gpu_lock  # noqa: E402
import build_shotlist as bs  # noqa: E402

ZONAS = {
    "tomas (shots/)": ["shots/"],
    "guion (script/)": ["script/"],
    "scripts (codigo)": ["scripts/"],
    "blender": ["blender/"],
    "renders (dashboard/assets/)": ["dashboard/assets/"],
    "pautado (docs/)": ["docs/"],
    "presupuesto (budget/)": ["budget/"],
    "investigacion (research/)": ["research/"],
}


CAMPOS_BRIEF = ["project_name", "team_name", "university", "city", "rally_type"]


def _sec(titulo: str) -> None:
    print(f"\n== {titulo} " + "=" * max(1, 58 - len(titulo)))


def _brief() -> None:
    _sec("1. PRECONDICION brief.json")
    try:
        b = json.loads((RAIZ / "brief.json").read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        print(f"  ERROR leyendo brief.json: {e}")
        return
    faltan = [k for k in CAMPOS_BRIEF if not str(b.get(k) or "").strip()]
    if faltan:
        print(f"  SIN PROYECTO. Faltan: {faltan}.")
        print("  -> El orquestador NO despacha: base montada, sin abrir proyecto.")
    else:
        print(f"  Proyecto: {b['project_name']} ({b['rally_type']}).")


def _env() -> None:
    _sec("2. ENV del equipo")
    ruta = RAIZ / "env.json"
    if not ruta.exists():
        print("  env.json no existe. Copia env.example.json y llena hardware.")
        return
    try:
        e = json.loads(ruta.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as err:
        print(f"  env.json ilegible: {err}")
        return
    hw = e.get("hardware") or {}
    faltan = [k for k in ("gpu_vram_gb", "ram_gb", "cpu_cores") if not hw.get(k)]
    if faltan:
        print(f"  hardware incompleto (faltan {faltan}): bajara a slots por defecto.")
    print(f"  slots: {gpu_lock._slots()} | TTL gpu: {gpu_lock._ttl_s() // 60} min.")
    caps = e.get("caps") or {}
    print(f"  caps: {caps or 'sin caps declarados (usa valores del spec D7/D6)'}")


def _locks() -> None:
    _sec("3. RECURSOS (locks)")
    code = gpu_lock._estado_texto()
    if code == 0:
        return


def _tomas() -> None:
    _sec("4. TOMAS (shots/*.yaml)")
    filas, errores = bs.cargar_shots()
    if errores:
        print("  CONTRATO ROTO (compilar antes de despachar: build_shotlist.py):")
        for e in errores:
            print(f"    - {e}")
    if not filas:
        print("  Sin tomas. Ninguna pieza en produccion.")
        return
    print(f"  {'id':<8}{'act':<5}{'owner':<14}{'tier':<8}{'estado':<12}dependencias")
    for f in sorted(filas, key=lambda x: str(x["id"])):
        print(f"  {f['id']:<8}{str(f['act']):<5}{f['owner']:<14}"
              f"{f['quality_tier']:<8}{f['status']:<12}{f['depends_on'] or '-'}")


def _horas3d() -> None:
    _sec("5. HORAS 3D")
    ruta = RAIZ / "blender" / "horas_3d.csv"
    total = 0.0
    if ruta.exists():
        try:
            with ruta.open(encoding="utf-8") as f:
                for fila in csv.DictReader(f):
                    try:
                        total += float(fila.get("minutos", 0) or 0)
                    except ValueError:
                        pass
        except OSError:
            pass
    print(f"  Acumulado: {total / 60:.1f} h.")
    e = (RAIZ / "env.json")
    if e.exists():
        try:
            env = json.loads(e.read_text(encoding="utf-8"))
            techo = (env.get("caps") or {}).get("max_3d_hours_total")
            if techo:
                pct = 100 * total / (60 * float(techo))
                print(f"  Techo: {techo} h -> {pct:.0f}% usado."
                      + (" AVISO: al llegar al techo, baja poligonizacion o elimina la pieza." if pct >= 100 else ""))
        except (json.JSONDecodeError, ValueError, OSError):
            pass


def _zonas() -> None:
    _sec("6. ZONAS TOCADAS (git status --porcelain)")
    try:
        out = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=str(RAIZ), capture_output=True, text=True, check=True).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("  git no disponible o fuera de un repo.")
        return
    print(out)
    lineas = [l for l in out.splitlines() if l.strip()]
    if not lineas:
        print("  Sin cambios locales.")
        return
    grupos: dict = {}
    for l in lineas:
        estados = l[:2]
        ruta = l[3:].strip().strip('"')
        grupos.setdefault(ruta, []).append(l[:2])
    por_zona: dict = {n: [] for n in ZONAS}
    otros: list = []
    for ruta, estados in sorted(grupos.items()):
        puesto = False
        for nombre, pref in ZONAS.items():
            if any(str(ruta).startswith(p) for p in pref):
                por_zona[nombre].append(ruta)
                puesto = True
                break
    if not puesto:
            otros.append(ruta)
    for nombre, archivos in por_zona.items():
        if archivos:
            print(f"  {nombre}: {len(archivos)} archivo(s)")
            for a in archivos[:5]:
                print(f"    - {a}")
    if otros:
        print(f"  fuera de zona: {otros[:8]}")


def main() -> None:
    if sys.platform == "win32":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    print("ORQUESTRATE -- tablero de solo lectura")
    _brief()
    _env()
    _locks()
    _tomas()
    _horas3d()
    _zonas()


if __name__ == "__main__":
    main()
