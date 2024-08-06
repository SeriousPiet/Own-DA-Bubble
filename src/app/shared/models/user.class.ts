import { serverTimestamp } from "@angular/fire/firestore";

export class User {

    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: number;
    readonly online: boolean;

    readonly createdAt: Date;
    readonly chatIDs: string[]; // privatmessages with other users

    private _ifCurrentUser: boolean = false;
    get ifCurrentUser(): boolean {
        return this._ifCurrentUser;
    }

    setCurrentUser(value: boolean): void {
        this._ifCurrentUser = value;
    }

    constructor(userObj: any) {
        this.id = userObj.id ? userObj.id : '';
        this.name = userObj.name ? userObj.name : '';
        this.email = userObj.email ? userObj.email : '';
        this.avatar = userObj.avatar ? userObj.avatar : 1;
        this.online = userObj.online ? userObj.online : false;
        this.createdAt = userObj.createdAt ? (userObj.createdAt as any).toDate() : serverTimestamp();
        this.chatIDs = userObj.chatIDs ? userObj.chatIDs : [];
    }
}