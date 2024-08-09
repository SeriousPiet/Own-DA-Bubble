# Message Service

The `MessageService` is responsible for managing messages and their interactions in the application.

## Dependencies

- `@angular/core`: Angular core module
- `@angular/fire/firestore`: Angular Firestore module
- `UsersService`: User service module
- `Message`: Message model class
- `Channel`: Channel model class

## Class: MessageService

### Methods

#### `addNewMessageToChannel(channel: Channel, message: string): void`

Adds a new message to the specified channel.

- `channel`: The channel to add the message to.
- `message`: The content of the message.

Throws an error if the channel path is undefined.

#### `addNewAnswerToMessage(message: Message, answerContent: string): void`

Adds a new answer to the specified message.

- `message`: The message to add the answer to.
- `answerContent`: The content of the answer.

Throws an error if the answer collection path is undefined.

### Private Methods

#### `createNewMessageObject(messageText: string, answerable: boolean): object`

Creates a new message object.

- `messageText`: The content of the message.
- `answerable`: Indicates if the message is answerable.

Returns the created message object.
