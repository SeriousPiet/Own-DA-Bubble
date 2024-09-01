import { Component, inject, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import { emailValidator, passwordValidator } from '../../utils/form-validators';
import { Auth, getAuth, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from '@angular/fire/auth';
import { addDoc, collection, Firestore, getDocs, query, serverTimestamp, where } from '@angular/fire/firestore';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {

  private readonly loginInfoStayTime = 2000;

  public userservice = inject(UsersService);
  private firestore = inject(Firestore);
  private firebaseauth = inject(Auth);
  private userlogin: any;
  private router: Router = inject(Router);

  public errorEmail = '';
  public errorPassword = '';
  public errorGoogleSignin = '';
  public logininfomessage = '';
  public showSpinner = false;

  public passwordResetFormShow = false;

  passwordResetForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      emailValidator(),
    ]),
  });

  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      emailValidator(),
    ]),
    password: new FormControl('', [
      Validators.required,
      passwordValidator(),
    ]),
  });


  ngOnDestroy(): void {
    if (this.userlogin) this.userlogin.unsubscribe();
  }


  async submitPasswordResetForm(event: Event) {
    event.preventDefault();
    this.passwordResetForm.disable();
    this.clearAllErrorSpans();
    this.showSpinner = true;
    const email = this.passwordResetForm.value.email || null;
    const user = await this.getUserIDByEmail(email);
    if (user && email) {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      console.log('passwortresetemail: ', user);
      this.passwordResetForm.reset();
      document.getElementById('pwresetsend')?.showPopover();
      setTimeout(() => {
        document.getElementById('pwresetsend')?.hidePopover();
        this.passwordResetFormShow = false;
      }, 3000);
    } else {
      this.errorEmail = 'Diese E-Mail-Adresse ist leider unbekannt.';
    }
    this.showSpinner = false;
  }


  async submitLoginForm(event: Event) {
    event.preventDefault();
    this.showSpinner = true;
    this.loginForm.disable();
    this.clearAllErrorSpans();
    const email = this.loginForm.value.email || '';
    const password = this.loginForm.value.password || '';
    const error = await this.loginUser(email, password);
    this.showSpinner = false;
    this.loginForm.enable();
    this.showInfoMessage('');
    if (error != '') this.handleLoginErrors(error);
    else this.handleLoginSuccess();
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


  async signinWithGoogle() {
    this.showSpinner = true;
    const error = await this.signinWithGooglePopup();
    this.showSpinner = false;
    if (error != '') this.handleLoginErrors(error);
    else this.handleLoginSuccess();
  }


  async signinWithGooglePopup(): Promise<string> {
    try {
      this.clearAllErrorSpans();
      const provider = new GoogleAuthProvider();
      const auth = getAuth();
      auth.languageCode = 'de';
      const result = await signInWithPopup(auth, provider);
      if (result.user.displayName && result.user.email) {
        let userID = await this.getUserIDByEmail(result.user.email);
        if (userID) {

        } else {
          await this.addGoogleUserToFirestore(result.user.displayName, result.user.email, result.user.photoURL);
        }
        return '';
      } else {
        return 'auth/google-signin-error-name-email-missing';
      }
    } catch (error) {
      return (error as Error).message;
    }
  }


  private async addGoogleUserToFirestore(name: string, email: string, pictureURL: string | null): Promise<string> {
    const userObj = {
      name: name,
      email: email,
      provider: 'google',
      online: false,
      signupAt: serverTimestamp(),
      avatar: 0,
      pictureURL: pictureURL || null,
    };
    let newUser = await addDoc(collection(this.firestore, '/users'), userObj);
    setTimeout(() => {
      this.userservice.subscribeCurrentUserByID(newUser.id);
    }, 1500);
    return newUser.id;
  }


  private async getUserIDByEmail(email: string | null): Promise<string | undefined> {
    const usersRef = collection(this.firestore, '/users');
    const queryresponse = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(queryresponse);
    if (!querySnapshot.empty) { const userDoc = querySnapshot.docs[0]; return userDoc.id; }
    return undefined;
  }


  handleLoginSuccess() {
    this.showInfoMessage('Anmelden');
    const showLoginInfo = new Date().getTime();
    if (this.userservice.currentUser) {
      setTimeout(() => {
        this.redirectToChatContent();
      }, this.loginInfoStayTime);
    } else {
      this.userlogin = this.userservice.changeCurrentUser$.subscribe((change) => {
        if (change == 'currentUserSignin') {
          if (new Date().getTime() - showLoginInfo < this.loginInfoStayTime)
            setTimeout(() => {
              this.redirectToChatContent();
            }, this.loginInfoStayTime - (new Date().getTime() - showLoginInfo));
          else
            this.redirectToChatContent();
        }
      });
    }
  }


  handleLoginErrors(error: string) {
    if (error.includes('auth/user-not-found')) {
      this.errorEmail = 'Diese E-Mail-Adresse ist leider ungültig.';
    } else if (error.includes('auth/wrong-password')) {
      this.errorPassword = 'Falsches Passwort oder E-Mail. Bitte noch einmal versuchen.';
    } else if (error.includes('auth/popup-closed-by-user')) {
      this.errorGoogleSignin = 'Googleanmeldung wurde durch Benutzer abgebrochen.';
    } else if (error.includes('auth/google-signin-error-name-email-missing')) {
      this.errorGoogleSignin = 'Googleanmeldung fehlgeschlagen. Keine Name und keine EMail gefunden.';
    }
  }


  showInfoMessage(message: string) {
    if (message == '') {
      document.getElementById('logininfo')?.hidePopover();
      return;
    } else {
      this.logininfomessage = message;
      document.getElementById('logininfo')?.showPopover();
    }
  }


  redirectToChatContent() {
    this.showInfoMessage('');
    this.router.navigate(['/chatcontent']);
  }

  clearAllErrorSpans() {
    this.errorEmail = '';
    this.errorPassword = '';
    this.errorGoogleSignin = '';
  }


}
