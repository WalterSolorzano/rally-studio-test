# Integración IA gratis (FreeLLMAPI) — plan de trabajo

- [x] Backend `/api/ocr`: capa 1 = modelo vision vía endpoint OpenAI-compatible (`RALLY_AI_URL`), JSON jerarquizado; capa 2 = EasyOCR (red de seguridad, intacta). Fuente marcada en respuesta (`source: "ai" | "easyocr"`).
- [x] Backend `/api/ai/quick`: endpoint sincrónico para pulir prompts (modelo mini; endpoint env con caída a CLI OpenCode).
- [x] Frontend `app.js`: consumir OCR estructurado (JSON directo) cuando venga; regex solo para crudo. Botón "Pulir ✨" en copiloto.
- [x] `AUTO_IA.md` + `requirements.txt`: doc instalación FreeLLMAPI + easyocr como opcional.
- [x] Verificación: `py_compile` OK, `node --check` OK, `/api/ai/quick` OK (OpenCode fallback, modelo `deepseek-v4.1-flash-free`), `/api/ocr` OK (`source=easyocr`).

## Endurecimiento posterior (verificado en vivo)

- [x] Reintento entre modelos: `_pick_models_for(purpose, models, limit=3)`; quick y vision prueban hasta 3 candidatos por saturación de proveedores gratis.
- [x] Errores honestos: `/api/ai/quick` devuelve `{status:"error", reason:"rate-limit"|"provider-error", message, detail}` (antes decía `no-provider`, engañoso). `_endpoint_chat_raw` conserva el detalle del proveedor; `_is_rate_limit()` detecta 429/cuota.
- [x] `/api/ocr` añade `"note"` con el motivo cuando la capa vision no se pudo usar (rate limit / sin endpoint). app.js lo muestra (toast informativo si hubo texto, error si no).
- [x] Imagen ilegible → HTTP 422 `bad-image` con mensaje claro (antes 500 con texto crudo de OpenCV).
- [x] Anti-doble-bind en Windows: `SO_EXCLUSIVEADDRUSE` + `_port_is_busy()` con bind exclusivo; avisa "Puerto N ocupado por otro proceso". Evita la instancia vieja respondiendo código obsoleto.
- [x] Evidencia: quick → `rate-limit` con detail; ocr corrupta → 422; ocr imagen real → `source:"easyocr"` + `note`; segunda instancia forzada → rechazada, 1 solo listener.


