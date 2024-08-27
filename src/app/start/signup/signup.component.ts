import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import { emailValidator, nameValidator, passwordValidator } from '../../utils/form-validators';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {

  private userservice = inject(UsersService);
  private router: Router = inject(Router);

  public errorEmailExists = '';

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
    const name = this.signupForm.value.name || '';
    const email = this.signupForm.value.email || '';
    const password = this.signupForm.value.password || '';
    const error = await this.userservice.registerNewUser(name, email, password);
    if (error) this.handleSignupErrors(error);
    else this.handleSignupSuccess();
  }


  handleSignupSuccess() {
    this.router.navigate(['/chooseavatar']);
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