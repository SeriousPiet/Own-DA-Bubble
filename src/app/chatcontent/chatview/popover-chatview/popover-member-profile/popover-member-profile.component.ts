import { Component, inject, Input, OnChanges, OnInit, SimpleChanges, OnDestroy } from '@angular/core';
import { UsersService } from '../../../../utils/services/user.service';
import { AvatarDirective } from '../../../../utils/directives/avatar.directive';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../../../shared/models/user.class';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../../../utils/services/navigation.service';

@Component({
  selector: 'app-popover-member-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AvatarDirective],
  templateUrl: './popover-member-profile.component.html',
  styleUrl: './popover-member-profile.component.scss'
})
export class PopoverMemberProfileComponent implements OnInit, OnDestroy {

  private subscription!: Subscription
  userService = inject(UsersService);
  navigationService = inject(NavigationService);

  selectedUser!: User | undefined;

  constructor() {
  }


  public onlineStatus: string = 'offline';
  public onlineColor: string = '#92c83e';
  public offlineColor: string = '#686868';

  ngOnInit(): void {
    this.subscription = this.userService.selectedUserObject$.subscribe(user => {
      this.selectedUser = user;
    });
  }


  /**
   * Gets the message creator object for the currently selected user.
   * @returns The user object for the message creator, or `undefined` if no user is selected.
   */
  getMessageCreatorObject() {
    if (this.selectedUser) {
      return this.userService.getUserByID(this.selectedUser.id);
    }
    return
  }

  /**
   * Sets the current chat view object in the navigation service.
   * @param chat - The chat object to set in the navigation service.
   */
  setChat(chat: any) {
    this.navigationService.setChatViewObject(chat);
  }

  /**
   * Closes any open popovers in the application.
   */
  closePopovers(){
    document.getElementById('popover-member-profile')?.hidePopover();
    document.getElementById('channel-member-overview-popover')?.hidePopover();
  }

  /**
   * Unsubscribes from the `selectedUserObject$` subscription when the component is destroyed.
   */
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
