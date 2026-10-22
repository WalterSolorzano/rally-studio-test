"""Partes 2 — capítulos 5 a 9: desafíos, anatomía del banco, método, hipótesis, sistema."""

from __future__ import annotations

from collections import Counter, defaultdict

from base import (AN, AUDIO, CORE, DF, HIP, INTL, META, NAC, NIC, NIC_SEDE, SIS, TXT,
                  VIDEOS, WINNERS, fig, fp, media, mediana, nombre_pais, num, pct, pp,
                  tabla, tasa, tasa_por, wilson)

import json

MODELO = json.loads((AN / "modelo_baseline.json").read_text(encoding="utf-8"))
MOD = MODELO["modelos"]

PARTE = """
---

# Parte II — El banco de datos
"""


def cap5() -> str:
    por_des = Counter(w["challenge_name"] for w in WINNERS if w.get("challenge_name"))
    filas = []
    for d, n in por_des.most_common(30):
        g = [r for r in CORE if r["challenge_name"] == d]
        k, nn, t = tasa(g)
        anios = sorted({w["year"] for w in WINNERS if w.get("challenge_name") == d})
        filas.append([d.title()[:58], num(n), num(nn), pct(t) if nn else "—",
                      f"{anios[0]}–{anios[-1]}" if len(anios) > 1 else str(anios[0])])
    temas = Counter(r.get("challenge_theme") or "otro" for r in DF)
    filas_t = [[t.title(), num(n), pct(n / len(DF))] for t, n in temas.most_common()]
    largos = [len(d.split()) for d in por_des]
    return f"""## 5. Los desafíos: un repertorio corto que se repite

### 5.1 Cuántos son y cómo se repiten

Todo el registro se apoya en **{num(len(por_des))} enunciados de desafío**. No son
{num(len(por_des))} retos distintos en el sentido creativo: son variaciones del mismo
puñado de problemas —agua, residuos, vivienda, energía, salud, inclusión— repartidas entre
sedes y años.

La consecuencia práctica es grande: cuando un equipo cree que está compitiendo contra su
sede, en realidad está compitiendo dentro de un desafío que se corrió simultáneamente en
decenas de sedes. Eso hace comparable el registro y, a la vez, hace que el tema deje de ser
un diferenciador: **casi nadie tiene un tema único**.

### 5.2 Los treinta desafíos más frecuentes

{tabla(["Desafío", "Premios", "Ediciones 2021+", "Tasa de 1.º", "Años"], filas, "idddd")}

{fig("fig05_desafios.png", "Desafíos más frecuentes y concentración del repertorio")}

**Lectura.** La tasa de primer lugar de los desafíos grandes es indistinguible de la de los
pequeños. Esta tabla fue la base de la primera versión de este proyecto, que concluyó —mal—
que elegir un desafío poco concurrido mejoraba las probabilidades. El capítulo 9 explica por
qué esa conclusión no se sostiene.

### 5.3 Los temas

Clasificar {num(len(DF))} ediciones en 17 temas permite ver qué problemas ocupa el rally.
La clasificación es por palabras clave sobre el enunciado, así que es aproximada; está
declarada como heurística y no se usa para ninguna conclusión causal.

{tabla(["Tema", "Ediciones", "% del total"], filas_t, "idd")}

Residuos, agua y vivienda concentran la mitad del repertorio. Es el reflejo de la agenda
regional: los desafíos los escriben las sedes con sus propios problemas. Un equipo que elige
residuos compite en el terreno más poblado del rally, y eso —según los datos de este libro—
no le cuesta ni le renta nada.

### 5.4 La forma de los enunciados

Longitud media del enunciado: {num(media(largos), 1)} palabras. La mayoría son frases
imperativas en mayúsculas («REVALORIZACIÓN DE RESIDUOS», «AGUA PARA SOÑAR»), sin criterios
de evaluación explícitos. Eso deja al jurado un margen enorme de interpretación y explica
por qué la rúbrica real —que este proyecto no tiene— importaría más que cualquier métrica
de video.
"""


def cap6() -> str:
    durs = [r["duration_s"] for r in DF if r["duration_s"]]
    f = [r for r in CORE if r["duration_s"]]
    d1 = mediana([r["duration_s"] for r in f if r["place_best"] == 1])
    dn = mediana([r["duration_s"] for r in f if r["place_best"] != 1])
    p120 = sum(1 for r in CORE if r["over_limit"] == 1) / max(1, len(CORE))
    desc = [r["desc_len"] for r in CORE if r["desc_len"] is not None]
    sin_desc = sum(1 for r in CORE if (r["desc_len"] or 0) <= 20) / max(1, len(CORE))
    con_sub = sum(1 for r in CORE if r["video_id"] in META and (META[r["video_id"]].get("has_captions")))
    con_meta = sum(1 for r in CORE if r["video_id"] in META)
    vistas = [r["views"] for r in CORE if r["views"]]
    filas = [
        ["Premios", num(len(WINNERS)), "fila del registro"],
        ["Ediciones", num(len(DF)), "video × año × colección"],
        ["Videos distintos", num(VIDEOS), "identificador de YouTube"],
        ["Con metadatos", num(len(META)), f"{pct(len(META) / VIDEOS)} de los videos"],
        ["Con miniatura", num(len(list((AN.parent / 'meta' / 'thumbs').glob('*.jpg')))), "archivo local"],
        ["Con transcripción", num(len({r['video_id'] for r in TXT})), "whisper o subtítulos"],
        ["Con rasgos de audio", num(len(AUDIO)), "calculados en la misma pasada"],
        ["Con hojas de fotogramas", num(len(list((AN.parent / 'frames').glob('*.jpg')))), "mosaico 3×2"],
        ["Con subtítulos en YouTube", num(con_sub), f"{pct(con_sub / max(1, con_meta))} de los que tienen metadatos"],
    ]
    return f"""## 6. Anatomía del banco

### 6.1 Qué hay dentro

{tabla(["Capa", "Cantidad", "Unidad"], filas, "idd")}

El banco tiene cuatro capas que se pueden usar por separado: **registro** (quién ganó qué),
**metadatos** (qué publicó YouTube), **imagen** (miniaturas y fotogramas) y **texto**
(transcripción y rasgos de audio). Cada capítulo indica qué capa usa, porque no todas
cubren lo mismo.

### 6.2 La duración

Mediana de los videos con metadatos: **{num(mediana(durs), 0)} segundos**. En el corte
válido, {pct(p120)} de las ediciones supera los 120 segundos, es decir, el límite habitual
del formato. Comparación por puesto: **{num(d1, 0)} s** para los primeros y
{num(dn, 0)} s para segundos y terceros.

{fig("fig01_duracion_puesto.png", "Distribución de la duración por puesto (sede 2021–2026)")}

{fig("fig02_tope_120s.png", "Proporción de videos que respetan el tope de 120 segundos")}

**Lectura.** La diferencia de un segundo no es una señal, es ruido. Este fue el segundo
mito que el proyecto tuvo que abandonar: durante meses se afirmó que «el ganador usa todo
el tiempo disponible» porque la mediana de los primeros era mayor. Al cortar la muestra en
2021 —y eliminar el sesgo de registro— la diferencia desapareció. La lección metodológica
está en el capítulo 11.

### 6.3 La descripción: el campo que nadie usa

Mediana de caracteres en la descripción del video: **{num(mediana(desc), 0)}**. Proporción
de fichas con 20 caracteres o menos: **{pct(sin_desc)}**. Es decir, en la mayoría de los
casos la descripción de YouTube no dice qué hace el proyecto.

{fig("fig06_descripcion.png", "Longitud de la descripción del video")}

Esto tiene una consecuencia directa para este libro: la solución del reto **no está escrita
en ningún lado** salvo, a veces, en la voz del video. Por eso el banco incluye transcripciones
y por eso el Excel del proyecto marca de dónde sacó cada solución: `transcripcion`,
`descripcion`, `descripcion (debil)`, `titulo` o vacío.

### 6.4 El interés del público

Mediana de vistas: **{num(mediana(vistas), 0)}**. Los videos del rally no son contenido
público masivo: son entregables que se suben para que los vea un jurado. Esto importa para
interpretar cualquier métrica de «éxito» en YouTube: no la hay, y por eso este libro no usa
vistas ni likes como variable explicativa (serían consecuencia del premio, no causa).

### 6.5 Cobertura por colección

{tabla(["Colección", "Premios", "Ediciones válidas", "Tasa de 1.º"],
       [["Sede", num(len([w for w in WINNERS if w['collection'] == 'sede'])), num(len(CORE)), pct(tasa(CORE)[2])],
        ["Nacional", num(len(NAC)), num(len(NAC)), pct(tasa(NAC)[2])],
        ["Internacional", num(len(INTL)), num(len(INTL)), pct(tasa(INTL)[2])]], "iddd")}
"""


def cap7() -> str:
    return f"""## 7. Método: qué se puede concluir y qué no

### 7.1 El problema del grupo de control

Un estudio sobre ganadores sin lista de participantes es un estudio sin denominador. Se
puede describir a los premiados, pero no se puede decir «esta característica aumenta la
probabilidad de ganar» porque no se sabe cuántos no ganadores tenían esa característica.

La solución que adopta este libro es doble:

1. **Comparar dentro de los premiados.** Primer lugar contra segundo y tercero. Eso responde
   a «¿qué distingue al que ganó del que también fue premiado?», que es una pregunta legítima
   y útil: los tres pasaron el filtro del jurado, pero solo uno se llevó el primer puesto.
2. **Construir la comparación con pareja.** Para el análisis de texto, solo se comparan
   guiones de equipos que compitieron en el **mismo año, misma sede y mismo desafío**. Ahí
   el puesto no se confunde con el contexto.

### 7.2 Las muestras

| Muestra | Definición | n | Uso |
|---|---|---:|---|
| Histórica | todo el registro | {num(len(DF))} | describir el evento |
| Válida | sede 2021–2026 | {num(len(CORE))} | comparar puestos |
| Nicaragüense | sede Nicaragua 2021–2026 | {num(len(NIC_SEDE))} | retrato de país |
| Internacional | colección internacional | {num(len(INTL))} | escaparate latinoamericano |
| Textual | transcripción > 20 palabras | {num(len(TXT))} | guion |
| Emparejada | 1.º y 2.º/3.º del mismo desafío | {num(len(_pareadas()))} | familia D |

### 7.3 Los tests

Para variables categóricas se usa chi-cuadrado con corrección de Yates (o Fisher exacto
cuando alguna celda esperada baja de 5). Para variables continuas, Spearman. Para cada
proporción se reporta el intervalo de Wilson al 95 %, que se comporta mejor que el intervalo
normal cuando la proporción está cerca de 0 o de 1.

Con {num(len(HIP))} hipótesis probadas, la probabilidad de encontrar al menos un falso
positivo al 5 % es alta. Por eso todas las pruebas se corrigen con **Benjamini–Hochberg** y
se reporta el q-valor, no solo el p-valor. Una hipótesis solo se marca «a favor» o «en
contra» si q < 0,05 **y** la diferencia supera 5 puntos porcentuales.

### 7.4 El artefacto 1/n

El error más peligroso de este tipo de análisis es confundir aritmética con conducta. Ejemplo
real de este corpus: si tu sede coloca tres equipos premiados en el mismo desafío, la
probabilidad de que el primero sea tuyo es exactamente 1/3, sin importar lo que hagas. Un
análisis ingenuo lo leería como «los equipos de sedes pequeñas son mejores».

Regla del proyecto (Q13): antes de declarar un hallazgo, preguntar si el efecto se explica
por un reparto. Si la tasa observada coincide con 1/n, es artefacto.

### 7.5 Las doce puertas de calidad

| Puerta | Pregunta | Estado |
|---|---|---|
| Q1 | ¿Los conteos cuadran con el HTML original? | verificado sobre 5.136 filas |
| Q2 | ¿La cobertura está declarada por capa? | sí, cap. 6 |
| Q3 | ¿Las etiquetas salen del HTML y no de una suposición? | sí |
| Q4 | ¿Hay fuga temporal (usar datos del futuro)? | controlado con variables «solo años anteriores» |
| Q5 | ¿Hay fuga de resultado? | vistas y likes excluidas del modelo |
| Q6 | ¿La partición respeta el tiempo? | 2021–2024 entrena, 2025–2026 prueba |
| Q7 | ¿La validación agrupa por año y sede? | GroupKFold (año, sede) |
| Q8 | ¿Se reporta PR-AUC y no solo ROC? | sí, con base {pct(tasa(CORE)[2])} |
| Q9 | ¿n ≥ 30 por celda? | si no, «no concluyente» |
| Q10 | ¿Texto solo con n ≥ 300? | se declara cuando no se cumple |
| Q11 | ¿Reproducible de cero? | todo por script, sin cifras a mano |
| Q12 | ¿Doble revisión humana? | pendiente (cap. 18) |

### 7.6 Qué no se puede concluir

- **No** se puede estimar la probabilidad absoluta de ganar el rally.
- **No** se puede afirmar causalidad en ninguna de las {num(len(HIP))} hipótesis.
- **No** se puede comparar 2017–2020 con 2021–2026 sin declarar el sesgo de registro.
- **No** se puede generalizar a otros rallies sin replicar el pipeline.
"""


def _pareadas() -> list[dict]:
    nic = [r for r in TXT if r["country"] == "NICARAGUA" and r["collection"] == "sede"
           and (r["year"] or 0) >= 2022]
    k1 = {(r["year"], r["sede"], r["challenge_name"]) for r in nic if r["place_best"] == 1}
    kn = {(r["year"], r["sede"], r["challenge_name"]) for r in nic if r["place_best"] != 1}
    m = k1 & kn
    return [r for r in nic if (r["year"], r["sede"], r["challenge_name"]) in m]


def cap8() -> str:
    fams = sorted({h["family"] for h in HIP.values()})
    bloques = []
    for fam in fams:
        filas = []
        for h in SIS["hipotesis"]:
            if h["family"] != fam:
                continue
            d = "—" if h.get("diff") is None else pp(h["diff"])
            filas.append([h["id"], h["statement"], f"{num(h['n1'])} / {num(h['n0'])}",
                          pct(h["r1"]) if h["r1"] is not None else "—",
                          pct(h["r0"]) if h["r0"] is not None else "—",
                          d, fp(h.get("p")), h["status"]])
        bloques.append((fam, tabla(["ID", "Hipótesis", "n sí / no", "Tasa sí", "Tasa no",
                                    "Δ", "p", "Estado"], filas, "idddddis")))
    cuerpo = "\n\n".join(f"### {f}\n\n{t}" for f, t in bloques)
    est = SIS["conteo_estados"]
    return f"""## 8. Biblioteca de hipótesis: {num(len(HIP))} creencias puestas a prueba

### 8.1 De dónde salen

Las hipótesis no se inventaron para llenar una tabla. Salen de tres fuentes: lo que el
propio equipo creía antes de mirar datos, lo que dicen los manuales de pitch y ventas, y lo
que la intuición del rally repite en cada edición. Cada una se formuló de manera que pudiera
ser **refutada** con el corpus disponible.

### 8.2 El balance

| Estado | n | Qué significa |
|---|---:|---|
| A favor | {num(est['a favor'])} | q < 0,05 y diferencia ≥ 5 pp en la dirección esperada |
| En contra | {num(est['en contra'])} | q < 0,05 y diferencia ≥ 5 pp en dirección contraria |
| Artefacto aritmético | {num(est['artefacto aritmético'])} | el efecto es 1/n disfrazado |
| Señal débil | {num(est['señal débil total'])} | entre 2 y 5 pp, o sin pasar la corrección |
| Sin evidencia | {num(est['sin evidencia'])} | nada distinguible del ruido |
| No concluyente | {num(est['no concluyente'])} | n < 15 en algún grupo |
| Descriptiva | {num(est['descriptiva'])} | no es una prueba, es un retrato |

{fig("fig14_estado_hipotesis.png", "Balance de hipótesis por estado y familia")}

**El resultado global es la conclusión más importante del libro**: de {num(len(HIP))}
creencias, solo {num(est['a favor'])} sobreviven con un efecto grande. Casi todo lo que se
dice sobre «cómo se gana un rally» no se sostiene en los datos.

{cuerpo}

### 8.3 Las tres que sobreviven

| ID | Hipótesis | Δ | Lectura |
|---|---|---:|---|
| H01 | Las sedes pequeñas dan más primeros lugares | {_d('H01')} | real, pero en buena parte mecánica (cap. 9) |
| H30 | Repetir el nombre del proyecto en la descripción | {_d('H30')} | el hallazgo más limpio y más barato de aplicar |
| H42 | Quedarse muy por debajo del límite de tiempo cuesta | {_d('H42')} | dirección contraria a la creencia del proyecto |

La H30 merece un párrafo. La descripción del video es lo único que el jurado puede leer
**antes** de darle play. Escribir 80–200 caracteres diciendo qué es el proyecto y para quién,
nombrando el proyecto, se asocia a {pct(HIP['H30']['r1'])} de primeros frente a
{pct(HIP['H30']['r0'])} de quienes no lo hacen. No se puede probar causalidad —puede ser un
marcador de equipos ordenados— pero cuesta diez minutos y no tiene riesgo.

### 8.4 Las refutadas que importan

- **El desafío poco concurrido no ayuda** (H02, H03, H10). La probabilidad es plana en todo
  el rango de rivales. Es la creencia más extendida del rally y la más falsa.
- **Pasarse de 120 segundos no ayuda** (H14). Durante meses el proyecto sostuvo lo contrario.
- **Ganar antes no predice volver a ganar** (H08): {pct(HIP['H08']['r1'])} contra
  {pct(HIP['H08']['r0'])}.
- **La miniatura no distingue** (analizada en el capítulo 12, no como hipótesis numerada).

### 8.5 El caso de las cifras

H38 («usar cifras se asocia a ganar») apareció primero como un «en contra» de −37 pp que
sobrevivía a Benjamini–Hochberg. Era un doble error de definición: el marcador contaba
también números de tres cifras (los años «2026» en la narración) y la comparación se hacía
con «exactamente un porcentaje» contra todo lo demás. Corregido el marcador y el contraste,
el efecto desaparece: {pct(HIP['H38']['r1'])} contra {pct(HIP['H38']['r0'])},
p = {fp(HIP['H38']['p'])}. Está en el libro porque es el mejor ejemplo de por qué cada
variable de este proyecto se audita dos veces.
"""


def _d(hid: str) -> str:
    h = HIP.get(hid) or {}
    return pp(h.get("diff")) if h.get("diff") is not None else "—"


def cap9() -> str:
    asocs = SIS.get("asociaciones") or []
    filas_a = []
    for a in asocs[:14]:
        if isinstance(a, dict):
            filas_a.append([a.get("variable", ""), num(a.get("valor"), 3)
                            if isinstance(a.get("valor"), (int, float)) else str(a.get("valor", "")),
                            a.get("tipo", ""), a.get("lectura", "")])
    pares = SIS.get("pares") or []
    filas_p = []
    for p in pares[:10]:
        if isinstance(p, dict):
            filas_p.append([p.get("a", ""), p.get("b", ""),
                            num(p.get("rho"), 3) if p.get("rho") is not None else "—"])
    base = tasa(CORE)
    return f"""## 9. Análisis sistémico: qué depende de qué

### 9.1 El diagrama

```
                 AÑO  (crecimiento del evento)
                  |
                  v
     TAMANO DE LA DELEGACION  --->  COMPETENCIA INTERNA  --->  P(primer lugar)
                  ^                                              ^
                  |                                              |
          TU SEDE (inscripcion)                        CALIDAD DEL VIDEO
                                                          (no medida a escala)
                  ^                                              ^
                  |                                              |
            PERTINENCIA AL DESAFIO  <---------------------  JURADO (ruido no observado)
```

La lectura del diagrama es la conclusión central: **la probabilidad de que un equipo quede
primero depende sobre todo de con quién compite, no de lo que hace**. Un equipo en una sede
que lleva un solo premiado tiene, en los datos, {pct(_grad_deleg(1))} de primeros; uno en una
sede que lleva seis premiados, {pct(_grad_deleg(6))}. No porque sea peor, sino porque tiene
cinco rivales internos más.

### 9.2 Fuerza de las asociaciones

{tabla(["Variable", "Fuerza", "Tipo", "Lectura"], filas_a) if filas_a else "_(ver fig11)_"}

{fig("fig11_asociaciones.png", "Fuerza de asociación con ganar (V de Cramér y |rho|, corregido por BH)")}

### 9.3 Variables que se mueven juntas

{tabla(["Variable A", "Variable B", "rho"], filas_p) if filas_p else "_(ver fig13)_"}

El año es el confusor más importante: el evento creció, los desafíos se hicieron más
grandes y las sedes más numerosas. Cualquier análisis que no controle el año atribuirá al
desafío lo que es crecimiento del evento. Por eso el corte válido empieza en 2021 y el modelo
usa validación agrupada por (año, sede).

### 9.4 El gradiente de delegación

{fig("fig15_delegacion.png", "Tasa de primer lugar según equipos premiados de la misma sede")}

Gradiente observado: {_grad_txt()}. Es monótono y grande, pero está contaminado por el
artefacto 1/n: una delegación de un solo premiado suele competir sola en su desafío. Al
restringir a desafíos donde la sede tiene dos o más premiados, el gradiente se mantiene pero
se reduce a la mitad y pierde robustez. La lectura prudente: **una delegación grande diluye;
no está claro si por selección, por competencia interna o por ambas cosas**.

### 9.5 La curva de saturación

{fig("fig12_saturacion.png", "Tasa de primer lugar según deciles de tamaño del desafío, con IC de Wilson")}

La curva es plana. Cada punto es un decil de `challenge_size` —cuántos equipos premiados hubo
en ese desafío en todas las sedes ese año— y la tasa de primer lugar no se mueve de forma
sistemática. Es la refutación visual de la hipótesis más popular del rally.

### 9.6 El mapa país × año

{fig("fig13_pais_anio.png", "Tasa de primer lugar por país y año")}

Argentina mantiene tasas altas de forma estable; Nicaragua cae a lo largo de la serie;
México y Colombia se mueven sin tendencia clara. Ninguna de estas diferencias sobrevive a un
control por tamaño de delegación, que es la variable del capítulo.

### 9.7 El modelo

Con solo variables de evento y metadatos (sin mirar el video), una regresión logística
alcanza **ROC {num(MOD['logistica']['roc_auc'], 3)} y PR {num(MOD['logistica']['pr_auc'], 3)}**
sobre base {pct(MODELO['tasa_base'])}, y acierta el primer lugar dentro del desafío
{pct(MOD['logistica']['tasa_modelo'])} de las veces frente a {pct(MOD['logistica']['tasa_azar'])}
del azar. La frecuencia simple como baseline queda en ROC {num(MOD['base_frecuencia']['roc_auc'], 3)}.
El gradient boosting no mejora la logística ({num(MOD['hist_gb']['roc_auc'], 3)}), lo que
sugiere que la relación es casi lineal y que no hay interacciones escondidas que el modelo
pueda exprimir.

Es una mejora real y modesta: los metadatos ordenan, no explican. El mensaje no es «el video
no importa». Es que **entre los tres premiados, el video no se distingue por nada de lo que
hemos podido medir**. Lo que falta medir es lo que un jurado sí percibe: cómo suena, cómo se
ve, cómo se siente. Eso es la Parte VII.
"""


def _grad_deleg(n: int) -> float:
    g = [r for r in CORE if r["sede_size"] == n]
    return tasa(g)[2] if g else 0.0


def _grad_txt() -> str:
    partes = []
    for n in range(1, 7):
        g = [r for r in CORE if r["sede_size"] == n]
        if len(g) >= 20:
            partes.append(f"{n} equipo(s): {pct(tasa(g)[2])} (n={num(len(g))})")
    return "; ".join(partes)
