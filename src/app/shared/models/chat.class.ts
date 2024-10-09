export class Chat {
  readonly id: string;
  readonly memberIDs: string[] = [];
  public messagesCount: number = 0;
  public unreadMessagesCount:  number = 0;


  get chatMessagesPath(): string {
    return `chats/${this.id}/messages/`;
  }

  constructor(data: any, id: string) {
    this.id = id;
    this.memberIDs = data.memberIDs ? data.memberIDs : [];
    this.messagesCount = data.messagesCount ? data.messagesCount : 0;

  }


  update(data: any) {
    if (data.messagesCount) this.messagesCount = data.messagesCount;
  }

}