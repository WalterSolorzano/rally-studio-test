#!/usr/bin/env python3
"""Extractor del banco de ganadores de SIRLI (sirli.org).

Recorre las tres colecciones publicas de ganadores y guarda un registro plano
por cada premio:

    sede            -> ganadores por sede
    nacional        -> ganadores por pais
    internacional   -> ganadores internacionales

Salida (research/sirli/):

    winners.jsonl     registro maestro, uno por linea, sin transformar
    winners.csv       misma data para abrir en planilla
    video_index.json  un item por video unico, listo para transcribir
    manifest.json     que se bajo, cuando, cuantas filas y hash del volcado
    raw/              HTML original comprimido (fuente auditable)

Uso:
    python scripts/scrape_ganadores_sirli.py              # todas las colecciones/anios
    python scripts/scrape_ganadores_sirli.py --only nacional
    python scripts/scrape_ganadores_sirli.py --refresh     # ignora cache local
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import html as htmlmod
import json
import re
import sys
import time
import unicodedata
import urllib3
from datetime import datetime, timezone
from pathlib import Path

import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE = "https://sirli.org"
INDEX_URL = f"{BASE}/ganadores/index"
COLLECTIONS = ("sede", "nacional", "internacional")
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "research" / "sirli"
RAW = OUT / "raw"

HEADERS = {
    "User-Agent": "RallyStudioResearch/1.0 (+banco de ganadores; uso academico)",
    "Accept-Language": "es-ES,es;q=0.9",
}

FIELD_RE = re.compile(
    r'<label class="col-sm-2 col-md-1 text-secondary">\s*([^<:]+?)\s*:\s*</label>'
    r"\s*<div[^>]*>(.*?)</div>",
    re.S,
)
PLACE_RE = re.compile(r'fa-solid fa-trophy[^"]*"\s*></i>\s*<strong>([^<]+)</strong>', re.S)
BLOCK_SPLIT = re.compile(r'<div class="row bd-callout-row directorio-row[^"]*">', re.S)
FLAG_RE = re.compile(r"flag-icon-([a-z]{2})\b")
TAG_RE = re.compile(r"<[^>]+>")
PAGE_OF_RE = re.compile(r"P[áa]gina\s+1\s+de\s+(\d+)", re.I)
YT_RE = re.compile(
    r"(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/|shorts/|live/))([A-Za-z0-9_-]{6,})"
)


def clean(fragment: str) -> str:
    text = TAG_RE.sub(" ", fragment)
    text = htmlmod.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def norm_key(label: str) -> str:
    """'Desafío' -> 'desafio', 'País' -> 'pais', 'Categoría' -> 'categoria'."""
    plain = unicodedata.normalize("NFKD", label)
    return "".join(c for c in plain if not unicodedata.combining(c)).strip().lower()


def session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)
    s.verify = False  # sirli.org sirve la cadena TLS incompleta
    return s


def fetch(s: requests.Session, url: str, cache: Path | None = None, refresh: bool = False) -> str:
    if cache and cache.exists() and not refresh:
        return gzip.decompress(cache.read_bytes()).decode("utf-8", "replace")
    last = None
    for attempt in range(4):
        try:
            r = s.get(url, timeout=60)
            r.raise_for_status()
            r.encoding = "utf-8"
            if cache:
                cache.parent.mkdir(parents=True, exist_ok=True)
                cache.write_bytes(gzip.compress(r.text.encode("utf-8")))
            return r.text
        except Exception as exc:  # noqa: BLE001 - reintento deliberado
            last = exc
            time.sleep(2 + attempt * 3)
    raise RuntimeError(f"fallo al bajar {url}: {last}")


def years_from_index(s: requests.Session, refresh: bool) -> list[int]:
    h = fetch(s, INDEX_URL, RAW / "index.html.gz", refresh)
    years = {int(y) for y in re.findall(r"/ganadores/(?:sede|nacional|internacional)/(\d{4})", h)}
    if not years:
        raise RuntimeError("el indice no expone anios: revisar estructura")
    return sorted(years)


def parse_page(h: str, year: int, collection: str, source_url: str) -> list[dict]:
    rows: list[dict] = []
    blocks = BLOCK_SPLIT.split(h)[1:]
    for block in blocks:
        place_m = PLACE_RE.search(block)
        if not place_m:
            continue
        fields = {}
        for name, raw in FIELD_RE.findall(block):
            fields[norm_key(name)] = raw

        team = clean(fields.get("equipo", ""))
        if not team:
            continue

        video_url = ""
        video_raw = fields.get("video", "")
        link = re.search(r'href="([^"]+)"', video_raw)
        if link:
            video_url = htmlmod.unescape(link.group(1)).strip()

        challenge_raw = clean(fields.get("desafio", ""))
        ch_num, ch_name = "", challenge_raw
        ch_m = re.match(r"^(\d{1,3})\s*[-–.]\s*(.+)$", challenge_raw)
        if ch_m:
            ch_num, ch_name = ch_m.group(1).zfill(2), ch_m.group(2).strip()

        country_raw = fields.get("pais", "")
        flag = FLAG_RE.search(country_raw)
        place_label = clean(place_m.group(1)).upper()
        place_n = {"PRIMER": 1, "SEGUNDO": 2, "TERCER": 3}.get(place_label.split()[0], None)

        yt = YT_RE.search(video_url) if video_url else None
        record = {
            "year": year,
            "collection": collection,
            "place": place_n,
            "place_label": place_label,
            "team": team,
            "category": clean(fields.get("categoria", "")),
            "challenge": challenge_raw,
            "challenge_number": ch_num,
            "challenge_name": ch_name,
            "sede": clean(fields.get("sede", "")),
            "country": clean(country_raw),
            "country_code": flag.group(1).upper() if flag else "",
            "video_url": video_url,
            "video_id": yt.group(1) if yt else "",
            "source_url": source_url,
        }
        key = "|".join(
            str(record[k]) for k in ("year", "collection", "place_label", "team", "challenge", "sede")
        )
        record["id"] = hashlib.sha1(key.encode("utf-8")).hexdigest()[:12]
        rows.append(record)
    return rows


def scrape_collection(
    s: requests.Session, collection: str, years: list[int], refresh: bool
) -> tuple[list[dict], list[dict]]:
    rows: list[dict] = []
    pages: list[dict] = []
    for year in years:
        url = f"{BASE}/ganadores/{collection}/{year}/?page=1&ipp=Todos&field=1&sort=0"
        cache = RAW / f"{collection}_{year}.html.gz"
        h = fetch(s, url, cache, refresh)
        total_pages = int(PAGE_OF_RE.search(h).group(1)) if PAGE_OF_RE.search(h) else 1
        found = parse_page(h, year, collection, url)
        if total_pages > 1:
            for page in range(2, total_pages + 1):
                purl = f"{BASE}/ganadores/{collection}/{year}/?page={page}&ipp=50&field=1&sort=0"
                ph = fetch(s, purl, RAW / f"{collection}_{year}_p{page}.html.gz", refresh)
                found += parse_page(ph, year, collection, purl)
                time.sleep(0.4)
        pages.append({"collection": collection, "year": year, "url": url, "rows": len(found)})
        print(f"  {collection:<14} {year}  {len(found):>4} filas", flush=True)
        rows += found
        time.sleep(0.6)
    return rows, pages


def dedupe(rows: list[dict]) -> list[dict]:
    seen, out = set(), []
    for r in rows:
        if r["id"] in seen:
            continue
        seen.add(r["id"])
        out.append(r)
    return out


def write_outputs(rows: list[dict], pages: list[dict]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rows.sort(key=lambda r: (-r["year"], r["collection"], r["country"], r["place"] or 9, r["sede"]))

    jsonl = "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows)
    (OUT / "winners.jsonl").write_text(jsonl, encoding="utf-8")

    with (OUT / "winners.csv").open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()), delimiter=";")
        w.writeheader()
        w.writerows(rows)

    videos: dict[str, dict] = {}
    for r in rows:
        vid = r["video_id"]
        if not vid:
            continue
        item = videos.setdefault(
            vid,
            {
                "video_id": vid,
                "url": f"https://www.youtube.com/watch?v={vid}",
                "year": r["year"],
                "collections": [],
                "winners": [],
                "transcript_status": "pending",
                "transcript_path": "",
                "visual_description_status": "pending",
            },
        )
        item["year"] = min(item["year"], r["year"])
        if r["collection"] not in item["collections"]:
            item["collections"].append(r["collection"])
        item["winners"].append(
            {
                "id": r["id"],
                "team": r["team"],
                "place_label": r["place_label"],
                "country": r["country"],
                "sede": r["sede"],
                "collection": r["collection"],
            }
        )

    (OUT / "video_index.json").write_text(
        json.dumps(sorted(videos.values(), key=lambda v: (-v["year"], v["video_id"])), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    by_year: dict[str, int] = {}
    by_collection: dict[str, int] = {}
    by_country: dict[str, int] = {}
    for r in rows:
        by_year[str(r["year"])] = by_year.get(str(r["year"]), 0) + 1
        by_collection[r["collection"]] = by_collection.get(r["collection"], 0) + 1
        by_country[r["country"]] = by_country.get(r["country"], 0) + 1

    manifest = {
        "source": "https://sirli.org/ganadores/index",
        "scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "collections": list(COLLECTIONS),
        "years": sorted({r["year"] for r in rows}),
        "records": len(rows),
        "unique_teams": len({(r["year"], r["team"]) for r in rows}),
        "videos_total": len(videos),
        "videos_missing": sum(1 for r in rows if not r["video_id"]),
        "by_collection": by_collection,
        "by_year": dict(sorted(by_year.items())),
        "by_country": dict(sorted(by_country.items(), key=lambda kv: -kv[1])),
        "pages": pages,
        "sha256_winners_jsonl": hashlib.sha256(jsonl.encode("utf-8")).hexdigest(),
        "files": {
            "winners.jsonl": "registro maestro, un JSON por linea",
            "winners.csv": "misma data, separador ; y BOM para Excel",
            "video_index.json": "un item por video unico, pendiente de transcripcion",
            "raw/": "HTML original comprimido por anio y coleccion",
        },
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{len(rows)} registros | {len({r['team'] for r in rows})} equipos | {len(videos)} videos unicos")
    print(f"-> {OUT}")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--only", choices=COLLECTIONS, action="append", help="limita a una coleccion")
    ap.add_argument("--refresh", action="store_true", help="ignora el HTML cacheado")
    args = ap.parse_args()

    s = session()
    years = years_from_index(s, args.refresh)
    print(f"anios detectados: {years}")

    rows: list[dict] = []
    pages: list[dict] = []
    for collection in args.only or COLLECTIONS:
        got, seen = scrape_collection(s, collection, years, args.refresh)
        rows += got
        pages += seen

    rows = dedupe(rows)
    if not rows:
        print("sin filas: la estructura del sitio cambio", file=sys.stderr)
        return 1
    write_outputs(rows, pages)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
