import { Component, inject, Input } from '@angular/core';
import { Channel } from '../../../../shared/models/channel.class';
import { Chat } from '../../../../shared/models/chat.class';
import { NavigationService } from '../../../../utils/services/navigation.service';
import { UsersService } from '../../../../utils/services/user.service';

@Component({
  selector: 'app-popover-channel-editor',
  standalone: true,
  imports: [],
  templateUrl: './popover-channel-editor.component.html',
  styleUrl: './popover-channel-editor.component.scss'
})
export class PopoverChannelEditorComponent {

  navigationService = inject(NavigationService);
  userService = inject(UsersService);

  


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


getChannelCreator(object: Channel | Chat){
  if (object instanceof Channel) return   this.userService.getUserByID(object.creatorID)?.name
  return '';
}






}



