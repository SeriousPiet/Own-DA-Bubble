import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';

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

  public email: string = '';
  public password: string = '';

  isEmailandPasswordValid(): boolean {
    return this.email != '' && this.password != '';
  }

  submitLoginForm() {
    console.log('Email: ', this.email, 'Password:', this.password);
  }

}
