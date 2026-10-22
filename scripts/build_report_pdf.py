"""Construye docs/INFORME_INVESTIGACION.pdf con la identidad del proyecto.

Pasos: pandoc (Markdown -> HTML autocontenido con docs/assets/informe.css),
Chrome headless (HTML -> PDF) y PyMuPDF (folios y metadatos).
Reproducible: no depende de LaTeX.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MD = ROOT / "docs" / "INFORME_INVESTIGACION.md"
CSS = ROOT / "docs" / "assets" / "informe.css"
TEMPLATE = ROOT / "docs" / "assets" / "informe_template.html"
PDF = ROOT / "docs" / "INFORME_INVESTIGACION.pdf"
BUILD = Path.home() / "AppData" / "Local" / "Temp" / "opencode" / "rally_report_build"

CHROME_CANDIDATES = [
    Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
]

META = {
    "title": "Informe de sustento de la investigación",
    "subtitle": "Rally de Innovación: qué hemos encontrado, por qué gana quien gana",
    "version": "2.0",
    "date": "19 de octubre de 2026",
    "scope": "Rally Latinoamericano de Innovación (28 h) y Rally Nacional Nicaragua Innova (24 h)",
    "audience": "Integrantes del repositorio, equipos concursantes, docentes y jurados",
    "footleft": "Rally Studio · Documento de sustento",
    "footright": "12 figuras · 17 secciones · 2 certámenes",
}


def find_chrome() -> Path:
    for candidate in CHROME_CANDIDATES:
        if candidate.exists():
            return candidate
    raise SystemExit("No se encontro Chrome ni Edge para imprimir el PDF.")


def build_html() -> Path:
    BUILD.mkdir(parents=True, exist_ok=True)
    html = BUILD / "informe.html"
    cmd = [
        "pandoc",
        str(MD),
        "--from=markdown+implicit_figures+smart",
        "--to=html5",
        "--standalone",
        f"--template={TEMPLATE}",
        f"--css={CSS}",
        f"--resource-path={ROOT / 'docs'}",
        "--embed-resources",
        "--toc",
        "--toc-depth=2",
        "--metadata=lang=es",
        f"--output={html}",
    ]
    for key, value in META.items():
        cmd.append(f"--metadata={key}={value}")
    subprocess.run(cmd, check=True)
    return html


def print_pdf(html: Path) -> None:
    chrome = find_chrome()
    cmd = [
        str(chrome),
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-pdf-header-footer",
        "--virtual-time-budget=15000",
        f"--print-to-pdf={PDF}",
        html.as_uri(),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def stamp(pdf: Path) -> None:
    import fitz

    doc = fitz.open(pdf)
    total = doc.page_count

    # Lee el indice antes de estampar pies, para no confundir el folio con una entrada.
    toc_page = doc[1]
    entries = []
    for block in toc_page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if not text or text == "Contenido" or line["bbox"][1] > toc_page.rect.height - 60:
                continue
            entries.append((text, line["bbox"]))

    for index, page in enumerate(doc):
        if index == 0:
            continue
        width, height = page.rect.width, page.rect.height
        left, right = 48.0, width - 48.0
        y = height - 34.0
        page.draw_line(fitz.Point(left, y - 4), fitz.Point(right, y - 4), color=(0.886, 0.898, 0.933), width=0.5)
        page.insert_text(
            fitz.Point(left, y),
            "Informe de sustento · Rally Studio",
            fontname="helv",
            fontsize=7,
            color=(0.384, 0.416, 0.478),
        )
        label = f"{index + 1} / {total}"
        text_width = fitz.get_text_length(label, fontname="helv", fontsize=7)
        page.insert_text(fitz.Point(right - text_width, y), label, fontname="helv", fontsize=7, color=(0.384, 0.416, 0.478))

    # Folios del indice: busca cada titulo en el cuerpo y anota su pagina.
    for text, bbox in entries:
        found = None
        for index in range(2, total):
            if doc[index].search_for(text):
                found = index + 1
                break
        if not found:
            continue
        label = str(found)
        size = 8.6
        width_text = fitz.get_text_length(label, fontname="helv", fontsize=size)
        toc_page.insert_text(
            fitz.Point(toc_page.rect.width - 48 - width_text, bbox[3] - 2.5),
            label,
            fontname="helv",
            fontsize=size,
            color=(0.384, 0.416, 0.478),
        )

    doc.set_metadata(
        {
            "title": META["title"],
            "author": "Rally Studio",
            "subject": META["subtitle"],
            "keywords": "Rally Latinoamericano, Nicaragua Innova, investigación, evidencia, rúbricas, PAS-V",
            "creator": "pandoc + Chrome + PyMuPDF",
            "producer": "scripts/build_report_pdf.py",
        }
    )
    doc.saveIncr()
    doc.close()


if __name__ == "__main__":
    html = build_html()
    print_pdf(html)
    stamp(PDF)
    size = PDF.stat().st_size
    print(f"PDF generado: {PDF} ({size:,} bytes)")
    if shutil.which("pdftotext"):
        pass
