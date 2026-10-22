from pathlib import Path

import pytest

NUCLEO = [
    "contexto-rally",
    "guiar-usuario",
    "servir-a-ventana",
    "ingestar-investigacion",
    "auditar-entregable",
]

PRODUCCION = [
    "proponer-retos",
    "sugerir-por-fase",
    "propuesta-diseno",
    "modelo-3d-blender",
    "publicar-sitio",
]

TODAS = NUCLEO + PRODUCCION


@pytest.mark.parametrize("nombre", TODAS)
def test_skill_has_valid_frontmatter(nombre):
    texto = Path(f"skills/{nombre}/SKILL.md").read_text(encoding="utf-8")
    assert texto.startswith("---")
    cabecera = texto.split("---")[1]
    assert "name:" in cabecera and "description:" in cabecera


@pytest.mark.parametrize("nombre", TODAS)
def test_skill_is_short(nombre):
    assert len(Path(f"skills/{nombre}/SKILL.md").read_bytes()) <= 8_000
