# UsersService API Documentation

## Public Properties

### `changeUserList$`
- **Type:** `Observable<string>`
- **Description:** Observable for monitoring changes in the user list.

### `changeCurrentUser$`
- **Type:** `Observable<string>`
- **Description:** Observable for monitoring changes to the current user.

### `users`
- **Type:** `User[]`
- **Description:** List of all users fetched from Firestore.

### `currentUser`
- **Type:** `User | undefined`
- **Description:** Currently logged-in user object.

## Public Methods

### `get currentUserID(): string`
- **Description:** Returns the ID of the currently logged-in user or a default message if no user is logged in.

### `getAllUserIDs(): string[]`
- **Description:** Retrieves an array of all user IDs from the `users` list.

### `getUserByID(id: string): User | undefined`
- **Description:** Finds a user by their ID from the `users` list.
- **Parameters:**
  - `id` - The ID of the user to find.

### `async updateCurrentUserDataOnFirestore(userChangeData: {}): Promise<void>`
- **Description:** Updates the data of the currently logged-in user in Firestore.
- **Parameters:**
  - `userChangeData` - The data to update for the current user.

### `async updateCurrentUserEmail(newEmail: string, currentPassword: string): Promise<string | undefined>`
- **Description:** Updates the email of the currently logged-in user in Firebase Authentication and Firestore.
- **Parameters:**
  - `newEmail` - The new email address to set for the current user.
  - `currentPassword` - The current password of the user for reauthentication.

### `logoutUser(): void`
- **Description:** Logs out the currently logged-in user from Firebase Authentication.

### `async setCurrentUserByEMail(userEmail: string): Promise<void>`
- **Description:** Sets the current user based on their email address and updates Firestore.
- **Parameters:**
  - `userEmail` - The email address of the user to set as the current user.

### `ngOnDestroy(): void`
- **Description:** Cleans up all subscriptions to Firestore and authentication listeners when the service is destroyed.

