# Channel Class API Documentation

## Public Properties

### `id`

- **Type:** `string`
- **Description:** The unique identifier for the channel.

### `name`

- **Type:** `string`
- **Description:** The name of the channel.

### `messagesCount`

- **Type:** `number`
- **Description:** The Count of the messages in the Channel.

### `description`

- **Type:** `string`
- **Description:** The description of the channel.

### `memberIDs`

- **Type:** `string[]`
- **Description:** An array of user IDs representing the members of the channel.

### `createdAt`

- **Type:** `Date`
- **Description:** The date and time when the channel was created.

### `creatorID`

- **Type:** `string`
- **Description:** The user ID of the creator of the channel.

### `defaultChannel`

- **Type:** `boolean`
- **Description:** Indicates whether this channel is the default channel.

### `channelMessagesPath`

- **Type:** `string`
- **Description:** The path in Firestore where the messages for this channel are stored.
