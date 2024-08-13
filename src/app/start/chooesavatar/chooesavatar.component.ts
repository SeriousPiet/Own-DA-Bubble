import { Component, inject } from '@angular/core';
import { UsersService } from '../../utils/services/user.service';
import { RouterLink, RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-chooesavatar',
  standalone: true,
  imports: [
    RouterLink,
    RouterModule
  ],
  templateUrl: './chooesavatar.component.html',
  styleUrl: './chooesavatar.component.scss'
})
export class ChooesavatarComponent {

  private userservice = inject(UsersService);
  private router = inject(Router);
  private defaultAvatarPath: string = '../../../assets/icons/start/profile-big.svg';
  private avatarPath: string = '../../../assets/icons/start/choose-avatar/ ';

  private selectedAvatar: number = 0;
  public selectedAvatarName: string = this.defaultAvatarPath;

  avatarList = [
    { id: 0, img_name: this.defaultAvatarPath },
    { id: 1, img_name: this.avatarPath + 'choose-avatar-1.svg' },
    { id: 2, img_name: this.avatarPath + 'choose-avatar-2.svg' },
    { id: 3, img_name: this.avatarPath + 'choose-avatar-3.svg' },
    { id: 4, img_name: this.avatarPath + 'choose-avatar-4.svg' },
    { id: 5, img_name: this.avatarPath + 'choose-avatar-5.svg' },
    { id: 6, img_name: this.avatarPath + 'choose-avatar-6.svg' },
  ]

  setAvatar(avatar: number) {
    this.selectedAvatar = avatar;
    this.selectedAvatarName = this.avatarList[avatar].img_name;
  }

  getCurrentAvatar() {
    return this.avatarList[this.selectedAvatar].img_name;
  }

  submitChooseAvatar(event: Event) {
    event.preventDefault();
    if (this.userservice.currentUser) {
      this.userservice.updateUserOnFirestore(this.userservice.currentUser.id, { avatar: this.selectedAvatar });
      this.router.navigate(['/chatcontent']);
    }
  }

}
