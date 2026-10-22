# ─────────────────────────────────────────────────────────────────────────────
#  Rally Studio · Verificador de IA gratis (FreeLLMAPI)
#  Dice con honestidad en que estado esta la IA, sin simular nada:
#    0 = IA completa lista (OCR/Pulir/copiloto funcionan)
#    1 = sin unified key  → solo falta copiarla a scripts\freellmapi.key
#    2 = key invalida o app sin escuchar → arrancar la app / revisar la key
#    3 = key valida pero sin proveedores → pegar claves en el panel Keys
#  Uso:  powershell -ExecutionPolicy Bypass -File .\scripts\verificar_ia.ps1
# ─────────────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$url = if ($env:RALLY_AI_URL) { $env:RALLY_AI_URL.TrimEnd('/') } else { "http://127.0.0.1:31415/v1" }
$claveArchivo = Join-Path $raiz "scripts\freellmapi.key"

if (-not (Test-Path $claveArchivo)) {
  Write-Host "[1/3] Falta la unified key." -ForegroundColor Yellow
  Write-Host "  1. Abre la app FreeLLMAPI (o instalala: .\scripts\setup_ia_gratis.ps1)"
  Write-Host "  2. Copia tu unified key (freellmapi-... o freellm-...)"
  Write-Host "  3. Pegala en una sola linea en: $claveArchivo"
  exit 1
}
$clave = (Get-Content $claveArchivo -Raw).Trim()
if (-not $clave) {
  Write-Host "[1/3] El archivo scripts\freellmapi.key esta vacio. Pega ahi la unified key." -ForegroundColor Yellow
  exit 1
}

try {
  $modelos = Invoke-RestMethod -Uri "$url/models" -Headers @{ Authorization = "Bearer $clave" } -TimeoutSec 15
  Write-Host "[2/3] Key valida y app escuchando en $url ($($modelos.data.Count) modelos)." -ForegroundColor Green
} catch {
  Write-Host "[2/3] NO responde con esa key en $url" -ForegroundColor Red
  Write-Host "  - ¿La app FreeLLMAPI esta corriendo? (bandeja del sistema)"
  Write-Host "  - ¿La key copiada es la completa y sin espacios?"
  Write-Host "  - Docker usa otro puerto: usa RALLY_AI_URL=http://localhost:3001/v1"
  exit 2
}

$cuerpo = @{ model = "auto"; messages = @(@{ role = "user"; content = "Responde solo: OK" }); max_tokens = 8 } | ConvertTo-Json -Depth 5
try {
  $r = Invoke-RestMethod -Uri "$url/chat/completions" -Method Post -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $clave" } -Body $cuerpo -TimeoutSec 60
  $texto = "$($r.choices[0].message.content)".Trim()
  Write-Host "[3/3] IA completa lista. Respuesta: '$texto' (modelo $($r.model))." -ForegroundColor Green
  Write-Host "  OCR visual, Pulir y copiloto funcionaran. Nada mas que hacer." -ForegroundColor Green
  exit 0
} catch {
  $cod = $null
  try { $cod = [int]$_.Exception.Response.StatusCode } catch {}
  if ($cod -eq 503) {
    Write-Host "[3/3] Key valida, PERO sin proveedores configurados (503)." -ForegroundColor Yellow
    Write-Host "  Cada quien pega SUS claves gratis en el panel de la app:" -ForegroundColor Yellow
    Write-Host "    Bandeja del sistema > icono FreeLLMAPI > Open Dashboard > pagina Keys"
    Write-Host "    (Docker: http://localhost:3001)"
    Write-Host "  Sugerido: 1 clave de Google AI Studio (aistudio.google.com, gratis, sirve para OCR vision)"
    Write-Host "  y opcional 1 de Groq (console.groq.com, gratis) como respaldo."
    Write-Host "  Luego vuelve a correr este verificador: debe terminar en verde."
    exit 3
  }
  Write-Host "[3/3] Error inesperado ($cod / $($_.Exception.Message))." -ForegroundColor Red
  Write-Host "  Avisa este mensaje completo para diagnosticar. El servicio funciona sin IA (EasyOCR local)."
  exit 2
}
