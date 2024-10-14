import {
  Component,
  inject,
  AfterViewInit,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ChannelService } from '../../../utils/services/channel.service';
import { UsersService } from '../../../utils/services/user.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AvatarDirective } from '../../../utils/directives/avatar.directive';
import { SearchService } from '../../../utils/services/search.service';
import { SearchSuggestion } from '../../../utils/services/search.service';
import { GroupedSearchResults } from '../../../utils/services/search.service';
import { User } from '../../../shared/models/user.class';
import { CommonModule } from '@angular/common';
import { Observable, map, Subscription } from 'rxjs';
import {
  BreakpointObserver,
  Breakpoints,
  BreakpointState,
} from '@angular/cdk/layout';

@Component({
  selector: 'app-addchannel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AvatarDirective,
  ],
  templateUrl: './addchannel.component.html',
  styleUrl: './addchannel.component.scss',
})
export class AddchannelComponent implements AfterViewInit, OnInit, OnDestroy {
  userByIds: string[] = [];
  addChannelId: HTMLElement | null = null;
  toggleAddChannelPopover = true;
  isUserSearchSelected = true;
  isAnyOptionSelected = false;
  userAmount: number = 0;
  searchQuery: string = '';
  suggestions$!: Observable<{ text: string; type: string }[]>;
  isDropdownVisible = false;
  selectedUsers: User[] = [];
  isFullscreen = false;
  private breakpointSubscription: Subscription = new Subscription();
  public channelservice = inject(ChannelService);
  public userservice = inject(UsersService);
  public name: string = '';
  public description: string = '';
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
    private breakpointObserver: BreakpointObserver,
    private searchService: SearchService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.breakpointSubscription = this.breakpointObserver
      .observe([Breakpoints.Small, Breakpoints.XSmall])
      .subscribe((result) => {
        this.isFullscreen = result.matches;
      });
  }

  ngOnDestroy(): void {
    this.breakpointSubscription.unsubscribe();
  }

  addOptionSelected(isUserSearchSelected: boolean) {
    this.isUserSearchSelected = isUserSearchSelected;
    this.isAnyOptionSelected = true;
  }

  onSearchInput() {
    this.searchService.updateSearchQuery(this.searchQuery);
    const currentUserID = this.userservice.currentUserID;
    this.suggestions$ = this.searchService.getSearchSuggestions().pipe(
      map((groupedResults: GroupedSearchResults) => {
        return groupedResults.users
          .filter((suggestion) =>
            suggestion.text
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase())
          )
          .filter(
            (suggestion) =>
              this.getUserFromSuggestion(suggestion)?.id !== currentUserID
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
      this.selectedUsers.push(user);
    }
  }

  removeUserFromSelection(user: User) {
    this.selectedUsers = this.selectedUsers.filter((u) => u.id !== user.id);
    if (user.id!) {
      this.userAmount--;
    }
  }

  submitSelectedUsers() {
    return this.selectedUsers.map((u) => u.id);
  }

  ngAfterViewInit() {
    this.addChannelId = document.getElementById('addChannelId');
    this.closeOnClick();
  }

  closeOnClick() {
    document
      .getElementById('addChannelId')
      ?.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target === this.addChannelId) {
          this.addChannelId?.hidePopover();
        }
      });
  }

  toggleAddChannel() {
    if (!this.toggleAddChannelPopover) {
      this.addChannelId?.hidePopover();
    }
    this.toggleAddChannelPopover = !this.toggleAddChannelPopover;
  }

  resetAddChannel() {
    this.name = '';
    this.description = '';
    this.isUserSearchSelected = false;
  }

  addNewChannel() {
    const currentUserID = this.userservice.currentUserID;
    if (this.isUserSearchSelected) {
      this.userByIds = this.submitSelectedUsers();
    } else {
      this.userByIds = this.userservice
        .getAllUserIDs()
        .filter((id) => id !== currentUserID);
    }
    this.userByIds.push(this.userservice.currentUserID);
    this.channelservice.addNewChannelToFirestore(
      this.name,
      this.description,
      this.userByIds
    );
  }
}
