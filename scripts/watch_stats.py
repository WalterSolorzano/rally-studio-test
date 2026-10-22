#!/usr/bin/env python3
"""Watch the live rally state and generate the recap automatically.

Triggers once at T-1h and once at T-0 (or as soon as the watcher notices the
window). The recap is deterministic: it is rebuilt from state.json and the
project files, never from a hand-written demo object.

Usage:
    python scripts/watch_stats.py --once
    python scripts/watch_stats.py --interval 300
    python scripts/watch_stats.py --once --dry-run

The proposal is served to the `timeline` tab. That tab has no Accept mapping,
so the card is a notice: it cannot overwrite project state by accident.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE_PATH = ROOT / "dashboard" / "data" / "state.json"
STATUS_PATH = ROOT / "dashboard" / "data" / "stats.status.json"
GENERATED_PATH = ROOT / "dashboard" / "data" / "stats.generated.json"
BUILD_SCRIPT = ROOT / "scripts" / "build_stats.py"
SERVE_SCRIPT = ROOT / "scripts" / "servir_propuesta.py"


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def read_json(path: Path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return fallback


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def phase_for(hours_remaining: float, started: bool, team: str) -> str:
    if not started or not team:
        return "idle"
    if hours_remaining <= 0:
        return "final"
    if hours_remaining <= 1:
        return "t-1h"
    return "mid"


def run_build(phase: str) -> dict:
    env = dict(os.environ)
    env["PYTHONIOENCODING"] = "utf-8"
    proc = subprocess.run(
        [sys.executable, str(BUILD_SCRIPT), "--phase", phase],
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "build_stats.py failed").strip())
    return read_json(GENERATED_PATH, {}) or {}


def serve_notice(phase: str, project: str) -> tuple[bool, str]:
    title = (
        f"Resumen final listo · {project}"
        if phase == "final"
        else f"Queda 1 h · resumen listo · {project}"
    )
    message = (
        "La sesión cerró. Abre dashboard/stats.html para ver el resumen final."
        if phase == "final"
        else "Queda una hora. Abre dashboard/stats.html para revisar los frentes abiertos."
    )
    payload = {
        "text": message,
        "url": "dashboard/stats.html",
        "phase": phase,
        "generated_at": now_iso(),
    }
    tmp_name = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", suffix=".json", delete=False, encoding="utf-8", dir=str(ROOT / "dashboard" / "data")
        ) as handle:
            json.dump(payload, handle, ensure_ascii=False)
            tmp_name = handle.name
        proc = subprocess.run(
            [
                sys.executable,
                str(SERVE_SCRIPT),
                "--tab",
                "timeline",
                "--slot",
                "main",
                "--kind",
                "text",
                "--title",
                title,
                "--source",
                "watch_stats.py · dashboard/stats.html",
                "--payload",
                tmp_name,
            ],
            cwd=str(ROOT),
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        if proc.returncode != 0:
            return False, (proc.stderr or proc.stdout or "servir_propuesta.py failed").strip()
        return True, (proc.stdout or "proposal served").strip()
    finally:
        if tmp_name:
            try:
                os.unlink(tmp_name)
            except OSError:
                pass


def check_once(dry_run: bool = False) -> dict:
    state = read_json(STATE_PATH, {}) or {}
    status = read_json(STATUS_PATH, {}) or {}
    start = str(state.get("start_timestamp") or "")
    hours = float(state.get("hours_remaining") or 0)
    phase = phase_for(hours, bool(state.get("rally_started")), str(state.get("team_name") or "").strip())
    key = f"{start}:{phase}"
    notified = status.get("notified") if isinstance(status.get("notified"), dict) else {}
    eligible = phase in ("t-1h", "final") and not notified.get(key)

    record = {
        "checked_at": now_iso(),
        "phase": phase,
        "hours_remaining": round(hours, 2),
        "start_timestamp": start,
        "team_name": str(state.get("team_name") or "").strip(),
        "project_name": str(state.get("project_name") or "").strip(),
        "eligible": eligible,
        "notified": notified,
        "last_generated_at": status.get("last_generated_at"),
        "last_notice": status.get("last_notice"),
        "last_error": None,
    }

    if not eligible:
        if not dry_run:
            write_json(STATUS_PATH, record)
        return record

    if dry_run:
        record["would_generate"] = True
        record["would_notify"] = f"{phase}:{start}"
        return record

    try:
        generated = run_build(phase)
        project = (generated.get("session") or {}).get("project_name") or record["project_name"] or "Rally Studio"
        ok, output = serve_notice(phase, project)
        record["last_generated_at"] = (generated.get("_meta") or {}).get("generated_at") or now_iso()
        record["last_notice"] = {
            "at": now_iso(),
            "phase": phase,
            "ok": ok,
            "output": output,
        }
        if ok:
            notified[key] = True
            record["notified"] = notified
        else:
            record["last_error"] = output
    except Exception as exc:  # noqa: BLE001 - the watcher must keep running
        record["last_error"] = str(exc)

    write_json(STATUS_PATH, record)
    return record


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the recap at T-1h and T-0.")
    parser.add_argument("--once", action="store_true", help="Check once and exit.")
    parser.add_argument("--interval", type=int, default=300, help="Seconds between checks (default 300).")
    parser.add_argument("--dry-run", action="store_true", help="Report what would happen without writing or notifying.")
    args = parser.parse_args()

    while True:
        record = check_once(dry_run=args.dry_run)
        print(
            f"[{record['checked_at']}] phase={record['phase']} "
            f"remaining={record['hours_remaining']}h eligible={record['eligible']} "
            f"notified={record['notified']}"
            + (f" error={record['last_error']}" if record.get("last_error") else "")
        )
        if args.once:
            return 0 if not record.get("last_error") else 1
        time.sleep(max(30, args.interval))


if __name__ == "__main__":
    raise SystemExit(main())
