import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import { Observable } from 'rxjs';
import { SearchService } from '../../../utils/services/search.service';
import { NavigationService } from '../../../utils/services/navigation.service';
import { ChannelService } from '../../../utils/services/channel.service';
import { UsersService } from '../../../utils/services/user.service';
import { User } from '../../../shared/models/user.class';
import { Channel } from '../../../shared/models/channel.class';
import { Chat } from '../../../shared/models/chat.class';
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
  suggestions$!: Observable<{ text: string; type: string; hasChat: boolean }[]>;
  isDropdownVisible = false;
  recentSearches: string[] = [];
  currentContext: string = '';
  isDatepickerVisible = false;

  // ############################################################################################################
  // Lifecycle Hooks
  // ############################################################################################################
  constructor(
    private searchService: SearchService,
    public navigationService: NavigationService,
    private channelService: ChannelService,
    private usersService: UsersService
  ) {}

  /**
   * Initializes the search suggestions, current search context, and recent searches.
   * This method is called when the component is initialized.
   */
  ngOnInit() {
    this.currentContext = this.searchService.getCurrentContext();
    this.recentSearches = this.searchService.getRecentSearches();
  }

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
    this.suggestions$ = this.searchService.getSearchSuggestions();
    this.recentSearches = this.searchService.getRecentSearches();
    console.log(
      'Aktueller Suchkontext:',
      this.navigationService.getSearchContext()
    );
  }

  /**
   * Called when the search input field receives focus.
   * Sets the current search context, makes the search dropdown visible,
   * and triggers a search input event if the search query is not empty.
   */
  onFocus() {
    this.currentContext = this.searchService.getCurrentContext();
    console.log('Suchkontext bei Fokus:', this.currentContext);

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
   * Handles the selection of a recent search from the search dropdown.
   * If the selected search starts with '@', it is treated as a user search and the corresponding user is set as the chat view object.
   * If the selected search starts with '#', it is treated as a channel search and the corresponding channel is set as the chat view object.
   * The search query is then updated with the selected search, and a search input event is triggered.
   *
   * @param search - The selected recent search string.
   */
  selectRecentSearch(search: string) {
    if (search.startsWith('@')) {
      const userName = search.slice(1);
      const user = this.findUserByName(userName);
      if (user) {
        this.navigationService.setChatViewObject(user);
      }
    } else if (search.startsWith('#')) {
      const channelName = search.slice(1);
      const channel = this.channelService.channels.find(
        (c) => c.name === channelName
      );
      if (channel) {
        this.navigationService.setChatViewObject(channel);
      }
    }
    this.removeContextFromSearch();
    this.searchQuery = search;
    this.onSearchInput();
  }

  /**
   * Handles the selection of a search suggestion from the search dropdown.
   * If the selected suggestion is for a user, it sets the corresponding user as the chat view object.
   * If the selected suggestion is for a channel, it sets the corresponding channel as the chat view object.
   * The search dropdown is then hidden.
   *
   * @param suggestion - The selected search suggestion, containing the text, type, and whether a chat exists for the selected entity.
   */
  selectSuggestion(suggestion: {
    text: string;
    type: string;
    hasChat: boolean;
  }) {
    if (suggestion.type === 'user') {
      const userName = suggestion.text.slice(1);
      const user = this.findUserByName(userName);
      if (user) {
        suggestion.hasChat =
          this.channelService.getChatWithUserByID(user.id, false) !== undefined;
        this.navigationService.setChatViewObject(user);
      }
    } else if (suggestion.type === 'channel') {
      const channelName = suggestion.text.slice(1);
      const channel = this.channelService.channels.find(
        (c: Channel) => c.name === channelName
      );
      if (channel) {
        this.navigationService.setChatViewObject(channel);
      }
    }
    this.removeContextFromSearch();
    this.searchService.addRecentSearch(suggestion.text);
    this.recentSearches = this.searchService.getRecentSearches();
    this.isDropdownVisible = false;
  }

  /**
   * Retrieves the user object from a search suggestion.
   *
   * This method takes a search suggestion, which can be either a string or an object with properties `text`, `type`, and `hasChat`. If the suggestion is a string, it assumes the string represents a user name and returns the corresponding user object. If the suggestion is an object, it checks the `type` property to determine if the suggestion is for a user, and then extracts the user name from the `text` property.
   *
   * @param suggestion - The search suggestion, which can be either a string or an object with properties `text`, `type`, and `hasChat`.
   * @returns The user object if found, otherwise `undefined`.
   */
  public getUserFromSuggestion(
    suggestion: string | { text: string; type: string; hasChat: boolean }
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
    console.log('Adding context:', context);
    if (context) {
      this.searchService.addContextRestriction(context);
      const contextMembers = this.searchService.getContextMembers();
      console.log('Context members IDs:', contextMembers);
      const memberNames = this.searchService.getUserNames(contextMembers);
      console.log('Context member names:', memberNames);
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
   * This method calls the `addRecentSearch()` method on the `searchService` to add the provided search term to the list of recent searches.
   * It then updates the `recentSearches` property with the latest list of recent searches.
   *
   * @param term - The search term to add to the recent searches list.
   */
  addSearchTerm(term: string) {
    this.searchService.addRecentSearch(term);
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
      ? channel.members.includes(this.usersService.currentUser?.id || '')
      : false;
  }
}
