"""
Generador de Matriz de Deliberación y Selección de Desafíos 2026 (.docx)
Oficial para Certámenes de Innovación (Rally Latinoamericano & Rally Nacional)
"""
import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="none"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def create_matriz_document(output_path):
    doc = Document()

    # 1. Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Palette
    C_NAVY = RGBColor(13, 27, 53)      # #0D1B35
    C_PRIMARY = RGBColor(8, 102, 245)  # #0866F5
    C_SLATE = RGBColor(92, 113, 147)   # #5C7193
    C_BODY = RGBColor(30, 41, 59)      # #1E293B

    # ── HEADER / BANNER ──
    p_header = doc.add_paragraph()
    p_header.paragraph_format.space_before = Pt(0)
    p_header.paragraph_format.space_after = Pt(2)
    run_tag = p_header.add_run("RALLY STUDIO · WORKBENCH DE INNOVACIÓN 2026")
    run_tag.font.name = "Segoe UI"
    run_tag.font.size = Pt(8.5)
    run_tag.font.bold = True
    run_tag.font.color.rgb = C_PRIMARY

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("Matriz Oficial de Deliberación y Selección de Desafíos")
    run_title.font.name = "Segoe UI Semibold"
    run_title.font.size = Pt(20)
    run_title.font.bold = True
    run_title.font.color.rgb = C_NAVY

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(16)
    run_sub = p_sub.add_run(
        "Herramienta táctica para la fase T=0 a T+2h de certámenes continuos (28 horas). "
        "Evaluación multicriterio, pronósticos WOW de alto impacto y ponderación estricta de rúbrica."
    )
    run_sub.font.name = "Segoe UI"
    run_sub.font.size = Pt(10)
    run_sub.font.color.rgb = C_SLATE

    # ── METADATA BOX (EQUIPO / CERTAMEN) ──
    table_meta = doc.add_table(rows=2, cols=4)
    table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_meta, color="0866F5", sz="8")

    meta_fields = [
        ("EQUIPO:", "___________________________", "SEDE / UNIVERSIDAD:", "UNI - RUPAP (Nicaragua)"),
        ("CATEGORÍA:", "[ ] Innovación   [ ] Impacto Social", "HORA DE DELIBERACIÓN:", "08:00 AM - 10:00 AM (Día 1)")
    ]

    for r_idx, row_data in enumerate(meta_fields):
        for c_idx in range(4):
            cell = table_meta.cell(r_idx, c_idx)
            set_cell_background(cell, "F0F6FF" if c_idx % 2 == 0 else "FFFFFF")
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(row_data[c_idx])
            run.font.name = "Segoe UI"
            run.font.size = Pt(9)
            if c_idx % 2 == 0:
                run.font.bold = True
                run.font.color.rgb = C_NAVY
            else:
                run.font.color.rgb = C_BODY

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # ── SECCIÓN 1: PROTOCOLO DE DECISIÓN EN 60 MINUTOS ──
    p_s1 = doc.add_paragraph()
    p_s1.paragraph_format.space_before = Pt(14)
    p_s1.paragraph_format.space_after = Pt(6)
    r_s1 = p_s1.add_run("1. Protocolo de Decisión Rápida (Fórmula Anti-Parálisis)")
    r_s1.font.name = "Segoe UI Semibold"
    r_s1.font.size = Pt(13)
    r_s1.font.bold = True
    r_s1.font.color.rgb = C_NAVY

    p_rule = doc.add_paragraph()
    p_rule.paragraph_format.space_after = Pt(10)
    r_r = p_rule.add_run(
        "REGLA DE ORO DE 28 HORAS: Un equipo que no ha seleccionado su reto antes de las 10:00 AM "
        "pierde el 60% de probabilidad de entregar un documento pautado riguroso y un prototipo ciberfísico funcional. "
        "Aplique el siguiente flujo de descarte de tres filtros:"
    )
    r_r.font.name = "Segoe UI"
    r_r.font.size = Pt(9.5)
    r_r.font.color.rgb = C_BODY

    filters = [
        ("Filtro 1: Factibilidad en 28h (No Negociable)", "Descarte inmediato de propuestas que requieran ensayos biológicos de semanas, permisos ministeriales inalcanzables o hardware exótico no disponible en el laboratorio."),
        ("Filtro 2: Factor WOW y Diferenciación Radical", "Si el 80% de los competidores propondrá una 'app móvil informativa' o un 'sitio web', la propuesta muere en la deliberación continental. Busque hibridación física (sensores, reactores, mecanismos mecánicos)."),
        ("Filtro 3: Anclaje y Dolor Territorial", "El jurado premia soluciones que resuelven una herida cuantificable en comunidades vulnerables, mercados populares o cooperativas reales de América Latina.")
    ]
    for title, desc in filters:
        p_f = doc.add_paragraph(style='List Bullet')
        p_f.paragraph_format.space_after = Pt(3)
        r_ft = p_f.add_run(title + ": ")
        r_ft.font.name = "Segoe UI"
        r_ft.font.bold = True
        r_ft.font.size = Pt(9)
        r_ft.font.color.rgb = C_PRIMARY
        r_fd = p_f.add_run(desc)
        r_fd.font.name = "Segoe UI"
        r_fd.font.size = Pt(9)
        r_fd.font.color.rgb = C_BODY

    # ── SECCIÓN 2: TABLA DE EVALUACIÓN MULTICRITERIO ──
    p_s2 = doc.add_paragraph()
    p_s2.paragraph_format.space_before = Pt(16)
    p_s2.paragraph_format.space_after = Pt(6)
    r_s2 = p_s2.add_run("2. Matriz General de Evaluación Multicriterio (100 Puntos Oficiales)")
    r_s2.font.name = "Segoe UI Semibold"
    r_s2.font.size = Pt(13)
    r_s2.font.bold = True
    r_s2.font.color.rgb = C_NAVY

    # Table with 10 rows (1 header + 9 challenges)
    table_eval = doc.add_table(rows=10, cols=8)
    table_eval.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_eval, color="CBD5E1", sz="4")

    headers = [
        "Reto #", "Problemática Oficial", "Categoría",
        "Innovación\n(30 pts)", "Viabilidad\n(25 pts)", "Impacto\n(20 pts)",
        "Ejecución 28h\n(15 pts)", "TOTAL\n(100 pts)"
    ]
    hdr_row = table_eval.rows[0]
    for c_idx, title in enumerate(headers):
        cell = hdr_row.cells[c_idx]
        set_cell_background(cell, "0D1B35")
        set_cell_margins(cell, top=100, bottom=100, left=60, right=60)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(title)
        r.font.name = "Segoe UI"
        r.font.size = Pt(8)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    challenges_summary = [
        ("01", "Segunda vida motores lavadoras/ventiladores", "Social", "___ / 30", "___ / 25", "___ / 20", "___ / 15", "____ / 100"),
        ("02", "Sensores comunitarios alerta inundaciones", "Innovación", "___ / 30", "___ / 25", "___ / 20", "___ / 15", "____ / 100"),
        ("03", "Protección tecnológica de polinizadores", "Innovación", "___ / 30", "___ / 25", "___ / 20", "___ / 15", "____ / 100"),
        ("04", "Pirólisis y revalorización biomasa urbana", "Innovación", "___ / 30", "___ / 25", "___ / 20", "___ / 15", "____ / 100"),
        ("05", "Reservorios pluviales con microfiltración", "Innovación", "___ / 30", "___ / 25", "___ / 20", "___ / 15", "____ / 100"),
        ("06", "Reciclaje plástico costero en filamento 3D", "Social", "___ / 30", "___ / 25", "___ / 20", "___ / 15", "____ / 100"),
        ("07", "Conversión barrial aceite de cocina usado", "Social", "___ / 30", "___ / 25", "___ / 20", "___ / 15", "____ / 100"),
        ("08", "Mermas de alimentos mercados populares", "Social", "___ / 30", "___ / 25", "___ / 20", "___ / 15", "____ / 100"),
        ("09", "Refugio y energía modular post-desastre", "Innovación", "___ / 30", "___ / 25", "___ / 20", "___ / 15", "____ / 100"),
    ]

    for idx, data in enumerate(challenges_summary):
        row = table_eval.rows[idx + 1]
        bg = "F8FAFD" if idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(data):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=50, right=50)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            if c_idx in [0, 2, 3, 4, 5, 6, 7]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            if c_idx == 0:
                r.font.bold = True
                r.font.color.rgb = C_PRIMARY
            elif c_idx == 7:
                r.font.bold = True
                r.font.color.rgb = C_NAVY
            else:
                r.font.color.rgb = C_BODY

    # ── SECCIÓN 3: FICHAS TÉCNICAS ESTRATÉGICAS DE LOS 9 RETOS ──
    doc.add_page_break()

    p_s3 = doc.add_paragraph()
    p_s3.paragraph_format.space_before = Pt(0)
    p_s3.paragraph_format.space_after = Pt(6)
    r_s3 = p_s3.add_run("3. Fichas Técnicas de Análisis Estratégico (Catálogo 2026)")
    r_s3.font.name = "Segoe UI Semibold"
    r_s3.font.size = Pt(15)
    r_s3.font.bold = True
    r_s3.font.color.rgb = C_NAVY

    p_s3_sub = doc.add_paragraph()
    p_s3_sub.paragraph_format.space_after = Pt(14)
    r_s3_sub = p_s3_sub.add_run(
        "Cada ficha compila el pronóstico WOW, la adaptación territorial recomendada "
        "y el precedente ganador en certámenes nacionales e internacionales."
    )
    r_s3_sub.font.name = "Segoe UI"
    r_s3_sub.font.size = Pt(9.5)
    r_s3_sub.font.color.rgb = C_SLATE

    challenges_details = [
        {
            "id": "01",
            "title": "Segunda vida y reconversión de motores eléctricos de electrodomésticos en desuso",
            "category": "Impacto Social · ODS 12, 8, 9 · Win Rate: 92% (Densidad: Baja)",
            "wow": "Kit de reconversión con variador de frecuencia universal reciclado, acople impreso en PETG y banco de molienda de forraje agropecuario accionado por rotor recuperado.",
            "adaptation": "Anclaje directo en cooperativas lecheras y avícolas de Chontales, Matagalpa y Boaco, sustituyendo motores diésel caros por motores de lavadora reacondicionados para picadoras de pasto.",
            "novelty": "Rompe la trampa del reciclaje pasivo creando máquinas productivas de tracción mecánica directa con coste inferior a $65 USD por unidad.",
            "precedent": "Avocado 2026 (1° Nac. Social) / Revolt (El Salvador)"
        },
        {
            "id": "02",
            "title": "Redes de sensores comunitarios para prevención y alerta temprana de inundaciones",
            "category": "Innovación · ODS 11, 13, 3 · Win Rate: 84% (Densidad: Alta)",
            "wow": "Red de telemetría hiperlocal con nodos ultrasónicos no invasivos, protocolo LoRaWAN de largo alcance y compuerta electromecánica de alivio con 30 minutos de anticipación.",
            "adaptation": "Despliegue prioritario en los cauces críticos de Managua (Cauce Oriental / Domitila Lugo) y cuencas del Río Grande de Matagalpa en coordinación directa con SINAPRED y COMUPRED.",
            "novelty": "No depende de antenas de celular ni de internet; opera con baterías solares LiFePO4 y radiofrecuencia mallada comunitaria.",
            "precedent": "Techriders 2024 (1° Int. Latam) / Steel Innovators 2026"
        },
        {
            "id": "03",
            "title": "Protección y fomento tecnológico de polinizadores en entornos agropecuarios y urbanos",
            "category": "Innovación · ODS 15, 2, 13 · Win Rate: 95% (Densidad: Muy Baja)",
            "wow": "Colmena bioclimática con monitor bioacústico/térmico pasivo no intrusivo y difusor piezoeléctrico de micronutrientes orgánicos activado por energía solar.",
            "adaptation": "Protección de abejas nativas meliponas (sin aguijón) en cafetales de Jinotega y corredores biológicos de Río San Juan, impulsando miel medicinal con denominación de origen.",
            "novelty": "Diferenciación radical: casi ningún equipo elige este reto; combina acústica de frecuencia espectral con bioprotección sin perturbar el panal.",
            "precedent": "Ignis Code 2026 (1° Nac. Innovación)"
        },
        {
            "id": "04",
            "title": "Revalorización y transformación de residuos de poda y biomasa vegetal urbana",
            "category": "Innovación · ODS 12, 11, 13 · Win Rate: 88% (Densidad: Media)",
            "wow": "Reactor modular de pirólisis lenta in-situ para producción de biochar activado con inoculantes micorrícicos, con captura de gases térmicos para secado de granos.",
            "adaptation": "Erradicación de quemas en vertederos municipales de León y Masaya, generando biochar para regenerar suelos volcánicos degradados.",
            "novelty": "Evita el transporte masivo de biomasa procesando en el propio punto de acopio con balance térmico autosuficiente.",
            "precedent": "Kubo I+D (Argentina 2026) / Bioinnovatech (Costa Rica)"
        },
        {
            "id": "05",
            "title": "Reservorios pluviales y captación comunitaria de agua con microfiltración",
            "category": "Innovación · ODS 6, 11, 12 · Win Rate: 86% (Densidad: Alta)",
            "wow": "Cisterna modular prefabricada con separador centrífugo de primeras lluvias, lecho de zeolita natural con carbón de cáscara de café y dosificador solar UV-C.",
            "adaptation": "Escuelas públicas y comunidades del Corredor Seco nicaragüense (Madriz, Estelí, Nueva Segovia) garantizando 180 días de reserva escolar.",
            "novelty": "Filtro autóctono con subproductos de café nicaragüense y zeolita regional, abatiendo el costo del filtro comercial en un 78%.",
            "precedent": "Francisquitos (El Salvador 2026) / Sistema Captación UNI (2024)"
        },
        {
            "id": "06",
            "title": "Gestión y valorización de residuos plásticos en playas y ecosistemas costeros",
            "category": "Impacto Social · ODS 14, 12, 11 · Win Rate: 78% (Densidad: Media)",
            "wow": "Extrusora compacta móvil de filamento de PET/nylon para impresión 3D de artes de pesca duraderas y balizas flotantes de señalización costera.",
            "adaptation": "San Juan del Sur, Poneloya y comunidades de pescadores artesanales del Caribe nicaragüense (Bluefields / Bilwi).",
            "novelty": "Transformación de residuo in-situ en herramientas de trabajo marino sin intermediación industrial pesada.",
            "precedent": "Recoplaya / Smat Warriors (URACCAN 2025)"
        },
        {
            "id": "07",
            "title": "Recolección y conversión de aceite vegetal doméstico usado en biocombustibles o jabón",
            "category": "Impacto Social · ODS 12, 6, 7 · Win Rate: 82% (Densidad: Baja)",
            "wow": "Micro-planta barrial de transesterificación asistida por cavitación hidrodinámica de bajo consumo, con dispensador de jabón biodegradable comunitario.",
            "adaptation": "Comiderías populares del Mercado Oriental y fritangas tradicionales de Managua, canjeando aceite usado por jabón desengrasante institucional.",
            "novelty": "Reactor de cavitación que reduce el tiempo de reacción química de 4 horas a solo 18 minutos sin químicos peligrosos.",
            "precedent": "Foodtech (FIUNI Paraguay 2026)"
        },
        {
            "id": "08",
            "title": "Reducción de desperdicio de alimentos y logística de redistribución en mercados",
            "category": "Impacto Social · ODS 2, 12, 1 · Win Rate: 85% (Densidad: Alta)",
            "wow": "Bolsa comunitaria digital P2P operada por bots de mensajería SMS/WhatsApp de cero datos móviles, vinculada a deshidratadores solares parabólicos.",
            "adaptation": "Mercado Mayoreo y Mercado Huembes de Managua, salvando frutas perecederas para el programa de merienda escolar comunitaria.",
            "novelty": "Uso de deshidratadores solares directos para convertir el excedente no rescatado a tiempo en harina frutal rica en nutrientes.",
            "precedent": "Mexitech (UPEMOR 1° Int. 2024) / Catalizadores (Chile)"
        },
        {
            "id": "09",
            "title": "Sistemas modulares de refugio y energía de emergencia post-desastre climático",
            "category": "Innovación · ODS 11, 13, 7 · Win Rate: 89% (Densidad: Baja)",
            "wow": "Célula habitable hexagonal desplegable en seco en 45 minutos con paneles sándwich de caña brava tratada y techo flexible fotovoltaico con banco LiFePO4.",
            "adaptation": "Triángulo Minero y Costa Caribe Norte ante embates recurrentes de huracanes categoría 4 y 5 (Iota, Eta, Julia), transportable en botes fluviales.",
            "novelty": "Montaje 100% sin herramientas mecánicas por la propia familia damnificada con autonomía energética inmediata.",
            "precedent": "Hooke (Chile 2026) / The Bubbles (Paraguay)"
        }
    ]

    for item in challenges_details:
        t_card = doc.add_table(rows=5, cols=2)
        t_card.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(t_card, color="BFDBFE", sz="4")

        # Row 0: Header with ID & Title
        cell_top = t_card.cell(0, 0)
        cell_top.merge(t_card.cell(0, 1))
        set_cell_background(cell_top, "0D1B35")
        set_cell_margins(cell_top, top=80, bottom=80, left=100, right=100)
        p_ch = cell_top.paragraphs[0]
        p_ch.paragraph_format.space_before = Pt(0)
        p_ch.paragraph_format.space_after = Pt(0)
        r_id = p_ch.add_run(f"RETO #{item['id']} · ")
        r_id.font.name = "Segoe UI"
        r_id.font.bold = True
        r_id.font.size = Pt(10)
        r_id.font.color.rgb = RGBColor(96, 165, 250)
        r_t = p_ch.add_run(item['title'])
        r_t.font.name = "Segoe UI"
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = RGBColor(255, 255, 255)

        fields = [
            ("Métricas & ODS", item['category']),
            ("Propuesta WOW", item['wow']),
            ("Adaptación Territorial", item['adaptation']),
            ("Novedad / Precedente", f"{item['novelty']} (Referencia: {item['precedent']})")
        ]

        for r_idx, (lbl, val) in enumerate(fields, start=1):
            c_lbl = t_card.cell(r_idx, 0)
            c_val = t_card.cell(r_idx, 1)
            set_cell_background(c_lbl, "F0F6FF")
            set_cell_background(c_val, "FFFFFF")
            set_cell_margins(c_lbl, top=50, bottom=50, left=70, right=70)
            set_cell_margins(c_val, top=50, bottom=50, left=70, right=70)

            p_l = c_lbl.paragraphs[0]
            p_l.paragraph_format.space_before = Pt(0)
            p_l.paragraph_format.space_after = Pt(0)
            r_l = p_l.add_run(lbl)
            r_l.font.name = "Segoe UI"
            r_l.font.size = Pt(8.5)
            r_l.font.bold = True
            r_l.font.color.rgb = C_NAVY

            p_v = c_val.paragraphs[0]
            p_v.paragraph_format.space_before = Pt(0)
            p_v.paragraph_format.space_after = Pt(0)
            r_v = p_v.add_run(val)
            r_v.font.name = "Segoe UI"
            r_v.font.size = Pt(8.5)
            r_v.font.color.rgb = C_BODY

        doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # ── SECCIÓN 4: ACTA DE VOTACIÓN Y CONSENSO FINAL ──
    doc.add_page_break()

    p_s4 = doc.add_paragraph()
    p_s4.paragraph_format.space_before = Pt(0)
    p_s4.paragraph_format.space_after = Pt(6)
    r_s4 = p_s4.add_run("4. Acta de Selección Definitiva y Asignación de Roles")
    r_s4.font.name = "Segoe UI Semibold"
    r_s4.font.size = Pt(14)
    r_s4.font.bold = True
    r_s4.font.color.rgb = C_NAVY

    table_roles = doc.add_table(rows=9, cols=4)
    table_roles.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_roles, color="CBD5E1", sz="4")

    role_headers = ["Rol en las 28 Horas", "Integrante Responsable", "Entregable Principal", "Firma Consenso"]
    hdr_r = table_roles.rows[0]
    for c_idx, title in enumerate(role_headers):
        cell = hdr_r.cells[c_idx]
        set_cell_background(cell, "0D1B35")
        set_cell_margins(cell, top=80, bottom=80, left=60, right=60)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    roles_data = [
        ("Líder de Estrategia & Tesis", "____________________", "Pautado Secc. 1 y 2 (Problema/Solución)", "[  ]"),
        ("Ingeniero de Hardware / Ciberfísico", "____________________", "Diagrama LoRa/ESP32 y BOM de componentes", "[  ]"),
        ("Economista / Modelador Canvas", "____________________", "Presupuesto de Marcha y 9 Cuadrantes", "[  ]"),
        ("Especialista en Impacto Social / ODS", "____________________", "Alineación ODS y Validación Territorial", "[  ]"),
        ("Director Audiovisual & Guion (120s)", "____________________", "Storyline 4 Actos y Cronómetro 135 ppm", "[  ]"),
        ("Editor de Video (CapCut/Premiere)", "____________________", "Render final TikTok/YouTube H.264", "[  ]"),
        ("Auditor de Rúbrica & Caracteres", "____________________", "Revisión ciega contra los 100 puntos", "[  ]"),
        ("Voz / Locutor Pitch", "____________________", "Grabación de audio nítido sin ruido", "[  ]")
    ]

    for idx, (rol, resp, ent, firma) in enumerate(roles_data):
        row = table_roles.rows[idx + 1]
        bg = "F8FAFD" if idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([rol, resp, ent, firma]):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=50, right=50)
            p = cell.paragraphs[0]
            if c_idx == 3:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            if c_idx == 0:
                r.font.bold = True
                r.font.color.rgb = C_NAVY
            else:
                r.font.color.rgb = C_BODY

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Resolution callout
    p_res = doc.add_paragraph()
    p_res_border = doc.add_table(rows=1, cols=1)
    p_res_border.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_res = p_res_border.cell(0, 0)
    set_cell_background(c_res, "EFF6FF")
    set_cell_margins(c_res, top=100, bottom=100, left=120, right=120)
    set_table_borders(p_res_border, color="0866F5", sz="8")
    p_in = c_res.paragraphs[0]
    r_res_title = p_in.add_run("ACUERDO UNÁNIME DEL EQUIPO:\n")
    r_res_title.font.name = "Segoe UI"
    r_res_title.font.bold = True
    r_res_title.font.size = Pt(9.5)
    r_res_title.font.color.rgb = C_PRIMARY

    r_res_body = p_in.add_run(
        "Por consenso de los integrantes firmantes, el equipo selecciona el RETO # _____ con el nombre de proyecto preliminar: "
        "_____________________________________. A partir de este momento (T+2h), queda prohibido reiniciar la deliberación o cambiar de desafío."
    )
    r_res_body.font.name = "Segoe UI"
    r_res_body.font.size = Pt(9)
    r_res_body.font.color.rgb = C_NAVY

    # Ensure directories exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "dashboard/docs/Matriz_Seleccion_Desafios_2026.docx"
    create_matriz_document(out)
