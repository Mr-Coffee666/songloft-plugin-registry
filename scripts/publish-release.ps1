param(
    [string]$Plugin,
    [string]$Version,
    [switch]$All,
    [switch]$Draft,
    [switch]$Prerelease
)

$ErrorActionPreference = "Stop"

$GhPath = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $GhPath)) {
    $GhPath = "gh"
}

$PluginConfig = @{
    "lxmusic-api" = @{
        Dir = "plugin/songloft-jsplugin-lxmusic-api-main"
        TagPrefix = "lxmusic-api-v"
        DisplayName = "LX Music API"
    }
    "lxmusic" = @{
        Dir = "plugin/songloft-jsplugin-lxmusic-main"
        TagPrefix = "lxmusic-v"
        DisplayName = "LX Music Source"
    }
    "gdstudio" = @{
        Dir = "plugin/songloft-plugin-gdstudio-main"
        TagPrefix = "gdstudio-v"
        DisplayName = "GD Studio"
    }
}

function Test-GitHubCLI {
    try {
        $null = & $GhPath --version 2>&1
        return $true
    } catch {
        return $false
    }
}

function Get-GitHubAuthStatus {
    try {
        $Status = & $GhPath auth status 2>&1
        return $Status -match "Logged in to github.com"
    } catch {
        return $false
    }
}

function Get-GitHubUser {
    try {
        $User = & $GhPath api user --jq '.login' 2>&1
        return $User.Trim()
    } catch {
        return $null
    }
}

function Get-PluginVersion($PluginDir) {
    $PluginJsonPath = Join-Path $PluginDir "plugin.json"
    if (Test-Path $PluginJsonPath) {
        $RawJson = Get-Content $PluginJsonPath -Raw -Encoding UTF8
        $PluginJson = $RawJson | ConvertFrom-Json
        return $PluginJson.version
    }
    return $null
}

function New-PluginRelease($PluginKey, $TargetVersion) {
    $Config = $PluginConfig[$PluginKey]
    $PluginDir = Join-Path (Get-Location) $Config.Dir

    if (-not (Test-Path $PluginDir)) {
        Write-Host "[X] Plugin directory not found: $PluginDir" -ForegroundColor Red
        return $false
    }

    if ([string]::IsNullOrEmpty($TargetVersion)) {
        $TargetVersion = Get-PluginVersion $PluginDir
        if ([string]::IsNullOrEmpty($TargetVersion)) {
            Write-Host "[X] Cannot get plugin version, please specify -Version" -ForegroundColor Red
            return $false
        }
    }

    $TagName = $Config.TagPrefix + $TargetVersion
    $ZipName = $PluginKey + ".jsplugin.zip"
    $ZipPath = Join-Path $PluginDir "dist/$ZipName"

    if (-not (Test-Path $ZipPath)) {
        Write-Host "[!] Build artifact not found: $ZipPath" -ForegroundColor Yellow
        Write-Host "    Please run first: .\scripts\build-all.ps1" -ForegroundColor Yellow
        return $false
    }

    $ZipSize = [math]::Round((Get-Item $ZipPath).Length / 1KB, 2)

    Write-Host ""
    Write-Host "=== Publishing " $Config.DisplayName " ===" -ForegroundColor Green
    Write-Host "  Tag:     " $TagName
    Write-Host "  Version: " $TargetVersion
    Write-Host "  Asset:   " $ZipName " (" $ZipSize " KB)"
    Write-Host ""

    $ReleaseNotes = @"
## $($Config.DisplayName) v$TargetVersion

### Plugin Info
- **Name**: $($Config.DisplayName)
- **Version**: $TargetVersion
- **Entry Path**: ``$PluginKey``

### Installation
Add source in Songloft plugin store:
``https://raw.githubusercontent.com/Mr-Coffee666/songloft-plugin-registry/main/registry.json``
"@

    $ReleaseNotesPath = Join-Path ([System.IO.Path]::GetTempPath()) ("release-notes-" + $PluginKey + ".md")
    $ReleaseNotes | Out-File $ReleaseNotesPath -Encoding utf8

    $Args = @("release", "create", $TagName, $ZipPath, "--title", ($Config.DisplayName + " v" + $TargetVersion), "--notes-file", $ReleaseNotesPath)

    if ($Draft) { $Args += "--draft" }
    if ($Prerelease) { $Args += "--prerelease" }

    try {
        Write-Host "[-] Creating GitHub Release..."
        & $GhPath @Args

        if ($LASTEXITCODE -eq 0) {
            $DownloadUrl = "https://github.com/Mr-Coffee666/songloft-plugin-registry/releases/download/$TagName/$ZipName"
            Write-Host "[OK] Published successfully!" -ForegroundColor Green
            Write-Host "     Download URL: " $DownloadUrl

            $ManifestPath = Join-Path $PluginDir "manifest.json"
            $Manifest = @{
                version = $TargetVersion
                download_url = $DownloadUrl
            }
            $Manifest | ConvertTo-Json -Compress | Out-File $ManifestPath -Encoding utf8
            Write-Host "     [OK] manifest.json updated" -ForegroundColor Green

            return $true
        } else {
            Write-Host "[X] Publish failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "[X] Publish exception: " $_.Exception.Message -ForegroundColor Red
        return $false
    } finally {
        if (Test-Path $ReleaseNotesPath) {
            Remove-Item $ReleaseNotesPath -Force
        }
    }
}

if (-not (Test-GitHubCLI)) {
    Write-Host "[X] GitHub CLI (gh) not found" -ForegroundColor Red
    Write-Host "    Install: winget install GitHub.cli" -ForegroundColor Yellow
    Write-Host "    Or visit: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-GitHubAuthStatus)) {
    Write-Host "[X] GitHub CLI not logged in" -ForegroundColor Red
    Write-Host "    Run: $GhPath auth login" -ForegroundColor Yellow
    exit 1
}

$AuthUser = Get-GitHubUser
Write-Host "[OK] Logged in as GitHub user: " $AuthUser -ForegroundColor Green
Write-Host ""

$SuccessCount = 0
$FailedCount = 0

if ($All) {
    foreach ($Key in $PluginConfig.Keys) {
        if (New-PluginRelease $Key $Version) {
            $SuccessCount++
        } else {
            $FailedCount++
        }
    }
} elseif (-not [string]::IsNullOrEmpty($Plugin)) {
    if ($PluginConfig.ContainsKey($Plugin)) {
        if (New-PluginRelease $Plugin $Version) {
            $SuccessCount++
        } else {
            $FailedCount++
        }
    } else {
        Write-Host "[X] Unknown plugin: " $Plugin -ForegroundColor Red
        Write-Host "    Available: " ($PluginConfig.Keys -join ', ') -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Usage: .\scripts\publish-release.ps1 [-Plugin <name>] [-Version <ver>] [-All] [-Draft] [-Prerelease]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Plugin     Plugin name: " ($PluginConfig.Keys -join ', ')
    Write-Host "  -Version    Version (optional, default from plugin.json)"
    Write-Host "  -All        Publish all plugins"
    Write-Host "  -Draft      Save as draft"
    Write-Host "  -Prerelease Mark as prerelease"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\publish-release.ps1 -Plugin lxmusic-api"
    Write-Host "  .\scripts\publish-release.ps1 -All"
    Write-Host "  .\scripts\publish-release.ps1 -Plugin gdstudio -Version 1.0.1 -Draft"
    exit 0
}

Write-Host ""
Write-Host "=== Publish Summary ===" -ForegroundColor Green
Write-Host "Success: " $SuccessCount -ForegroundColor Green
Write-Host "Failed:  " $FailedCount -ForegroundColor $(if ($FailedCount -gt 0) { "Red" } else { "Gray" })

if ($FailedCount -gt 0) {
    exit 1
}
