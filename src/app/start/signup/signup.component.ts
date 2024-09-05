import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import { emailValidator, nameValidator, passwordValidator } from '../../utils/form-validators';
import { ChooesavatarComponent } from '../chooesavatar/chooesavatar.component';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { addDoc, collection, Firestore, serverTimestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ChooesavatarComponent
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {

  private firestore = inject(Firestore);
  private firebaseauth = inject(Auth);
  private router: Router = inject(Router);

  public errorEmailExists = '';
  public loggingIn = false;
  public showChooseAvatarMask = false;

  signupForm = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      nameValidator(),
    ]),
    email: new FormControl('', [
      Validators.required,
      emailValidator(),
    ]),
    password: new FormControl('', [
      Validators.required,
      passwordValidator(),
    ]),
    checkboxPP: new FormControl(false, [
      Validators.required,
      Validators.requiredTrue
    ]),
  })


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
    else this.handleSignupSuccess();
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