import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin, from } from 'rxjs';
import { map, switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NavigationService } from './navigation.service';
import { UsersService } from './user.service';
import { ChannelService } from './channel.service';
import { MessageService } from './message.service';
import { Message } from '../../shared/models/message.class';
import { Firestore, collection, query, where, orderBy, limit, getDocs, startAt, collectionGroup } from '@angular/fire/firestore';
import { Chat } from '../../shared/models/chat.class';
import { Channel } from '../../shared/models/channel.class';
import { isRealUser } from '../firebase/utils';

export interface GroupedSearchResults {
  users: { text: string; type: 'user'; hasChat: boolean }[];
  channels: { text: string; type: 'channel'; hasChat: boolean }[];
  messages: { text: string; type: 'message'; hasChat: boolean; message: Message; }[];
}

export interface SearchSuggestion {
  text: string;
  type: string;
  hasChat?: boolean;
  message?: Message;
  messagePath?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private recentSearches: string[] = [];
  private readonly RECENT_SEARCHES_KEY = 'recentSearches';
  private _isContextSearchEnabled: boolean = false;

  get isContextSearchEnabled(): boolean {
    return this._isContextSearchEnabled;
  }

  /**
   * A BehaviorSubject that holds the current search state, including the search query and any context restrictions.
   *
   * The search state is used to manage the state of the search functionality in the application.
   * The `query` property holds the current search query, and the `context` property holds any context restrictions
   * that have been applied to the search.
   */
  private searchStateSubject = new BehaviorSubject<{
    query: string;
    context: string | null;
    contextObjectPath: string;
  }>({
    query: '',
    context: null,
    contextObjectPath: '',
  });

  /**
   * Emits a `Message` object when a message scroll request is made.
   *
   * This event emitter is used to notify other parts of the application when a user
   * requests to scroll to a specific message. The emitted `Message` object contains
   * the details of the message that should be scrolled to.
   */
  public messageScrollRequested = new EventEmitter<Message>();

  searchState$ = this.searchStateSubject.asObservable();

  constructor(
    private navigationService: NavigationService,
    private usersService: UsersService,
    private channelService: ChannelService,
    private firestore: Firestore,
    private messageService: MessageService
  ) { }

  // ############################################################################################################
  // State Management Methods
  // ############################################################################################################

  /**
   * Updates the search query in the current search state.
   *
   * This method updates the search state by setting the query to the provided value.
   *
   * @param query - The new search query to set in the search state.
   */
  updateSearchQuery(query: string) {
    this.searchStateSubject.next({
      ...this.searchStateSubject.value,
      query,
    });
  }


  /**
   * Adds a context restriction to the current search state.
   *
   * This method updates the search state by setting the context to the provided value,
   * effectively adding a context restriction to the search.
   *
   * @param context - The context to add to the search state.
   */
  addContextRestriction(context: string, contextObject: Channel | Chat) {
    this.searchStateSubject.next({
      ...this.searchStateSubject.value,
      context,
      contextObjectPath: contextObject instanceof Channel ? contextObject.channelMessagesPath : contextObject.chatMessagesPath,
    });
  }


  /**
   * Removes the current context restriction from the search state.
   *
   * This method updates the search state by setting the context to `null`,
   * effectively removing any previous context restriction.
   */
  removeContextRestriction() {
    this.searchStateSubject.next({
      ...this.searchStateSubject.value,
      context: null,
      contextObjectPath: '',
    });
  }

  // ############################################################################################################
  // Search Methods
  // ############################################################################################################

  /**
   * Searches for the nearest message to the provided date.
   *
   * This method retrieves the collection path based on the current search context,
   * and then finds the message that is nearest to the provided date. If a message
   * is found, it emits an event to scroll to that message.
   *
   * @param date - The date to search for the nearest message.
   * @returns A Promise that resolves when the search is complete.
   */
  async searchByDate(date: Date): Promise<void> {
    const context = this.navigationService.getSearchContext();
    const collectionPath = await this.getCollectionPath(context);

    if (collectionPath) {
      const message = await this.findNearestMessage(collectionPath, date);
      if (message) {
        this.scrollToMessage(message);
      }
    }
  }


  /**
   * Emits an event to scroll the UI to the provided message.
   *
   * This method is used to notify the UI components that the user has
   * requested to scroll to a specific message. The UI components can
   * then handle the scrolling logic based on the provided message.
   *
   * @param message - The message to scroll to.
   */
  private scrollToMessage(message: Message): void {
    this.messageScrollRequested.emit(message);
  }


  /**
   * Retrieves the collection path based on the provided search context.
   *
   * This method handles two types of search contexts:
   * 1. 'in:#channelName' - Retrieves the collection path for the messages in the specified channel.
   * 2. 'in:@userName' - Retrieves the collection path for the messages in the chat with the specified user.
   *
   * If the search context does not match either of these patterns, or if the channel or user cannot be found, the method returns `null`.
   *
   * @param context - The search context to use for determining the collection path.
   * @returns The collection path for the messages, or `null` if the context is not valid.
   */
  private async getCollectionPath(context: string): Promise<string | null> {
    if (context.startsWith('in:#')) {
      const channelName = context.slice(4);
      const channel = this.channelService.channels.find((c) => c.name === channelName);
      return channel ? `channels/${channel.id}/messages` : null;
    } else if (context.startsWith('in:@')) {
      const userName = context.slice(4);
      const user = this.usersService.getAllUserIDs().find((id) => this.usersService.getUserByID(id)?.name === userName);
      if (user) {
        const chatId = await this.getChatIdWithUser(user);
        return chatId ? `chats/${chatId}/messages` : null;
      }
    }
    return null;
  }


  /**
   * Retrieves the chat ID for the chat that includes the specified user.
   *
   * This method queries the 'chats' collection in Firestore to find the chat
   * that contains the provided user ID in its 'memberIDs' array. If a matching
   * chat is found, the method returns the ID of that chat. Otherwise, it returns
   * `null`.
   *
   * @param userId - The ID of the user to find the chat for.
   * @returns The ID of the chat that includes the specified user, or `null` if
   * no such chat is found.
   */
  private async getChatIdWithUser(userId: string): Promise<string | null> {
    const chatsRef = collection(this.firestore, 'chats');
    const q = query(chatsRef, where('memberIDs', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) return querySnapshot.docs[0].id;
    return null;
  }


  /**
   * Finds the nearest message to the specified target date in the given collection path.
   *
   * This method first searches for the message with the latest creation date that is before or equal to the target date, and returns it if found. If no such message is found, it then searches for the message with the earliest creation date that is after the target date, and returns it if found. If neither search is successful, the method returns `null`.
   *
   * @param collectionPath - The path to the collection containing the messages to search.
   * @param targetDate - The target date to find the nearest message for.
   * @returns The nearest message to the target date, or `null` if no such message is found.
   */
  private async findNearestMessage(collectionPath: string, targetDate: Date): Promise<Message | null> {
    const messagesRef = collection(this.firestore, collectionPath);
    const qBefore = query(messagesRef, orderBy('createdAt', 'desc'), startAt(targetDate), limit(1));
    const querySnapshotBefore = await getDocs(qBefore);

    if (!querySnapshotBefore.empty) {
      return this.createMessageFromDoc(querySnapshotBefore.docs[0]);
    }
    const qAfter = query(messagesRef, orderBy('createdAt'), startAt(targetDate), limit(1));
    const querySnapshotAfter = await getDocs(qAfter);

    if (!querySnapshotAfter.empty) {
      return this.createMessageFromDoc(querySnapshotAfter.docs[0]);
    }
    return null;
  }


  /**
   * Creates a new `Message` instance from the provided Firestore document.
   *
   * This method extracts the necessary data from the Firestore document and uses it to construct a new `Message` object.
   *
   * @param doc - The Firestore document containing the message data.
   * @returns A new `Message` instance representing the message data from the provided document.
   */
  private createMessageFromDoc(doc: any): Message {
    const data = doc.data();
    return new Message(data, doc.ref.parent.path, doc.id);
  }


  /**
   * Adds a new search term to the list of recent searches.
   *
   * This method retrieves the current list of recent searches from local storage,
   * prepends the new search term to the list, and then stores the updated list
   * back in local storage. The list is limited to a maximum of 5 recent searches.
   *
   * @param term - The new search term to add to the list of recent searches.
   */
  addRecentSearch(term: SearchSuggestion) {
    if (term.text.trim() === '') return;
    let searches = this.getRecentSearches();
    searches = [term, ...searches.filter((s) => s.text !== term.text)].slice(
      0,
      5
    );
    localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(searches));
  }


  /**
   * Retrieves the list of recent search suggestions from local storage.
   *
   * This method reads the recent search suggestions from the local storage and
   * returns them as an array of `SearchSuggestion` objects. If no recent searches
   * are found in local storage, an empty array is returned.
   *
   * @returns An array of `SearchSuggestion` objects representing the recent search
   * suggestions.
   */
  getRecentSearches(): SearchSuggestion[] {
    const searches = localStorage.getItem(this.RECENT_SEARCHES_KEY);
    return searches ? JSON.parse(searches) : [];
  }


  /**
   * Removes the specified search term from the list of recent searches.
   *
   * This method retrieves the current list of recent searches from local storage,
   * filters out the provided search term, and then stores the updated list back
   * in local storage.
   *
   * @param term - The search term to remove from the list of recent searches.
   */
  removeRecentSearch(term: string) {
    this.recentSearches = this.recentSearches.filter((t) => t !== term);
  }


  getSearchSuggestions(): Observable<GroupedSearchResults> {
    return this.searchState$.pipe(
      debounceTime(300), distinctUntilChanged(), switchMap((state) => {
        if (state.query.startsWith('@')) {
          return forkJoin({ users: this.searchUsers(state.query.slice(1)), channels: of([]), messages: of([]) });
        }
        else if (state.query.startsWith('#')) {
          return forkJoin({ users: of([]), channels: this.searchChannels(state.query.slice(1)), messages: of([]) });
        }
        else if (!state.query || state.query.trim().length < 3) {
          return of({ users: [], channels: [], messages: [] });
        }
        else if (state.context !== null) {
          return forkJoin({
            users: of([]),
            channels: of([]),
            messages: state.query.trim().length >= 3 ? this.searchMessages(state.query, state.contextObjectPath).pipe(map((messages) => messages.slice(0, 5))) : of([]),
          });
        }
        else {
          return forkJoin({
            users: this.searchUsers(state.query).pipe(map((users) => users.slice(0, 5))),
            channels: this.searchChannels(state.query).pipe(map((channels) => channels.slice(0, 5))),
            messages: state.query.trim().length >= 3 ? this.searchMessages(state.query, '').pipe(map((messages) => messages.slice(0, 5))) : of([]),
          });
        }
      })
    );
  }


  /**
   * Searches for users based on the provided query string.
   *
   * @param query - The search query string.
   * @returns An Observable that emits an array of objects containing user information.
   * Each object includes:
   * - `text`: The user's name prefixed with '@'.
   * - `type`: A constant string 'user'.
   * - `hasChat`: A boolean indicating whether there is an existing chat with the user.
   */
  private searchUsers(query: string): Observable<{ text: string; type: 'user'; hasChat: boolean }[]> {
    return of(this.usersService.getAllUserIDs()).pipe(
      map((userIds) => userIds
        .map((id) => {
          const user = this.usersService.getUserByID(id);
          if(user && !isRealUser(user)) return null;
          return user ? { text: `@${user.name}`, type: 'user' as const, hasChat: this.channelService.getChatWithUserByID(id) !== undefined } : null;
        })
        .filter((user): user is { text: string; type: 'user'; hasChat: boolean } => user !== null && user.text.toLowerCase().includes(query.toLowerCase()))
      )
    );
  }


  /**
   * Searches for channels that match the given query string.
   *
   * @param query - The search query string to filter channels.
   * @returns An Observable that emits an array of objects containing channel information.
   * Each object includes the channel's text (name prefixed with '#'), type ('channel'), and a boolean indicating if it has chat.
   */
  private searchChannels(query: string): Observable<{ text: string; type: 'channel'; hasChat: boolean }[]> {
    return of(this.channelService.channels).pipe(
      map((channels) =>
        channels
          .map((channel) => ({ text: `#${channel.name}`, type: 'channel' as const, hasChat: true }))
          .filter((channel) => channel.text.toLowerCase().includes(query.toLowerCase()))
      )
    );
  }


  /**
   * Searches for messages based on the provided query string.
   *
   * @param query - The search query to use for finding messages.
   * @returns An Observable that emits an array of objects containing the truncated message content, message type, whether the user has a chat in that channel, and the original message object.
   */
  public searchMessages(query: string, path: string): Observable<{ text: string; type: 'message'; hasChat: boolean; message: Message }[]> {
    return from(this.messageService.searchMessages(query, path)).pipe(
      map((messages: Message[]) => {
        return messages.map((message: Message) => {
          const contentWithoutHtml = message.content.replace(/<\/?[^>]+(>|$)/g, " ");
          return {
            text: this.truncateMessageContent(contentWithoutHtml, query),
            type: 'message' as const,
            hasChat: true,
            message: message,
            messagePath: path,
          };
        });
      })
    );
  }

  // ############################################################################################################
  // Utility Methods
  // ############################################################################################################

  /**
   * Truncates the content of a message to a maximum length, highlighting the search query within the content.
   *
   * @param content - The original message content.
   * @param query - The search query to highlight in the truncated content.
   * @param maxLength - The maximum length of the truncated content (default is 60 characters).
   * @returns The truncated message content with the search query highlighted.
   */
  private truncateMessageContent(content: string, query: string, maxLength: number = 60): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    let result: string;
    if (index === -1) {
      result = content.slice(0, maxLength);
    } else if (content.length <= maxLength) {
      result = content;
    } else {
      let start = Math.max(0, index - Math.floor((maxLength - query.length) / 2));
      let end = Math.min(content.length, start + maxLength);

      if (end === content.length) {
        start = Math.max(0, end - maxLength);
      }

      result = content.slice(start, end);
      if (start > 0) result = '...' + result;
      if (end < content.length) result = result + '...';
    }
    return result.replace(new RegExp(query, 'gi'), (match) => `<strong>${match}</strong>`);
  }


  /**
   * Sets whether context search is enabled.
   *
   * @param enabled - A boolean indicating whether context search should be enabled or disabled.
   */
  setContextSearchEnabled(enabled: boolean) {
    this._isContextSearchEnabled = enabled;
  }


  /**
   * Gets the current search context.
   *
   * @returns The current search context.
   */
  getCurrentContext(): string {
    return this.navigationService.getSearchContext();
  }


  /**
   * Gets the current search restrictions.
   *
   * @returns The current search restrictions.
   */
  getSearchRestrictions() {
    return this.searchStateSubject.value;
  }


  /**
   * Gets a list of all registered user names.
   *
   * @returns An array of strings representing the names of all registered users. If a user's name is not available, the string 'Unbekannter Benutzer'
   * (German for 'Unknown User') is used instead.
   */
  getRegisteredUsers(): string[] {
    return this.usersService.getAllUserIDs().map((id) => {
      const user = this.usersService.getUserByID(id);
      return user ? user.name : 'Unbekannter Benutzer';
    });
  }


  /**
   * Gets the members of the current search context, if the context is a channel.
   *
   * @returns An array of strings representing the member names of the current channel, or an empty array if the current context is not a channel.
   */
  getContextMembers(): string[] {
    const context = this.getCurrentContext();
    if (context.startsWith('in:#')) {
      const channelName = context.slice(4);
      const channel = this.channelService.channels.find(
        (c) => c.name === channelName
      );
      return channel ? channel.memberIDs : [];
    }
    return [];
  }


  /**
   * Gets a list of user names for the provided user IDs.
   *
   * @param userIDs - An array of user IDs.
   * @returns An array of user names. If a user's name is not available, an empty string is returned for that user.
   */
  getUserNames(userIDs: string[]): string[] {
    return userIDs
      .map((id) => {
        const user = this.usersService.getUserByID(id);
        return user ? user.name : '';
      })
      .filter((name) => name !== '');
  }
}
