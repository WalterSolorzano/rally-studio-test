# Register the Rally Studio recap watcher as a per-user scheduled task.
# It checks every five minutes. At T-1h and T-0 it rebuilds the recap and
# leaves a notice in the workbench timeline. Run this once, from the repo root:
#   powershell -ExecutionPolicy Bypass -File scripts/install_stats_task.ps1
# Remove it later with:
#   Unregister-ScheduledTask -TaskName "RallyStudioStatsWatcher" -Confirm:$false

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$python = (Get-Command python -ErrorAction Stop).Source
$watcher = Join-Path $repo "scripts\watch_stats.py"
$taskName = "RallyStudioStatsWatcher"

if (-not (Test-Path $watcher)) {
    throw "No se encontró $watcher"
}

$action = New-ScheduledTaskAction `
    -Execute $python `
    -Argument "`"$watcher`" --once" `
    -WorkingDirectory $repo

$trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes 5) `
    -RepetitionDuration (New-TimeSpan -Days 3650)

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Genera el resumen real de Rally Studio en T-1h y al cierre, y deja un aviso en timeline." `
    -Force | Out-Null

Write-Host "Tarea registrada: $taskName"
Write-Host "Se ejecuta cada 5 minutos con: $python `"$watcher`" --once"
Write-Host "Estado: $(Get-ScheduledTask -TaskName $taskName | Select-Object -ExpandProperty State)"
