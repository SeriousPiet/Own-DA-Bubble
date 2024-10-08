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

  ifSelfChat(): boolean {
    if (this.memberIDs.length === 2 && this.memberIDs[0] === this.memberIDs[1]) return true;
    return false;
  }

  update(data: any) {
    if (data.messagesCount) this.messagesCount = data.messagesCount;
  }

}