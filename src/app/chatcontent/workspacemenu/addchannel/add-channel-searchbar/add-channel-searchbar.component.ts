import { AvatarDirective } from '../../../../utils/directives/avatar.directive';
import { SearchService } from '../../../../utils/services/search.service';
import { UsersService } from '../../../../utils/services/user.service';
import { User } from '../../../../shared/models/user.class';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-add-channel-searchbar',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarDirective],
  templateUrl: './add-channel-searchbar.component.html',
  styleUrl: './add-channel-searchbar.component.scss',
})
export class AddChannelSearchbarComponent {
  userSelected = false;
  searchQuery: string = '';
  suggestions$!: Observable<{ text: string; type: string }[]>;
  isDropdownVisible = false;
  selectedUsers: User[] = [];

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

  constructor(
    private searchService: SearchService,
    private usersService: UsersService
  ) {}

  onSearchInput() {
    this.searchService.updateSearchQuery(this.searchQuery);
    this.suggestions$ = this.searchService
      .getSearchSuggestions()
      .pipe(
        map((suggestions) =>
          suggestions.filter((suggestion) => suggestion.type === 'user')
        )
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

  selectSuggestion(suggestion: { text: string; type: string }) {
    if (suggestion.type === 'user') {
      const userName = suggestion.text.slice(1);
      const user = this.findUserByName(userName);
      if (user) {
        this.addUserToSelection(user);
      }
    }
    this.isDropdownVisible = false;
    this.searchService.addRecentSearch(suggestion.text);
    this.userSelected = true;
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
      this.selectedUsers.push(user);
    }
  }

  removeUserFromSelection(user: User) {
    this.selectedUsers = this.selectedUsers.filter((u) => u.id !== user.id);
    if (user.id!) {
      this.userSelected = false;
    }
  }

  submitSelectedUsers() {
    return this.selectedUsers.map((u) => u.id);
  }
}
