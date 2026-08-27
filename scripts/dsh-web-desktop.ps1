<#
  DSH Web UI desktop launcher.
  The desktop shortcut runs this script: it starts `pnpm dsh web` in a hidden
  window, opens the UI in a dedicated browser window, and stops the server when
  that window is closed.
#>

$ErrorActionPreference = 'Stop'

$Repo = 'D:\deepseek-harness'
$Url  = 'http://127.0.0.1:3080'
$Port = 3080

$edge   = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'

function Show-Error([string]$message) {
  try { (New-Object -ComObject WScript.Shell).Popup($message, 0, 'DSH Web', 48) | Out-Null }
  catch { }
}

function Stop-ServerTree([int]$processId) {
  if ($processId -le 0) { return }
  & taskkill /PID $processId /T /F 2>$null | Out-Null
}

try {
  # Stop a stale server on the port so a fresh one can bind.
  $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($listener) {
    $owner = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
    if ($owner -and $owner.ProcessName -eq 'node') {
      Stop-ServerTree $owner.Id
      Start-Sleep -Milliseconds 800
    }
  }

  # Start the server (hidden window).
  $server = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c', 'pnpm dsh web' `
    -WorkingDirectory $Repo `
    -WindowStyle Hidden `
    -PassThru

  # Wait until the UI responds.
  $ready = $false
  for ($i = 0; $i -lt 120; $i++) {
    try {
      $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { $ready = $true; break }
    } catch { }
    Start-Sleep -Milliseconds 500
  }
  if (-not $ready) {
    throw "DSH server did not become ready at $Url (port $Port)."
  }

  # Open the UI in a dedicated window and wait for it to close.
  if (Test-Path $edge) {
    $browser = $edge
  } elseif (Test-Path $chrome) {
    $browser = $chrome
  } else {
    throw 'Edge or Chrome not found; cannot detect when the window closes.'
  }

  # A persistent throwaway profile keeps the app window isolated from the main
  # browser so closing that window is detectable, while first-run onboarding
  # only appears once.
  $profileDir = Join-Path $env:LOCALAPPDATA 'dsh\dsh-web-profile'
  $browserArgs = @(
    '--app=' + $Url,
    '--user-data-dir=' + $profileDir,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-session-crashed-bubble'
  )

  $app = Start-Process -FilePath $browser -ArgumentList $browserArgs -PassThru
  $app.WaitForExit()
}
catch {
  Show-Error $_.Exception.Message
}
finally {
  if ($server -and -not $server.HasExited) {
    Stop-ServerTree $server.Id
  }
}
