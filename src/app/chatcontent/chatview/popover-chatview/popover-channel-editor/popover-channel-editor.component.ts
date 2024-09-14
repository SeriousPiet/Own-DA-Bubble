import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Channel } from '../../../../shared/models/channel.class';
import { Chat } from '../../../../shared/models/chat.class';
import { NavigationService } from '../../../../utils/services/navigation.service';
import { UsersService } from '../../../../utils/services/user.service';
import { ChannelService } from '../../../../utils/services/channel.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-popover-channel-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './popover-channel-editor.component.html',
  styleUrl: './popover-channel-editor.component.scss'
})
export class PopoverChannelEditorComponent implements OnChanges {

  navigationService = inject(NavigationService);
  userService = inject(UsersService);
  channelService = inject(ChannelService);

  @Input() currentChannel: any;
  @Output() updatedChannel = new EventEmitter<Channel>();

  channelNameEditor = false;
  channelDescriptionEditor = false;

  updateChannelData: { name?: string, description?: string, memberIDs?: string[] } = {};

  selfInMemberList: string = '';


  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentChannel']) {
      this.currentChannel = changes['currentChannel'].currentValue;
      this.updateChannelData.name = this.currentChannel.name;
      this.updateChannelData.description = this.currentChannel.description;
      this.updateChannelData.memberIDs = this.currentChannel.memberIDs;
      this.selfInMemberList = this.currentChannel.memberIDs.find((memberID: string) => memberID === this.userService.currentUserID);
    }
  }

  constructor() { }


  getTitle(object: Channel | Chat): string {
    if (object instanceof Channel) return object.name;
    // if (object instanceof Message) return 'Thread from ' + this.userservice.getUserByID(object.creatorID)?.name;
    // if (object instanceof Chat) return 'Chat with ' + this.getChatPartner(object);
    return '';
  }

  getDescription(object: Channel | Chat): string {
    if (object instanceof Channel) return object.description;
    // if (object instanceof Message) return 'Thread from ' + this.userservice.getUserByID(object.creatorID)?.name;
    // if (object instanceof Chat) return 'Chat with ' + this.getChatPartner(object);
    return '';
  }


  getChannelCreator(object: Channel | Chat) {
    if (object instanceof Channel) return this.userService.getUserByID(object.creatorID)?.name
    return '';
  }

  closeChannelInfoPopover() {
    this.channelNameEditor = false;
    this.channelDescriptionEditor = false;
  }

  showChannelNameEditor() {
    this.channelNameEditor = true;
  }

  showChannelDescriptionEditor() {
    this.channelDescriptionEditor = true;
  }

  saveEditedChannel() {
    this.channelNameEditor = false;
    this.channelDescriptionEditor = false;
    if (this.navigationService.chatViewObject instanceof Channel) {
      this.channelService.updateChannelOnFirestore(this.navigationService.chatViewObject, this.updateChannelData);
    }
  }

  isChannelCreator() {
    return this.currentChannel.creatorID === this.userService.currentUserID;
  }

  showNoRightToEditInfo() {
    if (!this.isChannelCreator()) {
      return 'Du hast kein Recht diesen Kanal zu bearbeiten.'
    }
    return ''
  }

  isChannelMember() {
    return this.selfInMemberList === this.userService.currentUserID
  }


  leaveChannel() {
    let selfInMemberListIndex = this.currentChannel.memberIDs.indexOf(this.selfInMemberList);
    if (this.isChannelMember()) {
      this.currentChannel.memberIDs.splice(selfInMemberListIndex, 1);
      this.updateChannelData.memberIDs = this.currentChannel.memberIDs;
      this.channelService.updateChannelOnFirestore(this.currentChannel, this.updateChannelData);
      this.updatedChannel.emit(this.currentChannel);
    }
  }

}



