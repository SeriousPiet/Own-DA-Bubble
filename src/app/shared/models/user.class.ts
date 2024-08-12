import { serverTimestamp } from "@angular/fire/firestore";

export class User {

    readonly id: string;

    private _name: string;
    get name(): string { return this._name; }

    private _email: string;
    get email(): string { return this._email; }

    private _avatar: number;
    get avatar(): number { return this._avatar; }

    private _online: boolean;
    get online(): boolean { return this._online; }

    readonly createdAt: Date;

    private _chatIDs: string[] = [];
    get chatIDs(): string[] { return this._chatIDs; }

    private _ifCurrentUser: boolean = false;
    get ifCurrentUser(): boolean { return this._ifCurrentUser; }

    constructor(userObj: any, userID?: string, currentUser: boolean = false) {
        if (userID) this.id = userID;
        else this.id = userObj.id ? userObj.id : '';
        this._name = userObj.name ? userObj.name : '';
        this._email = userObj.email ? userObj.email : '';
        this._avatar = userObj.avatar ? userObj.avatar : 1;
        this._online = userObj.online ? userObj.online : false;
        this.createdAt = userObj.createdAt ? (userObj.createdAt as any).toDate() : serverTimestamp();
        this._chatIDs = userObj.chatIDs ? userObj.chatIDs : [];
        this._ifCurrentUser = currentUser;
    }

    update(data: any): void {
        if (data.name) this._name = data.name;
        if (data.email) this._email = data.email;
        if (data.avatar) this._avatar = data.avatar;
        if (data.online) this._online = data.online;
        if (data.chatIDs) this._chatIDs = data.chatIDs;
    }
}