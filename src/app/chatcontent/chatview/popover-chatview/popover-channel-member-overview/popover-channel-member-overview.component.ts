import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Channel } from '../../../../shared/models/channel.class';
import { Chat } from '../../../../shared/models/chat.class';
import { UsersService } from '../../../../utils/services/user.service';
import { AvatarDirective } from '../../../../utils/directives/avatar.directive';

@Component({
  selector: 'app-popover-channel-member-overview',
  standalone: true,
  imports: [AvatarDirective],
  templateUrl: './popover-channel-member-overview.component.html',
  styleUrl: './popover-channel-member-overview.component.scss'
})
export class PopoverChannelMemberOverviewComponent implements OnChanges {

  userService = inject(UsersService);

  @Input() currentChannel!: Channel | Chat;



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentChannel']) {
      this.currentChannel = changes['currentChannel'].currentValue;
    }
  }


  getMemberName(memberID: string) {
    const member = this.userService.getUserByID(memberID);
    console.log(this.userService.currentUser?.id)
    return member?.id === this.userService.currentUser?.id ? `${member?.name} (Du)` : member?.name;
  }

  // getUserByID(id: string): User | undefined { return this.users.find((user) => user.id === id); }








}
