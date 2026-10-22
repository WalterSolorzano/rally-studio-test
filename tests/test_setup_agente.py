import json
from pathlib import Path


def test_opencode_json_is_valid_and_declares_playwright():
    cfg = json.loads(Path("opencode.json").read_text(encoding="utf-8"))
    assert "playwright" in cfg["mcp"]


def test_install_doc_covers_both_tools():
    texto = Path("docs/INSTALACION_AGENTE.md").read_text(encoding="utf-8")
    assert ".agents/skills" in texto
    assert ".opencode/skills" in texto
    assert "24" in texto  # aviso del tope de Antigravity


def test_setup_script_is_idempotent_by_inspection():
    texto = Path("scripts/setup_agente.ps1").read_text(encoding="utf-8")
    assert "Test-Path" in texto
    assert "Junction" in texto
