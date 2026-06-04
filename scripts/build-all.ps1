$ErrorActionPreference = "Stop"

$PluginDirs = @(
    "plugin/songloft-jsplugin-lxmusic-api-main",
    "plugin/songloft-jsplugin-lxmusic-main",
    "plugin/songloft-plugin-gdstudio-main"
)

Write-Host "=== Start building all plugins ===" -ForegroundColor Green
Write-Host ""

$SuccessCount = 0
$FailedCount = 0
$BuiltPlugins = @()

foreach ($Dir in $PluginDirs) {
    $FullPath = Join-Path (Get-Location) $Dir
    if (-not (Test-Path $FullPath)) {
        Write-Host "[!] Directory not found: $FullPath" -ForegroundColor Yellow
        continue
    }

    $PluginName = Split-Path $Dir -Leaf
    Write-Host "[-] Building: $PluginName" -ForegroundColor Cyan

    try {
        Push-Location $FullPath

        if (Test-Path "node_modules") {
            Write-Host "    Dependencies installed, skip npm install"
        } else {
            Write-Host "    Running npm install..."
            npm install | Out-Null
        }

        Write-Host "    Running npm run build..."
        & npm run build

        if ($LASTEXITCODE -eq 0) {
            $RawJson = Get-Content "plugin.json" -Raw -Encoding UTF8
            $PluginJson = $RawJson | ConvertFrom-Json
            $ZipPath = Join-Path $FullPath "dist/$($PluginJson.entryPath).jsplugin.zip"

            if (Test-Path $ZipPath) {
                $ZipSize = [math]::Round((Get-Item $ZipPath).Length / 1KB, 2)
                Write-Host "[OK] Build successful: $PluginName ($ZipSize KB)" -ForegroundColor Green
                $BuiltPlugins += @{
                    Name = $PluginJson.name
                    EntryPath = $PluginJson.entryPath
                    Version = $PluginJson.version
                    ZipPath = $ZipPath
                    EntryHash = $PluginJson.entryHash
                    ZipHash = $PluginJson.zipHash
                }
                $SuccessCount++
            } else {
                Write-Host "[X] Build failed: generated zip file not found" -ForegroundColor Red
                $FailedCount++
            }
        } else {
            Write-Host "[X] Build failed: $PluginName" -ForegroundColor Red
            $FailedCount++
        }
    } catch {
        Write-Host "[X] Build exception: $($_.Exception.Message)" -ForegroundColor Red
        $FailedCount++
    } finally {
        Pop-Location
    }

    Write-Host ""
}

Write-Host "=== Build Summary ===" -ForegroundColor Green
Write-Host "Success: $SuccessCount" -ForegroundColor Green
Write-Host "Failed:  $FailedCount" -ForegroundColor $(if ($FailedCount -gt 0) { "Red" } else { "Gray" })

if ($BuiltPlugins.Count -gt 0) {
    Write-Host ""
    Write-Host "=== Build Artifacts ===" -ForegroundColor Cyan
    $BuiltPlugins | ForEach-Object {
        Write-Host ""
        Write-Host "[PKG] $($_.Name) v$($_.Version)"
        Write-Host "       Entry: $($_.EntryPath)"
        Write-Host "       Path:  $($_.ZipPath)"
        Write-Host "       entryHash: $($_.EntryHash)"
        Write-Host "       zipHash:   $($_.ZipHash)"
    }

    $ReleasesDir = Join-Path (Get-Location) "releases"
    if (-not (Test-Path $ReleasesDir)) {
        New-Item -ItemType Directory -Path $ReleasesDir | Out-Null
    }

    Write-Host ""
    Write-Host "=== Copy to releases directory ===" -ForegroundColor Cyan
    $BuiltPlugins | ForEach-Object {
        $DestPath = Join-Path $ReleasesDir "$($_.EntryPath).jsplugin.zip"
        Copy-Item $_.ZipPath $DestPath -Force
        Write-Host "[OK] Copied: $DestPath"
    }

    Write-Host ""
    Write-Host "[DIR] All artifacts copied to: releases/" -ForegroundColor Green
}

if ($FailedCount -gt 0) {
    exit 1
}
