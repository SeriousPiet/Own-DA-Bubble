import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import { User } from '../../shared/models/user.class';
import { ChannelService } from '../../utils/services/channel.service';
import { Channel } from '../../shared/models/channel.class';
import { NavigationService } from '../../utils/services/navigation.service';
import { AvatarDirective } from '../../utils/directives/avatar.directive';
import { AddchannelComponent } from '../../chatcontent/workspacemenu/addchannel/addchannel.component';

@Component({
  selector: 'app-workspacemenu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AvatarDirective,
    AddchannelComponent,
  ],
  templateUrl: './workspacemenu.component.html',
  styleUrl: './workspacemenu.component.scss',
})
export class WorkspacemenuComponent implements OnInit {
  addChannelId: HTMLElement | null = null;
  userCount: number = 0;
  public userservice = inject(UsersService);
  public channelservice = inject(ChannelService);
  public users: User[] = [];
  public channels: Channel[] = [];
  public onlineStatus: string = 'offline';
  public onlineColor: string = '#92c83e';
  public offlineColor: string = '#686868';
  private navigationService = inject(NavigationService);

  @ViewChild(AddchannelComponent) addChannelComponent!: AddchannelComponent;

  ngOnInit(): void {
    this.sortAndArrangeUsers();
  }

  sortAndArrangeUsers(): void {
    const currentUserID = this.userservice.currentUserID;
    const sortedUsers = this.userservice.users.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    const currentUser = sortedUsers.find((user) => user.id === currentUserID);
    const otherUsers = sortedUsers.filter((user) => user.id !== currentUserID);
    if (currentUser) {
      this.users = [currentUser, ...otherUsers];
    } else {
      this.users = otherUsers;
    }
  }

  toggleAddChannelPopover() {
    this.addChannelId = document.getElementById('addChannelId');
    this.addChannelId?.showPopover();
    this.addChannelComponent.resetAddChannel();
    if (!this.addChannelComponent.toggleAddChannelPopover) {
      this.addChannelComponent.toggleAddChannelPopover =
        !this.addChannelComponent.toggleAddChannelPopover;
    }
  }

  setChat(chat: any) {
    this.navigationService.setChatViewObject(chat);
  }
}
