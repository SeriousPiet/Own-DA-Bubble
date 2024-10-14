import { ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarDirective } from '../../utils/directives/avatar.directive';
import { NavigationService } from '../../utils/services/navigation.service';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { MessageComponent } from '../chatview/messages-list-view/message/message.component';
import { Message } from '../../shared/models/message.class';
import { UsersService } from '../../utils/services/user.service';
import { MessagesListViewComponent } from '../chatview/messages-list-view/messages-list-view.component';
import { MessageTextareaComponent } from '../message-textarea/message-textarea.component';
import { MessageDateComponent } from '../chatview/messages-list-view/message-date/message-date.component';

@Component({
  selector: 'app-threadview',
  standalone: true,
  imports: [
    CommonModule,
    AvatarDirective,
    MessageComponent,
    MessageDateComponent,
    MessagesListViewComponent,
    MessageTextareaComponent,
  ],
  templateUrl: './threadview.component.html',
  styleUrl: './threadview.component.scss',
})
export class ThreadviewComponent {
  public navigationService = inject(NavigationService);

  constructor(private cdr: ChangeDetectorRef) {}

  /**
   * Returns the title of a Channel, Chat, or Message object.
   *
   * @param object - The Channel, Chat, or Message object to get the title for.
   * @returns The title of the object, or an empty string if the object is not a Channel.
   */
  getTitle(object: Channel | Chat | Message | undefined): string {
    if (object instanceof Channel) return object.name;
    return '';
  }
}
