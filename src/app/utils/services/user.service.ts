import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  addDoc,
  updateDoc,
  collection,
  Firestore,
  onSnapshot,
  doc,
  getDoc,
  query,
  getDocs,
  where,
  serverTimestamp,
} from '@angular/fire/firestore';
import { User } from '../../shared/models/user.class';
import {
  Auth,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updateProfile,
  user,
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class UsersService implements OnDestroy {
  private firestore = inject(Firestore);
  private firebaseauth = inject(Auth);
  private unsubUsers: any = null;
  private user$: any = null;
  private currentUserSubscriber: any = null;

  public users: User[] = [];
  public currentUser: User | undefined;

  constructor() {
    this.initUserCollection();
    this.initUserWatchDog();
  }

  getAllUserIDs(): string[] {
    const userIDs = this.users.map((user) => user.name);
    console.log('User IDs from UserService:', userIDs);
    return userIDs;
  }

  getUserByID(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  updateCurrentUserDataOnFirestore(userChangeData: {
    email?: string;
    name?: string;
    online?: boolean;
    chatIDs?: string[];
    avatar?: number;
    pictureURL?: string;
  }) {
    if (this.currentUser) {
      updateDoc(
        doc(this.firestore, '/users/' + this.currentUser.id),
        userChangeData
      )
        .then(() => {
          console.warn(
            'userservice/firestore: User updated(',
            this.currentUser?.id,
            ') # ',
            userChangeData
          );
        })
        .catch((error) => {
          console.error(
            'userservice/firestore: Error updating user(',
            error.message,
            ')'
          );
        });
    } else {
      console.error('userservice/firestore: No current user signed in');
    }
  }

  updateCurrentUserEmail(
    newEmail: string,
    currentPassword: string
  ): string | undefined {
    this.reauthenticate(currentPassword)
      .then(() => {
        const auth = getAuth();
        if (auth.currentUser) {
          updateEmail(auth.currentUser, newEmail)
            .then(() => {
              console.warn('userservice/auth: Email updated on Firebase/Auth');
              this.updateCurrentUserDataOnFirestore({ email: newEmail });
              return undefined;
            })
            .catch((error) => {
              console.error(
                'userservice/auth: Error updating email on Firebase/Auth(',
                error.message,
                ')'
              );
              return error.message;
            });
        }
      })
      .catch((error) => {
        console.error(
          'userservice/auth: Error reauthenticating user(',
          error.message,
          ')'
        );
        return 'user/reauthenticate';
      });
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
        console.error(
          'userservice/auth: Error logging in user(',
          error.message,
          ')'
        );
        return error.message;
      });
    return undefined;
  }

  registerNewUser(user: {
    email: string;
    password: string;
    name: string;
  }): string | undefined {
    createUserWithEmailAndPassword(this.firebaseauth, user.email, user.password)
      .then((response) => {
        this.addUserToFirestore({
          name: user.name,
          email: response.user.email,
        }).then((userID) => {
          updateProfile(response.user, { displayName: userID }).then(() => {
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
            this.users.push(new User(change.doc.data()));
          }
          if (change.type === 'modified') {
            const user = this.users.find(
              (user) => user.id === change.doc.data()['id']
            );
            if (user) user.update(change.doc.data());
          }
          if (change.type === 'removed') {
            this.users = this.users.filter(
              (user) => user.email !== change.doc.data()['email']
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
        console.warn(
          'userservice/auth: Authentication successful: ',
          user.email
        );
        this.currentUserSubscriber = onSnapshot(
          doc(this.firestore, '/users/' + user.displayName),
          (snapshot) => {
            if (snapshot.exists()) {
              if (
                !this.currentUser ||
                this.currentUser.id !== snapshot.data()['id']
              ) {
                this.currentUser = new User(snapshot.data());
                if (this.currentUser) {
                  this.setOnlineStatus(this.currentUser.id, true);
                  console.warn(
                    'userservice/firestore: currentUser is ' +
                    this.currentUser.email
                  );
                  console.log(
                    'Online-Status des aktuellen Users:',
                    this.currentUser.online
                  );
                }
              } else {
                this.currentUser?.update(snapshot.data());
                console.warn(
                  'userservice/firestore: user update ' + this.currentUser.email
                );
                console.log(
                  'Online-Status des aktuellen Users:',
                  this.currentUser.online
                );
              }
            }
          }
        );
      } else if (this.currentUser) {
        console.warn('user logout - ' + this.currentUser.email);
        this.setOnlineStatus(this.currentUser.id, false);
        this.currentUser = undefined;
      }
    });
  }

  private async setOnlineStatus(
    userID: string,
    online: boolean
  ): Promise<void> {
    await updateDoc(doc(this.firestore, '/users/' + userID), {
      online: online,
    });
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

  ngOnDestroy(): void {
    this.unsubscribeFromCurrentUser();
    this.unsubscribeFromUsers();
    this.unsubscribeFromAuthUser();
  }
}
