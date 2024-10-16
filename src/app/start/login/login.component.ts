import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  FormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import { emailValidator, passwordValidator } from '../../utils/form-validators';
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from '@angular/fire/auth';
import {
  addDoc,
  collection,
  Firestore,
  getDocs,
  query,
  serverTimestamp,
  where,
} from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { ChannelService } from '../../utils/services/channel.service';
import { MessageService } from '../../utils/services/message.service';
import {
  dabubbleBotId,
  newGoogleUserMessages,
  newGuestMessages,
} from '../../utils/firebase/utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./intro-animation.scss', './login.component.scss'],
})
export class LoginComponent implements OnDestroy, OnInit {
  private readonly loginInfoStayTime = 2000;
  private showLoginInfoTime: number | null = null;

  public userservice = inject(UsersService);
  private channelService = inject(ChannelService);
  private messageService = inject(MessageService);
  private firestore = inject(Firestore);
  private firebaseauth = inject(Auth);
  private router: Router = inject(Router);

  private subCurrentUser: any;

  public errorEmail = '';
  public errorPassword = '';
  public errorGoogleSignin = '';
  public loginInfoMessage = '?';
  public loginInfoIcon = false;
  public showSpinner = false;
  public spinnerMobile: boolean = false;

  public showInfoModal = false;

  public passwordResetFormShow = false;
  public loginFormShow = true;

  public showIntro = true;
  private sessionWithIntro = true;

  passwordResetForm = new FormGroup({
    email: new FormControl('', [Validators.required, emailValidator()]),
  });

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, emailValidator()]),
    password: new FormControl('', [Validators.required, passwordValidator()]),
  });

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   * This method performs the following actions:
   * - Checks the introduction status.
   * - Checks the screen width and sets up a resize event listener to handle screen width changes.
   * - Initializes a watcher for the current user.
   */
  ngOnInit() {
    this.checkIntroStatus();
    this.checkScreenWidth();
    window.addEventListener('resize', this.checkScreenWidth.bind(this));
    this.initCurrentUserWatch();
  }

  /**
   * Checks the status of the introductory sequence.
   *
   * This method determines whether the introductory sequence has been played
   * by checking the 'introPlayed' item in the session storage. If the
   * introductory sequence has been played, it sets `showIntro` and
   * `sessionWithIntro` to `false`. If not, it sets the 'introPlayed' item
   * in the session storage to 'true'.
   *
   * @private
   */
  private checkIntroStatus() {
    const introPlayed = sessionStorage.getItem('introPlayed');
    if (introPlayed) {
      this.showIntro = false;
      this.sessionWithIntro = false;
    } else {
      sessionStorage.setItem('introPlayed', 'true');
    }
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   *
   * This method performs necessary cleanup such as:
   * - Unsubscribing from the `subCurrentUser` observable to prevent memory leaks.
   * - Removing the 'resize' event listener from the window to avoid potential issues.
   */
  ngOnDestroy(): void {
    if (this.subCurrentUser) this.subCurrentUser.unsubscribe();
    window.removeEventListener('resize', this.checkScreenWidth.bind(this));
  }

  /**
   * Checks the current screen width and sets the `spinnerMobile` property.
   * If the screen width is less than or equal to 480 pixels, `spinnerMobile` is set to true.
   * Otherwise, it is set to false.
   *
   * @private
   */
  private checkScreenWidth() {
    this.spinnerMobile = window.innerWidth <= 480;
  }

  /**
   * Logs in a guest user by creating a new user document in Firestore with a unique email address.
   * Disables the login form and shows a spinner during the process.
   * Sets the current user in the user service and stores the guest email in local storage.
   * Re-enables the login form and hides the spinner upon completion.
   *
   * @returns {Promise<void>} A promise that resolves when the login process is complete.
   */
  async loginGuest() {
    this.showSpinner = true;
    this.loginForm.disable();
    this.clearAllErrorSpans();
    const email = 'gast' + new Date().getTime() + '@gast.de';
    const data = await addDoc(collection(this.firestore, '/users'), {
      name: 'Gast',
      email: email,
      online: false,
      signupAt: serverTimestamp(),
      avatar: 0,
      guest: true,
      emailVerified: true,
    });
    this.userservice.setCurrentUserByEMail(email);
    localStorage.setItem('guestuseremail', email);
    this.showSpinner = false;
    this.loginForm.enable();
    this.handleLoginSuccess();
    setTimeout(() => {
      this.implementSomeNewUserStuff(data.id, newGuestMessages);
    }, 4000);
  }

  /**
   * Handles the submission of the password reset form.
   *
   * @param {Event} event - The event triggered by form submission.
   * @returns {Promise<void>} - A promise that resolves when the password reset process is complete.
   *
   * @remarks
   * This method performs the following actions:
   * - Prevents the default form submission behavior.
   * - Disables the password reset form to prevent further input.
   * - Clears any existing error messages.
   * - Shows a loading spinner.
   * - Retrieves the user ID associated with the provided email.
   * - If a user is found and the email is valid, sends a password reset email.
   * - Displays an informational message indicating that the email has been sent.
   * - Resets the password reset form.
   * - Shows an informational popover for 3 seconds.
   * - If no user is found, displays an error message indicating that the email is unknown.
   * - Hides the loading spinner and re-enables the password reset form.
   *
   * @throws {Error} If there is an issue with sending the password reset email.
   */
  async submitPasswordResetForm(event: Event) {
    event.preventDefault();
    this.passwordResetForm.disable();
    this.clearAllErrorSpans();
    this.showSpinner = true;
    const email = this.passwordResetForm.value.email || null;
    const user = await this.getUserIDByEmail(email);
    if (user && email) {
      this.showInfoMessage('EMail gesendet', true);
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      this.passwordResetForm.reset();
      document.getElementById('infoPopover')?.showPopover();
      setTimeout(() => {
        document.getElementById('infoPopover')?.hidePopover();
        this.passwordResetFormShow = false;
      }, 3000);
    } else {
      this.errorEmail = 'Diese E-Mail-Adresse ist leider unbekannt.';
    }
    this.showSpinner = false;
    this.passwordResetForm.enable();
  }

  /**
   * Handles the submission of the login form.
   *
   * @param event - The event triggered by the form submission.
   * @returns A promise that resolves when the login process is complete.
   *
   * This method performs the following actions:
   * - Prevents the default form submission behavior.
   * - Clears all error messages.
   * - Retrieves the email and password from the form.
   * - Disables the form to prevent further input.
   * - Shows a loading spinner.
   * - Attempts to log the user in with the provided email and password.
   * - Hides the loading spinner.
   * - Re-enables the form.
   */
  async submitLoginForm(event: Event) {
    event.preventDefault();
    this.clearAllErrorSpans();
    const email = this.loginForm.value.email || '';
    const password = this.loginForm.value.password || '';
    this.loginForm.disable();
    this.showSpinner = true;
    await this.loginUser(email, password);
    this.showSpinner = false;
    this.loginForm.enable();
  }

  /**
   * Logs in a user using their email and password.
   *
   * @param email - The email address of the user.
   * @param password - The password of the user.
   * @returns A promise that resolves to an empty string if login is successful,
   *          or an error message string if login fails.
   */
  async loginUser(email: string, password: string): Promise<string> {
    try {
      await signInWithEmailAndPassword(this.firebaseauth, email, password);
      this.handleLoginSuccess();
      return '';
    } catch (error) {
      this.handleLoginErrors((error as Error).message as string);
      return (error as Error).message as string;
    }
  }

  /**
   * Initiates the sign-in process with Google.
   *
   * This method displays a spinner while attempting to sign in with Google using a popup.
   * If an error occurs during the sign-in process, it handles the error accordingly.
   * Otherwise, it handles the successful login.
   *
   * @returns {Promise<void>} A promise that resolves when the sign-in process is complete.
   */
  async signinWithGoogle() {
    this.showSpinner = true;
    const error = await this.signinWithGooglePopup();
    this.showSpinner = false;
    if (error != '') this.handleLoginErrors(error);
    else this.handleLoginSuccess();
  }

  /**
   * Signs in a user using Google authentication via a popup.
   *
   * This method clears all error spans, sets the authentication language to German,
   * and attempts to sign in the user with a Google popup. If the sign-in is successful
   * and the user's display name and email are available, it checks if the user exists
   * in the Firestore database by email. If the user does not exist, it adds the user
   * to the Firestore database.
   *
   * @returns {Promise<string>} A promise that resolves to an empty string if the sign-in
   * is successful and the user data is processed correctly, or an error message string
   * if an error occurs during the sign-in process.
   *
   * @throws {Error} If an error occurs during the sign-in process, the error message is returned.
   */
  async signinWithGooglePopup(): Promise<string> {
    try {
      this.clearAllErrorSpans();
      const provider = new GoogleAuthProvider();
      const auth = getAuth();
      auth.languageCode = 'de';
      const result = await signInWithPopup(auth, provider);
      if (result.user.displayName && result.user.email) {
        let userID = await this.getUserIDByEmail(result.user.email);
        if (!userID) {
          const newUserID = await this.addGoogleUserToFirestore(
            result.user.displayName,
            result.user.email,
            result.user.photoURL
          );
          setTimeout(() => {
            this.implementSomeNewUserStuff(newUserID, newGoogleUserMessages);
          }, 4000);
        }
        return '';
      } else {
        return 'auth/google-signin-error-name-email-missing';
      }
    } catch (error) {
      return (error as Error).message;
    }
  }

  /**
   * Adds a Google user to Firestore.
   *
   * @param name - The name of the user.
   * @param email - The email address of the user.
   * @param pictureURL - The URL of the user's profile picture, or null if not available.
   * @returns A promise that resolves to the ID of the newly created user document.
   */
  private async addGoogleUserToFirestore(
    name: string,
    email: string,
    pictureURL: string | null
  ): Promise<string> {
    const userObj = {
      name,
      email,
      provider: 'google',
      online: false,
      signupAt: serverTimestamp(),
      avatar: 0,
      pictureURL: pictureURL || null,
    };
    this.userservice.setCurrentUserByEMail(email);
    const newUser = await addDoc(collection(this.firestore, '/users'), userObj);
    return newUser.id;
  }

  /**
   * Retrieves the user ID associated with the given email address.
   *
   * @param email - The email address to search for. Can be a string or null.
   * @returns A promise that resolves to the user ID if found, otherwise undefined.
   */
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

  /**
   * Initializes a subscription to watch for changes in the current user.
   * When a 'login' change type is detected, it hides the login form, displays
   * an information message, and redirects to the chat content after a specified delay.
   *
   * @remarks
   * - If the user is a guest, the name 'Gast' is used in the info message.
   * - The delay before redirection can be influenced by the `sessionWithIntro` property.
   * - Ensures that the info message is shown for at least `loginInfoStayTime` milliseconds.
   *
   * @privateRemarks
   * - The subscription is stored in `subCurrentUser`.
   *
   * @returns void
   */
  initCurrentUserWatch() {
    this.subCurrentUser = this.userservice.changeCurrentUser$.subscribe(
      (changeType) => {
        if ('login' === changeType) {
          this.loginFormShow = false;
          setTimeout(
            () => {
              const userName = this.userservice.currentUser?.guest
                ? 'Gast'
                : this.userservice.currentUser?.name;
              this.showInfoMessage('Anmelden als ' + userName, false);
              if (this.showLoginInfoTime === null)
                this.showLoginInfoTime = new Date().getTime();
              const timeElapsed = new Date().getTime() - this.showLoginInfoTime;
              if (timeElapsed < this.loginInfoStayTime) {
                setTimeout(() => {
                  this.redirectToChatContent();
                }, this.loginInfoStayTime - timeElapsed);
              } else {
                this.redirectToChatContent();
              }
            },
            this.sessionWithIntro ? 2000 : 0
          );
        }
      }
    );
  }

  /**
   * Handles the successful login event by updating the `showLoginInfoTime` property
   * with the current timestamp.
   */
  handleLoginSuccess() {
    this.showLoginInfoTime = new Date().getTime();
  }

  /**
   * Handles login errors by setting appropriate error messages based on the error code.
   *
   * @param error - The error message string received during the login process.
   *
   * Error codes and their corresponding messages:
   * - 'auth/user-not-found': Sets `errorEmail` to 'Diese Mailaddresse ist nicht registriert.'
   * - 'auth/wrong-password': Sets `errorPassword` to 'Falsches Passwort.'
   * - 'auth/popup-closed-by-user': Sets `errorGoogleSignin` to 'Anmeldung durch Benutzer abgebrochen.'
   * - 'auth/google-signin-error-name-email-missing': Sets `errorGoogleSignin` to 'Anmeldung fehlgeschlagen. Name & E-Mail unbekannt.'
   */
  handleLoginErrors(error: string) {
    if (error.includes('auth/user-not-found')) {
      this.errorEmail = 'Diese Mailaddresse ist nicht registriert.';
    } else if (error.includes('auth/wrong-password')) {
      this.errorPassword = 'Falsches Passwort.';
    } else if (error.includes('auth/popup-closed-by-user')) {
      this.errorGoogleSignin = 'Anmeldung durch Benutzer abgebrochen.';
    } else if (error.includes('auth/google-signin-error-name-email-missing')) {
      this.errorGoogleSignin =
        'Anmeldung fehlgeschlagen. Name & E-Mail unbekannt.';
    }
    console.clear();
  }

  /**
   * Displays or hides an informational message in the login component.
   *
   * @param message - The message to display. If an empty string is provided, the message will be hidden.
   * @param showImg - A boolean indicating whether to show an icon along with the message.
   */
  showInfoMessage(message: string, showImg: boolean) {
    if (message == '') {
      this.loginInfoIcon = false;
      document.getElementById('infoPopover')?.hidePopover();
    } else {
      this.loginInfoIcon = showImg;
      this.loginInfoMessage = message;
      document.getElementById('infoPopover')?.showPopover();
    }
  }

  /**
   * Redirects the user to the chat content page.
   *
   * This method hides any informational messages and navigates the user to the
   * '/chatcontent' route using the Angular Router.
   */
  redirectToChatContent() {
    this.showInfoMessage('', false);
    this.router.navigate(['/chatcontent']);
  }

  /**
   * Clears all error messages related to email, password, and Google sign-in.
   * This method resets the error messages to empty strings.
   */
  clearAllErrorSpans() {
    this.errorEmail = '';
    this.errorPassword = '';
    this.errorGoogleSignin = '';
  }

  /**
   * Implements new user setup by creating chats and sending initial messages.
   *
   * @param newUserID - The ID of the new user.
   * @param messagesArray - An array of messages to be sent to the new user.
   * @returns A promise that resolves when the setup is complete.
   *
   * This function performs the following steps:
   * 1. Creates a chat with the new user.
   * 2. Creates a chat with the dabubble bot.
   * 3. Sends each message in the `messagesArray` to the dabubble bot chat.
   */
  private async implementSomeNewUserStuff(
    newUserID: string,
    messagesArray: string[]
  ) {
    const selfChatID = await this.channelService.addChatWithUserOnFirestore(
      newUserID
    );
    const dabubbleBotChatID =
      await this.channelService.addChatWithUserOnFirestore(dabubbleBotId); // Bela Schramm
    if (dabubbleBotChatID) {
      const dabubbleBotChat =
        this.channelService.getChatByID(dabubbleBotChatID);
      if (dabubbleBotChat) {
        messagesArray.forEach(async (message) => {
          await this.messageService.addNewMessageToCollection(
            dabubbleBotChat,
            message,
            [],
            dabubbleBotId
          );
        });
      }
    }
  }
}
