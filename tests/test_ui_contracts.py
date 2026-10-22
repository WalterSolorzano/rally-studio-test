from pathlib import Path

DASH = Path(__file__).resolve().parent.parent / "dashboard"


def test_join_page_has_name_field_and_claim_endpoint():
    html = (DASH / "join.html").read_text(encoding="utf-8")
    js = (DASH / "join.js").read_text(encoding="utf-8")
    assert 'id="join-name"' in html
    assert 'id="join-form"' in html
    assert "/api/project/claim" in js
    assert "rally_session_token" in js
    assert "rally_project" in js


def test_section_sync_sends_session_and_project():
    js = (DASH / "section_sync.js").read_text(encoding="utf-8")
    assert "Authorization" in js
    assert "rally_session_token" in js
    assert "rally_project" in js
    assert "POLL_MS = 1000" in js
    assert "accessRevoked" in js


def test_section_sync_blocks_seeding_for_plain_members():
    js = (DASH / "section_sync.js").read_text(encoding="utf-8")
    assert '"operator"' in js and '"admin"' in js
    assert "sections/import" in js


def test_admin_page_has_member_and_invite_controls():
    html = (DASH / "admin.html").read_text(encoding="utf-8")
    js = (DASH / "admin.js").read_text(encoding="utf-8")
    assert 'id="members-list"' in html
    assert 'id="create-invite"' in html
    assert "/api/members" in js
    assert "/api/invites" in js
    assert "/revoke" in js


DESIGN = Path(__file__).resolve().parent.parent / "design"


def test_kit_page_has_preview_and_export_controls():
    html = (DESIGN / "kit.html").read_text(encoding="utf-8")
    assert 'id="kitPreview"' in html
    assert 'id="exportPngKit"' in html
    assert 'id="exportPdfKit"' in html


def test_thumb_page_has_preview_and_export_controls():
    html = (DESIGN / "thumb.html").read_text(encoding="utf-8")
    assert 'id="thumbPreview"' in html
    assert 'id="exportPngThumb"' in html
    assert 'id="exportPdfThumb"' in html


def test_kit_js_has_render_and_export_functions():
    js = (DESIGN / "kit.js").read_text(encoding="utf-8")
    assert "renderKit" in js
    assert "exportPNG" in js
    assert "exportPDF" in js


def test_thumb_js_has_render_and_export_functions():
    js = (DESIGN / "thumb.js").read_text(encoding="utf-8")
    assert "renderThumb" in js
    assert "exportPNG" in js
    assert "exportPDF" in js


def test_fonts_library_has_at_least_40_families():
    js = (DESIGN / "fonts.js").read_text(encoding="utf-8")
    assert js.count("family:") >= 40


def test_kit_palette_keeps_black_for_ink():
    js = (DESIGN / "kit.js").read_text(encoding="utf-8")
    assert "r < 40 && g < 40 && b < 40" not in js


def test_kit_variants_labeled():
    html = (DESIGN / "kit.html").read_text(encoding="utf-8")
    assert "variantes de uso" in html


def test_ventana_module_writes_logo_and_palette_sections():
    js = (DESIGN / "ventana.js").read_text(encoding="utf-8")
    assert "/sections" in js
    assert "team_logo_img" in js
    assert "palette" in js
    assert "base_version" in js


def test_kit_page_can_send_identity_to_the_window():
    html = (DESIGN / "kit.html").read_text(encoding="utf-8")
    assert 'id="enviarVentana"' in html
    assert "ventana.js" in html
    kit_js = (DESIGN / "kit.js").read_text(encoding="utf-8")
    assert "enviarIdentidad" in kit_js


def test_shared_identity_is_the_only_source_of_palette():
    kit_js = (DESIGN / "kit.js").read_text(encoding="utf-8")
    assert "cPrimary" not in kit_js
    assert "cNavy" not in kit_js
    for js in ("kit.js", "thumb.js"):
        text = (DESIGN / js).read_text(encoding="utf-8")
        assert "loadIdentity()" in text


def test_default_university_is_uni_and_city_is_empty():
    shared = (DESIGN / "shared.js").read_text(encoding="utf-8")
    assert "Universidad Nacional de Ingeniería" in shared
    assert "assets/logo_uni.png" in shared
    assert "assets/logo_uni_symbol.png" in shared
    contenido = (DESIGN / "contenido.js").read_text(encoding="utf-8")
    assert "university: 'Universidad Nacional de Ingeniería'" in contenido
    assert "city: ''" in contenido
    for asset in ("logo_uni.png", "logo_uni_symbol.png"):
        assert (DESIGN / "assets" / asset).exists()


def test_kit_hides_university_and_city_by_default():
    html = (DESIGN / "kit.html").read_text(encoding="utf-8")
    assert 'id="uni"' in html and 'id="city"' in html
    # los campos editables viven en un bloque colapsado
    assert "Institución (oculto)" in html
    assert 'id="kitUniMark"' in html
    assert 'id="kitCityCell"' in html
