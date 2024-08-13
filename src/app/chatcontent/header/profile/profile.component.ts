import { Component } from '@angular/core';
import { UsersService } from '../../../utils/services/user.service';
import { NavigationService } from '../../../utils/services/navigation.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  showProfileDetails = false;
  editMode = false;

  resetPopoverState() {
    this.showProfileDetails = false;
    this.editMode = false;
  }

  toggleProfileDetails() {
    this.showProfileDetails = !this.showProfileDetails;
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
  }

  public onlineStatus: string = 'offline';
  public onlineColor: string = '#92c83e'; // Farbe für online
  public offlineColor: string = '#686868'; // Farbe für offline

  constructor(
    public userservice: UsersService,
    private navigationService: NavigationService
  ) {
    this.navigationService.change$.subscribe(() => {
      this.onlineStatus = this.userservice.currentUser?.online
        ? 'online'
        : 'offline';
      console.log('Online-Status:', this.onlineStatus);
    });
  }
}
