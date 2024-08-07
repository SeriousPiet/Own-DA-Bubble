import { Component } from '@angular/core';

@Component({
  selector: 'app-chooesavatar',
  standalone: true,
  imports: [],
  templateUrl: './chooesavatar.component.html',
  styleUrl: './chooesavatar.component.scss'
})
export class ChooesavatarComponent {

  avatarPath = '../../../assets/icons/start/choose-avatar/ ';
  avatarList = [
    { id: '1', img_name: 'choose-avatar-1.svg' },
    { id: '2', img_name: 'choose-avatar-2.svg' },
    { id: '3', img_name: 'choose-avatar-3.svg' },
    { id: '4', img_name: 'choose-avatar-4.svg' },
    { id: '5', img_name: 'choose-avatar-5.svg' },
    { id: '6', img_name: 'choose-avatar-6.svg' },
  ]

}
