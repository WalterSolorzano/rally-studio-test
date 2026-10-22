#!/usr/bin/env python3
"""Almacen de secciones versionadas para Rally Studio.

Cada seccion del proyecto (por ejemplo ``pautado.problema`` o ``budget``) se
guarda por separado, con version, autoria y bloqueo. El objetivo es que dos
personas no puedan pisarse: toda escritura declara la version sobre la que
trabajo y, si ya cambio, el servidor responde 409 con ambas versiones.

El adaptador es deliberadamente pequeno. ``SQLiteSectionStore`` es la
implementacion local; manana se puede enchufar Supabase implementando la misma
interfaz sin tocar la API ni el cliente.
"""

from __future__ import annotations

import json
import re
import sqlite3
import threading
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

SECCIONES_ANIDADAS = ("pautado", "script")
CLAVES_LOCALES = {"active_tab", "_sync_ts", "authorship", "active_locks"}
CLAVE_VALIDA = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,119}$")
LOCK_MIN_MINUTOS = 10
LOCK_MAX_MINUTOS = 30
LOCK_DEFAULT_MINUTOS = 15


class SectionConflict(Exception):
    """La version base ya no es la actual."""

    def __init__(self, key: str, base_version: int, current: dict[str, Any] | None):
        self.key = key
        self.base_version = int(base_version)
        self.current = current
        super().__init__(f"conflicto en {key}: base {base_version}")


class SectionLocked(Exception):
    """Otra persona mantiene el bloqueo de la seccion."""

    def __init__(self, key: str, lock: dict[str, Any] | None):
        self.key = key
        self.lock = lock
        super().__init__(f"seccion bloqueada: {key}")


def validar_clave(key: str) -> str:
    key = (key or "").strip()
    if not CLAVE_VALIDA.match(key):
        raise ValueError("clave-de-seccion-invalida")
    return key


def estado_a_secciones(state: dict[str, Any]) -> dict[str, Any]:
    """Divide el estado del dashboard en secciones independientes."""
    if not isinstance(state, dict):
        raise ValueError("state-invalido")
    salida: dict[str, Any] = {}
    for key, value in state.items():
        if not key or key.startswith("_") or key in CLAVES_LOCALES:
            continue
        if key in SECCIONES_ANIDADAS and isinstance(value, dict):
            for sub, sub_value in value.items():
                if not sub or sub.startswith("_"):
                    continue
                salida[f"{key}.{sub}"] = sub_value
        else:
            salida[key] = value
    return salida


def aplicar_seccion(state: dict[str, Any], key: str, value: Any) -> None:
    if "." in key:
        root, sub = key.split(".", 1)
        if root in SECCIONES_ANIDADAS:
            if not isinstance(state.get(root), dict):
                state[root] = {}
            state[root][sub] = value
            return
    state[key] = value


def secciones_a_estado(sections: dict[str, Any]) -> dict[str, Any]:
    state: dict[str, Any] = {}
    for key in sorted(sections):
        aplicar_seccion(state, key, sections[key])
    return state


class SectionStore(ABC):
    """Interfaz que debe cumplir cualquier adaptador (SQLite, Supabase...)."""

    @abstractmethod
    def read_sections(self, project_id: str, since: int = 0) -> tuple[int, dict[str, dict]]:
        ...

    @abstractmethod
    def read_state(self, project_id: str) -> dict[str, Any]:
        ...

    @abstractmethod
    def write_section(self, project_id: str, key: str, data: Any, base_version: int,
                      actor: str, actor_id: str, ttl_minutes: int = LOCK_DEFAULT_MINUTOS) -> dict:
        ...

    @abstractmethod
    def lock(self, project_id: str, key: str, actor: str, actor_id: str,
             ttl_minutes: int = LOCK_DEFAULT_MINUTOS) -> dict:
        ...

    @abstractmethod
    def unlock(self, project_id: str, key: str, actor_id: str) -> dict:
        ...

    @abstractmethod
    def import_state(self, project_id: str, state: dict[str, Any], actor: str,
                     actor_id: str) -> dict:
        ...

    @abstractmethod
    def events(self, project_id: str, since: int = 0, limit: int = 100) -> list[dict]:
        ...


class SQLiteSectionStore(SectionStore):
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.path), timeout=20)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA busy_timeout=20000")
        return conn

    def _init_db(self) -> None:
        with self._lock, self._connect() as conn:
            conn.execute("PRAGMA journal_mode=WAL")
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS sections (
                    project_id TEXT NOT NULL,
                    key TEXT NOT NULL,
                    data TEXT NOT NULL,
                    version INTEGER NOT NULL DEFAULT 0,
                    updated_by TEXT NOT NULL DEFAULT '',
                    updated_by_id TEXT NOT NULL DEFAULT '',
                    updated_at REAL NOT NULL,
                    lock_owner TEXT,
                    lock_owner_id TEXT,
                    lock_until REAL,
                    seq INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (project_id, key)
                );
                CREATE TABLE IF NOT EXISTS meta (
                    project_id TEXT PRIMARY KEY,
                    seq INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id TEXT NOT NULL,
                    key TEXT NOT NULL,
                    actor TEXT NOT NULL DEFAULT '',
                    actor_id TEXT NOT NULL DEFAULT '',
                    action TEXT NOT NULL,
                    version INTEGER NOT NULL DEFAULT 0,
                    at REAL NOT NULL,
                    detail TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_sections_seq
                    ON sections(project_id, seq);
                CREATE INDEX IF NOT EXISTS idx_events_project
                    ON events(project_id, id);
                """
            )

    @staticmethod
    def _section_row(row: sqlite3.Row | None) -> dict | None:
        if row is None:
            return None
        try:
            data = json.loads(row["data"])
        except Exception:
            data = None
        return {
            "key": row["key"],
            "data": data,
            "version": int(row["version"]),
            "updated_by": row["updated_by"] or "",
            "updated_by_id": row["updated_by_id"] or "",
            "updated_at": float(row["updated_at"] or 0),
            "lock_owner": row["lock_owner"] or "",
            "lock_owner_id": row["lock_owner_id"] or "",
            "lock_until": float(row["lock_until"] or 0),
            "seq": int(row["seq"] or 0),
        }

    def _seq(self, conn: sqlite3.Connection, project_id: str) -> int:
        row = conn.execute(
            "SELECT seq FROM meta WHERE project_id = ?", (project_id,)
        ).fetchone()
        seq = (int(row["seq"]) if row else 0) + 1
        conn.execute(
            "INSERT INTO meta(project_id, seq) VALUES(?, ?) "
            "ON CONFLICT(project_id) DO UPDATE SET seq = excluded.seq",
            (project_id, seq),
        )
        return seq

    def _event(self, conn: sqlite3.Connection, project_id: str, key: str,
               actor: str, actor_id: str, action: str, version: int,
               detail: dict | None = None) -> None:
        conn.execute(
            "INSERT INTO events(project_id, key, actor, actor_id, action, version, at, detail) "
            "VALUES(?,?,?,?,?,?,?,?)",
            (project_id, key, actor or "", actor_id or "", action, version,
             time.time(), json.dumps(detail or {}, ensure_ascii=False)),
        )

    def _current(self, conn: sqlite3.Connection, project_id: str, key: str) -> dict | None:
        row = conn.execute(
            "SELECT * FROM sections WHERE project_id = ? AND key = ?",
            (project_id, key),
        ).fetchone()
        return self._section_row(row)

    @staticmethod
    def _lock_active(section: dict | None, now: float | None = None) -> bool:
        if not section:
            return False
        if not section.get("lock_owner_id") and not section.get("lock_owner"):
            return False
        return float(section.get("lock_until") or 0) > (now or time.time())

    @staticmethod
    def _ttl(ttl_minutes: int) -> int:
        try:
            minutes = int(ttl_minutes)
        except Exception:
            minutes = LOCK_DEFAULT_MINUTOS
        return max(LOCK_MIN_MINUTOS, min(LOCK_MAX_MINUTOS, minutes))

    def read_sections(self, project_id: str, since: int = 0) -> tuple[int, dict[str, dict]]:
        with self._lock, self._connect() as conn:
            meta = conn.execute(
                "SELECT seq FROM meta WHERE project_id = ?", (project_id,)
            ).fetchone()
            total = int(meta["seq"]) if meta else 0
            if since and since > 0:
                rows = conn.execute(
                    "SELECT * FROM sections WHERE project_id = ? AND seq > ? ORDER BY seq ASC",
                    (project_id, int(since)),
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM sections WHERE project_id = ? ORDER BY key ASC",
                    (project_id,),
                ).fetchall()
            return total, {row["key"]: self._section_row(row) for row in rows}

    def read_state(self, project_id: str) -> dict[str, Any]:
        with self._lock, self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM sections WHERE project_id = ? ORDER BY key ASC",
                (project_id,),
            ).fetchall()
            sections: dict[str, Any] = {}
            for row in rows:
                item = self._section_row(row)
                if item and item["data"] is not None and item["key"] not in CLAVES_LOCALES:
                    sections[item["key"]] = item["data"]
            return secciones_a_estado(sections)

    def write_section(self, project_id: str, key: str, data: Any, base_version: int,
                      actor: str, actor_id: str, ttl_minutes: int = LOCK_DEFAULT_MINUTOS) -> dict:
        key = validar_clave(key)
        with self._lock, self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            current = self._current(conn, project_id, key)
            current_version = int(current["version"]) if current else 0
            if int(base_version) != current_version:
                raise SectionConflict(key, int(base_version), current)
            if self._lock_active(current) and (current or {}).get("lock_owner_id") != actor_id:
                raise SectionLocked(key, current)
            now = time.time()
            version = current_version + 1
            seq = self._seq(conn, project_id)
            lock_until = current.get("lock_until") if current else 0
            if current and current.get("lock_owner_id") == actor_id:
                lock_until = max(float(lock_until or 0), now + self._ttl(ttl_minutes) * 60)
            conn.execute(
                "INSERT INTO sections(project_id,key,data,version,updated_by,updated_by_id,"
                "updated_at,lock_owner,lock_owner_id,lock_until,seq) "
                "VALUES(?,?,?,?,?,?,?,?,?,?,?) "
                "ON CONFLICT(project_id,key) DO UPDATE SET "
                "data=excluded.data, version=excluded.version, updated_by=excluded.updated_by, "
                "updated_by_id=excluded.updated_by_id, updated_at=excluded.updated_at, "
                "lock_owner=excluded.lock_owner, lock_owner_id=excluded.lock_owner_id, "
                "lock_until=excluded.lock_until, seq=excluded.seq",
                (project_id, key, json.dumps(data, ensure_ascii=False), version,
                 actor or "", actor_id or "", now,
                 (current or {}).get("lock_owner") or "",
                 (current or {}).get("lock_owner_id") or "",
                 lock_until, seq),
            )
            self._event(conn, project_id, key, actor, actor_id, "write", version)
            updated = self._current(conn, project_id, key)
            conn.commit()
            return updated or {}

    def lock(self, project_id: str, key: str, actor: str, actor_id: str,
             ttl_minutes: int = LOCK_DEFAULT_MINUTOS) -> dict:
        key = validar_clave(key)
        with self._lock, self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            current = self._current(conn, project_id, key)
            now = time.time()
            if self._lock_active(current, now) and (current or {}).get("lock_owner_id") != actor_id:
                raise SectionLocked(key, current)
            ttl = self._ttl(ttl_minutes)
            seq = self._seq(conn, project_id)
            lock_until = now + ttl * 60
            conn.execute(
                "INSERT INTO sections(project_id,key,data,version,updated_by,updated_by_id,"
                "updated_at,lock_owner,lock_owner_id,lock_until,seq) "
                "VALUES(?,?,?,?,?,?,?,?,?,?,?) "
                "ON CONFLICT(project_id,key) DO UPDATE SET "
                "lock_owner=excluded.lock_owner, lock_owner_id=excluded.lock_owner_id, "
                "lock_until=excluded.lock_until, seq=excluded.seq",
                (project_id, key, json.dumps(None), int((current or {}).get("version") or 0),
                 (current or {}).get("updated_by") or "", (current or {}).get("updated_by_id") or "",
                 float((current or {}).get("updated_at") or now), actor or "", actor_id or "",
                 lock_until, seq),
            )
            self._event(conn, project_id, key, actor, actor_id, "lock", int((current or {}).get("version") or 0),
                        {"until": lock_until, "ttl_minutes": ttl})
            updated = self._current(conn, project_id, key)
            conn.commit()
            return updated or {}

    def unlock(self, project_id: str, key: str, actor_id: str) -> dict:
        key = validar_clave(key)
        with self._lock, self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            current = self._current(conn, project_id, key)
            if not current:
                conn.commit()
                return {}
            if self._lock_active(current) and current.get("lock_owner_id") != actor_id:
                raise SectionLocked(key, current)
            seq = self._seq(conn, project_id)
            conn.execute(
                "UPDATE sections SET lock_owner='', lock_owner_id='', lock_until=0, seq=? "
                "WHERE project_id=? AND key=?",
                (seq, project_id, key),
            )
            self._event(conn, project_id, key, current.get("lock_owner") or "", actor_id,
                        "unlock", int(current.get("version") or 0))
            updated = self._current(conn, project_id, key)
            conn.commit()
            return updated or {}

    def import_state(self, project_id: str, state: dict[str, Any], actor: str,
                     actor_id: str) -> dict:
        sections = estado_a_secciones(state)
        imported: list[str] = []
        skipped: list[str] = []
        with self._lock, self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            now = time.time()
            for key in sorted(sections):
                validar_clave(key)
                current = self._current(conn, project_id, key)
                if current is not None:
                    skipped.append(key)
                    continue
                seq = self._seq(conn, project_id)
                conn.execute(
                    "INSERT INTO sections(project_id,key,data,version,updated_by,updated_by_id,"
                    "updated_at,lock_owner,lock_owner_id,lock_until,seq) "
                    "VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                    (project_id, key, json.dumps(sections[key], ensure_ascii=False), 1,
                     actor or "migracion", actor_id or "", now, "", "", 0, seq),
                )
                self._event(conn, project_id, key, actor or "migracion", actor_id,
                            "import", 1)
                imported.append(key)
            conn.commit()
        return {"imported": imported, "skipped": skipped, "count": len(imported)}

    def events(self, project_id: str, since: int = 0, limit: int = 100) -> list[dict]:
        limit = max(1, min(500, int(limit or 100)))
        with self._lock, self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM events WHERE project_id = ? AND id > ? ORDER BY id ASC LIMIT ?",
                (project_id, int(since or 0), limit),
            ).fetchall()
            return [
                {
                    "id": int(row["id"]),
                    "key": row["key"],
                    "actor": row["actor"],
                    "actor_id": row["actor_id"],
                    "action": row["action"],
                    "version": int(row["version"]),
                    "at": float(row["at"]),
                    "detail": json.loads(row["detail"]) if row["detail"] else {},
                }
                for row in rows
            ]
