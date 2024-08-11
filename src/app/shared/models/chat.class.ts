export class Chat {
  readonly id: string;
  readonly memberIDs: string[];

  get chatMessagesPath(): string {
    return `chats/${this.id}/messages`;
  }
  
  constructor(obj?: any) {
    this.id = obj && obj.id || null;
    this.memberIDs = obj && obj.members || [];
  }
}