import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Channel } from '../../../../shared/models/channel.class';
import { Chat } from '../../../../shared/models/chat.class';
import { UsersService } from '../../../../utils/services/user.service';
import { AvatarDirective } from '../../../../utils/directives/avatar.directive';
import { CommonModule } from '@angular/common';
import { Message } from '../../../../shared/models/message.class';
import { NavigationService } from '../../../../utils/services/navigation.service';

@Component({
  selector: 'app-popover-channel-member-overview',
  standalone: true,
  imports: [AvatarDirective, CommonModule],
  templateUrl: './popover-channel-member-overview.component.html',
  styleUrl: './popover-channel-member-overview.component.scss'
})
export class PopoverChannelMemberOverviewComponent implements OnChanges {

  userService = inject(UsersService);
  navigationService = inject(NavigationService);

  @Input() currentChannel!: Channel | Chat;
  @Input() isCurrentMember: boolean = false;

  @Input() memberList!: boolean;
  @Input() addMemberPopover!: boolean;

  @Output() memberListChange = new EventEmitter<boolean>();
  @Output() addMemberPopoverChange = new EventEmitter<boolean>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentChannel']) {
      this.currentChannel = changes['currentChannel'].currentValue;
      this.sortMembersArray();
    }
    if(changes['memberList']) {
      console.log(changes)
      this.memberList = changes['memberList'].currentValue;
      }
    if(changes['addMemberPopover']) {
      console.log(changes)
      this.addMemberPopover = changes['addMemberPopover'].currentValue;
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

  getTitle(object: Channel | Chat | Message | undefined): string {
    if (object instanceof Channel) return object.name;
    // if (object instanceof Message) return 'Thread from ' + this.userservice.getUserByID(object.creatorID)?.name;
    // if (object instanceof Chat) return 'Chat with ' + this.getChatPartner(object);
    return '';
  }


  openAddNewMemberPopover() {
    this.addMemberPopover = true;
    this.memberList = false;
    this.memberListChange.emit(this.memberList);
    this.addMemberPopoverChange.emit(this.addMemberPopover);
  }

  






}
