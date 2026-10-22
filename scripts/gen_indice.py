"""Genera `knowledge/INDICE.md`: el mapa del corpus para el agente (b).

El índice no es decoración: es lo que permite que (b) trabaje sin leer 2 MB de
PDFs. Cada fila dice que es un archivo, cuando conviene leerlo y cuando no.

Idempotente: si el contenido no cambia, no reescribe el archivo.
"""

from __future__ import annotations

from pathlib import Path

CARPETAS_PROFUNDAS = ["research", "knowledge", "docs", "brand"]
CARPETAS_PLANAS = ["graphify-out"]

# Ruido de build o de proceso: no es corpus y no debe ocupar presupuesto.
EXCLUIR_PARTES = {"cache", "__pycache__"}
EXCLUIR_PREFIJOS = ("docs/superpowers/",)

ARCHIVOS_RAIZ = [
    "brief.json",
    "Análisis del Rally de Innovación.txt",
    "Rally_Innovacion_Nicaragua_Analisis.pdf",
    "Proyectos Ganadores de Rally Latam.md",
    "chatgptdeep-research-report.md",
    "Operación Titan_UNI_Documento pautado_2025.docx",
    "Reporte_Pautado_Rally_2026.docx",
    "rubrica_oficial_latam.jpeg",
    "PRODUCT.md",
    "DESIGN.md",
]

EXTENSIONES = {
    ".md",
    ".pdf",
    ".docx",
    ".txt",
    ".json",
    ".csv",
    ".xlsx",
    ".jpeg",
    ".jpg",
    ".html",
}

SALIDA = "knowledge/INDICE.md"

SIN_DESCRIBIR = "(sin describir — añadir a DESCRIPCIONES)"

# Ruta relativa (posix) → (qué es, cuándo sí, cuándo no)
DESCRIPCIONES: dict[str, tuple[str, str, str]] = {
    # --- raíz -----------------------------------------------------------
    "brief.json": (
        "Fuente única de verdad del proyecto en curso (certamen, equipo, reto, ciudad, ODS).",
        "Siempre, antes de generar cualquier contenido.",
        "Nunca se omite: si falta un campo, se pregunta al humano.",
    ),
    "Análisis del Rally de Innovación.txt": (
        "Análisis largo del Rally Nacional y del Rally Latam: reglas, criterios, errores típicos.",
        "Dudas de reglamento, formato de entrega o criterios de jurado.",
        "Para redactar texto final: se usan las rúbricas destiladas.",
    ),
    "Rally_Innovacion_Nicaragua_Analisis.pdf": (
        "Investigación en PDF sobre el Rally Nacional de Nicaragua.",
        "Cuando se necesita contexto del certamen nacional y su ecosistema.",
        "Si ya está cubierto por el manual maestro nacional.",
    ),
    "Proyectos Ganadores de Rally Latam.md": (
        "Catálogo extenso de proyectos premiados en Latinoamérica.",
        "Buscar patrones de lo que gana (hibridación ciberfísica, enfoque territorial).",
        "Para detalles de un proyecto puntual: usar winners_database.json.",
    ),
    "chatgptdeep-research-report.md": (
        "Informe de investigación profunda: fórmula PAS-V de 120 s y errores de descalificación.",
        "Diseñar o auditar el guion del video.",
        "Para presupuesto o pauta técnica.",
    ),
    "Operación Titan_UNI_Documento pautado_2025.docx": (
        "Documento pautado real de un equipo de la UNI (referencia de formato y tono).",
        "Calibrar longitud, estructura y registro del pautado.",
        "Para copiar contenido: es de otro proyecto.",
    ),
    "Reporte_Pautado_Rally_2026.docx": (
        "Reporte pautado de referencia del ciclo 2026.",
        "Comparar estructura y nivel de detalle esperado.",
        "Como fuente de datos: no es evidencia.",
    ),
    "rubrica_oficial_latam.jpeg": (
        "Imagen de la rúbrica oficial del Rally Latam (criterios y puntajes).",
        "Verificar ponderaciones exactas antes de auditar un entregable.",
        "Si ya se consultó rubric_latam.md en esta sesión.",
    ),
    "PRODUCT.md": (
        "Definición de producto: usuarios, propósito, posicionamiento, marca, accesibilidad.",
        "Cambiar la interfaz, el tono o la identidad visual.",
        "Para contenido del certamen.",
    ),
    "DESIGN.md": (
        "Decisiones de diseño visual y sistema de componentes.",
        "Tocar presentación, layout o estilos.",
        "Para lógica o datos.",
    ),
    # --- research -------------------------------------------------------
    "research/challenges.json": (
        "Banco de retos del certamen con demandas, ODS y categoría.",
        "Elegir reto o proponer alternativas al comité.",
        "Si el reto ya está elegido en brief.json.",
    ),
    "research/challenges_ranked.json": (
        "Retos ordenados por afinidad con el perfil del equipo.",
        "Recomendar qué reto tomar primero.",
        "Cuando el usuario ya decidió.",
    ),
    "research/challenges_report.md": (
        "Lectura analítica del banco de retos.",
        "Entender el panorama de retos de un certamen.",
        "Para datos crudos: usar challenges.json.",
    ),
    "research/claims.json": (
        "Estadísticas verificables con fuente, URL y año.",
        "Toda cifra que vaya al pautado o al guion.",
        "Para opiniones o propuestas: no aplica.",
    ),
    # --- knowledge ------------------------------------------------------
    "knowledge/rubric_latam.md": (
        "Rúbrica del Rally Latam destilada: 5 criterios, 100 puntos, qué mira el jurado.",
        "Auditar cualquier entregable del certamen latinoamericano.",
        "Para el certamen nacional: usar rubric_matrices.md.",
    ),
    "knowledge/rubric_matrices.md": (
        "Matrices y ponderaciones del Rally Nacional (categorías CNU/Comisión Creativa).",
        "Auditar entregables del certamen nacional.",
        "Para Latam: usar rubric_latam.md.",
    ),
    "knowledge/winners_analysis.md": (
        "Patrones destilados de proyectos ganadores.",
        "Decidir enfoque, diferenciación y narrativa.",
        "Para listar proyectos concretos.",
    ),
    "knowledge/winners_latam.md": (
        "Fichas de ganadores latinoamericanos.",
        "Buscar referentes por sector o país.",
        "Para el certamen nacional.",
    ),
    "knowledge/winners_database.json": (
        "Base estructurada de ganadores (país, año, categoría, solución).",
        "Cruzar patrones o citar un caso con precisión.",
        "Para prosa: usar winners_analysis.md.",
    ),
    "knowledge/voice_notes.md": (
        "Notas de locución y criterios de voz para la narración.",
        "Preparar TTS o revisar el tono del guion.",
        "Para el documento pautado.",
    ),
    "knowledge/rally_analysis.txt": (
        "Análisis base del certamen.",
        "Contexto general rápido.",
        "Si ya se leyó el manual maestro.",
    ),
    "knowledge/pautado_latam_ref.docx": (
        "Pautado de referencia del Rally Latam.",
        "Calibrar estructura y longitud del pautado latam.",
        "Para copiar texto.",
    ),
    "knowledge/pautado_nacional_ref.docx": (
        "Pautado de referencia del Rally Nacional.",
        "Calibrar estructura y longitud del pautado nacional.",
        "Para copiar texto.",
    ),
    # --- docs -----------------------------------------------------------
    "docs/INSTALACION_Y_DESPLIEGUE.md": (
        "Guía de instalación, ejecución y despliegue del sistema.",
        "Instalar, arrancar o publicar el sistema.",
        "Para contenido del certamen.",
    ),
    "docs/MANUAL_IA.md": (
        "Manual extenso de las IAs: qué instalar, cómo configurar OpenCode y Antigravity, MCPs, dependencias y problemas frecuentes.",
        "Cuando el humano pregunta cómo montar o configurar la IA, o algo del entorno no funciona.",
        "Para producir contenido del rally: no aporta datos del certamen.",
    ),
    "docs/INSTALACION_AGENTE.md": (
        "Detalle técnico de la capa de agente: skills, reglas, MCP y límites de Antigravity.",
        "Depurar la instalación del agente o añadir skills y MCPs.",
        "Para el flujo de trabajo diario: basta MANUAL_IA.md.",
    ),
    "docs/DESCARGA.md": (
        "Qué trae el paquete de descarga y cómo empezar en cinco pasos.",
        "Primera sesión tras clonar o descargar el ZIP.",
        "Para trabajo avanzado: usar el manual de IA o el de despliegue.",
    ),
    "docs/canvas.md": (
        "Modelo Canvas del proyecto en curso.",
        "Completar o revisar el modelo de negocio.",
        "Para el pautado técnico.",
    ),
    "docs/pautado_draft.docx": (
        "Borrador del documento pautado.",
        "Revisar avance o compilar el entregable.",
        "Como fuente de verdad: usar brief.json.",
    ),
    "docs/Matriz_Seleccion_Desafios_2026.docx": (
        "Matriz oficial de selección de desafíos.",
        "Elegir reto con criterios del comité.",
        "Si el reto ya está fijado.",
    ),
    "docs/bibliography.md": (
        "Bibliografía del proyecto en curso.",
        "Citar fuentes o revisar respaldos del pautado.",
        "Para cifras nuevas: usar research/claims.json.",
    ),
    "docs/KNOWLEDGE_GRAPH.md": (
        "Explicación del cerebro Graphify y sus comunidades de conocimiento.",
        "Entender cómo se relacionan certamen, rúbricas y ganadores.",
        "Para redactar contenido del proyecto.",
    ),
    "docs/MANUAL_MAESTRO_RALLY_INNOVACION_2026.md": (
        "Manual maestro del Rally de Innovación (versión texto).",
        "Reglamento, fases y entregables del certamen.",
        "Si ya se consultó el manual del certamen activo.",
    ),
    "docs/MANUAL_MAESTRO_RALLY_INNOVACION_2026.pdf": (
        "Manual maestro del Rally de Innovación (versión PDF).",
        "Compartir o imprimir el manual.",
        "Para consulta del agente: usar el .md, pesa menos.",
    ),
    "docs/MANUAL_MAESTRO_RALLY_LATAM_Y_NICARAGUA_INNOVA_2026.md": (
        "Manual maestro combinado: Rally Latam y Nicaragua Innova (texto).",
        "Reglas y entregables de ambos certámenes en un solo lugar.",
        "Si solo se necesita el certamen activo: usar su sección.",
    ),
    "docs/MANUAL_MAESTRO_RALLY_LATAM_Y_NICARAGUA_INNOVA_2026.pdf": (
        "Manual maestro combinado (PDF).",
        "Compartir o imprimir.",
        "Para consulta del agente: usar el .md.",
    ),
    "docs/pautado_template.docx": (
        "Plantilla DOCX del documento pautado.",
        "Compilar el entregable con el formato oficial.",
        "Para redactar: el contenido va en brief y pautado.",
    ),
    # --- graphify -------------------------------------------------------
    "graphify-out/GRAPH_REPORT.md": (
        "Informe del cerebro Graphify: nodos, aristas, comunidades y hallazgos.",
        "Entender el mapa de conocimiento sin abrir el grafo.",
        "Para editar el grafo.",
    ),
    "graphify-out/graph.json": (
        "Grafo de conocimiento en crudo.",
        "Procesar relaciones con código.",
        "Para lectura humana: usar GRAPH_REPORT.md.",
    ),
    "graphify-out/graph.html": (
        "Visualización interactiva del grafo.",
        "Mostrar el cerebro a una persona.",
        "Para que el agente lea: no aplica.",
    ),
    "graphify-out/.graphify_labels.json": (
        "Etiquetas de las comunidades del grafo.",
        "Nombrar comunidades al procesar el grafo.",
        "Para trabajo normal del agente.",
    ),
    "graphify-out/cost.json": (
        "Costo de generación del grafo (telemetría de la herramienta).",
        "Auditar cuánto costó construir el cerebro.",
        "Para cualquier tarea de contenido.",
    ),
    "graphify-out/manifest.json": (
        "Manifiesto de archivos procesados por Graphify.",
        "Saber qué fuentes entraron al grafo.",
        "Para redactar contenido.",
    ),
    # --- brand ----------------------------------------------------------
    "brand/palette.json": (
        "Paleta del proyecto (primario, secundario, acento, fondo, texto).",
        "Generar tokens, gráficos o piezas visuales.",
        "Para tipografías: ver tokens.css.",
    ),
    "brand/tokens.css": (
        "Variables CSS derivadas de la paleta y las fuentes.",
        "Tocar estilos o generar piezas coherentes con la marca.",
        "Para lógica.",
    ),
}


def _entradas(root: Path) -> list[str]:
    rutas: list[str] = []

    for nombre in ARCHIVOS_RAIZ:
        if (root / nombre).is_file():
            rutas.append(nombre)

    candidatos: list[Path] = []
    for carpeta in CARPETAS_PROFUNDAS:
        base = root / carpeta
        if base.is_dir():
            candidatos.extend(sorted(base.rglob("*")))
    for carpeta in CARPETAS_PLANAS:
        base = root / carpeta
        if base.is_dir():
            candidatos.extend(sorted(base.iterdir()))

    for path in candidatos:
        if not path.is_file():
            continue
        if path.suffix.lower() not in EXTENSIONES:
            continue
        rel = path.relative_to(root).as_posix()
        if rel == SALIDA:
            continue
        if rel.startswith(EXCLUIR_PREFIJOS):
            continue
        if EXCLUIR_PARTES.intersection(path.relative_to(root).parts):
            continue
        rutas.append(rel)

    vistos = set()
    unicas = []
    for r in rutas:
        if r not in vistos:
            vistos.add(r)
            unicas.append(r)
    return unicas


def _fila(rel: str) -> str:
    que, cuando_si, cuando_no = DESCRIPCIONES.get(
        rel, (SIN_DESCRIBIR, "—", "—")
    )
    return f"| `{rel}` | {que} | {cuando_si} | {cuando_no} |"


def generar_indice(root: Path) -> Path:
    root = Path(root)
    entradas = _entradas(root)

    lineas = [
        "# Índice de contexto del corpus",
        "",
        "Generado por `python scripts/gen_indice.py`. No editar a mano:",
        "si falta un archivo o su descripción, se corrige en `DESCRIPCIONES`.",
        "",
        "Regla de uso: leer primero este índice y abrir solo lo que la tarea pida.",
        "Si un archivo no está aquí, no es corpus: es código o artefacto.",
        "",
        f"Archivos indexados: {len(entradas)}",
        "",
        "| Ruta | Qué es | Cuándo sí | Cuándo no |",
        "|---|---|---|---|",
    ]
    lineas.extend(_fila(rel) for rel in entradas)
    lineas.append("")

    contenido = "\n".join(lineas)
    destino = root / SALIDA
    destino.parent.mkdir(parents=True, exist_ok=True)

    if not destino.is_file() or destino.read_text(encoding="utf-8") != contenido:
        destino.write_text(contenido, encoding="utf-8")

    return destino


if __name__ == "__main__":
    print(generar_indice(Path(__file__).resolve().parent.parent))
