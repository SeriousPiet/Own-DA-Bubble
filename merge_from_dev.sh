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

# Merge des Remote-Development-Branches in den aktuellen Branch
echo "Merging $REMOTE/$DEVELOPMENT_BRANCH into $CURRENT_BRANCH..."
git merge $REMOTE/$DEVELOPMENT_BRANCH
if [ $? -ne 0 ]; then
  echo "Merge-Konflikte müssen manuell gelöst werden. Bitte löse die Konflikte und führe das Skript erneut aus."
  exit 1
fi

echo "Merge erfolgreich abgeschlossen."
