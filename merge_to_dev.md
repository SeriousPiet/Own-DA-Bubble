Es gibt zwei Scripte, eins für die powershell und eins für git bash.
Beide machen das gleiche, ohne die Angabe von Parametern.

Das Skript führt folgende Schritte aus:

 - Überprüft, ob du dich im Root-Verzeichnis eines Git-Repositories befindest.
 - Ermittelt den aktuellen Branch.
 - Stellt sicher, dass alle Änderungen gestaged und committed sind.
 - Holt die neuesten Änderungen vom Remote-Repository.
 - Wechselt zum Development-Branch.
 - Merged den aktuellen Feature-Branch in den Development-Branch.
 - Pusht die Änderungen zum Remote-Repository.
 - Wechselt zurück zum ursprünglichen Feature-Branch.

