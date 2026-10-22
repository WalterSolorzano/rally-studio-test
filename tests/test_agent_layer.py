from pathlib import Path


def test_agents_md_under_antigravity_limit():
    assert len(Path("AGENTS.md").read_bytes()) <= 24_000


def test_agents_md_keeps_event_rules():
    texto = Path("AGENTS.md").read_text(encoding="utf-8")
    assert "Reglas de oro" in texto
    assert "SIRLI" in texto


def test_agents_md_declares_the_profe_and_the_boundary():
    texto = Path("AGENTS.md").read_text(encoding="utf-8")
    assert "knowledge/INDICE.md" in texto
    assert "no programas el motor" in texto.lower()


def test_every_rule_has_trigger_frontmatter():
    for p in Path(".agents/rules").glob("*.md"):
        cabecera = p.read_text(encoding="utf-8").split("---")[1]
        assert "trigger:" in cabecera
