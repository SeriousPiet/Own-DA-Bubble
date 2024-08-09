#!/bin/bash

# Name des Remote-Repositories und des Development-Branches
REMOTE=origin
DEVELOPMENT_BRANCH=development

# Überprüfen, ob wir uns im Git-Repository befinden
if [ ! -d ".git" ]; then
  echo "Dieses Skript muss im Root-Verzeichnis eines Git-Repositorys ausgeführt werden."
  exit 1
fi

# Aktuellen Branch ermitteln
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
if [ $? -ne 0 ]; then
  echo "Konnte den aktuellen Branch nicht ermitteln."
  exit 1
fi

# Änderungen sicherstellen
echo "Stelle sicher, dass alle Änderungen gestaged und committed sind..."
git status
echo "Sind alle Änderungen gestaged und committed? (y/n)"
read -r answer
if [ "$answer" != "y" ]; then
  echo "Bitte committe deine Änderungen und führe das Skript erneut aus."
  exit 1
fi

# Abrufen der neuesten Änderungen vom Remote-Repository
echo "Hole die neuesten Änderungen vom Remote-Repository..."
git fetch $REMOTE

# Wechsel zum Development-Branch
echo "Wechsle zum Development-Branch..."
git checkout $DEVELOPMENT_BRANCH
if [ $? -ne 0 ]; then
  echo "Fehler beim Wechseln zum Development-Branch."
  exit 1
fi

# Merge des aktuellen Feature-Branches in den Development-Branch
echo "Merging $CURRENT_BRANCH into $DEVELOPMENT_BRANCH..."
git merge $CURRENT_BRANCH
if [ $? -ne 0 ]; then
  echo "Merge-Konflikte müssen manuell gelöst werden. Bitte löse die Konflikte und führe das Skript erneut aus."
  exit 1
fi

# Pushen der Änderungen zum Remote-Repository
echo "Pushe die Änderungen zum Remote-Repository..."
git push $REMOTE $DEVELOPMENT_BRANCH
if [ $? -ne 0 ]; then
  echo "Fehler beim Pushen zum Remote-Repository."
  exit 1
fi

# Zurückkehren zum ursprünglichen Branch
echo "Wechsle zurück zum ursprünglichen Branch $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH

echo "Merge und Push erfolgreich abgeschlossen."
