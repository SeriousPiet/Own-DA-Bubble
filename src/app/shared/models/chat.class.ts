import { Timestamp } from "@angular/fire/firestore";

export class Chat {
  readonly id: string;
  readonly memberIDs: string[] = [];
  readonly createdAt: Date;
  public messagesCount: number = 0;
  public unreadMessagesCount:  number = 0;


  get chatMessagesPath(): string {
    return `chats/${this.id}/messages/`;
  }


  constructor(data: any, id: string) {
    this.id = id;
    this.memberIDs = data.memberIDs ? data.memberIDs : [];
    this.messagesCount = data.messagesCount ? data.messagesCount : 0;
    this.createdAt = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date();
  }


  /**
   * Updates the chat instance with the provided data.
   * 
   * @param data - An object containing the new data for the chat instance.
   * @param data.messagesCount - The new messages count to update the chat instance with.
   */
  update(data: any) {
    if (data.messagesCount) this.messagesCount = data.messagesCount;
  }

}