import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [
    RouterModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss'
})
export class StartComponent {

  public email: string = '';
  public password: string = '';

  isEmailandPasswordValid(): boolean {
    return this.email != '' && this.password != '';
  }

  submitLoginForm() {
    console.log('Email: ', this.email, 'Password:', this.password);
  }

}
