import { Component, inject } from '@angular/core';
import { UsersService } from '../../utils/services/user.service';
import { RouterLink, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chooesavatar',
  standalone: true,
  imports: [
    RouterLink,
    RouterModule,
    CommonModule
  ],
  templateUrl: './chooesavatar.component.html',
  styleUrl: './chooesavatar.component.scss'
})
export class ChooesavatarComponent {

  public userservice = inject(UsersService);
  private router = inject(Router);
  private defaultAvatarPath: string = '../../../assets/icons/start/profile-big.svg';
  private avatarPath: string = '../../../assets/icons/start/choose-avatar/';

  public selectedAvatarPicture: any;
  private selectedAvatarNumber: number = 0;
  public pictureFile: any;
  public uploading: boolean = false;

  avatarList = [
    { id: 0, img_name: this.defaultAvatarPath },
    { id: 1, img_name: this.avatarPath + 'choose-avatar-1.svg' },
    { id: 2, img_name: this.avatarPath + 'choose-avatar-2.svg' },
    { id: 3, img_name: this.avatarPath + 'choose-avatar-3.svg' },
    { id: 4, img_name: this.avatarPath + 'choose-avatar-4.svg' },
    { id: 5, img_name: this.avatarPath + 'choose-avatar-5.svg' },
    { id: 6, img_name: this.avatarPath + 'choose-avatar-6.svg' },
  ]

  constructor() {
    this.userservice.changeCurrentUser$.subscribe(() => {
      if (this.userservice.currentUser?.pictureURL) {
        this.selectedAvatarPicture = this.userservice.currentUser?.pictureURL;
      } else {
        const avatarNumber = this.userservice.currentUser?.avatar || 0;
        this.selectedAvatarPicture = this.avatarList[avatarNumber].img_name;
      }
    });
  }

  setAvatar(avatar: number) {
    this.pictureFile = null;
    this.selectedAvatarNumber = avatar;
    this.selectedAvatarPicture = this.avatarList[avatar].img_name;
  }


  async setAvatarPictureURLtoFirestore(pictureFile: any) {
    this.uploading = true;
    const error = await this.userservice.uploadUserPictureToFirestore(this.userservice.currentUserID, pictureFile);
    if (error) this.handleUploadErrors(error);
    else this.handleUploadSuccess();
    this.uploading = false;
  }


  public loadFileToViewInImg(event: any) {
    if (event.target.files && event.target.files[0]) {

      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedAvatarPicture = e.target.result;
      };
      reader.readAsDataURL(file);
      this.pictureFile = file;
    }
  }


  private handleUploadErrors(error: any) {
    console.error('Error uploading file: ', error);
  }


  private handleUploadSuccess() {
    console.log('File uploaded successfully');
  }


  async submitChooseAvatar(event: Event) {
    event.preventDefault();
    if (this.pictureFile) await this.setAvatarPictureURLtoFirestore(this.pictureFile);
    else await this.userservice.updateCurrentUserDataOnFirestore({ avatar: this.selectedAvatarNumber, pictureURL: '' });
    this.router.navigate(['/chatcontent']);
  }

}
