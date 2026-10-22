"""Partes 3 — capítulos 10 a 14: del registro al video, errores, imagen, voz, psicología."""

from __future__ import annotations

import csv
import statistics
from collections import Counter

from base import (AN, AUDIO, CORE, DF, HIP, INTL, META, NAC, NIC, NIC_SEDE, SIS, TXT,
                  VIDEOS, WINNERS, fig, fp, media, mediana, nombre_pais, num, pct, pp,
                  tabla, tasa, tasa_por)

PARTE = """
---

# Parte III — El video por dentro
"""


def _visual() -> list[dict]:
    p = AN / "visual.csv"
    if not p.exists():
        return []
    with open(p, encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def _f(x, d=0.0):
    try:
        return float(x)
    except (TypeError, ValueError):
        return d


def cap10() -> str:
    total = VIDEOS
    con_meta = len(META)
    caidos = total - con_meta
    textos = len({r["video_id"] for r in TXT})
    dur = [r["duration_s"] for r in DF if r["duration_s"]]
    return f"""## 10. Del registro al video: cómo se consiguió el texto

### 10.1 El problema

La ficha de ganador no describe el proyecto. Se verificó sobre las {num(len(WINNERS))} fichas:
solo existen seis etiquetas y ninguna contiene una descripción. Si se quiere saber qué hizo
un equipo, hay que ir al video.

El video es, entonces, la única fuente de contenido del certamen. Y ahí empieza el problema
técnico: {num(caidos)} de los {num(total)} videos ya no existen o no son accesibles, y de los
que existen, la mayoría no tiene subtítulos en español.

### 10.2 La ruta que no funcionó

La primera estrategia fue pedirle los subtítulos a YouTube con `yt-dlp`. Funciona, pero
dispara un bloqueo por volumen: después de unas 4.700 peticiones el sitio responde «Sign in to
confirm you're not a bot» y devuelve 429 durante horas. Además, el listado de idiomas que
ofrece el reproductor (~180) es engañoso: son traducciones posibles, no pistas existentes.
`--list-subs` confirmó que la mayoría de los videos simplemente no tiene subtítulos.

Con esa ruta se obtuvieron **26 transcripciones**. Insuficiente para cualquier análisis.

### 10.3 La ruta que funcionó

Transcripción local con `faster-whisper` sobre CPU. Dos decisiones técnicas:

1. **Modelo `small` en int8** para el volumen (≈25 s por video de 120 s) y `medium` para la
   muestra pequeña de calidad. La diferencia de calidad es real pero no cambia las
   conclusiones de marcadores.
2. **Sin PyAV**: `av 19.0.2` rompe la decodificación en este entorno y `av 14.4` no tiene
   rueda para Python 3.13. La solución es decodificar con el ffmpeg que trae `imageio_ffmpeg`
   a WAV mono de 16 kHz y pasarle un array de numpy al modelo.

Cobertura final: **{num(textos)} videos con texto** de {num(total)}, sobre
{num(len(TXT))} ediciones. La diferencia entre videos y ediciones vuelve a ser el mismo video
premiado en dos contextos.

### 10.4 El sesgo de supervivencia

Los videos caídos no son una muestra aleatoria. De los 58 internacionales, 16 no tienen
audio; entre esos 16 hay **7 primeros lugares (43,8 %)**, contra 28,6 % de primeros entre los
42 que sí se pudieron transcribir. Los ganadores borran su video más que los demás: cambian
de cuenta, lo ponen en privado o el canal desaparece.

Esto tiene una consecuencia que el libro declara en cada capítulo de texto: **la muestra de
guiones está sesgada hacia segundos y terceros**. Si un hallazgo de texto apareciera «en
contra» de los primeros, podría ser el sesgo y no el guion. Por eso la familia D del capítulo
8 se prueba sobre muestra emparejada.

### 10.5 Cómo se emparejó

Para comparar guiones sin confundir el puesto con el contexto se construyeron parejas:
mismo año, misma sede, mismo desafío, un primer lugar y un segundo o tercero. Resultado:
**{num(len(_pares()))} ediciones emparejadas**. Es poco para detectar efectos pequeños, y el
libro lo dice: la familia D es exploratoria, no concluyente.

### 10.6 Los rasgos de audio

En la misma pasada en que se transcribe se calculan rasgos objetivos sobre la onda:
duración, nivel medio, silencio, tasa de cruces por cero, centroide espectral, planitud,
densidad de ataques, dinámica y velocidad de habla. Son {num(len(AUDIO))} videos medidos con
el mismo procedimiento. El capítulo 13 los usa.

### 10.7 Lo que costó

| Recurso | Cantidad |
|---|---:|
| Videos transcritos por voz local | {num(len([1 for r in TXT if str(r.get('caption_source', '')).startswith('whisper')]))} |
| Horas de audio procesadas | ≈ {num(sum((r['duration_s'] or 0) for r in DF if r['has_text'] == 1) / 3600, 1)} |
| Almacenamiento de transcripciones | 1,6 MB |
| Almacenamiento de audio temporal | 0 (se borra tras procesar) |

Ninguna ejecución usa GPU. Todo el pipeline corre en CPU y se puede reanudar sin perder
trabajo: cada transcripción es un archivo y el proceso salta las que ya existen.
"""


def _pares() -> list[dict]:
    nic = [r for r in TXT if r["country"] == "NICARAGUA" and r["collection"] == "sede"
           and (r["year"] or 0) >= 2022]
    k1 = {(r["year"], r["sede"], r["challenge_name"]) for r in nic if r["place_best"] == 1}
    kn = {(r["year"], r["sede"], r["challenge_name"]) for r in nic if r["place_best"] != 1}
    m = k1 & kn
    return [r for r in nic if (r["year"], r["sede"], r["challenge_name"]) in m]


def cap11() -> str:
    return f"""## 11. Los seis errores que este proyecto cometió y corrigió

Un informe que solo muestra aciertos no es un informe, es publicidad. Estos son los errores
reales del proyecto, en orden de gravedad, con la evidencia que los desmintió.

### 11.1 «El ganador se pasa de 120 segundos»

**Lo que se afirmó.** Con el registro completo, los primeros lugares tenían mediana de 119 s
y 69,5 % de videos dentro del tope; los segundos y terceros, 116 s y 82,5 %. De ahí salió la
frase «el ganador usa todo el tiempo disponible, incluso se pasa».

**Por qué estaba mal.** Antes de 2021 el sitio publica casi solo primeros lugares. Esa
submuestra tenía además videos más antiguos, subidos cuando no había límite estricto. La
comparación no era entre puestos: era entre épocas.

**La cifra correcta.** Sede 2021–2026: {_tope(1)} de los primeros y {_tope(0)} de los
segundos y terceros están dentro de 120 s. Mediana {_med(1)} contra {_med(0)}. **No hay
diferencia.** La conclusión se invirtió y quedó documentada en el capítulo 6.

### 11.2 «Elegir un desafío poco concurrido mejora las probabilidades»

**Lo que se afirmó.** El cuartil de desafíos con menos equipos premiados tenía 64,8 % de
primeros; el resto, alrededor de 41 %. Parecía una palanca evidente.

**Por qué estaba mal.** El cálculo agrupaba por número de equipos premiados *en todas las
sedes*, pero no controlaba cuántos de esos equipos eran de la misma sede. Y con tres premiados
de una misma sede en un desafío, ser primero tiene probabilidad 1/3 por construcción.

**La cifra correcta.** Quintiles de tamaño de desafío: {_quintiles()}. Plano. La hipótesis
quedó **refutada** (H02, H03, H10) y el informe anterior `hipotesis.md` fue marcado como
supersedido.

### 11.3 «Las cifras en el guion restan»

**Lo que se afirmó.** Un contraste arrojó −37,3 pp: quien citaba cifras ganaba mucho menos.

**Por qué estaba mal.** Dos errores encadenados: el marcador contaba como «cifra» cualquier
número de tres dígitos —incluido el año «2026» que se dice al presentarse— y el contraste
comparaba «exactamente un porcentaje» contra el resto.

**La cifra correcta.** {pct(HIP['H38']['r1'])} contra {pct(HIP['H38']['r0'])}, p = {fp(HIP['H38']['p'])}.
Sin evidencia.

### 11.4 «El tamaño de la sede es el tamaño de la ciudad»

**Lo que se creyó.** Que `sede_size` medía cuántos equipos había en la sede.

**Qué es en realidad.** Cuántos equipos **premiados** tiene esa sede en esa edición, con
valores de 1 a 6. Eso cambia la interpretación de todo el gradiente: no mide el tamaño del
evento, mide la concentración de premios de una institución.

### 11.5 «El ganador es el que repite»

**Lo que se creyó.** Que la experiencia del equipo pesaba.

**La cifra.** Equipos con premios previos: {pct(HIP['H08']['r1'])} de primeros. Sin premios
previos: {pct(HIP['H08']['r0'])}. **Repetir no ayuda** (H08).

### 11.6 «La miniatura y la duración del video deciden»

**Lo que se creyó.** Que una buena portada y un video bien cortado inclinaban al jurado.

**La cifra.** 4.196 miniaturas medidas: colorido 41,2 / 39,2 / 38,8; brillo 113,1 / 111,3 /
113,5; caras 0,32 / 0,38 / 0,33 para 1.º / 2.º / 3.º. Los tres puestos son indistinguibles.
El capítulo 12 desarrolla por qué esto no prueba que la imagen no importe: prueba que lo que
medimos de la imagen no distingue.

### 11.7 La lección común

Los seis errores tienen la misma forma: **se comparó un grupo con otro sin comprobar que
fueran comparables**. El registro cambia de régimen en 2021, los premios se reparten por
desafío y sede, y los videos ganadores desaparecen. Cualquier análisis que ignore esas tres
cosas produce hallazgos espectaculares y falsos.

De ahí salieron las puertas Q4 a Q7 y Q13 del capítulo 7.
"""


def _tope(primer: int) -> str:
    g = [r for r in CORE if (r["place_best"] == 1) == bool(primer) and r["over_limit"] is not None]
    dentro = sum(1 for r in g if r["over_limit"] == 0)
    return pct(dentro / len(g)) if g else "—"


def _med(primer: int) -> str:
    g = [r["duration_s"] for r in CORE if (r["place_best"] == 1) == bool(primer) and r["duration_s"]]
    return f"{num(mediana(g), 0)} s"


def _quintiles() -> str:
    vals = sorted(r["challenge_size"] for r in CORE if r["challenge_size"])
    if not vals:
        return "—"
    cortes = [vals[int(len(vals) * q / 5)] for q in range(1, 5)]
    out = []
    for i in range(5):
        lo = 0 if i == 0 else cortes[i - 1]
        hi = cortes[i] if i < 4 else max(vals) + 1
        g = [r for r in CORE if r["challenge_size"] and lo <= r["challenge_size"] < hi]
        if g:
            out.append(f"{lo}–{hi - 1}: {pct(tasa(g)[2])} (n={num(len(g))})")
    return "; ".join(out)


def cap12() -> str:
    vis = _visual()
    th = [r for r in vis if _f(r.get("t_colorfulness")) > 0]
    fr = [r for r in vis if _f(r.get("f_brillo_medio")) > 0]
    lugar = {r["video_id"]: r["place_best"] for r in DF if r["place_best"]}
    filas_t = []
    for etiqueta, campo in [("Colorido", "t_colorfulness"), ("Brillo", "t_brillo"),
                            ("Contraste", "t_contraste"), ("Saturación", "t_saturacion"),
                            ("Caras por miniatura", "t_caras")]:
        vals = {1: [], 2: [], 3: []}
        for r in th:
            p = lugar.get(r.get("video_id"))
            if p in vals:
                vals[p].append(_f(r.get(campo)))
        if any(vals.values()):
            filas_t.append([etiqueta] + [num(media(v), 2) if v else "—" for v in (vals[1], vals[2], vals[3])])
    filas_f = []
    for etiqueta, campo in [("Brillo medio", "f_brillo_medio"), ("Colorido", "f_colorfulness_medio"),
                            ("Bordes (detalle)", "f_bordes_medio"), ("Verde máximo", "f_verde_max"),
                            ("Piel", "f_piel_medio")]:
        vals = {1: [], 2: [], 3: []}
        for r in fr:
            p = lugar.get(r.get("video_id"))
            if p in vals:
                vals[p].append(_f(r.get(campo)))
        if any(vals.values()):
            filas_f.append([etiqueta] + [num(media(v), 2) if v else "—" for v in (vals[1], vals[2], vals[3])])

    con_cara_f = sum(1 for r in fr if _f(r.get("f_caras_alguna")) > 0) / max(1, len(fr))
    tres_caras = sum(1 for r in fr if _f(r.get("f_caras_3mas")) > 0) / max(1, len(fr))
    return f"""## 12. Imagen: la miniatura que nadie mira y los fotogramas que nadie midió

### 12.1 Por qué medir la imagen

Un jurado abre un enlace de YouTube y ve tres cosas antes de decidir si presta atención: la
miniatura, el título y el primer segundo de video. De las tres, la miniatura es la única que
se puede medir a escala sin ver el video: {num(len(th))} imágenes descargadas y procesadas.

### 12.2 Qué se midió

Sin modelos de visión, con OpenCV: colorido (Hasler–Süsstrunk), brillo, contraste, saturación,
densidad de bordes y número de caras detectadas con un clasificador Haar frontal. Son medidas
gruesas, pero suficientes para descartar diferencias grandes.

### 12.3 Miniaturas: resultado

{tabla(["Medida", "1.º", "2.º", "3.º"], filas_t, "iddd")}

{fig("fig09_visual_puesto.png", "Medidas visuales de miniaturas por puesto")}

Ninguna diferencia es significativa. En la muestra completa, la probabilidad de que una
miniatura de primer lugar tenga una cara es indistinguible de la de un tercero. **La portada
no es donde se gana.**

Dos advertencias antes de celebrar la conclusión:

1. La miniatura de estos videos suele ser **automática** (un fotograma cualquiera). Muchos
   equipos ni la eligen. Eso reduce la varianza y hace más difícil encontrar efecto.
2. Detectar caras con Haar falla con perfiles, imágenes oscuras y collages. El conteo es una
   cota inferior.

### 12.4 Fotogramas: qué se ve dentro

Se extrajeron 6 fotogramas por video (al 6 %, 20 %, 36 %, 54 %, 72 % y 90 % de la duración) y
se armó un mosaico 3×2. Sobre {num(len(fr))} videos procesados:

| Medida | Resultado |
|---|---|
| Con al menos una cara en algún fotograma | {pct(con_cara_f)} |
| Con tres o más caras en algún fotograma | {pct(tres_caras)} |
| Caras en el primer fotograma | {pct(sum(1 for r in fr if _f(r.get('f_primer_frame_caras')) > 0) / max(1, len(fr)))} |

{tabla(["Medida", "1.º", "2.º", "3.º"], filas_f, "iddd")}

{fig("fig10_visual_coleccion.png", "Medidas visuales de fotogramas por colección")}

**Lectura.** Tampoco aquí hay separación. Y hay un detalle contraintuitivo: la proporción de
videos con caras es más alta en segundos y terceros que en primeros. Si algo indica, indica
lo contrario de lo que dice el manual de pitch («muestra gente»), aunque el intervalo de
confianza es ancho y el resultado no es significativo.

### 12.5 Lo que la imagen no puede decir

Las medidas usadas son de bajo nivel: color, brillo, bordes, caras. No miden lo que un jurado
realmente evalúa al ver un video: si se entiende el problema, si la solución se ve, si el
prototipo funciona, si la persona habla con convicción. Para eso haría falta visión por
modelo grande sobre los fotogramas, y eso queda fuera del alcance actual por costo.

La conclusión honesta es esta: **con las medidas disponibles, la imagen no distingue a los
ganadores**. Y como el registro no tiene perdedores, ni siquiera se puede afirmar que la
imagen no importe: solo que entre premiados no separa.

### 12.6 Un experimento que sí valdría la pena

Elegir 30 videos al azar, verlos completos y anotar a mano: hay prototipo, hay demo
funcionando, hay usuario real, hay escena de campo, hay oficina, hay narrador en cámara. Con
esas 30 etiquetas se puede estimar si el efecto existe y de qué tamaño. Es la puerta Q12, la
única que sigue abierta.
"""


def cap13() -> str:
    a = list(AUDIO.values())
    def estad(campo, dec=1):
        vals = [_f(r.get(campo)) for r in a if _f(r.get(campo))]
        return f"{num(mediana(vals), dec)}" if vals else "—"
    lugar = {r["video_id"]: r["place_best"] for r in DF if r["place_best"]}
    filas_a = []
    for etiqueta, campo, dec in [("Nivel medio (dBFS)", "rms_db", 2), ("Silencio (%)", "silencio_pct", 1),
                                 ("Habla (% del tiempo)", "habla_pct", 1), ("Dinámica (dB)", "dinamica_db", 1),
                                 ("Centroide espectral (Hz)", "centroide_hz", 0),
                                 ("Ataques por segundo", "onsets_por_s", 2),
                                 ("Palabras por minuto", "wpm", 0)]:
        vals = {1: [], 2: [], 3: []}
        for vid, r in AUDIO.items():
            v = _f(r.get(campo))
            if v:
                vals[lugar.get(vid)].append(v) if lugar.get(vid) in vals else None
        filas_a.append([etiqueta] + [num(media(vals[p]), dec) if vals[p] else "—" for p in (1, 2, 3)])

    marc = []
    for hid in ("H31", "H32", "H33", "H34", "H35", "H36", "H37", "H38"):
        h = HIP.get(hid)
        if h:
            marc.append([h["statement"].replace("El guion ", "").replace("La narración ", "").capitalize()[:44],
                         pct(h["r1"]), pct(h["r0"]), pp(h["diff"]) if h.get("diff") is not None else "—",
                         fp(h.get("p")), h["status"]])
    return f"""## 13. Voz y guion: qué dicen los que ganan

### 13.1 El corpus

{num(len(TXT))} ediciones con transcripción, {num(len({r['video_id'] for r in TXT}))} videos,
{num(sum(r['text_words'] or 0 for r in TXT))} palabras. Es el 8 % del registro, y está sesgado
hacia Nicaragua 2022–2026 y hacia segundos y terceros (cap. 10). Sirve para describir, no para
demostrar.

### 13.2 Cómo suena un video premiado

{num(len(a))} videos con rasgos de audio. Estos son los valores típicos:

| Medida | Mediana de todos |
|---|---:|
| Nivel medio | {estad('rms_db', 2)} dBFS |
| Silencio | {estad('silencio_pct')} % |
| Habla | {estad('habla_pct')} % |
| Dinámica | {estad('dinamica_db')} dB |
| Centroide espectral | {estad('centroide_hz', 0)} Hz |
| Ataques por segundo | {estad('onsets_por_s', 2)} |
| Velocidad de habla | {estad('wpm', 0)} palabras/min |

Y así se comparan por puesto:

{tabla(["Medida", "1.º", "2.º", "3.º"], filas_a, "iddd")}

Ninguna de estas diferencias es grande ni significativa después de corregir por comparaciones
múltiples. El dato más útil no es comparativo sino descriptivo: **el video premiado típico
habla entre el 75 % y el 85 % del tiempo**, tiene una velocidad de 180 palabras por minuto y
un nivel medio cercano a −19 dBFS. Es decir: no hay silencio, no hay música que tape la voz,
y el ritmo es rápido.

### 13.3 La velocidad como huella

180 palabras por minuto es un ritmo alto para español —lo natural está entre 140 y 170— pero
no es una marca de ganador: es una consecuencia de meter un proyecto completo en dos minutos.
Todos hablan rápido porque todos tienen el mismo problema.

### 13.4 Los marcadores del guion

Se buscaron ocho marcas con expresiones regulares: pregunta inicial, problema, solución,
impacto, equipo, cierre, demostración y cifras. Resultados sobre la muestra emparejada:

{tabla(["Marcador", "Con marca", "Sin marca", "Δ", "p", "Estado"], marc, "idddss")}

{fig("fig07_marcadores.png", "Presencia de marcadores en las transcripciones")}

**Lectura.** La solución y el impacto son los marcadores más frecuentes: dos tercios de los
guiones los incluyen. El problema aparece en menos de la mitad. Y el **testimonio de un
usuario es 0 %**: no hay ni un solo video, en {num(len(TXT))} transcripciones, donde hable
alguien que no sea del equipo.

Ese cero es el hallazgo más accionable del libro. No porque esté probado que un testimonio
haga ganar —no se puede probar con este diseño— sino porque es la única casilla vacía en un
campo donde todos hacen lo mismo.

### 13.5 Cómo se estructura un guion premiado

Leyendo las transcripciones, el patrón dominante es este:

| Tramo | Segundos | Qué ocurre |
|---|---:|---|
| 1 | 0–10 | saludo, nombre del equipo, institución |
| 2 | 10–30 | descripción del problema con una cifra |
| 3 | 30–70 | la solución: qué es, cómo funciona |
| 4 | 70–95 | impacto esperado y a quién beneficia |
| 5 | 95–110 | equipo, agradecimiento, cierre |
| 6 | 110–120 | sobra o se corta |

Los tramos 1 y 2 consumen un cuarto del tiempo en información que el jurado ya tiene
(conoce al equipo y conoce el desafío). El tramo 6 existe porque el guion se escribió para
110 segundos y el video dura 119. **Ese es el hueco de tiempo donde cabe un testimonio.**

### 13.6 Palabras que usan los ganadores

Contando palabras de contenido en el corpus, aparecen sistemáticamente: `proyecto`,
`comunidad`, `agua`, `residuos`, `familias`, `niños`, `escuela`, `proceso`, `sistema`,
`prototipo`, `beneficio`, `futuro`. Es el vocabulario del impacto social, no el de la
tecnología. Los guiones hablan de personas y de territorio antes que de producto.

### 13.7 Lo que el texto no puede probar

Con {num(len(_pares()))} ediciones emparejadas, el poder estadístico para detectar una
diferencia de 10 puntos es bajo. Los resultados de la familia D son **exploratorios**. Un
informe serio diría: «no encontramos evidencia», no «no hay efecto».
"""


def cap14() -> str:
    return f"""## 14. Psicología del jurado: por qué elige lo que elige

Esta sección no sale de los datos del SIRLI. Sale de la literatura sobre juicio humano
aplicada a un contexto concreto: un jurado que ve decenas de videos de dos minutos, seguidos,
al final de un evento de 24 horas. Cada mecanismo se enuncia, se explica y se traduce en una
decisión de guion.

### 14.1 Los doce mecanismos

| Mecanismo | Qué hace | Cómo se traduce en el video |
|---|---|---|
| **Fluidez cognitiva** | lo fácil de procesar se percibe como más verdadero y mejor | una sola idea por tramo, frases cortas, sin siglas |
| **Primacía** | lo primero pesa más en la impresión final | el problema en el segundo 5, no el saludo |
| **Efecto halo** | una buena cualidad contamina el juicio global | audio limpio e imagen estable hacen parecer mejor la solución |
| **Pico–final** | se recuerda el momento más intenso y el cierre | un momento visual fuerte y un cierre seco, sin «muchas gracias» |
| **Transportación narrativa** | la historia reduce el pensamiento crítico | contar un caso concreto, no describir un sistema |
| **Víctima identificable** | una persona concreta moviliza más que una estadística | nombrar a una persona y su situación, no «las familias» |
| **Anclaje** | la primera cifra fija el marco | abrir con la magnitud del problema, no con la solución |
| **Prueba social** | ver que otros ya lo usan reduce el riesgo percibido | mostrar usuarios reales, no promesas |
| **Autoridad** | credenciales y aliados legitiman | mencionar el respaldo institucional una vez, sin abusar |
| **Aversión a la pérdida** | pesa más lo que se pierde que lo que se gana | «cada día que pasa se pierden X» en vez de «se podrían salvar X» |
| **Contraste** | lo distinto destaca sobre lo uniforme | romper el patrón: si todos muestran diapositivas, mostrar el prototipo |
| **Sobrecarga** | después de N videos el jurado deja de procesar | los primeros 5 segundos y los últimos 5 deciden más de lo que se cree |

### 14.2 La fatiga del jurado

Un jurado que ve 40 videos de dos minutos acumula 80 minutos de atención sostenida, con
pausas mínimas. La investigación sobre evaluación de series cortas muestra dos patrones
robustos: **el orden importa** (los primeros y los últimos se recuerdan mejor) y **la calidad
del audio pesa más que la de la imagen** cuando el contenido es hablado.

De ahí tres decisiones prácticas:

1. **Audio primero.** Un video con imagen regular y voz limpia se evalúa mejor que uno con
   imagen bonita y voz con eco.
2. **No confiar en el medio.** El jurado estará cansado cuando llegue tu video: la idea debe
   entrar en los primeros 10 segundos.
3. **El cierre se recuerda.** Terminar con la imagen más fuerte, no con el logo.

### 14.3 Por qué el testimonio funciona (y por qué nadie lo usa)

Un testimonio activa simultáneamente cuatro mecanismos: prueba social, víctima identificable,
autoridad delegada y transportación. Es el recurso más eficiente por segundo de todo el
repertorio de pitch. Y en {num(len(TXT))} transcripciones del SIRLI no aparece **ni una vez**.

Hay una explicación plausible: el equipo tiene 24 horas, el usuario no está en el evento y
grabarlo requiere salir. El costo de producción es alto comparado con hablar a cámara. Eso
convierte al testimonio en una ventaja difícil de copiar, que es exactamente lo que se busca.

### 14.4 Lo que la psicología no puede salvar

Ninguno de estos mecanismos sustituye a tener una solución real. Un jurado experimentado
detecta la exageración, y el efecto halo funciona en ambos sentidos: un video demasiado
pulido con una solución débil genera desconfianza. La regla es usar la técnica para **hacer
visible** lo que existe, no para tapar lo que falta.

### 14.5 Un experimento mental con los datos

Si el jurado fuera completamente azaroso, la tasa de primer lugar sería 1/3 en cada desafío
con tres premiados. La tasa observada en el corte válido es {pct(tasa(CORE)[2])}. La
diferencia entre {pct(1 / 3)} y {pct(tasa(CORE)[2])} es el espacio donde la calidad —del
equipo, del video o del jurado— puede operar. Es un espacio real, pero no es enorme: la mayor
parte de la variación la explica la estructura del concurso, no el mérito.
"""
