import { ChangeDetectorRef, Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
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
      this.sortMembersArray();
    }
  }

  constructor(private cdr: ChangeDetectorRef) { }


  getMemberName(memberID: string) {
    const member = this.userService.getUserByID(memberID);
    return member?.id === this.userService.currentUser?.id ? `${member?.name} (Du)` : member?.name;
  }

  sortMembersArray() {
    if (this.currentChannel instanceof Channel && this.currentUserIsChannelMember()) {
      let currentUserIndex = this.currentChannel.memberIDs.indexOf(this.userService.currentUser!.id);
      this.currentChannel.memberIDs.splice(currentUserIndex, 1);
      this.currentChannel.memberIDs.unshift(this.userService.currentUser!.id);
    }
  }


  currentUserIsChannelMember() {
    return this.currentChannel instanceof Channel && this.currentChannel.memberIDs.includes(this.userService.currentUser!.id);
  }









}
