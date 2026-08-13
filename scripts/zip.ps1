# Empacota dist/ para upload na Chrome Web Store.
#
# Nao use Compress-Archive: no Windows PowerShell 5.1 ele grava os caminhos
# internos com barra invertida, fora da especificacao do ZIP, e o upload da
# Web Store rejeita ou desempacota errado. Aqui os nomes das entradas sao
# escritos a mao com barra normal.
#
# Sem acentos de proposito: PowerShell 5.1 le .ps1 sem BOM como ANSI.
#
#   powershell -ExecutionPolicy Bypass -File scripts/zip.ps1

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist"
if (-not (Test-Path (Join-Path $dist "manifest.json"))) {
  throw "dist/manifest.json nao encontrado. Rode 'npm run build' antes."
}

$version = (Get-Content (Join-Path $dist "manifest.json") -Raw | ConvertFrom-Json).version
$zipPath = Join-Path $root "video-tuner-$version.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$stream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::CreateNew)
$zip = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $prefix = (Resolve-Path $dist).Path.TrimEnd('\') + '\'
  foreach ($file in Get-ChildItem $dist -Recurse -File) {
    $name = $file.FullName.Substring($prefix.Length).Replace('\', '/')
    $entry = $zip.CreateEntry($name, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    try {
      $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
      $entryStream.Write($bytes, 0, $bytes.Length)
    } finally {
      $entryStream.Dispose()
    }
    Write-Host ("  + " + $name)
  }
} finally {
  $zip.Dispose()
  $stream.Dispose()
}

$sizeKb = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host ""
Write-Host ((Split-Path -Leaf $zipPath) + " (" + $sizeKb + " KB)")
