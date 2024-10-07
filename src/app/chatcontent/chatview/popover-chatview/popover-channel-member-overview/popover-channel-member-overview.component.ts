import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Channel } from '../../../../shared/models/channel.class';
import { Chat } from '../../../../shared/models/chat.class';
import { UsersService } from '../../../../utils/services/user.service';
import { AvatarDirective } from '../../../../utils/directives/avatar.directive';
import { CommonModule } from '@angular/common';
import { Message } from '../../../../shared/models/message.class';
import { NavigationService } from '../../../../utils/services/navigation.service';
import { User } from '../../../../shared/models/user.class';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../../../utils/services/search.service';
import { SearchSuggestion } from '../../../../utils/services/search.service';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { ChannelService } from '../../../../utils/services/channel.service';

@Component({
  selector: 'app-popover-channel-member-overview',
  standalone: true,
  imports: [AvatarDirective, CommonModule, FormsModule, AvatarDirective],
  templateUrl: './popover-channel-member-overview.component.html',
  styleUrl: './popover-channel-member-overview.component.scss',
})
export class PopoverChannelMemberOverviewComponent implements OnInit, OnDestroy {
  userService = inject(UsersService);
  channelService = inject(ChannelService);
  navigationService = inject(NavigationService);

  showProfileDetails = false;
  isUserSearchSelected = true;
  userAmount: number = 0;
  selectedUsers: User[] = [];
  searchQuery: string = '';
  suggestions$!: Observable<{ text: string; type: string }[]>;
  isDropdownVisible = false;
  isAnyOptionSelected = false;

  updateChannelData: {
    name?: string;
    description?: string;
    memberIDs?: string[];
  } = {};

  @Input() isCurrentMember: boolean = false;

  @Input() memberList!: boolean;
  @Input() addMemberPopover!: boolean;


  @Output() memberListChange = new EventEmitter<boolean>();
  @Output() addMemberPopoverChange = new EventEmitter<boolean>();
  @Output() updatedChannel = new EventEmitter<Channel>();


  public channelSubject = new BehaviorSubject<Channel | Chat | null>(null);
  channel$ = this.channelSubject.asObservable();

  @Input() set currentChannel(value: Channel | Chat) {
    this.channelSubject.next(value);
  }

  get currentChannel(): Channel {
    return this.channelSubject.getValue() as Channel;
  }

  constructor(private searchService: SearchService) { }

  ngOnInit() {
    this.subscribeToChannel();
  }

  subscribeToChannel() {
    this.channel$.subscribe(() => {
      this.updateChannelDatas();
    });
  }

  updateChannelDatas() {
    if (this.currentChannel instanceof Channel) {
      this.updateChannelData.name = this.currentChannel.name;
      this.updateChannelData.description = this.currentChannel.description;
      this.updateChannelData.memberIDs = this.currentChannel.memberIDs;
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

  getMemberName(memberID: string) {
    const member = this.userService.getUserByID(memberID);
    return member?.id === this.userService.currentUser?.id
      ? `${member?.name} (Du)`
      : member?.name;
  }

  currentUserIsChannelMember() {
    return (
      this.currentChannel instanceof Channel &&
      this.currentChannel.memberIDs.includes(this.userService.currentUser!.id)
    );
  }

  returnPopoverTarget(messageCreator: string) {
    if (messageCreator === this.userService.currentUser?.id) {
      return 'profile-popover';
    } else {
      return 'popover-member-profile';
    }
  }

  setSelectedUserObject(messageCreatorID: string) {
    this.userService.updateSelectedUser(this.userService.getUserByID(messageCreatorID));
    this.navigationService.setProfileTarget(true);
  }

  getTitle(object: Channel | Chat | Message | undefined): string {
    if (object instanceof Channel) return object.name;
    return '';
  }

  openAddNewMemberPopover() {
    this.addMemberPopover = true;
    this.memberList = false;
    this.memberListChange.emit(this.memberList);
    this.addMemberPopoverChange.emit(this.addMemberPopover);
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

  onFocus() {
    this.isDropdownVisible = true;
    if (this.searchQuery) {
      this.onSearchInput();
    }
  }

  onBlur() {
    setTimeout(() => {
      this.isDropdownVisible = false;
      this.searchQuery = '';
      this.searchService.updateSearchQuery('');
    }, 200);
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

  removeUserFromSelection(user: User) {
    this.selectedUsers = this.selectedUsers.filter((u) => u.id !== user.id);
    if (user.id!) {
      this.userAmount--;
    }
  }

  addOptionSelected(isUserSearchSelected: boolean) {
    this.isUserSearchSelected = isUserSearchSelected;
    this.isAnyOptionSelected = true;
  }

  resetAddmembers() {
    this.selectedUsers = [];
    this.userAmount = 0;
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

  isAllowedToAddMember() {
    if (this.currentChannel instanceof Channel) {
      return this.currentChannel.creatorID === this.userService.currentUserID ||
        this.currentChannel.memberIDs.includes(this.userService.currentUserID)
    }
    return;
  }

  showNoRightToEditInfo() {
    if (!this.isAllowedToAddMember()) {
      return 'Du bist nicht befugt, neue Leute hinzuzufügen.'
    }
    return '';
  }

  ngOnDestroy() {
    this.subscribeToChannel();
  }

  checkifUserIsGuest(memberID: string) {
    const member = this.userService.getUserByID(memberID);
    return member?.guest;
  }

}