import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import { emailValidator, nameValidator, passwordValidator } from '../../utils/form-validators';
import { ChooesavatarComponent } from '../chooesavatar/chooesavatar.component';

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

  private userservice = inject(UsersService);
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
    const error = await this.userservice.registerNewUser(name, email, password);
    this.loggingIn = false;
    this.signupForm.enable();
    if (error) this.handleSignupErrors(error);
    else this.handleSignupSuccess();
  }


  successChooseAvatar() {
    this.router.navigate(['/chatcontent']);
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