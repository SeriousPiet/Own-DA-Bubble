import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import { emailValidator, passwordValidator } from '../../utils/form-validators';

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
export class LoginComponent {

  public userservice = inject(UsersService);
  private router: Router = inject(Router);

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


  submitLoginForm(event: Event) {
    event.preventDefault();
    const email = this.loginForm.value.email || '';
    const password = this.loginForm.value.password || '';
    const error = this.userservice.loginUser(email, password);
    if (error) {
      console.error('Error logging in:', error);
      // auth/user-not-found
      // auth/wrong-password
    } else {
      this.router.navigate(['/chatcontent']);
    };
  }

}
