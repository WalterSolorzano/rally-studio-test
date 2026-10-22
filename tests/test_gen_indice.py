from scripts.gen_indice import generar_indice


def test_indice_lists_every_corpus_file(tmp_path):
    (tmp_path / "research").mkdir()
    (tmp_path / "knowledge").mkdir()
    (tmp_path / "research" / "challenges.json").write_text("{}", encoding="utf-8")
    (tmp_path / "knowledge" / "rubric_latam.md").write_text("# rubrica", encoding="utf-8")
    (tmp_path / "knowledge" / "winners.pdf").write_bytes(b"%PDF-1.4")

    out = generar_indice(tmp_path)
    texto = out.read_text(encoding="utf-8")

    assert "research/challenges.json" in texto
    assert "knowledge/rubric_latam.md" in texto
    assert "knowledge/winners.pdf" in texto


def test_indice_survives_missing_brief(tmp_path):
    (tmp_path / "knowledge").mkdir()
    (tmp_path / "knowledge" / "a.md").write_text("x", encoding="utf-8")

    out = generar_indice(tmp_path)

    assert out.exists()
    assert "knowledge/a.md" in out.read_text(encoding="utf-8")


def test_indice_skips_cache_and_process_docs(tmp_path):
    cache = tmp_path / "graphify-out" / "cache"
    cache.mkdir(parents=True)
    (cache / "x.json").write_text("{}", encoding="utf-8")
    (tmp_path / "graphify-out" / "graph.json").write_text("{}", encoding="utf-8")
    proceso = tmp_path / "docs" / "superpowers"
    proceso.mkdir(parents=True)
    (proceso / "plan.md").write_text("x", encoding="utf-8")

    texto = generar_indice(tmp_path).read_text(encoding="utf-8")

    assert "graphify-out/graph.json" in texto
    assert "cache/x.json" not in texto
    assert "superpowers/plan.md" not in texto


def test_indice_is_under_token_budget(tmp_path):
    research = tmp_path / "research"
    research.mkdir()
    for i in range(80):
        (research / f"doc_{i}.md").write_text("x", encoding="utf-8")

    out = generar_indice(tmp_path)

    assert out.stat().st_size < 40 * 1024
