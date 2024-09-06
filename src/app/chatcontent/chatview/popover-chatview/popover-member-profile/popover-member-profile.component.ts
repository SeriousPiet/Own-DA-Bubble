import { Component, inject, Input, OnChanges, OnInit, SimpleChanges, OnDestroy } from '@angular/core';
import { UsersService } from '../../../../utils/services/user.service';
import { AvatarDirective } from '../../../../utils/directives/avatar.directive';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../../../shared/models/user.class';
import { Subscription } from 'rxjs';

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

  selectedUser!: User | undefined;

  constructor() {
  }


  public onlineStatus: string = 'offline';
  public onlineColor: string = '#92c83e';
  public offlineColor: string = '#686868';

  ngOnInit(): void {
    this.subscription = this.userService.selectedUserObject$.subscribe(user => {
      this.selectedUser = user;
      console.log('Benutzer aktualisiert:', user);

    });
  }


  getMessageCreatorObject() {
    if (this.selectedUser) {
      return this.userService.getUserByID(this.selectedUser.id);
    }
    return
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }





}
