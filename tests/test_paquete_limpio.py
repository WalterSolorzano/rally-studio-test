import json
from pathlib import Path


def test_brief_is_blank_template():
    brief = json.loads(Path("brief.json").read_text(encoding="utf-8"))
    for campo in ("project_name", "team_name", "university", "city", "challenge_id"):
        assert brief[campo] == ""


def test_no_demo_project_identity():
    for p in [Path("brief.json"), Path("README.md"), Path("docs/DESCARGA.md")]:
        texto = p.read_text(encoding="utf-8")
        assert "hidro-vigia" not in texto
        assert "mentes-pinoleras" not in texto


def test_personal_artifacts_absent():
    for ruta in ("budget/screenshots", "dashboard/assets_uploads"):
        assert not Path(ruta).exists()


def test_corpus_still_present():
    for ruta in ("research/claims.json", "knowledge/rubric_latam.md",
                 "knowledge/INDICE.md", "AGENTS.md", "docs/INSTALACION_AGENTE.md"):
        assert Path(ruta).exists()
