import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Paleta oficial Rally Studio
NAVY = colors.HexColor("#003366")
PRIMARY = colors.HexColor("#0866F5")
CYAN = colors.HexColor("#2AA7AD")
DARK = colors.HexColor("#0D1B35")
MUTED = colors.HexColor("#5C7193")
BG_LIGHT = colors.HexColor("#F8FAFD")
BORDER = colors.HexColor("#E2E8F0")
EMERALD = colors.HexColor("#059669")
EMERALD_BG = colors.HexColor("#DCFCE7")
AMBER = colors.HexColor("#B45309")
AMBER_BG = colors.HexColor("#FEF3C7")
ROSE = colors.HexColor("#BE123C")
ROSE_BG = colors.HexColor("#FFF1F2")

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Portada limpia sin encabezado ni pie
        
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(MUTED)
        
        # Header
        self.drawString(54, letter[1] - 36, "RALLY STUDIO · WORKBENCH DE INNOVACIÓN")
        self.setFont("Helvetica", 8)
        self.drawRightString(letter[0] - 54, letter[1] - 36, "RALLY LATAM & NICARAGUA INNOVA · MANUAL MAESTRO DUAL")
        self.setStrokeColor(BORDER)
        self.setLineWidth(0.75)
        self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)
        
        # Footer
        self.line(54, 46, letter[0] - 54, 46)
        self.setFont("Helvetica", 8)
        self.drawString(54, 34, "Universidad Nacional de Ingeniería (UNI) · Metodología Táctica SIRLI")
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(letter[0] - 54, 34, page_str)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    style_cover_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=NAVY,
        alignment=0,
        spaceAfter=12
    )

    style_cover_subtitle = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=24
    )

    style_cover_meta = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=MUTED
    )

    style_h1 = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=NAVY,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=DARK,
        spaceAfter=7
    )

    style_body_bold = ParagraphStyle(
        'BodyBold_Custom',
        parent=style_body,
        fontName='Helvetica-Bold'
    )

    style_callout = ParagraphStyle(
        'Callout_Text',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=DARK
    )

    style_table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=DARK
    )

    style_table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    story = []

    # ═════════════════════════════════════════════════════════════════════════
    # PORTADA
    # ═════════════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 40))
    # Badge
    badge_table = Table([[Paragraph("<font color='#003366'><b>DOCUMENTO DOCTRINAL OFICIAL · VERSIÓN 2.5 DEFINTIVA</b></font>", style_table_cell)]], colWidths=[360])
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#BFDBFE")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("MANUAL MAESTRO DUAL DE ALTA COMPETICIÓN", style_cover_title))
    story.append(Paragraph("Rally Latinoamericano de Innovación (28h) &amp; Rally Nacional «Nicaragua Innova» (24h)<br/><font color='#5C7193'>Dossier Metodológico, Estratégico, Audiovisual y Forense de Patrones Ganadores (2014–2026)</font>", style_cover_subtitle))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceBefore=4, spaceAfter=20))

    meta_text = """
    <b>Plataforma de Referencia:</b> Rally Studio · Workbench de Innovación<br/>
    <b>Institución Piloto:</b> Universidad Nacional de Ingeniería (UNI) · Sedes Universitarias de Nicaragua y Latinoamérica<br/>
    <b>Gobernanza Evaluadora:</b> Sistema de Información Maestro SIRLI (<code>sirli.org</code>) &amp; Rúbricas Oficiales Interinstitucionales<br/>
    <b>Fecha de Emisión:</b> Octubre 2026 · Edición Maestra para Equipos Universitarios y Mentores
    """
    story.append(Paragraph(meta_text, style_cover_meta))
    story.append(Spacer(1, 24))

    # Resumen Ejecutivo Box
    exec_summary = """
    <b>OBJETIVO DEL DOSSIER:</b> Sintetizar de forma quirúrgica más de 12 años de competencias de innovación ininterrumpidas (2014–2026), 10 podios internacionales de Nicaragua, 27 ganadores nacionales y cientos de proyectos auditados. Proporciona la fórmula matemática de estructuración de guiones de 120 segundos (PAS-V), la teoría de la Doble Codificación para superar jurados locales y extranjeros, las 3 dimensiones del Efecto Wow, la lista negra de los 11 patrones perdedores causantes de descalificación y el cronograma regresivo de 28 horas continuas.
    """
    summary_table = Table([[Paragraph(exec_summary, style_callout)]], colWidths=[504])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER),
        ('LINELEFT', (0,0), (0,0), 3.5, PRIMARY),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(summary_table)
    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════════════
    # SECCIÓN 1: MARCO NORMATIVO Y GOBERNANZA SIRLI
    # ═════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("1. MARCO NORMATIVO, GOBERNANZA SIRLI Y EMBUDO DE 3 INSTANCIAS", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("El Rally de Innovación es un certamen de ingeniería, síntesis y estrategia bajo fatiga extrema. El jurado calificador no premia la mera intención; evalúa el cumplimiento irrestricto de las bases reglamentarias a través de la plataforma SIRLI (Sistema de Información del Rally Latinoamericano de Innovación).", style_body))

    # Tabla comparativa
    headers = [
        Paragraph("<b>Parámetro Normativo</b>", style_table_header),
        Paragraph("<b>Rally Latinoamericano (Rally LATAM)</b>", style_table_header),
        Paragraph("<b>Rally Nacional «Nicaragua Innova»</b>", style_table_header)
    ]
    rows = [
        headers,
        [Paragraph("<b>Entidades Rectoras</b>", style_table_cell), Paragraph("CONFEDI (Arg), ACOFI (Col), ANFEI (Méx), CCFI (Chile), CONDEFI.", style_table_cell), Paragraph("Comisión Nal. Economía Creativa, CNU, INATEC, MINJUVE, TELCOR, MEFCCA.", style_table_cell)],
        [Paragraph("<b>Régimen de Horas</b>", style_table_cell), Paragraph("<b>28 Horas continuas</b> (Vie 08:00 AM a Sáb 12:00 PM).", style_table_cell), Paragraph("<b>24 Horas continuas</b> (Vie 08:00 AM a Sáb 08:00 AM).", style_table_cell)],
        [Paragraph("<b>Categorías Oficiales</b>", style_table_cell), Paragraph("<b>2 Categorías:</b><br/>1. Innovación<br/>2. Impacto Social", style_table_cell), Paragraph("<b>3 Categorías:</b><br/>1. Innovación Tecnológica<br/>2. Innovación Social<br/>3. Procesos / Organizacional", style_table_cell)],
        [Paragraph("<b>Gobernanza del Jurado</b>", style_table_cell), Paragraph("<b>Embudo de 3 Instancias:</b><br/>Sede (deliberación &le;3h) &rarr; Nacional &rarr; Internacional (72h).", style_table_cell), Paragraph("<b>Comisión Mixta Interinstitucional:</b><br/>Evaluadores CNU, ministerios y comisiones creativas.", style_table_cell)],
        [Paragraph("<b>Regla de Incompatibilidad</b>", style_table_cell), Paragraph("<b>PROHIBICIÓN ESTRICTA:</b> Ningún jurado internacional califica a su propio país.", style_table_cell), Paragraph("Jurados de sede no evalúan proyectos donde ejerzan tutoría directa.", style_table_cell)],
        [Paragraph("<b>Entregables Auditables</b>", style_table_cell), Paragraph("1. Reporte PDF Pautado SIRLI (caracteres estrictos)<br/>2. Video Pitch YouTube &le;120s<br/>3. TikTok lúdico internacional", style_table_cell), Paragraph("1. Documento Técnico Propuesta (hasta 10 págs con Canvas)<br/>2. Video Pitch YouTube &le;120s", style_table_cell)]
    ]
    t_comp = Table(rows, colWidths=[114, 195, 195])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Requisitos de Conformación de Equipo (Auditoría Fatal 12:00 PM):</b>", style_body_bold))
    story.append(Paragraph("• <b>Rango Obligatorio:</b> 4 a 10 integrantes registrados formalmente en la plataforma central.<br/>• <b>Ingeniería:</b> Mínimo 1 estudiante activo de ingeniería (requisito inmutable CONFEDI/CNU).<br/>• <b>Paridad de Género:</b> Mínimo 1 mujer en el equipo (promedio de participación nacional: 47% a 49%).<br/>• <b>Liderazgo Estudiantil Estricto:</b> Se admite máximo 1 egresado y 1 docente tutor, pero ninguno de los dos puede asumir liderazgo de equipo, suscripción única de entrega ni rol protagónico en el video pitch.", style_body))

    # ═════════════════════════════════════════════════════════════════════════
    # SECCIÓN 2: TEORÍA DE LA DOBLE CODIFICACIÓN
    # ═════════════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 8))
    story.append(Paragraph("2. TEORÍA DE LA DOBLE CODIFICACIÓN: EL BILINGÜISMO EVALUATIVO", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("Uno de los descubrimientos cruciales de las investigaciones 2019–2026 es el fenómeno de la <b>Doble Codificación</b>: el discurso que convence al jurado nacional nicaragüense difiere sustancialmente del que corona a un equipo ante jurados continentales de América Latina.", style_body))

    cod_text = """
    <b>EL FILTRO NACIONAL (Nicaragua Innova):</b> Requiere anclaje territorial expreso. Los ganadores articulan su solución con el <i>Plan Nacional de Lucha contra la Pobreza y Desarrollo Humano 2022–2026 (PNDH)</i>, la <i>Red Nacional de Ciudades Creativas</i>, y citan municipios específicos (Waslala, Rivas, Masaya, Estelí, Chontales). Utilizan semántica identitaria náhuatl o pinolera (<i>Ollnari, DIGNA, Yoltik-Nova, CHÁNCENICA</i>).<br/><br/>
    <b>EL FILTRO INTERNACIONAL (Rally LATAM):</b> Ante jurados de Argentina, México, Colombia o Chile que <u>no pueden evaluar a su propio país</u>, el discurso político local resulta incomprensible o perjudicial. Exige la ley del <b>Bilingüismo Evaluativo</b>: nombre del equipo identitario (<i>continente</i>), pero desarrollo técnico universal en componentes COTS comerciales, planos CAD 3D paramétricos, costos unitarios en <b>USD</b> y ODS de la ONU (<i>contenido</i>). Nicaragua se expone como laboratorio piloto de validación hiperlocal y América Latina como el mercado de escalamiento.
    """
    cod_table = Table([[Paragraph(cod_text, style_callout)]], colWidths=[504])
    cod_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER),
        ('LINELEFT', (0,0), (0,0), 3.5, CYAN),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(cod_table)

    # ═════════════════════════════════════════════════════════════════════════
    # SECCIÓN 3: TEORÍA DEL «EFECTO WOW»
    # ═════════════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 10))
    story.append(Paragraph("3. TEORÍA DEL «EFECTO WOW»: LAS 3 DIMENSIONES GANADORAS", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("Para alcanzar 95+ puntos sobre 100 en la rúbrica oficial, la propuesta debe superar las soluciones lineales monodisciplinarias activando al menos una de las <b>3 Dimensiones del Efecto Wow</b>:", style_body))

    wow_headers = [
        Paragraph("<b>Dimensión Wow</b>", style_table_header),
        Paragraph("<b>Mecanismo Técnico Clave</b>", style_table_header),
        Paragraph("<b>Caso Ganador Continental de Referencia</b>", style_table_header)
    ]
    wow_rows = [
        wow_headers,
        [Paragraph("<b>1. Hibridación Ciber-Física</b>", style_table_cell), Paragraph("Articula una obra física, civil o agronómica con telemetría remota, sensores de bajo consumo (LoRaWAN/ESP32) y control automatizado en tiempo real.", style_table_cell), Paragraph("<b>Techriders 2024 (1° Int. Latam):</b> Micropresas civiles con compuertas automatizadas y telemetría de caudales.", style_table_cell)],
        [Paragraph("<b>2. Pasivo a Capital Comunitario</b>", style_table_cell), Paragraph("Convierte un pasivo masivo de descarte (cáscara de café, cacao, envases Tetra Pak, chatarra) en un activo productivo de alta resistencia.", style_table_cell), Paragraph("<b>Mentes Volcánicas 2025 (1° Int. Social):</b> Transformación de Tetra Pak en paneles sismorresistentes modulares.", style_table_cell)],
        [Paragraph("<b>3. Hardware / Biotecnología vs. Apps</b>", style_table_cell), Paragraph("Ante crisis graves de salud, saneamiento o violencia comunitaria, rechaza apps móviles pasivas de quejas. Diseña equipos físicos o biomateriales testeables.", style_table_cell), Paragraph("<b>STEM Synergy 2025 (1° Int. Latam):</b> Huertos verticales con recirculación hídrica automatizada y peso aligerado 40%.", style_table_cell)]
    ]
    t_wow = Table(wow_rows, colWidths=[120, 224, 160])
    t_wow.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_wow)
    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════════════
    # SECCIÓN 4: ARQUITECTURA NARRATIVA PAS-V (120 SEGUNDOS)
    # ═════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("4. ARQUITECTURA NARRATIVA DEL GUION DE PITCH (PAS-V 120 SEGUNDOS)", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("El video pitch de 2 minutos es el artefacto que decide el podio. La evaluación no admite improvisación: cada segundo y cada palabra deben tributar a la rúbrica oficial.", style_body))

    # Métricas de oro
    story.append(Paragraph("<b>Métricas Matemáticas de Locución Oral:</b><br/>• <b>Cadencia Oral Óptima:</b> <b>135 palabras por minuto</b> (&asymp; <b>2.25 palabras por segundo</b>).<br/>• <b>Límite Absoluto del Guion:</b> <b>240 a 270 palabras totales</b>. A más de 270 palabras, el locutor suena atropellado o supera los 120 segundos reglamentarios.<br/>• <b>Regla Fatal de Corte:</b> Finalizar y fundir a negro en el segundo <b>1:57 - 1:58</b>. En el sistema SIRLI, un video de 121 segundos (2:01 min) recibe descalificación automática inmediata sin revisión del jurado.", style_body))

    pasv_headers = [
        Paragraph("<b>Acto / Intervalo</b>", style_table_header),
        Paragraph("<b>Cuota Palabras</b>", style_table_header),
        Paragraph("<b>Criterios Rúbrica Activados</b>", style_table_header),
        Paragraph("<b>Contenido y Recursos Visuales Obligatorios</b>", style_table_header)
    ]
    pasv_rows = [
        pasv_headers,
        [
            Paragraph("<b>Acto I: Problema</b><br/>0:00 &ndash; 0:20", style_table_cell),
            Paragraph("<b>~45 palabras</b><br/>(20 seg)", style_table_cell),
            Paragraph("Impacto Social (25 pts)<br/>Calidad Pitch (10-15 pts)", style_table_cell),
            Paragraph("<b>REGLA DE ORO: PROHIBIDO LOGOS, SALUDOS O PRESENTACIONES.</b> Colisión directa de 1 estadística macro + 1 rostro humano territorialmente situado.", style_table_cell)
        ],
        [
            Paragraph("<b>Acto II: Solución</b><br/>0:20 &ndash; 1:00", style_table_cell),
            Paragraph("<b>~90 palabras</b><br/>(40 seg)", style_table_cell),
            Paragraph("Grado Innovación (30 pts)<br/>Viabilidad Técnica (20 pts)", style_table_cell),
            Paragraph("Bautismo de la solución (Naming Dual) + mecanismo físico/químico inédito. <b>Visual obligado:</b> Render CAD 3D de Blender con despiece en explosión o prototipo físico activo.", style_table_cell)
        ],
        [
            Paragraph("<b>Acto III: Factibilidad</b><br/>1:00 &ndash; 1:35", style_table_cell),
            Paragraph("<b>~75 palabras</b><br/>(35 seg)", style_table_cell),
            Paragraph("Prefactibilidad Económica (20 pts)<br/><i>Causa #1 de eliminación</i>", style_table_cell),
            Paragraph("Costos unitarios de fabricación, lote piloto de 10 unidades en el rango de <b>$4,000 a $6,000 USD</b>, ROI cuantificado y modelo de ingresos autosostenible B2B/B2G.", style_table_cell)
        ],
        [
            Paragraph("<b>Acto IV: Cierre</b><br/>1:35 &ndash; 2:00", style_table_cell),
            Paragraph("<b>~55 palabras</b><br/>(25 seg)", style_table_cell),
            Paragraph("Integración 5 Criterios<br/>Metas ODS + Cierre T-118s", style_table_cell),
            Paragraph("Métricas cuantificadas proyectadas (beneficiarios a 12 meses), metas ODS específicas, frase memorable y placa institucional final en segundo 1:55-1:58.", style_table_cell)
        ]
    ]
    t_pasv = Table(pasv_rows, colWidths=[90, 75, 120, 219])
    t_pasv.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_pasv)
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Ejemplo Canónico de Guion PAS-V (Total: 263 palabras a 135 ppm / 1:57 min):</b>", style_body_bold))
    guion_sample = """
    <b>[0:00–0:20 | 44 palabras]:</b> «En el corredor seco centroamericano, más de cuatrocientas mil familias pierden hasta el sesenta por ciento de sus cosechas por variabilidad hídrica extrema. Don Manuel, agricultor de Waslala, gasta tres dólares diarios en combustible diésel para bombear agua turbia que arruina sus suelos.»<br/><br/>
    <b>[0:20–1:00 | 88 palabras]:</b> «Para romper este ciclo diseñamos HIDRO-NEXUS, un sistema modular de micropresas telemetradas con bio-filtros de zeolita natural y bombeo fotovoltaico autónomo. El dispositivo captura escorrentías mediante una compuerta basculante pasiva calibrada por contrapeso gravitatorio, reteniendo sedimentos pesados mientras un sensor ultrasónico LoRaWAN transmite el nivel de caudal en tiempo real sin requerir red celular. La zeolita local elimina el noventa y dos por ciento de metales pesados, presurizando un circuito de goteo que opera veinticuatro horas continuas impulsado por paneles solares bifaciales de alta eficiencia.»<br/><br/>
    <b>[1:00–1:35 | 76 palabras]:</b> «La prefactibilidad económica de HIDRO-NEXUS está validada con cotizaciones reales de distribuidores mayoristas. El costo unitario de fabricación del módulo es de cuatrocientos ochenta dólares, con un lote piloto inicial de diez unidades presupuestado en cinco mil doscientos dólares, incluyendo dieciocho por ciento de flete y aranceles. Mediante un modelo cooperativo B2B con amortización por micro-cuotas agrícolas, el productor recupera la inversión en siete meses gracias al incremento de productividad.»<br/><br/>
    <b>[1:35–1:58 | 55 palabras]:</b> «Con el despliegue de cincuenta módulos en su primer año, HIDRO-NEXUS garantizará tres millones de litros de agua segura, mitigando doscientas toneladas de CO2 y tributando directamente a los ODS dos, seis y trece. La ingeniería nicaragüense responde al cambio climático con ciencia rigurosa. HIDRO-NEXUS: Sembrando agua, cosechando soberanía continental.»
    """
    g_table = Table([[Paragraph(guion_sample, style_callout)]], colWidths=[504])
    g_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER),
        ('LINELEFT', (0,0), (0,0), 3.5, EMERALD),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(g_table)
    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════════════
    # SECCIÓN 5 & 6: RECURSOS VISUALES Y LOS 11 PATRONES PERDEDORES
    # ═════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("5. RECURSOS VISUALES GANADORES VS. ANTI-PATRONES PENADOS", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=8))
    
    vis_headers = [
        Paragraph("<b>Recursos que el Jurado Valora y Premia</b>", style_table_header),
        Paragraph("<b>Anti-patrones Visuales que Destruyen la Nota</b>", style_table_header)
    ]
    vis_rows = [
        vis_headers,
        [
            Paragraph("• <b>CAD 3D Paramétrico con despiece en explosión</b> en Blender (tornillería métrica, juntas de estanqueidad IP67, texturas PBR realistas).<br/>• <b>Prototipo físico en banco de pruebas:</b> circuitos en breadboard/PCB con microcontrolador ESP32/LoRa, cableado limpio y display OLED activo.<br/>• <b>Ensayos mecánicos reales:</b> filmar pruebas de esfuerzo, compresión o absorción en laboratorio o taller universitario.<br/>• <b>Grabación en territorio real:</b> tomas en el cafetal, cauce urbano o cooperativa con usuarios y beneficiarios auténticos.<br/>• <b>Diagramas de balance de masa y energía</b> con cotas y unidades formales.", style_table_cell),
            Paragraph("• <b>Toma fija de 10 estudiantes sentados frente a una cámara web</b> diciendo sus nombres y carreras en una sala con eco.<br/>• <b>Mockups genéricos de Figma con degradados violeta/morado</b> estilo plantilla de IA con botones flotantes sin lógica.<br/>• <b>Stock footage de oficinas extranjeras</b> y rascacielos desconectados de la realidad comunitaria y regional.<br/>• <b>Presentaciones de PowerPoint grabadas</b> con viñetas de texto leídas textualmente por los expositores.<br/>• <b>Animaciones infantiles o sobrecargadas</b> con transiciones de corte estridentes que restan seriedad académica.", style_table_cell)
        ]
    ]
    t_vis = Table(vis_rows, colWidths=[252, 252])
    t_vis.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white]),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_vis)
    story.append(Spacer(1, 12))

    story.append(Paragraph("6. AUDITORÍA FORENSE DE LOS 11 PATRONES PERDEDORES", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("La revisión forense de proyectos descalificados o que quedaron en el percentil inferior arroja 11 errores fatales que todo equipo debe auditar antes del T-0:", style_body))

    losers_text = """
    <b>1. Desperdicio del Acto I (0:00–0:20):</b> Gastar los primeros 20s en logotipos, saludos o lista de integrantes.<br/>
    <b>2. La Trampa de la "App Móvil de Reportes":</b> Proponer una app móvil pasiva ante crisis estructurales de agua, residuos o violencia social.<br/>
    <b>3. Discrepancia Numérica Video vs. PDF:</b> Citar $450 en el pitch y $1,500 en las tablas del reporte pautado (Causa #1 de descalificación en prefactibilidad).<br/>
    <b>4. Video de 121 Segundos:</b> Exceder los 2 minutos por 1 segundo. El software central del certamen aplica descalificación automática.<br/>
    <b>5. Privacidad de YouTube en 'Privado':</b> Subir el video como privado en lugar de 'No listado' o 'Público'. El jurado recibe error 403 y otorga 0 puntos.<br/>
    <b>6. Naming Trillado con Sufijo -INNOVA:</b> Nombres genéricos (<i>AgroInnova, EcoInnova</i>) que se confunden entre 40 proyectos similares.<br/>
    <b>7. Omisión del Presupuesto de Lote Piloto:</b> No cotizar proveedores mayoristas ni definir el rango óptimo ($4,000 a $6,000 USD para 10 unidades).<br/>
    <b>8. Truncamiento de Caracteres en SIRLI:</b> Exceder los límites de caracteres con espacios (1250, 1000, 1500), provocando corte abrupto del texto.<br/>
    <b>9. Cuenta Personal Desarticulada en YouTube:</b> Subir desde cuentas personales sin canal de marca, descripción técnica ni enlaces ODS.<br/>
    <b>10. Omisión del Video TikTok de Interacción Internacional:</b> En el Rally Latam, el TikTok es un entregable auditable obligatorio.<br/>
    <b>11. Replanteamiento Técnico a Medianoche (T-6 Horas):</b> Cambiar la arquitectura a última hora destruye guiones, renders y memorias de cálculo.
    """
    t_losers = Table([[Paragraph(losers_text, style_body)]], colWidths=[504])
    t_losers.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), ROSE_BG),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#FECDD3")),
        ('LINELEFT', (0,0), (0,0), 3.5, ROSE),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_losers)
    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════════════
    # SECCIÓN 7 & 8: TÁCTICA DE RETOS Y REGISTRO HISTÓRICO
    # ═════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("7. MATRIZ TÁCTICA DE RETOS: SATURACIÓN VS. NICHO TÉCNICO", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("A las 08:00 AM del viernes, cuando se publican los retos oficiales, la elección del desafío define el nivel de rivalidad:", style_body))

    retos_text = """
    • <b>Reto de Alta Saturación (&ge;8 sedes compitiendo):</b> Temáticas comunes como reciclaje de plástico urbano o compostaje. <i>Estrategia:</i> Exige incorporar <u>mínimo 2 capas tecnológicas complejas</u> (ej. bio-termocompresión + telemetría remota) para quebrar la saturación de propuestas similares.<br/>
    • <b>Reto de Nicho Técnico (&le;3 sedes compitiendo):</b> Temáticas especializadas como bioacústica de polinizadores nativos, reconversión de motores o fermentación de café. <i>Estrategia:</i> Una propuesta rigurosa, factible y económicamente sólida conquista el podio con mínima fricción competitiva (caso <i>IGNIS CODE 2026</i>).
    """
    story.append(Paragraph(retos_text, style_body))
    story.append(Spacer(1, 8))

    story.append(Paragraph("8. REGISTRO HISTÓRICO VERIFICADO DE GANADORES (2014–2026)", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=8))

    win_headers = [
        Paragraph("<b>Año / Evento</b>", style_table_header),
        Paragraph("<b>Equipo / Sede</b>", style_table_header),
        Paragraph("<b>Categoría &amp; Proyecto</b>", style_table_header),
        Paragraph("<b>Video / ID Oficial</b>", style_table_header)
    ]
    win_rows = [
        win_headers,
        [Paragraph("2016 Latam", style_table_cell), Paragraph("<b>GECKAKZ</b> (UNI)", style_table_cell), Paragraph("1° Social Continental - Geckakz", style_table_cell), Paragraph("Archivo Oficial", style_table_cell)],
        [Paragraph("2019 Latam", style_table_cell), Paragraph("<b>LEXONIC</b> (UNI-RUPAP)", style_table_cell), Paragraph("3° Social Continental - LexoStop (Parada eólica/solar)", style_table_cell), Paragraph("<code>1NBgrCZ4sDI</code>", style_table_cell)],
        [Paragraph("2021 Latam", style_table_cell), Paragraph("<b>MT Soluciones</b> (UNI)", style_table_cell), Paragraph("1° Innovación Continental - Vivienda Bioclimática", style_table_cell), Paragraph("<code>AWLCV3DTDCA</code>", style_table_cell)],
        [Paragraph("2023 Latam", style_table_cell), Paragraph("<b>Güegüense Pinolero</b> (UNI)", style_table_cell), Paragraph("1° Innovación Continental - DIGNA (Vivienda 44.18 m²)", style_table_cell), Paragraph("<code>AjtVryXaGDc</code>", style_table_cell)],
        [Paragraph("2023 Latam", style_table_cell), Paragraph("<b>Nicarq Sinergy</b> (UNI)", style_table_cell), Paragraph("2° Social Continental - BioInnova (Vivienda y huertos)", style_table_cell), Paragraph("<code>5dVqVY9Ugeg</code>", style_table_cell)],
        [Paragraph("2024 Latam", style_table_cell), Paragraph("<b>TECHRIDERS</b> (UNI-RUPAP)", style_table_cell), Paragraph("1° Innovación Continental - Micropresas LoRaWAN", style_table_cell), Paragraph("<code>MIvlD31HfIk</code>", style_table_cell)],
        [Paragraph("2025 Latam", style_table_cell), Paragraph("<b>STEM Synergy</b> (UAM)", style_table_cell), Paragraph("1° Innovación Continental - Huertos Verticales", style_table_cell), Paragraph("<code>JhqjBm20DXo</code>", style_table_cell)],
        [Paragraph("2025 Latam", style_table_cell), Paragraph("<b>Mentes Volcánicas</b> (UNI)", style_table_cell), Paragraph("1° Social Continental - Reuso de Tetra Pak", style_table_cell), Paragraph("<code>_JSUKR1bPnE</code>", style_table_cell)],
        [Paragraph("2025 Nac.", style_table_cell), Paragraph("<b>Operación Titán</b>", style_table_cell), Paragraph("1° Procesos Nacional - Plataforma OLLNARI", style_table_cell), Paragraph("<code>v4kZD-S1NHk</code>", style_table_cell)],
        [Paragraph("2025 Nac.", style_table_cell), Paragraph("<b>Nexus Innova</b> (UNAN-M)", style_table_cell), Paragraph("1° Tecnológica Nacional - Parque Ecoenergético", style_table_cell), Paragraph("<code>DBErrs4L-OA</code>", style_table_cell)],
        [Paragraph("2025 Nac.", style_table_cell), Paragraph("<b>Volca-Tech</b> (UNAN-M)", style_table_cell), Paragraph("1° Social Nacional - CHÁNCENICA", style_table_cell), Paragraph("<code>Udv4kevNSTw</code>", style_table_cell)],
        [Paragraph("2025 Nac.", style_table_cell), Paragraph("<b>Los Templarios</b>", style_table_cell), Paragraph("2° Procesos Nacional - EgroLab-Móvil", style_table_cell), Paragraph("<code>W3PXmGt1E2k</code>", style_table_cell)],
        [Paragraph("2026 Nac.", style_table_cell), Paragraph("<b>Lubanic</b> (INATEC)", style_table_cell), Paragraph("1° Procesos - SITRACAFE (Beneficio Húmedo)", style_table_cell), Paragraph("Facebook Oficial", style_table_cell)],
        [Paragraph("2026 Nac.", style_table_cell), Paragraph("<b>ELOHIM</b> (UNI Estelí)", style_table_cell), Paragraph("1° Social - Centro Integral Josefa Toledo", style_table_cell), Paragraph("Facebook Oficial", style_table_cell)],
        [Paragraph("2026 Nac.", style_table_cell), Paragraph("<b>AVOCADO</b> (UAM)", style_table_cell), Paragraph("1° Tecnológica - Vitalia (Biorremediación)", style_table_cell), Paragraph("Facebook Oficial", style_table_cell)],
        [Paragraph("2026 Latam", style_table_cell), Paragraph("<b>IGNIS CODE</b> (UAM)", style_table_cell), Paragraph("1° Clasificado Innovación - Refugios Polinizadores", style_table_cell), Paragraph("YouTube Oficial", style_table_cell)],
        [Paragraph("2026 Latam", style_table_cell), Paragraph("<b>AVOCADO</b> (UAM)", style_table_cell), Paragraph("1° Clasificado Social - Tracción Motores Eléctricos", style_table_cell), Paragraph("YouTube Oficial", style_table_cell)]
    ]
    t_win = Table(win_rows, colWidths=[65, 125, 204, 110])
    t_win.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_win)
    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════════════
    # SECCIÓN 9 & 10: CRONOGRAMA TÁCTICO Y PROTOCOLO MULTI-IA
    # ═════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("9. CRONOGRAMA TÁCTICO DE MARCHA REGRESIVA (T-28H A T-0)", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=8))

    sched_headers = [
        Paragraph("<b>Hito Temporal</b>", style_table_header),
        Paragraph("<b>Acción Operativa Crítica</b>", style_table_header),
        Paragraph("<b>Riesgo y Guardrail de Descalificación</b>", style_table_header)
    ]
    sched_rows = [
        sched_headers,
        [Paragraph("<b>08:00 AM (Vie)</b><br/>T-28 Horas", style_table_cell), Paragraph("Apertura de plataforma y descarga de matrices de retos.", style_table_cell), Paragraph("No clasificar el reto en la matriz Saturado vs. Nicho retrasa la ideación.", style_table_cell)],
        [Paragraph("<b>12:00 PM (Vie)</b><br/>T-24 Horas", style_table_cell), Paragraph("<b>Cierre fatal de confirmación de equipo en SIRLI.</b>", style_table_cell), Paragraph("Inhabilitación automática si no cumple: 4-10 miembros, &ge;1 ing, &ge;1 mujer.", style_table_cell)],
        [Paragraph("<b>04:00 PM (Vie)</b><br/>T-20 Horas", style_table_cell), Paragraph("Aprobación de la Tesis de Solución con Efecto Wow.", style_table_cell), Paragraph("Evitar apps pasivas. Activar hibridación ciber-física o pasivo a capital.", style_table_cell)],
        [Paragraph("<b>08:00 PM (Vie)</b><br/>T-16 Horas", style_table_cell), Paragraph("<b>Publicación obligatoria de TikTok internacional.</b>", style_table_cell), Paragraph("Subir con los 5 hashtags oficiales antes de la deliberación de medianoche.", style_table_cell)],
        [Paragraph("<b>12:00 AM (Sáb)</b><br/>T-12 Horas", style_table_cell), Paragraph("<b>Congelamiento total de arquitectura técnica COTS.</b>", style_table_cell), Paragraph("Prohibido alterar la solución técnica durante la madrugada.", style_table_cell)],
        [Paragraph("<b>04:00 AM (Sáb)</b><br/>T-8 Horas", style_table_cell), Paragraph("Cierre de memoria técnica pautada y presupuesto.", style_table_cell), Paragraph("Auditar caracteres con espacios para evitar truncamientos en la entrega.", style_table_cell)],
        [Paragraph("<b>07:00 AM (Sáb)</b><br/>T-5 Horas", style_table_cell), Paragraph("Grabación de locución PAS-V (240–270 palabras).", style_table_cell), Paragraph("Verificar cadencia estricta de 135 ppm y duración &le;118 segundos.", style_table_cell)],
        [Paragraph("<b>09:30 AM (Sáb)</b><br/>T-2.5 Horas", style_table_cell), Paragraph("<b>Render final de video (1080p) y carga en YouTube.</b>", style_table_cell), Paragraph("YouTube tarda 20-30 min en procesar HD. Configurar en 'No listado'.", style_table_cell)],
        [Paragraph("<b>11:00 AM (Sáb)</b><br/>T-1 Hora", style_table_cell), Paragraph("<b>Auditoría de sincronía numérica PDF vs. Video.</b>", style_table_cell), Paragraph("Cotejo exacto de costos y beneficiarios. Cero discrepancias.", style_table_cell)],
        [Paragraph("<b>11:30 AM (Sáb)</b><br/>T-30 Minutos", style_table_cell), Paragraph("Carga final y emisión de comprobante oficial.", style_table_cell), Paragraph("Usar red móvil 4G/5G de contingencia para evitar saturación de Wi-Fi.", style_table_cell)],
        [Paragraph("<b>12:00 PM (Sáb)</b><br/>T-0 Inmutable", style_table_cell), Paragraph("<b>CIERRE DEFINITIVO DEL CERTAMEN.</b>", style_table_cell), Paragraph("Comprobante guardado en captura de pantalla y PDF de respaldo.", style_table_cell)]
    ]
    t_sched = Table(sched_rows, colWidths=[90, 180, 234])
    t_sched.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_sched)
    story.append(Spacer(1, 14))

    story.append(Paragraph("10. PROTOCOLO DE DESPACHO MULTI-IA ASISTIDO", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=8))
    prompt_proto = """
    Al emplear modelos de IA generativa para acelerar entregables técnicos, estructurar el despacho bajo el estándar de <b>5 Capas Tácticas</b>:<br/>
    1. <b>[ROL]:</b> Especialista Senior en Propiedad Intelectual / Ingeniero de Costos / Locutor.<br/>
    2. <b>[CERTAMEN ACTIVO]:</b> Rally Latinoamericano (28h) o Rally Nacional (24h).<br/>
    3. <b>[RÚBRICA AUDITADA]:</b> Citar criterio oficial exacto (ej. <i>Prefactibilidad Económica y Sustentabilidad Ambiental, 20 Puntos</i>).<br/>
    4. <b>[RESTRICCIÓN DE SALIDA]:</b> Límite estricto de caracteres con espacios o palabras exactas a 135 ppm.<br/>
    5. <b>[BILINGÜISMO EVALUATIVO]:</b> Lenguaje COTS universal y USD para Latam; anclaje territorial en PNDH para Nacional.<br/><br/>
    <i>«La ingeniería rigurosa y la disciplina metodológica son la única garantía de victoria en 28 horas continuas.»</i>
    """
    t_proto = Table([[Paragraph(prompt_proto, style_callout)]], colWidths=[504])
    t_proto.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER),
        ('LINELEFT', (0,0), (0,0), 3.5, NAVY),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_proto)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generado exitosamente en: {filename}")

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs")
    os.makedirs(out_dir, exist_ok=True)
    out_pdf_dual = os.path.join(out_dir, "MANUAL_MAESTRO_RALLY_LATAM_Y_NICARAGUA_INNOVA_2026.pdf")
    build_pdf(out_pdf_dual)
    # Copia para compatibilidad
    import shutil
    shutil.copyfile(out_pdf_dual, os.path.join(out_dir, "MANUAL_MAESTRO_RALLY_INNOVACION_2026.pdf"))
    print("Archivos sincronizados.")
