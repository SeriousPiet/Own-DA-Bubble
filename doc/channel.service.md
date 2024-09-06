# ChannelService Class API Documentation

## Public Properties

### `channels`

- **Type:** `Channel[]`
- **Description:** A list of `Channel` objects representing the channels currently retrieved from the database.

## Public Methods

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
