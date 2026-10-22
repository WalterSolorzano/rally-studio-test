# Instalacion de una via para la capa de agente (b) de Rally Studio.
#
# Deja listas las skills para OpenCode y Antigravity, declara el MCP de
# Playwright en opencode.json y verifica que el servidor local arranca.
#
# Es idempotente: correrlo dos veces no cambia nada la segunda vez.
#
# Uso:
#   .\scripts\setup_agente.ps1
#   .\scripts\setup_agente.ps1 -SinDependencias
#   .\scripts\setup_agente.ps1 -SinVerificarServidor

[CmdletBinding()]
param(
    [switch]$SinDependencias,
    [switch]$SinVerificarServidor
)

$ErrorActionPreference = "Stop"

$Raiz = Split-Path -Parent $PSScriptRoot
Set-Location $Raiz

$Resumen = New-Object System.Collections.Generic.List[string]

function Anotar([string]$texto) {
    $Resumen.Add($texto) | Out-Null
    Write-Host $texto
}

Write-Host ""
Write-Host "Rally Studio - instalacion de la capa de agente (b)"
Write-Host "Carpeta: $Raiz"
Write-Host ""

# ---------------------------------------------------------------------------
# 1. Python
# ---------------------------------------------------------------------------
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Anotar "ERROR: no encontre Python en PATH. Instalalo (3.10 o superior) y marca 'Add Python to PATH'."
    exit 1
}

$versionTexto = & python -c "import sys; print('%d.%d' % sys.version_info[:2])"
$partes = $versionTexto.Trim().Split(".")
$mayor = [int]$partes[0]
$menor = [int]$partes[1]
if ($mayor -lt 3 -or ($mayor -eq 3 -and $menor -lt 10)) {
    Anotar "ERROR: Python $versionTexto es demasiado viejo. Se necesita 3.10 o superior."
    exit 1
}
Anotar "OK Python $versionTexto"

# ---------------------------------------------------------------------------
# 2. Dependencias
# ---------------------------------------------------------------------------
if ($SinDependencias) {
    Anotar "OMITIDO requirements.txt (pedido con -SinDependencias)"
} else {
    Write-Host "Instalando requirements.txt..."
    Write-Host "  (los opcionales pesados NO se instalan: easyocr, chatterbox-tts, kokoro, ffmpeg)"
    & python -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Anotar "ERROR: fallo la instalacion de requirements.txt (codigo $LASTEXITCODE)."
        exit 1
    }
    Anotar "OK dependencias de requirements.txt"
}

# ---------------------------------------------------------------------------
# 3. Skills: una fuente, dos destinos
# ---------------------------------------------------------------------------
$destinos = @(".opencode\skills", ".agents\skills")
foreach ($destino in $destinos) {
    if (-not (Test-Path $destino)) {
        New-Item -ItemType Directory -Path $destino -Force | Out-Null
        Anotar "OK creada carpeta $destino"
    }
}

$carpetasSkills = @(Get-ChildItem -Path "skills" -Directory -ErrorAction SilentlyContinue)
if ($carpetasSkills.Count -eq 0) {
    Anotar "AVISO: no hay skills en skills\. Nada que reflejar."
} else {
    foreach ($skill in $carpetasSkills) {
        $objetivo = $skill.FullName
        foreach ($destino in $destinos) {
            $enlace = Join-Path $destino $skill.Name
            $yaEsta = $false

            if (Test-Path $enlace) {
                $item = Get-Item $enlace -Force
                if ($item.LinkType -eq "Junction") {
                    $actual = @($item.Target)[0]
                    $actualAbs = $null
                    try { $actualAbs = (Resolve-Path $actual).Path } catch { $actualAbs = $null }
                    if ($actualAbs -and ($actualAbs -eq $objetivo)) {
                        Anotar "OK $enlace ya apunta a skills\$($skill.Name)"
                        $yaEsta = $true
                    } else {
                        # Borrar SOLO el enlace, nunca el contenido del destino.
                        [System.IO.Directory]::Delete($enlace, $false)
                    }
                } else {
                    Remove-Item -Recurse -Force $enlace
                }
            }

            if (-not $yaEsta) {
                try {
                    New-Item -ItemType Junction -Path $enlace -Target $objetivo -ErrorAction Stop | Out-Null
                    Anotar "OK junction $enlace -> skills\$($skill.Name)"
                } catch {
                    Copy-Item -Recurse -Force $objetivo $enlace
                    Anotar "OK copia $enlace (junction no disponible en este sistema)"
                }
            }
        }
    }
}

# ---------------------------------------------------------------------------
# 4. MCP de Playwright en opencode.json (sin borrar MCPs existentes)
# ---------------------------------------------------------------------------
$cfgPath = "opencode.json"

if (Test-Path $cfgPath) {
    $raw = Get-Content $cfgPath -Raw -Encoding UTF8
    if ($raw.Trim()) {
        $cfg = $raw | ConvertFrom-Json
    } else {
        $cfg = New-Object PSObject
    }
} else {
    $cfg = New-Object PSObject
    $cfg | Add-Member -NotePropertyName '$schema' -NotePropertyValue "https://opencode.ai/config.json"
}

if (-not ($cfg.PSObject.Properties.Name -contains "mcp")) {
    $cfg | Add-Member -NotePropertyName "mcp" -NotePropertyValue (New-Object PSObject)
}

if ($cfg.mcp.PSObject.Properties.Name -contains "playwright") {
    Anotar "OK MCP playwright ya declarado en opencode.json"
} else {
    $pw = New-Object PSObject
    $pw | Add-Member -NotePropertyName "type" -NotePropertyValue "local"
    $pw | Add-Member -NotePropertyName "command" -NotePropertyValue @("npx", "-y", "@playwright/mcp")
    $pw | Add-Member -NotePropertyName "enabled" -NotePropertyValue $true
    $cfg.mcp | Add-Member -NotePropertyName "playwright" -NotePropertyValue $pw
    $cfg | ConvertTo-Json -Depth 10 | Set-Content -Path $cfgPath -Encoding UTF8
    Anotar "OK MCP playwright agregado a opencode.json"
}

# ---------------------------------------------------------------------------
# 5. El servidor arranca
# ---------------------------------------------------------------------------
if ($SinVerificarServidor) {
    Anotar "OMITIDO arranque del servidor (pedido con -SinVerificarServidor)"
} else {
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $puerto = $listener.LocalEndpoint.Port
    $listener.Stop()

    $env:RALLY_SERVICE_PORT = "$puerto"
    $proc = Start-Process -FilePath "python" -ArgumentList "scripts/rally_service.py" -PassThru -WindowStyle Hidden

    $responde = $false
    try {
        for ($i = 0; $i -lt 40; $i++) {
            Start-Sleep -Milliseconds 500
            try {
                $r = Invoke-WebRequest -Uri "http://127.0.0.1:$puerto/health" -UseBasicParsing -TimeoutSec 2
                if ($r.StatusCode -eq 200) {
                    $responde = $true
                    break
                }
            } catch {
                # todavia arrancando
            }
        }
    } finally {
        if ($proc -and -not $proc.HasExited) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
        Remove-Item Env:\RALLY_SERVICE_PORT -ErrorAction SilentlyContinue
    }

    if ($responde) {
        Anotar "OK el servidor responde en /health (puerto $puerto)"
    } else {
        Anotar "AVISO: el servidor no respondio en 20 s. Probalo a mano: python scripts/rally_service.py"
    }
}

# ---------------------------------------------------------------------------
# 6. Resumen
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Resumen"
Write-Host "-------"
foreach ($linea in $Resumen) {
    Write-Host "  $linea"
}
Write-Host ""
Write-Host "Listo. Abri esta carpeta con OpenCode o Antigravity y la IA ya sabe que hacer."
Write-Host "Guia completa: docs\INSTALACION_AGENTE.md"
Write-Host ""
