import json
import socket
import subprocess
import sys
import time
from pathlib import Path

import pytest

playwright = pytest.importorskip("playwright.sync_api")

REPO_ROOT = Path(__file__).resolve().parents[1]


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _wait_http(url: str, timeout: float = 30.0) -> None:
    import urllib.request

    limit = time.time() + timeout
    last = None
    while time.time() < limit:
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                if r.status == 200:
                    return
        except Exception as exc:  # noqa: BLE001 - sondeo
            last = exc
        time.sleep(0.2)
    raise RuntimeError(f"el servidor no respondió en {url}: {last}")


def _propuesta(item_id="p1", tab="pautado", slot="problema", text="Propuesta viva"):
    return {
        "id": item_id,
        "tab": tab,
        "slot": slot,
        "kind": "text",
        "title": "Propuesta de prueba",
        "source": "pytest",
        "created_at": "2026-10-19T10:00:00-06:00",
        "confidence": "media",
        "simulated": False,
        "payload": {"text": text},
    }


@pytest.fixture
def servidor(tmp_path):
    data_dir = tmp_path / "data"
    content = data_dir / "content"
    content.mkdir(parents=True)
    (content / "p1.json").write_text(
        json.dumps(_propuesta(), ensure_ascii=False), encoding="utf-8"
    )

    port = _free_port()
    env = {
        **__import__("os").environ,
        "RALLY_SERVICE_PORT": str(port),
        "RALLY_DATA_DIR": str(data_dir),
        "PYTHONIOENCODING": "utf-8",
    }
    proc = subprocess.Popen(
        [sys.executable, "scripts/rally_service.py"],
        cwd=str(REPO_ROOT),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    base = f"http://127.0.0.1:{port}"
    try:
        _wait_http(base + "/health")
        yield base
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()


@pytest.fixture
def servidor_sin_api():
    port = _free_port()
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1",
         "--directory", str(REPO_ROOT)],
        cwd=str(REPO_ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    base = f"http://127.0.0.1:{port}"
    try:
        _wait_http(base + "/dashboard/")
        yield base
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()


@pytest.fixture
def page():
    with playwright.sync_playwright() as p:
        try:
            browser = p.chromium.launch()
        except Exception as exc:  # noqa: BLE001 - navegador no instalado
            pytest.skip(f"Chromium no disponible: {exc}")
        context = browser.new_context()
        pg = context.new_page()
        try:
            yield pg
        finally:
            context.close()
            browser.close()


def test_proposal_appears_and_accepts(page, servidor):
    page.goto(f"{servidor}/dashboard/")
    card = "#rally-content-dock [data-proposal-id='p1']"
    page.wait_for_selector(card, timeout=15000)
    page.click(f"{card} button[data-action='apply']")
    page.wait_for_selector(card, state="detached", timeout=15000)

    estado = page.evaluate(
        "() => JSON.parse(localStorage.getItem('rally_studio_production_state_2026_v3') || '{}')"
    )
    assert estado["pautado"]["problema"] == "Propuesta viva"


def test_unsupported_browser_mode_is_silent(page, servidor_sin_api):
    errores = []
    page.on("pageerror", lambda exc: errores.append(str(exc)))
    page.goto(f"{servidor_sin_api}/dashboard/")
    page.wait_for_timeout(3000)
    assert page.locator("#rally-content-dock [data-proposal-id]").count() == 0
    assert [e for e in errores if "content_bridge" in e] == []
