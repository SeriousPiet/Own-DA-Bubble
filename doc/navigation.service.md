# NavigationService Class API Documentation

## Public Properties

### `change$`

- **Type:** `Observable<string>`
- **Description:** Observable that emits whenever a change occurs within the service.

### `chatViewObject`

- **Type:** `Channel | Chat`
- **Description:** The main message list object, either a `Channel` or a `Chat`. If not set, returns the `defaultChannel`.

### `chatViewPath`

- **Type:** `string | undefined`
- **Description:** The path to the messages of the currently selected chat or channel.

### `threadViewObject`

- **Type:** `Message | undefined`
- **Description:** The current thread message object.

### `threadViewPath`

- **Type:** `string | undefined`
- **Description:** The path for message answers in the thread view.

## Public Methods

### `setChatViewObject(object: Channel | User): Promise<void>`

- **Description:** Sets the main message object to either a `Channel` or a `Chat` with a user, and updates the main message list path. Useful in the WorkSpaceMenu.Component, to select all the channels and user in the list.
- **Parameters:**
  - `object` - The object to set as the main message object.

### `setThreadViewObject(message: Message): void`

- **Description:** Sets the thread message path and updates the current message. Useful when a message in the Chatview is clicked.
- **Parameters:**
  - `message` - The message object containing the answer path.

### `ifMainMessageObjectIsChannel(): boolean`

- **Description:** Checks if the main message object is an instance of the `Channel` class.
- **Returns:** `boolean` - True if the main message object is a `Channel`, false otherwise.

### `ifMainMessageObjectIsChat(): boolean`

- **Description:** Checks if the main message object is of type `Chat`.
- **Returns:** `boolean` - True if the main message object is of type `Chat`, false otherwise.

## Functions for searching

### `getSearchContext(): string`

- **Description:** Returns the context string for searching within the current chat or channel.
- **Returns:** `string` - The search context string.

