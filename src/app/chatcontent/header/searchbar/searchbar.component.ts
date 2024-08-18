import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SearchService } from '../../../utils/services/search.service';
import { NavigationService } from '../../../utils/services/navigation.service';
import { Channel } from '../../../shared/models/channel.class';
import { Chat } from '../../../shared/models/chat.class';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.scss'],
})
export class SearchbarComponent implements OnInit {
  searchState$!: Observable<{
    query: string;
    context: string | null;
    keywords: string[];
  }>;
  searchQuery: string = '';
  suggestions$!: Observable<string[]>;
  isDropdownVisible = false;
  recentSearches: string[] = [];
  currentContext: string = '';

  // Lifecycle Hooks
  constructor(
    private searchService: SearchService,
    public navigationService: NavigationService
  ) {}

  ngOnInit() {
    this.suggestions$ = this.searchService.getSearchSuggestions();
    this.currentContext = this.searchService.getCurrentContext();
  }

  // Event Handlers
  onSearchInput() {
    this.searchService.updateSearchQuery(this.searchQuery);
    this.suggestions$ = this.searchService.getSearchSuggestions();
    console.log('Searching for:', this.searchQuery);
  }

  onFocus() {
    this.currentContext = this.searchService.getCurrentContext();
    this.isDropdownVisible = true;

    const chatViewObject = this.navigationService.chatViewObject;
    if (chatViewObject instanceof Channel) {
      console.log('Current chatViewObject name:', chatViewObject.name);
    } else if (chatViewObject instanceof Chat) {
      console.log('Current chatViewObject is a Chat');
    } else {
      console.log('Current chatViewObject is undefined or unknown type');
    }
    console.log('Current context:', this.getCurrentContext());
  }

  onBlur() {
    setTimeout(() => {
      this.isDropdownVisible = false;
    }, 200);
  }

  // UI Interaction Methods
  selectSuggestion(suggestion: string) {
    this.searchQuery = suggestion;
    this.searchService.updateSearchQuery(suggestion);
    this.isDropdownVisible = false;
  }

  addContextToSearch() {
    const context = this.searchService.getCurrentContext();
    if (context) {
      this.searchService.addContextRestriction(context);
    }
  }

  removeContextFromSearch() {
    this.searchService.removeContextRestriction();
  }

  addKeyword(keyword: string) {
    this.searchService.addKeywordRestriction(keyword);
  }

  removeKeyword(keyword: string) {
    this.searchService.removeKeywordRestriction(keyword);
  }

  // Recent Searches Management
  addSearchTerm(term: string) {
    this.searchService.addRecentSearch(term);
    this.recentSearches = this.searchService.getRecentSearches();
  }

  removeSearchTerm(term: string) {
    this.searchService.removeRecentSearch(term);
    this.recentSearches = this.searchService.getRecentSearches();
  }
  // Utility Methods
  getActiveRestrictions() {
    return this.searchService.getSearchRestrictions();
  }

  getCurrentContext(): string {
    return this.searchService.getCurrentContext();
  }
}
