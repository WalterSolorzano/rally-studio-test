#!/usr/bin/env python3
"""
gen_script.py -- Genera script/script.md, script/shotlist.csv y script/narration.txt
basado en brief.json, claims.json y la formula ganadora de 4 actos (2014-2026).

Reglas de contenido:
  - Un claim solo entra si es relevante al reto elegido (challenge_id o titulo).
    Si no hay claims relevantes se usa un planteamiento cualitativo: nunca se
    inyectan cifras de otro desafio ni se inventan datos.
  - La narracion apunta a 240-270 palabras para llenar 120 segundos.
  - La cifra de costo sale de budget/budget.json; no se hardcodea.
"""
import csv
import io
import json
import pathlib
import re
import sys
import unicodedata

from moneda import contexto, costo_unitario, costo_unitario_usd

# Windows UTF-8 safety
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BRIEF_PATH = pathlib.Path("brief.json")
CLAIMS_PATH = pathlib.Path("research/claims.json")
BUDGET_PATH = pathlib.Path("budget/budget.json")

PALABRAS_MIN = 240
PALABRAS_MAX = 270
PALABRAS_OBJETIVO = 258

# Palabras demasiado genericas: no sirven para decidir si un claim es del reto.
STOPWORDS = {
    "para", "como", "sobre", "entre", "desde", "hasta", "cuando", "donde",
    "este", "esta", "estos", "estas", "otro", "otra", "otros", "otras",
    "sistema", "sistemas", "solucion", "soluciones", "proyecto", "proyectos",
    "desafio", "desafios", "reto", "retos", "innovacion", "desarrollo",
    "nacional", "latam", "nicaragua", "america", "latina", "latinoamerica",
    "gestion", "proceso", "procesos", "servicio", "servicios", "digital",
    "tecnologia", "tecnologico", "social", "impacto", "mejora", "nuevo",
    "nueva", "mediante", "través", "traves", "cada", "todo", "toda",
    "perdidas", "personas", "afectan", "anualmente", "costos", "costo",
    "reduccion", "aumento", "millones", "porcentaje", "datos", "tiempo",
    "zonas", "zona", "pais", "region",
}


def _normalizar(texto) -> str:
    """Minusculas sin acentos ni puntuacion, para comparar palabras."""
    plano = unicodedata.normalize("NFKD", str(texto or ""))
    plano = "".join(c for c in plano if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", plano.lower()).strip()


def _claves(texto) -> set:
    return {
        palabra
        for palabra in _normalizar(texto).split()
        if len(palabra) >= 4 and palabra not in STOPWORDS
    }


def _cargar_json(ruta: pathlib.Path, defecto):
    if not ruta.exists():
        return defecto
    try:
        return json.loads(ruta.read_text(encoding="utf-8-sig"))
    except (json.JSONDecodeError, OSError) as exc:
        print(f"WARN: no se pudo leer {ruta}: {exc}")
        return defecto


def _load_data():
    if not BRIEF_PATH.exists():
        print("ERROR: brief.json no existe. Ejecuta python scripts/init_brief.py primero.")
        sys.exit(1)
    brief = _cargar_json(BRIEF_PATH, {})
    claims = _cargar_json(CLAIMS_PATH, [])
    if not isinstance(claims, list):
        claims = []
    return brief, claims


def _tags_de_claim(claim: dict) -> list:
    tags = claim.get("challenge_ids")
    if isinstance(tags, list):
        return [str(t) for t in tags if str(t).strip()]
    if isinstance(tags, str) and tags.strip():
        return [tags]
    unico = claim.get("challenge_id") or claim.get("challenge")
    return [str(unico)] if unico else []


def _ids_coinciden(a, b) -> bool:
    """Compara IDs de reto tolerando ceros a la izquierda ("03" == "3")."""
    na, nb = _normalizar(a), _normalizar(b)
    if not na or not nb:
        return False
    if na.isdigit() and nb.isdigit():
        return int(na) == int(nb)
    return na == nb


def claims_relevantes(claims: list, brief: dict) -> list:
    """Devuelve solo los claims que pertenecen al reto del brief.

    Orden de decision:
      1. Si el claim declara challenge_ids/challenge_id, manda ese tag.
      2. Si no declara tag, se compara su texto con el titulo del reto y con
         las palabras clave opcionales del brief (challenge_keywords).
    El titulo del reto es la unica fuente: la descripcion del proyecto suele
    contener terminos generales que darian falsos positivos.
    """
    reto_id = _normalizar(brief.get("challenge_id"))
    vocabulario = _claves(brief.get("challenge_title", ""))
    extra = brief.get("challenge_keywords") or []
    if isinstance(extra, str):
        extra = [extra]
    for palabra in extra:
        vocabulario |= _claves(palabra)

    relevantes = []
    for claim in claims:
        if not isinstance(claim, dict) or not claim.get("stat"):
            continue
        tags = _tags_de_claim(claim)
        if tags:
            if reto_id and any(_ids_coinciden(tag, reto_id) for tag in tags):
                relevantes.append(claim)
            continue
        if not vocabulario:
            continue
        texto_claim = " ".join(
            str(claim.get(campo, ""))
            for campo in ("stat", "title", "tema", "theme", "themes")
        )
        if vocabulario & _claves(texto_claim):
            relevantes.append(claim)
    return relevantes


def _formato_costo(total: float, ctx: dict, es_referencia_usd: bool) -> str:
    if ctx.get("code") == "NIO" and not es_referencia_usd:
        return f"C${total:,.0f}"
    return f"${total:,.0f} USD"


def _costo_de_implementacion(brief: dict):
    """Toma el total real del presupuesto. Devuelve (texto, ctx) o (None, ctx)."""
    ctx = contexto(brief)
    filas = _cargar_json(BUDGET_PATH, [])
    if not isinstance(filas, list) or not filas:
        return None, ctx

    total = 0.0
    completo = True
    for fila in filas:
        if not isinstance(fila, dict):
            completo = False
            break
        valor = costo_unitario(fila, ctx)
        if valor is None:
            completo = False
            break
        total += float(fila.get("units", 1)) * valor

    if completo and total > 0:
        return _formato_costo(total, ctx, es_referencia_usd=False), ctx

    # Si falta la tasa BCN o hay rubros en otra moneda, se usa el total ya
    # calculado del budget.json y se declara como referencia en USD.
    total_json = 0.0
    for fila in filas:
        if not isinstance(fila, dict):
            continue
        valor = fila.get("total")
        if valor is None:
            valor = costo_unitario_usd(fila, ctx)
            valor = (valor or 0) * float(fila.get("units", 1))
        try:
            total_json += float(valor)
        except (TypeError, ValueError):
            continue
    if total_json > 0:
        return _formato_costo(total_json, {"code": "USD"}, es_referencia_usd=True), ctx
    return None, ctx


def _oracion_costo(costo: str | None) -> str:
    if costo:
        return (
            f"La puesta en marcha requiere un costo de implementacion de {costo}."
        )
    return (
        "La puesta en marcha requiere un costo de implementacion superficial "
        "que el presupuesto detalla con enlaces verificables."
    )


def _textos_actos(brief: dict, claims: list, costo: str | None) -> dict:
    project = brief.get("project_name", "PROYECTO").upper()
    team = brief.get("team_name", "EQUIPO")
    rally = (brief.get("rally_type") or "nacional").lower()
    city = brief.get("city", "")
    challenge = brief.get("challenge_title", "Desafio Seleccionado")
    ods_list = ", ".join(brief.get("ods_ids") or [])
    desc = brief.get("description_one_line", "").strip()
    axis = brief.get("national_plan_axis", "").strip()

    if claims:
        lead = claims[0]
        lead_stat = lead["stat"]
        fuente = str(lead.get("source", "Fuente")).strip()
        # Evita parentesis anidados: "SINAPRED (Sistema...)" -> "SINAPRED".
        fuente_corta = re.sub(r"\s*\([^)]*\)\s*$", "", fuente).strip() or fuente
        lead_source = f"({fuente_corta}, {lead.get('year', '')})".replace(", )", ")")
        a1_req = [
            f"{lead_stat} {lead_source}.",
            f"Ese dato enmarca el reto que atendemos en {city}.",
        ]
        a1_opt = [
            "Detras de cada cifra hay personas y equipos que pierden horas, ingresos "
            "y oportunidades mientras la informacion llega tarde.",
        ]
        hook_onscreen = f"{lead_stat.upper()}\nFuente: {lead_source}"
        hook_visual = (
            f"Fondo oscuro, tipografia sobria con dato critico ({lead_stat}). "
            f"Rostro o testimonio de persona afectada en {city}. SIN logos ni nombres."
        )
    else:
        a1_req = [
            f"El reto tiene nombre: {challenge}. En {city} todavia se resuelve con "
            "datos dispersos, llamadas y decisiones que llegan tarde.",
            "El problema no es la falta de esfuerzo. Es la falta de una respuesta "
            "simple, medible y a tiempo.",
        ]
        a1_opt = [
            "Cuando la informacion no esta a tiempo, se duplican tareas, se pierden "
            "decisiones y se llega tarde a la entrega.",
        ]
        hook_onscreen = f"{challenge.upper()}\n{city}"
        hook_visual = (
            f"Fondo oscuro, tipografia sobria con el nombre del reto. Escena cotidiana "
            f"de trabajo manual y decisiones tardias en {city}. SIN logos ni nombres."
        )

    a2_req = [
        f"Para cerrar esa brecha nace {project}, desarrollado por {team}.",
    ]
    if desc:
        a2_req.append(desc if desc.endswith((".", "!", "?")) else desc + ".")
    a2_req.append(
        "La solucion se organiza en tres capas: captura de informacion, procesamiento "
        "y una interfaz que convierte los datos en decisiones."
    )
    a2_opt = [
        "Cada modulo es independiente: si una pieza falla, el resto sigue operando, "
        "y el despliegue crece por etapas sin rehacer toda la infraestructura.",
        "El prototipo ya se puede probar: flujo completo de punta a punta, datos "
        "reales y un panel con historial y alertas en tiempo real.",
        "La innovacion esta en la arquitectura: parametros configurables, insumos de "
        "mercado local y mantenimiento que el propio equipo puede ejecutar.",
    ]

    a3_req = [
        _oracion_costo(costo),
        "El presupuesto se sostiene con precios mayoristas verificables y enlaces "
        "de respaldo, no con estimaciones al aire.",
    ]
    a3_opt = [
        "La operacion se financia con una cuota mensual por usuario o sitio activo, y "
        "con servicios de instalacion y capacitacion para cooperativas y gobiernos locales.",
        "Los componentes y licencias se reutilizan y se reparan por modulo, lo que baja "
        "el costo de reposicion y alarga la vida util del piloto.",
        "Cada rubro se puede auditar: unidades, costo unitario, proveedor y fecha de "
        "consulta quedan a la vista del jurado.",
    ]

    if rally == "latam":
        a4_req = [
            f"El piloto arranca en {city} y se mide con tres indicadores: tiempo de "
            "respuesta, usuarios o sitios activos y costo por unidad operativa.",
            f"Aporta directamente a {ods_list} y a las metas regionales de resiliencia."
            if ods_list
            else "Aporta directamente a los ODS priorizados y a las metas regionales de resiliencia.",
            f"{project}: innovacion latinoamericana disenada para replicarse, no para quedarse en un solo pais.",
        ]
        cierre_visual = (
            "3 iconos con metricas auditables proyectadas + logos ODS monocromos "
            "coloreados con la paleta de marca. Cierre: piloto en la ciudad, solucion "
            "replicable en toda America Latina."
        )
    else:
        axis_txt = axis if axis.lower().startswith("eje") else f"eje {axis}"
        a4_req = [
            f"El piloto arranca en {city} y se mide con tres indicadores: tiempo de "
            "respuesta, usuarios o sitios activos y costo por unidad operativa.",
            (
                f"Aporta a {ods_list} y al Plan Nacional de Lucha Contra la Pobreza, "
                f"{axis_txt}."
                if ods_list and axis
                else (
                    f"Aporta a {ods_list} y a las prioridades del Plan Nacional de Lucha Contra la Pobreza."
                    if ods_list
                    else "Aporta a los ODS priorizados y a las prioridades del Plan Nacional de Lucha Contra la Pobreza."
                )
            ),
            f"{project}: talento nicaraguense al servicio de la comunidad.",
        ]
        cierre_visual = (
            "3 iconos con metricas auditables proyectadas + logos ODS monocromos "
            "coloreados con la paleta de marca. Retorno a la comunidad con la solucion activa."
        )

    a4_opt = [
        "El piloto deja capacidad instalada: personas capacitadas, datos abiertos y "
        "un modelo que se puede replicar sin empezar de cero.",
        "La meta no termina en el video: termina cuando la comunidad usa el sistema "
        "todos los dias.",
    ]

    return {
        "A1": {
            "title": "Gancho y Dolor Cuantificado" if claims else "Gancho y Dolor Real",
            "time": "0:00 - 0:20",
            "seconds": 20,
            "rubric": "Impacto Social + Calidad",
            "requeridas": a1_req,
            "opcionales": a1_opt,
            "visual": hook_visual,
            "asset_id": "asset_A1_hook_dolor.png",
            "onscreen": hook_onscreen,
            "audio": "Pulso grave, bajo sintetizado tenue (80-90 bpm)",
        },
        "A2": {
            "title": "Revelacion Tecnica y Prototipo (Caja Negra)",
            "time": "0:20 - 1:00",
            "seconds": 40,
            "rubric": "Grado de Innovacion (30 pts) + Viabilidad Tecnica (20 pts)",
            "requeridas": a2_req,
            "opcionales": a2_opt,
            "visual": (
                f"Aparicion rotunda de {project}. Modelo 3D explosionado (pernos, "
                "conectores IP67, sensores) o plano publicitario 3D de la UI web con "
                "datos reactivos."
            ),
            "asset_id": "asset_A2_prototipo_mecanismo.glb",
            "onscreen": f"{project}\n{challenge}",
            "audio": "Entrada de instrumentacion melodica ritmica",
        },
        "A3": {
            "title": "Prefactibilidad, Costos y Economia Circular",
            "time": "1:00 - 1:35",
            "seconds": 35,
            "rubric": "Prefactibilidad Economica, Social y Ambiental (20 pts)",
            "requeridas": a3_req,
            "opcionales": a3_opt,
            "visual": (
                "Matriz sintetica de costos unitarios verificados + diagrama de flujo "
                "de valor / economia circular de componentes."
            ),
            "asset_id": "asset_A3_tabla_costos_circularidad.svg",
            "onscreen": (
                f"COSTO DE IMPLEMENTACION: {costo}\nPresupuesto auditado con enlaces de respaldo"
                if costo
                else "COSTO DE IMPLEMENTACION: POR VALIDAR\nSin cifras inventadas"
            ),
            "audio": "Ritmo constante, dinamismo ejecutivo",
        },
        "A4": {
            "title": "Metricas Auditables, ODS y Cierre",
            "time": "1:35 - 2:00",
            "seconds": 25,
            "rubric": "Integracion de Criterios + Recordacion",
            "requeridas": a4_req,
            "opcionales": a4_opt,
            "visual": cierre_visual,
            "asset_id": "asset_A4_ods_cierre_identidad.mp4",
            "onscreen": (
                f"ODS: {ods_list}\n{project} - 2026"
                if ods_list
                else f"{project} - 2026"
            ),
            "audio": "Crescendo final y remate seco al segundo 119",
        },
    }


RELLENOS = [
    "La meta es simple: que la informacion llegue antes que el problema.",
    "Cada decision se puede auditar y cada resultado se puede medir.",
    "La solucion se prueba en campo, no en una diapositiva.",
    "El equipo documenta cada paso para que otro municipio pueda repetirlo.",
]


def _palabras(texto: str) -> int:
    return len(texto.split())


def _armar_narracion(partes: dict) -> dict:
    """Selecciona oraciones hasta caer en el rango 240-270 palabras.

    Respeta un techo por acto (2.4 palabras por segundo) para que el locutor no
    tenga que acelerar en el gancho ni dejar silencios en el cierre.
    """
    seleccion = {acto: list(datos["requeridas"]) for acto, datos in partes.items()}
    total = sum(_palabras(o) for oraciones in seleccion.values() for o in oraciones)
    topes = {acto: int(datos["seconds"] * 2.4) for acto, datos in partes.items()}

    for acto in ("A1", "A2", "A3", "A4"):
        for oracion in partes[acto]["opcionales"]:
            if total >= PALABRAS_OBJETIVO:
                break
            peso = _palabras(oracion)
            actual = sum(_palabras(o) for o in seleccion[acto])
            if total + peso <= PALABRAS_MAX and actual + peso <= topes[acto]:
                seleccion[acto].append(oracion)
                total += peso

    for relleno in RELLENOS:
        if total >= PALABRAS_MIN:
            break
        peso = _palabras(relleno)
        for acto in ("A3", "A4", "A2"):
            actual = sum(_palabras(o) for o in seleccion[acto])
            if total + peso <= PALABRAS_MAX and actual + peso <= topes[acto]:
                seleccion[acto].append(relleno)
                total += peso
                break

    # Si el brief trae una descripcion muy larga, recortar refuerzos y luego
    # oraciones no esenciales (nunca la primera de cada acto).
    for acto in ("A4", "A3", "A2", "A1"):
        while total > PALABRAS_MAX and len(seleccion[acto]) > 1:
            total -= _palabras(seleccion[acto].pop())

    return {
        acto: {
            **partes[acto],
            "id": acto,
            "narration": " ".join(oraciones),
            "words": _palabras(" ".join(oraciones)),
        }
        for acto, oraciones in seleccion.items()
    }


def main():
    brief, claims = _load_data()

    faltantes = [
        campo
        for campo in ("project_name", "team_name", "city", "challenge_title")
        if not str(brief.get(campo, "")).strip()
    ]
    if faltantes:
        print(
            "ERROR: brief.json esta incompleto (falta: "
            + ", ".join(faltantes)
            + "). Completa el brief con python scripts/init_brief.py."
        )
        print("       No se inventa el proyecto ni el municipio.")
        sys.exit(1)

    relevantes = claims_relevantes(claims, brief)
    if claims and not relevantes:
        print(
            "INFO: research/claims.json no tiene claims del reto elegido. "
            "El Acto I usara planteamiento cualitativo, sin cifras de otro desafio."
        )

    costo, _ctx = _costo_de_implementacion(brief)
    if not costo:
        print("INFO: budget/budget.json sin total legible. El Acto III no mostrara cifra.")

    partes = _textos_actos(brief, relevantes, costo)
    acts = _armar_narracion(partes)
    orden = ["A1", "A2", "A3", "A4"]
    acts = [acts[a] for a in orden]

    project = brief.get("project_name", "PROYECTO").upper()
    team = brief.get("team_name", "EQUIPO")
    rally = (brief.get("rally_type") or "nacional").lower()
    city = brief.get("city", "")
    challenge = brief.get("challenge_title", "Desafio Seleccionado")
    total_words = sum(a["words"] for a in acts)

    script_dir = pathlib.Path("script")
    script_dir.mkdir(parents=True, exist_ok=True)

    # 1. Generar script.md
    script_md_lines = [
        f"# Guion Oficial de Produccion Audiovisual -- {project}",
        f"**Rally:** {rally.upper()} | **Duracion:** 120 segundos exactos | "
        f"**Palabras totales:** {total_words} (Rango optimo: {PALABRAS_MIN}-{PALABRAS_MAX})",
        f"**Equipo:** {team} | **Ciudad Piloto:** {city} | **Desafio:** {challenge}",
        "",
        "> REGLA DE ORO DE LOS CAMPEONES (2014-2026): El Acto I jamas muestra logos ni nombres de proyecto.",
        "> La atencion del jurado se captura con dolor real antes de mostrar la solucion.",
        "",
        "| Tiempo | Acto | Narracion (Locutor) | Visual / Camara | ID Asset | Texto en Pantalla | Audio / FX |",
        "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
    ]

    for a in acts:
        script_md_lines.append(
            f"| **{a['time']}** ({a['seconds']}s) | **{a['id']}: {a['title']}** | "
            f"{a['narration']} | {a['visual']} | `{a['asset_id']}` | "
            f"{a['onscreen'].replace(chr(10), '<br>')} | {a['audio']} |"
        )

    script_md_lines.extend([
        "",
        "## Verificacion de Rubrica",
        "- **Innovacion (30 pts):** Desplegado en Acto II (caja negra visible, no solucion generica).",
        "- **Impacto Social (20 pts):** Evidenciado en Acto I y cerrado en Acto IV.",
        "- **Prefactibilidad (20 pts):** Demostrado con costos reales y economia circular en Acto III.",
        "- **Viabilidad Tecnica (20 pts):** Diagrama y componentes fisicos/digitales en Acto II.",
        "- **Calidad (10 pts):** Timing de 120s estricto, audio limpio y visuales coherentes con la paleta de marca.",
    ])

    if total_words < PALABRAS_MIN or total_words > PALABRAS_MAX:
        print(
            f"WARN: {total_words} palabras, fuera del rango {PALABRAS_MIN}-{PALABRAS_MAX}. "
            "Revisa description_one_line y challenge_title en brief.json."
        )

    (script_dir / "script.md").write_text("\n".join(script_md_lines), encoding="utf-8")
    print(f"OK: script/script.md ({total_words} palabras)")

    # 2. Generar shotlist.csv
    shotlist_path = script_dir / "shotlist.csv"
    with open(shotlist_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "act", "duration_s", "asset_id", "asset_type", "status", "description", "visual_notes"])
        for a in acts:
            asset_ext = a["asset_id"].split(".")[-1]
            writer.writerow([
                a["id"],
                a["title"],
                a["seconds"],
                a["asset_id"],
                asset_ext,
                "pendiente",
                a["onscreen"].replace("\n", " - "),
                a["visual"],
            ])
    print("OK: script/shotlist.csv")

    # 3. Generar narration.txt para TTS
    narration_txt = "\n\n".join([f"[{a['id']} - {a['time']}]\n{a['narration']}" for a in acts])
    (script_dir / "narration.txt").write_text(narration_txt, encoding="utf-8")
    print("OK: script/narration.txt")


if __name__ == "__main__":
    main()
