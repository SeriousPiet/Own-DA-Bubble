import Quill from 'quill';
import { Range as QuillRange } from 'quill/core/selection';
import { User } from '../../shared/models/user.class';
import { Channel } from '../../shared/models/channel.class';
import { LockedSpanBlot } from '../../shared/models/lockedspan.class';


/**
 * Represents the length details of edited text.
 * 
 * @typedef {Object} EditedTextLength
 * @property {boolean} messageEmpty - Indicates if the message is empty.
 * @property {number} maxLength - The maximum allowed length of the text.
 * @property {number} textLength - The current length of the text.
 */
export type EditedTextLength = {
    messageEmpty: boolean;
    maxLength: number;
    textLength: number;
};


/**
 * Checks if the provided message is considered empty.
 *
 * A message is considered empty if it is either:
 * - An HTML paragraph tag with a line break (`<p><br></p>`)
 * - An empty HTML paragraph tag (`<p></p>`)
 *
 * @param message - The message string to check.
 * @returns `true` if the message is empty, `false` otherwise.
 */
export function isEmptyMessage(message: string) {
    return message === '<p><br></p>' || message === '<p></p>';
}


/**
 * Registers the LockedSpanBlot with Quill if it is not already registered.
 * This method checks if the 'lockedSpan' format is already imported in Quill.
 * If it is not, it registers the LockedSpanBlot format.
 */
export function registerLockedSpanBlot() {
    const existingBlot = Quill.imports['formats/lockedSpan'];
    if (!existingBlot) Quill.register(LockedSpanBlot);
}


/**
   * Retrieves the text immediately following the last occurrence of a specified character
   * before the current cursor position within the Quill editor.
   *
   * @param char - The character to search for before the cursor position.
   * @returns The text immediately following the last occurrence of the specified character
   *          before the cursor, or `null` if the character is not found or the text does not
   *          match the specified regex pattern.
   */
export function getTextBeforePreviousSign(quill: Quill, range: QuillRange | null, char: string): string | null {
    if (!range) return null;
    const cursorPosition = range.index;
    const textBeforeCursor = quill.getText(0, cursorPosition + 1);
    const lastCharIndex = textBeforeCursor.lastIndexOf(char);
    if (lastCharIndex === -1) return null;
    const result = textBeforeCursor.slice(lastCharIndex + 1, cursorPosition);
    const regex = /^[a-zA-Z]*$/;
    if (!regex.test(result)) return null;
    return result;
}


/**
 * Removes the word and symbol preceding the current selection in the editor.
 * 
 * @param searchSign - The symbol to search for in the text.
 * @returns The index of the start of the removed word, or -1 if no word was removed.
 */
export function removeWordAndSymbolFromEditor(quill: Quill, range: QuillRange | null, searchSign: string): number {
    if (!range) return -1;
    const text = quill.getText();
    let startIndex = range.index;
    let searchRange = text.substring(0, startIndex);
    const atIndex = searchRange.lastIndexOf(searchSign);
    if (atIndex === -1) return -1;
    searchRange = searchRange.substring(atIndex + 1);
    if (searchRange.includes(' ')) return -1;
    const wordMatch = searchRange.match(/^\S+/);
    let wordStartIndex = atIndex;
    let wordEndIndex = wordStartIndex + 1;
    if (wordMatch) wordEndIndex += wordMatch[0].length;
    quill.deleteText(wordStartIndex, wordEndIndex - wordStartIndex);
    quill.setSelection(wordStartIndex, Quill.sources.SILENT);
    return wordStartIndex;
}


/**
 * Inserts a span element representing a User or Channel into the Quill editor at the current cursor position.
 * The span element is styled and tagged based on whether the item is a User or a Channel.
 *
 * @param item - The item to insert, which can be either a User or a Channel.
 *               If the item is a User, it will be prefixed with '@' and styled with the 'highlight-user' class.
 *               If the item is a Channel, it will be prefixed with '#' and styled with the 'highlight-channel' class.
 */
export function insertItemAsSpan(quill: Quill, range: QuillRange | null, item: User | Channel) {
    const tagSign = item instanceof User ? '@' : '#';
    const tagClass = item instanceof User ? 'highlight-user' : 'highlight-channel';
    const boundingKey = ' ';
    let cursorPosition = removeWordAndSymbolFromEditor(quill, range, tagSign);
    if (cursorPosition === -1) {
        if (range === null) cursorPosition = quill.getLength();
        else cursorPosition = range!.index;
    }
    const spanText = tagSign + item.name;
    const spanTextLength = spanText.length;
    quill.insertText(cursorPosition, boundingKey + spanText + boundingKey);
    quill.formatText(cursorPosition + boundingKey.length, spanTextLength, 'lockedSpan', { class: tagClass, id: item.id, });
    quill.setSelection(boundingKey.length * 2 + cursorPosition + spanTextLength, Quill.sources.SILENT);
    quill.focus();
}



