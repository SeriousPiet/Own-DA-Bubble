import { Component } from '@angular/core';
import { WorkspacemenuComponent } from './workspacemenu/workspacemenu.component';
import { ChatviewComponent } from './chatview/chatview.component';

@Component({
  selector: 'app-chatcontent',
  standalone: true,
  imports: [WorkspacemenuComponent, ChatviewComponent],
  templateUrl: './chatcontent.component.html',
  styleUrl: './chatcontent.component.scss',
})
export class ChatcontentComponent {}
