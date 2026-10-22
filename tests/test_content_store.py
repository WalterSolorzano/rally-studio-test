import json
from pathlib import Path
import pytest
from scripts.content_store import ContentStore, validate_envelope


def envelope(item_id="p1", tab="pautado", slot="problema", text="Hola"):
    return {
        "id": item_id, "tab": tab, "slot": slot, "kind": "text",
        "title": "Propuesta", "source": "test", "created_at": "2026-10-19T10:00:00-06:00",
        "confidence": "media", "simulated": False, "payload": {"text": text},
    }


def seed(tmp_path, env):
    d = tmp_path / "content"
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{env['id']}.json").write_text(json.dumps(env, ensure_ascii=False), encoding="utf-8")


def test_manifest_lists_valid_items(tmp_path):
    seed(tmp_path, envelope())
    m = ContentStore(tmp_path).manifest()
    assert [i["id"] for i in m["items"]] == ["p1"]
    assert isinstance(m["version"], int)


def test_manifest_skips_corrupt_and_incomplete(tmp_path):
    d = tmp_path / "content"
    d.mkdir(parents=True)
    (d / "roto.json").write_text("{no es json", encoding="utf-8")
    (d / "incompleto.json").write_text(json.dumps({"id": "incompleto"}), encoding="utf-8")
    m = ContentStore(tmp_path).manifest()
    assert m["items"] == []


def test_manifest_skips_oversized_file(tmp_path):
    d = tmp_path / "content"
    d.mkdir(parents=True)
    (d / "grande.json").write_bytes(b"{" + b" " * (5 * 1024 * 1024 + 1) + b"}")
    assert ContentStore(tmp_path).manifest()["items"] == []


def test_read_rejects_path_traversal(tmp_path):
    seed(tmp_path, envelope())
    with pytest.raises(KeyError):
        ContentStore(tmp_path).read("../../etc/passwd")
    with pytest.raises(KeyError):
        ContentStore(tmp_path).read("no-existe")


def test_apply_moves_item_and_is_idempotent(tmp_path):
    store = ContentStore(tmp_path)
    seed(tmp_path, envelope())
    store.apply("p1")
    store.apply("p1")
    assert store.manifest()["items"] == []
    assert (store.applied_dir / "p1.json").exists()


def test_discard_moves_item(tmp_path):
    store = ContentStore(tmp_path)
    seed(tmp_path, envelope())
    store.discard("p1")
    assert store.manifest()["items"] == []
    assert (store.discarded_dir / "p1.json").exists()


def test_state_roundtrip(tmp_path):
    store = ContentStore(tmp_path)
    assert store.read_state() is None
    store.write_state({"team_name": "Ñandú Innovación", "nota": "acentos áéíóú"})
    assert store.read_state()["team_name"] == "Ñandú Innovación"


def test_validate_envelope_requires_tab_and_valid_slot():
    assert validate_envelope(envelope()) == []
    assert validate_envelope(envelope(tab="inexistente")) != []
    assert validate_envelope(envelope(slot="no-existe")) != []
    bad = envelope()
    del bad["payload"]
    assert validate_envelope(bad) != []


def test_schema_lists_pautado_sections():
    schema = ContentStore(Path(".")).schema()
    assert "pautado" in schema["tabs"]
    assert set(schema["slots"]["pautado"]) == {
        "problema", "solucion", "impacto", "innovacion", "prefactibilidad"
    }


def test_large_utf8_payload_roundtrip(tmp_path):
    env = envelope(text="ñandú áéíóú " * 8000)   # ~100 KB
    seed(tmp_path, env)
    leido = ContentStore(tmp_path).read("p1")
    assert leido["payload"]["text"] == env["payload"]["text"]
    assert "ñandú" in leido["payload"]["text"]


def test_manifest_survives_deeply_nested_json(tmp_path):
    d = tmp_path / "content"
    d.mkdir(parents=True)
    (d / "hondo.json").write_text("[" * 20000 + "]" * 20000, encoding="utf-8")
    assert ContentStore(tmp_path).manifest()["items"] == []


def test_manifest_survives_non_string_created_at(tmp_path):
    primero = envelope("p1")
    primero["created_at"] = 1750000000
    seed(tmp_path, primero)
    seed(tmp_path, envelope("p2"))
    items = ContentStore(tmp_path).manifest()["items"]
    assert {i["id"] for i in items} == {"p1", "p2"}


def test_move_tolerates_source_vanishing(tmp_path, monkeypatch):
    store = ContentStore(tmp_path)
    src = tmp_path / "content" / "p1.json"
    src.parent.mkdir(parents=True)

    original = Path.is_file

    def mentiroso(self):
        if self == src:
            return True  # la comprobación miente: el archivo ya no está
        return original(self)

    monkeypatch.setattr(Path, "is_file", mentiroso)
    store.apply("p1")  # no debe lanzar FileNotFoundError
    assert not (store.applied_dir / "p1.json").exists()


def test_read_tolerates_utf8_bom(tmp_path):
    env = envelope(text="bom")
    d = tmp_path / "content"
    d.mkdir(parents=True)
    (d / "p1.json").write_text(json.dumps(env), encoding="utf-8-sig")
    assert ContentStore(tmp_path).read("p1")["payload"]["text"] == "bom"
    assert [i["id"] for i in ContentStore(tmp_path).manifest()["items"]] == ["p1"]

