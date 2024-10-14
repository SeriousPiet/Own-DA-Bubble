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


  /**
   * Updates the channel data object with the current channel's name, description, and member IDs.
   *
   * This method is called when the current channel changes, and it updates the `updateChannelData` object
   * with the relevant information from the `currentChannel` property.
   */
  updateChannelDatas() {
    if (this.currentChannel instanceof Channel) {
      this.updateChannelData.name = this.currentChannel.name;
      this.updateChannelData.description = this.currentChannel.description;
      this.updateChannelData.memberIDs = this.currentChannel.memberIDs;
    }
  }


  /**
   * Retrieves a `User` object from a search suggestion.
   *
   * @param suggestion - A string or an object with `text` and `type` properties representing a search suggestion.
   * @returns The `User` object if found, otherwise `undefined`.
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
   * Retrieves the display name for a channel member.
   *
   * If the member is the current user, the name is returned with the text "(You)" appended.
   * Otherwise, the member's name is returned as-is.
   *
   * @param memberID - The ID of the channel member.
   * @returns The display name for the channel member.
   */
  getMemberName(memberID: string) {
    const member = this.userService.getUserByID(memberID);
    return member?.id === this.userService.currentUser?.id
      ? `${member?.name} (Du)`
      : member?.name;
  }

  
  /**
   * Checks if the current user is a member of the current channel.
   *
   * @returns `true` if the current user is a member of the current channel, `false` otherwise.
   */
  currentUserIsChannelMember() {
    return (
      this.currentChannel instanceof Channel &&
      this.currentChannel.memberIDs.includes(this.userService.currentUser!.id)
    );
  }

  /**
   * Sets the selected user object and updates the navigation service's profile target.
   *
   * @param messageCreatorID - The ID of the message creator.
   */
  setSelectedUserObject(messageCreatorID: string) {
    this.userService.updateSelectedUser(this.userService.getUserByID(messageCreatorID));
    this.navigationService.setProfileTarget(true);
  }

  /**
   * Gets the title of a given Channel, Chat, Message, or undefined object.
   *
   * @param object - The object to get the title for.
   * @returns The title of the object, or an empty string if the object is undefined.
   */
  getTitle(object: Channel | Chat | Message | undefined): string {
    if (object instanceof Channel) return object.name;
    return '';
  }

  /**
   * Opens the "Add New Member" popover and updates the state of the member list and add member popover.
   *
   * This method is responsible for setting the `addMemberPopover` property to `true`, the `memberList` property to `false`,
   * and then emitting the updated values of `memberList` and `addMemberPopover` through the corresponding event emitters.
   */
  openAddNewMemberPopover() {
    this.addMemberPopover = true;
    this.memberList = false;
    this.memberListChange.emit(this.memberList);
    this.addMemberPopoverChange.emit(this.addMemberPopover);
  }

  /**
   * Handles the search input event by updating the search query and retrieving search suggestions.
   *
   * This method is responsible for:
   * 1. Updating the search query in the search service.
   * 2. Retrieving search suggestions from the search service and mapping the results to a flat array of suggestions.
   * 3. Emitting the updated search suggestions through the `suggestions$` observable.
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
   * Handles the focus event on the search input by making the dropdown visible and triggering a search if the search query is not empty.
   *
   * This method is responsible for:
   * 1. Setting the `isDropdownVisible` property to `true` to show the dropdown.
   * 2. Calling the `onSearchInput()` method to update the search suggestions if the `searchQuery` property is not empty.
   */
  onFocus() {
    this.isDropdownVisible = true;
    if (this.searchQuery) {
      this.onSearchInput();
    }
  }

  /**
   * Handles the blur event on the search input by hiding the dropdown and resetting the search query.
   *
   * This method is responsible for:
   * 1. Setting the `isDropdownVisible` property to `false` to hide the dropdown.
   * 2. Resetting the `searchQuery` property to an empty string.
   * 3. Updating the search query in the search service to an empty string.
   *
   * This method is called after a short delay (200 milliseconds) to allow for the dropdown to be hidden smoothly.
   */
  onBlur() {
    setTimeout(() => {
      this.isDropdownVisible = false;
      this.searchQuery = '';
      this.searchService.updateSearchQuery('');
    }, 200);
  }

  /**
   * Handles the selection of a search suggestion.
   *
   * This method is responsible for:
   * 1. Checking if the selected suggestion is a user.
   * 2. Extracting the user name from the suggestion text.
   * 3. Finding the user by the extracted name using the `findUserByName()` method.
   * 4. Adding the found user to the selection using the `addUserToSelection()` method.
   * 5. Hiding the dropdown by setting the `isDropdownVisible` property to `false`.
   *
   * @param suggestion The selected search suggestion.
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
   * Finds a user by is name.
   * This method searches through all the user IDs retrieved from the `userService` and returns the first user whose name matches the provided `name` parameter. If no matching user is found, it returns `undefined`.
   * @param name The name of the user to search for.
   * @returns The user object if found, otherwise `undefined`.
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
   * Adds a user to the selection if they are not already selected and are not a member of the current channel.
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
   * Removes a user from the selection.
   * This method filters the `selectedUsers` array to remove the user with the provided `id`. It also decrements the `userAmount` counter if the user's `id` is not null.
   * @param user - The user to remove from the selection.
   */
  removeUserFromSelection(user: User) {
    this.selectedUsers = this.selectedUsers.filter((u) => u.id !== user.id);
    if (user.id!) {
      this.userAmount--;
    }
  }

  /**
   * Sets the state of the user search selection.
   * This method is used to update the `isUserSearchSelected` and `isAnyOptionSelected` properties based on the provided `isUserSearchSelected` parameter.
   * @param isUserSearchSelected - A boolean indicating whether the user search option is selected.
   */
  addOptionSelected(isUserSearchSelected: boolean) {
    this.isUserSearchSelected = isUserSearchSelected;
    this.isAnyOptionSelected = true;
  }

  /**
   * Resets the selected users and the user amount counter.
   * This method is used to clear the selected users and reset the user amount counter to 0.
   */
  resetAddmembers() {
    this.selectedUsers = [];
    this.userAmount = 0;
  }

  /**
   * Adds the selected users to the current channel, updates the channel subject, emits the updated channel, and updates the channel on Firestore.
   * Finally, it resets the selected users and hides the channel member overview popover.
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

  /**
   * Checks if the current user is allowed to add new members to the current channel.
   * The user is allowed to add new members if they are the creator of the channel or if they are already a member of the channel.
   * @returns `true` if the current user is allowed to add new members, `false` otherwise.
   */
  isAllowedToAddMember() {
    if (this.currentChannel instanceof Channel) {
      return this.currentChannel.creatorID === this.userService.currentUserID ||
        this.currentChannel.memberIDs.includes(this.userService.currentUserID)
    }
    return;
  }

  /**
   * Checks if the current user is allowed to add new members to the current channel, and returns a message if they are not allowed.
   * @returns A message indicating that the user is not allowed to add new members, or an empty string if the user is allowed.
   */
  showNoRightToEditInfo() {
    if (!this.isAllowedToAddMember()) {
      return 'Du bist nicht befugt, neue Leute hinzuzufügen.'
    }
    return '';
  }

  ngOnDestroy() {
    this.subscribeToChannel();
  }

  /**
   * Checks if the specified user is a guest user.
   * @param memberID - The ID of the user to check.
   * @returns `true` if the user is a guest, `false` otherwise.
   */
  checkifUserIsGuest(memberID: string) {
    const member = this.userService.getUserByID(memberID);
    return member?.guest;
  }
}