# UsersService API Documentation

# Public Properties

### `changeUserList$`

- **Type:** `Observable<string>`
- **Description:** Observable that emits when the user list changes.

### `users`

- **Type:** `User[]`
- **Description:** Array of all users in the system.

### `currentUser`

- **Type:** `User | undefined`
- **Description:** The currently authenticated user, if any.

# Public Methods

## Functions for Information

### `getAllUserIDs(): string[]`

- **Description:** Retrieves all user IDs from the current user list.
- **Returns:** An array of user IDs.

### `getUserByID(id: string): User | undefined`

- **Description:** Retrieves a user by their ID.
- **Parameters:**
  - `id: string` - The ID of the user to retrieve.
- **Returns:** The user object if found, otherwise `undefined`.

### `getChatByID(chatID: string): Chat | undefined`

- **Description:** Retrieves a chat by its ID.
- **Parameters:**
  - `chatID: string` - The ID of the chat to retrieve.
- **Returns:** The chat object if found, otherwise `undefined`.

### `getChatPartner(chat: Chat): User | undefined`

- **Description:** Retrieves the chat partner for the given chat.
- **Parameters:**
  - `chat: Chat` - The chat object.
- **Returns:** The chat partner if found, otherwise `undefined`.

### `ifSelfChat(chat: Chat): boolean`

- **Description:** Checks if the given chat is a self-chat (a chat with oneself).
- **Parameters:**
  - `chat: Chat` - The chat object.
- **Returns:** `true` if the chat is a self-chat, otherwise `false`.

## Functions for updating User on Firestore

### `updateCurrentUserDataOnFirestore(userChangeData: { name?: string; online?: boolean; chatIDs?: string[]; avatar?: number; pictureURL?: string; }): void`

- **Description:** Updates the current user's data on Firestore.
- **Parameters:**
  - `userChangeData: { name?: string; online?: boolean; chatIDs?: string[]; avatar?: number; pictureURL?: string; }` - An object containing the user data to update.

### `updateCurrentUserEmail(newEmail: string, currentPassword: string): Promise<string | undefined>`

- **Description:** Updates the current user's email address in Firebase Authentication and Firestore.
- **Parameters:**
  - `newEmail: string` - The new email address.
  - `currentPassword: string` - The current password for reauthentication.
- **Returns:** A promise that resolves to `undefined` if successful, or an error message if failed.

## Functions for login and signup

### `logoutUser(): void`

- **Description:** Logs out the current user from Firebase Authentication.

### `loginUser(email: string, password: string): string | undefined`

- **Description:** Logs in a user using their email and password.
- **Parameters:**
  - `email: string` - The user's email address.
  - `password: string` - The user's password.
- **Returns:** `undefined` if successful, or an error message if failed.

### `registerNewUser(user: { email: string; password: string; name: string; }): string | undefined`

- **Description:** Registers a new user with the given email, password, and name.
- **Parameters:**
  - `user: { email: string; password: string; name: string; }` - The new user's information.
- **Returns:** `undefined` if successful, or an error message if failed.

## Utility Functions

### `ngOnDestroy(): void`

- **Description:** Cleans up the service by unsubscribing from all active subscriptions when the service is destroyed.
