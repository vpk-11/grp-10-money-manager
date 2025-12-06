#requires -Version 5.1

<#!
Money Manager - AI Chatbot Setup (Windows)
This PowerShell script installs Ollama on Windows, starts the service,
and pulls only the approved AI models:
- llama3.2:1b (1.3GB)
- llama3.2:3b (2.0GB)

Run in an elevated PowerShell (Run as Administrator) for service install.
!>

[CmdletBinding()] param()

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "! $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "✗ $msg" -ForegroundColor Red }

function Test-OllamaInstalled {
  $exists = (Get-Command ollama -ErrorAction SilentlyContinue) -ne $null
  if ($exists) { Write-Ok 'Ollama is already installed'; return $true }
  Write-Warn 'Ollama is not installed'; return $false
}

function Install-Ollama {
  Write-Info 'Installing Ollama (Windows)...'
  $installerUrl = 'https://ollama.com/download/OllamaSetup.exe'
  $tmp = Join-Path $env:TEMP 'OllamaSetup.exe'
  Write-Info "Downloading: $installerUrl"
  Invoke-WebRequest -Uri $installerUrl -OutFile $tmp
  Write-Info 'Running installer...'
  Start-Process -FilePath $tmp -ArgumentList '/S' -Wait -NoNewWindow
  Write-Ok 'Ollama installed'
}

function Start-OllamaService {
  Write-Info 'Starting Ollama service...'
  try {
    sc.exe query Ollama | Out-Null
    # Try to start service if exists
    Start-Service -Name 'Ollama' -ErrorAction SilentlyContinue
  } catch {
    Write-Warn 'Ollama service not found; starting foreground server'
  }

  # Verify API responds; if not, run foreground server
  Start-Sleep -Seconds 3
  if (-not (Test-OllamaRunning)) {
    Write-Warn 'Service not responding; starting foreground `ollama serve`'
    Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Minimized
    Start-Sleep -Seconds 3
  }

  if (Test-OllamaRunning) { Write-Ok 'Ollama service running' } else { Write-Err 'Failed to start Ollama'; exit 1 }
}

function Test-OllamaRunning {
  try {
    $resp = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -Method GET -TimeoutSec 2
    return $resp.StatusCode -eq 200
  } catch { return $false }
}

function Pull-Model($name) {
  Write-Info "Pulling model: $name (this can take minutes)..."
  & ollama pull $name
  if ($LASTEXITCODE -ne 0) { Write-Err "Failed to pull $name"; exit 1 }
  Write-Ok "Model $name installed"
}

function Show-Menu {
  Write-Host ""; Write-Host "=========================================="
  Write-Host "Available AI Models (Windows)"
  Write-Host "=========================================="; Write-Host ""
  Write-Host "1. llama3.2:1b (1.3GB)   - Lightning quick, basic accuracy (default)"
  Write-Host "2. llama3.2:3b (2.0GB)   - Balanced speed & intelligence"
  Write-Host "3. Install both models"
  Write-Host "4. Skip model installation"
}

function Main {
  Write-Host "=========================================="
  Write-Host "Money Manager - AI Chatbot Setup (Windows)"
  Write-Host "=========================================="; Write-Host ""

  if (-not (Test-OllamaInstalled)) {
    $install = Read-Host 'Install Ollama now? (y/n)'
    if ($install -match '^(y|Y)$') { Install-Ollama } else { Write-Err 'Ollama is required. Exiting.'; exit 1 }
  }

  Start-OllamaService

  Show-Menu
  $choice = Read-Host 'Select model(s) to install (1-4)'
  switch ($choice) {
    '1' { Pull-Model 'llama3.2:1b' }
    '2' { Pull-Model 'llama3.2:3b' }
    '3' { Pull-Model 'llama3.2:1b'; Pull-Model 'llama3.2:3b' }
    '4' { Write-Warn 'Skipping model installation' }
    default { Write-Err 'Invalid choice'; exit 1 }
  }

  Write-Host ""; Write-Host "=========================================="
  Write-Ok 'Setup Complete!'
  Write-Host "=========================================="; Write-Host ""
  Write-Host 'To manage Ollama:'
  Write-Host '  Start (service):  Start-Service Ollama'
  Write-Host '  Stop (service):   Stop-Service Ollama'
  Write-Host '  Foreground:       ollama serve'
  Write-Host ''
  Write-Host 'Install models later:'
  Write-Host '  ollama pull <model-name>'
}

Main
