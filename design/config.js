/* Rally Design — configuración de build.
 *
 * `base` = URL del backend de IA compartido ("isla"). Vacío = mismo origen
 * (el rally_service.py local). Al publicar, el build escribe aquí la URL
 * pública de la isla; todas las páginas estáticas la comparten.
 *
 * `dailyQuota` = número de generaciones de IA por navegador y por día.
 * Al agotarse la cuota el panel cae en modo manual (copiar prompt), sin
 * romper la herramienta.
 *
 * `model` = modelo de IA. Vacío deja que el servidor elija ("auto"), pero
 * conviene fijar uno: en la isla el selector automático puede no estar
 * disponible. `opencode-go/deepseek-v4.1-flash` es el modelo del proyecto.
 */
var RALLY_IA_CONFIG = {
  base: '',
  dailyQuota: 12,
  model: 'opencode-go/deepseek-v4.1-flash'
};
