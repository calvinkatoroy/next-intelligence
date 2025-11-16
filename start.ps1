# Project NEXT Intelligence - Quick Start Script
# Run this script to set up and start the entire system

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Project NEXT Intelligence - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking for Docker..." -ForegroundColor Yellow
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "ERROR: Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host "Docker found" -ForegroundColor Green

# Check if Docker Compose is available
Write-Host "Checking for Docker Compose..." -ForegroundColor Yellow
$composeInstalled = Get-Command docker-compose -ErrorAction SilentlyContinue
if (-not $composeInstalled) {
    Write-Host "WARNING: docker-compose not found, trying docker compose instead" -ForegroundColor Yellow
    $composeCmd = "docker compose"
} else {
    $composeCmd = "docker-compose"
}
Write-Host "Docker Compose available" -ForegroundColor Green

# Check if .env exists
Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host ".env file created" -ForegroundColor Green
    Write-Host "You can edit .env to customize settings" -ForegroundColor Cyan
} else {
    Write-Host ".env file exists" -ForegroundColor Green
}

# Start services
Write-Host ""
Write-Host "Starting Project NEXT Intelligence services..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Cyan
Write-Host ""

try {
    if ($composeCmd -eq "docker compose") {
        docker compose up -d --build
    } else {
        docker-compose up -d --build
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Services started successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access the application at:" -ForegroundColor Cyan
        Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
        Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
        Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White
        Write-Host ""
        Write-Host "To view logs:" -ForegroundColor Yellow
        Write-Host "  $composeCmd logs -f" -ForegroundColor White
        Write-Host ""
        Write-Host "To stop services:" -ForegroundColor Yellow
        Write-Host "  $composeCmd down" -ForegroundColor White
        Write-Host ""
        Write-Host "Opening frontend in browser..." -ForegroundColor Cyan
        Start-Sleep -Seconds 3
        Start-Process "http://localhost:3000"
    } else {
        Write-Host "ERROR: Failed to start services" -ForegroundColor Red
        Write-Host "Check the error messages above for details" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR: An error occurred" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}