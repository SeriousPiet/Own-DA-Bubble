import { Component } from '@angular/core';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { HeaderComponent } from './header/header.component';
import { WorkspacemenuComponent } from './workspacemenu/workspacemenu.component';
import { ChatviewComponent } from './chatview/chatview.component';
import { ThreadviewComponent } from './threadview/threadview.component';
import { AddchannelComponent } from './workspacemenu/addchannel/addchannel.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chatcontent',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    WorkspacemenuComponent,
    ChatviewComponent,
    ThreadviewComponent,
    WorkspacemenuComponent,
    AddchannelComponent,
  ],
  templateUrl: './chatcontent.component.html',
  styleUrl: './chatcontent.component.scss',
  animations: [
    trigger('slideInOut', [
      state(
        'visible',
        style({
          // fixed value is gonna be replaced by the a dynamically set value due to screenwidth / responsive breakpoint
          width: '20rem',
          opacity: 1,
        })
      ),
      state(
        'hidden',
        style({
          width: '0',
          opacity: 0,
        })
      ),
      transition('visible <=> hidden', [animate('0.125s ease-out')]),
    ]),
  ],
})
export class ChatcontentComponent {
  isWorkspaceMenuVisible = true;

  toggleWorkspaceMenu() {
    this.isWorkspaceMenuVisible = !this.isWorkspaceMenuVisible;
  }
}
