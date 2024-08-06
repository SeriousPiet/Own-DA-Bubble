import { Component } from '@angular/core';
import { MessageComponent } from './message/message.component';
import { MessageDateComponent } from './message-date/message-date.component';
import { MessageTextareaComponent } from '../message-textarea/message-textarea.component';

@Component({
  selector: 'app-chatview',
  standalone: true,
  imports: [MessageDateComponent, MessageComponent, MessageTextareaComponent],
  templateUrl: './chatview.component.html',
  styleUrl: './chatview.component.scss'
})
export class ChatviewComponent {

}
