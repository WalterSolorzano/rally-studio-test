#!/usr/bin/env python3
"""
gpu_lock.py -- Guardia de recursos (gpu / cpu / ram) para procesos pesados.

Garantiza de forma TECNICA, no solo por conducta, que los procesos pesados
(Blender, ffmpeg, TTS, Playwright-grabacion) no choquen por recursos.

Reglas del diseño (ver docs/superpowers/specs/...-design.md, D2 + D7):
- Tres recursos con capacidad configurable en env.json ("slots").
  Por defecto: gpu=1 (exclusivo), cpu=1, ram=1.
- Cada titular declara prioridad: baja | media | alta.
- run -- <comando>: el lock vive en este proceso mientras corre el hijo.
  El lock guarda pid (padre) y child_pid (hijo) + hora de inicio.
- Creacion atomica (O_CREAT|O_EXCL). Robo atomico: renombrar fuera del
  camino y luego borrar; nunca editar el lock en caliente.
- Un titular muerto (pid sin proceso vivo) es huerfano: se limpia solo.
- Titular sin pid util, o vencido por TTL, tambien es robable.
- Un esperador con prioridad ALTA puede robar el recurso a un titular BAJA
  solo si su espera supero ROBO_PACIENCIA_S, con aviso impreso. Nunca se
  le roba a un titular de prioridad media o alta.
- Timeouts con aviso: al fallar, el mensaje dice quien tiene el recurso,
  desde cuando y con que prioridad.
- locks/ esta fuera de git: el lock protege solo esta maquina.

Uso:
    # RECOMENDADO: lanzar el binario pesado siempre asi
    python scripts/gpu_lock.py run -- blender -b escena.blend -o render -f 1
    python scripts/gpu_lock.py run --priority alta -- ffmpeg -i entrada.mp4 salida.mp4

    # Desde codigo Python (proceso largo que YA sostiene el trabajo):
    from gpu_lock import acquire, release
    if not acquire(["gpu"], owner="modeler_escalera", priority="media"):
        sys.exit(3)
    try:
        ... trabajo pesado ...
    finally:
        release("modeler_escalera", ["gpu"])

    # Consulta
    python scripts/gpu_lock.py status

    # Director (unicamente): forzar la liberacion de un recurso
    python scripts/gpu_lock.py release --resource gpu --force

Limites conocidos:
- La sustitucion por prioridad tiene una ventana de carrera minima
  (lectura-escritura del archivo). Los robos normales (huerfano/TTL/corrupto)
  son atomicos; el robo por prioridad revalida el estado tras escribir.
- ram se modela como capacidad en "slots", no como pedidos en GB: el control
  fino de RAM lo hace render_watch.py en vivo. Este lock decide QUIEN entra.
"""
import argparse
import ctypes
import json
import os
import shlex
import subprocess
import sys
import time
import io
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DIR_LOCKS = RAIZ / "locks"
ARCHIVO_ENV = RAIZ / "env.json"

PRIORIDADES = ("baja", "media", "alta")
RECURSOS_DEFecto = ("gpu", "cpu", "ram")
SLOTS_DEFECTO = {"gpu": 1, "cpu": 1, "ram": 1}
TTL_DEFAULT_MIN = 25  # > presupuesto de 20 min de render_watch.py
ROBO_PACIENCIA_S = 5 * 60  # un esperador alta espera 5 min antes de robar a baja


# ---------------------------------------------------------------- infra ------

def _salida_utf8() -> None:
    if sys.platform == "win32":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


def _env() -> dict:
    if ARCHIVO_ENV.exists():
        try:
            return json.loads(ARCHIVO_ENV.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            print("[GPU-LOCK] env.json ilegible: se usan valores por defecto.")
    return {}


def _slots() -> dict:
    slots = dict(SLOTS_DEFECTO)
    slots.update(_env().get("slots") or {})
    for recurso, valor in slots.items():
        if not isinstance(valor, int) or valor < 1:
            slots[recurso] = SLOTS_DEFECTO.get(recurso, 1)
    return slots


def _ttl_s() -> int:
    v = (_env().get("caps") or {}).get("ttl_gpu_min")
    try:
        ttl = int(v) if v else int(TTL_DEFAULT_MIN)
    except (TypeError, ValueError):
        ttl = int(TTL_DEFAULT_MIN)
    return ttl * 60


def _pid_vivo(pid: int) -> bool:
    """True si ese PID tiene un proceso vivo en esta maquina."""
    if pid <= 0:
        return False
    try:
        import psutil  # type: ignore
        return psutil.pid_exists(pid)
    except Exception:
        pass
    if os.name == "nt":
        PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
        STILL_ACTIVE = 259
        try:
            kernel32 = ctypes.windll.kernel32
            handle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
            if not handle:
                return False
            try:
                exit_code = ctypes.c_ulong()
                if kernel32.GetExitCodeProcess(handle, ctypes.byref(exit_code)):
                    return exit_code.value == STILL_ACTIVE
                return False
            finally:
                kernel32.CloseHandle(handle)
        except OSError:
            return False
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def _ruta(recurso: str) -> Path:
    return DIR_LOCKS / f"{recurso}.lock"


def _ruta_rota(recurso: str) -> Path:
    return DIR_LOCKS / f"roto_{recurso}_{int(time.time())}.json"


def _leer(recurso: str) -> dict | None:
    ruta = _ruta(recurso)
    if not ruta.exists():
        return None
    try:
        datos = json.loads(ruta.read_text(encoding="utf-8"))
        holders = datos.get("holders")
        if not isinstance(holders, list):
            return {"recurso": recurso, "corrupto": True, "holders": []}
        return {
            "recurso": datos.get("recurso", recurso),
            "capacidad": int(datos.get("capacidad", _slots().get(recurso, 1))),
            "holders": holders,
        }
    except (json.JSONDecodeError, OSError):
        return {"recurso": recurso, "corrupto": True, "holders": []}


def _escribir_nuevo(recurso: str, capacidad: int, holders: list) -> bool:
    """Creacion atomica con O_CREAT|O_EXCL. False si otro se llevo el hueco."""
    DIR_LOCKS.mkdir(exist_ok=True)
    datos = {"recurso": recurso, "capacidad": capacidad, "holders": holders}
    try:
        fd = os.open(str(_ruta(recurso)), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(datos, f, ensure_ascii=False)
        return True
    except FileExistsError:
        return False
    except OSError:
        return False


def _reeescribir(recurso: str, datos: dict) -> bool:
    """Reescritura de holders (robo por prioridad, limpieza) via tmp+replace."""
    DIR_LOCKS.mkdir(exist_ok=True)
    tmp = _ruta(recurso).with_suffix(".tmp")
    try:
        tmp.write_text(json.dumps(datos, ensure_ascii=False), encoding="utf-8")
        os.replace(str(tmp), str(_ruta(recurso)))
        return True
    except OSError:
        return False


def _quitar(recurso: str) -> bool:
    """Robo atomico: renombrar fuera del camino (solo el que renombra gana)."""
    try:
        _ruta(recurso).rename(_ruta_rota(recurso))
    except OSError:
        return False
    _ruta_rota(recurso).unlink(missing_ok=True)
    return True


def _titular_completo(owner: str, prioridad: str, child_pid: int = 0) -> dict:
    return {
        "owner": owner,
        "pid": os.getpid(),
        "child_pid": child_pid,
        "started_at": time.time(),
        "started_iso": time.strftime("%Y-%m-%d %H:%M:%S"),
        "ttl_s": _ttl_s(),
        "priority": prioridad,
    }


def _titular_vivo(h: dict) -> bool:
    """Vivo si el pid o el child_pid tienen proceso vivo."""
    pid = int(h.get("pid", 0) or 0)
    cpid = int(h.get("child_pid", 0) or 0)
    if pid > 0 and _pid_vivo(pid):
        return True
    if cpid > 0 and _pid_vivo(cpid):
        return True
    return False


def _motivo_robo(h: dict) -> str | None:
    """Motivo por el que un titular pierde su hueco, o None si sigue en pie."""
    if h.get("corrupto") or not isinstance(h, dict):
        return "archivo corrupto"
    if not _titular_vivo(h):
        return f"huerfano pid={h.get('pid')} child={h.get('child_pid')}"
    started = float(h.get("started_at", 0) or 0)
    ttl = float(h.get("ttl_s", _ttl_s()) or _ttl_s())
    if started > 0 and (time.time() - started) > ttl:
        return f"vencido: {((time.time() - started) / 60):.0f} min > TTL {ttl / 60:.0f} min"
    return None


def _aviso_ttl(h: dict) -> str | None:
    """Aviso si el titular se acerca al TTL (>=80%) y sigue vivo."""
    started = float(h.get("started_at", 0) or 0)
    ttl = float(h.get("ttl_s", _ttl_s()) or _ttl_s())
    if started > 0 and (time.time() - started) >= 0.8 * ttl:
        return f"titular '{h.get('owner')}' lleva {((time.time() - started) / 60):.0f} de {ttl / 60:.0f} min: cerca del TTL"
    return None


def _limpiar_holders(recurso: str, datos: dict) -> tuple[list, list]:
    """Saca huerfanos/vencidos. Devuelve (titulares_vivos, motivos_limpiados)."""
    vivos, borrados = [], []
    for h in datos.get("holders", []):
        motivo = _motivo_robo(h)
        if motivo:
            borrados.append(f"{h.get('owner')}: {motivo}")
        else:
            vivos.append(h)
    if borrados and vivos != datos.get("holders"):
        datos["holders"] = vivos
        if vivos:
            _reeescribir(recurso, datos)
        else:
            _quitar(recurso)
    return vivos, borrados


# --------------------------------------------------------------- api ------

def acquire(resources: list, owner: str, priority: str = "media",
            timeout_s: float = 0.0, child_pid: int = 0) -> bool:
    """True si se tomaron TODOS los recursos pedidos. 0 = fallar rapido.

    Si no logra todos, libera los que tomo parcialmente (sin dejar chalets
    a medias). En robo por prioridad, revalida tras escribir.
    """
    if priority not in PRIORIDADES:
        print(f"[GPU-LOCK] Prioridad invalida: {priority}. Usa baja|media|alta.")
        return False
    slots = _slots()
    tomados: dict = {}
    ini = time.time()
    pend = {r: True for r in resources}
    try:
        while pend:
            for recurso in list(pend):
                datos = _leer(recurso)
                if datos is None:
                    if _escribir_nuevo(recurso, slots.get(recurso, 1),
                                       [_titular_completo(owner, priority, child_pid)]):
                        tomados[recurso] = _titular_completo(owner, priority, child_pid)
                        pend.pop(recurso)
                    continue
                vivos, limpiados = _limpiar_holders(recurso, datos)
                for m in limpiados:
                    _rompeprint(recurso, m)
                if len(vivos) < datos["capacidad"]:
                    candidato = _titular_completo(owner, priority, child_pid)
                    datos["holders"] = vivos + [candidato]
                    if _reeescribir(recurso, datos):
                        tomados[recurso] = candidato
                        pend.pop(recurso)
                    continue
                # Recurso lleno: robo por prioridad (solo alta pisa a baja)
                if priority == "alta" and (time.time() - ini) > ROBO_PACIENCIA_S:
                    bajas = [h for h in vivos if h.get("priority") == "baja"]
                    if bajas:
                        victima = bajas[0]
                        datos["holders"] = [h for h in vivos if h is not victima] + [
                            _titular_completo(owner, priority, child_pid)]
                        if _reeescribir(recurso, datos):
                            _rompeprint(recurso, f"ROBO por prioridad: '{owner}' (alta) sustituye a '{victima.get('owner')}' (baja)")
                            tomados[recurso] = datos["holders"][-1]
                            pend.pop(recurso)
                        continue
                if timeout_s <= 0 or (time.time() - ini) >= timeout_s:
                    holder = vivos[0]
                    edad = (time.time() - float(holder.get("started_at", 0) or 0)) / 60
                    print(
                        f"[GPU-LOCK] OCUPADO '{recurso}' por '{holder.get('owner')}' "
                        f"(pid={holder.get('pid')}, prioridad={holder.get('priority')}, "
                        f"edad {edad:.0f} min). Espera, libera, o pide al director "
                        f"'release --resource {recurso} --force'."
                    )
                    return False
                time.sleep(3)
    except Exception:
        rejunte = list(tomados)
        release(owner, rejunte) if rejunte else None
        raise
    return True


def release(owner: str, resources: list | None = None) -> bool:
    """Libera los recursos del propio proceso (o huerfanos que limpite)."""
    recursos = resources or RECURSOS_DEFecto
    ok = True
    for recurso in recursos:
        datos = _leer(recurso)
        if datos is None:
            continue
        vivos, _ = _limpiar_holders(recurso, datos)
        mios = [h for h in vivos
                if h.get("owner") == owner and (
                    int(h.get("pid", 0) or 0) == os.getpid()
                    or int(h.get("child_pid", 0) or 0) == os.getpid()
                    or not _titular_vivo(h))]
        if not mios:
            continue
        restantes = [h for h in vivos if h not in mios]
        if restantes:
            datos["holders"] = restantes
            _reeescribir(recurso, datos)
        else:
            _quitar(recurso)
        print(f"[GPU-LOCK] '{recurso}' liberado por '{owner}'.")
    return ok


def fuerza(recurso: str) -> None:
    """Solo director: rompe todo holder del recurso, vivo o no."""
    if _ruta(recurso).exists():
        _rompeprint(recurso, "OVERRIDE del director (release --force)")
        _quitar(recurso) or _ruta(recurso).unlink(missing_ok=True)


def _rompeprint(recurso: str, motivo: str) -> None:
    print(f"[GPU-LOCK] {recurso}: {motivo}")


def _estado_texto() -> int:
    slots = _slots()
    salio_aviso = 0
    hay = 0
    for recurso in RECURSOS_DEFecto:
        datos = _leer(recurso)
        cap = slots.get(recurso, 1)
        if datos is None:
            print(f"[GPU-LOCK] {recurso}: LIBRE ({cap} slot(s)).")
            continue
        vivos, limpiados = _limpiar_holders(recurso, datos)
        for m in limpiados:
            _rompeprint(recurso, m)
        if not vivos:
            print(f"[GPU-LOCK] {recurso}: LIBRE tras limpieza.")
            continue
        hay += 1
        for h in vivos:
            edad = (time.time() - float(h.get("started_at", 0) or 0)) / 60
            aviso = _aviso_ttl(h)
            if aviso:
                salio_aviso += 1
            print(
                f"[GPU-LOCK] {recurso} ({len(vivos)}/{cap}): "
                f"'{h.get('owner')}' pid={h.get('pid')} child={h.get('child_pid')} "
                f"prioridad={h.get('priority')} desde {h.get('started_iso')} "
                f"({edad:.0f} min)."
                + (f" AVISO: {aviso}" if aviso else "")
            )
    return 1 if hay else 0


def _run(args: argparse.Namespace, cmd: list, recursos: list) -> int:
    """Toma los locks y lanza el hijo: el lock vive mientras vive el hijo."""
    hijo = subprocess.Popen(cmd)
    print(f"[GPU-LOCK] Comando: {shlex.join(cmd)} (pid hijo={hijo.pid})")
    ok = acquire(recursos, args.owner, args.priority,
                 timeout_s=args.timeout, child_pid=hijo.pid)
    if not ok:
        hijo.kill()
        return 3
    codigo = hijo.wait()
    release(args.owner, recursos)
    return codigo


def main() -> None:
    _salida_utf8()
    p = argparse.ArgumentParser(description="Guardia de recursos gpu/cpu/ram")
    sp = p.add_subparsers(dest="cmd", required=True)

    a = sp.add_parser("acquire", help="Tomar locks y sostenerlos a mano")
    a.add_argument("--owner", required=True)
    a.add_argument("--priority", choices=PRIORIDADES, default="media")
    a.add_argument("--resources", default="gpu", help="lista separada por comas")
    a.add_argument("--timeout", type=float, default=0.0)
    a.add_argument("--hold-seconds", type=float, default=0.0,
                   help="sostener los locks ese tiempo (reserva manual)")

    r = sp.add_parser("release", help="Liberar (propio o huerfano); --force solo director")
    r.add_argument("--owner", default=None)
    r.add_argument("--resource", "--resources", dest="resources",
                   default=",".join(RECURSOS_DEFecto))
    r.add_argument("--force", action="store_true")

    sp.add_parser("status", help="Estado de los recursos")

    g = sp.add_parser("run", help="run -- comando: lock vivo + lanzar y esperar el hijo")
    g.add_argument("--owner", required=True)
    g.add_argument("--priority", choices=PRIORIDADES, default="media")
    g.add_argument("--resources", default="gpu", help="lista separada por comas")
    g.add_argument("--timeout", type=float, default=0.0)
    g.add_argument("cmd", nargs=argparse.REMAINDER, help="-- comando a lanzar")

    args = p.parse_args()
    recursos = [t.strip() for t in getattr(args, "resources", "").split(",") if t.strip()]

    if args.cmd == "acquire":
        got = acquire(recursos, args.owner, args.priority, args.timeout)
        if not got:
            sys.exit(3)
        if args.hold_seconds > 0:
            print(f"[GPU-LOCK] Sostiene {args.hold_seconds/60:.1f} min (matar el proceso deja huerfano: se auto-limpia).")
            time.sleep(args.hold_seconds)
            release(args.owner, recursos)
        sys.exit(0)
    elif args.cmd == "release":
        if args.force:
            for recurso in recursos:
                fuerza(recurso)
            sys.exit(0)
        sys.exit(0 if release(args.owner, recursos) else 4)
    elif args.cmd == "status":
        sys.exit(_estado_texto())
    else:
        cmd = args.cmd
        if cmd and cmd[0] == "--":
            cmd = cmd[1:]
        if not cmd:
            print("[GPU-LOCK] Uso: run -- <comando>")
            sys.exit(2)
        sys.exit(_run(args, cmd, recursos))


if __name__ == "__main__":
    main()
