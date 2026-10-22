---
name: proponer-retos
description: Propone retos nuevos o reformulados para el certamen activo, anclados a demanda real, ODS y precedentes ganadores. Úsala cuando el equipo no tiene reto, quiere comparar opciones o pide ideas para el banco de desafíos.
---

# Proponer retos

## Cuándo usarla

- El usuario aún no tiene `challenge_id` y pide ideas.
- Quiere explorar alternativas antes de elegir.
- Pide reformular un reto del comité con otro enfoque.

## Procedimiento

1. Lee `brief.json` para saber el certamen (`nacional` o `latam`), la categoría y la ciudad.
2. Lee `research/challenges.json` (banco base) y `research/claims.json` (cifras con fuente).
   Si una cifra no está ahí, **no la escribas**: describe el problema sin número.
3. Revisa `knowledge/winners_latam.md` y `knowledge/winners_analysis.md` para no proponer algo
   que ya ganó igual, y para copiar el patrón que sí funciona (hibridación ciberfísica:
   hardware comercial + software).
4. Propón **3 retos**, cada uno con este formato:

```
RETO: <título corto, sin siglas>
Quién sufre el problema: <grupo concreto y lugar>
Demanda: <qué necesita y por qué hoy no lo tiene>
ODS: <2-3>
Categoría: <tecnológica | social | procesos>
Se puede construir en 24-28 h: <sí/no y con qué>
Precedente: <ganador parecido o "sin precedente directo">
Riesgo: <lo que un jurado atacaría primero>
```

5. Calibra según el certamen:
   - **Nacional**: municipio real de Nicaragua, eje del Plan Nacional, recursos locales.
   - **Latam**: el municipio es laboratorio piloto; la solución debe ser modular, paramétrica
     y replicable en toda América Latina.
6. Ofrece servir el reto elegido a la ventana (skill `servir-a-ventana`, `--tab challenges
   --slot main`). No lo sirvas sin que el usuario elija.

## Reglas

- Nunca inventes estadísticas, poblaciones ni precios.
- No propongas retos que dependan de hardware no comprable en el país.
- Un reto debe poder explicarse en una frase; si necesitas dos, no está listo.

## Punteros

- Banco y ranking: `research/challenges.json`, `research/challenges_ranked.json`.
- Cifras verificadas: `research/claims.json`.
- Modos: `.agents/rules/modos-rally.md`.
