import { Channel } from "../../shared/models/channel.class";
import { Chat } from "../../shared/models/chat.class";
import { Message } from "../../shared/models/message.class";
import { CollectionType } from "../../shared/models/user.class";


/**
 * Determines the type of a given collection.
 *
 * @param collection - The collection instance which can be of type Channel, Chat, or Message.
 * @returns The type of the collection as a string: 'channel', 'chat', or 'message'.
 */
export function getCollectionType(collection: Channel | Chat | Message): CollectionType {
    if (collection instanceof Channel) return 'channel';
    if (collection instanceof Chat) return 'chat';
    return 'message';
}


/**
 * Retrieves the path for a given collection.
 *
 * This function determines the appropriate path based on the type of the collection
 * passed as an argument. It supports `Channel`, `Chat`, and `Message` types.
 *
 * @param collection - The collection for which to retrieve the path. This can be an instance of `Channel`, `Chat`, or `Message`.
 * @returns The path associated with the given collection.
 */
export function getCollectionPath(collection: Channel | Chat | Message): string {
    if (collection instanceof Channel) return collection.channelMessagesPath;
    if (collection instanceof Chat) return collection.chatMessagesPath;
    return collection.answerPath;
}


/**
 * Checks if a chat is with oneself.
 *
 * This function determines if a chat involves only one person by checking if the chat has exactly two members
 * and both member IDs are the same.
 *
 * @param chat - The chat object containing member IDs.
 * @returns `true` if the chat is with oneself, `false` otherwise.
 */
export function ifChatWhitSelf(chat: Chat): boolean {
    if (chat.memberIDs.length === 2 && chat.memberIDs[0] === chat.memberIDs[1]) return true;
    return false;
}


/**
* Retrieves the message path based on the type of the provided collection object.
* 
* @param collectionObject - The collection object which can be an instance of Channel, Chat, or Message.
* @returns The path to the messages associated with the provided collection object.
*/
export function getMessagePath(collectionObject: Channel | Chat | Message): string {
    return collectionObject instanceof Channel
        ? collectionObject.channelMessagesPath
        : collectionObject instanceof Chat
            ? collectionObject.chatMessagesPath
            : collectionObject.answerPath;
}


/**
 * Returns the path for a given collection object.
 * 
 * Depending on the type of the collection object, this method constructs a path string:
 * - If the object is an instance of `Channel`, the path will be 'channels/' followed by the object's ID.
 * - If the object is an instance of `Chat`, the path will be 'chats/' followed by the object's ID.
 * - If the object is an instance of `Message`, the path will be the object's `messagePath`.
 * 
 * @param collectionObject - The collection object for which to generate the path. It can be an instance of `Channel`, `Chat`, or `Message`.
 * @returns The path string for the given collection object.
 */
export function getObjectsPath(collectionObject: Channel | Chat | Message): string {
    return collectionObject instanceof Channel
        ? 'channels/' + collectionObject.id
        : collectionObject instanceof Chat
            ? 'chats/' + collectionObject.id
            : collectionObject.messagePath;
}


/**
 * Removes all HTML tags from a given string.
 *
 * @param text - The string from which HTML tags should be removed.
 * @returns A new string with all HTML tags removed.
 */
export function removeAllHTMLTagsFromString(text: string): string {
    return text.replace(/<[^>]*>/g, '');
}



