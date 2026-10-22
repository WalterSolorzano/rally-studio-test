# Instalación y Despliegue · Rally Studio

Guía única para **instalar**, **correr** y **desplegar** Rally Studio.
Todo lo que necesitas está aquí: no hace falta leer nada más.

---

## Índice

1. [Qué es y cómo está hecho](#1-qué-es-y-cómo-está-hecho)
2. [Requisitos](#2-requisitos)
3. [Instalación paso a paso (Windows)](#3-instalación-paso-a-paso-windows)
4. [Ejecución diaria](#4-ejecución-diaria)
5. [Instalación en macOS / Linux](#5-instalación-en-macos--linux)
6. [Conectar IA gratis (opcional)](#6-conectar-ia-gratis-opcional)
7. [API del servidor local](#7-api-del-servidor-local)
8. [Despliegue en GitHub Pages (vista pública)](#8-despliegue-en-github-pages-vista-pública)
9. [Despliegue en tu propio servidor (completo, con IA)](#9-despliegue-en-tu-propio-servidor-completo-con-ia)
10. [Publicar el repo en GitHub (primer push)](#10-publicar-el-repo-en-github-primer-push)
11. [Solución de problemas](#11-solución-de-problemas)
12. [Estructura del repositorio](#12-estructura-del-repositorio)

---

## 1. Qué es y cómo está hecho

Rally Studio es un **workbench web** para competir en maratones de innovación
(Rally Latinoamericano de Innovación · 28 h y Rally Nacional Nicaragua Innova · 24 h).

| Pieza | Tecnología | Para qué |
|---|---|---|
| Tablero (workbench) | HTML + CSS + JavaScript puro | Las 13 fases del rally, sin frameworks ni build |
| Servidor local | Python 3.10+ (biblioteca estándar) | Sirve los archivos, telemetría, OCR, compilación DOCX y el puente de IA |
| IA | OpenCode CLI o cualquier endpoint compatible OpenAI | Genera tesis, briefings, presupuesto, guion, prototipo web |
| Datos | Archivos JSON + `localStorage` | Banco de retos, ranking y estado del proyecto |

**Dos modos de uso:**

- **Local (completo):** servidor Python en tu PC → tablero + telemetría + OCR + IA.
- **GitHub Pages (público, solo lectura de la interfaz):** el tablero funciona
  íntegro (todo se guarda en el navegador), pero la telemetría, el OCR y el
  puente de IA **no** funcionan porque no hay servidor. Es ideal para mostrar la
  herramienta, no para competir.

---

## 2. Requisitos

- **Windows 10/11** (probado), o macOS / Linux.
- **Python 3.10 o superior** ([python.org](https://www.python.org/downloads/) ·
  marca *Add Python to PATH* en el instalador).
- Un navegador moderno (Chrome, Edge, Firefox).
- Opcional: **OpenCode** para IA automática gratis
  (`npm i -g opencode-ai` o el instalador de <https://opencode.ai>).

No se necesita Node.js, ni base de datos, ni cuenta en la nube.

---

## 3. Instalación paso a paso (Windows)

```powershell
# 1) Descarga o clona el repositorio
git clone https://github.com/<tu-usuario>/rally-studio.git
cd rally-studio

# 2) Entorno virtual (recomendado)
python -m venv .venv
.\.venv\Scripts\activate

# 3) Dependencias
pip install -r requirements.txt

# 4) Arrancar
.\Iniciar Rally.bat
```

`Iniciar Rally.bat` hace tres cosas: levanta el servidor **desacoplado**
(sobrevive aunque cierres la terminal), abre el navegador y escribe el registro
en `%TEMP%\rally_service.log`.

URL del tablero: **<http://localhost:8000/dashboard/>**

> Si prefieres control total:
> `powershell -ExecutionPolicy Bypass -File .\iniciar_rally.ps1 -Puerto 8000`

---

## 4. Ejecución diaria

| Quiero… | Hago… |
|---|---|
| Arrancar normal | doble clic en `Iniciar Rally.bat` |
| Arrancar en otro puerto | `.\iniciar_rally.ps1 -Puerto 8080` |
| Ver si está vivo | abrir <http://localhost:8000/health> |
| Ver el registro | `%TEMP%\rally_service.log` |
| Parar el servidor | `Get-NetTCPConnection -LocalPort 8000 -State Listen \| % { Stop-Process -Id $_.OwningProcess -Force }` |
| Arrancar desde código | `python scripts/rally_service.py` |

La primera vez el tablero abre en **“¿Qué Rally es?” (Paso 01 de 03)**:
eligues certamen, equipo y retos. Todo se guarda automáticamente en el navegador.

---

## 5. Instalación en macOS / Linux

```bash
git clone https://github.com/<tu-usuario>/rally-studio.git
cd rally-studio
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 scripts/rally_service.py        # http://localhost:8000/dashboard/
```

Equivalencias de los lanzadores de Windows:

| Windows | macOS / Linux |
|---|---|
| `Iniciar Rally.bat` | `nohup python3 scripts/rally_service.py > /tmp/rally.log 2>&1 &` |
| `iniciar_rally.ps1 -Puerto 8080` | `RALLY_SERVICE_PORT=8080 python3 scripts/rally_service.py` |
| Puerto ocupado | `lsof -ti:8000 \| xargs kill -9` |

---

## 6. Conectar IA gratis (opcional)

El tablero **no guarda claves** y no hardcodea modelos: descubre lo que exista en
la máquina. Dos caminos, en este orden:

### Opción A · OpenCode CLI (recomendada: gratis, sin claves, sin cargar tu PC)

```bash
# instalación
npm i -g opencode-ai      # o descarga el instalador de https://opencode.ai
opencode auth login       # una sola vez
```

Con eso, el servidor detecta la CLI y el botón **“Generar con IA”** funciona en
todas las tarjetas del Despacho Multi-IA y en el Copiloto. En la interfaz
aparece un **selector de modelo por tarea** (con las opciones `· gratis`
marcadas, que es lo primero que sugiere).

### Opción B · Endpoint compatible OpenAI (capa gratuita)

```powershell
# PowerShell
$env:RALLY_AI_URL="https://openrouter.ai/api/v1"
$env:RALLY_AI_KEY="sk-or-..."
$env:RALLY_AI_MODEL="deepseek/deepseek-chat-v3.1:free"
```

```bash
# macOS / Linux
export RALLY_AI_URL="https://openrouter.ai/api/v1"
export RALLY_AI_KEY="sk-or-..."
export RALLY_AI_MODEL="deepseek/deepseek-chat-v3.1:free"
```

Sirve cualquier proveedor compatible (OpenRouter, Gemini AI Studio, Groq,
Cerebras, Ollama, LM Studio…).

### Si no hay IA conectada

El sistema **no se rompe**: muestra chips de **ChatGPT · Claude · Gemini ·
OpenCode Web · Antigravity** que copian el prompt y abren la web, y el tablero
mantiene el modo manual (copiar prompt → pegar respuesta → Inyectar).

Detalles ampliados: [`AUTO_IA.md`](AUTO_IA.md).

---

## 7. API del servidor local

El servidor Python expone estas rutas (`scripts/rally_service.py`):

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/health` | Estado del servicio y proveedor de IA activo |
| GET | `/api/telemetry` | CPU / RAM / uptime en tiempo real |
| GET | `/api/ai/status` | ¿Hay IA disponible? ¿cuál? |
| GET | `/api/ai/models` | Lista de modelos descubiertos |
| POST | `/api/ai` | Lanza un trabajo de IA (devuelve `job`) |
| GET | `/api/ai/progress?job=…` | Texto en vivo del trabajo (el tablero consulta cada 600 ms) |
| POST | `/api/ai/quick` | Pulido rápido de texto (IA síncrona) |
| POST | `/api/ocr` | Lee una foto/PDF de retos (IA visual → EasyOCR) |
| POST | `/api/asset-upload` · `/api/asset-delete` | Sube/borra recursos del Estudio de Video |
| POST | `/api/compile-docx` | Genera el documento pautado (plantilla Word oficial) |
| GET | `/api/rubric` · `/api/scan-sources` | Rúbricas y escaneo de la carpeta de trabajo |

Errores previstos devuelven códigos claros (`422` = imagen dañada, con mensaje
en español para el usuario).

### Pruebas de regresión

```bash
pip install -r requirements-dev.txt    # incluye pytest
python -m pytest tests/test_challenges_parse.py -q
```

Cubren las guardas de ingesta de retos (`dashboard/challenge_parser.js`): un
informe extenso no debe convertirse en catálogo, los IDs deben ser únicos y
borrar un reto debe limpiar votos, ideas y selección. Requieren Node en el
`PATH`; sin Node, esas pruebas se saltan.

---

## 8. Despliegue en GitHub Pages (vista pública)

El repositorio ya trae el workflow `.github/workflows/pages.yml`. Publica una
copia **solo estática** de la interfaz (sin IA ni telemetría).

**Pasos:**

1. Sube el repositorio a GitHub ([sección 10](#10-publicar-el-repo-en-github-primer-push)).
2. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Haz push a `main`. El workflow empaqueta `index.html`, `style.css`, `site/`,
   `brand/` y `dashboard/` (sin capturas ni recursos subidos) y publica en
   `https://<tu-usuario>.github.io/<repo>/`.
4. Para forzar una publicación: **Actions → Deploy Rally Studio (GitHub Pages)
   → Run workflow**.

**Qué funciona en Pages:** las 13 fases, deliberación, canvas, guion, presupuesto,
prototipo, guardado en el navegador, importar/exportar proyecto y los chips de IA
web. **Qué no:** telemetría, OCR y generación automática (necesitan el servidor
local; ver [sección 9](#9-despliegue-en-tu-propio-servidor-completo-con-ia)).

---

## 9. Despliegue en tu propio servidor (completo, con IA)

Cualquier PC, mini-PC o servidor de la universidad sirve. No necesita GPU.

```bash
git clone https://github.com/<tu-usuario>/rally-studio.git
cd rally-studio
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
opencode auth login                 # opcional: IA gratis
RALLY_SERVICE_PORT=8000 nohup python3 scripts/rally_service.py > rally.log 2>&1 &
```

- **Varios equipos a la vez:** un operador crea el proyecto y reparte un enlace
  de un solo uso por persona. Todos editan secciones en vivo (≤3 s). Ver
  [sección 9.1](#91-compartir-el-proyecto-con-el-equipo).
- **Puertos:** `RALLY_SERVICE_PORT` (por defecto 8000; alterna a 8080/8001/8008
  si está ocupado).
- **HTTPS/reverse proxy:** si lo expones fuera de la red local, ponlo detrás de
  Nginx/Caddy con TLS. Las invitaciones protegen el acceso, pero el tráfico sin
  TLS viaja en claro: **no lo expongas a Internet sin HTTPS.**
- **Arranque automático (systemd):**

```ini
# /etc/systemd/system/rally-studio.service
[Unit]
Description=Rally Studio
After=network.target

[Service]
WorkingDirectory=/opt/rally-studio
ExecStart=/opt/rally-studio/.venv/bin/python scripts/rally_service.py
Environment=RALLY_SERVICE_PORT=8000
Restart=always
User=rally

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now rally-studio
```

### 9.1 Compartir el proyecto con el equipo

**Paso 1 — crear el proyecto (solo el operador, una vez):**

```powershell
python scripts/crear_proyecto.py --project mi-grupo --name "Ana"
```

Guarda el `token` que imprime: es la sesión de operador. El comando también
genera el primer `join_url`.

**Paso 2 — repartir un enlace por persona.** Cada enlace es de un solo uso y
caduca en 48 h. La persona lo abre, escribe su nombre y entra al tablero; no
instala Python ni configura nada. Todos pueden editar lo que la interfaz permite.

**Paso 3 — administrar el grupo.** Abre
`http://localhost:8000/dashboard/admin.html`, pega el `token` que imprimió el
CLI en **Sesión de operador** y pulsa *Usar sesión*. Desde ahí puedes crear más
invitaciones o revocar a alguien. La revocación corta el acceso en el siguiente
sondeo (≤1 s).

Para que los enlaces funcionen, los demás equipos deben alcanzar la IP del
operador en la misma red (`http://192.168.x.x:8000/dashboard/...`). Muchas redes
universitarias aíslan a los clientes entre sí: si un compañero no abre el
enlace, prueba con un hotspot del operador o publica el servidor en una máquina
accesible. El modo nube (backend gestionado) está diseñado en
[`superpowers/specs/2026-10-19-colaboracion-en-vivo-design.md`](superpowers/specs/2026-10-19-colaboracion-en-vivo-design.md),
pero esta versión implementa el modo local.

---

## 10. Publicar el repo en GitHub (primer push)

```bash
cd rally-studio

# 1) Inicializar (si el repo aún no tiene git)
git init
git branch -M main

# 2) Primer commit
git add .
git commit -m "Rally Studio: workbench de innovación (tablero + servidor local + IA gratis)"

# 3) Conectar con GitHub y subir
git remote add origin https://github.com/<tu-usuario>/rally-studio.git
git push -u origin main
```

Sin credenciales configuradas, usa un token de GitHub como contraseña
(*Settings → Developer settings → Personal access tokens*), o instala
`gh auth login`.

**Antes de publicar, revisa:** que no haya claves (`.env`, `*.key` están en
`.gitignore`) y que `dashboard/assets_uploads/` esté vacío (recursos del equipo).

---

## 11. Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| `python: command not found` | Python no está en el PATH. Reinstala marcando *Add Python to PATH*. |
| El navegador dice *No se puede acceder* | El servidor no está arriba: ejecuta `Iniciar Rally.bat` y comprueba <http://localhost:8000/health>. |
| “El puerto ya está en uso” | Ya hay una instancia: usa la que corre, o `.\iniciar_rally.ps1 -Puerto 8080`. |
| El servidor se cerró solo | Arráncalo con `Iniciar Rally.bat` (queda desacoplado). Mira `%TEMP%\rally_service.log`. |
| Botón *Generar con IA* dice que no hay IA | Instala y autentica OpenCode (`opencode auth login`), o define `RALLY_AI_URL`. Mientras tanto usa los chips de IA web. |
| El OCR falla con una foto | El mensaje te lo dirá: la imagen llegó dañada. Re-súbela, recórtala, o pega el texto a mano en *Pegar Texto*. |
| Se borró mi avance | El estado vive en `localStorage` de ese navegador. Usa **Exportar proyecto** (JSON) para respaldarlo, o no borres los datos del sitio. |
| En GitHub Pages no hay telemetría ni IA | Es esperado: Pages es solo estático. Corre el servidor local para todo. |
| Los gráficos se ven viejos | Fuerza recarga con `Ctrl + F5` (hay cache-busting `?v=…`). |

---

## 12. Estructura del repositorio

```
rally-studio/
├─ dashboard/            Tablero (13 fases)
│  ├─ index.html         Cáscara HTML
│  ├─ app.js             Lógica de la interfaz
│  ├─ challenge_parser.js Guardas de ingesta de retos (IDs, dedupe, purga)
│  ├─ super_agents.js    Paneles de revisión por rúbrica
│  ├─ super_agents_rubrics.js Rúbrica compilada y citada
│  ├─ style.css          Sistema de diseño (doctrina DESIGN.md)
│  ├─ data/              Datos externos: banco de retos + ranking
│  ├─ assets/            Logos, iconos
│  └─ graph.html         Visualizador del grafo de conocimiento
├─ tests/                Pruebas del parser y de los puentes del tablero
├─ site/                 Landing pública (telemetría territorial demo)
├─ scripts/
│  └─ rally_service.py   Servidor local: estáticos, telemetría, OCR, IA, DOCX
├─ research/             Retos, ranking, análisis de ganadores
├─ knowledge/            Rúbricas, patrones de ganadores, matrices
├─ docs/                 Manual maestro, canvas, plantillas
├─ brand/                Tokens de color, paleta, logos
├─ budget/               Presupuesto (JSON + XLSX)
├─ script/               Guion del video pitch (4 actos, shotlist)
├─ Iniciar Rally.bat     Lanzador (doble clic, Windows)
├─ iniciar_rally.ps1     Lanzador con puerto y registro
├─ requirements.txt      Dependencias de Python
├─ AUTO_IA.md            Cómo conectar IA gratis
├─ DESIGN.md             Doctrina visual (workbench sin tarjetas)
└─ PRODUCT.md            Especificación de producto
```

---

**Licencia:** MIT (ver [`LICENSE`](LICENSE)). Úsalo, modifícalo y compártelo
citando el proyecto.
