import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { UsersService } from './utils/services/user.service';
import { CleanupService } from './utils/services/cleanup.service';


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
export class AppComponent implements OnInit {

  title = 'DABubble303';

  private userservice = inject(UsersService);
  private cleanupservice = inject(CleanupService);

  @HostListener('window:beforeunload', ['$event'])
  async unloadHandler(event: Event) {
    if (this.userservice.currentUser) await this.userservice.updateCurrentUserDataOnFirestore({ online: false });
  }

  
  ngOnInit(): void {
    
  }

}
