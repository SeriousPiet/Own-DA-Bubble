import { inject, Injectable, OnDestroy } from '@angular/core';
import { User } from '../../shared/models/user.class';
import { BehaviorSubject } from 'rxjs';
import { addDoc, updateDoc, collection, Firestore, onSnapshot, doc, serverTimestamp, getDocs, where, query } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, EmailAuthProvider, getAuth, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updateEmail, updateProfile, user } from '@angular/fire/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class UsersService implements OnDestroy {
  private firestore = inject(Firestore);
  private firebaseauth = inject(Auth);
  private storage = getStorage();
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

  async updateCurrentUserEmail(
    newEmail: string,
    currentPassword: string
  ): Promise<string | undefined> {
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
      console.error(
        'userservice/auth: Error updating email on Firebase/Auth(',
        error,
        ')'
      );
      return undefined;
    }
    return undefined;
  }

  
  private async getUserIDByEmail(
    email: string | null
  ): Promise<string | undefined> {
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
    const updateData = online ? { online: online } : { online: online, lastLoginAt: serverTimestamp() };
    await updateDoc(doc(this.firestore, '/users/' + userID), updateData);
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


  async registerNewUser(name: string, email: string, password: string): Promise<string> {
    try {
      await createUserWithEmailAndPassword(this.firebaseauth, email, password);
      await addDoc(collection(this.firestore, '/users'),
        {
          name: name,
          email: email,
          online: false,
          signupAt: serverTimestamp(),
          avatar: 0,
        });
      console.warn('userservice/auth: User registered(', email, ')');
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
      await this.updateCurrentUserDataOnFirestore({ pictureURL: url });
      return '';
    } catch (error) {
      console.error('userservice/storage: ', (error as Error).message);
      return (error as Error).message;
    }
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
          this.updateUserOnlineStatusOnFirestore(userID, true);
          if (this.currentUserID != userID) {
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
