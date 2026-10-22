# ─────────────────────────────────────────────────────────────────────────────
#  Rally Studio · Instalador de IA gratis local (FreeLLMAPI)
#
#  Baja la ultima version publicada de FreeLLMAPI desde GitHub Releases y la
#  deja lista en esta maquina, para que el puente de IA de Rally Studio tenga
#  un endpoint OpenAI-compatible con ~34 proveedores gratis y failover.
#
#  Uso:
#    powershell -ExecutionPolicy Bypass -File .\scripts\setup_ia_gratis.ps1
#    ... -Modo instalador            (instalador oficial, con asistente)
#    ... -Modo instalador -Silencioso
#    ... -Modo portable -Destino "D:\IA\FreeLLMAPI"
#    ... -SoloDescargar              (no extrae ni ejecuta nada)
#
#  Que deja:
#    - App en  %LOCALAPPDATA%\Programs\FreeLLMAPI  (modo portable)
#    - o instalada con el instalador oficial        (modo instalador)
#
#  Despues:
#    1) abre la app y copia tu unified key (freellm-...)
#    2) guardala en  scripts\freellmapi.key   (una sola linea)
#    3) arranca con  .\Iniciar Rally.bat   -> el lanzador configura solo
#       RALLY_AI_URL=http://127.0.0.1:31415/v1  y  RALLY_AI_KEY
#
#  Nada de esto es obligatorio: sin IA el OCR cae a EasyOCR local y el copiloto
#  usa los chips web. FreeLLMAPI solo mejora la calidad.
# ─────────────────────────────────────────────────────────────────────────────
param(
  [ValidateSet("portable", "instalador")]
  [string]$Modo = "portable",
  [string]$Destino = (Join-Path $env:LOCALAPPDATA "Programs\FreeLLMAPI"),
  [string]$CacheDatos = (Join-Path $env:TEMP "rally_freellmapi"),
  [switch]$Silencioso,
  [switch]$SoloDescargar
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$repo = "tashfeenahmed/freellmapi"
$api = "https://api.github.com/repos/$repo/releases/latest"

function Escribir($texto, $color = "Gray") {
  Write-Host $texto -ForegroundColor $color
}

Escribir "Rally Studio - IA gratis local (FreeLLMAPI)" "Cyan"
Escribir "Modo: $Modo" "DarkGray"

# ── 1. Ultima version publicada ─────────────────────────────────────────────
if (-not (Test-Path $CacheDatos)) { New-Item -ItemType Directory -Path $CacheDatos -Force | Out-Null }

Escribir "Consultando la ultima version en GitHub..." "DarkGray"
$release = $null
try {
  $release = Invoke-RestMethod -Uri $api -Headers @{ "User-Agent" = "rally-studio-setup" } -TimeoutSec 30
} catch {
  Escribir "No se pudo consultar la API de GitHub ($($_.Exception.Message))." "Yellow"
  $gh = (Get-Command gh -ErrorAction SilentlyContinue)
  if ($gh) {
    Escribir "Intentando con GitHub CLI..." "DarkGray"
    $json = & gh release view --repo $repo --json tagName,assets | Out-String
    if ($LASTEXITCODE -eq 0 -and $json) { $release = $json | ConvertFrom-Json }
  }
}
if (-not $release) {
  Escribir "Sin conexion a GitHub. Descarga a mano desde:" "Red"
  Escribir "  https://github.com/$repo/releases/latest" "Red"
  exit 1
}

$version = $release.tag_name
Escribir "Version: $version" "Green"

# ── 2. Elegir el asset correcto para Windows ────────────────────────────────
$patron = if ($Modo -eq "instalador") { "*Setup*.exe" } else { "*-win.zip" }
$asset = $release.assets | Where-Object { $_.name -like $patron -and $_.name -notlike "*.blockmap" } | Select-Object -First 1
if (-not $asset) {
  $nombres = ($release.assets | ForEach-Object { $_.name }) -join ", "
  Escribir "No encontre un asset '$patron' en $version. Disponibles: $nombres" "Red"
  exit 1
}

$archivo = Join-Path $CacheDatos $asset.name
$url = $asset.browser_download_url
$mb = [math]::Round($asset.size / 1MB, 1)

# ── 3. Descargar (con cache: si ya esta y coincide el hash, se reutiliza) ───
function HashEsperado($a) {
  if ($a.digest -and $a.digest -like "sha256:*") { return ($a.digest -replace "^sha256:", "").ToLower() }
  return $null
}

$dir = $false
if (Test-Path $archivo) {
  $hashYa = (Get-FileHash $archivo -Algorithm SHA256).Hash.ToLower()
  $esperado = HashEsperado $asset
  if ($esperado -and $hashYa -eq $esperado) {
    Escribir "Ya descargado y verificado: $($asset.name)" "DarkGray"
    $dir = $true
  } else {
    Remove-Item $archivo -Force
  }
}

if (-not $dir) {
  Escribir "Descargando $($asset.name) ($mb MB)..." "Cyan"
  $previo = $ProgressPreference
  $ProgressPreference = "Continue"
  Invoke-WebRequest -Uri $url -OutFile $archivo -UseBasicParsing -TimeoutSec 900
  $ProgressPreference = $previo
  Escribir "Descarga completa." "Green"
}

# ── 4. Verificar integridad (sha256 publicado en el release) ────────────────
$esperado = HashEsperado $asset
$hash = (Get-FileHash $archivo -Algorithm SHA256).Hash.ToLower()
if ($esperado) {
  if ($hash -ne $esperado) {
    Escribir "El archivo no coincide con el sha256 publicado. Se aborta." "Red"
    Escribir "  esperado: $esperado" "Red"
    Escribir "  obtenido: $hash" "Red"
    Remove-Item $archivo -Force
    exit 1
  }
  Escribir "sha256 verificado: $($hash.Substring(0, 16))..." "Green"
} else {
  Escribir "sha256 (sin referencia publicada): $($hash.Substring(0, 16))..." "Yellow"
}

if ($SoloDescargar) {
  Escribir "Listo (solo descarga): $archivo" "Green"
  exit 0
}

# ── 5a. Modo instalador ────────────────────────────────────────────────────
if ($Modo -eq "instalador") {
  if (-not $Silencioso) {
    Escribir "Abriendo el instalador oficial. Sigue el asistente (siguiente, siguiente)." "Cyan"
    Start-Process -FilePath $archivo | Out-Null
    Escribir "Cuando termine, abre FreeLLMAPI desde el menu Inicio." "Green"
  } else {
    Escribir "Instalando en silencio..." "Cyan"
    $p = Start-Process -FilePath $archivo -ArgumentList "/S" -PassThru -Wait
    if ($p.ExitCode -eq 0) { Escribir "Instalacion silenciosa completada." "Green" }
    else { Escribir "El instalador devolvio codigo $($p.ExitCode)." "Yellow" }
  }
} else {
  # ── 5b. Modo portable (sin admin, todo dentro de una carpeta) ────────────
  if (Test-Path $Destino) {
    Escribir "Limpiando instalacion previa en $Destino" "DarkGray"
    Remove-Item $Destino -Recurse -Force
  }
  New-Item -ItemType Directory -Path $Destino -Force | Out-Null

  Escribir "Extrayendo en $Destino ..." "Cyan"
  Expand-Archive -Path $archivo -DestinationPath $Destino -Force

  # Aplanar si el zip trae una carpeta raiz unica
  $hijos = Get-ChildItem $Destino
  if ($hijos.Count -eq 1 -and $hijos[0].PSIsContainer -and -not (Get-ChildItem $Destino -Filter "*.exe" -Recurse)) {
    $sub = $hijos[0].FullName
    Get-ChildItem $sub -Force | Move-Item -Destination $Destino -Force
    Remove-Item $sub -Recurse -Force -ErrorAction SilentlyContinue
  }

  $exe = Get-ChildItem $Destino -Filter "*.exe" -Recurse |
         Where-Object { $_.Name -notlike "*uninstall*" } |
         Sort-Object Length -Descending | Select-Object -First 1

  if (-not $exe) {
    Escribir "No encontre el ejecutable dentro del zip. Contenido en $Destino :" "Yellow"
    Get-ChildItem $Destino -Recurse | Select-Object -First 20 -ExpandProperty FullName | ForEach-Object { Escribir "  $_" "DarkGray" }
    exit 1
  }
  Escribir "Ejecutable: $($exe.FullName)" "Green"
}

# ── 6. Instrucciones finales ────────────────────────────────────────────────
$clave = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "freellmapi.key"

Escribir ""
Escribir "--- Siguiente paso ---------------------------------------------" "Cyan"
Escribir "1) Abre FreeLLMAPI y copia tu 'unified key' (empieza con freellm-)." "White"
Escribir "2) Pegala en este archivo (una sola linea):" "White"
Escribir "   $clave" "DarkGray"
Escribir "3) Levanta el panel:" "White"
Escribir "   .\Iniciar Rally.bat     (PowerShell: .\iniciar_rally.ps1)" "DarkGray"
Escribir ""
Escribir "El lanzador espera la IA en http://127.0.0.1:31415/v1 y avisa en el log." "DarkGray"
Escribir "Puedes comprobar el puente en:  http://localhost:8000/api/ai/status" "DarkGray"
