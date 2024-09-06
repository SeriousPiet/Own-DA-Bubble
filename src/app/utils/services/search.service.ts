import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {
  map,
  switchMap,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';

import { NavigationService } from './navigation.service';
import { UsersService } from './user.service';
import { ChannelService } from './channel.service';
import { MessageService } from './message.service';
import { Message } from '../../shared/models/message.class';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';

import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAt,
  endAt,
} from '@angular/fire/firestore';

import { collectionData } from 'rxfire/firestore';

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

  private searchStateSubject = new BehaviorSubject<{
    query: string;
    context: string | null;
  }>({
    query: '',
    context: null,
  });

  public messageScrollRequested = new EventEmitter<Message>();

  searchState$ = this.searchStateSubject.asObservable();

  constructor(
    private navigationService: NavigationService,
    private usersService: UsersService,
    private channelService: ChannelService,
    private firestore: Firestore
  ) {
    console.log(
      'Verfügbare Channels im SearchService:',
      this.channelService.channels
    );
  }

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
  addContextRestriction(context: string) {
    this.searchStateSubject.next({
      ...this.searchStateSubject.value,
      context,
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

    console.log('Scrolling to message:', message);
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
      const channel = this.channelService.channels.find(
        (c) => c.name === channelName
      );
      return channel ? `channels/${channel.id}/messages` : null;
    } else if (context.startsWith('in:@')) {
      const userName = context.slice(4);
      const user = this.usersService
        .getAllUserIDs()
        .find((id) => this.usersService.getUserByID(id)?.name === userName);
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
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
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
  private async findNearestMessage(
    collectionPath: string,
    targetDate: Date
  ): Promise<Message | null> {
    const messagesRef = collection(this.firestore, collectionPath);
    const qBefore = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      startAt(targetDate),
      limit(1)
    );
    const querySnapshotBefore = await getDocs(qBefore);

    if (!querySnapshotBefore.empty) {
      return this.createMessageFromDoc(querySnapshotBefore.docs[0]);
    }
    const qAfter = query(
      messagesRef,
      orderBy('createdAt'),
      startAt(targetDate),
      limit(1)
    );
    const querySnapshotAfter = await getDocs(qAfter);

    if (!querySnapshotAfter.empty) {
      return this.createMessageFromDoc(querySnapshotAfter.docs[0]);
    }

    return null;
  }

  private createMessageFromDoc(doc: any): Message {
    const data = doc.data();
    return new Message(data, doc.ref.parent.path, doc.id);
  }

  /**
   * Adds the provided search term to the list of recent searches.
   *
   * This method retrieves the current list of recent searches from local storage,
   * adds the new search term to the beginning of the list, and then trims the list
   * to a maximum of 5 entries before storing it back in local storage.
   *
   * @param term - The search term to add to the list of recent searches.
   */
  addRecentSearch(term: string) {
    if (term.trim() === '') return; // Ignoriere leere Suchanfragen
    let searches = this.getRecentSearches();
    searches = [term, ...searches.filter((s) => s !== term)].slice(0, 5);
    localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(searches));
  }

  /**
   * Retrieves the list of recent searches from local storage.
   *
   * This method reads the recent searches from the local storage and returns them as an array of strings.
   * If no recent searches are found in local storage, an empty array is returned.
   *
   * @returns An array of recent search terms.
   */
  getRecentSearches(): string[] {
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

  getSearchSuggestions(): Observable<
    { text: string; type: string; hasChat: boolean }[]
  > {
    return this.searchState$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((state) => {
        if (!state.query) {
          return of([]);
        }
        if (this.isContextSearchEnabled && state.context) {
          return this.searchWithContext(state.query, state.context);
        } else {
          return this.searchGlobal(state.query);
        }
      })
    );
  }

  /**
   * Searches for global search suggestions based on the provided query.
   *
   * @param query - The search query to match against user names and channel names.
   * @returns An observable that emits an array of search suggestions, where each suggestion has a `text`, `type`, and `hasChat` property.
   * The `text` property contains the user name or channel name, the `type` property indicates whether the suggestion is for a user or a channel,
   * and the `hasChat` property indicates whether the suggestion has an associated chat.
   */
  private searchGlobal(
    query: string
  ): Observable<{ text: string; type: string; hasChat: boolean }[]> {
    return of(this.channelService.channels).pipe(
      map((channels) => {
        const users = this.usersService.getAllUserIDs().map((userId) => {
          const user = this.usersService.getUserByID(userId);
          return {
            text: `@${user?.name}`,
            type: 'user',
            hasChat:
              this.channelService.getChatWithUserByID(userId, false) !==
              undefined,
          };
        });

        const channelResults = channels.map((channel) => ({
          text: `#${channel.name}`,
          type: 'channel',
          hasChat: true,
        }));

        return [...users, ...channelResults];
      }),
      map((results) =>
        results.filter((item) =>
          item.text.toLowerCase().includes(query.toLowerCase())
        )
      )
    );
  }

  /**
   * Searches for search suggestions based on the provided query and the current search context.
   *
   * @param query - The search query to match against user names and channel names.
   * @param context - The current search context, which can be a channel or a user.
   * @returns An observable that emits an array of search suggestions, where each suggestion has a `text`, `type`, and `hasChat` property.
   * The `text` property contains the user name or channel name, the `type` property indicates whether the suggestion is for a user or a channel,
   * and the `hasChat` property indicates whether the suggestion has an associated chat.
   */
  private searchWithContext(
    query: string,
    context: string
  ): Observable<{ text: string; type: string; hasChat: boolean }[]> {
    return of(this.channelService.channels).pipe(
      map((channels) => {
        if (context.startsWith('in:#')) {
          const channelName = context.slice(4);
          const channel = channels.find((c) => c.name === channelName);
          if (channel) {
            return channel.memberIDs.map((userId) => {
              const user = this.usersService.getUserByID(userId);
              return {
                text: `@${user?.name}`,
                type: 'user',
                hasChat:
                  this.channelService.getChatWithUserByID(userId, false) !==
                  undefined,
              };
            });
          }
        } else if (context.startsWith('in:@')) {
          const userName = context.slice(4);
          const user = this.usersService
            .getAllUserIDs()
            .find((id) => this.usersService.getUserByID(id)?.name === userName);
          if (user) {
            return [
              {
                text: `@${this.usersService.getUserByID(user)?.name}`,
                type: 'user',
                hasChat: true,
              },
            ];
          }
        }
        return [];
      }),
      map((results) =>
        results.filter((item) =>
          item.text.toLowerCase().includes(query.toLowerCase())
        )
      )
    );
  }

  // ############################################################################################################
  // Utility Methods
  // ############################################################################################################

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
    console.log('Aktueller Kontext:', context);
    if (context.startsWith('in:#')) {
      const channelName = context.slice(4);
      console.log('Suche nach Channel:', channelName);
      console.log('Verfügbare Channels:', this.channelService.channels);
      const channel = this.channelService.channels.find(
        (c) => c.name === channelName
      );
      console.log('Gefundener Channel:', channel);
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
