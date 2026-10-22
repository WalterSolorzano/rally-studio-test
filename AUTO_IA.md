# IA Automática en Rally Studio

El tablero puede generar los briefings multi-IA y la tesis del Copiloto **sin copiar/pegar a mano**.
Todo el descubrimiento es dinámico en tiempo de ejecución: el código publica datos personales.
No hay claves API, rutas ni modelos fijados en el código (esto se publica en GitHub).

## Cómo funciona

```
UI (Generar con IA)
   │  POST /api/ai { prompt, model }
   ▼
rally_service.py          ← detección dinámica
   1. CLI de OpenCode en PATH  →  opencode run [--model X]
   2. Endpoint OpenAI-compatible de capa gratuita (env RALLY_AI_URL + RALLY_AI_KEY + RALLY_AI_MODEL)
   3. Sin nada de lo anterior  →  chips de chats web gratis (ChatGPT, Claude, Gemini, OpenCode Web, Antigravity)
   │  GET /api/ai/progress?job=…  cada 600 ms
   ▼
El texto aterriza EN VIVO en el cuadro de destino del tablero
```

- **Detección**: `shutil.which("opencode")` + `opencode models` → lista de modelos del usuario (cache de 10 min). Nada se hardcodea.
- **Tiempo real**: cada generación corre en un job en segundo plano; el navegador consulta `/api/ai/progress` y va pintando el texto a medida que sale.
- **Modelo especializado por tarea**: cada tarjeta (Tesis, Patentes, Blender, Presupuesto, Voz, Auditoría) sugiere el tipo de modelo más apto casando patrones de nombre (ej. tesis → razonamiento profundo; estadísticas → deep-research) contra la lista descubierta. El usuario puede cambiar el modelo en el selector de cada tarjeta y la preferencia queda guardada en su navegador.
- **Fallback web**: si nada automático está disponible, aparecen chips que copian el prompt al portapapeles y abren la web del chat elegido. Solo queda pegar la respuesta.

## Lo que cada quien necesita tener

| Nivel | Requisito |
|---|---|
| Automático completo | OpenCode instalado (`npm i -g opencode-ai` o bun) y `opencode auth login` una sola vez |
| Automático alternativo | Cualquier API de capa gratuita (OpenRouter free, Gemini AI Studio, Groq, Cerebras) en las variables de entorno |
| Chips web | Nada: solo un navegador |

## Variables de entorno (opcionales)

Usa este bloque solo si quieres una API de capa gratuita en lugar de OpenCode:

```bash
export RALLY_AI_URL="https://openrouter.ai/api/v1"   # estilo OpenAI /chat/completions
export RALLY_AI_KEY="pk-..."                          # clave de capa gratuita
export RALLY_AI_MODEL="meta-llama/llama-3.2-3b-instruct:free"
```

En Windows PowerShell:

```powershell
$env:RALLY_AI_URL = "https://openrouter.ai/api/v1"
$env:RALLY_AI_KEY = "pk-..."
$env:RALLY_AI_MODEL = "meta-llama/llama-3.2-3b-instruct:free"
python scripts/rally_service.py
```

## FreeLLMAPI local (recomendado: 34 proveedores gratis, un solo endpoint)

[FreeLLMAPI](https://github.com/tashfeenahmed/freellmapi) agrega ~7.4 mil millones de tokens/mes
de capas gratis (Google, Groq, Cerebras, Mistral, OpenRouter, Cloudflare, Cohere, NVIDIA...)
detrás de un único endpoint OpenAI-compatible, con routing y failover automaticos.

### Instalación automática (un comando)

```powershell
# App portable, sin admin, queda en %LOCALAPPDATA%\Programs\FreeLLMAPI
powershell -ExecutionPolicy Bypass -File .\scripts\setup_ia_gratis.ps1

# Instalador oficial con asistente (o -Silencioso para /S)
powershell -ExecutionPolicy Bypass -File .\scripts\setup_ia_gratis.ps1 -Modo instalador
```

El script consulta la última Release, descarga el asset de Windows, compara el **sha256 publicado** (aborta si no coincide) y extrae/instala. Con `-SoloDescargar` deja solo el archivo.

Luego basta guardar la unified key en `scripts\freellmapi.key` (una línea, ignorada por git) y arrancar con `.\Iniciar Rally.bat`: el lanzador busca la app, la arranca si no está escuchando en su puerto y exporta `RALLY_AI_URL` + `RALLY_AI_KEY` al servicio. Si no la encuentra, avisa y sigue sin IA (el arranque nunca se bloquea por esto). Parámetros útiles del lanzador: `-SinIA` y `-IaPuerto 3001` (Docker/panel web).

### Instalación manual (elegir una)

1. **App de escritorio** (lo más simple): descarga el `.exe` de
   [Releases](https://github.com/tashfeenahmed/freellmapi/releases/latest),
   instálalo, y del ícono de la bandeja copia tu **unified key** (sin usuario ni clave de panel).
2. **Docker**: `curl -fsSL https://freellmapi.co/install.sh | bash` (WSL) o
   `git clone https://github.com/tashfeenahmed/freellmapi.git` + `docker compose up -d` → panel en `http://localhost:3001`.

Luego, en el panel (o bandeja → Open Dashboard):
- pega tus claves de proveedor en la página **Keys** (login básico una vez por proveedor),
- copia tu **unified key** (`freellm-...`).

Apunta el puente de Rally Studio al endpoint local:

```powershell
$env:RALLY_AI_URL = "http://127.0.0.1:31415/v1"   # app escritorio (Docker: http://localhost:3001/v1)
$env:RALLY_AI_KEY = "freellm-XXXX..."
python scripts/rally_service.py
```

**Verifica en qué estado quedó la IA (honesto, sin simular nada):**

```powershell
.\scripts\verificar_ia.ps1   # verde = listo; amarillo 3 = pega tus claves de proveedor en el panel Keys
```

Cada equipo pega SUS propias claves gratis de proveedor (Google AI Studio, Groq...)
en el panel de la app; el sistema nunca las pide ni las guarda — solo la unified
key local (`scripts\freellmapi.key`, ignorada por git).

(Opcional) fuerza el modelo vision para el OCR:

```powershell
$env:RALLY_VISION_MODEL = "google/gemini-2.5-flash"   # o el modelo vision activo en tu panel
```

## OCR con IA visual (jerarquizado) + red de seguridad EasyOCR

```
POST /api/ocr { image, name }
   │  Capa 1: endpoint OpenAI-compatible (RALLY_AI_URL) con modelo vision
   │          → {source:"ai", challenges:[{title, demand, ods, category}], text}
   │          retos jerarquizados directos, sin regex
   │  Capa 2: EasyOCR local → {source:"easyocr", text, lines} (red de seguridad)
   ▼
app.js: si `challenges` viene poblado lo consume tal cual; si no, aplica el
parser regex clásico sobre `text` (y Tesseract.js en el navegador como último recurso).
```

Pulido rápido de textos/prompts:

```
POST /api/ai/quick { text, task: "polish" | "reframe" } → { status:"ok", text }
```

Modelo mini elegido del catálogo (`flash/haiku/mini/fast/turbo`), respuesta sincrónica.

Como los proveedores gratis se saturan seguido (`Rate limit exceeded`), el backend
prueba hasta 3 modelos candidatos antes de rendirse. Si todos fallan, la respuesta
es honesta sobre el motivo:

```
{ "status":"error", "reason":"rate-limit", "message":"Los modelos gratis estan saturados...",
  "detail":"Error: Rate limit exceeded. Please try again later." }
```

Antes de esta mejora el error se reportaba como `no-provider` ("Instala OpenCode..."),
que era engañoso: sí había IA conectada, solo estaba saturada. La UI muestra el motivo
y el detalle en el toast del botón **Pulir ✨**.

Lo mismo aplica a la capa vision del OCR: si el modelo vision falla, la respuesta de
`/api/ocr` trae `"note"` (p. ej. `"Los modelos vision gratis estan saturados (rate limit);
se uso EasyOCR local."`) y la UI lo avisa, para que el OCR local nunca parezca la única
opción existente.

### Un solo servicio a la vez (importante en Windows)

En Windows, `allow_reuse_address=True` permitía que **dos** procesos escucharan el mismo
puerto; el SO repartía las conexiones y una instancia vieja seguía respondiendo con código
obsoleto (síntoma: "ya reinicié y devuelve lo mismo"). Ahora:

- El servidor usa `SO_EXCLUSIVEADDRUSE` en Windows (sin doble bind).
- Antes de arrancar, cada puerto candidato se comprueba con un bind exclusivo.
- Si el puerto está ocupado se avisa claro y se pasa al siguiente:

```
Puerto 8000 ocupado por otro proceso: probando el siguiente.
```

Para reiniciar limpio: cierra la ventana/consola vieja del servicio (o `Get-CimInstance
Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -like '*rally_service*' }
| ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`) y vuelve a arrancar.

## Endpoints del puente

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/ai` | POST | Arranca un job: `{prompt, model}` → `{status:"started", job}` o `{status:"no-provider"}` |
| `/api/ai/progress?job=X` | GET | Estado del job + texto parcial acumulado (`done:true` al final) |
| `/api/ai/models` | GET | Lista de modelos descubiertos (OpenCode + endpoint de entorno) |
| `/api/ai/status` | GET | Resumen barato del estado del puente (sin gastar cuota) |
