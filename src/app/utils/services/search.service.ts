import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {
  map,
  tap,
  switchMap,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';

import { NavigationService } from './navigation.service';
import { UsersService } from './user.service';

import {
  Firestore,
  collection,
  query as firestoreQuery,
  where,
  limit,
} from '@angular/fire/firestore';
import { collectionData } from 'rxfire/firestore';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private recentSearches: string[] = [];
  private searchStateSubject = new BehaviorSubject<{
    query: string;
    context: string | null;
    keywords: string[];
  }>({
    query: '',
    context: null,
    keywords: [],
  });

  searchState$ = this.searchStateSubject.asObservable();

  constructor(
    private navigationService: NavigationService,
    private firestore: Firestore,
    private usersService: UsersService
  ) {}

  // State Management Methods
  updateSearchQuery(query: string) {
    this.searchStateSubject.next({
      ...this.searchStateSubject.value,
      query,
    });
  }

  addContextRestriction(context: string) {
    this.searchStateSubject.next({
      ...this.searchStateSubject.value,
      context,
    });
  }

  removeContextRestriction() {
    this.searchStateSubject.next({
      ...this.searchStateSubject.value,
      context: null,
    });
  }

  addKeywordRestriction(keyword: string) {
    const currentKeywords = this.searchStateSubject.value.keywords;
    if (!currentKeywords.includes(keyword)) {
      this.searchStateSubject.next({
        ...this.searchStateSubject.value,
        keywords: [...currentKeywords, keyword],
      });
    }
  }

  removeKeywordRestriction(keyword: string) {
    const currentKeywords = this.searchStateSubject.value.keywords;
    this.searchStateSubject.next({
      ...this.searchStateSubject.value,
      keywords: currentKeywords.filter((k) => k !== keyword),
    });
  }

  // Search Methods
  addRecentSearch(term: string) {
    if (!this.recentSearches.includes(term)) {
      this.recentSearches.unshift(term);
      if (this.recentSearches.length > 5) {
        this.recentSearches.pop();
      }
    }
  }

  getRecentSearches(): string[] {
    return this.recentSearches;
  }

  removeRecentSearch(term: string) {
    this.recentSearches = this.recentSearches.filter((t) => t !== term);
  }

  getSearchSuggestions(): Observable<string[]> {
    return this.searchState$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((state) => {
        console.log('Current search state:', state);

        if (state.context && state.context.startsWith('in:#')) {
          console.log('Searching in channel');
          return this.searchInChannel(state.query, state.context);
        } else if (state.context && state.context.startsWith('in:@')) {
          console.log('Searching in DM');
          return this.searchInDM(state.query, state.context);
        } else {
          console.log('Performing global search');
          return this.searchGlobal(state.query);
        }
      }),
      tap((results) => console.log('Search results:', results))
    );
  }

  private searchInChannel(
    query: string,
    channelContext: string
  ): Observable<string[]> {
    const channelId = channelContext.replace('in:#', '');
    const messagesRef = collection(
      this.firestore,
      `channels/${channelId}/messages`
    );
    const q = firestoreQuery(
      messagesRef,
      where('content', '>=', query),
      where('content', '<=', query + '\uf8ff'),
      limit(5)
    );

    return collectionData(q).pipe(
      map((messages) => messages.map((msg) => msg['content']))
    );
  }

  private searchInDM(query: string, dmContext: string): Observable<string[]> {
    const dmId = dmContext.replace('in:@', '');
    const messagesRef = collection(this.firestore, `dms/${dmId}/messages`);
    const q = firestoreQuery(
      messagesRef,
      where('content', '>=', query),
      where('content', '<=', query + '\uf8ff'),
      limit(5)
    );

    return collectionData(q).pipe(
      map((messages) => messages.map((msg) => msg['content']))
    );
  }

  private searchGlobal(query: string): Observable<string[]> {
    const registeredUsers = this.getRegisteredUsers();
    console.log('Registered Users:', registeredUsers);

    return of([
      `Globale Suche für: ${query}`,
      ...registeredUsers.filter((user) =>
        user.toLowerCase().includes(query.toLowerCase())
      ),
    ]);
  }

  // Utility Methods
  getCurrentContext(): string {
    return this.navigationService.getSearchContext();
  }

  getSearchRestrictions() {
    return this.searchStateSubject.value;
  }

  getRegisteredUsers(): string[] {
    return this.usersService.getAllUserIDs();
  }
}
