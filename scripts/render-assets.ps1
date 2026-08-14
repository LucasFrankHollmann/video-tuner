# Gera as imagens da Chrome Web Store em store/, a partir de assets/*.html.
#
# As capturas usam o codigo publicado de verdade (dist/content.js e o bundle da
# tela de configuracao) sobre uma pagina de exemplo, com a API chrome.*
# substituida por um stub. Nao sao mockups redesenhados: e a UI real.
#
# Sem acentos de proposito: PowerShell 5.1 le .ps1 sem BOM como ANSI.
#
#   powershell -ExecutionPolicy Bypass -File scripts/render-assets.ps1

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

# O --screenshot as vezes captura antes do primeiro paint e sai uma imagem
# chapada. Amostra a imagem e exige variedade de cor para aceitar o resultado.
function Test-Rendered($path) {
  if (-not (Test-Path $path)) { return $false }
  $img = [System.Drawing.Bitmap]::FromFile($path)
  try {
    $seen = New-Object 'System.Collections.Generic.HashSet[int]'
    $stepX = [Math]::Max(1, [int]($img.Width / 24))
    $stepY = [Math]::Max(1, [int]($img.Height / 24))
    for ($x = 0; $x -lt $img.Width; $x += $stepX) {
      for ($y = 0; $y -lt $img.Height; $y += $stepY) {
        [void]$seen.Add($img.GetPixel($x, $y).ToArgb())
      }
    }
    return $seen.Count -ge 3
  } finally {
    $img.Dispose()
  }
}

# Reamostra preservando alpha. Os icones pequenos saem daqui, e nao de uma
# captura direta: o Chrome headless nao pinta janelas de 128x128 (sai chapada),
# e derivar de um master de 512 da resultado melhor de qualquer jeito.
function Resize-Png($source, $target, $size) {
  $src = [System.Drawing.Bitmap]::FromFile($source)
  try {
    $dst = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $g = [System.Drawing.Graphics]::FromImage($dst)
      try {
        $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)), 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel)
      } finally {
        $g.Dispose()
      }
      if (Test-Path $target) { Remove-Item $target -Force }
      $dst.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $dst.Dispose()
    }
  } finally {
    $src.Dispose()
  }
}

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist"
$assets = Join-Path $root "assets"
$out = Join-Path $root "store"
$web = Join-Path $env:TEMP "video-tuner-render"
$port = 8123

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) { throw "chrome.exe nao encontrado." }
if (-not (Test-Path (Join-Path $dist "manifest.json"))) {
  throw "dist/ ausente. Rode 'npm run build' antes."
}

# --------------------------------------------------------------- raiz web
# dist/ na raiz porque popup.html referencia /assets/... em caminho absoluto.
if (Test-Path $web) { Remove-Item $web -Recurse -Force }
New-Item -ItemType Directory -Path $web | Out-Null
Copy-Item (Join-Path $dist "*") $web -Recurse
Copy-Item (Join-Path $assets "*") $web -Force

# A tela de configuracao precisa do stub antes do seu module script.
$popup = Join-Path $web "popup.html"
$html = Get-Content $popup -Raw
$html = $html.Replace('<meta charset="utf-8" />', '<meta charset="utf-8" /><script src="chrome-stub.js"></script>')
[System.IO.File]::WriteAllText($popup, $html, (New-Object System.Text.UTF8Encoding($false)))

if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

# --------------------------------------------------------------- servidor
$server = Start-Process -FilePath "node" `
  -ArgumentList @((Join-Path $root "scripts\static-server.mjs"), $web, $port) `
  -PassThru -WindowStyle Hidden

try {
  # Espera a porta abrir em vez de dormir um tempo fixo.
  $ready = $false
  foreach ($i in 1..40) {
    try {
      $probe = New-Object System.Net.Sockets.TcpClient
      $probe.Connect("127.0.0.1", $port)
      $probe.Close()
      $ready = $true
      break
    } catch {
      Start-Sleep -Milliseconds 150
    }
  }
  if (-not $ready) { throw "servidor nao subiu na porta $port." }

  $shots = @(
    @{ file = "icon.html";           w = 512;  h = 512; out = "icon512.png";         alpha = $true },
    @{ file = "icon-16.html";        w = 512;  h = 512; out = "icon-small-master.png"; alpha = $true },
    @{ file = "promo-small.html";    w = 440;  h = 280; out = "promo-440x280.png";   alpha = $false },
    @{ file = "promo-marquee.html";  w = 1400; h = 560; out = "promo-1400x560.png";  alpha = $false },
    @{ file = "shot-player.html";                    w = 1280; h = 800; out = "screenshot-1-badge.png";    alpha = $false },
    @{ file = "shot-player.html?state=expanded";     w = 1280; h = 800; out = "screenshot-2-panel.png";    alpha = $false },
    @{ file = "shot-settings.html";                  w = 1280; h = 800; out = "screenshot-3-settings.png"; alpha = $false }
  )

  foreach ($shot in $shots) {
    $target = Join-Path $out $shot.out

    $args = @(
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--virtual-time-budget=4000",
      "--run-all-compositor-stages-before-draw",
      "--user-data-dir=$web\chrome-profile",
      "--window-size=$($shot.w),$($shot.h)",
      "--screenshot=$target"
    )
    if ($shot.alpha) { $args += "--default-background-color=00000000" }
    $args += "http://127.0.0.1:$port/$($shot.file)"

    $ok = $false
    foreach ($attempt in 1..4) {
      if (Test-Path $target) { Remove-Item $target -Force }
      & $chrome @args | Out-Null
      if (Test-Rendered $target) { $ok = $true; break }
      Write-Host ("    (tentativa {0} de {1} saiu chapada, repetindo)" -f $attempt, $shot.out)
      Start-Sleep -Milliseconds 400
    }
    if (-not $ok) { throw "falhou ao gerar $($shot.out)" }

    $kb = [math]::Round((Get-Item $target).Length / 1KB, 1)
    Write-Host ("  + {0}  {1}x{2}  {3} KB" -f $shot.out, $shot.w, $shot.h, $kb)
  }

  # Icones derivados dos masters de 512.
  $master = Join-Path $out "icon512.png"
  $smallMaster = Join-Path $out "icon-small-master.png"
  foreach ($size in 128, 48) {
    $target = Join-Path $out "icon$size.png"
    Resize-Png $master $target $size
    Write-Host ("  + icon{0}.png  {0}x{0}  {1} KB" -f $size, [math]::Round((Get-Item $target).Length / 1KB, 1))
  }
  $target = Join-Path $out "icon16.png"
  Resize-Png $smallMaster $target 16
  Write-Host ("  + icon16.png  16x16  {0} KB" -f [math]::Round((Get-Item $target).Length / 1KB, 1))
  Remove-Item $smallMaster -Force
} finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}

Write-Host ""
Write-Host "Imagens em store/"
