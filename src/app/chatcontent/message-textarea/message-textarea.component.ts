import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MessageService } from '../../utils/services/message.service';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';

@Component({
  selector: 'app-message-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-textarea.component.html',
  styleUrl: './message-textarea.component.scss'
})
export class MessageTextareaComponent {

  isHovered = false;
  isActive = false;

  message = ''

  public messageService = inject(MessageService);


  @Input() newMessageinChannel!: Channel | Chat;

  // addNewMessage(newMessagePath:string, message:string){
  //   if (message) this.messageService.addNewMessageToPath(newMessagePath, message );
  //   this.message = '';
  // }

  addNewMessage(newMessagePath:Channel | Chat, message:string){
    if(newMessagePath instanceof Channel){
      if (message) this.messageService.addNewMessageToChannel(newMessagePath, message );
      this.message = '';
    }
  
  }
}
