import { inject, Injectable, OnDestroy } from '@angular/core';
import { User } from '../../shared/models/user.class';
import { BehaviorSubject } from 'rxjs';
import { updateDoc, collection, Firestore, onSnapshot, doc, serverTimestamp, getDocs, where, query } from '@angular/fire/firestore';
import { Auth, sendEmailVerification, user } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class UsersService implements OnDestroy {
  private firestore = inject(Firestore);
  private firebaseauth = inject(Auth);
  private unsubUsers: any = null;
  private user$: any = null;
  private currentAuthUser: any = undefined;

  private changeUserListSubject = new BehaviorSubject<User[]>([]);
  public changeUserList$ = this.changeUserListSubject.asObservable();

  private changeCurrentUserSubject = new BehaviorSubject<User | undefined>(undefined);
  public changeCurrentUser$ = this.changeCurrentUserSubject.asObservable();

  private selectedUserObjectSubject = new BehaviorSubject<User | undefined>(undefined);
  public selectedUserObject$ = this.selectedUserObjectSubject.asObservable();


  public users: User[] = [];
  public currentUser: User | undefined;
  public currentGuestUserID: string = '';
  public guestUserIDWaitForLogin: string | undefined;


  constructor() {
    this.initUserCollection();
    this.initAuthWatchDog();
    const guestUserEmail = localStorage.getItem('guestuseremail'); // this is only a guest user
    if (guestUserEmail) this.setCurrentUserByEMail(guestUserEmail);
  }


  get currentUserID(): string { return this.currentUser ? this.currentUser.id : 'no user logged in'; }

  getAllUserIDs(): string[] { const userIDs = this.users.map((user) => user.id); return userIDs; }

  getUserByID(id: string): User | undefined { return this.users.find((user) => user.id === id); }

  ifValidUser(userID: string): boolean {
    const user = this.users.find((user) => user.id === userID);
    if (user && (!user.guest || user.id === this.currentGuestUserID)) return true;
    return false;
  }

  async updateCurrentUserDataOnFirestore(userChangeData: {}) {
    try {
      await updateDoc(doc(this.firestore, '/users/' + this.currentUserID), userChangeData);
    } catch (error) {
      console.error('userservice/firestore: ', (error as Error).message);
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
          if (this.currentUserID === change.doc.id) this.changeCurrentUserSubject.next(this.currentUser);
        });
        this.users.sort((a, b) => a.name.localeCompare(b.name));
        this.changeUserListSubject.next(this.users);
      }
    );
  }


  private initAuthWatchDog(): void {
    this.user$ = user(this.firebaseauth).subscribe((user) => {
      if (user) {
        if (user === this.currentAuthUser) return;
        this.currentAuthUser = user;
        const signinProvider = user.providerData[0].providerId;
        console.warn('userservice/auth: Authentication successful: ', user.email, ' provider: ', signinProvider);
        if (!user.emailVerified && signinProvider !== 'google.com') {
          console.warn('userservice/auth: Email not verified');
        }
        if (user.email) this.setCurrentUserByEMail(user.email);
      } else if (this.currentUser) {
        console.warn('userservice: currentUser logout - ' + this.currentUser.email);
        this.setCurrentUserByEMail('');
      }
    });
  }


  public async ifCurrentUserVerified(): Promise<boolean> {
    if (this.currentUser) {
      if (this.currentUser.provider !== 'email') return true;
      if (this.currentUser.emailVerified) return true;
      if (this.currentAuthUser) {
        await this.currentAuthUser.reload();
        console.warn('userservice/auth: Checking email verification');
        if (this.currentAuthUser.emailVerified) {
          await this.updateCurrentUserDataOnFirestore({ emailVerified: true });
          return true;
        } else {
          console.warn('userservice/auth: Email not verified');
          document.getElementById('emailNotVerifiedPopover')?.showPopover();
        }
      }
    }
    return false;
  }


  public async sendEmailVerificationLink(): Promise<void> {
    try {
      const user = this.firebaseauth.currentUser;
      if (user) {
        console.warn('userservice/auth: Sending email verification to: ', user.email);
        await sendEmailVerification(user);
      }
    } catch (error) {
      console.error('userservice/auth: ', (error as Error).message);
    }
  }


  public async setCurrentUserByEMail(userEmail: string): Promise<void> {
    if (userEmail !== '') {
      const userlistSubsciption = this.changeUserList$.subscribe((users) => {
        const user = users.find((user) => user.email === userEmail);
        if (user) {
          this.setCurrentUser(user);
          setTimeout(() => {
            userlistSubsciption.unsubscribe();
          }, 1000);
        }
      });
    } else {
      this.clearCurrentUser();
    }
  }

  
  private async setCurrentUser(user: User) {
    if (this.currentUser && user) return;
    this.currentUser = user;
    if (user.guest) this.currentGuestUserID = user.id;
    await this.updateCurrentUserDataOnFirestore({ online: true, lastLoginAt: serverTimestamp() });
    this.changeCurrentUserSubject.next(user);
}


  public async  clearCurrentUser() {
    await this.updateCurrentUserDataOnFirestore({ online: false });
    this.currentUser = undefined;
    localStorage.removeItem('guestuserid'); // this is only for guest user
    this.currentGuestUserID = '';
    this.changeCurrentUserSubject.next(undefined);
  }

  // ############################################################################################################
  // Functions for unsubscribing from Firestore collections
  // ############################################################################################################

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

  updateSelectedUser(user: User | undefined) {
    this.selectedUserObjectSubject.next(user);
  }



  // ############################################################################################################
  // Functions for cleaning up subscriptions
  // ############################################################################################################

  ngOnDestroy(): void {
    this.unsubscribeFromUsers();
    this.unsubscribeFromAuthUser();
  }


}