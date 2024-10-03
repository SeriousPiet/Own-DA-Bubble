import { BehaviorSubject } from 'rxjs';

/**
 * Represents the authentication provider type.
 * 
 * Possible values:
 * - 'google': Authentication via Google.
 * - 'email': Authentication via email.
 * - 'guest': Guest authentication.
 */
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
    this.createdAt = userObj.createdAt ? (userObj.createdAt as any).toDate() : new Date();
    this.setSavePictureURL(userObj.pictureURL);
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


  /**
   * Sets the user's picture URL if the provided URL is valid and loads successfully.
   * If the URL is invalid or the image fails to load, it sets the user's picture to a default image.
   *
   * @param pictureURL - The URL of the picture to be set. If undefined or an empty string, the default picture is set.
   */
  private setSavePictureURL(pictureURL: string | undefined): void {
    if (pictureURL && pictureURL !== '') {
      const img = new Image();
      img.src = pictureURL;
      img.onload = () => {
        this._pictureURL = pictureURL;
      };
      img.onerror = () => {
        this.setUserPictureToDefault();
      };
    }
  }


  /**
   * Resets the user's picture to the default settings.
   * 
   * This method sets the `_pictureURL` to `undefined` and the `_avatar` to `0`.
   * It is typically used to revert any custom user picture settings back to the default state.
   * 
   * @private
   */
  private setUserPictureToDefault(): void {
    this._pictureURL = undefined;
    this._avatar = 0;
  }


  /**
   * Updates the user properties with the provided data.
   * 
   * @param data - An object containing the user properties to update.
   * @param data.name - The new name of the user.
   * @param data.email - The new email of the user.
   * @param data.avatar - The new avatar of the user.
   * @param data.online - The online status of the user.
   * @param data.chatIDs - The new chat IDs associated with the user.
   * @param data.pictureURL - The new picture URL of the user.
   * @param data.emailVerified - The email verification status of the user.
   */
  update(data: any): void {
    if (data.name) this._name = data.name;
    if (data.email) this._email = data.email;
    if (data.avatar) this._avatar = data.avatar;
    if (data.online !== undefined) this._online = data.online;
    if (data.chatIDs) this._chatIDs = data.chatIDs;
    if (data.pictureURL !== undefined) this.setSavePictureURL(data.pictureURL);
    if (data.emailVerified !== undefined)
      this._emailVerified = data.emailVerified;
    this.changeUser.next(this);
  }
}
