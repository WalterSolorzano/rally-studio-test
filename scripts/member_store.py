"""Miembros, invitaciones y sesiones de un proyecto local.

No habla HTTP. Guarda solo hashes de tokens; el token en claro se devuelve una
vez, al crearlo. La base vive en `dashboard/data/members.db` por defecto.
"""

from __future__ import annotations

import hashlib
import secrets
import sqlite3
import time
from pathlib import Path

ROLES = ("admin", "operator", "member")
SCHEMA = """
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    device_id TEXT NOT NULL DEFAULT '',
    token_hash TEXT NOT NULL UNIQUE,
    created_at REAL NOT NULL,
    last_seen REAL NOT NULL DEFAULT 0,
    revoked INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS invites (
    token_hash TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at REAL NOT NULL,
    expires_at REAL NOT NULL,
    used_by TEXT,
    used_at REAL
);
CREATE INDEX IF NOT EXISTS idx_members_project ON members(project_id);
CREATE INDEX IF NOT EXISTS idx_invites_project ON invites(project_id);
"""


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class MemberStore:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.executescript(SCHEMA)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.path), timeout=10)
        conn.row_factory = sqlite3.Row
        return conn

    @staticmethod
    def _member(row: sqlite3.Row) -> dict:
        return {
            "id": row["id"],
            "name": row["name"],
            "role": row["role"],
            "device_id": row["device_id"],
            "revoked": bool(row["revoked"]),
            "last_seen": row["last_seen"],
        }

    def has_members(self, project_id: str) -> bool:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT 1 FROM members WHERE project_id = ? LIMIT 1", (project_id,)
            ).fetchone()
        return row is not None

    def bootstrap(self, project_id: str, admin_name: str, device_id: str) -> dict:
        name = (admin_name or "").strip()
        if not name:
            raise ValueError("nombre-requerido")
        if self.has_members(project_id):
            raise ValueError("proyecto-existente")
        token = secrets.token_urlsafe(32)
        member_id = "mem_" + secrets.token_hex(8)
        now = time.time()
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO members (id, project_id, name, role, device_id, token_hash,"
                " created_at, last_seen, revoked) VALUES (?, ?, ?, 'admin', ?, ?, ?, ?, 0)",
                (member_id, project_id, name, device_id, _hash(token), now, now),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM members WHERE id = ?", (member_id,)).fetchone()
        return {"project": project_id, "member": self._member(row), "token": token}

    def create_invite(self, project_id: str, actor_id: str, ttl_hours: int = 48) -> dict:
        with self._connect() as conn:
            actor = conn.execute(
                "SELECT * FROM members WHERE id = ? AND project_id = ? AND revoked = 0",
                (actor_id, project_id),
            ).fetchone()
            if actor is None or actor["role"] not in ("admin", "operator"):
                raise ValueError("sin-permiso")
            token = secrets.token_urlsafe(24)
            now = time.time()
            expires = now + float(ttl_hours) * 3600
            conn.execute(
                "INSERT INTO invites (token_hash, project_id, created_by, created_at,"
                " expires_at) VALUES (?, ?, ?, ?, ?)",
                (_hash(token), project_id, actor_id, now, expires),
            )
            conn.commit()
        return {
            "token": token,
            "url_path": "join.html?t=" + token,
            "expires_at": expires,
        }

    def claim_invite(self, token: str, name: str, device_id: str) -> dict:
        clean_name = (name or "").strip()
        if not clean_name:
            raise ValueError("nombre-requerido")
        if len(clean_name) > 40:
            raise ValueError("nombre-largo")
        now = time.time()
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            inv = conn.execute(
                "SELECT * FROM invites WHERE token_hash = ?", (_hash(token),)
            ).fetchone()
            if inv is None:
                raise ValueError("invite-invalido")
            if inv["used_at"] is not None:
                raise ValueError("invite-usado")
            if inv["expires_at"] <= now:
                raise ValueError("invite-expirado")
            member_id = "mem_" + secrets.token_hex(8)
            session = secrets.token_urlsafe(32)
            conn.execute(
                "INSERT INTO members (id, project_id, name, role, device_id, token_hash,"
                " created_at, last_seen, revoked) VALUES (?, ?, ?, 'member', ?, ?, ?, ?, 0)",
                (member_id, inv["project_id"], clean_name, device_id, _hash(session), now, now),
            )
            conn.execute(
                "UPDATE invites SET used_by = ?, used_at = ? WHERE token_hash = ?",
                (member_id, now, inv["token_hash"]),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM members WHERE id = ?", (member_id,)).fetchone()
        return {
            "project": inv["project_id"],
            "member": self._member(row),
            "session": session,
        }

    def authenticate(self, project_id: str, token: str) -> dict | None:
        if not token:
            return None
        digest = _hash(token)
        now = time.time()
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM members WHERE project_id = ? AND token_hash = ? AND revoked = 0",
                (project_id, digest),
            ).fetchone()
            if row is None:
                return None
            conn.execute("UPDATE members SET last_seen = ? WHERE id = ?", (now, row["id"]))
            conn.commit()
            row = conn.execute("SELECT * FROM members WHERE id = ?", (row["id"],)).fetchone()
        return self._member(row)

    def list_members(self, project_id: str) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM members WHERE project_id = ? ORDER BY created_at ASC",
                (project_id,),
            ).fetchall()
        return [self._member(row) for row in rows]

    def revoke_member(self, project_id: str, member_id: str) -> dict:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM members WHERE id = ? AND project_id = ?",
                (member_id, project_id),
            ).fetchone()
            if row is None:
                raise ValueError("miembro-inexistente")
            if row["role"] == "admin" and not row["revoked"]:
                admins = conn.execute(
                    "SELECT COUNT(*) FROM members WHERE project_id = ? AND role = 'admin'"
                    " AND revoked = 0",
                    (project_id,),
                ).fetchone()[0]
                if admins <= 1:
                    raise ValueError("ultimo-admin")
            conn.execute("UPDATE members SET revoked = 1 WHERE id = ?", (member_id,))
            conn.commit()
        return {"id": member_id, "revoked": True}

    def set_role(self, project_id: str, member_id: str, role: str) -> dict:
        if role not in ROLES:
            raise ValueError("rol-invalido")
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM members WHERE id = ? AND project_id = ?",
                (member_id, project_id),
            ).fetchone()
            if row is None:
                raise ValueError("miembro-inexistente")
            if row["role"] == "admin" and role != "admin" and not row["revoked"]:
                admins = conn.execute(
                    "SELECT COUNT(*) FROM members WHERE project_id = ? AND role = 'admin'"
                    " AND revoked = 0",
                    (project_id,),
                ).fetchone()[0]
                if admins <= 1:
                    raise ValueError("ultimo-admin")
            conn.execute("UPDATE members SET role = ? WHERE id = ?", (role, member_id))
            conn.commit()
            row = conn.execute("SELECT * FROM members WHERE id = ?", (member_id,)).fetchone()
        return self._member(row)
