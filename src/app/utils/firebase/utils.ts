import { Channel } from "../../shared/models/channel.class";
import { Chat } from "../../shared/models/chat.class";
import { Message } from "../../shared/models/message.class";
import { CollectionType, User } from "../../shared/models/user.class";

export const frontendMessages = [
    {
      "creatorID": "SVFcGhTwEk94NhptJ7iz",
      "createdAt": "1696300800",
      "message": "<p><h2>Login und Registrierung sind jetzt vollständig mit Firebase verbunden 🎉</h2></p><p>Das Formular prüft nun auf schwache Passwörter, und Nutzer erhalten sofortige Rückmeldung bei falschen Eingaben.</p>",
      "answers": [
        {
          "creatorID": "4iqrDSW9hM4hRVQGuMVy",
          "createdAt": "1696387200",
          "message": "<p>Das ist klasse! Jetzt können wir uns darauf konzentrieren, die Profilbearbeitung zu optimieren.</p>"
        },
        {
          "creatorID": "ellfDJEyv2LnT55aYyH3",
          "createdAt": "1696473600",
          "message": "<p>Sehr gut! Gibt es schon Fortschritte bei der Avatar-Auswahl für neue Benutzer?</p>"
        },
        {
          "creatorID": "SVFcGhTwEk94NhptJ7iz",
          "createdAt": "1696560000",
          "message": "<p>Ja, das kommt als nächstes dran! Nutzer können bald ihren Avatar hochladen oder aus einer vorgegebenen Auswahl wählen.</p>"
        }
      ]
    },
    {
      "creatorID": "ellfDJEyv2LnT55aYyH3",
      "createdAt": "1696610400",
      "message": "<p><h2>WorkSpaceMenu ist jetzt vollständig responsiv!</h2></p><p>Die Seitenleiste minimiert sich automatisch auf kleineren Bildschirmen und ist auf mobilen Geräten als Overlay verfügbar.</p>",
      "answers": [
        {
          "creatorID": "4iqrDSW9hM4hRVQGuMVy",
          "createdAt": "1696696800",
          "message": "<p>Perfekt! Dadurch wird die mobile Nutzererfahrung deutlich verbessert.</p>"
        },
        {
          "creatorID": "codDqlQXNu6QBkrpdR8A",
          "createdAt": "1696783200",
          "message": "<p>Sieht super aus! Haben wir auch an die Tastaturnavigation gedacht?</p>"
        },
        {
          "creatorID": "ellfDJEyv2LnT55aYyH3",
          "createdAt": "1696869600",
          "message": "<p>Guter Punkt! Ich werde sicherstellen, dass die Navigation auch mit der Tab-Taste funktioniert.</p>"
        }
      ]
    },
    {
      "creatorID": "codDqlQXNu6QBkrpdR8A",
      "createdAt": "1696920000",
      "message": "<p><h2>Chat-Ansicht enthält jetzt die Thread-Funktion! 🧵</h2></p><p>Nutzer können jetzt auf eine bestimmte Nachricht klicken und einen Thread starten. Dies sorgt für mehr Übersichtlichkeit in den Channels.</p>",
      "answers": [
        {
          "creatorID": "SVFcGhTwEk94NhptJ7iz",
          "createdAt": "1697006400",
          "message": "<p>Das wird den Nutzern wirklich helfen, Themen besser zu strukturieren. Gut gemacht!</p>"
        },
        {
          "creatorID": "ellfDJEyv2LnT55aYyH3",
          "createdAt": "1697092800",
          "message": "<p>Thread-Ansicht sieht sehr aufgeräumt aus. Funktioniert das auch in Direktnachrichten?</p>"
        },
        {
          "creatorID": "codDqlQXNu6QBkrpdR8A",
          "createdAt": "1697179200",
          "message": "<p>Ja, die Threads funktionieren in allen Chats – auch in den DMs!</p>"
        }
      ]
    },
    {
      "creatorID": "4iqrDSW9hM4hRVQGuMVy",
      "createdAt": "1697265600",
      "message": "<p><h3>Das CSS-Styling für die Buttons ist jetzt einheitlich und responsiv</h3></p><p>Jeder Button hat jetzt das richtige Hover-Verhalten, und die Farben passen sich den Branding-Vorgaben an.</p>",
      "answers": [
        {
          "creatorID": "ellfDJEyv2LnT55aYyH3",
          "createdAt": "1697352000",
          "message": "<p>Super Arbeit! Das sorgt für ein konsistentes Erlebnis auf allen Seiten.</p>"
        },
        {
          "creatorID": "codDqlQXNu6QBkrpdR8A",
          "createdAt": "1697438400",
          "message": "<p>Ich habe gesehen, dass es noch ein kleines Problem mit dem Fokus-Styling in Firefox gibt. Ich kümmere mich darum!</p>"
        }
      ]
    },
    {
      "creatorID": "SVFcGhTwEk94NhptJ7iz",
      "createdAt": "1697524800",
      "message": "<p>Die Firebase-Authentifizierung wurde auf allen Seiten erfolgreich getestet. Keine Fehlermeldungen mehr! 🎉</p>"
    },
    {
      "creatorID": "ellfDJEyv2LnT55aYyH3",
      "createdAt": "1697611200",
      "message": "<p>Ich habe die Menü-Komponente optimiert. Das Menü kann jetzt durch Klick auf einen Button minimiert und maximiert werden. Besonders nützlich auf mobilen Geräten! 📱</p>",
      "answers": [
        {
          "creatorID": "codDqlQXNu6QBkrpdR8A",
          "createdAt": "1697697600",
          "message": "<p>Super! Das wird die Benutzerfreundlichkeit deutlich verbessern.</p>"
        },
        {
          "creatorID": "SVFcGhTwEk94NhptJ7iz",
          "createdAt": "1697784000",
          "message": "<p>Ja, das macht das Chat-Interface deutlich übersichtlicher. Danke für die schnelle Umsetzung!</p>"
        }
      ]
    },
    {
      "creatorID": "codDqlQXNu6QBkrpdR8A",
      "createdAt": "1697870400",
      "message": "<p><h3>Profilanzeige ist jetzt komplett! 🎉</h3></p><p>Nutzer können ihre Avatare hochladen und ihr Profil bearbeiten.</p>"
    },
    {
      "creatorID": "4iqrDSW9hM4hRVQGuMVy",
      "createdAt": "1697956800",
      "message": "<p>Die Suchfunktion wurde erfolgreich implementiert! 🔍 Benutzer können jetzt Nachrichten in ihren Chats und Kanälen durchsuchen.</p>"
    }
  ]
  
  
   

/**
 * A constant string containing the welcome message content for DABubble.
 * 
 * The message is formatted in HTML and includes:
 * - A welcome heading.
 * - A brief description of DABubble as a modern chat app for efficient communication in channels and direct messages.
 * - Information about general and specific channels for questions.
 * - Contact information for specific users for further assistance.
 * - Encouragement to enjoy using DABubble and a reminder that support is available.
 * 
 * The message is designed to be displayed to new users to help them get started with the app.
 */
const welcomemessagecontent = `<h2>Willkommen bei DABubble!</h2><p><br></p><p><strong>DABubble</strong> ist eine moderne Chat-App für effiziente Kommunikation in Channels und per Direktnachricht. Arbeite im Team oder chatte privat mit Kollegen - flexibel und intuitiv.</p><p><br></p><p>Im <span class="highlight-channel" id="isPDY8NAznEARHdJFTyb" contenteditable="false">#Allgemein</span> Channel kannst du generelle Fragen stellen. <span class="highlight-channel" id="0biyIbK3IYw3SaRihcrC" contenteditable="false">#Backend</span> und <span class="highlight-channel" id="LKN74nq0AFkZCqGoLGZN" contenteditable="false">#Front End</span> sind dann für spezielle dinge reserviert.</p><p><br></p><p>Bei Fragen wende Dich gerne an <span class="highlight-user" id="4iqrDSW9hM4hRVQGuMVy" contenteditable="false">@Michael Buschmann</span> , <span class="highlight-user" id="ellfDJEyv2LnT55aYyH3" contenteditable="false">@Peter Wallbaum</span> , <span class="highlight-user" id="codDqlQXNu6QBkrpdR8A" contenteditable="false">@Anthony Hamon</span> oder <span class="highlight-user" id="SVFcGhTwEk94NhptJ7iz" contenteditable="false">@Bela Schramm</span> . </p><p><br></p><p>Viel Spaß mit <strong>DABubble!</strong> Bei Fragen sind wir immer für dich da. Um <em>User</em> anzuschreiben, nutze die Suchfunktion.</p>`;
const userHint1 = `<h2>Wichtiger Hinweis:</h2><p><br></p><p>Bitte verifiziere Deine EMail Adresse über den Link, den wir Dir an Deine EMail-Adresse geschickt haben.</p><p>Erst danach, kannst Du <strong>DABubble</strong> im vollem Umfang nutzen:</p><ol><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>Channels anlegen</li><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>Nachrichten Schreiben</li><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>Mit Emojis auf Nachrichten reagieren</li></ol><p>Vielen Dank, für Dein Verständniss. 👍</p><p><br></p><p>Euer DABubble 303 Team. 😉</p>`;
const guestHint1 = `<h3>Als Gast darfst Du:</h3><ol><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>Nachrichten schreiben</li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>Deine Nachrichten editieren</li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>Mit Emojis auf Nachrichten reagieren</li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>Channels anlegen</li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>Dein Avatar im Profileditor auswählen</li></ol><p><br></p><p>Um eigene Profilfotos hochzuladen musst Du Dich mit Name, EMail und Passwort registrieren.</p><p><br></p><p>Danke für Dein Verständniss. 🙂</p>`;
const guestHint2 = `<h2>Ein Hinweis noch für Gäste.</h2><p><br></p><p>Bitte benutzt die <strong>Logout</strong> Möglichkeit rechts oben im <em>Profil Menu</em>. ☝️</p><p>Damit stellst Du sicher, das Dein gesamter Content den Du erzeugt hast, wieder gelöscht wird.</p><p><br></p><p>Vielen Dank. 👍</p><p><br></p><p>Euer DABubble 303 Team. 🙂</p>`;

export const dabubbleBotId = 'L1vx1LslWBb7nQUOLMqc';
/**
 * An array containing messages for new guests.
 * 
 * @constant
 * @type {Array<string>}
 */
export const newGuestMessages = [welcomemessagecontent, guestHint1, guestHint2];
export const newUserMessages = [welcomemessagecontent, userHint1];
export const newGoogleUserMessages = [welcomemessagecontent];


/**
 * Checks if the given user is a real user.
 *
 * A real user is defined as a user who is not a guest and whose ID is not equal to the predefined bot ID.
 *
 * @param user - The user object to check.
 * @returns `true` if the user is a real user, `false` otherwise.
 */
export function isRealUser(user: User): boolean {
    return !user.guest && user.id !== dabubbleBotId;
}


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



