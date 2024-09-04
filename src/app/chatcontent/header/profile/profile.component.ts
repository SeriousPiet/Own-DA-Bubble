import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../../utils/services/user.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { nameValidator, emailValidator } from '../../../utils/form-validators';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AvatarDirective } from '../../../utils/directives/avatar.directive';
import { CleanupService } from '../../../utils/services/cleanup.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AvatarDirective],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  showProfileDetails = false;
  editMode = false;
  isGoogleAuth: boolean = false;

  profileForm: FormGroup;

  public onlineStatus: string = 'offline';
  public onlineColor: string = '#92c83e';
  public offlineColor: string = '#686868';

  constructor(
    public userservice: UsersService,
    private cleanupservice: CleanupService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, nameValidator()]],
      email: ['', [Validators.required, emailValidator()]],
    });

    this.userservice.currentUser?.changeUser$.subscribe((user) => {
      this.onlineStatus = user?.online ? 'online' : 'offline';
    });

    this.userservice.changeCurrentUser$.subscribe(() => {
      this.updateGoogleAuthStatus();
    });
  }

  ngOnInit() {
    if (this.userservice.currentUser) {
      this.profileForm.patchValue({
        name: this.userservice.currentUser.name,
        email: this.userservice.currentUser.email,
      });
    }
    this.updateGoogleAuthStatus();
  }

  private updateGoogleAuthStatus() {
    this.isGoogleAuth = this.userservice.currentUser?.provider === 'google';
  }

  resetPopoverState() {
    this.showProfileDetails = false;
    this.editMode = false;
  }

  toggleProfileDetails() {
    this.showProfileDetails = !this.showProfileDetails;
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode && this.userservice.currentUser) {
      this.profileForm.patchValue({
        name: this.userservice.currentUser.name,
        email: this.userservice.currentUser.email,
      });
    }
  }

  saveChanges() {
    if (this.profileForm.valid && this.userservice.currentUser) {
      const userChangeData = {
        name: this.profileForm.get('name')?.value,
        email: this.profileForm.get('email')?.value,
      };

      this.userservice.updateCurrentUserDataOnFirestore(userChangeData);
      this.toggleEditMode();
    } else {
      console.error('Formular ungültig!');
      // Hier können wir später Logik für Fehlermeldungen im Frontend hinzufügen
    }
  }

  logoutUser() {
    this.cleanupservice.logoutUser();
    this.router.navigate(['']);
  }
}
