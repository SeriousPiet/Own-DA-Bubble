import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import { Observable, timer } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';

import { SearchService } from '../../../utils/services/search.service';
import { SearchSuggestion } from '../../../utils/services/search.service';

import { NavigationService } from '../../../utils/services/navigation.service';
import { ChannelService } from '../../../utils/services/channel.service';
import { UsersService } from '../../../utils/services/user.service';
import { User } from '../../../shared/models/user.class';
import { Channel } from '../../../shared/models/channel.class';
import { Message } from '../../../shared/models/message.class';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarDirective } from '../../../utils/directives/avatar.directive';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarDirective],
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SearchbarComponent implements OnInit {
  searchState$!: Observable<{
    query: string;
    context: string | null;
    keywords: string[];
  }>;
  searchQuery: string = '';
  suggestions$!: Observable<
    { text: string; type: string; hasChat: boolean; message?: Message }[]
  >;

  isDropdownVisible = false;
  recentSearches: SearchSuggestion[] = [];
  currentContext: string = '';
  isDatepickerVisible = false;
  isWelcomeChannel: boolean = true;

  // ############################################################################################################
  // Lifecycle Hooks
  // ############################################################################################################

  /**
   * Constructs the SearchbarComponent and subscribes to changes in the navigation service.
   * When the 'chatViewObjectSet' event is emitted, it updates the welcome channel status.
   *
   * @param searchService - The SearchService instance.
   * @param navigationService - The NavigationService instance.
   * @param channelService - The ChannelService instance.
   * @param usersService - The UsersService instance.
   */
  constructor(
    private searchService: SearchService,
    public navigationService: NavigationService,
    private channelService: ChannelService,
    private usersService: UsersService
  ) {
    this.navigationService.change$.subscribe((change: string) => {
      if (change === 'chatViewObjectSet') {
        this.updateWelcomeChannelStatus();
      }
    });
  }

  /**
   * Updates the welcome channel status based on the current chat view object.
   * If the current chat view object is an instance of Channel and its name is 'Willkommen',
   * the `isWelcomeChannel` flag is set to true, indicating that the current view is the welcome channel.
   */
  private updateWelcomeChannelStatus() {
    const currentObject = this.navigationService.chatViewObject;
    this.isWelcomeChannel =
      currentObject instanceof Channel && currentObject.name === 'Willkommen';
  }

  /**
   * Initializes the search suggestions, current search context, and recent searches.
   * This method is called when the component is initialized.
   */
  ngOnInit() {
    this.currentContext = this.searchService.getCurrentContext();
    this.recentSearches = this.searchService.getRecentSearches();
  }

  /**
   * A reference to the HTML input element for the date picker.
   * This reference is used to programmatically show the date picker UI when the date picker is made visible.
   */
  @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;

  /**
   * Toggles the visibility of the date picker input field.
   * If the date picker is made visible, it will automatically show the date picker UI.
   */
  toggleDatepicker() {
    this.isDatepickerVisible = !this.isDatepickerVisible;
    if (this.isDatepickerVisible) {
      setTimeout(() => {
        this.dateInput.nativeElement.showPicker();
      });
    }
  }

  /**
   * Handles the date selection event from the date picker input field.
   * When a date is selected, it searches for content by the selected date and
   * hides the date picker input field.
   *
   * @param event - The event object containing the selected date.
   */
  async onDateSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedDate = input.value;
    if (selectedDate) {
      await this.searchService.searchByDate(new Date(selectedDate));
      this.isDatepickerVisible = false;
    }
  }

  // ############################################################################################################
  // Event Handlers
  // ############################################################################################################

  /**
   * Updates the search query, retrieves the latest search suggestions, and retrieves the recent searches.
   * Also logs the current search context to the console.
   */
  onSearchInput() {
    this.searchService.updateSearchQuery(this.searchQuery);
    this.suggestions$ = this.searchService.getSearchSuggestions().pipe(
      map((groupedResults) => {
        if (this.searchQuery.startsWith('@')) {
          return groupedResults.users;
        } else if (this.searchQuery.startsWith('#')) {
          return groupedResults.channels;
        } else {
          return [
            ...groupedResults.users,
            ...groupedResults.channels,
            ...groupedResults.messages,
          ];
        }
      })
    );
    this.recentSearches = this.searchService.getRecentSearches();
  }

  /**
   * Called when the search input field receives focus.
   * Sets the current search context, makes the search dropdown visible,
   * and triggers a search input event if the search query is not empty.
   */
  onFocus() {
    this.currentContext = this.searchService.getCurrentContext();
    this.isDropdownVisible = true;
    if (this.searchQuery) {
      this.onSearchInput();
    }
  }

  /**
   * Called when the search input field loses focus.
   * Hides the search dropdown after a short delay, clears the search query,
   * and updates the search service with an empty query.
   */
  onBlur() {
    setTimeout(() => {
      this.isDropdownVisible = false;
      this.searchQuery = '';
      this.searchService.updateSearchQuery('');
    }, 200);
  }

  // ############################################################################################################
  // UI Interaction Methods
  // ############################################################################################################

  /**
   * Indicates whether context search is currently enabled.
   * @returns {boolean} `true` if context search is enabled, `false` otherwise.
   */
  get isContextSearchEnabled(): boolean {
    return this.searchService.isContextSearchEnabled;
  }

  /**
   * Enables context search and adds the current search context to the search query.
   * This allows the user to search within the current context, such as a specific channel or user.
   */
  enableContextSearch() {
    this.searchService.setContextSearchEnabled(true);
    this.addContextToSearch();
  }

  /**
   * Selects a recent search suggestion and updates the search query and input.
   * @param search - The search suggestion to select.
   */
  selectRecentSearch(search: SearchSuggestion) {
    this.selectSuggestion(search);
    this.searchQuery = search.text;
    this.onSearchInput();
  }

  /**
   * Handles the selection of a search suggestion, performing the appropriate action based on the suggestion type.
   *
   * @param suggestion - The search suggestion to be processed.
   * @returns {Promise<void>} A Promise that resolves when the suggestion handling is complete.
   */
  async selectSuggestion(suggestion: SearchSuggestion): Promise<void> {
    console.log('selectSuggestion called with:', suggestion);

    switch (suggestion.type) {
      case 'user':
        await this.handleUserSuggestion(suggestion);
        break;
      case 'channel':
        await this.handleChannelSuggestion(suggestion);
        break;
      case 'message':
        if (suggestion.message) {
          await this.handleMessageSuggestion(suggestion);
        }
        break;
    }
    this.finalizeSuggestionSelection(suggestion);
  }

  /**
   * Handles the selection of a user search suggestion, finding the user by name and setting the chat view object to the user if found.
   *
   * @param suggestion - The search suggestion containing the user information.
   * @returns {Promise<void>} A Promise that resolves when the user suggestion handling is complete.
   */
  private async handleUserSuggestion(suggestion: SearchSuggestion) {
    const userName = suggestion.text.slice(1);
    const user = this.findUserByName(userName);
    if (user) {
      suggestion.hasChat =
        this.channelService.getChatWithUserByID(user.id, false) !== undefined;
      await this.navigationService.setChatViewObject(user);
    }
  }

  /**
   * Handles the selection of a channel search suggestion, finding the channel by name and setting the chat view object to the channel if found.
   *
   * @param suggestion - The search suggestion containing the channel information.
   * @returns {Promise<void>} A Promise that resolves when the channel suggestion handling is complete.
   */
  private async handleChannelSuggestion(suggestion: SearchSuggestion) {
    const channelName = suggestion.text.slice(1);
    const channel = this.channelService.channels.find(
      (c) => c.name === channelName
    );
    if (channel) {
      await this.navigationService.setChatViewObject(channel);
    }
  }

  /**
   * Handles the selection of a message search suggestion, finding the target chat or channel and setting the chat view object to it, then scrolling to the message.
   *
   * @param suggestion - The search suggestion containing the message information.
   * @returns {Promise<void>} A Promise that resolves when the message suggestion handling is complete.
   */
  private async handleMessageSuggestion(suggestion: SearchSuggestion) {
    console.log('handleMessageSuggestion called with:', suggestion);

    if (suggestion.message) {
      const targetId = suggestion.message.collectionPath.split('/')[1];
      if (suggestion.message.collectionPath.startsWith('channels/')) {
        const channel = this.channelService.channels.find(
          (c) => c.id === targetId
        );
        if (channel) await this.navigationService.setChatViewObject(channel);
      } else {
        const chat = this.channelService.getChatByID(targetId);
        if (chat) {
          const chatPartner = this.channelService.getChatPartner(chat);
          if (chatPartner)
            await this.navigationService.setChatViewObject(chatPartner);
        }
      }
      this.scrollToMessage(suggestion.message);
    }
  }

  /**
   * Finalizes the selection of a search suggestion by removing the search context, adding the suggestion to the recent searches, and hiding the search dropdown.
   *
   * @param suggestion - The search suggestion that was selected.
   */
  private finalizeSuggestionSelection(suggestion: SearchSuggestion) {
    this.removeContextFromSearch();
    this.searchService.addRecentSearch(suggestion);
    this.recentSearches = this.searchService.getRecentSearches();
    this.isDropdownVisible = false;
  }

  /**
   * Scrolls to the specified message in the chat view.
   *
   * This method first waits for the navigation to complete, then checks every 500ms for up to 5 attempts if the chat view object matches the target message's collection path. Once a match is found, it emits the message to the `messageScrollRequested` event.
   *
   * @param message - The message to scroll to.
   */
  private scrollToMessage(message: Message) {
    console.log('scrollToMessage called with:', message);

    this.navigationService.navigationComplete$
      .pipe(
        take(1),
        switchMap(() =>
          timer(0, 500).pipe(
            take(5),
            map(
              () =>
                this.navigationService.chatViewObject.id ===
                message.collectionPath.split('/')[1]
            ),
            filter((isMatch) => isMatch),
            take(1)
          )
        )
      )
      .subscribe(() => {
        this.searchService.messageScrollRequested.emit(message);
      });
  }

  /**
   * Gets the user object from a search suggestion.
   *
   * This method checks if the search suggestion is of type 'user', and if so, it extracts the user name from the suggestion text and calls `findUserByName()` to retrieve the corresponding user object.
   *
   * @param suggestion - The search suggestion object containing the text and type.
   * @returns The user object if found, otherwise `undefined`.
   */
  getUserFromSuggestion(suggestion: {
    text: string;
    type: string;
  }): User | undefined {
    if (suggestion.type === 'user') {
      const userName = suggestion.text.startsWith('@')
        ? suggestion.text.slice(1)
        : suggestion.text;
      return this.findUserByName(userName);
    }
    return undefined;
  }

  /**
   * Finds a user by their name.
   *
   * @param name - The name of the user to find.
   * @returns The user object if found, otherwise `undefined`.
   */
  public findUserByName(name: string) {
    const userIds = this.usersService.getAllUserIDs();
    for (const id of userIds) {
      const user = this.usersService.getUserByID(id);
      if (user && user.name === name) {
        return user;
      }
    }
    return undefined;
  }

  /**
   * Adds the current context restriction to the search.
   *
   * This method retrieves the current context from the `searchService`, adds it as a restriction to the search, and logs the context members and their names to the console.
   *
   * This can be useful when the user wants to search within a specific context, such as a channel or group.
   */
  addContextToSearch() {
    const context = this.searchService.getCurrentContext();
    if (context) {
      this.searchService.addContextRestriction(context);
      const contextMembers = this.searchService.getContextMembers();
      const memberNames = this.searchService.getUserNames(contextMembers);
    }
  }

  /**
   * Removes the current context restriction from the search.
   *
   * This method calls the `removeContextRestriction()` method on the `searchService` to remove the current context restriction from the search.
   *
   * This can be useful when the user wants to search without any context-specific restrictions.
   */
  removeContextFromSearch() {
    this.searchService.removeContextRestriction();
    this.searchService.setContextSearchEnabled(false);
  }

  // ############################################################################################################
  // Recent Searches Management
  // ############################################################################################################

  /**
   * Adds a search term to the recent searches list.
   *
   * This method creates a new search suggestion object with the provided search term, sets its type to 'text' and `hasChat` to `false`, and then adds it to the recent searches list using the `addRecentSearch()` method of the `searchService`. It then updates the `recentSearches` property with the latest list of recent searches.
   *
   * @param term - The search term to add to the recent searches list.
   */
  addSearchTerm(term: string) {
    const suggestion: SearchSuggestion = {
      text: term,
      type: 'text',
      hasChat: false,
    };
    this.searchService.addRecentSearch(suggestion);
    this.recentSearches = this.searchService.getRecentSearches();
  }

  /**
   * Removes a search term from the recent searches list.
   *
   * This method calls the `removeRecentSearch()` method on the `searchService` to remove the provided search term from the list of recent searches.
   * It then updates the `recentSearches` property with the latest list of recent searches.
   *
   * @param term - The search term to remove from the recent searches list.
   */
  removeSearchTerm(term: string) {
    this.searchService.removeRecentSearch(term);
    this.recentSearches = this.searchService.getRecentSearches();
  }

  // ############################################################################################################
  // Utility Methods
  // ############################################################################################################

  /**
   * Gets the message context for a given search suggestion.
   *
   * If the suggestion type is 'message' and a message object is provided, this method returns the context of the message.
   * Otherwise, it returns an empty string.
   *
   * @param suggestion - The search suggestion object containing information about the suggestion.
   * @returns The message context, or an empty string if the suggestion is not a message.
   */
  getMessageContext(suggestion: {
    text: string;
    type: string;
    hasChat: boolean;
    message?: Message;
  }): string {
    if (suggestion.type === 'message' && suggestion.message) {
      return suggestion.message.content;
    }
    return '';
  }

  /**
   * Gets the current search restrictions.
   *
   * This method returns the current search restrictions that have been added to the search service.
   * The search restrictions can be used to filter the search results based on specific criteria.
   *
   * @returns The current search restrictions.
   */
  getActiveRestrictions() {
    return this.searchService.getSearchRestrictions();
  }

  /**
   * Gets the current search context.
   *
   * This method returns the current search context that has been set in the search service.
   * The search context can be used to filter the search results based on the current context.
   *
   * @returns The current search context.
   */
  getCurrentContext(): string {
    return this.searchService.getCurrentContext();
  }

  /**
   * Checks if the current user has an active chat with the specified user.
   *
   * @param userName - The name of the user to check the chat status for.
   * @returns `true` if the current user has an active chat with the specified user, `false` otherwise.
   */
  getUserChatStatus(userName: string): boolean {
    const user = this.findUserByName(userName);
    return user
      ? this.channelService.getChatWithUserByID(user.id, false) !== undefined
      : false;
  }

  /**
   * Checks if the current user is a member of the specified channel.
   *
   * This method finds the channel with the given name in the `channelService.channels` array,
   * and then checks if the current user's ID is included in the `members` array of that channel.
   *
   * @param channelName - The name of the channel to check the membership for.
   * @returns `true` if the current user is a member of the specified channel, `false` otherwise.
   */
  getChannelJoinStatus(channelName: string): boolean {
    const channel = this.channelService.channels.find(
      (c) => c.name === channelName
    );
    return channel
      ? channel.memberIDs.includes(this.usersService.currentUser?.id || '')
      : false;
  }
}
