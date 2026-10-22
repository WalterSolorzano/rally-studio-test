# Task 9: el pack publicado incluye el modulo impacto.
import json
import os
import subprocess
import sys

import pytest


def _corre(slug, out):
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    r = subprocess.run(
        [sys.executable, "scripts/gen_pagina_diseno.py", "--slug", slug, "--out", str(out)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        env=env,
    )
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


def test_pack_incluye_modulo_impacto(tmp_path):
    datos = _corre("probe", tmp_path / "out")
    assert datos["ok"] is True
    assert datos["slug"] == "probe"
    out = tmp_path / "out"
    for nombre in ("impacto.html", "impacto.js", "impacto.css", "ods_data.js"):
        assert (out / nombre).is_file(), nombre
