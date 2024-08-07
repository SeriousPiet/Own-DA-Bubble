# UsersService

The UsersService is a service that interacts with the user collection in the Firestore database.
It provides methods to register new users, login users, logout users.

It also provides methods to watch for changes in the user collection and update the users array accordingly.

## Propertys

### `users: User[]`
List of all users as User Object

### `currentUser: User | undefined`
The current user logged in or undefined when no user is logged in


## Methods

### `registerNewUser(user: { email: string, password: string, name: string }): Promise<User | undefined>`
Registers a new user in the Firestore database.

### `loginUser(email: string, password: string): Promise<string | undefined>`
Logs in a user using their email and password. Returns an error message if there was an error logging in.

### `logoutUser(): void`
Logs out the current user.
