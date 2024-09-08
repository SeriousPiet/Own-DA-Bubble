import { Component, EventEmitter, inject, Output } from '@angular/core';
import { UsersService } from '../../utils/services/user.service';
import { RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';

@Component({
  selector: 'app-chooseavatar',
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

  @Output() clickSuccess = new EventEmitter<void>();

  public userservice = inject(UsersService);
  private storage = getStorage();
  private defaultAvatarPath: string = '../../../assets/icons/start/profile-big.svg';
  private avatarPath: string = '../../../assets/icons/start/choose-avatar/';

  public selectedAvatarPicture: any;
  private selectedAvatarNumber: number = 0;
  public pictureFile: any;
  public picturePropertysError: string = '';
  public uploading: boolean = false;
  public changedAvatar: boolean = false;

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
    this.undoAvatarChange();
  }


  undoAvatarChange() {
    this.changedAvatar = false;
    this.pictureFile = null;
    this.picturePropertysError = '';
    if (this.userservice.currentUser?.pictureURL) {
      this.selectedAvatarPicture = this.userservice.currentUser?.pictureURL;
    } else {
      const avatarNumber = this.userservice.currentUser?.avatar || 0;
      this.selectedAvatarPicture = this.avatarList[avatarNumber].img_name;
    }
  }

  setAvatar(avatar: number) {
    if (!this.userservice.currentUser?.pictureURL && this.userservice.currentUser?.avatar === avatar) return;
    this.picturePropertysError = '';
    this.pictureFile = null;
    this.changedAvatar = true;
    this.selectedAvatarNumber = avatar;
    this.selectedAvatarPicture = this.avatarList[avatar].img_name;
  }


  async setAvatarPictureURLtoFirestore(pictureFile: any) {
    this.uploading = true;
    const error = await this.uploadUserPictureToFirestore(this.userservice.currentUserID, pictureFile);
    if (error) this.handleUploadErrors(error);
    else this.handleUploadSuccess();
    this.uploading = false;
  }


  async uploadUserPictureToFirestore(userID: string, file: any): Promise<string> {
    const storageRef = ref(this.storage, 'profile-pictures/' + userID + '/userpicture.' + file.name.split('.').pop());
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      await this.userservice.updateCurrentUserDataOnFirestore({ pictureURL: url, avatar: 0 });
      return '';
    } catch (error) {
      console.error('userservice/storage: ', (error as Error).message);
      return (error as Error).message;
    }
  }


  public loadFileToViewInImg(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.picturePropertysError = '';
      const file = event.target.files[0];
      if (!this.validateFilePropertys(file)) return;
      this.changedAvatar = true;
      const reader = new FileReader();
      reader.onload = (e: any) => { this.selectedAvatarPicture = e.target.result; };
      reader.readAsDataURL(file);
      this.pictureFile = file;
    }
  }


  private validateFilePropertys(file: any): boolean {
    if (file.size > 500000) {
      this.picturePropertysError = 'Datei ist zu groß (max. 500 KB)';
      return false;
    }
    if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/gif') {
      this.picturePropertysError = 'Bitte nur PNG, JPEG oder GIF';
      return false;
    }
    return true;
  }


  private handleUploadErrors(error: any) {
    console.error('Error uploading file: ', error);
  }


  private handleUploadSuccess() {
    console.log('File uploaded successfully');
  }


  async submitChooseAvatar(event: Event) {
    try {
      event.preventDefault();
      if (this.changedAvatar) {
        if (this.pictureFile) await this.setAvatarPictureURLtoFirestore(this.pictureFile);
        else await this.userservice.updateCurrentUserDataOnFirestore({ avatar: this.selectedAvatarNumber, pictureURL: '' });
      }
      this.clickSuccess.emit();
    } catch (error) {
      console.error('Error submitting choose avatar:', error);
    }
  }

}
