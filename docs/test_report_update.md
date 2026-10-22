## Actualización post-fix (generadores corregidos desde base)

Cambios aplicados al proyecto de prueba (copiados desde base corregida):
- `scripts/gen_script.py`: claims condicionales por reto, longitud 240-270 palabras, costo desde budget.json.
- `scripts/init_brief.py`: copia env.example.json → env.json si falta.

### Resultado regenerado
- Palabras del guion: 268 (rango óptimo 240-270) ✅
- Claims: ninguno inyectado (reto no tiene claims específicos) → planteamiento cualitativo, sin cifras ajenas ✅
- Costo en pantalla: $4,450 USD (consistente con budget) ✅
- Voz: 119s (metrónomo guía, sin TTS instalado) — pendiente instalar edge-tts para locución real.
- `test_paquete_limpio` falla solo por brief no vacío (esperado en proyecto de prueba).

### Estado final
- Repo: https://github.com/WalterSolorzano/rally-studio-test
- Live: http://localhost:8080 (servidor activo, IA=OpenCode)
- GitHub Pages: workflow en progreso (branch main).
