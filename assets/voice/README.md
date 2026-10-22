# Preset de voz · Hidro Vigía

Locución oficial del proyecto, generada con Chatterbox Multilingual V3 y el finetune
oficial `ResembleAI/Chatterbox-Multilingual-es-mx-latam` (MIT).

## Archivos

| Archivo | Uso |
|---|---|
| `narration.mp4` | Entregable oficial: MP4 con audio AAC, sin video, 77.8 s |
| `previews/chatterbox_interna.mp3` | Muestra de la voz interna, 62 s |
| `previews/chatterbox_interna_e080_c045.mp3` | Muestra expresiva, 9 s |

## Preset exacto

- Voz: interna del finetune, sin `audio_prompt_path`; carga `conds.pt`
- `exaggeration=0.8`
- `cfg_weight=0.45`
- `temperature=0.8`
- `repetition_penalty=2.0`
- `seed=7`
- Pausas: 0.75 s entre párrafos
- Master: -16 LUFS integrado, pico real -1.5 dBFS
- Salida: AAC 192 kbps, 48 kHz, mono, MP4 con `+faststart`

## Instalar y reproducir

Requisitos: Python 3.11, ffmpeg y 4 GB libres. El modelo pesa cerca de 3 GB.

```powershell
# 1. ffmpeg (si falta)
winget install Gyan.FFmpeg

# 2. entorno
python -m venv .venv-voz
.venv-voz\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install chatterbox-tts soundfile numpy torch torchaudio huggingface_hub

# 3. modelo
huggingface-cli download ResembleAI/Chatterbox-Multilingual-es-mx-latam --local-dir models/latam
```

El finetune incluye:

- `t3_es_mx_latam.safetensors` (2.14 GB)
- `s3gen_v3.pt` (1.06 GB)
- `grapheme_mtl_merged_expanded_v1.json`
- `ve.pt`
- `conds.pt`

Carga el modelo con `language_id="es"`. Si el loader estándar no acepta el checkpoint V3,
usa `safe_open` tensor por tensor para el T3, `S3Gen` con `strict=False`, `MTLTokenizer` y
`VoiceEncoder`. En Windows evita `safetensors.load_file` con el archivo de 2 GB.

Genera el texto de `script/narration.txt` por párrafos, únelos con 0.75 s de silencio y
masteriza:

```powershell
ffmpeg -i narracion.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11" `
  -c:a aac -b:a 192k -ar 48000 -ac 1 -movflags +faststart -f mp4 assets/voice/narration.mp4
```

## Usar tu propia voz

También puedes poner tu voz. Hay dos rutas:

- **Clonación rápida (zero-shot):** 10–20 s limpios en mono; pasa el archivo como
  `audio_prompt_path`. Es la opción recomendada para el rally.
- **Entrenamiento o afinado:** 5–30 min de audio con transcripciones; requiere más tiempo,
  datos y, idealmente, GPU. Úsalo solo si la clonación no alcanza.

En el panel **Guion > Motor y preset de voz**, abre “¿Quieres poner tu propia voz?” y copia
la guía. Tu IA te explicará la grabación, el consentimiento, la limpieza, la clonación y,
si hace falta, el entrenamiento.

No subas los pesos del modelo al repositorio. No clones una voz real sin permiso escrito.
