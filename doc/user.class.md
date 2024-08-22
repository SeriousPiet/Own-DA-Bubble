# User Class API Documentation

## Public Properties

### `id`

- **Type:** `string`
- **Description:** The unique identifier for the user. This property is read-only.

### `name`

- **Type:** `string`
- **Description:** The name of the user. This property is read-only.

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
