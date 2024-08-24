import { inject, Injectable, OnDestroy } from '@angular/core';
import { User } from '../../shared/models/user.class';
import { BehaviorSubject } from 'rxjs';
import { Chat } from '../../shared/models/chat.class';
import { addDoc, updateDoc, collection, Firestore, onSnapshot, doc, serverTimestamp } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, EmailAuthProvider, getAuth, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updateEmail, updateProfile, user } from '@angular/fire/auth';

/**
 * The UsersService class provides methods for managing users and chats in the application.
 * It handles user authentication, user data retrieval, chat creation, and more.
 * @class
 */
@Injectable({
  providedIn: 'root',
})
export class UsersService implements OnDestroy {
  private firestore = inject(Firestore);
  private firebaseauth = inject(Auth);
  private unsubUsers: any = null;
  private unsubChats: any = null;
  private user$: any = null;
  private currentUserSubscriber: any = null;
  private chats: Chat[] = [];

  private changeUserListSubject = new BehaviorSubject<string>('');
  public changeUserList$ = this.changeUserListSubject.asObservable();

  public users: User[] = [];
  public currentUser: User | undefined;


  constructor() {
    this.initUserCollection();
    this.initUserWatchDog();
    this.initChatCollection();
  }

  get currentUserID(): string {
    return this.currentUser ? this.currentUser.id : 'no user loged in';
  }


  getAllUserIDs(): string[] {
    const userIDs = this.users.map((user) => user.id);
    return userIDs;
  }


  getUserByID(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }


  getChatByID(chatID: string): Chat | undefined {
    return this.chats.find((chat) => chat.id === chatID);
  }


  getChatPartner(chat: Chat): User | undefined {
    if (this.currentUser) {
      if (chat.memberIDs[0] === this.currentUserID) return this.getUserByID(chat.memberIDs[1]);
      else return this.getUserByID(chat.memberIDs[0]);
    }
    return undefined;
  }


  ifSelfChat(chat: Chat): boolean {
    if (this.currentUser) return chat.memberIDs[0] === this.currentUser.id && chat.memberIDs[1] === this.currentUser.id;
    return false;
  }


  async getChatWithUserByID(userID: string, createChat: boolean = true): Promise<Chat | undefined> {
    if (this.currentUser) {
      let chat: Chat | undefined = undefined;
      if (this.currentUserID === userID) chat = this.chats.find((chat) => chat.memberIDs[0] === userID && chat.memberIDs[1] === userID);
      else chat = this.chats.find((chat) => chat.memberIDs.includes(userID));
      if (chat) return chat;
      if (createChat) return await this.addChatWithUserOnFirestore(userID);
    }
    return undefined;
  }


  private async addChatWithUserOnFirestore(userID: string): Promise<Chat | undefined> {
    try {
      const chatRef = collection(this.firestore, '/chats');
      const chatObj = {
        memberIDs: [this.currentUserID, userID],
        createdAt: serverTimestamp(),
      };

      const chat = await addDoc(chatRef, chatObj);

      await updateDoc(doc(this.firestore, '/chats/' + chat.id), { id: chat.id });

      this.updateCurrentUserDataOnFirestore({ chatIDs: [...(this.currentUser?.chatIDs || []), chat.id] });
      if (this.currentUserID !== userID) this.updateUserDataOnFirestoreByID(userID, { chatIDs: [...(this.getUserByID(userID)?.chatIDs || []), chat.id] });

      console.warn('userservice/firestore: Chat added(' + chat.id + ')');
      return new Chat(chatObj.memberIDs, chat.id);
    } catch (error) {
      console.error('userservice/firestore: Error adding chat(' + (error as Error).message + ')');
      return undefined;
    }
  }


  updateCurrentUserDataOnFirestore(userChangeData: {
    name?: string;
    online?: boolean;
    chatIDs?: string[];
    avatar?: number;
    pictureURL?: string;
  }) {
    if (this.currentUser) {
      this.updateUserDataOnFirestoreByID(this.currentUserID, userChangeData);
    }
  }

  private updateUserDataOnFirestoreByID(id: string, userChangeData: {
    email?: string;
    name?: string;
    online?: boolean;
    chatIDs?: string[];
    avatar?: number;
    pictureURL?: string;
  }) {
    updateDoc(doc(this.firestore, '/users/' + id), userChangeData)
      .then(() => { console.warn('userservice/firestore: User updated(', this.currentUserID, ') # ', userChangeData); })
      .catch((error) => { console.error('userservice/firestore: Error updating user(', error.message, ')'); });
  }


  async updateCurrentUserEmail(newEmail: string, currentPassword: string): Promise<string | undefined> {
    try {
      await this.reauthenticate(currentPassword);
      const auth = getAuth();
      if (auth.currentUser) {
        await updateEmail(auth.currentUser, newEmail);
        console.warn('userservice/auth: Email updated on Firebase/Auth');
        if (this.currentUser) {
          this.updateUserDataOnFirestoreByID(this.currentUser.id, { email: newEmail });
        }
        return undefined;
      }
    } catch (error) {
      console.error('userservice/auth: Error updating email on Firebase/Auth(', error, ')');
      return undefined;
    }
    return undefined;
  }

  // ############################################################################################################
  // methodes for login and logout and signup
  // ############################################################################################################

  logoutUser(): void {
    if (this.currentUser) {
      signOut(this.firebaseauth);
    }
  }

  loginUser(email: string, password: string): string | undefined {
    signInWithEmailAndPassword(this.firebaseauth, email, password)
      .then((response) => {
        return undefined;
      })
      .catch((error) => {
        console.error('userservice/auth: Error logging in user(', error.message, ')');
        return error.message;
      });
    return undefined;
  }


  registerNewUser(user: { email: string; password: string; name: string; }): string | undefined {
    createUserWithEmailAndPassword(this.firebaseauth, user.email, user.password)
      .then((response) => {
        this.addUserToFirestore({
          name: user.name,
          email: response.user.email,
        }).then((userID) => {
          updateProfile(response.user, { displayName: userID })
            .then(() => {
              return undefined;
            });
        });
      })
      .catch((error) => {
        console.error(
          'userservice/auth: Error registering user(',
          error.message,
          ')'
        );
        return error.message;
      });
    return undefined;
  }

  // ############################################################################################################

  private async reauthenticate(currentPassword: string): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user && user.email) {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      return reauthenticateWithCredential(user, credential)
        .then(() => {
          console.warn('userservice/auth: Reauthentication successful');
        })
        .catch((error) => {
          console.error(
            'userservice/auth: Error during reauthentication:',
            error
          );
          throw error;
        });
    } else {
      return Promise.reject(
        new Error('userservice/auth: No authenticated user found')
      );
    }
  }

  private initUserCollection(): void {
    this.unsubUsers = onSnapshot(
      collection(this.firestore, '/users'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            this.users.push(new User(change.doc.data(), change.doc.id));
          }
          if (change.type === 'modified') {
            const user = this.users.find(
              (user) => user.id === change.doc.id
            );
            if (user) user.update(change.doc.data());
          }
          if (change.type === 'removed') {
            this.users = this.users.filter(
              (user) => user.email !== change.doc.data()['email']
            );
          }
        });
        this.changeUserListSubject.next('users');
      }
    );
  }


  private initChatCollection(): void {
    this.unsubChats = onSnapshot(
      collection(this.firestore, '/chats'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            this.chats.push(new Chat(change.doc.data()['memberIDs'], change.doc.id));
          }
          if (change.type === 'modified') {
            this.chats.push(new Chat(change.doc.data()['memberIDs'], change.doc.id));
          }
          if (change.type === 'removed') {
            this.chats = this.chats.filter(
              (chat) => chat.id !== change.doc.data()['id']
            );
          }
        });
      }
    );
  }


  private initUserWatchDog(): void {
    this.user$ = user(this.firebaseauth).subscribe((user) => {
      this.unsubscribeFromCurrentUser();
      if (user) {
        console.warn('userservice/auth: Authentication successful: ', user.email);
        this.currentUserSubscriber = onSnapshot(doc(this.firestore, '/users/' + user.displayName),
          (snapshot) => {
            if (snapshot.exists()) {
              if (!this.currentUser || this.currentUser.id !== snapshot.data()['id']) {
                this.currentUser = new User(snapshot.data(), snapshot.id, true);
                if (this.currentUser) {
                  this.updateUserOnlineStatusOnFirestore(this.currentUser.id, true);
                  console.warn('userservice/firestore: currentUser is ' + this.currentUser.email);
                  console.log('Online-Status des aktuellen Users:', this.currentUser.online);
                }
              } else {
                this.currentUser?.update(snapshot.data());
                console.warn('userservice/firestore: user update ' + this.currentUser.email);
                console.log('Online-Status des aktuellen Users:', this.currentUser.online);
              }
            }
          }
        );
      } else if (this.currentUser) {
        console.warn('user logout - ' + this.currentUser.email);
        this.updateUserOnlineStatusOnFirestore(this.currentUser.id, false);
        this.currentUser = undefined;
      }
    });
  }


  private async updateUserOnlineStatusOnFirestore(userID: string, online: boolean): Promise<void> {
    await updateDoc(doc(this.firestore, '/users/' + userID), { online: online, });
  }


  private async addUserToFirestore(user: any): Promise<string> {
    const userObj = {
      name: user.name,
      email: user.email,
      online: false,
      signupAt: serverTimestamp(),
      avatar: 0,
    };
    let ref = collection(this.firestore, '/users');
    let newUser = await addDoc(ref, userObj);
    await updateDoc(doc(this.firestore, '/users/' + newUser.id), {
      id: newUser.id,
    });
    return newUser.id;
  }

  private unsubscribeFromCurrentUser(): void {
    if (this.currentUserSubscriber) {
      this.currentUserSubscriber();
      this.currentUserSubscriber = null;
    }
  }

  private unsubscribeFromUsers(): void {
    if (this.unsubUsers) {
      this.unsubUsers();
      this.unsubUsers = null;
    }
  }

  private unsubscribeFromAuthUser(): void {
    if (this.user$) {
      this.user$.unsubscribe();
      this.user$ = null;
    }
  }

  private unsubscribeFromChats(): void {
    if (this.unsubChats) {
      this.unsubChats();
      this.unsubChats = null;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeFromCurrentUser();
    this.unsubscribeFromUsers();
    this.unsubscribeFromAuthUser();
    this.unsubscribeFromChats();
  }
}
