#!/usr/bin/env python3
"""sincronizar_nube.py -- Puente entre los archivos del rally (local) y la isla.

Este es el puente del AGENTE LOCAL (Fase 2.1). El OpenCode sigue editando sus
archivos de siempre; este puente es quien los sube en vivo a la pizarra web.

  RALLY_SYNC_URL    isla (default http://127.0.0.1:8000)
  RALLY_SYNC_TOKEN  token de sync de la isla (header X-Rally-Sync-Token)
  RALLY_SYNC_ROOT   raiz del repo del rally (default: carpeta padre de este script)
  RALLY_ACTOR       etiqueta de actor (default: agente_local:opencode)

Comandos:
  --check   compara hashes locales contra la isla, sin escribir nada.
  --push    sube a la isla los archivos locales que cambiaron (un ciclo).
  --pull    baja de la isla los cambios publicados desde el ultimo cursor.
  --watch   push en bucle (2 s de pausa). Ctrl+C para parar.

Conflictos: nunca se pisa un lado al otro en silencio. El contenido del lado
remoto queda en .rally-nube/conflicto/<ruta> para que un humano lo revise.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import pathlib

here = str(pathlib.Path(__file__).resolve().parent)
if here not in sys.path:
    sys.path.insert(0, here)

from nube_store import SYNCABLE_PATHS  # noqa: E402

try:
    from content_store import ContentStore  # junto al servicio local
except ImportError:
    from scripts.content_store import ContentStore  # noqa: E402

DEFAULT_URL = os.environ.get("RALLY_SYNC_URL") or "http://127.0.0.1:8000"
DEFAULT_TOKEN = os.environ.get("RALLY_SYNC_TOKEN") or ""
DEFAULT_ROOT = os.environ.get("RALLY_SYNC_ROOT") or ""
DEFAULT_ACTOR = os.environ.get("RALLY_ACTOR") or "agente_local:opencode"
DEFAULT_PROJECT = os.environ.get("RALLY_PROJECT") or "main"

CURSOR_FILE = ".rally-nube.json"
CONFLICT_DIR = pathlib.Path(".rally-nube") / "conflicto"


def _sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _read_json(resp_bytes: bytes) -> dict:
    try:
        return json.loads(resp_bytes.decode("utf-8"))
    except Exception:
        return {}


def _request(base_url: str, method: str, endpoint: str, token: str,
             body: dict | None = None, params: dict | None = None) -> tuple[int, dict]:
    url = base_url.rstrip("/") + endpoint
    if params:
        url += "?" + urllib.parse.urlencode(params)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Accept", "application/json")
    if token:
        req.add_header("X-Rally-Sync-Token", token)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, _read_json(resp.read())
    except urllib.error.HTTPError as exc:
        payload = exc.read() or b"{}"
        return exc.code, _read_json(payload)


def _remote_snapshot(cfg) -> dict:
    code, payload = _request(cfg["url"], "GET", "/api/sync/files", cfg["token"],
                             params={"project": cfg["project"]})
    if code != 200:
        raise SystemExit(f"la isla no respondio bien ({code}): {payload}")
    return {f["path"]: f for f in payload.get("files", [])}


def _plain_data_dir(root: pathlib.Path) -> pathlib.Path:
    return root / "dashboard" / "data"


def _data_dir(root: pathlib.Path, plain: bool = False) -> pathlib.Path:
    """DATA_DIR local del servicio.

    Con `plain=True` (raiz explicita del puente) se usa <root>/dashboard/data;
    si no, se respeta RALLY_DATA_DIR como lo resuelve el servicio.
    """
    if plain:
        return _plain_data_dir(root)
    env = os.environ.get("RALLY_DATA_DIR", "")
    if env:
        p = pathlib.Path(env)
        return p if p.is_absolute() else root / p
    return _plain_data_dir(root)


def _local_path(root: pathlib.Path, rel: str, data_dir: pathlib.Path | None = None) -> pathlib.Path:
    """Ruta local de un archivo nube.

    brief.json y demas viven en la raiz del repo; el buzon cooperativo vive en
    el DATA_DIR del servicio local (dashboard/data/).
    """
    limpio = rel.replace("\\", "/")
    if limpio.startswith("content_decisiones/") or limpio.startswith("content/"):
        return (data_dir or _data_dir(root)) / pathlib.Path(limpio)
    return root / pathlib.Path(limpio)


def _local_files(root: pathlib.Path, data_dir: pathlib.Path | None = None) -> dict[str, str]:
    out = {}
    for rel in SYNCABLE_PATHS:
        f = root / rel
        if f.is_file():
            try:
                out[rel] = f.read_text(encoding="utf-8")
            except Exception as exc:
                print(f"  AVISO: no se pudo leer {rel}: {exc}")
    # sobres del buzón local (Fase 2.3): <data_dir>/content/*.json
    buzon = (data_dir or _data_dir(root)) / "content"
    if buzon.is_dir():
        for sobre in sorted(buzon.glob("*.json")):
            rel = "content/" + sobre.name
            try:
                out[rel] = sobre.read_text(encoding="utf-8")
            except Exception as exc:
                print(f"  AVISO: no se pudo leer el sobre {sobre.name}: {exc}")
    return out


def _save_cursor(root: pathlib.Path, cursor: int, last_seen: dict | None = None) -> None:
    doc = {}
    f = root / CURSOR_FILE
    if f.is_file():
        try:
            doc = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            doc = {}
    doc["cursor"] = cursor
    if last_seen is not None:
        doc["last_seen"] = last_seen
    f.write_text(json.dumps(doc), encoding="utf-8")


def _load_cursor(root: pathlib.Path) -> tuple[int, dict]:
    f = root / CURSOR_FILE
    if not f.is_file():
        return 0, {}
    try:
        doc = json.loads(f.read_text(encoding="utf-8"))
        return int(doc.get("cursor", 0)), dict(doc.get("last_seen") or {})
    except Exception:
        return 0, {}


def _write_conflict(root: pathlib.Path, rel: str, remote: dict) -> None:
    clean = pathlib.Path(rel.replace("\\", "/"))
    target = root / CONFLICT_DIR / clean
    target.parent.mkdir(parents=True, exist_ok=True)
    content = remote.get("content", "")
    target.write_text(content if isinstance(content, str) else json.dumps(remote),
                      encoding="utf-8")
    print(f"  CONFLICTO en {rel}: remoto guardado en {target.relative_to(root)}")
    print(f"    version remota {remote.get('version')} de {remote.get('actor')}"
          f"; revisa las dos versiones y decide antes de volver a subir.")


def cfg_from_args(args) -> dict:
    raiz = pathlib.Path(args.root or DEFAULT_ROOT
                         or pathlib.Path(__file__).resolve().parent.parent)
    return {
        "url": args.url or DEFAULT_URL,
        "token": args.token if args.token is not None else DEFAULT_TOKEN,
        "root": raiz,
        # raiz explicita -> DATA_DIR plano de esa raiz; default -> respeta env
        "data_dir": _data_dir(raiz, plain=bool(args.root)),
        "actor": args.actor or DEFAULT_ACTOR,
        "project": args.project or DEFAULT_PROJECT,
    }


def do_check(cfg, args) -> None:
    remote = _remote_snapshot(cfg)
    local = _local_files(cfg["root"], cfg["data_dir"])
    print(f"Isla: {cfg['url']} (proyecto {cfg['project']})")
    for rel in SYNCABLE_PATHS:
        rem = remote.get(rel)
        loc = local.get(rel)
        loc_sha = _sha256_text(loc) if loc is not None else ""
        if rem is None and loc is None:
            state = "ausente en ambos"
        elif rem is None:
            state = "solo local (nunca subido)"
        elif loc is None:
            state = "solo en la isla"
        elif rem["sha256"] == loc_sha:
            state = "igual"
        else:
            state = "DIFERENTE"
        extra = f"  v{rem['version']} ({rem['actor']})" if rem else ""
        print(f"  [{state}] {rel}{extra}")


def do_push(cfg, args) -> None:
    remote = _remote_snapshot(cfg)
    _, last_seen = _load_cursor(cfg["root"])
    local = _local_files(cfg["root"], cfg["data_dir"])
    pend = []
    alinear = {}
    for rel, content in local.items():
        local_sha = _sha256_text(content)
        rem = remote.get(rel)
        rem_sha = rem["sha256"] if rem else ""
        if rem_sha == local_sha:
            alinear[rel] = rem_sha  # la isla ya tiene este mismo contenido
            continue
        # old_hash = lo que el puente ULTIMO VIO publicado. Si la isla avanzo
        # despues de esa vista (humano en web), old_hash no coincide y la isla
        # responde con conflicto y el contenido remoto: nunca se pisara sin ruido.
        pend.append({"path": rel, "content": content, "old_hash": last_seen.get(rel, "")})
    if not pend and not alinear:
        print("push: nada que subir; local e isla van parejos.")
        return
    code, payload = _request(cfg["url"], "POST", "/api/sync/push", cfg["token"],
                             body={"files": pend, "actor": cfg["actor"]},
                             params={"project": cfg["project"]}) if pend else (204, {})
    if code not in (200, 207, 204):
        raise SystemExit(f"push rechazado ({code}): {payload}")
    resultados = payload.get("results", [])
    n_ok = 0
    if alinear:
        _, visto = _load_cursor(cfg["root"])
        justo = dict(visto)
        justo.update(alinear)
    else:
        justo = last_seen
    actualizados = {}
    for res in resultados:
        if res.get("status") == "pushed":
            n_ok += 1
            print(f"  subido: {res['path']} (version {res.get('version')})")
            actualizados[res["path"]] = res.get("sha256")
        elif res.get("status") == "conflict":
            rem = res.get("remote") or {}
            _write_conflict(cfg["root"], res.get("path"), rem)
    if actualizados:
        justo = dict(justo)
        justo.update(actualizados)
        # La vista del puente queda al dia solo con lo que la isla ACEPTO.
    _save_cursor(cfg["root"], _load_cursor_raw(cfg["root"]), justo)
    print(f"push: {n_ok}/{len(resultados)} archivos al dia.")


def _load_cursor_raw(root: pathlib.Path) -> int:
    return _load_cursor(root)[0]


def do_pull(cfg, args) -> None:
    cursor, _ = _load_cursor(cfg["root"])
    code, feed = _request(cfg["url"], "GET", "/api/sync/changes", cfg["token"],
                          params={"project": cfg["project"], "since": cursor})
    if code != 200:
        raise SystemExit(f"pull rechazado ({code}): {feed}")
    cambios = feed.get("changes", [])
    if not cambios:
        print("pull: sin cambios nuevos desde el cursor.")
        return
    last_by_path = {}
    for ch in cambios:
        last_by_path[ch["path"]] = ch  # el feed va ASC: queda el ultimo de cada ruta
    aplicados, conflictos = 0, 0
    _, last_seen = _load_cursor(cfg["root"])
    # PASO 1: decisiones web primero -- si el mismo lote trae el delete del
    # sobre, la decision debe correr ANTES de limpiar el buzon local.
    decisiones = [p for p in last_by_path if p.startswith("content_decisiones/")]
    for rel in decisiones:
        ch = last_by_path.pop(rel)
        codef, payload = _request(cfg["url"], "GET", "/api/sync/file", cfg["token"],
                                  params={"project": cfg["project"], "path": rel})
        if codef != 200:
            print(f"  ERROR: no se pudo pedir la decision {rel} ({codef})")
            continue
        data = payload.get("file") or {}
        content = data.get("content") or ""
        if _aplicar_decision_local(cfg["data_dir"], content):
            last_seen[rel] = ch["sha256_new"]
    for rel, ch in last_by_path.items():
        if ch["change_type"] == "delete":
            last_seen.pop(rel, None)
            # un sobre pendiente retirado por la web: limpiar silenciosamente
            if rel.startswith("content/"):
                _local_path(cfg["root"], rel, cfg["data_dir"]).unlink(missing_ok=True)
                print(f"  sobre retirado en la web: {rel}")
            else:
                print(f"  borrado remoto en {rel}: se deja el archivo local sin tocar"
                      f" (la nube ya no lo publica).")
            continue
        codef, payload = _request(cfg["url"], "GET", "/api/sync/file", cfg["token"],
                                  params={"project": cfg["project"], "path": rel})
        if codef != 200:
            print(f"  ERROR: no se pudo pedir {rel} ({codef})")
            continue
        data = payload.get("file") or {}
        content = data.get("content") or ""
        if rel.startswith("content_decisiones/"):
            decision = _aplicar_decision_local(cfg["data_dir"], content)
            if decision:
                last_seen[rel] = ch["sha256_new"]
            continue
        rel_path = pathlib.Path(rel.replace("\\", "/"))
        target = _local_path(cfg["root"], rel, cfg["data_dir"])
        if target.is_file():
            local_text = target.read_text(encoding="utf-8")
            if _sha256_text(local_text) == ch["sha256_new"]:
                last_seen[rel] = ch["sha256_new"]  # ya lo tengo;quiero actualizar mi vista
            else:
                conflictos += 1
                _write_conflict(cfg["root"], rel,
                                {"content": content, "version": ch.get("version"),
                                 "actor": ch.get("actor")})
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
            last_seen[rel] = ch["sha256_new"]
            aplicados += 1
            print(f"  bajado desde cero: {rel} (version {ch.get('version')} de {ch.get('actor')})")
    _save_cursor(cfg["root"], int(feed.get("cursor") or cursor), last_seen)
    print(f"pull: {aplicados} bajados, {conflictos} en conflicto, cursor en {feed.get('cursor')}.")


def _aplicar_decision_local(data_dir: pathlib.Path, content: str) -> bool:
    """Ejecuta la decision web (apply/discard) sobre el buzon local.

    Asume el sobre ya presente en <data_dir>/content/<id>.json (bajado por el
    propio pull). Si ya no existe, la decision ya se habia aplicado: ok.
    """
    try:
        dec = json.loads(content)
    except Exception:
        print("  ERROR: decision remota no legible")
        return False
    item_id = str(dec.get("id") or "")
    action = str(dec.get("action") or "")
    if action not in ("apply", "discard") or not item_id:
        print(f"  ERROR: decision invalida para {item_id!r} ({action!r})")
        return False
    sobre = data_dir / "content" / (item_id + ".json")
    estaba = sobre.is_file()
    store = ContentStore(data_dir)
    try:
        if action == "apply":
            store.apply(item_id)
        else:
            store.discard(item_id)
        if not estaba:
            # el sobre ya no estaba: apply() es no-op silencioso, avisar con
            # honestidad y tratar como ya resuelto (otro lado decidio).
            print(f"  decision {action} {item_id}: el sobre no estaba localmente"
                  f" (ya decidido o nunca bajado)")
            return True
        if sobre.is_file():
            print(f"  ERROR: el sobre {item_id} no se movio al {action}; estado local duro")
            return False
        print(f"  decision web aplicada localmente: {action} {item_id}"
              f" (por {dec.get('decision_by') or 'humano:web'})")
        return True
    except Exception as exc:
        print(f"  ERROR al aplicar decision {action} {item_id}: {exc}")
        return False


def do_watch(cfg, args) -> None:
    print(f"watch: subiendo cambios locales a {cfg['url']} (Ctrl+C para parar)")
    try:
        while True:
            try:
                do_push(cfg, args)
            except SystemExit as exc:
                print(f"  ciclo fallido: {exc}")
            time.sleep(2.0)
    except KeyboardInterrupt:
        print("watch: parado.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Puente de archivos del rally con la isla.")
    parser.add_argument("--url", help="URL de la isla (default RALLY_SYNC_URL o localhost:8000)")
    parser.add_argument("--token", help="token de sync (default RALLY_SYNC_TOKEN)")
    parser.add_argument("--root", help="raiz del repo del rally")
    parser.add_argument("--actor", help="etiqueta de actor para el feed")
    parser.add_argument("--project", help="id de proyecto en la isla (default main)")
    parser.add_argument("--check", action="store_true", help="comparar, sin escribir")
    parser.add_argument("--push", action="store_true", help="subir cambios locales (un ciclo)")
    parser.add_argument("--pull", action="store_true", help="bajar cambios de la isla")
    parser.add_argument("--watch", action="store_true", help="subir en bucle cada 2 s")
    args = parser.parse_args()
    if not (args.check or args.push or args.pull or args.watch):
        parser.error("elige --check, --push, --pull o --watch")
    cfg = cfg_from_args(args)
    if args.check:
        do_check(cfg, args)
    if args.push:
        do_push(cfg, args)
    if args.pull:
        do_pull(cfg, args)
    if args.watch:
        do_watch(cfg, args)


if __name__ == "__main__":
    main()
