import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';

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
      Validators.maxLength(20),
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(20),
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
    this.userservice
      .registerNewUser({ name: name, email: email, password: password })
      .then(
        (response) => {
          this.router.navigate(['/chooseavatar']);
        }
      )
      .catch(
        (error) => {
          console.error('Error registering user:', error);
        });
  }
}