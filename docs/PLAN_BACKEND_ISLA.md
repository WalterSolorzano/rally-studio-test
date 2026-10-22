# Plan y estado: Backend de IA compartido ("isla") para Rally Design

## Objetivo
Un único backend publicado que todas las páginas estáticas de Rally Design consumen,
con IA gratis limitada, sin servidor local por proyecto.

## Arquitectura
- **Frontend (isla):** páginas estáticas en GitHub Pages/Netlify generadas por proyecto
  (`scripts/gen_pagina_diseno.py`). Cada página llama a la isla.
- **Backend único:** `scripts/rally_service.py` desplegado una vez en Render/Fly/Railway
  (`deploy/Dockerfile` + `deploy/render.yaml`).
  Secretos del host, nunca en el repo: `RALLY_AI_URL`, `RALLY_AI_KEY`, `RALLY_AI_MODEL`,
  `RALLY_VISION_MODEL`.
- **CORS:** dominios de las páginas publicadas vía `RALLY_ALLOWED_ORIGINS` (CSV).
- **Cuota (tres capas):**
  1. Navegador: `RALLY_IA_CONFIG.dailyQuota` (12 generaciones/día por navegador).
     Al agotarse, el panel ofrece copiar el prompt y seguir a mano.
  2. Usuario: `RALLY_AI_USER_RATE_LIMIT` (peticiones por identidad `X-Rally-Actor`,
     la misma que usan los chips de presencia; 0 = sin límite). Rebota solo a ese
     usuario con header `X-RateLimit-Scope: usuario`; no cota al resto.
  3. Servidor/IP: `RALLY_AI_RATE_LIMIT` (peticiones por IP y por ventana) y
     `RALLY_AI_RATE_WINDOW` (segundos, 3600 por defecto). Al rebotar responde
     `429` con `Retry-After` y `X-RateLimit-*`, y el cliente lo explica sin inventar.
  El límite del servidor es el que protege la cuota compartida de la isla.
- **Rotación de claves:** `RALLY_AI_KEYS` (CSV) guarda las claves de respaldo;
  `RALLY_AI_KEY` sigue siendo la principal. Ante 401/403/429 o error de cuota,
  la isla prueba la siguiente clave; ante otros errores no rota.

## Estado: implemented

| Pieza | Archivo | Estado |
|---|---|---|
| Sincronización de archivos del rally (nube local) | `scripts/nube_store.py` | Hecho |
| Puente del agente local (push/pull/watch/check) | `scripts/sincronizar_nube.py` | Hecho |
| Endpoints de sync en la isla (`/api/sync/*`) | `scripts/rally_service.py` | Hecho (autorizado) |
| Pruebas de la nube de sync | `tests/test_nube_sync.py` | Hecho (14 tests) |
| Presencia en vivo (chips + toasts) | `scripts/rally_service.py` + `dashboard/presence.js` | Hecho (Fase 2.2, autorizado) |
| Buzón cooperativo web→local (decisiones replicadas) | `scripts/rally_service.py` + `scripts/sincronizar_nube.py` | Hecho (Fase 2.3, autorizado) |
| Cuota por usuario (`RALLY_AI_USER_RATE_LIMIT`) | `scripts/rally_service.py` + `design/ia.js` + `design/kit.js` | Hecho (Fase 2.4, autorizado; 3 tests) |
| Cliente de IA (cuota, jobs, saneado de CSS/JSON, errores honestos) | `design/ia.js` | Hecho |
| Configuración de la isla y cuota | `design/config.js` | Hecho |
| Panel "Estilo con IA" en el editor | `design/index.html` | Hecho |
| Endpoint `/api/ai/design` (paleta + fuentes, con visión) | `scripts/rally_service.py` | Ya existía (diff local) |
| Generador de página por proyecto | `scripts/gen_pagina_diseno.py` | Hecho |
| Artefactos de despliegue | `deploy/Dockerfile`, `deploy/render.yaml`, `.env.example` | Hecho |
| Publicación con la isla configurada | `.github/workflows/pages.yml` | Hecho |
| Rate limit por IP y ventana en la isla | `scripts/rally_service.py` | Hecho (autorizado) |
| Rotación de claves en la isla | `scripts/rally_service.py` | Hecho (autorizado) |
| Pruebas del límite y la rotación | `tests/test_ai_isla.py` | Hecho (6 tests) |

## Cómo se usa

1. **Levantar la isla** (una vez, gratis):
   ```bash
   docker build -f deploy/Dockerfile -t rally-ia-isla .
   docker run -p 8080:8080 --env-file .env rally-ia-isla
   ```
   O desplegar `deploy/render.yaml` en Render y setear los secretos
   `RALLY_AI_URL`, `RALLY_AI_KEY`, `RALLY_AI_MODEL`, `RALLY_VISION_MODEL`
   y la variable `RALLY_ALLOWED_ORIGINS` con los dominios publicados.

2. **Publicar la página de un proyecto:**
   ```bash
   set RALLY_AI_BASE_URL=https://ralli-ia-isla.onrender.com
   python scripts/gen_pagina_diseno.py --slug equipo-nicaragua
   ```
   La carpeta `site/diseno/` queda lista (estática) con `config.js` apuntando a la isla.
   GitHub Pages la publica en el mismo push (`design/` y `site/`).

3. **Rotar la clave:** cambiar `RALLY_AI_KEY` en el panel del host. Nunca está en el repo.
   Para tener respaldo automático, setear `RALLY_AI_KEYS=clave2,clave3`; la isla
   probará la siguiente cuando la principal dé 401/403/429.

4. **Poner un límite a la isla** (recomendado en producción):
   ```
   RALLY_AI_RATE_LIMIT=60
   RALLY_AI_RATE_WINDOW=3600
   RALLY_AI_USER_RATE_LIMIT=24
   ```
   60 peticiones de IA por hora y por IP, y 24 por usuario (identidad
   `X-Rally-Actor` que el front manda desde los chips de presencia; sin ese
   header solo aplica la cuota por IP). Las que superan el límite devuelven
   `429` y el editor avisa con honestidad; el equipo sigue trabajando a mano.

## Modo sin isla
Si `RALLY_AI_BASE_URL` no está definida, la página se publica sin IA:
el editor sigue funcionando, el panel lo dice con honestidad y ofrece copiar el prompt
para usarlo en cualquier chat. No se simula una respuesta de IA.

## Límites
- La cuota libre es compartida por la isla: todos los proyectos la consumen.
- Los contadores de cuota (IP y usuario) viven solo en memoria: se reinician al
  reiniciar la isla.
- No se crea backend por proyecto: una sola isla sirve a todas las páginas.

## Fuera de alcance (motor)

Cambios a `rally_service.py` requieren autorización explícita (es motor).
Queda fuera por ahora:
- Persistencia del contador entre reinicios de la isla (hoy es en memoria).
- Métricas de uso y panel de administración de la isla.
