# ChannelService Class API Documentation

## Public Properties

### `defaultChannel`

- **Type:** `Channel`
- **Description:** The defaultchannel, or the 'welcome' channel

### `channels`

- **Type:** `Channel[]`
- **Description:** A list of `Channel` objects representing the channels currently retrieved from the database.

## Public Methods

### `getChatByID(chatID: string): Chat | undefined`

- **Description:** Get the Chat by ID or undefined when no channel with the ID is found.
- **Parameters:**
  - `chatID` - The ID of the channel.

### `getChatPartner(chat: Chat): User | undefined`

- **Description:** Returns the User withhin the Current User has a Chat
- **Parameters:**
  - `chat` - The chat.

### `async getChatWithUserByID(userID: string, createChat: boolean = true): Promise<Chat | undefined>`

- **Description:** Returns the Chat, within the Current User has a conversation, with the option to create a new, even it is no Chat exists
- **Parameters:**
  - `userID` - The ID of the other User.
  - `createChat` - If true and the Chat is not exist, create it.

### `addNewChannelToFirestore(name: string, description: string, membersIDs: string[]): void`

- **Description:** Adds a new channel to the Firestore database.
- **Parameters:**
  - `name` - The name of the new channel.
  - `description` - The description of the new channel.
  - `membersIDs` - An array of user IDs who are members of the channel.

### `updateChannelOnFirestore(channel: Channel, updateData: { name?: string, description?: string, memberIDs?: string[] }): void`

- **Description:** Updates an existing channel in the Firestore database with new data.
- **Parameters:**
  - `channel` - The `Channel` object representing the channel to be updated.
  - `updateData` - An object containing the data to update. This can include the name, description, and/or member IDs of the channel.
