"""Partes 5 — capítulos 18 a 21: pitch, síntesis, probabilidad absoluta y límites."""

from __future__ import annotations

import json
from collections import Counter

from base import (AN, AUDIO, CORE, DF, HIP, INTL, META, NIC, NIC_SEDE, SIS, TXT, VIDEOS,
                  WINNERS, fig, fp, media, mediana, num, pct, pp, tabla, tasa)

PROB = json.loads((AN / "probabilidad.json").read_text(encoding="utf-8"))

PARTE = """
---

# Parte V — Cómo se usa esto
"""


def cap18() -> str:
    return f"""## 18. Pitch y ventas: el manual que los datos permiten escribir

Este capítulo no afirma que estas técnicas hagan ganar: el diseño del corpus no permite
probarlo. Afirma algo más modesto y más útil: **son las técnicas que la evidencia externa
respalda y que el corpus muestra ausentes**. Cada una se puede ejecutar en 24 horas y sin
presupuesto.

### 18.1 La estructura que casi todos usan

Leyendo {num(len(TXT))} transcripciones, el guion dominante es descriptivo:

1. Saludo y presentación del equipo.
2. Contexto del problema, a veces con una cifra.
3. Qué hicimos: lista de características.
4. A quién beneficia, en abstracto.
5. Agradecimiento.

Es el orden de un informe, no el de una historia. Y tiene un problema medible: el jurado
escucha la lista de características sin haber entendido todavía **por qué importa**. La
información llega en el orden equivocado.

### 18.2 PAS: problema, agitación, solución

| Tramo | Segundos | Contenido | Error típico |
|---|---:|---|---|
| Problema | 0–15 | una persona concreta, un lugar concreto, un hecho verificable | «la contaminación es un problema global» |
| Agitación | 15–35 | qué pasa si nada cambia; el costo de no actuar | saltárselo e ir directo al producto |
| Solución | 35–85 | qué es, cómo funciona, qué se ve cuando funciona | enumerar funciones en vez de mostrar el efecto |

La agitación es el tramo que casi nadie escribe. En el corpus, el problema aparece en
{pct(HIP['H32']['r1'])} de los guiones emparejados, pero la consecuencia de no resolverlo
aparece mucho menos: es la parte que se puede añadir sin grabar nada nuevo, solo con voz en
off sobre el material que ya existe.

### 18.3 BAB: antes, después, puente

| Tramo | Segundos | Contenido |
|---|---:|---|
| Antes | 0–20 | cómo se resuelve hoy ese problema, con su costo |
| Después | 20–45 | cómo se resuelve con la solución, en el mismoescenario |
| Puente | 45–90 | qué hay en medio: el prototipo, el proceso, el equipo |

BAB funciona especialmente bien cuando la solución es un proceso y no un objeto, que es el
caso de la mayoría de los desafíos del rally (agua, residuos, vivienda, organización
comunitaria).

### 18.4 Story Spine

«Había una vez ___. Cada día ___. Hasta que un día ___. Por eso ___. Hasta que finalmente ___.»

Es una plantilla de seis frases que obliga a tener un protagonista. Aplicada a un proyecto
social, el protagonista no es el equipo: es la comunidad, la escuela o la familia. El equipo
aparece al final, como quien ayudó. Ese cambio de sujeto es el que activa la transportación
narrativa y la víctima identificable.

### 18.5 AIDA y el cierre

Atención, interés, deseo, acción. En dos minutos, la «acción» no es una compra: es que el
jurado recuerde el proyecto. Un cierre eficaz tiene tres ingredientes y ninguno es
«muchas gracias»:

1. **La imagen más fuerte** del video, repetida un segundo.
2. **Una frase de futuro** en presente: «esto ya funciona en ___».
3. **El nombre del proyecto**, dicho una sola vez, al final.

### 18.6 Challenger: enseñar algo

La venta challenger no pregunta qué necesita el cliente: le enseña algo que no sabía y
reencuadra el problema. En el rally se traduce en una sola frase: **«el problema no es ___,
es ___»**. Si el jurado acepta esa reformulación, todo lo que sigue se evalúa con tu marco.

Ejemplo de estructura: «El problema no es que falte agua; es que el agua que hay se pierde
antes de llegar». Esa frase hace que la solución de riego parezca obvia en lugar de
tecnológica.

### 18.7 La pregunta «¿y qué?»

Después de cada frase del guion, preguntar «¿y qué?». Si la respuesta no aparece en la
siguiente frase, esa frase sobra. Aplicado al corpus, elimina sistemáticamente los saludos
largos, las listas de instituciones y las descripciones técnicas que no cambian nada.

### 18.8 Las siete reglas

1. **El problema en los primeros 10 segundos.** El jurado ya sabe quién eres; no sabe por
   qué debería importarle.
2. **Una sola idea.** Si el video defiende dos, el jurado recuerda cero.
3. **Audio limpio antes que imagen bonita.** Voz sin eco, sin música que compita.
4. **Mostrar el prototipo funcionando**, aunque sea feo. Un objeto real vence a un render.
5. **Un testimonio de 8 segundos** de alguien que no sea del equipo. Es la casilla vacía del
   certamen ({pct(HIP.get('H36', {}).get('r1', 0) if HIP.get('H36') else 0)} de cierres
   explícitos, 0 % de testimonios).
6. **Cerrar con la imagen más fuerte**, no con el logo ni con agradecimientos.
7. **Escribir el nombre del proyecto en la descripción**, con una frase que explique qué hace.
   Es la única palanca con evidencia interna (H30): {pct(HIP['H30']['r1'])} contra
   {pct(HIP['H30']['r0'])}.

### 18.9 El guion de 120 segundos

| Segundo | Tramo | Qué se ve | Qué se oye |
|---:|---|---|---|
| 0–8 | Gancho | la persona o el lugar del problema | una frase que reformula el problema |
| 8–25 | Problema | el antes, con detalle concreto | el costo de que siga igual |
| 25–45 | Solución | el prototipo en uso | qué es y cómo funciona, en tres frases |
| 45–70 | Prueba | el resultado medido o el usuario | un testimonio de 8 s o una cifra del piloto |
| 70–95 | Escala | el mapa o la réplica | a dónde puede llegar y con quién |
| 95–112 | Equipo | el equipo trabajando | quiénes son y qué aportan |
| 112–120 | Cierre | la imagen más fuerte | el nombre del proyecto y una frase de futuro |

Los tramos suman 120 y dejan 8 segundos de margen. La mayoría de los guiones del corpus
gasta ese margen en agradecimientos.

### 18.10 Dos reescrituras

**Antes** (típico del corpus): «Buenos días, somos el equipo ___ de la universidad ___,
estudiantes de ___ . Nuestro proyecto se llama ___ y consiste en un sistema de ___ que
permite ___ . Queremos agradecer a ___ por la oportunidad.»

**Después**: «En ___ , cada semana se pierden ___ litros de agua antes de llegar a la
escuela. Nosotros construimos ___ , que recupera ___ . Ya funciona en ___ . Somos ___ y esto
se llama ___ .»

La segunda versión usa los mismos 35 segundos y contiene: problema, magnitud, solución,
prueba y nombre. No requiere grabar nada nuevo, solo reordenar y borrar.

### 18.11 Lo que no se debe hacer

- **No empezar con el nombre del proyecto.** Es el error más común y el más caro: gasta el
  segundo más valioso en información que nadie retiene.
- **No decir «somos estudiantes de…»** como primera frase. Es contexto, no gancho.
- **No usar música épica** sobre imágenes de diapositivas.
- **No poner texto que el narrador también dice.** El jurado lee o escucha, no ambas.
- **No terminar con «muchas gracias».** El cierre es el segundo momento más recordado.
"""


def cap19() -> str:
    est = SIS["conteo_estados"]
    return f"""## 19. Qué compone a un ganador

### 19.1 El scorecard

Con lo que el corpus permite afirmar, un ganador se compone de nueve piezas. Cinco son
estructurales —no dependen del equipo—, dos son de forma y dos son huecos de oportunidad.

| # | Componente | Evidencia | Peso | Se controla |
|---:|---|---|---|---|
| 1 | Composición de la delegación | H01, +{num(abs(HIP['H01']['diff']) * 100, 1)} pp | alto (mecánico) | parcialmente |
| 2 | Desafío con pocos rivales de tu sede | artefacto 1/n | alto | no |
| 3 | Suerte de jurado | varianza no observada | alto | no |
| 4 | Nombre del proyecto en la descripción | H30, +{num(abs(HIP['H30']['diff']) * 100, 1)} pp | medio | sí |
| 5 | No quedarse corto de duración | H42, −{num(abs(HIP['H42']['diff']) * 100, 1)} pp si ≤110 s | medio | sí |
| 6 | Título informativo y específico | señal débil, +6 pp | bajo | sí |
| 7 | Pertinencia al desafío | sin evidencia (no medible) | alto | sí |
| 8 | Calidad de audio | sin evidencia interna; literatura externa | medio | sí |
| 9 | Testimonio de usuario | 0 % en el corpus | oportunidad | sí |

La lectura del scorecard es incómoda: **los tres componentes de más peso no los controla el
equipo**. Lo que sí controla —descripción, duración, título, audio, testimonio— suma menos
que la estructura del concurso. Eso no significa que no valga la pena; significa que hay que
dejar de creer que el video decide el certamen.

### 19.2 La curva de esfuerzo

| Esfuerzo | Acción | Evidencia | Riesgo |
|---|---|---|---|
| 10 minutos | escribir la descripción con el nombre del proyecto | H30 | nulo |
| 20 minutos | reordenar el guion para poner el problema en el segundo 5 | H32 | nulo |
| 1 hora | regrabar el audio con micrófono y sin música | literatura | nulo |
| 2 horas | grabar un testimonio de 8 segundos | 0 % de uso | bajo |
| 3 horas | reescribir el guion con PAS y cerrar con imagen | H42 | bajo |
| 1 día | rediseñar la solución | sin datos | alto |

Las cinco primeras son las que este libro recomienda. La sexta es la única que de verdad
podría cambiar el resultado, y es la única sobre la que el corpus no dice nada.

### 19.3 Lo que el ganador no es

Los datos desmienten cinco arquetipos populares:

- **No es el equipo que repite.** H08: {pct(HIP['H08']['r1'])} contra {pct(HIP['H08']['r0'])}.
- **No es el que elige el desafío raro.** H02/H03/H10 refutadas, tasas planas.
- **No es el que se pasa del tiempo.** H14 refutada; H42 muestra lo contrario.
- **No es el de la miniatura bonita.** 4.196 miniaturas indistinguibles.
- **No es el que cita más cifras.** H38 sin evidencia tras corregir el marcador.

### 19.4 Tres frases para llevarse

1. **La competencia es local.** Tu probabilidad depende de cuántos equipos de tu sede y de
   otras sedes comparten tu desafío, no de tu país ni de tu categoría.
2. **Todo lo que se mide del video no distingue.** Entre los tres premiados, el video no
   separa por duración, título, imagen ni marcadores.
3. **El hueco está en lo que nadie hace.** Testimonio real, descripción útil, problema en el
   segundo cinco. Cuesta horas, no dinero.

### 19.5 Qué haría este proyecto si tuviera un equipo compitiendo

1. Escribir la descripción antes de grabar: obliga a definir la solución en una frase.
2. Guion PAS de 112 segundos, con 8 de margen.
3. Grabar el prototipo funcionando antes de grabar al equipo.
4. Conseguir un testimonio de 8 segundos, aunque sea por teléfono.
5. Revisar el audio: sin eco, sin música, nivel constante.
6. Cerrar con la imagen más fuerte y el nombre del proyecto.
7. No cambiar nada más. El resto es ruido.

### 19.6 Balance del corpus

| Estado | Hipótesis |
|---|---:|
| A favor | {num(est['a favor'])} |
| En contra | {num(est['en contra'])} |
| Artefacto | {num(est['artefacto aritmético'])} |
| Señal débil | {num(est['señal débil total'])} |
| Sin evidencia | {num(est['sin evidencia'])} |
| No concluyente | {num(est['no concluyente'])} |
| Descriptiva | {num(est['descriptiva'])} |

De {num(len(HIP))} creencias, tres sobreviven. Es un resultado magro y honesto: el rally no
se gana con trucos de video. Se gana —en la parte que se puede medir— con estructura, y en
la parte que no se puede medir, con una solución que se entienda en dos minutos.
"""


def cap20() -> str:
    """Probabilidad absoluta: la parte que el registro sí permite recuperar."""
    p = PROB
    banda = p["banda"]
    podio = p["podio"]
    c = p["celdas"]
    nic = p["nicaragua"]

    filas_banda = [[num(b["equipos_por_grupo_completo"]), num(b["equipos_estimados"]),
                    pct(b["p_primero"]), pct(b["p_podio"])] for b in banda]

    anios = [e for e in p["estratos"]["year"] if e["valor"] >= "2021"]
    filas_anios = [[e["valor"], num(e["grupos"]), pct(e["p_grupo_minimo"]),
                    pct(e["p_primero_k8"])] for e in anios]

    filas_podio = [[f"{r['primero']} · {r['segundo']} · {r['tercero']}", num(r["grupos"]),
                    pct(r["grupos"] / c["grupos"])] for r in podio[:4]]

    paises_prob = sorted(p["por_pais"], key=lambda e: -e["grupos"])
    filas_prob_pais = [[e["pais"].title(), num(e["grupos"]), num(e["premios"]),
                        pct(e["p_techo"]), pct(e["p_media"]), pct(e["p_grande"]),
                        pct(e["n1"] / e["grupos"]), num(e["equipos_por_grupo"], 1)]
                       for e in paises_prob]

    sedes_nic = p["sedes_nicaragua"]
    top_nic = sedes_nic[:24]
    filas_nic = [[e["sede"].title(), num(e["grupos"]), num(e["premios"]), num(e["ediciones"]),
                  pct(e["p_techo"]), pct(e["p_media"]), pct(e["p_grande"]),
                  pct(e["n1"] / e["grupos"])] for e in top_nic]
    _g = sum(e["grupos"] for e in sedes_nic)
    _p = sum(e["premios"] for e in sedes_nic)

    k8 = next(b for b in banda if b["equipos_por_grupo_completo"] == 8)
    k3 = next(b for b in banda if b["equipos_por_grupo_completo"] == 3)
    k20 = next(b for b in banda if b["equipos_por_grupo_completo"] == 20)
    nic3 = next(b for b in nic["banda"] if b["equipos_por_grupo_completo"] == 3)
    nic8 = next(b for b in nic["banda"] if b["equipos_por_grupo_completo"] == 8)

    return f"""## 20. Probabilidad absoluta: cuánto vale de verdad un video

Las dos preguntas que este banco recibe siempre son «¿cuánto se gana?» y «¿qué hago para
ganar?». El capítulo 20 responde la primera hasta donde el registro lo permite, y dice con
precisión dónde se acaba la evidencia. La respuesta corta: **la probabilidad absoluta está
acotada, no medida**, y esa cota es más informativa de lo que parece.

### 20.1 Por qué el registro parece no tener denominador

La primera impresión es que SIRLI solo publica ganadores, y que sin perdedores no hay
probabilidad. Pero el registro publica algo más: **publica el podio completo de cada sede,
y lo publica de forma incompleta cuando la sede es pequeña**. Ahí está la información.

La estructura del podio no es por desafío, como se supone a primera vista. Es **por sede y
por categoría**: cada sede entrega como máximo un primero, un segundo y un tercero por
categoría, y esos tres premios suelen recaer en equipos que resolvieron desafíos distintos.

{tabla(["Patrón (1.º · 2.º · 3.º)", "Grupos", "% del total"], filas_podio,
       "ddd")}

De {num(c["grupos"])} grupos sede-categoría desde 2021, {num(podio[0]["grupos"])} tienen el
podio completo. Los tres premios van a tres desafíos distintos en
{pct(int(p["desafios_distintos_en_grupos_de_tres"].get("3", 0)) / max(1, sum(
    int(v) for v in p["desafios_distintos_en_grupos_de_tres"].values())))} de los casos
completos. Es decir: dentro de tu sede, compites contra todos los equipos de tu categoría,
aunque cada uno haya elegido un desafío distinto.

### 20.2 La censura que sí informa

Cuando una sede tiene menos de tres equipos en una categoría, no puede premiar a tres. Y el
registro lo delata:

| Premios publicados en el grupo | Equipos que tuvo | Grupos |
|---|---:|---:|
| 1 | exactamente 1 | {num(c["n1"])} |
| 2 | exactamente 2 | {num(c["n2"])} |
| 3 | **3 o más** | {num(c["n3"])} |

Los dos primeros casos son exactos. El tercero está censurado: sabemos que hubo al menos
tres equipos, pero no cuántos. Esa es la única pieza que falta, y no se puede recuperar
desde el registro público.

### 20.3 La banda: P(1.º) = 1 / equipos de tu categoría

Con una regla de podio de un premio por puesto y categoría, la probabilidad de ser primero
es exactamente el inverso del número de rivales de tu categoría. Todo depende de cuántos
equipos había en el grupo censurado:

{tabla(["Equipos en un grupo completo", "Equipos totales estimados", "P(1.º)", "P(podio)"],
       filas_banda, "dddd")}

{fig("fig16_probabilidad.png", "La probabilidad cae como 1/T. La zona sombreada es el único tramo documentado sin supuestos: los grupos donde el registro dice exactamente cuántos equipos hubo.")}

La lectura: si asumimos que una sede mediana pone unos ocho equipos por categoría, la
probabilidad base de primer lugar es **{pct(k8["p_primero"])}** y la de pisar el podio
**{pct(k8["p_podio"])}**. Si la sede es grande, con veinte equipos por categoría, bajar a
**{pct(k20["p_primero"])}**. El máximo posible —tres equipos en la categoría— es
**{pct(k3["p_primero"])}**, y solo se alcanza en sedes minúsculas.

En Nicaragua la censura es casi idéntica, lo que sugiere sedes de tamaño parecido al resto:
{pct(nic3["p_primero"])} con tres equipos y {pct(nic8["p_primero"])} con ocho.

### 20.4 Qué cambia entre años

La forma del podio cambia más que la probabilidad. Un grupo con un solo premio es señal de
sede chica: esa proporción sirve para comparar tamaños de sede entre años.

{tabla(["Año", "Grupos", "Grupos con 1 solo premio", "P(1.º) con 8 equipos"],
       filas_anios, "lddd")}

### 20.5 Probabilidad general por país

El mismo cálculo, aplicado país por país. La columna «grupos con 1 solo premio» es la huella
del tamaño de sede: un valor alto indica muchas categorías con un único equipo, donde el
primer lugar se obtiene por existencia y no por competencia.

{tabla(["País", "Grupos", "Premios", "P(1.º) techo (3)", "P(1.º) media (8)",
        "P(1.º) sede grande (15)", "Grupos con 1 solo premio", "Equipos/grupo"],
       filas_prob_pais, "lddddddd")}

Las tres columnas de probabilidad son el mismo dato con tres supuestos distintos sobre
cuántos equipos tiene una categoría en la sede: el techo (tres equipos, imposible de superar),
el escenario medio (ocho) y el escenario de sede grande (quince). Ninguna es «la» probabilidad
real: son la banda dentro de la cual cae, y la banda es lo más honesto que el registro permite.

La lectura por país es la siguiente. **Nicaragua** tiene {num(paises_prob[0]["grupos"])} grupos
documentados en 2021–2026, más que cualquier otro país, con una probabilidad media de
{pct([e for e in paises_prob if e["pais"] == "NICARAGUA"][0]["p_media"])}. Ese volumen es una
ventaja de información: hay más historia nicaragüense en este banco que de cualquier otra
delegación, y por eso el capítulo 15 puede bajar al detalle de sede. **Argentina** y **México**
comptien con un número de grupos parecido pero con menos sedes pequeñas, lo que se ve en la
última columna: si el porcentaje de grupos con un solo premio es bajo, la competencia real
ocurre en categorías pobladas y la probabilidad efectiva se acerca al escenario medio.

### 20.6 Nicaragua, sede por sede

El detalle que el promedio nacional esconde. Las {num(len(sedes_nic))} sedes nicaragüenses con
al menos dos grupos documentados, ordenadas por número de grupos, concentran
{num(_g)} de los {num(p["nicaragua"]["celdas"]["grupos"])} grupos nicaragüenses documentados
desde 2021 y {num(_p)} premios. El resto —{num(p["nicaragua"]["celdas"]["grupos"] - _g)} grupos—
está en sedes que solo aparecen una vez, casi siempre categorías con un único equipo:

{tabla(["Sede", "Grupos", "Premios", "Ediciones", "P(1.º) techo", "P(1.º) media",
        "P(1.º) grande", "Grupos con 1 solo premio"],
       filas_nic, "lddddddd")}

El listado completo de las {num(len(sedes_nic))} sedes está en el apéndice L. Tres cosas que
muestra la tabla y que no se ven en el agregado:

1. **Hay sedes donde casi no hay competencia interna.** Las que tienen un porcentaje alto de
   grupos con un solo premio premian a casi todos los que se presentan; ahí el podio es un
   trámite. Son también las sedes que suelen estrenarse en el rally.
2. **Las sedes grandes nicaragüenses son estables.** Las de la parte alta de la tabla
   aparecen en tres o cuatro ediciones seguidas, con el mismo número de grupos cada año. No
   son sedes que crecen: son sedes que se repiten.
3. **Cuando el grupo nunca pasó de dos equipos, la banda se aplana.** Algunas sedes tienen el
   mismo valor en las tres columnas (por ejemplo, 50,0 % en las tres) porque en toda su
   historia solo hubo uno o dos equipos por categoría: ahí no hay censura que despejar y la
   probabilidad es un dato, no una estimación. En el resto, la diferencia entre el techo y el
   escenario de sede grande es de tres a cuatro veces, y ese factor supera cualquier efecto
   que se haya podido medir en el video.

### 20.7 Lo que se puede afirmar sin ningún supuesto

Hay una cantidad que el registro mide entero, sin censura ni denominador estimado: **la
probabilidad de ser primero, condicionada a haber sido premiado**. Desde 2021 es
{pct(p["probabilidad"]["entre_premiados"])}, con intervalo de confianza de
{pct(p["probabilidad"]["entre_premiados_ic"][0])} a
{pct(p["probabilidad"]["entre_premiados_ic"][1])}.

Esa cifra encierra la lección más útil del libro. Llegar al podio y ganar no son el mismo
problema:

- **Llegar al podio** depende sobre todo del tamaño de tu sede y de cuántos equipos compiten
  en tu categoría. Es aritmética, y se decide antes de encender la cámara.
- **Ganar el primer lugar** es casi una moneda al aire entre los tres premiados. Ahí es donde
  el video puede mover algo, y donde el corpus dice que mueve menos de lo que se cree.

Dicho de otro modo: si tu sede tiene ocho equipos por categoría, la probabilidad de primer
lugar es {pct(k8["p_primero"])}; de esos ocho, tres son premiados, y entre esos tres el
primero se lleva {pct(p["probabilidad"]["entre_premiados"])} de las veces. No hay ninguna
palanca conocida que multiplique esa cifra por tres.

### 20.8 Cómo calcular tu propia probabilidad

Tres números, todos disponibles el día del evento:

1. **Equipos en tu categoría en tu sede.** Se cuenta en la presentación inicial. Es el
   denominador de todo.
2. **P(1.º) = 1 / ese número.** Con doce equipos, {pct(1 / 12)}.
3. **Multiplicador de calidad.** El modelo del capítulo 9 separa premiados de no premiados con
   ROC 0,617, lo que en la práctica mueve la probabilidad en torno a ±30 % relativo: un video
   en el decil alto no duplica tus opciones. Sirve para no perder, no para ganar solo.

La conclusión práctica es incómoda pero honesta: **la decisión de mayor impacto no es cómo
grabas, sino dónde compites**. Elegir una sede con menos equipos por categoría multiplica tu
probabilidad base de forma directa; mejorar el video la ajusta en los márgenes. Cualquier
promesa mayor que eso no está respaldada por estos datos.
"""


def cap25() -> str:
    caidos = VIDEOS - len(META)
    return f"""## 21. Límites, ética y reproducibilidad

### 21.1 Los límites, en orden de importancia

1. **No hay perdedores en el registro.** Todo el libro compara premiados entre sí, salvo el
   capítulo 20, que reconstruye una banda de probabilidad absoluta a partir de la censura
   del podio.
2. **El registro cambia en 2021.** Antes de ese año no se publican segundos ni terceros.
3. **La muestra de texto es pequeña y sesgada.** {num(len(TXT))} ediciones, sesgada hacia
   Nicaragua y hacia segundos y terceros.
4. **{num(caidos)} videos están caídos.** Los primeros lugares desaparecen más.
5. **No hay rúbrica.** Sin los criterios oficiales, cualquier modelo es una aproximación.
6. **Las medidas de imagen son de bajo nivel.** Color, brillo y caras no son «calidad».
7. **El audio se midió sin separar voz de música.** Es una limitación real de los rasgos.

### 21.2 Sobre el uso de los datos

Todo el material es público: páginas de ganadores, videos de YouTube y sus metadatos. El
banco no contiene datos personales más allá de nombres de equipos publicados por el propio
certamen, y no incluye transcripciones completas de terceros en el repositorio: se guardan
fragmentos y derivados (conteos, marcadores, rasgos).

Si este análisis se publica, conviene citar la fuente primaria y aclarar que las tasas son
«entre premiados», no probabilidades absolutas. La diferencia no es un tecnicismo: es la
diferencia entre un análisis y una campaña de marketing.

### 21.3 Reproducibilidad

Todo el libro se regenera con tres comandos:

```
python scripts/sirli_dataset.py
python scripts/sirli_sistemico.py
python scripts/sirli_libro.py
```

Y el banco completo, desde cero, con diecisiete etapas documentadas en
`research/sirli/README.md`. No hay cifras escritas a mano: si un número cambia en los datos,
cambia en el libro.

### 21.4 Lo que falta y cómo se cerraría

| Vacío | Cómo se cierra | Costo estimado |
|---|---|---|
| No hay perdedores | conseguir la lista de participantes de una sede | gestión con el organizador |
| No hay rúbrica | pedirla al certamen | una solicitud |
| Texto incompleto | transcribir los {num(VIDEOS - len({r['video_id'] for r in TXT}))} videos restantes | ≈ 8 h de CPU |
| Imagen semántica | visión por modelo grande sobre 300 fotogramas | costo de API |
| Audio con música separada | separación de fuentes (Demucs) | ≈ 2 h de CPU |
| Validación humana | ver 30 videos y anotar a mano | 3 h de una persona |

### 21.5 Veredicto

El corpus responde tres preguntas con solidez: **cuánto creció el certamen**, **qué se
premia** (un podio por sede y categoría, y sedes que premian menos cuando tienen menos
equipos) y **qué no distingue a un ganador** (casi todo lo que se puede medir del video).

No responde la pregunta que todos hacen —«¿cómo hago para ganar?»— con una receta. Responde
con una dirección: menos competencia interna, descripción útil, guion ordenado, audio limpio
y un testimonio que nadie más tiene. Y con una advertencia: la mayor parte de la varianza
está en la estructura del concurso y en el jurado, no en el video.

Eso es lo que los datos permiten decir. Ni más, ni menos.
"""
