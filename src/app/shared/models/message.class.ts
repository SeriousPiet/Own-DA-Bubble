import { Timestamp } from "@angular/fire/firestore";

export class Message {
  readonly id: string;
  readonly creatorID: string;
  readonly createdAt: Date;
  readonly content: string;
  readonly emojies: string[];
  readonly answerable: boolean;
  readonly answerCount: number;
  readonly lastAnswerAt: Date;

  constructor(data: any) {
    this.id = data.id ? data.id : '';
    this.creatorID = data.creatorID ? data.creatorID : '';
    this.createdAt = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date();
    this.content = data.content ? data.content : '';
    this.emojies = data.emojies ? data.emojies : [];
    this.answerable = data.answerable;
    this.answerCount = data.answerCount ? data.answerCount : 0;
    this.lastAnswerAt = data.lastAnswerAt ? (data.lastAnswerAt as Timestamp).toDate() : new Date();
  }

}