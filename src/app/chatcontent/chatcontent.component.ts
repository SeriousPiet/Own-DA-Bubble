import { Component } from '@angular/core';
import { WorkspacemenuComponent } from './workspacemenu/workspacemenu.component';

@Component({
  selector: 'app-chatcontent',
  standalone: true,
  imports: [WorkspacemenuComponent],
  templateUrl: './chatcontent.component.html',
  styleUrl: './chatcontent.component.scss',
})
export class ChatcontentComponent {}
