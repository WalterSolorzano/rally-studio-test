#!/usr/bin/env python3
"""Crea el proyecto local, su admin y la primera invitación.

Uso:
    python scripts/crear_proyecto.py --project equipo01 --name "Ana"

Imprime un JSON con el token del admin y la URL de la primera invitación.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

try:
    from member_store import MemberStore
except ImportError:
    from scripts.member_store import MemberStore

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA_DIR = REPO_ROOT / "dashboard" / "data"


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Alta de proyecto local")
    parser.add_argument("--project", default="main")
    parser.add_argument("--name", required=True, help="nombre del admin")
    parser.add_argument("--data-dir", default=None)
    parser.add_argument("--ttl-hours", type=int, default=48)
    args = parser.parse_args(argv)

    project = (args.project or "main").strip()
    if not re.match(r"^[A-Za-z0-9_-]{1,64}$", project):
        print(json.dumps({"error": "proyecto-invalido"}, ensure_ascii=False))
        return 2

    data_dir = Path(args.data_dir or os.environ.get("RALLY_DATA_DIR", str(DEFAULT_DATA_DIR)))
    store = MemberStore(data_dir / "members.db")
    if store.has_members(project):
        print(json.dumps({"error": "proyecto-existente", "project": project}, ensure_ascii=False))
        return 2

    try:
        created = store.bootstrap(project, args.name, "admin-cli")
        invite = store.create_invite(project, created["member"]["id"], args.ttl_hours)
    except ValueError as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False))
        return 2

    print(json.dumps({
        "project": project,
        "token": created["token"],
        "join_url": invite["url_path"],
        "member": created["member"],
        "expires_at": invite["expires_at"],
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
