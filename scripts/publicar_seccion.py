#!/usr/bin/env python3
"""Escribe una sección directamente en el servidor de Rally Studio.

Uso:
    python scripts/publicar_seccion.py --project equipo01 \
        --section pautado.problema --text "Texto" --token <sesión>

La IA no pasa por Aceptar/Descartar. Si otra persona guardó antes, el servidor
responde 409 y este script termina con código 2 sin pisar nada.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


class Conflicto(Exception):
    def __init__(self, body):
        super().__init__("conflicto")
        self.body = body


class Bloqueada(Exception):
    def __init__(self, body):
        super().__init__("bloqueada")
        self.body = body


class NoAutorizado(Exception):
    def __init__(self, body):
        super().__init__("no-autorizado")
        self.body = body


def _request(method: str, url: str, payload, token: str, timeout: float = 8.0):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            body = json.loads(raw) if raw else {}
            return resp.status, body
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            body = json.loads(raw) if raw else {}
        except ValueError:
            body = {"raw": raw}
        return exc.code, body


def publicar(server: str, project: str, section: str, data, token: str,
             base_version: int | None = None, actor: str = "IA") -> dict:
    base = server.rstrip("/")
    query = urllib.parse.urlencode({"project": project})
    if base_version is None:
        status, body = _request(
            "GET", f"{base}/api/sections?{query}&since=0", None, token
        )
        if status in (401, 403):
            raise NoAutorizado(body)
        if status >= 400:
            raise RuntimeError(f"servidor respondió {status}")
        current = (body.get("sections") or {}).get(section) or {}
        base_version = int(current.get("version") or 0)

    status, body = _request(
        "POST",
        f"{base}/api/sections/{urllib.parse.quote(section, safe='')}?{query}",
        {
            "data": data,
            "base_version": base_version,
            "actor": actor,
            "actor_id": "ia",
        },
        token,
    )
    if status == 409:
        raise Conflicto(body)
    if status == 423:
        raise Bloqueada(body)
    if status in (401, 403):
        raise NoAutorizado(body)
    if status >= 400:
        raise RuntimeError(f"servidor respondió {status}: {body}")
    return body


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Publicar una sección directamente")
    parser.add_argument("--project", required=True)
    parser.add_argument("--section", required=True)
    parser.add_argument("--text")
    parser.add_argument("--payload", help="archivo JSON con el dato de la sección")
    parser.add_argument("--token", default=os.environ.get("RALLY_SESSION_TOKEN", ""))
    parser.add_argument("--server", default=os.environ.get("RALLY_SERVER", "http://127.0.0.1:8000"))
    parser.add_argument("--base-version", type=int)
    parser.add_argument("--actor", default="IA")
    args = parser.parse_args(argv)

    if args.text is None and not args.payload:
        print("Falta --text o --payload", file=sys.stderr)
        return 1
    if args.text is not None:
        data = args.text
    else:
        try:
            data = json.loads(Path(args.payload).read_text(encoding="utf-8-sig"))
        except (OSError, ValueError) as exc:
            print(f"No se pudo leer el payload: {exc}", file=sys.stderr)
            return 1

    if not args.token:
        print("Falta --token o RALLY_SESSION_TOKEN", file=sys.stderr)
        return 4

    try:
        body = publicar(args.server, args.project, args.section, data,
                        args.token, args.base_version, args.actor)
    except Conflicto as exc:
        print(json.dumps({"ok": False, "error": "conflicto", **exc.body}, ensure_ascii=False))
        return 2
    except Bloqueada as exc:
        print(json.dumps({"ok": False, "error": "bloqueada", **exc.body}, ensure_ascii=False))
        return 3
    except NoAutorizado as exc:
        print(json.dumps({"ok": False, "error": "no-autorizado", **exc.body}, ensure_ascii=False))
        return 4
    except (urllib.error.URLError, OSError, RuntimeError) as exc:
        print(f"No se pudo publicar: {exc}", file=sys.stderr)
        return 4

    section = body.get("section") or {}
    print(json.dumps({
        "ok": True,
        "section": section,
        "version": section.get("version"),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
