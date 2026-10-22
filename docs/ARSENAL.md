# Arsenal de Rally Studio

Herramientas de verificacion y registro que se adoptaron del Kit Operativo v8, auditadas
contra este repo. No reemplazan el motor: lo alimentan antes de la carga en SIRLI.

## Los tres checks que pueden costar el certamen

```bash
python arsenal.py check-todo
```

| Check | Regla | Por que importa |
|---|---|---|
| `check-duracion` | <= 120 s y pista de audio | Un segundo de mas descalifica |
| `check-coherencia` | Cifras iguales en guion, narracion y pautado | Discrepancia = perdida en prefactibilidad |
| `check-campo` | Limite de caracteres por campo | Un campo puede exceder aunque el total no |

Cada uno tambien se ejecuta solo:

```bash
python arsenal.py check-duracion assets/voice/narration.mp4
python arsenal.py check-coherencia --ignorar 2026,120
python arsenal.py check-campo --docx docs/pautado_draft.docx
```

Codigos de salida: `0` pasa, `1` hay algo critico o falta el artefacto.

### Coherencia: que compara

Normaliza `1,250`, `1.250`, `1250` y `$1,250.00` a la misma cifra. Falla solo con cifras
significativas (decimales, porcentajes, moneda o valores >= 100); las enumeraciones pequenas
se informan como menores. Ignora lineas de limites ("max. 1,250 caracteres") y marcas de
tiempo (`0:00`).

## Registro de herramientas

```bash
python arsenal.py status       # que hay, version, licencia, estado
python arsenal.py refresh      # detecta versiones en esta maquina
python arsenal.py refresh --write
```

`arsenal.lock.yaml` es la fuente unica. Las entradas con licencia `verificar` **no se
instalaron**: leer el LICENSE del repo antes de hacerlo. No se instalan catalogos enteros.

## Prueba de humo

```bash
python smoke.py
```

Verifica en segundos que ffmpeg mide, que python-docx lee, que el conteo por campo detecta
un exceso y que la coherencia normaliza miles. No necesita GPU ni red.

## Territorios

`territorios/banco.json` guarda 12 temas probables con municipios candidatos y que dato
validar. No contiene cifras: las cifras van a `research/claims.json`.

## Voz

`scripts/gen_voice.py` ahora prueba Chatterbox -> Kokoro -> Piper -> edge-tts y deja:

- `assets/voice/voice_manifest.json` — motor real, si es sintetica, watermark, si es simulada.
- `assets/voice/declaracion_ia.txt` — linea para pegar en el pautado.

Piper requiere `PIPER_BINARY` y `PIPER_MODEL` (ruta al `.onnx` de la voz). La licencia de
cada voz es aparte de la del motor.

Qwen3-TTS queda **no integrado** a proposito: su API y la calidad del espanol no estan
verificadas. Esta en el registro como pendiente, no como opcion.

## Contadores del Acto IV

`plantillas/contadores/index.html` es una pieza autocontenida para grabar con Playwright u
OBS. Si `plantillas/gsap.min.js` no existe, muestra los valores finales sin animacion: nunca
rompe la grabacion. GSAP 3.13.0 ya esta incluido en `plantillas/gsap.min.js` bajo la
GSAP Standard License (no es MIT); el banner de licencia se conserva.

## Lo que no se trajo del kit

- Las 9 "skills propias" del kit: duplicaban `gen_script`, `gen_pautado`, `gen_budget`,
  `gen_canvas`, `gen_voice` y `gen_palette`. Dos fuentes de verdad.
- `color-palette` y `colormind`: ya resueltos en `gen_palette.py` (Pillow + WCAG).
- `brandkit` y `Logo Creator`: cubiertos por `propuesta-diseno` y las skills globales.
- El tono "nada es ley": las bases oficiales y las reglas duras del repo siguen mandando.
