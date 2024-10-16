import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  ViewChild,
  Renderer2,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../utils/services/user.service';
import { ActivChat, ChannelService } from '../../utils/services/channel.service';
import { NavigationService } from '../../utils/services/navigation.service';
import { AvatarDirective } from '../../utils/directives/avatar.directive';
import { AddchannelComponent } from '../../chatcontent/workspacemenu/addchannel/addchannel.component';
import { Channel } from '../../shared/models/channel.class';
import { User } from '../../shared/models/user.class';
import { Chat } from '../../shared/models/chat.class';

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
  private renderer = inject(Renderer2);

  navigationChangeSubscription: any;
  addChannelId: HTMLElement | null = null;
  activeChannel: Channel | undefined = this.channelservice.defaultChannel;
  activeUser: User | undefined = undefined;

  @ViewChild(AddchannelComponent) addChannelComponent!: AddchannelComponent;

  /**
   * Subscribes to changes in the navigation service and updates the active channel or user based on the change type.
   *
   * When the 'chatViewObjectSetAsChannel' event is emitted, the active channel is set to the channel object from the navigation service,
   * and the active user is set to undefined.
   *
   * When the 'chatViewObjectSetAsChat' event is emitted, the active user is set to the chat partner from the navigation service,
   * and the active channel is set to undefined.
   */
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

  /**
   * Unsubscribes from the `navigationChangeSubscription` when the component is destroyed.
   * This ensures that the subscription is properly cleaned up and does not cause any memory leaks.
   */
  ngOnDestroy(): void {
    if (this.navigationChangeSubscription) {
      this.navigationChangeSubscription.unsubscribe();
    }
  }

  /**
   * Toggles the details element's open state and adjusts its height accordingly.
   *
   * If the details element is open, the function calculates the height of the content
   * (the `ul` element inside the details) and sets the height of the details element
   * to that value plus an additional 112 pixels.
   *
   * If the details element is closed, the function sets the height of the details
   * element to 2.5 rem.
   *
   * @param details - The details element to toggle.
   */
  toggleDetails(details: HTMLDetailsElement) {
    if (details.open) {
      const content = details.querySelector('ul');
      if (content) {
        const height = content.offsetHeight + 112;
        this.renderer.setStyle(details, 'height', `fit-content`);
      }
    } else {
      this.renderer.setStyle(details, 'height', 'fit-content');
    }
  }

  /**
   * Toggles the visibility of the add channel popover and resets the add channel component.
   * If the add channel popover is not currently visible, it will be shown. If it is visible,
   * it will be hidden and the add channel component will be reset.
   */
  async toggleAddChannelPopover() {
    if (await this.userservice.ifCurrentUserVerified()) {
      this.addChannelId = document.getElementById('addChannelId');
      this.addChannelId?.showPopover();
      this.addChannelComponent.resetAddChannel();
      if (!this.addChannelComponent.toggleAddChannelPopover) {
        this.addChannelComponent.toggleAddChannelPopover =
          !this.addChannelComponent.toggleAddChannelPopover;
      }
    }
  }

  /**
   * Gets the count of unread messages for the specified user.
   *
   * @param user - The user for which to get the unread messages count.
   * @returns The count of unread messages for the user, or an empty string if the count is 0.
   */
  getChatMessagesCount(user: User): string {
    const count = this.channelservice.getChatWithUserByID(user.id)?.unreadMessagesCount;
    return count ? count.toString() : '';
  }

  /**
   * Sets the current chat view to the specified user.
   *
   * @param user - The user to set the chat view to.
   */
  setChat(user: User | Chat) {
    this.navigationService.setChatViewObject(user);
  }

  /**
   * Sets the current chat view to the specified channel.
   *
   * @param channel - The channel to set the chat view to.
   */
  setChannel(channel: Channel) {
    this.navigationService.setChatViewObject(channel);
  }
}
