import { Timestamp } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

/**
 * Interface representing a collection of reactions.
 * 
 * @interface IReactions
 * @property {string} type - The type of reaction (e.g., like, love, etc.).
 * @property {string[]} userIDs - An array of user IDs who have given this reaction.
 */
export interface IReactions {
  type: string;
  userIDs: string[];
}


/**
 * Represents an attachment that is stored.
 * 
 * @typedef {Object} StoredAttachment
 * @property {string} name - The name of the attachment.
 * @property {'image' | 'pdf'} type - The type of the attachment, which can be either 'image' or 'pdf'.
 * @property {string} url - The URL where the attachment can be accessed.
 * @property {string} path - The file path of the attachment.
 */
export type StoredAttachment = {
  name: string;
  type: 'image' | 'pdf';
  url: string;
  path: string;
};


export class Message {
  private changeMessage = new BehaviorSubject<void>(undefined);
  public changeMessage$ = this.changeMessage.asObservable();

  readonly id: string;
  readonly collectionPath: string;
  readonly creatorID: string;
  readonly createdAt: Date;
  readonly answerable: boolean;

  public unreadMessagesCount: number = 0;

  public propertysUnSet = true;
  public unread: boolean = false;
  public sameUserAsPrevious: boolean = false;
  public newMessageSeparator: boolean = false;
  public newDaySeparator: boolean = false;

  private _content: string;
  get content(): string {
    return this._content;
  }

  private _emojies: IReactions[] = [];
  get emojies(): IReactions[] {
    return this._emojies;
  }

  private _answerCount: number;
  get answerCount(): number {
    return this._answerCount;
  }

  private _lastAnswerAt: Date;
  get lastAnswerAt(): Date {
    return this._lastAnswerAt;
  }

  private _editedAt: Date | undefined;
  get editedAt(): Date | undefined {
    return this._editedAt;
  }

  private _edited: boolean;
  get edited(): boolean {
    return this._edited;
  }

  get messagePath(): string {
    return this.collectionPath + this.id;
  }

  get answerPath(): string {
    return this.messagePath + '/answers/';
  }

  private _attachments: StoredAttachment[];
  get attachments(): StoredAttachment[] {
    return this._attachments;
  }

  get searchContext(): string | undefined {
    return this.searchContext;
  }

  set searchContext(value: string | undefined) {
    this.searchContext = value;
  }

  constructor(data: any, collectionPath: string, id: string) {
    this.id = id;
    this.collectionPath = collectionPath;
    this.creatorID = data.creatorID ? data.creatorID : '';
    this.createdAt = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date();
    if (data.emojies) this.calculateReaction(data.emojies);
    this._content = data.content ? data.content : '';
    this.answerable = data.answerable;
    this._answerCount = data.answerCount ? data.answerCount : 0;
    this._lastAnswerAt = data.lastAnswerAt ? (data.lastAnswerAt as Timestamp).toDate() : new Date();
    this._edited = data.edited ? data.edited : false;
    this._editedAt = data.editedAt ? (data.editedAt as Timestamp).toDate() : undefined;
    this._attachments = this.parseAttachments(data.attachments);
  }


  /**
   * Calculates and updates the emojis based on the provided reactions array.
   * 
   * @param reactionsArray - An array of strings representing reactions in JSON format.
   */
  calculateReaction(reactionsArray: string[]) {
    this._emojies = [];
    if (reactionsArray) {
      reactionsArray.forEach((reaction: string) => {
        this.emojies.push(JSON.parse(reaction));
      });
    }
  }


  /**
   * Parses the provided data to extract stored attachments.
   *
   * @param data - The data to be parsed, expected to be a JSON string.
   * @returns An array of `StoredAttachment` objects if the data is valid, otherwise an empty array.
   */
  parseAttachments(data: any): StoredAttachment[] {
    if (data !== undefined && data !== '') return JSON.parse(data);
    return [];
  }


  /**
   * Updates the message properties with the provided data.
   * 
   * @param data - An object containing the new values for the message properties.
   *   - `content` (optional): The new content of the message.
   *   - `emojies` (optional): The new set of emojis to calculate reactions.
   *   - `answerCount` (optional): The new count of answers.
   *   - `lastAnswerAt` (optional): The timestamp of the last answer.
   *   - `edited` (optional): A boolean indicating if the message was edited.
   *   - `editedAt` (optional): The timestamp of when the message was edited.
   *   - `attachments` (optional): The new attachments to be parsed.
   */
  update(data: any): void {
    if (data.content) this._content = data.content;
    if (data.emojies) this.calculateReaction(data.emojies);
    if (data.answerCount) this._answerCount = data.answerCount;
    if (data.lastAnswerAt) this._lastAnswerAt = (data.lastAnswerAt as Timestamp).toDate();
    if (data.edited !== undefined) this._edited = data.edited;
    if (data.editedAt) this._editedAt = (data.editedAt as Timestamp).toDate();
    if (data.attachments) this._attachments = this.parseAttachments(data.attachments);
    this.changeMessage.next();
  }
}
