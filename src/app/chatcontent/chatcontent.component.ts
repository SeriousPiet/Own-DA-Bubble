import { Component } from '@angular/core';
import { ChatviewComponent } from './chatview/chatview.component';

@Component({
  selector: 'app-chatcontent',
  standalone: true,
  imports: [ChatviewComponent],
  templateUrl: './chatcontent.component.html',
  styleUrl: './chatcontent.component.scss'
})
export class ChatcontentComponent {

}
