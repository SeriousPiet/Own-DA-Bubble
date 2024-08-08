import { Timestamp } from "@angular/fire/firestore";

export class Channel {

  id: string;
  name: string; // unique!!!
  description: string;
  createdAt: Date;
  creatorID: string; // User id
  members: string[]; // User ids
  get channelMessagesPath(): string {
    return `channels/${this.id}/messages/`;
  }

  constructor(data: any, channelID: string) {
    this.id = channelID;
    this.name = data.name ? data.name : 'New Channel';
    this.description = data.description ? data.description : '';
    this.createdAt = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date();
    this.creatorID = data.creatorID ? data.creatorID : '';
    this.members = data.members ? data.members : [];
  }
}