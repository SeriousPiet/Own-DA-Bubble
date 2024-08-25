import { inject, Injectable, OnDestroy } from '@angular/core';
import { User } from '../../shared/models/user.class';
import { BehaviorSubject } from 'rxjs';
import { Chat } from '../../shared/models/chat.class';
import { addDoc, updateDoc, collection, Firestore, onSnapshot, doc, serverTimestamp, getDocs, where, query } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, EmailAuthProvider, getAuth, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updateEmail, updateProfile, user, UserCredential } from '@angular/fire/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';

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
  private storage = getStorage();
  private unsubUsers: any = null;
  private unsubChats: any = null;
  private user$: any = null;
  private currentUserSubscriber: any = null;
  private chats: Chat[] = [];

  private changeUserListSubject = new BehaviorSubject<string>('');
  public changeUserList$ = this.changeUserListSubject.asObservable();

  private changeCurrentUserSubject = new BehaviorSubject<string>('');
  public changeCurrentUser$ = this.changeCurrentUserSubject.asObservable();

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


  async updateCurrentUserDataOnFirestore(userChangeData: {
    name?: string;
    online?: boolean;
    chatIDs?: string[];
    avatar?: number;
    pictureURL?: string;
  }) {
    if (this.currentUser) {
      await this.updateUserDataOnFirestoreByID(this.currentUserID, userChangeData);
    }
  }

  private async updateUserDataOnFirestoreByID(id: string, userChangeData: {
    email?: string;
    name?: string;
    online?: boolean;
    chatIDs?: string[];
    avatar?: number;
    pictureURL?: string;
  }) {
    try {
      await updateDoc(doc(this.firestore, '/users/' + id), userChangeData);
      console.warn('userservice/firestore: User updated(', this.currentUserID, ') # ', userChangeData);
    } catch (error) {
      console.error('userservice/firestore: ', (error as Error).message);
    }
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


  async loginUser(email: string, password: string): Promise<string> {
    try {
      await signInWithEmailAndPassword(this.firebaseauth, email, password);
      return '';
    } catch (error) {
      console.error('userservice/login:', (error as Error).message);
      return (error as Error).message as string;
    }
  }


  async firebaseSignup(email: string, password: string, name: string): Promise<string> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.firebaseauth, email, password);
      const userID = await this.addUserToFirestore({ name: name, email: email, });
      await updateProfile(userCredential.user, { displayName: userID });
      return '';
    } catch (error) {
      console.error('userservice/signup:', (error as Error).message);
      return (error as Error).message as string;
    }
  }


  async registerNewUser(name: string, email: string, password: string): Promise<string> {
    try {
      const response = await createUserWithEmailAndPassword(this.firebaseauth, email, password);
      const userID = await this.addUserToFirestore({ name: name, email: email, });
      await updateProfile(response.user, { displayName: userID });
      return '';
    } catch (error) {
      console.error('userservice/auth: Error registering user(', (error as Error).message, ')');
      return (error as Error).message;
    }
  }


  async uploadUserPictureToFirestore(userID: string, file: any): Promise<string> {
    const storageRef = ref(this.storage, 'profile-pictures/' + userID + '/userpicture.' + file.name.split('.').pop());
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      await this.updateUserDataOnFirestoreByID(userID, { pictureURL: url });
      return '';
    } catch (error) {
      console.error('userservice/storage: ', (error as Error).message);
      return (error as Error).message;
    }
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
    return newUser.id;
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
            console.log('userservice/firestore: User modified: ', change.doc.data());
            const user = this.users.find((user) => user.id === change.doc.id);
            if (user) user.update(change.doc.data());
          }
          if (change.type === 'removed') {
            this.users = this.users.filter((user) => user.email !== change.doc.data()['email']);
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
      if (user) {
        console.warn('userservice/auth: Authentication successful: ', user.displayName);
        this.getUserIDByEmail(user.email)
          .then((userID) => {
            if (userID) {
              this.unsubscribeFromCurrentUser();
              this.currentUserSubscriber = onSnapshot(doc(this.firestore, '/users/' + userID), (doc) => {
                if (doc.exists()) {
                  this.updateUserOnlineStatusOnFirestore(userID, true);
                  if (this.currentUserID != userID) this.currentUser = new User(doc.data(), userID);
                  else this.currentUser?.update(doc.data());
                  this.changeCurrentUserSubject.next('userlogin');
                  console.warn('userservice: currentUser is ', userID);
                }
              });
            }
          }
          );
      } else if (this.currentUser) {
        console.warn('user logout - ' + this.currentUser.email);
        this.unsubscribeFromCurrentUser();
        this.updateUserOnlineStatusOnFirestore(this.currentUser.id, false);
        this.currentUser = undefined;
      }
    });
  }


  private async getUserIDByEmail(email: string | null): Promise<string | undefined> {
    const usersRef = collection(this.firestore, '/users');
    const queryresponse = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(queryresponse);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.id;
    }
    return undefined;
  }


  private async updateUserOnlineStatusOnFirestore(userID: string, online: boolean): Promise<void> {
    await updateDoc(doc(this.firestore, '/users/' + userID), { online: online, });
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
