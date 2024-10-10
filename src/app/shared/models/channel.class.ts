import { Timestamp } from '@angular/fire/firestore';

export class Channel {
  readonly id: string;

  private _name: string;
  get name(): string {
    return this._name;
  }

  private _messagesCount: number;
  get messagesCount(): number {
    return this._messagesCount;
  }

  private _description: string;
  get description(): string {
    return this._description;
  }

  private _memberIDs: string[]; // User ids
  get memberIDs(): string[] {
    return this._memberIDs;
  }

  readonly createdAt: Date;
  readonly creatorID: string; // User id
  readonly defaultChannel: boolean;

  public unreadMessagesCount = 0;

  get channelMessagesPath(): string {
    if (this.id == '') return '';
    return `channels/${this.id}/messages/`;
  }


  constructor(data: any, channelID: string = '') {
    this.id = channelID;
    this._name = data.name ? data.name : 'New Channel';
    this._description = data.description ? data.description : '';
    this.createdAt = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date();
    this.creatorID = data.creatorID ? data.creatorID : '';
    this._memberIDs = data.memberIDs ? data.memberIDs : [];
    this.defaultChannel = data.defaultChannel ? data.defaultChannel : false;
    this._messagesCount = data.messagesCount ? data.messagesCount : 0;
  }


  /**
   * Updates the channel properties with the provided data.
   * 
   * @param data - An object containing the properties to update. 
   *               The object can have the following optional properties:
   *               - `name`: The new name of the channel.
   *               - `description`: The new description of the channel.
   *               - `memberIDs`: An array of new member IDs.
   *               - `messagesCount`: The new count of messages in the channel.
   */
  update(data: any) {
    if (data.name) this._name = data.name;
    if (data.description) this._description = data.description;
    if (data.memberIDs) this._memberIDs = data.memberIDs;
    if (data.messagesCount) this._messagesCount = data.messagesCount;
  }
}
