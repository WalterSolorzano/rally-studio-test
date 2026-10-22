# Rúbricas Oficiales: Matriz Jurado Nacional (Nicaragua Innova) vs. Jurado Internacional (Rally LATAM)

Documento normativo del motor de auditoría e IA de **Rally Studio**. Define las dos matrices oficiales de calificación sobre **100 Puntos**, sus ponderaciones específicas, focos analíticos y reglas operativas para la evaluación algorítmica.

---

## 1. Cuadro Comparativo Estructural

| Dimensión | Selector `Nacional (Nicaragua Innova)` | Selector `Internacional (Rally LATAM)` |
| :--- | :--- | :--- |
| **Entidades Rectoras** | Comisión Nal. Economía Creativa, CNU, INATEC, MINJUVE, TELCOR, MEFCCA, MIFIC, CONICYT. | CONFEDI (Arg), ACOFI (Col), ANFEI (Méx), CCFI (Chile), CONDEFI. |
| **Régimen de Horas** | **24 Horas** continuas. | **28 Horas** continuas. |
| **Categorías Oficiales** | **3 Categorías:**<br>1. Innovación Tecnológica<br>2. Innovación Social<br>3. Innovación de Procesos u Organizacional | **2 Categorías:**<br>1. Innovación<br>2. Impacto Social |
| **Perfil del Jurado** | Especialistas interinstitucionales del sector público y académico nacional. | Jurado continental internacional. **Prohibición estricta** de evaluar proyectos de su propio país. |
| **Entregable Escrito** | **Documento Técnico de Propuesta (hasta 10 páginas):** Modelo Canvas, presupuesto a 12 meses (C$ / USD), impacto territorial. | **Reporte Pautado Oficial SIRLI:** Límite estricto de caracteres con espacios (1250, 1000, 1500 car.). |
| **Entregable Audiovisual** | Video Pitch YouTube de 120s (alta resonancia en redes nacionales). | Video Pitch YouTube 120s + **Video TikTok de interacción internacional lúdico-creativa** obligatorio. |

---

## 2. Matriz de Calificación: Jurado Nacional (Nicaragua Innova - 100 Puntos)

```json
{
  "rubrica_nacional": {
    "total_puntos": 100,
    "criterios": [
      {
        "id": "criterio_nac_1",
        "nombre": "Grado de Innovación, Creatividad y Hibridación Tecnológica",
        "peso_porcentaje": 25,
        "puntos": 25,
        "items": [
          "Originalidad y diferenciación frente a soluciones convencionales en el entorno local.",
          "Hibridación tecnológica accesible (IoT de bajo costo como ESP32/LoRa, gemelos digitales, IA, bio-materiales locales).",
          "Capacidad creativa y prototipo conceptual/físico presentado.",
          "Adaptabilidad de la tecnología a la infraestructura y conectividad nacional."
        ]
      },
      {
        "id": "criterio_nac_2",
        "nombre": "Impacto Social, Territorial y Alineación con Políticas Públicas",
        "peso_porcentaje": 25,
        "puntos": 25,
        "items": [
          "Alineación explícita con el Plan Nacional de Lucha contra la Pobreza y Desarrollo Humano 2022-2026 (PNDH).",
          "Articulación con programas nacionales: Red de Ciudades Creativas, Soberanía Alimentaria, Restitución de Derechos (Ley 763).",
          "Anclaje territorial específico (comunidades nombradas, microparques, zonas productivas rurales o urbanas de Nicaragua).",
          "Cuantificación del impacto social (familias, cooperativas, empleos directos, población vulnerable beneficiada)."
        ]
      },
      {
        "id": "criterio_nac_3",
        "nombre": "Viabilidad Técnica, Operativa y Uso de Recursos Locales",
        "peso_porcentaje": 20,
        "puntos": 20,
        "items": [
          "Factibilidad de implementación en talleres locales, centros tecnológicos INATEC o laboratorios universitarios CNU.",
          "Aprovechamiento de materias primas o pasivos ambientales locales (cáscara de cacao, café, biomasa, residuos de botaderos).",
          "Sustentación teórica y técnica del diseño con rigor metodológico.",
          "Claridad operativa y rol de los beneficiarios en el mantenimiento de la solución."
        ]
      },
      {
        "id": "criterio_nac_4",
        "nombre": "Prefactibilidad Económica, Sostenibilidad y Modelo Comunitario/Canvas",
        "peso_porcentaje": 15,
        "puntos": 15,
        "items": [
          "Presupuesto de inversión aterrizado a la economía nacional (desglose unitario en C$ y USD).",
          "Modelo de sostenibilidad financiera viable (cooperativas, alcaldías municipales, MEFCCA o autofinanciamiento).",
          "Eficiencia en la relación costo-beneficio para pequeños productores o entidades públicas.",
          "Plan de implementación por fases a 12 meses con indicadores de cumplimiento medibles."
        ]
      },
      {
        "id": "criterio_nac_5",
        "nombre": "Calidad del Documento Técnico, Video Pitch y Coherencia de Marca",
        "peso_porcentaje": 15,
        "puntos": 15,
        "items": [
          "Documento técnico estructurado (máximo 10 páginas) con normas APA y fuentes oficiales (BCN, INIDE, ministerios).",
          "Video pitch de 2 minutos claro, persuasivo, con dicción fluida y calidad audiovisual.",
          "Naming dual efectivo (nombre de squad patriótico/cultural + marca registrable de la solución).",
          "Identidad cultural y comunicación empática con el jurado interinstitucional."
        ]
      }
    ]
  }
}
```

---

## 3. Matriz de Calificación: Jurado Internacional (Rally Latinoamericano - 100 Puntos)

```json
{
  "rubrica_latam": {
    "total_puntos": 100,
    "criterios": [
      {
        "id": "grado_innovacion",
        "nombre": "Grado de innovación de la solución propuesta",
        "peso_porcentaje": 30,
        "puntos": 30,
        "items": [
          "La solución es innovadora (arquitectura no trivial y disrupción frente al estado del arte).",
          "El equipo mostró capacidad creativa y diferenciación radical (Efecto Wow).",
          "El equipo utiliza tecnologías apropiadas para el desafío.",
          "Grado de usabilidad y ergonomía de la solución propuesta."
        ]
      },
      {
        "id": "impacto_social",
        "nombre": "Impacto positivo de la propuesta en la sociedad",
        "peso_porcentaje": 20,
        "puntos": 20,
        "items": [
          "La propuesta da solución efectiva a una problemática específica del desafío.",
          "La propuesta tiene un valor social por encima de su valor de mercado.",
          "La propuesta mejora la calidad de vida de los ciudadanos a escala internacional."
        ]
      },
      {
        "id": "prefactibilidad",
        "nombre": "Prefactibilidad económica y social y sustentabilidad ambiental",
        "peso_porcentaje": 20,
        "puntos": 20,
        "items": [
          "La propuesta es sustentable desde el punto de vista económico ($4,000 - $6,000 USD lote piloto sin subsidio permanente).",
          "La propuesta contempla la eficiencia energética y apela a fuentes renovables.",
          "La propuesta optimiza el uso de recursos y principios de economía circular.",
          "La propuesta presenta alternativas de mejora a una problemática ambiental específica."
        ]
      },
      {
        "id": "viabilidad_tecnica",
        "nombre": "Viabilidad técnica de la propuesta",
        "peso_porcentaje": 20,
        "puntos": 20,
        "items": [
          "Base teórica sólida y documentada con citas técnicas y patentes internacionales.",
          "El concepto utiliza recursos y componentes estandarizados obtenibles sin fricción.",
          "La propuesta es acorde a las necesidades de los potenciales usuarios.",
          "La solución está técnicamente validada (balances de masa/energía, despiece CAD, sin suposiciones térmicas inviables)."
        ]
      },
      {
        "id": "presentacion",
        "nombre": "Calidad de la presentación (Pitch 120s & Pautado)",
        "peso_porcentaje": 10,
        "puntos": 10,
        "items": [
          "La presentación demuestra capacidad de síntesis (conteo estricto de caracteres y tiempo de 120s exactos).",
          "La presentación transmite con claridad la solución propuesta y su propuesta de valor.",
          "La propuesta de valor es clara y se ajusta rigurosamente al desafío.",
          "Las ilustraciones, renders 3D y diagramas son claros y pertinentes."
        ]
      }
    ],
    "requisito_habilitador": "Interacción lúdica obligatoria en red social (TikTok internacional validado en SIRLI)."
  }
}
```

---

## 4. Reglas del Motor de IA según Certamen Seleccionado

### Al seleccionar `Rally Nacional Nicaragua Innova` (24H):
1. **Regla de Identidad & Territorialidad**: El modelo debe incorporar municipios específicos (ej. Masaya, Waslala, San Juan de Oriente, Estelí, Bilwi) y justificar el uso de materia prima autóctona.
2. **Alineación con Plan de Gobierno**: Citar expresamente el *PNDH 2022–2026*, programas de *Ciudades Creativas* o *MEFCCA/INATEC*.
3. **Ponderación 25-25-20-15-15**: Ponderar con 25% la Innovación, 25% el Impacto Territorial, 20% la Viabilidad Local, 15% el Modelo Canvas/Económico y 15% el Pitch/Documento.
4. **Formato**: Estructurar informe técnico extendido de hasta 10 páginas.

### Al seleccionar `Rally Latinoamericano de Innovación` (28H):
1. **Regla de Deslocalización y Universalidad**: Usar el caso nacional sólo como laboratorio piloto de validación y proyectar la modularidad hacia toda América Latina.
2. **Cero Dependencia de Subsidios Locales**: El modelo económico debe formularse en USD con retornos B2B/B2G autosostenibles que un decano de México, Colombia o Argentina califique de factible.
3. **Ponderación 30-20-20-20-10**: Aplicar la rúbrica oficial SIRLI (30% Innovación, 20% Impacto, 20% Prefactibilidad, 20% Viabilidad Técnica, 10% Pitch).
4. **Formato**: Respetar límites estrictos de caracteres por sección (1250 / 1000 / 1500 caracteres con espacios).

---

## 5. Mapeo Temporal PAS-V del Video Pitch (120 Segundos / 240-270 Palabras)

Cadencia oral óptima: **135 palabras por minuto** (máximo 270 palabras en guion total). Superar 270 palabras causa dicción ininteligible o descalificación por tiempo (>120s).

| Acto Narrativo | Intervalo | Palabras Guía | Criterios Oficiales Activados en la Rúbrica | Contenido Crítico Obligatorio |
| :--- | :--- | :--- | :--- | :--- |
| **Acto I: Problema** | `0:00 - 0:20` | ~45 palabras | **Impacto Social + Calidad de Presentación** | Gancho estadístico contundente + rostro humano y territorio nombrado. *Prohibido gastar segundos en logotipos o saludo del equipo.* |
| **Acto II: Acción & Solución** | `0:20 - 1:00` | ~90 palabras | **Grado de Innovación + Viabilidad Técnica** | Bautismo de la solución (Marca) + mecanismo físico/químico inédito + despiece o render CAD 3D en pantalla. |
| **Acto III: Factibilidad** | `1:00 - 1:35` | ~75 palabras | **Prefactibilidad Económica, Social y Ambiental** | Costo unitario, ROI estimado, modelo de ingresos y revalorización de residuo/pasivo. *(Causa #1 de eliminación si se omite).* |
| **Acto IV: Verificación** | `1:35 - 2:00` | ~55 palabras | **Integración de los 5 Criterios + Cierre Memorable** | Métricas proyectadas cuantificadas, alineación ODS, escalabilidad regional y frase de cierre memorable. |

---

## 6. Gobernanza Oficial SIRLI y Guardrails de Descalificación

1. **Tribunal de Sede:** Deliberación en $\le 3$ horas tras el cierre de las 28h/24h con tribunal impar ($\ge 3$ jurados, 1 por cada 3 equipos).
2. **Jurado Internacional:** Deliberación a 72 horas. **Incompatibilidad estricta: ningún jurado evalúa propuestas de su propio país.**
3. **Composición de Equipo SIRLI:** 4 a 10 integrantes; mínimo 1 estudiante de ingeniería; mínimo 1 mujer; opcional 1 egresado y 1 docente sin rol de liderazgo ni vocería principal.
4. **Alerta de Discrepancia Numérica:** Toda métrica enunciada en el video pitch (costo, beneficiarios, capacidad) debe coincidir con exactitud matemática con los datos del reporte PDF pautado y el Canvas.

