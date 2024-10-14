#!/bin/bash

# Überprüfe, ob das gh CLI installiert ist
if ! command -v gh &> /dev/null; then
  echo "gh CLI ist nicht installiert. Bitte installiere es von https://cli.github.com/."
  exit 1
fi

# Überprüfe, ob ein Parameter für den Branch eingegeben wurde
if [ "$#" -eq 0 ]; then
  echo "Keine Branches angegeben. Liste der verfügbaren Remote-Branches:"
  git fetch origin
  git branch -r
  exit 0
fi

# Überprüfe, ob der Benutzer angemeldet ist
if ! gh auth status &> /dev/null; then
  echo "Du bist nicht bei GitHub CLI angemeldet. Führe 'gh auth login' aus."
  exit 1
fi

# Der Branch, der gemergt werden soll, ist der erste Parameter
BRANCH_TO_MERGE=$1

# Holen Sie die neuesten Änderungen vom Remote-Repository
echo "Aktualisiere lokale Informationen..."
git fetch origin

# Überprüfen, ob der angegebene Branch existiert
if ! git show-ref --verify --quiet "refs/remotes/origin/$BRANCH_TO_MERGE"; then
  echo "Der angegebene Branch '$BRANCH_TO_MERGE' existiert nicht im Remote-Repository."
  exit 1
fi

# Hole den aktuellen Branch-Namen
CURRENT_BRANCH=$(git branch --show-current)

# Mergen des angegebenen Branches in den aktuellen Branch
echo "Merging Branch '$BRANCH_TO_MERGE' in den aktuellen Branch '$CURRENT_BRANCH'..."
git merge "origin/$BRANCH_TO_MERGE"

# Überprüfe, ob der Merge erfolgreich war
if [ $? -eq 0 ]; then
  echo "Branch '$BRANCH_TO_MERGE' wurde erfolgreich in '$CURRENT_BRANCH' gemergt."
else
  echo "Fehler beim Mergen von Branch '$BRANCH_TO_MERGE' in '$CURRENT_BRANCH'."
  echo "Bitte behebe die Konflikte und committe die Änderungen."
fi
