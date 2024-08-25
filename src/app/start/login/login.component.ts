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

  public errorEmail = '';
  public errorPassword = '';

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


  async submitLoginForm(event: Event) {
    event.preventDefault();
    this.clearAllErrorSpans();
    const email = this.loginForm.value.email || '';
    const password = this.loginForm.value.password || '';
    const error = await this.userservice.loginUser(email, password);
    if (error != '') this.handleLoginErrors(error);
    else this.handleLoginSuccess();
  }


  handleLoginSuccess() {
    this.router.navigate(['/chatcontent']);
  }


  handleLoginErrors(error: string) {
    if (error.includes('auth/user-not-found')) {
      this.errorEmail = 'Diese E-Mail-Adresse ist leider ungültig.';
    } else if (error.includes('auth/wrong-password')) {
      this.errorPassword = 'Falsches Passwort oder E-Mail. Bitte noch einmal versuchen.';
    }
  }


  clearAllErrorSpans() {
    this.errorEmail = '';
    this.errorPassword = '';
  }

}
