import { Component } from '@angular/core';
import { MessageComponent } from './message/message.component';
import { MessageDateComponent } from './message-date/message-date.component';

@Component({
  selector: 'app-chatview',
  standalone: true,
  imports: [MessageDateComponent, MessageComponent],
  templateUrl: './chatview.component.html',
  styleUrl: './chatview.component.scss'
})
export class ChatviewComponent {

}
