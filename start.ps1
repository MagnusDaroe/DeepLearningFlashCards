# start.ps1 — install dependencies if needed, then launch the dev server

Set-Location $PSScriptRoot

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed. Download it from https://nodejs.org"
    exit 1
}

# Check npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed. It should come with Node.js."
    exit 1
}

# Install dependencies if node_modules is missing or package.json is newer
if (-not (Test-Path "node_modules") -or
    ((Get-Item "package.json").LastWriteTime -gt (Get-Item "node_modules").LastWriteTime)) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Starting dev server..." -ForegroundColor Green
npm run dev -- --open
