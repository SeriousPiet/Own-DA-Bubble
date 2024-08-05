export class Chat {
  readonly id: string;
  readonly members: string[];
  
  constructor(obj?: any) {
    this.id = obj && obj.id || null;
    this.members = obj && obj.members || [];
  }
}