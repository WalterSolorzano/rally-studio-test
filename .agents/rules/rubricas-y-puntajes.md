---
trigger: model_decision
description: Aplica al generar, revisar o puntuar cualquier entregable contra la rúbrica oficial de 100 puntos del certamen activo.
---

# Rúbricas y puntajes

Dos matrices distintas, 100 puntos cada una. Usa la del `rally_type` activo. Fuente:
`knowledge/rubric_matrices.md` y `knowledge/rubric_latam.md`.

## Nacional — Nicaragua Innova (25 / 25 / 20 / 15 / 15)

| Criterio | Pts | Qué mira el jurado |
|---|---|---|
| Grado de Innovación, Creatividad y Hibridación Tecnológica | 25 | Originalidad local, hibridación accesible (ESP32/LoRa, gemelos digitales, IA, biomateriales), prototipo conceptual o físico, adaptabilidad a la infraestructura nacional |
| Impacto Social, Territorial y Alineación con Políticas Públicas | 25 | PNDH 2022–2026 explícito, programas nacionales, anclaje territorial nombrado, cuantificación de beneficiarios |
| Viabilidad Técnica, Operativa y Uso de Recursos Locales | 20 | Talleres INATEC / labs CNU, materias primas o pasivos locales, rigor metodológico, rol de los beneficiarios en el mantenimiento |
| Prefactibilidad Económica, Sostenibilidad y Modelo Canvas | 15 | Presupuesto unitario en C$ y USD, modelo viable (cooperativas, alcaldías, MEFCCA), costo-beneficio, plan a 12 meses con indicadores |
| Calidad del Documento, Video Pitch y Coherencia de Marca | 15 | Documento ≤ 10 páginas con APA y fuentes oficiales (BCN, INIDE), video de 2 min claro, naming dual, identidad cultural |

## Latam — Rally Latinoamericano (30 / 20 / 20 / 20 / 10)

| Criterio | Pts | Qué mira el jurado |
|---|---|---|
| Grado de Innovación | 30 | Disrupción tecnológica, modularidad, diseño paramétrico, ausencia de soluciones genéricas |
| Impacto Positivo en la Sociedad | 20 | Beneficiarios cuantificados en América Latina, mitigación de vulnerabilidad real |
| Prefactibilidad Económica, Social y Ambiental | 20 | Desglose B2B/B2G sin subsidio permanente, costos unitarios en USD, economía circular |
| Viabilidad Técnica | 20 | Balances de masa/energía, diagramas de bloques, CAD con despiece real (tornillos, prensas, puertos) |
| Calidad de la Presentación | 10 | Densidad visual, locución 130–140 ppm, cero relleno, cero intros vacías |

## Cómo revisar un entregable

1. Identifica el criterio que el entregable alimenta.
2. Contrasta con los ítems de la tabla. Nombra el ítem incumplido, no "mejorable".
3. Propón la corrección concreta (texto, cifra, fuente).
4. Si falta un dato, **no lo inventes**: pídelo o márcalo como `[SIMULADO]`.

## Errores que restan de inmediato

- Datos sin fuente verificable.
- Incoherencia entre piezas (precio del video ≠ precio del presupuesto).
- Fantasía térmica o energética (consumo imposible para la carcasa propuesta).
- Diseño "estilo IA": gradientes morados, glassmorphism, tarjetas repetidas, emojis como íconos.
