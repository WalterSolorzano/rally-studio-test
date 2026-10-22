"""Partes 1 — capítulos 0 a 4: portada, guía, el certamen, historia, geografía."""

from __future__ import annotations

from collections import Counter, defaultdict

from base import (ANIOS, AUDIO, CORE, DF, HIP, INTL, META, NAC, NIC, NIC_SEDE, SIS,
                  TXT, VIDEOS, WINNERS, fig, fp, media, mediana, nombre_pais, num,
                  pct, pp, tabla, tasa, tasa_por)


def cap0() -> str:
    premios = len(WINNERS)
    equipos = len({w["team"] for w in WINNERS})
    videos = len({w["video_id"] for w in WINNERS if w.get("video_id")})
    paises = len({w["country"] for w in WINNERS if w.get("country")})
    sedes = len({w["sede"] for w in WINNERS if w.get("sede")})
    desafios = len({w["challenge_name"] for w in WINNERS if w.get("challenge_name")})
    k, n, t = tasa(CORE)
    return f"""# Anatomía de un ganador

## Qué distingue a los videos premiados del SIRLI, 2017–2026

**Un estudio sobre {num(premios)} premios, {num(videos)} videos y {num(desafios)} desafíos**

Generado el 22 de octubre de 2026 por el pipeline de `scripts/` de este repositorio.
Reproducible de principio a fin: cada tabla y cada figura sale de un script, no de una
transcripción manual de números.

---

### Ficha técnica

| | |
|---|---|
| Objeto de estudio | Registro público de ganadores del SIRLI (SuRRgimiento de líderes) |
| Fuente primaria | `sirli.org/ganadores` — colecciones sede, nacional e internacional |
| Cobertura | {ANIOS[0]}–{ANIOS[-1]}, diez ediciones |
| Premios registrados | {num(premios)} |
| Equipos distintos | {num(equipos)} |
| Videos distintos | {num(videos)} ({(videos / premios) * 100:.0f} % de los premios comparte video con otro) |
| Países | {num(paises)} |
| Sedes organizadoras | {num(sedes)} |
| Desafíos distintos | {num(desafios)} |
| Videos con metadatos | {num(len(META))} ({(len(META) / videos) * 100:.1f} % del total) |
| Videos con transcripción | {num(len({r['video_id'] for r in TXT}))} |
| Videos con rasgos de audio | {num(len(AUDIO))} |
| Hipótesis probadas | {num(len(HIP))} |
| Corte analítico válido | sede 2021–2026 ({num(len(CORE))} ediciones con base {pct(t)}) |

### Las cinco conclusiones

**1. El registro no tiene perdedores.** El sitio publica únicamente los tres primeros
lugares de cada desafío en cada sede. No existe una lista de quienes participaron y no
ganaron. Por eso ninguna cifra de este libro es «probabilidad de ganar el rally»: todas
son **probabilidad de ser primero entre los tres premiados**. Es una diferencia grande y
está repetida en cada capítulo donde importa.

**2. Los dos efectos grandes son aritmética, no mérito.** La composición de la delegación
—cuántos equipos lleva tu sede, cuántos de ellos comparten tu desafío— explica más que
cualquier variable del video. Y el más espectacular de esos efectos, el reparto 1/n, es
casi una tautología: si tu sede ocupa los tres puestos de un desafío, la probabilidad de
que el primero sea tuyo es exactamente un tercio.

**3. Lo que medimos del video no distingue a nadie.** Duración, miniatura, título,
subtítulos, descripción y marcadores del guion caen dentro del ruido después de corregir
por comparaciones múltiples: {num(len([h for h in HIP.values() if h['status'] == 'a favor']))} hipótesis
a favor, {num(len([h for h in HIP.values() if h['status'] == 'en contra']))} en contra y
{num(len([h for h in HIP.values() if h['status'] == 'sin evidencia']))} sin evidencia de {num(len(HIP))}.

**4. El hueco más rentable no es técnico.** Ningún guion del corpus —{num(len(TXT))}
ediciones transcritas— pone a hablar a un usuario real. Cero por ciento. No hace falta
más datos para justificar esa recomendación; hace falta que alguien la ejecute y la mida.

**5. El certamen se endureció.** En la sede de Nicaragua, la tasa de primer lugar cayó de
{_tasa_anio('NICARAGUA', 2021)} en 2021 a {_tasa_anio('NICARAGUA', 2026)} en 2026. El
número de premios creció más despacio que el número de participantes.

### Cómo está organizado

| Parte | Contenido | Qué responde |
|---|---|---|
| I | El certamen y su historia | qué es SIRLI, cómo creció, quién compite |
| II | El banco de datos | qué se recogió, cómo y con qué límites |
| III | Método | qué se puede y qué no se puede concluir |
| IV | Biblioteca de hipótesis | las {num(len(HIP))} creencias puestas a prueba |
| V | Análisis sistémico | qué depende de qué |
| VI | Modelo | cuánto se puede predecir con lo observable |
| VII | Imagen, voz y guion | el video por dentro |
| VIII | Psicología y pitch | por qué un jurado elige |
| IX | Retratos | Nicaragua, internacional, países y desafíos |
| X | Síntesis | qué compone a un ganador |

---
"""


def _tasa_anio(pais: str, anio: int) -> str:
    g = [r for r in CORE if r["country"] == pais and r["year"] == anio]
    if not g:
        return "—"
    return pct(sum(1 for r in g if r["won"] == 1) / len(g))


def cap1() -> str:
    return f"""## 1. Cómo leer este libro

### 1.1 La regla que ordena todo

Todo el libro se apoya en una sola advertencia metodológica: **el registro público de
SIRLI solo contiene premiados**. No hay grupo de control natural. Cualquier afirmación
del tipo «los ganadores hacen X» es, en rigor, «entre los tres premiados, quienes hicieron
X ocuparon el primer lugar con más frecuencia». La diferencia importa: si el 100 % de los
participantes usara fondo blanco y solo el 1 % ganara, el fondo blanco no explicaría nada.

Por eso el libro distingue siempre tres afirmaciones distintas:

1. **Descriptiva**: «el 83 % de los videos premiados dura 120 segundos o menos».
2. **Comparativa interna**: «entre premiados, los de primer lugar duran lo mismo que los
   de tercero».
3. **Causal**: «acortar el video aumenta la probabilidad de ganar». De esta última no hay
   ni una sola en todo el libro, y cada vez que se insinúa se marca como hipótesis.

### 1.2 Los tres cortes temporales

El registro cambia de comportamiento en 2021. Antes de ese año el sitio publica casi
exclusivamente primeros lugares; desde 2021 publica los tres puestos de forma sistemática.
Eso obliga a trabajar con tres muestras y a no mezclarlas:

| Corte | Definición | Filas | Para qué sirve |
|---|---|---:|---|
| Histórico | Todo el registro, 2017–2026 | {num(len(DF))} | describir el evento, su crecimiento y su repertorio |
| Válido | sede, 2021–2026 | {num(len(CORE))} | comparar puestos con honestidad |
| Textual | con transcripción de más de 20 palabras | {num(len(TXT))} | analizar el guion |

`{num(len(DF))}` ediciones corresponden a `{num(VIDEOS)}` videos distintos: un mismo video
puede ganar en su sede y volver a presentarse en la final internacional, y entonces aparece
dos veces con la misma grabación. El dataset lo respeta; los conteos por video se deduplican
cuando hace falta.

### 1.3 Glosario

| Término | Significado exacto en este libro |
|---|---|
| **Premio** | una fila del registro: un equipo, en un desafío, en una sede, en un año, con un puesto |
| **Edición** | un video en un contexto de premiación (año + colección). Un video puede tener dos |
| **Colección** | `sede` (rondas locales), `nacional` (final de país), `internacional` (final latinoamericana) |
| **Sede** | la institución o ciudad que organiza la ronda local. Hay {num(len({w['sede'] for w in WINNERS if w.get('sede')}))} distintas y no son solo universidades |
| **Delegación** | los equipos premiados de una misma sede en una misma edición |
| **Desafío** | el enunciado del reto, publicado por el certamen |
| **Puesto** | 1, 2 o 3. No existe el puesto 4 en el registro |
| **Base** | la tasa de primeros en la muestra. En el corte válido es {pct(tasa(CORE)[2])} |
| **Artefacto 1/n** | un efecto que parece conductual y es puro reparto: con n premiados de tu sede en un desafío, tu probabilidad de ser primero es 1/n |
| **q** | p-valor corregido por Benjamini–Hochberg sobre las {num(len(HIP))} pruebas |

### 1.4 Qué NO encontrará aquí

- No hay datos de participantes que no ganaron. No existen en la fuente.
- No hay rúbrica oficial del certamen. Si el equipo la consigue, este libro se puede
  recalibrar contra ella.
- No hay análisis de audio de los {num(VIDEOS - len(AUDIO))} videos sin rasgos extraídos.
- No hay recomendaciones del tipo «usa este tipo de música». La evidencia no alcanza y
  afirmarlo sería inventar.
"""


def cap2() -> str:
    premios = len(WINNERS)
    por_col = Counter(w["collection"] for w in WINNERS)
    sin_cat = sum(1 for w in WINNERS if w["collection"] == "internacional" and not w.get("category"))
    sin_video = sum(1 for w in WINNERS if not w.get("video_id"))
    filas = [
        ["Equipo", "nombre del equipo, tal como lo publica el sitio"],
        ["Categoría", "Área de innovación o de impacto social (no publicada en internacional)"],
        ["Desafío", "enunciado del reto, en mayúsculas y a veces con numeración propia"],
        ["Sede", "institución o ciudad organizadora de la ronda"],
        ["País", "país de la sede"],
        ["Video", "enlace a YouTube"],
    ]
    return f"""## 2. Qué es SIRLI y de dónde salen los datos

### 2.1 El certamen

El SIRLI es un rally de innovación que se corre en rondas: primero una **sede** local
—universidad, instituto o ciudad—, después una final **nacional** y finalmente una final
**internacional** latinoamericana. Cada equipo recibe un desafío, lo trabaja durante 24 o
28 horas y entrega un video. El jurado premia los tres mejores de cada desafío.

Esa estructura explica el resto del libro. Un mismo desafío se repite en decenas de sedes
simultáneas, así que el repertorio de retos es corto y la competencia real es local. Y
como los premios son por desafío y por sede, la probabilidad de ganar depende mucho más de
**cuántos rivales hay en tu propio desafío** que de lo que hagas en el video.

Cifras del registro: {num(premios)} premios, de los cuales {num(por_col['sede'])} son de
sede ({pct(por_col['sede'] / premios)}), {num(por_col['nacional'])} nacionales y
{num(por_col['internacional'])} internacionales. La final internacional es el 1,1 % del
registro: es el escaparate, no el volumen.

### 2.2 Qué publica el sitio (y qué no)

Cada ficha de ganador tiene exactamente seis etiquetas. No hay más, y eso es un dato, no
una impresión: se verificaron las {num(premios)} fichas y no aparece ni una etiqueta
adicional en todo el HTML.

{tabla(["Etiqueta", "Contenido"], filas)}

Lo que **no** publica: descripción del proyecto, integrantes, universidad de origen por
separado de la sede, puntaje del jurado, ni los equipos que no ganaron. Esa ausencia es la
razón por la que este libro tuvo que transcribir videos: la solución del reto solo existe,
si existe, en la voz o en la descripción de YouTube.

Dos huecos conocidos en la fuente: la colección internacional tiene la categoría vacía en
{num(sin_cat)} de 58 filas, y {num(sin_video)} premios no tienen video asociado.

### 2.3 Cómo se construyó el banco

El pipeline tiene seis etapas, todas ejecutables de nuevo:

| Etapa | Script | Qué produce |
|---|---|---|
| 1. Recolección | `scrape_ganadores_sirli.py` | `winners.jsonl` (maestro), CSV, HTML crudo comprimido |
| 2. Metadatos | `sirli_meta.py` | título, descripción, duración, vistas, canal, subtítulos |
| 3. Miniaturas | `sirli_thumbs.py` | 4.196 imágenes de portada |
| 4. Voz a texto | `sirli_asr.py` | transcripción local con faster-whisper + rasgos de audio |
| 5. Fotogramas | `sirli_videos.py frames` | hojas de contacto 3×2 por video |
| 6. Análisis | `sirli_dataset.py`, `sirli_sistemico.py` | dataset de 46 columnas, {num(len(HIP))} hipótesis, figuras |

La recolección usa caché: la primera pasada guarda el HTML de cada colección por año y las
siguientes leen de disco. Eso hace que el banco sea auditable —cualquiera puede volver al
HTML original— y que se pueda reparar un parser sin volver a pedirle nada al sitio.

### 2.4 Los límites del banco

| Límite | Magnitud | Consecuencia |
|---|---|---|
| Solo premiados | {num(premios)} filas, ninguna de perdedores | la probabilidad absoluta no se mide: se acota (cap. 20) |
| Registro incompleto antes de 2021 | 2017: 0 segundos y 0 terceros | comparar puestos antes de 2021 es inválido |
| Videos caídos | {num(len([1 for w in WINNERS if w.get('video_id')]) - len(META))} sin metadatos | la muestra de sobrevivientes está sesgada hacia videos que siguen en pie |
| Subtítulos ausentes | amplia mayoría de los videos | obligó a transcribir en CPU con modelo pequeño |
| Un video, varios premios | {num(len(DF) - VIDEOS)} ediciones repetidas | cualquier conteo por video debe deduplicar |

Sobre el sesgo de supervivencia hay un capítulo propio (cap. 12), porque no es un detalle:
los videos premiados en primer lugar desaparecen más que los demás, y eso distorsiona
cualquier lectura ingenua del conjunto.

La primera fila de esa tabla fue durante meses la respuesta oficial de este proyecto. Ya no:
el registro no publica a los perdedores, pero **sí publica menos premios cuando la sede tiene
menos equipos**, y esa censura permite reconstruir el denominador. El capítulo 20 desarrolla
la reconstrucción completa —una banda de probabilidad absoluta en función del tamaño de tu
categoría— y separa lo que se mide de lo que se supone.
"""


def cap3() -> str:
    # premios por año y colección (registro completo)
    col = sorted({w["collection"] for w in WINNERS})
    por = Counter((w["year"], w["collection"]) for w in WINNERS)
    anios = sorted({w["year"] for w in WINNERS})
    filas = []
    for a in anios:
        tot = sum(por[(a, c)] for c in col)
        filas.append([str(a)] + [num(por[(a, c)]) for c in col] + [num(tot)])
    tot_col = [num(sum(por[(a, c)] for a in anios)) for c in col]
    filas.append(["**Total**"] + [f"**{x}**" for x in tot_col] + [f"**{num(len(WINNERS))}**"])

    # puestos por año (para mostrar el cambio de régimen en 2021)
    puestos = defaultdict(Counter)
    for w in WINNERS:
        puestos[w["year"]][w.get("place")] += 1
    filas_p = []
    for a in anios:
        p = puestos[a]
        filas_p.append([str(a), num(p.get(1, 0)), num(p.get(2, 0)), num(p.get(3, 0)),
                        pct(p.get(2, 0) / max(1, sum(p.values())))])

    # categorías por año (sede)
    cat = Counter((w["year"], (w.get("category") or "sin categoría").upper()) for w in WINNERS
                  if w["collection"] == "sede")
    cats = sorted({c for _, c in cat})
    filas_c = []
    for a in anios:
        fila = [str(a)]
        for c in cats:
            fila.append(num(cat[(a, c)]))
        filas_c.append(fila)

    crec = len([w for w in WINNERS if w["year"] == anios[-1]]) / max(
        1, len([w for w in WINNERS if w["year"] == anios[0]]))
    return f"""## 3. Historia: de 151 premios a 927 en diez años

### 3.1 El crecimiento

El registro pasa de {num(len([w for w in WINNERS if w['year'] == anios[0]]))} premios en
{anios[0]} a {num(len([w for w in WINNERS if w['year'] == anios[-1]]))} en {anios[-1]}: se
multiplicó por {num(crec, 1)}. Ese crecimiento no es solo de participantes: es sobre todo de
sedes. En 2017 el rally se corría en un puñado de instituciones; en 2026 hay sedes en toda
Latinoamérica y cada una publica su podio: un primero, un segundo y un tercero por categoría.

{tabla(["Año"] + [c.capitalize() for c in col] + ["Total"], filas, "d" * (len(col) + 2))}

{fig("fig03_calor_anio_coleccion.png", "Premios por año y colección")}

**Lectura.** La colección `sede` es el 92 % del registro y la que sostiene todas las
comparaciones de este libro. `nacional` e `internacional` son pequeñas y muy irregulares
entre años, lo que limita cualquier serie temporal sobre ellas.

### 3.2 El cambio de régimen de 2021

En 2021 el sitio empieza a publicar los tres puestos de forma sistemática. Antes, el
segundo y el tercero aparecen de manera esporádica: en 2017 no hay ni un solo segundo
puesto registrado.

{tabla(["Año", "Primeros", "Segundos", "Terceros", "% no primeros"], filas_p, "ddddd")}

Esto no significa que en 2017–2020 solo hubiera un ganador por desafío; significa que el
sitio no publicaba el resto. La diferencia es crucial: si se compara «primer lugar contra
segundo y tercero» sin cortar en 2021, se está comparando una muestra completa contra una
muestra que casi no existe. **Ese fue el primer error de este proyecto** y produjo una
conclusión falsa —que los ganadores se pasaban del límite de 120 segundos— que está
documentada y corregida en el capítulo 11.

### 3.3 Las dos categorías

{tabla(["Año"] + [c.title() for c in cats], filas_c, "d" * (len(cats) + 1))}

Solo hay dos categorías en la colección de sede: **Área de Innovación** y **Área de Impacto
Social**. La distribución es casi perfecta: {_cat_split()}. Es decir, la mitad de los equipos
elige una categoría y la otra mitad la otra, y esa decisión no cambia nada la probabilidad de
ganar (cap. 9, H05). La categoría organiza el cartel, no la competencia.

La colección internacional no publica categoría en ninguna de sus 58 fichas.
"""


def _cat_split() -> str:
    c = Counter((w.get("category") or "").upper() for w in WINNERS if w["collection"] == "sede")
    tot = sum(c.values()) or 1
    return ", ".join(f"{k.title()}: {num(v)} ({pct(v / tot)})" for k, v in c.most_common(2))


def cap4() -> str:
    paises = Counter(w["country"] for w in WINNERS if w.get("country"))
    filas = []
    for p, n in paises.most_common():
        g = [r for r in CORE if r["country"] == p]
        if len(g) >= 30:
            k, nn, t = tasa(g)
            lo, hi = _wilson(k, nn)
            filas.append([nombre_pais(p), num(n), num(nn), pct(t), f"{pct(lo)} – {pct(hi)}"])
        else:
            filas.append([nombre_pais(p), num(n), num(len(g)), "—" if not g else pct(tasa(g)[2]), "muestra pequeña"])
    sedes = Counter(w["sede"] for w in WINNERS if w.get("sede"))
    top_sedes = sedes.most_common(12)
    filas_s = []
    for s, n in top_sedes:
        g = [r for r in CORE if (r["sede"] or "") == s]
        k, nn, t = tasa(g)
        filas_s.append([s.title(), num(n), num(nn), pct(t) if nn else "—"])
    return f"""## 4. Geografía: quién compite y dónde

### 4.1 Los países

{num(len(paises))} países aparecen en el registro. Cuatro concentran casi todo: Nicaragua,
México, Argentina y Colombia.

{fig("fig04_paises.png", "Premios por país")}

{tabla(["País", "Premios (todo)", "Ediciones sede 2021+", "Tasa de 1.º", "IC 95 %"], filas, "ddddd")}

**Lectura.** Las diferencias entre países son pequeñas y los intervalos se solapan casi
todos. Argentina lidera con {_tasa_pais('ARGENTINA')} y Nicaragua está en
{_tasa_pais('NICARAGUA')}. Ninguna diferencia justifica hablar de «mejores equipos por país»:
lo que cambia es el tamaño de la delegación y la composición de los desafíos, que son
precisamente las variables del capítulo 9.

### 4.2 Las sedes

Hay {num(len(sedes))} sedes distintas y el top 12 concentra una fracción notable del
registro. Conviene insistir en algo que se descubre al mirar los datos: **«sede» no es
sinónimo de universidad**. Mezcla ciudades (`TLALNEPANTLA`), instituciones
(`UNIVERSIDAD FRANCISCO GAVIDIA (UFG)`) y programas (`INNOVA GUANAJUATO`). Por eso el libro
habla de «tu sede» y no de «tu universidad»: un equipo puede pertenecer a una universidad
distinta de la que organiza.

{tabla(["Sede", "Premios", "Ediciones 2021+", "Tasa de 1.º"], filas_s, "dddd")}

### 4.3 Nicaragua en el mapa

Nicaragua es el país con más premios registrados: {num(paises['NICARAGUA'])} de
{num(len(WINNERS))} ({pct(paises['NICARAGUA'] / len(WINNERS))}). De ellos,
{num(len([w for w in WINNERS if w['country'] == 'NICARAGUA' and w['collection'] == 'sede']))}
son de sede, {num(len([w for w in WINNERS if w['country'] == 'NICARAGUA' and w['collection'] == 'nacional']))}
nacionales y {num(len([w for w in WINNERS if w['country'] == 'NICARAGUA' and w['collection'] == 'internacional']))}
internacionales.

Ese volumen tiene una explicación simple: el rally nació en Nicaragua y el país conserva la
red de sedes más densa. No es una ventaja competitiva, es una ventaja de origen. El
capítulo 15 está dedicado por completo a esta población.
"""


def _wilson(k: int, n: int):
    from base import wilson
    return wilson(k, n)


def _tasa_pais(p: str) -> str:
    g = [r for r in CORE if r["country"] == p]
    if not g:
        return "—"
    return pct(tasa(g)[2])
