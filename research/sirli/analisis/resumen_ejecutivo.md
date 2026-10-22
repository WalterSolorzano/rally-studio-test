# Lo que el corpus de SIRLI dice, en una página

Generado por `scripts/sirli_resumen_ejecutivo.py` a partir de `sistemico.json`.
El detalle, las tablas completas y las reservas metodológicas están en
[`investigacion_profunda.md`](investigacion_profunda.md).

## Las cinco frases que importan

1. **El corpus no tiene perdedores.** SIRLI publica solo los tres primeros de cada
   desafío. Todo lo que sigue es «probabilidad de ser 1.º entre los tres premiados»,
   y solo vale para 2021–2026: antes de 2021 el registro publica casi solo primeros.
2. **Dos efectos grandes, y ambos son aritmética.** Cuántos equipos premiados lleva tu
   sede y cuántos comparten tu desafío. El segundo es casi tautológico: si tu sede se
   lleva los tres puestos, tienes 1/3 por construcción.
3. **El video no se distingue por nada de lo que medimos.** Duración, miniatura, título,
   subtítulos, descripción, marcadores del guion: todo cae en el ruido tras corregir
   por comparaciones múltiples (3 a favor, 0 en contra,
   25 sin evidencia de 42).
4. **El hueco más rentable no es técnico.** El 0 % de los guiones pone a hablar a un
   usuario real. No requiere más datos para justificarse: requiere que alguien lo haga.
5. **La competencia se está endureciendo.** En sede Nicaragua, la tasa de primer lugar
   pasó de 54,4 % (2021) a 38,6 % (2026). El rally creció más rápido que los premios.

## Lo único que la evidencia permite recomendar

| Prioridad | Acción | Respaldo | Coste |
|---|---|---|---|
| 1 | Repartir los equipos de tu sede en desafíos distintos | H01/H11, +19,3 pp | decisión, no producción |
| 2 | Escribir 80–200 caracteres de descripción **nombrando el proyecto** | H30, +10,1 pp | 10 minutos |
| 3 | Usar 110–120 s de video, sin relleno | H42, −6,0 pp si bajas de 110 s | guion |
| 4 | Título con nombre + desafío + separador | H18/H19/H20, +4 a +6 pp (señal débil) | 2 minutos |
| 5 | Meter una voz de usuario real | 0 % del corpus lo hace | una llamada |

## Lo que NO hay que hacer (y por qué)

- **No** elegir desafío «de nicho» esperando menos rivales: la probabilidad es plana en
  todo el rango (H02/H03/H10 refutadas).
- **No** estirar el video por encima de 120 s creyendo que impresiona: H14 es nula.
- **No** invertir en la miniatura: 4.196 miniaturas dan colorido, brillo y caras idénticos
  entre 1.º, 2.º y 3.º.
- **No** confiar en haber ganado antes: H08 es nula.
- **No** citar tablas de cifras: el efecto aparente era un error de marcador (H38).

## Hipótesis que sobrevivieron

| ID | Hipótesis | Δ | Tasas | p |
|---|---|---|---|---|
| H01 | Las sedes pequeñas dan más primeros lugares por equipo | +19,3 pp | 54,4% vs 35,1% | p <0,001 |
| H42 | Quedarse muy por debajo del límite (≤110 s) cuesta | -6,0 pp | 36,8% vs 42,8% | p <0,001 |
| H30 | Repetir el nombre del proyecto en la descripción ayuda | +10,1 pp | 50,7% vs 40,5% | p 0,003 |

## Curiosidades

- **Tamaño del experimento.** 4.181 ediciones de sede entre 2021 y 2026, 4.181 videos distintos.
- **Un desafío puede ser una multitud o un pasillo vacío.** El 5% más pequeño de las ediciones se juega con ≤37 equipos premiados en el desafío; el 5% más grande, con ≥139. La mediana es 102. Y da igual: convierte lo mismo.
- **Descripción mediana.** 15 caracteres. Un titular de periódico tiene ~60.
- **Silencio documental.** 52,4% de las fichas no explican nada del proyecto.
- **Testimonio.** 0% de las 426 transcripciones analizadas incluye voz de un usuario o beneficiario.
- **Duración.** 17,0% de los videos de sede 2021+ supera los 120 s; mediana 117 s. Los que ganan duran un segundo más que los que no: 117 contra 116.

## Tamaño del trabajo

- 42 hipótesis probadas, 2 marcadas como
  artefacto aritmético, 8 señales débiles.
- 5.117 ediciones del evento, 4.181 del corte válido
  (sede 2021+, base 41,1%).
- Todo reproducible: `sirli_dataset.py` → `sirli_sistemico.py` → este script.

## Lo que falta

| Vacío | Coste | Qué desbloquea |
|---|---|---|
| Transcribir los 1.204 videos de Nicaragua | ~7 h de CPU | de 328 a más de 1.200 videos con texto |
| Codificar a mano 30–50 videos | 4 h | validar detectores y ver lo que ningún regex ve |
| Audio (voz, música, silencios) | bajo | efecto halo y fluidez |
| OCR de texto en pantalla | bajo | densidad de mensaje |
