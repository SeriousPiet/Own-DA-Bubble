import { ChangeDetectorRef, Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Channel } from '../../../../shared/models/channel.class';
import { Chat } from '../../../../shared/models/chat.class';
import { UsersService } from '../../../../utils/services/user.service';
import { AvatarDirective } from '../../../../utils/directives/avatar.directive';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-popover-channel-member-overview',
  standalone: true,
  imports: [AvatarDirective, CommonModule],
  templateUrl: './popover-channel-member-overview.component.html',
  styleUrl: './popover-channel-member-overview.component.scss'
})
export class PopoverChannelMemberOverviewComponent implements OnChanges {

  userService = inject(UsersService);

  @Input() currentChannel!: Channel | Chat;
  @Input() isCurrentMember: boolean = false;

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

  returnPopoverTarget(messageCreator: string) {
    if (messageCreator === this.userService.currentUser?.id) {
      return 'profile-popover'
    } else {
      return 'popover-member-profile'
    }
  }

  setSelectedUserObject(messageCreatorID:string) {
    console.log(messageCreatorID)
    this.userService.updateSelectedUser(this.userService.getUserByID(messageCreatorID));
    // this.navigationService.comingFromOutside = true;
    // setTimeout(() => {
    //   this.navigationService.comingFromOutside = false;
    // }, 1000);
    // console.log(this.navigationService.comingFromOutside)
    console.log(this.userService.selectedUserObject$) 
  }









}
