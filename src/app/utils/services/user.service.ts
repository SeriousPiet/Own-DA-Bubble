import { inject, Injectable, OnDestroy } from '@angular/core';
import { CollectionType, LastReadMessage, User } from '../../shared/models/user.class';
import { BehaviorSubject } from 'rxjs';
import { updateDoc, collection, Firestore, onSnapshot, doc, serverTimestamp } from '@angular/fire/firestore';
import { Auth, sendEmailVerification, user } from '@angular/fire/auth';
import { EmojipickerService } from './emojipicker.service';
import { Message } from '../../shared/models/message.class';
import { Chat } from '../../shared/models/chat.class';
import { Channel } from '../../shared/models/channel.class';
import { getCollectionType, isRealUser } from '../firebase/utils';

export type CurrentUserChange = 'init' | 'login' | 'logout' | 'update';

@Injectable({
  providedIn: 'root',
})
export class UsersService implements OnDestroy {
  private firestore = inject(Firestore);
  private firebaseauth = inject(Auth);
  private emojiService = inject(EmojipickerService);

  private unsubUsers: any = null;
  private user$: any = null;
  private currentAuthUser: any = undefined;
  private updateCurrentUserDataFunction: any = undefined;
  public isUserMemberOfCurrentChannel = false;

  private changeUserListSubject = new BehaviorSubject<User[]>([]);
  public changeUserList$ = this.changeUserListSubject.asObservable();

  private changeCurrentUserSubject = new BehaviorSubject<CurrentUserChange>('init');
  public changeCurrentUser$ = this.changeCurrentUserSubject.asObservable();

  private selectedUserObjectSubject = new BehaviorSubject<User | undefined>(undefined);
  public selectedUserObject$ = this.selectedUserObjectSubject.asObservable();


  public users: User[] = [];
  public currentUser: User | undefined;
  get currentUserID(): string { return this.currentUser ? this.currentUser.id : 'no user logged in'; }
  public currentGuestUserID: string = '';


  constructor() {
    this.initUserSubscription();
    this.initAuthWatchDog();
    const guestUserEmail = localStorage.getItem('guestuseremail'); // this is only a guest user
    if (guestUserEmail) this.setCurrentUserByEMail(guestUserEmail);
  }


  /**
   * Retrieves all user IDs from the list of users.
   *
   * @returns {string[]} An array of user IDs.
   */
  getAllUserIDs(): string[] {
    const userIDs = this.users.filter((user) => isRealUser(user)).map((user) => user.id);
    return userIDs;
  }


  /**
   * Retrieves a user by their unique identifier.
   *
   * @param id - The unique identifier of the user.
   * @returns The user object if found, otherwise `undefined`.
   */
  getUserByID(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }


  /**
   * Retrieves a user by their name.
   *
   * @param name - The name of the user to retrieve.
   * @returns The user object if found, otherwise `undefined`.
   */
  getUserByName(name: string): User | undefined {
    return this.users.find((user) => user.name === name);
  }


  /**
   * Updates the current user's data on Firestore.
   *
   * This method takes an object containing the user data changes and updates
   * the current user's data in the Firestore database.
   *
   * @param userChangeData - An object containing the changes to be applied to the current user's data.
   * @returns A promise that resolves when the update operation is complete.
   */
  async updateCurrentUserDataOnFirestore(userChangeData: {}) {
    await this.updateUserDataOnFirestore(this.currentUserID, userChangeData);
  }


  /**
   * Updates user data on Firestore.
   *
   * @param userID - The ID of the user whose data is to be updated.
   * @param userChangeData - An object containing the user data changes.
   * @returns A promise that resolves when the update is complete.
   * @throws Will log an error message if the update fails.
   */
  async updateUserDataOnFirestore(userID: string, userChangeData: {}) {
    try {
      await updateDoc(doc(this.firestore, '/users/' + userID), userChangeData);
    } catch (error) {
      console.error('userservice/firestore: ', (error as Error).message);
    }
  }


  /**
   * Initializes the user subscription to listen for changes in the Firestore 'users' collection.
   * 
   * This method sets up a snapshot listener on the 'users' collection and handles the following changes:
   * - **Added**: Adds a new user to the local `users` array.
   * - **Modified**: Updates an existing user in the local `users` array.
   * - **Removed**: Removes a user from the local `users` array based on their email.
   * 
   * Additionally, if the change affects the current user, it updates the current user's online status
   * and notifies subscribers of the current user subject.
   * 
   * After processing all changes, the method sorts the `users` array by name and notifies subscribers
   * of the user list subject.
   * 
   * @private
   * @returns {void}
   */
  private initUserSubscription(): void {
    this.unsubUsers = onSnapshot(
      collection(this.firestore, '/users'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            this.users.push(new User(change.doc.data(), change.doc.id));
          }
          else if (change.type === 'modified') {
            const user = this.users.find((user) => user.id === change.doc.id);
            if (user) user.update(change.doc.data());
          }
          else if (change.type === 'removed') this.users = this.users.filter((user) => user.email !== change.doc.data()['email']);
          if (this.currentUserID === change.doc.id) {
            if (change.doc.data()['online'] === false) this.updateCurrentUserDataOnFirestore({ online: true });
            this.changeCurrentUserSubject.next('update');
          }
        });
        this.users.sort((a, b) => a.name.localeCompare(b.name));
        this.changeUserListSubject.next(this.users);
      }
    );
  }


  /**
   * Initializes the authentication watchdog that monitors the user's authentication state.
   * 
   * This method subscribes to the user observable from Firebase authentication and performs
   * the following actions based on the user's authentication state:
   * 
   * - If a user is authenticated and it is different from the current authenticated user:
   *   - Updates the current authenticated user.
   *   - Logs a warning message indicating successful authentication along with the user's email and provider.
   *   - Checks if the user's email is verified (except for Google sign-ins) and logs a warning if not.
   *   - Sets the current user by their email.
   * 
   * - If no user is authenticated and there is a current user:
   *   - Logs a warning message indicating the current user's logout.
   *   - Clears the current user by setting their email to an empty string.
   * 
   * @private
   * @returns {void}
   */
  private initAuthWatchDog(): void {
    this.user$ = user(this.firebaseauth).subscribe((user) => {
      if (user) {
        if (user === this.currentAuthUser) return;
        this.currentAuthUser = user;
        const signinProvider = user.providerData[0].providerId;
        if (user.email) this.setCurrentUserByEMail(user.email);
      } else if (this.currentUser) {
        this.setCurrentUserByEMail('');
      }
    });
  }


  /**
   * Checks if the current user's email is verified.
   * 
   * This method performs the following checks:
   * 1. If there is a current user.
   * 2. If the user's provider is not 'email', it returns true.
   * 3. If the user's email is already verified, it returns true.
   * 4. If the user's email is not verified, it reloads the current authenticated user.
   * 5. If the reloaded user's email is verified, it updates the user's data in Firestore and returns true.
   * 6. If the reloaded user's email is still not verified, it shows a popover indicating the email is not verified.
   * 
   * @returns {Promise<boolean>} - A promise that resolves to true if the user's email is verified, otherwise false.
   */
  public async ifCurrentUserVerified(): Promise<boolean> {
    if (this.currentUser) {
      if (this.currentUser.provider !== 'email') return true;
      if (this.currentUser.emailVerified) return true;
      if (this.currentAuthUser) {
        await this.currentAuthUser.reload();
        if (this.currentAuthUser.emailVerified) {
          await this.updateCurrentUserDataOnFirestore({ emailVerified: true });
          return true;
        } else {
          document.getElementById('emailNotVerifiedPopover')?.showPopover();
        }
      }
    }
    return false;
  }


  /**
   * Sends an email verification link to the currently authenticated user.
   * 
   * This method retrieves the current user from Firebase authentication and, if a user is found,
   * sends an email verification link to the user's email address. If an error occurs during this process,
   * it logs the error message to the console.
   * 
   * @returns {Promise<void>} A promise that resolves when the email verification link has been sent.
   * @throws Will log an error message to the console if the email verification link could not be sent.
   */
  public async sendEmailVerificationLink(): Promise<void> {
    try {
      const user = this.firebaseauth.currentUser;
      if (user) await sendEmailVerification(user);
    } catch (error) {
      console.error('userservice/auth: ', (error as Error).message);
    }
  }


  /**
   * Sets the current user based on the provided email address.
   * 
   * @param userEmail - The email address of the user to set as the current user.
   * @returns A promise that resolves when the operation is complete.
   * 
   * @remarks
   * If the provided email is an empty string, the current user will be cleared.
   * The method subscribes to the `changeUserList$` observable to find the user
   * with the matching email. Once the user is found and set, the subscription
   * is unsubscribed after a short delay.
   */
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


  /**
   * Sets the current user and performs necessary updates.
   * 
   * @param user - The user object to set as the current user.
   * @returns A promise that resolves when the user is set and all updates are complete.
   * 
   * This method performs the following actions:
   * - If the current user is already set and the provided user is valid, it returns immediately.
   * - Sets the provided user as the current user.
   * - If the user is a guest, sets the current guest user ID.
   * - Loads the user's emojis using the emoji service.
   * - Prepares user data with online status and last login timestamp.
   * - If the current authenticated user is available, includes email verification status in the user data.
   * - Updates the current user data on Firestore.
   * - Notifies subscribers of the current user change event.
   */
  private async setCurrentUser(user: User) {
    if (this.currentUser && user) return;
    this.currentUser = user;
    if (user.guest) this.currentGuestUserID = user.id;
    await this.emojiService.loadUserEmojis(user.id);
    let userData: { online: boolean; lastLoginAt: any; emailVerified?: boolean } = { online: true, lastLoginAt: serverTimestamp() };
    if (this.currentAuthUser) userData.emailVerified = this.currentAuthUser.emailVerified;
    await this.updateCurrentUserDataOnFirestore(userData);

    this.changeCurrentUserSubject.next('login');
  }


  /**
   * Updates the last read message for the current user in a specified collection.
   * 
   * @param message - The message object containing the details of the message.
   * @param collection - The collection (Channel, Chat, or Message) where the message belongs.
   * 
   * This method checks if the current user is not a guest and updates the last read message
   * for the specified collection if the message is newer than the previously recorded one.
   * If no record exists for the collection, it creates a new one. The updated data is then
   * saved to Firestore.
   */
  setLastReadMessage(message: Message, collection: Channel | Chat | Message) {
    if (this.currentUser) {
      const lrm = this.currentUser.lastReadMessages.find((lrm) => lrm.collectionID === collection.id);
      const messageCreatedAt = message.createdAt.getTime();
      collection.unreadMessagesCount--;
      collection.update({});
      let updateNeeded = false;
      if (lrm) {
        if (lrm.messageCreateAt < messageCreatedAt) {
          lrm.messageID = message.id;
          lrm.messageCreateAt = messageCreatedAt;
          updateNeeded = true;
        }
      } else {
        if (this.currentUser.signupAt < message.createdAt) {
          const type = getCollectionType(collection);
          this.currentUser.lastReadMessages.push({ collectionType: type, collectionID: collection.id, messageID: message.id, messageCreateAt: messageCreatedAt });
          updateNeeded = true;
        }
      }
      this.changeCurrentUserSubject.next('update');
      if (updateNeeded && this.updateCurrentUserDataFunction === undefined) {
        this.updateCurrentUserDataFunction = setTimeout(() => {
          if (this.currentUser) {
            this.updateCurrentUserDataOnFirestore({ lastReadMessages: JSON.stringify(this.currentUser.lastReadMessages) });
          }
          this.updateCurrentUserDataFunction = undefined;
        }, 10000);
      }
    }
  }


  /**
   * Retrieves the last read message object for the given collection.
   * 
   * @param collection - The collection which can be of type Channel, Chat, or Message.
   * @returns The last read message object if found, otherwise undefined.
   */
  getLastReadMessageObject(collection: Channel | Chat | Message): LastReadMessage | undefined {
    if (this.currentUser) {
      const result = this.currentUser.lastReadMessages.find((lrm) => lrm.collectionType === getCollectionType(collection) && lrm.collectionID === collection.id);
      return result ? result : { collectionType: getCollectionType(collection), collectionID: collection.id, messageID: '', messageCreateAt: this.currentUser.signupAt.getTime() };
    }
    return undefined;
  }


  /**
   * Clears the current user session.
   * 
   * This method performs the following actions:
   * - If a current user exists, it logs out the user.
   * - Sets the current user to undefined.
   * - Removes the guest user email from local storage.
   * - Resets the current guest user ID.
   * - Updates the user's online status in the Firestore database to false.
   * - Notifies subscribers of the user logout event.
   * 
   * @returns {Promise<void>} A promise that resolves when the user session is cleared.
   */
  public async clearCurrentUser() {
    if (this.currentUser) {
      const logoutUser = this.currentUser;
      await this.updateCurrentUserDataOnFirestore({ lastReadMessages: JSON.stringify(this.currentUser.lastReadMessages) });
      this.currentUser = undefined;
      localStorage.removeItem('guestuseremail'); // this is only for guest user
      this.currentGuestUserID = '';
      updateDoc(doc(this.firestore, '/users/' + logoutUser.id), { online: false });
      this.changeCurrentUserSubject.next('logout');
    }
  }


  /**
   * Unsubscribes from the user subscription if it exists.
   * 
   * This method checks if there is an existing user subscription and unsubscribes from it.
   * After unsubscribing, it sets the subscription reference to null.
   * 
   * @private
   */
  private unsubscribeFromUsers(): void {
    if (this.unsubUsers) {
      this.unsubUsers();
      this.unsubUsers = null;
    }
  }


  /**
   * Unsubscribes from the user observable if it exists and sets it to null.
   * This method ensures that any active subscription to the user observable
   * is properly cleaned up to prevent memory leaks.
   *
   * @private
   */
  private unsubscribeFromAuthUser(): void {
    if (this.user$) {
      this.user$.unsubscribe();
      this.user$ = null;
    }
  }


  /**
   * Updates the selected user and notifies all subscribers with the new user object.
   * 
   * @param user - The user object to set as the selected user. Can be undefined.
   */
  updateSelectedUser(user: User | undefined) {
    this.selectedUserObjectSubject.next(user);
  }


  /**
   * Lifecycle hook that is called when the component is destroyed.
   * This method unsubscribes from user and authentication user observables
   * to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.unsubscribeFromUsers();
    this.unsubscribeFromAuthUser();
  }
}