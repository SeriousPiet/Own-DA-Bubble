import { Timestamp } from "@angular/fire/firestore";

export class Message {
  readonly id: string;
  readonly collectionPath: string;
  readonly creatorID: string;
  readonly createdAt: Date;
  readonly content: string;
  readonly emojies: string[];
  readonly answerable: boolean;
  readonly answerCount: number;
  readonly lastAnswerAt: Date;
  get messagePath(): string {
    return this.collectionPath + this.id;
  }

  constructor(data: any, collectionPath: string) {
    this.id = data.id ? data.id : '';
    this.collectionPath = collectionPath;
    this.creatorID = data.creatorID ? data.creatorID : '';
    this.createdAt = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date();
    this.content = data.content ? data.content : '';
    this.emojies = data.emojies ? data.emojies : [];
    this.answerable = data.answerable;
    this.answerCount = data.answerCount ? data.answerCount : 0;
    this.lastAnswerAt = data.lastAnswerAt ? (data.lastAnswerAt as Timestamp).toDate() : new Date();
  }

}