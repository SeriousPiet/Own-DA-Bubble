import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../../utils/services/user.service';
import { NavigationService } from '../../../utils/services/navigation.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { nameValidator, emailValidator } from '../../../utils/form-validators';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  showProfileDetails = false;
  editMode = false;
  profileForm: FormGroup;

  public onlineStatus: string = 'offline';
  public onlineColor: string = '#92c83e';
  public offlineColor: string = '#686868';

  constructor(
    public userservice: UsersService,
    private navigationService: NavigationService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, nameValidator()]],
      email: ['', [Validators.required, emailValidator()]],
    });

    this.navigationService.change$.subscribe(() => {
      this.onlineStatus = this.userservice.currentUser?.online
        ? 'online'
        : 'offline';
      console.log('Online-Status:', this.onlineStatus);
    });
  }

  ngOnInit() {
    if (this.userservice.currentUser) {
      this.profileForm.patchValue({
        name: this.userservice.currentUser.name,
        email: this.userservice.currentUser.email,
      });
    }
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
    this.userservice.logoutUser();
    this.router.navigate(['']);
  }
}
