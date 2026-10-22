# Reporte de prueba end-to-end — Rally Studio (proyecto de prueba)

Proyecto de prueba: https://github.com/WalterSolorzano/rally-studio-test
Carpeta local: C:\Users\--X\Downloads\rally-test-studio
Certamen simulado: LATAM (28h), categoria innovacion, ciudad Managua, universidad UNI.

## Lo que corrio bien
- Copia limpia del sistema a carpeta separada: OK (robocopy, sin contaminar rallysistem).
- brief.json validado: OK (validate_brief.py paso).
- Orquestador (orchestrate.py): OK, detecta proyecto y env.
- Generadores paralelos: gen_pautado, gen_budget, gen_canvas, gen_script, gen_bibliography, gen_readme, gen_palette: OK.
- Validaciones: validate_pautado (5/5 campos dentro de limites), validate_budget ($4,450 USD, rango ideal): OK.
- Voz: genero narration.mp4 (fallback simulado, 60s) — ffmpeg encontrado en ruta candidata.
- GitHub: repo creado y pusheado: OK.

## Fallas y hallazgos
1. gen_script.py inyecta claims de inundaciones (claims.json) aunque el reto es "vender el sistema". Los claims no se filtran por challenge_id. -> Genera guion incoherente con el proyecto.
2. Palabras del guion: 137 vs optimo 240-270 para 120s. Demasiado corto, deja silencios.
3. Inconsistencia de cifras: Acto III dice $4,450 pero pantalla dice $4,850. gen_script hardcodea $4,850 en texto en pantalla.
4. Voz: ningun motor TTS instalado (Kokoro/Piper/edge-tts/Chatterbox) -> fallback simulado (metronomo). No es locucion final. Para calidad real hace falta instalar edge-tts o kokoro.
5. ffmpeg no esta en PATH pero existe en ruta candidata (Agent\dlls) — find_ffmpeg lo encuentra. OK pero fragil.
6. test_paquete_limpio.py::test_brief_is_blank_template FALLA en el proyecto de prueba (esperado: el base debe tener brief vacio; el proyecto de prueba lo llena). Esto confirma que el base esta limpio y el test protege contra hardcodeo.
7. env.json no existia inicialmente (hay que copiar env.example.json). Orquestador lo reporta pero no bloquea.
8. El presupuesto generado ($4,450) coincide con el total auditado, pero los items no se vinculan al reto (son items genericos del template).

## Recomendaciones (pulir/modificar)
- gen_script.py: filtrar claims por challenge_id o permitir seleccionar claims; ajustar longitud del guion a 240-270 palabras.
- Corregir cifra en pantalla ($4,850 -> $4,450) en gen_script.py.
- Instalar edge-tts (pip install edge-tts) para voz real en entornos sin GPU.
- Agregar env.json al flujo de init (copiar env.example.json automaticamente).
- Documentar en INSTALACION que ffmpeg puede estar en rutas no-PATH.

## Estado final
- Repo: https://github.com/WalterSolorzano/rally-studio-test
- Entregables generados: pautado_draft.docx, budget.xlsx, canvas.md, script.md, shotlist.csv, narration.txt, narration.mp4 (simulado), bibliography.md, README.md.
- Rúbrica: pautado dentro de limites; presupuesto en rango ideal.
