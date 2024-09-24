import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
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
import { MessagesListViewComponent } from './messages-list-view/messages-list-view.component';
import { UsersService } from '../../utils/services/user.service';
import { MessageGreetingComponent } from './messages-list-view/message-greeting/message-greeting.component';
import { AvatarDirective } from '../../utils/directives/avatar.directive';
import { PopoverMemberProfileComponent } from './popover-chatview/popover-member-profile/popover-member-profile.component';
import { BehaviorSubject } from 'rxjs';

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
    PopoverChannelMemberOverviewComponent,
    MessagesListViewComponent,
    MessageGreetingComponent,
    AvatarDirective,
    PopoverMemberProfileComponent,
  ],
  templateUrl: './chatview.component.html',
  styleUrl: './chatview.component.scss',
})
export class ChatviewComponent implements OnInit {
  @Output() toggleThread = new EventEmitter<void>();

  openThread() {
    console.log('ChatViewComponent: --> toggleThread called');
    this.toggleThread.emit();
  }

  @Input() set currentContext(value: Channel | Chat) {
    this.channelSubject.next(value);
  }

  get currentContext(): Channel | Chat {
    return this.channelSubject.getValue();
  }

  public navigationService = inject(NavigationService);
  public userService = inject(UsersService);
  public isAChannel = false;
  public isAChat = false;
  public isDefaultChannel = true;
  public requiredAvatars: string[] = [];

  memberList = false;
  addMemberPopover = false;

  public channelSubject = new BehaviorSubject<Channel | Chat>(
    this.navigationService.chatViewObject
  );
  channel$ = this.channelSubject.asObservable();

  constructor() {}

  ngOnInit() {
    this.channel$.subscribe(() => {
      this.setContext();
      this.getRequiredAvatars();
    });
  }

  setContext() {
    this.currentContext instanceof Channel && this.currentContext.defaultChannel
      ? (this.isDefaultChannel = true)
      : (this.isDefaultChannel = false);
    this.currentContext instanceof Channel
      ? (this.isAChannel = true)
      : (this.isAChannel = false);
    this.currentContext instanceof Chat
      ? (this.isAChat = true)
      : (this.isAChat = false);
  }

  getTitle(object: Channel | Chat | Message | undefined): string {
    if (object instanceof Channel) return object.name;
    return '';
  }

  getChatPartner(object: Chat | Channel) {
    if (this.currentContext instanceof Chat) {
      const chatPartnerID = object.memberIDs.find(
        (id) => id !== this.userService.currentUser?.id
      );
      if (chatPartnerID) return this.userService.getUserByID(chatPartnerID);
      if (this.isSelfChat())
        return this.userService.getUserByID(object.memberIDs[0]);
    }
    return undefined;
  }

  returnChatPartnerName() {
    const chatPartner = this.currentContext.memberIDs.find(
      (id) => id !== this.userService.currentUser?.id
    );
    if (chatPartner) return this.userService.getUserByID(chatPartner)?.name;
    else
      return `${
        this.userService.getUserByID(this.currentContext.memberIDs[0])?.name
      } (Du)`;
  }

  isSelfChat(): boolean {
    if (
      this.currentContext.memberIDs.length === 2 &&
      this.currentContext.memberIDs[0] === this.currentContext.memberIDs[1]
    )
      return true;
    return false;
  }

  getNumberOfMembers(object: Channel | Chat) {
    if (object instanceof Channel) return object.memberIDs.length;
    return;
  }

  getRequiredAvatars() {
    if (this.currentContext instanceof Channel) {
      this.sortAvatarsArray();
      this.requiredAvatars = this.currentContext.memberIDs.slice(0, 3);
    }
  }

  sortAvatarsArray() {
    if (
      this.currentContext instanceof Channel &&
      this.currentUserIsChannelMember()
    ) {
      let currentUserIndex = this.currentContext.memberIDs.indexOf(
        this.userService.currentUser!.id
      );
      this.currentContext.memberIDs.splice(currentUserIndex, 1);
      this.currentContext.memberIDs.unshift(this.userService.currentUser!.id);
    }
  }

  currentUserIsChannelMember() {
    return (
      this.currentContext instanceof Channel &&
      this.currentContext.memberIDs.includes(this.userService.currentUser!.id)
    );
  }

  getChannelCreatorName(object: Channel | Chat): string {
    if (object instanceof Channel) {
      let channelCreator = this.userService.getUserByID(object.creatorID);
      if (object.creatorID === this.userService.currentUserID) {
        return 'Du hast';
      } else {
        return `${channelCreator!.name} hat`;
      }
    }
    return '';
  }

  getChannelCreationTime(object: Channel | Chat): string {
    if (object instanceof Channel) {
      let channelCreationTime = this.formatDate(object.createdAt);
      return channelCreationTime;
    }
    return '';
  }

  formatDate(date: Date) {
    let formatedMessageDate = date.toLocaleString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (formatedMessageDate == this.isToday()) return 'Heute';
    else {
      return formatedMessageDate;
    }
  }

  isToday() {
    const today = new Date();
    let formatedTodaysDate = today.toLocaleString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return formatedTodaysDate;
  }

  openMemberListPopover(popover: string) {
    this.memberList = false;
    this.addMemberPopover = false;
    popover === 'memberList'
      ? (this.memberList = true)
      : (this.memberList = false);
    popover === 'addMember'
      ? (this.addMemberPopover = true)
      : (this.addMemberPopover = false);
    this.currentContext = this.navigationService.chatViewObject;
  }

  isAllowedToAddMember() {
    if (this.currentContext instanceof Channel) {
      return (
        this.currentContext.creatorID === this.userService.currentUserID ||
        this.currentContext.memberIDs.includes(this.userService.currentUserID)
      );
    }
    return;
  }

  showNoRightToEditInfo() {
    if (!this.isAllowedToAddMember()) {
      return 'Du bist nicht befugt, neue Leute einzuladen.';
    }
    return '';
  }

  setSelectedUserObject(messageCreatorID: string) {
    this.userService.updateSelectedUser(
      this.userService.getUserByID(messageCreatorID)
    );
  }

  returnPopoverTarget(messageCreator: string) {
    if (messageCreator === this.userService.currentUser?.id) {
      return 'profile-popover';
    } else {
      return 'popover-member-profile';
    }
  }
}
