import { Channel } from "../../shared/models/channel.class";
import { Chat } from "../../shared/models/chat.class";
import { Message } from "../../shared/models/message.class";
import { CollectionType } from "../../shared/models/user.class";


export function getCollectionType(collection: Channel | Chat | Message): CollectionType {
    if (collection instanceof Channel) return 'channel';
    if (collection instanceof Chat) return 'chat';
    return 'message';
}


export function getCollectionPath(collection: Channel | Chat | Message): string {
    if (collection instanceof Channel) return collection.channelMessagesPath;
    if (collection instanceof Chat) return collection.chatMessagesPath;
    return collection.answerPath;
}


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



