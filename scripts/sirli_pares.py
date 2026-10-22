"""Genera la lista de contrapartes emparejadas para la familia D.

Para cada primer lugar de sede Nicaragua 2022+ que YA tiene transcripción, busca
los 2.º y 3.º del mismo (año, sede, desafío). Es la muestra que permite comparar
guiones dentro del mismo desafío, sin confundir el puesto con el año ni con la sede.
"""
import csv
import io
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DS = ROOT / "research" / "sirli" / "analisis" / "dataset_videos.csv"
OUT = ROOT / "research" / "sirli" / "video_queue_pares.txt"

rows = list(csv.DictReader(io.open(DS, encoding="utf-8-sig")))
nic = [r for r in rows
       if r["country"] == "NICARAGUA" and r["collection"] == "sede" and int(r["year"]) >= 2022]

grp = defaultdict(list)
for r in nic:
    grp[(r["year"], r["sede"], r["challenge_name"])].append(r)

pairs = 0
challenges = set()
ids, seen = [], set()
for r in nic:
    if r["place_best"] != "1" or r["has_text"] != "1":
        continue
    key = (r["year"], r["sede"], r["challenge_name"])
    others = [o for o in grp[key] if o["place_best"] != "1"]
    if not others:
        continue
    challenges.add(key)
    for o in others:
        if o["has_text"] == "1":
            continue
        pairs += 1
        if o["video_id"] not in seen:
            seen.add(o["video_id"])
            ids.append(o["video_id"])

OUT.write_text("\n".join(ids) + "\n", encoding="utf-8")
print(f"desafios emparejados: {len(challenges)}")
print(f"contrapartes: {pairs} · videos unicos: {len(ids)}")
print(f"escrito: {OUT}")
