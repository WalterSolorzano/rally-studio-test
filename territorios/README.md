# Banco de territorios

Preparacion para el viernes 08:00, no respuestas anticipadas.

El reto lo fija el organizador y el equipo lo conoce al empezar. Este banco no adivina el
reto: reduce el tiempo que se pierde buscando donde anclar el piloto cuando ya lo tienes.

## Como usarlo

1. Identifica el **tema** del reto recibido (`cafe`, `agua`, `residuos`...).
2. Abre `territorios/banco.json` y toma **2 municipios candidatos**.
3. Valida la demanda con una fuente citables y guardala en `research/claims.json`.
4. Confirma que el municipio existe y que el dato aplica a ese territorio, no al pais entero.

Si el reto no encaja en ninguno de los 12 temas, no fuerces el banco: usalo como referencia
de formato y anade el tema nuevo con los mismos campos.

## Reglas

- Los municipios del banco son **candidatos**, no datos. No hay cifras de demanda incluidas.
- Toda estadistica del pautado sale de `research/claims.json`.
- Nacional: ancla a un municipio real y conecta con el Plan Nacional de Lucha contra la Pobreza.
- Latam: el municipio es laboratorio piloto; la solucion debe ser modular y replicable.
- El angulo ganador es una observacion de patrones, no una garantia. Si el reto pide otra
  cosa, manda el reto.

## Estructura de cada tema

| Campo | Para que |
|---|---|
| `municipios_candidatos` | Donde anclar el piloto |
| `pregunta_reto` | Reformulacion util del desafio |
| `angulo_ganador` | Enfoque observado en podios, no ley |
| `replicable_latam` | Paises para el cierre del video latam |
| `validar` | Datos que faltan y hay que citar antes de escribir |

## Punteros

- Retos disponibles: `research/challenges.json`
- Cifras citables: `research/claims.json`
- Patrones de ganadores: `knowledge/winners_analysis.md`
- Reglas por certamen: `.agents/rules/modos-rally.md`
