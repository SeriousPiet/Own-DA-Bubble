import { Component, inject } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { NavigationService } from '../utils/services/navigation.service';

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
  ],
  templateUrl: './chatcontent.component.html',
  styleUrls: ['./chatcontent.component.scss'], // Korrektur: styleUrls statt styleUrl
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
  isThreadViewVisible = true;

  navigationService = inject(NavigationService);

  toggleWorkspaceMenu() {
    this.isWorkspaceMenuVisible = !this.isWorkspaceMenuVisible;
    const chatContent = document.querySelector('.chatcontent') as HTMLElement;
    const workspaceMenu = document.querySelector(
      '.workspace-menu'
    ) as HTMLElement;

    if (this.isWorkspaceMenuVisible) {
      chatContent.classList.remove('menu-hidden');
      workspaceMenu.style.display = 'block';
      workspaceMenu.classList.remove('hidden');
      workspaceMenu.classList.add('visible');
    } else {
      chatContent.classList.add('menu-hidden');
      workspaceMenu.classList.remove('visible');
      workspaceMenu.classList.add('hidden');
      setTimeout(() => {
        workspaceMenu.style.display = 'none';
      }, 125);
    }
  }

  toggleThreadView() {
    this.isThreadViewVisible = !this.isThreadViewVisible;
    const chatContent = document.querySelector('.chatcontent') as HTMLElement;
    const threadview = document.querySelector('.threadview') as HTMLElement;

    if (this.isThreadViewVisible) {
      chatContent.classList.remove('thread-hidden');
      threadview.style.display = 'block';
      threadview.classList.remove('hidden');
      threadview.classList.add('visible');
    } else {
      chatContent.classList.add('thread-hidden');
      threadview.classList.remove('visible');
      threadview.classList.add('hidden');
      setTimeout(() => {
        threadview.style.display = 'none';
      }, 125);
    }
  }
}
