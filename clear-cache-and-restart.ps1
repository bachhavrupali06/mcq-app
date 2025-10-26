# Clear React Cache and Restart Script
# Run this script to see the new UI changes

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Clear Cache & Restart React App" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to client folder
Set-Location "F:\Edit Exam App 2\Exam App\client"

Write-Host "[1/4] Clearing React cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
Write-Host "      ✓ Cache cleared!" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] Checking if Node.js is installed..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "      ✓ Node.js $nodeVersion found!" -ForegroundColor Green
} else {
    Write-Host "      ✗ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[3/4] Verifying file changes..." -ForegroundColor Yellow
$fileContent = Get-Content "F:\Edit Exam App 2\Exam App\client\src\components\AdminDashboard.js" -Raw
if ($fileContent -match "linear-gradient.*dc3545") {
    Write-Host "      ✓ New UI code detected in AdminDashboard.js!" -ForegroundColor Green
} else {
    Write-Host "      ✗ Warning: New UI code not found. Changes may not have been saved." -ForegroundColor Red
}
Write-Host ""

Write-Host "[4/4] Instructions to start the app:" -ForegroundColor Yellow
Write-Host ""
Write-Host "      Open TWO PowerShell terminals:" -ForegroundColor White
Write-Host ""
Write-Host "      Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "      cd 'F:\Edit Exam App 2\Exam App\server'" -ForegroundColor Gray
Write-Host "      node index.js" -ForegroundColor Gray
Write-Host ""
Write-Host "      Terminal 2 (Frontend):" -ForegroundColor Cyan
Write-Host "      cd 'F:\Edit Exam App 2\Exam App\client'" -ForegroundColor Gray
Write-Host "      npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "      After the browser opens:" -ForegroundColor Yellow
Write-Host "      1. Press Ctrl+Shift+R (or Ctrl+F5) to hard refresh" -ForegroundColor White
Write-Host "      2. Login as admin" -ForegroundColor White
Write-Host "      3. Click any delete button" -ForegroundColor White
Write-Host "      4. You should see the NEW beautiful modal!" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  • Start backend server (Terminal 1)" -ForegroundColor White
Write-Host "  • Start frontend server (Terminal 2)" -ForegroundColor White
Write-Host "  • Hard refresh browser (Ctrl+F5)" -ForegroundColor White
Write-Host "  • Test delete button" -ForegroundColor White
Write-Host ""
Write-Host "Done! Cache cleared successfully." -ForegroundColor Green
Write-Host ""
