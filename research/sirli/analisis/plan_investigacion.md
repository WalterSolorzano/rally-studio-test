# Plan de investigación profunda — SIRLI 2017–2026

Documento de trabajo. Define qué se va a analizar, con qué datos, con qué controles de
calidad y con qué gráficas, hasta llegar a un modelo que estime la probabilidad de que un
video gane. Todo se apoya en los datos brutos que ya están en `research/sirli/`.

Última actualización: 22/10/2026.

---

## 1. Pregunta y objetivo

**Pregunta principal.** Con lo que se puede observar *antes* de que el jurado vote
(equipo, país, sede, año, categoría, desafío, duración del video, título, descripción,
miniatura, transcripción), ¿qué factores se asocian con ganar, y con cuánta precisión se
puede anticipar el puesto?

**Objetivo de pronóstico.** Estimar `P(primer lugar | características observables)` y una
**puntuación de calidad 0–100** por video, con error medido en un año que el modelo nunca vio.

**Por qué importa para el equipo.** Si el modelo identifica qué pesa (duración, claridad de
la solución en la descripción, estructura del guion, densidad de cifras), el guion y el
video del certamen actual se pueden diseñar contra esa evidencia en lugar de contra la
intuición.

**Advertencia de causalidad.** Todo lo que sigue mide asociación. Ganar no se puede
"causar" desde un Excel; se puede estimar la probabilidad y ordenar los factores.

---

## 2. Inventario de datos brutos disponibles

| Bloque | Archivo | Granularidad | Cobertura real |
|---|---|---|---|
| Premios | `research/sirli/winners.jsonl` | 1 fila por premio | 5.136 filas · 4.368 equipos · 4.709 videos |
| Metadatos de video | `research/sirli/meta/videos.jsonl` | 1 fila por video | 4.688 de 4.709 (99,6 %) |
| Miniaturas | `research/sirli/meta/thumbs/` | 1 jpg por video | 4.196 |
| Transcripciones | `research/sirli/transcripts/` | 1 json por video | 58 internacionales (38 nuevas por voz local) + 26 del alcance Nicaragua |
| Cola priorizada | `research/sirli/video_queue.jsonl` | 1 fila por video | 94 |
| HTML fuente | `research/sirli/raw/*.gz` | 30 páginas colección×año | 100 % auditable |
| Excel de consulta | `research/sirli/excel/ganadores_sirli.xlsx` | 5 hojas | 5.136 filas × 23 columnas |

**Distribución del resultado (la variable a explicar):**

| Colección | 1.º | 2.º | 3.º | Total |
|---|---|---|---|---|
| Sede | 2.242 | 1.468 | 1.005 | 4.715 |
| Nacional | 164 | 102 | 97 | 363 |
| Internacional | 19 | 20 | 19 | 58 |
| **Total** | **2.425** | **1.590** | **1.121** | **5.136** |

La clase "primer lugar" no es rara (47 %). Por eso el objetivo útil no es "gana sí/no" sino
**ganar dentro del propio desafío y la propia sede**, que es la comparación real del jurado.

**Señales ya visibles en los datos brutos:**

- 529 equipos tienen más de un premio; `NEXUS` acumula 17. La reincidencia es información,
  no ruido.
- 90 desafíos para 5.136 premios: el tema no discrimina. Residuos (713) y agua (429) están
  saturados; ahí compite mucha gente con el mismo encuadre.
- Duración: mediana 118 s global; 119 s en primeros lugares, 116 s en segundos y terceros.
- Primeros lugares por país: Argentina 597, Nicaragua 586, México 501, Colombia 257.
- Solo 297 videos (6 %) traen etiquetas (`tags`) y 3.852 canales distintos: el canal no
  sirve como variable, salvo cuando es una universidad identificable.

---

## 3. Qué otra información conviene añadir

Ordenada por relación costo/beneficio. Las tres primeras no tocan la red.

| # | Qué | Cómo se obtiene | Costo | Qué habilita |
|---|---|---|---|---|
| 1 | **Análisis visual de las 4.196 miniaturas** | Ya están en disco. Detección de rostro, texto en pantalla, logo, paleta dominante, brillo/contraste, si es foto o render | Horas de CPU, cero red | La única variable visual a escala. Permite testear "cara en la miniatura" vs puesto |
| 2 | **Fotogramas de los videos priorizados** | `sirli_videos.py frames` (6 fotogramas por video) | Descarga + ffmpeg | Estructura visual del video: diapositiva, demo, persona, gráfico |
| 3 | **Transcripción de los 1.204 videos de sede Nicaragua** | `sirli_asr.py --scope queue` (voz local, 26 s por video) | ~9 h de CPU, sin riesgo de bloqueo | Pasa la muestra de texto de 58 a >1.000 y vuelve viable el modelo con texto |
| 4 | **Audio: música vs voz, silencios, locución** | Del audio ya descargado, con ffmpeg (`silencedetect`, `volumedetect`) | Minutos | "¿Narra una persona?" es una hipótesis fuerte y baratísima de medir |
| 5 | **Nombre del equipo como texto** | Tokenizar los 4.368 nombres | Minutos | Los nombres con marca propia vs nombres genéricos |
| 6 | **Texto del desafío** | Ya está en `winners.jsonl` | Minutos | Encuadre oficial del reto vs cómo lo resolvieron |
| 7 | **Universidad / institución** | Derivar del canal o del nombre del equipo | Horas | Solo si se normaliza a mano; 3.852 canales es demasiado disperso |
| 8 | **Bases del evento, jurado, rúbrica por año** | `knowledge/rubric_*.md`, sitio SIRLI | Bajo | Permite ponderar el puntaje de calidad con los criterios reales |
| 9 | **Comentarios y "me gusta" de YouTube** | Ya hay `like_count`; comentarios requieren otra vía | Medio | Validación externa del atractivo; muestra pequeña |
| 10 | **Resultados de ediciones no publicadas** | No existen en el sitio | — | Descartado: no hay fuente |

**Lo que no vale la pena:** listas de idiomas de subtítulos (son traducciones posibles, no
pistas reales), reintentar los 21 videos bloqueados (son 21 de 4.709), y bajar video completo
en alta calidad para análisis visual (los fotogramas bastan).

---

## 4. Variables derivadas (features)

Cada fila del dataset de modelado es un **video** (no un premio), con su mejor puesto como
etiqueta, para no duplicar el mismo video en varios desafíos.

### 4.1 Bloque evento (disponible en el 100 %)

- `year`, `collection`, `country`, `sede`, `category`, `challenge_number`
- `challenge_theme` (17 temas por regla, ya implementada en `sirli_excel.py`)
- `challenge_frequency`: cuántos equipos compitieron en ese desafío ese año (presión competitiva)
- `sede_size`: cuántos premios repartió esa sede ese año
- `team_prior_awards`: premios previos del mismo nombre de equipo
- `country_prior_rate`: tasa histórica de primeros lugares del país **calculada solo con años anteriores** (sin fuga)

### 4.2 Bloque video (99,6 %)

- `duration_s`, `duration_ratio` (duración / 120 s), `over_limit` (> 120 s)
- `title_len`, `title_words`, `title_has_project_name`
- `desc_len`, `desc_lines`, `desc_has_url`, `desc_has_contact`, `desc_has_credits`
- `desc_specificity`: proporción de frases con verbo de solución (consiste, permite, desarrollamos)
- `publish_month_gap`: meses entre el evento y la publicación
- `view_count`, `like_count` (solo como diagnóstico: se miden después del premio)

### 4.3 Bloque texto (solo con transcripción, ~1.250 videos si se corre el punto 3)

- `words`, `wpm`, `first_15s_words` (peso del gancho)
- `mentions_problem`, `mentions_solution`, `mentions_impact`, `mentions_team`, `mentions_closure`
- `numbers_per_minute`: densidad de cifras (indicador de sustento)
- `has_testimony`, `has_demo_claim`, `asks_question`
- `theme_match`: si el tema del video coincide con el tema del desafío

### 4.4 Bloque visual (miniaturas y fotogramas)

- `thumb_faces`, `thumb_text_coverage`, `thumb_saturation`, `thumb_brightness`, `thumb_has_logo`
- `frames_variety`: cuántas escenas distintas en 6 fotogramas
- `frames_has_slides`, `frames_has_person`, `frames_has_product`

---

## 5. Hipótesis y prueba estadística

| # | Hipótesis | Prueba | Decisión si se cumple |
|---|---|---|---|
| H1 | Usar el tiempo completo (≥110 s) aumenta la probabilidad de primer lugar | Regresión logística con `duration_ratio`, controlando año y desafío; IC 95 % por bootstrap agrupado | El guion se diseña a 115–120 s, no a 90 |
| H2 | La descripción que explica la solución se asocia a mejor puesto | Chi-cuadrado + diferencia de proporciones con IC | Se escribe descripción de 3–5 frases con verbo de solución |
| H3 | Los desafíos saturados tienen menor tasa de primeros lugares | Regresión con `challenge_frequency` y efectos fijos de año | Se elige un reto con menos competencia si hay libertad |
| H4 | La reincidencia del equipo predice | Comparar tasa de 1.º en `team_prior_awards` = 0 / 1 / 2+ | Refuerza la importancia de la trayectoria, no del video |
| H5 | El video con voz humana y testimonio rinde más | Proporciones con IC de Wilson sobre el subconjunto transcrito | Se incorpora testimonio (hoy 0 % lo usa) |
| H6 | La miniatura con rostro gana más | Chi-cuadrado sobre 4.196 miniaturas | Se define la miniatura antes de grabar |
| H7 | La calidad observada explica el puesto | Regresión de `quality_score` sobre puesto; R² y curva de calibración | Valida la rúbrica propia |

Cada hipótesis se reporta con **n, prevalencia, diferencia, IC 95 % y valor p**, y se marca
explícitamente cuando el n es menor a 30.

---

## 6. Gráficas comprometidas

Todas se guardan en `research/sirli/analisis/figuras/` en PNG a 200 ppp, con los datos
fuente en CSV al lado para que cualquiera las reproduzca.

1. **Duración vs puesto** — densidad superpuesta y ECDF por puesto. Muestra el corte en 120 s.
2. **Proporción ≤120 s por puesto con IC 95 %** — barras con barra de error.
3. **Mapa de calor año × colección** — volumen de premios; explica por qué 2026 domina.
4. **Top 15 países por primeros lugares**, con tasa de conversión (1.º / participación).
5. **Saturación de desafíos** — barras ordenadas + curva de concentración (Lorenz).
6. **Longitud de descripción** — ECDF y proporción de descripciones útiles por puesto.
7. **Marcadores narrativos** — barras de prevalencia en transcripciones, con n visible.
8. **Miniaturas: rostro / texto / saturación vs puesto** — barras agrupadas.
9. **Matriz de correlación** de features numéricas (Spearman) para detectar redundancia.
10. **Curva ROC y PR** del modelo, por año de prueba.
11. **Curva de calibración** — probabilidad estimada vs observada por decil.
12. **Importancia de variables (SHAP)** — beeswarm y barras.
13. **Lift por decil** — cuántas veces más ganadores hay en el decil superior.
14. **Matriz de confusión** de la clasificación ternaria (1.º / 2.º / 3.º).
15. **Serie temporal** de duración mediana y de uso de subtítulos por año.

---

## 7. Plan de calidad (puertas obligatorias)

Ningún resultado se publica si no pasa estas puertas. Se registran en
`research/sirli/analisis/calidad.md` con fecha y resultado.

| Puerta | Qué verifica | Umbral | Cómo |
|---|---|---|---|
| Q1 Integridad | ids únicos, sin filas duplicadas, tipos correctos | 0 duplicados | `pandas` + asserts en el script |
| Q2 Cobertura | campos clave completos | ≥95 % en duración, título; 100 % en puesto | conteo por columna |
| Q3 Etiqueta | `place` coincide con `place_label` | 100 % | cruce contra HTML crudo en 30 filas al azar |
| Q4 Fuga temporal | ninguna feature usa información del mismo año o posterior | 0 casos | `country_prior_rate` y `team_prior_awards` calculados con `shift(1)` |
| Q5 Fuga de resultado | ninguna feature se deriva del puesto ni del jurado | 0 casos | revisión manual del diccionario de features |
| Q6 Partición | entrenamiento 2017–2024, prueba 2025, holdout 2026 | fija y documentada | split por año, no aleatorio |
| Q7 Agrupación | la validación cruzada agrupa por (año, sede) | sin grupos partidos | `GroupKFold` |
| Q8 Desbalance | se reporta prevalencia y se usa PR-AUC, no accuracy | obligatorio | métricas por clase |
| Q9 Muestra mínima | ninguna celda con n<30 se reporta como hallazgo | aviso visible | marcar en tabla |
| Q10 Texto | features de transcripción solo si n≥300; si no, análisis cualitativo | n≥300 | conteo previo |
| Q11 Reproducibilidad | semilla fija, versiones y hash de entrada anotados | 100 % | `requirements` + SHA-256 del dataset |
| Q12 Verificación humana | 30 videos al azar revisados a mano contra la extracción automática | error <15 % | planilla de doble revisión |

**Regla de oro:** si una cifra no se puede reproducir con un comando del README, no entra al
informe.

---

## 8. Modelo de pronóstico

**Definición de la etiqueta**

- `y1` binaria: primer lugar dentro de su desafío y sede (comparación real).
- `y3` ternaria: 1.º / 2.º / 3.º (solo para diagnóstico).
- `quality_score` (0–100): suma ponderada de rúbrica propia — duración en rango 25, solución
  explícita 20, impacto con cifra 15, estructura narrativa 20, claridad visual 10, equipo
  identificable 10. Se calcula **sin mirar el puesto**.

**Modelos, en ese orden**

1. **Baseline trivial**: predecir siempre la clase mayoritaria. Sirve para saber si el modelo
   aporta algo.
2. **Regresión logística** con variables del bloque evento. Interpretable, con odds ratios.
3. **Gradient boosting** (`HistGradientBoostingClassifier`) con bloques evento + video.
4. **Gradient boosting + texto** (TF-IDF sobre descripción y transcripción), solo si Q10 pasa.
5. **Modelo de calidad**: regresión del `quality_score`, para usar cuando todavía no hay puesto.

**Métricas**: ROC-AUC, PR-AUC, Brier score, calibración, y lift del decil superior. Se reporta
todo con IC por bootstrap (1.000 remuestreos agrupados por evento).

**Lectura esperada**: si el AUC queda cerca de 0,5, la conclusión honesta es que el resultado
depende de factores que no están en los datos (jurado, presentación en vivo, azar). Eso también
es un hallazgo y se publica igual.

---

## 9. Entregables y orden de ejecución

| Fase | Qué produce | Depende de | Tiempo estimado |
|---|---|---|---|
| F1 | `analisis/dataset_videos.csv` (una fila por video, features base) | datos actuales | 1 h |
| F2 | Figuras 1–8 y tabla de hipótesis H1–H4 | F1 | 2 h |
| F3 | Transcripción de los 1.204 videos de Nicaragua | `sirli_asr.py` | ~9 h de CPU |
| F4 | Análisis visual de 4.196 miniaturas | F1 | 3 h |
| F5 | Figuras 9–15, hipótesis H5–H7 | F2–F4 | 3 h |
| F6 | Modelo, calibración, SHAP, `analisis/modelo_informe.md` | F5 | 3 h |
| F7 | `analisis/calidad.md` con las 12 puertas firmadas | todas | 1 h |

**Lo que se puede hacer ya, sin red y sin gastar:** F1, F2, F4 y F7. F3 solo requiere CPU
tiempo; no hay riesgo de bloqueo porque no usa los subtítulos de YouTube.

---

## 10. Límites declarados

- 4 videos internacionales están caídos y 2 vaciados: no hay audio que transcribir.
- 21 videos siguen sin metadatos por bloqueo intermitente de YouTube.
- La transcripción local puede confundir nombres propios; no se usarán nombres de proyecto
  extraídos por voz sin revisión.
- `view_count` y `like_count` son posteriores al premio: sirven para describir, no para predecir.
- El corpus no tiene actas de jurado ni puntajes: el puesto es el único resultado observable.
- La colección internacional casi no publica categoría (0 de 58 filas).
