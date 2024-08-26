import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
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
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { MessagesListViewComponent } from './messages-list-view/messages-list-view.component';
import { UsersService } from '../../utils/services/user.service';
import { MessageGreetingComponent } from './messages-list-view/message-greeting/message-greeting.component';


@Component({
  selector: 'app-chatview',
  standalone: true,
  imports: [CommonModule,
    MessageDateComponent,
    MessageComponent,
    MessageTextareaComponent,
    PopoverChannelEditorComponent,
    PopoverChannelMemberOverviewComponent,
    MessagesListViewComponent,
    MessageGreetingComponent
  ],
  templateUrl: './chatview.component.html',
  styleUrl: './chatview.component.scss',
})
export class ChatviewComponent implements OnInit {


  private firestore = inject(Firestore);
  public navigationService = inject(NavigationService);
  private userService = inject(UsersService)
  public isAChannel = false;
  public isAChat = false;
  public isDefaultChannel = true;


  @Input() set currentChannel (object: Channel | Chat){
    object instanceof Channel && object.defaultChannel ? this.isDefaultChannel = true : this.isDefaultChannel = false;
    if (object instanceof Channel) console.log(object.defaultChannel);
  }

  constructor(private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.setObjectType();
  }

  setObjectType() {
    if (this.currentChannel instanceof Channel) this.isAChannel = true;
    if (this.currentChannel instanceof Chat) this.isAChat = true;
  }


  getTitle(object: Channel | Chat | Message | undefined): string {
    if (object instanceof Channel) return object.name;
    // if (object instanceof Message) return 'Thread from ' + this.userservice.getUserByID(object.creatorID)?.name;
    // if (object instanceof Chat) return 'Chat with ' + this.getChatPartner(object);
    return '';
  }

  getNumberOfMembers(object: Channel | Chat | Message | undefined) {
    if (object instanceof Channel) return object.members.length;
    return
  }

  renderChannelMembersAvatar(object: Channel | Chat | Message | undefined) {
    if (object instanceof Channel && object.members.length <= 3) {
      object.members.forEach(memberID => {
        return this.userService.getUserByID(memberID)?.avatar
      });
    }
    else if (object instanceof Channel) {
      this.renderOnlyFirstThreeAvatars(object)
    }
  }

  renderOnlyFirstThreeAvatars(object: Channel) {
    const maxAvatarsCount = 3;
    const maxAvatars = object.members.slice(0, maxAvatarsCount)
    maxAvatars.forEach(memberID => {
      return this.userService.getUserByID(memberID)?.avatar
    });
  }




}
