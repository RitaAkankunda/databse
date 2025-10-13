# PowerShell helper to activate venv and run Django dev server without autoreload
# Usage: Open PowerShell in this folder and run: .\run_dev.ps1

$venvActivate = ".\.venv\Scripts\Activate.ps1"
if (Test-Path $venvActivate) {
    try {
        & $venvActivate
    } catch {
        Write-Host "Failed to run Activate.ps1; trying to set ExecutionPolicy for this process and retrying..."
        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
        & $venvActivate
    }
} else {
    Write-Host "Virtualenv activate script not found at $venvActivate. Ensure .venv exists and is created."
}

# Start Django dev server without autoreload (quieter)
python manage.py runserver 0.0.0.0:8000 --noreload
