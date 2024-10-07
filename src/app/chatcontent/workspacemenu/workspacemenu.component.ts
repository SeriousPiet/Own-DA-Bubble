import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  Renderer2,
  OnInit,
  OnDestroy,
} from '@angular/core';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import { ChannelService } from '../../utils/services/channel.service';
import { NavigationService } from '../../utils/services/navigation.service';
import { AvatarDirective } from '../../utils/directives/avatar.directive';
import { AddchannelComponent } from '../../chatcontent/workspacemenu/addchannel/addchannel.component';
import { Channel } from '../../shared/models/channel.class';
import { User } from '../../shared/models/user.class';

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
export class WorkspacemenuComponent implements OnInit, OnDestroy {
  public userservice = inject(UsersService);
  public channelservice = inject(ChannelService);
  private navigationService = inject(NavigationService);

  navigationChangeSubscription: any;
  addChannelId: HTMLElement | null = null;
  activeChannel: Channel | undefined = this.channelservice.defaultChannel;
  activeUser: User | undefined = undefined;

  @ViewChild(AddchannelComponent) addChannelComponent!: AddchannelComponent;

  ngOnInit(): void {
    this.navigationChangeSubscription =
      this.navigationService.change$.subscribe((type) => {
        if (type === 'chatViewObjectSetAsChannel') {
          this.activeChannel = this.navigationService.chatViewObject as Channel;
          this.activeUser = undefined;
        } else if (type === 'chatViewObjectSetAsChat') {
          this.activeUser = this.navigationService.getChatPartnerAsUser();
          this.activeChannel = undefined;
        }
      });
  }

  ngOnDestroy(): void {
    if (this.navigationChangeSubscription) {
      this.navigationChangeSubscription.unsubscribe();
    }
  }

  private renderer = inject(Renderer2);

  toggleDetails(details: HTMLDetailsElement) {
    if (details.open) {
      const content = details.querySelector('ul');
      if (content) {
        const height = content.offsetHeight + 112;
        this.renderer.setStyle(details, 'height', `${height}px`);
      }
    } else {
      this.renderer.setStyle(details, 'height', '2.5rem');
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

  setChat(user: User) {
    this.navigationService.setChatViewObject(user);
    // this.activeChannel = null;
    // this.activeUser = user;
  }

  setChannel(channel: Channel) {
    this.navigationService.setChatViewObject(channel);
    // this.activeChannel = channel;
    // this.activeUser = null
  }
}
