import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import { ChannelService } from '../../utils/services/channel.service';
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
export class WorkspacemenuComponent {
  addChannelId: HTMLElement | null = null;
  activeChannel: any = null;
  activeUser: any = null;
  public userservice = inject(UsersService);
  public channelservice = inject(ChannelService);
  private navigationService = inject(NavigationService);

  @ViewChild(AddchannelComponent) addChannelComponent!: AddchannelComponent;

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
