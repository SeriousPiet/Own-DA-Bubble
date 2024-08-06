import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private userservice = inject(UsersService);

  public email: string = '';
  public password: string = '';

  isEmailandPasswordValid(): boolean {
    return this.email != '' && this.password != '';
  }

  submitLoginForm(event: Event) {
    event.preventDefault();
    this.userservice.loginUser(this.email, this.password)
    .then(() => {
      console.log('Successfully logged in');
    })
    .catch((error) => {
      console.error('Error logging in:', error);
    });
  }

}
