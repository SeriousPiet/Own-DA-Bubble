import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    RouterModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {

  private userservice = inject(UsersService);

  public name: string = '';
  public email: string = '';
  public password: string = '';
  public checkboxPP: boolean = false;


  ifSignUpFormValid(): boolean {
    return this.name.length > 0 && this.email.length > 0 && this.password.length > 0 && this.checkboxPP;
  }


  submitSignUpForm(event: Event): void {
    event.preventDefault();
    this.userservice
      .registerNewUser({ name: this.name, email: this.email, password: this.password })
      .then(
        (user) => {
          console.log('User registered successfully:', user);
          console.log('show avatar modal... etc');
        }
      )
      .catch(
        (error) => {
          console.error('Error registering user:', error);
        });
  }
}
