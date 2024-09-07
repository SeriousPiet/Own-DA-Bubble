import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { MessageDateComponent } from './messages-list-view/message-date/message-date.component';
import { MessageTextareaComponent } from '../message-textarea/message-textarea.component';
import { CommonModule } from '@angular/common';
import { MessageComponent } from './messages-list-view/message/message.component';
import { PopoverChannelEditorComponent } from './popover-chatview/popover-channel-editor/popover-channel-editor.component';
import { PopoverChannelMemberOverviewComponent } from './popover-chatview/popover-channel-member-overview/popover-channel-member-overview.component';
import { NavigationService } from '../../utils/services/navigation.service';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { Message } from '../../shared/models/message.class';
import { ChannelService } from '../../utils/services/channel.service';
import { Firestore } from '@angular/fire/firestore';
import { MessagesListViewComponent } from './messages-list-view/messages-list-view.component';
import { UsersService } from '../../utils/services/user.service';
import { MessageGreetingComponent } from './messages-list-view/message-greeting/message-greeting.component';
import { AvatarDirective } from '../../utils/directives/avatar.directive';

@Component({
  selector: 'app-chatview',
  standalone: true,
  imports: [
    CommonModule,
    MessageDateComponent,
    MessageComponent,
    MessageTextareaComponent,
    PopoverChannelEditorComponent,
    PopoverChannelMemberOverviewComponent,
    MessagesListViewComponent,
    MessageGreetingComponent,
    AvatarDirective,
  ],
  templateUrl: './chatview.component.html',
  styleUrl: './chatview.component.scss',
})
export class ChatviewComponent implements OnChanges {
  private firestore = inject(Firestore);
  public navigationService = inject(NavigationService);
  public userService = inject(UsersService);
  public isAChannel = false;
  public isAChat = false;
  public isDefaultChannel = true;
  public requiredAvatars: string[] = [];

  @Input() currentChannel!: Channel | Chat;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentChannel']) {
      this.currentChannel = changes['currentChannel'].currentValue;
      this.currentChannel instanceof Channel &&
      this.currentChannel.defaultChannel
        ? (this.isDefaultChannel = true)
        : (this.isDefaultChannel = false);
      this.setObjectType();
      this.getRequiredAvatars();
      console.log(this.currentChannel);
    }
  }

  constructor(private cdr: ChangeDetectorRef) {}

  setObjectType() {
    if (this.currentChannel instanceof Channel) this.isAChannel = true;
    if (this.currentChannel instanceof Chat) this.isAChat = true;
  }

  getTitle(object: Channel | Chat | Message | undefined): string {
    if (object instanceof Channel) return object.name;
    return '';
  }

  getNumberOfMembers(object: Channel | Chat) {
    if (object instanceof Channel) return object.memberIDs.length;
    return;
  }

  getRequiredAvatars() {
    if (this.currentChannel instanceof Channel) {
      this.requiredAvatars = this.currentChannel.memberIDs.slice(0, 3);
    }
  }

  renderChannelMembersAvatar(object: Channel | Chat | Message | undefined) {
    if (object instanceof Channel && object.memberIDs.length <= 3) {
      object.memberIDs.forEach((memberID) => {
        return this.userService.getUserByID(memberID)?.avatar;
      });
    } else if (object instanceof Channel) {
      this.renderOnlyFirstThreeAvatars(object);
    }
  }

  renderOnlyFirstThreeAvatars(object: Channel) {
    const maxAvatarsCount = 3;
    const maxAvatars = object.memberIDs.slice(0, maxAvatarsCount);
    maxAvatars.forEach((memberID) => {
      return this.userService.getUserByID(memberID)?.avatar;
    });
  }
}
