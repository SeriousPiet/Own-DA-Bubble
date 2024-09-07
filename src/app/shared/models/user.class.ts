import { BehaviorSubject } from 'rxjs';

export type authProvider = 'google' | 'email' | 'guest';

export class User {
  private changeUser = new BehaviorSubject<User | null>(null);
  public changeUser$ = this.changeUser.asObservable();

  readonly id: string;
  readonly createdAt: Date;
  readonly provider: authProvider;
  readonly guest: boolean;

  private _pictureURL: string | undefined;
  get pictureURL(): string | undefined {
    return this._pictureURL;
  }

  private _name: string;
  get name(): string {
    return this._name;
  }

  private _email: string;
  get email(): string {
    return this._email;
  }

  private _avatar: number;
  get avatar(): number {
    return this._avatar;
  }

  private _online: boolean;
  get online(): boolean {
    return this._online;
  }

  private _chatIDs: string[] = [];
  get chatIDs(): string[] {
    return this._chatIDs;
  }

  private _emailVerified: boolean;
  get emailVerified(): boolean {
    return this._emailVerified;
  }

  constructor(userObj: any, userID: string) {
    this.id = userID;
    this._name = userObj.name ? userObj.name : '';
    this._email = userObj.email ? userObj.email : '';
    this._avatar = userObj.avatar ? userObj.avatar : 1;
    this._online = userObj.online ? userObj.online : false;
    this.createdAt = userObj.createdAt
      ? (userObj.createdAt as any).toDate()
      : new Date();
    this._pictureURL = userObj.pictureURL ? userObj.pictureURL : undefined;
    this._chatIDs = userObj.chatIDs ? userObj.chatIDs : [];
    this._emailVerified = userObj.emailVerified ? userObj.emailVerified : false;
    if (userObj.guest) {
      this.guest = true;
      this.provider = 'guest';
    } else {
      this.guest = false;
      this.provider = userObj.provider ? userObj.provider : 'email';
    }
  }

  update(data: any): void {
    if (data.name) this._name = data.name;
    if (data.email) this._email = data.email;
    if (data.avatar) this._avatar = data.avatar;
    if (data.online !== undefined) this._online = data.online;
    if (data.chatIDs) this._chatIDs = data.chatIDs;
    if (data.pictureURL !== undefined) this._pictureURL = data.pictureURL;
    if (data.emailVerified !== undefined) this._emailVerified = data.emailVerified;
    this.changeUser.next(this);
  }
}
