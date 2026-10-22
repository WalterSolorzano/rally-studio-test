"""Sincronizacion de archivos del rally entre host local y la isla (Fase 2.1).

No habla HTTP. Solo guarda contenido versionado de archivos permitidos y
registra el feed de cambios para que otros se pongan al dia (pull).

Modelo de conflicto (optimistic locking):
- El que sube declara el hash que leyo del remoto (`old_hash`).
- Si coincide con lo publicado, se acepta el push (version + 1).
- Si no coincide, se rechaza CON el contenido remoto incluido, para que el
  cliente vea la diferencia y decida sin pedir otra descarga regenerica.

La base vive en `dashboard/data/nube.db` por defecto. Cada archivo esta
cuotado en tamano; nada fuera de `SYNCABLE_PATHS` se acepta, nunca.
"""

from __future__ import annotations

import hashlib
import json
import re
import sqlite3
import time
from pathlib import Path

# Archivos que la nube sincroniza. Ruta relativa a la raiz del repo,
# con "/" como separador. Lo demas se rechaza con honestidad.
SYNCABLE_PATHS = (
    "brief.json",
    "budget/budget.json",
    "research/claims.json",
    "research/challenges.json",
    "brand/palette.json",
    "brand/tokens.css",
    "script/shotlist.csv",
    "script/script.md",
    "script/narration.txt",
    "docs/canvas.md",
)

MAX_CONTENT_CHARS = 512 * 1024  # 512 KB por archivo, en texto UTF-8

# Prefijos dinamicos (ademas de SYNCABLE_PATHS exactos):
# - content/<id>.json          : sobre de propuesta del buzon, delegado a la pizarra web
# - content_decisiones/<id>.json : decision (apply/discard) que La web devuelve al host
ITEM_ID_RE_NUBE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,80}$")
BUZON_PREFIX = "content/"
DECISIONES_PREFIX = "content_decisiones/"

SCHEMA = """
CREATE TABLE IF NOT EXISTS nube_files (
  rally_id TEXT NOT NULL,
  rel_path TEXT NOT NULL,
  content TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  version INTEGER NOT NULL,
  actor TEXT NOT NULL,
  updated_at REAL NOT NULL,
  PRIMARY KEY (rally_id, rel_path)
);
CREATE TABLE IF NOT EXISTS nube_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rally_id TEXT NOT NULL,
  rel_path TEXT NOT NULL,
  sha256_new TEXT NOT NULL,
  sha256_old TEXT,
  actor TEXT NOT NULL,
  change_type TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nube_changes_rally
  ON nube_changes(rally_id, id);
"""


def _sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


class NubeConflict(Exception):
    def __init__(self, remote: dict):
        super().__init__("conflicto-nube")
        self.remote = remote


class NubeError(Exception):
    """Datos invalidos: ruta no permitida, contenido vacio, demasiado grande."""


class NubeStore:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.executescript(SCHEMA)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.path), timeout=10)
        conn.row_factory = sqlite3.Row
        return conn

    # ---------------------------------------------------------------- rutas

    @staticmethod
    def normalize_path(rel_path: str) -> str:
        clean = str(rel_path or "").strip().replace("\\", "/").lstrip("/").rstrip("/")
        if clean.startswith("/") or ".." in clean.split("/"):
            raise NubeError("ruta-invalida")
        if clean in SYNCABLE_PATHS:
            return clean
        # buzon cooperativo (Fase 2.3): content/<id>.json y content_decisiones/<id>.json
        for prefijo in (BUZON_PREFIX, DECISIONES_PREFIX):
            if clean.startswith(prefijo):
                resto = clean[len(prefijo):]
                if not resto.endswith(".json"):
                    raise NubeError("ruta-no-sincronizable")
                nombre = resto[: -len(".json")]
                if not ITEM_ID_RE_NUBE.match(nombre):
                    raise NubeError("ruta-no-sincronizable")
                return clean
        raise NubeError("ruta-no-sincronizable")

    @staticmethod
    def validate_content(content: str) -> str:
        if not isinstance(content, str):
            raise NubeError("contenido-no-texto")
        if len(content) > MAX_CONTENT_CHARS:
            raise NubeError("archivo-demasiado-grande")
        return content

    # ------------------------------------------------------------ lectura

    def read_file(self, rally_id: str, rel_path: str) -> dict | None:
        clean = self.normalize_path(rel_path)
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM nube_files WHERE rally_id = ? AND rel_path = ?",
                (rally_id, clean),
            ).fetchone()
        if row is None:
            return None
        return {
            "path": row["rel_path"],
            "content": row["content"],
            "sha256": row["sha256"],
            "version": row["version"],
            "actor": row["actor"],
            "updated_at": row["updated_at"],
        }

    def list_files(self, rally_id: str) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT rel_path, sha256, version, actor, updated_at FROM nube_files"
                " WHERE rally_id = ? ORDER BY rel_path ASC",
                (rally_id,),
            ).fetchall()
        return [
            {
                "path": row["rel_path"],
                "sha256": row["sha256"],
                "version": row["version"],
                "actor": row["actor"],
                "updated_at": row["updated_at"],
            }
            for row in rows
        ]

    def changes(self, rally_id: str, since: int = 0, limit: int = 200) -> dict:
        limit = max(1, min(int(limit), 500))
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT id, rel_path, sha256_new, sha256_old, actor, change_type,"
                " version, created_at FROM nube_changes WHERE rally_id = ? AND id > ?"
                " ORDER BY id ASC LIMIT ?",
                (rally_id, int(since), limit),
            ).fetchall()
            last = conn.execute(
                "SELECT MAX(id) AS last_id FROM nube_changes WHERE rally_id = ?",
                (rally_id,),
            ).fetchone()
        return {
            "cursor": int(last["last_id"] or 0),
            "changes": [
                {
                    "id": row["id"],
                    "path": row["rel_path"],
                    "sha256_new": row["sha256_new"],
                    "sha256_old": row["sha256_old"],
                    "actor": row["actor"],
                    "change_type": row["change_type"],
                    "version": row["version"],
                    "created_at": row["created_at"],
                }
                for row in rows
            ],
        }

    # -------------------------------------------------------------- push

    def push(self, rally_id: str, rel_path: str, content: str, old_hash: str, actor: str) -> dict:
        clean = self.normalize_path(rel_path)
        content = self.validate_content(content)
        actor = str(actor or "").strip()[:60] or "desconocido"
        new_sha = _sha256_text(content)
        now = time.time()
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT sha256, version, actor, updated_at FROM nube_files"
                " WHERE rally_id = ? AND rel_path = ?",
                (rally_id, clean),
            ).fetchone()
            current_sha = row["sha256"] if row else ""
            expected = str(old_hash or "").strip().lower()
            if current_sha and not expected:
                raise NubeConflict(self.read_file(rally_id, clean))
            if expected and expected != current_sha:
                raise NubeConflict(self.read_file(rally_id, clean))
            version = (row["version"] if row else 0) + 1
            conn.execute(
                "INSERT INTO nube_files (rally_id, rel_path, content, sha256, version,"
                " actor, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
                " ON CONFLICT (rally_id, rel_path) DO UPDATE SET content = excluded.content,"
                " sha256 = excluded.sha256, version = excluded.version,"
                " actor = excluded.actor, updated_at = excluded.updated_at",
                (rally_id, clean, content, new_sha, version, actor, now),
            )
            conn.execute(
                "INSERT INTO nube_changes (rally_id, rel_path, sha256_new, sha256_old,"
                " actor, change_type, version, created_at) VALUES (?, ?, ?, ?, ?, 'push', ?, ?)",
                (rally_id, clean, new_sha, current_sha or None, actor, version, now),
            )
            conn.commit()
        return {"path": clean, "sha256": new_sha, "version": version}

    # ------------------------------------------------------------- delete

    def delete_file(self, rally_id: str, rel_path: str, old_hash: str, actor: str) -> dict:
        """Borra un archivo de la nube dejando su muerte en el feed de cambios."""
        clean = self.normalize_path(rel_path)
        actor = str(actor or "").strip()[:60] or "desconocido"
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT sha256, version FROM nube_files WHERE rally_id = ? AND rel_path = ?",
                (rally_id, clean),
            ).fetchone()
            if row is None:
                conn.commit()
                return {"path": clean, "deleted": True, "na": True}
            expected = str(old_hash or "").strip().lower()
            if expected != row["sha256"]:
                raise NubeConflict(self.read_file(rally_id, clean))
            conn.execute(
                "DELETE FROM nube_files WHERE rally_id = ? AND rel_path = ?",
                (rally_id, clean),
            )
            conn.execute(
                "INSERT INTO nube_changes (rally_id, rel_path, sha256_new, sha256_old,"
                " actor, change_type, version, created_at) VALUES (?, ?, '', ?, ?, 'delete', ?, ?)",
                (rally_id, clean, row["sha256"], actor, row["version"], time.time()),
            )
            conn.commit()
        return {"path": clean, "deleted": True}
