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

  /**
   * Subscribes to the `channel$` observable and updates the `updateChannelData` object with the current channel's name, description, and member IDs. It also sets the `selfInMemberList` property to the current user's ID if it is found in the channel's member IDs.
   */
  subscribeToChannel() {
    this.channel$.subscribe((channel) => {
      this.updateChannelDatas();
      this.selfInMemberList = channel.memberIDs.find(
        (memberID: string) => memberID === this.userService.currentUserID
      ) as string;
    });
  }

  /**
   * Updates the `updateChannelData` object with the current channel's name, description, and member IDs.
   * This method is called when the `channelSubject` observable emits a new value.
   */
  updateChannelDatas() {
    if (this.currentChannel instanceof Channel) {
      this.updateChannelData.name = this.currentChannel.name;
      this.updateChannelData.description = this.currentChannel.description;
      this.updateChannelData.memberIDs = this.currentChannel.memberIDs;
    }
  }

  /**
   * Gets the title of the currentChannel.
   * @param object The currentChannel the title for.
   * @returns The title of the object as a string.
   */
  getTitle(currentChannel: Channel | Chat): string {
    if (currentChannel instanceof Channel) return currentChannel.name;
    return '';
  }

  /**
   * Gets the description of the currentChannel.
   * @param object The currentChannel to get the description for.
   * @returns The description of the object as a string.
   */
  getDescription(currentChannel: Channel | Chat): string {
    if (currentChannel instanceof Channel) return currentChannel.description;
    return '';
  }

  /**
   * Gets the name of of the currentChannel.
   * @param object The currentChannel to get the creator's name for.
   * @returns The name of the creator of the object as a string.
   */
  getChannelCreator(currentChannel: Channel | Chat) {
    if (currentChannel instanceof Channel)
      return this.userService.getUserByID(currentChannel.creatorID)?.name;
    return '';
  }

  /**
   * Closes the channel info popover by setting the `channelNameEditor` and `channelDescriptionEditor` properties to `false`.
   */
  closeChannelInfoPopover() {
    this.channelNameEditor = false;
    this.channelDescriptionEditor = false;
  }

  /**
   * Shows the channel name editor by setting the `channelNameEditor` property to `true`.
   */
  showChannelNameEditor() {
    this.channelNameEditor = true;
  }

  /**
   * Shows the channel description editor by setting the `channelDescriptionEditor` property to `true`.
   */
  showChannelDescriptionEditor() {
    this.channelDescriptionEditor = true;
  }

  /**
   * Saves the edited channel information and closes the channel name and description editors.
   * If the current chat view object is a Channel, this method updates the channel data on Firestore
   * using the `updateChannelOnFirestore` method of the `channelService`.
   */
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

  /**
   * Checks if the current user is the creator of the current channel.
   * @returns `true` if the current user is the creator of the current channel, `false` otherwise. If the current channel is not an instance of `Channel`, returns `undefined`.
   */
  isChannelCreator() {
    if (this.currentChannel instanceof Channel)
      return this.currentChannel.creatorID === this.userService.currentUserID;
    return;
  }

  /**
   * Checks if the current user has the right to edit the current channel.
   * @returns A string message indicating that the user does not have the right to edit the channel, or an empty string if the user is the channel creator.
   */
  showNoRightToEditInfo() {
    if (!this.isChannelCreator()) {
      return 'Du hast kein Recht diesen Kanal zu bearbeiten.';
    }
    return '';
  }

  /**
   * Checks if the current user is a member of the current channel.
   * @returns `true` if the current user is a member of the current channel, `false` otherwise.
   */
  isChannelMember() {
    this.selfInMemberList = this.currentChannel.memberIDs.find(
      (memberID: string) => memberID === this.userService.currentUserID
    ) as string;
    return this.selfInMemberList === this.userService.currentUserID;
  }

  /**
   * Removes the current user from the member list of the current channel and updates the channel data on Firestore.
   * This method first checks if the current user is a member of the current channel. If so, it removes the user's ID from the `memberIDs` array of the channel, updates the `updateChannelData` object with the new `memberIDs` array, and then calls the `updateChannelOnFirestore` method of the `channelService` to update the channel data on Firestore. Finally, it emits the updated channel object and publishes it to the `channelSubject`.
   */
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

  /**
   * Checks if the specified user is a guest.
   * @param memberID - The ID of the user to check.
   * @returns `true` if the user is a guest, `false` otherwise.
   */
  checkifUserIsGuest(memberID: string) {
    const member = this.userService.getUserByID(memberID);
    return member?.guest;
  }

  /**
   * Sets the selected user object and updates the navigation service to target the profile.
   * @param messageCreatorID - The ID of the message creator to set as the selected user.
   */
  setSelectedUserObject(messageCreatorID: string) {
    this.userService.updateSelectedUser(this.userService.getUserByID(messageCreatorID));
    this.navigationService.setProfileTarget(true);
  }

  /**
   * Checks if the current user is allowed to add members to the current channel.
   * This method first checks if the `currentChannel` is an instance of the `Channel` class. If so, it returns `true` if the current user is either the creator of the channel or is already a member of the channel. Otherwise, it returns `undefined`.
   *
   * @returns `true` if the current user is allowed to add members to the current channel, `false` if the current user is not allowed, or `undefined` if the `currentChannel` is not an instance of the `Channel` class.
   */
  isAllowedToAddMember() {
    if (this.currentChannel instanceof Channel) {
      return this.currentChannel.creatorID === this.userService.currentUserID ||
        this.currentChannel.memberIDs.includes(this.userService.currentUserID)
    }
    return;
  }

  /**
   * Gets the name of the member with the specified ID.
   * If the member with the specified ID is the current user, the name is returned with the text "(You)" appended.
   * @param memberID - The ID of the member to get the name for.
   * @returns The name of the member, with "(You)" appended if the member is the current user.
   */
  getMemberName(memberID: string) {
    const member = this.userService.getUserByID(memberID);
    return member?.id === this.userService.currentUser?.id
      ? `${member?.name} (Du)`
      : member?.name;
  }

  ngOnDestroy() {
    this.channelSubject.unsubscribe();
  }

/**
 * Resets the selected users array and the user amount to their initial state.
 */
resetAddmembers() {
  this.selectedUsers = [];
  this.userAmount = 0;
}

/**
 * Removes the specified user from the selected users list and decrements the user amount.
 * @param user - The user to remove from the selection.
 */
removeUserFromSelection(user: User) {
  this.selectedUsers = this.selectedUsers.filter((u) => u.id !== user.id);
  if (user.id!) {
    this.userAmount--;
  }
}

/**
 * Called when the input field receives focus.
 * Displays the dropdown of search suggestions if the search query is not empty, and sets the `isDropdownVisible` flag to true.
 */
onFocus() {
  this.isDropdownVisible = true;
  if (this.searchQuery) {
    this.onSearchInput();
  }
}

/**
 * Handles the search input event by updating the search query and retrieving search suggestions.
 * This method is called when the user types into the search input field. It updates the search query and then uses the `searchService` to retrieve search suggestions based on the current query. The suggestions are then mapped to a flat array of `SearchSuggestion` objects, which are emitted through the `suggestions$` observable.
 */
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

/**
 * Hides the dropdown and clears the search query after a short delay.
 * This method is called when the user moves focus away from the search input field. It sets a timeout to hide the dropdown and clear the search query after 200 milliseconds. This allows the user to click on a suggestion in the dropdown without the dropdown immediately disappearing.
 */
onBlur() {
  setTimeout(() => {
    this.isDropdownVisible = false;
    this.searchQuery = '';
    this.searchService.updateSearchQuery('');
  }, 200);
}

/**
 * Handles the selection of an option, either a user search or another type of search.
 * Sets the `isUserSearchSelected` flag based on the provided parameter, and sets the `isAnyOptionSelected` flag to true.
 * @param isUserSearchSelected - A boolean indicating whether the selected option is a user search.
 */
addOptionSelected(isUserSearchSelected: boolean) {
  this.isUserSearchSelected = isUserSearchSelected;
  this.isAnyOptionSelected = true;
}

/**
 * Handles the selection of a search suggestion.
 * This method is called when the user selects a search suggestion from the dropdown. It takes the selected suggestion as a parameter and performs the appropriate action based on the type of the suggestion (e.g. adding a user to the selection).
 *
 * @param suggestion - The selected search suggestion.
 */
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

/**
 * Finds a user by their name.
 * @param name - The name of the user to find.
 * @returns The user if found, otherwise `undefined`.
 */
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

/**
 * Adds the specified user to the selection.
 * This method is used to add a user to the list of selected users. It checks if the user is not already in the selection and if they are not already a member of the current channel, and then adds them to the selection.
 *
 * @param user - The user to add to the selection.
 */
addUserToSelection(user: User) {
  if (!this.selectedUsers.some((u) => u.id === user.id)) {
    if (!this.currentChannel.memberIDs.includes(user.id)) {
      this.selectedUsers.push(user);
      this.userAmount++;
    }
  }
}

/**
 * Finds a user based on the provided search suggestion.
 * This method is used to retrieve a user object from a search suggestion, which may be a string or an object with a 'text' and 'type' property. If the suggestion is a string, it assumes the string represents the user's name. If the suggestion is an object, it checks the 'type' property to determine if the suggestion represents a user.
 * @param suggestion - The search suggestion, which can be a string or an object with 'text' and 'type' properties.
 * @returns The user object if found, otherwise `undefined`.
 */
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

/**
 * Adds the selected users to the current channel.
 * This method is used to add the users that have been selected in the channel editor to the current channel. It iterates through the `selectedUsers` array and adds each user's ID to the `memberIDs` array of the `currentChannel`. It then emits the updated `currentChannel` object and calls the `updateChannelOnFirestore` method of the `channelService` to persist the changes to the channel.
 * Finally, it calls the `resetAddmembers` method to clear the selected users and hides the channel member overview popover.
 */
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