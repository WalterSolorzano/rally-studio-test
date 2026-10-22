# Banco de ganadores SIRLI — formato y uso

Fuente: `https://sirli.org/ganadores/` (tres colecciones públicas: `sede`, `nacional`,
`internacional`), años 2017–2026.

## Archivos

| Archivo | Qué es | Tamaño típico |
|---|---|---|
| `winners.jsonl` | Registro maestro. Un JSON por línea, un premio por línea. | ~4 MB |
| `winners.csv` | Misma data, separador `;`, BOM UTF-8 para Excel. | ~1,5 MB |
| `video_index.json` | Un ítem por video único, con los premios que lo respaldan. | ~2 MB |
| `manifest.json` | Fecha de captura, conteos por año/colección/país, hash SHA-256, URLs. | pequeño |
| `raw/` | HTML original comprimido (`.html.gz`) por colección y año. Auditoría. | ~15 MB |
| `video_queue.jsonl` | Subconjunto priorizado para transcripción y análisis visual. | pequeño |
| `transcripts/<video_id>.json` | Transcripción + metadatos del video. | ~5 KB |
| `frames/<video_id>.jpg` | Hoja de contacto 3×2 (6 fotogramas) del video. | ~120 KB |
| `visual/<video_id>.json` | Descripción gráfica estructurada escrita a partir de la hoja. | ~3 KB |
| `analisis/` | Destilados: patrones, tablas, informe. | pequeño |
| `meta/videos.jsonl` | Metadatos públicos de YouTube: título, descripción, duración, vistas, canal, fecha, tags, idiomas de subtítulos. | ~8 MB |
| `meta/thumbs/<video_id>.jpg` | Miniatura 480×360 de cada video (4.196 descargadas). | ~50 MB |
| `excel/ganadores_sirli.xlsx` | Entregable: hoja Ganadores (5.136 filas), Resumen, Desafíos, Transcripciones, Metodología. | ~1 MB |

## Esquema de `winners.jsonl`

```json
{
  "year": 2026,
  "collection": "sede | nacional | internacional",
  "place": 1,
  "place_label": "PRIMER LUGAR",
  "team": "NOMBRE DEL EQUIPO",
  "category": "ÁREA INNOVACIÓN | ÁREA IMPACTO SOCIAL | (vacío en internacional)",
  "challenge": "04 - MANEJO ECOLÓGICO DE RESIDUOS...",
  "challenge_number": "04",
  "challenge_name": "MANEJO ECOLÓGICO DE RESIDUOS...",
  "sede": "UTNFRRE/INTECNOR",
  "country": "ARGENTINA",
  "country_code": "AR",
  "video_url": "https://youtu.be/15iVMqt_tuw",
  "video_id": "15iVMqt_tuw",
  "source_url": "https://sirli.org/ganadores/nacional/2026/?page=1&ipp=Todos&field=1&sort=0",
  "id": "sha1 corto de (año|colección|puesto|equipo|desafío|sede)"
}
```

`place` es `null` si el sitio publica una etiqueta distinta de primero/segundo/tercero.

## Cómo se regenera

```bash
python scripts/scrape_ganadores_sirli.py          # banco completo, reanudable por caché
python scripts/sirli_videos.py queue --since-year 2022 --sede-sample 8
python scripts/sirli_videos.py subs               # subtítulos de YouTube, con freno anti-429
python scripts/sirli_videos.py frames             # hojas de contacto 3×2
python scripts/sirli_videos.py report             # estado
python scripts/sirli_meta.py --workers 10         # metadatos de los 4.709 videos
python scripts/sirli_thumbs.py                    # miniaturas
python scripts/sirli_asr.py --scope intl          # voz a texto local (faster-whisper)
python scripts/sirli_pares.py                     # contrapartes 2.º/3.º para comparar guiones
python scripts/sirli_dataset.py                   # dataset de 46 columnas por edición
python scripts/sirli_analisis.py                  # corpus + resumen
python scripts/sirli_visual_stats.py              # métricas de miniaturas y fotogramas
python scripts/sirli_figuras.py                   # 8 figuras descriptivas
python scripts/sirli_modelo.py                    # logística + HistGB con GroupKFold
python scripts/sirli_probabilidad.py              # banda de probabilidad absoluta (censura del podio)
python scripts/sirli_hipotesis.py                 # informe intermedio (supersedido)
python scripts/sirli_sistemico.py                 # 42 hipótesis + informe profundo + 5 figuras
python scripts/sirli_resumen_ejecutivo.py         # one-pager + hipotesis.csv
python scripts/sirli_excel.py                     # Excel del banco
```

## Cobertura al 22/10/2026

| Etapa | Resultado |
|---|---|
| Ganadores scrapeados | 5.136 premios, 4.709 videos |
| Metadatos de video | 4.688 de 4.709 (21 en `failed: true`) |
| Miniaturas | 4.196 |
| Hojas de fotogramas 3×2 | 112 (66 videos caídos en la muestra) |
| Transcripciones con texto | 328 videos → 426 ediciones |
| Soluciones extraídas en el Excel | 4.557 de 5.136 filas (88,7 %) |
| Hipótesis probadas | 42 (3 a favor, 8 señales débiles, 25 sin evidencia) |
| Tamaño en disco | 86 MB (63 de ellos miniaturas) |

### Reintentar lo que YouTube bloqueó

Tras 4.709 peticiones, YouTube responde `Sign in to confirm you're not a bot`. Los 21 metadatos
faltantes se recuperan así, en tandas y con enfriamiento:

```bash
python scripts/sirli_meta.py --workers 2 --sleep 3        # solo reintenta los failed
python scripts/sirli_videos.py subs --redo-none --limit 20
```

Si el bloqueo persiste, exportar cookies del navegador
(`yt-dlp --cookies-from-browser chrome`) o esperar unas horas. No hay daño permanente: el script
solo agrega líneas y deduplica por `video_id`.

El sitio sirve la cadena TLS incompleta: el scraper baja con verificación desactivada
y guarda el HTML en `raw/` para que cada fila sea auditable.

## Límites conocidos

- `internacional` no publica categoría (el sitio no la expone en esa vista).
- 16 premios no tienen video enlazado.
- YouTube responde 429 con frecuencia: el pipeline espera y reintenta; no paralelizar.
- La descripción gráfica se escribe a partir de 6 fotogramas por video; no sustituye ver el video.
