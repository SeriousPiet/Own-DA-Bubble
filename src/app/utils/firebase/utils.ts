import { Channel } from "../../shared/models/channel.class";
import { Chat } from "../../shared/models/chat.class";
import { Message } from "../../shared/models/message.class";
import { CollectionType } from "../../shared/models/user.class";


export const welcomemessagecontent = `<h2>Willkommen bei DABubble!</h2><p><br></p><p><strong>DABubble</strong> ist eine moderne Chat-App für effiziente Kommunikation in Channels und per Direktnachricht. Arbeite im Team oder chatte privat mit Kollegen – flexibel und intuitiv.</p><p><br></p><h3>Was bietet DABubble?</h3><ol><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><strong>Channels erstellen</strong>: Bleibe bei Projekten und Themen auf dem Laufenden.</li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><strong>Direktnachrichten</strong>: Führe private Gespräche.</li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><strong>Emoji-Reaktionen</strong>: Verleihe Nachrichten eine persönliche Note.</li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><strong>Suchfunktion</strong>: Finde schnell Nachrichten oder User. Du kannst global suchen – entweder nach Nachrichten im aktuellen Channel oder in allen Channels. Auch die Suche nach Usern und Channels ist möglich.</li></ol><p><br></p><p>Im <span class="highlight-channel" id="isPDY8NAznEARHdJFTyb" contenteditable="false">#Allgemein</span> Channel kannst du generelle Fragen stellen. <span class="highlight-channel" id="0biyIbK3IYw3SaRihcrC" contenteditable="false">#Backend</span> und <span class="highlight-channel" id="LKN74nq0AFkZCqGoLGZN" contenteditable="false">#Front End</span> sind dann für spezielle dinge reserviert.</p><p><br></p><p>Bei Fragen wende Dich gerne an <span class="highlight-user" id="4iqrDSW9hM4hRVQGuMVy" contenteditable="false">@Michael Buschmann</span> , <span class="highlight-user" id="ellfDJEyv2LnT55aYyH3" contenteditable="false">@Peter Wallbaum</span> , <span class="highlight-user" id="codDqlQXNu6QBkrpdR8A" contenteditable="false">@Anthony Hamon</span> oder <span class="highlight-user" id="SVFcGhTwEk94NhptJ7iz" contenteditable="false">@Bela Schramm</span> . </p><p><br></p><p>Viel Spaß mit <strong>DABubble!</strong> Bei Fragen sind wir immer für dich da. Um neue <em>User</em> anzuschreiben, nutze die Suchfunktion.</p>  `;


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



