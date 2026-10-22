from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]


def test_gitignore_covers_mailbox():
    texto = (RAIZ / ".gitignore").read_text(encoding="utf-8")
    assert "dashboard/data/content/" in texto
    assert "dashboard/data/state.json" in texto


def test_pages_workflow_excludes_mailbox():
    texto = (RAIZ / ".github/workflows/pages.yml").read_text(encoding="utf-8")
    assert "data/content" in texto
    assert "data/state.json" in texto


def test_applied_and_discarded_are_private():
    ignore = (RAIZ / ".gitignore").read_text(encoding="utf-8")
    pages = (RAIZ / ".github/workflows/pages.yml").read_text(encoding="utf-8")
    for carpeta in ("applied", "discarded"):
        assert f"dashboard/data/{carpeta}/" in ignore
        assert f"data/{carpeta}" in pages
