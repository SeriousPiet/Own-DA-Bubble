import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../../utils/services/user.service';
import { ChannelService } from '../../../utils/services/channel.service';

@Component({
  selector: 'app-addchannel',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './addchannel.component.html',
  styleUrl: './addchannel.component.scss',
})
export class AddchannelComponent {
  addChannelId: HTMLElement | null = null;

  toggleAddChannelPopover = true;
  isUserSearchSelected = false;
  public channelservice = inject(ChannelService);
  public userservice = inject(UsersService);
  public name: string = '';
  public description: string = '';

  toggleAddChannel() {
    this.addChannelId = document.getElementById('addChannelId');
    if (!this.toggleAddChannelPopover) {
      this.isUserSearchSelected = false;
      this.addNewChannel();
      this.addChannelId?.hidePopover();
      this.resetAddChannel();
    }
    this.toggleAddChannelPopover = !this.toggleAddChannelPopover;
  }

  resetAddChannel() {
    this.name = '';
    this.description = '';
  }

  addNewChannel() {
    if (this.name !== '') {
      this.channelservice.addNewChannelToFirestore(
        this.name,
        this.description,
        this.userservice.getAllUserIDs()
      );
    }
  }
}
