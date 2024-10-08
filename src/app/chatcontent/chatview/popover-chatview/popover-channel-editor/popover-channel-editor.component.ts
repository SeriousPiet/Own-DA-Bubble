import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Channel } from '../../../../shared/models/channel.class';
import { Chat } from '../../../../shared/models/chat.class';
import { NavigationService } from '../../../../utils/services/navigation.service';
import { UsersService } from '../../../../utils/services/user.service';
import { ChannelService } from '../../../../utils/services/channel.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AvatarDirective } from '../../../../utils/directives/avatar.directive';
import { User } from '../../../../shared/models/user.class';
import { PopoverChannelMemberOverviewComponent } from "../popover-channel-member-overview/popover-channel-member-overview.component";
import { SearchService, SearchSuggestion } from '../../../../utils/services/search.service';

@Component({
  selector: 'app-popover-channel-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarDirective, PopoverChannelMemberOverviewComponent],
  templateUrl: './popover-channel-editor.component.html',
  styleUrl: './popover-channel-editor.component.scss',
})
export class PopoverChannelEditorComponent implements OnInit, OnDestroy {
  navigationService = inject(NavigationService);
  userService = inject(UsersService);
  channelService = inject(ChannelService);
  searchService = inject(SearchService);


  showProfileDetails = false;
  isUserSearchSelected = true;
  userAmount: number = 0;
  selectedUsers: User[] = [];
  searchQuery: string = '';
  suggestions$!: Observable<{ text: string; type: string }[]>;
  isDropdownVisible = false;
  isAnyOptionSelected = false;



  @Input() set currentChannel(value: Channel | Chat) {
    this.channelSubject.next(value);
  }

  get currentChannel(): Channel {
    return this.channelSubject.getValue() as Channel;
  }

  @Output() updatedChannel = new EventEmitter<Channel>();

  channelNameEditor = false;
  channelDescriptionEditor = false;

  updateChannelData: {
    name?: string;
    description?: string;
    memberIDs?: string[];
  } = {};

  selfInMemberList: string = '';

  public channelSubject = new BehaviorSubject<Channel | Chat>(
    this.navigationService.chatViewObject
  );
  channel$ = this.channelSubject.asObservable();

  constructor() {}

  ngOnInit() {
    this.subscribeToChannel();
  }

  subscribeToChannel() {
    this.channel$.subscribe((channel) => {
      this.updateChannelDatas();
      this.selfInMemberList = channel.memberIDs.find(
        (memberID: string) => memberID === this.userService.currentUserID
      ) as string;
    });
  }

  updateChannelDatas() {
    if (this.currentChannel instanceof Channel) {
      this.updateChannelData.name = this.currentChannel.name;
      this.updateChannelData.description = this.currentChannel.description;
      this.updateChannelData.memberIDs = this.currentChannel.memberIDs;
    }
  }

  getTitle(object: Channel | Chat): string {
    if (object instanceof Channel) return object.name;
    // if (object instanceof Message) return 'Thread from ' + this.userservice.getUserByID(object.creatorID)?.name;
    // if (object instanceof Chat) return 'Chat with ' + this.getChatPartner(object);
    return '';
  }

  getDescription(object: Channel | Chat): string {
    if (object instanceof Channel) return object.description;
    // if (object instanceof Message) return 'Thread from ' + this.userservice.getUserByID(object.creatorID)?.name;
    // if (object instanceof Chat) return 'Chat with ' + this.getChatPartner(object);
    return '';
  }

  getChannelCreator(object: Channel | Chat) {
    if (object instanceof Channel)
      return this.userService.getUserByID(object.creatorID)?.name;
    return '';
  }

  closeChannelInfoPopover() {
    this.channelNameEditor = false;
    this.channelDescriptionEditor = false;
  }

  showChannelNameEditor() {
    this.channelNameEditor = true;
  }

  showChannelDescriptionEditor() {
    this.channelDescriptionEditor = true;
  }

  saveEditedChannel() {
    this.channelNameEditor = false;
    this.channelDescriptionEditor = false;
    if (this.navigationService.chatViewObject instanceof Channel) {
      this.channelService.updateChannelOnFirestore(
        this.navigationService.chatViewObject,
        this.updateChannelData
      );
    }
}

  isChannelCreator() {
    if (this.currentChannel instanceof Channel)
      return this.currentChannel.creatorID === this.userService.currentUserID;
    return;
  }

  showNoRightToEditInfo() {
    if (!this.isChannelCreator()) {
      return 'Du hast kein Recht diesen Kanal zu bearbeiten.';
    }
    return '';
  }

  isChannelMember() {
    this.selfInMemberList = this.currentChannel.memberIDs.find(
      (memberID: string) => memberID === this.userService.currentUserID
    ) as string;
    return this.selfInMemberList === this.userService.currentUserID;
  }

  leaveChannel() {
    let selfInMemberListIndex = this.currentChannel.memberIDs.indexOf(
      this.selfInMemberList
    );
    if (this.isChannelMember() && this.currentChannel instanceof Channel) {
      this.currentChannel.memberIDs.splice(selfInMemberListIndex, 1);
      this.updateChannelData.memberIDs = this.currentChannel.memberIDs;
      this.channelService.updateChannelOnFirestore(
        this.currentChannel,
        this.updateChannelData
      );
      this.updatedChannel.emit(this.currentChannel);
      this.channelSubject.next(this.currentChannel);
    }
  }

  checkifUserIsGuest(memberID: string) {
    const member = this.userService.getUserByID(memberID);
    return member?.guest;
  }

  setSelectedUserObject(messageCreatorID: string) {
    this.userService.updateSelectedUser(this.userService.getUserByID(messageCreatorID));
    this.navigationService.setProfileTarget(true);
  }

  isAllowedToAddMember() {
    if (this.currentChannel instanceof Channel) {
      return this.currentChannel.creatorID === this.userService.currentUserID ||
        this.currentChannel.memberIDs.includes(this.userService.currentUserID)
    }
    return;
  }

  returnPopoverTarget(messageCreator: string) {
    if (messageCreator === this.userService.currentUser?.id) {
      return 'profile-popover';
    } else {
      return 'popover-member-profile';
    }
  }

  getMemberName(memberID: string) {
    const member = this.userService.getUserByID(memberID);
    return member?.id === this.userService.currentUser?.id
      ? `${member?.name} (Du)`
      : member?.name;
  }

  ngOnDestroy() {
    this.channelSubject.unsubscribe();
  }


resetAddmembers() {
  this.selectedUsers = [];
  this.userAmount = 0;
}


removeUserFromSelection(user: User) {
  this.selectedUsers = this.selectedUsers.filter((u) => u.id !== user.id);
  if (user.id!) {
    this.userAmount--;
  }
}

onFocus() {
  this.isDropdownVisible = true;
  if (this.searchQuery) {
    this.onSearchInput();
  }
}

onSearchInput() {
  this.searchService.updateSearchQuery(this.searchQuery);
  this.suggestions$ = this.searchService.getSearchSuggestions().pipe(
    map((groupedResults) => {
      return [
        ...groupedResults.users,
        ...groupedResults.channels,
        ...groupedResults.messages,
      ];
    })
  );
}

onBlur() {
  setTimeout(() => {
    this.isDropdownVisible = false;
    this.searchQuery = '';
    this.searchService.updateSearchQuery('');
  }, 200);
}

addOptionSelected(isUserSearchSelected: boolean) {
  this.isUserSearchSelected = isUserSearchSelected;
  this.isAnyOptionSelected = true;
}

selectSuggestion(suggestion: SearchSuggestion) {
  if (suggestion.type === 'user') {
    const userName = suggestion.text.slice(1);
    const user = this.findUserByName(userName);
    if (user) {
      this.addUserToSelection(user);
    }
    this.isDropdownVisible = false;
  }
}

public findUserByName(name: string): User | undefined {
  const userIds = this.userService.getAllUserIDs();
  for (const id of userIds) {
    const user = this.userService.getUserByID(id);
    if (user && user.name === name) {
      return user;
    }
  }
  return undefined;
}

addUserToSelection(user: User) {
  if (!this.selectedUsers.some((u) => u.id === user.id)) {
    if (!this.currentChannel.memberIDs.includes(user.id)) {
      this.selectedUsers.push(user);
      this.userAmount++;
    }
  }
}

public getUserFromSuggestion(
  suggestion: string | { text: string; type: string }
): User | undefined {
  let userName: string;
  if (typeof suggestion === 'string') {
    userName = suggestion.startsWith('@') ? suggestion.slice(1) : suggestion;
  } else {
    userName = suggestion.type === 'user' ? suggestion.text.slice(1) : '';
  }
  return this.findUserByName(userName);
}

addSelectedUserToChannel() {
  this.selectedUsers.forEach((user) => {
    this.currentChannel.memberIDs.push(user.id);
  });
  this.channelSubject.next(this.currentChannel);
  this.updatedChannel.emit(this.currentChannel);
  this.channelService.updateChannelOnFirestore(
    this.currentChannel as Channel,
    this.updateChannelData
  );
  
  this.resetAddmembers();
  document.getElementById('channel-member-overview-popover')!.hidePopover();
}




}