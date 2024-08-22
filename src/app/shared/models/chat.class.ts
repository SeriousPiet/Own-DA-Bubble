export class Chat {
  readonly id: string;
  readonly memberIDs: string[] = [];

  get chatMessagesPath(): string {
    return `chats/${this.id}/messages/`;
  }

  constructor(memberIDs: string[], id: string) {
    this.id = id;
    this.memberIDs = memberIDs;
  }
}