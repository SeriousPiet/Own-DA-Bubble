import { Component } from '@angular/core';

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
}
