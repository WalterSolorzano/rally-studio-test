import json
import subprocess
import sys

import pytest

from scripts.member_store import MemberStore


def test_bootstrap_creates_admin_and_token(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    out = store.bootstrap("main", "Ana", "dev-admin")
    assert out["project"] == "main"
    assert out["member"]["role"] == "admin"
    assert store.authenticate("main", out["token"])["name"] == "Ana"


def test_invite_is_single_use(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    store.bootstrap("main", "Ana", "dev-admin")
    inv = store.create_invite("main", store.list_members("main")[0]["id"])
    first = store.claim_invite(inv["token"], "Luis", "dev-luis")
    assert first["member"]["role"] == "member"
    with pytest.raises(ValueError, match="invite-usado"):
        store.claim_invite(inv["token"], "Otra", "dev-x")


def test_expired_invite_is_rejected(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    store.bootstrap("main", "Ana", "dev-admin")
    inv = store.create_invite("main", store.list_members("main")[0]["id"], ttl_hours=-1)
    with pytest.raises(ValueError, match="invite-expirado"):
        store.claim_invite(inv["token"], "Luis", "dev-luis")


def test_revoked_member_cannot_authenticate(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    out = store.bootstrap("main", "Ana", "dev-admin")
    luis = store.claim_invite(
        store.create_invite("main", out["member"]["id"])["token"], "Luis", "dev-luis"
    )
    store.revoke_member("main", luis["member"]["id"])
    assert store.authenticate("main", luis["session"]) is None


def test_only_hashes_are_stored(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    out = store.bootstrap("main", "Ana", "dev-admin")
    raw = (tmp_path / "members.db").read_bytes()
    assert out["token"].encode() not in raw


def test_cannot_revoke_last_admin(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    out = store.bootstrap("main", "Ana", "dev-admin")
    with pytest.raises(ValueError, match="ultimo-admin"):
        store.revoke_member("main", out["member"]["id"])


def test_operator_can_invite_and_member_cannot(tmp_path):
    store = MemberStore(tmp_path / "members.db")
    out = store.bootstrap("main", "Ana", "dev-admin")
    luis = store.claim_invite(
        store.create_invite("main", out["member"]["id"])["token"], "Luis", "dev-luis"
    )
    with pytest.raises(ValueError, match="sin-permiso"):
        store.create_invite("main", luis["member"]["id"])
    store.set_role("main", luis["member"]["id"], "operator")
    assert store.create_invite("main", luis["member"]["id"])["token"]


def test_bootstrap_cli_prints_join_url(tmp_path):
    out = subprocess.run(
        [sys.executable, "scripts/crear_proyecto.py",
         "--project", "equipo01", "--name", "Ana",
         "--data-dir", str(tmp_path)],
        capture_output=True, text=True, encoding="utf-8", timeout=30,
    )
    assert out.returncode == 0, out.stderr
    data = json.loads(out.stdout)
    assert data["project"] == "equipo01"
    assert data["join_url"].startswith("join.html?t=")
    assert data["member"]["role"] == "admin"
