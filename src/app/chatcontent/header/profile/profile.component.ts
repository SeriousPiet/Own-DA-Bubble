import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../../utils/services/user.service';
import { User } from '../../../shared/models/user.class';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import {
  nameValidator,
  emailValidator,
  passwordValidator,
} from '../../../utils/form-validators';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AvatarDirective } from '../../../utils/directives/avatar.directive';
import { CleanupService } from '../../../utils/services/cleanup.service';
import { ChooesavatarComponent } from '../../../start/chooesavatar/chooesavatar.component';
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updateEmail,
} from '@angular/fire/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ChooesavatarComponent,
    FormsModule,
    AvatarDirective,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  showProfileDetails = false;
  editMode = false;
  showChooseAvatarForm = false;
  isGoogleOrGuestAccount: boolean = false;
  isGuestAccount: boolean = false;
  isGoogleAccount: boolean = false;
  reauthpassword = '';
  reauthpasswordinfo = '';

  profileForm: FormGroup;

  onlineStatus: string = 'offline';
  onlineColor: string = '#92c83e';
  offlineColor: string = '#686868';

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
      this.checkCanEmailChange();
    });
  }

  ngOnInit() {
    if (this.userservice.currentUser) {
      this.profileForm.patchValue({
        name: this.userservice.currentUser.name,
        email: this.userservice.currentUser.email,
      });
    }
    this.checkCanEmailChange();
    this.reauthpasswordInfoReset();
  }

  private checkCanEmailChange() {
    this.isGoogleAccount = this.userservice.currentUser?.provider === 'google';
    this.isGuestAccount = this.userservice.currentUser?.provider === 'guest';
  }

  emailChanged(): boolean {
    return (
      !this.isGoogleAccount &&
      !this.isGuestAccount &&
      this.profileForm.get('email')?.value !==
        this.userservice.currentUser?.email
    );
  }

  nameChanged(): boolean {
    return (
      this.profileForm.get('name')?.value !== this.userservice.currentUser?.name
    );
  }

  passwordCheck(): boolean {
    if (!this.emailChanged()) return true;
    return this.reauthpassword.length >= 8;
  }

  reauthpasswordInfoReset() {
    this.reauthpasswordinfo = 'Mit aktuellem Password bestätigen!';
  }

  submitButtonDisable(): boolean {
    return (
      !this.passwordCheck() || (!this.emailChanged() && !this.nameChanged())
    );
  }

  resetPopoverState() {
    this.showProfileDetails = false;
    this.editMode = false;
    this.showChooseAvatarForm = false;
  }

  showChooseAvatarComponent() {
    this.showChooseAvatarForm = true;
  }

  closeChooseAvatarComponent() {
    this.showChooseAvatarForm = false;
  }

  toggleProfileDetails() {
    this.showProfileDetails = !this.showProfileDetails;
  }

  // todo:
  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode && this.userservice.currentUser) {
      const isGuestAccount = this.userservice.currentUser.provider === 'guest';
      this.profileForm.patchValue({
        name: isGuestAccount ? 'Gast' : this.userservice.currentUser.name,
        email: isGuestAccount
          ? 'gast@da-bubble.de'
          : this.userservice.currentUser.email,
      });

      if (isGuestAccount) {
        this.profileForm.get('name')?.setValidators(Validators.required);
      } else {
        this.profileForm
          .get('name')
          ?.setValidators([Validators.required, nameValidator()]);
      }

      this.profileForm.get('name')?.updateValueAndValidity();
      this.reauthpassword = '';
    }
  }

  async saveChanges() {
    let saveChangesSuccess = true;
    if (this.nameChanged()) {
      await this.userservice.updateCurrentUserDataOnFirestore({
        name: this.profileForm.get('name')?.value,
      });
    }
    if (this.emailChanged()) {
      const error = await this.updateCurrentUserEmail(
        this.profileForm.get('email')?.value,
        this.reauthpassword
      );
      if (error) {
        this.handleEmailChangeErrors(error);
        saveChangesSuccess = false;
      }
    }
    if (saveChangesSuccess) this.toggleEditMode();
  }

  handleEmailChangeErrors(error: string) {
    if (error.includes('auth/wrong-password')) {
      this.reauthpasswordinfo = 'Falsches Passwort';
    }
  }

  logoutUser() {
    this.cleanupservice.logoutUser();
    this.router.navigate(['']);
  }

  async updateCurrentUserEmail(
    newEmail: string,
    currentPassword: string
  ): Promise<string> {
    try {
      await this.reauthenticate(currentPassword);
      const auth = getAuth();
      if (auth.currentUser && this.userservice.currentUser) {
        await updateEmail(auth.currentUser, newEmail);
        await this.userservice.sendEmailVerificationLink();
        await this.userservice.updateCurrentUserDataOnFirestore({
          email: newEmail,
          emailVerified: false,
        });
        return '';
      } else {
        return 'No user to authenticate found';
      }
    } catch (error) {
      return (error as Error).message;
    }
  }

  private async reauthenticate(currentPassword: string): Promise<void> {
    try {
      const user = getAuth().currentUser;
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
      } else {
        throw new Error('profile/Edit: No authenticated user found');
      }
    } catch (error) {
      throw error;
    }
  }
}
