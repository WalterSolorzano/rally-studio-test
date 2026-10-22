---
name: propuesta-diseno
description: Convierte el nombre, logo o una idea del equipo en propuestas de identidad visual (paleta, tipografías, tokens, dirección de logotipo). Úsala cuando el usuario no tiene marca, no le gusta la que tiene o pide que la interfaz se vea mejor.
---

# Propuesta de diseño

## Cuándo usarla

- El equipo no tiene logo, paleta ni tipografías.
- El usuario dice "no me gusta cómo se ve" o "propón una identidad".
- Hay un logo y hace falta derivar el resto del sistema.

## Procedimiento

1. Pregunta solo lo que no puedas deducir: nombre del proyecto, a qué se dedica, público,
   tono (sobrio / cálido / técnico) y si ya hay logo o color obligatorio.
2. Si hay logo, léelo (`brand/logo.png` o el que indique) y extrae 2-3 colores dominantes.
   Si no hay logo, parte del nombre y del sector.
3. Propón **2 direcciones** distintas, no una. Cada dirección trae:
   - paleta de 5 colores con HEX y el contraste del primario sobre el fondo (mínimo 4.5:1,
     objetivo 7:1),
   - pareja tipográfica (títulos + UI + datos) con justificación en una línea,
   - 3 palabras de personalidad y 2 anti-ejemplos ("esto no es"),
   - una frase de concepto para el logotipo.
4. Recomienda una y explica por qué en dos líneas.
5. Cuando el usuario elija, escribe los tokens: actualiza `brand/palette.json` y
   `brand/tokens.css`, y sirve la propuesta a la ventana (`--tab team --slot main` para
   identidad, `--tab resources --slot main` para piezas gráficas).
6. Verifica contraste antes de dar por buena una paleta.

## Reglas

- Prohibido el morado `#7c3aed` y sus parientes, los degradados "estilo IA", el glassmorphism
  y las tarjetas repetidas.
- Nada de fuentes fuera de las declaradas en `brand/tokens.css` sin decirlo y justificarlo.
- Propón; no cambies la identidad del usuario sin que la acepte.
- Contraste WCAG AA como piso, AAA como meta.

## Punteros

- Paleta vigente: `brand/palette.json`.
- Tokens: `brand/tokens.css`.
- Generador desde logo: `scripts/gen_palette.py`.
- Doctrina visual: `PRODUCT.md` y `DESIGN.md`.
