# Project NEXT Intelligence - Stop Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Project NEXT Intelligence - Stopping Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check which Docker Compose command to use
$composeInstalled = Get-Command docker-compose -ErrorAction SilentlyContinue
if (-not $composeInstalled) {
    $composeCmd = "docker compose"
} else {
    $composeCmd = "docker-compose"
}

Write-Host "Stopping all services..." -ForegroundColor Yellow

try {
    if ($composeCmd -eq "docker compose") {
        docker compose down
    } else {
        docker-compose down
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ All services stopped successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "To remove volumes and data:" -ForegroundColor Yellow
        Write-Host "  $composeCmd down -v" -ForegroundColor White
    } else {
        Write-Host "ERROR: Failed to stop services" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
