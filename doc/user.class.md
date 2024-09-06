# User Class API Documentation

## Type

### `authProvider = 'google' | 'email' | 'guest'`

## Public Properties

### `public changeUser$ = this.changeUser.asObservable()`

- **Type:** `Observable<User | null>`
- **Description:** Observable to subscript to handle when the user is changed.

### `id`

- **Type:** `string`
- **Description:** The unique identifier for the user. This property is read-only.

### `name`

- **Type:** `string`
- **Description:** The name of the user. This property is read-only.

### `guest`

- **Type:** `boolean`
- **Description:** Indicates whether the user is logged in as a guest.

### `provider`

- **Type:** `authProvider`
- **Description:** the Auth Type of the User.

### `email`

- **Type:** `string`
- **Description:** The email address of the user. This property is read-only.

### `avatar`

- **Type:** `number`
- **Description:** The avatar index for the user. This property is read-only.

### `online`

- **Type:** `boolean`
- **Description:** Indicates whether the user is currently online. This property is read-only.

### `createdAt`

- **Type:** `Date`
- **Description:** The date and time when the user was created. This property is read-only.

### `pictureURL`

- **Type:** `string | undefined`
- **Description:** The URL of the user's profile picture, if available. This property is read-only.

### `chatIDs`

- **Type:** `string[]`
- **Description:** An array of chat IDs associated with the user. This property is read-only.

### `ifCurrentUser`

- **Type:** `boolean`
- **Description:** Indicates whether this user instance represents the currently authenticated user. This property is read-only.

### `emailVerified`

- **Type:** `boolean`
- **Description:** Indicates whether the user has the email verified.

