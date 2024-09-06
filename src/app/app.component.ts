import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { UsersService } from './utils/services/user.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  @HostListener('window:beforeunload', ['$event'])
  async unloadHandler(event: Event) {
    if (this.userservice.currentUser) await this.userservice.updateCurrentUserDataOnFirestore({ online: false });
  }

  private userservice = inject(UsersService);

  title = 'dabubble303';
}
