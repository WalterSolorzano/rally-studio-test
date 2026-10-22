#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Genera la silueta de Nicaragua (path SVG) para el modulo design/.

Fuente: geoBoundaries gbOpen NIC ADM0 (Public Domain, Wikimedia).
Salida: design/mapa_ni.js  ->  var MAPA_NI = {path:"...", vb:"0 0 W H"}
"""
import json
import math
import os
import sys
import urllib.request

URL = ("https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/"
       "NIC/ADM0/geoBoundaries-NIC-ADM0_simplified.geojson")
CACHE = os.path.join(os.path.dirname(__file__), ".cache", "nic_adm0.geojson")
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "design", "mapa_ni.js")
VB_H = 130.0          # alto del viewBox
MIN_DIST = 0.35       # simplificacion: distancia minima entre puntos (en unidades del viewBox)


def load():
    if os.path.exists(CACHE):
        with open(CACHE, "r", encoding="utf-8") as fh:
            return json.load(fh)
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    req = urllib.request.Request(URL, headers={"User-Agent": "rally-studio/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read().decode("utf-8")
    with open(CACHE, "w", encoding="utf-8") as fh:
        fh.write(data)
    return json.loads(data)


def rings(geo):
    """Devuelve la lista de anillos exteriores (excluye holes)."""
    feats = geo.get("features") or []
    out = []
    for f in feats:
        geom = f.get("geometry") or {}
        gtype = geom.get("type")
        coords = geom.get("coordinates") or []
        if gtype == "Polygon":
            for poly in coords:
                if poly:
                    out.append(poly[0])
        elif gtype == "MultiPolygon":
            for poly in coords:
                if poly and poly[0]:
                    out.append(poly[0])
    return out


def main():
    geo = load()
    polys = rings(geo)
    if not polys:
        print("ERROR: sin geometria")
        return 1
    poly = max(polys, key=lambda r: len(r))

    # equirectangular con correccion de latitud
    lons = [p[0] for p in poly]
    lats = [p[1] for p in poly]
    lat0 = sum(lats) / len(lats)
    kx = math.cos(math.radians(lat0))
    xs = [p[0] * kx for p in poly]
    ys = [p[1] for p in poly]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    w = maxx - minx
    h = maxy - miny
    scale = VB_H / h
    vb_w = round(w * scale, 1)

    def proj(p):
        return ((p[0] * kx - minx) * scale, (maxy - p[1]) * scale)

    pts = [proj(p) for p in poly]
    # cierre
    if pts[0] != pts[-1]:
        pts.append(pts[0])

    # simplificacion (Ramer-Douglas-Peucker simple por distancia)
    simple = [pts[0]]
    for p in pts[1:-1]:
        last = simple[-1]
        if math.hypot(p[0] - last[0], p[1] - last[1]) >= MIN_DIST:
            simple.append(p)
    simple.append(pts[-1])

    d = "M" + " L".join("%.1f %.1f" % (x, y) for x, y in simple) + " Z"
    js = ("// Generado por scripts/gen_mapa_nicaragua.py - geoBoundaries NIC ADM0 (Public Domain)\n"
          "var MAPA_NI = {path:%s, vb:'0 0 %s %s'};\n" % (json.dumps(d), vb_w, VB_H))
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(js)
    print("OK -> %s (viewBox 0 0 %s %s, %d puntos, %.1f KB)" %
          (OUT, vb_w, VB_H, len(simple), len(js) / 1024.0))
    return 0


if __name__ == "__main__":
    sys.exit(main())
