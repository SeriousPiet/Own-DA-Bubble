# Message Class API Documentation

## Public Properties

### `id: string`

- **Description:** The unique identifier of the message.
- **Access:** Read-only

### `creatorID: string`

- **Description:** The ID of the user who created the message.
- **Access:** Read-only

### `createdAt: Date`

- **Description:** The date and time when the message was created.
- **Access:** Read-only

### `answerable: boolean`

- **Description:** Indicates whether the message can receive answers.
- **Access:** Read-only

### `content: string`

- **Description:** The content of the message.
- **Access:** Read-only

### `emojies: string[]`

- **Description:** The list of emojis associated with the message.
- **Access:** Read-only

### `answerCount: number`

- **Description:** The number of answers the message has received.
- **Access:** Read-only

### `lastAnswerAt: Date`

- **Description:** The date and time of the last answer received.
- **Access:** Read-only

### `collectionPath: string`

- **Description:** The Firestore collection path where the message is stored.
- **Access:** Read-only

### `messagePath: string`

- **Description:** The full Firestore path to this message, including its ID.
- **Access:** Read-only

### `answerPath: string`

- **Description:** The Firestore path to the answers collection for this message.
- **Access:** Read-only
