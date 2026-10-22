"""Apéndices — tablas completas y material de consulta."""

from __future__ import annotations

import json
import statistics
from collections import Counter

from base import (AN, CORE, DF, HIP, INTL, META, NIC, NIC_SEDE, SIRLI, SIS, TXT, TRANS,
                  VIDEOS, WINNERS, fig, fp, num, pct, pp, tabla, tasa, wilson)

PROB = json.loads((AN / "probabilidad.json").read_text(encoding="utf-8"))

PARTE = """
---

# Apéndices — el banco completo
"""


def cap21() -> str:
    filas = []
    for d, n in Counter(w["challenge_name"] for w in WINNERS if w.get("challenge_name")).most_common():
        g = [r for r in CORE if r["challenge_name"] == d]
        k, nn, t = tasa(g)
        anios = sorted({w["year"] for w in WINNERS if w.get("challenge_name") == d})
        filas.append([d.title()[:64], num(n), num(nn), pct(t) if nn else "—",
                      f"{anios[0]}–{anios[-1]}" if len(anios) > 1 else str(anios[0])])
    return f"""## Apéndice A. Los {num(len(filas))} desafíos del registro

Tabla completa, ordenada por frecuencia. «Ediciones 2021+» es el denominador usado para la
tasa de primer lugar en el corte válido.

{tabla(["Desafío", "Premios", "Ediciones 2021+", "Tasa de 1.º", "Años"], filas, "idddd")}
"""


def cap22() -> str:
    sedes = Counter(w["sede"] for w in WINNERS if w.get("sede"))
    filas = []
    for s, n in sedes.most_common(60):
        g = [r for r in CORE if r["sede"] == s]
        k, nn, t = tasa(g)
        paises = Counter(w["country"] for w in WINNERS if w.get("sede") == s)
        filas.append([s.title()[:52], num(n), num(nn), pct(t) if nn else "—",
                      (paises.most_common(1)[0][0].title() if paises else "—")])
    return f"""## Apéndice B. Las 60 sedes con más premios

{tabla(["Sede", "Premios", "Ediciones 2021+", "Tasa de 1.º", "País"], filas, "idddd")}

Las {num(len(sedes))} sedes restantes aparecen en `winners.csv`.
"""


def cap23() -> str:
    paises = [p for p, _ in Counter(w["country"] for w in WINNERS if w.get("country")).most_common(10)]
    anios = sorted({r["year"] for r in CORE})
    filas = []
    for p in paises:
        fila = [p.title()]
        for a in anios:
            g = [r for r in CORE if r["country"] == p and r["year"] == a]
            fila.append(pct(tasa(g)[2], 0) if len(g) >= 15 else "·")
        filas.append(fila)
    return f"""## Apéndice C. Tasa de primer lugar por país y año

Solo se muestran celdas con al menos 15 ediciones. El punto medio (·) indica muestra
insuficiente.

{tabla(["País"] + [str(a) for a in anios], filas, "i" + "d" * len(anios))}
"""


def cap24() -> str:
    filas = []
    for h in SIS["hipotesis"]:
        ci = ""
        if h.get("n1") and h.get("r1") is not None and h.get("k1") is not None:
            lo, hi = wilson(int(h["k1"]), int(h["n1"]))
            ci = f"{pct(lo)} – {pct(hi)}"
        filas.append([h["id"], h["family"], h["test"][:44], num(h["n1"]), num(h["n0"]),
                      pp(h["diff"]) if h.get("diff") is not None else "—",
                      fp(h.get("q")), ci, h["status"]])
    return f"""## Apéndice D. Las {num(len(filas))} hipótesis, con su prueba

| Campo | Significado |
|---|---|
| n1 / n0 | observaciones con y sin la característica |
| Δ | diferencia de tasa de primer lugar (sí − no) |
| q | p-valor corregido por Benjamini–Hochberg |
| IC | intervalo de Wilson al 95 % para la tasa del grupo «sí» |

{tabla(["ID", "Familia", "Prueba", "n1", "n0", "Δ", "q", "IC 95 %", "Estado"], filas, "iidddssss")}
"""


def cap25() -> str:
    fichas = []
    vistos = set()
    for r in sorted(TXT, key=lambda x: (x["year"] or 0, x["place_best"] or 9), reverse=True):
        if r["place_best"] != 1 or r["video_id"] in vistos:
            continue
        p = TRANS / f"{r['video_id']}.json"
        if not p.exists():
            continue
        try:
            t = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        txt = (t.get("text") or "").strip()
        if len(txt.split()) < 40:
            continue
        vistos.add(r["video_id"])
        frag = " ".join(txt.split()[:85])
        fichas.append(f"""**{r['year']} · {(r['team'] or '').strip()} · {(r['sede'] or '').title()}**

*Desafío:* {(r['challenge_name'] or '').title()}
*Duración:* {num(r['duration_s'], 0)} s · *Palabras:* {num(r['text_words'])} · *Fuente:* {t.get('caption_source', '—')}

> {frag}…

""")
        if len(fichas) >= 48:
            break
    return f"""## Apéndice E. Cuarenta y ocho aperturas de guiones premiados

Fragmentos literales de los primeros 85 palabras de guiones que obtuvieron primer lugar.
Sirven para leer el registro en primera persona: qué dicen, cómo empiezan, cuánto tardan en
llegar al problema.

{''.join(fichas) if fichas else '_Sin transcripciones disponibles._'}

**Observación al leerlos en serie.** Casi todos empiezan presentando al equipo o al proyecto.
Muy pocos abren con el problema. Es la evidencia cualitativa que respalda la recomendación
del capítulo 18.
"""


def cap26() -> str:
    return f"""## Apéndice F. Estructura del repositorio y comandos

### F.1 Archivos del banco

| Ruta | Contenido |
|---|---|
| `research/sirli/winners.jsonl` | maestro: {num(len(WINNERS))} premios, un JSON por línea |
| `research/sirli/winners.csv` | la misma tabla para planilla (separador `;`, BOM) |
| `research/sirli/video_index.json` | índice por video con todos sus premios |
| `research/sirli/manifest.json` | conteos, hashes y URLs de origen |
| `research/sirli/raw/` | HTML original comprimido, por colección y año |
| `research/sirli/meta/videos.jsonl` | metadatos de YouTube |
| `research/sirli/meta/thumbs/` | miniaturas descargadas |
| `research/sirli/transcripts/` | una transcripción por video |
| `research/sirli/frames/` | hojas de contacto 3×2 |
| `research/sirli/analisis/dataset_videos.csv` | dataset de trabajo, una fila por edición |
| `research/sirli/analisis/audio.csv` | rasgos de audio por video |
| `research/sirli/analisis/sistemico.json` | resultados crudos de las {num(len(HIP))} hipótesis |
| `research/sirli/analisis/figuras/` | todas las figuras del libro |
| `research/sirli/excel/ganadores_sirli.xlsx` | libro de Excel con 5 hojas |

### F.2 Comandos

```
# 1. registro
python scripts/scrape_ganadores_sirli.py --refresh

# 2. metadatos y miniaturas
python scripts/sirli_meta.py --scope all --workers 8
python scripts/sirli_thumbs.py

# 3. transcripción local (con rasgos de audio)
python scripts/sirli_asr.py --scope all --collection sede --model small

# 4. fotogramas
python scripts/sirli_videos.py frames --queue-file research/sirli/video_queue_frames.jsonl

# 5. análisis
python scripts/sirli_dataset.py
python scripts/sirli_visual_stats.py
python scripts/sirli_figuras.py
python scripts/sirli_modelo.py
python scripts/sirli_probabilidad.py
python scripts/sirli_sistemico.py
python scripts/sirli_resumen_ejecutivo.py
python scripts/sirli_excel.py

# 6. este libro
python scripts/sirli_libro.py
```

### F.3 Convenciones

- Fechas en UTC, formato ISO.
- Números en español: coma decimal, punto de miles.
- Toda cifra del libro se calcula al vuelo; el documento no se edita a mano.
"""


def cap27() -> str:
    return f"""## Apéndice G. Índice de figuras

| Figura | Contenido | Capítulo |
|---|---|---|
| fig01 | Distribución de duración por puesto | 6 |
| fig02 | Proporción dentro del tope de 120 s | 6 |
| fig03 | Mapa de calor año × colección | 3 |
| fig04 | Premios por país | 4 |
| fig05 | Desafíos frecuentes y concentración | 5 |
| fig06 | Longitud de la descripción | 6 |
| fig07 | Marcadores del guion | 13 |
| fig08 | Duración mediana por año | 15 |
| fig09 | Medidas visuales de miniaturas | 12 |
| fig10 | Medidas visuales de fotogramas | 12 |
| fig11 | Fuerza de asociación con ganar | 9 |
| fig12 | Saturación del desafío | 9 |
| fig13 | Tasa por país y año | 9, 16 |
| fig14 | Balance de hipótesis | 8 |
| fig15 | Gradiente de delegación | 9 |
| fig16 | Probabilidad absoluta de primer lugar | 20 |
"""



def _deciles(vals: list[float]) -> list[str]:
    vals = sorted(v for v in vals if v is not None)
    if len(vals) < 10:
        return ["—"] * 9
    q = statistics.quantiles(vals, n=10)
    return [num(x, 0) for x in q]


def cap28() -> str:
    bloques = []
    for etiqueta, campo, dec in [("Duración (s)", "duration_s", 0),
                                 ("Descripción (caracteres)", "desc_len", 0),
                                 ("Palabras del guion", "text_words", 0),
                                 ("Velocidad (palabras/min)", "wpm", 0),
                                 ("Vistas", "views", 0),
                                 ("Tamaño del desafío", "challenge_size", 0)]:
        vals = [r.get(campo) for r in CORE if r.get(campo)]
        d = _deciles(vals)
        bloques.append([etiqueta, num(min(vals), dec), *d, num(max(vals), dec), num(len(vals))])
    cab = ["Variable", "Mín"] + [f"D{i}" for i in range(1, 10)] + ["Máx", "n"]
    return f"""## Apéndice H. Estadística descriptiva

Deciles de las variables continuas del corte válido (sede 2021–2026). D5 es la mediana.

{tabla(cab, bloques, "i" + "d" * (len(cab) - 1))}

### H.1 Cómo leer los deciles

El decil 1 y el 9 muestran los extremos reales del corpus, no los atípicos aislados: la
duración va de videos de segundos a videos de más de diez minutos, y esa cola es la que
explica por qué la media de duración es más alta que la mediana. Para cualquier afirmación
sobre «el video típico» este libro usa la mediana, no la media.

### H.2 Distribuciones asimétricas

Vistas y descripción son asimétricas a la derecha: la mayoría está en valores bajos y unos
pocos casos muy altos estiran la media. Por eso los contrastes de los capítulos 8 y 9 usan
medianas y pruebas no paramétricas, y las variables continuas se usan en terciles.

### H.3 Variables que no se usan como predictoras

| Variable | Motivo |
|---|---|
| vistas | consecuencia de la difusión posterior, no causa del premio (Q5) |
| likes | ídem |
| comentarios | ídem |
| posición en el listado | artefacto de orden del scraping |

Incluirlas habría producido un modelo con ROC alto y sin valor: predecir el pasado con
información del futuro.
"""


def cap29() -> str:
    temas = Counter(r.get("challenge_theme") or "otro" for r in DF)
    filas = []
    for t, n in temas.most_common():
        g = [r for r in CORE if (r.get("challenge_theme") or "otro") == t]
        k, nn, tasa_t = tasa(g)
        lo, hi = wilson(k, nn) if nn else (0, 0)
        desafios = {r["challenge_name"] for r in DF if (r.get("challenge_theme") or "otro") == t}
        filas.append([t.title(), num(n), num(len(desafios)), num(nn),
                      pct(tasa_t) if nn else "—", f"{pct(lo)} – {pct(hi)}" if nn >= 20 else "—"])
    return f"""## Apéndice I. Catálogo de temas

Los {num(len(temas))} temas en que se clasificaron los desafíos, con su volumen y su tasa de
primer lugar en el corte válido. La clasificación es heurística (palabras clave sobre el
enunciado) y sirve para describir la agenda del certamen, no para predecir.

{tabla(["Tema", "Ediciones", "Desafíos", "Ediciones 2021+", "Tasa de 1.º", "IC 95 %"], filas, "idddddd")}

### I.1 Lectura

Ningún tema se separa del resto de forma significativa: los intervalos se solapan casi
todos. La agenda del rally —residuos, agua, vivienda, energía, salud, inclusión— no premia
distinto. Lo que cambia entre temas es el **volumen de competencia**, y ese volumen tampoco
mueve la probabilidad (cap. 9).

### I.2 Los temas que casi no existen

Hay temas con muy pocas ediciones: turismo, género, movilidad. Un equipo podría pensar que
elegirlos es una ventaja por escasez. Los datos no lo respaldan: la tasa de primer lugar en
esos temas no es mayor, y la muestra es demasiado pequeña para detectar diferencias
pequeñas. La escasez temática es una intuición razonable y una hipótesis sin evidencia.

### I.3 Cómo se clasificó

Se asignó cada enunciado al primer tema cuya lista de palabras clave apareciera en el texto.
Un enunciado puede tener varias palabras clave; se conserva la primera coincidencia en el
orden de la lista, que va de lo específico a lo general. Es una regla simple, reproducible y
declaradamente imperfecta.
"""


def cap31() -> str:
    return f"""## Apéndice J. Preguntas frecuentes

**¿Cuál es la probabilidad de ganar el rally?**
No se puede calcular con este corpus. El sitio solo publica a los tres premiados, así que no
hay denominador. Lo que sí se puede decir: entre los premiados de sede, el {pct(tasa(CORE)[2])}
quedó primero en su desafío.

**¿Conviene elegir un desafío poco concurrido?**
No hay evidencia de que ayude. Las tasas son planas en todo el rango de tamaños de desafío
(cap. 9). La creencia contraria, muy extendida, nació de un error de cálculo documentado en
el capítulo 11.

**¿Cuánto debe durar el video?**
Entre 100 y 120 segundos. Por debajo de 110 la tasa de primeros cae
({pct(HIP['H42']['r1'])} contra {pct(HIP['H42']['r0'])}); por encima de 120 no mejora nada.
El óptimo observado es 112–119 segundos.

**¿Los subtítulos importan?**
No se encontró asociación (H23). Son buena práctica de accesibilidad, no palanca de premio.

**¿Repetir el rally ayuda?**
No. Los equipos con premios previos tienen {pct(HIP['H08']['r1'])} de primeros contra
{pct(HIP['H08']['r0'])} de los que no tienen.

**¿La universidad importa?**
La localía no muestra efecto (H09). Lo que importa es cuántos equipos lleva tu sede, y eso es
aritmética, no prestigio.

**¿Sirve usar una cifra en el guion?**
Sin evidencia después de corregir el marcador (H38). Una cifra bien elegida ayuda a entender
el problema; no hay dato de que sume puntos.

**¿Debo mostrar al equipo en cámara?**
No hay evidencia de que las caras distingan. La intuición de la literatura es que la cara
genera confianza; los datos del SIRLI no permiten confirmarlo ni negarlo.

**¿Y la música?**
No se midió separada de la voz. La recomendación prudente es que no compita con la narración.

**¿Puedo usar el Excel para otra cosa?**
Sí: `research/sirli/excel/ganadores_sirli.xlsx` tiene una fila por premio con la solución
extraída, el desafío, el tema y el enlace. Es la forma más rápida de buscar precedentes de un
desafío concreto.

**¿Por qué el libro no da una receta de guion probada?**
Porque el diseño no lo permite. Para probar que un guion gana habría que comparar ganadores
con perdedores del mismo desafío, y los perdedores no están publicados.

**¿Qué haría falta para cerrar esa brecha?**
La lista de participantes de una sola sede y una edición. Con eso se podría estimar un efecto
real; sin eso, todo lo que se diga sobre «qué hace ganar» es correlación entre premiados.
"""


def cap32() -> str:
    return f"""## Apéndice K. Protocolo para analizar tu propio video

Una lista de verificación derivada de los capítulos anteriores, pensada para aplicarse en
las últimas dos horas antes de entregar.

### K.1 Antes de grabar

- [ ] La solución cabe en una frase de menos de 20 palabras.
- [ ] El problema está localizado: un lugar, una persona, una cifra verificable.
- [ ] Hay una imagen que se puede mostrar funcionando (prototipo, mapa, antes/después).
- [ ] Está identificado el usuario real al que se le puede pedir 8 segundos de testimonio.
- [ ] El nombre del proyecto está decidido y no se parece a ningún otro del registro.

### K.2 Durante la grabación

- [ ] Audio grabado con micrófono, no con el del celular a un metro.
- [ ] Sin música de fondo, o con música al 15 % del volumen de la voz.
- [ ] Voz a ritmo natural: 170–185 palabras por minuto.
- [ ] El prototipo se graba antes que al equipo: es lo primero que se debe tener.
- [ ] Se grabaron 3 tomas del cierre: se elegirá la más seca.

### K.3 En la edición

- [ ] El problema entra antes del segundo 10.
- [ ] No hay saludo institucional ni lista de agradecimientos al inicio.
- [ ] Dura entre 112 y 119 segundos.
- [ ] El nombre del proyecto aparece una sola vez, en el cierre.
- [ ] El último plano es la imagen más fuerte, no el logo.
- [ ] Hay subtítulos quemados o en YouTube (accesibilidad, no premio).

### K.4 En la ficha de YouTube

- [ ] Título con más de 5 palabras y sin el año del rally.
- [ ] Descripción de 80–200 caracteres que **nombra el proyecto** y dice qué hace.
- [ ] Enlace al repositorio o a la demo, si existe.
- [ ] Miniatura elegida a mano (aunque no discrimine, es cortesía con el jurado).

### K.5 La prueba del jurado cansado

Ver el video una vez, sin pausa, después de haber visto otros cinco. Responder:

1. ¿Qué problema resuelve? (si no se responde en una frase, rehacer el tramo 2)
2. ¿Qué hace exactamente? (si no se responde, rehacer el tramo 3)
3. ¿Quién lo usa? (si no se responde, falta el testimonio)
4. ¿Qué recuerdo dentro de una hora? (si la respuesta es «nada», falta el cierre)

### K.6 Qué no hacer en las dos últimas horas

- No cambiar la solución.
- No regrabar todo por un detalle de imagen.
- No añadir música nueva sin escucharla en el equipo donde se editó.
- No subir sin ver el video completo una vez, de principio a fin, en el mismo dispositivo.
"""


def cap33() -> str:
    """Apéndice L — las 182 sedes de Nicaragua con su banda de probabilidad."""
    filas = []
    for e in sorted(PROB["sedes_nicaragua"], key=lambda x: (-x["grupos"], x["sede"])):
        anios = e.get("anios") or []
        rango = f"{min(anios)}–{max(anios)}" if len(anios) > 1 else (str(anios[0]) if anios else "—")
        filas.append([e["sede"].title(), num(e["grupos"]), num(e["premios"]),
                      num(e["ediciones"]), rango, pct(e["p_techo"]), pct(e["p_media"]),
                      pct(e["p_grande"]), num(e["equipos_por_grupo"], 1)])
    return f"""## Apéndice L. Las {num(len(filas))} sedes de Nicaragua, con su banda de probabilidad

Cada fila es una sede nicaragüense con al menos dos grupos sede-categoría documentados desde
2021. «Grupos» es el número de celdas (año × sede × categoría) que esa sede ha disputado;
«Premios» son los lugares entregados en esas celdas; «Equipos/grupo» es el tamaño medio del
grupo en el escenario de ocho equipos por grupo completo. Las tres columnas de probabilidad
son la banda del capítulo 20 con tres supuestos: techo (tres equipos por categoría), media
(ocho) y sede grande (quince).

{tabla(["Sede", "Grupos", "Premios", "Ediciones", "Años", "P(1.º) techo",
        "P(1.º) media", "P(1.º) grande", "Equipos/grupo"], filas, "lddddlddd")}

Cómo leerla: las sedes de arriba son las que más veces han competido, no necesariamente las
que más ganan. La probabilidad no baja porque la sede sea «peor», baja porque tiene más
equipos por categoría. Una sede con seis grupos y un solo premio por grupo es una sede donde
la competencia interna es baja; una sede con seis grupos y tres premios por grupo es una sede
llena. Ambas pueden tener la misma probabilidad media si el número de equipos coincide.
"""


def cap39() -> str:
    return f"""---

### Colofón

Este libro se generó con `python scripts/sirli_libro.py` a partir de
{num(len(WINNERS))} premios, {num(len(META))} fichas de metadatos,
{num(len(TXT))} transcripciones, {num(len(list((SIRLI / 'frames').glob('*.jpg'))))} hojas de
fotogramas y {num(len(HIP))} pruebas de hipótesis.

Ninguna cifra fue escrita a mano: si el registro cambia, el libro cambia.

**Cierre.** Un rally no se gana con un truco de video. Se gana con una solución que se
entienda en dos minutos, en un desafío donde la competencia interna sea manejable, y con un
jurado que recuerde una imagen y una frase. Este libro pone números a esa intuición, y dice
con claridad dónde los números no alcanzan.
"""


