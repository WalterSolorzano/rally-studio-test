# Descarga y primer arranque

Este paquete es **Rally Studio**: un workbench local para maratones de innovación de 24 y 28
horas, más una **capa de agente** que convierte a tu IA de programación en un guía experto.

Viene **limpio**: no trae ningún proyecto de ejemplo, ni datos de equipos anteriores, ni
claves. Lo único que trae precargado es el **corpus de investigación** (rúbricas, análisis de
ganadores, manuales y banco de retos) y las reglas del agente.

---

## Qué trae

| Bloque | Contenido |
|---|---|
| `dashboard/` | La ventana: 13 pestañas, sin frameworks ni build |
| `scripts/` | Servidor local, generadores, validador, puente de IA, buzón de propuestas |
| `skills/` | Las 10 skills del agente (se copian a `.opencode/skills/` y `.agents/skills/`) |
| `.agents/rules/` | Reglas profundas por tema (frontera, modos de rally, rúbricas, pautado/guion) |
| `knowledge/` | Corpus de conocimiento + `INDICE.md` (mapa de todo lo investigado) |
| `research/` | Banco de retos, análisis y claims con fuente |
| `docs/` | Instalación, manuales maestros, plantillas, `MANUAL_IA.md` e `INSTALACION_AGENTE.md` |
| `brand/` | Tokens y paleta base |
| `site/` | Web demo (se publica en Pages o Netlify) |
| `AGENTS.md` | El contrato: quién es el agente, el flujo de 13 etapas y la frontera dura |

## Qué **no** trae

- Ningún proyecto, equipo ni municipio de ejemplo.
- Capturas de pantalla, documentos de trabajo personales ni respaldos de entregas anteriores.
- Claves API, cuentas ni servicios de pago.
- La carpeta del buzón (`dashboard/data/content/`) ni el espejo de estado: se crean solos.

---

## Empezar en 5 pasos

1. **Requisitos**: Windows 10/11, Python 3.10 o superior (marcar *Add Python to PATH*) y un
   navegador. No hace falta Node ni base de datos.
2. **Instalar el agente** (una sola vez, en la raíz del repo):

   ```powershell
   .\scripts\setup_agente.ps1
   ```

   Instala dependencias, refleja las skills a OpenCode y Antigravity, y deja el MCP de
   Playwright configurado. Es idempotente: puedes correrlo las veces que quieras.

3. **Arrancar la ventana**:

   ```powershell
   .\"Iniciar Rally.bat"
   ```

   Abre `http://localhost:8000/dashboard/`.

4. **Abrir la carpeta con tu IA**:

   - **OpenCode**: `opencode` en la raíz del repo.
   - **Antigravity**: abrir la carpeta como workspace.

   En ambos casos la IA lee `AGENTS.md`, encuentra las skills y ya sabe qué hacer. Pídele
   simplemente: *"avancemos"*.

5. **Elegir certamen y empezar.** La ventana abre en «¿Qué Rally es?». A partir de ahí, la IA
   te pregunta lo que falte en cada etapa y te sirve propuestas para aceptar o descartar.

---

## Cómo trabaja el agente

- Lee `brief.json` (el estado del proyecto), `knowledge/INDICE.md` (el mapa del corpus) y
  `GET /api/state` (lo que tienes ahora mismo en la ventana).
- Te guía por las 13 etapas, **una pregunta a la vez**, sin inventar datos.
- Produce contenido y presentación. **No toca el motor**: si algo requiere código, para y te
  lo dice.
- Todo lo que produce entra por el buzón y aparece en la ventana como **Aceptar / Descartar**
  en unos dos segundos.
- Si le traes un PDF de investigación externa, lo procesa, lo contrasta con la rúbrica y lo
  sirve como propuesta editable.

Detalle completo: `docs/MANUAL_IA.md` (configuración de las IAs) y
`docs/INSTALACION_AGENTE.md` (skills, reglas y MCP).

---

## Dónde quedó el trabajo personal

Los documentos y capturas del proyecto anterior **no se borraron**: se movieron fuera del
paquete, a `..\rallysistem_trabajo_personal\` (carpeta hermana de este repo).

Además, el historial de git conserva una rama de respaldo:

```bash
git branch -a          # verás archivo/trabajo-personal
```

Nada de ese material se publica ni viaja en la descarga.
