#!/usr/bin/env python3
"""Generate dashboard/data/stats.generated.js from the current project.

The page is a rendering surface, not a source of truth. This script reads the
live session (dashboard/data/state.json) and the project artifacts on disk,
derives every visible number, and labels conflicts instead of merging them.

Run from the repository root:
    python scripts/build_stats.py
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import unicodedata
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE_PATH = ROOT / "dashboard" / "data" / "state.json"
CLAIMS_PATH = ROOT / "research" / "claims.json"
BUDGET_PATH = ROOT / "budget" / "budget.json"
SHOTLIST_PATH = ROOT / "script" / "shotlist.csv"
SCRIPT_PATH = ROOT / "script" / "script.md"
NARRATION_PATH = ROOT / "script" / "narration.txt"
CANVAS_PATH = ROOT / "docs" / "canvas.md"
BIBLIOGRAPHY_PATH = ROOT / "docs" / "bibliography.md"
SITE_PATH = ROOT / "site" / "index.html"
DOSSIER_PATH = ROOT / "PROYECTO_DOSSIER_COMPLETO.md"
OUT_JSON = ROOT / "dashboard" / "data" / "stats.generated.json"
OUT_JS = ROOT / "dashboard" / "data" / "stats.generated.js"

DELIVERABLE_LABELS = {
    "reto": "Reto",
    "pautado_problema": "Problema",
    "pautado_solucion": "Solución",
    "pautado_impacto": "Impacto",
    "presupuesto": "Presupuesto",
    "canvas": "Canvas",
    "despacho": "Despacho",
}
PAUTADO_KEYS = ["problema", "solucion", "impacto", "innovacion", "prefactibilidad"]
PAUTADO_LABELS = {
    "problema": "Problema",
    "solucion": "Solución",
    "impacto": "Impacto",
    "innovacion": "Innovación",
    "prefactibilidad": "Prefactibilidad",
}
SCRIPT_KEYS = ["acto1", "acto2", "acto3", "acto4"]
AVATARS = [
    "assets/stats/avatar-1.svg",
    "assets/stats/avatar-2.svg",
    "assets/stats/avatar-3.svg",
]
ACCENTS = ["#0866F5", "#0284C7", "#1D4ED8"]


def read_json(path: Path, fallback):
    try:
        with path.open("r", encoding="utf-8-sig") as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return fallback


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8-sig", errors="replace")
    except OSError:
        return ""


def exists(path: Path) -> bool:
    return path.exists()


def mtime_label(path: Path) -> str:
    if not path.exists():
        return ""
    return datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d %H:%M")


def clean(value) -> str:
    return str(value or "").strip()


def slug(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    ascii_value = decomposed.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-") or "person"


def initials(name: str) -> str:
    parts = [part for part in re.split(r"\s+", clean(name)) if part]
    if not parts:
        return "—"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def dt_from_ms(ms) -> datetime | None:
    try:
        return datetime.fromtimestamp(float(ms) / 1000.0)
    except (TypeError, ValueError, OSError):
        return None


def hhmm(value: datetime | None) -> str:
    return value.strftime("%H:%M") if value else "—"


def day_short(value: datetime | None) -> str:
    if not value:
        return ""
    names = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]
    return names[value.weekday()]


def pct(part: float, total: float) -> int:
    if not total:
        return 0
    return round((float(part) / float(total)) * 100)


def clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def detect_artifact_project(*texts: str) -> str:
    """Read a project name from a document heading, never from a hardcoded name."""
    for text in texts:
        if not text:
            continue
        for line in text.splitlines():
            line = line.strip()
            if not line.startswith("#"):
                continue
            match = re.search(r"(?:--|—|–)\s*(.+?)\s*$", line)
            if match:
                return clean(match.group(1))
            match = re.search(
                r"^#\s+(?:Guion|Canvas|Proyecto|Dossier|Resumen)[^:—–-]*[:\-—–]\s*(.+)$",
                line,
                re.IGNORECASE,
            )
            if match:
                return clean(match.group(1))
        match = re.search(r"(?im)^\*\*Proyecto:\*\*\s*(.+)$", text)
        if match:
            return clean(match.group(1))
    return ""


def main(phase_override: str | None = None) -> None:
    state = read_json(STATE_PATH, {}) or {}
    brief = read_json(ROOT / "brief.json", {}) or {}
    claims = read_json(CLAIMS_PATH, []) or []
    budget = read_json(BUDGET_PATH, []) or []
    shotlist = []
    if SHOTLIST_PATH.exists():
        with SHOTLIST_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
            shotlist = list(csv.DictReader(handle))

    script_text = read_text(SCRIPT_PATH)
    script_words = len(re.findall(r"\b\w+\b", script_text))
    narration_text = read_text(NARRATION_PATH)
    canvas_text = read_text(CANVAS_PATH)
    bibliography_text = read_text(BIBLIOGRAPHY_PATH)
    site_text = read_text(SITE_PATH)
    dossier_text = read_text(DOSSIER_PATH)

    project_declared = clean(state.get("project_name"))
    artifact_project = detect_artifact_project(script_text, canvas_text, dossier_text) if project_declared else ""

    team_name = clean(state.get("team_name")) or "Tu equipo"
    project_name = project_declared or "Tu proyecto"
    university = clean(state.get("university")) or "Universidad sin registrar"
    city = clean(state.get("city")) or "Ciudad sin registrar"
    challenge_title = clean(state.get("challenge_title")) or "Reto sin registrar"
    challenge_id = clean(state.get("challenge_id"))
    category = clean(state.get("category")) or "Sin categoría"
    rally_type = clean(state.get("rally_type")) or "general"
    duration_h = float(state.get("hours_total") or 0)
    hours_remaining = float(state.get("hours_remaining") or 0)
    elapsed_h = round(max(0.0, duration_h - hours_remaining), 1)
    elapsed_pct = pct(elapsed_h, duration_h)

    start_dt = dt_from_ms(state.get("start_timestamp"))
    end_dt = start_dt + timedelta(hours=duration_h) if start_dt else None

    roster = [p for p in (state.get("team_roster") or []) if clean(p.get("name"))]
    roster_by_name = {clean(p.get("name")): p for p in roster}
    deliverables = state.get("deliverables") or {}

    done_keys = [k for k, v in deliverables.items() if clean((v or {}).get("status")).lower() in {"done", "completed"}]
    progress_keys = [k for k, v in deliverables.items() if clean((v or {}).get("status")).lower() in {"in_progress", "doing"}]
    deliverable_total = len(deliverables)
    has_project_context = bool(project_declared or roster or deliverables)

    pautado = state.get("pautado") or {}
    pautado_sections = [k for k in PAUTADO_KEYS if len(clean(pautado.get(k))) > 0]
    script = state.get("script") or {}
    script_acts = [k for k in SCRIPT_KEYS if len(clean(script.get(k))) > 0]
    state_budget = state.get("budget") or []
    state_claims = state.get("claims") or []
    guardrails = state.get("guardrails") or {}
    guardrails_checked = sum(1 for value in guardrails.values() if value)

    # Signals: session start, roster joins, and every deliverable history event.
    signals = []
    if start_dt:
        signals.append({
            "name": "Sesión",
            "label": "Arranque de la sesión",
            "at": start_dt,
            "kind": "start",
            "deliverable": "",
        })
    for person in roster:
        joined = dt_from_ms(person.get("joined_at"))
        if joined:
            signals.append({
                "name": clean(person.get("name")),
                "label": f"{clean(person.get('name'))} se unió",
                "at": joined,
                "kind": "join",
                "deliverable": "",
            })
    for key, item in deliverables.items():
        label = DELIVERABLE_LABELS.get(key, key.replace("_", " ").title())
        for event in (item or {}).get("history") or []:
            at = dt_from_ms(event.get("at"))
            if not at:
                continue
            signals.append({
                "name": clean(event.get("name")) or "Sin nombre",
                "label": f"{label}: {clean(event.get('action')) or 'movimiento'}",
                "at": at,
                "kind": "deliverable",
                "deliverable": label,
            })
    signals.sort(key=lambda item: item["at"])

    last_signal_dt = signals[-1]["at"] if signals else start_dt

    # Per-person activity.
    people = []
    for index, person in enumerate(roster):
        name = clean(person.get("name"))
        assigned = []
        for key, item in deliverables.items():
            assignees = [clean(a) for a in ((item or {}).get("assignees") or [])]
            if name in assignees:
                assigned.append(DELIVERABLE_LABELS.get(key, key.replace("_", " ").title()))
        own_signals = [s for s in signals if s["name"] == name]
        role_groups = []
        if any(label in {"Problema", "Solución"} for label in assigned):
            role_groups.append("pautado")
        if "Despacho" in assigned:
            role_groups.append("despacho")
        if "Impacto" in assigned:
            role_groups.append("impacto")
        if "Canvas" in assigned:
            role_groups.append("canvas")
        if "Reto" in assigned:
            role_groups.append("reto")
        if "Presupuesto" in assigned:
            role_groups.append("presupuesto")
        role = " y ".join(role_groups[:2]) if role_groups else "sin rol registrado"
        role = role[:1].upper() + role[1:]
        people.append({
            "id": slug(name),
            "name": name,
            "initials": initials(name),
            "role": role,
            "avatar": AVATARS[index] if index < len(AVATARS) else "assets/stats/avatar-empty.svg",
            "frentes": len(assigned),
            "signals": len(own_signals),
            "coverage": pct(len(assigned), deliverable_total),
            "tag": " · ".join(assigned) if assigned else "Sin frentes asignados",
            "accent": ACCENTS[index % len(ACCENTS)],
            "mvp": False,
        })

    people.sort(key=lambda person: (-person["frentes"], -person["signals"], person["name"]))
    for rank, person in enumerate(people, start=1):
        person["rank"] = rank

    mvp = people[0] if people and people[0]["frentes"] > 0 else None
    if mvp:
        mvp["mvp"] = True
        for person in people:
            if person["id"] == mvp["id"]:
                person["mvp"] = True

    team_declared = int(state.get("team_members_count") or 0) or len(roster)
    missing_people = max(0, team_declared - len(roster))
    placeholders = [
        {
            "id": f"sin-registro-{index + 1}",
            "name": "Sin registro",
            "initials": "—",
            "avatar": "assets/stats/avatar-empty.svg",
        }
        for index in range(missing_people)
    ]

    # Hourly rhythm: 28 slots from the start hour. Count signals per slot.
    hour_slots = []
    if start_dt:
        cursor = start_dt.replace(minute=0, second=0, microsecond=0)
        for index in range(int(duration_h)):
            slot_end = cursor + timedelta(hours=1)
            count = sum(1 for signal in signals if cursor <= signal["at"] < slot_end)
            notes = [signal["label"] for signal in signals if cursor <= signal["at"] < slot_end]
            hour_slots.append({
                "label": cursor.strftime("%H"),
                "day": day_short(cursor),
                "date": cursor.strftime("%d %b").upper(),
                "count": count,
                "note": " · ".join(notes) if notes else "",
                "future": bool(last_signal_dt and cursor > last_signal_dt.replace(minute=0, second=0, microsecond=0)),
            })
            cursor = slot_end
    max_count = max((slot["count"] for slot in hour_slots), default=0) or 1
    for slot in hour_slots:
        slot["value"] = round((slot["count"] / max_count) * 100)
        if not slot["note"]:
            slot["note"] = "Aún sin datos registrados." if slot["future"] else "Sin señal registrada."
    peak = max(hour_slots, key=lambda slot: (slot["count"], -int(slot["label"]))) if hour_slots else None
    peak_hour = f"{peak['label']}:00" if peak else "—"
    peak_count = peak["count"] if peak else 0
    if peak and peak["count"]:
        peak_start = start_dt.replace(minute=0, second=0, microsecond=0) + timedelta(hours=hour_slots.index(peak))
        peak_end = peak_start + timedelta(hours=1)
        peak_signals = [signal for signal in signals if peak_start <= signal["at"] < peak_end]
        peak_people = []
        for signal in peak_signals:
            if signal["kind"] == "deliverable" and signal["name"] not in peak_people:
                peak_people.append(signal["name"])
        peak_frentes = []
        for signal in peak_signals:
            if signal["deliverable"] and signal["deliverable"] not in peak_frentes:
                peak_frentes.append(signal["deliverable"])
        peak_note = (
            f"{peak_count} señales de {', '.join(peak_people) or 'el equipo'}: "
            + ", ".join(peak_frentes)
            + "."
        )
    else:
        peak_note = "Todavía no hay suficientes señales para trazar un pico."
    threshold = 50 if peak_count else 0

    # Readiness index: live session only. Artifacts from another project do not count.
    readiness_parts = [
        {"label": "Entregables", "weight": 35, "value": pct(len(done_keys), deliverable_total), "points": round(35 * (len(done_keys) / deliverable_total), 1) if deliverable_total else 0},
        {"label": "Pautado", "weight": 20, "value": pct(len(pautado_sections), 5), "points": round(20 * (len(pautado_sections) / 5), 1)},
        {"label": "Guion", "weight": 15, "value": pct(len(script_acts), 4), "points": round(15 * (len(script_acts) / 4), 1)},
        {"label": "Presupuesto", "weight": 15, "value": 100 if state_budget else 0, "points": 15 if state_budget else 0},
        {"label": "Fuentes", "weight": 10, "value": 100 if len(state_claims) >= 3 else pct(len(state_claims), 3), "points": round(10 * min(len(state_claims) / 3, 1), 1)},
        {"label": "Guardrails", "weight": 5, "value": pct(guardrails_checked, 10), "points": round(5 * min(guardrails_checked / 10, 1), 1)},
    ]
    readiness = round(sum(part["points"] for part in readiness_parts))

    identity_conflict = bool(project_declared and artifact_project) and artifact_project.casefold() != project_name.casefold()
    budget_conflict = has_project_context and bool(budget) and len(state_budget) != len(budget)
    claims_conflict = has_project_context and bool(claims) and len(state_claims) != len(claims)
    team_gap = has_project_context and len(roster) < team_declared
    brief_gap = has_project_context and not any(clean(brief.get(key)) for key in ("project_name", "team_name", "university", "city"))
    budget_total = sum(float(row.get("total") or 0) for row in budget)

    # Critical gaps: only what is actually open in the live session.
    critical_all = []
    if not state_budget:
        budget_desc = f"La sesión tiene 0 filas de presupuesto."
        if budget:
            budget_desc += f" En disco hay {len(budget)} filas por USD {budget_total:,.0f}"
            budget_desc += (
                ", pero el material en disco pertenece a otra versión y no se mezcla."
                if identity_conflict
                else ", pero no están cargadas en la sesión."
            )
        critical_all.append({
            "time": f"0 / {len(budget)}",
            "severity": "alta",
            "title": "Presupuesto sin filas en la sesión",
            "desc": budget_desc,
            "status": "abierto",
            "action": "Cargar o reemplazar el presupuesto de este proyecto.",
        })

    if len(script_acts) < 4:
        script_desc = f"La sesión tiene {len(script_acts)} de 4 actos escritos."
        if script_words:
            script_desc += f" script.md tiene {script_words} palabras"
            script_desc += (
                ", pero el archivo en disco pertenece a otra versión."
                if identity_conflict
                else ", pero la sesión no las tiene cargadas."
            )
        critical_all.append({
            "time": f"{len(script_acts)} / 4",
            "severity": "alta",
            "title": "Guion sin actos",
            "desc": script_desc,
            "status": "abierto",
            "action": "Escribir los actos que faltan y asignar el narrador.",
        })

    if len(pautado_sections) < 5:
        missing_sections = [
            PAUTADO_LABELS.get(key, key.title())
            for key in PAUTADO_KEYS
            if key not in pautado_sections
        ]
        critical_all.append({
            "time": f"{len(pautado_sections)} / 5",
            "severity": "media",
            "title": "Pautado a medias",
            "desc": f"Faltan {len(missing_sections)} secciones: {', '.join(missing_sections)}.",
            "status": "abierto",
            "action": f"Cerrar {', '.join(missing_sections)}.",
        })

    if len(state_claims) < 3:
        claims_desc = f"La sesión tiene {len(state_claims)} de 3 fuentes cargadas."
        if claims:
            claims_desc += f" En disco hay {len(claims)} claims con URL"
            claims_desc += (
                ", pero el material en disco pertenece a otra versión y no se mezcla."
                if identity_conflict
                else ", pero no están cargadas en la sesión."
            )
        critical_all.append({
            "time": f"{len(state_claims)} / 3",
            "severity": "media",
            "title": "Fuentes sin cargar",
            "desc": claims_desc,
            "status": "abierto",
            "action": "Cargar al menos tres fuentes con URL y año.",
        })

    if identity_conflict or team_gap:
        identity_desc = []
        if identity_conflict:
            identity_desc.append(
                "La sesión y los artefactos en disco no coinciden."
            )
        if team_gap:
            identity_desc.append(
                f"Hay {len(roster)} personas con nombre de {team_declared} declaradas."
            )
        critical_all.append({
            "time": f"{len(roster)} / {team_declared}" if team_gap else "—",
            "severity": "alta" if identity_conflict else "media",
            "title": "Identidad y equipo" if (identity_conflict and team_gap) else "Identidad del proyecto" if identity_conflict else "Equipo incompleto",
            "desc": " ".join(identity_desc),
            "status": "abierto",
            "action": (
                "Decidir qué proyecto es el vigente y alinear los archivos."
                if identity_conflict
                else "Registrar a los integrantes que faltan o ajustar el número declarado."
            ),
        })

    if not has_project_context:
        critical_all = []
    critical_all.sort(key=lambda item: 0 if item["severity"] == "alta" else 1)
    critical = critical_all[:4]

    # Distribution of registered frentes, not invented hours.
    split_groups = [
        ("Pautado", "Pautado", "#0866F5"),
        ("Reto", "Reto", "#0284C7"),
        ("Presupuesto", "Presupuesto", "#0D1B35"),
        ("Canvas", "Canvas", "#2AA7AD"),
        ("Despacho", "Despacho", "#64748B"),
    ]
    split = []
    for label, prefix, color in split_groups:
        count = sum(1 for key, item in deliverables.items() if DELIVERABLE_LABELS.get(key, "").startswith(prefix) or (prefix == "Pautado" and key.startswith("pautado_")))
        if count:
            split.append({"label": label, "count": count, "pct": pct(count, deliverable_total), "color": color})
    # Fold the 1-point groups into a clean 100% bar without losing the labels.
    if split:
        total_pct = sum(item["pct"] for item in split)
        if total_pct != 100:
            split[-1]["pct"] += 100 - total_pct

    reto_event = None
    for event in (deliverables.get("reto") or {}).get("history") or []:
        if clean(event.get("action")).lower().startswith("marcó terminado"):
            reto_event = event
            break
    reto_done_at = dt_from_ms(reto_event.get("at")) if reto_event else None
    reto_done_label = hhmm(reto_done_at) if reto_done_at else ""
    reto_done_name = clean(reto_event.get("name")) if reto_event else "El equipo"
    solution_text = clean(state.get("solution_thesis")) or clean(state.get("solution_simple"))

    achievements = []
    if reto_done_at:
        achievements.append({
            "icon": "shield",
            "title": "Reto cerrado",
            "desc": f"{reto_done_name} marcó terminado el reto a las {reto_done_label}. {len(done_keys)} de {deliverable_total} entregables están cerrados.",
        })
    elif done_keys:
        achievements.append({
            "icon": "shield",
            "title": "Entregables en marcha",
            "desc": f"{len(done_keys)} de {deliverable_total} entregables están cerrados.",
        })

    if state.get("solution_approved") and solution_text:
        achievements.append({
            "icon": "leaf",
            "title": "Solución aprobada",
            "desc": f"La tesis de {project_name} está aprobada y el pautado tiene {len(pautado_sections)} de 5 secciones.",
        })

    if pautado_sections:
        missing = 5 - len(pautado_sections)
        achievements.append({
            "icon": "spark",
            "title": "Pautado con base",
            "desc": (
                f"{len(pautado_sections)} de 5 secciones tienen texto."
                if missing <= 0
                else f"{len(pautado_sections)} de 5 secciones tienen texto; faltan {missing}."
            ),
        })

    if (claims or budget or shotlist) and has_project_context:
        material_desc = f"{len(claims)} claims, {len(budget)} filas de presupuesto y {len(shotlist)} shots en disco."
        material_desc += (
            " Puede ser material de otra versión; no se mezcla."
            if identity_conflict
            else " Disponible para reutilizar."
        )
        achievements.append({
            "icon": "clock",
            "title": "Material en disco",
            "desc": material_desc,
        })

    if roster:
        achievements.append({
            "icon": "shield",
            "title": "Equipo registrado",
            "desc": f"{len(roster)} de {team_declared} integrantes tienen nombre y señal en la sesión.",
        })

    conflicts = []
    if identity_conflict:
        conflicts.append({
            "title": "Identidad del proyecto",
            "detail": "La sesión y los artefactos en disco no coinciden. No se mezclan; revisa cuál es la versión vigente.",
            "severity": "alta",
        })
    if budget_conflict:
        conflicts.append({
            "title": "Presupuesto",
            "detail": f"state.json: {len(state_budget)} filas. budget/budget.json: {len(budget)} filas por USD {budget_total:,.0f}.",
            "severity": "alta",
        })
    if claims_conflict:
        conflicts.append({
            "title": "Fuentes",
            "detail": f"state.json: {len(state_claims)} claims. research/claims.json: {len(claims)} claims con URL.",
            "severity": "alta",
        })
    if team_gap:
        conflicts.append({
            "title": "Equipo",
            "detail": f"state.json declara {team_declared} integrantes; team_roster tiene {len(roster)}.",
            "severity": "media",
        })
    if brief_gap:
        conflicts.append({
            "title": "Brief",
            "detail": "brief.json está incompleto; la identidad vive solo en state.json.",
            "severity": "media",
        })
    if not has_project_context:
        conflicts = []

    source_specs = [
        ("Sesión", STATE_PATH),
        ("Claims", CLAIMS_PATH),
        ("Presupuesto", BUDGET_PATH),
        ("Shotlist", SHOTLIST_PATH),
        ("Guion", SCRIPT_PATH),
        ("Narración", NARRATION_PATH),
        ("Canvas", CANVAS_PATH),
        ("Bibliografía", BIBLIOGRAPHY_PATH),
        ("Sitio", SITE_PATH),
        ("Brief", ROOT / "brief.json"),
    ]
    sources = [
        {
            "label": label,
            "path": str(path.relative_to(ROOT)).replace("\\", "/"),
            "exists": exists(path),
            "mtime": mtime_label(path),
        }
        for label, path in source_specs
    ]

    start_label = hhmm(start_dt)
    end_label = hhmm(end_dt)
    date_label = ""
    if start_dt and end_dt:
        date_label = f"{start_dt.day:02d}—{end_dt.day:02d} {end_dt.strftime('%b').upper()} {end_dt.year}"

    meta_description = (
        f"Resumen real de {project_name}: {elapsed_h:g} de {duration_h:g} h, "
        f"{len(done_keys)}/{deliverable_total} entregables, "
        f"{len(pautado_sections)}/5 secciones de pautado y {len(critical)} frentes abiertos."
    )

    started = bool(state.get("rally_started"))
    if phase_override:
        phase = phase_override
    elif not started:
        phase = "idle"
    elif hours_remaining <= 0:
        phase = "final"
    elif hours_remaining <= 1:
        phase = "t-1h"
    else:
        phase = "mid"
    data = {
        "_meta": {
            "kind": "project_recap_generated",
            "simulated": False,
            "schema_version": 2,
            "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
            "generator": "scripts/build_stats.py",
            "phase": phase,
            "note": "Todos los números se derivan de state.json y de los archivos del proyecto. Los avatares son ilustrativos.",
            "description": meta_description,
            "formula": "Preparación = 35% entregables + 20% pautado + 15% guion + 15% presupuesto + 10% fuentes + 5% guardrails. Solo cuenta la sesión viva; el material de otro proyecto no suma.",
        },
        "phase": phase,
        "session": {
            "team_name": team_name,
            "team_initials": initials(team_name),
            "university": university,
            "city": city,
            "project_name": project_name,
            "challenge_title": challenge_title,
            "challenge_id": challenge_id,
            "category": category,
            "rally_type": rally_type,
            "duration_h": duration_h,
            "hours_remaining": hours_remaining,
            "elapsed_h": elapsed_h,
            "elapsed_pct": elapsed_pct,
            "start_label": start_label,
            "end_label": end_label,
            "date_label": date_label,
            "last_signal_label": hhmm(last_signal_dt),
            "solution": clean(state.get("solution_thesis")),
            "solution_simple": clean(state.get("solution_simple")),
            "solution_approved": bool(state.get("solution_approved")),
            "ods": (state.get("impact_alignment") or {}).get("selected_ods") or [],
            "team_declared": team_declared,
            "team_registered": len(roster),
        },
        "headline": {
            "elapsed_h": elapsed_h,
            "elapsed_pct": elapsed_pct,
            "duration_h": duration_h,
            "hours_remaining": hours_remaining,
            "deliverables_done": len(done_keys),
            "deliverables_total": deliverable_total,
            "pautado_sections": len(pautado_sections),
            "pautado_total": 5,
            "script_acts": len(script_acts),
            "script_total": 4,
            "critical_count": len(critical_all),
            "critical_shown": len(critical),
            "signals": len(signals),
            "readiness": readiness,
            "readiness_parts": readiness_parts,
            "active_people": len(roster),
            "team_declared": team_declared,
        },
        "rhythm": {
            "peak_hour": peak_hour,
            "peak_count": peak_count,
            "peak_note": peak_note,
            "peak_people": peak_people if peak and peak["count"] else [],
            "peak_frentes": peak_frentes if peak and peak["count"] else [],
            "threshold": threshold,
            "max_count": max_count,
            "hours": hour_slots,
        },
        "critical": critical,
        "mvp": None if not mvp else {
            "id": mvp["id"],
            "name": mvp["name"],
            "role": mvp["role"],
            "avatar": mvp["avatar"],
            "frentes": mvp["frentes"],
            "signals": mvp["signals"],
            "coverage": mvp["coverage"],
            "badge": "MVP operativo",
            "reason": (
                f"Asumió {mvp['frentes']} de los {deliverable_total} frentes registrados. "
                "Es la mayor carga operativa, no una medida de valor personal."
            ),
        },
        "people": people,
        "placeholders": placeholders,
        "roster_gap": {
            "declared": team_declared,
            "registered": len(roster),
            "missing": missing_people,
            "note": f"{missing_people} integrantes declarados todavía no tienen nombre ni señal en la sesión." if missing_people else "Todos los integrantes declarados tienen registro.",
        },
        "time_split": split,
        "achievements": achievements,
        "conflicts": conflicts,
        "sources": sources,
        "material": {
            "claims": len(claims),
            "budget_rows": len(budget),
            "budget_total_usd": round(sum(float(row.get("total") or 0) for row in budget), 2),
            "shots": len(shotlist),
            "script_words": script_words,
            "site": exists(SITE_PATH),
            "canvas": exists(CANVAS_PATH),
            "bibliography": exists(BIBLIOGRAPHY_PATH),
            "artifact_project": artifact_project,
        },
        "provenance": {
            "real": ["Identidad y sesión", "Entregables", "Pautado", "Equipo", "Fechas"],
            "derived": ["Ritmo por hora", "Frentes críticos", "Persona destacada", "Reparto de frentes", "Preparación"],
            "illustrative": ["Avatares"],
        },
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_JS.write_text(
        "/* Generated by scripts/build_stats.py. Do not edit by hand. */\n"
        f"window.RALLY_STATS = {json.dumps(data, ensure_ascii=False, indent=2)};\n",
        encoding="utf-8",
    )

    print(f"wrote {OUT_JSON.relative_to(ROOT)}")
    print(f"wrote {OUT_JS.relative_to(ROOT)}")
    print(f"identity: {team_name} / {project_name} / {university} / {city}")
    print(f"session: {elapsed_h:g}h elapsed of {duration_h:g}h, {hours_remaining:g}h remaining")
    print(f"deliverables: {len(done_keys)}/{deliverable_total} done; pautado {len(pautado_sections)}/5; script {len(script_acts)}/4")
    print(f"signals: {len(signals)}; peak: {peak_hour} ({peak_count}); readiness: {readiness}")
    print(f"people: {', '.join(p['name'] + '=' + str(p['frentes']) for p in people)}")
    print(f"artifact project: {artifact_project or 'none'}; conflicts: {len(conflicts)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate the Rally Studio real-data recap.")
    parser.add_argument(
        "--phase",
        choices=("mid", "t-1h", "final"),
        default=None,
        help="Override the automatic phase (mid, t-1h, final).",
    )
    args = parser.parse_args()
    main(args.phase)
