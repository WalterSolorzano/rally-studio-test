#!/usr/bin/env python3
"""
coherencia.py -- Cruza las cifras del guion, la narracion y el pautado.

Patron perdedor documentado: el jurado detecta que el video dice una cifra y
el PDF dice otra. Este check normaliza los numeros (miles, decimales, moneda,
porcentaje) y reporta los que aparecen en un entregable y no en el otro.

Solo falla (codigo 1) con cifras significativas: decimales, porcentajes,
montos o valores >= 100. Los numeros pequenos de enumeracion se informan como
menores para no llenar la salida de ruido.
"""
from __future__ import annotations

import pathlib
import re
import sys

# Un token numerico con separadores internos, sin capturar el signo.
_TOKEN_RE = re.compile(r"\d[\d.,]*\d|\d")
# Contexto que delata una cifra significativa.
_MONEDA = ("$", "usd", "c$", "eur", "€", "dólares", "dolares", "córdobas", "cordobas")
_RUIDO = re.compile(
    r"car[aá]cter|palabra|segundo|minuto|\bm[aá]x\b|m[aá]ximo|l[ií]mite|duraci[oó]n",
    re.IGNORECASE,
)
_ESTRUCTURAL = re.compile(
    r"\bacto\b|\bpas-v\b|f[oó]rmula|plantilla|guion|storyboard|shotlist|video de"
    r"|timing|\bpts\b|puntaje|rango [oó]ptimo",
    re.IGNORECASE,
)
_HORA = re.compile(r"\b\d{1,2}:\d{2}(?::\d{2})?\b")
_MARCADOR = re.compile(r"\{/?SEC_[A-Z_]+\}", re.IGNORECASE)


def _normalizar_token(token: str) -> str:
    """Convierte 1,250 / 1.250 / 1 250 / 1250.00 a una forma canonica."""
    t = token.strip(".,")

    if re.fullmatch(r"\d{1,3}(?:[.,]\d{3})+", t):
        return t.replace(",", "").replace(".", "")

    if "," in t and "." in t:
        # El ultimo separador es el decimal.
        if t.rfind(",") > t.rfind("."):
            return t.replace(".", "").replace(",", ".")
        return t.replace(",", "")

    if "," in t:
        entero, _, decimal = t.partition(",")
        if len(decimal) == 3 and 1 <= len(entero) <= 3:
            return entero + decimal
        return f"{entero}.{decimal}"

    if "." in t:
        entero, _, decimal = t.partition(".")
        if len(decimal) == 3 and 1 <= len(entero) <= 3:
            return entero + decimal
        return f"{entero}.{decimal}"

    return t


def _canonico(valor: str) -> str:
    """Quita ceros decimales sobrantes: 1250.0 -> 1250, 12.50 -> 12.5."""
    if "." in valor:
        entero, _, decimal = valor.partition(".")
        decimal = decimal.rstrip("0")
        return f"{entero}.{decimal}" if decimal else entero
    return valor


def extraer(texto: str) -> dict[str, dict]:
    """Devuelve {numero_canonico: {significativo, moneda, porcentaje, muestras}}."""
    texto = _HORA.sub(" ", texto)
    texto = _MARCADOR.sub(" ", texto)
    encontrados: dict[str, dict] = {}
    for match in _TOKEN_RE.finditer(texto):
        token = match.group(0)
        if not re.search(r"\d", token):
            continue
        valor = _canonico(_normalizar_token(token))
        antes = texto[max(0, match.start() - 12):match.start()].lower()
        despues = texto[match.end():match.end() + 12].lower()
        moneda = any(simbolo in antes for simbolo in _MONEDA)
        porcentaje = despues.lstrip().startswith("%")
        try:
            numero = float(valor)
        except ValueError:
            continue
        significativo = moneda or porcentaje or "." in valor or numero >= 100
        entrada = encontrados.setdefault(valor, {
            "significativo": False,
            "moneda": False,
            "porcentaje": False,
            "muestras": 0,
        })
        entrada["significativo"] = entrada["significativo"] or significativo
        entrada["moneda"] = entrada["moneda"] or moneda
        entrada["porcentaje"] = entrada["porcentaje"] or porcentaje
        entrada["muestras"] += 1
    return encontrados


def _limpiar_lineas(texto: str) -> str:
    lineas = []
    for linea in texto.splitlines():
        # Una linea tecnica (limites, actos, duracion) no es una cifra del pitch.
        if (_RUIDO.search(linea) or _ESTRUCTURAL.search(linea)) and not re.search(r"\d\.\d", linea):
            continue
        lineas.append(linea)
    return "\n".join(lineas)


def desde_texto(texto: str) -> dict[str, dict]:
    return extraer(_limpiar_lineas(texto))


def desde_docx(ruta: pathlib.Path) -> dict[str, dict]:
    import docx  # import local: el check no debe romper si falta la dependencia

    doc = docx.Document(str(ruta))
    partes = [p.text for p in doc.paragraphs]
    for tabla in doc.tables:
        for fila in tabla.rows:
            partes.extend(celda.text for celda in fila.cells)
    return desde_texto("\n".join(partes))


def desde_archivo(ruta: pathlib.Path) -> dict[str, dict]:
    if ruta.suffix.lower() == ".docx":
        return desde_docx(ruta)
    return desde_texto(ruta.read_text(encoding="utf-8", errors="replace"))


def comparar(fuentes: dict[str, dict[str, dict]], ignorar: set[str] | None = None) -> list[dict]:
    ignorar = ignorar or set()
    nombres = list(fuentes)
    if len(nombres) < 2:
        return []
    union: dict[str, set[str]] = {}
    for nombre, numeros in fuentes.items():
        for valor in numeros:
            union.setdefault(valor, set()).add(nombre)

    hallazgos: list[dict] = []
    for valor, presentes in sorted(union.items(), key=lambda kv: float(kv[0])):
        if valor in ignorar or len(presentes) == len(nombres):
            continue
        datos = next(fuentes[n][valor] for n in presentes)
        faltan = [n for n in nombres if n not in presentes]
        gravedad = "importante" if datos["significativo"] else "menor"
        detalle = []
        if datos["moneda"]:
            detalle.append("moneda")
        if datos["porcentaje"]:
            detalle.append("porcentaje")
        sufijo = f" ({', '.join(detalle)})" if detalle else ""
        hallazgos.append({
            "gravedad": gravedad,
            "que": f"Cifra {valor}{sufijo} presente en {', '.join(sorted(presentes))} y ausente en {', '.join(faltan)}",
            "hacer": "Unifica la cifra en los tres entregables o retirala del que la invento",
            "numero": valor,
        })
    return hallazgos


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    rutas = {
        "guion": pathlib.Path("script/script.md"),
        "narracion": pathlib.Path("script/narration.txt"),
        "pautado": pathlib.Path("docs/pautado_draft.docx"),
    }
    ignorar: set[str] = set()
    for arg in argv:
        if arg.startswith("--ignorar="):
            ignorar = {_canonico(_normalizar_token(x)) for x in arg.split("=", 1)[1].split(",") if x.strip()}

    fuentes: dict[str, dict] = {}
    for nombre, ruta in rutas.items():
        if not ruta.exists():
            print(f"  PENDIENTE: {nombre} no existe ({ruta}).")
            continue
        fuentes[nombre] = desde_archivo(ruta)
        print(f"  {nombre}: {len(fuentes[nombre])} cifras distintas en {ruta}")

    if len(fuentes) < 2:
        print("  PENDIENTE: hacen falta al menos dos entregables para cruzar cifras.")
        return 1
    if "pautado" not in fuentes:
        print("  PENDIENTE: sin pautado no se puede cerrar la coherencia antes de SIRLI.")
        return 1

    hallazgos = comparar(fuentes, ignorar)
    if not hallazgos:
        print("  OK: las cifras coinciden entre los entregables comparados.")
        return 0

    criticos = [h for h in hallazgos if h["gravedad"] == "importante"]
    for h in hallazgos:
        icono = "!" if h["gravedad"] == "importante" else "."
        print(f"  [{icono}] {h['que']}")
        print(f"      -> {h['hacer']}")
    print(f"\n  {len(criticos)} discrepancias significativas de {len(hallazgos)} totales.")
    return 1 if criticos else 0


if __name__ == "__main__":
    raise SystemExit(main())
