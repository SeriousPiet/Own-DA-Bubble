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


  submitSignUpForm(event: Event): void {
    event.preventDefault();
    const name = this.signupForm.value.name || '';
    const email = this.signupForm.value.email || '';
    const password = this.signupForm.value.password || '';
    const error = this.userservice.registerNewUser({ name: name, email: email, password: password });
    if (error) {
      console.error('Error registering user:', error);
    }
    else {
      this.router.navigate(['/chooseavatar']);
    }
  }
}