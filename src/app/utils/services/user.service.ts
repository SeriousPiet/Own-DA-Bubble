import { inject, Injectable, OnDestroy } from '@angular/core';
import { User } from '../../shared/models/user.class';
import { BehaviorSubject } from 'rxjs';
import { updateDoc, collection, Firestore, onSnapshot, doc, serverTimestamp, getDocs, where, query } from '@angular/fire/firestore';
import { Auth, EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut, updateEmail, user } from '@angular/fire/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class UsersService implements OnDestroy {
  private firestore = inject(Firestore);
  private firebaseauth = inject(Auth);
  private unsubUsers: any = null;
  private user$: any = null;
  private currentUserSubscriber: any = null;

  private changeUserListSubject = new BehaviorSubject<string>('');
  public changeUserList$ = this.changeUserListSubject.asObservable();

  private changeCurrentUserSubject = new BehaviorSubject<string>('');
  public changeCurrentUser$ = this.changeCurrentUserSubject.asObservable();

  public users: User[] = [];
  public currentUser: User | undefined;

  constructor() {
    this.initUserCollection();
    this.initUserWatchDog();
  }

  get currentUserID(): string {
    return this.currentUser ? this.currentUser.id : 'no user loged in';
  }


  getAllUserIDs(): string[] { const userIDs = this.users.map((user) => user.id); return userIDs; }

  getUserByID(id: string): User | undefined { return this.users.find((user) => user.id === id); }

  async updateCurrentUserDataOnFirestore(userChangeData: {}) {
    try {
      await updateDoc(doc(this.firestore, '/users/' + this.currentUserID), userChangeData);
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
          this.updateCurrentUserDataOnFirestore({ email: newEmail });
        }
        return undefined;
      }
    } catch (error) {
      console.error('userservice/auth: Error updating email on Firebase/Auth(', error, ')');
      return undefined;
    }
    return undefined;
  }


  private async reauthenticate(currentPassword: string): Promise<void> {
    try {
      const user = getAuth().currentUser;
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        console.warn('userservice/auth: Reauthentication successful');
      } else {
        throw new Error('userservice/auth: No authenticated user found');
      }
    } catch (error) {
      console.error('userservice/auth: Error during reauthentication:', error);
      throw error;
    }
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
    const updateData = online ? { online: true, lastLoginAt: serverTimestamp() } : { online: false };
    await updateDoc(doc(this.firestore, '/users/' + userID), updateData);
  }


  logoutUser(): void {
    if (this.currentUser) {
      signOut(this.firebaseauth);
    }
  }


  // ############################################################################################################
  // Functions for subscribing to Firestore collections
  // ############################################################################################################

  private initUserCollection(): void {
    this.unsubUsers = onSnapshot(
      collection(this.firestore, '/users'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') this.users.push(new User(change.doc.data(), change.doc.id));
          if (change.type === 'modified') {
            const user = this.users.find((user) => user.id === change.doc.id);
            if (user) user.update(change.doc.data());
          }
          if (change.type === 'removed') this.users = this.users.filter((user) => user.email !== change.doc.data()['email']);
        });
        this.changeUserListSubject.next('users');
      }
    );
  }


  public async subscribeCurrentUserByID(userID: string): Promise<void> {
    if (userID == this.currentUserID) return;
    this.unsubscribeFromCurrentUser();
    this.currentUserSubscriber = onSnapshot(
      doc(this.firestore, '/users/' + userID),
      (doc) => {
        if (doc.exists()) {
          if (this.currentUserID != userID) {
            this.updateUserOnlineStatusOnFirestore(userID, true);
            this.currentUser = new User(doc.data(), userID);
            this.changeCurrentUserSubject.next('currentUserSignin');
            console.warn('userservice: currentUser signin - ', doc.data()['email']);
          } else {
            this.currentUser?.update(doc.data());
            this.changeCurrentUserSubject.next('currentUserChanged');
            console.warn('userservice: currentUser changed data - ', doc.data());
          }
        }
      }
    );
  }


  private initUserWatchDog(): void {
    this.user$ = user(this.firebaseauth).subscribe((user) => {
      if (user) {
        console.warn('userservice/auth: Authentication successful: ', user.displayName);
        this.getUserIDByEmail(user.email).then((userID) => {
          if (userID) this.subscribeCurrentUserByID(userID);
        });
      } else if (this.currentUser) {
        console.warn('userservice: currentUser logout - ' + this.currentUser.email);
        this.unsubscribeFromCurrentUser();
        this.updateUserOnlineStatusOnFirestore(this.currentUser.id, false);
        this.currentUser = undefined;
      }
    });
  }

  // ############################################################################################################
  // Functions for unsubscribing from Firestore collections
  // ############################################################################################################

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


  // ############################################################################################################
  // Functions for cleaning up subscriptions
  // ############################################################################################################

  ngOnDestroy(): void {
    this.unsubscribeFromCurrentUser();
    this.unsubscribeFromUsers();
    this.unsubscribeFromAuthUser();
  }
}
