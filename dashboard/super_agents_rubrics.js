/* ═══════════════════════════════════════════════════════════════════════════
   Super Agentes · Rúbricas compiladas (agente (b), contenido — no motor)
   Fuente única de criterios para dashboard/super_agents.js.
   Regla de oro: NADA inventado. Cada regla lleva ref al documento fuente
   (id en meta.refs). Lo no declarado se etiqueta en el panel como
   "límite no declarado en el corpus".
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  "use strict";

  var meta = {
    refs: {
      "pautado-y-guion": ".agents/rules/pautado-y-guion.md",
      "rubricas-y-puntajes": ".agents/rules/rubricas-y-puntajes.md",
      "modos-rally": ".agents/rules/modos-rally.md",
      "rubric-matrices": "knowledge/rubric_matrices.md",
      "rubric-latam": "knowledge/rubric_latam.md",
      "winners-analysis": "knowledge/winners_analysis.md",
      "winners-latam": "knowledge/winners_latam.md",
      "motor-app": "dashboard/app.js (constantes del motor, espejo: getPautadoLimit, isPautadoComplete, handleCanvasCellInput)",
      "agente-base": "AGENTS.md (reglas del agente del proyecto)",
      "claims": "research/claims.json"
    }
  };

  /* ── Matrices de calificación (100 pts) según rally_type ── */
  var porTipo = {
    nacional: {
      nombre: "Nicaragua Innova (24 h)",
      reglas: [
        { id: "nac-ponderacion", texto: "Ponderación oficial 25 (Innovación) / 25 (Impacto territorial) / 20 (Viabilidad local) / 15 (Prefactibilidad y Canvas) / 15 (Documento y Pitch).", ref: "rubric-matrices" },
        { id: "nac-territorio", texto: "Anclaje a un municipio real de Nicaragua: nombra comunidad, microparque o zona productiva; nada de 'Nicaragua' en abstracto.", ref: "modos-rally" },
        { id: "nac-plan", texto: "Alineación explícita con el Plan Nacional de Lucha contra la Pobreza y para el Desarrollo Humano 2022–2026 (PNDH) y programas concretos: Ciudades Creativas, Soberanía Alimentaria, Restitución de Derechos (Ley 763).", ref: "modos-rally" },
        { id: "nac-monedas", texto: "Presupuesto en C$ y USD, con tasa BCN cuando aplique.", ref: "modos-rally" },
        { id: "nac-documento", texto: "Entregable escrito: Documento Técnico de Propuesta de hasta 10 páginas, con normas APA y fuentes oficiales (BCN, INIDE, ministerios).", ref: "rubric-matrices" },
        { id: "nac-innovacion", texto: "Innovación evalúa: originalidad frente a soluciones convencionales locales, hibridación tecnológica accesible (ESP32/LoRa, gemelos digitales, IA, biomateriales locales), prototipo presentado, adaptabilidad a la infraestructura y conectividad nacional.", ref: "rubric-matrices" },
        { id: "nac-cuantificar", texto: "Cuantifica el impacto: familias, cooperativas, empleos directos, población vulnerable beneficiada.", ref: "modos-rally" }
      ]
    },
    latam: {
      nombre: "Rally Latinoamericano (28 h)",
      reglas: [
        { id: "lat-ponderacion", texto: "Ponderación oficial SIRLI 30 (Innovación) / 20 (Impacto) / 20 (Prefactibilidad) / 20 (Viabilidad Técnica) / 10 (Presentación).", ref: "rubric-matrices" },
        { id: "lat-deslocalizacion", texto: "El caso nacional es solo laboratorio piloto de validación; el diseño es modular, paramétrico y replicable en toda América Latina.", ref: "modos-rally" },
        { id: "lat-usd", texto: "Costos siempre en USD, con lógica de escala B2B/B2G autosostenible sin subsidio permanente que un decano extranjero califique de factible.", ref: "modos-rally" },
        { id: "lat-siglas", texto: "Evita siglas gubernamentales locales que un evaluador internacional no entienda.", ref: "modos-rally" },
        { id: "lat-cierre", texto: "Cierre del video: 'piloto en [ciudad], replicable en toda América Latina'.", ref: "modos-rally" },
        { id: "lat-pautado-limites", texto: "Reporte Pautado Oficial SIRLI con límite estricto de caracteres con espacios por sección.", ref: "rubric-matrices" },
        { id: "lat-tiktok", texto: "Entregable habilitador adicional: video lúdico-creativo de interacción internacional en TikTok con un equipo de otro país (tres entregables auditables: reporte pautado, video YouTube ≤120 s, TikTok).", ref: "rubric-matrices" }
      ]
    }
  };

  /* ── 1 · Revisor de Guión ── */
  var guion = {
    titulo: "Revisor de Guión",
    reglas: [
      { id: "gui-actos", texto: "Estructura de 4 actos (PAS-V): Acto I Dolor 0:00–0:20 (~45 palabras) · Acto II Caja Negra 0:20–1:00 (~90) · Acto III Costo 1:00–1:35 (~75) · Acto IV Cierre 1:35–2:00 (~55).", ref: "rubric-matrices" },
      { id: "gui-palabras", texto: "240–270 palabras en total; locución a 135 palabras por minuto (rango 130–140 ppm). Superar 270 palabras causa dicción ininteligible o descalificación por tiempo (>120 s).", ref: "rubric-matrices" },
      { id: "gui-acto1", texto: "Acto I: PROHIBIDO el nombre del proyecto, su logo, saludo del equipo o lectura del desafío. Solo estadística dura + rostro del beneficiario + territorio nombrado.", ref: "pautado-y-guion" },
      { id: "gui-acto2", texto: "Acto II: bautismo comercial de la solución y desglose técnico visual (3D/CAD/UI, mecanismo físico, químico o algorítmico en pantalla).", ref: "pautado-y-guion" },
      { id: "gui-acto3", texto: "Acto III: costo unitario, quién financia, ROI/ingresos, economía circular. Omitirlo es la causa #1 de eliminación.", ref: "rubric-matrices" },
      { id: "gui-acto4", texto: "Acto IV: tres métricas auditables proyectadas, ODS animados con la paleta del proyecto y cierre empático (nacional) o regional ('piloto en [ciudad], replicable en toda América Latina') en latam.", ref: "pautado-y-guion" },
      { id: "gui-cifras", texto: "Toda métrica enunciada en el video (costo, beneficiarios, capacidad) debe coincidir con exactitud matemática con los datos del pautado, presupuesto y Canvas; el jurado cruza los últimos 25 segundos con el Excel.", ref: "rubric-matrices" },
      { id: "gui-innovacion", texto: "Acto II activa los criterios Innovación + Viabilidad Técnica: mostrar visualmente el mecanismo (caja negra) neutraliza dudas técnicas; las soluciones unidisciplinarias pierden frente a sistemas híbridos ciber-físicos.", ref: "winners-latam" },
      { id: "gui-gancho", texto: "Patrón de video ganador: abrir con una hipótesis de dolor agudo (métrica contundente + arquetipo de beneficiario directo) en menos de 10 segundos; el gancho estadístico + rostro es transversal a los campeones 2019–2025.", ref: "winners-latam" },
      { id: "gui-nac-jurado", texto: "Filtro nacional: identidad territorial (toponimia real), materia prima local en Acto II, alineación institucional en Acto III y orgullo de representación en el cierre.", ref: "winners-latam" },
      { id: "gui-lat-jurado", texto: "Filtro internacional: universalidad del problema en Acto I, transferibilidad modular en Acto II, retorno económico en USD en Acto III y neutralidad geográfica en el cierre.", ref: "winners-latam" },
      { id: "gui-errores", texto: "Errores críticos que restan: trampa del 3D hipercomplejo (descuidar pautado/proveedores), inconsistencia numérica entre piezas, fantasía térmica/energética, diseño 'estilo IA' (morado, glassmorphism, emojis).", ref: "rubric-latam" }
    ],
    promptTarea: {
      lleva: "Con el CONTEXTO DEL PROYECTO y el guión actual de 4 actos, actúa como jurado y guionista ganador: evalúa y REESCRIBE el guión completo acto por acto para el certamen activo, corrigiendo cada problema contra las reglas del guión. Entrega: (1) guión corregido acto por acto, (2) lista de los cambios y por qué (citando la regla incumplida), (3) advertencias de cifras que deben coincidir con el presupuesto.",
      directo: "Evalúa el guión real del usuario contra las reglas. Sé específico con evidencia textual y correcciones concretas."
    },
    salidaEsperada: {
      lleva: "Guión corregido (4 actos) + lista de cambios justificados + advertencias de coherencia con presupuesto.",
      directo: "JSON: {\"veredictos\":[{\"criterio\":\"…\",\"estado\":\"cumple|parcial|falla\",\"nota\":\"…\"}],\"problemas\":[{\"titulo\":\"…\",\"severidad\":\"Crítico|Mejora|Sugerencia\",\"evidencia\":\"cita del acto\",\"correccion\":\"texto propuesto para reemplazar\"}],\"ajustes\":[{\"tab\":\"script\",\"slot\":\"acto1…acto4\",\"texto\":\"texto listo para pegar\"}],\"visuales\":[\"sugerencias de representación por acto\"]}"
    }
  };

  /* ── 2 · Analizador de Presupuesto ── */
  var presupuesto = {
    titulo: "Analizador de Presupuesto",
    reglas: [
      { id: "pre-rango-latam", texto: "Prefactibilidad: el lote piloto debe costar $4,000–$6,000 USD sin subsidio permanente (item oficial de la rúbrica latam 20 pts).", ref: "rubric-matrices" },
      { id: "pre-rango-nacional", texto: "Costo de puesta en marcha $4,000–$6,000 USD, viable con programas de alcaldías/MEFCCA/CNU (la decisión del dueño de Rally Studio aplica el mismo rango en Nacional, convertido a C$ con la tasa BCN del estado).", ref: "rubric-latam" },
      { id: "pre-monedas", texto: "Nacional: desglose unitario en C$ y USD con tasa del BCN. Latam: todo en USD, sin monedas ni tasas locales.", ref: "rubricas-y-puntajes" },
      { id: "pre-filas", texto: "Cada fila del presupuesto lleva element, description, units, unit_cost y URL de respaldo con captura; unidades y costo unitario positivos.", ref: "agente-base" },
      { id: "pre-sostenibilidad", texto: "Nacional: modelo de sostenibilidad viable (cooperativas, alcaldías municipales, MEFCCA o autofinanciamiento) y plan de implementación por fases a 12 meses con indicadores medibles. Latam: B2B/B2G autosostenible y economía circular.", ref: "rubric-matrices" },
      { id: "pre-coherencia", texto: "Las cifras del presupuesto deben coincidir exactamente con las del video (últimos 25 s) y el Canvas: el jurado cruza los documentos. Incoherencia entre piezas resta de inmediato.", ref: "rubricas-y-puntajes" },
      { id: "pre-sin-fuente", texto: "Dato sin fuente verificable resta de inmediato: toda cifra necesita URL de respaldo; si no existe, se pide o se marca [SIMULADO].", ref: "rubricas-y-puntajes" },
      { id: "pre-componentes", texto: "Viabilidad técnica del gasto: componentes obtenibles localmente o vía mayorista (Alibaba/AliExpress), sin suposiciones mágicas; el costo total ≤ $6,000 USD hace viable el lote piloto en ambos certámenes.", ref: "rubric-matrices" }
    ],
    promptTarea: {
      lleva: "Con las reglas del presupuesto del certamen activo y las filas actuales, actúa como auditor financiero del jurado: evalúa y CORRIGE el presupuesto. Entrega: (1) tabla corregida (element, category, units, unit_cost con moneda del certamen, url), (2) problemas detectados con evidencia, (3) texto de prefactibilidad coherente con los números finales.",
      directo: "Evalúa las filas reales del usuario contra las reglas (rango, moneda, unidades, fuentes, coherencia con video)."
    },
    salidaEsperada: {
      lleva: "Tabla corregida completa + problemas + texto de prefactibilidad alineado.",
      directo: "JSON: {\"veredictos\":[…],\"problemas\":[…],\"ajustes\":[{\"fila\":{\"element\":\"…\",\"category\":\"…\",\"units\":1,\"unit_cost\":0,\"url\":\"…\",\"operacion\":\"abre|cambia|cierra\"}}],\"totalUsd\":0,\"totalLocal\":0}"
    }
  };

  /* ── 3 · Analizador de Pautado ── */
  var pautado = {
    titulo: "Analizador de Pautado",
    reglas: [
      { id: "pau-secciones", texto: "Cinco secciones: problema, solucion, impacto, innovacion, prefactibilidad.", ref: "pautado-y-guion" },
      { id: "pau-minimo", texto: "Mínimo 150 caracteres por sección.", ref: "pautado-y-guion" },
      { id: "pau-topes-latam", texto: "Tope por sección en Latam: problema 1250, solución 1250, impacto 1000, innovación 1000, prefactibilidad 1500 caracteres con espacios.", ref: "pautado-y-guion" },
      { id: "pau-topes-nacional", texto: "En Nacional no hay tope de caracteres por sección (límite no declarado en el corpus). El entregable nacional es un documento técnico de hasta 10 páginas.", ref: "pautado-y-guion" },
      { id: "pau-nombre", texto: "No repitas el nombre del proyecto más de una vez por sección.", ref: "pautado-y-guion" },
      { id: "pau-datos-nuevos", texto: "No repitas el mismo dato en dos secciones: cada sección aporta información nueva.", ref: "pautado-y-guion" },
      { id: "pau-claims", texto: "Cada estadística debe existir en research/claims.json con fuente, URL, año y fecha de acceso. Si no está, se pide o se marca [SIMULADO].", ref: "pautado-y-guion" },
      { id: "pau-nacional-contenido", texto: "Sección impacto nacional: alineación con PNDH 2022–2026 y programas nacionales (Ciudades Creativas, Soberanía Alimentaria, Ley 763) + anclaje a municipio real + cuantificación de beneficiarios.", ref: "modos-rally" },
      { id: "pau-lat-contenido", texto: "Secciones latam: proyectar la modularidad hacia toda América Latina, costos unitarios en USD, sin siglas locales incomprensibles para el jurado internacional.", ref: "modos-rally" },
      { id: "pau-coherencia", texto: "El pautado debe ser coherente con el presupuesto y el Canvas: mismas cifras, mismo modelo. La incoherencia entre piezas resta de inmediato.", ref: "rubricas-y-puntajes" }
    ],
    promptTarea: {
      lleva: "Con las reglas del pautado del certamen activo y las 5 secciones actuales, actúa como auditor del reporte SIRLI: evalúa y CORRIGE cada sección. Entrega: (1) las 5 secciones reescritas respetando mínimos y topes, (2) problemas por sección con evidencia, (3) avisos de datos que deben sostenerse con claims.",
      directo: "Evalúa las 5 secciones reales del usuario contra las reglas (límites, repeticiones, claims, coherencia)."
    },
    salidaEsperada: {
      lleva: "5 secciones reescritas + problemas por sección + avisos de claims faltantes.",
      directo: "JSON: {\"veredictos\":[{\"criterio\":\"sección…\",\"estado\":\"cumple|parcial|falla\",\"nota\":\"…\"}],\"problemas\":[…],\"ajustes\":[{\"tab\":\"pautado\",\"slot\":\"problema|solucion|impacto|innovacion|prefactibilidad\",\"texto\":\"texto listo para pegar\"}]}"
    }
  };

  /* ── 4 · Analizador de Canvas ── */
  var canvas = {
    titulo: "Analizador de Canvas",
    bloques: ["socios", "actividades", "propuesta", "relaciones", "segmentos", "recursos", "canales", "costes", "ingresos"], /* espejo del motor: app.js handleCanvasCellInput */
    reglas: [
      { id: "can-bloques", texto: "Los 9 bloques del canvas deben estar llenos (el contador del motor pide '9 de 9 cuadrantes personalizados').", ref: "motor-app" },
      { id: "can-nacional-15", texto: "En Nacional el Canvas pesa 15 pts con el bloque de Prefactibilidad: presupuesto de inversión aterrizado a la economía nacional (C$ y USD), modelo de sostenibilidad viable, costo-beneficio y plan a 12 meses con indicadores.", ref: "rubric-matrices" },
      { id: "can-propuesta", texto: "El bloque propuesta debe expresar la tesis de la solución (el motor sugiere arrancar de state.solution_thesis), con valor social por encima del valor de mercado (crit. latam impacto).", ref: "rubric-matrices" },
      { id: "can-segmento", texto: "Nacional: el segmento y los socios se anclan a municipios/programas reales (MEFCCA, alcaldías, cooperativas). Latam: socios y segmentos con lógica regional B2B/B2G.", ref: "modos-rally" },
      { id: "can-cifras", texto: "Toda métrica del canvas (costes, ingresos) debe coincidir con exactitud matemática con el presupuesto: 'Alerta de Discrepancia Numérica' oficial de SIRLI.", ref: "rubric-matrices" },
      { id: "can-economia", texto: "Costes/ingresos deben demostrar la economía circular del proyecto (revalorización de residuos o pasivos) cuando la solución la afirma.", ref: "rubric-matrices" },
      { id: "can-coherencia-ids", texto: "El caso nacional solo como laboratorio piloto en latam: los bloques no deben encerrar la propuesta a 'Nicaragua' como único mercado.", ref: "modos-rally" }
    ],
    promptTarea: {
      lleva: "Con los 9 bloques actuales y el presupuesto resumido, actúa como auditor del bloque Prefactibilidad/Canvas del jurado: evalúa y CORRIGE el modelo. Entrega: (1) los 9 bloques reescritos, (2) incoherencias de cifras con el presupuesto, (3) huecos de modelo (socios, ingresos) con propuesta concreta.",
      directo: "Evalúa los 9 bloques reales del usuario contra las reglas (llenado completo, cifras == presupuesto, modelo viable)."
    },
    salidaEsperada: {
      lleva: "9 bloques reescritos + incoherencias + propuestas de cierre de modelo.",
      directo: "JSON: {\"veredictos\":[…],\"problemas\":[…],\"ajustes\":[{\"bloque\":\"costes\",\"texto\":\"contenido listo para pegar en el cuadrante\"}],\"visuales\":[…]}"
    }
  };

  /* ── 5 · Analizador de Documentos ── */
  var docs = {
    titulo: "Analizador de Documentos",
    reglas: [
      { id: "doc-alcance", texto: "El documento del usuario (PDF/DOCX) se contrasta contra la rúbrica del certamen activo; toda cita o dato del análisis debe venir del documento o del corpus, nunca inventado.", ref: "rubricas-y-puntajes" },
      { id: "doc-paginas-nac", texto: "Nacional: documento técnico de hasta 10 páginas con normas APA y fuentes oficiales (BCN, INIDE, ministerios).", ref: "rubric-matrices" },
      { id: "doc-lat-entregable", texto: "Latam: reporte pautado con límites estrictos de caracteres por sección (1250/1250/1000/1000/1500).", ref: "rubric-matrices" },
      { id: "doc-revision", texto: "Método de revisión oficial: (1) identifica el criterio que alimenta la pieza; (2) contrasta con los ítems de la matriz, nombrando el ítem incumplido; (3) propón la corrección concreta (texto, cifra, fuente); (4) si falta un dato, no lo inventes: pídelo o márcalo [SIMULADO].", ref: "rubricas-y-puntajes" },
      { id: "doc-errores", texto: "Errores que restan de inmediato: datos sin fuente, incoherencia entre piezas, fantasía térmica/energética, diseño estilo IA.", ref: "rubricas-y-puntajes" }
    ],
    promptTarea: {
      lleva: "Actúa como auditor del certamen activo: analiza el DOCUMENTO del usuario contra la rúbrica activa. Entrega: (1) resumen de qué criterios cubre el documento, (2) problemas por severidad con evidencia textual, (3) correcciones concretas por sección, (4) datos que faltan y deben pedirse o marcarse [SIMULADO].",
      directo: "Ídem, usando el texto extraído del documento."
    },
    salidaEsperada: {
      lleva: "Cobertura de criterios + problemas con severidad + correcciones + lista de datos faltantes.",
      directo: "JSON: {\"veredictos\":[…],\"problemas\":[…],\"ajustes\":[…],\"datosFaltantes\":[\"…\"]}"
    }
  };

  /* ── 6 · Guía de Editor de Video ── */
  var videoEditor = {
    titulo: "Guía de Editor de Video",
    reglas: [
      { id: "vid-duracion", texto: "El montaje debe quedar en ≤ 120 s exactos (límite estricto del certamen: 2 minutos máximo).", ref: "pautado-y-guion" },
      { id: "vid-ventanas", texto: "Respetar las ventanas de los 4 actos al cortar: I 0:00–0:20, II 0:20–1:00, III 1:00–1:35, IV 1:35–2:00.", ref: "pautado-y-guion" },
      { id: "vid-acto1-sin-marca", texto: "Los primeros 20 s NO llevan nombre del proyecto ni logo (no usar intro corporativa).", ref: "pautado-y-guion" },
      { id: "vid-assets", texto: "Cada plano del shotlist lleva asset_id; los assets se nombran asset_<shotlist_id>_<descripcion>.<ext>.", ref: "pautado-y-guion" },
      { id: "vid-cifras-pantalla", texto: "Las cifras que aparecen en pantalla (costos, métricas) deben coincidir exactamente con el presupuesto y el pautado; el jurado cruza los últimos 25 segundos con el Excel.", ref: "pautado-y-guion" },
      { id: "vid-tiktok", texto: "Latam además exige el video lúdico-creativo de interacción internacional en TikTok (entregable habilitador validado en SIRLI).", ref: "rubric-matrices" },
      { id: "vid-canal", texto: "Modelo de canal estándar ganador: canal marca-equipo con título canónico '[RETO] - NOMBRE EQUIPO - PROYECTO - SEDE', descripción con desglose y los hashtags oficiales (#RallyLatam, #RallyLatam<year>, #NicaraguaInnova, #Innovacion).", ref: "winners-analysis" },
      { id: "vid-paleta-visual", texto: "ODS del Acto IV animados con la paleta del proyecto; los ODS deben corresponder a los que el proyecto afirma impactar.", ref: "pautado-y-guion" }
    ],
    promptTarea: {
      lleva: "Con la shotlist y convenciones del certamen, actúa como asistente de edición: evalúa el plan de cortes y propón el esquema de montaje final. Entrega: (1) shotlist revisada por acto con duraciones que sumen ≤120 s, (2) assets faltantes con el nombre correcto, (3) pendientes del entregable (canal, TikTok en latam, cifras en pantalla).",
      directo: "Evalúa la shotlist real del usuario contra las reglas (nombres de asset, ventanas, duración total)."
    },
    salidaEsperada: {
      lleva: "Shotlist por actos saneada + assets faltantes + pendientes de entrega.",
      directo: "JSON: {\"veredictos\":[…],\"problemas\":[…],\"ajustes\":[{\"tab\":\"webdemo\",\"slot\":\"main\",\"texto\":\"instrucción o corrección\"}],\"verFranja\":{\"acto1_s\":20,\"acto2_s\":40,\"acto3_s\":35,\"acto4_s\":25}}"
    }
  };

  g.RSA_RUBRICS = { meta: meta, porTipo: porTipo, guion: guion, presupuesto: presupuesto, pautado: pautado, canvas: canvas, docs: docs, videoEditor: videoEditor };
})(typeof window !== "undefined" ? window : globalThis);
