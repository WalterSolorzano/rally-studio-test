"""Partes 4 — capítulos 15 a 17: Nicaragua, internacional y los diez años."""

from __future__ import annotations

from collections import Counter

from base import (ANIOS, CORE, DF, HIP, INTL, META, NAC, NIC, NIC_SEDE, SIS, TXT, VIDEOS,
                  WINNERS, fig, fp, media, mediana, nombre_pais, num, pct, pp, tabla,
                  tasa, tasa_por, wilson)

PARTE = """
---

# Parte IV — Retratos
"""


def cap15() -> str:
    nic = [w for w in WINNERS if w["country"] == "NICARAGUA"]
    por_col = Counter(w["collection"] for w in nic)
    anios = sorted({w["year"] for w in nic})
    filas = []
    for a in anios:
        g = [r for r in CORE if r["country"] == "NICARAGUA" and r["year"] == a]
        k, n, t = tasa(g)
        lo, hi = wilson(k, n)
        filas.append([str(a), num(len([w for w in nic if w['year'] == a])), num(n),
                      pct(t) if n else "—", f"{pct(lo)} – {pct(hi)}" if n >= 20 else "—"])
    sedes = Counter(w["sede"] for w in nic if w.get("sede"))
    filas_s = []
    for s, n in sedes.most_common(15):
        g = [r for r in CORE if r["country"] == "NICARAGUA" and r["sede"] == s]
        filas_s.append([s.title(), num(n), num(len(g)), pct(tasa(g)[2]) if g else "—"])
    des = Counter(w["challenge_name"] for w in nic if w.get("challenge_name"))
    temas = Counter(r.get("challenge_theme") or "otro" for r in DF if r["country"] == "NICARAGUA")
    return f"""## 15. Nicaragua: el laboratorio de origen

### 15.1 Por qué un capítulo aparte

Nicaragua tiene {num(len(nic))} premios, el {pct(len(nic) / len(WINNERS))} del registro:
{num(por_col['sede'])} de sede, {num(por_col['nacional'])} nacionales y
{num(por_col['internacional'])} internacionales. Es el país con más sedes y el único donde el
rally se corre con continuidad desde 2017. Eso lo convierte en el mejor lugar para estudiar
tendencias, y en el peor para generalizar: la mitad de lo que sabemos del certamen es, en
realidad, lo que sabemos de Nicaragua.

### 15.2 La serie temporal

{tabla(["Año", "Premios", "Ediciones sede", "Tasa de 1.º", "IC 95 %"], filas, "idddd")}

{fig("fig08_duracion_anio.png", "Duración mediana por año")}

**Lectura.** La tasa de primer lugar cae de forma sostenida: {_nic_txt()}. Hay dos
explicaciones compatibles y el corpus no permite separarlas del todo:

1. **Más competencia.** Cada año entran más sedes y más equipos, así que una delegación
   mediana compite contra más rivales.
2. **Mejor competencia.** Las sedes que sobreviven al crecimiento son las que saben competir.

La caída no es un problema de Nicaragua: es lo que pasa cuando un formato se masifica. Lo
importante para un equipo es que **el margen se estrechó**: en 2021, casi la mitad de los
premiados nicaragüenses eran primeros; en 2026, algo más de un tercio.

### 15.3 Las sedes nicaragüenses

{tabla(["Sede", "Premios", "Ediciones 2021+", "Tasa de 1.º"], filas_s, "iddd")}

La concentración es alta: un puñado de sedes produce la mayoría de los premios. Eso no
significa que sean «mejores»; significa que llevan más equipos. Y como el premio es por
desafío, llevar más equipos aumenta la probabilidad de que alguno quede primero, no la de
que un equipo concreto quede primero.

### 15.4 Los desafíos que se repiten en Nicaragua

Los enunciados más frecuentes son: {_top_des(des)}.

El repertorio es más pequeño que el internacional: {num(len(des))} desafíos distintos frente
a {num(len({w['challenge_name'] for w in INTL if w.get('challenge_name')}))} en la colección
internacional. Es coherente con un certamen que se organiza desde una red nacional con
problemas compartidos.

### 15.5 Los temas

{_temas_txt(temas)}

### 15.6 El video nicaragüense típico

Con los datos de metadatos: mediana de duración {_med_nic()} segundos, {_tope_nic()} dentro
de 120 s, descripción mediana de {_desc_nic()} caracteres. Es decir: el video nicaragüense
premiado es corto, respeta el formato y **no describe el proyecto**. La misma historia que en
el resto del corpus.

### 15.7 Lo que un equipo nicaragüense debería saber

- Compites dentro de un desafío, no contra el país: mira cuántos equipos de tu sede y de
  otras sedes tienen tu mismo reto.
- El margen se estrechó: en 2026 hay {num(len([w for w in nic if w['year'] == 2026]))} premios
  nicaragüenses, el máximo histórico, pero la tasa de primeros es la más baja de la serie.
- La ventaja de localía no existe en los datos (H09).
- Repetir no ayuda (H08). Un equipo que ya ganó no tiene ventaja medible.
"""


def _nic_txt() -> str:
    partes = []
    for a in sorted({r["year"] for r in CORE if r["country"] == "NICARAGUA"}):
        g = [r for r in CORE if r["country"] == "NICARAGUA" and r["year"] == a]
        if len(g) >= 20:
            partes.append(f"{a}: {pct(tasa(g)[2])} (n={num(len(g))})")
    return " · ".join(partes)


def _top_des(des: Counter) -> str:
    return ", ".join(f"«{d.title()}» ({num(n)})" for d, n in des.most_common(6))


def _temas_txt(temas: Counter) -> str:
    tot = sum(temas.values()) or 1
    return "\n".join(f"- {t.title()}: {num(n)} ediciones ({pct(n / tot)})"
                     for t, n in temas.most_common(8))


def _med_nic() -> str:
    return num(mediana([r["duration_s"] for r in NIC if r["duration_s"]]), 0)


def _tope_nic() -> str:
    g = [r for r in NIC if r["over_limit"] is not None]
    return pct(sum(1 for r in g if r["over_limit"] == 0) / len(g)) if g else "—"


def _desc_nic() -> str:
    return num(mediana([r["desc_len"] for r in NIC if r["desc_len"] is not None]), 0)


def cap16() -> str:
    filas = []
    for r in sorted(INTL, key=lambda x: (x["year"], x["place_best"] or 9)):
        filas.append([str(r["year"]), str(r["place_best"]), (r["team"] or "")[:34],
                      (r["challenge_name"] or "")[:38].title(), nombre_pais(r["country"]),
                      num(r["duration_s"], 0) if r["duration_s"] else "—"])
    paises = Counter(r["country"] for r in INTL)
    filas_p = [[nombre_pais(p), num(n), pct(n / len(INTL))] for p, n in paises.most_common()]
    k, n, t = tasa(INTL)
    lo, hi = wilson(k, n)
    return f"""## 16. Internacional: el escaparate

### 16.1 Qué es esta colección

{num(len(INTL))} premios en diez ediciones, entre {_min_max()} por año. Es el 1,1 % del
registro y la única colección donde compiten países entre sí. La tasa de primer lugar es
{pct(t)} (IC {pct(lo)} – {pct(hi)}), más baja que en sede: aquí no compiten tres equipos por
desafío, compiten delegaciones.

Nicaragua tiene 9 premios internacionales y una tasa de primeros de 55,6 %, pero con n=9 el
intervalo va de 26,7 % a 81,1 %. **No se puede concluir nada** de esa cifra; está en el libro
porque es la pregunta que todo el mundo hace.

### 16.2 Todos los premios internacionales

{tabla(["Año", "Puesto", "Equipo", "Desafío", "País", "Duración"], filas, "iisssd")}

{fig("fig13_pais_anio.png", "Tasa de primer lugar por país y año")}

### 16.3 Los países

{tabla(["País", "Premios", "% del total"], filas_p, "idd")}

### 16.4 Lo que el internacional enseña

Con 58 filas no se pueden hacer comparaciones finas, pero hay tres observaciones robustas:

1. **La duración es la misma.** Mediana {num(mediana([r['duration_s'] for r in INTL if r['duration_s']]), 0)} s,
   igual que en sede. El formato no cambia al subir de nivel.
2. **Los desafíos son los mismos.** La final internacional reutiliza los enunciados de sede;
   no hay un temario propio.
3. **Los videos desaparecen más.** 16 de 58 sin audio, con sobrerrepresentación de primeros
   lugares (cap. 10). El escaparate es también el lugar donde más se borra el registro.

### 16.5 Si el objetivo es ganar internacional

El libro no puede dar una receta, pero sí puede decir dónde no buscar: el tema no distingue,
la duración no distingue, la miniatura no distingue. Lo que queda es lo que no se midió —la
claridad del problema, la contundencia del prototipo, la credibilidad del equipo— y lo que
el jurado internacional, que no conoce el contexto local, necesita explícitamente: **una
sola idea que se entienda sin saber nada del país**.
"""


def _min_max() -> str:
    c = Counter(r["year"] for r in INTL)
    return f"{min(c.values())} y {max(c.values())} premios"


def cap17() -> str:
    bloques = []
    for a in sorted({w["year"] for w in WINNERS}):
        g = [w for w in WINNERS if w["year"] == a]
        sedes = Counter(w["sede"] for w in g if w.get("sede"))
        paises = Counter(w["country"] for w in g if w.get("country"))
        des = Counter(w["challenge_name"] for w in g if w.get("challenge_name"))
        cores = [r for r in CORE if r["year"] == a]
        dur = mediana([r["duration_s"] for r in cores if r["duration_s"]])
        tops = ", ".join(f"{nombre_pais(p)} ({num(n)})" for p, n in paises.most_common(3))
        filas = [[nombre_pais(p), num(n)] for p, n in paises.most_common(6)]
        bloques.append(f"""
### {a}

**{num(len(g))} premios · {num(len(sedes))} sedes · {num(len(paises))} países · {num(len(des))} desafíos**

Los países con más premios fueron {tops}. La sede más prolífica fue
**{sedes.most_common(1)[0][0].title() if sedes else '—'}** con
{num(sedes.most_common(1)[0][1]) if sedes else 0} premios, y el desafío más repetido
«{(des.most_common(1)[0][0] if des else '—').title()}» con {num(des.most_common(1)[0][1]) if des else 0}
menciones. Duración mediana de los videos de sede: **{num(dur, 0)} s**.

{tabla(["País", "Premios"], filas, "id")}
""")
    return f"""## 17. Los diez años, uno por uno

Esta sección es el historial completo del registro. Cada año tiene su ficha: volumen, sedes,
países, repertorio y duración. Sirve como referencia rápida y como contexto para leer
cualquier cifra de los capítulos anteriores.

{''.join(bloques)}

### 17.11 Qué cambió en diez años

| Dimensión | 2017 | 2026 | Lectura |
|---|---|---|---|
| Premios registrados | {_n(2017)} | {_n(2026)} | el evento se multiplicó por {num(_nraw(2026) / max(1, _nraw(2017)), 1)} |
| Sedes | {_s(2017)} | {_s(2026)} | la red creció más que los equipos por sede |
| Países | {_p(2017)} | {_p(2026)} | de un certamen nacional a uno latinoamericano |
| Desafíos | {_d(2017)} | {_d(2026)} | el repertorio se estabilizó, no creció al mismo ritmo |
| Duración mediana | {_dur(2017)} | {_dur(2026)} | el formato se normalizó en torno a los dos minutos |
| Descripción mediana | {_desc(2017)} | {_desc(2026)} | sigue sin describir el proyecto |

La conclusión del capítulo es que el certamen **se profesionalizó en la forma y no en la
documentación**. Los videos están mejor producidos, duran lo que deben durar y se suben a
tiempo; pero la ficha sigue sin decir qué hace el proyecto. Diez años después, la única
forma de saber qué hizo un ganador es ver el video.
"""


def _nraw(a: int) -> int:
    return sum(1 for w in WINNERS if w["year"] == a)


def _n(a: int) -> str:
    return num(_nraw(a))


def _s(a: int) -> str:
    return num(len({w["sede"] for w in WINNERS if w["year"] == a and w.get("sede")}))


def _p(a: int) -> str:
    return num(len({w["country"] for w in WINNERS if w["year"] == a and w.get("country")}))


def _d(a: int) -> str:
    return num(len({w["challenge_name"] for w in WINNERS if w["year"] == a and w.get("challenge_name")}))


def _dur(a: int) -> str:
    g = [r["duration_s"] for r in DF if r["year"] == a and r["collection"] == "sede" and r["duration_s"]]
    return f"{num(mediana(g), 0)} s" if g else "—"


def _desc(a: int) -> str:
    g = [r["desc_len"] for r in DF if r["year"] == a and r["collection"] == "sede"
         and r["desc_len"] is not None]
    return f"{num(mediana(g), 0)} car." if g else "—"
