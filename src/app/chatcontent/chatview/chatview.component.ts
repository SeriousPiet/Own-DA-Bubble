import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges } from '@angular/core';
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
import { AvatarDirective } from '../../utils/directives/avatar.directive';
import { PopoverMemberProfileComponent } from "./popover-chatview/popover-member-profile/popover-member-profile.component";
import { User } from '../../shared/models/user.class';
import { BehaviorSubject, filter } from 'rxjs';


@Component({
  selector: 'app-chatview',
  standalone: true,
  imports: [CommonModule,
    MessageDateComponent,
    MessageComponent,
    MessageTextareaComponent,
    PopoverChannelEditorComponent,
    PopoverChannelMemberOverviewComponent,
    PopoverChannelMemberOverviewComponent,
    MessagesListViewComponent,
    MessageGreetingComponent,
    AvatarDirective, PopoverMemberProfileComponent],
  templateUrl: './chatview.component.html',
  styleUrl: './chatview.component.scss',
})
export class ChatviewComponent implements OnInit {


  private firestore = inject(Firestore);
  public navigationService = inject(NavigationService);
  public userService = inject(UsersService)
  public isAChannel = false;
  public isAChat = false;
  public isDefaultChannel = true;
  public requiredAvatars: string[] = []

  memberList = false;
  addMemberPopover = false;

  public channelSubject = new BehaviorSubject<Channel | Chat | null>(null);
channel$ = this.channelSubject.asObservable();

@Input() set currentChannel(value: Channel | Chat) {
  this.channelSubject.next(value);
}

get currentChannel(): Channel {
  return this.channelSubject.getValue() as Channel;
}

  ngOnInit() {
    this.channel$.pipe(
      filter(channel => !!channel)
    ).subscribe(channel => {
      this.currentChannel instanceof Channel && this.currentChannel.defaultChannel ? this.isDefaultChannel = true : this.isDefaultChannel = false;
      this.setObjectType();
      this.getRequiredAvatars();
    });
  }

  constructor(private cdr: ChangeDetectorRef) {
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

  getNumberOfMembers(object: Channel | Chat) {
    if (object instanceof Channel) return object.memberIDs.length;
    return
  }


  getRequiredAvatars() {
    if (this.currentChannel instanceof Channel) {
      this.requiredAvatars = this.currentChannel.memberIDs.slice(0, 3);
    }
  }

  renderChannelMembersAvatar(object: Channel | Chat | Message | undefined) {
    if (object instanceof Channel && object.memberIDs.length <= 3) {
      object.memberIDs.forEach(memberID => {
        return this.userService.getUserByID(memberID)?.avatar
      });
    }
    else if (object instanceof Channel) {
      this.renderOnlyFirstThreeAvatars(object)
    }
  }

  renderOnlyFirstThreeAvatars(object: Channel) {
    const maxAvatarsCount = 3;
    const maxAvatars = object.memberIDs.slice(0, maxAvatarsCount)
    maxAvatars.forEach(memberID => {
      return this.userService.getUserByID(memberID)?.avatar
    });
  }

  getChannelCreatorName(object: Channel | Chat): string {
    if (object instanceof Channel) {
      let channelCreator = this.userService.getUserByID(object.creatorID);
      if (object.creatorID === this.userService.currentUserID) {
        return 'Du hast'
      } else {
        return `${channelCreator!.name} hat`
      }
    }
    return '';
  }

  getChannelCreationTime(object: Channel | Chat): string {
    if (object instanceof Channel) {
      let channelCreationTime = this.formatDate(object.createdAt);
      return channelCreationTime
    }
    return '';
  }


  formatDate(date: Date) {
    let formatedMessageDate = date.toLocaleString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    if (formatedMessageDate == this.isToday()) return "Heute";
    else {
      return formatedMessageDate;
    }
  }

  isToday() {
    const today = new Date();
    let formatedTodaysDate = today.toLocaleString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    return formatedTodaysDate;
  }


  openMemberListPopover(popover: string) {
    this.memberList = false;
    this.addMemberPopover = false;
    popover === 'memberList' ? this.memberList = true : this.memberList = false;
    popover === 'addMember' ? this.addMemberPopover = true : this.addMemberPopover = false;
  }


  openAddNewMemberPopover() {
    this.addMemberPopover = true;
    this.memberList = false;
  }

  isAllowedToAddMember() {
    if (this.currentChannel instanceof Channel) {
      return this.currentChannel.creatorID === this.userService.currentUserID &&
        this.currentChannel.memberIDs.includes(this.userService.currentUserID)
    }
    return
  }

  showNoRightToEditInfo() {
    if (!this.isAllowedToAddMember()) {
      return 'Du bist nicht befugt, neue Leute einzuladen.'
    }
    return ''
  }









}