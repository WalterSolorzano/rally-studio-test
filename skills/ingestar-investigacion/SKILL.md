---
name: ingestar-investigacion
description: Procesa un PDF, DOCX o MD que trae el usuario desde fuera (por ejemplo una investigación hecha en z.ai), extrae el contenido, lo contrasta, lo alinea a la rúbrica y lo sirve como propuesta. Úsala cuando el usuario adjunte un documento o diga "te traje la investigación".
---

# Ingestar investigación externa

## Cuándo usarla

- El usuario entrega un PDF, DOCX o MD producido fuera (z.ai, ChatGPT, un informe propio).
- Pide "analiza esto", "límpialo", "pásalo al presupuesto" o "corrige esto contra las bases".

## Procedimiento

1. **Extrae el texto sin IA.** No dependas del modelo para leer el archivo:

```bash
python -c "import pdfplumber,sys; pdf=pdfplumber.open(sys.argv[1]); print('\n'.join((p.extract_text() or '') for p in pdf.pages))" informe.pdf > extraido.txt
```

   Para DOCX: `python -c "import docx,sys; d=docx.Document(sys.argv[1]); print('\n'.join(p.text for p in d.paragraphs))" informe.docx`.

2. **Lee `extraido.txt` por rangos.** No lo vuelques entero en el contexto.
3. **Separa hechos de opiniones.** Toda cifra que vayas a usar debe existir en
   `research/claims.json` o venir con fuente y año en el documento. Si no, márcala como
   estimación y dilo.
4. **Alinea al certamen activo** (`brief.json` → `rally_type`), usando
   `.agents/rules/modos-rally.md` y `.agents/rules/rubricas-y-puntajes.md`.
5. **Decide el destino**: qué pestaña y qué ranura. Presupuesto → `budget/costos`;
   problema/solución/impacto → `pautado/<slot>`; guion → `script/actoN`.
6. **Sirve la propuesta** con la skill `servir-a-ventana`. Marca `--simulated` si algo no
   es real o no tiene respaldo.
7. **Resume al usuario en 5 líneas**: qué trajo el documento, qué se corrigió, qué se
   descartó y por qué, y dónde quedó la propuesta.

## Reglas

- El documento externo **no manda** sobre las bases del evento. Si contradice una regla, la
  regla gana y se avisa.
- No inventes URLs ni proveedores para "completar" un presupuesto.
- Si el documento trae datos personales o internos, no los publiques en `site/`.
- Si la extracción falla (PDF escaneado), dilo: ofrece OCR (`/api/ocr`) o pide una versión
  con texto.

## Punteros

- Estadísticas citables: `research/claims.json`
- Reglas del certamen: `.agents/rules/modos-rally.md`
- Puntajes: `.agents/rules/rubricas-y-puntajes.md`
- Entrega a la ventana: skill `servir-a-ventana`
