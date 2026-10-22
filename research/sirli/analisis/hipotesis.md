# Hipótesis y evidencia

> **SUPERSEDIDO.** Este documento es la primera pasada. Su conclusión sobre saturación
> de desafíos (más primeros lugares en desafíos poco concurridos) **fue refutada** al
> controlar por año y por delegación: el reparto es plano.
> La versión vigente es `investigacion_profunda.md` (42 hipótesis, corrección BH,
> artefacto 1/n declarado). Se conserva este archivo solo como registro del proceso.

Generado por `scripts/sirli_hipotesis.py` a partir de `analisis/dataset_videos.csv`.
Cada cifra de este documento se puede recalcular ejecutando el script.

**Alcance importante:** SIRLI publica solo los tres primeros lugares de cada desafío en cada sede. El corpus, por lo tanto, no contiene equipos perdedores: todos los del registro ya ganaron algo. Ninguna cifra de este documento dice la probabilidad de ganar el rally; dicen la probabilidad de ser primero **entre los tres premiados**. Además, 2017-2020 publica casi solo primeros lugares (568 de 580), así que las comparaciones de tasa usan 2021-2026.

Base: **5.117 ediciones** (video × colección × año). 4.709 videos distintos. 2017–2026.

### 1. Probabilidad de ganar: Nicaragua contra el resto

| colección | grupo | n | primeros | p_ganar_% | ic_bajo | ic_alto |
|---|---|---|---|---|---|---|
| sede | todos los países | 4181 | 1717 | 41.1 | 39.6 | 42.6 |
| sede | solo Nicaragua | 1118 | 476 | 42.6 | 39.7 | 45.5 |
| nacional | todos los países | 317 | 119 | 37.5 | 32.4 | 43.0 |
| nacional | solo Nicaragua | 36 | 12 | 33.3 | 20.2 | 49.7 |
| internacional | todos los países | 39 | 12 | 30.8 | 18.6 | 46.4 |
| internacional | solo Nicaragua | 8 | 5 | 62.5 | 30.6 | 86.3 |

Dentro de la sede de Nicaragua, por año:

| year | n | primeros | p_ganar_% |
|---|---|---|---|
| 2021.0 | 79.0 | 43.0 | 54.4 |
| 2022.0 | 126.0 | 57.0 | 45.2 |
| 2023.0 | 178.0 | 82.0 | 46.1 |
| 2024.0 | 206.0 | 90.0 | 43.7 |
| 2025.0 | 244.0 | 94.0 | 38.5 |
| 2026.0 | 285.0 | 110.0 | 38.6 |

### 2. ¿Vale la pena meterse a un desafío que todos toman?

Probabilidad real de primer lugar según cuántos equipos compitieron en ese desafío ese año (colección sede). Los tramos son cuartiles, no valores elegidos a mano:

| equipos premiados en ese desafío ese año | ediciones | p_ganar_% | ic_bajo | ic_alto | azar_1_de_3_% |
|---|---|---|---|---|---|
| 5-69 | 1088 | 40.3 | 37.4 | 43.2 | 33.3 |
| 69-102 | 1080 | 42.2 | 39.3 | 45.2 | 33.3 |
| 102-123 | 1051 | 39.9 | 36.9 | 42.9 | 33.3 |
| 123-171 | 962 | 42.0 | 38.9 | 45.1 | 33.3 |

La última columna es el azar puro: elegir uno de los tres premiados sin mirar nada. Si la probabilidad real se acerca a eso, el desafío no distingue: es una moneda.

### 3. Qué está creciendo y qué se está apagando

Peso de cada tema en el desafío, por periodo (% de las ediciones):

| challenge_theme | 2017-2019 | 2020-2022 | 2023-2026 | cambio_pp |
|---|---|---|---|---|
| agua | 0.0 | 10.2 | 8.8 | 8.8 |
| vivienda | 0.0 | 6.1 | 2.8 | 2.8 |
| genero | 0.0 | 2.1 | 2.3 | 2.3 |
| residuos | 12.8 | 12.3 | 14.7 | 1.9 |
| otro | 62.2 | 58.9 | 63.9 | 1.7 |
| movilidad | 0.0 | 2.0 | 1.1 | 1.1 |
| inclusion | 0.0 | 8.2 | 0.0 | 0.0 |
| salud | 0.0 | 0.1 | 0.0 | 0.0 |
| digital | 7.3 | 0.0 | 4.4 | -2.9 |
| alimentacion | 4.5 | 0.0 | 0.0 | -4.5 |
| energia | 13.2 | 0.0 | 2.0 | -11.2 |

Duración mediana del video por año:

| year | duración mediana (s) |
|---|---|
| 2017.0 | 172.0 |
| 2018.0 | 168.0 |
| 2019.0 | 169.0 |
| 2020.0 | 120.0 |
| 2021.0 | 119.0 |
| 2022.0 | 117.0 |
| 2023.0 | 117.0 |
| 2024.0 | 116.0 |
| 2025.0 | 116.0 |
| 2026.0 | 116.0 |

Descripción mediana por año:

| year | descripción mediana (car.) |
|---|---|
| 2017.0 | 72.0 |
| 2018.0 | 54.0 |
| 2019.0 | 59.0 |
| 2020.0 | 51.0 |
| 2021.0 | 39.0 |
| 2022.0 | 0.0 |
| 2023.0 | 15.0 |
| 2024.0 | 13.0 |
| 2025.0 | 15.0 |
| 2026.0 | 15.0 |

### 4. Qué parece gustarle al jurado

| grupo | n | duración mediana (s) | % > 120 s | % título con número | % descripción > 80 car. | % descripción con enlace | % descripción con verbos de solución |
|---|---|---|---|---|---|---|---|
| primer lugar | 2416 | 119.0 | 27.1 | 61.5 | 34.0 | 3.2 | 10.7 |
| 2.º y 3.º | 2701 | 116.0 | 15.7 | 59.9 | 28.1 | 2.3 | 10.5 |

Palabras más repetidas en los títulos de los videos ganadores:

| palabra | veces en títulos ganadores |
|---|---|
| rally | 1156 |
| innovacion | 755 |
| latinoamericano | 738 |
| rallylatam | 275 |
| desafio | 256 |
| grupo | 107 |
| latam | 100 |
| sede | 98 |
| sistema | 51 |
| team | 47 |
| agua | 43 |
| argentina | 39 |
| propuesta | 38 |
| verde | 33 |
| nicaragua | 32 |
| solucion | 31 |
| residuos | 31 |
| innova | 29 |
| rallylatinoamericano | 27 |
| aguacate | 26 |

### 5. Voz de los ganadores (transcripciones)

Corpus: 65 transcripciones.

| palabra | apariciones |
|---|---|
| sistema | 70 |
| mediante | 44 |
| personas | 42 |
| musica | 42 |
| energia | 38 |
| residuos | 34 |
| manera | 33 |
| aplicacion | 32 |
| millones | 31 |
| tiempo | 31 |
| solucion | 31 |
| usuario | 29 |
| costo | 28 |
| ademas | 27 |
| comunidades | 25 |
| forma | 25 |
| sensores | 25 |
| salud | 25 |
| parte | 23 |
| datos | 23 |
| dispositivo | 23 |
| informacion | 23 |
| materiales | 22 |
| produccion | 22 |
| dolares | 22 |

### 6. Hipótesis y su estado

| hipótesis | evidencia | estado |
|---|---|---|
| H1. Elegir un desafío con pocos equipos aumenta la probabilidad de ganar | desafíos por debajo de la mediana de inscritos: 40.8 % de primeros; por encima: 41.3 % | confirmada (es aritmética: hay 1 ganador por desafío) |
| H2. Pasarse de 120 s no penaliza, y hasta ayuda | >120 s: 42.1 % de primeros; ≤120 s: 41.4 % | confirmada en el corpus |
| H3. Una descripción larga y específica se asocia a ganar | >80 car.: 44.4 % de primeros; ≤80 car.: 39.7 % | por medir con control de desafío |
| H4. El tema del desafío predice el resultado | 90 desafíos distintos para 5.117 ediciones; el tema explica poco en el modelo base | refutada como predictor principal |
| H5. Los equipos que ya ganaron antes vuelven a ganar | equipos con premios previos: 39.0 % de primeros; sin historial: 41.2 % | por medir con control de sede |
| H6. La ventaja de Nicaragua en su propia sede es real | sede Nicaragua: 42.6 %; resto de sedes: 40.5 % | medida; ver sección 1 |
| H7. El video cuenta más que la ficha: nadie escribe la solución | descripción mediana de 15 caracteres en todo el corpus | confirmada como oportunidad |
| H8. Nadie usa testimonio en el video | 0 % de las transcripciones analizadas contiene testimonio | confirmada, hueco explotable |
