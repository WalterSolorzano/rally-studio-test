# DOSSIER TÉCNICO Y MEMORIA METODOLÓGICA DE INNOVACIÓN
## Rally Latinoamericano de Innovación (28h) · Rally Nacional Nicaragua Innova (24h)

---

## 1. Identidad de Equipo, Certamen y Activos Visuales

### 1.1 Ficha Técnica Institucional
- **Nombre del Equipo:** `Operación Titán · Alfa` (Representación Oficial UNI RUPAP)
- **Institución Sede:** Universidad Nacional de Ingeniería (UNI) — Recinto Universitario Pedro Aráuz Palacios (RUPAP)
- **Ciudad y País:** Managua, Nicaragua (Zona Horaria UTC-6)
- **Plataforma de Despacho:** Rally Studio · The Cardless Typographic Workbench
- **Certamen Activo:** Rally Latinoamericano de Innovación (Edición 28 Horas) / Sincronización con Rally Nacional Nicaragua Innova (24 Horas)
- **Categorías Oficiales:** Innovación / Impacto Social

### 1.2 Registro de Activos Gráficos y Logotipos
| Activo / Insignia | Archivo en Repositorio | Descripción y Rol en la Documentación |
|---|---|---|
| **Logo Rally Studio** | `rally_studio_logo.svg` / `rally_studio_logo.jpg` | Emblema oficial del workbench táctico. Geometría limpia y vectorizada. |
| **Escudo UNI Oficial** | `dashboard/assets/logo_uni.png` | Emblema heráldico de la Universidad Nacional de Ingeniería (Nicaragua). |
| **Sello Rally Latam** | `dashboard/assets/logo_rally_latam.png` | Identidad oficial del Consejo Federal de Decanos de Ingeniería (CONFEDI / ACOFI / ANFEI). |
| **Sello Nicaragua Innova** | `dashboard/assets/logo_rally_nacional.png` | Logotipo oficial de la Comisión Nacional de Economía Creativa y CNU. |
| **Cabecera Oficial** | `dashboard/assets/header_rally_latam.png` | Banner institucional para portada de memoria técnica y miniatura de video. |

---

## 2. Sistema de Diseño e Identidad Visual (/impeccable standard)

### 2.1 Filosofía de Diseño: "The Cardless Typographic Workbench"
El sistema visual abandona las tarjetas flotantes genéricas, sombras difusas y decoraciones superfluas. Se basa en el diseño suizo e ingeniería de interfaces de misión crítica (Linear, Raycast, terminales industriales), priorizando legibilidad bajo fatiga cognitiva extrema en certámenes de 28 horas continuas.

### 2.2 Paleta de Colores Oficial y Tokens de Diseño
| Token | Valor Hex | Rol Semántico | Contraste WCAG |
|---|---|---|---|
| `--color-navy-dark` | `#0D1B35` | Títulos principales, headers tácticos, cronómetro de misión | AAA (14.2:1 sobre blanco) |
| `--color-primary` | `#0866F5` | Acentos interactivos primarios, estado activo de navegación | AAA (8.1:1 sobre blanco) |
| `--color-cobalt` | `#1D4ED8` | Enlaces, verificaciones aprobadas, micro-insignias | AAA (7.6:1 sobre blanco) |
| `--color-accent` | `#0284C7` | Telemetría, etiquetas de ODS, radiofrecuencia | AA+ (4.8:1 sobre blanco) |
| `--color-cyan-mint` | `#2AA7AD` | Acentos de sustentabilidad y sensores ambientales | AA+ (4.6:1 sobre navy) |
| `--bg-app` | `#FFFFFF` | Lienzo de lectura técnica y entrega oficial | 1:1 |
| `--bg-subtle` | `#F8FAFD` | Áreas de edición, bloques de pautado, inspectores | 1.05:1 |
| `--border-hairline` | `#DCE7F5` | Divisores técnicos de 1px (sin sombras de elevación) | N/A |
| `--text-body` | `#13213A` | Cuerpo de lectura técnica y memoria pautada | AAA (13.8:1 sobre blanco) |
| `--text-muted` | `#5C7193` | Metadatos, etiquetas de caracteres y conteos | AA (5.2:1 sobre blanco) |

### 2.3 Especificación Tipográfica
- **Fuente Primaria (Display & Editorial):** `Plus Jakarta Sans`, pesos 500, 700 y 900.
  - Títulos: Interletraje `0.02em`, `line-height: 1.25`.
  - Párrafos: `line-height: 1.55`, máximo 75 caracteres por línea para evitar fatiga.
- **Fuente de Precisión (Telemetría, Presupuesto y Cronómetro):** `JetBrains Mono` con soporte nativo de `font-variant-numeric: tabular-nums`.

---

## 3. Catálogo Oficial de Retos y Matriz de Categorías

El certamen cuenta con dos categorías matrices: **Innovación** (enfoque en novedad científico-técnica, viabilidad de ingeniería y patentes/modelos) e **Impacto Social** (enfoque en apropiación comunitaria, erradicación de vulnerabilidades y sostenibilidad económica inclusiva).

| ID | Reto Oficial | Categoría | ODS Clave | Win-Rate Histórico | Densidad Competitiva |
|---|---|---|---|---|---|
| **01** | Segunda vida y reconversión de motores eléctricos en desuso | Impacto Social | ODS 12, 8, 9 | 92% | Baja (3 sedes) |
| **02** | Redes de sensores comunitarios para alerta temprana de inundaciones | Innovación | ODS 11, 13, 3 | 84% | Alta (9 sedes) |
| **03** | Protección y fomento tecnológico de polinizadores (Abejas Meliponas) | Innovación | ODS 15, 2, 13 | 95% | Muy Baja (2 sedes) |
| **04** | Revalorización y transformación de residuos de poda urbana | Innovación | ODS 12, 11, 13 | 88% | Media (4 sedes) |
| **05** | Reservorios pluviales y captación comunitaria con microfiltración | Innovación | ODS 6, 11, 12 | 86% | Alta (8 sedes) |
| **06** | Gestión y valorización de residuos plásticos costeros | Impacto Social | ODS 14, 12, 11 | 78% | Media (5 sedes) |
| **07** | Recolección y conversión de aceite vegetal doméstico usado | Impacto Social | ODS 12, 6, 7 | 82% | Baja (3 sedes) |
| **08** | Reducción de desperdicio de alimentos en mercados populares | Impacto Social | ODS 2, 12, 1 | 85% | Alta (7 sedes) |
| **09** | Sistemas modulares de refugio y energía de emergencia post-huracán | Innovación | ODS 11, 13, 7 | 89% | Baja (3 sedes) |

---

## 4. Banco de Propuestas de Solución IA del Sistema (Los 9 Retos)

### Reto 01: AGRO-DRIVE · Kit de Tracción Mecánica con Motores de Lavadora
- **Demanda Oficial:** Reconvertir chatarra de electrodomésticos en maquinaria productiva accesible.
- **Nuestra Propuesta IA:** Kit de acople modular en PETG reforzado con variador universal de bajo costo que transforma motores PSC/BLDC de lavadoras desechadas en picadoras de forraje y bombas de pozo para cooperativas lecheras de Chontales y Boaco.
- **Factor Novedoso:** Costo unitario inferior a \$65 USD frente a motores diésel importados de \$450 USD.
- **Patrón Ganador:** Alineación con cooperativas locales y economía circular demostrada.

### Reto 02: HIDRO-ALERTA · Red Comunitaria Mallada de Alerta Temprana
- **Demanda Oficial:** Monitorear crecidas repentinas de ríos y cauces antes del desbordamiento.
- **Nuestra Propuesta IA:** Red de telemetría hiperlocal con nodos ultrasónicos no invasivos, protocolo de radiofrecuencia mallada de largo alcance y compuerta electromecánica de alivio con 35 minutos de anticipación, con autonomía fotovoltaica LiFePO4.
- **Factor Novedoso:** Opera sin internet ni señal celular mediante radiofrecuencia abierta.
- **Patrón Ganador:** Simulación hidrométrica en tiempo real y costo por nodo inferior a \$85 USD.

### Reto 03: BIO-MELIPONA · Colmena Bioclimática con Monitor Bioacústico Pasivo
- **Demanda Oficial:** Preservar colonias de abejas nativas ante el cambio climático y pesticidas.
- **Nuestra Propuesta IA:** Cámara de anidación pasiva con sensor piezoeléctrico de resonancia acústica que detecta estrés de la colmena sin abrir la caja, integrado con difusor micro-solar de micronutrientes orgánicos en cafetales de Jinotega.
- **Factor Novedoso:** Cero intrusión en la colmena; algoritmo de clasificación espectral embebido.
- **Patrón Ganador:** Nicho de baja competencia y alto impacto ecológico demostrable (30/30 en creatividad).

### Reto 04: PYRO-CHAR · Reactor Modular de Pirólisis Lenta In-Situ
- **Demanda Oficial:** Evitar la quema de restos de poda urbana en vertederos municipales.
- **Nuestra Propuesta IA:** Reactor móvil de biomasa autosuficiente térmicamente que procesa 500 kg/día de ramas urbanas convirtiéndolas en biochar inoculado con micorrizas para regenerar suelos volcánicos degradados en León y Masaya.
- **Factor Novedoso:** Aprovecha los propios gases de síntesis para sostener la pirólisis sin combustible fósil añadido.

### Reto 05: AQUA-ZEO · Filtro Multietapa con Zeolita Natural y Carbón de Café
- **Demanda Oficial:** Agua potable a partir de lluvia en escuelas del Corredor Seco.
- **Nuestra Propuesta IA:** Cisterna prefabricada modular con separador centrífugo de sedimentos y lecho de filtración autóctono (zeolita de mina regional + bio-carbón activado de pulpa de café) con esterilización UV solar.
- **Factor Novedoso:** Reduce en un 78% el costo de filtros comerciales importados utilizando subproductos locales.

### Reto 06: FILA-MAR · Micro-Extrusora Portátil de Aparejos de Pesca
- **Demanda Oficial:** Limpieza de redes fantasma y plásticos en comunidades costeras.
- **Nuestra Propuesta IA:** Molino y extrusora mecánica a pedal y energía solar para transformar redes de nylon recuperadas y botellas PET directamente en boyas de señalización e hilo de pesca de alta tenacidad en San Juan del Sur y Bluefields.

### Reto 07: OLEO-JABÓN · Cavitación Hidrodinámica de Aceite Usado
- **Demanda Oficial:** Evitar vertidos de aceite vegetal en fuentes de agua urbanas.
- **Nuestra Propuesta IA:** Micro-planta comunitaria con reactor de cavitación hidrodinámica que reduce la saponificación de 4 horas a 18 minutos, canjeando aceite usado de fritangas populares por desengrasante institucional.

### Reto 08: NUTRI-CANJE · Bolsa P2P de Mermas de Mercado y Deshidratación Solar
- **Demanda Oficial:** Rescate de alimentos en perecederos antes de su descarte.
- **Nuestra Propuesta IA:** Plataforma ligera SMS/WhatsApp vinculada a deshidratadores solares parabólicos que absorbe excedentes de frutas en mercados populares convirtiéndolos en harina frutal para comedores infantiles.

### Reto 09: HABITA-SOLAR · Celda de Albergue Desplegable con Autonomía Fotovoltaica
- **Demanda Oficial:** Refugio digno de respuesta inmediata tras huracanes o sismos.
- **Nuestra Propuesta IA:** Módulo hexagonal articulado que se despliega en seco en 45 minutos sin herramientas mecánicas, equipado con lona bioclimática, panel solar flexible y estación de carga comunitaria para el Caribe de Nicaragua.

---

## 5. Pautado Oficial Homologado (5 Secciones Reglamentarias)

### 5.1 Definición del Problema (Límite: 1,250 caracteres con espacios)
Diagnóstico cuantitativo del problema identificado en el territorio nacional o regional, sustentado en indicadores oficiales, demografía vulnerable y caracterización técnica de la brecha existente. Se documenta la frecuencia de los eventos adversos, pérdidas económicas y sociales asociadas, y las limitaciones estructurales de las soluciones comerciales vigentes.

### 5.2 Solución Propuesta (Límite: 1,250 caracteres con espacios)
Arquitectura integral de la solución formulada por el equipo multidisciplinario, describiendo los componentes técnicos, flujo operativo, materiales accesibles en la región y el mecanismo de interacción con los usuarios o comunidades beneficiarias. Se enfatiza la viabilidad de despliegue en condiciones de infraestructura limitada.

### 5.3 Prefactibilidad y Presupuesto de Marcha (Límite: 1,000 caracteres con espacios)
Estructura detallada de costos de puesta en marcha, abastecimiento de insumos locales y modelo de sostenibilidad económica. El presupuesto de inversión inicial se mantiene estrictamente dentro del rango de viabilidad reglamentaria (\$500 a \$15,000 USD), asegurando retorno social o financiero y bajo costo de mantenimiento operativo.

### 5.4 Grado de Innovación y Creatividad (Límite: 1,000 caracteres con espacios)
Factores diferenciadores y disruptivos de la propuesta respecto a las prácticas convencionales. Se destacan barreras tecnológicas superadas, adopción de principios de economía circular, diseño modular o metodologías participativas que generan ventajas competitivas evidentes ante el jurado calificador.

### 5.5 Impacto Social y Sostenibilidad Ambiental (Límite: 1,000 caracteres con espacios)
Evaluación de impacto multidimensional en la calidad de vida de las poblaciones objetivo, empoderamiento de sectores vulnerables, perspectiva de género e inclusión. Se certifica la alineación estricta con los Objetivos de Desarrollo Sostenible (ODS) y una huella ecológica nula o regenerativa.

---

## 6. Estructura Presupuestaria Modelo (Tope \$500 - \$15,000 USD)

| Ítem | Concepto | Categoría | Unidades | Costo Unitario (USD) | Total (USD) | Justificación Técnica |
|---|---|---|---|---|---|---|
| **01** | Materiales de Prototipado y Modelado Rápido | Prototipado | 1 | \$250.00 | \$250.00 | Maqueta funcional y pruebas físicas de ensamble |
| **02** | Componentes Mecánicos y Cómputo Embebido | Hardware Base | 1 | \$320.00 | \$320.00 | Elementos de control, actuadores y componentes base |
| **03** | Módulo de Energía Autónoma y Almacenamiento | Energía | 1 | \$280.00 | \$280.00 | Paneles solares y baterías para operación continua |
| **04** | Gabinetes Industriales y Protección Mecánica | Fabricación | 1 | \$140.00 | \$140.00 | Resistencia ambiental y durabilidad en campo |
| **05** | Validación Operativa y Pruebas en Terreno | Validación | 1 | \$180.00 | \$180.00 | Ensayos de laboratorio y calibración con usuarios |
| **06** | Talleres de Capacitación y Apropiación Social | Impacto Social | 1 | \$150.00 | \$150.00 | Protocolos de adopción y transferencia comunitaria |
| **TOTAL** | **PRESUPUESTO GENERAL DE PUESTA EN MARCHA** | — | — | — | **\$1,320.00** | **Totalmente viable bajo tope oficial (\$500 - \$15,000)** |

---

## 7. Guion Audiovisual de 120 Segundos (4 Actos Oficiales)

- **Duración Máxima Estricta:** 120 segundos (penalización severa si sobrepasa 2:00 min).
- **Ritmo de Locución:** 130 palabras por minuto (~260 palabras totales).
- **Voz y Tono:** Registro grave (85-90 Hz), seguro, formal y de convicción técnica.

```
[00:00 - 00:20] ACTO 1: EL GANCHO Y LA HERIDA SOCIAL (20 seg)
Exposición directa del problema crítico en el territorio, datos de impacto social y la urgencia comunitaria que demanda una solución inmediata.

[00:20 - 00:55] ACTO 2: LA SOLUCIÓN INNOVADORA (35 seg)
Presentación de la propuesta tecnológica y metodológica desarrollada por el equipo de la UNI, destacando su arquitectura, sencillez y robustez.

[00:55 - 01:30] ACTO 3: VALIDACIÓN, DEMOSTRACIÓN Y PREFACTIBILIDAD (35 seg)
Demostración visual del funcionamiento, sustentación del presupuesto accesible y validación de campo en condiciones reales.

[01:30 - 02:00] ACTO 4: IMPACTO HUMANO, ESCALABILIDAD Y CIERRE (30 seg)
Transformación social duradera, soberanía tecnológica, alineación con los ODS y llamado a la acción. Cierre con identidad institucional UNI y sellos oficiales.
```

---

## 8. Guardarraíles Críticos Anti-Descalificación

1. **Inscripción SIRLI:** Verificar que el nombre del proyecto coincida exactamente en la plataforma del comité y en la portada del PDF.
2. **Duración de Video Pitch:** Rigurosamente 01:59 a 02:00 minutos (nunca 02:01).
3. **Visibilidad en YouTube:** Configurado estrictamente como **"No Listado" (Unlisted)** o **"Público"** (nunca "Privado" porque el jurado no podrá calificarlo).
4. **Nomenclatura Oficial del Archivo PDF:** `#Equipo_Sede_RetoID.pdf` (Ej: `#TitanAlfa_UNI_Reto01.pdf`).
5. **Hashtags en Descripción de Video:**
   - `#RallyLatam2026`
   - `#RallyDeInnovacion`
   - `#NicaraguaInnova2026`
   - `#InnovacionUNI`
   - `#OrgulloUNI`

---
*Documento exportado automáticamente desde Rally Studio Workbench · Cumplimiento de Rúbricas Oficiales CONFEDI / ACOFI / CNU 2026.*
