---
trigger: model_decision
description: Aplica al escribir o revisar el pautado oficial y el guion del video de 120 segundos.
---

# Pautado y guion

## Pautado: cinco secciones

`problema`, `solucion`, `impacto`, `innovacion`, `prefactibilidad`.

- Mínimo **150 caracteres** por sección.
- Tope por sección en Latam: problema 1250, solución 1250, impacto 1000, innovación 1000,
  prefactibilidad 1500 caracteres. En Nacional no hay tope de caracteres.
- No repitas el nombre del proyecto más de una vez por sección.
- No repitas el mismo dato en dos secciones: cada sección aporta información nueva.
- Cada estadística debe existir en `research/claims.json`, con fuente, URL, año y fecha de
  acceso. Si no está, se pide o se marca `[SIMULADO]`.

## Guion: 4 actos, ≤ 120 segundos

| Acto | Ventana | Contenido |
|---|---|---|
| I — Dolor | 0:00–0:20 | Estadística dura, rostro del beneficiario. **Prohibido** el nombre del proyecto y el logo |
| II — Caja negra | 0:20–1:00 | Nombre comercial, desglose 3D/CAD/UI, mecanismo físico |
| III — Costo | 1:00–1:35 | Costo unitario, quién financia, economía circular |
| IV — Cierre | 1:35–2:00 | Tres métricas auditables, ODS animados con la paleta, cierre empático o regional |

- 240–270 palabras en total; locución 130–140 palabras por minuto.
- Cierre Latam: "piloto en [ciudad], replicable en toda América Latina".
- Cada plano del `script/shotlist.csv` lleva `asset_id`; los assets se nombran
  `asset_<shotlist_id>_<descripcion>.<ext>`.
- El presupuesto del documento y las cifras del video deben coincidir exactamente. El jurado
  cruza los últimos 25 segundos con el Excel.

## Antes de dar por bueno un entregable

- `validate_pautado.py` sin errores.
- Guion dentro de 120 s y 4 actos.
- Cifras del guion == cifras del presupuesto.
