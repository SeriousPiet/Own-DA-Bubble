import { AddChannelSearchbarComponent } from './add-channel-searchbar/add-channel-searchbar.component';
import { Component, inject, AfterViewInit, ViewChild } from '@angular/core';
import { ChannelService } from '../../../utils/services/channel.service';
import { UsersService } from '../../../utils/services/user.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  userByIds: string[] = [];
  addChannelId: HTMLElement | null = null;
  toggleAddChannelPopover = true;
  isUserSearchSelected = false;
  public channelservice = inject(ChannelService);
  public userservice = inject(UsersService);
  public name: string = '';
  public description: string = '';

  @ViewChild(AddChannelSearchbarComponent)
  addChannelSearchbar!: AddChannelSearchbarComponent;

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
            this.isUserSearchSelected = false;
          }
        }
      });
  }

  toggleAddChannel() {
    if (!this.toggleAddChannelPopover) {
      this.addNewChannel();
      this.isUserSearchSelected = false;
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
    if (this.isUserSearchSelected) {
      this.userByIds = this.addChannelSearchbar.submitSelectedUsers();
    } else {
      this.userByIds = this.userservice.getAllUserIDs();
    }
    if (this.name !== '') {
      this.channelservice.addNewChannelToFirestore(
        this.name,
        this.description,
        this.userByIds
      );
    }
  }
}
