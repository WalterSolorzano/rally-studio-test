import os
import subprocess
import sys
import time

import pytest

from tests.support import REPO_ROOT, free_port


@pytest.fixture
def servidor(tmp_path):
    port = free_port()
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    env = os.environ.copy()
    env.update({
        "RALLY_SERVICE_PORT": str(port),
        "RALLY_DATA_DIR": str(data_dir),
        "PYTHONIOENCODING": "utf-8",
    })
    previous = os.environ.get("RALLY_TEST_DATA_DIR")
    os.environ["RALLY_TEST_DATA_DIR"] = str(data_dir)
    proc = subprocess.Popen(
        [sys.executable, "scripts/rally_service.py"],
        cwd=str(REPO_ROOT), env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
    )
    base = f"http://127.0.0.1:{port}"
    deadline = time.time() + 30
    while time.time() < deadline:
        try:
            with __import__("urllib.request", fromlist=["request"]).urlopen(
                base + "/health", timeout=1
            ) as r:
                if r.status == 200:
                    break
        except Exception:
            time.sleep(0.15)
    else:
        proc.kill()
        pytest.fail("servidor no arranco: " + proc.stdout.read().decode("utf-8", "replace"))
    try:
        yield base, data_dir
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
        if previous is None:
            os.environ.pop("RALLY_TEST_DATA_DIR", None)
        else:
            os.environ["RALLY_TEST_DATA_DIR"] = previous
