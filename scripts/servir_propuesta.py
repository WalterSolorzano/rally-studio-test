#!/usr/bin/env python3
"""Deja una propuesta de contenido en el buzón de Rally Studio.

Uso:
    python scripts/servir_propuesta.py --tab pautado --slot problema \
        --kind text --title "Propuesta de problema" --payload propuesta.json

El archivo --payload es el `payload` del sobre (JSON). La propuesta aparece en
la ventana (a) como aceptar/descartar; no se aplica sola.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

try:
    from content_store import ALLOWED_TABS, SLOTS_BY_TAB, validate_envelope
    from publicar_seccion import Bloqueada, Conflicto, NoAutorizado, publicar
except ImportError:  # cuando se ejecuta desde la raíz del repo
    from scripts.content_store import ALLOWED_TABS, SLOTS_BY_TAB, validate_envelope
    from scripts.publicar_seccion import Bloqueada, Conflicto, NoAutorizado, publicar

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA_DIR = REPO_ROOT / "dashboard" / "data"

SECCION_POR_TAB = {
    "pautado": lambda slot: f"pautado.{slot}",
    "script": lambda slot: f"script.{slot}",
    "budget": lambda slot: "budget",
    "canvas": lambda slot: "model_canvas",
    "challenges": lambda slot: "challenges",
    "resources": lambda slot: "resources",
}


def seccion_destino(tab: str, slot: str):
    fn = SECCION_POR_TAB.get(tab)
    return fn(slot) if fn else None


def dato_directo(tab: str, payload):
    """Convierte el payload del sobre al dato que guarda la sección."""
    if tab in ("pautado", "script") and isinstance(payload, dict):
        return payload.get("text", payload)
    if tab == "budget" and isinstance(payload, dict) and "items" in payload:
        return payload["items"]
    return payload


def construir_sobre(args) -> dict:
    payload_path = Path(args.payload)
    payload = json.loads(payload_path.read_text(encoding="utf-8-sig"))
    if not isinstance(payload, dict):
        payload = {"value": payload}

    return {
        "id": f"{args.tab}-{args.slot}-{uuid.uuid4().hex[:8]}",
        "tab": args.tab,
        "slot": args.slot,
        "kind": args.kind,
        "title": args.title,
        "source": args.source,
        "created_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "confidence": args.confidence,
        "simulated": bool(args.simulated),
        "payload": payload,
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Servir una propuesta al buzón de Rally Studio")
    parser.add_argument("--tab", required=True, help=f"una de: {', '.join(ALLOWED_TABS)}")
    parser.add_argument("--slot", required=True, help="slot dentro de la pestaña")
    parser.add_argument("--kind", required=True, help="tipo de contenido (text, budget-json, ...)")
    parser.add_argument("--title", required=True)
    parser.add_argument("--payload", required=True, help="archivo JSON con el payload")
    parser.add_argument("--source", default="")
    parser.add_argument("--confidence", default="media")
    parser.add_argument("--simulated", action="store_true", help="marcar como dato simulado")
    parser.add_argument("--token", default=os.environ.get("RALLY_SESSION_TOKEN", ""))
    parser.add_argument("--server", default=os.environ.get("RALLY_SERVER", "http://127.0.0.1:8000"))
    parser.add_argument("--project", default=os.environ.get("RALLY_PROJECT", "main"))
    parser.add_argument("--mailbox", action="store_true",
                        help="forzar el buzón aunque haya token")
    args = parser.parse_args(argv)

    try:
        sobre = construir_sobre(args)
    except (OSError, ValueError) as exc:
        print(f"No se pudo leer el payload: {exc}", file=sys.stderr)
        return 2

    errores = validate_envelope(sobre)
    if errores:
        for error in errores:
            print(f"- {error}", file=sys.stderr)
        print(
            f"Slots válidos para {sobre['tab']}: {', '.join(SLOTS_BY_TAB.get(sobre['tab'], []))}",
            file=sys.stderr,
        )
        return 1

    seccion = seccion_destino(args.tab, args.slot)
    if seccion and args.token and not args.simulated and not args.mailbox:
        try:
            body = publicar(
                args.server, args.project, seccion,
                dato_directo(args.tab, sobre["payload"]),
                args.token,
            )
        except Conflicto as exc:
            print(json.dumps({"ok": False, "error": "conflicto", **exc.body}, ensure_ascii=False))
            return 2
        except Bloqueada as exc:
            print(json.dumps({"ok": False, "error": "bloqueada", **exc.body}, ensure_ascii=False))
            return 3
        except NoAutorizado as exc:
            print(json.dumps({"ok": False, "error": "no-autorizado", **exc.body}, ensure_ascii=False))
            return 4
        section = body.get("section") or {}
        print(json.dumps({
            "ok": True, "mode": "directo", "section": seccion,
            "version": section.get("version"),
        }, ensure_ascii=False))
        return 0

    data_dir = Path(os.environ.get("RALLY_DATA_DIR", str(DEFAULT_DATA_DIR)))
    content_dir = data_dir / "content"
    content_dir.mkdir(parents=True, exist_ok=True)

    destino = content_dir / f"{sobre['id']}.json"
    destino.write_text(json.dumps(sobre, ensure_ascii=False, indent=2), encoding="utf-8")

    print(destino)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
