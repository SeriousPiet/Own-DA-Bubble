import { AfterViewInit, Component, inject, OnDestroy } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import {
  emailValidator,
  nameValidator,
  passwordValidator,
} from '../../utils/form-validators';
import { ChooesavatarComponent } from '../chooesavatar/chooesavatar.component';
import { Auth, createUserWithEmailAndPassword, signOut, updateProfile } from '@angular/fire/auth';
import {
  addDoc,
  collection,
  Firestore,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ChooesavatarComponent,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {

  constructor() {
    const formData = sessionStorage.getItem('signupForm');
    if (formData) {
      this.signupForm.setValue(JSON.parse(formData));
    }
    signOut(this.firebaseauth);
  }

  private firestore = inject(Firestore);
  private firebaseauth = inject(Auth);
  private userservice = inject(UsersService);
  private router: Router = inject(Router);

  public errorEmailExists = '';
  public loggingIn = false;
  public showChooseAvatarMask = false;

  signupForm = new FormGroup({
    name: new FormControl('', [Validators.required, nameValidator()]),
    email: new FormControl('', [Validators.required, emailValidator()]),
    password: new FormControl('', [Validators.required, passwordValidator()]),
    checkboxPP: new FormControl(false, [Validators.required, Validators.requiredTrue,]),
  });


  saveFormDataToSessionStorage() {
    console.log('saving form data to session storage');
    sessionStorage.setItem('signupForm', JSON.stringify(this.signupForm.value));
  }


  async submitSignUpForm(event: Event) {
    event.preventDefault();
    this.clearAllErrorSpans();
    this.loggingIn = true;
    this.signupForm.disable();
    const name = this.signupForm.value.name || '';
    const email = this.signupForm.value.email || '';
    const password = this.signupForm.value.password || '';
    const error = await this.registerNewUser(name, email, password);
    this.loggingIn = false;
    if (error) this.handleSignupErrors(error);
    else {
      this.signupForm.reset();
      sessionStorage.removeItem('signupForm');
      this.handleSignupSuccess();
    }
  }


  goBack() {
    this.saveFormDataToSessionStorage();
    this.router.navigate(['/']);
  }


  goToPolicy() {
    this.saveFormDataToSessionStorage();
    this.router.navigate(['/policy']);
  }


  async registerNewUser(name: string, email: string, password: string): Promise<string> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.firebaseauth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await addDoc(collection(this.firestore, '/users'), { name: name, email: email, online: false, signupAt: serverTimestamp(), avatar: 0 });
      this.userservice.sendEmailVerificationLink();
      return '';
    } catch (error) {
      console.error('userservice/auth: Error registering user(', (error as Error).message, ')');
      return (error as Error).message;
    }
  }


  successChooseAvatar() {
    document.getElementById('infoPopover')?.showPopover();
    setTimeout(() => {
      this.router.navigate(['/chatcontent']);
    }, 2000);
  }


  handleSignupSuccess() {
    this.showChooseAvatarMask = true;
  }


  handleSignupErrors(error: string) {
    if (error.includes('auth/email-already-in-use')) {
      this.errorEmailExists = 'Diese E-Mail-Adresse ist bereits vergeben.';
    }
  }


  clearAllErrorSpans() {
    this.errorEmailExists = '';
  }
}
