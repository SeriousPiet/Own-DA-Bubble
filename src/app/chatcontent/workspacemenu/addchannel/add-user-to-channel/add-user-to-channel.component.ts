import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-user-to-channel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-user-to-channel.component.html',
  styleUrl: './add-user-to-channel.component.scss',
})
export class AddUserToChannelComponent {
  isUserSearchSelected = false;

  addUserToChannel() {}
}
