# ─────────────────────────────────────────────────────────────────────────────
#  Rally Studio · Lanzador del servicio local
#  Arranca el servidor de forma DESACOPLADA (sobrevive al cierre de esta
#  ventana/terminal) y guarda su registro en %TEMP%\rally_service.log
#
#  Si encuentra FreeLLMAPI instalado (IA gratis local), lo arranca y configura
#  por ti las variables RALLY_AI_URL / RALLY_AI_KEY antes de levantar el panel.
#
#  Uso:  powershell -ExecutionPolicy Bypass -File .\iniciar_rally.ps1
#        .\iniciar_rally.ps1 -Puerto 8080   (para una segunda sesion de pruebas)
#        .\iniciar_rally.ps1 -SinIA         (no tocar nada de IA)
#        .\iniciar_rally.ps1 -IaPuerto 3001 (Docker/panel web en otro puerto)
#        .\iniciar_rally.ps1 -ConNube       (ademas vigila y sube archivos a la isla)
#  -ConNube arranca el puente scripts\sincronizar_nube.py en segundo plano:
#  todo lo que edite el agente local viaja en vivo a la isla (y baja lo que
#  editen en la web). Opcional: si existe scripts\sync.token se usa como
#  RALLY_SYNC_TOKEN (en una isla publica es obligatorio).
# ─────────────────────────────────────────────────────────────────────────────
param(
  [int]$Puerto = 8000,
  [int]$IaPuerto = 31415,
  [switch]$SinIA,
  [switch]$ConNube
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $raiz "scripts\rally_service.py"
$log = Join-Path $env:TEMP "rally_service.log"

if (-not (Test-Path $script)) {
  Write-Host "No se encontro scripts\rally_service.py dentro de $raiz" -ForegroundColor Red
  exit 1
}

$ocupado = Get-NetTCPConnection -LocalPort $Puerto -State Listen -ErrorAction SilentlyContinue
if ($ocupado) {
  $proc = Get-Process -Id $ocupado.OwningProcess -ErrorAction SilentlyContinue
  Write-Host "El puerto $Puerto ya esta en uso por PID $($ocupado.OwningProcess) ($($proc.ProcessName))." -ForegroundColor Yellow
  Write-Host "Si es una instancia vieja del servicio, cierrala y vuelve a ejecutar este lanzador." -ForegroundColor Yellow
  Write-Host "Abrir el panel: http://localhost:$Puerto/dashboard/"
  exit 0
}

# ── IA gratis local (FreeLLMAPI) · opcional, nunca bloquea el arranque ───────
if (-not $SinIA) {
  # 1. localizar el ejecutable (instalador oficial o modo portable del repo)
  $candidatos = @(
    (Join-Path $env:LOCALAPPDATA "Programs\FreeLLMAPI\FreeLLMAPI.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\freellmapi\FreeLLMAPI.exe"),
    (Join-Path $raiz "tools\freellmapi\FreeLLMAPI.exe")
  )
  $iaExe = $null
  foreach ($c in $candidatos) { if ((Test-Path $c) -and -not $iaExe) { $iaExe = $c } }
  if (-not $iaExe) {
    foreach ($base in @((Join-Path $env:LOCALAPPDATA "Programs\FreeLLMAPI"), (Join-Path $raiz "tools\freellmapi"))) {
      if ((Test-Path $base) -and -not $iaExe) {
        $hit = Get-ChildItem $base -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue |
               Where-Object { $_.Name -like "*FreeLLM*" -and $_.Name -notlike "*uninstall*" } |
               Select-Object -First 1
        if ($hit) { $iaExe = $hit.FullName }
      }
    }
  }

  # 2. arrancarlo solo si de verdad no esta escuchando ya
  $iaViva = Get-NetTCPConnection -LocalPort $IaPuerto -State Listen -ErrorAction SilentlyContinue
  if (-not $iaViva -and $iaExe) {
    Write-Host "Arrancando IA gratis local (FreeLLMAPI)..." -ForegroundColor Cyan
    Start-Process -FilePath $iaExe | Out-Null
    for ($i = 0; $i -lt 10 -and -not $iaViva; $i++) {
      Start-Sleep -Milliseconds 700
      $iaViva = Get-NetTCPConnection -LocalPort $IaPuerto -State Listen -ErrorAction SilentlyContinue
    }
  }

  # 3. variables de entorno para el servicio (el hijo las hereda)
  if ($iaViva) {
    $env:RALLY_AI_URL = "http://127.0.0.1:$IaPuerto/v1"
    $claveArchivo = Join-Path $raiz "scripts\freellmapi.key"
    if (Test-Path $claveArchivo) {
      $clave = (Get-Content $claveArchivo -Raw).Trim()
      if ($clave) {
        $env:RALLY_AI_KEY = $clave
        Write-Host "IA gratis lista: $($env:RALLY_AI_URL) (clave leida de scripts\freellmapi.key)" -ForegroundColor Green
      } else {
        Write-Host "IA gratis escuchando en $IaPuerto, pero scripts\freellmapi.key esta vacio." -ForegroundColor Yellow
      }
    } else {
      Write-Host "IA gratis escuchando en $IaPuerto. Falta la unified key:" -ForegroundColor Yellow
      Write-Host "  copiala de la app y guardala en scripts\freellmapi.key ($claveArchivo)" -ForegroundColor DarkGray
    }
  } else {
    Write-Host "Sin IA gratis local. El OCR usara EasyOCR y el copiloto los chips web." -ForegroundColor DarkGray
    Write-Host "  Para activarla: powershell -ExecutionPolicy Bypass -File .\scripts\setup_ia_gratis.ps1" -ForegroundColor DarkGray
  }
}

$env:RALLY_SERVICE_PORT = "$Puerto"
Start-Process -FilePath "python" `
  -ArgumentList "`"$script`"" `
  -WorkingDirectory $raiz `
  -WindowStyle Hidden `
  -RedirectStandardOutput $log `
  -RedirectStandardError "$log.err"

Start-Sleep -Seconds 2
$salud = Get-NetTCPConnection -LocalPort $Puerto -State Listen -ErrorAction SilentlyContinue
if ($salud) {
  Write-Host "Rally Studio corriendo en http://localhost:$Puerto/dashboard/" -ForegroundColor Green
  Write-Host "Registro: $log" -ForegroundColor DarkGray
  Write-Host "Estado:   http://localhost:$Puerto/health" -ForegroundColor DarkGray
} else {
  Write-Host "No respondio en 2 segundos. Revisa el registro: $log" -ForegroundColor Red
}

# ── Puente de nube (sincronizacion en vivo) · opcional, nunca bloquea ────────
if ($ConNube -and $salud) {
  $puente = Join-Path $raiz "scripts\sincronizar_nube.py"
  if (Test-Path $puente) {
    # Token opcional: scripts\sync.token o la env RALLY_SYNC_TOKEN ya seteada
    $tokenArchivo = Join-Path $raiz "scripts\sync.token"
    if ((Test-Path $tokenArchivo) -and -not $env:RALLY_SYNC_TOKEN) {
      $t = (Get-Content $tokenArchivo -Raw).Trim()
      if ($t) { $env:RALLY_SYNC_TOKEN = $t }
    }
    $puenteLog = Join-Path $env:TEMP "rally_nube.log"
    Start-Process -FilePath "python" `
      -ArgumentList "`"$puente`"", "--watch", "--url", "http://127.0.0.1:$Puerto" `
      -WorkingDirectory $raiz `
      -WindowStyle Hidden `
      -RedirectStandardOutput $puenteLog `
      -RedirectStandardError "$puenteLog.err"
    Start-Sleep -Seconds 1
    Write-Host "Puente de nube vigilando http://127.0.0.1:$Puerto (registro: $puenteLog)" -ForegroundColor Cyan
  } else {
    Write-Host "No se encontro scripts\sincronizar_nube.py: sin puente de nube." -ForegroundColor Yellow
  }
}
