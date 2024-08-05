# Name des Remote-Repositories und des Development-Branches
$remote = "origin"
$developmentBranch = "development"

# Überprüfen, ob wir uns im Git-Repository befinden
if (-not (Test-Path ".git")) {
    Write-Host "Dieses Skript muss im Root-Verzeichnis eines Git-Repositorys ausgeführt werden."
    exit 1
}

# Aktuellen Branch ermitteln
$currentBranch = git symbolic-ref --short HEAD
if ($LASTEXITCODE -ne 0) {
    Write-Host "Konnte den aktuellen Branch nicht ermitteln."
    exit 1
}

# Änderungen sicherstellen
Write-Host "Stelle sicher, dass alle Änderungen gestaged und committed sind..."
git status
$answer = Read-Host "Sind alle Änderungen gestaged und committed? (y/n)"
if ($answer -ne "y") {
    Write-Host "Bitte committe deine Änderungen und führe das Skript erneut aus."
    exit 1
}

# Abrufen der neuesten Änderungen vom Remote-Repository
Write-Host "Hole die neuesten Änderungen vom Remote-Repository..."
git fetch $remote

# Wechsel zum Development-Branch
Write-Host "Wechsle zum Development-Branch..."
git checkout $developmentBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Fehler beim Wechseln zum Development-Branch."
    exit 1
}

# Merge des aktuellen Feature-Branches in den Development-Branch
Write-Host "Merging $currentBranch into $developmentBranch..."
git merge $currentBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Merge-Konflikte müssen manuell gelöst werden. Bitte löse die Konflikte und führe das Skript erneut aus."
    exit 1
}

# Pushen der Änderungen zum Remote-Repository
Write-Host "Pushe die Änderungen zum Remote-Repository..."
git push $remote $developmentBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Fehler beim Pushen zum Remote-Repository."
    exit 1
}

# Zurückkehren zum ursprünglichen Branch
Write-Host "Wechsle zurück zum ursprünglichen Branch $currentBranch..."
git checkout $currentBranch

Write-Host "Merge und Push erfolgreich abgeschlossen."
