# Auto-Sync script for Paha Dinana Hapannu
# Watches for local file changes, commits, and pushes to GitHub automatically.
# Vercel will then auto-deploy the changes!

$Host.UI.RawUI.WindowTitle = "Auto Sync & Deploy (Paha Dinana Hapannu)"
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   🚀 Paha Dinana Hapannu - Auto Git Sync & Deploy" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Watching for changes in class-site... Press Ctrl+C to stop.`n" -ForegroundColor Yellow

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = (Get-Location).Path
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$ignoredPatterns = @('\\.git', '\\.next', 'node_modules', '\\.env\\.local', 'build', 'out')

$global:pendingChanges = $false

$action = {
    param($source, $event)
    $path = $event.FullPath
    foreach ($pattern in $ignoredPatterns) {
        if ($path -match $pattern) { return }
    }
    $global:pendingChanges = $true
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null

while ($true) {
    Start-Sleep -Seconds 3
    if ($global:pendingChanges) {
        $now = Get-Date
        Write-Host "[$($now.ToString('HH:mm:ss'))] 🔄 File changes detected! Debouncing..." -ForegroundColor Cyan
        
        # Debounce: wait 4 seconds for file saves to settle
        Start-Sleep -Seconds 4
        $global:pendingChanges = $false

        $status = git status --porcelain
        if ($status) {
            Write-Host "Staging changes..." -ForegroundColor DarkGray
            git add .
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            git commit -m "auto: save changes ($timestamp)"
            Write-Host "Pushing to GitHub (origin main)..." -ForegroundColor Yellow
            git push origin main
            Write-Host "✅ Successfully pushed to GitHub! Vercel is auto-deploying now." -ForegroundColor Green
        } else {
            Write-Host "No changes to commit." -ForegroundColor DarkGray
        }
    }
}

