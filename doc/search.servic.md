## SearchService API Documentation

### Public Properties

#### `isContextSearchEnabled`

- **Type:** `boolean`
- **Description:** Gibt an, ob die kontextbezogene Suche aktiviert ist.

#### `searchState$`

- **Type:** `Observable<{ query: string; context: string | null; }>`
- **Description:** Observable, das den aktuellen Suchzustand emittiert.

### Public Methods

#### `updateSearchQuery(query: string): void`

- **Description:** Aktualisiert die Suchanfrage im aktuellen Suchzustand.
- **Parameters:**
  - `query: string` - Die neue Suchanfrage.

#### `addContextRestriction(context: string): void`

- **Description:** Fügt eine Kontextbeschränkung zum aktuellen Suchzustand hinzu.
- **Parameters:**
  - `context: string` - Der hinzuzufügende Kontext.

#### `removeContextRestriction(): void`

- **Description:** Entfernt die aktuelle Kontextbeschränkung aus dem Suchzustand.

#### `addRecentSearch(term: string): void`

- **Description:** Fügt den angegebenen Suchbegriff zur Liste der letzten Suchen hinzu.
- **Parameters:**
  - `term: string` - Der hinzuzufügende Suchbegriff.

#### `getRecentSearches(): string[]`

- **Description:** Ruft die Liste der letzten Suchen aus dem lokalen Speicher ab.
- **Returns:** Ein Array der letzten Suchbegriffe.

#### `removeRecentSearch(term: string): void`

- **Description:** Entfernt den angegebenen Suchbegriff aus der Liste der letzten Suchen.
- **Parameters:**
  - `term: string` - Der zu entfernende Suchbegriff.

#### `getSearchSuggestions(): Observable<{ text: string; type: string; hasChat: boolean }[]>`

- **Description:** Liefert Suchvorschläge basierend auf dem aktuellen Suchzustand.
- **Returns:** Ein Observable, das ein Array von Suchvorschlägen emittiert.

#### `setContextSearchEnabled(enabled: boolean): void`

- **Description:** Aktiviert oder deaktiviert die kontextbezogene Suche.
- **Parameters:**
  - `enabled: boolean` - `true` zum Aktivieren, `false` zum Deaktivieren.

#### `getCurrentContext(): string`

- **Description:** Ruft den aktuellen Suchkontext ab.
- **Returns:** Der aktuelle Suchkontext.

#### `getSearchRestrictions(): { query: string; context: string | null; }`

- **Description:** Ruft die aktuellen Suchbeschränkungen ab.
- **Returns:** Ein Objekt mit den aktuellen Suchbeschränkungen.

#### `getRegisteredUsers(): string[]`

- **Description:** Ruft eine Liste aller registrierten Benutzernamen ab.
- **Returns:** Ein Array von Strings mit den Namen aller registrierten Benutzer.

#### `getContextMembers(): string[]`

- **Description:** Ruft die Mitglieder des aktuellen Suchkontexts ab, wenn der Kontext ein Kanal ist.
- **Returns:** Ein Array von Strings mit den Mitgliedernamen des aktuellen Kanals oder ein leeres Array.

#### `getUserNames(userIDs: string[]): string[]`

- **Description:** Ruft eine Liste von Benutzernamen für die angegebenen Benutzer-IDs ab.
- **Parameters:**
  - `userIDs: string[]` - Ein Array von Benutzer-IDs.
- **Returns:** Ein Array von Benutzernamen.
