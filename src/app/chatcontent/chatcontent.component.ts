import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { WorkspacemenuComponent } from './workspacemenu/workspacemenu.component';
import { ChatviewComponent } from './chatview/chatview.component';
import { ThreadviewComponent } from './threadview/threadview.component';
import { WorkspacemenuComponent } from './workspacemenu/workspacemenu.component';

@Component({
  selector: 'app-chatcontent',
  standalone: true,
  imports: [
    HeaderComponent,
    WorkspacemenuComponent,
    ChatviewComponent,
    ThreadviewComponent,
    WorkspacemenuComponent,
  ],
  templateUrl: './chatcontent.component.html',
  styleUrl: './chatcontent.component.scss',
})
export class ChatcontentComponent {}
