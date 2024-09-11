import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  viewChild,
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

import { GroupedSearchResults } from '../../../../utils/services/search.service';

import { map, Observable } from 'rxjs';
import { ChannelService } from '../../../../utils/services/channel.service';

@Component({
  selector: 'app-popover-channel-member-overview',
  standalone: true,
  imports: [AvatarDirective, CommonModule, FormsModule, AvatarDirective],
  templateUrl: './popover-channel-member-overview.component.html',
  styleUrl: './popover-channel-member-overview.component.scss',
})
export class PopoverChannelMemberOverviewComponent implements OnChanges {
  userService = inject(UsersService);
  channelService = inject(ChannelService);
  navigationService = inject(NavigationService);

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

  @Input() currentChannel!: Channel | Chat;
  @Input() isCurrentMember: boolean = false;

  @Input() memberList!: boolean;
  @Input() addMemberPopover!: boolean;

  @Output() memberListChange = new EventEmitter<boolean>();
  @Output() addMemberPopoverChange = new EventEmitter<boolean>();
  @Output() updatedChannel = new EventEmitter<Channel>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentChannel']) {
      this.currentChannel = changes['currentChannel'].currentValue;
      this.sortMembersArray();
      if (this.currentChannel instanceof Channel) {
        this.updateChannelData.name = this.currentChannel.name;
        this.updateChannelData.description = this.currentChannel.description;
        this.updateChannelData.memberIDs = this.currentChannel.memberIDs;
      }
    }
    if (changes['memberList'])
      this.memberList = changes['memberList'].currentValue;
    if (changes['addMemberPopover'])
      this.addMemberPopover = changes['addMemberPopover'].currentValue;
  }

  constructor(
    private searchService: SearchService,
    private usersService: UsersService
  ) {}

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

  sortMembersArray() {
    if (
      this.currentChannel instanceof Channel &&
      this.currentUserIsChannelMember()
    ) {
      let currentUserIndex = this.currentChannel.memberIDs.indexOf(
        this.userService.currentUser!.id
      );
      this.currentChannel.memberIDs.splice(currentUserIndex, 1);
      this.currentChannel.memberIDs.unshift(this.userService.currentUser!.id);
    }
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
    console.log(messageCreatorID);
    this.userService.updateSelectedUser(
      this.userService.getUserByID(messageCreatorID)
    );
  }

  getTitle(object: Channel | Chat | Message | undefined): string {
    if (object instanceof Channel) return object.name;
    // if (object instanceof Message) return 'Thread from ' + this.userservice.getUserByID(object.creatorID)?.name;
    // if (object instanceof Chat) return 'Chat with ' + this.getChatPartner(object);
    return '';
  }

  openAddNewMemberPopover() {
    this.addMemberPopover = true;
    this.memberList = false;
    this.memberListChange.emit(this.memberList);
    this.addMemberPopoverChange.emit(this.addMemberPopover);
  }

  onSearchInput() {
    this.suggestions$ = this.searchService.getSearchSuggestions().pipe(
      map((groupedResults: GroupedSearchResults) => {
        return groupedResults.users.filter((suggestion) =>
          suggestion.text.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
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
    }
    this.isDropdownVisible = false;
    this.searchService.addRecentSearch(suggestion);
    this.userAmount++;
  }

  public findUserByName(name: string): User | undefined {
    const userIds = this.usersService.getAllUserIDs();
    for (const id of userIds) {
      const user = this.usersService.getUserByID(id);
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
    this.channelService.updateChannelOnFirestore(
      this.currentChannel as Channel,
      this.updateChannelData
    );
    this.resetAddmembers();
    document.getElementById('channel-member-overview-popover')!.hidePopover();
    if (this.currentChannel instanceof Channel)
      this.updatedChannel.emit(this.currentChannel);
  }

  isAllowedToAddMember() {
    if (this.currentChannel instanceof Channel) {
      return (
        this.currentChannel.creatorID === this.userService.currentUserID ||
        this.currentChannel.memberIDs.includes(this.userService.currentUserID)
      );
    }
    return;
  }

  showNoRightToEditInfo() {
    if (!this.isAllowedToAddMember()) {
      return 'Du bist nicht befugt, neue Leute hinzuzufügen.';
    }
    return '';
  }
}
