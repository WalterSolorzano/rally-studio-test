---
name: publicar-sitio
description: Construye y publica la web demo del proyecto en GitHub Pages o Netlify. Úsala cuando el usuario quiere que su prototipo tenga una URL pública para el video o la entrega.
---

# Publicar sitio

## Cuándo usarla

- El usuario termina el prototipo y necesita una URL pública.
- Pide "súbelo", "publícalo" o "que tenga link".

## Procedimiento

1. Verifica que `site/index.html` existe y abre bien en local.
2. Revisa lo mínimo antes de publicar:
   - no hay rutas absolutas rotas (`/assets/...` que solo existan en tu máquina),
   - no hay datos personales ni rutas de usuario,
   - el nombre del proyecto sale de `brief.json`, no está escrito a mano,
   - la página carga sin consola con errores.
3. Construye el sitio:

```bash
python scripts/publish_site.py
```

4. Publica **solo si ya hay credenciales listas**:
   - Netlify CLI instalado y autenticado → `netlify deploy --prod --dir=site`,
   - o repositorio de GitHub con Pages activo → commit y `git push`.
5. Si no hay credenciales, **no pidas tokens**. Explica los dos caminos en 4 líneas y deja el
   `site/` listo para que el usuario publique desde su cuenta.
6. Escribe la URL resultante en `brief.json` (`site_url`) y avisa al usuario.
7. Sirve el enlace al checklist (`--tab timeline --slot main`).

## Reglas

- Nunca publiques credenciales, `.env`, `scripts/freellmapi.key` ni el buzón de propuestas.
- No inventes una URL: si no se publicó, no hay link.
- No publiques sin que el usuario lo haya pedido explícitamente.
- No cambies el diseño del sitio en esta skill; eso es `propuesta-diseno`.

## Punteros

- Script: `scripts/publish_site.py`.
- Workflow de Pages: `.github/workflows/pages.yml`.
- Guía manual: `docs/INSTALACION_Y_DESPLIEGUE.md`, sección 8.
