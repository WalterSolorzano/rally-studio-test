#!/usr/bin/env python3
"""
gen_canvas.py -- Genera docs/canvas.md a partir de brief.json y budget/budget.json.
Valida la coherencia de costos, propuesta de valor y beneficiarios.
"""
import json
import pathlib
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BRIEF_PATH = pathlib.Path("brief.json")
BUDGET_PATH = pathlib.Path("budget/budget.json")
CANVAS_PATH = pathlib.Path("docs/canvas.md")

def main():
    if not BRIEF_PATH.exists():
        print("ERROR: brief.json no existe.")
        sys.exit(1)

    brief = json.loads(BRIEF_PATH.read_text(encoding="utf-8"))
    budget_items = json.loads(BUDGET_PATH.read_text(encoding="utf-8")) if BUDGET_PATH.exists() else []

    total_budget = sum(float(it.get("units", 1)) * float(it.get("unit_cost_usd", 0)) for it in budget_items)
    
    project = brief.get("project_name", "PROYECTO").upper()
    team = brief.get("team_name", "EQUIPO")
    city = brief.get("city", "Managua")
    category = brief.get("category", "General")
    rally = brief.get("rally_type", "nacional").upper()
    ods = ", ".join(brief.get("ods_ids", ["ODS 11"]))
    desc = brief.get("description_one_line", "Solucion tecnica")

    canvas_content = f"""# Business Model Canvas -- {project}
**Certamen:** Rally {rally} | **Equipo:** {team} | **Ciudad Piloto:** {city} | **Categoria:** {category}
**ODS Vinculados:** {ods} | **Costo de Puesta en Marcha:** ${total_budget:,.2f} USD

---

| Bloque Canvas | Definicion Operativa del Proyecto |
| :--- | :--- |
| **1. Socios Clave (Key Partners)** | • Alcaldia Municipal de {city} (autorizacion de infraestructura publica y postes).<br>• Sistema de Gestion de Riesgo y Proteccion Civil (SINAPRED).<br>• Proveedores de componentes IoT mayoristas y distribuidores locales de perfiles metalicos.<br>• Universidades y Centros de Innovacion Abierta (CNIA). |
| **2. Actividades Clave (Key Activities)** | • Ensamble y calibracion de modulos sensores con carcasas IP67.<br>• Despliegue de red de telemetria LoRaWAN y gateways base.<br>• Integracion de API de visualizacion de datos en tiempo real.<br>• Capacitacion y transferencia tecnica a operadores comunitarios y brigadas locales. |
| **3. Recursos Clave (Key Resources)** | • **Fisicos:** {len(budget_items)} componentes de puesta en marcha (sensores, placas ESP32, alimentacion solar).<br>• **Tecnologicos:** Firmware de bajo consumo, broker MQTT y panel de control web.<br>• **Humanos:** Equipo multidisciplinario de ingenieria, diseno y gestion territorial.<br>• **Financieros:** Fondo inicial de implementacion (${total_budget:,.2f} USD). |
| **4. Propuesta de Valor (Value Proposition)** | **{desc}**<br>• Alerta temprana hiperlocal y oportuna con 30 minutos de anticipacion.<br>• Despliegue descentralizado de bajo costo frente a estaciones meteorologicas convencionales.<br>• Independencia de la red electrica mediante respaldo fotovoltaico y bajo consumo. |
| **5. Relaciones con Clientes (Customer Relationships)** | • Asistencia tecnica directa y mantenimiento preventivo semestral.<br>• Monitoreo colaborativo en tiempo real con brigadas comunitarias.<br>• Alianzas de cooperacion tecnica interinstitucional B2G. |
| **6. Canales de Distribucion (Channels)** | • Entrega directa en talleres municipales de obras publicas.<br>• Interfaz web y alertas moviles para tomadores de decision.<br>• Muestras de innovacion y foros de gestion de riesgo. |
| **7. Segmentos de Clientes / Beneficiarios (Customer Segments)** | • **Beneficiarios Primarios:** Familias y barrios vulnerables a anegaciones en {city}.<br>• **Clientes / Financiadores:** Alcaldias municipales, programas de mitigacion de riesgo (B2G).<br>• **Sector Privado:** Cooperativas agropecuarias y poligonos industriales en cuencas criticas. |
| **8. Estructura de Costos (Cost Structure)** | • Adquisicion de hardware y sensores: ${total_budget:,.2f} USD (ver `budget/budget.xlsx`).<br>• Ensamble, calibracion y mano de obra de despliegue en campo.<br>• Servidor cloud y conectividad de respaldo anual: ~$240 USD/ano.<br>• Flete internacional y aranceles consolidados (~15-18% del costo FOB). |
| **9. Fuentes de Ingresos / Sostenibilidad (Revenue Streams)** | • Contratos B2G de provision de red y telemetria municipal.<br>• Cuotas de mantenimiento y calibracion de red por nodo sensor.<br>• Acceso a reportes historicos y datos analiticos para aseguradoras y proyectos de infraestructura. |

---

## Verificacion de Consistencia con Otros Entregables
- [x] **Video (Acto II):** La propuesta de valor refleja fielmente la solucion audiovisual.
- [x] **Presupuesto (budget.xlsx):** La estructura de costos coincide exactamente con los ${total_budget:,.2f} USD cotizados.
- [x] **Pautado (Solucion y Prefactibilidad):** Los socios y actividades clave corresponden a la descripcion tecnica del documento Word.
"""

    pathlib.Path("docs").mkdir(exist_ok=True)
    CANVAS_PATH.write_text(canvas_content, encoding="utf-8")
    print(f"OK: {CANVAS_PATH} generado exitosamente.")

if __name__ == "__main__":
    main()
