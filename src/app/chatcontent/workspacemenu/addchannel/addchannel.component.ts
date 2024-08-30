import { Component, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../../utils/services/user.service';
import { ChannelService } from '../../../utils/services/channel.service';
import { AddChannelSearchbarComponent } from './add-channel-searchbar/add-channel-searchbar.component';

@Component({
  selector: 'app-addchannel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AddChannelSearchbarComponent,
  ],
  templateUrl: './addchannel.component.html',
  styleUrl: './addchannel.component.scss',
})
export class AddchannelComponent implements AfterViewInit {
  addChannelId: HTMLElement | null = null;
  toggleAddChannelPopover = true;
  isUserSearchSelected = false;
  public channelservice = inject(ChannelService);
  public userservice = inject(UsersService);
  public name: string = '';
  public description: string = '';

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
          this.resetAddChannel();
          this.addChannelId?.hidePopover();
          if (!this.toggleAddChannelPopover) {
            this.toggleAddChannelPopover = !this.toggleAddChannelPopover;
          }
        }
      });
  }

  toggleAddChannel() {
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
