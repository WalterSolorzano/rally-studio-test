# Qué comparten los videos ganadores de SIRLI

> **SUPERSEDIDO.** Este informe fue el primero y trabaja con 26 transcripciones y sin controlar
> el sesgo de registro (2017–2020 publica casi solo primeros lugares). Su lectura de la duración
> y de la saturación de desafíos quedó **refutada** en
> [`investigacion_profunda.md`](investigacion_profunda.md). Se conserva solo como historial del
> método; las cifras vigentes están allí.

Lectura del banco construido desde `sirli.org/ganadores` (2017–2026) y de los metadatos públicos
de YouTube. Todos los números salen de `winners.jsonl`, `meta/videos.jsonl` y `transcripts/`.
Fecha de cierre: 22/10/2026.

## 1. Tamaño y forma del corpus

| Dato | Valor |
|---|---|
| Premios registrados | 5.136 |
| Equipos distintos | 4.368 |
| Videos únicos | 4.709 |
| Videos con metadatos descargados | 4.688 (99,6 %) |
| Videos con miniatura | 4.196 |
| Transcripciones con texto | 26 |
| Desafíos distintos | 90 |
| Países representados | 14 |

Por colección: sede 4.715 · nacional 363 · internacional 58.
Por año: de 151 registros en 2017 a 927 en 2026 (el certamen creció 6×).

**Nicaragua**: 1.259 premios (sede 1.209, nacional 41, internacional 9) y 1.204 videos únicos.
Es el país con más participación, seguido de México (1.086) y Argentina (1.069).

## 2. La duración no es un detalle menor

| Subconjunto | Videos | Mediana | ≤ 120 s |
|---|---|---|---|
| Todos | 4.177 | 118 s | 76,8 % |
| **Primer lugar** | 2.145 | 119 s | 69,5 % |
| Segundo y tercer lugar | 2.413 | 116 s | 82,5 % |
| Internacional | 54 | 119 s | 59,3 % |
| Nacional Nicaragua | 336 | 119 s | 72,0 % |

Lectura (corregida): esta tabla mezcla 2017–2020, años en que SIRLI publica casi solo primeros
lugares, así que la comparación está sesgada. Con **sede 2021–2026** las tasas de ≤120 s son
82,8 % / 82,8 % / 83,8 % para 1.º/2.º/3.º y la duración deja de distinguir. Ver
`investigacion_profunda.md`, hipótesis H14, H16, H42.

## 3. Los desafíos se repiten: el repertorio es corto y estable

Solo 90 enunciados de desafío sostienen 5.136 premios. Los temas dominantes:

| Tema | Premios |
|---|---|
| Residuos y reciclaje | 713 |
| Agua | 429 |
| Vivienda y hábitat | 234 |
| Tecnología digital | 146 |
| Inclusión y discapacidad | 132 |
| Energía | 129 |
| Género | 106 |
| Salud | 86 |

Consecuencia práctica: **la solución no compite por el tema, compite por el ángulo**. Miles de equipos
atacan el mismo desafío de residuos; lo que distingue al ganador es cómo lo cuenta y qué tan concreto
es el artefacto que muestra.

## 4. El punto débil del banco: los equipos no documentan su solución

| Señal | Valor |
|---|---|
| Descripción del video con 30 caracteres o menos | 3.124 de 4.688 (67 %) |
| Descripción con más de 80 caracteres | 1.412 (30 %) |
| Descripción mediana | 12 caracteres |
| Videos con etiquetas (tags) | 268 (6 %) |
| Videos con subtítulos disponibles | 4.019 (86 %) |

La ficha de SIRLI tampoco publica descripción del proyecto: solo equipo, categoría, desafío, sede,
país y video. Por eso el Excel trae la solución **extraída de tres fuentes y marcada con su origen**:

- `descripcion`: la descripción del video dice qué hace el proyecto (762 filas).
- `descripcion (debil)`: la descripción existe pero es propaganda o créditos (1.315 filas).
- `titulo (nombre del proyecto)`: solo se conoce el nombre, que ya orienta (2.407 filas).
- `transcripcion`: el texto hablado dice la solución (72 filas).
- Vacío: 580 filas sin metadatos (los 21 videos que siguen bloqueados, repartidos entre sus premios).

## 5. Qué dicen las 26 transcripciones

Sobre 7.732 palabras transcritas:

| Marcador | Presente en |
|---|---|
| Impacto social explícito | 69,2 % |
| Solución nombrada | 65,4 % |
| Problema planteado | 42,3 % |
| Gancho con pregunta | 42,3 % |
| Equipo y universidad | 38,5 % |
| Cierre con llamado | 26,9 % |
| Demo del producto en pantalla | 23,1 % |
| Testimonio de usuario | 0 % |

Temas más mencionados en esos videos: digital (18), agua (14), vivienda (13), agro (12), movilidad (11),
energía (11), residuos (11).

Lectura: el video ganador **nombra la solución y el impacto, y casi nunca prueba con un tercero**.
El testimonio es el recurso que nadie usa; es el hueco más grande y el más barato de llenar.

## 6. Límites de esta lectura

- Las 26 transcripciones son una muestra del subconjunto priorizado (internacional 2022–2026,
  nacional y sede de Nicaragua), no del corpus completo.
- YouTube bloqueó el resto de descargas de subtítulos tras 4.709 peticiones ("Sign in to confirm
  you're not a bot"). No es que esos videos no tengan subtítulos: 86 % los tiene. Se resuelven
  con `--cookies-from-browser` o esperando el enfriamiento del límite.
- 21 videos siguen sin metadatos por bloqueo intermitente; están marcados `failed` y son reintentables.
- La categoría no existe en la colección internacional (el sitio no la publica).
