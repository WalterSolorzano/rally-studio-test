# Desplegar el sistema sin pagar nada

> Ruta 0-costo cuando quieras pasar de local a en línea. No hace falta tarjeta
> en ninguno de los 3 servicios: son plan free real (con límites honestos, ver abajo).

## Los 3 servicios (todos gratis)

| Pieza | Servicio | Plan | Límite honesto |
|---|---|---|---|
| Frontend (dashboard + site) | GitHub Pages o Netlify | free | estático, ilimitado |
| Backend (isla: `rally_service.py` + `/api/sync/*` + presencia + IA) | Render | free | se duerme tras ~15 min sin tráfico; primer click ~30-50 s y luego va normal (780 h/mes) |
| IA gratis (OCR, Pulir, copiloto) | FreeLLMAPI | free | ~34 proveedores gratis detrás de una sola unified key |

Todo es **opcional**: sin isla, el sistema sigue siendo 100 % local (Fase 2.5 verificada).

## Pasos (una sola vez)

1. **Sube el repo a GitHub** (ya está: este repo). El front sale gratis con
   `.github/workflows/pages.yml` — el workflow ya copia `dashboard/`, `site/` y
   `design/` y configura la variable de la isla si la defines.
2. **Back en Render (free, sin tarjeta):**
   - New → Blueprint → apunta al repo → Render lee `deploy/render.yaml`
     (Dockerfile en `deploy/`, healthcheck en `/api/ai/status`).
   - Setea los secretos (los lee del panel, nunca van al repo):
     - `RALLY_SYNC_TOKEN`= genera uno largo (ej. `openssl rand -hex 24`)
     - `RALLY_AI_URL` y `RALLY_AI_KEY`= la freellm (siguiente paso)
     - `RALLY_AI_USER_RATE_LIMIT=24` · `RALLY_AI_RATE_LIMIT=60`
3. **IA gratis (FreeLLMAPI):**
   - Instalador local: `.\scripts\setup_ia_gratis.ps1` → copia la unified key
     (`freellm-...`) a `scripts\freellmapi.key` (nunca se sube).
   - En la isla: `RALLY_AI_URL` = la URL del .exe en modo servidor o Docker
     (`git clone github.com/tashfeenahmed/freellmapi` → `docker compose up -d`)
     y `RALLY_AI_KEY` = esa unified key. Es gratis para todos.
   - Sin key, la isla rebota honesto: OCR local EasyOCR, Pulir deshabilitado.
4. **Front hablando con la isla:** en GitHub (repo → Settings → Actions → vars):
   - `RALLY_AI_BASE_URL` = la URL del back en Render
   - re-run del workflow y listo: todo el sitio lee la isla.
5. **Tu equipo en vivo:** cada máquina corre
   `.\iniciar_rally.ps1 -ConNube -Puerto 8000` y edita como siempre;
   el puente sube cada archivo tocado y baja lo que se edite en la web.
   En la máquina que
   edita contra la isla pública setea también `RALLY_SYNC_TOKEN` (igual al del
   paso 2) o guarda en `scripts\sync.token`.

## Lo que NADIE necesita saber/saber programar

 - El espectador: solo abre la URL → pizarra en vivo + chips de presencia + toasts.
 - El editor invitado: entra por la URL, usa la ventana, acepta/descarta propuestas.
 - El anfitrión (tú): cuentas gratis + 4 variables de entorno.

## Qué te toca traer tú (donde yo no puedo entrar)

 - Crear las 2 cuentas gratis (Render y Netlify/GitHub Pages yaActivation) y apuntar el deploy al repo.
 - Copiar la unified key de FreeLLMAPI a `env vars` si fuera isla (si es local: a `scripts\freellmapi.key`).
 - Inventar el `RALLY_SYNC_TOKEN` y ponarlo en los dos lados.

## Comportamientos finos a conocer (gratis, no magia)

 - Render free duerme el servicio: al primer click de la mañana tarda ~30-50 s.
 - La cuota de IA (12/día navegador · 24/h usuario · 60/h IP) vive en memoria:
   reinicio = contadores a cero. Protege el pool pay-free; acepta el reinicio.
 - Todos los datos viven en `dashboard/data/` (SQLite) — para respaldo real se
   guarda la carpeta (o se migra a Supabase en un futuro 3.x si se quisiera).
