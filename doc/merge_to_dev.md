# ACHTUNG:

# !!!!!!!   Das Script muss im git bash Terminal ausgeführt werden    !!!!!!!

--------------------------------------------------------------------------------

#### Starten über:

```
$./merge_to_dev.sh
```

#### Das Script benötigt keine weiteren Argumente.

### Das Skript führt folgende Schritte aus:

- Überprüft, ob du dich im Root-Verzeichnis eines Git-Repositories befindest.
- Ermittelt den aktuellen Branch.
- Stellt sicher, dass alle Änderungen gestaged und committed sind.
- Holt die neuesten Änderungen vom Remote-Repository.
- Wechselt zum Development-Branch.
- Merged den aktuellen Feature-Branch in den Development-Branch.
- Pusht die Änderungen zum Remote-Repository.
- Wechselt zurück zum ursprünglichen Feature-Branch.

