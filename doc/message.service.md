# MessageService Class API Documentation

## Public Methods

### `addNewMessageToPath(messagePath: string, messageContent: string): Promise<void>`

- **Description:** Adds a new message to the specified Firestore path.
- **Parameters:**
  - `messagePath` - The Firestore path where the new message will be added.
  - `messageContent` - The content of the message.
- **Returns:** A promise that resolves when the message has been successfully added.

### `updateMessage(message: Message, updateData: { content?: string, emojies?: string[] }): Promise<void>`

- **Description:** Updates an existing message with new content or emojis.
- **Parameters:**
  - `message` - The message object to be updated.
  - `updateData` - An object containing the new content and/or emojis to be applied to the message.
- **Returns:** A promise that resolves when the message has been successfully updated.

### `ifMessageFromCurrentUser(message: Message): boolean`

- **Description:** Checks if the message was created by the current user.
- **Parameters:**
  - `message` - The message object to check.
- **Returns:** `true` if the message was created by the current user, otherwise `false`.

### `addNewAnswerToMessage(message: Message, answerContent: string): Promise<void>`

- **Description:** Adds a new answer to an existing message.
- **Parameters:**
  - `message` - The original message to which the answer will be added.
  - `answerContent` - The content of the answer.
- **Returns:** A promise that resolves when the answer has been successfully added.
